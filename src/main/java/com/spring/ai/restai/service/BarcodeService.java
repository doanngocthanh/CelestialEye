package com.spring.ai.restai.service;

import com.google.zxing.*;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.spring.ai.plugins.YOLOv8Detector;
import com.spring.ai.restai.detector.GenericYOLODetector;
import com.spring.ai.restai.dto.DetailedBarcodeResult;
import com.spring.ai.restai.dto.DetailedBarcodeResult.BoundingBox;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.imgproc.Imgproc;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.opencv.core.Core;
import java.util.HashSet;
import java.util.Set;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferByte;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.*;


@Service
public class BarcodeService {
    private final YOLOv8Detector barcodeDetector;
    private static final float CONFIDENCE_THRESHOLD = 0.25f; // Lowered from 0.35f to detect more potential barcodes
    private static final float NMS_THRESHOLD = 0.6f; // Increased from 0.45f to keep more overlapping detections
    private static final int PADDING = 15; // Increased padding
    private static final float OVERLAP_RATIO = 0.2f; // 20% overlap between regions

    public BarcodeService() throws Exception {
        System.out.println("Initializing BarcodeService...");
        // Create detector using the 4-parameter constructor
        this.barcodeDetector = new GenericYOLODetector(
            "models/DetectBarCode_1750436985515.onnx", // Model path 
            640, 640, // Target dimensions
            CONFIDENCE_THRESHOLD // Confidence threshold
        );
        // Set NMS threshold separately
        this.barcodeDetector.setNmsThreshold(NMS_THRESHOLD);
        System.out.println("BarcodeService initialized with confidence threshold: " + CONFIDENCE_THRESHOLD +
                         ", NMS threshold: " + NMS_THRESHOLD);
    }

    static {
        try {
            // Disable warning messages from OpenCV
            System.setProperty("org.opencv.disableWarnings", "true");
            // Disable parallel backend warnings
            System.setProperty("org.opencv.disablePluginWarnings", "true");
            nu.pattern.OpenCV.loadLocally();
        } catch (Exception e) {
            System.err.println("Error loading OpenCV: " + e.getMessage());
        }
    }

    /**
     * Process document and detect barcodes from all pages
     */
    public List<DetailedBarcodeResult> processDocument(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename().toLowerCase();
        System.out.println("Processing document: " + fileName + ", size: " + file.getSize() + " bytes");

        List<DetailedBarcodeResult> results = new ArrayList<>();

        if (fileName.endsWith(".pdf")) {
            System.out.println("Processing as PDF document");
            results.addAll(processPdf(file));
        } else if (fileName.endsWith(".tiff") || fileName.endsWith(".tif")) {
            System.out.println("Processing as TIFF document");
            results.addAll(processTiff(file));
        } else {
            System.out.println("Processing as single image");
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(file.getBytes()));
            System.out.println("Image dimensions: " + image.getWidth() + "x" + image.getHeight());
            results.add(processPage(image, 1));
        }

        System.out.println("Document processing completed. Total results: " + results.size());
        return results;
    }

    /**
     * Process PDF document
     */
    private List<DetailedBarcodeResult> processPdf(MultipartFile file) throws IOException {
        List<DetailedBarcodeResult> results = new ArrayList<>();
        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(file.getBytes()))) {
            int totalPages = document.getNumberOfPages();
            System.out.println("PDF loaded successfully. Total pages: " + totalPages);

            PDFRenderer pdfRenderer = new PDFRenderer(document);
            for (int page = 0; page < totalPages; ++page) {
                System.out.println("Processing PDF page " + (page + 1) + "/" + totalPages);
                BufferedImage image = pdfRenderer.renderImageWithDPI(page, 300);
                System.out.println(
                        "Page " + (page + 1) + " rendered. Dimensions: " + image.getWidth() + "x" + image.getHeight());
                results.add(processPage(image, page + 1));
            }
        }
        return results;
    }

    /**
     * Process TIFF document
     */
    private List<DetailedBarcodeResult> processTiff(MultipartFile file) throws IOException {
        List<DetailedBarcodeResult> results = new ArrayList<>();

        // Use ImageIO to get image reader for TIFF format
        ImageIO.scanForPlugins();
        Iterator<ImageReader> readers = ImageIO.getImageReadersByFormatName("tiff");

        if (!readers.hasNext()) {
            throw new IOException("No TIFF image reader found");
        }

        ImageReader reader = readers.next();
        try {
            // Create input stream from file
            ImageInputStream iis = ImageIO.createImageInputStream(new ByteArrayInputStream(file.getBytes()));
            reader.setInput(iis, false);

            // Get number of pages/images in TIFF
            int numPages = reader.getNumImages(true);
            System.out.println("Processing TIFF file with " + numPages + " pages");

            // Process each page
            for (int page = 0; page < numPages; page++) {
                System.out.println("Processing TIFF page " + (page + 1) + "/" + numPages);
                BufferedImage image = reader.read(page);
                System.out.println("Page " + (page + 1) + " dimensions: " + image.getWidth() + "x" + image.getHeight());
                results.add(processPage(image, page + 1));
            }

            iis.close();
        } finally {
            reader.dispose();
        }

        return results;
    }

    /**
     * Process a single page/image for barcode detection
     */
    private DetailedBarcodeResult processPage(BufferedImage image, int pageNumber) {
        System.out.println("Processing page " + pageNumber);
        System.out.println("Original image dimensions: " + image.getWidth() + "x" + image.getHeight());

        // Split image into regions
        List<ImageRegion> regions = splitImageIntoRegions(image);
        System.out.println("Image split into " + regions.size() + " regions");

        DetailedBarcodeResult result = new DetailedBarcodeResult();
        result.setPageNumber(pageNumber);

        // Keep track of detected barcodes to avoid duplicates
        Set<String> processedBarcodes = new HashSet<>();

        for (ImageRegion region : regions) {
            System.out.println("Processing region " + region.regionNumber);
            System.out.println("Region dimensions: " + region.width + "x" + region.height + " at position (" + region.x
                    + "," + region.y + ")");

            // Run YOLOv8 detection on each region
            YOLOv8Detector.Detection[] detections = barcodeDetector.detect(region.image);
            System.out.println("Found " + detections.length + " potential barcodes in region " + region.regionNumber);

            for (YOLOv8Detector.Detection detection : detections) {
                System.out.println("Processing detection with confidence: " + detection.confidence);
                System.out.println("Detection bbox: [" + detection.x1 + "," + detection.y1 + "," + detection.x2 + ", "
                        + detection.y2 + "]");

                if (detection.confidence >= CONFIDENCE_THRESHOLD) {
                    System.out.println("Detection passed confidence threshold");

                    // Crop and process detected barcode area
                    BufferedImage barcodeArea = cropDetectedRegion(region.image, detection);
                    System.out.println("Cropped barcode area: " + barcodeArea.getWidth() + "x" + barcodeArea.getHeight());

                    // Enhance barcode image
                    BufferedImage enhancedBarcode = enhanceBarcodeImage(barcodeArea);
                    System.out.println("Barcode image enhanced");

                    // Decode barcode using ZXing
                    Result decodedResult = decodeBarcode(enhancedBarcode);

                    if (decodedResult != null && !processedBarcodes.contains(decodedResult.getText())) {
                        System.out.println("Barcode decoded successfully: " + decodedResult.getText());
                        System.out.println("Barcode format: " + decodedResult.getBarcodeFormat());

                        result.setRegionNumber(region.regionNumber);

                        DetailedBarcodeResult.BarcodeInfo barcodeInfo = new DetailedBarcodeResult.BarcodeInfo();
                        barcodeInfo.setContent(decodedResult.getText());
                        barcodeInfo.setFormat(decodedResult.getBarcodeFormat().toString());
                        barcodeInfo.setConfidence(detection.confidence);

                        // Set original location (in full image coordinates)
                        DetailedBarcodeResult.BoundingBox originalLocation = new DetailedBarcodeResult.BoundingBox();
                        originalLocation.setX(region.x + detection.x1);
                        originalLocation.setY(region.y + detection.y1);
                        originalLocation.setWidth(detection.getWidth() * region.width);
                        originalLocation.setHeight(detection.getHeight() * region.height);
                        barcodeInfo.setOriginalLocation(originalLocation);
                        System.out.println(
                                "Original location: " + originalLocation.getX() + "," + originalLocation.getY() +
                                        " (" + originalLocation.getWidth() + "x" + originalLocation.getHeight() + ")");

                        // Set region location (relative to region)
                        DetailedBarcodeResult.BoundingBox regionLocation = new DetailedBarcodeResult.BoundingBox();
                        regionLocation.setX(detection.x1);
                        regionLocation.setY(detection.y1);
                        regionLocation.setWidth(detection.getWidth() * region.width);
                        regionLocation.setHeight(detection.getHeight() * region.height);
                        barcodeInfo.setRegionLocation(regionLocation);
                        System.out.println("Region location: " + regionLocation.getX() + "," + regionLocation.getY() +
                                " (" + regionLocation.getWidth() + "x" + regionLocation.getHeight() + ")");

                        result.addBarcode(barcodeInfo);
                        processedBarcodes.add(decodedResult.getText());
                    } else if (decodedResult != null) {
                        System.out.println("Duplicate barcode detected, skipping: " + decodedResult.getText());
                    } else {
                        System.out.println("Failed to decode barcode from detected region");
                    }
                } else {
                    System.out.println("Detection rejected due to low confidence: " + detection.confidence);
                }
            }
        }

        System.out.println("Page " + pageNumber + " processing completed");
        if (!result.getBarcodes().isEmpty()) {
            System.out.println("Found " + result.getBarcodes().size() + " unique barcodes on page " + pageNumber);
            for (DetailedBarcodeResult.BarcodeInfo barcode : result.getBarcodes()) {
                System.out.println(" - " + barcode.getContent() + " (" + barcode.getFormat() + ")");
            }
        } else {
            System.out.println("No valid barcodes found on page " + pageNumber);
        }

        return result;
    }

    /**
     * Split image into regions for separate processing
     * Now uses overlapping regions and multi-scale approach
     */
    private List<ImageRegion> splitImageIntoRegions(BufferedImage image) {
        List<ImageRegion> regions = new ArrayList<>();
        int width = image.getWidth();
        int height = image.getHeight();
        
        // Calculate base region sizes
        int baseRegionWidth = width / 2;
        int baseRegionHeight = height / 2;
        
        // Calculate overlap amounts
        int overlapX = (int)(baseRegionWidth * OVERLAP_RATIO);
        int overlapY = (int)(baseRegionHeight * OVERLAP_RATIO);
        
        // Add regular regions with overlap
        int regionNumber = 1;
        for (int y = 0; y < 2; y++) {
            for (int x = 0; x < 2; x++) {
                int startX = x * baseRegionWidth - (x > 0 ? overlapX : 0);
                int startY = y * baseRegionHeight - (y > 0 ? overlapY : 0);
                int regionWidth = baseRegionWidth + (x > 0 ? overlapX : 0) + (x < 1 ? overlapX : 0);
                int regionHeight = baseRegionHeight + (y > 0 ? overlapY : 0) + (y < 1 ? overlapY : 0);
                
                // Ensure we don't exceed image bounds
                startX = Math.max(0, startX);
                startY = Math.max(0, startY);
                regionWidth = Math.min(width - startX, regionWidth);
                regionHeight = Math.min(height - startY, regionHeight);
                
                BufferedImage regionImage = image.getSubimage(startX, startY, regionWidth, regionHeight);
                regions.add(new ImageRegion(regionImage, regionNumber++, startX, startY, regionWidth, regionHeight));
            }
        }
        
        // Add full image as an additional region
        regions.add(new ImageRegion(image, regionNumber++, 0, 0, width, height));
        
        // Add half-resolution version of full image for small barcodes
        BufferedImage halfRes = new BufferedImage(width/2, height/2, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = halfRes.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(image, 0, 0, width/2, height/2, null);
        g2d.dispose();
        regions.add(new ImageRegion(halfRes, regionNumber, 0, 0, width, height));
        
        return regions;
    }

    /**
     * Enhance barcode image using OpenCV preprocessing techniques
     */
    private BufferedImage enhanceBarcodeImage(BufferedImage image) {
        System.out.println("Enhancing barcode image: " + image.getWidth() + "x" + image.getHeight());

        // Convert to OpenCV Mat
        Mat source = bufferedImageToMat(image);
        Mat enhanced = new Mat();
        Mat temp = new Mat();

        try {
            // Convert to grayscale
            Imgproc.cvtColor(source, enhanced, Imgproc.COLOR_BGR2GRAY);
            Mat originalGray = enhanced.clone();

            List<BufferedImage> attempts = new ArrayList<>();

            // Attempt 1: Original grayscale
            attempts.add(matToBufferedImage(originalGray));

            // Attempt 2-4: Multiple Otsu thresholds
            double[] thresholdMultipliers = { 0.8, 1.0, 1.2 }; // Try different threshold levels
            for (double multiplier : thresholdMultipliers) {
                Mat adjusted = originalGray.clone();
                adjusted.convertTo(adjusted, -1, 1.0, multiplier * 10); // Điều chỉnh độ sáng
                Imgproc.threshold(adjusted, temp, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);
                attempts.add(matToBufferedImage(temp));
                adjusted.release();
            }

            // Attempt 5-7: Adaptive thresholding with different block sizes
            int[] blockSizes = { 11, 15, 21 };
            for (int blockSize : blockSizes) {
                Imgproc.adaptiveThreshold(originalGray, temp, 255,
                        Imgproc.ADAPTIVE_THRESH_GAUSSIAN_C,
                        Imgproc.THRESH_BINARY, blockSize, 2);
                attempts.add(matToBufferedImage(temp));
            }

            // Attempt 8: Sharpening + Otsu
            Mat kernel = new Mat(3, 3, CvType.CV_32F);
            float[] kernelData = new float[] {
                    -1, -1, -1,
                    -1, 9, -1,
                    -1, -1, -1
            };
            kernel.put(0, 0, kernelData);
            Imgproc.filter2D(originalGray, temp, -1, kernel);
            Imgproc.threshold(temp, temp, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);
            attempts.add(matToBufferedImage(temp));
            kernel.release();

            // Attempt 9: Contrast stretching + Otsu
            Mat stretched = new Mat();
            Core.normalize(originalGray, stretched, 0, 255, Core.NORM_MINMAX);
            Imgproc.threshold(stretched, temp, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);
            attempts.add(matToBufferedImage(temp));
            stretched.release();

            // Try decoding each attempt
            for (int i = 0; i < attempts.size(); i++) {
                BufferedImage attempt = attempts.get(i);
                Result result = attemptDecode(attempt);
                if (result != null) {
                    System.out.println("Successfully decoded barcode with attempt " + (i + 1));
                    return attempt;
                }
            }

            System.out.println("No successful decode, returning original grayscale");
            return attempts.get(0);

        } finally {
            // Release OpenCV resources
            source.release();
            enhanced.release();
            temp.release();
        }
    }

    private Result decodeBarcode(BufferedImage barcodeImage) {
        try {
            // Try multiple hints
            Map<DecodeHintType, Object> hints = new EnumMap<>(DecodeHintType.class);

            // Try to decode in both directions
            hints.put(DecodeHintType.TRY_HARDER, Boolean.TRUE);
            hints.put(DecodeHintType.PURE_BARCODE, Boolean.TRUE);

            // Allow various barcode formats
            Vector<BarcodeFormat> formats = new Vector<>();
            formats.add(BarcodeFormat.CODE_128);
            formats.add(BarcodeFormat.CODE_39);
            formats.add(BarcodeFormat.EAN_13);
            formats.add(BarcodeFormat.EAN_8);
            formats.add(BarcodeFormat.UPC_A);
            formats.add(BarcodeFormat.UPC_E);
            formats.add(BarcodeFormat.ITF);
            formats.add(BarcodeFormat.QR_CODE);
            hints.put(DecodeHintType.POSSIBLE_FORMATS, formats);

            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(
                    new BufferedImageLuminanceSource(barcodeImage)));

            MultiFormatReader reader = new MultiFormatReader();
            return reader.decode(bitmap, hints);
        } catch (ReaderException e) {
            return null;
        }
    }

    /**
     * Convert BufferedImage to OpenCV Mat
     */
    private Mat bufferedImageToMat(BufferedImage image) {
        // Convert image to TYPE_3BYTE_BGR if it's not already
        BufferedImage convertedImage = image;
        if (image.getType() != BufferedImage.TYPE_3BYTE_BGR) {
            convertedImage = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_3BYTE_BGR);
            Graphics2D g2d = convertedImage.createGraphics();
            g2d.drawImage(image, 0, 0, null);
            g2d.dispose();
        }

        byte[] pixels = ((DataBufferByte) convertedImage.getRaster().getDataBuffer()).getData();
        Mat mat = new Mat(convertedImage.getHeight(), convertedImage.getWidth(), CvType.CV_8UC3);
        mat.put(0, 0, pixels);
        System.out.println("Converting image to Mat: " + convertedImage.getWidth() + "x" +
                convertedImage.getHeight() + " type: " + convertedImage.getType() +
                " data length: " + pixels.length + " mat channels: " + mat.channels());
        return mat;
    }

    /**
     * Convert OpenCV Mat to BufferedImage
     */
    private BufferedImage matToBufferedImage(Mat mat) {
        // First ensure we're working with a single channel (grayscale) image
        Mat grayMat = new Mat();
        if (mat.channels() > 1) {
            Imgproc.cvtColor(mat, grayMat, Imgproc.COLOR_BGR2GRAY);
        } else {
            mat.copyTo(grayMat);
        }

        byte[] pixels = new byte[(int) (grayMat.total())];
        grayMat.get(0, 0, pixels);

        BufferedImage image = new BufferedImage(grayMat.cols(), grayMat.rows(), BufferedImage.TYPE_BYTE_GRAY);
        byte[] imageData = ((DataBufferByte) image.getRaster().getDataBuffer()).getData();
        System.arraycopy(pixels, 0, imageData, 0, pixels.length);

        System.out.println("Converting Mat to image: " + grayMat.cols() + "x" +
                grayMat.rows() + " channels: " + grayMat.channels() +
                " data length: " + pixels.length);

        grayMat.release(); // Free OpenCV resources
        return image;
    }

    /**
     * Decode barcode using ZXing library
     */
    private Result attemptDecode(BufferedImage barcodeImage) {
        try {
            // Try multiple hints
            Map<DecodeHintType, Object> hints = new EnumMap<>(DecodeHintType.class);

            // Try to decode in both directions
            hints.put(DecodeHintType.TRY_HARDER, Boolean.TRUE);
            hints.put(DecodeHintType.PURE_BARCODE, Boolean.TRUE);

            // Allow various barcode formats
            Vector<BarcodeFormat> formats = new Vector<>();
            formats.add(BarcodeFormat.CODE_128);
            formats.add(BarcodeFormat.CODE_39);
            formats.add(BarcodeFormat.EAN_13);
            formats.add(BarcodeFormat.EAN_8);
            formats.add(BarcodeFormat.UPC_A);
            formats.add(BarcodeFormat.UPC_E);
            formats.add(BarcodeFormat.ITF);
            formats.add(BarcodeFormat.QR_CODE);
            hints.put(DecodeHintType.POSSIBLE_FORMATS, formats);

            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(
                    new BufferedImageLuminanceSource(barcodeImage)));

            MultiFormatReader reader = new MultiFormatReader();
            return reader.decode(bitmap, hints);
        } catch (ReaderException e) {
            return null;
        }
    }

    /**
     * Crop detected region from image
     */
    private BufferedImage cropDetectedRegion(BufferedImage image, YOLOv8Detector.Detection detection) {
        // Tính toán kích thước padding dựa trên kích thước barcode
        int width = (int) detection.getWidth();
        int height = (int) detection.getHeight();
        int dynamicPadding = Math.max(PADDING, Math.min(width, height) / 10); // Padding tỷ lệ với kích thước

        int x = (int) detection.x1;
        int y = (int) detection.y1;

        // Thêm padding
        x = Math.max(0, x - dynamicPadding);
        y = Math.max(0, y - dynamicPadding);
        width = Math.min(width + 2 * dynamicPadding, image.getWidth() - x);
        height = Math.min(height + 2 * dynamicPadding, image.getHeight() - y);

        // Đảm bảo tỷ lệ khung hình phù hợp cho barcode
        float aspectRatio = (float) width / height;
        if (aspectRatio < 2.0f) { // Barcode thường có tỷ lệ rộng/cao > 2
            int newWidth = (int) (height * 2.5f); // Mở rộng chiều rộng
            int widthPadding = (newWidth - width) / 2;
            x = Math.max(0, x - widthPadding);
            width = Math.min(newWidth, image.getWidth() - x);
        }

        return image.getSubimage(x, y, width, height);
    }

    /**
     * Inner class to represent an image region
     */
    private static class ImageRegion {
        final BufferedImage image;
        final int regionNumber;
        final int x;
        final int y;
        final int width;
        final int height;

        ImageRegion(BufferedImage image, int regionNumber, int x, int y, int width, int height) {
            this.image = image;
            this.regionNumber = regionNumber;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
    }
}

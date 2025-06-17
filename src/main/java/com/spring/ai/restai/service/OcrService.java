package com.spring.ai.restai.service;

import com.spring.ai.restai.dto.OcrResult;
import com.spring.ai.restai.dto.OcrDetectionResponse;
import com.spring.ai.restai.dto.DetectionResult;
import com.spring.ai.restai.dto.CccdInfo;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PreDestroy;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * Service for OCR processing with detection
 */
@Service
public class OcrService {
      @Autowired
    private DetectionService detectionService;
    
    // Tạm thời comment out để test trước
    // @Autowired
    // private QrCodeService qrCodeService;
    
    private final Tesseract tesseract;
    private final ExecutorService executorService;
    
    // Store configuration for reuse
    private String configuredDatapath;
    private String configuredLanguage;
    
    // Thread-local Tesseract instances for parallel processing
    private final ThreadLocal<Tesseract> threadLocalTesseract = ThreadLocal.withInitial(() -> {
        Tesseract instance = new Tesseract();
        configureTesseractInstance(instance);
        return instance;
    });
    
    public OcrService() {
        this.tesseract = new Tesseract();
        this.executorService = Executors.newFixedThreadPool(4); // Allow parallel OCR processing
        configureTesseract();
    }/**
     * Configure Tesseract for Vietnamese OCR with optimized settings
     */
    private void configureTesseract() {
        try {
            // First try to detect Tesseract installation and set data path
            String[] possibleDataPaths = {
                System.getenv("TESSDATA_PREFIX"),
                "C:/Program Files/Tesseract-OCR/tessdata",
                "C:/Program Files (x86)/Tesseract-OCR/tessdata",
                "/usr/share/tesseract-ocr/4.00/tessdata",
                "/usr/share/tesseract-ocr/tessdata",
                "/opt/homebrew/share/tessdata",
                "./tessdata"
            };
              boolean dataPathSet = false;
            for (String path : possibleDataPaths) {
                if (path != null && java.nio.file.Files.exists(java.nio.file.Paths.get(path))) {
                    tesseract.setDatapath(path);
                    configuredDatapath = path; // Store for reuse
                    dataPathSet = true;
                    System.out.println("Tesseract data path set to: " + path);
                    break;
                }
            }
            
            if (!dataPathSet) {
                System.out.println("Warning: Could not find tessdata directory. Using system default.");
            }
              // Try Vietnamese + English first
            try {
                tesseract.setLanguage("vie+eng");
                configuredLanguage = "vie+eng"; // Store for reuse
                System.out.println("Tesseract configured for Vietnamese + English OCR");
            } catch (Exception e) {
                System.out.println("Vietnamese language not available, trying English only: " + e.getMessage());
                try {
                    tesseract.setLanguage("eng");
                    configuredLanguage = "eng"; // Store for reuse
                    System.out.println("Tesseract configured for English OCR only");
                } catch (Exception ex) {
                    System.err.println("Error configuring Tesseract language: " + ex.getMessage());
                    configuredLanguage = "eng"; // Default fallback
                    // Continue with default settings
                }
            }
            
            // PERFORMANCE OPTIMIZATIONS:
            
            // OCR Engine Mode: 1 = Neural networks LSTM engine (faster than default)
            tesseract.setOcrEngineMode(1);
            
            // Page Segmentation Mode: 8 = Single word (faster for cropped regions)
            // Alternative: 7 = Single text line
            tesseract.setPageSegMode(8);
            
            // Set variables for faster processing
            tesseract.setVariable("tessedit_char_whitelist", 
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
                "ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰự" +
                "ỲỳỴỵỶỷỸỹ /-:.,()");
            
            // Optimize for speed over accuracy
            tesseract.setVariable("tessedit_enable_doc_dict", "0");
            tesseract.setVariable("tessedit_enable_bigram_correction", "0");
            tesseract.setVariable("textord_really_old_xheight", "1");
            tesseract.setVariable("textord_min_linesize", "0.25");
            
            System.out.println("Tesseract optimization completed successfully");
            
        } catch (Exception e) {
            System.err.println("Warning: Could not configure Tesseract properly: " + e.getMessage());
            System.err.println("OCR may not work correctly. Please install Tesseract and Vietnamese language data.");
        }
    }
      /**
     * Perform OCR detection on uploaded image with optimizations
     */
    public OcrDetectionResponse performOcrDetection(MultipartFile file, String modelName) throws IOException {
        long startTime = System.currentTimeMillis();
        
        // Load image
        BufferedImage image = ImageIO.read(file.getInputStream());
        if (image == null) {
            throw new IOException("Could not read image file");
        }
        
        String imageInfo = image.getWidth() + "x" + image.getHeight();
        System.out.println("Processing OCR for image: " + imageInfo);
          // First, perform object detection
        DetectionResult detectionResult = detectionService.detect(modelName, file, null, null);
        System.out.println("Detection completed: " + detectionResult.getDetections().size() + " objects found");
        
        // Log all detections with their classes
        for (int i = 0; i < detectionResult.getDetections().size(); i++) {
            DetectionResult.DetectionItem detection = detectionResult.getDetections().get(i);
            System.out.println("Detection " + i + ": " + detection.getClassName() + 
                " (confidence: " + String.format("%.2f", detection.getConfidence()) + 
                ", bbox: " + String.format("%.0f,%.0f-%.0f,%.0f", 
                    detection.getX1(), detection.getY1(), detection.getX2(), detection.getY2()) + ")");
        }
        
        // Filter detections to only process text-containing regions
        List<DetectionResult.DetectionItem> textDetections = new ArrayList<>();
        for (DetectionResult.DetectionItem detection : detectionResult.getDetections()) {
            String className = detection.getClassName();
            // Skip QR codes and portraits - they don't need OCR
            if (!"qr_code".equals(className) && !"portrait".equals(className)) {
                textDetections.add(detection);
            }
        }
          System.out.println("Text detections to process: " + textDetections.size());
        
        // Use new logic to process and merge detections
        List<OcrResult> ocrResults = processAndMergeDetections(image, textDetections);        // Add non-text detections (qr_code, portrait) with special processing
        for (DetectionResult.DetectionItem detection : detectionResult.getDetections()) {
            String className = detection.getClassName();            if ("qr_code".equals(className)) {
                // Tạm thời disable QR code detection cho đến khi fix dependency
                String qrContent = "[QR Code detected - decoding disabled]";
                /*
                // Try to decode QR code content
                String qrContent = "";
                try {
                    List<com.spring.ai.restai.dto.QrCodeResult> qrResults = qrCodeService.detectQrCodesInRegion(
                        image, 
                        (int) detection.getX1(), 
                        (int) detection.getY1(),
                        (int) (detection.getX2() - detection.getX1()),
                        (int) (detection.getY2() - detection.getY1())
                    );
                    
                    if (!qrResults.isEmpty()) {
                        qrContent = qrResults.get(0).getContent();
                        System.out.println("QR Code decoded: \"" + qrContent + "\"");
                    } else {
                        System.out.println("QR Code detected but could not be decoded");
                    }
                } catch (Exception e) {
                    System.err.println("Error decoding QR code: " + e.getMessage());
                }
                */
                
                OcrResult result = new OcrResult(
                    qrContent, // QR code content or placeholder
                    detection.getConfidence(),
                    new OcrResult.BoundingBox(detection.getX1(), detection.getY1(), 
                                            detection.getX2(), detection.getY2()),
                    detection.getClassName(),
                    detection.getClassId()
                );
                ocrResults.add(result);
                
            } else if ("portrait".equals(className)) {
                OcrResult result = new OcrResult(
                    "", // No text for portrait images
                    detection.getConfidence(),
                    new OcrResult.BoundingBox(detection.getX1(), detection.getY1(), 
                                            detection.getX2(), detection.getY2()),
                    detection.getClassName(),
                    detection.getClassId()
                );
                ocrResults.add(result);
            }
        }
        
        System.out.println("Total OCR results: " + ocrResults.size());
        for (OcrResult result : ocrResults) {
            System.out.println("Result: " + result.getClassName() + " -> \"" + result.getText() + "\" (confidence: " + 
                String.format("%.2f", result.getConfidence()) + ")");
        }
          long processingTime = System.currentTimeMillis() - startTime;
        
        // Log final results summary        System.out.println("=== OCR Results Summary ===");
        System.out.println("Total results: " + ocrResults.size());
        for (OcrResult result : ocrResults) {
            System.out.println("Class: " + result.getClassName() + ", Text: \"" + result.getText() + 
                "\", Confidence: " + String.format("%.2f", result.getConfidence()));
        }
        System.out.println("=== End Summary ===");
        
        // Try to parse CCCD information from OCR results
        CccdInfo cccdInfo = parseCccdFromOcrResults(ocrResults);
        if (cccdInfo != null && cccdInfo.isValid()) {
            System.out.println("CCCD information parsed successfully from OCR results");
        }
        
        return new OcrDetectionResponse(
            modelName,
            ocrResults.size(),
            ocrResults,
            processingTime,
            imageInfo,
            cccdInfo
        );
    }
    
    /**
     * Crop image to the specified bounding box
     */
    private BufferedImage cropImage(BufferedImage originalImage, DetectionResult.DetectionItem detection) {
        int x = Math.max(0, (int) detection.getX1());
        int y = Math.max(0, (int) detection.getY1());
        int width = Math.min(originalImage.getWidth() - x, (int) (detection.getX2() - detection.getX1()));
        int height = Math.min(originalImage.getHeight() - y, (int) (detection.getY2() - detection.getY1()));
        
        // Ensure minimum dimensions
        width = Math.max(1, width);
        height = Math.max(1, height);
        
        return originalImage.getSubimage(x, y, width, height);
    }
      /**
     * Perform OCR on a buffered image using thread-local Tesseract instance
     */
    private String performOcr(BufferedImage image) throws TesseractException {
        try {
            // Use thread-local instance for better parallel performance
            Tesseract threadInstance = threadLocalTesseract.get();
            String result = threadInstance.doOCR(image);
            return result != null ? result : "";
        } catch (TesseractException e) {
            System.err.println("Tesseract OCR error: " + e.getMessage());
            throw e;
        }
    }
    
    /**
     * Preprocess image for better OCR performance and accuracy
     */
    private BufferedImage preprocessImageForOcr(BufferedImage originalImage) {
        try {
            int width = originalImage.getWidth();
            int height = originalImage.getHeight();
            
            // Scale up small images for better OCR (minimum 200px height)
            if (height < 200) {
                double scaleFactor = 200.0 / height;
                int newWidth = (int) (width * scaleFactor);
                int newHeight = 200;
                
                BufferedImage scaledImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
                Graphics2D g2d = scaledImage.createGraphics();
                g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2d.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
                g2d.dispose();
                
                originalImage = scaledImage;
                System.out.println("Scaled image from " + width + "x" + height + " to " + newWidth + "x" + newHeight);
            }
            
            // Convert to grayscale for better OCR performance
            BufferedImage grayImage = new BufferedImage(
                originalImage.getWidth(), 
                originalImage.getHeight(), 
                BufferedImage.TYPE_BYTE_GRAY
            );
            
            Graphics2D g2d = grayImage.createGraphics();
            g2d.drawImage(originalImage, 0, 0, null);
            g2d.dispose();
            
            // Enhance contrast (simple method)
            for (int y = 0; y < grayImage.getHeight(); y++) {
                for (int x = 0; x < grayImage.getWidth(); x++) {
                    int rgb = grayImage.getRGB(x, y);
                    int gray = (rgb >> 16) & 0xFF; // Get red component (same as green and blue in grayscale)
                    
                    // Simple contrast enhancement
                    gray = Math.min(255, Math.max(0, (int) ((gray - 128) * 1.2 + 128)));
                    
                    int newRgb = (gray << 16) | (gray << 8) | gray;
                    grayImage.setRGB(x, y, newRgb);
                }
            }
            
            return grayImage;
            
        } catch (Exception e) {
            System.err.println("Error preprocessing image: " + e.getMessage());
            return originalImage; // Return original if preprocessing fails
        }
    }    /**
     * Cleanup resources
     */
    @PreDestroy
    public void cleanup() {
        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdown();
            System.out.println("OCR ExecutorService shutdown");
        }
        
        // Clean up thread-local instances
        threadLocalTesseract.remove();
        System.out.println("OCR ThreadLocal instances cleaned up");
    }
      /**
     * Configure a specific Tesseract instance with optimized settings
     */
    private void configureTesseractInstance(Tesseract instance) {
        try {
            // Use stored configuration
            if (configuredDatapath != null) {
                instance.setDatapath(configuredDatapath);
            }
            
            if (configuredLanguage != null) {
                instance.setLanguage(configuredLanguage);
            }
            
            instance.setOcrEngineMode(1); // LSTM engine for speed
            instance.setPageSegMode(8); // Single word for cropped regions
            
            // Set optimization variables
            instance.setVariable("tessedit_char_whitelist", 
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
                "ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰự" +
                "ỲỳỴỵỶỷỸỹ /-:.,()");
            
            instance.setVariable("tessedit_enable_doc_dict", "0");
            instance.setVariable("tessedit_enable_bigram_correction", "0");
            instance.setVariable("textord_really_old_xheight", "1");
            instance.setVariable("textord_min_linesize", "0.25");
            
        } catch (Exception e) {
            System.err.println("Error configuring Tesseract instance: " + e.getMessage());
        }
    }
    
    /**
     * Group and merge detections for multi-line fields like place_of_residence and place_of_origin
     */
    private List<OcrResult> processAndMergeDetections(BufferedImage image, List<DetectionResult.DetectionItem> detections) {
        Map<String, List<DetectionResult.DetectionItem>> groupedDetections = new HashMap<>();
        
        // Group detections by className
        for (DetectionResult.DetectionItem detection : detections) {
            String className = detection.getClassName();
            groupedDetections.computeIfAbsent(className, k -> new ArrayList<>()).add(detection);
        }
        
        List<OcrResult> allResults = new ArrayList<>();
        
        for (Map.Entry<String, List<DetectionResult.DetectionItem>> entry : groupedDetections.entrySet()) {
            String className = entry.getKey();
            List<DetectionResult.DetectionItem> classDetections = entry.getValue();
            
            if ("place_of_residence".equals(className) || "place_of_origin".equals(className)) {
                // Special handling for multi-line fields
                OcrResult mergedResult = processMergedField(image, className, classDetections);
                if (mergedResult != null) {
                    allResults.add(mergedResult);
                }
            } else {
                // For other fields, take the best detection
                DetectionResult.DetectionItem bestDetection = classDetections.stream()
                    .max(Comparator.comparing(DetectionResult.DetectionItem::getConfidence))
                    .orElse(null);
                
                if (bestDetection != null) {
                    try {
                        BufferedImage croppedImage = cropImage(image, bestDetection);
                        BufferedImage processedImage = preprocessImageForOcr(croppedImage);
                        String extractedText = performOcr(processedImage);
                        
                        System.out.println("OCR for " + bestDetection.getClassName() + ": \"" + extractedText.trim() + "\"");
                          OcrResult result = new OcrResult(
                            extractedText.trim(),
                            bestDetection.getConfidence(),
                            new OcrResult.BoundingBox(bestDetection.getX1(), bestDetection.getY1(), 
                                                    bestDetection.getX2(), bestDetection.getY2()),
                            bestDetection.getClassName(),
                            bestDetection.getClassId()
                        );
                        allResults.add(result);
                        
                    } catch (Exception e) {
                        System.err.println("Error processing OCR for " + bestDetection.getClassName() + ": " + e.getMessage());
                          OcrResult errorResult = new OcrResult(
                            "[OCR Error]",
                            bestDetection.getConfidence(),
                            new OcrResult.BoundingBox(bestDetection.getX1(), bestDetection.getY1(), 
                                                    bestDetection.getX2(), bestDetection.getY2()),
                            bestDetection.getClassName(),
                            bestDetection.getClassId()
                        );
                        allResults.add(errorResult);
                    }
                }
            }
        }
        
        return allResults;
    }
    
    /**
     * Process and merge multi-line fields (place_of_residence, place_of_origin)
     */
    private OcrResult processMergedField(BufferedImage image, String className, List<DetectionResult.DetectionItem> detections) {
        System.out.println("Processing merged field: " + className + " with " + detections.size() + " detections");
        
        // Filter detections with good confidence (>= 0.5)
        List<DetectionResult.DetectionItem> goodDetections = detections.stream()
            .filter(d -> d.getConfidence() >= 0.5)
            .collect(Collectors.toList());
        
        if (goodDetections.isEmpty()) {
            System.out.println("No good detections found for " + className);
            return null;
        }
        
        // Sort by position: top to bottom, then left to right
        goodDetections.sort((d1, d2) -> {
            double y1 = d1.getY1();
            double y2 = d2.getY1();
            
            // If Y positions are close (within 20 pixels), sort by X
            if (Math.abs(y1 - y2) < 20) {
                return Double.compare(d1.getX1(), d2.getX1());
            }
            return Double.compare(y1, y2);
        });
        
        // Perform OCR on each detection and combine results
        List<String> textParts = new ArrayList<>();
        double totalConfidence = 0;
        double minX1 = Double.MAX_VALUE, minY1 = Double.MAX_VALUE;
        double maxX2 = Double.MIN_VALUE, maxY2 = Double.MIN_VALUE;
        
        for (DetectionResult.DetectionItem detection : goodDetections) {
            try {
                BufferedImage croppedImage = cropImage(image, detection);
                BufferedImage processedImage = preprocessImageForOcr(croppedImage);
                String extractedText = performOcr(processedImage).trim();
                
                if (!extractedText.isEmpty() && !"[OCR Error]".equals(extractedText)) {
                    textParts.add(extractedText);
                    totalConfidence += detection.getConfidence();
                    
                    // Update bounding box to encompass all detections
                    minX1 = Math.min(minX1, detection.getX1());
                    minY1 = Math.min(minY1, detection.getY1());
                    maxX2 = Math.max(maxX2, detection.getX2());
                    maxY2 = Math.max(maxY2, detection.getY2());
                    
                    System.out.println("OCR part for " + className + " (confidence: " + 
                        String.format("%.2f", detection.getConfidence()) + "): \"" + extractedText + "\"");
                }
            } catch (Exception e) {
                System.err.println("Error processing detection part for " + className + ": " + e.getMessage());
            }
        }
        
        if (textParts.isEmpty()) {
            System.out.println("No text extracted for " + className);
            return null;
        }
        
        // Combine text parts with appropriate separator
        String combinedText = String.join(" ", textParts);
        double averageConfidence = totalConfidence / goodDetections.size();
          System.out.println("Merged " + className + " (" + textParts.size() + " parts, avg confidence: " + 
            String.format("%.2f", averageConfidence) + "): \"" + combinedText + "\"");
          return new OcrResult(
            combinedText,
            (float) averageConfidence,
            new OcrResult.BoundingBox((float) minX1, (float) minY1, (float) maxX2, (float) maxY2),
            className,
            goodDetections.get(0).getClassId() // Use classId from first detection
        );
    }
    
    /**
     * Parse CCCD information from OCR results
     */
    private CccdInfo parseCccdFromOcrResults(List<OcrResult> ocrResults) {
        if (ocrResults == null || ocrResults.isEmpty()) {
            return null;
        }
        
        CccdInfo cccdInfo = new CccdInfo();
        boolean hasValidData = false;
        
        // Map OCR field names to CCCD fields
        Map<String, String> fieldMapping = new HashMap<>();
        fieldMapping.put("id_number", "id");
        fieldMapping.put("full_name", "name"); 
        fieldMapping.put("birth_date", "birth");
        fieldMapping.put("gender", "sex");
        fieldMapping.put("nationality", "nationality");
        fieldMapping.put("place_of_origin", "place_of_origin");
        fieldMapping.put("place_of_residence", "place_of_residence");
        fieldMapping.put("issue_date", "issue_date");
        fieldMapping.put("expiry_date", "expiry");
        
        // Extract information from OCR results
        for (OcrResult result : ocrResults) {
            String className = result.getClassName();
            String text = result.getText();
            
            if (text == null || text.trim().isEmpty()) {
                continue;
            }
            
            text = text.trim();
            
            // Map class names to CCCD fields
            switch (className) {
                case "id":
                    cccdInfo.setId(text);
                    hasValidData = true;
                    break;
                case "name":
                    cccdInfo.setName(text);
                    hasValidData = true;
                    break;
                case "birth":
                    cccdInfo.setBirth(text);
                    hasValidData = true;
                    break;
                case "sex":
                    cccdInfo.setSex(text);
                    hasValidData = true;
                    break;
                case "nationality":
                    cccdInfo.setNationality(text);
                    hasValidData = true;
                    break;
                case "place_of_origin":
                    cccdInfo.setPlace_of_origin(text);
                    hasValidData = true;
                    break;
                case "place_of_residence":
                    cccdInfo.setPlace_of_residence(text);
                    hasValidData = true;
                    break;                case "issue_date":
                    cccdInfo.setIssueDate(text);
                    hasValidData = true;
                    break;
                case "expiry":
                    cccdInfo.setExpiry(text);
                    hasValidData = true;
                    break;
                default:
                    // Try to infer from text content for generic classes
                    if (text.matches("\\d{12}")) {
                        // Looks like ID number
                        cccdInfo.setId(text);
                        hasValidData = true;
                    }
                    break;
            }
        }
        
        // Only return if we have at least some valid CCCD data
        if (!hasValidData) {
            return null;
        }
        
        System.out.println("Parsed CCCD from OCR: " + cccdInfo);
        return cccdInfo;
    }
}

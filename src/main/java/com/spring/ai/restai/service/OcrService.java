package com.spring.ai.restai.service;

import com.spring.ai.restai.dto.OcrResult;
import com.spring.ai.restai.dto.OcrDetectionResponse;
import com.spring.ai.restai.dto.DetectionResult;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for OCR processing with detection
 */
@Service
public class OcrService {
    
    @Autowired
    private DetectionService detectionService;
    
    private final Tesseract tesseract;
    
    public OcrService() {
        this.tesseract = new Tesseract();
        configureTesseract();
    }
      /**
     * Configure Tesseract for Vietnamese OCR
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
                System.out.println("Tesseract configured for Vietnamese + English OCR");
            } catch (Exception e) {
                System.out.println("Vietnamese language not available, trying English only: " + e.getMessage());
                try {
                    tesseract.setLanguage("eng");
                    System.out.println("Tesseract configured for English OCR only");
                } catch (Exception ex) {
                    System.err.println("Error configuring Tesseract language: " + ex.getMessage());
                    // Continue with default settings
                }
            }
            
            // OCR Engine Mode: 3 = Default, based on what is available
            tesseract.setOcrEngineMode(3);
            
            // Page Segmentation Mode: 6 = Uniform block of text
            tesseract.setPageSegMode(6);
            
            System.out.println("Tesseract configuration completed successfully");
            
        } catch (Exception e) {
            System.err.println("Warning: Could not configure Tesseract properly: " + e.getMessage());
            System.err.println("OCR may not work correctly. Please install Tesseract and Vietnamese language data.");
        }
    }
    
    /**
     * Perform OCR detection on uploaded image
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
        
        // Extract text from each detected region
        List<OcrResult> ocrResults = new ArrayList<>();
        
        for (DetectionResult.DetectionItem detection : detectionResult.getDetections()) {
            try {
                // Crop the detected region
                BufferedImage croppedImage = cropImage(image, detection);
                
                // Perform OCR on the cropped region
                String extractedText = performOcr(croppedImage);
                
                // Create OCR result
                OcrResult ocrResult = new OcrResult(
                    extractedText.trim(),
                    detection.getConfidence(),
                    new OcrResult.BoundingBox(detection.getX1(), detection.getY1(), 
                                            detection.getX2(), detection.getY2()),
                    detection.getClassName(),
                    detection.getClassId()
                );
                
                ocrResults.add(ocrResult);
                
                System.out.println("OCR for " + detection.getClassName() + ": \"" + extractedText.trim() + "\"");
                
            } catch (Exception e) {
                System.err.println("Error processing OCR for detection " + detection.getClassName() + ": " + e.getMessage());
                
                // Add empty result for failed OCR
                OcrResult errorResult = new OcrResult(
                    "[OCR Error]",
                    detection.getConfidence(),
                    new OcrResult.BoundingBox(detection.getX1(), detection.getY1(), 
                                            detection.getX2(), detection.getY2()),
                    detection.getClassName(),
                    detection.getClassId()
                );
                ocrResults.add(errorResult);
            }
        }
        
        long processingTime = System.currentTimeMillis() - startTime;
        
        return new OcrDetectionResponse(
            modelName,
            ocrResults.size(),
            ocrResults,
            processingTime,
            imageInfo
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
     * Perform OCR on a buffered image
     */
    private String performOcr(BufferedImage image) throws TesseractException {
        try {
            String result = tesseract.doOCR(image);
            return result != null ? result : "";
        } catch (TesseractException e) {
            System.err.println("Tesseract OCR error: " + e.getMessage());
            throw e;        }
    }
}

package com.spring.ai.restai.service;

import boofcv.abst.fiducial.QrCodeDetector;
import boofcv.alg.fiducial.qrcode.QrCode;
import boofcv.factory.fiducial.FactoryFiducial;
import boofcv.io.image.ConvertBufferedImage;
import boofcv.struct.image.GrayU8;
import com.spring.ai.restai.dto.QrCodeDetectionResponse;
import com.spring.ai.restai.dto.QrCodeResult;
import com.spring.ai.restai.dto.CccdInfo;
import georegression.struct.point.Point2D_F64;
import georegression.struct.shapes.Polygon2D_F64;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for QR Code detection using BoofCV
 */
@Service
public class QrCodeService {
    
    private final QrCodeDetector<GrayU8> detector;
      public QrCodeService() {
        try {
            // Initialize BoofCV QR Code detector
            this.detector = FactoryFiducial.qrcode(null, GrayU8.class);
            System.out.println("QrCodeService initialized successfully with BoofCV");
        } catch (Exception e) {
            System.err.println("Error initializing QrCodeService: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to initialize QR Code detector", e);
        }
    }
    
    /**
     * Detect QR codes in the uploaded image
     */
    public QrCodeDetectionResponse detectQrCodes(MultipartFile file) throws IOException {
        long startTime = System.currentTimeMillis();
        
        // Load image
        BufferedImage bufferedImage = ImageIO.read(file.getInputStream());
        if (bufferedImage == null) {
            throw new IOException("Could not read image file");
        }
        
        String imageInfo = bufferedImage.getWidth() + "x" + bufferedImage.getHeight();
        System.out.println("Processing QR Code detection for image: " + imageInfo);
        
        // Convert to BoofCV format
        GrayU8 grayImage = ConvertBufferedImage.convertFrom(bufferedImage, (GrayU8) null);
        
        // Process the image
        detector.process(grayImage);
        
        // Extract results
        List<QrCodeResult> qrCodeResults = new ArrayList<>();
        List<QrCode> detections = detector.getDetections();
        
        System.out.println("Found " + detections.size() + " QR codes");
          for (QrCode qr : detections) {
            try {
                // Get QR code content
                String content = qr.message;
                
                // Calculate bounding box from polygon
                Polygon2D_F64 polygon = qr.bounds;
                QrCodeResult.BoundingBox boundingBox = calculateBoundingBox(polygon);
                
                // BoofCV doesn't provide confidence, so we'll use 1.0 for successfully detected codes
                double confidence = 1.0;
                
                // Create basic result
                QrCodeResult result = new QrCodeResult(content, boundingBox, confidence);
                
                // Try to parse as CCCD information
                CccdInfo cccdInfo = parseCccdFromQrCode(content);
                if (cccdInfo != null && cccdInfo.isValid()) {
                    result.setType("CCCD");
                    result.setCccdInfo(cccdInfo);
                    System.out.println("CCCD information detected and parsed successfully");
                } else if (content.startsWith("http://") || content.startsWith("https://")) {
                    result.setType("URL");
                } else {
                    result.setType("TEXT");
                }
                
                qrCodeResults.add(result);
                
                System.out.println("QR Code detected: \"" + content + "\" at " + 
                    "[" + boundingBox.getX() + "," + boundingBox.getY() + "," + 
                    boundingBox.getWidth() + "," + boundingBox.getHeight() + "] - Type: " + result.getType());
                
            } catch (Exception e) {
                System.err.println("Error processing QR code: " + e.getMessage());
            }
        }
        
        long processingTime = System.currentTimeMillis() - startTime;
        
        return new QrCodeDetectionResponse(
            imageInfo,
            qrCodeResults.size(),
            qrCodeResults,
            processingTime
        );
    }
    
    /**
     * Calculate bounding box from polygon corners
     */
    private QrCodeResult.BoundingBox calculateBoundingBox(Polygon2D_F64 polygon) {
        double minX = Double.MAX_VALUE;
        double minY = Double.MAX_VALUE;
        double maxX = Double.MIN_VALUE;
        double maxY = Double.MIN_VALUE;
        
        // Find min/max coordinates from polygon vertices
        for (int i = 0; i < polygon.size(); i++) {
            Point2D_F64 point = polygon.get(i);
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }
        
        return new QrCodeResult.BoundingBox(
            minX,
            minY,
            maxX - minX,
            maxY - minY
        );
    }
    
    /**
     * Detect QR codes in a specific region of the image
     */
    public List<QrCodeResult> detectQrCodesInRegion(BufferedImage image, int x, int y, int width, int height) {
        try {
            // Crop the image to the specified region
            BufferedImage croppedImage = image.getSubimage(
                Math.max(0, x), 
                Math.max(0, y), 
                Math.min(width, image.getWidth() - x), 
                Math.min(height, image.getHeight() - y)
            );
            
            // Convert to BoofCV format
            GrayU8 grayImage = ConvertBufferedImage.convertFrom(croppedImage, (GrayU8) null);
            
            // Process the cropped image
            detector.process(grayImage);
            
            List<QrCodeResult> results = new ArrayList<>();
            List<QrCode> detections = detector.getDetections();
            
            for (QrCode qr : detections) {
                try {
                    String content = qr.message;
                    
                    // Adjust bounding box coordinates to original image coordinates
                    Polygon2D_F64 polygon = qr.bounds;
                    QrCodeResult.BoundingBox boundingBox = calculateBoundingBox(polygon);
                    
                    // Offset by crop position
                    boundingBox.setX(boundingBox.getX() + x);
                    boundingBox.setY(boundingBox.getY() + y);
                    
                    QrCodeResult result = new QrCodeResult(content, boundingBox, 1.0);
                    results.add(result);
                    
                } catch (Exception e) {
                    System.err.println("Error processing cropped QR code: " + e.getMessage());
                }
            }
            
            return results;
            
        } catch (Exception e) {
            System.err.println("Error detecting QR codes in region: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Parse CCCD information from QR code content
     * Format: id|oldId|name|birth|sex|place_of_residence|issueDate
     * Example: 049099007188|245349072|Đoàn Ngọc Thành|28011999|Nam|Thôn Quảng Bình, Nghĩa Thắng, Đắk R'Lấp, Đắk Nông|11032024
     */
    private CccdInfo parseCccdFromQrCode(String content) {
        try {
            if (content == null || content.trim().isEmpty()) {
                return null;
            }
            
            // Check if content contains pipe separators (typical CCCD QR format)
            if (!content.contains("|")) {
                return null;
            }
            
            String[] parts = content.split("\\|");
            if (parts.length < 6) {
                System.out.println("QR code does not contain enough fields for CCCD: " + parts.length + " fields found");
                return null;
            }
            
            // Parse fields according to CCCD QR code format
            String id = parts.length > 0 ? parts[0].trim() : "";
            String oldIdNumber = parts.length > 1 ? parts[1].trim() : "";
            String name = parts.length > 2 ? parts[2].trim() : "";
            String birth = parts.length > 3 ? formatDate(parts[3].trim()) : "";
            String sex = parts.length > 4 ? parts[4].trim() : "";
            String place_of_residence = parts.length > 5 ? parts[5].trim() : "";
            String issueDate = parts.length > 6 ? formatDate(parts[6].trim()) : "";
            
            // Default values for fields not in QR code
            String nationality = "Việt Nam"; // Default nationality
            String place_of_origin = ""; // Not available in QR code
            String expiry = ""; // Not available in QR code
            
            CccdInfo cccdInfo = new CccdInfo();
            cccdInfo.setId(id);
            cccdInfo.setOldIdNumber(oldIdNumber);
            cccdInfo.setName(name);
            cccdInfo.setBirth(birth);
            cccdInfo.setSex(sex);
            cccdInfo.setNationality(nationality);
            cccdInfo.setPlace_of_origin(place_of_origin);
            cccdInfo.setPlace_of_residence(place_of_residence);
            cccdInfo.setIssueDate(issueDate);
            cccdInfo.setExpiry(expiry);
            
            System.out.println("Parsed CCCD info: " + cccdInfo.toString());
            return cccdInfo;
            
        } catch (Exception e) {
            System.err.println("Error parsing CCCD from QR code: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Format date from DDMMYYYY to DD/MM/YYYY
     */
    private String formatDate(String dateStr) {
        if (dateStr == null || dateStr.length() != 8) {
            return dateStr;
        }
        
        try {
            String day = dateStr.substring(0, 2);
            String month = dateStr.substring(2, 4);
            String year = dateStr.substring(4, 8);
            return day + "/" + month + "/" + year;
        } catch (Exception e) {
            return dateStr; // Return original if formatting fails
        }
    }
}

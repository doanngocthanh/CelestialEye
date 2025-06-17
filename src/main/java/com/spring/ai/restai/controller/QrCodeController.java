package com.spring.ai.restai.controller;

import com.spring.ai.restai.dto.QrCodeDetectionResponse;
import com.spring.ai.restai.service.QrCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for QR Code detection endpoints
 */
@RestController
@RequestMapping("/api/qrcode")
@CrossOrigin(origins = "*")
public class QrCodeController {

    @Autowired
    private QrCodeService qrCodeService;

    /**
     * Detect QR codes in uploaded image
     */
    @PostMapping("/detect")
    public ResponseEntity<Map<String, Object>> detectQrCodes(@RequestParam("image") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate file
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("error", "No file uploaded");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if file is an image
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("error", "File must be an image");
                return ResponseEntity.badRequest().body(response);
            }
            
            System.out.println("Processing QR code detection for file: " + file.getOriginalFilename() + 
                             " (" + file.getSize() + " bytes)");
            
            // Perform QR code detection
            QrCodeDetectionResponse detectionResult = qrCodeService.detectQrCodes(file);
            
            response.put("success", true);
            response.put("data", detectionResult);
            
            System.out.println("QR code detection completed successfully. Found " + 
                             detectionResult.getTotalQrCodes() + " QR codes");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error during QR code detection: " + e.getMessage());
            e.printStackTrace();
            
            response.put("success", false);
            response.put("error", "QR code detection failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get QR code detection status/info
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            response.put("success", true);
            response.put("status", "QR Code detection service is running");
            response.put("library", "BoofCV");
            response.put("capabilities", new String[]{
                "QR Code detection",
                "Multi-QR support",
                "Bounding box coordinates",
                "Content extraction"
            });
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error checking status: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

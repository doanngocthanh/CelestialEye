package com.spring.ai.restai.controller;

import com.spring.ai.restai.dto.OcrDetectionResponse;
import com.spring.ai.restai.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for OCR operations
 */
@RestController
@RequestMapping("/api/ocr")
public class OcrController {

    @Autowired
    private OcrService ocrService;

    /**
     * Perform OCR detection - combines object detection with OCR
     */
    @PostMapping("/detect/{modelName}")
    public ResponseEntity<Map<String, Object>> performOcrDetection(
            @PathVariable String modelName,
            @RequestParam("image") MultipartFile imageFile) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Validate input
            if (imageFile.isEmpty()) {
                response.put("success", false);
                response.put("error", "No image file provided");
                return ResponseEntity.badRequest().body(response);
            }

            if (modelName == null || modelName.trim().isEmpty()) {
                response.put("success", false);
                response.put("error", "Model name is required");
                return ResponseEntity.badRequest().body(response);
            }

            // Perform OCR detection
            OcrDetectionResponse result = ocrService.performOcrDetection(imageFile, modelName);

            response.put("success", true);
            response.put("data", result);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);

        } catch (Exception e) {
            System.err.println("Error in OCR detection: " + e.getMessage());
            e.printStackTrace();

            response.put("success", false);
            response.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

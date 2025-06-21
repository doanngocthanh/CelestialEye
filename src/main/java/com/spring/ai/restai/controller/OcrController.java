package com.spring.ai.restai.controller;

import com.spring.ai.restai.dto.OcrDetectionResponse;
import com.spring.ai.restai.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
            }            // Perform OCR detection
            OcrDetectionResponse result = ocrService.performOcrDetection(imageFile, modelName);

            // Convert OcrResult to format expected by frontend
            List<Map<String, Object>> formattedResults = new ArrayList<>();
            if (result.getResults() != null) {
                for (var ocrResult : result.getResults()) {
                    Map<String, Object> formattedResult = new HashMap<>();
                    formattedResult.put("text", ocrResult.getText());
                    formattedResult.put("confidence", ocrResult.getConfidence());
                    formattedResult.put("className", ocrResult.getClassName());
                    formattedResult.put("classId", ocrResult.getClassId());
                    
                    // Format bounding box with all required fields
                    if (ocrResult.getBoundingBox() != null) {
                        var bbox = ocrResult.getBoundingBox();
                        Map<String, Object> boundingBox = new HashMap<>();
                        boundingBox.put("x1", bbox.getX1());
                        boundingBox.put("y1", bbox.getY1());
                        boundingBox.put("x2", bbox.getX2());
                        boundingBox.put("y2", bbox.getY2());
                        boundingBox.put("width", bbox.getWidth());
                        boundingBox.put("height", bbox.getHeight());
                        formattedResult.put("boundingBox", boundingBox);
                    }
                    
                    formattedResults.add(formattedResult);
                }
            }

            response.put("success", true);
            response.put("data", Map.of(
                    "modelName", result.getModelName(),
                    "totalDetections", result.getTotalDetections(),
                    "results", formattedResults,
                    "processingTimeMs", result.getProcessingTimeMs(),
                    "imageInfo", result.getImageInfo(),
                    "cccdInfo", result.getCccdInfo()
            ));
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
    }    /**
     * Simple OCR text extraction endpoint
     */    @PostMapping("/extract")
    public ResponseEntity<Map<String, Object>> extractText(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "modelId", required = false) String modelId) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "File is required"));
            }            // Use provided model ID or default model for simple extraction
            String modelToUse = (modelId != null && !modelId.trim().isEmpty()) ? modelId : "DetectCCCD";
            OcrDetectionResponse result = ocrService.performOcrDetection(file, modelToUse);

            // Extract text from all OCR results
            StringBuilder allText = new StringBuilder();
            if (result.getResults() != null) {
                for (var ocrResult : result.getResults()) {
                    if (ocrResult.getText() != null && !ocrResult.getText().trim().isEmpty()) {
                        allText.append(ocrResult.getText()).append(" ");
                    }
                }
            }            // Convert OcrResult to format expected by frontend
            List<Map<String, Object>> formattedResults = new ArrayList<>();
            if (result.getResults() != null) {
                for (var ocrResult : result.getResults()) {
                    Map<String, Object> formattedResult = new HashMap<>();
                    formattedResult.put("text", ocrResult.getText());
                    formattedResult.put("confidence", ocrResult.getConfidence());
                    formattedResult.put("className", ocrResult.getClassName());
                    formattedResult.put("classId", ocrResult.getClassId());
                    
                    // Format bounding box with all required fields
                    if (ocrResult.getBoundingBox() != null) {
                        var bbox = ocrResult.getBoundingBox();
                        Map<String, Object> boundingBox = new HashMap<>();
                        boundingBox.put("x1", bbox.getX1());
                        boundingBox.put("y1", bbox.getY1());
                        boundingBox.put("x2", bbox.getX2());
                        boundingBox.put("y2", bbox.getY2());
                        boundingBox.put("width", bbox.getWidth());
                        boundingBox.put("height", bbox.getHeight());
                        formattedResult.put("boundingBox", boundingBox);
                    }
                    
                    formattedResults.add(formattedResult);
                }
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "text", allText.toString().trim(),
                    "totalDetections", result.getTotalDetections(),
                    "results", formattedResults,
                    "processingTime", result.getProcessingTimeMs(),
                    "fileName", file.getOriginalFilename(),
                    "cccdInfo", result.getCccdInfo()
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "OCR processing failed: " + e.getMessage()
            ));
        }
    }
}

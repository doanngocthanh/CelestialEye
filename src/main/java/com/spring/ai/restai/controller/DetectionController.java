package com.spring.ai.restai.controller;

import com.spring.ai.restai.service.DetectionService;
import com.spring.ai.restai.dto.DetectionResult;
import com.spring.ai.restai.dto.ModelInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/detection")
@CrossOrigin(origins = "*")
public class DetectionController {

    @Autowired
    private DetectionService detectionService;    /**
     * Perform object detection
     */
    @PostMapping("/detect/{modelName}")
    public ResponseEntity<?> detect(
            @PathVariable String modelName,
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam(value = "classNames", required = false) String classNames,
            @RequestParam(value = "confThreshold", required = false) Float confThreshold) {
        
        try {
            if (imageFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Image file is required"));
            }
            
            // Validate image file type
            String contentType = imageFile.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Only image files are allowed"));
            }
            
            DetectionResult result = detectionService.detect(modelName, imageFile, classNames, confThreshold);
            
            // Wrap result with success flag
            return ResponseEntity.ok(Map.of(
                "success", true,
                "modelName", result.getModelName(),
                "imageName", result.getImageName(),
                "imageWidth", result.getImageWidth(),
                "imageHeight", result.getImageHeight(),
                "processingTime", result.getProcessingTime(),
                "detections", result.getDetections()
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Detection failed: " + e.getMessage()));
        }
    }    /**
     * Get available models for detection
     */
    @GetMapping("/models")
    public ResponseEntity<?> getAvailableModels() {
        try {
            List<ModelInfo> models = detectionService.getAvailableModels();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "models", models
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Clear detector cache for specific model
     */
    @DeleteMapping("/cache/{modelName}")
    public ResponseEntity<?> clearModelCache(@PathVariable String modelName) {
        try {
            detectionService.clearDetectorCache(modelName);
            return ResponseEntity.ok(Map.of("message", "Cache cleared for model: " + modelName));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Clear all detector cache
     */
    @DeleteMapping("/cache")
    public ResponseEntity<?> clearAllCache() {
        try {
            detectionService.clearAllDetectorCache();
            return ResponseEntity.ok(Map.of("message", "All detector cache cleared"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Detection Service",
            "availableModels", detectionService.getAvailableModels().size()
        ));
    }

    /**
     * Update class names for a specific model
     */
    @PostMapping("/models/{modelName}/class-names")
    public ResponseEntity<?> updateClassNames(
            @PathVariable String modelName,
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> classNamesList = (List<String>) request.get("classNames");
            
            if (classNamesList == null || classNamesList.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false, 
                    "message", "Class names list is required"
                ));
            }
            
            String classNamesStr = String.join(",", classNamesList);
            boolean updated = detectionService.updateModelClassNames(modelName, classNamesStr);
            
            if (updated) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Class names updated successfully",
                    "modelName", modelName,
                    "classNames", classNamesList
                ));
            } else {
                return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Model not found: " + modelName
                ));
            }
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to update class names: " + e.getMessage()
            ));
        }
    }
}

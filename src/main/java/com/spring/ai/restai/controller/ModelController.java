package com.spring.ai.restai.controller;

import com.spring.ai.restai.service.ModelService;
import com.spring.ai.restai.dto.ModelInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/models")
public class ModelController {

    @Autowired
    private ModelService modelService;    /**
     * Upload ONNX model
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadModel(
            @RequestParam("file") MultipartFile fileUpload,
            @RequestParam("name") String modelName,
            @RequestParam("type") String modelType,
            @RequestParam(value = "description", required = false) String description) {

        try {
            if (fileUpload.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "File is empty"));
            }

            if (!fileUpload.getOriginalFilename().endsWith(".onnx")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Only ONNX files are allowed"));
            }            ModelInfo modelInfo = modelService.uploadModel(fileUpload, modelName, modelType, description);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Model uploaded successfully",
                    "modelId", modelInfo.getId(),
                    "modelName", modelInfo.getName(),
                    "model", modelInfo));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * List all uploaded models
     */
    @GetMapping("/list")
    public ResponseEntity<?> listModels() {
        try {
            List<ModelInfo> models = modelService.listModels();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "models", models));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    /**
     * Get model info by name
     */
    @GetMapping("/{modelName}")
    public ResponseEntity<?> getModelInfo(@PathVariable String modelName) {
        try {
            ModelInfo modelInfo = modelService.getModelInfo(modelName);
            if (modelInfo != null) {
                return ResponseEntity.ok(modelInfo);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete model
     */
    @DeleteMapping("/{modelName}")
    public ResponseEntity<?> deleteModel(@PathVariable String modelName) {
        try {
            boolean deleted = modelService.deleteModel(modelName);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Model deleted successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Toggle model status (activate/deactivate)
     */
    @PutMapping("/{modelId}/status")
    public ResponseEntity<?> toggleModelStatus(@PathVariable String modelId) {
        try {
            ModelInfo modelInfo = modelService.getModelInfo(modelId);
            if (modelInfo != null) {
                String newStatus = "ACTIVE".equals(modelInfo.getStatus()) ? "INACTIVE" : "ACTIVE";
                modelInfo.setStatus(newStatus);
                
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Model status updated",
                        "modelId", modelId,
                        "status", newStatus));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}

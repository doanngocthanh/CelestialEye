package com.spring.ai.restai.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    /**
     * API Documentation endpoint
     */
    @GetMapping("/docs")
    public ResponseEntity<?> getApiDocs() {
        return ResponseEntity.ok(Map.of(
                "title", "Spring AI REST API",
                "version", "1.0.0",
                "description", "REST API for ONNX model management and object detection",
                "endpoints", Map.of(
                        "models", Map.of(
                                "POST /api/models/upload", "Upload ONNX model",
                                "GET /api/models/list", "List all uploaded models",
                                "GET /api/models/{modelName}", "Get model information",
                                "DELETE /api/models/{modelName}", "Delete model"),
                        "detection", Map.of(
                                "POST /api/detection/detect/{modelName}", "Perform object detection",
                                "GET /api/detection/models", "Get available models for detection",
                                "DELETE /api/detection/cache/{modelName}", "Clear model cache",
                                "DELETE /api/detection/cache", "Clear all cache",
                                "GET /api/detection/health", "Health check")),
                "examples", Map.of(
                        "upload_model", Map.of(
                                "method", "POST",
                                "url", "/api/models/upload",
                                "form_data", Map.of(
                                        "file", "(ONNX file)",
                                        "name", "my_yolo_model",
                                        "description", "YOLOv8 object detection model")),
                        "detect_objects", Map.of(
                                "method", "POST",
                                "url", "/api/detection/detect/my_yolo_model",
                                "form_data", Map.of(
                                        "image", "(Image file)",
                                        "classNames", "person,car,bicycle,dog,cat (optional)",
                                        "confThreshold", "0.5 (optional)")))));
    }

    /**
     * API health check
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Spring AI REST API",
                "timestamp", System.currentTimeMillis()));
    }

    /**
     * Root endpoint
     */
    @GetMapping("/")
    public ResponseEntity<?> root() {
        return ResponseEntity.ok(Map.of(
                "message", "Welcome to Spring AI REST API",
                "documentation", "/api/docs",
                "health", "/api/health"));
    }
}

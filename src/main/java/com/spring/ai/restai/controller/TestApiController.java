package com.spring.ai.restai.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

/**
 * Simple API controller for testing endpoints
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TestApiController {

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "API is working!",
                "timestamp", System.currentTimeMillis()
        ));
    }

    @GetMapping("/endpoints")
    public ResponseEntity<Map<String, Object>> getEndpoints() {
        List<String> endpoints = new ArrayList<>();
        endpoints.add("GET /api/test - Test API connection");
        endpoints.add("POST /api/ocr/extract - OCR text extraction");
        endpoints.add("POST /api/detection/detect - Object detection");
        endpoints.add("POST /api/barcode/detect - Barcode detection");
        endpoints.add("POST /api/ocr/detect/{modelName} - OCR with specific model");
        endpoints.add("POST /api/detection/detect/{modelName} - Detection with specific model");
        endpoints.add("POST /api/barcode/process - Barcode processing");

        return ResponseEntity.ok(Map.of(
                "success", true,
                "availableEndpoints", endpoints,
                "modelsAvailable", List.of("DetectCCCD", "DetectBarCode")
        ));
    }
}

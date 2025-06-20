package com.spring.ai.restai.controller;

import com.spring.ai.restai.dto.FaceData;
import com.spring.ai.restai.service.FaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/face")
public class FaceController {

    @Autowired
    private FaceService faceService;

    /**
     * Register a new face
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerFace(
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam("name") String personName) {
        try {
            FaceData faceData = faceService.registerFace(imageFile, personName);
            return ResponseEntity.ok(faceData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error registering face: " + e.getMessage());
        }
    }

    /**
     * Authenticate face
     */
    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticateFace(@RequestParam("image") MultipartFile imageFile) {
        try {
            FaceData faceData = faceService.authenticateFace(imageFile);
            return ResponseEntity.ok(Map.of(
                    "authenticated", true,
                    "personName", faceData.getPersonName(),
                    "timestamp", faceData.getTimestamp()));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "authenticated", false,
                    "message", e.getMessage()));
        }
    }

    /**
     * Get all registered faces
     */
    @GetMapping("/list")
    public ResponseEntity<?> getAllFaces() {
        try {
            List<FaceData> faces = faceService.getAllFaces();
            return ResponseEntity.ok(faces);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error getting faces: " + e.getMessage());
        }
    }
}

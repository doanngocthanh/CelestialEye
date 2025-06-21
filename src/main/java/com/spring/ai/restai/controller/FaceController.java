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
    private FaceService faceService;    /**
     * Register a new face
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerFace(
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam("name") String personName) {
        try {
            System.out.println("Registering face for: " + personName);
            FaceData faceData = faceService.registerFace(imageFile, personName);
            
            String successMessage = String.format("Khuôn mặt đã được đăng ký thành công cho người dùng '%s'", personName);
            System.out.println("Registration successful: " + successMessage);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", successMessage,
                    "personName", faceData.getPersonName(),
                    "id", faceData.getId(),
                    "timestamp", String.valueOf(faceData.getTimestamp()),
                    "boundingBox", faceData.getBoundingBox(),
                    "faceDetected", true
            ));
        } catch (Exception e) {
            String errorMessage = "Lỗi đăng ký khuôn mặt: " + e.getMessage();
            System.err.println("Registration failed: " + errorMessage);
            
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", errorMessage,
                    "timestamp", String.valueOf(System.currentTimeMillis()),
                    "faceDetected", e.getMessage().contains("No face detected") ? false : true
            ));
        }
    }    /**
     * Authenticate face
     */
    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticateFace(@RequestParam("image") MultipartFile imageFile) {
        try {
            System.out.println("Authenticating face...");
            FaceData faceData = faceService.authenticateFace(imageFile);
            
            String successMessage = String.format("Xác thực thành công! Nhận diện được khuôn mặt của '%s'", faceData.getPersonName());
            System.out.println("Authentication successful: " + successMessage);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "authenticated", true,
                    "personName", faceData.getPersonName(),
                    "confidence", 0.95, // Mock confidence, replace with actual calculation
                    "message", successMessage,
                    "id", faceData.getId(),
                    "timestamp", String.valueOf(faceData.getTimestamp()),
                    "boundingBox", faceData.getBoundingBox(),
                    "faceDetected", true
            ));
        } catch (Exception e) {
            String errorMessage;
            boolean faceDetected = true;
            
            if (e.getMessage().contains("No face detected")) {
                errorMessage = "Không phát hiện khuôn mặt trong ảnh. Vui lòng thử lại với ảnh rõ nét hơn.";
                faceDetected = false;
            } else if (e.getMessage().contains("No matching face found")) {
                errorMessage = "Không tìm thấy khuôn mặt phù hợp trong hệ thống. Vui lòng đăng ký trước khi xác thực.";
            } else {
                errorMessage = "Lỗi xác thực khuôn mặt: " + e.getMessage();
            }
            
            System.err.println("Authentication failed: " + errorMessage);
            
            return ResponseEntity.ok(Map.of(
                    "success", true, // Still success response format
                    "authenticated", false,
                    "confidence", 0.0,
                    "message", errorMessage,
                    "timestamp", String.valueOf(System.currentTimeMillis()),
                    "faceDetected", faceDetected
            ));
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

    /**
     * Test API connection
     */
    @GetMapping("/test")
    public ResponseEntity<?> testConnection() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Face recognition API is working",
                "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }
}

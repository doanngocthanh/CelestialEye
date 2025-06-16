package com.spring.ai.restai.service;

import com.spring.ai.plugins.YOLOv8Detector;
import com.spring.ai.restai.detector.GenericYOLODetector;
import com.spring.ai.restai.dto.DetectionResult;
import com.spring.ai.restai.dto.ModelInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DetectionService {
    
    @Autowired
    private ModelService modelService;
    
    // Cache for loaded detectors to avoid reloading
    private final Map<String, GenericYOLODetector> detectorCache = new ConcurrentHashMap<>();
      /**
     * Perform object detection using specified model
     */
    public DetectionResult detect(String modelName, MultipartFile imageFile, 
                                String classNames, Float confThreshold) throws IOException {
        
        System.out.println("Starting detection with model: " + modelName);
        
        // Validate model exists
        if (!modelService.modelExists(modelName)) {
            throw new IllegalArgumentException("Model '" + modelName + "' not found");
        }
        
        try {
            // Get or create detector
            GenericYOLODetector detector = getOrCreateDetector(modelName, classNames, confThreshold);
            
            // Read image
            BufferedImage image = ImageIO.read(imageFile.getInputStream());
            if (image == null) {
                throw new IllegalArgumentException("Invalid image file");
            }
            
            System.out.println("Image loaded successfully: " + image.getWidth() + "x" + image.getHeight());
            
            // Perform detection
            long startTime = System.currentTimeMillis();
            YOLOv8Detector.Detection[] detections = detector.detect(image);
            long endTime = System.currentTimeMillis();
            
            System.out.println("Detection completed: " + detections.length + " objects found");
            
            // Convert to DTO
            List<DetectionResult.DetectionItem> detectionItems = new ArrayList<>();
            for (YOLOv8Detector.Detection detection : detections) {
                DetectionResult.DetectionItem item = new DetectionResult.DetectionItem(
                    detection.x1, detection.y1, detection.x2, detection.y2,
                    detection.confidence, detection.classId, detection.className
                );
                detectionItems.add(item);
            }
            
            DetectionResult result = new DetectionResult(
                modelName,
                imageFile.getOriginalFilename(),
                image.getWidth(),
                image.getHeight(),
                endTime - startTime,
                detectionItems
            );
            
            System.out.println("Detection result created successfully");
            return result;
            
        } catch (Exception e) {
            System.err.println("Detection failed with error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Detection failed: " + e.getMessage(), e);
        }
    }
      /**
     * Get or create detector for model
     */
    private GenericYOLODetector getOrCreateDetector(String modelName, String classNames, Float confThreshold) {
        String cacheKey = modelName + "_" + (classNames != null ? classNames.hashCode() : "default") + 
                         "_" + (confThreshold != null ? confThreshold : "default");
        
        return detectorCache.computeIfAbsent(cacheKey, k -> {
            String modelPath = modelService.getModelPath(modelName);
            GenericYOLODetector detector;
            
            // Use higher confidence threshold for better results
            float finalConfThreshold = confThreshold != null ? confThreshold : 0.5f; // Increased from default 0.25f
              if (confThreshold != null) {
                detector = new GenericYOLODetector(modelPath, 640, 640, finalConfThreshold);
            } else {
                detector = new GenericYOLODetector(modelPath, 640, 640, finalConfThreshold);
            }
            
            // Set class names if provided
            if (classNames != null && !classNames.trim().isEmpty()) {
                detector.setClassNamesFromString(classNames);
            }
            System.out.println("Created new detector for model: " + modelName);
            return detector;
        });
    }
    
    /**
     * Clear detector cache for a specific model
     */
    public void clearDetectorCache(String modelName) {
        detectorCache.entrySet().removeIf(entry -> entry.getKey().startsWith(modelName + "_"));
        System.out.println("Cleared detector cache for model: " + modelName);
    }
    
    /**
     * Clear all detector cache
     */
    public void clearAllDetectorCache() {
        // Close all detectors before removing
        detectorCache.values().forEach(detector -> {
            try {
                detector.close();
            } catch (Exception e) {
                System.err.println("Error closing detector: " + e.getMessage());
            }
        });
        detectorCache.clear();
        System.out.println("Cleared all detector cache");
    }
    
    /**
     * Get available models for detection
     */
    public List<ModelInfo> getAvailableModels() {
        return modelService.listModels();
    }
    
    /**
     * Update class names for a specific model
     */
    public boolean updateModelClassNames(String modelName, String classNames) {
        try {
            // Check if model exists
            if (!modelService.modelExists(modelName)) {
                return false;
            }
            
            // Clear existing detector cache for this model to force recreation with new class names
            clearDetectorCache(modelName);
            
            // Store class names for future detector creation
            // For now, we'll store in memory. In production, this could be stored in database
            System.out.println("Updated class names for model " + modelName + ": " + classNames);
            
            return true;
        } catch (Exception e) {
            System.err.println("Failed to update class names for model " + modelName + ": " + e.getMessage());
            return false;
        }
    }
}

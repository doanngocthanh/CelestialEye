package com.spring.ai.restai.service;

import com.spring.ai.restai.dto.ModelInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ModelService {
    
    @Value("${app.model.upload.dir:models}")
    private String uploadDir;
      private final String REGISTRY_FILE = "model-registry.json";
    private final ObjectMapper objectMapper;
    
    // In-memory cache loaded from JSON file
    private final Map<String, ModelInfo> modelRegistry = new ConcurrentHashMap<>();
      public ModelService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
    
    /**
     * Initialize service - load model registry from JSON file
     */
    @PostConstruct
    public void init() {
        loadModelRegistry();
    }
    
    /**
     * Load model registry from JSON file
     */
    private void loadModelRegistry() {
        try {
            Path registryPath = Paths.get(uploadDir, REGISTRY_FILE);
            if (Files.exists(registryPath)) {
                TypeReference<Map<String, ModelInfo>> typeRef = new TypeReference<Map<String, ModelInfo>>() {};
                Map<String, ModelInfo> loadedRegistry = objectMapper.readValue(registryPath.toFile(), typeRef);
                modelRegistry.putAll(loadedRegistry);
                System.out.println("Loaded " + modelRegistry.size() + " models from registry file");
            } else {
                System.out.println("No existing model registry found, starting with empty registry");
            }
        } catch (IOException e) {
            System.err.println("Error loading model registry: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Save model registry to JSON file
     */
    private void saveModelRegistry() {
        try {
            // Ensure upload directory exists
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            Path registryPath = Paths.get(uploadDir, REGISTRY_FILE);
            objectMapper.writerWithDefaultPrettyPrinter()
                       .writeValue(registryPath.toFile(), modelRegistry);
            System.out.println("Model registry saved to " + registryPath);
        } catch (IOException e) {
            System.err.println("Error saving model registry: " + e.getMessage());
            e.printStackTrace();
        }
    }
      /**
     * Upload ONNX model
     */    public ModelInfo uploadModel(MultipartFile file, String modelName, String modelType, String description) throws IOException {
        
        // Validate model name
        if (modelName == null || modelName.trim().isEmpty()) {
            throw new IllegalArgumentException("Model name cannot be empty");
        }
        
        // Validate model type
        if (modelType == null || modelType.trim().isEmpty()) {
            throw new IllegalArgumentException("Model type cannot be empty");
        }
        
        // Generate unique ID based on name
        String modelId = generateModelId(modelName);
        
        if (modelRegistry.containsKey(modelId)) {
            throw new IllegalArgumentException("Model with name '" + modelName + "' already exists");
        }
        
        // Create upload directory if not exists
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }        // Generate unique filename using modelId (safe for file system)
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("File name cannot be empty");
        }
        
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String uniqueFilename = modelId + "_" + System.currentTimeMillis() + fileExtension;
          // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
          // Create model info
        ModelInfo modelInfo = new ModelInfo(
            modelId,
            modelName,
            originalFilename,
            description,
            filePath.toString(),
            file.getSize(),
            modelType.trim()
        );
        
        // Register model using ID as key
        modelRegistry.put(modelId, modelInfo);
        
        // Save registry to JSON file
        saveModelRegistry();
        
        System.out.println("Model uploaded successfully: " + modelInfo);
        return modelInfo;
    }
    
    /**
     * List all uploaded models
     */
    public List<ModelInfo> listModels() {
        return new ArrayList<>(modelRegistry.values());
    }
      /**
     * Get model info by ID or name
     */
    public ModelInfo getModelInfo(String identifier) {
        // Try to find by ID first
        ModelInfo modelInfo = modelRegistry.get(identifier);
        if (modelInfo != null) {
            return modelInfo;
        }
        
        // If not found, try to find by name
        return modelRegistry.values().stream()
                .filter(model -> model.getName().equals(identifier))
                .findFirst()
                .orElse(null);
    }
    
    /**
     * Delete model by ID or name
     */
    public boolean deleteModel(String identifier) {
        // Try to find by ID first
        ModelInfo modelInfo = modelRegistry.get(identifier);
        String modelId = identifier;
        
        // If not found, try to find by name
        if (modelInfo == null) {
            for (Map.Entry<String, ModelInfo> entry : modelRegistry.entrySet()) {
                if (entry.getValue().getName().equals(identifier)) {
                    modelInfo = entry.getValue();
                    modelId = entry.getKey();
                    break;
                }
            }
        }
        
        if (modelInfo != null) {
            try {
                // Delete physical file
                Path filePath = Paths.get(modelInfo.getFilePath());
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                }
                
                // Remove from registry
                modelRegistry.remove(modelId);
                
                // Save registry to JSON file
                saveModelRegistry();
                
                System.out.println("Model deleted successfully: " + identifier);
                return true;
                
            } catch (IOException e) {
                System.err.println("Error deleting model file: " + e.getMessage());
                return false;
            }
        }
        return false;
    }
      /**
     * Check if model exists by ID or name
     */
    public boolean modelExists(String identifier) {
        // Check by ID first
        if (modelRegistry.containsKey(identifier)) {
            return true;
        }
        
        // Check by name
        return modelRegistry.values().stream()
                .anyMatch(model -> model.getName().equals(identifier));
    }
    
    /**
     * Get model file path by ID or name
     */
    public String getModelPath(String identifier) {
        ModelInfo modelInfo = getModelInfo(identifier);
        return modelInfo != null ? modelInfo.getFilePath() : null;
    }
    
    /**
     * Generate unique model ID from name
     */
    private String generateModelId(String modelName) {
        // Convert Vietnamese name to safe ID
        String baseId = modelName.toLowerCase()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d")
                .replaceAll("[^a-z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
        
        // Ensure unique ID
        String modelId = baseId;
        int counter = 1;
        while (modelRegistry.containsKey(modelId)) {
            modelId = baseId + "_" + counter;
            counter++;
        }
        
        return modelId;
    }
    
    /**
     * Determine model type based on filename and description
     */
    private String determineModelType(String filename, String description) {
        String lowerFilename = filename.toLowerCase();
        String lowerDesc = description != null ? description.toLowerCase() : "";
        
        if (lowerFilename.contains("ocr") || lowerDesc.contains("ocr") || lowerDesc.contains("text")) {
            return "OCR";
        } else if (lowerFilename.contains("barcode") || lowerDesc.contains("barcode") || lowerDesc.contains("qr")) {
            return "Barcode Detection";
        } else if (lowerFilename.contains("face") || lowerDesc.contains("face")) {
            return "Face Recognition";
        } else if (lowerFilename.contains("detect") || lowerDesc.contains("detect") || lowerDesc.contains("object")) {
            return "Object Detection";
        } else {
            return "Custom";
        }
    }
}

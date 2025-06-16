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
     */
    public ModelInfo uploadModel(MultipartFile file, String modelName, String description) throws IOException {
        
        // Validate model name
        if (modelName == null || modelName.trim().isEmpty()) {
            throw new IllegalArgumentException("Model name cannot be empty");
        }
        
        if (modelRegistry.containsKey(modelName)) {
            throw new IllegalArgumentException("Model with name '" + modelName + "' already exists");
        }
        
        // Create upload directory if not exists
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
          // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("File name cannot be empty");
        }
        
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String uniqueFilename = modelName + "_" + System.currentTimeMillis() + fileExtension;
        
        // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Create model info
        ModelInfo modelInfo = new ModelInfo(
            modelName,
            originalFilename,
            description,
            filePath.toString(),
            file.getSize()
        );
        
        // Register model
        modelRegistry.put(modelName, modelInfo);
        
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
     * Get model info by name
     */
    public ModelInfo getModelInfo(String modelName) {
        return modelRegistry.get(modelName);
    }
    
    /**
     * Delete model
     */
    public boolean deleteModel(String modelName) {
        ModelInfo modelInfo = modelRegistry.get(modelName);
        if (modelInfo != null) {
            try {
                // Delete physical file
                Path filePath = Paths.get(modelInfo.getFilePath());
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                }
                  // Remove from registry
                modelRegistry.remove(modelName);
                
                // Save registry to JSON file
                saveModelRegistry();
                
                System.out.println("Model deleted successfully: " + modelName);
                return true;
                
            } catch (IOException e) {
                System.err.println("Error deleting model file: " + e.getMessage());
                return false;
            }
        }
        return false;
    }
    
    /**
     * Check if model exists
     */
    public boolean modelExists(String modelName) {
        return modelRegistry.containsKey(modelName);
    }
    
    /**
     * Get model file path
     */
    public String getModelPath(String modelName) {
        ModelInfo modelInfo = modelRegistry.get(modelName);
        return modelInfo != null ? modelInfo.getFilePath() : null;
    }
}

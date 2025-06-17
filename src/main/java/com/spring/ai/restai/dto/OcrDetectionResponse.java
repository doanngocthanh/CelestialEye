package com.spring.ai.restai.dto;

import java.util.List;

/**
 * Response DTO for OCR detection endpoint
 */
public class OcrDetectionResponse {
    private String modelName;
    private int totalDetections;
    private List<OcrResult> results;
    private long processingTimeMs;
    private String imageInfo;
    private CccdInfo cccdInfo; // Parsed CCCD information if available
    
    public OcrDetectionResponse() {}
    
    public OcrDetectionResponse(String modelName, int totalDetections, List<OcrResult> results, 
                               long processingTimeMs, String imageInfo) {
        this.modelName = modelName;
        this.totalDetections = totalDetections;
        this.results = results;
        this.processingTimeMs = processingTimeMs;
        this.imageInfo = imageInfo;
    }
    
    public OcrDetectionResponse(String modelName, int totalDetections, List<OcrResult> results, 
                               long processingTimeMs, String imageInfo, CccdInfo cccdInfo) {
        this.modelName = modelName;
        this.totalDetections = totalDetections;
        this.results = results;
        this.processingTimeMs = processingTimeMs;
        this.imageInfo = imageInfo;
        this.cccdInfo = cccdInfo;
    }
    
    // Getters and Setters
    public String getModelName() {
        return modelName;
    }
    
    public void setModelName(String modelName) {
        this.modelName = modelName;
    }
    
    public int getTotalDetections() {
        return totalDetections;
    }
    
    public void setTotalDetections(int totalDetections) {
        this.totalDetections = totalDetections;
    }
    
    public List<OcrResult> getResults() {
        return results;
    }
    
    public void setResults(List<OcrResult> results) {
        this.results = results;
    }
    
    public long getProcessingTimeMs() {
        return processingTimeMs;
    }
    
    public void setProcessingTimeMs(long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }
    
    public String getImageInfo() {
        return imageInfo;
    }
    
    public void setImageInfo(String imageInfo) {
        this.imageInfo = imageInfo;
    }
    
    public CccdInfo getCccdInfo() {
        return cccdInfo;
    }
    
    public void setCccdInfo(CccdInfo cccdInfo) {
        this.cccdInfo = cccdInfo;
    }
}

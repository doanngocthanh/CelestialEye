package com.spring.ai.restai.dto;

import java.util.List;

/**
 * QR Code detection response
 */
public class QrCodeDetectionResponse {
    private String imageInfo;
    private int totalQrCodes;
    private List<QrCodeResult> qrCodes;
    private long processingTimeMs;
    
    public QrCodeDetectionResponse() {}
    
    public QrCodeDetectionResponse(String imageInfo, int totalQrCodes, List<QrCodeResult> qrCodes, long processingTimeMs) {
        this.imageInfo = imageInfo;
        this.totalQrCodes = totalQrCodes;
        this.qrCodes = qrCodes;
        this.processingTimeMs = processingTimeMs;
    }
    
    // Getters and setters
    public String getImageInfo() {
        return imageInfo;
    }
    
    public void setImageInfo(String imageInfo) {
        this.imageInfo = imageInfo;
    }
    
    public int getTotalQrCodes() {
        return totalQrCodes;
    }
    
    public void setTotalQrCodes(int totalQrCodes) {
        this.totalQrCodes = totalQrCodes;
    }
    
    public List<QrCodeResult> getQrCodes() {
        return qrCodes;
    }
    
    public void setQrCodes(List<QrCodeResult> qrCodes) {
        this.qrCodes = qrCodes;
    }
    
    public long getProcessingTimeMs() {
        return processingTimeMs;
    }
    
    public void setProcessingTimeMs(long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }
}

package com.spring.ai.restai.dto;

/**
 * QR Code detection result
 */
public class QrCodeResult {
    private String content;
    private BoundingBox boundingBox;
    private double confidence;
    private String type;  // Type of QR code: "CCCD", "URL", "TEXT", etc.
    private CccdInfo cccdInfo;  // Parsed CCCD information if applicable
    
    public QrCodeResult() {}
    
    public QrCodeResult(String content, BoundingBox boundingBox, double confidence) {
        this.content = content;
        this.boundingBox = boundingBox;
        this.confidence = confidence;
        this.type = "TEXT";  // Default type
    }
    
    public QrCodeResult(String content, BoundingBox boundingBox, double confidence, String type, CccdInfo cccdInfo) {
        this.content = content;
        this.boundingBox = boundingBox;
        this.confidence = confidence;
        this.type = type;
        this.cccdInfo = cccdInfo;
    }
    
    // Getters and setters
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public BoundingBox getBoundingBox() {
        return boundingBox;
    }
    
    public void setBoundingBox(BoundingBox boundingBox) {
        this.boundingBox = boundingBox;
    }
    
    public double getConfidence() {
        return confidence;
    }
    
    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public CccdInfo getCccdInfo() {
        return cccdInfo;
    }
    
    public void setCccdInfo(CccdInfo cccdInfo) {
        this.cccdInfo = cccdInfo;
    }
    
    /**
     * Bounding box coordinates
     */
    public static class BoundingBox {
        private double x;
        private double y;
        private double width;
        private double height;
        
        public BoundingBox() {}
        
        public BoundingBox(double x, double y, double width, double height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        
        // Getters and setters
        public double getX() {
            return x;
        }
        
        public void setX(double x) {
            this.x = x;
        }
        
        public double getY() {
            return y;
        }
        
        public void setY(double y) {
            this.y = y;
        }
        
        public double getWidth() {
            return width;
        }
        
        public void setWidth(double width) {
            this.width = width;
        }
        
        public double getHeight() {
            return height;
        }
        
        public void setHeight(double height) {
            this.height = height;
        }
    }
}

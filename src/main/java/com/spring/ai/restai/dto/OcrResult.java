package com.spring.ai.restai.dto;

/**
 * OCR result containing text extracted from detected regions
 */
public class OcrResult {
    private String text;
    private float confidence;
    private BoundingBox boundingBox;
    private String className;
    private int classId;
    
    public OcrResult() {}
    
    public OcrResult(String text, float confidence, BoundingBox boundingBox, String className, int classId) {
        this.text = text;
        this.confidence = confidence;
        this.boundingBox = boundingBox;
        this.className = className;
        this.classId = classId;
    }
    
    // Getters and Setters
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
    
    public float getConfidence() {
        return confidence;
    }
    
    public void setConfidence(float confidence) {
        this.confidence = confidence;
    }
    
    public BoundingBox getBoundingBox() {
        return boundingBox;
    }
    
    public void setBoundingBox(BoundingBox boundingBox) {
        this.boundingBox = boundingBox;
    }
    
    public String getClassName() {
        return className;
    }
    
    public void setClassName(String className) {
        this.className = className;
    }
    
    public int getClassId() {
        return classId;
    }
    
    public void setClassId(int classId) {
        this.classId = classId;
    }
    
    /**
     * Bounding box for OCR result
     */
    public static class BoundingBox {
        private float x1, y1, x2, y2;
        
        public BoundingBox() {}
        
        public BoundingBox(float x1, float y1, float x2, float y2) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
        
        // Getters and Setters
        public float getX1() { return x1; }
        public void setX1(float x1) { this.x1 = x1; }
        
        public float getY1() { return y1; }
        public void setY1(float y1) { this.y1 = y1; }
        
        public float getX2() { return x2; }
        public void setX2(float x2) { this.x2 = x2; }
        
        public float getY2() { return y2; }
        public void setY2(float y2) { this.y2 = y2; }
        
        public int getWidth() { return (int) (x2 - x1); }
        public int getHeight() { return (int) (y2 - y1); }
    }
}

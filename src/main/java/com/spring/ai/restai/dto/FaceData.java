package com.spring.ai.restai.dto;

import java.util.List;

public class FaceData {
    private String id;
    private String personName;
    private List<Float> faceEmbedding;
    private BoundingBox boundingBox;
    private long timestamp;
    
    public static class BoundingBox {
        private float x;
        private float y;
        private float width;
        private float height;
        
        public float getX() { return x; }
        public void setX(float x) { this.x = x; }
        public float getY() { return y; }
        public void setY(float y) { this.y = y; }
        public float getWidth() { return width; }
        public void setWidth(float width) { this.width = width; }
        public float getHeight() { return height; }
        public void setHeight(float height) { this.height = height; }
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPersonName() { return personName; }
    public void setPersonName(String personName) { this.personName = personName; }
    public List<Float> getFaceEmbedding() { return faceEmbedding; }
    public void setFaceEmbedding(List<Float> faceEmbedding) { this.faceEmbedding = faceEmbedding; }
    public BoundingBox getBoundingBox() { return boundingBox; }
    public void setBoundingBox(BoundingBox boundingBox) { this.boundingBox = boundingBox; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}

package com.spring.ai.restai.dto;

import java.util.List;

public class BarcodeResult {
    private int pageNumber;
    private String content;
    private String format;
    private BoundingBox boundingBox;
    
    public static class BoundingBox {
        private float x;
        private float y;
        private float width;
        private float height;
        
        // Getters and setters
        public float getX() { return x; }
        public void setX(float x) { this.x = x; }
        public float getY() { return y; }
        public void setY(float y) { this.y = y; }
        public float getWidth() { return width; }
        public void setWidth(float width) { this.width = width; }
        public float getHeight() { return height; }
        public void setHeight(float height) { this.height = height; }
    }
    
    // Getters and setters
    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public BoundingBox getBoundingBox() { return boundingBox; }
    public void setBoundingBox(BoundingBox boundingBox) { this.boundingBox = boundingBox; }
}

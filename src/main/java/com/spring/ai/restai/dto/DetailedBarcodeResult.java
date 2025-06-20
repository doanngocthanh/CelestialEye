package com.spring.ai.restai.dto;

import java.util.ArrayList;
import java.util.List;

public class DetailedBarcodeResult {
    private int pageNumber;
    private int regionNumber;
    private List<BarcodeInfo> barcodes = new ArrayList<>();

    public static class BarcodeInfo {
        private String content;
        private String format;
        private float confidence;
        private BoundingBox originalLocation;
        private BoundingBox regionLocation;

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getFormat() { return format; }
        public void setFormat(String format) { this.format = format; }
        public float getConfidence() { return confidence; }
        public void setConfidence(float confidence) { this.confidence = confidence; }
        public BoundingBox getOriginalLocation() { return originalLocation; }
        public void setOriginalLocation(BoundingBox originalLocation) { this.originalLocation = originalLocation; }
        public BoundingBox getRegionLocation() { return regionLocation; }
        public void setRegionLocation(BoundingBox regionLocation) { this.regionLocation = regionLocation; }
    }

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

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }
    public int getRegionNumber() { return regionNumber; }
    public void setRegionNumber(int regionNumber) { this.regionNumber = regionNumber; }
    public List<BarcodeInfo> getBarcodes() { return barcodes; }
    public void setBarcodes(List<BarcodeInfo> barcodes) { this.barcodes = barcodes; }
    public void addBarcode(BarcodeInfo barcode) { this.barcodes.add(barcode); }
}

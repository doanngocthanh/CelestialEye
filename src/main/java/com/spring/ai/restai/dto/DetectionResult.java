package com.spring.ai.restai.dto;

import java.util.List;

/**
 * DTO for detection results
 */
public class DetectionResult {
    private String modelName;
    private String imageName;
    private int imageWidth;
    private int imageHeight;
    private long processingTime;
    private List<DetectionItem> detections;

    public DetectionResult() {}

    public DetectionResult(String modelName, String imageName, int imageWidth, int imageHeight, 
                          long processingTime, List<DetectionItem> detections) {
        this.modelName = modelName;
        this.imageName = imageName;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.processingTime = processingTime;
        this.detections = detections;
    }

    public static class DetectionItem {
        private float x1, y1, x2, y2;
        private float confidence;
        private int classId;
        private String className;

        public DetectionItem() {}

        public DetectionItem(float x1, float y1, float x2, float y2, float confidence, int classId, String className) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.confidence = confidence;
            this.classId = classId;
            this.className = className;
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

        public float getConfidence() { return confidence; }
        public void setConfidence(float confidence) { this.confidence = confidence; }

        public int getClassId() { return classId; }
        public void setClassId(int classId) { this.classId = classId; }

        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }

        public float getWidth() { return x2 - x1; }
        public float getHeight() { return y2 - y1; }
        public float getCenterX() { return (x1 + x2) / 2; }
        public float getCenterY() { return (y1 + y2) / 2; }
    }

    // Getters and Setters
    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getImageName() { return imageName; }
    public void setImageName(String imageName) { this.imageName = imageName; }

    public int getImageWidth() { return imageWidth; }
    public void setImageWidth(int imageWidth) { this.imageWidth = imageWidth; }

    public int getImageHeight() { return imageHeight; }
    public void setImageHeight(int imageHeight) { this.imageHeight = imageHeight; }

    public long getProcessingTime() { return processingTime; }
    public void setProcessingTime(long processingTime) { this.processingTime = processingTime; }

    public List<DetectionItem> getDetections() { return detections; }
    public void setDetections(List<DetectionItem> detections) { this.detections = detections; }
}

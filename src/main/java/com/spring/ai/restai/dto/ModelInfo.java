package com.spring.ai.restai.dto;

import java.time.LocalDateTime;

/**
 * DTO for model information
 */
public class ModelInfo {
    private String id;
    private String name;
    private String fileName;
    private String description;
    private String filePath;
    private long fileSize;
    private LocalDateTime uploadTime;
    private String status;
    private String type;    public ModelInfo() {}

    public ModelInfo(String id, String name, String fileName, String description, String filePath, long fileSize, String type) {
        this.id = id;
        this.name = name;
        this.fileName = fileName;
        this.description = description;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.uploadTime = LocalDateTime.now();
        this.status = "ACTIVE";
        this.type = type;
    }    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public LocalDateTime getUploadTime() {
        return uploadTime;
    }

    public void setUploadTime(LocalDateTime uploadTime) {
        this.uploadTime = uploadTime;
    }

    public String getStatus() {
        return status;
    }    public void setStatus(String status) {
        this.status = status;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }    @Override
    public String toString() {
        return "ModelInfo{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", fileName='" + fileName + '\'' +
                ", description='" + description + '\'' +
                ", fileSize=" + fileSize +
                ", uploadTime=" + uploadTime +
                ", status='" + status + '\'' +
                ", type='" + type + '\'' +
                '}';
    }
}

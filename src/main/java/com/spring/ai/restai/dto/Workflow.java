package com.spring.ai.restai.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Represents a complete workflow configuration
 */
public class Workflow {
    private String id;
    private String name;
    private String description;
    private List<WorkflowStep> steps;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private Map<String, Object> globalSettings;
    
    public Workflow() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.active = true;
    }
    
    public Workflow(String id, String name, String description, List<WorkflowStep> steps) {
        this();
        this.id = id;
        this.name = name;
        this.description = description;
        this.steps = steps;
    }
    
    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public List<WorkflowStep> getSteps() { return steps; }
    public void setSteps(List<WorkflowStep> steps) { this.steps = steps; }
    
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public Map<String, Object> getGlobalSettings() { return globalSettings; }
    public void setGlobalSettings(Map<String, Object> globalSettings) { this.globalSettings = globalSettings; }
    
    /**
     * Update the updatedAt timestamp
     */
    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }
    
    @Override
    public String toString() {
        return "Workflow{" +
               "id='" + id + '\'' +
               ", name='" + name + '\'' +
               ", stepsCount=" + (steps != null ? steps.size() : 0) +
               ", active=" + active +
               '}';
    }
}

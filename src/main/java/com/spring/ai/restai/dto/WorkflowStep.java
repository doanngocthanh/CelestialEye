package com.spring.ai.restai.dto;

import java.util.Map;

/**
 * Represents a single step in a workflow
 */
public class WorkflowStep {
    private String id;
    private String name;
    private String type; // "DETECTION", "OCR", "QR_CODE", "IMAGE_PREPROCESSING", "VALIDATION"
    private String description;
    private Map<String, Object> parameters;
    private Map<String, Object> validation; // Input/output validation rules
    private boolean enabled;
    private int order;
    
    public WorkflowStep() {}
    
    public WorkflowStep(String id, String name, String type, String description, 
                       Map<String, Object> parameters, int order) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description;
        this.parameters = parameters;
        this.order = order;
        this.enabled = true;
    }
    
    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }
    
    public Map<String, Object> getValidation() { return validation; }
    public void setValidation(Map<String, Object> validation) { this.validation = validation; }
    
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    
    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
    
    @Override
    public String toString() {
        return "WorkflowStep{" +
               "id='" + id + '\'' +
               ", name='" + name + '\'' +
               ", type='" + type + '\'' +
               ", enabled=" + enabled +
               ", order=" + order +
               '}';
    }
}

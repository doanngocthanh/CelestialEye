package com.spring.ai.restai.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Represents the execution of a single workflow step
 */
public class WorkflowStepExecution {
    private String stepId;
    private String stepName;
    private String stepType;
    private String status; // "PENDING", "RUNNING", "SUCCESS", "ERROR", "SKIPPED"
    private Object input;
    private Object output;
    private String errorMessage;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long executionTimeMs;
    private Map<String, Object> metrics;
    
    public WorkflowStepExecution() {}
    
    public WorkflowStepExecution(String stepId, String stepName, String stepType) {
        this.stepId = stepId;
        this.stepName = stepName;
        this.stepType = stepType;
        this.status = "PENDING";
    }
    
    public void start() {
        this.status = "RUNNING";
        this.startTime = LocalDateTime.now();
    }
    
    public void success(Object output) {
        this.status = "SUCCESS";
        this.output = output;
        this.endTime = LocalDateTime.now();
        if (startTime != null) {
            this.executionTimeMs = java.time.Duration.between(startTime, endTime).toMillis();
        }
    }
    
    public void error(String errorMessage) {
        this.status = "ERROR";
        this.errorMessage = errorMessage;
        this.endTime = LocalDateTime.now();
        if (startTime != null) {
            this.executionTimeMs = java.time.Duration.between(startTime, endTime).toMillis();
        }
    }
    
    public void skip(String reason) {
        this.status = "SKIPPED";
        this.errorMessage = reason;
        this.endTime = LocalDateTime.now();
    }
    
    // Getters and setters
    public String getStepId() { return stepId; }
    public void setStepId(String stepId) { this.stepId = stepId; }
    
    public String getStepName() { return stepName; }
    public void setStepName(String stepName) { this.stepName = stepName; }
    
    public String getStepType() { return stepType; }
    public void setStepType(String stepType) { this.stepType = stepType; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Object getInput() { return input; }
    public void setInput(Object input) { this.input = input; }
    
    public Object getOutput() { return output; }
    public void setOutput(Object output) { this.output = output; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    
    public long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(long executionTimeMs) { this.executionTimeMs = executionTimeMs; }
    
    public Map<String, Object> getMetrics() { return metrics; }
    public void setMetrics(Map<String, Object> metrics) { this.metrics = metrics; }
}

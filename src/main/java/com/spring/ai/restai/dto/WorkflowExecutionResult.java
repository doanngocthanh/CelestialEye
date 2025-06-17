package com.spring.ai.restai.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Represents the execution result of a complete workflow
 */
public class WorkflowExecutionResult {
    private String workflowId;
    private String workflowName;
    private String executionId;
    private String status; // "RUNNING", "SUCCESS", "ERROR", "PARTIAL_SUCCESS"
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long totalExecutionTimeMs;
    private List<WorkflowStepExecution> stepExecutions;
    private Object finalOutput;
    private String errorMessage;
    private Map<String, Object> metadata;
    private int successfulSteps;
    private int failedSteps;
    private int skippedSteps;
    
    public WorkflowExecutionResult() {
        this.stepExecutions = new ArrayList<>();
        this.startTime = LocalDateTime.now();
        this.status = "RUNNING";
    }
    
    public WorkflowExecutionResult(String workflowId, String workflowName, String executionId) {
        this();
        this.workflowId = workflowId;
        this.workflowName = workflowName;
        this.executionId = executionId;
    }
    
    public void complete() {
        this.endTime = LocalDateTime.now();
        this.totalExecutionTimeMs = java.time.Duration.between(startTime, endTime).toMillis();
        
        // Calculate step statistics
        this.successfulSteps = (int) stepExecutions.stream().filter(s -> "SUCCESS".equals(s.getStatus())).count();
        this.failedSteps = (int) stepExecutions.stream().filter(s -> "ERROR".equals(s.getStatus())).count();
        this.skippedSteps = (int) stepExecutions.stream().filter(s -> "SKIPPED".equals(s.getStatus())).count();
        
        // Determine final status
        if (failedSteps > 0) {
            this.status = successfulSteps > 0 ? "PARTIAL_SUCCESS" : "ERROR";
        } else {
            this.status = "SUCCESS";
        }
    }
    
    public void addStepExecution(WorkflowStepExecution stepExecution) {
        this.stepExecutions.add(stepExecution);
    }
    
    // Getters and setters
    public String getWorkflowId() { return workflowId; }
    public void setWorkflowId(String workflowId) { this.workflowId = workflowId; }
    
    public String getWorkflowName() { return workflowName; }
    public void setWorkflowName(String workflowName) { this.workflowName = workflowName; }
    
    public String getExecutionId() { return executionId; }
    public void setExecutionId(String executionId) { this.executionId = executionId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    
    public long getTotalExecutionTimeMs() { return totalExecutionTimeMs; }
    public void setTotalExecutionTimeMs(long totalExecutionTimeMs) { this.totalExecutionTimeMs = totalExecutionTimeMs; }
    
    public List<WorkflowStepExecution> getStepExecutions() { return stepExecutions; }
    public void setStepExecutions(List<WorkflowStepExecution> stepExecutions) { this.stepExecutions = stepExecutions; }
    
    public Object getFinalOutput() { return finalOutput; }
    public void setFinalOutput(Object finalOutput) { this.finalOutput = finalOutput; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    
    public int getSuccessfulSteps() { return successfulSteps; }
    public void setSuccessfulSteps(int successfulSteps) { this.successfulSteps = successfulSteps; }
    
    public int getFailedSteps() { return failedSteps; }
    public void setFailedSteps(int failedSteps) { this.failedSteps = failedSteps; }
    
    public int getSkippedSteps() { return skippedSteps; }
    public void setSkippedSteps(int skippedSteps) { this.skippedSteps = skippedSteps; }
    
    @Override
    public String toString() {
        return "WorkflowExecutionResult{" +
               "workflowId='" + workflowId + '\'' +
               ", executionId='" + executionId + '\'' +
               ", status='" + status + '\'' +
               ", totalSteps=" + stepExecutions.size() +
               ", successfulSteps=" + successfulSteps +
               ", failedSteps=" + failedSteps +
               ", executionTimeMs=" + totalExecutionTimeMs +
               '}';
    }
}

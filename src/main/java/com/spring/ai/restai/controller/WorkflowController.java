package com.spring.ai.restai.controller;

import com.spring.ai.restai.dto.Workflow;
import com.spring.ai.restai.dto.WorkflowExecutionResult;
import com.spring.ai.restai.service.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for workflow management and execution
 */
@RestController
@RequestMapping("/api/workflows")
@CrossOrigin(origins = "*")
public class WorkflowController {

    @Autowired
    private WorkflowService workflowService;

    /**
     * Get all workflows
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllWorkflows() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Workflow> workflows = workflowService.getAllWorkflows();
            
            response.put("success", true);
            response.put("workflows", workflows);
            response.put("count", workflows.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error getting workflows: " + e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to get workflows: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get workflow by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getWorkflow(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Workflow workflow = workflowService.getWorkflow(id);
            
            if (workflow == null) {
                response.put("success", false);
                response.put("error", "Workflow not found: " + id);
                return ResponseEntity.notFound().build();
            }
            
            response.put("success", true);
            response.put("workflow", workflow);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error getting workflow: " + e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to get workflow: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Create new workflow
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createWorkflow(@RequestBody Workflow workflow) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate workflow
            if (workflow.getName() == null || workflow.getName().trim().isEmpty()) {
                response.put("success", false);
                response.put("error", "Workflow name is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (workflow.getSteps() == null || workflow.getSteps().isEmpty()) {
                response.put("success", false);
                response.put("error", "Workflow must have at least one step");
                return ResponseEntity.badRequest().body(response);
            }
            
            Workflow createdWorkflow = workflowService.createWorkflow(workflow);
            
            response.put("success", true);
            response.put("workflow", createdWorkflow);
            response.put("message", "Workflow created successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error creating workflow: " + e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to create workflow: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Update workflow
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateWorkflow(@PathVariable String id, @RequestBody Workflow workflow) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Workflow updatedWorkflow = workflowService.updateWorkflow(id, workflow);
            
            response.put("success", true);
            response.put("workflow", updatedWorkflow);
            response.put("message", "Workflow updated successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
            
        } catch (Exception e) {
            System.err.println("Error updating workflow: " + e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to update workflow: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Delete workflow
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteWorkflow(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            workflowService.deleteWorkflow(id);
            
            response.put("success", true);
            response.put("message", "Workflow deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error deleting workflow: " + e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to delete workflow: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Execute workflow with image
     */
    @PostMapping("/{id}/execute")
    public ResponseEntity<Map<String, Object>> executeWorkflow(
            @PathVariable String id,
            @RequestParam("image") MultipartFile imageFile) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate input
            if (imageFile.isEmpty()) {
                response.put("success", false);
                response.put("error", "No image file provided");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if file is an image
            String contentType = imageFile.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("error", "File must be an image");
                return ResponseEntity.badRequest().body(response);
            }
            
            System.out.println("Executing workflow " + id + " with image: " + 
                             imageFile.getOriginalFilename() + " (" + imageFile.getSize() + " bytes)");
            
            WorkflowExecutionResult result = workflowService.executeWorkflow(id, imageFile);
            
            response.put("success", true);
            response.put("executionResult", result);
            response.put("message", "Workflow executed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            System.err.println("Error executing workflow: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("error", "Failed to execute workflow: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get workflow execution result
     */
    @GetMapping("/executions/{executionId}")
    public ResponseEntity<Map<String, Object>> getExecutionResult(@PathVariable String executionId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            WorkflowExecutionResult result = workflowService.getExecutionResult(executionId);
            
            if (result == null) {
                response.put("success", false);
                response.put("error", "Execution result not found: " + executionId);
                return ResponseEntity.notFound().build();
            }
            
            response.put("success", true);
            response.put("executionResult", result);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error getting execution result: " + e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to get execution result: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get all execution results
     */
    @GetMapping("/executions")
    public ResponseEntity<Map<String, Object>> getAllExecutionResults() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<WorkflowExecutionResult> results = workflowService.getAllExecutionResults();
            
            response.put("success", true);
            response.put("executions", results);
            response.put("count", results.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error getting execution results: " + e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to get execution results: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get workflow execution status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getWorkflowStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Workflow> workflows = workflowService.getAllWorkflows();
            List<WorkflowExecutionResult> executions = workflowService.getAllExecutionResults();
            
            response.put("success", true);
            response.put("status", "Workflow service is running");
            response.put("totalWorkflows", workflows.size());
            response.put("totalExecutions", executions.size());
            response.put("supportedStepTypes", new String[]{
                "DETECTION", "OCR", "QR_CODE", "IMAGE_PREPROCESSING", "VALIDATION"
            });
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error checking status: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

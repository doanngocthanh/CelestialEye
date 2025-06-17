package com.spring.ai.restai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spring.ai.restai.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service for managing and executing workflows
 */
@Service
public class WorkflowService {
    
    private final Map<String, Workflow> workflows = new ConcurrentHashMap<>();
    private final Map<String, WorkflowExecutionResult> executions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Path workflowStoragePath = Paths.get("workflows");
    
    @Autowired
    private DetectionService detectionService;
    
    @Autowired
    private OcrService ocrService;
    
    @Autowired
    private QrCodeService qrCodeService;
    
    public WorkflowService() {
        try {
            Files.createDirectories(workflowStoragePath);
            loadWorkflowsFromStorage();
            createDefaultWorkflows();
        } catch (Exception e) {
            System.err.println("Error initializing WorkflowService: " + e.getMessage());
        }
    }
    
    /**
     * Create a new workflow
     */
    public Workflow createWorkflow(Workflow workflow) {
        if (workflow.getId() == null || workflow.getId().trim().isEmpty()) {
            workflow.setId(generateWorkflowId());
        }
        
        workflow.touch();
        workflows.put(workflow.getId(), workflow);
        saveWorkflowToStorage(workflow);
        
        System.out.println("Created workflow: " + workflow);
        return workflow;
    }
    
    /**
     * Get all workflows
     */
    public List<Workflow> getAllWorkflows() {
        return new ArrayList<>(workflows.values());
    }
    
    /**
     * Get workflow by ID
     */
    public Workflow getWorkflow(String id) {
        return workflows.get(id);
    }
    
    /**
     * Update workflow
     */
    public Workflow updateWorkflow(String id, Workflow workflow) {
        if (!workflows.containsKey(id)) {
            throw new RuntimeException("Workflow not found: " + id);
        }
        
        workflow.setId(id);
        workflow.touch();
        workflows.put(id, workflow);
        saveWorkflowToStorage(workflow);
        
        System.out.println("Updated workflow: " + workflow);
        return workflow;
    }
    
    /**
     * Delete workflow
     */
    public void deleteWorkflow(String id) {
        Workflow workflow = workflows.remove(id);
        if (workflow != null) {
            deleteWorkflowFromStorage(id);
            System.out.println("Deleted workflow: " + id);
        }
    }
    
    /**
     * Execute workflow with image input
     */
    public WorkflowExecutionResult executeWorkflow(String workflowId, MultipartFile imageFile) {
        Workflow workflow = workflows.get(workflowId);
        if (workflow == null) {
            throw new RuntimeException("Workflow not found: " + workflowId);
        }
        
        if (!workflow.isActive()) {
            throw new RuntimeException("Workflow is not active: " + workflowId);
        }
        
        String executionId = generateExecutionId();
        WorkflowExecutionResult result = new WorkflowExecutionResult(workflowId, workflow.getName(), executionId);
        executions.put(executionId, result);
        
        System.out.println("Starting workflow execution: " + executionId + " for workflow: " + workflowId);
        
        try {
            // Load and validate input image
            BufferedImage image = ImageIO.read(imageFile.getInputStream());
            if (image == null) {
                throw new RuntimeException("Invalid image file");
            }
            
            // Sort steps by order
            List<WorkflowStep> sortedSteps = workflow.getSteps().stream()
                .filter(WorkflowStep::isEnabled)
                .sorted(Comparator.comparingInt(WorkflowStep::getOrder))
                .collect(Collectors.toList());
            
            Object currentData = imageFile; // Start with the original image file
            
            // Execute each step
            for (WorkflowStep step : sortedSteps) {
                WorkflowStepExecution stepExecution = new WorkflowStepExecution(
                    step.getId(), step.getName(), step.getType());
                stepExecution.setInput(getDataSummary(currentData));
                stepExecution.start();
                
                try {
                    // Validate input data for this step
                    if (!validateStepInput(step, currentData)) {
                        stepExecution.skip("Input validation failed");
                        result.addStepExecution(stepExecution);
                        continue;
                    }
                      // Set input data for tracking
                    stepExecution.setInput(getDataSummary(currentData));
                    
                    // Execute the step
                    Object stepOutput = executeWorkflowStep(step, currentData, imageFile);
                    
                    // Validate output data
                    if (!validateStepOutput(step, stepOutput)) {
                        stepExecution.error("Output validation failed");
                        result.addStepExecution(stepExecution);
                        break; // Stop execution on validation failure
                    }
                    
                    stepExecution.success(getDataSummary(stepOutput));
                    currentData = stepOutput; // Pass output to next step
                    
                } catch (Exception e) {
                    System.err.println("Error executing step " + step.getId() + ": " + e.getMessage());
                    stepExecution.error(e.getMessage());
                    result.addStepExecution(stepExecution);
                    break; // Stop execution on error
                }
                
                result.addStepExecution(stepExecution);
            }
              result.setFinalOutput(getDataSummary(currentData));
            result.complete();
            
        } catch (Exception e) {
            System.err.println("Error executing workflow: " + e.getMessage());
            result.setErrorMessage(e.getMessage());
            result.setStatus("ERROR");
            result.complete();
        }
        
        System.out.println("Completed workflow execution: " + result);
        return result;
    }
    
    /**
     * Get workflow execution result
     */
    public WorkflowExecutionResult getExecutionResult(String executionId) {
        return executions.get(executionId);
    }
    
    /**
     * Get all execution results
     */
    public List<WorkflowExecutionResult> getAllExecutionResults() {
        return new ArrayList<>(executions.values());
    }
    
    /**
     * Execute a single workflow step
     */
    private Object executeWorkflowStep(WorkflowStep step, Object inputData, MultipartFile originalImage) throws Exception {
        System.out.println("Executing step: " + step.getId() + " (" + step.getType() + ")");
        
        switch (step.getType()) {
            case "DETECTION":
                return executeDetectionStep(step, originalImage);
                
            case "OCR":
                return executeOcrStep(step, originalImage);
                
            case "QR_CODE":
                return executeQrCodeStep(step, originalImage);
                
            case "IMAGE_PREPROCESSING":
                return executeImagePreprocessingStep(step, inputData);
                
            case "VALIDATION":
                return executeValidationStep(step, inputData);
                
            default:
                throw new RuntimeException("Unknown step type: " + step.getType());
        }
    }
      /**
     * Execute detection step
     */
    private Object executeDetectionStep(WorkflowStep step, MultipartFile imageFile) throws Exception {
        Map<String, Object> params = step.getParameters();
        String modelName = (String) params.get("modelName");
        
        if (modelName == null || modelName.trim().isEmpty()) {
            throw new RuntimeException("Model name is required for detection step");
        }
        
        return detectionService.detect(modelName, imageFile, null, null);
    }
    
    /**
     * Execute OCR step  
     */
    private Object executeOcrStep(WorkflowStep step, MultipartFile imageFile) throws Exception {
        Map<String, Object> params = step.getParameters();
        String modelName = (String) params.get("modelName");
        
        if (modelName == null || modelName.trim().isEmpty()) {
            throw new RuntimeException("Model name is required for OCR step");
        }
        
        return ocrService.performOcrDetection(imageFile, modelName);
    }
    
    /**
     * Execute QR code step
     */
    private Object executeQrCodeStep(WorkflowStep step, MultipartFile imageFile) throws Exception {
        return qrCodeService.detectQrCodes(imageFile);
    }
    
    /**
     * Execute image preprocessing step
     */
    private Object executeImagePreprocessingStep(WorkflowStep step, Object inputData) throws Exception {
        // Placeholder for image preprocessing operations
        // Could include: resize, crop, rotate, enhance, filter, etc.
        Map<String, Object> params = step.getParameters();
        String operation = (String) params.get("operation");
        
        System.out.println("Image preprocessing: " + operation);
        // For now, just pass through the data
        return inputData;
    }
    
    /**
     * Execute validation step
     */
    private Object executeValidationStep(WorkflowStep step, Object inputData) throws Exception {
        Map<String, Object> params = step.getParameters();
        String validationType = (String) params.get("validationType");
        
        System.out.println("Validation: " + validationType);
        
        // Implement various validation types
        switch (validationType) {
            case "CCCD_COMPLETENESS":
                return validateCccdCompleteness(inputData);
            case "DETECTION_CONFIDENCE":
                return validateDetectionConfidence(inputData, params);
            default:
                return inputData; // Pass through if no specific validation
        }
    }
    
    // Validation methods will be implemented here
    private boolean validateStepInput(WorkflowStep step, Object inputData) {
        // Implement input validation logic based on step requirements
        return true; // Simplified for now
    }
    
    private boolean validateStepOutput(WorkflowStep step, Object outputData) {
        // Implement output validation logic
        return true; // Simplified for now
    }
    
    private Object validateCccdCompleteness(Object inputData) {
        // Validate CCCD data completeness
        return inputData;
    }
    
    private Object validateDetectionConfidence(Object inputData, Map<String, Object> params) {
        // Validate detection confidence levels
        return inputData;
    }    private Object getDataSummary(Object data) {
        if (data == null) return null;
        
        // Create a detailed summary of the data for logging/display purposes
        Map<String, Object> summary = new HashMap<>();
        summary.put("type", data.getClass().getSimpleName());
        summary.put("timestamp", LocalDateTime.now());
        
        if (data instanceof DetectionResult) {
            DetectionResult dr = (DetectionResult) data;
            summary.put("detectionsCount", dr.getDetections() != null ? dr.getDetections().size() : 0);
            summary.put("processingTime", dr.getProcessingTime());
            summary.put("modelName", dr.getModelName());
            summary.put("imageInfo", dr.getImageWidth() + "x" + dr.getImageHeight());
            
            // Add detection details
            if (dr.getDetections() != null && !dr.getDetections().isEmpty()) {
                List<Map<String, Object>> detectionDetails = new ArrayList<>();
                dr.getDetections().forEach(detection -> {
                    Map<String, Object> detDetail = new HashMap<>();
                    detDetail.put("className", detection.getClassName());
                    detDetail.put("confidence", Math.round(detection.getConfidence() * 1000.0) / 1000.0);
                    detDetail.put("bbox", String.format("[%.0f,%.0f,%.0f,%.0f]", 
                        detection.getX1(), detection.getY1(), detection.getX2(), detection.getY2()));
                    detectionDetails.add(detDetail);
                });
                summary.put("detectionDetails", detectionDetails);
            }
              } else if (data instanceof OcrDetectionResponse) {
            OcrDetectionResponse ocr = (OcrDetectionResponse) data;
            summary.put("ocrResultsCount", ocr.getResults() != null ? ocr.getResults().size() : 0);
            summary.put("processingTime", ocr.getProcessingTimeMs());
            summary.put("modelName", ocr.getModelName());
            summary.put("imageInfo", ocr.getImageInfo());
            summary.put("hasCccdInfo", ocr.getCccdInfo() != null);
            
            // Add OCR details
            if (ocr.getResults() != null && !ocr.getResults().isEmpty()) {
                List<Map<String, Object>> ocrDetails = new ArrayList<>();
                ocr.getResults().forEach(ocrResult -> {
                    Map<String, Object> ocrDetail = new HashMap<>();
                    ocrDetail.put("text", ocrResult.getText());
                    ocrDetail.put("confidence", Math.round(ocrResult.getConfidence() * 1000.0) / 1000.0);
                    ocrDetail.put("className", ocrResult.getClassName());
                    if (ocrResult.getBoundingBox() != null) {
                        ocrDetail.put("bbox", String.format("[%.0f,%.0f,%.0f,%.0f]", 
                            ocrResult.getBoundingBox().getX1(), ocrResult.getBoundingBox().getY1(), 
                            ocrResult.getBoundingBox().getX2(), ocrResult.getBoundingBox().getY2()));
                    }
                    ocrDetails.add(ocrDetail);
                });
                summary.put("ocrDetails", ocrDetails);
            }
            
            // Add CCCD info if available
            if (ocr.getCccdInfo() != null) {
                Map<String, Object> cccdDetail = new HashMap<>();
                CccdInfo cccd = ocr.getCccdInfo();
                cccdDetail.put("id", cccd.getId());
                cccdDetail.put("name", cccd.getName());
                cccdDetail.put("birth", cccd.getBirth());
                cccdDetail.put("sex", cccd.getSex());
                cccdDetail.put("nationality", cccd.getNationality());
                cccdDetail.put("place_of_origin", cccd.getPlace_of_origin());
                cccdDetail.put("place_of_residence", cccd.getPlace_of_residence());
                cccdDetail.put("expiry", cccd.getExpiry());
                summary.put("cccdInfo", cccdDetail);
            }
            
        } else if (data instanceof QrCodeDetectionResponse) {
            QrCodeDetectionResponse qr = (QrCodeDetectionResponse) data;
            summary.put("qrCodesCount", qr.getTotalQrCodes());
            summary.put("processingTime", qr.getProcessingTimeMs());
            summary.put("imageInfo", qr.getImageInfo());
            
            // Add QR code details
            if (qr.getQrCodes() != null && !qr.getQrCodes().isEmpty()) {
                List<Map<String, Object>> qrDetails = new ArrayList<>();
                qr.getQrCodes().forEach(qrCode -> {
                    Map<String, Object> qrDetail = new HashMap<>();
                    qrDetail.put("content", qrCode.getContent());
                    qrDetail.put("type", qrCode.getType());
                    qrDetail.put("confidence", Math.round(qrCode.getConfidence() * 1000.0) / 1000.0);
                    if (qrCode.getBoundingBox() != null) {
                        qrDetail.put("bbox", String.format("[%.0f,%.0f,%.0fx%.0f]", 
                            qrCode.getBoundingBox().getX(), qrCode.getBoundingBox().getY(),
                            qrCode.getBoundingBox().getWidth(), qrCode.getBoundingBox().getHeight()));
                    }
                    
                    // Add CCCD info if QR code contains CCCD data
                    if (qrCode.getCccdInfo() != null) {
                        Map<String, Object> cccdDetail = new HashMap<>();
                        CccdInfo cccd = qrCode.getCccdInfo();
                        cccdDetail.put("id", cccd.getId());
                        cccdDetail.put("name", cccd.getName());
                        cccdDetail.put("birth", cccd.getBirth());
                        cccdDetail.put("sex", cccd.getSex());
                        cccdDetail.put("nationality", cccd.getNationality());
                        cccdDetail.put("place_of_origin", cccd.getPlace_of_origin());
                        cccdDetail.put("place_of_residence", cccd.getPlace_of_residence());
                        cccdDetail.put("expiry", cccd.getExpiry());
                        qrDetail.put("cccdInfo", cccdDetail);
                    }
                    
                    qrDetails.add(qrDetail);
                });
                summary.put("qrCodeDetails", qrDetails);
            }
            
        } else if (data instanceof MultipartFile) {
            MultipartFile file = (MultipartFile) data;
            summary.put("fileName", file.getOriginalFilename());
            summary.put("fileSize", file.getSize());
            summary.put("contentType", file.getContentType());
        } else {
            // For other types, just include basic info
            summary.put("toString", data.toString());
        }
        
        return summary;
    }
    
    // Utility methods
    private String generateWorkflowId() {
        return "workflow_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }
    
    private String generateExecutionId() {
        return "exec_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }
    
    // Storage methods
    private void loadWorkflowsFromStorage() {
        // Implementation for loading workflows from file storage
    }
    
    private void saveWorkflowToStorage(Workflow workflow) {
        // Implementation for saving workflow to file storage
    }
    
    private void deleteWorkflowFromStorage(String workflowId) {
        // Implementation for deleting workflow from file storage
    }
    
    private void createDefaultWorkflows() {
        // Create some default workflow templates
        createCccdProcessingWorkflow();
        createGeneralDocumentWorkflow();
    }
    
    private void createCccdProcessingWorkflow() {
        List<WorkflowStep> steps = new ArrayList<>();
        
        // Step 1: CCCD Detection
        Map<String, Object> detectionParams = new HashMap<>();
        detectionParams.put("modelName", "DetectCCCD");
        steps.add(new WorkflowStep("step1", "Detect CCCD", "DETECTION", 
            "Detect CCCD card in image", detectionParams, 1));
        
        // Step 2: OCR Processing
        Map<String, Object> ocrParams = new HashMap<>();
        ocrParams.put("modelName", "DetectCCCD");
        steps.add(new WorkflowStep("step2", "Extract Text", "OCR", 
            "Extract text from CCCD fields", ocrParams, 2));
        
        // Step 3: QR Code Detection
        Map<String, Object> qrParams = new HashMap<>();
        steps.add(new WorkflowStep("step3", "Read QR Code", "QR_CODE", 
            "Read QR code on CCCD", qrParams, 3));
        
        // Step 4: Validation
        Map<String, Object> validationParams = new HashMap<>();
        validationParams.put("validationType", "CCCD_COMPLETENESS");
        steps.add(new WorkflowStep("step4", "Validate Data", "VALIDATION", 
            "Validate CCCD data completeness", validationParams, 4));
        
        Workflow cccdWorkflow = new Workflow("cccd_processing", "CCCD Processing", 
            "Complete CCCD processing workflow with detection, OCR, and QR code reading", steps);
        
        workflows.put(cccdWorkflow.getId(), cccdWorkflow);
        System.out.println("Created default CCCD processing workflow");
    }
    
    private void createGeneralDocumentWorkflow() {
        List<WorkflowStep> steps = new ArrayList<>();
        
        // Step 1: Document Detection
        Map<String, Object> detectionParams = new HashMap<>();
        detectionParams.put("modelName", "DetectCCCD");
        steps.add(new WorkflowStep("step1", "Detect Document", "DETECTION", 
            "Detect document in image", detectionParams, 1));
        
        // Step 2: OCR Processing
        Map<String, Object> ocrParams = new HashMap<>();
        ocrParams.put("modelName", "DetectCCCD");
        steps.add(new WorkflowStep("step2", "Extract Text", "OCR", 
            "Extract text from document", ocrParams, 2));
        
        Workflow docWorkflow = new Workflow("general_document", "General Document Processing", 
            "General document processing with detection and OCR", steps);
        
        workflows.put(docWorkflow.getId(), docWorkflow);
        System.out.println("Created default general document workflow");
    }
}

package com.spring.ai.restai.controller;

import com.spring.ai.restai.dto.DetailedBarcodeResult;
import com.spring.ai.restai.service.BarcodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/barcode")
@CrossOrigin(origins = "*")
public class BarCodeController {

    @Autowired
    private BarcodeService barcodeService;

    /**
     * Process document (PDF/TIFF/Image) and detect barcodes
     */
    @PostMapping("/process")
    public ResponseEntity<?> processDocument(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("\n=== Starting new document processing request ===");
            System.out.println("File name: " + file.getOriginalFilename());
            System.out.println("File size: " + file.getSize() + " bytes");
            System.out.println("Content type: " + file.getContentType());

            if (file.isEmpty()) {
                System.out.println("Error: Empty file received");
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "No file uploaded"));
            }

            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/")
                    && !contentType.equals("application/pdf")
                    && !contentType.equals("image/tiff"))) {
                System.out.println("Error: Unsupported content type: " + contentType);
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Unsupported file type. Please upload an image, PDF, or TIFF file"));
            }

            List<DetailedBarcodeResult> allResults = barcodeService.processDocument(file);
            System.out.println("Service returned " + allResults.size() + " results");

            // Filter out pages with no barcode detected
            List<DetailedBarcodeResult> validResults = allResults.stream()
                    .filter(result -> result.getBarcodes() != null && !result.getBarcodes().isEmpty())
                    .toList();

            // If no barcodes found in any page
            if (validResults.isEmpty()) {
                System.out.println("No valid barcodes found in any page");
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "No barcodes detected in document",
                        "totalPages", allResults.size(),
                        "results", List.of()));
            }

            // Calculate total barcodes found
            int totalBarcodes = validResults.stream()
                    .mapToInt(result -> result.getBarcodes().size())
                    .sum();

            System.out.println("Found total of " + totalBarcodes + " barcodes in " + validResults.size() +
                    " pages (from " + allResults.size() + " total pages)");

            // Log detailed results
            for (DetailedBarcodeResult result : validResults) {
                System.out.println("Page " + result.getPageNumber() + ": " +
                        result.getBarcodes().size() + " barcode(s)");
                for (DetailedBarcodeResult.BarcodeInfo barcode : result.getBarcodes()) {
                    System.out.println("  - " + barcode.getContent() + " (" + barcode.getFormat() +
                            "), confidence: " + barcode.getConfidence());
                }
            }

            System.out.println("=== Document processing completed ===\n");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "totalPages", allResults.size(),
                    "detectedPages", validResults.size(),
                    "totalBarcodes", totalBarcodes,
                    "results", validResults));

        } catch (Exception e) {
            System.err.println("Error processing document: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Error processing document: " + e.getMessage()));
        }
    }
}

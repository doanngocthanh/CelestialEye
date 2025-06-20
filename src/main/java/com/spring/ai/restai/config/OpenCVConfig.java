package com.spring.ai.restai.config;

import org.opencv.core.Core;
import org.opencv.objdetect.CascadeClassifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class OpenCVConfig {
    private Path tempDir;
    private File tempFile;
    private CascadeClassifier classifier;

    @PostConstruct
    public void init() {
        try {
            System.out.println("Loading OpenCV native library...");
            nu.pattern.OpenCV.loadLocally();
            // Verify OpenCV is loaded by accessing a core class
            String openCVVersion = Core.getVersionString();
            System.out.println("OpenCV native library loaded successfully. Version: " + openCVVersion);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load OpenCV native library", e);
        }
    }

    @Bean
    public CascadeClassifier cascadeClassifier() throws IOException {
        System.out.println("Initializing CascadeClassifier...");

        try {
            // Create temp directory
            tempDir = Files.createTempDirectory("opencv");
            tempFile = tempDir.resolve("cascade.xml").toFile();
            tempFile.deleteOnExit();

            // Load cascade file from classpath
            ClassPathResource resource = new ClassPathResource("haarcascade_frontalface_default.xml");
            if (!resource.exists()) {
                throw new IOException("Cascade classifier file not found in resources");
            }

            // Copy to temp file using Spring's StreamUtils
            try (InputStream is = resource.getInputStream();
                    FileOutputStream os = new FileOutputStream(tempFile)) {
                StreamUtils.copy(is, os);
            }

            System.out.println("Copied cascade file to: " + tempFile.getAbsolutePath());

            // Verify the temp file exists and has content
            if (!tempFile.exists() || tempFile.length() == 0) {
                throw new IOException("Failed to create temporary cascade file");
            }

            // Create and initialize classifier
            classifier = new CascadeClassifier();
            boolean loaded = classifier.load(tempFile.getAbsolutePath());

            if (!loaded || classifier.empty()) {
                throw new IOException("Failed to load cascade classifier from file: " + tempFile.getAbsolutePath());
            }

            System.out.println("CascadeClassifier initialized successfully");
            return classifier;
        } catch (Exception e) {
            cleanup();
            throw new IOException("Failed to initialize CascadeClassifier", e);
        }
    }

    @PreDestroy
    public void cleanup() {
        System.out.println("Cleaning up OpenCV resources...");
        try {
            if (classifier != null) {
                classifier = null; // Help GC
            }
            if (tempFile != null && tempFile.exists()) {
                Files.delete(tempFile.toPath());
            }
            if (tempDir != null && Files.exists(tempDir)) {
                Files.delete(tempDir);
            }
        } catch (IOException e) {
            System.err.println("Error cleaning up temporary files: " + e.getMessage());
        }
    }
}

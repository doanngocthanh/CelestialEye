package com;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;
import javax.imageio.ImageIO;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;

public class main {
    public static void main(String[] args) {
        System.out.println("Starting YOLOv8 ONNX Detection...");
        
        // YOLO model parameters
        final int TARGET_WIDTH = 640;
        final int TARGET_HEIGHT = 640;
        final int CHANNELS = 3;
        final float CONF_THRESHOLD = 0.25f;
        final float NMS_THRESHOLD = 0.45f;
        
        // ImageNet normalization parameters (commonly used for YOLOv8)
        final float[] MEAN = {0.0f, 0.0f, 0.0f}; // Some YOLOv8 models don't use normalization
        final float[] STD = {1.0f, 1.0f, 1.0f};   // Try {0.229f, 0.224f, 0.225f} if needed
        
        try (OrtEnvironment env = OrtEnvironment.getEnvironment();
             OrtSession session = env.createSession(
                     "C:\\WorkSpace\\SpringAI\\restai\\src\\main\\resources\\model\\detect_card.onnx",
                     new OrtSession.SessionOptions())) {
            
            System.out.println("ONNX model loaded successfully.");
            
            // Print model info
            System.out.println("Input names: " + session.getInputNames());
            System.out.println("Output names: " + session.getOutputNames());
            
            // Load and preprocess image
            BufferedImage originalImage = ImageIO.read(
                    new File("C:\\Users\\0100644068\\Pictures\\Screenshots\\111.png"));
            
            System.out.println("Original image size: " + originalImage.getWidth() + "x" + originalImage.getHeight());
            
            // Resize image with high quality
            BufferedImage resizedImage = resizeImage(originalImage, TARGET_WIDTH, TARGET_HEIGHT);
            
            // Convert image to tensor data (NCHW format)
            float[] inputData = imageToTensorData(resizedImage, MEAN, STD);
            
            // Create ONNX tensor
            long[] shape = new long[]{1, CHANNELS, TARGET_HEIGHT, TARGET_WIDTH}; // NCHW
            
            try (OnnxTensor tensor = OnnxTensor.createTensor(env, java.nio.FloatBuffer.wrap(inputData), shape)) {
                
                System.out.println("Input tensor shape: " + Arrays.toString(tensor.getInfo().getShape()));
                
                // Prepare input map
                String inputName = session.getInputNames().iterator().next();
                Map<String, OnnxTensor> inputMap = Collections.singletonMap(inputName, tensor);
                
                // Run inference
                long startTime = System.currentTimeMillis();
                OrtSession.Result result = session.run(inputMap);
                long endTime = System.currentTimeMillis();
                
                System.out.println("Inference time: " + (endTime - startTime) + "ms");
                
                // Process output
                String outputName = session.getOutputNames().iterator().next();
                Object outputValue = result.get(outputName);

                // Handle Optional output
                if (outputValue instanceof java.util.Optional) {
                    java.util.Optional<?> optional = (java.util.Optional<?>) outputValue;
                    if (optional.isPresent() && optional.get() instanceof OnnxTensor) {
                        OnnxTensor outputTensor = (OnnxTensor) optional.get();
                        long[] outputShape = outputTensor.getInfo().getShape();
                        System.out.println("Output shape: " + Arrays.toString(outputShape));

                        processYOLOv8Output(outputTensor, originalImage.getWidth(), originalImage.getHeight(),
                                TARGET_WIDTH, TARGET_HEIGHT, CONF_THRESHOLD);
                        outputTensor.close();
                    } else {
                        System.out.println("Optional output is empty or not an OnnxTensor.");
                    }
                } else if (outputValue instanceof OnnxTensor) {
                    OnnxTensor outputTensor = (OnnxTensor) outputValue;
                    long[] outputShape = outputTensor.getInfo().getShape();
                    System.out.println("Output shape: " + Arrays.toString(outputShape));

                    processYOLOv8Output(outputTensor, originalImage.getWidth(), originalImage.getHeight(),
                            TARGET_WIDTH, TARGET_HEIGHT, CONF_THRESHOLD);
                    outputTensor.close();
                } else {
                    System.out.println("Unexpected output type: " + outputValue.getClass());
                }
                
                result.close();
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Resize image with high quality
     */
    private static BufferedImage resizeImage(BufferedImage original, int targetWidth, int targetHeight) {
        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resized.createGraphics();
        
        // Set high quality rendering hints
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        
        g2d.drawImage(original, 0, 0, targetWidth, targetHeight, null);
        g2d.dispose();
        
        return resized;
    }
    
    /**
     * Convert BufferedImage to tensor data in NCHW format
     */
    private static float[] imageToTensorData(BufferedImage image, float[] mean, float[] std) {
        int width = image.getWidth();
        int height = image.getHeight();
        int channels = 3;
        
        float[] tensorData = new float[channels * height * width];
        int idx = 0;
        
        // Convert to NCHW format: [Batch, Channel, Height, Width]
        for (int c = 0; c < channels; c++) {
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int rgb = image.getRGB(x, y);
                    float value;
                    
                    // Extract RGB values
                    if (c == 0) {
                        value = ((rgb >> 16) & 0xFF) / 255.0f; // R
                    } else if (c == 1) {
                        value = ((rgb >> 8) & 0xFF) / 255.0f;  // G
                    } else {
                        value = (rgb & 0xFF) / 255.0f;         // B
                    }
                    
                    // Apply normalization if needed
                    value = (value - mean[c]) / std[c];
                    tensorData[idx++] = value;
                }
            }
        }
        
        return tensorData;
    }
    
    /**
     * Process YOLOv8 output tensor
     */
    private static void processYOLOv8Output(OnnxTensor outputTensor, int originalWidth, int originalHeight,
                                          int modelWidth, int modelHeight, float confThreshold) {
        try {
            long[] shape = outputTensor.getInfo().getShape();
            System.out.println("Processing output with shape: " + Arrays.toString(shape));
            
            // YOLOv8 output format is typically [1, 84, 8400] or [1, num_classes+4, num_detections]
            // where 84 = 4 (bbox) + 80 (COCO classes) for COCO-trained models
            
            if (shape.length == 3) {
                float[][][] output = (float[][][]) outputTensor.getValue();
                processDetections(output[0], originalWidth, originalHeight, modelWidth, modelHeight, confThreshold);
            } else if (shape.length == 2) {
                float[][] output = (float[][]) outputTensor.getValue();
                processDetections(output, originalWidth, originalHeight, modelWidth, modelHeight, confThreshold);
            } else {
                System.out.println("Unsupported output shape format");
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Process detections from YOLOv8 output
     */
    private static void processDetections(float[][] detections, int originalWidth, int originalHeight,
                                        int modelWidth, int modelHeight, float confThreshold) {
        
        // Calculate scale factors for coordinate conversion
        float scaleX = (float) originalWidth / modelWidth;
        float scaleY = (float) originalHeight / modelHeight;
        
        int numDetections = detections[0].length; // Number of detections
        int numClasses = detections.length - 4;   // Number of classes (total - 4 bbox coords)
        
        System.out.println("Number of detections: " + numDetections);
        System.out.println("Number of classes: " + numClasses);
        
        int validDetections = 0;
        
        for (int i = 0; i < numDetections; i++) {
            // Extract bbox coordinates (center format)
            float centerX = detections[0][i];
            float centerY = detections[1][i];
            float width = detections[2][i];
            float height = detections[3][i];
            
            // Find the class with highest confidence
            int bestClass = 0;
            float maxClassConf = detections[4][i]; // First class confidence
            
            for (int c = 1; c < numClasses; c++) {
                float classConf = detections[4 + c][i];
                if (classConf > maxClassConf) {
                    maxClassConf = classConf;
                    bestClass = c;
                }
            }
            
            // Apply confidence threshold
            if (maxClassConf > confThreshold) {
                // Convert from center format to corner format
                float x1 = (centerX - width / 2) * scaleX;
                float y1 = (centerY - height / 2) * scaleY;
                float x2 = (centerX + width / 2) * scaleX;
                float y2 = (centerY + height / 2) * scaleY;
                
                // Ensure coordinates are within image bounds
                x1 = Math.max(0, Math.min(x1, originalWidth));
                y1 = Math.max(0, Math.min(y1, originalHeight));
                x2 = Math.max(0, Math.min(x2, originalWidth));
                y2 = Math.max(0, Math.min(y2, originalHeight));
                
                System.out.printf("Detection %d: [x1=%.1f, y1=%.1f, x2=%.1f, y2=%.1f, conf=%.3f, class=%d]%n",
                        validDetections + 1, x1, y1, x2, y2, maxClassConf, bestClass);
                
                validDetections++;
            }
        }
        
        System.out.println("Total valid detections: " + validDetections);
    }
    
    /**
     * Alternative processing for different output format
     */
    private static void processDetections(float[] flatOutput, int originalWidth, int originalHeight,
                                        int modelWidth, int modelHeight, float confThreshold) {
        System.out.println("Processing flat output array of length: " + flatOutput.length);
        
        // This method would need to be implemented based on your specific model's output format
        // You might need to reshape the flat array based on the model's expected output structure
    }
}
package com.spring.ai.restai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spring.ai.restai.dto.FaceData;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.objdetect.CascadeClassifier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
public class FaceService {
    private static final String FACE_DATA_DIR = "face_data";
    private static final float SIMILARITY_THRESHOLD = 0.6f;
    
    private final CascadeClassifier faceDetector;
    private final ObjectMapper objectMapper;
    private final Path dataDirectory;
    
    @Autowired
    public FaceService(CascadeClassifier cascadeClassifier) throws Exception {
        System.out.println("Initializing FaceService...");
        
        this.faceDetector = cascadeClassifier;
        this.objectMapper = new ObjectMapper();
        this.dataDirectory = Paths.get(FACE_DATA_DIR);
        Files.createDirectories(this.dataDirectory);
        
        System.out.println("FaceService initialized successfully");
    }    public FaceData registerFace(MultipartFile imageFile, String personName) throws Exception {
        System.out.println("=== Face Registration Started ===");
        System.out.println("Person name: " + personName);
        System.out.println("Image file size: " + imageFile.getSize() + " bytes");
        
        Mat image = Imgcodecs.imdecode(new MatOfByte(imageFile.getBytes()), Imgcodecs.IMREAD_COLOR);
        System.out.println("Image loaded: " + !image.empty() + ", size: " + image.size());
        
        MatOfRect faces = new MatOfRect();
        
        // Detect face
        faceDetector.detectMultiScale(image, faces);
        System.out.println("Faces detected: " + faces.toArray().length);
        
        if (faces.empty()) {
            throw new RuntimeException("Không phát hiện được khuôn mặt trong ảnh");
        }
        
        // Get the largest face
        Rect[] facesArray = faces.toArray();
        Rect largestFace = Arrays.stream(facesArray)
                .max(Comparator.comparingDouble(r -> r.width * r.height))
                .orElseThrow();
        
        // Extract face embedding
        List<Float> embedding = extractFaceEmbedding(image, largestFace);
        
        // Create face data
        FaceData faceData = new FaceData();
        faceData.setId(UUID.randomUUID().toString());
        faceData.setPersonName(personName);
        faceData.setFaceEmbedding(embedding);
        
        FaceData.BoundingBox boundingBox = new FaceData.BoundingBox();
        boundingBox.setX(largestFace.x);
        boundingBox.setY(largestFace.y);
        boundingBox.setWidth(largestFace.width);
        boundingBox.setHeight(largestFace.height);
        faceData.setBoundingBox(boundingBox);
        
        faceData.setTimestamp(System.currentTimeMillis());
          // Save face data
        saveFaceData(faceData);
        
        System.out.println("Face registration completed successfully for: " + personName);
        return faceData;
    }    public FaceData authenticateFace(MultipartFile imageFile) throws Exception {
        System.out.println("=== Face Authentication Started ===");
        System.out.println("Image file size: " + imageFile.getSize() + " bytes");
        
        Mat image = Imgcodecs.imdecode(new MatOfByte(imageFile.getBytes()), Imgcodecs.IMREAD_COLOR);
        System.out.println("Image loaded: " + !image.empty() + ", size: " + image.size());
        
        MatOfRect faces = new MatOfRect();
        
        // Detect face
        faceDetector.detectMultiScale(image, faces);
        System.out.println("Faces detected: " + faces.toArray().length);
        
        if (faces.empty()) {
            throw new RuntimeException("Không phát hiện được khuôn mặt trong ảnh");
        }
        
        // Get the largest face
        Rect[] facesArray = faces.toArray();
        Rect largestFace = Arrays.stream(facesArray)
                .max(Comparator.comparingDouble(r -> r.width * r.height))
                .orElseThrow();
        
        // Extract face embedding
        List<Float> embedding = extractFaceEmbedding(image, largestFace);
          // Find best match
        FaceData bestMatch = findBestMatch(embedding);        if (bestMatch != null) {
            System.out.println("Face authentication successful for: " + bestMatch.getPersonName());
            return bestMatch;
        }
        
        throw new RuntimeException("Không tìm thấy khuôn mặt phù hợp trong hệ thống");
    }
      private List<Float> extractFaceEmbedding(Mat image, Rect face) {
        // Extract face region
        Mat faceRegion = new Mat(image, face);
        
        // Convert to grayscale
        Mat grayFace = new Mat();
        Imgproc.cvtColor(faceRegion, grayFace, Imgproc.COLOR_BGR2GRAY);
        
        // Resize to standard size
        Mat resized = new Mat();
        Imgproc.resize(grayFace, resized, new Size(64, 64));
        
        // Normalize pixel values
        Mat normalized = new Mat();
        Core.normalize(resized, normalized, 0, 1, Core.NORM_MINMAX, CvType.CV_32F);
        
        // Convert to simple feature vector
        List<Float> embedding = new ArrayList<>();
        for (int y = 0; y < normalized.rows(); y++) {
            for (int x = 0; x < normalized.cols(); x++) {
                embedding.add((float) normalized.get(y, x)[0]);
            }
        }
        
        return embedding;
    }
    
    private void saveFaceData(FaceData faceData) throws Exception {
        Path filePath = dataDirectory.resolve(faceData.getId() + ".json");
        objectMapper.writeValue(filePath.toFile(), faceData);
    }
    
    private FaceData findBestMatch(List<Float> targetEmbedding) throws Exception {
        FaceData bestMatch = null;
        float bestSimilarity = SIMILARITY_THRESHOLD;
        
        // Load and compare with all stored faces
        try (var files = Files.list(dataDirectory)) {
            for (Path file : files.toList()) {
                if (file.toString().endsWith(".json")) {
                    FaceData storedFace = objectMapper.readValue(file.toFile(), FaceData.class);
                    float similarity = calculateCosineSimilarity(targetEmbedding, storedFace.getFaceEmbedding());
                    
                    if (similarity > bestSimilarity) {
                        bestSimilarity = similarity;
                        bestMatch = storedFace;
                    }
                }
            }
        }
        
        return bestMatch;
    }
    
    private float calculateCosineSimilarity(List<Float> vec1, List<Float> vec2) {
        float dotProduct = 0.0f;
        float norm1 = 0.0f;
        float norm2 = 0.0f;
        
        for (int i = 0; i < vec1.size(); i++) {
            dotProduct += vec1.get(i) * vec2.get(i);
            norm1 += vec1.get(i) * vec1.get(i);
            norm2 += vec2.get(i) * vec2.get(i);
        }
        
        return dotProduct / (float) Math.sqrt(norm1 * norm2);
    }
    
    public List<FaceData> getAllFaces() throws Exception {
        List<FaceData> faces = new ArrayList<>();
        try (var files = Files.list(dataDirectory)) {
            for (Path file : files.toList()) {
                if (file.toString().endsWith(".json")) {
                    faces.add(objectMapper.readValue(file.toFile(), FaceData.class));
                }
            }
        }
        return faces;
    }
}

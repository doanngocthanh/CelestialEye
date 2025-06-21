package com.spring.ai.restai.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spring.ai.restai.service.FaceService;
import com.spring.ai.restai.dto.FaceData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class FaceStreamingHandler extends AbstractWebSocketHandler {

    @Autowired
    private FaceService faceService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<WebSocketSession, String> sessionModes = new ConcurrentHashMap<>();

    public FaceStreamingHandler() {
        System.out.println("FaceStreamingHandler created!");
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("WebSocket connection established. Session ID: " + session.getId());
        sessionModes.put(session, "authenticate"); // Default mode is authenticate
    }

    @Override
    public void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
        byte[] imageData = message.getPayload().array();

        // Create a custom MultipartFile implementation
        MultipartFile multipartFile = new MultipartFile() {
            @Override
            public String getName() {
                return "image";
            }

            @Override
            public String getOriginalFilename() {
                return "stream.jpg";
            }

            @Override
            public String getContentType() {
                return "image/jpeg";
            }

            @Override
            public boolean isEmpty() {
                return imageData.length == 0;
            }

            @Override
            public long getSize() {
                return imageData.length;
            }

            @Override
            public byte[] getBytes() {
                return imageData;
            }

            @Override
            public InputStream getInputStream() {
                return new ByteArrayInputStream(imageData);
            }

            @Override
            public void transferTo(java.io.File dest) throws java.io.IOException {
                throw new UnsupportedOperationException("transferTo() is not supported");
            }
        };

        try {
            String mode = sessionModes.get(session);
            Map<String, Object> response;

            if ("register".equals(mode)) {
                String personName = (String) session.getAttributes().get("personName");
                FaceData faceData = faceService.registerFace(multipartFile, personName);
                response = Map.of(
                    "success", true,
                    "action", "register",
                    "data", faceData
                );
            } else {
                // Authentication mode
                try {
                    FaceData faceData = faceService.authenticateFace(multipartFile);
                    response = Map.of(
                        "success", true,
                        "action", "authenticate",
                        "authenticated", true,
                        "personName", faceData.getPersonName(),
                        "timestamp", faceData.getTimestamp()
                    );
                } catch (Exception e) {
                    response = Map.of(
                        "success", true,
                        "action", "authenticate",
                        "authenticated", false,
                        "message", e.getMessage()
                    );
                }
            }

            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
        } catch (Exception e) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                "success", false,
                "error", e.getMessage()
            ))));
        }
    }    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        System.out.println("=== WebSocket Message Received ===");
        System.out.println("Session ID: " + session.getId());
        System.out.println("Message length: " + message.getPayload().length());
        System.out.println("Message preview (first 200 chars): " + message.getPayload().substring(0, Math.min(200, message.getPayload().length())));
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> command = objectMapper.readValue(message.getPayload(), Map.class);
            
            System.out.println("Parsed command keys: " + command.keySet());
            System.out.println("Command type: " + command.get("type"));
            
            if ("setMode".equals(command.get("action"))) {
                String mode = (String) command.get("mode");
                if ("register".equals(mode)) {
                    String personName = (String) command.get("personName");
                    if (personName == null || personName.trim().isEmpty()) {
                        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                            "success", false,
                            "error", "Person name is required for registration mode"
                        ))));
                        return;
                    }
                    session.getAttributes().put("personName", personName);
                }
                sessionModes.put(session, mode);
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                    "success", true,
                    "message", "Mode set to: " + mode
                ))));            } else if (command.containsKey("type") && command.containsKey("image")) {
                System.out.println("Processing image message...");
                
                // Handle image processing from frontend
                String type = (String) command.get("type");
                String base64Image = (String) command.get("image");
                String personName = (String) command.get("personName");
                
                System.out.println("Image type: " + type);
                System.out.println("Person name: " + personName);
                System.out.println("Base64 image length: " + (base64Image != null ? base64Image.length() : 0));
                
                // Decode base64 image
                byte[] imageData = java.util.Base64.getDecoder().decode(base64Image);
                System.out.println("Decoded image size: " + imageData.length + " bytes");
                
                // Create MultipartFile from byte array
                MultipartFile multipartFile = new MultipartFile() {
                    @Override
                    public String getName() { return "image"; }
                    @Override
                    public String getOriginalFilename() { return "webcam.jpg"; }
                    @Override
                    public String getContentType() { return "image/jpeg"; }
                    @Override
                    public boolean isEmpty() { return imageData.length == 0; }
                    @Override
                    public long getSize() { return imageData.length; }
                    @Override
                    public byte[] getBytes() { return imageData; }
                    @Override
                    public InputStream getInputStream() { return new ByteArrayInputStream(imageData); }
                    @Override
                    public void transferTo(java.io.File dest) throws java.io.IOException {
                        throw new UnsupportedOperationException("transferTo() is not supported");
                    }
                };
                
                Map<String, Object> response;
                  if ("register".equals(type)) {
                    if (personName == null || personName.trim().isEmpty()) {
                        response = Map.of(
                            "type", "face_detected",
                            "success", false,
                            "action", "register",
                            "message", "Vui lòng nhập tên người dùng để đăng ký khuôn mặt"
                        );
                    } else {
                        try {
                            System.out.println("WebSocket: Registering face for " + personName);
                            FaceData faceData = faceService.registerFace(multipartFile, personName);
                            String successMessage = String.format("Khuôn mặt đã được đăng ký thành công cho người dùng '%s'", personName);
                            response = Map.of(
                                "type", "face_detected",
                                "success", true,
                                "action", "register",
                                "personName", faceData.getPersonName(),
                                "id", faceData.getId(),
                                "message", successMessage,
                                "timestamp", String.valueOf(faceData.getTimestamp()),
                                "faceDetected", true
                            );
                            System.out.println("WebSocket registration successful: " + successMessage);
                        } catch (Exception e) {
                            String errorMessage;
                            boolean faceDetected = true;
                            
                            if (e.getMessage().contains("No face detected")) {
                                errorMessage = "Không phát hiện khuôn mặt trong video. Vui lòng đưa mặt vào khung hình rõ nét.";
                                faceDetected = false;
                            } else {
                                errorMessage = "Lỗi đăng ký khuôn mặt: " + e.getMessage();
                            }
                            
                            response = Map.of(
                                "type", "face_detected",
                                "success", false,
                                "action", "register",
                                "message", errorMessage,
                                "faceDetected", faceDetected
                            );
                            System.err.println("WebSocket registration failed: " + errorMessage);
                        }
                    }
                } else { // authenticate
                    try {
                        System.out.println("WebSocket: Authenticating face...");
                        FaceData faceData = faceService.authenticateFace(multipartFile);
                        String successMessage = String.format("Xác thực thành công! Nhận diện được khuôn mặt của '%s'", faceData.getPersonName());
                        response = Map.of(
                            "type", "face_detected",
                            "success", true,
                            "action", "authenticate",
                            "authenticated", true,
                            "personName", faceData.getPersonName(),
                            "confidence", 0.95, // Mock confidence
                            "message", successMessage,
                            "timestamp", String.valueOf(faceData.getTimestamp()),
                            "faceDetected", true
                        );
                        System.out.println("WebSocket authentication successful: " + successMessage);
                    } catch (Exception e) {
                        String errorMessage;
                        boolean faceDetected = true;
                        
                        if (e.getMessage().contains("No face detected")) {
                            errorMessage = "Không phát hiện khuôn mặt trong video. Vui lòng đưa mặt vào khung hình rõ nét.";
                            faceDetected = false;
                        } else if (e.getMessage().contains("No matching face found")) {
                            errorMessage = "Không tìm thấy khuôn mặt phù hợp trong hệ thống. Vui lòng đăng ký trước khi xác thực.";
                        } else {
                            errorMessage = "Lỗi xác thực khuôn mặt: " + e.getMessage();
                        }
                        
                        response = Map.of(
                            "type", "face_detected",
                            "success", true, // Keep success true for response format
                            "action", "authenticate",
                            "authenticated", false,
                            "confidence", 0.0,
                            "message", errorMessage,
                            "faceDetected", faceDetected
                        );
                        System.err.println("WebSocket authentication failed: " + errorMessage);
                    }                }
                
                System.out.println("Sending response: " + response);
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
            } else {
                System.out.println("Unknown command type or missing required fields");
                System.out.println("Command keys: " + command.keySet());
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                    "type", "error",
                    "success", false,
                    "message", "Unknown command or missing required fields"
                ))));
            }
        } catch (Exception e) {
            System.err.println("Error processing WebSocket message: " + e.getMessage());
            e.printStackTrace();
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                "type", "error",
                "success", false,
                "error", e.getMessage()
            ))));
        }
    }
}

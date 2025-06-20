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

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
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
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            @SuppressWarnings("unchecked")
            Map<String, String> command = objectMapper.readValue(message.getPayload(), Map.class);
            
            if ("setMode".equals(command.get("action"))) {
                String mode = command.get("mode");
                if ("register".equals(mode)) {
                    String personName = command.get("personName");
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
                ))));
            }
        } catch (Exception e) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                "success", false,
                "error", e.getMessage()
            ))));
        }
    }
}

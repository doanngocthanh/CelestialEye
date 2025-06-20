package com.spring.ai.restai.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spring.ai.restai.service.QrCodeService;
import com.spring.ai.restai.dto.QrCodeDetectionResponse;
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

@Component
public class StreamingDetectionHandler extends AbstractWebSocketHandler {

    @Autowired
    private QrCodeService qrCodeService;

    private final ObjectMapper objectMapper = new ObjectMapper();

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
            // Process QR code detection
            QrCodeDetectionResponse response = qrCodeService.detectQrCodes(multipartFile);
            
            // Send results back
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                "success", true,
                "data", response
            ))));
        } catch (Exception e) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                "success", false,
                "error", e.getMessage()
            ))));
        }
    }
}

package com.spring.ai.restai.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import com.spring.ai.restai.websocket.StreamingDetectionHandler;
import com.spring.ai.restai.websocket.FaceStreamingHandler;
import com.spring.ai.restai.websocket.BarcodeStreamingHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private StreamingDetectionHandler streamingDetectionHandler;

    @Autowired
    private FaceStreamingHandler faceStreamingHandler;

    @Autowired
    private BarcodeStreamingHandler barcodeStreamingHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(streamingDetectionHandler, "/ws/detect-stream")
                .setAllowedOrigins("*");
        registry.addHandler(faceStreamingHandler, "/ws/face-stream")
                .setAllowedOrigins("*");
        registry.addHandler(barcodeStreamingHandler, "/ws/barcode-stream")
                .setAllowedOrigins("*");
    }
}

package com.spring.ai.restai.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;
import org.springframework.context.annotation.Bean;
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

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(1024 * 1024); // 1MB text buffer
        container.setMaxBinaryMessageBufferSize(1024 * 1024); // 1MB binary buffer
        container.setMaxSessionIdleTimeout(300000L); // 5 minutes timeout
        return container;
    }

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

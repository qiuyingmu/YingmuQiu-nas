package com.nas.config;

import com.nas.websocket.FileChangeHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final FileChangeHandler fileChangeHandler;

    @Value("${app.allowed-origins:*}")
    private String[] allowedOrigins;

    public WebSocketConfig(FileChangeHandler fileChangeHandler) {
        this.fileChangeHandler = fileChangeHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(fileChangeHandler, "/ws/files")
                .setAllowedOrigins(allowedOrigins);
    }
}

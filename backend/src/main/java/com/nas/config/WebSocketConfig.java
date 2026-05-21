package com.nas.config;

import com.nas.websocket.FileChangeHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final FileChangeHandler fileChangeHandler;

    public WebSocketConfig(FileChangeHandler fileChangeHandler) {
        this.fileChangeHandler = fileChangeHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(fileChangeHandler, "/ws/files")
                .setAllowedOrigins("*");
    }
}

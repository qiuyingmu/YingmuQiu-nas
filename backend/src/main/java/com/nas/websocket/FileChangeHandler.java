package com.nas.websocket;

import com.nas.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class FileChangeHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(FileChangeHandler.class);

    private final JwtTokenProvider jwtTokenProvider;

    // userId -> list of WebSocket sessions
    private final Map<UUID, List<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    public FileChangeHandler(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        if (uri == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        String query = uri.getQuery();
        if (query == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        String userIdStr = null;
        String token = null;

        for (String param : query.split("&")) {
            String[] pair = param.split("=", 2);
            if (pair.length == 2) {
                if ("userId".equals(pair[0])) {
                    userIdStr = pair[1];
                } else if ("token".equals(pair[0])) {
                    token = pair[1];
                }
            }
        }

        if (userIdStr == null || token == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        // Validate JWT
        if (!jwtTokenProvider.validateToken(token)) {
            log.warn("WebSocket connection rejected: invalid JWT token for userId={}", userIdStr);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        // Verify token userId matches
        UUID tokenUserId = jwtTokenProvider.getUserIdFromToken(token);
        UUID userId;
        try {
            userId = UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        if (!tokenUserId.equals(userId)) {
            log.warn("WebSocket connection rejected: userId mismatch token={} request={}", tokenUserId, userId);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        // Add session to user's session list
        userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(session);
        log.info("WebSocket connected: userId={}, sessionId={}", userId, session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        URI uri = session.getUri();
        if (uri != null && uri.getQuery() != null) {
            String query = uri.getQuery();
            for (String param : query.split("&")) {
                String[] pair = param.split("=", 2);
                if (pair.length == 2 && "userId".equals(pair[0])) {
                    UUID userId = UUID.fromString(pair[1]);
                    List<WebSocketSession> sessions = userSessions.get(userId);
                    if (sessions != null) {
                        sessions.remove(session);
                        if (sessions.isEmpty()) {
                            userSessions.remove(userId);
                        }
                    }
                    break;
                }
            }
        }
        log.info("WebSocket disconnected: sessionId={}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Currently no client-to-server messages needed
        log.debug("Received message from session {}: {}", session.getId(), message.getPayload());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket transport error: sessionId={}", session.getId(), exception);
        session.close(CloseStatus.SERVER_ERROR);
    }

    /**
     * Notify a specific user's WebSocket connections about file changes.
     */
    public void notifyFileChange(UUID userId, String eventType, UUID fileId) {
        List<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        String message = String.format(
                "{\"type\":\"file_change\",\"event\":\"%s\",\"fileId\":\"%s\"}",
                eventType, fileId
        );

        TextMessage textMessage = new TextMessage(message);

        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(textMessage);
                    }
                } catch (IOException e) {
                    log.warn("Failed to send WebSocket message to session {}: {}",
                            session.getId(), e.getMessage());
                }
            }
        }
    }
}

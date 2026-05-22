package com.nas.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final String secret;
    private final long expirationMs;
    private SecretKey secretKey;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        this.secret = secret;
        this.expirationMs = expirationMs;
    }

    @PostConstruct
    public void init() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET 环境变量未配置！请在 application.yml 或环境变量中设置 app.jwt.secret。\n"
                    + "生产环境: export JWT_SECRET=your-256-bit-base64-secret\n"
                    + "开发环境: 确保已配置 JWT_SECRET 环境变量");
        }
        try {
            this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        } catch (Exception e) {
            throw new IllegalStateException(
                    "JWT_SECRET 配置无效，请确保是有效的 Base64 编码密钥。\n"
                    + "错误: " + e.getMessage(), e);
        }
    }

    public String generateToken(UUID userId, String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    public UUID getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return UUID.fromString(claims.getSubject());
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Invalid JWT token: {}", ex.getMessage());
            return false;
        }
    }
}

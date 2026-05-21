package com.nas.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;

/**
 * 登录频率限制过滤器
 * 同一 IP 5 次登录失败后锁定 15 分钟
 */
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimitFilter.class);

    /** 最大尝试次数 */
    private static final int MAX_ATTEMPTS = 5;

    /** 锁定时间（毫秒） */
    private static final long LOCK_DURATION_MS = TimeUnit.MINUTES.toMillis(15);

    /** 尝试记录 key=ip, value={attempts, lockUntil} */
    private final ConcurrentMap<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // 只拦截 /api/auth/login 的 POST 请求
        if (!"/api/auth/login".equals(path) || !"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);

        // 检查是否被锁定
        AttemptRecord record = attempts.get(clientIp);
        if (record != null && record.isLocked()) {
            long remaining = record.remainingMillis();
            log.warn("登录被限流: IP={}, 剩余={}s", clientIp, remaining / 1000);

            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(429);
            response.getWriter().write(
                    "{\"code\":429,\"message\":\"登录尝试过于频繁，请 " + (remaining / 1000) + " 秒后重试\"}");
            return;
        }

        // 包装 response 以捕获登录失败
        RateLimitResponseWrapper wrapper = new RateLimitResponseWrapper(response);
        filterChain.doFilter(request, wrapper);

        // 检查是否登录失败（401）
        if (wrapper.getStatus() == HttpServletResponse.SC_UNAUTHORIZED) {
            AttemptRecord current = attempts.computeIfAbsent(clientIp, k -> new AttemptRecord());
            current.increment();
            log.warn("登录失败: IP={}, 尝试次数={}/{}", clientIp, current.getAttempts(), MAX_ATTEMPTS);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty() && !"unknown".equalsIgnoreCase(xff)) {
            return xff.split(",")[0].trim();
        }
        String ri = request.getRemoteAddr();
        return ri != null ? ri : "unknown";
    }

    /** 尝试记录 */
    static class AttemptRecord {
        private int attempts;
        private long lockUntil; // 0 = 未锁定

        synchronized boolean isLocked() {
            if (lockUntil == 0) return false;
            if (System.currentTimeMillis() >= lockUntil) {
                lockUntil = 0;
                attempts = 0;
                return false;
            }
            return true;
        }

        synchronized long remainingMillis() {
            return lockUntil > 0 ? Math.max(0, lockUntil - System.currentTimeMillis()) : 0;
        }

        synchronized int getAttempts() {
            return attempts;
        }

        synchronized void increment() {
            attempts++;
            if (attempts >= MAX_ATTEMPTS) {
                lockUntil = System.currentTimeMillis() + LOCK_DURATION_MS;
                log.warn("IP 已被锁定 15 分钟，累计失败 {} 次", attempts);
            }
        }
    }
}

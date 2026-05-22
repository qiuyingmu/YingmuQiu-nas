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
 * 公开分享接口频率限制过滤器
 * 同一 IP 每分钟最多 30 次请求，防止 token 枚举和暴力破解
 */
public class ShareRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ShareRateLimitFilter.class);

    /** 每分钟最大请求数 */
    private static final int MAX_REQUESTS_PER_MINUTE = 30;

    /** 窗口时间（毫秒） */
    private static final long WINDOW_MS = TimeUnit.MINUTES.toMillis(1);

    /** IP -> {count, windowStart} */
    private final ConcurrentMap<String, WindowRecord> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // 只拦截 /api/s/ 开头的公开分享请求
        if (!path.startsWith("/api/s/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);

        // 检查频率限制
        WindowRecord record = requestCounts.compute(clientIp, (key, existing) -> {
            long now = System.currentTimeMillis();
            if (existing == null || now - existing.windowStart > WINDOW_MS) {
                return new WindowRecord(1, now);
            }
            existing.count++;
            return existing;
        });

        if (record.count > MAX_REQUESTS_PER_MINUTE) {
            log.warn("分享接口请求超限: IP={}, count={}/min", clientIp, record.count);
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(429);
            response.getWriter().write(
                    "{\"code\":429,\"message\":\"请求过于频繁，请稍后重试\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        // 优先使用 nginx 设置的 X-Real-IP（可信），防止 X-Forwarded-For 伪造
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isEmpty() && !"unknown".equalsIgnoreCase(realIp)) {
            return realIp;
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty() && !"unknown".equalsIgnoreCase(xff)) {
            return xff.split(",")[0].trim();
        }
        String ri = request.getRemoteAddr();
        return ri != null ? ri : "unknown";
    }

    /** 窗口记录 */
    static class WindowRecord {
        int count;
        long windowStart;

        WindowRecord(int count, long windowStart) {
            this.count = count;
            this.windowStart = windowStart;
        }
    }
}

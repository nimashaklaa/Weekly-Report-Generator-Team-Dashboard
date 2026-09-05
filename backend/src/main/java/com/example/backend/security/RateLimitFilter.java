package com.example.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory sliding-window rate limiter for auth endpoints.
 * Limits each IP to {@code maxRequests} calls per {@code windowSeconds} seconds.
 *
 * For multi-instance deployments, replace with a Redis-backed solution.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${application.rate-limit.auth.max-requests:10}")
    private int maxRequests;

    @Value("${application.rate-limit.auth.window-seconds:60}")
    private int windowSeconds;

    // IP → list of request timestamps within the current window
    private final Map<String, RequestWindow> requestWindows = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.equals("/auth/login")
                && !path.equals("/auth/authenticate")
                && !path.equals("/auth/register");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String ip = resolveClientIp(request);
        long now = Instant.now().getEpochSecond();

        RequestWindow window = requestWindows.compute(ip, (key, existing) -> {
            if (existing == null || now - existing.windowStart >= windowSeconds) {
                return new RequestWindow(now, 1);
            }
            existing.count++;
            return existing;
        });

        if (window.count > maxRequests) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Too many attempts. Please try again later.\"}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // X-Forwarded-For may contain a comma-separated chain — take the first (client IP)
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RequestWindow {
        long windowStart;
        int count;

        RequestWindow(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}

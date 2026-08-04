package kr.co.workaround.advisor.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;

@Component
public class AdvisorAuthInterceptor implements HandlerInterceptor {

    static final String TOKEN_HEADER = "X-Advisor-Token";
    private static final Set<String> PROTECTED_METHODS = Set.of("POST", "PUT");

    private final byte[] configuredToken;
    private final boolean enabled;

    public AdvisorAuthInterceptor(@Value("${advisor.auth.token:}") String token) {
        String configured = token == null ? "" : token;
        this.configuredToken = configured.getBytes(StandardCharsets.UTF_8);
        this.enabled = !configured.isBlank();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if (!enabled || !PROTECTED_METHODS.contains(request.getMethod())) {
            return true;
        }

        String provided = request.getHeader(TOKEN_HEADER);
        if (provided != null && MessageDigest.isEqual(
                configuredToken, provided.getBytes(StandardCharsets.UTF_8))) {
            return true;
        }

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"error\":\"UNAUTHORIZED\",\"message\":\"missing or invalid advisor token\"}");
        return false;
    }
}

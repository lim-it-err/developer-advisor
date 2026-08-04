package kr.co.workaround.advisor.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@ConfigurationProperties(prefix = "advisor.cors")
public class AdvisorCorsProperties {

    private List<String> allowedOrigins = new ArrayList<>();
    private String allowedOrigin = "http://localhost:5173";

    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins == null ? new ArrayList<>() : new ArrayList<>(allowedOrigins);
    }

    public String getAllowedOrigin() {
        return allowedOrigin;
    }

    public void setAllowedOrigin(String allowedOrigin) {
        this.allowedOrigin = allowedOrigin;
    }

    public List<String> resolvedAllowedOrigins() {
        List<String> modern = normalize(allowedOrigins);
        if (!modern.isEmpty()) {
            return modern;
        }
        List<String> legacy = normalize(List.of(allowedOrigin == null ? "" : allowedOrigin));
        return legacy.isEmpty() ? List.of("http://localhost:5173") : legacy;
    }

    private List<String> normalize(List<String> values) {
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .flatMap(value -> Arrays.stream(value.split(",")))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .distinct()
                .toList();
    }
}

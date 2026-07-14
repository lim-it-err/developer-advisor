package kr.co.workaround.advisor.adapter.out.llm.ollama;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.workaround.advisor.adapter.out.llm.LlmProperties;
import kr.co.workaround.advisor.adapter.out.llm.LlmProvider;
import kr.co.workaround.advisor.application.exception.LlmException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Calls a local Ollama server's /api/chat with format:"json". Ollama doesn't guarantee
 * well-formed JSON even with format:"json", so a small retry parser strips code fences and
 * slices from the first '{' to the last '}' before giving up.
 */
@Component
public class OllamaLlmProvider implements LlmProvider {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final LlmProperties properties;
    private final RestClient restClient;

    public OllamaLlmProvider(LlmProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder().build();
    }

    @Override
    public String name() {
        return "ollama";
    }

    @Override
    public <T> T complete(String model, String prompt, Class<T> type) {
        String baseUrl = properties.getOllama().getBaseUrl();
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "format", "json",
                "stream", false
        );

        String content;
        try {
            String responseBody = restClient.post()
                    .uri(baseUrl + "/api/chat")
                    .header("content-type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(String.class);
            JsonNode root = MAPPER.readTree(responseBody);
            content = root.path("message").path("content").asText();
        } catch (Exception e) {
            throw new LlmException("Ollama call failed: " + e.getMessage(), e);
        }

        return parseWithRetry(content, type);
    }

    private <T> T parseWithRetry(String raw, Class<T> type) {
        List<String> attempts = List.of(
                raw,
                stripCodeFences(raw),
                sliceOuterBraces(raw)
        );
        Exception last = null;
        for (String candidate : attempts) {
            try {
                return MAPPER.readValue(candidate, type);
            } catch (Exception e) {
                last = e;
            }
        }
        throw new LlmException("Ollama returned unparseable JSON after retries: " + raw, last);
    }

    private String stripCodeFences(String raw) {
        return raw.replaceAll("(?s)```(?:json)?\\s*", "").replaceAll("```", "").trim();
    }

    private String sliceOuterBraces(String raw) {
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return raw.substring(start, end + 1);
        }
        return raw;
    }
}

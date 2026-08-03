package kr.co.workaround.advisor.adapter.out.llm.claude;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.victools.jsonschema.generator.OptionPreset;
import com.github.victools.jsonschema.generator.SchemaGenerator;
import com.github.victools.jsonschema.generator.SchemaGeneratorConfig;
import com.github.victools.jsonschema.generator.SchemaGeneratorConfigBuilder;
import com.github.victools.jsonschema.generator.SchemaVersion;
import com.github.victools.jsonschema.module.jackson.JacksonModule;
import kr.co.workaround.advisor.adapter.out.llm.LlmProperties;
import kr.co.workaround.advisor.adapter.out.llm.LlmProvider;
import kr.co.workaround.advisor.application.exception.LlmException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Calls the Anthropic Messages API and forces structured JSON output via tool-use: a single
 * tool `emit_result` whose input_schema is generated from `Class<T>` with victools, and
 * tool_choice pins the model to that tool so `content[].input` is exactly the shape we want.
 */
@Component
public class ClaudeLlmProvider implements LlmProvider {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Map<Class<?>, JsonNode> SCHEMA_CACHE = new ConcurrentHashMap<>();

    private final LlmProperties properties;
    private final RestClient restClient;

    @Autowired
    public ClaudeLlmProvider(LlmProperties properties, RestClient.Builder builder) {
        this.properties = properties;
        this.restClient = buildRestClient(properties.getClaude(), builder);
    }

    ClaudeLlmProvider(LlmProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    @Override
    public String name() {
        return "claude";
    }

    @Override
    public <T> T complete(String model, String prompt, Class<T> type) {
        LlmProperties.Claude cfg = properties.getClaude();
        JsonNode schema = SCHEMA_CACHE.computeIfAbsent(type, this::generateSchema);

        Map<String, Object> tool = Map.of(
                "name", "emit_result",
                "description", "Emit the structured result for this request.",
                "input_schema", schema
        );
        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", cfg.getMaxTokens(),
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "tools", List.of(tool),
                "tool_choice", Map.of("type", "tool", "name", "emit_result")
        );

        try {
            String responseBody = restClient.post()
                    .uri(cfg.getBaseUrl() + "/v1/messages")
                    .header("x-api-key", cfg.getApiKey())
                    .header("anthropic-version", cfg.getVersion())
                    .header("content-type", "application/json")
                    .body(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, response) -> {
                        throw new LlmException("Claude call failed with HTTP " + response.getStatusCode().value());
                    })
                    .body(String.class);

            JsonNode root = MAPPER.readTree(responseBody);
            for (JsonNode block : root.path("content")) {
                if ("tool_use".equals(block.path("type").asText())) {
                    return MAPPER.treeToValue(block.path("input"), type);
                }
            }
            throw new LlmException("Claude response had no tool_use block");
        } catch (LlmException e) {
            throw e;
        } catch (Exception e) {
            throw new LlmException("Claude call failed before a valid structured response was received", e);
        }
    }

    private static RestClient buildRestClient(LlmProperties.Claude cfg, RestClient.Builder builder) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(cfg.getConnectTimeout());
        requestFactory.setReadTimeout(cfg.getReadTimeout());
        return builder.requestFactory(requestFactory).build();
    }

    private JsonNode generateSchema(Class<?> type) {
        SchemaGeneratorConfigBuilder configBuilder = new SchemaGeneratorConfigBuilder(
                SchemaVersion.DRAFT_2020_12, OptionPreset.PLAIN_JSON)
                .with(new JacksonModule());
        SchemaGeneratorConfig config = configBuilder.build();
        return new SchemaGenerator(config).generateSchema(type);
    }
}

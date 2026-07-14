package kr.co.workaround.advisor.adapter.out.llm;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.Map;

@ConfigurationProperties(prefix = "advisor.llm")
public class LlmProperties {

    /** role name (lowercase: generate/review/chat) -> route */
    private Map<String, RoleRoute> roles = new HashMap<>();

    private Claude claude = new Claude();

    private Ollama ollama = new Ollama();

    public Map<String, RoleRoute> getRoles() {
        return roles;
    }

    public void setRoles(Map<String, RoleRoute> roles) {
        this.roles = roles;
    }

    public Claude getClaude() {
        return claude;
    }

    public void setClaude(Claude claude) {
        this.claude = claude;
    }

    public Ollama getOllama() {
        return ollama;
    }

    public void setOllama(Ollama ollama) {
        this.ollama = ollama;
    }

    public static class RoleRoute {
        private String provider;
        private String model;

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }
    }

    public static class Claude {
        private String baseUrl = "https://api.anthropic.com";
        private String apiKey = "";
        private String version = "2023-06-01";

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getVersion() {
            return version;
        }

        public void setVersion(String version) {
            this.version = version;
        }
    }

    public static class Ollama {
        private String baseUrl = "http://localhost:11434";

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }
    }
}

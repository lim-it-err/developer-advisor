package kr.co.workaround.advisor.adapter.out.llm;

import kr.co.workaround.advisor.application.port.LlmClient;
import kr.co.workaround.advisor.application.port.LlmRole;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.stream.Collectors;

/** LlmClient implementation: routes role -> {provider, model} -> LlmProvider.complete(). */
@Component
public class RoutingLlmClient implements LlmClient {

    private final Map<String, LlmProvider> providersByName;
    private final LlmProperties properties;

    public RoutingLlmClient(java.util.List<LlmProvider> providers, LlmProperties properties) {
        this.providersByName = providers.stream()
                .collect(Collectors.toMap(LlmProvider::name, p -> p));
        this.properties = properties;
    }

    @Override
    public <T> T complete(LlmRole role, String prompt, Class<T> type) {
        String roleKey = role.name().toLowerCase();
        LlmProperties.RoleRoute route = properties.getRoles().get(roleKey);
        if (route == null) {
            throw new IllegalStateException("No advisor.llm.roles route configured for role: " + roleKey);
        }
        LlmProvider provider = providersByName.get(route.getProvider());
        if (provider == null) {
            throw new IllegalStateException("No LlmProvider registered for provider: " + route.getProvider());
        }
        return provider.complete(route.getModel(), prompt, type);
    }
}

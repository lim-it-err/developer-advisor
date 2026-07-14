package kr.co.workaround.advisor.llm;

import kr.co.workaround.advisor.adapter.out.llm.LlmProperties;
import kr.co.workaround.advisor.adapter.out.llm.LlmProvider;
import kr.co.workaround.advisor.adapter.out.llm.RoutingLlmClient;
import kr.co.workaround.advisor.adapter.out.llm.mock.MockLlmProvider;
import kr.co.workaround.advisor.application.port.LlmRole;
import kr.co.workaround.advisor.domain.mission.content.MissionContent;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RoutingLlmClientTest {

    @Test
    void routesRoleToConfiguredProviderAndReturnsFixture() {
        LlmProperties props = new LlmProperties();
        LlmProperties.RoleRoute generate = new LlmProperties.RoleRoute();
        generate.setProvider("mock");
        generate.setModel("default");
        props.setRoles(Map.of("generate", generate));

        RoutingLlmClient client = new RoutingLlmClient(List.of(new MockLlmProvider()), props);

        MissionContent content = client.complete(LlmRole.GENERATE, "any prompt", MissionContent.class);

        assertThat(content).isNotNull();
        assertThat(content.briefing()).isNotNull();
        assertThat(content.endings()).extracting("grade")
                .contains("calm", "hotfix", "dawn", "hidden");
    }

    @Test
    void unroutedRoleThrows() {
        LlmProperties props = new LlmProperties();
        props.setRoles(Map.of());
        RoutingLlmClient client = new RoutingLlmClient(List.of(new MockLlmProvider()), props);

        assertThatThrownBy(() -> client.complete(LlmRole.REVIEW, "prompt", MissionContent.class))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void mockProviderIdentifiesByName() {
        LlmProvider provider = new MockLlmProvider();
        assertThat(provider.name()).isEqualTo("mock");
    }
}

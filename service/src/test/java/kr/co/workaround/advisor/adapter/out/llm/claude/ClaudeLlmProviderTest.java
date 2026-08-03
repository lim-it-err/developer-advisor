package kr.co.workaround.advisor.adapter.out.llm.claude;

import kr.co.workaround.advisor.adapter.out.llm.ChatReply;
import kr.co.workaround.advisor.adapter.out.llm.LlmProperties;
import kr.co.workaround.advisor.adapter.out.llm.RoutingLlmClient;
import kr.co.workaround.advisor.application.exception.LlmException;
import kr.co.workaround.advisor.application.port.LlmRole;
import kr.co.workaround.advisor.domain.review.content.ReviewContent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ClaudeLlmProviderTest {

    private LlmProperties properties;
    private MockRestServiceServer server;
    private ClaudeLlmProvider provider;

    @BeforeEach
    void setUp() {
        properties = properties();
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new ClaudeLlmProvider(properties, builder.build());
    }

    @Test
    void routesReviewAndChatModelsIntoForcedToolUseRequestsAndParsesTypedResponses() {
        expectRequest("contract-sonnet", "review prompt", reviewResponse());
        expectRequest("contract-haiku", "chat prompt", chatResponse());

        RoutingLlmClient client = new RoutingLlmClient(List.of(provider), properties);
        ReviewContent review = client.complete(LlmRole.REVIEW, "review prompt", ReviewContent.class);
        ChatReply chat = client.complete(LlmRole.CHAT, "chat prompt", ChatReply.class);

        assertThat(review.summary()).isEqualTo("계약 검증 리뷰");
        assertThat(review.items()).singleElement().satisfies(item -> {
            assertThat(item.rubricName()).isEqualTo("책임 분리");
            assertThat(item.score()).isEqualTo(27);
        });
        assertThat(review.ending().grade()).isEqualTo("calm");
        assertThat(chat.text()).isEqualTo("질문에 답했습니다.");
        server.verify();
    }

    @ParameterizedTest
    @ValueSource(ints = {401, 429, 500})
    void mapsHttpFailuresToSanitizedLlmException(int status) {
        String privateBody = "upstream-private-body-" + status;
        server.expect(once(), requestTo("https://claude.test/v1/messages"))
                .andRespond(withStatus(HttpStatus.valueOf(status))
                        .contentType(MediaType.TEXT_PLAIN)
                        .body(privateBody));

        assertThatThrownBy(() -> provider.complete("contract-sonnet", "prompt", ReviewContent.class))
                .isInstanceOf(LlmException.class)
                .hasMessage("Claude call failed with HTTP " + status)
                .hasMessageNotContaining(privateBody)
                .hasMessageNotContaining("contract-api-key");
        server.verify();
    }

    @Test
    void configuresMaxTokensAndHttpTimeouts() {
        LlmProperties timeoutProperties = properties();
        timeoutProperties.getClaude().setMaxTokens(1234);
        timeoutProperties.getClaude().setConnectTimeout(Duration.ofMillis(1500));
        timeoutProperties.getClaude().setReadTimeout(Duration.ofMillis(2750));
        RestClient.Builder builder = spy(RestClient.builder());

        new ClaudeLlmProvider(timeoutProperties, builder);

        var captor = org.mockito.ArgumentCaptor.forClass(ClientHttpRequestFactory.class);
        verify(builder).requestFactory(captor.capture());
        assertThat(captor.getValue()).isInstanceOf(SimpleClientHttpRequestFactory.class);
        assertThat(ReflectionTestUtils.getField(captor.getValue(), "connectTimeout")).isEqualTo(1500);
        assertThat(ReflectionTestUtils.getField(captor.getValue(), "readTimeout")).isEqualTo(2750);
        assertThat(timeoutProperties.getClaude().getMaxTokens()).isEqualTo(1234);
    }

    private void expectRequest(String model, String prompt, String response) {
        server.expect(once(), requestTo("https://claude.test/v1/messages"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(header("x-api-key", "contract-api-key"))
                .andExpect(header("anthropic-version", "2023-06-01"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.model").value(model))
                .andExpect(jsonPath("$.max_tokens").value(2048))
                .andExpect(jsonPath("$.messages[0].role").value("user"))
                .andExpect(jsonPath("$.messages[0].content").value(prompt))
                .andExpect(jsonPath("$.tools[0].name").value("emit_result"))
                .andExpect(jsonPath("$.tools[0].input_schema").exists())
                .andExpect(jsonPath("$.tool_choice.type").value("tool"))
                .andExpect(jsonPath("$.tool_choice.name").value("emit_result"))
                .andRespond(withSuccess(response, MediaType.APPLICATION_JSON));
    }

    private static LlmProperties properties() {
        LlmProperties properties = new LlmProperties();
        properties.getClaude().setBaseUrl("https://claude.test");
        properties.getClaude().setApiKey("contract-api-key");
        properties.getClaude().setVersion("2023-06-01");
        properties.getClaude().setMaxTokens(2048);

        LlmProperties.RoleRoute review = new LlmProperties.RoleRoute();
        review.setProvider("claude");
        review.setModel("contract-sonnet");
        LlmProperties.RoleRoute chat = new LlmProperties.RoleRoute();
        chat.setProvider("claude");
        chat.setModel("contract-haiku");
        properties.setRoles(Map.of("review", review, "chat", chat));
        return properties;
    }

    private static String reviewResponse() {
        return """
                {
                  "content": [{
                    "type": "tool_use",
                    "name": "emit_result",
                    "input": {
                      "summary": "계약 검증 리뷰",
                      "items": [{
                        "rubricName": "책임 분리",
                        "score": 27,
                        "evidence": "line 1",
                        "feedback": "분리됨"
                      }],
                      "hiddenCases": [],
                      "nextSteps": ["다음 단계"],
                      "followUpQuestions": ["왜 이렇게 나눴나요?"],
                      "scenario": "조용히 배포됨",
                      "ending": {"grade": "calm", "title": "고요한 배포"},
                      "reputation": null,
                      "explainFeedback": null,
                      "hiddenQuest": null
                    }
                  }]
                }
                """;
    }

    private static String chatResponse() {
        return """
                {
                  "content": [{
                    "type": "tool_use",
                    "name": "emit_result",
                    "input": {"text": "질문에 답했습니다."}
                  }]
                }
                """;
    }
}

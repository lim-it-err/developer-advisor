package kr.co.workaround.advisor.adapter.out.llm.mock;

import kr.co.workaround.advisor.adapter.out.llm.ChatReply;
import kr.co.workaround.advisor.adapter.out.llm.LlmProvider;
import kr.co.workaround.advisor.domain.mission.content.MissionContent;
import kr.co.workaround.advisor.domain.review.content.ExplainFeedback;
import kr.co.workaround.advisor.domain.review.content.ReviewContent;
import org.springframework.stereotype.Component;

/**
 * Default provider — zero keys, zero network. Returns fixed wine-domain fixtures keyed by
 * the requested `type`, so tests and keyless local dev always get a deterministic response.
 */
@Component
public class MockLlmProvider implements LlmProvider {

    @Override
    public String name() {
        return "mock";
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T complete(String model, String prompt, Class<T> type) {
        if (type == MissionContent.class) {
            return (T) MockFixtures.missionContent();
        }
        if (type == ReviewContent.class) {
            return (T) MockFixtures.reviewContent();
        }
        if (type == ExplainFeedback.class) {
            return (T) MockFixtures.explainFeedback();
        }
        if (type == ChatReply.class) {
            return (T) MockFixtures.chatReply();
        }
        throw new IllegalArgumentException("MockLlmProvider has no fixture for type: " + type);
    }
}

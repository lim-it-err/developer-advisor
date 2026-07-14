package kr.co.workaround.advisor.llm;

import kr.co.workaround.advisor.adapter.out.llm.PromptLoader;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PromptLoaderTest {

    private final PromptLoader loader = new PromptLoader();

    @Test
    void loadsAllFourPromptFilesAndSubstitutesSlots() {
        String generate = loader.render("generate-mission", Map.of("domain", "와인", "domainEmoji", "🍷"));
        assertThat(generate).contains("와인").contains("🍷").doesNotContain("{{domain}}");

        String review = loader.render("review-submission", Map.of("missionTitle", "테스트 미션"));
        assertThat(review).contains("테스트 미션");

        String evaluate = loader.render("evaluate-explanation", Map.of("audience", "기획자"));
        assertThat(evaluate).contains("기획자");

        String chat = loader.render("chat-reply", Map.of("userMessage", "질문입니다"));
        assertThat(chat).contains("질문입니다");
    }
}

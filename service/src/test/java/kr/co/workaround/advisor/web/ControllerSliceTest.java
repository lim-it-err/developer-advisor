package kr.co.workaround.advisor.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControllerSliceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createTrackReturns201() throws Exception {
        String body = """
                { "domain": "와인", "difficulty": "Easy", "focus": "분리" }
                """;
        mockMvc.perform(post("/api/advisor/tracks").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void missionResponseHidesInvisibleRubricAndExposesHiddenCaseCount() throws Exception {
        String trackBody = """
                { "domain": "와인", "difficulty": "Easy", "focus": "분리" }
                """;
        String trackJson = mockMvc.perform(post("/api/advisor/tracks")
                        .contentType(MediaType.APPLICATION_JSON).content(trackBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String trackId = objectMapper.readTree(trackJson).get("id").asText();

        String missionJson = mockMvc.perform(post("/api/advisor/tracks/" + trackId + "/missions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode mission = objectMapper.readTree(missionJson);
        String missionId = mission.get("id").asText();

        assertThat(mission.get("hiddenCaseCount").asInt()).isGreaterThan(0);
        assertThat(mission.has("hiddenCases")).isFalse();
        for (JsonNode item : mission.get("rubric")) {
            assertThat(item.has("visibleToLearner")).isFalse();
        }

        mockMvc.perform(get("/api/advisor/missions/" + missionId))
                .andExpect(status().isOk());
    }

    @Test
    void chatPreviewReturnsNonEmptyTextWithoutAnyMission() throws Exception {
        String body = """
                {
                  "context": "와인 추천기 리팩토링 미션. 예산 초과 허용 폭은 일부러 모호하게 남겨두었다.",
                  "history": [
                    { "role": "me", "text": "예산 이하가 엄격한 조건인가요?" },
                    { "role": "agent", "text": "좋은 질문이에요. 어디까지 알아보셨나요?" }
                  ],
                  "text": "초과 폭 기준을 기획자로서 정해 주세요."
                }
                """;
        String json = mockMvc.perform(post("/api/advisor/chat/preview")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(objectMapper.readTree(json).get("text").asText()).isNotBlank();
    }

    @Test
    void chatPreviewRejectsBlankText() throws Exception {
        String body = """
                { "context": "", "history": [], "text": "" }
                """;
        mockMvc.perform(post("/api/advisor/chat/preview")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }
}

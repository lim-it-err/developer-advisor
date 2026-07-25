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

    @Test
    void reviewPreviewReturnsReviewContentWithoutAnyPersistedMission() throws Exception {
        String body = """
                {
                  "mission": {
                    "title": "분리의 감각",
                    "scenario": "사내 복지몰 와인 추천기를 물려받았다.",
                    "requirements": ["동작은 그대로 유지할 것"],
                    "constraints": ["기존 API 시그니처는 유지해야 합니다."],
                    "rubric": [
                      { "name": "책임 분리", "description": "추천/할인/페어링이 분리되었는가", "weight": 30, "visibleToLearner": true }
                    ],
                    "hiddenCases": [
                      { "title": "예산 0원 손님", "description": "예산이 0 이하인 입력 처리" }
                    ],
                    "endings": [
                      { "grade": "calm", "title": "고요한 배포", "teaser": "아무 일도 일어나지 않는다" }
                    ],
                    "hiddenQuest": null
                  },
                  "files": [
                    { "path": "src/main/java/kr/co/wine/WineRecommender.java", "content": "public class WineRecommender {}" }
                  ],
                  "chatTranscript": "me: 예산 초과는 어디까지 허용되나요?\\nagent: 협의된 문서가 없습니다."
                }
                """;
        String json = mockMvc.perform(post("/api/advisor/review/preview")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode review = objectMapper.readTree(json);
        assertThat(review.get("summary").asText()).isNotBlank();
        assertThat(review.get("items").isArray()).isTrue();
        assertThat(review.get("items").size()).isGreaterThan(0);
        assertThat(review.get("scenario").asText()).isNotBlank();
        assertThat(review.get("ending").has("grade")).isTrue();
        assertThat(review.get("reputation").has("level")).isTrue();
    }

    @Test
    void reviewPreviewRejectsEmptyFiles() throws Exception {
        String body = """
                {
                  "mission": { "title": "분리의 감각" },
                  "files": [],
                  "chatTranscript": null
                }
                """;
        mockMvc.perform(post("/api/advisor/review/preview")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reviewPreviewRejectsBlankMissionTitle() throws Exception {
        String body = """
                {
                  "mission": { "title": "" },
                  "files": [ { "path": "A.java", "content": "class A {}" } ],
                  "chatTranscript": null
                }
                """;
        mockMvc.perform(post("/api/advisor/review/preview")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }
}

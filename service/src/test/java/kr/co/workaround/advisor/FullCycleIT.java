package kr.co.workaround.advisor;

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

/** Happy-path: track -> mission -> submission -> review, end to end against H2 mem + mock LLM. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FullCycleIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void fullCycleTrackToReview() throws Exception {
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

        String submitBody = """
                { "files":[{"path":"WineRecommender.java","content":"public class WineRecommender {}"}],
                  "explanation":"제가 만든 추천 시스템은 손님 응대랑 비슷하게 나눠져 있어요." }
                """;
        String submitJson = mockMvc.perform(post("/api/advisor/missions/" + missionId + "/submissions")
                        .contentType(MediaType.APPLICATION_JSON).content(submitBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode submitResult = objectMapper.readTree(submitJson);
        String submissionId = submitResult.get("submissionId").asText();
        assertThat(submitResult.get("reviewStatus").asText()).isEqualTo("READY");

        String reviewJson = mockMvc.perform(get("/api/advisor/submissions/" + submissionId + "/review"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode review = objectMapper.readTree(reviewJson);

        assertThat(review.get("overall").asInt()).isGreaterThan(0);
        assertThat(review.has("reputation")).isTrue();
        assertThat(review.has("scenario")).isTrue();
        assertThat(review.has("ending")).isTrue();
        assertThat(review.get("hiddenCases").size()).isGreaterThan(0);
    }
}

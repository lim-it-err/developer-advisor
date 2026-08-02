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

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LearnerRecordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void appendsSubmissionVersionsAndKeepsNicknameScope() throws Exception {
        String path = "/api/advisor/learners/codex/missions/frontend-demo/submissions";
        String firstId = postSubmission(path, "First.java");
        String secondId = postSubmission(path, "Second.java");

        JsonNode versions = read(mockMvc.perform(get(path))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(versions).hasSize(2);
        assertThat(versions.get(0).get("id").asText()).isEqualTo(firstId);
        assertThat(versions.get(1).get("id").asText()).isEqualTo(secondId);

        JsonNode otherLearner = read(mockMvc.perform(get(
                        "/api/advisor/learners/other/missions/frontend-demo/submissions"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(otherLearner).isEmpty();
    }

    @Test
    void savesClientReviewAndReturnsItInSubmissionVersionOrder() throws Exception {
        String base = "/api/advisor/learners/reviewer/missions/frontend-demo";
        String submissionId = postSubmission(base + "/submissions", "Reviewed.java");
        String body = """
                {
                  "submissionId": "%s",
                  "content": {
                    "summary": "저장된 리뷰",
                    "items": [{"rubricName":"계약", "score":12, "evidence":"line 1", "feedback":"좋음"}],
                    "hiddenCases": [],
                    "nextSteps": [],
                    "followUpQuestions": [],
                    "scenario": null,
                    "ending": null,
                    "reputation": null,
                    "explainFeedback": null,
                    "hiddenQuest": null
                  }
                }
                """.formatted(submissionId);

        JsonNode saved = read(mockMvc.perform(post(base + "/reviews")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(saved.get("overall").asInt()).isEqualTo(12);

        JsonNode reviews = read(mockMvc.perform(get(base + "/reviews"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(reviews).hasSize(1);
        assertThat(reviews.get(0).get("content").get("summary").asText()).isEqualTo("저장된 리뷰");
    }

    @Test
    void journalAndGenericRecordRoundTripWhileMissingJournalIsEmptyObject() throws Exception {
        String missing = mockMvc.perform(get("/api/advisor/learners/newcomer/journal"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(read(missing).isObject()).isTrue();
        assertThat(read(missing).isEmpty()).isTrue();

        String journal = """
                {"routineHistory":{"2026-08-03":2},"endingPredictions":{"m1":"calm"}}
                """;
        mockMvc.perform(put("/api/advisor/learners/codex/journal")
                        .contentType(MediaType.APPLICATION_JSON).content(journal))
                .andExpect(status().isOk());
        JsonNode journalResult = read(mockMvc.perform(get("/api/advisor/learners/codex/journal"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(journalResult).isEqualTo(read(journal));

        String recordPath = "/api/advisor/learners/codex/missions/m1/records/explanation";
        String record = "{\"text\":\"설명 기록\",\"submittedAt\":\"2026-08-03T00:00:00Z\"}";
        mockMvc.perform(put(recordPath).contentType(MediaType.APPLICATION_JSON).content(record))
                .andExpect(status().isOk());
        JsonNode recordResult = read(mockMvc.perform(get(recordPath))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(recordResult).isEqualTo(read(record));
    }

    private String postSubmission(String path, String fileName) throws Exception {
        String body = """
                {"files":[{"path":"%s","content":"class Demo {}"}],"explanation":null}
                """.formatted(fileName);
        String json = mockMvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return read(json).get("id").asText();
    }

    private JsonNode read(String json) throws Exception {
        return objectMapper.readTree(json);
    }
}

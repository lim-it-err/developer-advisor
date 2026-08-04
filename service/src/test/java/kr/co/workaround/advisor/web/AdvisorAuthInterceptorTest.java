package kr.co.workaround.advisor.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "advisor.auth.token=test-secret")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdvisorAuthInterceptorTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void protectedPostRejectsMissingToken() throws Exception {
        mockMvc.perform(post("/api/advisor/chat/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void protectedPostAcceptsMatchingToken() throws Exception {
        mockMvc.perform(post("/api/advisor/chat/preview")
                        .header("X-Advisor-Token", "test-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody()))
                .andExpect(status().isOk());
    }

    @Test
    void protectedPutRejectsMismatchedToken() throws Exception {
        mockMvc.perform(put("/api/advisor/learners/writer/journal")
                        .header("X-Advisor-Token", "wrong-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void getRemainsOpenWhenGuardIsEnabled() throws Exception {
        mockMvc.perform(get("/api/advisor/learners/public-reader/journal"))
                .andExpect(status().isOk());
    }

    private String chatBody() {
        return """
                { "context": "token guard test", "history": [], "text": "hello" }
                """;
    }
}

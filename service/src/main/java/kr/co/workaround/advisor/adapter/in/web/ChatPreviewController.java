package kr.co.workaround.advisor.adapter.in.web;

import jakarta.validation.Valid;
import kr.co.workaround.advisor.adapter.in.web.dto.ChatPreviewRequest;
import kr.co.workaround.advisor.adapter.in.web.dto.ChatPreviewResponse;
import kr.co.workaround.advisor.application.ChatService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Stateless chat endpoint for the frontend prototype whose missions live client-side
 * (no backend mission record). Routes to the CHAT role — Haiku on the claude profile,
 * the fixture on mock — without touching the DB.
 */
@RestController
@RequestMapping("/api/advisor/chat")
public class ChatPreviewController {

    private final ChatService chatService;

    public ChatPreviewController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/preview")
    public ChatPreviewResponse preview(@Valid @RequestBody ChatPreviewRequest req) {
        String history = formatHistory(req.history());
        String reply = chatService.previewReply(req.context(), history, req.text());
        return new ChatPreviewResponse(reply);
    }

    private String formatHistory(List<ChatPreviewRequest.HistoryMessage> history) {
        if (history == null) {
            return "";
        }
        return history.stream()
                .map(m -> (m.role() == null ? "user" : m.role()) + ": " + (m.text() == null ? "" : m.text()))
                .collect(Collectors.joining("\n"));
    }
}

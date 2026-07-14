package kr.co.workaround.advisor.adapter.in.web;

import jakarta.validation.Valid;
import kr.co.workaround.advisor.adapter.in.web.dto.ChatResponse;
import kr.co.workaround.advisor.adapter.in.web.dto.ChatSendRequest;
import kr.co.workaround.advisor.application.ChatService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/advisor/missions/{missionId}/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatResponse send(@PathVariable String missionId, @Valid @RequestBody ChatSendRequest req) {
        var messages = chatService.send(missionId, req.text());
        return new ChatResponse(messages.stream().map(WebMappers::toDto).toList());
    }

    @GetMapping
    public ChatResponse list(@PathVariable String missionId) {
        var messages = chatService.list(missionId);
        return new ChatResponse(messages.stream().map(WebMappers::toDto).toList());
    }
}

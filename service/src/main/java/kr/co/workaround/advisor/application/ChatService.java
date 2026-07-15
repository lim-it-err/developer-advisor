package kr.co.workaround.advisor.application;

import kr.co.workaround.advisor.adapter.out.llm.ChatReply;
import kr.co.workaround.advisor.adapter.out.llm.PromptLoader;
import kr.co.workaround.advisor.adapter.out.persistence.mapper.PersistenceMapper;
import kr.co.workaround.advisor.adapter.out.persistence.repo.ChatMessageRepository;
import kr.co.workaround.advisor.application.port.LlmClient;
import kr.co.workaround.advisor.application.port.LlmRole;
import kr.co.workaround.advisor.domain.chat.ChatMessage;
import kr.co.workaround.advisor.domain.chat.ChatRole;
import kr.co.workaround.advisor.domain.mission.Mission;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final MissionService missionService;
    private final LlmClient llmClient;
    private final PromptLoader promptLoader;

    public ChatService(ChatMessageRepository chatMessageRepository, MissionService missionService,
                        LlmClient llmClient, PromptLoader promptLoader) {
        this.chatMessageRepository = chatMessageRepository;
        this.missionService = missionService;
        this.llmClient = llmClient;
        this.promptLoader = promptLoader;
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> list(String missionId) {
        return chatMessageRepository.findByMissionIdOrderByAtAsc(missionId).stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    /** Appends the learner's message, asks the LLM for a reply, appends it, and returns the two new messages. */
    @Transactional
    public List<ChatMessage> send(String missionId, String text) {
        Mission mission = missionService.get(missionId);
        String history = chatMessageRepository.findByMissionIdOrderByAtAsc(missionId).stream()
                .map(m -> m.getRole().name().toLowerCase() + ": " + m.getText())
                .collect(Collectors.joining("\n"));

        ChatMessage me = new ChatMessage(Ids.next("chat_"), missionId, ChatRole.ME, text, Instant.now());
        chatMessageRepository.save(PersistenceMapper.toEntity(me));

        Map<String, String> slots = Map.of(
                "missionBrief", mission.title() + " — " + mission.content().briefing().title(),
                "history", history,
                "userMessage", text
        );
        String prompt = promptLoader.render("chat-reply", slots);
        ChatReply reply = llmClient.complete(LlmRole.CHAT, prompt, ChatReply.class);

        ChatMessage agent = new ChatMessage(Ids.next("chat_"), missionId, ChatRole.AGENT, reply.text(), Instant.now());
        chatMessageRepository.save(PersistenceMapper.toEntity(agent));

        return List.of(me, agent);
    }

    /**
     * Stateless variant for the frontend prototype: no mission lookup, no persistence.
     * The caller supplies the mission context and the formatted conversation history.
     */
    public String previewReply(String context, String history, String text) {
        Map<String, String> slots = Map.of(
                "missionBrief", context == null ? "" : context,
                "history", history == null ? "" : history,
                "userMessage", text
        );
        String prompt = promptLoader.render("chat-reply", slots);
        return llmClient.complete(LlmRole.CHAT, prompt, ChatReply.class).text();
    }
}

package kr.co.workaround.advisor;

import kr.co.workaround.advisor.application.ChatService;
import kr.co.workaround.advisor.application.MissionService;
import kr.co.workaround.advisor.application.TrackService;
import kr.co.workaround.advisor.domain.chat.ChatMessage;
import kr.co.workaround.advisor.domain.chat.ChatRole;
import kr.co.workaround.advisor.domain.mission.Mission;
import kr.co.workaround.advisor.domain.track.Difficulty;
import kr.co.workaround.advisor.domain.track.Track;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class ChatServiceTest {

    @Autowired
    private TrackService trackService;

    @Autowired
    private MissionService missionService;

    @Autowired
    private ChatService chatService;

    @Test
    void accumulatesMessagesAndReturnsAgentReply() {
        Track track = trackService.create("와인", Difficulty.Easy, "분리");
        Mission mission = missionService.generate(track.id(), null, null, null);

        List<ChatMessage> firstExchange = chatService.send(mission.id(), "예산 초과 허용 폭은 얼마까지인가요?");
        assertThat(firstExchange).hasSize(2);
        assertThat(firstExchange.get(0).role()).isEqualTo(ChatRole.ME);
        assertThat(firstExchange.get(1).role()).isEqualTo(ChatRole.AGENT);
        assertThat(firstExchange.get(1).text()).isNotBlank();

        chatService.send(mission.id(), "감사합니다");

        List<ChatMessage> all = chatService.list(mission.id());
        assertThat(all).hasSize(4);
        assertThat(all.get(0).role()).isEqualTo(ChatRole.ME);
    }
}

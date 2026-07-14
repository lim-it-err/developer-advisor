package kr.co.workaround.advisor.domain.chat;

import java.time.Instant;

public record ChatMessage(
        String id,
        String missionId,
        ChatRole role,
        String text,
        Instant at
) {
}

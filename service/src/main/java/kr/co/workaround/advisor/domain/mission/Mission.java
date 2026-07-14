package kr.co.workaround.advisor.domain.mission;

import kr.co.workaround.advisor.domain.mission.content.MissionContent;
import kr.co.workaround.advisor.domain.track.Difficulty;

import java.time.Instant;

public record Mission(
        String id,
        String trackId,
        int stage,
        String stageTitle,
        String missionType,
        Difficulty difficulty,
        String scope,
        String domain,
        String domainEmoji,
        String title,
        int estimatedMinutes,
        MissionStatus status,
        MissionContent content,
        Instant createdAt
) {
}

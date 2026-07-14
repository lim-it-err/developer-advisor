package kr.co.workaround.advisor.adapter.in.web.dto;

import java.time.Instant;
import java.util.List;

public record TrackResponse(
        String id, String domain, String difficulty, String focus, String title,
        Instant createdAt, List<MissionSummary> missions
) {
}

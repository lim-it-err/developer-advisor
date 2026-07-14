package kr.co.workaround.advisor.domain.track;

import java.time.Instant;

public record Track(
        String id,
        String domain,
        Difficulty difficulty,
        String focus,
        String title,
        Instant createdAt
) {
}

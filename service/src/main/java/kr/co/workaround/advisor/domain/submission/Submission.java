package kr.co.workaround.advisor.domain.submission;

import java.time.Instant;
import java.util.List;

public record Submission(
        String id,
        String missionId,
        List<SubmittedFile> files,
        String explanation,
        Instant submittedAt
) {
}

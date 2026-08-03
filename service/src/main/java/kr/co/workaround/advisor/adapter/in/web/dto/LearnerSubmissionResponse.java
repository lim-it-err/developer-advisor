package kr.co.workaround.advisor.adapter.in.web.dto;

import kr.co.workaround.advisor.domain.submission.Submission;

import java.time.Instant;
import java.util.List;

public record LearnerSubmissionResponse(
        String id,
        String missionId,
        List<FileDto> files,
        String explanation,
        Instant submittedAt
) {
    public static LearnerSubmissionResponse from(Submission submission) {
        return new LearnerSubmissionResponse(
                submission.id(),
                submission.missionId(),
                submission.files().stream().map(file -> new FileDto(file.path(), file.content())).toList(),
                submission.explanation(),
                submission.submittedAt()
        );
    }
}

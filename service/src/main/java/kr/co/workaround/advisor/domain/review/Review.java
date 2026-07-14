package kr.co.workaround.advisor.domain.review;

import kr.co.workaround.advisor.domain.review.content.ReviewContent;

import java.time.Instant;

public record Review(
        String id,
        String submissionId,
        int overall,
        ReviewStatus status,
        ReviewContent content,
        Instant createdAt
) {
}

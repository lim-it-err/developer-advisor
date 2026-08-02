package kr.co.workaround.advisor.adapter.in.web.dto;

import kr.co.workaround.advisor.domain.review.Review;
import kr.co.workaround.advisor.domain.review.content.ReviewContent;

import java.time.Instant;

public record LearnerReviewResponse(
        String id,
        String submissionId,
        int overall,
        ReviewContent content,
        Instant reviewedAt
) {
    public static LearnerReviewResponse from(Review review) {
        return new LearnerReviewResponse(
                review.id(), review.submissionId(), review.overall(), review.content(), review.createdAt()
        );
    }
}

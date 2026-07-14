package kr.co.workaround.advisor.adapter.in.web.dto;

import kr.co.workaround.advisor.domain.review.content.EndingStamp;
import kr.co.workaround.advisor.domain.review.content.ExplainFeedback;
import kr.co.workaround.advisor.domain.review.content.Reputation;
import kr.co.workaround.advisor.domain.review.content.ReviewItem;
import kr.co.workaround.advisor.domain.review.content.ReviewedHiddenCase;

import java.util.List;

public record ReviewResponse(
        String id, String submissionId, int overall, String summary,
        List<ReviewItem> items, List<ReviewedHiddenCase> hiddenCases,
        List<String> nextSteps, List<String> followUpQuestions,
        String scenario, EndingStamp ending, Reputation reputation, ExplainFeedback explainFeedback
) {
}

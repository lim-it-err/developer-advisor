package kr.co.workaround.advisor.domain.review.content;

import java.util.List;

/**
 * Rich review content. Frozen field-name contract with the frontend —
 * see frontend/src/modules/missions/data/sampleContent.js (sampleReviews).
 */
public record ReviewContent(
        String summary,
        List<ReviewItem> items,
        List<ReviewedHiddenCase> hiddenCases,
        List<String> nextSteps,
        List<String> followUpQuestions,
        String scenario,
        EndingStamp ending,
        Reputation reputation,
        ExplainFeedback explainFeedback,
        ReviewHiddenQuest hiddenQuest
) {
}

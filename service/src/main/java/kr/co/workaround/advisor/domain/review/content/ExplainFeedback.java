package kr.co.workaround.advisor.domain.review.content;

/** Nullable on ReviewContent — only present when the learner submitted an explanation. */
public record ExplainFeedback(String transcript, ExplainDetail feedback) {
}

package kr.co.workaround.advisor.domain.review.content;

/** warStory is nullable — the real-world incident anecdote attached to the hidden case, if any. */
public record ReviewedHiddenCase(String title, boolean passed, String note, String warStory) {
}

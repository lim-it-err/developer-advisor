package kr.co.workaround.advisor.domain.review.content;

import java.util.List;

public record Reputation(
        String level,
        String summary,
        List<String> strengths,
        List<String> improvements
) {
}

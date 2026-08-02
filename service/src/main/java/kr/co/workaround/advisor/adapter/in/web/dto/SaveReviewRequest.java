package kr.co.workaround.advisor.adapter.in.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kr.co.workaround.advisor.domain.review.content.ReviewContent;

public record SaveReviewRequest(
        @NotBlank String submissionId,
        @NotNull @Valid ReviewContent content
) {
}

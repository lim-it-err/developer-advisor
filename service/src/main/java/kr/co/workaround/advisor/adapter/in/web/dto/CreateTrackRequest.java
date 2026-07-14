package kr.co.workaround.advisor.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTrackRequest(String domain, @NotBlank String difficulty, String focus) {
}

package kr.co.workaround.advisor.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatSendRequest(@NotBlank String text) {
}

package kr.co.workaround.advisor.adapter.in.web.dto;

import java.time.Instant;

public record ChatMessageDto(String role, String text, Instant at) {
}

package kr.co.workaround.advisor.adapter.in.web.dto;

import java.util.List;

public record ChatResponse(List<ChatMessageDto> messages) {
}

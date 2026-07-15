package kr.co.workaround.advisor.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * Stateless chat preview: the frontend prototype owns the mission content, so it ships the
 * context and history along with the new message instead of referencing a persisted mission.
 */
public record ChatPreviewRequest(String context, List<HistoryMessage> history, @NotBlank String text) {

    public record HistoryMessage(String role, String text) {
    }
}

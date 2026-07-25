package kr.co.workaround.advisor.adapter.in.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Stateless review preview: the frontend prototype owns the mission content, so it ships the
 * full mission spec and submitted files (plus an optional chat transcript) instead of
 * referencing a persisted mission/submission. Mirrors {@link ChatPreviewRequest}'s pattern.
 */
public record ReviewPreviewRequest(
        @NotNull @Valid MissionSpec mission,
        @NotEmpty List<FileEntry> files,
        String chatTranscript
) {

    public record MissionSpec(
            @NotBlank String title,
            String scenario,
            List<String> requirements,
            List<String> constraints,
            List<RubricSpec> rubric,
            List<HiddenCaseSpec> hiddenCases,
            List<EndingSpec> endings,
            HiddenQuestSpec hiddenQuest
    ) {
    }

    public record RubricSpec(String name, String description, int weight, boolean visibleToLearner) {
    }

    public record HiddenCaseSpec(String title, String description) {
    }

    public record EndingSpec(String grade, String title, String teaser) {
    }

    public record HiddenQuestSpec(String plant, String condition, String revealOnSuccess, String revealOnMiss) {
    }

    public record FileEntry(String path, String content) {
    }
}

package kr.co.workaround.advisor.adapter.in.web.dto;

public record MissionSummary(
        String id, int stage, String stageTitle, String title, String difficulty,
        String scope, String domain, String domainEmoji, String status
) {
}

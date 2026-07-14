package kr.co.workaround.advisor.adapter.in.web.dto;

import java.time.Instant;

public record HistoryItem(String missionId, String title, String domain, int stage, int overall, Instant completedAt) {
}

package kr.co.workaround.advisor.adapter.in.web.dto;

import kr.co.workaround.advisor.domain.mission.content.Briefing;
import kr.co.workaround.advisor.domain.mission.content.Ending;
import kr.co.workaround.advisor.domain.mission.content.ExplainTask;
import kr.co.workaround.advisor.domain.mission.content.SourceFile;

import java.util.List;

/**
 * Learner-facing mission view. rubric only includes visibleToLearner==true items;
 * hiddenCases are collapsed to a bare count (contents stay hidden until review); hiddenQuest
 * (if any) is never exposed here — only the review, after the fact, stamps found/not-found.
 */
public record MissionResponse(
        String id, int stage, String stageTitle, String missionType, String difficulty, String scope,
        String domain, String domainEmoji, String title, int estimatedMinutes, String status,
        Briefing briefing, String scenario,
        List<SourceFile> legacyFiles, List<SourceFile> providedFiles,
        List<String> requirements, List<String> constraints, List<String> learningGoals, List<String> hints,
        List<RubricView> rubric, int hiddenCaseCount, List<Ending> endings, ExplainTask explainTask
) {
}

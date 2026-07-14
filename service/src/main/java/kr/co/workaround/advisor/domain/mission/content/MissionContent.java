package kr.co.workaround.advisor.domain.mission.content;

import java.util.List;

/**
 * Rich mission content. Frozen field-name contract with the frontend —
 * see frontend/src/modules/missions/data/sampleContent.js.
 */
public record MissionContent(
        Briefing briefing,
        String scenario,
        List<SourceFile> legacyFiles,
        List<SourceFile> providedFiles,
        List<String> requirements,
        List<String> constraints,
        List<String> learningGoals,
        List<String> hints,
        List<RubricItem> rubric,
        List<HiddenCase> hiddenCases,
        List<Ending> endings,
        ExplainTask explainTask,
        HiddenQuest hiddenQuest
) {
}

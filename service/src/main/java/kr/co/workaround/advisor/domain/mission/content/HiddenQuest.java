package kr.co.workaround.advisor.domain.mission.content;

/**
 * Optional planted "hidden quest" — a detail seeded in the briefing/scenario/legacy code
 * that the learner is never explicitly asked to notice. Nullable: not every mission has one.
 * See docs/M1-BACKEND-PLAN.md constraints (schema addition since the plan was written).
 */
public record HiddenQuest(
        String plant,
        String condition,
        String revealOnSuccess,
        String revealOnMiss
) {
}

package kr.co.workaround.advisor.adapter.in.web.dto;

/** Learner-facing rubric item — visibleToLearner is filtered upstream and dropped here (see plan §5 example JSON). */
public record RubricView(String name, String description, int weight) {
}

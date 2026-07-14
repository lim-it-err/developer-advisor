package kr.co.workaround.advisor.domain.review.content;

/**
 * Review-side stamp for the mission's planted hidden quest (see
 * kr.co.workaround.advisor.domain.mission.content.HiddenQuest). Nullable — only present
 * when the mission had a hidden quest planted. Frontend contract:
 * ReviewPage.vue reads review.hiddenQuest.found / .text.
 */
public record ReviewHiddenQuest(boolean found, String text) {
}

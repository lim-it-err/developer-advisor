package kr.co.workaround.advisor.domain.mission.content;

/**
 * Mission-stage ending branch teaser. grade is one of calm|hotfix|dawn|hidden;
 * the hidden ending's title is always "???" until the review stamps it.
 */
public record Ending(String grade, String title, String teaser) {
}

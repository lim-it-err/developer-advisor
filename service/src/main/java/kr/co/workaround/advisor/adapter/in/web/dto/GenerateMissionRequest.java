package kr.co.workaround.advisor.adapter.in.web.dto;

/** Optional overrides — when blank/null, the mission is generated from the track's own defaults. */
public record GenerateMissionRequest(String missionType, String scope, String difficulty) {
}

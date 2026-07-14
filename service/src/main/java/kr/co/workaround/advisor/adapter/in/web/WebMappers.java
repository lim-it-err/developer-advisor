package kr.co.workaround.advisor.adapter.in.web;

import kr.co.workaround.advisor.adapter.in.web.dto.ChatMessageDto;
import kr.co.workaround.advisor.adapter.in.web.dto.MissionResponse;
import kr.co.workaround.advisor.adapter.in.web.dto.MissionSummary;
import kr.co.workaround.advisor.adapter.in.web.dto.ReviewResponse;
import kr.co.workaround.advisor.adapter.in.web.dto.RubricView;
import kr.co.workaround.advisor.adapter.in.web.dto.TrackResponse;
import kr.co.workaround.advisor.domain.chat.ChatMessage;
import kr.co.workaround.advisor.domain.mission.Mission;
import kr.co.workaround.advisor.domain.mission.content.RubricItem;
import kr.co.workaround.advisor.domain.review.Review;
import kr.co.workaround.advisor.domain.track.Track;

import java.util.List;

/** Pure domain -> DTO conversion for the web adapter. */
public final class WebMappers {

    private WebMappers() {
    }

    public static TrackResponse toResponse(Track track, List<Mission> missions) {
        return new TrackResponse(
                track.id(), track.domain(), track.difficulty().name(), track.focus(), track.title(),
                track.createdAt(), missions.stream().map(WebMappers::toSummary).toList()
        );
    }

    public static MissionSummary toSummary(Mission m) {
        return new MissionSummary(m.id(), m.stage(), m.stageTitle(), m.title(), m.difficulty().name(),
                m.scope(), m.domain(), m.domainEmoji(), m.status().name());
    }

    public static MissionResponse toResponse(Mission m) {
        List<RubricView> visibleRubric = m.content().rubric().stream()
                .filter(RubricItem::visibleToLearner)
                .map(r -> new RubricView(r.name(), r.description(), r.weight()))
                .toList();
        return new MissionResponse(
                m.id(), m.stage(), m.stageTitle(), m.missionType(), m.difficulty().name(), m.scope(),
                m.domain(), m.domainEmoji(), m.title(), m.estimatedMinutes(), m.status().name(),
                m.content().briefing(), m.content().scenario(),
                m.content().legacyFiles(), m.content().providedFiles(),
                m.content().requirements(), m.content().constraints(),
                m.content().learningGoals(), m.content().hints(),
                visibleRubric, m.content().hiddenCases().size(),
                m.content().endings(), m.content().explainTask()
        );
    }

    public static ReviewResponse toResponse(Review r) {
        return new ReviewResponse(
                r.id(), r.submissionId(), r.overall(), r.content().summary(), r.content().items(),
                r.content().hiddenCases(), r.content().nextSteps(), r.content().followUpQuestions(),
                r.content().scenario(), r.content().ending(), r.content().reputation(), r.content().explainFeedback()
        );
    }

    public static ChatMessageDto toDto(ChatMessage m) {
        return new ChatMessageDto(m.role().name().toLowerCase(), m.text(), m.at());
    }
}

package kr.co.workaround.advisor.adapter.out.persistence.mapper;

import kr.co.workaround.advisor.adapter.out.persistence.entity.ChatMessageEntity;
import kr.co.workaround.advisor.adapter.out.persistence.entity.MissionEntity;
import kr.co.workaround.advisor.adapter.out.persistence.entity.ReviewEntity;
import kr.co.workaround.advisor.adapter.out.persistence.entity.SubmissionEntity;
import kr.co.workaround.advisor.adapter.out.persistence.entity.SubmittedFileEntity;
import kr.co.workaround.advisor.adapter.out.persistence.entity.TrackEntity;
import kr.co.workaround.advisor.domain.chat.ChatMessage;
import kr.co.workaround.advisor.domain.mission.Mission;
import kr.co.workaround.advisor.domain.review.Review;
import kr.co.workaround.advisor.domain.submission.Submission;
import kr.co.workaround.advisor.domain.submission.SubmittedFile;
import kr.co.workaround.advisor.domain.track.Track;

import java.util.List;

/** Pure entity <-> domain conversion, no persistence side effects. */
public final class PersistenceMapper {

    private PersistenceMapper() {
    }

    public static TrackEntity toEntity(Track track) {
        return new TrackEntity(track.id(), track.domain(), track.difficulty(), track.focus(),
                track.title(), track.createdAt());
    }

    public static Track toDomain(TrackEntity e) {
        return new Track(e.getId(), e.getDomain(), e.getDifficulty(), e.getFocus(), e.getTitle(), e.getCreatedAt());
    }

    public static MissionEntity toEntity(Mission m) {
        return new MissionEntity(m.id(), m.trackId(), m.stage(), m.stageTitle(), m.missionType(),
                m.difficulty(), m.scope(), m.domain(), m.domainEmoji(), m.title(), m.estimatedMinutes(),
                m.status(), m.content(), m.createdAt());
    }

    public static Mission toDomain(MissionEntity e) {
        return new Mission(e.getId(), e.getTrackId(), e.getStage(), e.getStageTitle(), e.getMissionType(),
                e.getDifficulty(), e.getScope(), e.getDomain(), e.getDomainEmoji(), e.getTitle(),
                e.getEstimatedMinutes(), e.getStatus(), e.getContent(), e.getCreatedAt());
    }

    public static SubmissionEntity toEntity(Submission s) {
        return new SubmissionEntity(s.id(), s.missionId(), s.explanation(), s.submittedAt());
    }

    public static Submission toDomain(SubmissionEntity e, List<SubmittedFileEntity> files) {
        List<SubmittedFile> domainFiles = files.stream()
                .map(f -> new SubmittedFile(f.getPath(), f.getContent()))
                .toList();
        return new Submission(e.getId(), e.getMissionId(), domainFiles, e.getExplanation(), e.getSubmittedAt());
    }

    public static SubmittedFileEntity toEntity(String submissionId, SubmittedFile f, int ord) {
        return new SubmittedFileEntity(submissionId, f.path(), f.content(), ord);
    }

    public static ReviewEntity toEntity(Review r) {
        return new ReviewEntity(r.id(), r.submissionId(), r.overall(), r.status(), r.content(), r.createdAt());
    }

    public static Review toDomain(ReviewEntity e) {
        return new Review(e.getId(), e.getSubmissionId(), e.getOverall(), e.getStatus(), e.getContent(), e.getCreatedAt());
    }

    public static ChatMessageEntity toEntity(ChatMessage m) {
        return new ChatMessageEntity(m.id(), m.missionId(), m.role(), m.text(), m.at());
    }

    public static ChatMessage toDomain(ChatMessageEntity e) {
        return new ChatMessage(e.getId(), e.getMissionId(), e.getRole(), e.getText(), e.getAt());
    }
}

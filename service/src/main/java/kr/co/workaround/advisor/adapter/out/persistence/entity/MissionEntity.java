package kr.co.workaround.advisor.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import kr.co.workaround.advisor.adapter.out.persistence.converter.MissionContentConverter;
import kr.co.workaround.advisor.domain.mission.MissionStatus;
import kr.co.workaround.advisor.domain.mission.content.MissionContent;
import kr.co.workaround.advisor.domain.track.Difficulty;

import java.time.Instant;

@Entity
@Table(name = "missions")
public class MissionEntity {

    @Id
    private String id;

    @Column(name = "track_id", nullable = false)
    private String trackId;

    private int stage;

    @Column(name = "stage_title")
    private String stageTitle;

    @Column(name = "mission_type")
    private String missionType;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    private String scope;

    private String domain;

    @Column(name = "domain_emoji")
    private String domainEmoji;

    private String title;

    @Column(name = "estimated_minutes")
    private int estimatedMinutes;

    @Enumerated(EnumType.STRING)
    private MissionStatus status;

    @Lob
    @Convert(converter = MissionContentConverter.class)
    @Column(columnDefinition = "CLOB")
    private MissionContent content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected MissionEntity() {
    }

    public MissionEntity(String id, String trackId, int stage, String stageTitle, String missionType,
                          Difficulty difficulty, String scope, String domain, String domainEmoji, String title,
                          int estimatedMinutes, MissionStatus status, MissionContent content, Instant createdAt) {
        this.id = id;
        this.trackId = trackId;
        this.stage = stage;
        this.stageTitle = stageTitle;
        this.missionType = missionType;
        this.difficulty = difficulty;
        this.scope = scope;
        this.domain = domain;
        this.domainEmoji = domainEmoji;
        this.title = title;
        this.estimatedMinutes = estimatedMinutes;
        this.status = status;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getTrackId() {
        return trackId;
    }

    public int getStage() {
        return stage;
    }

    public String getStageTitle() {
        return stageTitle;
    }

    public String getMissionType() {
        return missionType;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public String getScope() {
        return scope;
    }

    public String getDomain() {
        return domain;
    }

    public String getDomainEmoji() {
        return domainEmoji;
    }

    public String getTitle() {
        return title;
    }

    public int getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public MissionStatus getStatus() {
        return status;
    }

    public void setStatus(MissionStatus status) {
        this.status = status;
    }

    public MissionContent getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

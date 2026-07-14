package kr.co.workaround.advisor.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import kr.co.workaround.advisor.domain.track.Difficulty;

import java.time.Instant;

@Entity
@Table(name = "tracks")
public class TrackEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String domain;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    private String focus;

    private String title;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected TrackEntity() {
    }

    public TrackEntity(String id, String domain, Difficulty difficulty, String focus, String title, Instant createdAt) {
        this.id = id;
        this.domain = domain;
        this.difficulty = difficulty;
        this.focus = focus;
        this.title = title;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getDomain() {
        return domain;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public String getFocus() {
        return focus;
    }

    public String getTitle() {
        return title;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

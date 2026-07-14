package kr.co.workaround.advisor.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Files are stored in the sibling {@link SubmittedFileEntity} table and loaded/saved
 * explicitly by the service layer via SubmittedFileRepository (no JPA relationship —
 * see plan §3.2: "FetchType LAZY, 서비스에서 명시 로드").
 */
@Entity
@Table(name = "submissions")
public class SubmissionEntity {

    @Id
    private String id;

    @Column(name = "mission_id", nullable = false)
    private String missionId;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String explanation;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    protected SubmissionEntity() {
    }

    public SubmissionEntity(String id, String missionId, String explanation, Instant submittedAt) {
        this.id = id;
        this.missionId = missionId;
        this.explanation = explanation;
        this.submittedAt = submittedAt;
    }

    public String getId() {
        return id;
    }

    public String getMissionId() {
        return missionId;
    }

    public String getExplanation() {
        return explanation;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }
}

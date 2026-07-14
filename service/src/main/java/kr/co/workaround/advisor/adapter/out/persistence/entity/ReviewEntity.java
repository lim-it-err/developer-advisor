package kr.co.workaround.advisor.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import kr.co.workaround.advisor.adapter.out.persistence.converter.ReviewContentConverter;
import kr.co.workaround.advisor.domain.review.ReviewStatus;
import kr.co.workaround.advisor.domain.review.content.ReviewContent;

import java.time.Instant;

@Entity
@Table(name = "reviews")
public class ReviewEntity {

    @Id
    private String id;

    @Column(name = "submission_id", nullable = false, unique = true)
    private String submissionId;

    private int overall;

    @Enumerated(EnumType.STRING)
    private ReviewStatus status;

    @Lob
    @Convert(converter = ReviewContentConverter.class)
    @Column(columnDefinition = "CLOB")
    private ReviewContent content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ReviewEntity() {
    }

    public ReviewEntity(String id, String submissionId, int overall, ReviewStatus status,
                         ReviewContent content, Instant createdAt) {
        this.id = id;
        this.submissionId = submissionId;
        this.overall = overall;
        this.status = status;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public int getOverall() {
        return overall;
    }

    public ReviewStatus getStatus() {
        return status;
    }

    public ReviewContent getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

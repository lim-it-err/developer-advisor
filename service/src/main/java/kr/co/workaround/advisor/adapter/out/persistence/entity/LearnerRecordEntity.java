package kr.co.workaround.advisor.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(
        name = "learner_records",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_learner_record_scope",
                columnNames = {"nickname", "mission_id", "kind"}
        )
)
public class LearnerRecordEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "mission_id", nullable = false)
    private String missionId;

    @Column(nullable = false)
    private String kind;

    @Lob
    @Column(columnDefinition = "CLOB", nullable = false)
    private String json;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected LearnerRecordEntity() {
    }

    public LearnerRecordEntity(String id, String nickname, String missionId, String kind,
                               String json, Instant updatedAt) {
        this.id = id;
        this.nickname = nickname;
        this.missionId = missionId;
        this.kind = kind;
        this.json = json;
        this.updatedAt = updatedAt;
    }

    public void replace(String json, Instant updatedAt) {
        this.json = json;
        this.updatedAt = updatedAt;
    }

    public String getJson() {
        return json;
    }
}

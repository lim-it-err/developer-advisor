package kr.co.workaround.advisor.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "learner_journals")
public class LearnerJournalEntity {

    @Id
    private String nickname;

    @Lob
    @Column(columnDefinition = "CLOB", nullable = false)
    private String json;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected LearnerJournalEntity() {
    }

    public LearnerJournalEntity(String nickname, String json, Instant updatedAt) {
        this.nickname = nickname;
        this.json = json;
        this.updatedAt = updatedAt;
    }

    public void replace(String json, Instant updatedAt) {
        this.json = json;
        this.updatedAt = updatedAt;
    }

    public String getNickname() {
        return nickname;
    }

    public String getJson() {
        return json;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

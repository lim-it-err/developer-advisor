package kr.co.workaround.advisor.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import kr.co.workaround.advisor.domain.chat.ChatRole;

import java.time.Instant;

@Entity
@Table(name = "chat_messages")
public class ChatMessageEntity {

    @Id
    private String id;

    @Column(name = "mission_id", nullable = false)
    private String missionId;

    @Enumerated(EnumType.STRING)
    private ChatRole role;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String text;

    @Column(name = "at", nullable = false)
    private Instant at;

    protected ChatMessageEntity() {
    }

    public ChatMessageEntity(String id, String missionId, ChatRole role, String text, Instant at) {
        this.id = id;
        this.missionId = missionId;
        this.role = role;
        this.text = text;
        this.at = at;
    }

    public String getId() {
        return id;
    }

    public String getMissionId() {
        return missionId;
    }

    public ChatRole getRole() {
        return role;
    }

    public String getText() {
        return text;
    }

    public Instant getAt() {
        return at;
    }
}

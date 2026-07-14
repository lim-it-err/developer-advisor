package kr.co.workaround.advisor.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "submitted_files")
public class SubmittedFileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private String submissionId;

    private String path;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String content;

    @Column(name = "ord")
    private int ord;

    protected SubmittedFileEntity() {
    }

    public SubmittedFileEntity(String submissionId, String path, String content, int ord) {
        this.submissionId = submissionId;
        this.path = path;
        this.content = content;
        this.ord = ord;
    }

    public Long getId() {
        return id;
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public String getPath() {
        return path;
    }

    public String getContent() {
        return content;
    }

    public int getOrd() {
        return ord;
    }
}

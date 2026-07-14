package kr.co.workaround.advisor.adapter.out.persistence.repo;

import kr.co.workaround.advisor.adapter.out.persistence.entity.SubmittedFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubmittedFileRepository extends JpaRepository<SubmittedFileEntity, Long> {

    List<SubmittedFileEntity> findBySubmissionIdOrderByOrdAsc(String submissionId);
}

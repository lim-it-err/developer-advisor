package kr.co.workaround.advisor.adapter.out.persistence.repo;

import kr.co.workaround.advisor.adapter.out.persistence.entity.ReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<ReviewEntity, String> {

    Optional<ReviewEntity> findBySubmissionId(String submissionId);
}

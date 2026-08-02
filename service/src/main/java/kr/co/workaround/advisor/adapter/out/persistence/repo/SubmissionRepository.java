package kr.co.workaround.advisor.adapter.out.persistence.repo;

import kr.co.workaround.advisor.adapter.out.persistence.entity.SubmissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubmissionRepository extends JpaRepository<SubmissionEntity, String> {

    List<SubmissionEntity> findByNicknameAndMissionIdOrderBySubmittedAtAsc(String nickname, String missionId);
}

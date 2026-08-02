package kr.co.workaround.advisor.adapter.out.persistence.repo;

import kr.co.workaround.advisor.adapter.out.persistence.entity.LearnerRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearnerRecordRepository extends JpaRepository<LearnerRecordEntity, String> {

    Optional<LearnerRecordEntity> findByNicknameAndMissionIdAndKind(String nickname, String missionId, String kind);
}

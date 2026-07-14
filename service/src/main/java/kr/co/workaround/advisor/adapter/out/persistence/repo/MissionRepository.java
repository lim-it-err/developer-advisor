package kr.co.workaround.advisor.adapter.out.persistence.repo;

import kr.co.workaround.advisor.adapter.out.persistence.entity.MissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MissionRepository extends JpaRepository<MissionEntity, String> {

    List<MissionEntity> findByTrackIdOrderByStageAsc(String trackId);
}

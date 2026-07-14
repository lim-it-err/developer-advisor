package kr.co.workaround.advisor.adapter.out.persistence.repo;

import kr.co.workaround.advisor.adapter.out.persistence.entity.TrackEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackRepository extends JpaRepository<TrackEntity, String> {
}

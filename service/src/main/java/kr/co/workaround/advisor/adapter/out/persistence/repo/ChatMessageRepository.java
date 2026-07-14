package kr.co.workaround.advisor.adapter.out.persistence.repo;

import kr.co.workaround.advisor.adapter.out.persistence.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, String> {

    List<ChatMessageEntity> findByMissionIdOrderByAtAsc(String missionId);
}

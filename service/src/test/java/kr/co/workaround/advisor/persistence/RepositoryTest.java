package kr.co.workaround.advisor.persistence;

import kr.co.workaround.advisor.adapter.out.persistence.entity.MissionEntity;
import kr.co.workaround.advisor.adapter.out.persistence.entity.TrackEntity;
import kr.co.workaround.advisor.adapter.out.persistence.repo.MissionRepository;
import kr.co.workaround.advisor.adapter.out.persistence.repo.TrackRepository;
import kr.co.workaround.advisor.domain.mission.MissionStatus;
import kr.co.workaround.advisor.domain.mission.content.Briefing;
import kr.co.workaround.advisor.domain.mission.content.Ending;
import kr.co.workaround.advisor.domain.mission.content.ExplainTask;
import kr.co.workaround.advisor.domain.mission.content.MissionContent;
import kr.co.workaround.advisor.domain.mission.content.RubricItem;
import kr.co.workaround.advisor.domain.mission.content.SourceFile;
import kr.co.workaround.advisor.domain.track.Difficulty;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class RepositoryTest {

    @org.springframework.beans.factory.annotation.Autowired
    private TrackRepository trackRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private MissionRepository missionRepository;

    @Test
    void savesAndReloadsTrackAndMissionWithJsonRoundTrip() {
        TrackEntity track = new TrackEntity("trk_test-1", "와인", Difficulty.Easy, "분리",
                "와인 도메인 · 분리의 감각 트랙", Instant.now());
        trackRepository.save(track);

        MissionContent content = new MissionContent(
                new Briefing("분리의 감각", "### 브리핑 본문"),
                "사내 복지몰에 붙어 있는 와인 추천 기능을 물려받았습니다.",
                List.of(new SourceFile("src/WineRecommender.java", "package kr.co.wine;")),
                List.of(),
                List.of("요구사항 1"),
                List.of("제약 1"),
                List.of("학습목표 1"),
                List.of("힌트 1"),
                List.of(new RubricItem("책임 분리", "설명", 30, true)),
                List.of(),
                List.of(new Ending("calm", "고요한 결말", "티저"), new Ending("hidden", "???", "티저")),
                new ExplainTask("소믈리에 출신 기획자", "설명해 보세요"),
                null
        );

        MissionEntity mission = new MissionEntity("msn_test-1", track.getId(), 1, "분리의 감각",
                "리팩토링", Difficulty.Easy, "단일 파일", "와인", "🍷",
                "와인 추천기의 뒤엉킨 책임 풀어내기", 90, MissionStatus.ACTIVE, content, Instant.now());
        missionRepository.save(mission);

        Optional<MissionEntity> reloaded = missionRepository.findById("msn_test-1");
        assertThat(reloaded).isPresent();
        MissionContent reloadedContent = reloaded.get().getContent();
        assertThat(reloadedContent).isEqualTo(content);
        assertThat(reloadedContent.rubric().get(0).name()).isEqualTo("책임 분리");
        assertThat(reloadedContent.hiddenQuest()).isNull();

        List<MissionEntity> byTrack = missionRepository.findByTrackIdOrderByStageAsc(track.getId());
        assertThat(byTrack).hasSize(1);
    }
}

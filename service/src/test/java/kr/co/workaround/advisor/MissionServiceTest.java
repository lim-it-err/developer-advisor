package kr.co.workaround.advisor;

import kr.co.workaround.advisor.application.MissionService;
import kr.co.workaround.advisor.application.TrackService;
import kr.co.workaround.advisor.domain.mission.Mission;
import kr.co.workaround.advisor.domain.mission.MissionStatus;
import kr.co.workaround.advisor.domain.track.Difficulty;
import kr.co.workaround.advisor.domain.track.Track;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class MissionServiceTest {

    @Autowired
    private TrackService trackService;

    @Autowired
    private MissionService missionService;

    @Test
    void generatesAndPersistsMissionForTrack() {
        Track track = trackService.create("와인", Difficulty.Easy, "분리");

        Mission mission = missionService.generate(track.id(), null, null, null);

        assertThat(mission.id()).isNotBlank();
        assertThat(mission.trackId()).isEqualTo(track.id());
        assertThat(mission.stage()).isEqualTo(1);
        assertThat(mission.status()).isEqualTo(MissionStatus.ACTIVE);
        assertThat(mission.content()).isNotNull();
        assertThat(mission.content().rubric()).isNotEmpty();

        Mission reloaded = missionService.get(mission.id());
        assertThat(reloaded).isEqualTo(mission);

        List<Mission> byTrack = missionService.listByTrack(track.id());
        assertThat(byTrack).hasSize(1);

        Mission completed = missionService.complete(mission.id());
        assertThat(completed.status()).isEqualTo(MissionStatus.COMPLETED);
    }
}

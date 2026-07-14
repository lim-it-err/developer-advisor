package kr.co.workaround.advisor.application;

import kr.co.workaround.advisor.adapter.out.persistence.entity.TrackEntity;
import kr.co.workaround.advisor.adapter.out.persistence.mapper.PersistenceMapper;
import kr.co.workaround.advisor.adapter.out.persistence.repo.TrackRepository;
import kr.co.workaround.advisor.application.exception.NotFoundException;
import kr.co.workaround.advisor.domain.track.Difficulty;
import kr.co.workaround.advisor.domain.track.Track;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class TrackService {

    private final TrackRepository trackRepository;

    public TrackService(TrackRepository trackRepository) {
        this.trackRepository = trackRepository;
    }

    @Transactional
    public Track create(String domain, Difficulty difficulty, String focus) {
        String id = Ids.next("trk_");
        String title = buildTitle(domain, focus);
        Track track = new Track(id, domain, difficulty, focus, title, Instant.now());
        trackRepository.save(PersistenceMapper.toEntity(track));
        return track;
    }

    @Transactional(readOnly = true)
    public Track get(String trackId) {
        TrackEntity entity = trackRepository.findById(trackId)
                .orElseThrow(() -> new NotFoundException("track " + trackId + " not found"));
        return PersistenceMapper.toDomain(entity);
    }

    private String buildTitle(String domain, String focus) {
        if (focus == null || focus.isBlank()) {
            return domain + " 도메인 트랙";
        }
        return domain + " 도메인 · " + focus + "의 감각 트랙";
    }
}

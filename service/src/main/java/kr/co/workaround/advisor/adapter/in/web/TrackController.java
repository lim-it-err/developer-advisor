package kr.co.workaround.advisor.adapter.in.web;

import jakarta.validation.Valid;
import kr.co.workaround.advisor.adapter.in.web.dto.CreateTrackRequest;
import kr.co.workaround.advisor.adapter.in.web.dto.TrackResponse;
import kr.co.workaround.advisor.application.MissionService;
import kr.co.workaround.advisor.application.TrackService;
import kr.co.workaround.advisor.domain.mission.Mission;
import kr.co.workaround.advisor.domain.track.Difficulty;
import kr.co.workaround.advisor.domain.track.Track;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/advisor/tracks")
public class TrackController {

    private final TrackService trackService;
    private final MissionService missionService;

    public TrackController(TrackService trackService, MissionService missionService) {
        this.trackService = trackService;
        this.missionService = missionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrackResponse create(@Valid @RequestBody CreateTrackRequest req) {
        Track track = trackService.create(req.domain(), Difficulty.valueOf(req.difficulty()), req.focus());
        return WebMappers.toResponse(track, List.of());
    }

    @GetMapping("/{id}")
    public TrackResponse get(@PathVariable String id) {
        Track track = trackService.get(id);
        List<Mission> missions = missionService.listByTrack(id);
        return WebMappers.toResponse(track, missions);
    }
}

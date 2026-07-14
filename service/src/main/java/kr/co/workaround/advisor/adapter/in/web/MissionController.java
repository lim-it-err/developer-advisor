package kr.co.workaround.advisor.adapter.in.web;

import kr.co.workaround.advisor.adapter.in.web.dto.GenerateMissionRequest;
import kr.co.workaround.advisor.adapter.in.web.dto.MissionResponse;
import kr.co.workaround.advisor.application.MissionService;
import kr.co.workaround.advisor.domain.mission.Mission;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/advisor")
public class MissionController {

    private final MissionService missionService;

    public MissionController(MissionService missionService) {
        this.missionService = missionService;
    }

    @PostMapping("/tracks/{trackId}/missions")
    @ResponseStatus(HttpStatus.CREATED)
    public MissionResponse generate(@PathVariable String trackId,
                                     @RequestBody(required = false) GenerateMissionRequest req) {
        String missionType = req == null ? null : req.missionType();
        String scope = req == null ? null : req.scope();
        String difficulty = req == null ? null : req.difficulty();
        Mission mission = missionService.generate(trackId, missionType, scope, difficulty);
        return WebMappers.toResponse(mission);
    }

    @GetMapping("/missions/{id}")
    public MissionResponse get(@PathVariable String id) {
        return WebMappers.toResponse(missionService.get(id));
    }

    @PostMapping("/missions/{id}/complete")
    public MissionResponse complete(@PathVariable String id) {
        return WebMappers.toResponse(missionService.complete(id));
    }
}

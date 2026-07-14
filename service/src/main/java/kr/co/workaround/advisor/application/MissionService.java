package kr.co.workaround.advisor.application;

import kr.co.workaround.advisor.adapter.out.persistence.entity.MissionEntity;
import kr.co.workaround.advisor.adapter.out.persistence.entity.TrackEntity;
import kr.co.workaround.advisor.adapter.out.persistence.mapper.PersistenceMapper;
import kr.co.workaround.advisor.adapter.out.persistence.repo.MissionRepository;
import kr.co.workaround.advisor.adapter.out.persistence.repo.TrackRepository;
import kr.co.workaround.advisor.application.exception.NotFoundException;
import kr.co.workaround.advisor.application.port.LlmClient;
import kr.co.workaround.advisor.application.port.LlmRole;
import kr.co.workaround.advisor.adapter.out.llm.PromptLoader;
import kr.co.workaround.advisor.domain.mission.Mission;
import kr.co.workaround.advisor.domain.mission.MissionStatus;
import kr.co.workaround.advisor.domain.mission.content.MissionContent;
import kr.co.workaround.advisor.domain.track.Difficulty;
import kr.co.workaround.advisor.domain.track.Track;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MissionService {

    private static final Map<String, String> DOMAIN_EMOJI = Map.of(
            "와인", "🍷", "가구", "🪑", "버스", "🚌", "적금", "🏦", "베이커리", "🍞", "부동산", "🏢", "철도", "🚆"
    );

    private final MissionRepository missionRepository;
    private final TrackRepository trackRepository;
    private final LlmClient llmClient;
    private final PromptLoader promptLoader;

    public MissionService(MissionRepository missionRepository, TrackRepository trackRepository,
                           LlmClient llmClient, PromptLoader promptLoader) {
        this.missionRepository = missionRepository;
        this.trackRepository = trackRepository;
        this.llmClient = llmClient;
        this.promptLoader = promptLoader;
    }

    @Transactional
    public Mission generate(String trackId, String missionTypeOverride, String scopeOverride, String difficultyOverride) {
        TrackEntity trackEntity = trackRepository.findById(trackId)
                .orElseThrow(() -> new NotFoundException("track " + trackId + " not found"));
        Track track = PersistenceMapper.toDomain(trackEntity);

        int stage = missionRepository.findByTrackIdOrderByStageAsc(trackId).size() + 1;
        String stageTitle = track.focus() == null || track.focus().isBlank() ? "스테이지 " + stage : track.focus() + "의 감각";
        Difficulty difficulty = difficultyOverride != null ? Difficulty.valueOf(difficultyOverride) : track.difficulty();
        String missionType = missionTypeOverride != null ? missionTypeOverride : "리팩토링";
        String scope = scopeOverride != null ? scopeOverride : "단일 파일";
        String domainEmoji = DOMAIN_EMOJI.getOrDefault(track.domain(), "🧩");

        Map<String, String> slots = new HashMap<>();
        slots.put("domain", track.domain());
        slots.put("domainEmoji", domainEmoji);
        slots.put("difficulty", difficulty.name());
        slots.put("scope", scope);
        slots.put("stage", String.valueOf(stage));
        slots.put("stageTitle", stageTitle);
        slots.put("focus", track.focus() == null ? "" : track.focus());
        slots.put("missionType", missionType);
        slots.put("priorWeaknesses", "");
        slots.put("domainPool", track.domain());
        String prompt = promptLoader.render("generate-mission", slots);

        MissionContent content = llmClient.complete(LlmRole.GENERATE, prompt, MissionContent.class);

        Mission mission = new Mission(
                Ids.next("msn_"), trackId, stage, stageTitle, missionType, difficulty, scope,
                track.domain(), domainEmoji, content.briefing().title(), 90, MissionStatus.ACTIVE,
                content, Instant.now()
        );
        missionRepository.save(PersistenceMapper.toEntity(mission));
        return mission;
    }

    @Transactional(readOnly = true)
    public Mission get(String missionId) {
        MissionEntity entity = missionRepository.findById(missionId)
                .orElseThrow(() -> new NotFoundException("mission " + missionId + " not found"));
        return PersistenceMapper.toDomain(entity);
    }

    @Transactional(readOnly = true)
    public List<Mission> listByTrack(String trackId) {
        return missionRepository.findByTrackIdOrderByStageAsc(trackId).stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Transactional
    public Mission complete(String missionId) {
        MissionEntity entity = missionRepository.findById(missionId)
                .orElseThrow(() -> new NotFoundException("mission " + missionId + " not found"));
        entity.setStatus(MissionStatus.COMPLETED);
        missionRepository.save(entity);
        return PersistenceMapper.toDomain(entity);
    }
}

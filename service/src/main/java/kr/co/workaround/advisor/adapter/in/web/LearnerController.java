package kr.co.workaround.advisor.adapter.in.web;

import kr.co.workaround.advisor.adapter.in.web.dto.HistoryItem;
import kr.co.workaround.advisor.adapter.out.persistence.entity.ReviewEntity;
import kr.co.workaround.advisor.adapter.out.persistence.repo.MissionRepository;
import kr.co.workaround.advisor.adapter.out.persistence.repo.ReviewRepository;
import kr.co.workaround.advisor.adapter.out.persistence.repo.SubmissionRepository;
import kr.co.workaround.advisor.domain.mission.Mission;
import kr.co.workaround.advisor.domain.mission.MissionStatus;
import kr.co.workaround.advisor.adapter.out.persistence.mapper.PersistenceMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * MVP single-learner history: no learnerId, walks every COMPLETED mission and joins its
 * latest submission's review for the overall score. This is a small addition beyond the
 * plan's 5 application services (TrackService/MissionService/SubmissionService/ReviewService/
 * ChatService) — see docs/M1-BACKEND-PLAN.md "구현 노트".
 */
@RestController
@RequestMapping("/api/advisor/learners/me/history")
public class LearnerController {

    private final MissionRepository missionRepository;
    private final SubmissionRepository submissionRepository;
    private final ReviewRepository reviewRepository;

    public LearnerController(MissionRepository missionRepository, SubmissionRepository submissionRepository,
                              ReviewRepository reviewRepository) {
        this.missionRepository = missionRepository;
        this.submissionRepository = submissionRepository;
        this.reviewRepository = reviewRepository;
    }

    @GetMapping
    public List<HistoryItem> history() {
        List<HistoryItem> items = new ArrayList<>();
        for (var missionEntity : missionRepository.findAll()) {
            if (missionEntity.getStatus() != MissionStatus.COMPLETED) {
                continue;
            }
            Mission mission = PersistenceMapper.toDomain(missionEntity);
            var submissions = submissionRepository.findAll().stream()
                    .filter(s -> s.getMissionId().equals(mission.id()))
                    .toList();
            for (var submission : submissions) {
                Optional<ReviewEntity> review = reviewRepository.findBySubmissionId(submission.getId());
                review.ifPresent(r -> items.add(new HistoryItem(
                        mission.id(), mission.title(), mission.domain(), mission.stage(),
                        r.getOverall(), r.getCreatedAt()
                )));
            }
        }
        return items;
    }
}

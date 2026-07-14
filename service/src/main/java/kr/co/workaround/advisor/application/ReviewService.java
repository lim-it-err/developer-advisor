package kr.co.workaround.advisor.application;

import kr.co.workaround.advisor.adapter.out.llm.PromptLoader;
import kr.co.workaround.advisor.adapter.out.persistence.entity.ChatMessageEntity;
import kr.co.workaround.advisor.adapter.out.persistence.entity.ReviewEntity;
import kr.co.workaround.advisor.adapter.out.persistence.mapper.PersistenceMapper;
import kr.co.workaround.advisor.adapter.out.persistence.repo.ChatMessageRepository;
import kr.co.workaround.advisor.adapter.out.persistence.repo.ReviewRepository;
import kr.co.workaround.advisor.application.exception.NotFoundException;
import kr.co.workaround.advisor.application.port.LlmClient;
import kr.co.workaround.advisor.application.port.LlmRole;
import kr.co.workaround.advisor.domain.mission.Mission;
import kr.co.workaround.advisor.domain.mission.content.Ending;
import kr.co.workaround.advisor.domain.mission.content.HiddenCase;
import kr.co.workaround.advisor.domain.mission.content.MissionContent;
import kr.co.workaround.advisor.domain.mission.content.RubricItem;
import kr.co.workaround.advisor.domain.review.Review;
import kr.co.workaround.advisor.domain.review.ReviewStatus;
import kr.co.workaround.advisor.domain.review.content.ExplainFeedback;
import kr.co.workaround.advisor.domain.review.content.ReviewContent;
import kr.co.workaround.advisor.domain.review.content.ReviewItem;
import kr.co.workaround.advisor.domain.submission.Submission;
import kr.co.workaround.advisor.domain.submission.SubmittedFile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final MissionService missionService;
    private final SubmissionService submissionService;
    private final ReviewRepository reviewRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final LlmClient llmClient;
    private final PromptLoader promptLoader;

    public ReviewService(MissionService missionService, SubmissionService submissionService,
                          ReviewRepository reviewRepository, ChatMessageRepository chatMessageRepository,
                          LlmClient llmClient, PromptLoader promptLoader) {
        this.missionService = missionService;
        this.submissionService = submissionService;
        this.reviewRepository = reviewRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.llmClient = llmClient;
        this.promptLoader = promptLoader;
    }

    /** Outcome of a submit-and-review cycle. */
    public record SubmissionOutcome(String submissionId, String reviewId, ReviewStatus status) {
    }

    @Transactional
    public SubmissionOutcome submit(String missionId, List<SubmittedFile> files, String explanation) {
        Mission mission = missionService.get(missionId);
        Submission submission = submissionService.create(missionId, files, explanation);

        MissionContent content = mission.content();
        String chatTranscript = chatMessageRepository.findByMissionIdOrderByAtAsc(missionId).stream()
                .map(m -> m.getRole().name().toLowerCase() + ": " + m.getText())
                .collect(Collectors.joining("\n"));
        String filesText = files.stream()
                .map(f -> "// " + f.path() + "\n" + f.content())
                .collect(Collectors.joining("\n\n"));

        Map<String, String> slots = Map.of(
                "missionTitle", mission.title(),
                "scenario", content.scenario(),
                "requirements", String.join("\n- ", content.requirements()),
                "constraints", String.join("\n- ", content.constraints()),
                "rubric", content.rubric().stream()
                        .map(RubricItem::name).collect(Collectors.joining(", ")),
                "hiddenCases", content.hiddenCases().stream()
                        .map(HiddenCase::title).collect(Collectors.joining(", ")),
                "endings", content.endings().stream()
                        .map(Ending::grade).collect(Collectors.joining(", ")),
                "files", filesText,
                "chatTranscript", chatTranscript
        );
        String prompt = promptLoader.render("review-submission", slots);

        ReviewContent reviewContent = llmClient.complete(LlmRole.REVIEW, prompt, ReviewContent.class);

        if (content.explainTask() != null && explanation != null && !explanation.isBlank()) {
            Map<String, String> explainSlots = Map.of(
                    "audience", content.explainTask().audience(),
                    "explainPrompt", content.explainTask().prompt(),
                    "explanationText", explanation,
                    "missionContext", mission.title()
            );
            String explainPrompt = promptLoader.render("evaluate-explanation", explainSlots);
            ExplainFeedback explainFeedback = llmClient.complete(LlmRole.REVIEW, explainPrompt, ExplainFeedback.class);
            reviewContent = new ReviewContent(
                    reviewContent.summary(), reviewContent.items(), reviewContent.hiddenCases(),
                    reviewContent.nextSteps(), reviewContent.followUpQuestions(), reviewContent.scenario(),
                    reviewContent.ending(), reviewContent.reputation(), explainFeedback, reviewContent.hiddenQuest()
            );
        }

        int overall = reviewContent.items().stream().mapToInt(ReviewItem::score).sum();

        Review review = new Review(Ids.next("rev_"), submission.id(), overall, ReviewStatus.READY,
                reviewContent, Instant.now());
        reviewRepository.save(PersistenceMapper.toEntity(review));

        return new SubmissionOutcome(submission.id(), review.id(), review.status());
    }

    @Transactional(readOnly = true)
    public Review getBySubmission(String submissionId) {
        ReviewEntity entity = reviewRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new NotFoundException("review for submission " + submissionId + " not found"));
        return PersistenceMapper.toDomain(entity);
    }
}

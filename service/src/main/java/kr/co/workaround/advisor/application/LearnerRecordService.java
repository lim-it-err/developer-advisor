package kr.co.workaround.advisor.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.workaround.advisor.adapter.out.persistence.entity.LearnerJournalEntity;
import kr.co.workaround.advisor.adapter.out.persistence.entity.LearnerRecordEntity;
import kr.co.workaround.advisor.adapter.out.persistence.mapper.PersistenceMapper;
import kr.co.workaround.advisor.adapter.out.persistence.repo.LearnerJournalRepository;
import kr.co.workaround.advisor.adapter.out.persistence.repo.LearnerRecordRepository;
import kr.co.workaround.advisor.adapter.out.persistence.repo.ReviewRepository;
import kr.co.workaround.advisor.application.exception.NotFoundException;
import kr.co.workaround.advisor.domain.review.Review;
import kr.co.workaround.advisor.domain.review.ReviewStatus;
import kr.co.workaround.advisor.domain.review.content.ReviewContent;
import kr.co.workaround.advisor.domain.review.content.ReviewItem;
import kr.co.workaround.advisor.domain.submission.Submission;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class LearnerRecordService {

    private final SubmissionService submissionService;
    private final ReviewRepository reviewRepository;
    private final LearnerJournalRepository journalRepository;
    private final LearnerRecordRepository recordRepository;
    private final ObjectMapper objectMapper;

    public LearnerRecordService(SubmissionService submissionService, ReviewRepository reviewRepository,
                                LearnerJournalRepository journalRepository, LearnerRecordRepository recordRepository,
                                ObjectMapper objectMapper) {
        this.submissionService = submissionService;
        this.reviewRepository = reviewRepository;
        this.journalRepository = journalRepository;
        this.recordRepository = recordRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Review saveReview(String nickname, String missionId, String submissionId, ReviewContent content) {
        Submission submission = submissionService.get(submissionId);
        if (!nickname.equals(submission.nickname()) || !missionId.equals(submission.missionId())) {
            throw new NotFoundException("submission " + submissionId + " not found in learner scope");
        }

        return reviewRepository.findBySubmissionId(submissionId)
                .map(PersistenceMapper::toDomain)
                .orElseGet(() -> {
                    int overall = content.items() == null
                            ? 0
                            : content.items().stream().mapToInt(ReviewItem::score).sum();
                    Review review = new Review(Ids.next("rev_"), nickname, submissionId, overall,
                            ReviewStatus.READY, content, Clocks.now());
                    reviewRepository.save(PersistenceMapper.toEntity(review));
                    return review;
                });
    }

    @Transactional(readOnly = true)
    public List<Review> listReviews(String nickname, String missionId) {
        List<Review> reviews = new ArrayList<>();
        for (Submission submission : submissionService.list(nickname, missionId)) {
            reviewRepository.findBySubmissionId(submission.id())
                    .map(PersistenceMapper::toDomain)
                    .ifPresent(reviews::add);
        }
        return reviews;
    }

    @Transactional(readOnly = true)
    public JsonNode getJournal(String nickname) {
        return journalRepository.findById(nickname)
                .map(entity -> read(entity.getJson()))
                .orElseGet(objectMapper::createObjectNode);
    }

    @Transactional
    public JsonNode putJournal(String nickname, JsonNode value) {
        JsonNode normalized = value == null ? objectMapper.createObjectNode() : value;
        String json = write(normalized);
        LearnerJournalEntity entity = journalRepository.findById(nickname)
                .orElseGet(() -> new LearnerJournalEntity(nickname, json, Clocks.now()));
        entity.replace(json, Clocks.now());
        journalRepository.save(entity);
        return normalized;
    }

    @Transactional(readOnly = true)
    public JsonNode getRecord(String nickname, String missionId, String kind) {
        return recordRepository.findByNicknameAndMissionIdAndKind(nickname, missionId, kind)
                .map(entity -> read(entity.getJson()))
                .orElseGet(objectMapper::createObjectNode);
    }

    @Transactional
    public JsonNode putRecord(String nickname, String missionId, String kind, JsonNode value) {
        JsonNode normalized = value == null ? objectMapper.createObjectNode() : value;
        String json = write(normalized);
        LearnerRecordEntity entity = recordRepository.findByNicknameAndMissionIdAndKind(nickname, missionId, kind)
                .orElseGet(() -> new LearnerRecordEntity(
                        Ids.next("rec_"), nickname, missionId, kind, json, Clocks.now()));
        entity.replace(json, Clocks.now());
        recordRepository.save(entity);
        return normalized;
    }

    private String write(JsonNode value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("failed to serialize learner record", e);
        }
    }

    private JsonNode read(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("failed to deserialize learner record", e);
        }
    }
}

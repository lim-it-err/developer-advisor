package kr.co.workaround.advisor;

import kr.co.workaround.advisor.application.MissionService;
import kr.co.workaround.advisor.application.ReviewService;
import kr.co.workaround.advisor.application.TrackService;
import kr.co.workaround.advisor.domain.mission.Mission;
import kr.co.workaround.advisor.domain.review.Review;
import kr.co.workaround.advisor.domain.review.ReviewStatus;
import kr.co.workaround.advisor.domain.submission.SubmittedFile;
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
class ReviewServiceTest {

    @Autowired
    private TrackService trackService;

    @Autowired
    private MissionService missionService;

    @Autowired
    private ReviewService reviewService;

    @Test
    void submitsAndGeneratesReviewWithOverallFilled() {
        Track track = trackService.create("와인", Difficulty.Easy, "분리");
        Mission mission = missionService.generate(track.id(), null, null, null);

        List<SubmittedFile> files = List.of(new SubmittedFile("WineRecommender.java", "public class WineRecommender {}"));
        ReviewService.SubmissionOutcome outcome = reviewService.submit(mission.id(), files,
                "제가 만든 추천 시스템은 손님 응대랑 비슷하게 나눠져 있어요.");

        assertThat(outcome.submissionId()).isNotBlank();
        assertThat(outcome.reviewId()).isNotBlank();
        assertThat(outcome.status()).isEqualTo(ReviewStatus.READY);

        Review review = reviewService.getBySubmission(outcome.submissionId());
        assertThat(review.id()).isEqualTo(outcome.reviewId());
        assertThat(review.overall()).isGreaterThan(0);
        assertThat(review.content().reputation()).isNotNull();
        assertThat(review.content().ending()).isNotNull();
        assertThat(review.content().scenario()).isNotBlank();
        assertThat(review.content().hiddenCases()).isNotEmpty();
        assertThat(review.content().explainFeedback()).isNotNull();
    }
}

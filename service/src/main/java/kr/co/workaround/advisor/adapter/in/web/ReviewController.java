package kr.co.workaround.advisor.adapter.in.web;

import kr.co.workaround.advisor.adapter.in.web.dto.ReviewResponse;
import kr.co.workaround.advisor.application.ReviewService;
import kr.co.workaround.advisor.domain.review.Review;
import kr.co.workaround.advisor.domain.review.ReviewStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/advisor/submissions/{submissionId}/review")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<ReviewResponse> get(@PathVariable String submissionId) {
        Review review = reviewService.getBySubmission(submissionId);
        HttpStatus status = review.status() == ReviewStatus.READY ? HttpStatus.OK : HttpStatus.ACCEPTED;
        return ResponseEntity.status(status).body(WebMappers.toResponse(review));
    }
}

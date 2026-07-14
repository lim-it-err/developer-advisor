package kr.co.workaround.advisor.adapter.in.web;

import kr.co.workaround.advisor.adapter.in.web.dto.FileDto;
import kr.co.workaround.advisor.adapter.in.web.dto.SubmitRequest;
import kr.co.workaround.advisor.adapter.in.web.dto.SubmitResponse;
import kr.co.workaround.advisor.application.ReviewService;
import kr.co.workaround.advisor.domain.submission.SubmittedFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/advisor/missions/{missionId}/submissions")
public class SubmissionController {

    private final ReviewService reviewService;

    public SubmissionController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubmitResponse submit(@PathVariable String missionId, @RequestBody SubmitRequest req) {
        List<SubmittedFile> files = req.files().stream()
                .map(f -> new SubmittedFile(f.path(), f.content()))
                .toList();
        ReviewService.SubmissionOutcome outcome = reviewService.submit(missionId, files, req.explanation());
        return new SubmitResponse(outcome.submissionId(), outcome.reviewId(), outcome.status().name());
    }
}

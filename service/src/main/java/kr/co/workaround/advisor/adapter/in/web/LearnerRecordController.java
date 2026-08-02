package kr.co.workaround.advisor.adapter.in.web;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import kr.co.workaround.advisor.adapter.in.web.dto.LearnerReviewResponse;
import kr.co.workaround.advisor.adapter.in.web.dto.LearnerSubmissionResponse;
import kr.co.workaround.advisor.adapter.in.web.dto.SaveReviewRequest;
import kr.co.workaround.advisor.adapter.in.web.dto.SubmitRequest;
import kr.co.workaround.advisor.application.LearnerRecordService;
import kr.co.workaround.advisor.application.SubmissionService;
import kr.co.workaround.advisor.domain.submission.SubmittedFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/advisor/learners/{nickname}")
public class LearnerRecordController {

    private final SubmissionService submissionService;
    private final LearnerRecordService learnerRecordService;

    public LearnerRecordController(SubmissionService submissionService, LearnerRecordService learnerRecordService) {
        this.submissionService = submissionService;
        this.learnerRecordService = learnerRecordService;
    }

    @PostMapping("/missions/{missionId}/submissions")
    @ResponseStatus(HttpStatus.CREATED)
    public LearnerSubmissionResponse submit(@PathVariable String nickname, @PathVariable String missionId,
                                            @RequestBody SubmitRequest request) {
        List<SubmittedFile> files = request.files() == null
                ? List.of()
                : request.files().stream().map(file -> new SubmittedFile(file.path(), file.content())).toList();
        return LearnerSubmissionResponse.from(
                submissionService.create(nickname, missionId, files, request.explanation()));
    }

    @GetMapping("/missions/{missionId}/submissions")
    public List<LearnerSubmissionResponse> submissions(@PathVariable String nickname,
                                                        @PathVariable String missionId) {
        return submissionService.list(nickname, missionId).stream()
                .map(LearnerSubmissionResponse::from)
                .toList();
    }

    @PostMapping("/missions/{missionId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public LearnerReviewResponse saveReview(@PathVariable String nickname, @PathVariable String missionId,
                                            @Valid @RequestBody SaveReviewRequest request) {
        return LearnerReviewResponse.from(learnerRecordService.saveReview(
                nickname, missionId, request.submissionId(), request.content()));
    }

    @GetMapping("/missions/{missionId}/reviews")
    public List<LearnerReviewResponse> reviews(@PathVariable String nickname, @PathVariable String missionId) {
        return learnerRecordService.listReviews(nickname, missionId).stream()
                .map(LearnerReviewResponse::from)
                .toList();
    }

    @GetMapping("/missions/{missionId}/records/{kind}")
    public JsonNode record(@PathVariable String nickname, @PathVariable String missionId,
                           @PathVariable String kind) {
        return learnerRecordService.getRecord(nickname, missionId, kind);
    }

    @PutMapping("/missions/{missionId}/records/{kind}")
    public JsonNode putRecord(@PathVariable String nickname, @PathVariable String missionId,
                              @PathVariable String kind, @RequestBody JsonNode value) {
        return learnerRecordService.putRecord(nickname, missionId, kind, value);
    }

    @GetMapping("/journal")
    public JsonNode journal(@PathVariable String nickname) {
        return learnerRecordService.getJournal(nickname);
    }

    @PutMapping("/journal")
    public JsonNode putJournal(@PathVariable String nickname, @RequestBody JsonNode value) {
        return learnerRecordService.putJournal(nickname, value);
    }
}

package kr.co.workaround.advisor.adapter.in.web;

import jakarta.validation.Valid;
import kr.co.workaround.advisor.adapter.in.web.dto.ReviewPreviewRequest;
import kr.co.workaround.advisor.application.ReviewService;
import kr.co.workaround.advisor.domain.review.content.ReviewContent;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Stateless review endpoint for the frontend prototype whose missions live client-side
 * (no backend mission/submission record). Routes to the REVIEW role — Sonnet on the claude
 * profile, the fixture on mock — without touching the DB. Mirrors {@link ChatPreviewController}.
 */
@RestController
@RequestMapping("/api/advisor/review")
public class ReviewPreviewController {

    private final ReviewService reviewService;

    public ReviewPreviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/preview")
    public ReviewContent preview(@Valid @RequestBody ReviewPreviewRequest req) {
        ReviewPreviewRequest.MissionSpec mission = req.mission();
        return reviewService.previewReview(
                mission.title(),
                mission.scenario(),
                formatList(mission.requirements()),
                formatList(mission.constraints()),
                formatRubric(mission.rubric()),
                formatHiddenCases(mission.hiddenCases()),
                formatEndings(mission.endings()),
                formatFiles(req.files()),
                req.chatTranscript()
        );
    }

    private String formatList(List<String> items) {
        if (items == null || items.isEmpty()) {
            return "";
        }
        return items.stream().map(i -> "- " + i).collect(Collectors.joining("\n"));
    }

    private String formatRubric(List<ReviewPreviewRequest.RubricSpec> rubric) {
        if (rubric == null || rubric.isEmpty()) {
            return "";
        }
        return rubric.stream()
                .map(r -> "- " + r.name() + " (" + r.weight() + "점, "
                        + (r.visibleToLearner() ? "공개" : "히든") + "): " + r.description())
                .collect(Collectors.joining("\n"));
    }

    private String formatHiddenCases(List<ReviewPreviewRequest.HiddenCaseSpec> hiddenCases) {
        if (hiddenCases == null || hiddenCases.isEmpty()) {
            return "";
        }
        return hiddenCases.stream()
                .map(h -> "- " + h.title() + ": " + h.description())
                .collect(Collectors.joining("\n"));
    }

    private String formatEndings(List<ReviewPreviewRequest.EndingSpec> endings) {
        if (endings == null || endings.isEmpty()) {
            return "";
        }
        return endings.stream()
                .map(e -> "- [" + e.grade() + "] " + e.title() + ": " + e.teaser())
                .collect(Collectors.joining("\n"));
    }

    private String formatFiles(List<ReviewPreviewRequest.FileEntry> files) {
        return files.stream()
                .map(f -> "=== " + f.path() + " ===\n" + (f.content() == null ? "" : f.content()))
                .collect(Collectors.joining("\n\n"));
    }
}

package kr.co.workaround.advisor.application;

import kr.co.workaround.advisor.adapter.out.persistence.entity.SubmissionEntity;
import kr.co.workaround.advisor.adapter.out.persistence.entity.SubmittedFileEntity;
import kr.co.workaround.advisor.adapter.out.persistence.mapper.PersistenceMapper;
import kr.co.workaround.advisor.adapter.out.persistence.repo.SubmissionRepository;
import kr.co.workaround.advisor.adapter.out.persistence.repo.SubmittedFileRepository;
import kr.co.workaround.advisor.application.exception.NotFoundException;
import kr.co.workaround.advisor.domain.submission.Submission;
import kr.co.workaround.advisor.domain.submission.SubmittedFile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final SubmittedFileRepository submittedFileRepository;

    public SubmissionService(SubmissionRepository submissionRepository, SubmittedFileRepository submittedFileRepository) {
        this.submissionRepository = submissionRepository;
        this.submittedFileRepository = submittedFileRepository;
    }

    @Transactional
    public Submission create(String missionId, List<SubmittedFile> files, String explanation) {
        String id = Ids.next("sub_");
        Submission submission = new Submission(id, missionId, files, explanation, Instant.now());
        submissionRepository.save(PersistenceMapper.toEntity(submission));
        int ord = 0;
        for (SubmittedFile file : files) {
            submittedFileRepository.save(PersistenceMapper.toEntity(id, file, ord++));
        }
        return submission;
    }

    @Transactional(readOnly = true)
    public Submission get(String submissionId) {
        SubmissionEntity entity = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("submission " + submissionId + " not found"));
        List<SubmittedFileEntity> files = submittedFileRepository.findBySubmissionIdOrderByOrdAsc(submissionId);
        return PersistenceMapper.toDomain(entity, files);
    }
}

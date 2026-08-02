# dev-007 완료 보고 — 닉네임 스코프 기록 영속화
- completed_at: 2026-08-03T02:01:27+09:00
- agent: codex
- branch: `agent/codex/nickname-records`

## 구현

- 기본 H2를 `jdbc:h2:file:./data/advisor;AUTO_SERVER=TRUE` 파일 모드로 전환했다. 테스트 프로필은 기존 인메모리 설정을 유지한다.
- 기존 `Submission`·`Review` 도메인과 엔티티에 `nickname`을 추가했다.
  - 기존 Track→Mission→Submission→Review 흐름은 예약 스코프 `me`를 사용해 그대로 동작한다.
  - 구버전 파일 DB의 기존 행과 `ddl-auto: update` 정합을 위해 신규 nickname 컬럼은 nullable로 두되, 새 저장 경로는 항상 값을 기록한다.
- 닉네임 스코프 API를 추가했다.
  - `POST/GET /api/advisor/learners/{nickname}/missions/{missionId}/submissions`
  - `POST/GET /api/advisor/learners/{nickname}/missions/{missionId}/reviews`
  - `PUT/GET /api/advisor/learners/{nickname}/missions/{missionId}/records/{kind}`
  - `PUT/GET /api/advisor/learners/{nickname}/journal`
- 제출은 시간순 버전 append, 리뷰는 해당 닉네임·미션의 제출 ID 소유권을 확인한 뒤 저장한다.
- `LearnerJournalEntity`를 nickname PK + JSON CLOB + updatedAt으로 구현했다. 미저장 GET은 `{}`를 반환한다.
- 설명·기획자 산출물 등은 nickname+missionId+kind 유니크 스코프의 범용 JSON CLOB record로 구현했다.
- MockMvc 특성화 테스트로 제출 2회/스코프 분리, 클라이언트 리뷰 저장·조회, journal 및 범용 record PUT→GET을 검증했다.

LLM 프로바이더, 포트, 프롬프트, claude/mock/ollama 프로파일과 프론트 파일은 수정하지 않았다.

## 변경 파일

- `service/src/main/resources/application.yml`
- `service/src/main/java/kr/co/workaround/advisor/domain/submission/Submission.java`
- `service/src/main/java/kr/co/workaround/advisor/domain/review/Review.java`
- `service/src/main/java/kr/co/workaround/advisor/application/SubmissionService.java`
- `service/src/main/java/kr/co/workaround/advisor/application/ReviewService.java`
- `service/src/main/java/kr/co/workaround/advisor/application/LearnerRecordService.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/in/web/LearnerRecordController.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/in/web/dto/LearnerSubmissionResponse.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/in/web/dto/SaveReviewRequest.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/in/web/dto/LearnerReviewResponse.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/out/persistence/entity/SubmissionEntity.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/out/persistence/entity/ReviewEntity.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/out/persistence/entity/LearnerJournalEntity.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/out/persistence/entity/LearnerRecordEntity.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/out/persistence/mapper/PersistenceMapper.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/out/persistence/repo/SubmissionRepository.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/out/persistence/repo/LearnerJournalRepository.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/out/persistence/repo/LearnerRecordRepository.java`
- `service/src/test/java/kr/co/workaround/advisor/web/LearnerRecordControllerTest.java`

## 검증

```text
$ cd service && ./run.sh test
Tests run: 20, Failures: 0, Errors: 0, Skipped: 0
✅ 테스트 통과
```

샌드박스에서는 Mockito/Byte Buddy의 JVM self-attach가 차단되어 최초 실행이 시작 전 실패했다. 동일 명령을 호스트 권한으로 재실행해 위 결과를 확인했다.

실제 mock 서버 curl 왕복:

```text
$ ./run.sh start
HikariPool-1 - Added connection ... url=jdbc:h2:file:./data/advisor

$ curl -X POST .../learners/codex-live/missions/manual-check/submissions
{"id":"sub_95a316906ecb","missionId":"manual-check","files":[{"path":"Live.java","content":"class Live {}"}],"explanation":"curl 왕복 검증",...}

$ curl .../learners/codex-live/missions/manual-check/submissions
[{"id":"sub_95a316906ecb","missionId":"manual-check",...}]
```

서버를 종료하고 다시 `./run.sh start`한 뒤 같은 GET이 동일한 `sub_95a316906ecb`를 반환했다. `service/data/advisor.mv.db` 생성도 확인했으며 `.gitignore`의 `/service/data/` 규칙으로 추적 대상에서 제외된다.

## 미완 사항

없음.

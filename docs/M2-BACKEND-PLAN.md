# M2 — 기록의 영속화 (백엔드를 프론트 폭에 맞추기)

> 방향 (2026-08-03, 사용자 확정): 콘텐츠·프론트 외형은 충분히 자랐다. 이제 백엔드가 기록을 책임진다.
> **LLM 연결부는 보류** — LlmClient 포트·프로바이더는 현 상태 동결, claude 프로파일 작업 금지, mock으로만 돈다.
> **구현 주체는 Codex** (dev-queue), Claude는 설계·검수만.

## 원칙

1. **콘텐츠는 프론트가 소유한다.** 미션 본문(sampleContent.js)은 백엔드로 옮기지 않는다. 백엔드가 소유하는 것은 **학습자의 기록** — 제출, 리뷰, 설명, 루틴, 프로젝트 진행.
2. **닉네임 = 기록의 파티션 키.** 인증 아님. 모든 기록 API는 nickname 스코프.
3. **프론트는 backend-first + localStorage 폴백** 기존 패턴 유지. 백엔드가 꺼져 있어도 지금과 똑같이 동작해야 한다.
4. 기존 hexagonal 구조(domain/application/adapter)와 기존 엔티티를 재사용·확장한다. 갈아엎지 않는다.

## 스코프

- **In**: H2 파일 모드(재시작 생존, `service/data/` — 이미 gitignore), 닉네임 스코프 기록 CRUD, 프론트 스토어 연동(저장 시 서버 우선, 실패 시 조용히 로컬), 기록 마이그레이션 업로드(로컬 기록 일괄 밀어올리기).
- **Out**: 로그인/인증, LLM 신규 작업, 미션 콘텐츠 서빙, 멀티테넌시.

## API (기존 컨트롤러와 정합 — 상세는 구현 시 기존 DTO 기준으로)

| 목적 | 형태 |
|---|---|
| 제출 저장/조회 | `POST/GET /api/advisor/learners/{nickname}/missions/{missionId}/submissions` (버전 append) |
| 리뷰 저장/조회 | 같은 스코프 `/reviews` — 클라이언트가 preview로 받은 ReviewContent를 저장 |
| 설명·기획자 제출 | 같은 스코프 `/records/{kind}` (kind: explanation, plannerMeeting, plannerReview …) — 범용 JSON 저장 |
| 루틴·예측·초안 | `GET/PUT /api/advisor/learners/{nickname}/journal` — routineHistory/routineChecks/endingPredictions/findingsDrafts 통 JSON |
| 일괄 마이그레이션 | `PUT /api/advisor/learners/{nickname}/journal` + 제출 반복 POST로 충분 (전용 엔드포인트 불요) |

설계 노트: 제출·리뷰는 **정식 애그리거트**(조회·버전·통계의 미래가 있다), 나머지는 **journal 통 JSON**(엔드포인트 폭발 방지). 이 비대칭은 의도다.

## 단계 (dev-queue 매핑)

1. dev-007 — H2 파일 모드 + 닉네임 스코프 제출/리뷰/journal API (+ 특성화 테스트)
2. dev-008 — 프론트 스토어 연동 (서버 우선, 폴백, 로컬 기록 최초 1회 밀어올리기)
3. (이후) dev-003의 Dockerfile/CI가 이 위에 얹힌다

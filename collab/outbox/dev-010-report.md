# dev-010 완료 보고 — 사건 파일 연속극 UI
- completed_at: 2026-08-03T10:17:31+09:00
- agent: codex
- branch: `agent/codex/case-files-ui`

## 구현 내역

- `/games/case/:caseId` 라우트와 사건 파일 페이지를 추가하고, 기존 `sampleCaseFiles.js` 문구를 그대로 표시했다.
- 첫 진입 Day 1 공개, 로컬 날짜가 전진할 때 하루 한 단서 해금, `몰아보기`로 Day 5까지 즉시 해금하는 진행 규칙을 구현했다.
- 진행 상태를 기존 `advisor.learner.v1` blob의 `caseProgress`에 `{ openedDays, lastOpenedDate, verdict? }` 형태로 저장하고 journal 동기화 대상에도 포함했다.
- 최신 Day는 펼치고 지난 Day는 접힌 목록에서 다시 열 수 있게 했으며, 기존 `MarkdownBlock`으로 본문과 코드 블록을 렌더링했다.
- Day 5 이후 네 보기 중 하나를 한 번만 지목하도록 잠그고, 적중 여부·해설·에필로그를 공개했다.
- 지목 시 판단 +2, 적중 시 판단 +1을 `recordSeasonGain` 경로로 중복 없이 적립했다.
- `/games`의 사건 파일을 준비 중 목록에서 실제 플레이 링크로 승격했다.
- 375px E2E에 첫 진입, finale 잠금, 몰아보기, 지난 단서 재열람, 지목, 해설, 저장 상태와 가로 스크롤 검증을 추가했다.

## 변경 파일

- `frontend/src/modules/missions/pages/CaseFilePage.vue`
- `frontend/src/modules/missions/pages/GamesPage.vue`
- `frontend/src/modules/missions/routes.js`
- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`
- `frontend/e2e/core-flows.spec.ts`

콘텐츠 소유 파일인 `frontend/src/modules/missions/data/sampleCaseFiles.js`는 수정하지 않았다.

## 검증 로그

- `cd frontend && npm run test:unit`: 통과 — 23 tests, 0 failures
- `cd frontend && npx playwright test`: 통과 — 8 tests, 375px 사건 파일 흐름 포함
- 최종 사건 파일 E2E 재검증: 통과 — 1 test
- `cd frontend && npm ci`: 통과
- `cd frontend && npm run build`: 통과 — 81 modules transformed
- `cd service && ./run.sh test`: 통과 — 25 tests, 0 failures, 0 errors
- `git diff --check`: 통과

Playwright 로컬 서버 포트 바인딩과 백엔드 Mockito self-attach는 제한된 샌드박스에서 각각 거부되어 동일 명령을 허용된 실행 환경에서 다시 수행했고 최종 통과했다.

## 미완 사항

- 없음.

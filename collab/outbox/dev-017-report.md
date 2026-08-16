# dev-017 구현 보고서 — 「경계선 한 칸」 트랜잭션 경계 게임
- completed_at: 2026-08-16T13:15:00+09:00
- agent: codex
- branch: `agent/codex/boundary-game`

## 구현 결과

- `/games/boundary`에 날짜 시드로 고정되는 오늘의 트랜잭션 경계 라운드를 추가했다.
- `grouping`의 첫 묶음을 엔진에서 파이프라인 단계 수로 해석하여 같은 운명 구간을 연속 하이라이트하고, `failureAt`과 일치하는 단계 뒤에 타임아웃을 연출한다.
- 최초 경계 선택은 즉시 잠그고 `kept`·`lost`·`scenario`를 공개한다. 이후 다른 경계의 결과를 자유롭게 누적 열람해 세로로 병렬 비교할 수 있으며, 최초 선택 기록은 바뀌지 않는다.
- `recommendedKey`와 `recommendNote`는 "이 상황의 권장 · 정답 아님"으로 명시해 공개한다.
- `boundarySessions: { [date]: { roundId, chosenKey } }`를 localStorage와 learner journal에 저장한다.
- 선택 시 안목 +2, 권장 경계 선택 시 판단 +1을 기존 시즌 중복 방지 규칙으로 적립한다.
- `/games` 바로 플레이 목록에 진입 링크를 추가했다.
- Claude 전담 콘텐츠 `sampleBoundaryRounds.js`는 읽기만 했고 수정하지 않았다. 루틴 슬롯도 변경하지 않았다.

## 변경 파일

- `frontend/src/modules/missions/games/boundaryEngine.js`
- `frontend/src/modules/missions/games/__tests__/boundaryEngine.spec.js`
- `frontend/src/modules/missions/pages/BoundaryGamePage.vue`
- `frontend/src/modules/missions/pages/GamesPage.vue`
- `frontend/src/modules/missions/pages/SeasonPage.vue`
- `frontend/src/modules/missions/routes.js`
- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`
- `frontend/e2e/core-flows.spec.ts`
- `collab/outbox/dev-017-report.md`

## 검증 로그

- `cd frontend && npm ci` — 통과, 133 packages 설치
- `cd frontend && npm run test:unit -- --run` — 5 files, 36 tests 통과
- `cd frontend && npm run test:e2e` — Chromium 11 tests 통과
- `cd frontend && npx vite build` — 89 modules transformed, 통과
- `cd service && ./run.sh test` — JDK 21, 통과 (`✅ 테스트 통과`)

## 미완 사항

- 없음. 루틴 슬롯 편입은 사양대로 이번 범위에 포함하지 않았다.

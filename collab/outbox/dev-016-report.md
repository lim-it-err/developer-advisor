# dev-016 구현 보고서 — 「한 번만 물어본다면」 가설·관측 게임
- completed_at: 2026-08-16T13:09:00+09:00
- agent: codex
- branch: `agent/codex/probe-game`

## 구현 결과

- `/games/probe`에 날짜 시드로 고정되는 오늘의 라운드를 추가했다.
- 관측 1회 → `eliminates` 가설 흐림 → 가설 1회 지목 → 결말·정보량 해설 흐름을 구현했다. 관측과 지목은 선택 즉시 잠기며, 배제된 가설도 지목할 수 있다.
- 선택한 관측의 `infoNote`, 최선 관측 비교, 다른 관측 해설 접기를 제공한다.
- `probeSessions: { [date]: { roundId, probeKey, verdictKey } }`를 localStorage와 learner journal에 저장하고, 지난 세션은 읽기 전용으로 다시 볼 수 있게 했다.
- 지목 시 판단 +2, 최선 관측 선택 시 안목 +1을 기존 시즌 중복 방지 규칙으로 적립한다.
- `/games`의 바로 플레이 목록에 진입 링크를 추가했다.
- Claude 전담 콘텐츠 `sampleProbeRounds.js`는 읽기만 했고 수정하지 않았다.

## 변경 파일

- `frontend/src/modules/missions/games/probeEngine.js`
- `frontend/src/modules/missions/games/__tests__/probeEngine.spec.js`
- `frontend/src/modules/missions/pages/ProbeGamePage.vue`
- `frontend/src/modules/missions/pages/GamesPage.vue`
- `frontend/src/modules/missions/pages/SeasonPage.vue`
- `frontend/src/modules/missions/routes.js`
- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`
- `frontend/e2e/core-flows.spec.ts`
- `collab/outbox/dev-016-report.md`

## 검증 로그

- `cd frontend && npm ci` — 통과, 133 packages 설치
- `cd frontend && npm run test:unit -- --run` — 4 files, 32 tests 통과
- `cd frontend && npm run test:e2e` — Chromium 10 tests 통과
- `cd frontend && npx vite build` — 85 modules transformed, 통과
- `cd service && ./run.sh test` — JDK 21, 통과 (`✅ 테스트 통과`)
  - 관리 샌드박스 안의 첫 실행은 Mockito/Byte Buddy self-attach 차단으로 실패했고, 승인된 일반 실행 환경에서 같은 명령을 재실행해 통과했다.

## 미완 사항

- 없음. 화요일 저녁 루틴 슬롯 교체는 사양대로 이번 범위에 포함하지 않았다.

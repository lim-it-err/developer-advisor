# dev-006 완료 보고 — 시즌제 스탯 인프라
- completed_at: 2026-08-03T01:50:41+09:00
- agent: codex
- branch: `agent/codex/season-stats`

## 구현

- 기존 `advisor.learner.v1` localStorage blob에 `seasonStats`를 추가했다.
  - 구버전 사용자에게 키가 없으면 현재 로컬 날짜를 `seasonStart`로 삼는다.
  - 28일 시즌 밖의 적립은 받지 않고, 같은 날짜·같은 `source`는 한 번만 적립한다.
- 기존 액션에 4스탯 적립을 연결했다.
  - 미션 제출: 안목 +3
  - 설명 훈련 제출: 언어화 +3
  - 루틴 수동 체크: 교양 +1
  - 리뷰에서 결말 예측 적중 확인: 판단 +2
  - 기획자 회의 합의문 제출: 판단 +3
- 시즌 계산을 순수 함수로 분리했다.
  - 현재 합계, D-day, 최근 적립 10건, 평일·주말 슬롯 수를 반영한 완주일을 계산한다.
  - 엔딩은 `hidden → dominant → balanced → quiet` 우선순위로 판정한다.
- `/season` 페이지와 App 네비 링크를 추가했다.
  - 4스탯 바·합계, 28일 기간·D-day, 완주일, 최근 적립 로그를 표시한다.
  - 시즌 종료 뒤 `sampleSeasons.js`에서 선택한 시즌 요약을 표시한다.
- dev-005 병합에서 화면 라벨만 바뀌고 남아 있던 스와이프 E2E의 낡은 문구 기대값도 현재 UI에 맞췄다.

`frontend/src/modules/missions/data/` 아래 콘텐츠와 문구는 수정하지 않았다.

## 변경 파일

- `frontend/src/modules/missions/store/seasonStats.js`
- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/store/__tests__/seasonStats.spec.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`
- `frontend/src/modules/missions/pages/SeasonPage.vue`
- `frontend/src/modules/missions/pages/ReviewPage.vue`
- `frontend/src/modules/missions/routes.js`
- `frontend/src/app/App.vue`
- `frontend/e2e/core-flows.spec.ts`

## 검증

```text
$ cd frontend && npm ci
added 133 packages in 2s

$ npx vite build
✓ 78 modules transformed.
✓ built in 1.09s

$ npx vitest run
Test Files  3 passed (3)
Tests       17 passed (17)
Duration    959ms

$ npx playwright test
7 passed (9.6s)
```

브라우저 시나리오에서 `2026-08-03` 시작 시즌을 만든 뒤 오늘의 훈련 수동 체크를 실행하고 `/season`으로 이동했다. 교양 값 `1`, 최근 적립의 `루틴 수동 체크`와 `+1` 표시를 확인했다.

## 미완 사항

없음.

# dev-014 완료 보고서 — 평일 루틴 노코드 재편

- 작업일: 2026-08-04
- 작업 브랜치: `agent/codex/weekday-nocode`
- 상태: 완료

## 구현 내역

- 월~금 루틴을 사양의 사건 파일·머지 or 반려·카드 갈래·결말 예측·설명 시작 칩·기획자 회의 중심 맵으로 교체했다. 평일에는 `kind: 'submit'` 슬롯이 없고, 주말의 시사회 카드와 프로젝트 소미션은 그대로 유지했다.
- 사건 파일은 진행 중인 사건을 우선 배정하고 당일 단서 열람을 `lastViewedDate`로 기록한다. 스와이프 완료일은 `swipeSessions`, 결말 예측일은 `endingPredictionDates`, 설명 시작 칩 선택은 `explainChipSelections`에 최소 상태로 저장한다.
- 목요일 회의 슬롯은 당일 학습자 메시지 3개로 완료를 판정하고, 금요일 설명 슬롯에는 `(선택·주중 유일 타이핑)`을 명시했다.
- 루틴 링크가 결말 예측, 설명 시작 칩, 기획자 회의실의 해당 화면으로 바로 들어가도록 query/hash 딥링크를 연결했다.
- `outbox/002-answer.md`가 작업 시점에 존재하지 않아 질문 3의 추가 자문은 이번 구현에 반영하지 않았다.

## 변경 파일

- `collab/dev-queue/014-weekday-nocode.md`
- `collab/outbox/dev-014-report.md`
- `frontend/e2e/core-flows.spec.ts`
- `frontend/src/modules/missions/components/PlannerMeetingPanel.vue`
- `frontend/src/modules/missions/pages/MissionPage.vue`
- `frontend/src/modules/missions/pages/SwipeReviewPage.vue`
- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`

## 검증 로그

- `cd frontend && npm ci` — 통과, 133 packages 설치.
- `cd frontend && npx vitest run` — 통과, 3 files / 27 tests.
- `cd frontend && npx playwright test` — 통과, Chromium 9 tests.
- `cd frontend && npx vite build` — 통과, 81 modules transformed.
- 평일 5종의 슬롯 라벨과 `kind: 'submit'` 부재, 주말 2종의 `cinemaCard`·`project` 유지, 스와이프·사건 열람·결말 예측·설명 칩·회의 메시지 완료 판정을 특성화 테스트로 확인했다.
- 브라우저에서 7요일 탭, 화요일 결말 예측 딥링크, 수요일 설명 칩 딥링크, 목요일 회의실 딥링크, 월요일 사건 열람 완료, 스와이프 완료 저장을 확인했다.

## 미완 사항

- 없음. 신규 미니게임과 콘텐츠 data 수정은 범위 밖으로 유지했다.

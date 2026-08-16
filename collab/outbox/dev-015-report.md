# dev-015 완료 보고서 — 루틴 패치

- 작업일: 2026-08-16
- 작업 브랜치: `agent/codex/routine-patch`
- 상태: 완료

## 구현 내역

- 시작했고 아직 근본 원인을 지목하지 않은 사건을 루틴 상단의 보조 배너로 노출했다. 배너는 선택한 요일과 무관하게 현재 사건의 다음 `Day n` 단서로 연결되며 슬롯 수와 완료 분모에는 들어가지 않는다.
- 기획자 회의 질문 칩을 입력창에 복사하는 방식에서 탭 즉시 전송으로 바꾸고, 목요일 점심 완료 조건과 라벨을 당일 질문 1개 기준으로 완화했다. 직접 입력·전송 경로는 그대로 유지했다.
- `cardForkChoiceDates`를 localStorage와 원격 journal 상태에 추가했다. 카드 갈래는 오늘 최초 선택한 경우만 자동 완료되며, 날짜 정보가 없거나 과거에 선택한 카드가 다시 배정되면 `다시 읽었어요 ✓` 수동 체크로 완료할 수 있다.
- 화요일 읽기 슬롯을 `?tab=briefing#mission-briefing`으로 연결했다. 금요일 회고는 실제 리뷰가 있는 미션만 배정하고 `?version=n#review-vn`으로 최신 리뷰 버전을 직접 선택한다. 앱 라우터에는 hash 스크롤 처리를 추가했다.
- 기존 저장 데이터에는 새 날짜 키가 없어도 과거 선택으로 취급되도록 별도 마이그레이션 없이 호환했다.

## 변경 파일

- `collab/outbox/dev-015-report.md`
- `frontend/e2e/core-flows.spec.ts`
- `frontend/src/app/router.js`
- `frontend/src/modules/missions/components/PlannerMeetingPanel.vue`
- `frontend/src/modules/missions/pages/MissionPage.vue`
- `frontend/src/modules/missions/pages/ReviewPage.vue`
- `frontend/src/modules/missions/pages/RoutinePage.vue`
- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`

## 검증 로그

- `cd frontend && npm ci` — 통과, 133 packages 설치.
- `cd frontend && npm run test:unit` — 통과, 3 files / 29 tests.
- `cd frontend && npm run test:e2e` — 통과, Chromium 9 tests.
- `cd frontend && npx vite build` — 통과, 81 modules transformed.
- `cd service && ./run.sh test` — 통과, JDK 21. 샌드박스 안에서는 Mockito의 JVM self-attach 제한으로 실패하여 동일 명령을 승인된 비샌드박스 환경에서 재실행했다.
- 특성화 테스트로 진행 중 사건 배너의 노출·지목 후 비노출, 회의 질문 1개 완료, 갈래 당일 자동 완료·과거 선택 수동 폴백, 화요일 브리핑 및 금요일 최신 리뷰 버전 딥링크를 확인했다.

## 미완 사항

- 없음. 화요일 저녁 신규 게임 교체와 콘텐츠 data 수정은 범위 밖으로 유지했다.

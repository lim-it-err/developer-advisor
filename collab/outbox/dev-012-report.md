# dev-012 완료 보고 — 독서·시사회 카드 갈래 질문 UI
- completed_at: 2026-08-03T12:17:31+09:00
- agent: codex
- branch: `agent/codex/card-forks-ui`

## 구현 내역

- `InsightCard`의 꼬리 질문 아래에 `cardForks` 질문과 두 선택지 버튼을 연결했다.
- 선택한 응답을 말풍선 형태로 표시하고 반대 선택지는 흐리게 만들되, 다시 탭하면 반대 입장의 응답도 볼 수 있게 했다.
- 최초 선택만 기존 `advisor.learner.v1` blob의 `cardForkChoices: { [cardId]: key }`에 저장하고 journal 동기화 대상에 포함했다.
- 카드별 최초 선택에만 `recordSeasonGain` 경로로 교양 +1을 적립하며 source는 `card-fork:<cardId>`로 고정했다.
- fork나 선택지가 없는 카드에는 갈래 섹션을 렌더하지 않도록 방어했다.
- 375px E2E에 카드 펼침, 최초 선택과 응답, 반대 입장 전환, 저장·적립 1회, 새로고침 복원을 추가했다.

## 변경 파일

- `frontend/src/modules/missions/components/InsightCard.vue`
- `frontend/src/modules/missions/pages/GamesPage.vue`
- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`
- `frontend/e2e/core-flows.spec.ts`

콘텐츠 소유 파일인 `frontend/src/modules/missions/data/sampleCards.js`는 수정하지 않았다. 실행 도중 공유 작업 트리에 나타난 별도 `sampleCaseFiles.js` 변경도 보존하고 이 브랜치 커밋에서 제외했다.

## 검증 로그

- `cd frontend && npm run test:unit`: 통과 — 24 tests, 0 failures
- `cd frontend && npx playwright test`: 통과 — 9 tests, 375px 카드 갈래 흐름 포함
- 최종 카드 갈래 E2E 재검증: 통과 — 1 test
- `cd frontend && npm ci`: 통과
- `cd frontend && npm run build`: 통과 — 81 modules transformed
- `cd service && ./run.sh test`: 통과 — 25 tests, 0 failures, 0 errors
- `git diff --check`: 통과

## 미완 사항

- 없음.

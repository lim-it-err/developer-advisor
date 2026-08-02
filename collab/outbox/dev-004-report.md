# dev-004 완료 보고 — 독서·시사회 카드 루틴 연결
- completed_at: 2026-08-03T01:16:12+09:00
- agent: codex
- branch: `agent/codex/routine-cards`

## 구현

- 수요일 첫 슬롯을 날짜 시드 기반 독서 카드로 교체했다.
- 토·일요일 첫 슬롯을 날짜 시드 기반 시사회 카드로 교체했다.
- 두 카드 슬롯 모두 기존 `checkRoutineSlot(0)`을 이용한 `읽었어요 ✓` 수동 체크와 루틴 완료·스트릭 집계를 사용한다.
- 카드 슬롯 링크를 `/games?card=<card-id>`로 만들어 미션이 아닌 카드 서랍으로 진입시켰다.
- `/games`는 딥링크된 카드의 덱을 자동 선택하고, 해당 카드를 목록 맨 위에서 펼쳐 보여 준다.
- 기존 `InsightCard.vue`에 딥링크용 초기 펼침 옵션만 추가해 같은 카드 UI를 재사용했다.
- 수요일·토요일 카드 종류, 결정성, 카드 링크를 Vitest와 Playwright에 추가 검증했다.

## 변경 파일

- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/components/InsightCard.vue`
- `frontend/src/modules/missions/pages/GamesPage.vue`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`
- `frontend/e2e/core-flows.spec.ts`

`sampleCards.js`를 포함한 `data/` 콘텐츠 파일은 수정하지 않았다. `RoutinePage.vue`는 기존의 범용 `slot.linkTo`와 수동 체크 렌더링을 그대로 사용할 수 있어 수정하지 않았다.

## 검증

```text
$ cd frontend && npm ci
added 133 packages in 1s

$ npx vitest run
Test Files  1 passed (1)
Tests       8 passed (8)
Duration    920ms

$ npx playwright test
5 passed (7.4s)

$ npx vite build
✓ 70 modules transformed.
✓ built in 1.04s
```

Playwright 루틴 흐름에서 다음을 실제 Chromium으로 확인했다.

- 수요일 미리보기의 독서 카드 슬롯과 `read-*` 링크
- 카드 서랍 진입 후 선택 카드 자동 펼침
- 토요일 미리보기의 시사회 카드 슬롯과 `film-*` 링크
- 위 흐름의 브라우저 콘솔·페이지 오류 0건

## 미완 사항

없음.

## 협업 메모

작업 중 공유 트리에 나타난 `collab/dev-queue/005-swipe-review-game.md` 변경과 `sampleSwipeCards.js`는 다른 에이전트 작업으로 판단해 수정·스테이징하지 않았다.

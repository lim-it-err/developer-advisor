# dev-009 — store 보수 (dev-002 관찰 3건)

## 목표
dev-002 보고서 「관찰한 현재 동작」 3건을 고친다. 낮은 우선순위 — 007·008(백엔드 M2)보다 뒤에.

## 사양
1. `submitSubMission`이 해금 여부(`isSubMissionUnlocked`)를 검사해 잠긴 ID는 무시(또는 throw 없이 false 반환).
2. `projectProgress.currentIndex`를 완료 개수가 아니라 **첫 미완료 인덱스**로.
3. 구버전 제출 마이그레이션을 로드 직후 1회 `persist()`로 localStorage에도 반영.

## 검증 게이트
- 기존 특성화 테스트 갱신(동작 변경분만) + 신규 케이스 3개, `npx vitest run`·`npx playwright test`·`npx vite build` 그린.

## 범위 밖
- data/ 수정 금지, UI 변경 금지.

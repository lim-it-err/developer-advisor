# dev-017 — 「경계선 한 칸」 트랜잭션 경계 게임 (엔진+UI)

## 선행: dev-016 완료 후 착수 (같은 games 패턴 재사용)

## 목표
`data/sampleBoundaryRounds.js`(2판, 스키마 주석 포함 — 이미 존재, 문구 수정 금지)를 플레이 가능하게.

## 플레이 흐름 (탭 2번)
1. `/games/boundary` — 오늘의 라운드(날짜 시드). situation + flow 단계를 세로 파이프라인으로 시각화.
2. **경계 선택(1탭)**: boundaries 3개 중 하나 → 묶임(grouping)이 파이프라인 위에 시각적으로 표시(같은 운명 구간 하이라이트).
3. **타임아웃 발생** 연출(failureAt) → 선택한 경계의 outcome 공개: kept / lost / scenario.
4. **다른 경계 열람(자유 탭)**: 나머지 선택지의 outcome도 열어볼 수 있게 — 병렬 비교가 이 게임의 본체. 마지막에 recommendedKey + recommendNote 공개 ("이 상황의 권장"이지 정답 아님을 라벨로 명시).

## 사양
- 저장: `boundarySessions: { [date]: { roundId, chosenKey } }` — 하루 1판.
- 시즌 스탯: 선택 시 안목 +2, recommendedKey 선택 시 판단 +1 (중복 방지).
- `/games` 바로 플레이에 추가, 375px 세로 파이프라인 가로 스크롤 금지, E2E 1개.

## 검증 게이트
- vitest·playwright·vite build 그린

## 범위 밖
- data/ 수정 금지, 루틴 슬롯 편입 금지(별도 결정)

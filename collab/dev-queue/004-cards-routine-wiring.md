# dev-004 — 독서·시사회 카드를 루틴 슬롯에 연결

## 목표
`frontend/src/modules/missions/data/sampleCards.js` (readingCards 8, cinemaCards 4 — 이미 존재)를 오늘의 훈련에 노출한다.

## 사양
1. `components/InsightCard.vue`는 **이미 존재** (main, /games에서 사용 중) — 재사용할 것, 새로 만들지 말 것.
2. 카드 상세 진입은 `/games` 카드 서랍 재사용 또는 모달, 방식 자유. 루틴 슬롯 쪽에는 "읽었어요" 체크(기존 checkRoutineSlot)가 붙어야 한다.
3. store: 수요일(언어화)과 주말(몰입) 빌더의 첫 슬롯을 카드 슬롯으로 교체 — 날짜 시드(`dateSeed`)로 readingCards/cinemaCards에서 결정적으로 1장 선택. 다른 요일은 건드리지 않는다.
4. RoutinePage 슬롯에서 카드 슬롯은 미션 링크 대신 카드 링크로.
5. 주의: main의 RoutinePage.vue/store에 요일 미리보기(`routineForWeekday`, weekday-tabs)가 최근 추가됨 — 반드시 최신 main에서 브랜치를 딸 것.

## 검증 게이트
- `npx vite build` 그린, 콘솔 에러 0
- 수요일·토요일 미리보기에서 카드 슬롯 렌더 확인 (routineForWeekday로 확인 가능)

## 범위 밖
- `data/` 수정 금지 (sampleCards.js는 읽기만). 카드 문구 수정 금지 — 콘텐츠는 Claude 전담.

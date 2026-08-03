# dev-012 — 독서·시사회 카드 갈래 질문 UI

## 목표
`sampleCards.js`의 `cardForks`(12장 전부, 이미 존재 — 문구 수정 금지)를 InsightCard에 붙인다. 카드가 소비에서 선택으로 바뀌는 1탭 인터랙션.

## 사양
1. InsightCard 펼침 상태의 꼬리 질문 아래에 갈래 섹션: `fork.question` + 선택지 2버튼(1탭). 선택하면 해당 `response`가 말풍선처럼 나타나고, **다른 선택지는 흐려지되 탭하면 그쪽 response도 볼 수 있다** (입장 바꿔보기 허용 — 채점 아님).
2. 선택은 localStorage blob `cardForkChoices: { [cardId]: key }`에 저장(첫 선택 기준), journal 동기화 포함.
3. 카드당 최초 선택 1회에 시즌 교양 +1 (`recordSeasonGain`, source `card-fork:<cardId>` — 중복 방지 기존 규칙).
4. fork가 없는 카드는 섹션 자체를 렌더하지 않음 (방어).
5. E2E 1개: 카드 펼침 → 갈래 선택 → response 표시 → 새로고침 후 선택 유지.

## 검증 게이트
- vitest·playwright·vite build 그린, 375px 가로 스크롤 없음

## 범위 밖
- data/ 수정 금지, 루틴 빌더 수정 금지

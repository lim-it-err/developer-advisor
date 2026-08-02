# dev-006 — 시즌제 스탯 인프라 (프린세스 메이커식)

## 목표
학습 활동이 4스탯으로 적립되는 시즌 시스템의 **데이터 계층과 화면 뼈대**를 만든다. 엔딩 서사·문구는 Claude 전담(placeholder로).

## 사양
1. store에 `seasonStats` 상태 추가(localStorage 동일 blob): `{ seasonStart: 'YYYY-MM-DD', gains: [{date, stat, amount, source}] }`. 시즌 = seasonStart부터 28일.
2. 적립 훅 — 기존 액션에 삽입:
   - 미션 제출 → 👁 안목 +3 / 설명 훈련 제출 → 🗣 언어화 +3 / 루틴 수동 체크 → 📚 교양 +1 / 결말 예측 적중(리뷰 시점) → 🧭 판단 +2 / 기획자 합의문 → 🧭 판단 +3
   - 같은 날 같은 source 중복 적립 방지.
3. `/season` 페이지: 4스탯 바(현재 합계), 시즌 D-day, 최근 적립 로그 10줄. 시즌 종료 시 "시즌 요약" 카드(엔딩 이름은 `???` placeholder — 판정표는 추후 Claude가).
4. App 네비에 링크 추가. 마이그레이션: seasonStats 없던 기존 사용자는 오늘을 seasonStart로.

## 검증 게이트
- `npx vite build` 그린. 수동 시나리오: 루틴 체크 → /season에서 교양 +1 확인 (브라우저로 검증하고 로그 남길 것).
- 기존 localStorage 데이터가 깨지지 않아야 함 (persist 키 추가만).

## 범위 밖
- 엔딩 판정표·문구 작성 금지. `data/` 수정 금지.

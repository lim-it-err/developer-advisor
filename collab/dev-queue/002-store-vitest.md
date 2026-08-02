# dev-002 — store 특성화 테스트 (vitest)

## 목표
`frontend/src/modules/missions/store/missions.js` 의 현재 동작을 vitest로 고정한다 (특성화 테스트 — 동작 명세가 아니라 현재 동작의 스냅샷).

## 사양
- `frontend/src/modules/missions/store/__tests__/missions.spec.js` (또는 frontend/tests/) + vitest 설정. jsdom 환경, localStorage 모킹.
- 커버할 것: 제출 버전 배열 append와 구버전(단일 객체) 마이그레이션 / getReview의 실리뷰→샘플 폴백 순서 / historyEntries 차수·정렬 / 프로젝트 소미션 해금 규칙(isSubMissionUnlocked, projectProgress) / 루틴 날짜 시드 결정성(같은 날 같은 미션) / 스트릭 계산(연속·단절) / 닉네임 setNickname trim·12자 컷.
- fetch는 실패하도록 스텁 (백엔드 폴백 경로 검증).

## 검증 게이트
- `cd frontend && npx vitest run` 전부 그린
- `npx vite build` 통과
- 기존 파일 수정은 package.json만 허용. **store 소스 수정 금지** — 이상 동작 발견 시 보고서에 기록.

# dev-008 — 프론트 스토어 ↔ 백엔드 기록 동기화

## 선행: dev-007 완료 (같은 브랜치에서 이어서 해도 됨)

## 목표
store/missions.js가 기록을 서버 우선으로 저장·조회하되, 백엔드가 없으면 지금과 100% 동일하게 동작한다.

## 사양
1. 저장 경로(제출/리뷰/설명/journal 계열)는: localStorage 즉시 반영(현행 유지) → 백그라운드로 서버 POST/PUT(fire-and-forget, 실패 무시·재시도 없음). UI는 서버 응답을 기다리지 않는다.
2. 앱 시작 시 닉네임이 있으면: 서버 기록 GET → 로컬과 병합(버전 배열은 submittedAt 기준 합집합, journal은 최신 updatedAt 우선). 서버 미응답 시 조용히 로컬만.
3. 최초 1회(서버에 기록 없음 + 로컬에 있음): 로컬 기록을 밀어올린다.
4. API_BASE 등 기존 관례(requestChatPreview의 timeout 패턴) 재사용.

## 검증 게이트
- 백엔드 OFF: `npx vite build` + 기존 플로우 회귀 없음 (dev-001 E2E 있으면 그것으로)
- 백엔드 ON: 제출 → 서버 GET으로 확인 → localStorage 비우고 새로고침 → 기록 복원되는 것 브라우저 검증, 로그 첨부

## 범위 밖
- data/ 수정 금지, UI 변경 금지 (순수 동기화 계층)

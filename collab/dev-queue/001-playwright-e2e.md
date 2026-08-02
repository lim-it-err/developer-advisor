# dev-001 — Playwright E2E 스위트

## 목표
frontend/에 Playwright E2E 테스트를 도입하고, 핵심 사용자 플로우 5개를 자동 검증한다.

## 사양
- `frontend/e2e/` 에 테스트, `playwright.config.ts` 는 frontend/ 루트. dev server 자동 기동(webServer 설정, port 5173 재사용 허용).
- 각 테스트는 localStorage를 깨끗이 시작하고 끝낸다.
- 플로우 5개:
  1. **미션 완주**: 홈 → 와인 미션 → 브리핑 → 미션 탭 → 제출 탭 → 파일 입력 → 닉네임 모달 처리 → 제출 → 리뷰 페이지에 점수/히든 케이스/시나리오 렌더 확인
  2. **필터**: Easy 칩 → 카드 수 감소 확인 → 검색 "와인" → 1개 → 초기화
  3. **기획자 모드**: KTX 미션 → 모드 선택기 3개 → 회의 모드 → 참석자 4명 렌더 + hiddenAgenda 텍스트("수기 보정" 등)가 DOM에 노출되지 않음 검증
  4. **프로젝트 여정**: /projects → 자전거 프로젝트 → 노드 6개, 첫 노드만 열림 → 소미션 1 제출 → 노드 2 해금
  5. **루틴**: /routine → 슬롯 렌더 → 출근길 수동 체크 → 홈 배너 카운트 갱신
- 백엔드 없이 통과해야 한다 (채팅/리뷰는 폴백 경로).

## 검증 게이트
- `cd frontend && npx playwright test` 전부 그린 (헤드리스)
- `npx vite build` 여전히 통과
- 기존 파일 수정은 package.json(스크립트·devDependency 추가)만 허용

## 범위 밖
- src/ 소스 수정 금지 (테스트가 실패하면 보고서에 버그로 기록, 고치지 말 것 — 그건 우리 몫)
- data/ 콘텐츠 파일 수정 금지

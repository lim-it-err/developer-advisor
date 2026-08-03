# dev-013 — 공개 배포 준비: 토큰 가드 + CORS env + Pages API 주소 주입

## 배경 (docs/DEPLOY.md 함께 읽을 것)
백엔드를 공개 서버(Lightsail/EC2)에 올린다. 프론트는 GitHub Pages(https) 그대로.
위협 모델: 공개된 백엔드에서 claude 프로파일이 켜져 있으면 아무나 /review/preview를 호출해
소유자의 API 키로 과금시킬 수 있다. 닉네임은 인증이 아니다.

## 사양

### 1. 백엔드 — 공유 토큰 가드
- 설정 `advisor.auth.token` (env `ADVISOR_AUTH_TOKEN`, 기본 빈 값).
- **빈 값이면 가드 완전 비활성** — 로컬 개발·기존 테스트 무변화.
- 값이 있으면: 요청 헤더 `X-Advisor-Token`이 정확히 일치해야 통과. 불일치·부재 시 401 JSON.
- 보호 범위: `/api/advisor/**`의 **POST·PUT 전부** (비용 발생 경로 chat/review preview + 기록 쓰기 스팸 방지). GET은 열어둔다 (읽기는 무해·무과금).
- 구현은 hexagonal답게 adapter.in.web의 필터/인터셉터 1개. 토큰 비교는 상수시간 비교(MessageDigest.isEqual) 사용.
- 테스트: 가드 off(기존 전부 그린 유지) / on(토큰 없이 POST 401, 올바른 토큰 200, GET은 토큰 없이 200).

### 2. 백엔드 — CORS 다중 오리진 env화
- `advisor.cors.allowed-origin`을 **콤마 구분 다중 값**으로 확장 (`allowed-origins`로 개명 가능, 기존 키 호환 유지).
- env `ADVISOR_CORS_ALLOWED_ORIGINS`로 덮어쓰기 확인 (relaxed binding 검증 테스트 1개).
- 기본값: `http://localhost:5173` (현행 유지).

### 3. 프론트 — 토큰 입력과 첨부
- localStorage blob에 `advisorToken` (동기화 journal에는 **포함하지 않는다** — 토큰이 서버로 왕복하는 순환 금지, 기기별 로컬 전용).
- 입력 UI는 최소로: 닉네임 프롬프트(NicknamePrompt)에 접이식 "고급 — 엔진 토큰(선택)" 필드 하나. 비워도 모든 폴백 경로 정상.
- 토큰이 있으면 모든 백엔드 fetch에 `X-Advisor-Token` 헤더 자동 첨부 (requestChatPreview/requestReviewPreview/requestRecord 공통 경로).
- 401 응답은 기존 실패 폴백과 동일 처리 (가짜 결과 생성 금지 원칙 유지).

### 4. 배포 배선
- `docker-compose.yml`: `ADVISOR_AUTH_TOKEN`, `ADVISOR_CORS_ALLOWED_ORIGINS` env 전달 추가.
- `.github/workflows/deploy-pages.yml`: 빌드 시 `VITE_ADVISOR_API`를 **repo variable** `ADVISOR_API_BASE`에서 주입 (`vars.ADVISOR_API_BASE`, 미설정이면 현행 기본값 유지 — 조건 처리).

## 검증 게이트
- `cd service && ./run.sh test` 그린 (신규 포함) / `cd frontend && npx vitest run && npx playwright test && npx vite build` 그린
- 수동: 백엔드 `ADVISOR_AUTH_TOKEN=abc ./run.sh start` → 토큰 없는 POST 401, 헤더 포함 200 curl 로그 보고서 첨부

## 범위 밖
- 실서버 프로비저닝(사용자 몫), TLS/Caddy(문서로만 — docs/DEPLOY.md), data/ 수정 금지

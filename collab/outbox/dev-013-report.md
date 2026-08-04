# dev-013 완료 보고서 — 공개 배포 토큰 가드와 환경 배선

- 작업일: 2026-08-04
- 작업 브랜치: `agent/codex/deploy-hardening`
- 상태: 완료

## 구현 내역

- `advisor.auth.token`이 설정된 경우 `/api/advisor/**`의 POST·PUT 요청에 `X-Advisor-Token`을 검증하는 MVC 인터셉터를 추가했다. 빈 토큰이면 가드는 완전히 비활성화되고 GET은 항상 열려 있다. 비교에는 `MessageDigest.isEqual`을 사용한다.
- CORS 설정을 콤마 구분 다중 오리진과 `ADVISOR_CORS_ALLOWED_ORIGINS` 환경변수로 확장했다. 기존 `advisor.cors.allowed-origin` 단일 키도 호환한다.
- 프론트 localStorage 상태에 기기 전용 `advisorToken`을 추가하고, 닉네임 프롬프트의 접이식 고급 입력란에서 저장할 수 있게 했다. 모든 백엔드 요청에 토큰 헤더를 공통으로 붙이되 동기화 journal 본문에서는 제외했다.
- Docker Compose에 인증 토큰·CORS 환경변수를 전달하고, GitHub Pages 빌드가 repo variable `ADVISOR_API_BASE`를 조건부로 `VITE_ADVISOR_API`에 주입하도록 했다.

## 변경 파일

- `.github/workflows/deploy-pages.yml`
- `collab/dev-queue/013-deploy-hardening.md`
- `collab/outbox/dev-013-report.md`
- `docker-compose.yml`
- `frontend/src/modules/missions/components/NicknamePrompt.vue`
- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`
- `service/src/main/java/kr/co/workaround/advisor/adapter/in/web/AdvisorAuthInterceptor.java`
- `service/src/main/java/kr/co/workaround/advisor/config/AdvisorCorsProperties.java`
- `service/src/main/java/kr/co/workaround/advisor/config/WebCorsConfig.java`
- `service/src/main/resources/application.yml`
- `service/src/test/java/kr/co/workaround/advisor/config/AdvisorCorsPropertiesTest.java`
- `service/src/test/java/kr/co/workaround/advisor/web/AdvisorAuthInterceptorTest.java`

## 검증 로그

- `cd service && ./run.sh test` — 통과. 토큰 없음 POST 401, 올바른 토큰 POST 200, 잘못된 토큰 PUT 401, 무토큰 GET 200 및 CORS 환경변수 바인딩 테스트 포함.
- `cd frontend && npm ci` — 통과, 133 packages 설치.
- `cd frontend && npx vitest run` — 통과, 3 files / 26 tests.
- `cd frontend && npx playwright test` — 통과, 9 tests.
- `cd frontend && npx vite build` — 통과, 81 modules transformed.
- 수동 실행 `ADVISOR_AUTH_TOKEN=abc ./run.sh start` 후 curl 검증:
  - 토큰 없는 `POST /api/advisor/chat/preview` → HTTP 401, `{"error":"UNAUTHORIZED","message":"missing or invalid advisor token"}`
  - `X-Advisor-Token: abc`를 포함한 같은 POST → HTTP 200, mock preview JSON 반환

## 미완 사항

- 없음. 실서버 프로비저닝과 TLS/Caddy 구성은 사양의 범위 밖으로 유지했다.

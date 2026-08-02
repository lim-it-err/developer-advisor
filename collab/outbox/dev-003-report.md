# dev-003 완료 보고 — 백엔드 Dockerfile과 CI 테스트 워크플로
- completed_at: 2026-08-03T01:05:56+09:00
- agent: codex
- branch: `agent/codex/docker-ci`

## 구현

- `service/Dockerfile`을 Maven 3.9·Temurin 21 빌드 스테이지와 Eclipse Temurin 21 JRE 런타임 스테이지로 구성했다.
- 컨테이너 기본 프로필을 `mock`으로 고정하고 8080 포트를 노출했다.
- Maven 산출물, 로컬 DB, 로그, IDE 파일을 빌드 컨텍스트에서 제외하는 `service/.dockerignore`를 추가했다.
- push와 pull request에서 병렬 실행되는 GitHub Actions 테스트 워크플로를 추가했다.
  - frontend: `npm ci` → Vitest → Playwright Chromium 설치·E2E → Vite 빌드
  - service: Temurin 21 설정·Maven 캐시 → `mvn -q test`
- 기존 `deploy-pages.yml`은 수정하지 않았다.

## 변경 파일

- `service/Dockerfile`
- `service/.dockerignore`
- `.github/workflows/test.yml`

`service/src`, 프론트 소스, 콘텐츠 파일은 수정하지 않았다.

## 검증

```text
$ cd service && ./run.sh test
Tests run: 17, Failures: 0, Errors: 0, Skipped: 0
✅ 테스트 통과

$ cd frontend && npm ci
added 133 packages

$ npx vitest run
Test Files  1 passed (1)
Tests       7 passed (7)

$ npx playwright test
5 passed (7.3s)

$ npx vite build
✓ 70 modules transformed.
✓ built in 810ms

$ ruby -e <workflow YAML parse/structure check>
workflow structure valid: frontend, service

$ JAVA_HOME=<JDK 21> mvn -q -DskipTests package
$ jar tf target/advisor-0.1.0.jar
BOOT-INF/
```

`actionlint`가 설치되어 있지 않아 Ruby YAML 파싱과 필수 job 구조 검사, 수동 GitHub Actions 구조 검토로 대신했다.

## 환경 제한

Docker CLI 24.0.2는 설치되어 있으나 로컬 Docker 데몬이 실행 중이 아니어서 `docker build`는 수행하지 못했다. 대신 다음을 확인했다.

- Dockerfile의 `COPY` 입력인 `pom.xml`, `src/`가 존재한다.
- JDK 21 Maven 패키징이 성공한다.
- 런타임 스테이지가 복사하는 `target/advisor-0.1.0.jar`가 실제 생성되며 Spring Boot `BOOT-INF/` 구조를 가진다.
- 이미지·프로필·포트·entrypoint 구문을 수동 검토했다.

## 미완 사항

- Docker 데몬이 준비된 환경에서 `docker build -t developer-advisor-service service` 최종 실행 확인이 남아 있다.

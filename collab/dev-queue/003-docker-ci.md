# dev-003 — 백엔드 Dockerfile + CI 테스트 워크플로

## 목표
service/를 도커라이즈하고(platform 편입 M5 준비), GitHub Actions에 테스트 게이트를 추가한다.

## 사양
1. `service/Dockerfile` — 멀티스테이지: maven:3.9-eclipse-temurin-21 빌드 → temurin-21-jre 런타임. 기본 프로필 mock, EXPOSE 8080. `docker build` 가 로컬에서 성공해야 함 (docker 데몬 없으면 Dockerfile 문법·경로 정합성 검토까지만 하고 보고서에 명시).
2. `.github/workflows/test.yml` — push/PR 시: (a) frontend `npm ci && npx vite build` (+ vitest/playwright가 dev-001·002로 생겼다면 포함) (b) service `mvn -q test` (temurin 21 setup-java). 기존 deploy-pages.yml은 건드리지 않는다.
3. `service/.dockerignore` 적절히.

## 검증 게이트
- 워크플로 YAML 문법 유효 (actionlint 또는 육안+구조 검증)
- `cd service && ./run.sh test` 여전히 그린 (JAVA_HOME 주의 — run.sh가 처리함)

## 범위 밖
- deploy-pages.yml 수정 금지, service/src 수정 금지, 콘텐츠 파일 금지

# dev-011 완료 보고 — ClaudeLlmProvider 계약 테스트
- completed_at: 2026-08-03T10:05:36+09:00
- agent: codex
- branch: `agent/codex/claude-provider-contract`

## 구현 내역

- `MockRestServiceServer`로 실제 Anthropic 호출 없이 `/v1/messages` 요청 계약을 검증했다.
- `x-api-key`, `anthropic-version`, 역할별 모델(review/chat), `max_tokens`, 메시지와 강제 `tool_choice`/JSON 스키마를 확인했다.
- `tool_use.input`이 `ReviewContent`와 `ChatReply`로 역직렬화되는 경로 및 `RoutingLlmClient`의 역할 라우팅을 함께 검증했다.
- 401/429/500 응답이 원문 본문과 API 키를 노출하지 않는 `LlmException`으로 변환되는지 검증했다.
- 최대 토큰·연결 타임아웃·읽기 타임아웃 설정의 존재와 실제 HTTP 요청 팩토리 반영을 검증했다.

## 발견한 프로덕션 버그와 수정

- 프로바이더가 `RestClient`를 내부에서 직접 생성해 테스트 대역 주입과 애플리케이션 공통 빌더 설정을 사용할 수 없었다. `RestClient.Builder` 생성자 주입으로 바꾸고 테스트용 패키지 생성자를 추가했다.
- 최대 토큰이 4096으로 하드코딩되어 있었고 HTTP 타임아웃이 없었다. Claude 설정에 `max-tokens`, `connect-timeout`, `read-timeout`을 추가하고 요청에 반영했다.
- 구조화 응답 누락과 일반 예외 메시지에 원문 응답이나 하위 예외 문자열이 포함될 수 있었다. HTTP 상태만 남기고 외부 원문을 노출하지 않도록 메시지를 정리했다.

## 변경 파일

- `service/src/main/java/kr/co/workaround/advisor/adapter/out/llm/LlmProperties.java`
- `service/src/main/java/kr/co/workaround/advisor/adapter/out/llm/claude/ClaudeLlmProvider.java`
- `service/src/main/resources/application-claude.yml`
- `service/src/test/java/kr/co/workaround/advisor/adapter/out/llm/claude/ClaudeLlmProviderTest.java`

## 검증 로그

- `cd service && ./run.sh test`: 통과 — 25 tests, 0 failures, 0 errors, 0 skipped
- `cd frontend && npm ci`: 통과
- `cd frontend && npx vite build`: 통과 — 78 modules transformed
- `git diff --check`: 통과

## 미완 사항

- 없음. 실제 API 키와 외부 네트워크는 사용하지 않았다.

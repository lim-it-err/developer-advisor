# dev-011 — ClaudeLlmProvider 계약 테스트 (실키 없이 호출 경로 보증)

## 목표
사용자가 API 키만 넣으면 동작한다는 것을 실키 없이 증명한다: ClaudeLlmProvider가 만드는 HTTP 요청과 응답 파싱을 가짜 서버로 검증.

## 사양
- RestClient 테스트(MockRestServiceServer 또는 RestClient.Builder 주입 + 스텁)로:
  1. 요청 헤더 `x-api-key`/`anthropic-version`, URL `/v1/messages`, body의 `model`(역할별 라우팅: review→sonnet, chat→haiku)과 tool-use JSON 강제 구조 검증
  2. 정상 tool_use 응답 → 기대 타입(ReviewContent 등) 역직렬화 확인
  3. 401/429/500 응답 → LlmException으로 매핑되는지, 원문 유출 없이 메시지 정리되는지
  4. max_tokens·타임아웃 설정 존재 확인
- RoutingLlmClient의 역할→프로바이더 라우팅도 한 케이스.
- 기존 테스트 스타일(ControllerSliceTest 등) 따를 것.

## 검증 게이트
- `cd service && ./run.sh test` 그린 (신규 포함)

## 범위 밖
- 실제 api.anthropic.com 호출 금지, 키 요구 금지, 프로덕션 코드 수정은 버그 발견 시에만(보고서 명시)

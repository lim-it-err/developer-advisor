# service — Developer Advisor 백엔드

Spring Boot 3.3 · Java 21 · hexagonal-lite. 기록 영속화(H2 파일)와 LLM 프리뷰(채팅·리뷰)를 제공한다.

## 실행

```bash
./run.sh test           # 테스트 (JAVA_HOME 자동 고정)
./run.sh start          # mock 프로파일 — 키·과금 없음, 전 기능 폴백 동작
./run.sh start claude   # 실제 Claude 호출 (아래 키 필요)
```

Docker (레포 루트에서):

```bash
docker compose up --build                                          # mock
ANTHROPIC_API_KEY=sk-... ADVISOR_PROFILE=claude docker compose up --build   # 실제 리뷰
```

## API 키는 이렇게만

- `export ANTHROPIC_API_KEY=...` 환경변수 **하나가 전부다**. 파일에 적지 않는다.
- 키가 없으면 claude 프로파일은 시작을 거부한다(run.sh 가드). mock은 영원히 무과금.
- 모델: 리뷰·출제 = claude-sonnet-5, 채팅 = claude-haiku-4-5 (application-claude.yml).

## 데이터

- H2 파일: `service/data/advisor.mv.db` (gitignore됨). 지우면 초기화.
- 기록 API: `/api/advisor/learners/{nickname}/...` — 프론트가 자동 동기화한다.

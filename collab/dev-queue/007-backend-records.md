# dev-007 — 백엔드 M2: 닉네임 스코프 기록 영속화

## 목표
docs/M2-BACKEND-PLAN.md 를 구현한다. 시작 전에 그 문서와 기존 코드(adapter/in/web, domain, persistence)를 새로 읽을 것.

## 사양
1. `application.yml`: H2를 파일 모드로 (`jdbc:h2:file:./data/advisor;AUTO_SERVER=TRUE` 유사). `service/data/`는 이미 gitignore — 커밋되지 않는지 확인.
2. 닉네임 스코프 API (M2 문서 표) — 기존 Submission/Review 도메인·엔티티에 nickname 필드를 추가·확장. 기존 Track/Mission 흐름과의 정합은 깨지 않는 선에서 최소 수정.
3. journal: `LearnerJournalEntity` (nickname PK, json CLOB, updatedAt). GET 없으면 빈 객체.
4. 검증: MockMvc 특성화 테스트 — 제출 2회 → 버전 2개, journal PUT→GET 왕복, 재시작 생존은 파일 존재로 확인.
5. **LLM 프로바이더·프롬프트·claude 프로파일 코드는 절대 건드리지 말 것 (보류 결정).**

## 검증 게이트
- `cd service && ./run.sh test` 그린 (JAVA_HOME은 run.sh가 처리)
- `./run.sh start` 후 curl로 제출 POST→GET 왕복 로그를 보고서에 첨부

## 범위 밖
- 인증, LLM, 미션 콘텐츠 서빙, 프론트 수정(그건 dev-008)

# Developer Advisor

> 세상을 거대한 디지털 구조로 본다.

에이전트가 도메인 기반 코딩 미션을 출제하고, 학습자가 로컬 IDE에서 구현해 제출하면 리뷰·평판·시나리오로 피드백하는 학습 서비스. 알고리즘 문제가 아니라 **도메인 기반 설계 훈련** — 미션은 항상 비즈니스 시나리오(와인, 제빵, 건축, 금융, 철도…)에서 출발하고, 그 도메인을 공부해야만 짤 수 있는 규칙(과세, 이자, 베이커스 퍼센트, 건폐율)을 다룬다.

추후 [workaround.co.kr-platform](https://github.com/lim-it-err/workaround.co.kr-platform)에 서브서비스로 편입 예정.

## 구조

```
frontend/   Vue 3 + Vite 프로토타입 (이식 단위: src/modules/missions/)
service/    Spring Boot 백엔드 (Java 21 + Maven, hexagonal-lite)
docs/       기획서 · 커리큘럼 · 백엔드 설계 · 도메인 카탈로그 · 학습자 과제
```

## 실행

```bash
# 프론트 (미션 10개 프로토타입, http://localhost:5173)
cd frontend && npm install && npm run dev

# 백엔드 (mock 프로필 — API 키 불필요, http://localhost:8080/api/advisor)
cd service && ./run.sh test    # 전체 테스트
cd service && ./run.sh start   # 서버 기동
cd service && ./run.sh demo    # 트랙→미션→제출→리뷰 full cycle 시연
```

## 핵심 개념

- **2축 난이도**: Easy/Normal/Hard(규칙 복잡도) × 단일 파일/여러 파일/모듈 경계(구조 스코프)
- **히든 케이스**: 요구사항에 없는 입력(오버플로, 타입 오염)이 리뷰에서 공개된다 — 현실의 입력은 명세를 읽지 않으니까
- **히든 퀘스트**: 지문에 문장으로만 심어진 과제. "어떤 문장은 힌트였습니다"
- **결말 분기**: ☕ 평온 / 🔧 핫픽스 / 🚨 새벽 3시 / 🔒 ??? — 리뷰의 시나리오가 도달한 결말에 도장을 찍는다
- **질문 창 + 평판**: 요구사항의 의도적 모호함은 되물어야 풀리고, 그 소통이 "3년차 중상" 같은 평판으로 평가된다
- **기획자 모드**: 같은 문제를 다른 의자에서 — 이해관계자 회의(비공개 관심사를 캐내라), 다차원 검토서
- **엔진 코드 원칙**: 인프라 내부 구현은 항상 제공된다. 연습 대상은 인터페이스 정의이지 `db.insert()` 구현이 아니다

## 문서

- [docs/PLAN.md](docs/PLAN.md) — 제품 기획 (도메인 모델, 아키텍처, 에이전트 설계)
- [docs/CURRICULUM.md](docs/CURRICULUM.md) — 커리큘럼과 콘텐츠 원칙 (유머·감성 원칙 포함)
- [docs/M1-BACKEND-PLAN.md](docs/M1-BACKEND-PLAN.md) — 백엔드 구현 계획 + 구현 노트
- [docs/DOMAIN-POOL.md](docs/DOMAIN-POOL.md) — 도메인 후보군 카탈로그
- [docs/EXERCISE-LLMCLIENT.md](docs/EXERCISE-LLMCLIENT.md) — 학습자 과제: LlmClient 인터페이스를 스스로 설계하라

## 상태

prototype v0.1 — 미션 10개 (S1~S6 전 스테이지), 콘텐츠는 에이전트 생성 샘플. 백엔드 M1 완료 (테스트 그린, mock full cycle 동작). 다음: 프론트-백엔드 연결(M3), 실 LLM provider 튜닝(M2), platform 편입(M5).

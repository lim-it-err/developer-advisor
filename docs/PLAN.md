# Developer Advisor — 기획서 (v0.1)

> 에이전트가 도메인 기반 Java 코딩 미션을 출제하고, 사용자가 로컬 IDE에서 구현해 제출하면
> 에이전트가 리뷰·피드백하는 학습 서비스.
> 별도 개발 후 [workaround.co.kr-platform](https://github.com/lim-it-err/workaround.co.kr-platform)에 서브서비스로 편입한다.

---

## 1. 목표와 비전

- **1차 목표 (MVP)**: 코딩 미션 사이클 — 미션 생성 → 구현 → 제출 → 리뷰 → 재제출/다음 미션.
- **2차 목표**: 기술 인터뷰 모드 (대화형 모의면접). MVP 이후 별도 모듈로 추가.
- **학습 철학**: 알고리즘 문제가 아니라 **도메인 기반 설계 훈련**.
  미션은 항상 비즈니스 시나리오(정산, 재고, 예약, 결제 등)에서 출발하고,
  리뷰는 정답 여부가 아니라 도메인 모델링·유비쿼터스 언어·트랜잭션 경계·테스트 설계를 평가한다.

## 2. 확정된 결정 사항

| 항목 | 결정 |
|---|---|
| MVP 모드 | 코딩 미션 모드 |
| LLM | 추상화 인터페이스 (`LlmClient`) — Claude API / Ollama 설정으로 전환 |
| 제출 방식 | 로컬 IDE에서 작성 → 웹에 코드/파일 붙여넣기 (멀티파일 지원) |
| 프론트엔드 | 독립 Vue 3 + Vite 앱, 나중에 platform frontend에 라우트 모듈로 이식 |
| 백엔드 | 독립 Spring Boot 서비스 (dockerized) — platform `services/` 편입 전제 |
| 콘텐츠 | 하드코딩 없음. 미션·리뷰 모두 에이전트가 생성 |

백엔드를 Spring Boot로 하는 이유: platform의 서브서비스 규약(독립 도커라이즈)에 맞고,
**이 프로젝트 자체가 도메인 기반 Java 설계 연습이 된다** (advisor 서비스의 도메인 모델을 직접 설계).

## 3. 핵심 사용자 흐름

```
[트랙 선택/프로필]
      │  관심 도메인(예: 정산/예약/재고), 난이도, 훈련 포커스(DDD/트랜잭션/테스트)
      ▼
[미션 생성]  ← Mission Generator Agent
      │  비즈니스 시나리오 + 요구사항 + 제약조건 + 평가 루브릭(사용자에겐 일부만 노출)
      ▼
[구현]  로컬 IntelliJ에서 작업
      ▼
[제출]  웹에서 파일 단위로 붙여넣기 (파일명 + 내용, 여러 개)
      ▼
[리뷰]  ← Reviewer Agent
      │  루브릭 기반 점수 + 항목별 피드백 + 개선 포인트 + 심화 질문
      ▼
[재제출] 또는 [다음 미션]  → 히스토리에 축적, 성장 추이 확인
```

## 4. 도메인 모델 (advisor 서비스)

이 서비스 자체의 유비쿼터스 언어:

- **Learner** — 학습자. 프로필(관심 도메인, 난이도 선호, 훈련 포커스)을 가짐.
- **Track** — 학습 트랙. 예: "정산 도메인 DDD 트랙". 미션들이 이 아래에 이어짐.
- **Mission** — 에이전트가 생성한 과제. 시나리오, 요구사항, 제약, 루브릭(비공개 항목 포함), 상태(DRAFT/ACTIVE/COMPLETED).
- **Submission** — 하나의 제출. 여러 SubmittedFile(경로+내용)로 구성. Mission당 N회 가능.
- **Review** — Submission에 대한 에이전트 평가. 루브릭 항목별 점수 + 피드백 + 후속 질문.
- **RubricItem** — 평가 기준 항목 (예: "유비쿼터스 언어 일치", "애그리거트 경계", "테스트 설계"). 가중치 보유.

관계: `Track 1─N Mission 1─N Submission 1─1 Review`

## 5. 아키텍처

### 개발 단계 (standalone)

```
developerAdvisor/
├─ frontend/            # Vue 3 + Vite + Pinia + vue-router
│  └─ src/
│     ├─ modules/missions/    # ★ 이식 단위. 라우트·컴포넌트·스토어·API 클라이언트를 모듈 안에 격리
│     │  ├─ pages/            # MissionListPage, MissionDetailPage, ReviewPage
│     │  ├─ components/       # MissionBrief, FileSubmitEditor, RubricScoreCard, ReviewFeedback
│     │  ├─ store/            # Pinia store (missions)
│     │  └─ api/              # advisor 서비스 API 클라이언트 (baseURL 주입식)
│     └─ app/                 # 껍데기(라우터 마운트, 레이아웃) — 이식 시 버리는 부분
├─ service/             # Spring Boot (Java 21)
│  └─ src/main/java/kr/co/workaround/advisor/
│     ├─ domain/              # Learner, Track, Mission, Submission, Review (순수 도메인)
│     ├─ application/         # MissionService, ReviewService (유스케이스)
│     ├─ adapter/
│     │  ├─ in/web/           # REST 컨트롤러
│     │  ├─ out/llm/          # LlmClient 인터페이스 + ClaudeClient / OllamaClient
│     │  └─ out/persistence/  # JPA (개발: H2 file, 운영: PostgreSQL)
│     └─ config/
├─ docs/                # 이 문서, ADR, 프롬프트 설계
└─ docker-compose.yml   # service + (필요시) postgres
```

- **컴포넌트화 원칙**: 프론트는 `modules/missions/` 밖을 참조하지 않는다(전역 스토어·전역 CSS 금지).
  이식 = 모듈 디렉토리 복사 + 라우트 등록 1줄.
- **LLM 추상화**:
  ```java
  public interface LlmClient {
      <T> T complete(PromptTemplate prompt, Class<T> schema); // structured output
  }
  ```
  구현체 선택은 `application.yml`의 `advisor.llm.provider: claude | ollama`.
  Claude는 tool-use 기반 JSON 강제, Ollama는 JSON mode + 재시도 파서로 보정.

### 편입 단계 (platform)

1. `service/` → platform `services/advisor/` 로 이동, Dockerfile 그대로.
2. gateway에 `/api/advisor/**` 라우팅 추가 (비즈니스 로직은 gateway에 두지 않음 — 플랫폼 원칙 준수).
3. `frontend/src/modules/missions/` → platform `frontend/` 에 복사, 라우트 등록.
4. (선택) 리뷰 작업이 길어지면 동기 HTTP 대신 platform의 **Redis Streams 티켓**으로 전환:
   제출 시 티켓 발행 → worker가 LLM 호출 → 결과 저장 → 프론트는 폴링/SSE.
   MVP는 동기 호출로 충분 (리뷰 1회 ≈ 20~60초, 프론트에 진행 표시).

## 6. API 설계 (MVP)

```
POST   /api/advisor/tracks                     트랙 생성 (도메인, 난이도, 포커스)
GET    /api/advisor/tracks/{id}
POST   /api/advisor/tracks/{id}/missions       미션 생성 (에이전트 호출)
GET    /api/advisor/missions/{id}
POST   /api/advisor/missions/{id}/submissions  제출 { files: [{path, content}] }
GET    /api/advisor/submissions/{id}/review    리뷰 조회 (생성 중이면 202)
POST   /api/advisor/missions/{id}/complete     미션 완료 처리
GET    /api/advisor/learners/me/history        성장 히스토리
```

## 7. 에이전트 설계 (콘텐츠 = 전부 생성형)

### Mission Generator Agent
- 입력: 트랙 설정(도메인/난이도/포커스) + 직전 미션들의 리뷰 요약(약점 반영).
- 출력(JSON 고정 스키마): `{ title, scenario, requirements[], constraints[], hints[], rubric: [{name, description, weight, visibleToLearner}] }`
- 원칙: 요구사항에 **의도적 모호함 1개** 포함(현업처럼 되물어야 하는 지점),
  제약에 항상 도메인 규칙 1개 이상(예: "정산은 멱등해야 한다").

### Chat Agent (미션 중 질문 창)
- 역할: 선배 개발자/기획자. 미션 전문 + 대화 이력을 컨텍스트로 실시간 응답.
- 모델: Haiku 계열 (빠르고 저렴). `LlmClient`에 역할별 모델 설정 (`advisor.llm.roles.chat / review / generate`).
- 원칙: 정답을 바로 주지 않는다. 모호한 요구사항을 물으면 기획자처럼 결정해주되, 안 물으면 먼저 알려주지 않는다.
- 대화 전체가 Submission에 첨부되어 리뷰 시 평판 평가의 입력이 된다.

### Reviewer Agent
- 입력: 미션 전문 + 루브릭 + 제출 파일들.
- 출력(JSON): `{ overall, items: [{rubricName, score, evidence(코드 인용), feedback}], nextSteps[], followUpQuestions[], reputation }`
- `reputation` (평판, 채점과 분리된 정성 평가): 질문 창 대화를 읽고 `{ level("3년차 중상" 식), summary, strengths[], improvements[] }`. 기준은 타이밍·구체성·자기 시도·매너 — 질문 개수가 아니라 "물어야 할 것을 물었는가".
- `scenario` (시나리오, 마크다운): **당신의 코드가 배포된 후의 이야기.** 제출된 코드의 실제 구조·결함·방어를 근거로, 배포 후 몇 주간 세상에 벌어진 일을 내레이션한다 — 히든 케이스가 현실에서 터지는 장면, 요구사항 변경이 도착했을 때 코드가 버틴/부러진 장면. 리뷰 결과는 **점수(채점) / 평판(소통) / 시나리오(세계의 반응)** 3부 구성.
- `ending` (결말 도장): 미션이 제시한 결말 분기(☕평온/🔧핫픽스/🚨새벽 3시/🔒히든) 중 시나리오가 도달한 것. `{ grade: 'calm'|'hotfix'|'dawn'|'hidden', title }`. 미션 생성 시 Mission에 `endings[]`(게임 상태창처럼 표시, 히든은 조건 비공개)가 포함된다 — [CURRICULUM.md](CURRICULUM.md) "결말 분기" 참조.
- 원칙: 점수보다 **코드 인용 기반 근거** 필수. "왜 이 트랜잭션 경계가 위험한가"를 코드 라인 짚어 설명.
- followUpQuestions는 나중에 인터뷰 모드의 씨앗이 됨.

프롬프트 원문은 `docs/prompts/` 에 버전 관리.

## 8. 화면 (MVP 3장)

> v0.1 프로토타입 구현 완료 (`frontend/`). 커리큘럼·미션 구성은 [CURRICULUM.md](CURRICULUM.md) 참조.

1. **커리큘럼 맵 + 미션 목록** — 스테이지(S1~S6)별 진척, 미션 카드.
2. **미션 상세** — 4개 탭: ①도메인 브리핑(상식) ②미션(시나리오+레거시 코드+요구사항+루브릭) ③제출(파일 붙여넣기 에디터) ④설명 훈련(청자 지정 설명문 작성).
3. **리뷰 결과** — 루브릭 점수 + 코드 인용 피드백 + 꼬리질문, 설명 훈련 피드백(논리 구조/명료성/비유 + 모범 재작성), 재제출 버튼.

미션은 그린필드가 아니라 **레거시 리팩토링/기능 추가** 중심 (java-refactoring-study 방식). 도메인 브리핑과 설명 훈련으로 상식·언어화 능력을 함께 키운다.

## 9. 마일스톤

| 단계 | 내용 | 완료 기준 |
|---|---|---|
| M1 | 백엔드 골격: 도메인 모델 + JPA + REST + `LlmClient` 추상화 + Ollama 구현체 | curl로 미션 생성→제출→리뷰 사이클 동작 |
| M2 | Claude 구현체 + 프롬프트 튜닝 (루브릭 품질) | 동일 미션에 대해 두 provider 출력 비교 가능 |
| M3 | 프론트: 3개 화면 + missions 모듈 구조 | 브라우저에서 전체 사이클 완주 |
| M4 | 히스토리/성장 추이, 재제출 diff 표시 | 미션 5개 이상 수행한 히스토리 화면 |
| M5 | platform 편입: services/advisor + gateway 라우팅 + frontend 모듈 이식 | workaround.co.kr에서 접근 가능 |

## 10. 미결 사항 (진행하며 결정)

- 인증: MVP는 단일 사용자(본인) 가정, 편입 시 platform 인증 체계 따름.
- 리뷰 비동기화(티켓) 전환 시점: 리뷰 소요시간이 60초 넘어가면.
- 인터뷰 모드: Reviewer의 followUpQuestions 데이터가 쌓인 뒤 설계.

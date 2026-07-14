# M1 — Backend 구현 계획 (Developer Advisor service/)

> 대상: Sonnet 급 구현자가 **기계적으로** 따라가는 문서.
> 산출물: `service/` 아래 Spring Boot 백엔드 골격. 완료 기준 = `mvn -q test` 그린 + curl 로 트랙→미션→제출→리뷰 사이클 동작.
> 참조: docs/PLAN.md §4~7, docs/CURRICULUM.md. 프론트 계약: frontend/src/modules/missions/store/missions.js, data/sampleContent.js.

---

## 0. 전제 / 사전 점검

- **Java 21**, **Maven**(gradle 금지), Spring Boot **3.3.x**.
- 이 머신의 `mvn` 기본 런타임은 JDK 25다. Boot 3.3 검증 범위 밖이므로 **빌드 전 반드시** JDK 21로 고정:
  - `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` (또는 설치된 openjdk 21 경로) 후 `mvn -v` 로 `Java version: 21` 확인.
  - pom 은 `<maven.compiler.release>21</maven.compiler.release>` 로 못 박는다.
- 패키지 루트: `kr.co.workaround.advisor`.
- 아키텍처: hexagonal-lite (domain / application / adapter.in.web / adapter.out.llm / adapter.out.persistence / config) — PLAN.md §5.
- **기본 프로필 = `mock`**. 시크릿 0개로 `mvn -q test` 와 `mvn spring-boot:run` 이 그대로 돈다.

---

## 1. 모듈 트리 / 전체 파일 목록

```
service/
├─ pom.xml
├─ src/main/resources/
│  ├─ application.yml
│  ├─ application-mock.yml
│  ├─ application-claude.yml
│  ├─ application-ollama.yml
│  └─ prompts/
│     ├─ generate-mission.md
│     ├─ review-submission.md
│     ├─ chat-reply.md
│     └─ evaluate-explanation.md
├─ src/main/java/kr/co/workaround/advisor/
│  ├─ AdvisorApplication.java
│  ├─ domain/
│  │  ├─ track/            Track.java, Difficulty.java, TrackId.java(선택)
│  │  ├─ mission/          Mission.java, MissionStatus.java,
│  │  │                    content/ MissionContent.java, Briefing.java, SourceFile.java,
│  │  │                             RubricItem.java, HiddenCase.java, ExplainTask.java
│  │  ├─ submission/       Submission.java, SubmittedFile.java
│  │  ├─ review/           Review.java, ReviewStatus.java,
│  │  │                    content/ ReviewContent.java, ReviewItem.java,
│  │  │                             ReviewedHiddenCase.java, Reputation.java, ExplainFeedback.java
│  │  └─ chat/             ChatMessage.java, ChatRole.java
│  ├─ application/
│  │  ├─ port/             LlmClient.java, LlmRole.java              ← ★ 학습자 과제 지점
│  │  ├─ TrackService.java
│  │  ├─ MissionService.java
│  │  ├─ SubmissionService.java
│  │  ├─ ReviewService.java
│  │  └─ ChatService.java
│  ├─ adapter/
│  │  ├─ in/web/
│  │  │  ├─ TrackController.java
│  │  │  ├─ MissionController.java
│  │  │  ├─ SubmissionController.java
│  │  │  ├─ ReviewController.java
│  │  │  ├─ ChatController.java
│  │  │  ├─ LearnerController.java
│  │  │  ├─ dto/           (요청/응답 record 모음 — §4)
│  │  │  └─ GlobalExceptionHandler.java
│  │  ├─ out/llm/
│  │  │  ├─ RoutingLlmClient.java        (LlmClient 구현: role→provider 라우팅)
│  │  │  ├─ LlmProvider.java             (내부 SPI)
│  │  │  ├─ LlmProperties.java           (@ConfigurationProperties advisor.llm)
│  │  │  ├─ PromptLoader.java            (resources/prompts/*.md 로드+치환)
│  │  │  ├─ mock/   MockLlmProvider.java, MockFixtures.java
│  │  │  ├─ claude/ ClaudeLlmProvider.java
│  │  │  └─ ollama/ OllamaLlmProvider.java
│  │  └─ out/persistence/
│  │     ├─ entity/  TrackEntity, MissionEntity, SubmissionEntity,
│  │     │           SubmittedFileEntity, ReviewEntity, ChatMessageEntity
│  │     ├─ repo/    TrackRepository, MissionRepository, SubmissionRepository,
│  │     │           ReviewRepository, ChatMessageRepository (Spring Data JPA)
│  │     ├─ converter/ JsonAttributeConverters (MissionContent/ReviewContent용)
│  │     └─ mapper/  PersistenceMapper (엔티티↔도메인)
│  └─ config/
│     ├─ WebCorsConfig.java
│     └─ JacksonConfig.java (선택)
├─ src/test/java/kr/co/workaround/advisor/
│  ├─ MissionServiceTest.java
│  ├─ ReviewServiceTest.java
│  ├─ ChatServiceTest.java
│  ├─ persistence/RepositoryTest.java
│  ├─ web/ControllerSliceTest.java
│  └─ FullCycleIT.java            (@SpringBootTest happy-path)
└─ src/test/resources/application-test.yml (H2 in-memory, profile=mock)
docs/
└─ EXERCISE-LLMCLIENT.md          ← ★ 학습자 과제 브리핑 (§8 박스)
```

도메인 content 하위 타입(MissionContent 등)은 **순수 record** — JPA 어노테이션 금지. JPA 는 `out/persistence/entity` 에만.

---

## 2. pom.xml 핵심

- parent: `spring-boot-starter-parent:3.3.x`.
- properties: `<java.version>21</java.version>`, `<maven.compiler.release>21</maven.compiler.release>`.
- 의존성:
  - `spring-boot-starter-web` (RestClient 포함 — Claude/Ollama HTTP 에 **WebFlux 불필요**, `RestClient` 사용).
  - `spring-boot-starter-data-jpa`
  - `spring-boot-starter-validation`
  - `com.h2database:h2` (runtime)
  - `com.github.victools:jsonschema-generator` + `jsonschema-module-jackson` (Claude tool input_schema 를 `Class<T>` 에서 생성. mock/ollama 는 불필요하나 컴파일 대상이라 포함)
  - `spring-boot-starter-test` (test)
- Jackson 은 starter-web 에 포함(별도 추가 금지).

---

## 3. 엔티티 / 도메인 정의

### 3.1 저장 전략
Track/Mission/Submission/Review/ChatMessage 를 정규 테이블로, **풍부한 콘텐츠 JSON(MissionContent, ReviewContent)은 TEXT(CLOB) 한 컬럼**에 Jackson 직렬화로 저장한다. rubric item, hiddenCase 등을 **테이블로 쪼개지 않는다**(요구사항). H2 는 JSONB 미지원 → `@Lob`/`columnDefinition="CLOB"` + `AttributeConverter<T,String>`.

### 3.2 JPA 엔티티 컬럼

**TrackEntity** `tracks`
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | VARCHAR PK | `trk_` + UUID |
| domain | VARCHAR | 예: 와인 |
| difficulty | VARCHAR(enum) | Easy/Normal/Hard |
| focus | VARCHAR | 분리/인터페이스/… |
| title | VARCHAR | 생성 시 채움 |
| created_at | TIMESTAMP | |

**MissionEntity** `missions`
| id VARCHAR PK (`s1-wine-01` 유사 slug 또는 `msn_`+UUID) · track_id FK · stage INT · stage_title · mission_type · difficulty · scope · domain · domain_emoji · title · estimated_minutes INT · status VARCHAR(DRAFT/ACTIVE/COMPLETED) · **content CLOB** (=MissionContent JSON) · created_at |

**SubmissionEntity** `submissions`
| id VARCHAR PK · mission_id FK · explanation CLOB(nullable) · submitted_at |
**SubmittedFileEntity** `submitted_files`
| id · submission_id FK · path VARCHAR · content CLOB · ord INT |

**ReviewEntity** `reviews`
| id VARCHAR PK · submission_id FK **unique** · overall INT · status VARCHAR(GENERATING/READY) · **content CLOB** (=ReviewContent JSON) · created_at |

**ChatMessageEntity** `chat_messages`
| id · mission_id FK · role VARCHAR(ME/AGENT) · text CLOB · at TIMESTAMP |

관계: Track 1─N Mission 1─N Submission 1─1 Review, Mission 1─N ChatMessage. FetchType LAZY, 서비스에서 명시 로드.

### 3.3 콘텐츠 record (domain, JSON 스키마 = 프론트 계약 그대로)

```java
record MissionContent(
    Briefing briefing, String scenario,
    List<SourceFile> legacyFiles, List<SourceFile> providedFiles,
    List<String> requirements, List<String> constraints,
    List<String> learningGoals, List<String> hints,
    List<RubricItem> rubric, List<HiddenCase> hiddenCases,
    List<Ending> endings,
    ExplainTask explainTask) {}
record Briefing(String title, String content) {}
record SourceFile(String path, String content) {}
record RubricItem(String name, String description, int weight, boolean visibleToLearner) {}
record HiddenCase(String title, String description) {}     // 미션 단계: title+description
record Ending(String grade, String title, String teaser) {} // 결말 분기: calm|hotfix|dawn|hidden
record ExplainTask(String audience, String prompt) {}

record ReviewContent(
    String summary, List<ReviewItem> items,
    List<ReviewedHiddenCase> hiddenCases,
    List<String> nextSteps, List<String> followUpQuestions,
    String scenario, EndingStamp ending, Reputation reputation,
    ExplainFeedback explainFeedback) {}                    // explainFeedback nullable
record ReviewItem(String rubricName, int score, String evidence, String feedback) {}
record ReviewedHiddenCase(String title, boolean passed, String note, String warStory) {} // warStory nullable
record EndingStamp(String grade, String title) {}
record Reputation(String level, String summary, List<String> strengths, List<String> improvements) {}
record ExplainFeedback(String transcript, ExplainDetail feedback) {}
record ExplainDetail(String structure, String clarity, String analogy, String improved) {}
```
필드명은 sampleContent.js 와 **1:1 동일**해야 프론트 교체가 무손실. `overall` 은 ReviewEntity 컬럼(정렬/히스토리용) + 응답 조립 시 합류.

---

## 4. DTO 정의 (adapter.in.web.dto, 전부 record)

- `CreateTrackRequest(String domain, @NotBlank String difficulty, String focus)`
- `TrackResponse(String id, String domain, String difficulty, String focus, String title, Instant createdAt, List<MissionSummary> missions)`
- `MissionSummary(String id, int stage, String stageTitle, String title, String difficulty, String scope, String domain, String domainEmoji, String status)`
- `GenerateMissionRequest(String missionType, String scope, String difficulty)` (선택 오버라이드; 비면 트랙 기준)
- `MissionResponse` — **학습자 뷰**: 미션 전체 필드 + `rubric` 는 `visibleToLearner==true` 만, `hiddenCaseCount`(개수만, 내용 숨김), briefing/scenario/legacyFiles/providedFiles/requirements/constraints/learningGoals/hints/endings/explainTask 포함.
- `SubmitRequest(List<FileDto> files, String explanation)`, `FileDto(String path, String content)`
- `SubmitResponse(String submissionId, String reviewId, String reviewStatus)`
- `ReviewResponse(String id, String submissionId, int overall, String summary, List<ReviewItem> items, List<ReviewedHiddenCase> hiddenCases, List<String> nextSteps, List<String> followUpQuestions, String scenario, EndingStamp ending, Reputation reputation, ExplainFeedback explainFeedback)` — **reputation + scenario + ending + hiddenCases 포함**(요구사항).
- `ChatSendRequest(@NotBlank String text)`
- `ChatMessageDto(String role, String text, Instant at)`, `ChatResponse(List<ChatMessageDto> messages)`
- `HistoryItem(String missionId, String title, String domain, int stage, int overall, Instant completedAt)`

DTO↔도메인 변환은 컨트롤러 옆 정적 매퍼 또는 서비스에서. LLM 구조화 출력 타입은 **도메인 record 직접**(MissionContent, ReviewContent) 사용.

---

## 5. 엔드포인트 명세 (요청/응답 JSON 예시)

기본 프리픽스 `/api/advisor`. CORS: `http://localhost:5173`.

### POST /tracks → 201
req `{ "domain":"와인", "difficulty":"Easy", "focus":"분리" }`
resp `{ "id":"trk_9f...","domain":"와인","difficulty":"Easy","focus":"분리","title":"와인 도메인 · 분리의 감각 트랙","createdAt":"2026-07-13T...","missions":[] }`

### GET /tracks/{id} → 200 (missions 요약 포함)

### POST /tracks/{id}/missions → 201  (LlmRole.GENERATE 호출)
req(선택) `{ "missionType":"리팩토링", "scope":"단일 파일", "difficulty":"Easy" }`
resp = MissionResponse:
```json
{ "id":"msn_1a...", "stage":1, "stageTitle":"분리의 감각", "missionType":"리팩토링",
  "difficulty":"Easy", "scope":"단일 파일", "domain":"와인", "domainEmoji":"🍷",
  "title":"와인 추천기의 뒤엉킨 책임 풀어내기", "estimatedMinutes":90, "status":"ACTIVE",
  "briefing":{"title":"...","content":"### ..."},
  "scenario":"사내 복지몰에 붙어 있는 ...",
  "legacyFiles":[{"path":"src/.../WineRecommender.java","content":"package ..."}],
  "providedFiles":[],
  "requirements":["...","..."], "constraints":["..."], "learningGoals":["..."], "hints":["..."],
  "rubric":[{"name":"책임 분리","description":"...","weight":30}],
  "hiddenCaseCount":3,
  "endings":[{"grade":"calm","title":"...","teaser":"..."}, {"grade":"hotfix","title":"...","teaser":"..."}, {"grade":"dawn","title":"...","teaser":"..."}, {"grade":"hidden","title":"???","teaser":"..."}],
  "explainTask":{"audience":"...소믈리에 출신 기획자","prompt":"..."} }
```

### GET /missions/{id} → 200 (동일 MissionResponse)

### POST /missions/{id}/submissions → 201 (동기 리뷰 생성: LlmRole.REVIEW)
req `{ "files":[{"path":"WineRecommender.java","content":"..."},{"path":"Wine.java","content":"..."}], "explanation":"제가 만든 추천 시스템은 ..." }`
resp `{ "submissionId":"sub_...","reviewId":"rev_...","reviewStatus":"READY" }`

### GET /submissions/{id}/review → 200 (준비됨) / 202 (GENERATING)
resp 200:
```json
{ "id":"rev_...","submissionId":"sub_...","overall":66,
  "summary":"책임을 나누려는 방향은 ...",
  "items":[{"rubricName":"책임 분리","score":20,"evidence":"class PairingRule {...}","feedback":"..."}],
  "hiddenCases":[{"title":"G0LD 회원의 침묵","passed":false,"note":"...","warStory":"..."}],
  "nextSteps":["Wine을 record로 ..."],
  "followUpQuestions":["와인 데이터가 DB로 ..."],
  "scenario":"**배포 +3일.** ...",
  "ending":{"grade":"hotfix","title":"..."},
  "reputation":{"level":"3년차 중상","summary":"...","strengths":["..."],"improvements":["..."]},
  "explainFeedback":{"transcript":"...","feedback":{"structure":"...","clarity":"...","analogy":"...","improved":"..."}} }
```

### POST /missions/{id}/chat → 200 (LlmRole.CHAT)
req `{ "text":"예산 초과 허용 폭은 얼마까지인가요?" }`
resp `{ "messages":[{"role":"me","text":"예산 초과 ...","at":"..."},{"role":"agent","text":"좋은 지점을 짚으셨어요 ...","at":"..."}] }`
(ME/AGENT 를 프론트 계약대로 소문자 `me`/`agent` 로 직렬화)

### GET /missions/{id}/chat → 200 `{ "messages":[...] }`

### POST /missions/{id}/complete → 200 (status=COMPLETED)

### GET /learners/me/history → 200 `[{"missionId":"msn_...","title":"...","domain":"와인","stage":1,"overall":66,"completedAt":"..."}]`
(MVP 단일 사용자 가정 — learnerId 없음)

### 오류 규약 (GlobalExceptionHandler)
- 404 `{ "error":"NOT_FOUND", "message":"mission msn_x not found" }`
- 400 검증 실패 `{ "error":"VALIDATION", "fields":{...} }`
- 502 LLM 실패 `{ "error":"LLM_ERROR", "message":"..." }`

---

## 6. LlmClient / provider 설계

### 6.1 포트 (application.port)
```java
public interface LlmClient {
    <T> T complete(LlmRole role, String prompt, Class<T> type);   // structured output
}
public enum LlmRole { GENERATE, REVIEW, CHAT }
```
서비스는 이 포트에만 의존. 예: `missionContent = llm.complete(GENERATE, prompt, MissionContent.class)`.

### 6.2 설정 (application.yml, 역할별 provider+model)
```yaml
advisor:
  llm:
    roles:
      generate: { provider: mock, model: default }
      review:   { provider: mock, model: default }
      chat:     { provider: mock, model: default }
```
`application-claude.yml` 예:
```yaml
advisor.llm.roles:
  generate: { provider: claude, model: claude-sonnet-5 }
  review:   { provider: claude, model: claude-sonnet-5 }
  chat:     { provider: claude, model: claude-haiku-4-5-20251001 }   # 채팅=Haiku (CURRICULUM: 빠르고 저렴)
```
`LlmProperties`(@ConfigurationProperties("advisor.llm")) 로 바인딩.

### 6.3 라우팅 구현 (adapter.out.llm)
```java
interface LlmProvider {                      // 내부 SPI (포트 아님)
    String name();                           // "mock" | "claude" | "ollama"
    <T> T complete(String model, String prompt, Class<T> type);
}
class RoutingLlmClient implements LlmClient {
    // Map<String,LlmProvider> byName; LlmProperties props;
    // complete(role, prompt, type): props.roles.get(role) → {provider,model} → byName.get(provider).complete(model, prompt, type)
}
```
provider 빈은 전부 등록하고 `name()` 로 Map 구성 → 프로필과 무관하게 라우팅. (Claude/Ollama 빈은 키 없어도 생성만 되고, mock 라우팅이면 호출 안 됨.)

### 6.4 provider 3종

- **MockLlmProvider (기본)**: `type` + `prompt` 힌트로 캔드 픽스처 반환. `MockFixtures` 는 sampleContent.js 를 참고해 **와인 미션/리뷰/평판/설명피드백/채팅응답** 고정 객체 제공. 키/네트워크 0. 테스트·키리스 dev 용. `MissionContent`, `ReviewContent`, `ChatReply(record{String text})`, `ExplainFeedback` 반환 지원.
- **ClaudeLlmProvider**: `RestClient` 로 Anthropic **Messages API** (`POST https://api.anthropic.com/v1/messages`, header `x-api-key: ${ANTHROPIC_API_KEY}`, `anthropic-version`). **tool-use 로 JSON 강제**: victools 로 `Class<T>`→JSON schema 생성해 단일 tool `emit_result` 의 `input_schema` 로 넣고 `tool_choice={type:tool,name:emit_result}`. 응답의 `content[].input` 을 Jackson 으로 `type` 역직렬화. env `ANTHROPIC_API_KEY`.
- **OllamaLlmProvider**: `POST ${base}/api/chat` body `{model, messages, format:"json", stream:false}`. 응답 `message.content` 를 Jackson 파싱, 실패 시 **재시도 파서**(코드펜스 제거/첫 `{`~마지막 `}` 슬라이스) 1~2회. base 기본 `http://localhost:11434`.

### 6.5 프롬프트 템플릿 (resources/prompts/*.md) — 변수 슬롯
`PromptLoader.render(name, Map<String,String>)` 가 `{{var}}` 치환. 각 프롬프트는 CURRICULUM 원칙을 본문에 명시.

- **generate-mission.md** — 슬롯 `{{domain}} {{domainEmoji}} {{difficulty}} {{scope}} {{stage}} {{stageTitle}} {{focus}} {{missionType}} {{priorWeaknesses}} {{domainPool}}`. 원칙 삽입: **두 축 난이도/범위 직교**, 히든 케이스 2~3개(미션엔 개수만), 결말 분기 4종(calm/hotfix/dawn/hidden — 히든 title '???'), 레거시 리팩토링 중심, 엔진 코드는 완성 제공, 유머 한 스푼(도메인發, 규칙 본문 불가침), 의도적 모호함 1개, 도메인 규칙 제약 ≥1. 출력=MissionContent JSON.
- **review-submission.md** — 슬롯 `{{missionTitle}} {{scenario}} {{requirements}} {{constraints}} {{rubric}}(전체·hidden 포함) {{hiddenCases}} {{endings}} {{files}}(path+content 연결) {{chatTranscript}}`. 원칙: **코드 인용 근거 필수**, 히든 케이스 현실 사고담(warStory), **평판**(타이밍·구체성·자기시도·매너, 개수 아님), **시나리오 에필로그**("배포 +N일" 내레이션) + **결말 도장**(ending). 출력=ReviewContent(explainFeedback 제외).
- **evaluate-explanation.md** — 슬롯 `{{audience}} {{explainPrompt}} {{explanationText}} {{missionContext}}`. 논리구조/명료성/비유 + 모범 재작성(improved). 출력=ExplainFeedback.
- **chat-reply.md** — 슬롯 `{{missionBrief}} {{history}} {{userMessage}}`. 원칙: 선배 개발자/기획자 역할, **정답 즉답 금지**, 모호함을 물으면 기획자처럼 결정, 안 물으면 먼저 안 알려줌. 출력=ChatReply JSON `{text}`.

---

## 7. 구현 순서 (각 스텝 `mvn -q test` 개별 검증)

**Step 1 — 스캐폴드.** pom(§2), `AdvisorApplication`, application.yml + application-mock.yml, `application-test.yml`(H2 mem, profile=mock). 빈 `@SpringBootTest contextLoads()`.
검증: `mvn -q test` → context 로드 그린.

**Step 2 — 영속 계층.** 도메인 content record(§3.3) + JPA 엔티티/리포지토리 + JSON `AttributeConverter` + PersistenceMapper.
검증: `RepositoryTest` — Track+Mission(MissionContent 포함) 저장→조회, JSON 왕복 동일 assert.

**Step 3 — LLM 포트 + Mock.** `LlmClient`, `LlmRole`, `LlmProperties`, `RoutingLlmClient`, `LlmProvider`, `MockLlmProvider`+`MockFixtures`, `PromptLoader`, prompts/*.md 스텁.
검증: 유닛 테스트 — `complete(GENERATE,_,MissionContent.class)` 픽스처 반환, role→provider 라우팅.

**Step 4 — 애플리케이션 서비스.** Track/Mission/Submission/Review/Chat Service. mock `LlmClient` 주입.
검증: `MissionServiceTest`(생성→저장), `ReviewServiceTest`(제출→리뷰 생성, overall 채움), `ChatServiceTest`(메시지 누적+agent 응답).

**Step 5 — 웹 어댑터.** 컨트롤러 6종 + DTO 매핑 + `WebCorsConfig`(5173) + `GlobalExceptionHandler`. MissionResponse 의 rubric 필터·hiddenCaseCount 처리.
검증: `ControllerSliceTest`(MockMvc) — POST /tracks 201, GET /missions/{id} 의 rubric 에 invisible 항목 없음·hiddenCaseCount 노출.

**Step 6 — 풀 사이클 IT.** `FullCycleIT` @SpringBootTest(H2 mem, profile=mock): 트랙 생성→미션 생성(mock)→제출→리뷰(mock)→리뷰 조회. reputation/scenario/ending/hiddenCases 존재 assert.
검증: `mvn -q test` 전체 그린.

**Step 7 — 실 provider.** `ClaudeLlmProvider`(RestClient+tool-use+victools schema), `OllamaLlmProvider`(format json+재시도 파서), application-claude/ollama.yml. mock 이 여전히 기본이라 키 없이 테스트 통과.
검증: `mvn -q test` 그린(실 provider 테스트는 키 없으면 `@EnabledIfEnvironmentVariable` 로 skip).

**Step 8 — 프롬프트 + 학습자 과제 문서.** prompts/*.md 를 §6.5 슬롯/원칙으로 완성, `docs/EXERCISE-LLMCLIENT.md` 작성(§8).
검증: `mvn -q test` 그린 + `PromptLoader` 가 4개 파일 로드·필수 슬롯 존재 assert.

---

## 8. 학습자 과제 (사용자 실습 지점)  ★★★

> **박스: 이 부분은 구현자가 "정답"을 먼저 완성하지만, 그것이 곧 사용자의 S2/S3 실습 교보재가 된다.**

CURRICULUM.md "이 프로젝트 자체가 S2~S3 실습이다" 원칙에 따라:

- **`application/port/LlmClient.java` 인터페이스 설계 = 사용자의 S2(인터페이스는 계약) 실습.**
- **`adapter/out/llm` 의 claude/ollama/mock 어댑터 분리 = 사용자의 S3(의존성 역전) 실습.**

**구현자의 의무:**
1. §6 대로 **동작하는 레퍼런스 버전**을 만든다(사용자가 나중에 자기 설계와 비교할 정답지).
2. **`docs/EXERCISE-LLMCLIENT.md`** 를 미션 브리핑 형식으로 작성한다. 내용:
   - 상황: "advisor 서비스는 Claude/Ollama/mock 세 개의 LLM 백엔드를 갈아끼워야 한다. 도메인 서비스(MissionService 등)가 특정 provider 를 몰라야 한다."
   - **과제 1 (S2)**: 레퍼런스 `LlmClient` 를 **열어보기 전에** 스스로 인터페이스를 설계하라 — 시그니처, 구조화 출력을 어떻게 표현할지, 역할별 모델을 어디서 결정할지. 산출물: 자기만의 `LlmClient` 초안.
   - **과제 2 (S3)**: mock→ollama→claude 순으로 어댑터를 추가하며, 도메인 계층 코드가 **한 줄도** 바뀌지 않는지 확인하라. "도메인 로직이 provider 를 직접 아는가?"를 self-check.
   - **비교 단계**: 그 다음 레퍼런스(`complete(LlmRole, String, Class<T>)`)와 대조 — `PromptTemplate` vs `String`, `Class<T>` structured output, role enum 라우팅의 트레이드오프를 서술.
   - 통과 기준(커리큘럼 규약): 코드가 아니라 **"왜 이 계약인가"를 설명 과제로 통과**.
3. 구현자는 EXERCISE 문서에서 레퍼런스 코드 전문을 노출하지 말고, 시그니처 힌트와 검증 질문 위주로 남긴다(사용자가 먼저 설계하도록).

---

## 9. 참고 계약 고정점 (회귀 방지)

- 채팅 role 직렬화: 도메인 `ChatRole{ME,AGENT}` ↔ JSON `"me"/"agent"` (프론트 store 계약).
- 미션 화면은 hiddenCase **개수만**, rubric 은 visible 만 — 리뷰 화면에서 전량 공개.
- 리뷰 결과 = 점수(items+overall) / 평판(reputation) / 시나리오(scenario+ending 결말 도장) — 전부 응답 필수 필드.
- 결말 분기 grade 고정: `calm | hotfix | dawn | hidden`, 히든 title 은 미션 단계에서 `???`.

---

## 10. 구현 노트 (계획 대비 편차)

- **hiddenQuest 스키마 추가**: 계획 작성 이후 프론트에 `MissionContent.hiddenQuest{plant, condition, revealOnSuccess, revealOnMiss}` (nullable)와
  `ReviewContent.hiddenQuest{found, text}` (nullable, `ReviewPage.vue`가 읽는 `review.hiddenQuest.found/.text`) 계약이 추가되어 두 record에
  마지막 필드로 반영했다. 기존 필드 순서는 변경하지 않았다.
- **`SubmittedFileEntity`는 JPA 연관관계가 아니라 명시적 조회로 연결**: `mappedBy`는 상대편에 실제 `@ManyToOne` 필드가 있어야 하는데
  `SubmittedFileEntity.submissionId`는 단순 문자열 컬럼이라 연관관계 매핑이 불가능하다. §3.2 "FetchType LAZY, 서비스에서 명시 로드" 원칙대로
  `SubmittedFileRepository.findBySubmissionIdOrderByOrdAsc(...)`를 서비스에서 직접 호출하는 방식으로 구현했다(연관관계 애너테이션 없음).
- **`GET /learners/me/history`에 전용 서비스가 없음**: §7의 애플리케이션 서비스 5종(Track/Mission/Submission/Review/Chat)에는
  히스토리 조회가 없다. MVP 단일 사용자 가정이라 별도 서비스를 두는 대신 `LearnerController`가 `MissionRepository`/`SubmissionRepository`/
  `ReviewRepository`를 직접 조합해 COMPLETED 미션 × 최신 제출물의 리뷰를 조인한다. 다중 사용자로 확장 시 `LearnerService`로 승격 권장.
- **`evaluate-explanation` 프롬프트는 별도 LlmRole 없이 `LlmRole.REVIEW` 라우팅을 재사용**: §6은 역할을 GENERATE/REVIEW/CHAT 3종으로만
  정의하므로, 설명 과제 피드백은 리뷰와 같은 provider/model로 호출한다(리뷰 제출 시 explainTask가 있고 explanation이 비어있지 않을 때만 호출).
- **`pom.xml`에 maven-surefire-plugin `<includes>`를 명시적으로 추가**: Maven Surefire의 기본 include 패턴은 `**/*IT.java`를
  제외한다(관례상 `*IT`는 failsafe/integration-test 단계용). 계획이 요구하는 "`mvn -q test` 하나로 `FullCycleIT`까지 그린"을
  만족시키려면 surefire 설정에 `**/*IT.java`를 명시적으로 포함해야 했다(없으면 `mvn test`가 조용히 FullCycleIT를 건너뛴다).

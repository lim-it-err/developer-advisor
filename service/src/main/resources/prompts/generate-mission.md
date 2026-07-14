# 미션 생성 프롬프트

당신은 developerAdvisor 커리큘럼의 미션 설계자입니다. 아래 조건에 맞는 레거시 리팩토링 미션을 JSON(MissionContent)으로 만드세요.

## 입력
- 도메인: {{domain}} {{domainEmoji}}
- 난이도: {{difficulty}}
- 범위: {{scope}}
- 스테이지: {{stage}} — {{stageTitle}}
- 포커스: {{focus}}
- 미션 유형: {{missionType}}
- 학습자의 이전 약점: {{priorWeaknesses}}
- 도메인 소재 후보: {{domainPool}}

## 원칙 (반드시 지킬 것)
1. **두 축(난이도/범위) 직교** — 난이도는 로직 복잡도, 범위는 건드리는 파일 수. 서로 독립적으로 조합되어야 합니다.
2. **히든 케이스 2~3개** — 미션 화면에는 개수만 노출되고 내용은 숨겨집니다(리뷰 시점에 공개). `hiddenCases`에는 `title`+`description`만 담으세요.
3. **결말 분기 4종 고정** — `endings`는 항상 `calm | hotfix | dawn | hidden` 4개, 그 중 `hidden`의 `title`은 반드시 `"???"`.
4. **레거시 리팩토링 중심** — `legacyFiles`에 동작하는(그러나 뒤엉킨) 기존 코드를 제공. 엔진/도메인 계산 로직은 완성된 채로 제공하고, 학습자는 "구조"를 바꾸는 데 집중합니다.
5. **유머 한 스푼** — 도메인에서 우러나는 유머는 좋지만, 요구사항/제약 본문은 절대 장난스럽게 흐리지 않습니다(불가침).
6. **의도적 모호함 1개** — `constraints` 또는 `requirements` 중 하나에 "협의되지 않은 값"처럼 학습자가 되물어야 하는 지점을 반드시 심으세요.
7. **도메인 규칙 제약 ≥1** — 그 도메인이 아니면 나올 수 없는 업무 규칙 제약을 최소 1개 포함하세요.

## 출력
MissionContent JSON 하나만 출력하십시오(다른 텍스트 없이). 필드: briefing, scenario, legacyFiles, providedFiles, requirements, constraints, learningGoals, hints, rubric, hiddenCases, endings, explainTask, hiddenQuest(선택, 없으면 null).

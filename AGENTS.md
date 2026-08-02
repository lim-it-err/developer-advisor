# AGENTS.md — 에이전트 협업 규약

> 이 저장소에서 작업하는 모든 AI 에이전트(Claude, Codex, 기타)가 읽는 공통 규약.
> 사람 독자는 [README.md](README.md)부터.

## 빌드 & 검증 (모든 PR의 최소 게이트)

```bash
# 프론트
cd frontend && npm ci && npx vite build          # 반드시 통과
# 백엔드 — mvn 실행 전 JDK 21 고정 필수 (기본 런타임이 JDK 25)
cd service && ./run.sh test                       # 테스트 12+개 그린
# 콘텐츠 무결성 (data 파일을 건드렸다면)
cd frontend && node --input-type=module -e "import('./src/modules/missions/data/sampleContent.js').then(m=>{const d=m.default;console.assert(d.missions.every(x=>x.rubric.reduce((a,r)=>a+r.weight,0)===100),'rubric!=100');console.log('missions:',d.missions.length)})"
```

## 동결된 계약 (변경 금지 — 변경하려면 이슈로 먼저 제안)

- **콘텐츠 스키마**: `frontend/src/modules/missions/data/sampleContent.js`의 미션/리뷰 필드명은 프론트-백엔드 공유 계약. 백엔드 record(`service/.../domain/**/content/*.java`)와 1:1.
- **API 계약**: `docs/M1-BACKEND-PLAN.md` §4~5의 엔드포인트/DTO. 결말 grade는 `calm|hotfix|dawn|hidden` 고정.
- **모듈 격리**: `frontend/src/modules/missions/` 밖을 참조하지 않는다 (platform 이식 단위).

## 소유권 — 건드리지 말 것

- `frontend/src/modules/missions/data/sampleContent.js`, `sampleProjects.js`: **콘텐츠는 Claude 전담.**
  톤(유머·감성 원칙, docs/CURRICULUM.md)이 제품의 정체성이라 다른 에이전트가 수정하지 않는다.
  단, **읽기·검증·"미션 풀어보기"는 환영** — 풀이 결과물은 'AI 코드 리뷰' 미션 소재로 쓰인다.
- `docs/CURRICULUM.md`, `docs/PLAN.md`: 기획 문서 — 제안은 이슈로.

## 환영하는 작업 (라벨로 배정)

- `agent-task` + `type:test` — E2E(Playwright)/vitest/백엔드 테스트 확장
- `agent-task` + `type:review` — 적대적 코드 리뷰 (부수러 온 감사 관점, PR 코멘트로)
- `agent-task` + `type:infra` — Dockerfile, CI, lint 등 배관 공사
- `agent-task` + `type:solve-mission` — 미션 풀이 (결과물은 콘텐츠 소재로 회수됨)

## 개발 내역 기록 (모든 에이전트 공통 — 사람이 추적할 수 있게)

구현은 어떤 방식으로 하든 **내역이 파일로 남아야 한다.** 대화·세션 메모리는 기록이 아니다.

1. **사양서 기반 작업** (collab/dev-queue/NNN): 완료 시 `collab/outbox/dev-NNN-report.md` — 변경 파일 목록, 검증 로그, 미완 사항. (기존 규칙)
2. **큰 태스크를 스스로 쪼갤 때**: 구현 전에 breakdown을 사양서 파일에 추가하거나(`NNN` 문서에 체크리스트 추가) 별도 `NNN-breakdown.md`로 남긴다. 항목 단위로 진행 표시.
3. **사양서 없는 작업** (버그 픽스, 즉흥 개선): `docs/DEV-LOG.md`에 한 줄 append — `- YYYY-MM-DD <agent> <무엇을> (<커밋/브랜치>)`.
4. 커밋 메시지에도 항목 요약을 담는다. "misc fix" 금지.

목적: Codex가 통짜로 구현하든 쪼개서 구현하든, 사람이 나중에 "무엇이 언제 왜 만들어졌는지"를 저장소만 보고 재구성할 수 있어야 한다.

## PR 규칙

1. 브랜치명 `agent/<이름>/<주제>`, PR 본문에 검증 로그(위 게이트 실행 결과) 첨부.
2. 다른 에이전트 계열의 리뷰 승인 없이 머지하지 않는다 (교차 리뷰 원칙).
3. 커밋 메시지는 한국어 요약 + 상세. 콘텐츠 파일 diff가 포함된 PR은 자동 반려 대상.
4. 스타일: 기존 코드의 관례를 따른다 (Vue 3 script setup, scoped style, 한국어 UI 텍스트).

## 미션 풀이 제출 형식 (`type:solve-mission`)

`solutions/<mission-id>/<agent-name>/` 아래에 풀이 파일 + `NOTES.md`(접근 방식, 자신 없는 부분 명시).
정답처럼 쓰지 말 것 — 이 풀이는 학습자가 리뷰하는 훈련 소재다. 자연스러운 실수는 가치다.

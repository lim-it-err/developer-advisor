---
name: 에이전트 작업 (Agent Task)
about: AI 에이전트(Claude/Codex)에게 배정하는 작업 사양
labels: agent-task
---

## 목표
<!-- 한 문장. 무엇이 완료되면 이 이슈가 닫히는가 -->

## 사양
<!-- 기계적으로 따라갈 수 있게. 파일 경로, 계약, 제약을 명시 -->

## 검증 기준 (머지 게이트)
- [ ] `cd frontend && npx vite build` 통과
- [ ] `cd service && ./run.sh test` 그린 (백엔드 변경 시)
- [ ] AGENTS.md의 동결 계약 위반 없음
- [ ] 교차 리뷰 승인 1개

## 범위 밖 (하지 말 것)
<!-- 명시적으로. 특히 콘텐츠 파일(sampleContent.js) 수정 금지 -->

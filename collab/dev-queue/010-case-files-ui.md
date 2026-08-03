# dev-010 — 사건 파일 연속극 UI

## 목표
`data/sampleCaseFiles.js`(1편, 5일 + finale — 이미 존재)를 플레이 가능하게 만든다. 문구 수정 금지.

## 사양
1. `/games/case/<caseId>` 페이지. 진행 상태는 localStorage blob에 `caseProgress: { [caseId]: { openedDays: number, verdict?: key } }`.
2. **하루 1단서 규칙**: 첫 진입 시 Day 1 공개. 다음 날(로컬 날짜 변경)마다 다음 Day 해금 — 단, "몰아보기" 버튼으로 규칙을 깰 수 있게 (연속극이 기본, 정주행은 선택). 해금 판정은 마지막 열람 날짜 저장으로.
3. Day 콘텐츠는 마크다운 렌더(기존 MarkdownBlock 재사용, 코드 블록 포함). 지난 Day는 접힌 목록으로 다시 읽기 가능.
4. Day 5 열람 후 finale: 보기 4개 원탭 지목 → explanation·epilogue 공개, 적중 여부 표시. 지목은 1회만(수정 불가).
5. 지목 시 시즌 스탯 판단 +2 (기존 recordSeasonGain 재사용, 적중 시 +1 추가).
6. `/games` 준비 중 목록의 「사건 파일」을 실제 링크로 승격. E2E 1개(첫 진입→Day1 렌더→몰아보기→지목→해설) 추가.

## 검증 게이트
- vitest·playwright·vite build 그린, 375px 가로 스크롤 없음

## 범위 밖
- data/ 수정 금지, 루틴 요일 빌더 수정 금지 (루틴 연결은 이후 별도)

# dev-002 완료 보고 — store 특성화 테스트
- completed_at: 2026-08-03T00:55:14+09:00
- agent: codex
- branch: `agent/codex/store-vitest`

## 구현

- Vitest 2.1.9와 jsdom 24.1.3을 개발 의존성으로 추가하고 `test:unit` 스크립트를 등록했다.
- Vitest 수집 범위를 `src/**/*.spec.js`로 제한해 Playwright E2E와 러너가 충돌하지 않게 했다.
- 매 테스트가 독립적인 메모리 `localStorage`와 실패하는 `fetch`를 사용하고, 모듈 캐시를 초기화한 뒤 store를 다시 로드한다.
- 다음 현재 동작을 7개 테스트로 고정했다.
  1. 구버전 단일 제출 객체의 배열 마이그레이션과 재제출 append
  2. 저장된 실제 리뷰 우선, 제출된 와인 미션의 샘플 리뷰 폴백
  3. 제출 차수 표시와 코드·설명 이력 최신순 정렬
  4. 프로젝트 첫 소미션 및 직전 제출 기반 순차 해금·진행률
  5. 같은 로컬 날짜의 루틴 미션 결정성
  6. 연속 완료일 스트릭과 단절 처리
  7. 닉네임 trim 및 12자 절단·영속화

## 변경 파일

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vitest.config.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`

store 소스와 콘텐츠 파일은 수정하지 않았다.

## 검증

```text
$ cd frontend && npm ci
added 133 packages in 1s

$ npx vitest run
Test Files  1 passed (1)
Tests       7 passed (7)
Duration    826ms

$ npx vite build
✓ 70 modules transformed.
✓ built in 917ms
```

## 관찰한 현재 동작

- `submitSubMission` 자체는 해금 여부를 검사하지 않는다. UI를 우회해 잠긴 소미션 ID를 호출하면 저장할 수 있다.
- `projectProgress.currentIndex`는 첫 미완료 위치가 아니라 완료 개수(`done`)를 사용한다. 저장 데이터가 비연속적으로 오염된 경우 실제 첫 미완료와 어긋날 수 있다.
- 구버전 제출 마이그레이션은 모듈 로드 시 메모리에서 수행되며, 다음 `persist()` 계열 동작 전까지 localStorage 원본은 그대로다.

이번 태스크는 특성화 테스트이므로 위 동작은 고치지 않았다.

## 미완 사항

없음.

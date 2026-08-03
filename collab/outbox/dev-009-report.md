# dev-009 완료 보고 — store 보수
- completed_at: 2026-08-03T09:32:57+09:00
- agent: codex
- branch: `agent/codex/store-hardening`

## 구현

- 프로젝트 소미션 해금 판정을 공통 헬퍼로 분리하고 `isSubMissionUnlocked`와 `submitSubMission`이 같은 규칙을 사용하도록 했다.
- `submitSubMission`은 프로젝트에 없는 ID나 잠긴 소미션 ID를 받으면 상태와 `localStorage`를 건드리지 않고 `false`를 반환한다. 정상 저장은 기존 동작을 유지하면서 `true`를 반환한다.
- `projectProgress.currentIndex`는 완료 개수 대신 첫 미완료 소미션의 실제 인덱스를 사용한다. 전부 완료된 경우 마지막 인덱스, 소미션이 없는 경우 `-1`인 기존 화면 계약은 유지했다.
- 구버전 단일 제출 객체가 발견되면 모듈 로드 직후 배열 형태를 `localStorage`에 한 번 확정한다. 이 로컬 마이그레이션은 서버 journal 쓰기를 만들지 않아 앱 시작 동기화와 경합하지 않는다.
- 특성화 테스트에 잠긴 제출 차단, 비연속 저장 데이터의 첫 미완료 위치, 로드 직후 1회 마이그레이션 영속화 케이스를 추가했다.

콘텐츠·UI·백엔드 파일은 수정하지 않았다.

## 변경 파일

- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`

## 검증

```text
$ cd frontend && npx vitest run
Test Files  3 passed (3)
Tests       22 passed (22)

$ cd frontend && npm ci
added 133 packages

$ cd frontend && npx vite build
✓ 78 modules transformed.
✓ built in 899ms

$ cd frontend && npx playwright test
Running 7 tests using 1 worker
7 passed (10.6s)

$ cd service && ./run.sh test
Tests run: 20, Failures: 0, Errors: 0, Skipped: 0
✅ 테스트 통과
```

## 미완 사항

없음.

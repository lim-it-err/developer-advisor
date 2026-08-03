# dev-008 완료 보고 — 프론트 스토어 ↔ 백엔드 기록 동기화
- completed_at: 2026-08-03T09:28:08+09:00
- agent: codex
- branch: `agent/codex/frontend-record-sync`

## 구현

- `missions.js`의 기존 `API_BASE` 관례와 `AbortController` 타임아웃 패턴을 재사용해 닉네임 스코프 기록 동기화 계층을 추가했다.
- 모든 쓰기는 기존처럼 `localStorage`와 반응형 상태를 먼저 갱신한다. 서버 제출·리뷰·설명·기획자 기록·journal 쓰기는 초기 병합 뒤 백그라운드에서 실행하며 실패를 UI에 전파하거나 재시도하지 않는다.
- 앱 시작 시 저장된 닉네임이 있거나 닉네임을 새로 정하면 서버 기록을 조회한다.
  - 제출·리뷰 버전은 서버 ID 또는 시각을 기준으로 합집합을 만들고 시간순으로 정렬한다.
  - 설명과 기획자 산출물은 `submittedAt`이 최신인 값을 선택한다.
  - journal은 `{ updatedAt, data }` 포맷으로 저장하고 최신 `updatedAt` 쪽을 선택한다. 구형 평면 JSON도 읽는다.
- 서버가 비어 있고 로컬 기록만 있는 최초 진입에서는 제출 → 리뷰 → 범용 record → journal 순서로 한 번 밀어올린다. 서버가 일부라도 채워져 있으면 오프라인 실패분을 재전송하지 않고 로컬·서버 병합만 한다.
- 닉네임을 정한 직후 제출하는 경합을 막기 위해 서버 쓰기를 초기 병합 barrier 뒤에 두고, 동일 journal/record 키 쓰기는 순서대로 실행한다.
- 브라우저 복원 검증 중 서버의 빈 배열을 모든 미션 키로 만들면 성장 기록의 제출 수가 33으로 보이는 회귀를 발견했다. 합집합이 비어 있으면 상태 키를 만들지 않도록 수정했다.
- 기존 콘텐츠·UI·백엔드 계약 파일은 수정하지 않았다.

## 변경 파일

- `frontend/src/modules/missions/store/missions.js`
- `frontend/src/modules/missions/store/__tests__/missions.spec.js`

## 검증

```text
$ cd frontend && npm ci
added 133 packages

$ cd frontend && npm run test:unit
Test Files  3 passed (3)
Tests       19 passed (19)

$ cd frontend && npx vite build
✓ 78 modules transformed.
✓ built in 923ms

$ cd frontend && npm run test:e2e
Running 7 tests using 1 worker
7 passed (8.6s)

$ cd service && ./run.sh test
Tests run: 20, Failures: 0, Errors: 0, Skipped: 0
✅ 테스트 통과
```

백엔드 OFF E2E는 기존 설정대로 `http://localhost:8080/**`를 차단한 상태에서 7개 핵심 흐름이 모두 통과했다.

백엔드 ON 브라우저 왕복은 백엔드 CORS 계약에 맞는 `http://localhost:5173`에서 고유 닉네임 `sync-0901`로 확인했다.

```text
POST 제출 후 서버 GET:
submission id = sub_ec1dd10ed3dc
file = src/main/java/SyncProof.java

서버 리뷰 GET:
review id = rev_581089d12b10
submissionId = sub_ec1dd10ed3dc
overall = 66

서버 journal GET:
seasonStats.gains = [{ stat: "vision", amount: 3, source: "mission-submit:s1-wine-01" }]

localStorage.clear() 후 닉네임 식별자만 다시 넣고 새 앱 시작:
성장 기록 제출한 미션 수 = 1
복원된 리뷰 = 실시간 리뷰, 66점
```

닉네임까지 지우면 어느 서버 스코프를 조회할지 알 수 없으므로, 복원 검증에서는 전체 localStorage를 지운 직후 사양의 시작 조건인 닉네임만 다시 기록하고 나머지 기록이 서버에서 복원되는지 확인했다.

## 미완 사항

없음.

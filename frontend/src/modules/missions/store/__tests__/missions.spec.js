import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'advisor.learner.v1'
const FIXED_NOW = new Date('2026-08-03T09:00:00+09:00')

function makeLocalStorage() {
  const values = new Map()
  return {
    getItem: vi.fn((key) => values.get(String(key)) ?? null),
    setItem: vi.fn((key, value) => values.set(String(key), String(value))),
    removeItem: vi.fn((key) => values.delete(String(key))),
    clear: vi.fn(() => values.clear()),
  }
}

async function loadStore(persisted = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  vi.resetModules()
  const { useMissions } = await import('../missions.js')
  return useMissions()
}

function jsonResponse(value, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(value),
  })
}

describe('missions store 특성화', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    vi.stubGlobal('localStorage', makeLocalStorage())
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('backend unavailable')))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('구버전 단일 제출 객체를 배열로 마이그레이션하고 재제출을 append한다', async () => {
    const legacy = {
      files: [{ path: 'Legacy.java', content: 'class Legacy {}' }],
      submittedAt: '2026-08-01T01:00:00.000Z',
      by: 'legacy',
    }
    const store = await loadStore({ submissions: { 's1-wine-01': legacy } })

    expect(store.state.submissions['s1-wine-01']).toEqual([legacy])

    const reviewed = await store.submitCode('s1-wine-01', [
      { path: 'Wine.java', content: 'class Wine {}' },
      { path: ' ', content: 'ignored' },
    ])

    expect(reviewed).toBe(false)
    expect(fetch).toHaveBeenCalledOnce()
    expect(store.state.submissions['s1-wine-01']).toHaveLength(2)
    expect(store.state.submissions['s1-wine-01'][1].files).toEqual([
      { path: 'Wine.java', content: 'class Wine {}' },
    ])

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.submissions['s1-wine-01']).toHaveLength(2)
  })

  it('실제 저장 리뷰를 우선하고, 없으면 제출된 와인 미션의 샘플 리뷰로 폴백한다', async () => {
    const stored = {
      content: { summary: '실제 리뷰', items: [], reputation: { level: '실제' } },
      overall: 88,
      reviewedAt: '2026-08-02T03:00:00.000Z',
    }
    const store = await loadStore({
      submissions: { 's1-wine-01': [{ files: [], submittedAt: '2026-08-01T00:00:00.000Z' }] },
      reviews: { 's1-wine-01': [stored] },
    })

    expect(store.getReview('s1-wine-01')).toMatchObject({
      summary: '실제 리뷰',
      overall: 88,
      reviewedAt: stored.reviewedAt,
    })

    store.state.reviews['s1-wine-01'] = []
    expect(store.getReview('s1-wine-01')).toMatchObject({ reviewedAt: null })
    expect(store.getReview('s1-wine-01').summary).not.toBe('실제 리뷰')
  })

  it('제출 차수를 붙이고 코드·설명 이력을 최신순으로 정렬한다', async () => {
    const store = await loadStore()
    const [firstId, secondId] = store.state.missions.slice(0, 2).map((mission) => mission.id)
    store.state.submissions[firstId] = [
      { files: [], submittedAt: '2026-08-01T00:00:00.000Z', by: 'a' },
      { files: [], submittedAt: '2026-08-03T00:00:00.000Z', by: 'b' },
    ]
    store.state.explanations[secondId] = {
      text: '설명',
      submittedAt: '2026-08-02T00:00:00.000Z',
      by: 'c',
    }

    const entries = store.historyEntries()

    expect(entries.map((entry) => entry.submittedAt)).toEqual([
      '2026-08-03T00:00:00.000Z',
      '2026-08-02T00:00:00.000Z',
      '2026-08-01T00:00:00.000Z',
    ])
    expect(entries.map((entry) => entry.kindLabel)).toEqual([
      '코드 제출 · 2차',
      '설명 과제',
      '코드 제출',
    ])
    expect(entries.filter((entry) => entry.kind === 'code').map((entry) => entry.attempt)).toEqual([2, 1])
  })

  it('프로젝트는 첫 소미션만 열고 직전 제출에 따라 다음 소미션을 해금한다', async () => {
    const store = await loadStore()
    const project = store.state.projects[0]

    expect(store.isSubMissionUnlocked(project, 0)).toBe(true)
    expect(store.isSubMissionUnlocked(project, 1)).toBe(false)
    expect(store.projectProgress(project.id)).toEqual({ done: 0, total: 6, currentIndex: 0 })

    expect(store.submitSubMission(project.subMissions[0].id, [
      { path: 'Bike.java', content: 'class Bike {}' },
    ])).toBe(true)

    expect(store.isSubMissionUnlocked(project, 1)).toBe(true)
    expect(store.isSubMissionUnlocked(project, 2)).toBe(false)
    expect(store.projectProgress(project.id)).toEqual({ done: 1, total: 6, currentIndex: 1 })
  })

  it('잠긴 프로젝트 소미션을 직접 제출해도 저장하지 않는다', async () => {
    const store = await loadStore()
    const project = store.state.projects[0]
    const lockedId = project.subMissions[1].id
    const savedBefore = localStorage.getItem(STORAGE_KEY)

    const submitted = store.submitSubMission(lockedId, [
      { path: 'Locked.java', content: 'class Locked {}' },
    ])

    expect(submitted).toBe(false)
    expect(store.state.projectSubmissions[lockedId]).toBeUndefined()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(savedBefore)
  })

  it('비연속 프로젝트 저장 데이터에서도 첫 미완료 인덱스를 현재 위치로 삼는다', async () => {
    const store = await loadStore()
    const project = store.state.projects[0]
    const [first, , third] = project.subMissions
    store.state.projectSubmissions[first.id] = { files: [], submittedAt: '2026-08-01T00:00:00.000Z' }
    store.state.projectSubmissions[third.id] = { files: [], submittedAt: '2026-08-02T00:00:00.000Z' }

    expect(store.projectProgress(project.id)).toEqual({ done: 2, total: 6, currentIndex: 1 })
  })

  it('구버전 단일 제출 객체를 로드 직후 localStorage 배열로 확정한다', async () => {
    const legacy = {
      files: [{ path: 'Legacy.java', content: 'class Legacy {}' }],
      submittedAt: '2026-08-01T01:00:00.000Z',
      by: 'legacy',
    }

    const store = await loadStore({ submissions: { 's1-wine-01': legacy } })
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))

    expect(store.state.submissions['s1-wine-01']).toEqual([legacy])
    expect(saved.submissions['s1-wine-01']).toEqual([legacy])
    expect(localStorage.setItem).toHaveBeenCalledTimes(2)

    await loadStore(saved)
    expect(localStorage.setItem).toHaveBeenCalledTimes(3)
  })

  it('같은 날짜에는 같은 루틴 미션을 결정한다', async () => {
    const first = await loadStore()
    const firstRoutine = first.routineToday()
    const firstDeck = firstRoutine.slots.map(({ kind, missionId, title }) => ({ kind, missionId, title }))

    const second = await loadStore()
    const secondRoutine = second.routineToday()
    const secondDeck = secondRoutine.slots.map(({ kind, missionId, title }) => ({ kind, missionId, title }))

    expect(firstRoutine.date).toBe('2026-08-03')
    expect(secondDeck).toEqual(firstDeck)
  })

  it('평일은 지정된 노코드 슬롯만 배치하고 주말 프로젝트 코딩은 유지한다', async () => {
    const store = await loadStore()

    const expected = {
      1: ['사건 파일 오늘 단서', '머지 or 반려', '카드 갈래 1장'],
      2: ['설계 리뷰 미션 읽기', '결말 예측 1건', '머지 or 반려'],
      3: ['독서 카드 + 갈래', '사건 파일 오늘 단서', '설명 시작 칩 고르기 (문장 완성은 선택)'],
      4: ['기획자 브리핑 읽기', '회의 질문 칩 3개 던지기', '카드 갈래 1장'],
      5: ['이번 주 리뷰 다시 읽기', '머지 or 반려', '설명 훈련 (선택·주중 유일 타이핑)'],
    }

    for (const [weekday, labels] of Object.entries(expected)) {
      const routine = store.routineForWeekday(Number(weekday))
      expect(routine.slots.map((slot) => slot.label)).toEqual(labels)
      expect(routine.slots).toHaveLength(3)
      expect(routine.slots.some((slot) => slot.kind === 'submit')).toBe(false)
    }

    const wednesday = store.routineForWeekday(3)
    expect(wednesday.slots[0]).toMatchObject({ kind: 'cardFork', missionId: null })
    expect(wednesday.slots[0].linkTo).toMatch(/^\/games\?card=read-/)

    for (const weekendDay of [0, 6]) {
      const weekend = store.routineForWeekday(weekendDay)
      expect(weekend.slots.map((slot) => slot.kind)).toEqual(['cinemaCard', 'project'])
      expect(weekend.slots).toHaveLength(2)
    }

    const saturday = store.routineForWeekday(6)
    expect(saturday.slots[0]).toMatchObject({
      kind: 'cinemaCard',
      missionId: null,
      label: '시사회 카드 보기',
      manualCheckable: true,
      checkIndex: 0,
    })
    expect(saturday.slots[0].linkTo).toMatch(/^\/games\?card=film-/)
  })

  it('스와이프·사건 열람·예측·설명 칩을 당일 루틴 완료로 기록한다', async () => {
    const store = await loadStore()

    expect(store.routineToday().slots[1]).toMatchObject({ kind: 'swipeReview', done: false })
    expect(store.completeSwipeSession()).toBe(true)
    expect(store.completeSwipeSession()).toBe(false)
    expect(store.routineToday().slots[1].done).toBe(true)

    const mondayCaseId = store.routineToday().slots[0].linkTo.split('/').at(-1)
    store.openCase(mondayCaseId, 5)
    expect(store.routineToday().slots[0].done).toBe(true)
    expect(store.state.caseProgress[mondayCaseId].lastViewedDate).toBe('2026-08-03')

    vi.setSystemTime(new Date('2026-08-04T09:00:00+09:00'))
    const tuesday = store.routineToday()
    const predictionMissionId = tuesday.slots[1].missionId
    store.predictEnding(predictionMissionId, 'hotfix')
    expect(store.routineToday().slots[1]).toMatchObject({
      kind: 'endingPrediction',
      missionId: predictionMissionId,
      done: true,
    })

    vi.setSystemTime(new Date('2026-08-05T09:00:00+09:00'))
    const wednesday = store.routineToday()
    const explainMissionId = wednesday.slots[2].missionId
    expect(store.chooseExplainStarter(explainMissionId, 0)).toBe(true)
    expect(store.routineToday().slots[2]).toMatchObject({
      kind: 'explainStarter',
      missionId: explainMissionId,
      done: true,
    })

    vi.setSystemTime(new Date('2026-08-06T09:00:00+09:00'))
    const thursday = store.routineToday()
    const meetingMissionId = thursday.slots[1].missionId
    const meetingRequests = [
      store.sendMeetingChat(meetingMissionId, '첫 번째 질문'),
      store.sendMeetingChat(meetingMissionId, '두 번째 질문'),
      store.sendMeetingChat(meetingMissionId, '세 번째 질문'),
    ]
    await Promise.resolve()
    await vi.runOnlyPendingTimersAsync()
    await Promise.all(meetingRequests)
    expect(store.routineToday().slots[1]).toMatchObject({
      kind: 'plannerMeeting',
      missionId: meetingMissionId,
      done: true,
    })

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.swipeSessions['2026-08-03']).toBe(true)
    expect(saved.endingPredictionDates[predictionMissionId]).toBe('2026-08-04')
    expect(saved.explainChipSelections['2026-08-05']).toEqual({
      missionId: explainMissionId,
      chipIndex: 0,
    })
  })

  it('오늘부터 이어진 완료일만 스트릭으로 세고 단절 뒤의 기록은 제외한다', async () => {
    const continuous = await loadStore({
      swipeSessions: { '2026-08-03': true },
      routineHistory: { '2026-08-02': 1, '2026-08-01': 2 },
    })
    expect(continuous.routineToday().streak).toBe(3)

    const broken = await loadStore({
      swipeSessions: { '2026-08-03': true },
      routineHistory: { '2026-08-02': 0, '2026-08-01': 2 },
    })
    expect(broken.routineToday().streak).toBe(1)
  })

  it('닉네임의 양끝 공백을 제거하고 12자로 자른 뒤 저장한다', async () => {
    const store = await loadStore()

    store.setNickname('  abcdefghijklmnop  ')

    expect(store.state.learner.nickname).toBe('abcdefghijkl')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).learner.nickname).toBe('abcdefghijkl')
  })

  it('엔진 토큰을 로컬 blob에만 저장하고 모든 기록 요청 헤더에 첨부한다', async () => {
    const requests = []
    vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
      requests.push({ url: String(url), options })
      if (String(url).endsWith('/submissions') || String(url).endsWith('/reviews')) return jsonResponse([])
      return jsonResponse({})
    }))

    const store = await loadStore({
      learner: { nickname: 'token-user' },
      advisorToken: 'engine-secret',
    })
    await store.syncRecords()

    expect(requests.length).toBeGreaterThan(0)
    expect(requests.every(({ options }) => options.headers?.['X-Advisor-Token'] === 'engine-secret')).toBe(true)

    store.checkRoutineSlot(0)
    for (let i = 0; i < 8; i += 1) await Promise.resolve()

    const journalWrite = requests.find(({ url, options }) =>
      url.endsWith('/journal') && options.method === 'PUT')
    expect(journalWrite).toBeDefined()
    expect(JSON.parse(journalWrite.options.body).data.advisorToken).toBeUndefined()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).advisorToken).toBe('engine-secret')
  })

  it('리뷰 401을 기존 실패로 처리하고 토큰 헤더를 붙이되 가짜 리뷰를 만들지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ error: 'UNAUTHORIZED' }, 401)))
    const store = await loadStore({ advisorToken: 'engine-secret' })

    const reviewed = await store.submitCode('s1-wine-01', [
      { path: 'Wine.java', content: 'class Wine {}' },
    ])

    expect(reviewed).toBe(false)
    expect(store.state.reviews['s1-wine-01']).toBeUndefined()
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch.mock.calls[0][1].headers['X-Advisor-Token']).toBe('engine-secret')
  })

  it('기존 저장 blob을 보존하며 루틴 체크를 교양 스탯에 하루 한 번 적립한다', async () => {
    const store = await loadStore({ learner: { nickname: '기존 사용자' } })

    expect(store.state.seasonStats).toEqual({ seasonStart: '2026-08-03', gains: [] })
    store.checkRoutineSlot(0)
    store.checkRoutineSlot(0)

    expect(store.seasonOverview().totals.culture).toBe(1)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.learner.nickname).toBe('기존 사용자')
    expect(saved.seasonStats.gains).toEqual([
      { date: '2026-08-03', stat: 'culture', amount: 1, source: 'routine-check:0' },
    ])
  })

  it('기존 제출 액션과 적중 결말을 4스탯에 중복 없이 적립한다', async () => {
    const store = await loadStore()

    store.predictEnding('s1-wine-01', 'hotfix')
    await store.submitCode('s1-wine-01', [{ path: 'Wine.java', content: 'class Wine {}' }])
    store.submitExplanation('s1-wine-01', '설명')
    store.submitExplanation('s1-wine-01', '설명 수정')
    store.submitPlannerDeliverable('s1-wine-01', 'meeting', '합의')
    store.submitPlannerDeliverable('s1-wine-01', 'review', '검토')
    expect(store.settleEndingPrediction('s1-wine-01', 'hotfix')).toBe(true)
    expect(store.settleEndingPrediction('s1-wine-01', 'hotfix')).toBe(false)

    expect(store.seasonOverview().totals).toEqual({
      vision: 3,
      voice: 3,
      judgment: 5,
      culture: 0,
    })
  })

  it('사건 파일은 날짜마다 한 단서만 열고 지목을 한 번만 기록한다', async () => {
    const store = await loadStore()
    const caseId = 'case-vanishing-points-01'

    expect(store.openCase(caseId, 5)).toMatchObject({
      openedDays: 1,
      lastOpenedDate: '2026-08-03',
      lastViewedDate: '2026-08-03',
    })
    expect(store.openCase(caseId, 5).openedDays).toBe(1)

    vi.setSystemTime(new Date('2026-08-04T09:00:00+09:00'))
    expect(store.openCase(caseId, 5).openedDays).toBe(2)
    store.bingeCase(caseId, 5)
    expect(store.state.caseProgress[caseId].openedDays).toBe(5)

    expect(store.chooseCaseVerdict(caseId, 'cron-idempotency', 'cron-idempotency', 5)).toBe(true)
    expect(store.chooseCaseVerdict(caseId, 'cache', 'cron-idempotency', 5)).toBe(false)
    expect(store.state.caseProgress[caseId].verdict).toBe('cron-idempotency')
    expect(store.seasonOverview().totals.judgment).toBe(3)

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.caseProgress[caseId]).toMatchObject({ openedDays: 5, verdict: 'cron-idempotency' })
  })

  it('카드 갈래는 최초 선택만 저장하고 교양을 카드당 한 번 적립한다', async () => {
    const store = await loadStore()
    const cardId = 'read-ggs-01'

    expect(store.chooseCardFork(cardId, 'blessing')).toBe(true)
    expect(store.chooseCardFork(cardId, 'debt')).toBe(false)

    expect(store.state.cardForkChoices[cardId]).toBe('blessing')
    expect(store.seasonOverview().totals.culture).toBe(1)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.cardForkChoices).toEqual({ [cardId]: 'blessing' })
    expect(saved.seasonStats.gains).toContainEqual({
      date: '2026-08-03',
      stat: 'culture',
      amount: 1,
      source: `card-fork:${cardId}`,
    })
  })

  it('닉네임 재방문 시 서버 제출 합집합과 최신 설명·journal을 로컬에 병합한다', async () => {
    const missionId = 's1-wine-01'
    const localSubmission = {
      files: [{ path: 'Local.java', content: 'class Local {}' }],
      submittedAt: '2026-08-01T00:00:00.000Z',
      by: 'sync-user',
    }
    vi.stubGlobal('fetch', vi.fn((url) => {
      const path = String(url)
      if (path.endsWith('/journal')) {
        return jsonResponse({
          updatedAt: '2026-08-03T00:00:00.000Z',
          data: { routineHistory: { '2026-08-02': 2 } },
        })
      }
      if (path.endsWith(`/missions/${missionId}/submissions`)) {
        return jsonResponse([{
          id: 'sub_remote',
          missionId,
          files: [{ path: 'Remote.java', content: 'class Remote {}' }],
          explanation: null,
          submittedAt: '2026-08-02T00:00:00.000Z',
        }])
      }
      if (path.endsWith(`/missions/${missionId}/records/explanation`)) {
        return jsonResponse({ text: '서버 설명', submittedAt: '2026-08-02T01:00:00.000Z' })
      }
      if (path.endsWith('/submissions') || path.endsWith('/reviews')) return jsonResponse([])
      return jsonResponse({})
    }))

    const store = await loadStore({
      learner: { nickname: 'sync-user' },
      submissions: { [missionId]: [localSubmission] },
      explanations: { [missionId]: { text: '로컬 설명', submittedAt: '2026-08-01T01:00:00.000Z' } },
    })
    expect(await store.syncRecords()).toBe(true)

    expect(store.state.submissions[missionId].map((entry) => entry.files[0].path)).toEqual([
      'Local.java',
      'Remote.java',
    ])
    expect(store.state.submissions[missionId][1].serverId).toBe('sub_remote')
    expect(Object.keys(store.state.submissions)).toEqual([missionId])
    expect(store.state.explanations[missionId].text).toBe('서버 설명')
    expect(store.state.routineHistory).toEqual({ '2026-08-02': 2 })
  })

  it('서버가 비어 있는 최초 동기화에서는 기존 로컬 제출을 한 번 밀어올린다', async () => {
    const postBodies = []
    vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
      if (options.method === 'POST' && String(url).endsWith('/submissions')) {
        postBodies.push(JSON.parse(options.body))
        return jsonResponse({ id: 'sub_uploaded' }, 201)
      }
      if (options.method === 'PUT') return jsonResponse(JSON.parse(options.body))
      if (String(url).endsWith('/submissions') || String(url).endsWith('/reviews')) return jsonResponse([])
      return jsonResponse({})
    }))

    const store = await loadStore({
      learner: { nickname: 'migration-user' },
      submissions: {
        's1-wine-01': [{
          files: [{ path: 'Legacy.java', content: 'class Legacy {}' }],
          submittedAt: '2026-08-01T00:00:00.000Z',
          by: 'migration-user',
        }],
      },
    })
    expect(await store.syncRecords()).toBe(true)

    expect(postBodies).toEqual([{
      files: [{ path: 'Legacy.java', content: 'class Legacy {}' }],
      explanation: null,
    }])
    expect(store.state.submissions['s1-wine-01'][0].serverId).toBe('sub_uploaded')
  })
})

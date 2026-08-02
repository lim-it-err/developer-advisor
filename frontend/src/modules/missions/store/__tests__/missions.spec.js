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

    store.submitSubMission(project.subMissions[0].id, [
      { path: 'Bike.java', content: 'class Bike {}' },
    ])

    expect(store.isSubMissionUnlocked(project, 1)).toBe(true)
    expect(store.isSubMissionUnlocked(project, 2)).toBe(false)
    expect(store.projectProgress(project.id)).toEqual({ done: 1, total: 6, currentIndex: 1 })
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

  it('수요일과 주말 첫 슬롯을 날짜별 독서·시사회 카드로 결정한다', async () => {
    const store = await loadStore()

    const wednesday = store.routineForWeekday(3)
    const saturday = store.routineForWeekday(6)

    expect(wednesday.slots[0]).toMatchObject({
      kind: 'readingCard',
      missionId: null,
      label: '독서 카드 읽기',
      manualCheckable: true,
      checkIndex: 0,
    })
    expect(wednesday.slots[0].linkTo).toMatch(/^\/games\?card=read-/)
    expect(saturday.slots[0]).toMatchObject({
      kind: 'cinemaCard',
      missionId: null,
      label: '시사회 카드 보기',
      manualCheckable: true,
      checkIndex: 0,
    })
    expect(saturday.slots[0].linkTo).toMatch(/^\/games\?card=film-/)
    expect(store.routineForWeekday(3).slots[0]).toEqual(wednesday.slots[0])
    expect(store.routineForWeekday(6).slots[0]).toEqual(saturday.slots[0])
  })

  it('오늘부터 이어진 완료일만 스트릭으로 세고 단절 뒤의 기록은 제외한다', async () => {
    const continuous = await loadStore({
      routineChecks: { '2026-08-03': { 0: true } },
      routineHistory: { '2026-08-02': 1, '2026-08-01': 2 },
    })
    expect(continuous.routineToday().streak).toBe(3)

    const broken = await loadStore({
      routineChecks: { '2026-08-03': { 0: true } },
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
})

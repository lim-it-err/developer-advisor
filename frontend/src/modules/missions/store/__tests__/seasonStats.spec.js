import { describe, expect, it } from 'vitest'
import seasons from '../../data/sampleSeasons.js'
import {
  buildSeasonOverview,
  normalizeSeasonStats,
  recordSeasonGain,
  selectSeasonEnding,
} from '../seasonStats.js'

const DAY = new Date('2026-08-03T09:00:00+09:00')

describe('시즌 스탯 계산', () => {
  it('구버전 데이터는 오늘 시작하는 빈 시즌으로 마이그레이션한다', () => {
    expect(normalizeSeasonStats(undefined, DAY)).toEqual({
      seasonStart: '2026-08-03',
      gains: [],
    })
  })

  it('같은 날 같은 source는 한 번만 적립하고 시즌 밖 적립을 거절한다', () => {
    const stats = { seasonStart: '2026-08-03', gains: [] }

    expect(recordSeasonGain(stats, { date: '2026-08-03', stat: 'culture', amount: 1, source: 'routine-check:0' })).toBe(true)
    expect(recordSeasonGain(stats, { date: '2026-08-03', stat: 'culture', amount: 1, source: 'routine-check:0' })).toBe(false)
    expect(recordSeasonGain(stats, { date: '2026-08-31', stat: 'culture', amount: 1, source: 'routine-check:0' })).toBe(false)
    expect(stats.gains).toHaveLength(1)
  })

  it('hidden → dominant → balanced → quiet 순으로 엔딩을 판정한다', () => {
    const endings = seasons.seasonEndings
    const totals = (vision, voice, judgment, culture) => ({ vision, voice, judgment, culture })

    expect(selectSeasonEnding(endings, totals(50, 1, 1, 1), 24).id).toBe('ending-burnout')
    expect(selectSeasonEnding(endings, totals(45, 20, 10, 5), 0).id).toBe('ending-vision')
    expect(selectSeasonEnding(endings, totals(20, 20, 15, 15), 0).id).toBe('ending-generalist')
    expect(selectSeasonEnding(endings, totals(3, 3, 3, 3), 0).id).toBe('ending-quiet')
  })

  it('28일 시즌의 종료와 평일·주말 완주일을 계산한다', () => {
    const stats = { seasonStart: '2026-08-03', gains: [] }
    const routineHistory = {
      '2026-08-03': 3,
      '2026-08-08': 2,
      '2026-08-09': 1,
      '2026-07-31': 3,
    }

    const overview = buildSeasonOverview(stats, routineHistory, seasons.seasonEndings, new Date('2026-08-31T09:00:00+09:00'))

    expect(overview.ended).toBe(true)
    expect(overview.endDate).toBe('2026-08-30')
    expect(overview.perfectDays).toBe(2)
  })
})

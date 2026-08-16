import { describe, expect, it } from 'vitest'
import probeData from '../../data/sampleProbeRounds.js'
import {
  beginProbeSession,
  inspectProbeRound,
  pickProbeRound,
  settleProbeSession,
} from '../probeEngine.js'

describe('한 번만 물어본다면 엔진', () => {
  it('같은 날짜에는 같은 라운드를 고르고 빈 덱은 안전하게 처리한다', () => {
    const first = pickProbeRound(probeData.probeRounds, '2026-08-03')
    const second = pickProbeRound(probeData.probeRounds, '2026-08-03')

    expect(first.id).toBe('probe-slow-api-01')
    expect(second).toBe(first)
    expect(pickProbeRound([], '2026-08-03')).toBeNull()
  })

  it('관측 한 번과 가설 지목 한 번만 허용하고 배제·정보량 판정을 만든다', () => {
    const round = probeData.probeRounds[0]
    const session = beginProbeSession(round, 'slow-query')
    const settled = settleProbeSession(round, session, 'index')

    expect(session).toEqual({
      roundId: round.id,
      probeKey: 'slow-query',
      verdictKey: null,
    })
    expect(settleProbeSession(round, settled, 'gc')).toBe(settled)
    expect(inspectProbeRound(round, settled)).toMatchObject({
      eliminatedKeys: ['external', 'gc'],
      correct: true,
      choseBestProbe: true,
    })
  })
})

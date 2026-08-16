import { describe, expect, it } from 'vitest'
import boundaryData from '../../data/sampleBoundaryRounds.js'
import {
  beginBoundarySession,
  failureStepIndex,
  groupedStepCount,
  inspectBoundaryRound,
  pickBoundaryRound,
} from '../boundaryEngine.js'

describe('경계선 한 칸 엔진', () => {
  it('같은 날짜에는 같은 라운드를 고르고 빈 덱은 안전하게 처리한다', () => {
    const first = pickBoundaryRound(boundaryData.boundaryRounds, '2026-08-03')
    const second = pickBoundaryRound(boundaryData.boundaryRounds, '2026-08-03')

    expect(first.id).toBe('boundary-transfer-01')
    expect(second).toBe(first)
    expect(pickBoundaryRound([], '2026-08-03')).toBeNull()
  })

  it('경계의 첫 묶음을 파이프라인 단계 수로 해석하고 타임아웃 위치를 찾는다', () => {
    const round = boundaryData.boundaryRounds[0]

    expect(groupedStepCount(round, 'all-in-one')).toBe(4)
    expect(groupedStepCount(round, 'order-stock')).toBe(2)
    expect(groupedStepCount(round, 'order-only')).toBe(1)
    expect(failureStepIndex(round)).toBe(2)
  })

  it('최초 선택의 outcome과 권장 여부를 판정한다', () => {
    const round = boundaryData.boundaryRounds[1]
    const session = beginBoundarySession(round, 'debit-first')

    expect(session).toEqual({ roundId: round.id, chosenKey: 'debit-first' })
    expect(beginBoundarySession(round, 'missing')).toBeNull()
    expect(inspectBoundaryRound(round, session)).toMatchObject({
      groupedSteps: 1,
      failureIndex: 1,
      choseRecommended: true,
    })
  })
})

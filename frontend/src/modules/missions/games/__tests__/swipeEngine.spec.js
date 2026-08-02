import { describe, expect, it } from 'vitest'
import swipeData from '../../data/sampleSwipeCards.js'
import {
  buildSwipeDeck,
  chooseSwipeDecision,
  chooseSwipeReason,
  createSwipeSession,
  currentSwipeCard,
  nextSwipeCard,
  swipeSummary,
} from '../swipeEngine.js'

const DAY = new Date('2026-08-03T09:00:00+09:00')

describe('머지 or 반려 엔진', () => {
  it('같은 날짜에는 중복 없는 같은 카드 5장을 고른다', () => {
    const first = buildSwipeDeck(swipeData.swipeCards, DAY)
    const second = buildSwipeDeck(swipeData.swipeCards, DAY)

    expect(first.map((card) => card.id)).toEqual(second.map((card) => card.id))
    expect(first).toHaveLength(5)
    expect(new Set(first.map((card) => card.id)).size).toBe(5)
  })

  it('판정 뒤에만 근거를 받고 질문 필요도 정답으로 채점한다', () => {
    const questionCard = swipeData.swipeCards.find((card) => card.correct === 'question')
    let session = createSwipeSession([questionCard], DAY, swipeData.REASON_TOKENS)

    expect(chooseSwipeReason(session, questionCard.correctToken)).toBe(session)
    session = chooseSwipeDecision(session, 'question')
    expect(currentSwipeCard(session)).toBe(questionCard)
    session = chooseSwipeReason(session, questionCard.correctToken)

    expect(session.answers[0]).toMatchObject({ decisionCorrect: true, reasonCorrect: true })
    expect(session.streak).toBe(1)
  })

  it('카드 진행과 판정·근거 요약, 연속 정답 스트릭을 계산한다', () => {
    const cards = swipeData.swipeCards.slice(0, 2)
    let session = createSwipeSession(cards, DAY, swipeData.REASON_TOKENS)

    for (let index = 0; index < 2; index++) {
      const card = currentSwipeCard(session)
      session = chooseSwipeDecision(session, card.correct)
      session = chooseSwipeReason(session, card.correctToken)
      session = nextSwipeCard(session)
    }

    expect(currentSwipeCard(session)).toBeNull()
    expect(swipeSummary(session)).toEqual({
      total: 2,
      decisionCorrect: 2,
      reasonCorrect: 2,
      bestStreak: 2,
    })
  })
})

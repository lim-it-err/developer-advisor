const DECISIONS = ['merge', 'reject', 'question']

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateSeed(text) {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return hash
}

export function buildSwipeDeck(cards, date = new Date()) {
  const dateKey = localDateKey(date)
  return cards
    .map((card) => ({ card, rank: dateSeed(`${dateKey}:${card.id}`) }))
    .sort((a, b) => a.rank - b.rank || a.card.id.localeCompare(b.card.id))
    .slice(0, Math.min(5, cards.length))
    .map(({ card }) => card)
}

export function createSwipeSession(cards, date = new Date(), reasonTokens = []) {
  return {
    deck: buildSwipeDeck(cards, date),
    reasonTokens: [...reasonTokens],
    index: 0,
    decision: null,
    reason: null,
    answers: [],
    streak: 0,
    bestStreak: 0,
  }
}

export function currentSwipeCard(session) {
  return session.deck[session.index] ?? null
}

export function chooseSwipeDecision(session, decision) {
  if (session.decision || !DECISIONS.includes(decision) || !currentSwipeCard(session)) return session
  return { ...session, decision }
}

export function chooseSwipeReason(session, reason) {
  const card = currentSwipeCard(session)
  const availableReasons = card?.reasonTokens ?? session.reasonTokens
  if (!card || !session.decision || session.reason || !availableReasons.includes(reason)) return session

  const decisionCorrect = session.decision === card.correct
  const reasonCorrect = reason === card.correctToken
  const streak = decisionCorrect ? session.streak + 1 : 0
  const answer = {
    cardId: card.id,
    decision: session.decision,
    reason,
    decisionCorrect,
    reasonCorrect,
  }

  return {
    ...session,
    reason,
    answers: [...session.answers, answer],
    streak,
    bestStreak: Math.max(session.bestStreak, streak),
  }
}

export function nextSwipeCard(session) {
  if (!session.reason) return session
  return {
    ...session,
    index: session.index + 1,
    decision: null,
    reason: null,
  }
}

export function swipeSummary(session) {
  return {
    total: session.deck.length,
    decisionCorrect: session.answers.filter((answer) => answer.decisionCorrect).length,
    reasonCorrect: session.answers.filter((answer) => answer.reasonCorrect).length,
    bestStreak: session.bestStreak,
  }
}

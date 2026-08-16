function dateSeed(dateKey) {
  let hash = 0
  for (const character of String(dateKey)) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return hash
}

export function pickBoundaryRound(rounds, dateKey) {
  if (!Array.isArray(rounds) || rounds.length === 0) return null
  return rounds[dateSeed(dateKey) % rounds.length]
}

export function beginBoundarySession(round, boundaryKey) {
  if (!round?.id || !round.boundaries?.some((boundary) => boundary.key === boundaryKey)) return null
  return { roundId: round.id, chosenKey: boundaryKey }
}

export function groupedStepCount(round, boundaryKey) {
  const boundary = round?.boundaries?.find((candidate) => candidate.key === boundaryKey)
  const firstGroup = boundary?.grouping?.match(/^\[([^\]]+)\]/)?.[1]
  if (!firstGroup) return 0
  return Math.min(round.flow?.length ?? 0, firstGroup.split('+').filter((step) => step.trim()).length)
}

export function failureStepIndex(round) {
  if (!round?.failureAt || !Array.isArray(round.flow)) return -1
  return round.flow.findIndex((step) => {
    const core = step.replace(/\s*\([^)]*\)\s*$/, '').trim()
    return core && round.failureAt.includes(core)
  })
}

export function inspectBoundaryRound(round, session) {
  const chosen = session?.roundId === round?.id
    ? round.boundaries?.find((boundary) => boundary.key === session.chosenKey) ?? null
    : null

  return {
    chosen,
    outcome: chosen ? round.outcomes?.[chosen.key] ?? null : null,
    recommended: round?.boundaries?.find((boundary) => boundary.key === round.recommendedKey) ?? null,
    groupedSteps: chosen ? groupedStepCount(round, chosen.key) : 0,
    failureIndex: failureStepIndex(round),
    choseRecommended: Boolean(chosen && chosen.key === round?.recommendedKey),
  }
}

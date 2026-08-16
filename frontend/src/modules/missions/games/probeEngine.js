function dateSeed(dateKey) {
  let hash = 0
  for (const character of String(dateKey)) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return hash
}

export function pickProbeRound(rounds, dateKey) {
  if (!Array.isArray(rounds) || rounds.length === 0) return null
  return rounds[dateSeed(dateKey) % rounds.length]
}

export function beginProbeSession(round, probeKey) {
  if (!round?.id || !round.probes?.some((probe) => probe.key === probeKey)) return null
  return { roundId: round.id, probeKey, verdictKey: null }
}

export function settleProbeSession(round, session, verdictKey) {
  if (
    !round
    || session?.roundId !== round.id
    || !session.probeKey
    || session.verdictKey
    || !round.hypotheses?.some((hypothesis) => hypothesis.key === verdictKey)
  ) return session

  return { ...session, verdictKey }
}

export function inspectProbeRound(round, session) {
  const probe = round?.probes?.find((candidate) => candidate.key === session?.probeKey) ?? null
  const verdict = round?.hypotheses?.find((candidate) => candidate.key === session?.verdictKey) ?? null
  const bestProbe = round?.probes?.find((candidate) => candidate.key === round?.bestProbeKey) ?? null

  return {
    probe,
    verdict,
    bestProbe,
    eliminatedKeys: probe?.eliminates ?? [],
    correct: Boolean(verdict && verdict.key === round?.answerKey),
    choseBestProbe: Boolean(probe && probe.key === round?.bestProbeKey),
  }
}

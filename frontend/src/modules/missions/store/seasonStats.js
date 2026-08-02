export const SEASON_LENGTH_DAYS = 28
export const SEASON_STAT_KEYS = ['vision', 'voice', 'judgment', 'culture']

const DAY_MS = 86_400_000

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateSerial(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  if (!year || !month || !day) return Number.NaN
  return Date.UTC(year, month - 1, day) / DAY_MS
}

function dateFromSerial(serial) {
  const date = new Date(serial * DAY_MS)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function dayOffset(seasonStart, dateKey) {
  return dateSerial(dateKey) - dateSerial(seasonStart)
}

export function normalizeSeasonStats(raw, today = new Date()) {
  const seasonStart = Number.isFinite(dateSerial(raw?.seasonStart))
    ? raw.seasonStart
    : localDateKey(today)

  return {
    seasonStart,
    gains: Array.isArray(raw?.gains) ? raw.gains.map((gain) => ({ ...gain })) : [],
  }
}

export function recordSeasonGain(seasonStats, { date = localDateKey(), stat, amount, source }) {
  const offset = dayOffset(seasonStats.seasonStart, date)
  if (!SEASON_STAT_KEYS.includes(stat) || !Number.isFinite(amount) || amount <= 0 || !source) return false
  if (!Number.isFinite(offset) || offset < 0 || offset >= SEASON_LENGTH_DAYS) return false
  if (seasonStats.gains.some((gain) => gain.date === date && gain.source === source)) return false

  seasonStats.gains.push({ date, stat, amount, source })
  return true
}

export function seasonTotals(seasonStats) {
  const totals = Object.fromEntries(SEASON_STAT_KEYS.map((stat) => [stat, 0]))
  for (const gain of seasonStats.gains) {
    const offset = dayOffset(seasonStats.seasonStart, gain.date)
    if (SEASON_STAT_KEYS.includes(gain.stat) && offset >= 0 && offset < SEASON_LENGTH_DAYS) {
      totals[gain.stat] += Number(gain.amount) || 0
    }
  }
  return totals
}

export function seasonTiming(seasonStart, today = new Date()) {
  const todayKey = localDateKey(today)
  const elapsed = dayOffset(seasonStart, todayKey)
  const remaining = Math.max(0, SEASON_LENGTH_DAYS - 1 - elapsed)
  return {
    today: todayKey,
    endDate: dateFromSerial(dateSerial(seasonStart) + SEASON_LENGTH_DAYS - 1),
    day: Math.min(SEASON_LENGTH_DAYS, Math.max(1, elapsed + 1)),
    ended: elapsed >= SEASON_LENGTH_DAYS,
    dDay: elapsed >= SEASON_LENGTH_DAYS ? '종료' : remaining === 0 ? 'D-Day' : `D-${remaining}`,
  }
}

export function countPerfectDays(routineHistory, seasonStart) {
  return Object.entries(routineHistory ?? {}).filter(([date, completed]) => {
    const offset = dayOffset(seasonStart, date)
    if (offset < 0 || offset >= SEASON_LENGTH_DAYS) return false
    const weekday = new Date(`${date}T00:00:00`).getDay()
    const slotCount = weekday === 0 || weekday === 6 ? 2 : 3
    return Number(completed) >= slotCount
  }).length
}

export function selectSeasonEnding(endings, totals, perfectDays) {
  const hidden = endings.find((ending) => ending.condition.type === 'hidden')
  if (perfectDays >= 24 && hidden) return hidden

  const ranked = SEASON_STAT_KEYS
    .map((stat) => ({ stat, value: totals[stat] ?? 0 }))
    .sort((a, b) => b.value - a.value)
  const total = ranked.reduce((sum, entry) => sum + entry.value, 0)

  if (total >= 40 && ranked[0].value >= ranked[1].value * 1.5) {
    const dominant = endings.find(
      (ending) => ending.condition.type === 'dominant' && ending.condition.stat === ranked[0].stat,
    )
    if (dominant) return dominant
  }

  if (total >= 60 && ranked[ranked.length - 1].value >= ranked[0].value / 2) {
    const balanced = endings.find((ending) => ending.condition.type === 'balanced')
    if (balanced) return balanced
  }

  return endings.find((ending) => ending.condition.type === 'quiet') ?? null
}

export function buildSeasonOverview(seasonStats, routineHistory, endings, today = new Date()) {
  const totals = seasonTotals(seasonStats)
  const perfectDays = countPerfectDays(routineHistory, seasonStats.seasonStart)
  return {
    ...seasonTiming(seasonStats.seasonStart, today),
    seasonStart: seasonStats.seasonStart,
    totals,
    total: Object.values(totals).reduce((sum, value) => sum + value, 0),
    perfectDays,
    recentGains: [...seasonStats.gains].reverse().slice(0, 10),
    ending: selectSeasonEnding(endings, totals, perfectDays),
  }
}

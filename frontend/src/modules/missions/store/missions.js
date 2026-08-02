// missions 모듈 상태. 프로토타입: 콘텐츠는 정적 샘플, 제출물은 localStorage.
// 실제 서비스에서는 이 파일만 API 클라이언트 호출로 교체된다 (모듈 밖 인터페이스는 동일).
import { reactive } from 'vue'
import sample from '../data/sampleContent.js'
import projectSample from '../data/sampleProjects.js'
import cards from '../data/sampleCards.js'

const STORAGE_KEY = 'advisor.learner.v1'

// 백엔드 채팅 프리뷰 API. 백엔드가 죽어 있으면 아래 mock 응답으로 조용히 폴백한다.
const API_BASE = import.meta.env.VITE_ADVISOR_API ?? 'http://localhost:8080/api/advisor'
const CHAT_TIMEOUT_MS = 30_000
// 실제 리뷰는 코드를 읽고 루브릭 기준으로 채점하므로 30~90초가 걸린다.
const REVIEW_TIMEOUT_MS = 120_000

// POST /chat/preview — 실패(네트워크/타임아웃/비정상 응답)는 전부 throw, 호출부에서 폴백.
async function requestChatPreview(context, history, text) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS)
  try {
    const res = await fetch(`${API_BASE}/chat/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, history, text }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`chat/preview HTTP ${res.status}`)
    const data = await res.json()
    if (typeof data?.text !== 'string' || !data.text.trim()) {
      throw new Error('chat/preview returned empty text')
    }
    return data.text
  } finally {
    clearTimeout(timer)
  }
}

// POST /review/preview — 실패(네트워크/타임아웃/비정상 응답)는 전부 throw, 호출부는 가짜 리뷰를 만들지 않고 조용히 포기한다.
// 응답에는 overall이 없다 — items[].score 합으로 클라이언트에서 계산한다.
async function requestReviewPreview(payload) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REVIEW_TIMEOUT_MS)
  try {
    const res = await fetch(`${API_BASE}/review/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`review/preview HTTP ${res.status}`)
    const data = await res.json()
    if (!data || !Array.isArray(data.items)) {
      throw new Error('review/preview returned malformed content')
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

function clampScore(n) {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)))
}

// ---- 오늘의 훈련(데일리 루틴) 헬퍼 ----

// 로컬 자정 기준 'YYYY-MM-DD'. 커밋 시각 판정(오늘 제출/설명 여부)에 UTC를 쓰면
// 자정 근처에서 하루가 밀릴 수 있어 항상 로컬 기준으로 통일한다.
function localDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 날짜 문자열을 회전 인덱스로 — 같은 날엔 항상 같은 미션이 뽑히고, 날짜가 바뀌면 순환한다.
function dateSeed(dateStr) {
  let h = 0
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0
  return h
}

function pickBySeed(list, seed) {
  if (!list.length) return null
  return list[seed % list.length]
}

const NO_CODE_TYPES = ['코드 판독', '설계 리뷰']

function hasSubmissionOn(state, missionId, dateStr) {
  const versions = state.submissions[missionId]
  if (!versions?.length) return false
  return versions.some((v) => v.submittedAt && localDateStr(new Date(v.submittedAt)) === dateStr)
}

function hasExplanationOn(state, missionId, dateStr) {
  const exp = state.explanations[missionId]
  if (!exp?.submittedAt) return false
  return localDateStr(new Date(exp.submittedAt)) === dateStr
}

function hasAnySubmissionOn(state, dateStr) {
  return Object.values(state.submissions).some(
    (versions) => versions?.some((v) => v.submittedAt && localDateStr(new Date(v.submittedAt)) === dateStr),
  )
}

function hasProjectSubmissionOn(state, subMissionId, dateStr) {
  const sub = state.projectSubmissions[subMissionId]
  if (!sub?.submittedAt) return false
  return localDateStr(new Date(sub.submittedAt)) === dateStr
}

function donePlannerReviewOn(state, missionId, dateStr) {
  const rev = state.plannerSubmissions[missionId]?.review
  if (!rev?.submittedAt) return false
  return localDateStr(new Date(rev.submittedAt)) === dateStr
}

function submittedWithinDays(state, missionId, days) {
  const versions = state.submissions[missionId]
  if (!versions?.length) return false
  const cutoff = Date.now() - days * 86_400_000
  return versions.some((v) => v.submittedAt && new Date(v.submittedAt).getTime() >= cutoff)
}

function missionsWithoutSubmission(state, pool) {
  return pool.filter((m) => !state.submissions[m.id]?.length)
}

function missionsWithoutExplanation(pool, state) {
  return pool.filter((m) => !state.explanations[m.id])
}

// 우선순위대로 pool을 훑다가, 비어있지 않은 첫 pool에서 날짜-시드로 하나 뽑는다.
// 콘텐츠가 아직 덜 채워진 상태(예: 특정 missionType이 하나도 없음)에서도 항상 뭔가를 반환하려는 방어적 선택기.
function pickFromPools(pools, seed) {
  for (const pool of pools) {
    if (pool?.length) return pickBySeed(pool, seed)
  }
  return null
}

// 저녁 슬롯(설명 훈련) 공통 픽커: 제출은 했지만 설명이 없는 미션 우선, 소진 시 설명 없는 아무 미션.
function pickExplainMission(state, seed) {
  const submittedNoExplain = state.missions.filter(
    (m) => state.submissions[m.id]?.length && !state.explanations[m.id],
  )
  const noExplainAny = missionsWithoutExplanation(state.missions, state)
  return pickFromPools([submittedNoExplain, noExplainAny, state.missions], seed)
}

// 주말 슬롯: 다음에 풀어야 할 프로젝트 소미션(해금됐지만 미제출) — 여러 프로젝트가 있으면 날짜-시드로 순환.
function nextProjectSubMission(state, seed) {
  const candidates = []
  for (const project of state.projects ?? []) {
    const subs = project.subMissions ?? []
    for (let i = 0; i < subs.length; i++) {
      const sm = subs[i]
      const unlocked = i === 0 || !!state.projectSubmissions[subs[i - 1].id]
      if (unlocked && !state.projectSubmissions[sm.id]) {
        candidates.push({ project, subMission: sm })
        break
      }
    }
  }
  return candidates.length ? candidates[seed % candidates.length] : null
}

// 슬롯 하나의 표준 모양을 만든다. mission이 주어지면 title/링크를 미션 기준으로 채우고,
// title/linkTo를 직접 넘기면(자유 슬롯 등 특정 미션에 안 묶이는 경우) 그걸 우선한다.
function makeRoutineSlot(state, {
  kind,
  mission = null,
  title = null,
  linkTo,
  emoji,
  time,
  label,
  done,
  dateStr,
  manualCheckable = false,
  checkIndex = null,
  checkLabel = '읽었어요 ✓',
}) {
  const manualChecked = checkIndex != null ? !!state.routineChecks[dateStr]?.[checkIndex] : false
  return {
    kind,
    missionId: mission?.id ?? null,
    title: title ?? mission?.title ?? null,
    linkTo: linkTo !== undefined ? linkTo : mission ? `/missions/${mission.id}` : null,
    emoji,
    time,
    label,
    done,
    manualCheckable,
    manualChecked,
    checkIndex,
    checkLabel,
  }
}

// 월/화 아침 슬롯 공통 픽커: 원하는 missionType을 우선하되, 없으면 코드 판독/설계 리뷰 어느 쪽이든,
// 그마저 없으면 아무 미션으로 물러난다. 라벨은 실제로 뽑힌 미션의 종류를 따른다 —
// 콘텐츠가 덜 채워진 상태(예: 코드 판독이 아직 없음)에서 엉뚱한 라벨을 붙이지 않기 위해서다.
function pickNoCodeMorningMission(state, preferredType, seed) {
  const typed = state.missions.filter((m) => m.missionType === preferredType)
  return pickFromPools(
    [
      missionsWithoutSubmission(state, typed),
      typed,
      state.missions.filter((m) => NO_CODE_TYPES.includes(m.missionType)),
      missionsWithoutSubmission(state, state.missions),
      state.missions,
    ],
    seed,
  )
}

function noCodeReadLabel(mission) {
  if (!mission) return '브리핑 읽기'
  if (mission.missionType === '코드 판독') return '코드 판독 읽기'
  if (mission.missionType === '설계 리뷰') return '설계 리뷰 미션 읽기'
  return '브리핑 읽기' // 폴백: 코드 판독/설계 리뷰가 하나도 없어 아무 미션이나 뽑힌 경우
}

// ---- 요일별 루틴 템플릿 ----
// 월~금은 3슬롯(출근길/점심/저녁), 주말은 2슬롯(오전/오후) — "3칸 강요 없음"의 주말 버전.

function buildMonday(state, seed, dateStr) {
  const mission = pickNoCodeMorningMission(state, '코드 판독', seed)
  const lunchDone = mission ? hasSubmissionOn(state, mission.id, dateStr) : false
  const readDone = lunchDone || !!state.routineChecks[dateStr]?.[0]
  const explainMission = pickExplainMission(state, seed)
  const explainDone = explainMission ? hasExplanationOn(state, explainMission.id, dateStr) : false

  return {
    name: '판독의 월요일',
    tagline: '읽는 근육을 먼저 씁니다 — 코드 판독으로 여는 한 주.',
    slots: [
      makeRoutineSlot(state, { kind: 'read', mission, emoji: '🚆', time: '출근길 · ~11시', label: noCodeReadLabel(mission), done: readDone, dateStr, manualCheckable: true, checkIndex: 0 }),
      makeRoutineSlot(state, { kind: 'submit', mission, emoji: '🍜', time: '점심 · 11~17시', label: 'findings 제출', done: lunchDone, dateStr }),
      makeRoutineSlot(state, { kind: 'explain', mission: explainMission, emoji: '🌙', time: '저녁 · 17시~', label: '설명 훈련', done: explainDone, dateStr }),
    ],
  }
}

function buildTuesday(state, seed, dateStr) {
  const mission = pickNoCodeMorningMission(state, '설계 리뷰', seed)
  const lunchDone = mission ? hasSubmissionOn(state, mission.id, dateStr) : false
  const readDone = lunchDone || !!state.routineChecks[dateStr]?.[0]
  const explainMission = pickExplainMission(state, seed)
  const explainDone = explainMission ? hasExplanationOn(state, explainMission.id, dateStr) : false

  return {
    name: '설계자의 화요일',
    tagline: '코드 없이 비평만 합니다 — 설계 리뷰의 날.',
    slots: [
      makeRoutineSlot(state, { kind: 'read', mission, emoji: '🚆', time: '출근길 · ~11시', label: noCodeReadLabel(mission), done: readDone, dateStr, manualCheckable: true, checkIndex: 0 }),
      makeRoutineSlot(state, { kind: 'submit', mission, emoji: '🍜', time: '점심 · 11~17시', label: 'critique 제출', done: lunchDone, dateStr }),
      makeRoutineSlot(state, { kind: 'explain', mission: explainMission, emoji: '🌙', time: '저녁 · 17시~', label: '꼬리 질문에 답 적기', done: explainDone, dateStr }),
    ],
  }
}

function buildWednesday(state, seed, dateStr) {
  const card = pickBySeed(cards.readingCards, seed)
  const cardDone = !!state.routineChecks[dateStr]?.[0]
  const noExplainAny = missionsWithoutExplanation(state.missions, state)
  const missionA = pickFromPools([noExplainAny, state.missions], seed)
  const aDone = missionA ? hasExplanationOn(state, missionA.id, dateStr) : false

  const secondPool = noExplainAny.filter((m) => m.id !== missionA?.id)
  const missionB = pickFromPools([secondPool, state.missions.filter((m) => m.id !== missionA?.id), state.missions], seed + 1)
  const bDone = missionB ? hasExplanationOn(state, missionB.id, dateStr) : false

  return {
    name: '언어화의 수요일',
    tagline: '코드를 짜는 대신, 말이 되게 만드는 날.',
    slots: [
      makeRoutineSlot(state, {
        kind: 'readingCard',
        title: card?.bookTitle ?? null,
        linkTo: card ? `/games?card=${card.id}` : '/games',
        emoji: card?.emoji ?? '📖',
        time: '출근길 · ~11시',
        label: '독서 카드 읽기',
        done: cardDone,
        dateStr,
        manualCheckable: true,
        checkIndex: 0,
      }),
      makeRoutineSlot(state, { kind: 'explain', mission: missionA, emoji: '🍜', time: '점심 · 11~17시', label: '설명 훈련 (1)', done: aDone, dateStr }),
      makeRoutineSlot(state, { kind: 'explain', mission: missionB, emoji: '🌙', time: '저녁 · 17시~', label: '설명 훈련 (2)', done: bDone, dateStr }),
    ],
  }
}

function buildThursday(state, seed, dateStr) {
  const plannerCapable = state.missions.filter((m) => (m.modes?.length ?? 0) > 1)
  const mission = pickFromPools(
    [plannerCapable.filter((m) => !state.plannerSubmissions[m.id]?.review), plannerCapable, state.missions],
    seed,
  )
  const reviewDone = mission ? donePlannerReviewOn(state, mission.id, dateStr) : false
  const readDone = reviewDone || !!state.routineChecks[dateStr]?.[0]
  const explainMission = pickExplainMission(state, seed)
  const explainDone = explainMission ? hasExplanationOn(state, explainMission.id, dateStr) : false

  return {
    name: '기획자의 목요일',
    tagline: '코드가 아니라 결정을 씁니다 — 검토서로 여는 하루.',
    slots: [
      makeRoutineSlot(state, { kind: 'read', mission, emoji: '🚆', time: '출근길 · ~11시', label: mission ? '기획자 브리핑 읽기' : '브리핑 읽기', done: readDone, dateStr, manualCheckable: true, checkIndex: 0 }),
      makeRoutineSlot(state, { kind: 'plannerReview', mission, emoji: '🍜', time: '점심 · 11~17시', label: '검토서 제출', done: reviewDone, dateStr }),
      makeRoutineSlot(state, { kind: 'explain', mission: explainMission, emoji: '🌙', time: '저녁 · 17시~', label: '설명 훈련', done: explainDone, dateStr }),
    ],
  }
}

function buildFriday(state, seed, dateStr) {
  const recentlySubmitted = state.missions.filter((m) => submittedWithinDays(state, m.id, 7))
  const anySubmitted = state.missions.filter((m) => state.submissions[m.id]?.length)
  const recapMission = pickFromPools([recentlySubmitted, anySubmitted, state.missions], seed)
  const recapChecked = !!state.routineChecks[dateStr]?.[0]
  const freeDone = hasAnySubmissionOn(state, dateStr) || !!state.routineChecks[dateStr]?.[1]
  const explainMission = pickExplainMission(state, seed)
  const explainDone = explainMission ? hasExplanationOn(state, explainMission.id, dateStr) : false

  return {
    name: '회고의 금요일',
    tagline: '한 주를 되짚고, 미뤄둔 것 하나를 메웁니다.',
    slots: [
      makeRoutineSlot(state, {
        kind: 'recapRead',
        mission: recapMission,
        linkTo: recapMission ? `/missions/${recapMission.id}/review` : '/missions',
        emoji: '🚆',
        time: '출근길 · ~11시',
        label: recapMission ? '이번 주 리뷰 다시 읽기' : '아직 되짚을 리뷰가 없습니다',
        done: recapChecked,
        dateStr,
        manualCheckable: true,
        checkIndex: 0,
      }),
      makeRoutineSlot(state, {
        kind: 'freeSubmit',
        title: '오늘 안 한 것 아무거나 — 재제출도 좋습니다',
        linkTo: '/missions',
        emoji: '🍜',
        time: '점심 · 11~17시',
        label: '자유 제출',
        done: freeDone,
        dateStr,
        manualCheckable: true,
        checkIndex: 1,
        checkLabel: '했어요 ✓',
      }),
      makeRoutineSlot(state, { kind: 'explain', mission: explainMission, emoji: '🌙', time: '저녁 · 17시~', label: '설명 훈련', done: explainDone, dateStr }),
    ],
  }
}

function buildWeekend(state, seed, dateStr) {
  const card = pickBySeed(cards.cinemaCards, seed)
  const cardDone = !!state.routineChecks[dateStr]?.[0]

  const projectPick = nextProjectSubMission(state, seed)
  const projectDone = projectPick ? hasProjectSubmissionOn(state, projectPick.subMission.id, dateStr) : false

  return {
    name: '몰입의 주말',
    tagline: '슬롯은 두 개뿐입니다 — 코드 하나, 그리고 프로젝트 한 걸음.',
    slots: [
      makeRoutineSlot(state, {
        kind: 'cinemaCard',
        title: card?.filmTitle ?? null,
        linkTo: card ? `/games?card=${card.id}` : '/games',
        emoji: card?.emoji ?? '🎬',
        time: '오전 세션',
        label: '시사회 카드 보기',
        done: cardDone,
        dateStr,
        manualCheckable: true,
        checkIndex: 0,
      }),
      makeRoutineSlot(state, {
        kind: 'project',
        mission: projectPick ? { id: projectPick.subMission.id, title: projectPick.subMission.title } : null,
        linkTo: projectPick ? `/projects/${projectPick.project.id}` : '/projects',
        emoji: '🚲',
        time: '오후 세션',
        label: projectPick ? '프로젝트 소미션 진행' : '오늘은 이어갈 소미션이 없습니다',
        done: projectDone,
        dateStr,
      }),
    ],
  }
}

// 요일(0=일~6=토)에 맞는 템플릿 빌더로 분기.
function buildRoutineForDate(state, dateStr) {
  const seed = dateSeed(dateStr)
  const weekday = new Date(`${dateStr}T00:00:00`).getDay()
  switch (weekday) {
    case 1: return buildMonday(state, seed, dateStr)
    case 2: return buildTuesday(state, seed, dateStr)
    case 3: return buildWednesday(state, seed, dateStr)
    case 4: return buildThursday(state, seed, dateStr)
    case 5: return buildFriday(state, seed, dateStr)
    default: return buildWeekend(state, seed, dateStr) // 0=일, 6=토
  }
}

// 오늘(또는 어제까지)을 종점으로 하는 연속일 스트릭. routineHistory[date] >= 1 인 날이 연속됐는지 센다.
function computeStreak(state, todayCount) {
  let streak = todayCount >= 1 ? 1 : 0
  const cursor = new Date()
  cursor.setDate(cursor.getDate() - 1)
  // 안전장치: 무한루프 방지용 최대 탐색 일수.
  for (let i = 0; i < 3650; i++) {
    const ds = localDateStr(cursor)
    const c = state.routineHistory[ds] ?? 0
    if (c < 1) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// 제출 이력은 { files, submittedAt, by } 배열. 과거(단일 객체) 저장분을 배열로 감싸 마이그레이션한다.
function migrateSubmissions(raw) {
  const result = {}
  for (const [id, val] of Object.entries(raw ?? {})) {
    if (Array.isArray(val)) result[id] = val
    else if (val && typeof val === 'object') result[id] = [val]
  }
  return result
}

export const PARTS = [
  { no: 1, title: '분리와 계약', tagline: '코드 안의 전쟁 — 책임을 나누고, 계약을 긋고, 레거시를 길들인다' },
  { no: 2, title: '구조와 세계', tagline: '시스템과 사람 — 경계는 코드가 아니라 세계에 긋는 것이다' },
  { no: 3, title: '현실의 압력', tagline: '테스트, 실패, 동시성, 데이터, 그리고 단순함 — 운영이 가르치는 것들' },
]

export const STAGES = [
  { no: 1, part: 1, title: '분리의 감각', question: '이 코드가 변경되는 이유는 몇 개인가?' },
  { no: 2, part: 1, title: '인터페이스는 계약', question: '호출자는 무엇을 알아야 하고, 무엇을 몰라야 하는가?' },
  { no: 3, part: 1, title: '의존성 역전', question: '도메인 로직이 DB 없이 테스트되는가?' },
  { no: 4, part: 1, title: '레거시 길들이기', question: '무엇이 부서질지 모른 채 어떻게 고치는가?' },
  { no: 5, part: 2, title: '거대한 구조', question: '어디서 모델을 갈라야 하는가?' },
  { no: 6, part: 2, title: '구조로 세상 읽기', question: '이 시스템의 세계관은 무엇인가?' },
  { no: 7, part: 3, title: '테스트가 설계를 이끈다', question: '테스트가 괴로운 건 테스트 탓인가, 설계 탓인가?' },
  { no: 8, part: 3, title: '실패를 설계하다', question: '이 시스템은 어떻게 죽고, 어떻게 다시 일어나는가?' },
  { no: 9, part: 3, title: '동시성의 감각', question: '이 코드에 두 명이 동시에 들어오면 무슨 일이 벌어지는가?' },
  { no: 10, part: 3, title: '데이터가 흐르는 길', question: '진실은 어디에 있고, 사본은 언제 거짓말하는가?' },
  { no: 11, part: 3, title: '단순함의 철학', question: '이 복잡함은 문제의 것인가, 우리가 만든 것인가?' },
]

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

const persisted = load()

const state = reactive({
  missions: sample.missions,
  submissions: migrateSubmissions(persisted.submissions), // missionId -> [{ files, submittedAt, by }] (버전별, 재제출 시 append)
  explanations: persisted.explanations ?? {}, // missionId -> { text, submittedAt, by }
  chats: persisted.chats ?? {},               // missionId -> [{ role: 'me'|'agent', text, at }]
  // 기획자 모드: 회의 채팅 로그. missionId -> [{ role: 'me'|'stakeholder', text, at }]
  meetingChats: persisted.meetingChats ?? {},
  // 기획자 모드: 합의문/검토서 제출. missionId -> { meeting?: {text, submittedAt, by}, review?: {text, submittedAt, by} }
  plannerSubmissions: persisted.plannerSubmissions ?? {},
  // 학습자: 기록 구분용 닉네임. 인증 아님 — 단순 식별자.
  learner: persisted.learner ?? { nickname: '' },
  // 프로젝트 모드(맨땅에서): 캠페인 데이터.
  projects: projectSample.projects ?? [],
  // 프로젝트 모드 제출물. subMissionId -> { files, submittedAt, by }
  projectSubmissions: persisted.projectSubmissions ?? {},
  // 실서비스 리뷰 결과. missionId -> [{ content, overall, reviewedAt }] (버전별, 성공한 리뷰만 append)
  reviews: persisted.reviews ?? {},
  // 오늘의 훈련: 날짜별 완료 슬롯 수(0~3). { 'YYYY-MM-DD': number }
  routineHistory: persisted.routineHistory ?? {},
  // 오늘의 훈련: 읽기 전용 슬롯의 수동 체크('읽었어요' 등). { 'YYYY-MM-DD': { [slotCheckIndex]: boolean } }
  routineChecks: persisted.routineChecks ?? {},
  // 입력 원칙 — 선택 우선: 코드 판독/설계 리뷰 제출의 구조화 빌더 카드 초안.
  // missionId -> [{ location, severity, symptom, cause, fix }]
  findingsDrafts: persisted.findingsDrafts ?? {},
  // 입력 원칙 — 결말 예측 투표(원탭). missionId -> 'calm' | 'hotfix' | 'dawn'
  endingPredictions: persisted.endingPredictions ?? {},
})

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      submissions: state.submissions,
      explanations: state.explanations,
      chats: state.chats,
      meetingChats: state.meetingChats,
      plannerSubmissions: state.plannerSubmissions,
      learner: state.learner,
      projectSubmissions: state.projectSubmissions,
      reviews: state.reviews,
      routineHistory: state.routineHistory,
      routineChecks: state.routineChecks,
      findingsDrafts: state.findingsDrafts,
      endingPredictions: state.endingPredictions,
    }),
  )
}

// 리뷰 조회 공통 헬퍼: 실제 저장된 리뷰가 있으면 그걸, 없으면(그리고 제출 이력이 있으면) 샘플로 폴백.
// 반환 형태는 항상 [{ content, overall, reviewedAt }] 배열.
function reviewVersions(missionId) {
  const stored = state.reviews[missionId]
  if (stored?.length) return stored
  if (state.submissions[missionId]?.length && sample.sampleReviews[missionId]) {
    const sampleReview = sample.sampleReviews[missionId]
    return [
      {
        content: { ...sampleReview, reputation: sample.sampleReputation?.[missionId] ?? null },
        overall: sampleReview.overall,
        reviewedAt: null, // null = 샘플(프로토타입) 리뷰라는 표식
      },
    ]
  }
  return []
}

export function useMissions() {
  return {
    state,
    stages: STAGES,

    getMission(id) {
      return state.missions.find((m) => m.id === id)
    },

    missionStatus(id) {
      if (state.submissions[id]?.length) return '제출됨'
      return '진행 가능'
    },

    // ---- 오늘의 훈련(데일리 루틴) ----
    // { date, name, tagline, slots: [...], streak } — 요일마다 다른 테마(월~금 3슬롯, 주말 2슬롯).
    // 콘텐츠가 아직 덜 채워져 있어도(특정 missionType이 하나도 없어도) 항상 안전하게 폴백한다.
    routineToday() {
      const dateStr = localDateStr()
      const built = buildRoutineForDate(state, dateStr)

      const doneCount = built.slots.filter((s) => s.done).length
      if (state.routineHistory[dateStr] !== doneCount) {
        state.routineHistory[dateStr] = doneCount
        persist()
      }

      const streak = computeStreak(state, doneCount)

      return { date: dateStr, name: built.name, tagline: built.tagline, slots: built.slots, streak }
    },

    // 다른 요일 미리보기 — 그 요일이 다음에 돌아오는 날짜 기준으로 덱을 빌드한다.
    // routineToday()와 달리 히스토리 기록 부수효과가 없다. 체크·완료 판정은 당일에만 의미가 있다.
    routineForWeekday(weekday) {
      const cursor = new Date()
      const diff = (weekday - cursor.getDay() + 7) % 7
      cursor.setDate(cursor.getDate() + diff)
      const dateStr = localDateStr(cursor)
      const built = buildRoutineForDate(state, dateStr)
      return { date: dateStr, name: built.name, tagline: built.tagline, slots: built.slots, isToday: diff === 0 }
    },

    // 슬롯 하나의 수동 체크('읽었어요' 등). checkIndex는 routineToday()가 돌려준 slot.checkIndex.
    checkRoutineSlot(checkIndex) {
      const dateStr = localDateStr()
      const entry = (state.routineChecks[dateStr] ??= {})
      entry[checkIndex] = true
      persist()
    },

    // ---- 입력 원칙: 선택 우선, 타이핑은 선택 ----

    // findings/critique 구조화 빌더 — 카드 초안을 미션별로 저장(제출 전까지 유지).
    getFindingsDraft(missionId) {
      return state.findingsDrafts[missionId] ?? []
    },

    setFindingsDraft(missionId, cards) {
      state.findingsDrafts[missionId] = cards
      persist()
    },

    // 결말 예측 투표 — 원탭, 제출 전 한 번만 의미가 있다.
    getEndingPrediction(missionId) {
      return state.endingPredictions[missionId] ?? null
    },

    predictEnding(missionId, grade) {
      state.endingPredictions[missionId] = grade
      persist()
    },

    // ---- 프로젝트 모드(맨땅에서): 여정 지도 캠페인 ----

    getProject(id) {
      return state.projects.find((p) => p.id === id)
    },

    // 소미션 i는 i===0 이거나 직전 소미션이 제출되어 있으면 해금.
    isSubMissionUnlocked(project, index) {
      if (!project?.subMissions?.length) return false
      if (index === 0) return true
      const prev = project.subMissions[index - 1]
      return !!state.projectSubmissions[prev.id]
    },

    // { done, total, currentIndex } — currentIndex는 "지금 해야 할" 소미션 인덱스.
    // 전부 끝났으면 마지막 인덱스를 가리킨다(완료 표시용).
    projectProgress(projectId) {
      const project = state.projects.find((p) => p.id === projectId)
      const subMissions = project?.subMissions ?? []
      const total = subMissions.length
      const done = subMissions.filter((sm) => !!state.projectSubmissions[sm.id]).length
      const currentIndex = total === 0 ? -1 : done >= total ? total - 1 : done
      return { done, total, currentIndex }
    },

    submitSubMission(subMissionId, files) {
      state.projectSubmissions[subMissionId] = {
        files: files.filter((f) => f.path.trim() && f.content.trim()),
        submittedAt: new Date().toISOString(),
        by: state.learner.nickname || null,
      }
      persist()
    },

    // 프로토타입: 소미션 리뷰는 사전 생성된 샘플.
    getSubReview(subMissionId) {
      if (!state.projectSubmissions[subMissionId]) return null
      return projectSample.sampleSubReviews?.[subMissionId] ?? null
    },

    setNickname(name) {
      state.learner.nickname = String(name ?? '').trim().slice(0, 12)
      persist()
    },

    // 코드 제출 + 실제 Reviewer 백엔드 호출. 제출 자체는 항상 저장되고(재제출은 새 버전으로 append),
    // 리뷰는 백엔드가 성공적으로 응답했을 때만 저장된다 — 실패 시 가짜 리뷰를 만들지 않는다.
    async submitCode(missionId, files) {
      const mission = state.missions.find((m) => m.id === missionId)
      const versions = (state.submissions[missionId] ??= [])
      const entry = {
        files: files.filter((f) => f.path.trim() && f.content.trim()),
        submittedAt: new Date().toISOString(),
        by: state.learner.nickname || null,
      }
      versions.push(entry)
      persist()

      if (!mission) return false

      try {
        const chatLog = state.chats[missionId] ?? []
        const chatTranscript = chatLog.length
          ? chatLog.map((m) => `[${m.role === 'me' ? '학습자' : '에이전트'}] ${m.text}`).join('\n')
          : null

        const payload = {
          mission: {
            title: mission.title,
            scenario: mission.scenario,
            requirements: mission.requirements ?? [],
            constraints: mission.constraints ?? [],
            rubric: mission.rubric ?? [],
            hiddenCases: mission.hiddenCases ?? [],
            endings: mission.endings ?? [],
            hiddenQuest: mission.hiddenQuest ?? null,
          },
          files: entry.files,
          chatTranscript,
        }

        const content = await requestReviewPreview(payload)
        const overall = clampScore((content.items ?? []).reduce((sum, it) => sum + (Number(it.score) || 0), 0))

        const reviews = (state.reviews[missionId] ??= [])
        reviews.push({ content, overall, reviewedAt: new Date().toISOString() })
        persist()
        return true
      } catch {
        return false // 백엔드 불가/실패 — 저장된 리뷰 없음. UI는 이를 정직하게 드러낸다.
      }
    },

    submitExplanation(missionId, text) {
      state.explanations[missionId] = {
        text,
        submittedAt: new Date().toISOString(),
        by: state.learner.nickname || null,
      }
      persist()
    },

    // 저장된 실제 리뷰 버전 전체(최신순 아님 — 제출 순). 재제출 이력 셀렉터용.
    getReviews(missionId) {
      return reviewVersions(missionId).map((r) => ({ ...r.content, overall: r.overall, reviewedAt: r.reviewedAt }))
    },

    // index 미지정 시 최신 리뷰. 실제 저장된 리뷰가 있으면 그것을, 없으면(s1-wine-01 한정) 샘플로 폴백, 그마저 없으면 null.
    getReview(missionId, index) {
      const list = reviewVersions(missionId)
      if (!list.length) return null
      const r = index != null && list[index] ? list[index] : list[list.length - 1]
      return { ...r.content, overall: r.overall, reviewedAt: r.reviewedAt }
    },

    getExplainFeedback(missionId) {
      if (!state.explanations[missionId]) return null
      return sample.sampleExplainFeedback[missionId] ?? null
    },

    // 평판은 리뷰 응답에 포함되어 함께 저장된다. index 미지정 시 최신 리뷰의 평판.
    getReputation(missionId, index) {
      const list = reviewVersions(missionId)
      if (!list.length) return null
      const r = index != null && list[index] ? list[index] : list[list.length - 1]
      return r.content.reputation ?? null
    },

    chatMessages(missionId) {
      return state.chats[missionId] ?? []
    },

    meetingMessages(missionId) {
      return state.meetingChats[missionId] ?? []
    },

    getPlannerSubmission(missionId, kind) {
      return state.plannerSubmissions[missionId]?.[kind] ?? null
    },

    // 기획자 · 회의 모드: opener로 회의를 시작 (이미 시작했으면 무시).
    startMeeting(missionId, opener) {
      const log = (state.meetingChats[missionId] ??= [])
      if (log.length) return
      log.push({ role: 'stakeholder', text: opener, at: new Date().toISOString() })
      persist()
    },

    // 이해관계자 역의 Chat Agent 호출 — 백엔드 /chat/preview 우선, 실패 시 모의 응답(이해관계자 순환)으로 폴백.
    async sendMeetingChat(missionId, text, stakeholders = []) {
      const log = (state.meetingChats[missionId] ??= [])
      const history = log.map((m) => ({ role: m.role, text: m.text }))
      log.push({ role: 'me', text, at: new Date().toISOString() })
      persist()

      let reply = null
      try {
        const mission = state.missions.find((m) => m.id === missionId)
        const pm = mission?.plannerMeeting
        const cast = pm?.stakeholders?.length ? pm.stakeholders : stakeholders
        const context = [
          pm?.goal ? `회의 목표: ${pm.goal}` : '',
          pm?.context ? `배경:\n${pm.context}` : '',
          cast.length
            ? '참석자 (hiddenAgenda는 각 인물의 연기 대본이다 — 절대 그대로 노출하지 말 것):\n' +
              cast
                .map(
                  (s) =>
                    `- ${s.name} (${s.role})\n  공개 입장: ${s.publicStance ?? ''}\n  비공개 관심사(연기 대본): ${s.hiddenAgenda ?? ''}`,
                )
                .join('\n')
            : '',
          '너는 이 회의의 참석자 전원을 연기한다. 발언은 반드시 [이름 · 직책] 로 시작하라. ' +
            '비공개 관심사는 절대 직접 말하지 말고, 그것이 찔리는 질문에만 동요하며 단서를 흘려라. ' +
            '사용자가 정확히 짚으면 인정하라.',
        ]
          .filter(Boolean)
          .join('\n\n')
        reply = await requestChatPreview(context, history, text)
      } catch {
        reply = null // 백엔드 불가 — 아래 모의 응답으로 폴백
      }

      if (reply == null) {
        await new Promise((r) => setTimeout(r, 700))
        const replyCount = log.filter((m) => m.role === 'stakeholder').length
        const speaker = stakeholders.length
          ? stakeholders[replyCount % stakeholders.length]
          : null
        const label = speaker ? `${speaker.name} · ${speaker.role}` : '이해관계자'
        reply = `[${label}] (프로토타입 모의 응답) 실서비스에서는 이해관계자가 Sonnet급 에이전트로 응답합니다. 좋은 질문은 공개 입장 뒤의 것을 겨냥합니다.`
      }

      log.push({ role: 'stakeholder', text: reply, at: new Date().toISOString() })
      persist()
    },

    // 기획자 모드 산출물 제출: kind는 'meeting' | 'review'
    submitPlannerDeliverable(missionId, kind, text) {
      const entry = (state.plannerSubmissions[missionId] ??= {})
      entry[kind] = {
        text,
        submittedAt: new Date().toISOString(),
        by: state.learner.nickname || null,
      }
      persist()
    },

    // 성장 기록 페이지용: 제출/설명 이력을 최신순으로 합쳐서 돌려준다.
    historyEntries() {
      const entries = []

      for (const [missionId, versions] of Object.entries(state.submissions)) {
        const mission = state.missions.find((m) => m.id === missionId)
        if (!mission) continue
        versions.forEach((sub, i) => {
          const attempt = i + 1
          entries.push({
            key: `${missionId}-code-${attempt}`,
            missionId,
            mission,
            kind: 'code',
            kindLabel: attempt > 1 ? `코드 제출 · ${attempt}차` : '코드 제출',
            attempt,
            submittedAt: sub.submittedAt,
            by: sub.by ?? null,
          })
        })
      }

      for (const [missionId, exp] of Object.entries(state.explanations)) {
        const mission = state.missions.find((m) => m.id === missionId)
        if (!mission) continue
        entries.push({
          key: `${missionId}-explain`,
          missionId,
          mission,
          kind: 'explain',
          kindLabel: '설명 과제',
          submittedAt: exp.submittedAt,
          by: exp.by ?? null,
        })
      }

      return entries.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    },

    // Chat Agent(Haiku) 호출 — 백엔드 /chat/preview 우선, 실패 시 기존 모의 응답으로 폴백.
    async sendChat(missionId, text) {
      const log = (state.chats[missionId] ??= [])
      const history = log.map((m) => ({ role: m.role, text: m.text }))
      log.push({ role: 'me', text, at: new Date().toISOString() })
      persist()

      let reply = null
      try {
        const mission = state.missions.find((m) => m.id === missionId)
        const context = [
          mission?.title ? `미션: ${mission.title}` : '',
          mission?.briefing?.title ? `브리핑: ${mission.briefing.title}` : '',
          mission?.scenario ? `시나리오:\n${mission.scenario}` : '',
          mission?.requirements?.length
            ? `요구사항 요약:\n- ${mission.requirements.join('\n- ')}`
            : '',
          '너는 이 미션의 선배 개발자/기획자다. 정답 즉답 금지. ' +
            '학습자가 요구사항의 모호한 지점을 물으면 기획자처럼 구체적으로 결정해서 답하라.',
        ]
          .filter(Boolean)
          .join('\n\n')
        reply = await requestChatPreview(context, history, text)
      } catch {
        reply = null // 백엔드 불가 — 기존 모의 응답으로 폴백
      }

      if (reply == null) {
        await new Promise((r) => setTimeout(r, 700))
        reply = mockChatReply(missionId, text)
      }

      log.push({ role: 'agent', text: reply, at: new Date().toISOString() })
      persist()
    },
  }
}

function mockChatReply(missionId, text) {
  if (missionId === 's1-wine-01') {
    if (/(예산|budget|초과|이하)/.test(text)) {
      return '좋은 지점을 짚으셨어요. 예산은 "이하"가 원칙이지만, 초과 폭이 10% 이내면서 점수가 확연히 높은 와인은 보여주고 싶다는 게 운영팀 의견입니다. 이 규칙, 어디에 두실 건가요?'
    }
    if (/(등급|GOLD|골드|할인)/.test(text)) {
      return '등급 할인은 복지몰 전체 정책이라 앞으로 등급이 늘어날 수 있어요(VIP 논의 중). 그걸 감안해서 설계해 주세요.'
    }
  }
  return '[프로토타입 모의 응답] 질문이 기록되었습니다. 실서비스에서는 미션 컨텍스트를 아는 에이전트(Haiku)가 답하고, 이 대화는 리뷰 때 평판 평가에 반영됩니다. 요구사항 중 일부러 모호하게 둔 항목이 있으니, 그걸 짚는 질문이면 가장 좋습니다.'
}

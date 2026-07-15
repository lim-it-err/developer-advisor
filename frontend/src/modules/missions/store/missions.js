// missions 모듈 상태. 프로토타입: 콘텐츠는 정적 샘플, 제출물은 localStorage.
// 실제 서비스에서는 이 파일만 API 클라이언트 호출로 교체된다 (모듈 밖 인터페이스는 동일).
import { reactive } from 'vue'
import sample from '../data/sampleContent.js'
import projectSample from '../data/sampleProjects.js'

const STORAGE_KEY = 'advisor.learner.v1'

// 백엔드 채팅 프리뷰 API. 백엔드가 죽어 있으면 아래 mock 응답으로 조용히 폴백한다.
const API_BASE = import.meta.env.VITE_ADVISOR_API ?? 'http://localhost:8080/api/advisor'
const CHAT_TIMEOUT_MS = 30_000

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
  submissions: persisted.submissions ?? {},   // missionId -> { files, submittedAt, by }
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
    }),
  )
}

export function useMissions() {
  return {
    state,
    stages: STAGES,

    getMission(id) {
      return state.missions.find((m) => m.id === id)
    },

    missionStatus(id) {
      if (state.submissions[id]) return '제출됨'
      return '진행 가능'
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

    submitCode(missionId, files) {
      state.submissions[missionId] = {
        files: files.filter((f) => f.path.trim() && f.content.trim()),
        submittedAt: new Date().toISOString(),
        by: state.learner.nickname || null,
      }
      persist()
    },

    submitExplanation(missionId, text) {
      state.explanations[missionId] = {
        text,
        submittedAt: new Date().toISOString(),
        by: state.learner.nickname || null,
      }
      persist()
    },

    // 프로토타입: 리뷰는 사전 생성된 샘플. 실서비스에서는 Reviewer Agent 호출.
    getReview(missionId) {
      if (!state.submissions[missionId]) return null
      return sample.sampleReviews[missionId] ?? null
    },

    getExplainFeedback(missionId) {
      if (!state.explanations[missionId]) return null
      return sample.sampleExplainFeedback[missionId] ?? null
    },

    // 프로토타입: 평판 샘플. 실서비스에서는 Reviewer가 질문 창 대화를 읽고 생성.
    getReputation(missionId) {
      return sample.sampleReputation?.[missionId] ?? null
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

      for (const [missionId, sub] of Object.entries(state.submissions)) {
        const mission = state.missions.find((m) => m.id === missionId)
        if (!mission) continue
        entries.push({
          key: `${missionId}-code`,
          missionId,
          mission,
          kind: 'code',
          kindLabel: '코드 제출',
          submittedAt: sub.submittedAt,
          by: sub.by ?? null,
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

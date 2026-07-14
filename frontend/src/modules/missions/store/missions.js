// missions 모듈 상태. 프로토타입: 콘텐츠는 정적 샘플, 제출물은 localStorage.
// 실제 서비스에서는 이 파일만 API 클라이언트 호출로 교체된다 (모듈 밖 인터페이스는 동일).
import { reactive } from 'vue'
import sample from '../data/sampleContent.js'

const STORAGE_KEY = 'advisor.learner.v1'

export const STAGES = [
  { no: 1, title: '분리의 감각', question: '이 코드가 변경되는 이유는 몇 개인가?' },
  { no: 2, title: '인터페이스는 계약', question: '호출자는 무엇을 알아야 하고, 무엇을 몰라야 하는가?' },
  { no: 3, title: '의존성 역전', question: '도메인 로직이 DB 없이 테스트되는가?' },
  { no: 4, title: '레거시 길들이기', question: '무엇이 부서질지 모른 채 어떻게 고치는가?' },
  { no: 5, title: '거대한 구조', question: '어디서 모델을 갈라야 하는가?' },
  { no: 6, title: '구조로 세상 읽기', question: '이 시스템의 세계관은 무엇인가?' },
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
  submissions: persisted.submissions ?? {},   // missionId -> { files, submittedAt }
  explanations: persisted.explanations ?? {}, // missionId -> { text, submittedAt }
  chats: persisted.chats ?? {},               // missionId -> [{ role: 'me'|'agent', text, at }]
  // 기획자 모드: 회의 채팅 로그. missionId -> [{ role: 'me'|'stakeholder', text, at }]
  meetingChats: persisted.meetingChats ?? {},
  // 기획자 모드: 합의문/검토서 제출. missionId -> { meeting?: {text, submittedAt}, review?: {text, submittedAt} }
  plannerSubmissions: persisted.plannerSubmissions ?? {},
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

    submitCode(missionId, files) {
      state.submissions[missionId] = {
        files: files.filter((f) => f.path.trim() && f.content.trim()),
        submittedAt: new Date().toISOString(),
      }
      persist()
    },

    submitExplanation(missionId, text) {
      state.explanations[missionId] = { text, submittedAt: new Date().toISOString() }
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

    // 실서비스: 이해관계자 역의 Chat Agent(Sonnet급) 호출. 프로토타입: 모의 응답, 이해관계자 순환.
    async sendMeetingChat(missionId, text, stakeholders = []) {
      const log = (state.meetingChats[missionId] ??= [])
      log.push({ role: 'me', text, at: new Date().toISOString() })
      persist()
      await new Promise((r) => setTimeout(r, 700))
      const replyCount = log.filter((m) => m.role === 'stakeholder').length
      const speaker = stakeholders.length
        ? stakeholders[replyCount % stakeholders.length]
        : null
      const label = speaker ? `${speaker.name} · ${speaker.role}` : '이해관계자'
      log.push({
        role: 'stakeholder',
        text: `[${label}] (프로토타입 모의 응답) 실서비스에서는 이해관계자가 Sonnet급 에이전트로 응답합니다. 좋은 질문은 공개 입장 뒤의 것을 겨냥합니다.`,
        at: new Date().toISOString(),
      })
      persist()
    },

    // 기획자 모드 산출물 제출: kind는 'meeting' | 'review'
    submitPlannerDeliverable(missionId, kind, text) {
      const entry = (state.plannerSubmissions[missionId] ??= {})
      entry[kind] = { text, submittedAt: new Date().toISOString() }
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
        })
      }

      return entries.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    },

    // 실서비스: Chat Agent(Haiku) 호출. 프로토타입: 모의 응답.
    async sendChat(missionId, text) {
      const log = (state.chats[missionId] ??= [])
      log.push({ role: 'me', text, at: new Date().toISOString() })
      persist()
      await new Promise((r) => setTimeout(r, 700))
      log.push({ role: 'agent', text: mockChatReply(missionId, text), at: new Date().toISOString() })
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

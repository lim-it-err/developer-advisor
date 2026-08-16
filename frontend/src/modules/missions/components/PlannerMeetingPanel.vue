<script setup>
// 기획자 · 회의 모드: 이해관계자 회의 시뮬레이션. 채팅으로 협상·챌린지 → 합의문 제출.
import { ref, nextTick, watch } from 'vue'
import { useMissions } from '../store/missions.js'
import MarkdownBlock from './MarkdownBlock.vue'
import NicknamePrompt from './NicknamePrompt.vue'

const props = defineProps({
  missionId: { type: String, required: true },
  plannerMeeting: { type: Object, required: true },
})

const store = useMissions()
const draft = ref('')
const sending = ref(false)
const scroller = ref(null)

const submission = ref(store.getPlannerSubmission(props.missionId, 'meeting'))
const agreementText = ref(submission.value?.text ?? '')

const messages = () => store.meetingMessages(props.missionId)

// 입력 원칙 — 선택 우선: 회의용 좋은 질문 원형. 칩은 탭하는 즉시 전송한다.
const QUESTION_CHIPS = [
  '그 입장의 근거 숫자를 보여주실 수 있나요?',
  '만약 ~라면 어디까지 양보 가능한가요?',
  '이 안건에서 각 팀이 절대 못 물러나는 선은 뭔가요?',
]
const usedChips = ref([])
async function useChip(i, text) {
  if (sending.value || usedChips.value.includes(i)) return
  if (!usedChips.value.includes(i)) usedChips.value.push(i)
  await sendText(text)
}

async function scrollDown() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

watch(() => props.missionId, () => scrollDown())

function startMeeting() {
  store.startMeeting(props.missionId, props.plannerMeeting.opener)
  scrollDown()
}

async function sendText(value) {
  const text = value.trim()
  if (!text || sending.value) return
  sending.value = true
  const p = store.sendMeetingChat(props.missionId, text, props.plannerMeeting.stakeholders ?? [])
  await scrollDown()
  await p
  sending.value = false
  await scrollDown()
}

async function sendDraft() {
  const text = draft.value.trim()
  if (!text || sending.value) return
  draft.value = ''
  await sendText(text)
}

const showNicknamePrompt = ref(false)

function doSubmitAgreement() {
  const text = agreementText.value.trim()
  if (!text) return
  store.submitPlannerDeliverable(props.missionId, 'meeting', text)
  submission.value = store.getPlannerSubmission(props.missionId, 'meeting')
}

function submitAgreement() {
  if (!agreementText.value.trim()) return
  if (store.state.learner.nickname) {
    doSubmitAgreement()
  } else {
    showNicknamePrompt.value = true
  }
}

function onNicknameConfirmed() {
  showNicknamePrompt.value = false
  doSubmitAgreement()
}

function onNicknameCancelled() {
  showNicknamePrompt.value = false
}
</script>

<template>
  <div class="panel">
    <div class="card block">
      <h2 class="panel-title">🤝 회의 목표</h2>
      <p class="goal">{{ plannerMeeting.goal }}</p>
      <MarkdownBlock :source="plannerMeeting.context" />
    </div>

    <div v-if="plannerMeeting.stakeholders?.length" class="card block">
      <h2 class="panel-title">참석자</h2>
      <p class="hint">각자 말하지 않는 것이 있습니다. 회의에서 캐내세요.</p>
      <div class="stakeholders">
        <div
          v-for="s in plannerMeeting.stakeholders"
          :key="s.name"
          class="stakeholder card"
        >
          <div class="sh-name">{{ s.name }}</div>
          <div class="sh-role">{{ s.role }}</div>
          <p class="sh-stance">{{ s.publicStance }}</p>
        </div>
      </div>
    </div>

    <div id="meeting-room" class="card block meeting-room">
      <h2 class="panel-title">회의실</h2>

      <button
        v-if="!messages().length"
        class="btn primary"
        @click="startMeeting"
      >회의 시작</button>

      <template v-else>
        <div ref="scroller" class="messages">
          <div
            v-for="(m, i) in messages()"
            :key="i"
            class="msg"
            :class="m.role"
          >{{ m.text }}</div>
          <div v-if="sending" class="msg stakeholder typing">…</div>
        </div>
        <div class="chip-row">
          <button
            v-for="(c, i) in QUESTION_CHIPS"
            :key="i"
            class="q-chip"
            :class="{ used: usedChips.includes(i) }"
            :disabled="sending || usedChips.includes(i)"
            @click="useChip(i, c)"
          >{{ c }}</button>
        </div>
        <div class="input-row">
          <textarea
            v-model="draft"
            rows="2"
            placeholder="협상하거나 챌린지해 보세요. 공개 입장 뒤에 무엇이 있을지 물어보세요."
            @keydown.enter.exact.prevent="sendDraft"
          ></textarea>
          <button class="btn primary" :disabled="sending || !draft.trim()" @click="sendDraft">전송</button>
        </div>
      </template>
    </div>

    <div class="card block">
      <h2 class="panel-title">📝 합의문 작성</h2>
      <textarea
        v-model="agreementText"
        class="deliverable-input mono"
        rows="10"
        :placeholder="plannerMeeting.deliverable"
      ></textarea>
      <div class="submit-row">
        <button class="btn primary" :disabled="!agreementText.trim()" @click="submitAgreement">제출</button>
        <span v-if="submission" class="dim">
          이전 제출: {{ new Date(submission.submittedAt).toLocaleString('ko-KR') }}
        </span>
      </div>
      <div v-if="submission" class="confirm card">
        합의문이 기록되었습니다. 실서비스에서는 비공개 관심사를 얼마나 캐냈는지가 평가됩니다.
      </div>
    </div>
    <NicknamePrompt
      v-if="showNicknamePrompt"
      @confirmed="onNicknameConfirmed"
      @cancelled="onNicknameCancelled"
    />
  </div>
</template>

<style scoped>
.panel-title { font-size: 16px; margin: 0 0 10px; }
.block { margin-bottom: 16px; }
.goal { font-weight: 600; margin: 0 0 10px; }
.hint { color: var(--fg-dim); font-size: 13px; margin: -2px 0 12px; font-style: italic; }
.stakeholders {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.stakeholder { padding: 14px; }
.sh-name { font-weight: 700; font-size: 14.5px; }
.sh-role { color: var(--accent); font-size: 12.5px; margin: 2px 0 8px; }
.sh-stance { margin: 0; font-size: 13.5px; color: var(--fg-dim); }
.meeting-room .messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
  padding: 4px 2px 12px;
}
.msg {
  max-width: 85%;
  padding: 9px 13px;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.55;
  white-space: pre-wrap;
}
.msg.me {
  align-self: flex-end;
  background: var(--accent);
  color: #10131c;
  border-bottom-right-radius: 4px;
}
.msg.stakeholder {
  align-self: flex-start;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}
.typing { color: var(--fg-dim); }
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.q-chip {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--fg-dim);
  font-size: 12px;
  padding: 7px 12px;
  min-height: 32px;
  text-align: left;
  transition: opacity 0.15s;
}
.q-chip:hover { border-color: var(--accent); color: var(--accent); }
.q-chip.used { opacity: 0.45; }
.input-row { display: flex; gap: 8px; margin-top: 6px; }
.input-row textarea {
  flex: 1;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg);
  padding: 9px 11px;
  font-size: 13.5px;
  font-family: inherit;
  resize: none;
}
.input-row textarea:focus { outline: none; border-color: var(--accent); }
.deliverable-input {
  width: 100%;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--fg);
  padding: 14px;
  font-size: 14px;
  line-height: 1.7;
  font-family: inherit;
  resize: vertical;
}
.deliverable-input:focus { outline: none; border-color: var(--accent); }
.submit-row { display: flex; align-items: center; gap: 14px; margin-top: 12px; }
.dim { color: var(--fg-dim); font-size: 13.5px; }
.confirm {
  margin-top: 14px;
  background: rgba(158, 206, 106, 0.08);
  border-color: rgba(158, 206, 106, 0.3);
  color: var(--good);
  font-size: 13.5px;
  padding: 12px 16px;
}

@media (max-width: 700px) {
  .card { padding: 14px; }
  .stakeholders { grid-template-columns: 1fr; }
  .meeting-room .messages { max-height: 300px; }
  .msg { max-width: 92%; }
  .input-row { flex-wrap: wrap; }
  .input-row textarea { flex: 1 1 100%; }
  .input-row .btn.primary { min-height: 40px; }
  .submit-row { flex-wrap: wrap; }
}
</style>

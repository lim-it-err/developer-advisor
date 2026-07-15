<script setup>
// 기획자 · 회의 모드: 이해관계자 회의 시뮬레이션. 채팅으로 협상·챌린지 → 합의문 제출.
import { ref, nextTick, watch } from 'vue'
import { useMissions } from '../store/missions.js'
import MarkdownBlock from './MarkdownBlock.vue'

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

async function scrollDown() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

watch(() => props.missionId, () => scrollDown())

function startMeeting() {
  store.startMeeting(props.missionId, props.plannerMeeting.opener)
  scrollDown()
}

async function send() {
  const text = draft.value.trim()
  if (!text || sending.value) return
  draft.value = ''
  sending.value = true
  const p = store.sendMeetingChat(props.missionId, text, props.plannerMeeting.stakeholders ?? [])
  await scrollDown()
  await p
  sending.value = false
  await scrollDown()
}

function submitAgreement() {
  const text = agreementText.value.trim()
  if (!text) return
  store.submitPlannerDeliverable(props.missionId, 'meeting', text)
  submission.value = store.getPlannerSubmission(props.missionId, 'meeting')
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

    <div class="card block meeting-room">
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
        <div class="input-row">
          <textarea
            v-model="draft"
            rows="2"
            placeholder="협상하거나 챌린지해 보세요. 공개 입장 뒤에 무엇이 있을지 물어보세요."
            @keydown.enter.exact.prevent="send"
          ></textarea>
          <button class="btn primary" :disabled="sending || !draft.trim()" @click="send">전송</button>
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

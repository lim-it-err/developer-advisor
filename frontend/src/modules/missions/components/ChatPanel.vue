<script setup>
// 미션 중 에이전트(선배/기획자 역할)와 소통하는 질문 창.
// 대화는 리뷰 시 '평판' 평가의 입력이 된다.
import { ref, nextTick, watch } from 'vue'
import { useMissions } from '../store/missions.js'

const props = defineProps({
  missionId: { type: String, required: true },
})

const store = useMissions()
const open = ref(false)
const draft = ref('')
const sending = ref(false)
const scroller = ref(null)

const messages = () => store.chatMessages(props.missionId)

// 입력 원칙 — 선택 우선: 좋은 질문의 원형을 칩으로 제시. 탭하면 입력창에 채워지고, 전송은 사용자가.
// 칩 자체가 "좋은 질문이란 무엇인가"의 교육이라 재사용을 막지 않는다 — 다시 눌러도 된다, 다만 한 번 쓰면 옅어진다.
const QUESTION_CHIPS = [
  '요구사항에 일부러 모호하게 둔 부분이 있나요?',
  '이 규칙은 앞으로 누가, 얼마나 자주 바꾸나요?',
  '경계값 예시를 하나 들어주세요',
]
const usedChips = ref([])
function useChip(i, text) {
  draft.value = text
  if (!usedChips.value.includes(i)) usedChips.value.push(i)
}

async function scrollDown() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

watch(open, (v) => v && scrollDown())

async function send() {
  const text = draft.value.trim()
  if (!text || sending.value) return
  draft.value = ''
  sending.value = true
  const p = store.sendChat(props.missionId, text)
  await scrollDown()
  await p
  sending.value = false
  await scrollDown()
}
</script>

<template>
  <button v-if="!open" class="fab" @click="open = true">
    💬 질문하기
    <span v-if="messages().length" class="count">{{ messages().length }}</span>
  </button>

  <aside v-else class="panel">
    <header class="panel-head">
      <div>
        <div class="title">질문 창</div>
        <div class="sub">선배에게 묻듯이. 대화는 리뷰 때 <strong>평판</strong>에 반영됩니다.</div>
      </div>
      <button class="close" @click="open = false">✕</button>
    </header>

    <div ref="scroller" class="messages">
      <p v-if="!messages().length" class="empty">
        요구사항 중에 일부러 모호하게 둔 게 있습니다.
        임의로 확정하지 말고, 여기서 되물어보세요 — 현업에서 그러듯이.
      </p>
      <div
        v-for="(m, i) in messages()"
        :key="i"
        class="msg"
        :class="m.role"
      >{{ m.text }}</div>
      <div v-if="sending" class="msg agent typing">…</div>
    </div>

    <div class="chip-row">
      <button
        v-for="(c, i) in QUESTION_CHIPS"
        :key="i"
        class="q-chip"
        :class="{ used: usedChips.includes(i) }"
        @click="useChip(i, c)"
      >{{ c }}</button>
    </div>

    <footer class="input-row">
      <textarea
        v-model="draft"
        rows="2"
        placeholder="예: 예산 '이하'가 엄격한 조건인가요? 60,000원 예산에 61,000원 와인은 절대 안 되나요?"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <button class="btn primary" :disabled="sending || !draft.trim()" @click="send">전송</button>
    </footer>
  </aside>
</template>

<style scoped>
.fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 50;
  background: var(--accent);
  color: #10131c;
  border: none;
  border-radius: 999px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
}
.count {
  background: #10131c;
  color: var(--accent);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 12px;
  margin-left: 6px;
}
.panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 380px;
  max-width: 92vw;
  z-index: 60;
  display: flex;
  flex-direction: column;
  background: var(--bg-soft);
  border-left: 1px solid var(--border);
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.4);
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}
.title { font-weight: 700; }
.sub { color: var(--fg-dim); font-size: 12.5px; margin-top: 2px; }
.close { background: none; border: none; color: var(--fg-dim); font-size: 15px; }
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.empty { color: var(--fg-dim); font-size: 13.5px; }
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
.msg.agent {
  align-self: flex-start;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}
.typing { color: var(--fg-dim); }
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px 0;
}
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
.input-row {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--border);
}
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

@media (max-width: 600px) {
  .fab {
    right: 16px;
    bottom: 16px;
    padding: 11px 16px;
    font-size: 13.5px;
  }
  .panel {
    width: 100vw;
    max-width: 100vw;
  }
  .input-row {
    padding: 10px;
    gap: 6px;
  }
  .input-row textarea {
    font-size: 13px;
    padding: 8px 9px;
  }
  .input-row .btn.primary {
    padding: 9px 12px;
    font-size: 13px;
    flex-shrink: 0;
  }
}
</style>

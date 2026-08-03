<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  card: { type: Object, required: true },
  fork: { type: Object, default: null },
  savedForkChoice: { type: String, default: '' },
  initialOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['choose-fork'])

const open = ref(props.initialOpen)
const activeForkChoice = ref(props.savedForkChoice)
const firstChoiceCommitted = ref(Boolean(props.savedForkChoice))

watch(() => props.initialOpen, (value) => {
  if (value) open.value = true
})

watch(() => props.savedForkChoice, (value) => {
  if (!value) return
  firstChoiceCommitted.value = true
  if (!activeForkChoice.value) activeForkChoice.value = value
})

// 독서 카드(bookTitle/insight/csLink)와 시사회 카드(filmTitle/scene/systemReading)를 한 형태로 정규화.
const view = computed(() => {
  const c = props.card
  return c.bookTitle
    ? { kind: '📖 독서', title: c.bookTitle, sub: c.author, body1: c.insight, body1Label: '통찰', body2: c.csLink, body2Label: 'CS로 잇기' }
    : { kind: '🎬 시사회', title: c.filmTitle, sub: '', body1: c.scene, body1Label: '장면', body2: c.systemReading, body2Label: '시스템 독해' }
})

const activeFork = computed(() => props.fork?.choices?.find(
  (choice) => choice.key === activeForkChoice.value,
) ?? null)

function chooseFork(key) {
  activeForkChoice.value = key
  if (firstChoiceCommitted.value) return
  firstChoiceCommitted.value = true
  emit('choose-fork', key)
}
</script>

<template>
  <div class="insight-card card" :class="{ open }" :data-card-id="card.id">
    <button class="head" @click="open = !open">
      <span class="emoji">{{ card.emoji }}</span>
      <span class="titles">
        <span class="kind">{{ view.kind }}</span>
        <span class="title">{{ view.title }}<span v-if="view.sub" class="sub"> · {{ view.sub }}</span></span>
      </span>
      <span class="arrow">{{ open ? '▾' : '▸' }}</span>
    </button>
    <div v-if="open" class="body">
      <div class="sec-label">{{ view.body1Label }}</div>
      <p>{{ view.body1 }}</p>
      <div class="sec-label">{{ view.body2Label }}</div>
      <p>{{ view.body2 }}</p>
      <div class="sec-label">꼬리 질문</div>
      <p class="question">{{ card.question }}</p>
      <section v-if="fork?.choices?.length" class="fork" aria-label="갈래 질문">
        <div class="fork-label">갈래 질문 · 정답 없음</div>
        <p class="fork-question">{{ fork.question }}</p>
        <div class="fork-choices">
          <button
            v-for="choice in fork.choices"
            :key="choice.key"
            class="fork-choice"
            :class="{
              selected: activeForkChoice === choice.key,
              muted: activeForkChoice && activeForkChoice !== choice.key,
            }"
            :aria-pressed="activeForkChoice === choice.key"
            @click="chooseFork(choice.key)"
          >{{ choice.label }}</button>
        </div>
        <p v-if="activeFork" class="fork-response" aria-live="polite">{{ activeFork.response }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.insight-card { padding: 0; border-radius: 14px; overflow: hidden; }
.head {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: none;
  color: var(--fg);
  text-align: left;
  cursor: pointer;
  min-height: 56px;
}
.emoji { font-size: 24px; flex-shrink: 0; }
.titles { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.kind { font-size: 11.5px; color: var(--fg-dim); font-weight: 600; }
.title { font-size: 15px; font-weight: 700; line-height: 1.4; }
.sub { font-weight: 400; color: var(--fg-dim); font-size: 13px; }
.arrow { color: var(--fg-dim); flex-shrink: 0; }
.body { padding: 0 16px 16px; }
.body p { font-size: 14px; line-height: 1.75; margin: 4px 0 14px; }
.sec-label { font-size: 12px; font-weight: 700; color: var(--accent); }
.question { color: var(--fg); background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
.fork { min-width: 0; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border); }
.fork-label { color: var(--warn); font-size: 11.5px; font-weight: 700; }
.fork-question { margin-bottom: 10px !important; font-weight: 700; }
.fork-choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.fork-choice { min-width: 0; min-height: 48px; padding: 9px 11px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-soft); color: var(--fg); font: inherit; font-size: 12.5px; font-weight: 700; line-height: 1.45; text-align: left; overflow-wrap: anywhere; transition: opacity 0.15s, border-color 0.15s, background 0.15s; }
.fork-choice:hover, .fork-choice.selected { border-color: var(--accent); background: var(--accent-soft); }
.fork-choice.muted { opacity: 0.42; }
.fork-choice.muted:hover { opacity: 0.8; }
.fork-response { position: relative; margin: 14px 0 0 !important; padding: 13px 14px; border: 1px solid rgba(122, 162, 247, 0.4); border-radius: 4px 12px 12px 12px; background: var(--accent-soft); overflow-wrap: anywhere; }
.fork-response::before { content: ''; position: absolute; top: -7px; left: 16px; width: 12px; height: 12px; border-top: 1px solid rgba(122, 162, 247, 0.4); border-left: 1px solid rgba(122, 162, 247, 0.4); background: #181e2c; transform: rotate(45deg); }

@media (max-width: 420px) {
  .fork-choices { grid-template-columns: 1fr; }
}
</style>

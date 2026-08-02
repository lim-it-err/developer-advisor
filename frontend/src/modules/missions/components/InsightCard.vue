<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  card: { type: Object, required: true },
  initialOpen: { type: Boolean, default: false },
})

const open = ref(props.initialOpen)

watch(() => props.initialOpen, (value) => {
  if (value) open.value = true
})

// 독서 카드(bookTitle/insight/csLink)와 시사회 카드(filmTitle/scene/systemReading)를 한 형태로 정규화.
const view = computed(() => {
  const c = props.card
  return c.bookTitle
    ? { kind: '📖 독서', title: c.bookTitle, sub: c.author, body1: c.insight, body1Label: '통찰', body2: c.csLink, body2Label: 'CS로 잇기' }
    : { kind: '🎬 시사회', title: c.filmTitle, sub: '', body1: c.scene, body1Label: '장면', body2: c.systemReading, body2Label: '시스템 독해' }
})
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
</style>

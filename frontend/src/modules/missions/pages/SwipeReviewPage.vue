<script setup>
import { computed, ref } from 'vue'
import swipeData from '../data/sampleSwipeCards.js'
import {
  chooseSwipeDecision,
  chooseSwipeReason,
  createSwipeSession,
  currentSwipeCard,
  nextSwipeCard,
  swipeSummary,
} from '../games/swipeEngine.js'

const decisionOptions = [
  { value: 'merge', label: '✅ 머지' },
  { value: 'reject', label: '❌ 반려' },
  { value: 'question', label: '❓ 질문 필요' },
]

const session = ref(createSwipeSession(swipeData.swipeCards, new Date(), swipeData.REASON_TOKENS))
const card = computed(() => currentSwipeCard(session.value))
const revealed = computed(() => session.value.reason != null)
const finished = computed(() => card.value == null)
const summary = computed(() => swipeSummary(session.value))
const currentAnswer = computed(() => session.value.answers.at(-1) ?? null)

function decide(value) {
  session.value = chooseSwipeDecision(session.value, value)
}

function chooseReason(token) {
  session.value = chooseSwipeReason(session.value, token)
}

function next() {
  session.value = nextSwipeCard(session.value)
}

function restart() {
  session.value = createSwipeSession(swipeData.swipeCards, new Date(), swipeData.REASON_TOKENS)
}

function decisionLabel(value) {
  return decisionOptions.find((option) => option.value === value)?.label ?? value
}
</script>

<template>
  <div class="swipe-page">
    <router-link to="/games" class="back-link">← 미니게임</router-link>

    <section class="hero">
      <div class="eyebrow">🃏 오늘의 판정 5장</div>
      <h1>머지 or 반려</h1>
      <p class="dim">판정을 고르고, 근거 하나를 붙이세요. 질문 없이는 판단할 수 없는 코드도 있습니다.</p>
    </section>

    <template v-if="!finished">
      <div class="progress-row">
        <span>{{ session.index + 1 }} / {{ session.deck.length }}</span>
        <span v-if="session.streak">🔥 {{ session.streak }} 연속 정답</span>
      </div>

      <article class="review-card card">
        <h2>{{ card.title }}</h2>
        <pre><code>{{ card.code }}</code></pre>
      </article>

      <section class="choice-block" aria-labelledby="decision-title">
        <h2 id="decision-title">1. 판정</h2>
        <div class="decision-grid">
          <button
            v-for="option in decisionOptions"
            :key="option.value"
            class="choice decision"
            :class="{ selected: session.decision === option.value }"
            :disabled="session.decision != null"
            @click="decide(option.value)"
          >{{ option.label }}</button>
        </div>
      </section>

      <section v-if="session.decision" class="choice-block" aria-labelledby="reason-title">
        <h2 id="reason-title">2. 근거</h2>
        <div class="reason-grid">
          <button
            v-for="token in session.reasonTokens"
            :key="token"
            class="choice reason"
            :class="{ selected: session.reason === token }"
            :disabled="revealed"
            @click="chooseReason(token)"
          >{{ token }}</button>
        </div>
      </section>

      <section v-if="revealed" class="explanation card" aria-live="polite">
        <div class="score-line">
          <span :class="currentAnswer.decisionCorrect ? 'good' : 'bad'">
            판정 {{ currentAnswer.decisionCorrect ? '적중' : '빗나감' }}
          </span>
          <span :class="currentAnswer.reasonCorrect ? 'good' : 'bad'">
            근거 {{ currentAnswer.reasonCorrect ? '적중' : '빗나감' }}
          </span>
        </div>
        <p class="answer-key">정답: {{ decisionLabel(card.correct) }} · {{ card.correctToken }}</p>
        <p>{{ card.explain }}</p>
        <button class="btn next-button" @click="next">
          {{ session.index + 1 === session.deck.length ? '결과 보기' : '다음 카드 →' }}
        </button>
      </section>
    </template>

    <section v-else class="summary card" aria-live="polite">
      <div class="summary-emoji">🏁</div>
      <h2>5장 판정 완료</h2>
      <div class="summary-grid">
        <div><strong>{{ summary.decisionCorrect }} / {{ summary.total }}</strong><span>맞은 판정</span></div>
        <div><strong>{{ summary.reasonCorrect }} / {{ summary.total }}</strong><span>근거 적중</span></div>
        <div><strong>{{ summary.bestStreak }}</strong><span>최고 연속 정답</span></div>
      </div>
      <button class="btn restart-button" @click="restart">같은 오늘 덱 다시 하기</button>
      <router-link to="/games" class="drawer-link">카드 서랍으로 돌아가기</router-link>
    </section>
  </div>
</template>

<style scoped>
.swipe-page { width: 100%; max-width: 680px; margin: 0 auto; min-width: 0; }
.back-link, .drawer-link { color: var(--accent); text-decoration: none; font-size: 13.5px; }
.hero { margin: 18px 0 20px; }
.eyebrow { color: var(--accent); font-size: 12px; font-weight: 700; }
.hero h1 { margin: 4px 0 6px; font-size: 25px; }
.hero p { margin: 0; font-size: 13.5px; line-height: 1.6; }
.progress-row { display: flex; justify-content: space-between; gap: 12px; color: var(--fg-dim); font-size: 13px; margin-bottom: 10px; }
.review-card { padding: 18px; border-radius: 16px; overflow: hidden; }
.review-card h2 { margin: 0 0 14px; font-size: 17px; line-height: 1.45; }
pre { margin: 0; padding: 14px; border-radius: 10px; background: var(--bg); border: 1px solid var(--border); white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
code { font-size: 12.5px; line-height: 1.55; }
.choice-block { margin-top: 18px; }
.choice-block h2 { font-size: 14px; margin: 0 0 9px; }
.decision-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.reason-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.choice { min-height: 46px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-soft); color: var(--fg); font: inherit; font-weight: 700; cursor: pointer; }
.choice.reason { min-height: 42px; padding: 0 14px; font-size: 13px; }
.choice:hover:not(:disabled), .choice.selected { border-color: var(--accent); color: var(--accent); background: rgba(122, 162, 247, 0.12); }
.choice:disabled { cursor: default; opacity: 0.72; }
.choice.selected:disabled { opacity: 1; }
.explanation { margin-top: 18px; padding: 18px; border-radius: 16px; }
.score-line { display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; font-weight: 700; }
.good { color: var(--good); }
.bad { color: var(--bad); }
.answer-key { color: var(--accent); font-weight: 700; font-size: 13px; }
.explanation p { line-height: 1.7; font-size: 14px; }
.next-button, .restart-button { width: 100%; min-height: 48px; font-weight: 700; }
.summary { margin-top: 24px; padding: 24px 18px; text-align: center; border-radius: 16px; }
.summary-emoji { font-size: 38px; }
.summary h2 { margin: 8px 0 18px; }
.summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 20px; }
.summary-grid div { padding: 12px 6px; border-radius: 10px; background: var(--bg-soft); min-width: 0; }
.summary-grid strong { display: block; font-size: 20px; color: var(--accent); }
.summary-grid span { display: block; margin-top: 4px; font-size: 11px; color: var(--fg-dim); line-height: 1.35; }
.drawer-link { display: inline-block; margin-top: 16px; }
.dim { color: var(--fg-dim); }

@media (max-width: 420px) {
  .hero h1 { font-size: 22px; }
  .review-card { padding: 14px; }
  pre { padding: 12px; }
  code { font-size: 11.5px; }
  .decision-grid { grid-template-columns: 1fr; }
  .choice.decision { min-height: 44px; }
  .summary-grid strong { font-size: 17px; }
}
</style>

<script setup>
import { computed, ref } from 'vue'
import { useMissions } from '../store/missions.js'
import InsightCard from '../components/InsightCard.vue'
import cards from '../data/sampleCards.js'

const store = useMissions()

const deck = ref('reading')
const shownCards = computed(() => (deck.value === 'reading' ? cards.readingCards : cards.cinemaCards))

// 코드를 안 쓰고 즉시 할 수 있는 미션 유형만 골라 스낵 목록으로.
const NO_CODE_TYPES = ['코드 판독', '배역극', '설계 리뷰']
const snackMissions = computed(() =>
  store.state.missions.filter((m) => NO_CODE_TYPES.includes(m.missionType)),
)

const upcoming = [
  { emoji: '🃏', name: '머지 or 반려', desc: '코드 카드 판정 + 근거 토큰 — 개발 중' },
  { emoji: '🕵️', name: '사건 파일', desc: '장애 포스트모템 추리 연속극 — 준비 중' },
  { emoji: '📈', name: '시즌제 스탯', desc: '4주 시즌, 안목·언어화·판단·교양 — 준비 중' },
]
</script>

<template>
  <div class="games-page">
    <section class="hero">
      <h1>미니게임</h1>
      <p class="dim">요일에 매이지 않고 아무 때나 — 짧게 읽고, 판정하고, 생각하는 코너.</p>
    </section>

    <section class="block">
      <h2 class="sec">🗂 카드 서랍 <span class="dim">— 읽는 데 3분, 꼬리 질문은 하루 종일</span></h2>
      <div class="deck-tabs">
        <button class="deck-tab" :class="{ active: deck === 'reading' }" @click="deck = 'reading'">📖 독서 ({{ cards.readingCards.length }})</button>
        <button class="deck-tab" :class="{ active: deck === 'cinema' }" @click="deck = 'cinema'">🎬 시사회 ({{ cards.cinemaCards.length }})</button>
      </div>
      <div class="card-list">
        <InsightCard v-for="c in shownCards" :key="c.id" :card="c" />
      </div>
    </section>

    <section class="block">
      <h2 class="sec">🔍 노코드 스낵 <span class="dim">— 코드를 짜지 않고 읽고 판정하는 미션</span></h2>
      <div class="snack-list">
        <router-link v-for="m in snackMissions" :key="m.id" :to="`/missions/${m.id}`" class="snack card">
          <span class="snack-emoji">{{ m.emoji }}</span>
          <span class="snack-body">
            <span class="snack-type">{{ m.missionType }} · {{ m.difficulty }}</span>
            <span class="snack-title">{{ m.title }}</span>
          </span>
        </router-link>
      </div>
    </section>

    <section class="block">
      <h2 class="sec">🎮 준비 중</h2>
      <div class="upcoming-list">
        <div v-for="u in upcoming" :key="u.name" class="upcoming card dim">
          <span class="snack-emoji">{{ u.emoji }}</span>
          <span class="snack-body">
            <span class="snack-title">{{ u.name }}</span>
            <span class="snack-type">{{ u.desc }}</span>
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.games-page { max-width: 560px; margin: 0 auto; }
.hero h1 { font-size: 22px; margin: 0 0 6px; }
.hero p { margin: 0; font-size: 13.5px; }
.block { margin-top: 24px; }
.sec { font-size: 16px; margin: 0 0 12px; }
.sec .dim { font-size: 12.5px; font-weight: 400; }

.deck-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.deck-tab {
  flex: 1;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-soft);
  color: var(--fg-dim);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.deck-tab.active { border-color: var(--accent); color: var(--accent); background: rgba(122, 162, 247, 0.12); }

.card-list, .snack-list, .upcoming-list { display: flex; flex-direction: column; gap: 10px; }

.snack, .upcoming {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  text-decoration: none;
  color: var(--fg);
}
.snack:hover { border-color: var(--accent); }
.snack-emoji { font-size: 24px; flex-shrink: 0; }
.snack-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.snack-type { font-size: 11.5px; color: var(--fg-dim); font-weight: 600; }
.snack-title { font-size: 14.5px; font-weight: 700; line-height: 1.4; }
.dim { color: var(--fg-dim); }
</style>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMissions } from '../store/missions.js'
import NicknamePrompt from '../components/NicknamePrompt.vue'

const router = useRouter()
const store = useMissions()
const { state, stages } = store

const entries = computed(() => store.historyEntries())

// 닉네임 게이트: 성장 기록 페이지 진입 시, 닉네임이 없으면 오버레이로 막는다.
const showNicknamePrompt = ref(false)

onMounted(() => {
  if (!state.learner.nickname) {
    showNicknamePrompt.value = true
  }
})

function onNicknameConfirmed() {
  showNicknamePrompt.value = false
}

function onNicknameCancelled() {
  showNicknamePrompt.value = false
  router.push('/missions')
}

const submittedCount = computed(() => Object.keys(state.submissions).length)
const explainedCount = computed(() => Object.keys(state.explanations).length)

const visitedDomains = computed(() => {
  const seen = new Map()
  for (const e of entries.value) {
    if (!seen.has(e.mission.domain)) seen.set(e.mission.domain, e.mission.domainEmoji)
  }
  return [...seen.values()]
})

const touchedStageSet = computed(() => {
  const s = new Set()
  for (const e of entries.value) s.add(e.mission.stage)
  return s
})

function scoreColor(score) {
  if (score >= 80) return 'var(--good)'
  if (score >= 60) return 'var(--warn)'
  return 'var(--bad)'
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('ko-KR')
}
</script>

<template>
  <div>
    <section class="hero">
      <h1>성장 기록</h1>
      <p class="sub">세상을 구조로 읽은 흔적들</p>
    </section>

    <section class="stats">
      <div class="stat card">
        <div class="stat-num">{{ submittedCount }}</div>
        <div class="stat-label">제출한 미션 수</div>
      </div>
      <div class="stat card">
        <div class="stat-num">{{ explainedCount }}</div>
        <div class="stat-label">설명 과제 수</div>
      </div>
      <div class="stat card">
        <div class="stat-emojis">
          <span v-if="visitedDomains.length">{{ visitedDomains.join(' ') }}</span>
          <span v-else class="dim">—</span>
        </div>
        <div class="stat-label">다녀온 도메인 수 ({{ visitedDomains.length }})</div>
      </div>
      <div class="stat card stages-card">
        <div class="stage-dots">
          <span
            v-for="s in stages"
            :key="s.no"
            class="stage-dot"
            :class="{ on: touchedStageSet.has(s.no) }"
          >S{{ s.no }}</span>
        </div>
        <div class="stat-label">스테이지 진행 현황</div>
      </div>
    </section>

    <section v-if="entries.length" class="timeline">
      <div v-for="e in entries" :key="e.key" class="entry card">
        <div class="entry-top">
          <span class="entry-domain">{{ e.mission.domainEmoji }} {{ e.mission.domain }}</span>
          <span class="chips">
            <span
              v-if="e.mission.difficulty"
              class="chip"
              :class="'diff-' + String(e.mission.difficulty).toLowerCase()"
            >{{ e.mission.difficulty }}</span>
            <span v-if="e.mission.scope" class="chip neutral">{{ e.mission.scope }}</span>
            <span class="chip kind">{{ e.kindLabel }}</span>
          </span>
        </div>
        <router-link :to="`/missions/${e.missionId}`" class="entry-title">{{ e.mission.title }}</router-link>
        <div class="entry-bottom">
          <span class="entry-time-group">
            <span class="entry-time">{{ formatDate(e.submittedAt) }}</span>
            <span v-if="e.by" class="chip neutral by-chip">👤 {{ e.by }}</span>
          </span>
          <router-link
            v-if="store.getReview(e.missionId)"
            :to="`/missions/${e.missionId}/review`"
            class="entry-score"
            :style="{ color: scoreColor(store.getReview(e.missionId).overall) }"
          >
            리뷰 {{ store.getReview(e.missionId).overall }}점 →
          </router-link>
        </div>
      </div>
    </section>

    <section v-else class="empty card">
      <p>아직 기록이 없습니다. 세상은 여전히 if문 범벅인 채로 당신을 기다리고 있습니다.</p>
      <p class="dim">일단 <router-link to="/missions">와인 추천기</router-link>부터 뜯어보러 가볼까요?</p>
    </section>

    <NicknamePrompt
      v-if="showNicknamePrompt"
      @confirmed="onNicknameConfirmed"
      @cancelled="onNicknameCancelled"
    />
  </div>
</template>

<style scoped>
.hero h1 { font-size: 24px; margin: 0 0 6px; }
.sub { color: var(--fg-dim); margin: 0 0 26px; }

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.stat { text-align: center; padding: 18px 14px; }
.stat-num { font-size: 30px; font-weight: 800; color: var(--accent); }
.stat-emojis { font-size: 22px; letter-spacing: 2px; min-height: 30px; line-height: 30px; }
.stat-label { color: var(--fg-dim); font-size: 12.5px; margin-top: 6px; }
.dim { color: var(--fg-dim); }

.stages-card { display: flex; flex-direction: column; justify-content: center; }
.stage-dots { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
.stage-dot {
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--fg-dim);
  border: 1px solid var(--border);
}
.stage-dot.on {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: transparent;
}

.timeline { display: flex; flex-direction: column; gap: 12px; }
.entry { padding: 16px 18px; }
.entry-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.entry-domain { font-size: 13px; color: var(--fg-dim); }
.chips { display: flex; gap: 6px; }
.chip.diff-easy { background: rgba(158, 206, 106, 0.15); color: var(--good); }
.chip.diff-normal { background: var(--accent-soft); color: var(--accent); }
.chip.diff-hard { background: rgba(247, 118, 142, 0.15); color: var(--bad); }
.chip.kind { background: var(--bg-soft); color: var(--fg-dim); }
.entry-title {
  display: block;
  font-weight: 600;
  font-size: 15px;
  line-height: 1.4;
  color: var(--fg);
  text-decoration: none;
  margin-bottom: 12px;
}
.entry-title:hover { color: var(--accent); }
.entry-bottom { display: flex; justify-content: space-between; align-items: center; }
.entry-time-group { display: flex; align-items: center; gap: 8px; }
.entry-time { font-size: 12.5px; color: var(--fg-dim); }
.by-chip { font-size: 11.5px; padding: 1px 8px; }
.entry-score { font-size: 13px; font-weight: 700; text-decoration: none; }

.empty { text-align: center; padding: 40px 20px; color: var(--fg); }
.empty p { margin: 6px 0; }

@media (max-width: 700px) {
  .hero h1 { font-size: 19px; }
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat { padding: 14px 10px; }
  .stat-num { font-size: 24px; }
  .stat-emojis { white-space: normal; word-break: break-word; line-height: 1.5; min-height: 0; }
  .entry { padding: 14px; }
  .entry-top { flex-wrap: wrap; gap: 6px; }
  .chips { flex-wrap: wrap; }
  .entry-bottom { flex-wrap: wrap; gap: 6px; }
}
</style>

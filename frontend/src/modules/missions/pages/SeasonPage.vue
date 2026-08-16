<script setup>
import { computed } from 'vue'
import { useMissions } from '../store/missions.js'

const store = useMissions()
const overview = computed(() => store.seasonOverview())

const stats = [
  { key: 'vision', emoji: '👁', label: '안목', color: '#7aa2f7' },
  { key: 'voice', emoji: '🗣', label: '언어화', color: '#bb9af7' },
  { key: 'judgment', emoji: '🧭', label: '판단', color: '#e0af68' },
  { key: 'culture', emoji: '📚', label: '교양', color: '#9ece6a' },
]

const largestStat = computed(() => Math.max(1, ...stats.map((stat) => overview.value.totals[stat.key])))

function statMeta(key) {
  return stats.find((stat) => stat.key === key) ?? { emoji: '✦', label: key }
}

function sourceLabel(source) {
  const [kind, id] = source.split(':')
  const mission = id ? store.getMission(id) : null
  if (kind === 'mission-submit') return mission ? `미션 제출 · ${mission.title}` : '미션 제출'
  if (kind === 'explanation') return mission ? `설명 훈련 · ${mission.title}` : '설명 훈련'
  if (kind === 'ending-prediction') return mission ? `결말 예측 적중 · ${mission.title}` : '결말 예측 적중'
  if (kind === 'planner-agreement') return mission ? `기획자 합의문 · ${mission.title}` : '기획자 합의문'
  if (kind === 'routine-check') return '루틴 수동 체크'
  if (kind === 'probe-verdict') return '한 번만 물어본다면 · 가설 지목'
  if (kind === 'probe-best') return '한 번만 물어본다면 · 최선의 관측'
  return source
}

function displayDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="season-page">
    <section class="hero">
      <div>
        <div class="eyebrow">4주 성장 기록</div>
        <h1>이번 시즌</h1>
        <p>{{ overview.seasonStart }} — {{ overview.endDate }}</p>
      </div>
      <div class="day-badge" :class="{ ended: overview.ended }">
        <strong>{{ overview.dDay }}</strong>
        <span>{{ overview.ended ? '시즌 완료' : `${overview.day}일차` }}</span>
      </div>
    </section>

    <section class="stat-card card" aria-labelledby="stats-title">
      <div class="section-head">
        <h2 id="stats-title">나의 4스탯</h2>
        <span>총 {{ overview.total }}</span>
      </div>
      <div class="stats">
        <div v-for="stat in stats" :key="stat.key" class="stat-row" :data-stat="stat.key">
          <div class="stat-label"><span>{{ stat.emoji }}</span>{{ stat.label }}</div>
          <div class="stat-track" :aria-label="`${stat.label} ${overview.totals[stat.key]}`">
            <div
              class="stat-fill"
              :style="{ width: `${(overview.totals[stat.key] / largestStat) * 100}%`, background: stat.color }"
            ></div>
          </div>
          <strong class="stat-value">{{ overview.totals[stat.key] }}</strong>
        </div>
      </div>
      <p class="perfect-days">모든 슬롯을 채운 날 {{ overview.perfectDays }}일</p>
    </section>

    <section class="log-block">
      <div class="section-head">
        <h2>최근 적립</h2>
        <span>최대 10건</span>
      </div>
      <div v-if="overview.recentGains.length" class="gain-list">
        <div v-for="(gain, index) in overview.recentGains" :key="`${gain.date}-${gain.source}-${index}`" class="gain card">
          <span class="gain-icon">{{ statMeta(gain.stat).emoji }}</span>
          <span class="gain-body">
            <strong>{{ sourceLabel(gain.source) }}</strong>
            <small>{{ displayDate(gain.date) }} · {{ statMeta(gain.stat).label }}</small>
          </span>
          <strong class="gain-amount">+{{ gain.amount }}</strong>
        </div>
      </div>
      <div v-else class="empty card">
        아직 적립 기록이 없습니다. 오늘의 훈련에서 카드 하나를 읽어 보세요.
      </div>
    </section>

    <section v-if="overview.ended && overview.ending" class="ending card">
      <div class="ending-mark">{{ overview.ending.emoji }}</div>
      <div class="eyebrow">시즌 요약</div>
      <h2>{{ overview.ending.title }}</h2>
      <p class="epigraph">{{ overview.ending.epigraph }}</p>
      <p class="narrative">{{ overview.ending.narrative }}</p>
    </section>
  </div>
</template>

<style scoped>
.season-page { max-width: 640px; margin: 0 auto; }
.hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
.eyebrow { color: var(--accent); font-size: 12px; font-weight: 800; letter-spacing: 0.04em; }
.hero h1 { margin: 4px 0 5px; font-size: 25px; }
.hero p { margin: 0; color: var(--fg-dim); font-size: 13px; }
.day-badge { flex: 0 0 auto; min-width: 84px; padding: 11px 14px; text-align: center; border: 1px solid rgba(122, 162, 247, 0.45); border-radius: 14px; background: var(--accent-soft); }
.day-badge strong, .day-badge span { display: block; }
.day-badge strong { color: var(--accent); font-size: 18px; }
.day-badge span { margin-top: 2px; color: var(--fg-dim); font-size: 11.5px; }
.day-badge.ended { border-color: rgba(158, 206, 106, 0.45); background: rgba(158, 206, 106, 0.08); }
.stat-card { padding: 20px; border-radius: 16px; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.section-head h2 { margin: 0; font-size: 16px; }
.section-head span { color: var(--fg-dim); font-size: 12px; }
.stats { display: flex; flex-direction: column; gap: 13px; }
.stat-row { display: grid; grid-template-columns: 90px minmax(0, 1fr) 28px; align-items: center; gap: 10px; }
.stat-label { font-size: 13.5px; font-weight: 700; }
.stat-label span { margin-right: 6px; }
.stat-track { height: 10px; overflow: hidden; border-radius: 999px; background: var(--bg); border: 1px solid var(--border); }
.stat-fill { min-width: 0; height: 100%; border-radius: inherit; transition: width 0.2s ease; }
.stat-value { text-align: right; font-size: 14px; }
.perfect-days { margin: 15px 0 0; padding-top: 13px; border-top: 1px solid var(--border); color: var(--fg-dim); font-size: 12.5px; }
.log-block { margin-top: 24px; }
.gain-list { display: flex; flex-direction: column; gap: 8px; }
.gain { display: flex; align-items: center; gap: 11px; padding: 12px 14px; border-radius: 12px; }
.gain-icon { font-size: 21px; }
.gain-body { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.gain-body strong { overflow: hidden; font-size: 13.5px; text-overflow: ellipsis; white-space: nowrap; }
.gain-body small { color: var(--fg-dim); font-size: 11.5px; }
.gain-amount { color: var(--good); font-size: 15px; }
.empty { padding: 18px; color: var(--fg-dim); font-size: 13.5px; text-align: center; }
.ending { margin-top: 24px; padding: 24px; border-color: rgba(122, 162, 247, 0.4); border-radius: 16px; background: linear-gradient(180deg, rgba(122, 162, 247, 0.08), transparent 45%), var(--bg-card); }
.ending-mark { font-size: 38px; }
.ending h2 { margin: 6px 0; font-size: 21px; }
.epigraph { margin: 0; color: var(--accent); font-size: 13px; font-weight: 700; }
.narrative { margin: 16px 0 0; font-size: 14px; line-height: 1.8; }

@media (max-width: 480px) {
  .hero h1 { font-size: 22px; }
  .day-badge { min-width: 70px; padding: 9px 10px; }
  .stat-card { padding: 16px; }
  .stat-row { grid-template-columns: 74px minmax(0, 1fr) 24px; gap: 8px; }
  .stat-label { font-size: 12.5px; }
  .gain-body strong { font-size: 12.5px; }
}
</style>

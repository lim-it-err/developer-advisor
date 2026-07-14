<script setup>
import { computed } from 'vue'
import { useMissions } from '../store/missions.js'

const { state, stages, missionStatus } = useMissions()

const missionsByStage = computed(() => {
  const map = {}
  for (const m of state.missions) (map[m.stage] ??= []).push(m)
  return map
})

const doneCount = computed(() => Object.keys(state.submissions).length)
</script>

<template>
  <div>
    <section class="hero">
      <h1>오늘도 세상 하나를 구조로 읽어봅시다</h1>
      <p class="sub">
        도메인 상식 브리핑 → 레거시 리팩토링/기능 추가 → 에이전트 리뷰 → 설명 훈련.
        지금까지 <strong>{{ doneCount }}</strong>개 미션을 제출했습니다.
      </p>
    </section>

    <section class="stages">
      <div
        v-for="s in stages"
        :key="s.no"
        class="stage"
        :class="{ empty: !missionsByStage[s.no] }"
      >
        <div class="stage-head">
          <span class="stage-no">S{{ s.no }}</span>
          <div>
            <div class="stage-title">{{ s.title }}</div>
            <div class="stage-q">“{{ s.question }}”</div>
          </div>
        </div>

        <div v-if="missionsByStage[s.no]" class="mission-cards">
          <router-link
            v-for="m in missionsByStage[s.no]"
            :key="m.id"
            :to="`/missions/${m.id}`"
            class="mission-card card"
          >
            <div class="mc-top">
              <span class="mc-domain">{{ m.domainEmoji }} {{ m.domain }}</span>
              <span class="chips">
                <span
                  v-if="m.difficulty"
                  class="chip"
                  :class="'diff-' + String(m.difficulty).toLowerCase()"
                >{{ m.difficulty }}</span>
                <span class="chip">{{ m.missionType }}</span>
                <span v-if="m.modes?.length > 1" class="chip neutral">🤝 기획자 모드</span>
              </span>
            </div>
            <div class="mc-title">{{ m.title }}</div>
            <div class="mc-bottom">
              <span class="chip neutral">~{{ m.estimatedMinutes }}분<template v-if="m.scope"> · {{ m.scope }}</template></span>
              <span
                class="mc-status"
                :class="{ done: missionStatus(m.id) === '제출됨' }"
              >{{ missionStatus(m.id) }}</span>
            </div>
          </router-link>
        </div>
        <p v-else class="coming">미션 준비 중 — 에이전트가 생성합니다</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero h1 { font-size: 24px; margin: 0 0 6px; }
.sub { color: var(--fg-dim); margin: 0 0 26px; }
.stages { display: flex; flex-direction: column; gap: 18px; }
.stage {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px 20px;
  background: var(--bg-soft);
}
.stage.empty { opacity: 0.55; }
.stage-head { display: flex; gap: 14px; align-items: center; margin-bottom: 6px; }
.stage-no {
  font-weight: 800;
  color: var(--accent);
  font-size: 15px;
  background: var(--accent-soft);
  border-radius: 8px;
  padding: 4px 10px;
}
.stage-title { font-weight: 700; font-size: 16px; }
.stage-q { color: var(--fg-dim); font-size: 13px; }
.coming { color: var(--fg-dim); font-size: 13px; margin: 8px 0 0 4px; }
.mission-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.mission-card { text-decoration: none; color: var(--fg); display: block; transition: border-color 0.15s; }
.mission-card:hover { border-color: var(--accent); }
.mc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.mc-domain { font-size: 13px; color: var(--fg-dim); }
.chips { display: flex; gap: 6px; }
.chip.diff-easy { background: rgba(158, 206, 106, 0.15); color: var(--good); }
.chip.diff-normal { background: var(--accent-soft); color: var(--accent); }
.chip.diff-hard { background: rgba(247, 118, 142, 0.15); color: var(--bad); }
.mc-title { font-weight: 600; font-size: 15px; margin-bottom: 12px; line-height: 1.4; }
.mc-bottom { display: flex; justify-content: space-between; align-items: center; }
.mc-status { font-size: 12.5px; color: var(--fg-dim); }
.mc-status.done { color: var(--good); }
</style>

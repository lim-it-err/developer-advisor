<script setup>
import { computed, ref, watch } from 'vue'
import { inspectBoundaryRound } from '../games/boundaryEngine.js'
import { localDateKey } from '../store/seasonStats.js'
import { useMissions } from '../store/missions.js'

const store = useMissions()
const today = localDateKey()
const round = computed(() => store.boundaryRoundForDate(today))
const session = computed(() => store.state.boundarySessions[today] ?? null)
const view = computed(() => inspectBoundaryRound(round.value, session.value))
const openedKeys = ref([])

watch(() => session.value?.chosenKey, (chosenKey) => {
  if (chosenKey && !openedKeys.value.includes(chosenKey)) openedKeys.value = [chosenKey]
}, { immediate: true })

const openedOutcomes = computed(() => openedKeys.value.map((key) => ({
  boundary: round.value?.boundaries.find((candidate) => candidate.key === key),
  outcome: round.value?.outcomes[key],
})).filter((entry) => entry.boundary && entry.outcome))

function chooseBoundary(key) {
  if (!session.value) {
    store.chooseBoundary(key)
    return
  }
  if (!openedKeys.value.includes(key)) openedKeys.value = [...openedKeys.value, key]
}
</script>

<template>
  <div class="boundary-page">
    <router-link to="/games" class="back-link">← 미니게임</router-link>

    <template v-if="round">
      <header class="hero">
        <div class="eyebrow">{{ round.emoji }} 오늘의 한 판</div>
        <h1>경계선 한 칸</h1>
        <p>어디까지 같은 운명으로 묶을지 고르세요. 실패는 사라지지 않고, 머물 방만 달라집니다.</p>
      </header>

      <section class="situation card" aria-labelledby="boundary-round-title">
        <span class="section-label">상황</span>
        <h2 id="boundary-round-title">{{ round.title }}</h2>
        <p>{{ round.situation }}</p>
      </section>

      <section class="pipeline-block" aria-labelledby="pipeline-title">
        <div class="section-head">
          <div>
            <span class="section-label">업무 흐름</span>
            <h2 id="pipeline-title">세로 파이프라인</h2>
          </div>
          <span v-if="view.chosen" class="fate-legend">같은 운명 구간</span>
        </div>

        <ol class="pipeline">
          <li
            v-for="(step, index) in round.flow"
            :key="step"
            class="flow-step"
            :class="{ grouped: index < view.groupedSteps }"
          >
            <div class="step-card">
              <span class="step-number">{{ index + 1 }}</span>
              <strong>{{ step }}</strong>
              <small v-if="index < view.groupedSteps">함께 성공·실패</small>
            </div>
            <div v-if="view.chosen && index === view.failureIndex" class="timeout-event" aria-live="polite">
              <span>⚡ 타임아웃 발생</span>
              <p>{{ round.failureAt }}</p>
            </div>
          </li>
        </ol>

        <div v-if="view.chosen" class="grouping-note card" aria-live="polite">
          <strong>선택한 묶임</strong>
          <p>{{ view.chosen.grouping }}</p>
        </div>
      </section>

      <section class="choice-block" aria-labelledby="boundary-choice-title">
        <div class="section-head">
          <div>
            <span class="section-label">{{ session ? '결과 비교' : '1 · 경계 선택' }}</span>
            <h2 id="boundary-choice-title">
              {{ session ? '다른 경계였다면?' : '어디까지 묶을까요?' }}
            </h2>
          </div>
          <span v-if="session" class="free-note">비교 열람은 자유</span>
        </div>
        <div class="boundary-list">
          <button
            v-for="boundary in round.boundaries"
            :key="boundary.key"
            class="boundary-button"
            :class="{
              chosen: session?.chosenKey === boundary.key,
              opened: openedKeys.includes(boundary.key),
            }"
            :aria-pressed="openedKeys.includes(boundary.key)"
            @click="chooseBoundary(boundary.key)"
          >
            <span>{{ boundary.label }}</span>
            <small v-if="session?.chosenKey === boundary.key">내 선택 · 변경 불가</small>
            <small v-else-if="openedKeys.includes(boundary.key)">비교 열람 중</small>
          </button>
        </div>
      </section>

      <section v-if="openedOutcomes.length" class="outcomes" aria-labelledby="outcomes-title">
        <h2 id="outcomes-title">선택 이후의 세계</h2>
        <article
          v-for="entry in openedOutcomes"
          :key="entry.boundary.key"
          class="outcome-card card"
          :class="{ primary: entry.boundary.key === session?.chosenKey }"
          aria-live="polite"
        >
          <div class="outcome-head">
            <span>{{ entry.boundary.key === session?.chosenKey ? '내가 그은 경계' : '비교한 경계' }}</span>
            <h3>{{ entry.boundary.label }}</h3>
          </div>
          <dl>
            <div class="kept">
              <dt>지킨 것</dt>
              <dd>{{ entry.outcome.kept }}</dd>
            </div>
            <div class="lost">
              <dt>포기한 것</dt>
              <dd>{{ entry.outcome.lost }}</dd>
            </div>
          </dl>
          <div class="scenario">
            <strong>후일담</strong>
            <p>{{ entry.outcome.scenario }}</p>
          </div>
        </article>
      </section>

      <section v-if="session" class="recommendation card" aria-labelledby="recommend-title">
        <div class="recommend-label">이 상황의 권장 · 정답 아님</div>
        <h2 id="recommend-title">{{ view.recommended?.label }}</h2>
        <p>{{ round.recommendNote }}</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.boundary-page { width: 100%; max-width: 680px; min-width: 0; margin: 0 auto; overflow-wrap: anywhere; }
.back-link { color: var(--accent); text-decoration: none; font-size: 13.5px; }
.hero { margin: 18px 0 20px; }
.eyebrow, .section-label { color: var(--accent); font-size: 12px; font-weight: 800; }
.hero h1 { margin: 4px 0 6px; font-size: 26px; }
.hero p { margin: 0; color: var(--fg-dim); font-size: 13.5px; line-height: 1.6; }
.situation { padding: 20px; border-radius: 16px; }
.situation h2 { margin: 5px 0 10px; font-size: 19px; }
.situation p, .grouping-note p, .recommendation p { margin: 0; font-size: 14px; line-height: 1.75; }
.pipeline-block, .choice-block, .outcomes, .recommendation { margin-top: 26px; }
.section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.section-head h2, .outcomes > h2 { margin: 3px 0 0; font-size: 17px; }
.fate-legend, .free-note { color: var(--fg-dim); font-size: 11.5px; font-weight: 700; }
.fate-legend::before { display: inline-block; width: 8px; height: 8px; margin-right: 5px; border-radius: 2px; background: var(--accent); content: ''; }
.pipeline { margin: 14px 0 0; padding: 0; list-style: none; }
.flow-step { position: relative; min-width: 0; padding: 0 0 20px 28px; }
.flow-step:last-child { padding-bottom: 0; }
.flow-step::before { position: absolute; top: 20px; bottom: -2px; left: 10px; width: 2px; background: var(--border); content: ''; }
.flow-step:last-child::before { display: none; }
.flow-step.grouped::before { width: 3px; background: var(--accent); }
.step-card { position: relative; display: flex; min-width: 0; align-items: center; gap: 10px; padding: 13px 14px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg-soft); }
.step-number { position: absolute; left: -28px; display: grid; width: 22px; height: 22px; place-items: center; border: 2px solid var(--border); border-radius: 50%; background: var(--bg); color: var(--fg-dim); font-size: 10px; font-weight: 800; }
.step-card strong { min-width: 0; font-size: 13.5px; line-height: 1.45; }
.step-card small { margin-left: auto; color: var(--accent); font-size: 10.5px; white-space: nowrap; }
.flow-step.grouped .step-card { border-color: rgba(122, 162, 247, 0.65); background: var(--accent-soft); box-shadow: inset 4px 0 var(--accent); }
.flow-step.grouped .step-number { border-color: var(--accent); color: var(--accent); }
.timeout-event { margin-top: 10px; padding: 12px 14px; border: 1px solid rgba(247, 118, 142, 0.45); border-radius: 10px; background: rgba(247, 118, 142, 0.08); animation: timeout-in 0.25s ease-out; }
.timeout-event span { color: var(--bad); font-size: 12px; font-weight: 800; }
.timeout-event p { margin: 5px 0 0; font-size: 12.5px; line-height: 1.6; }
.grouping-note { margin-top: 14px; padding: 15px 16px; border-color: rgba(122, 162, 247, 0.45); }
.grouping-note strong { display: block; margin-bottom: 4px; color: var(--accent); font-size: 12px; }
.boundary-list { display: grid; gap: 9px; margin-top: 12px; }
.boundary-button { display: flex; width: 100%; min-width: 0; min-height: 52px; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 11px; background: var(--bg-soft); color: var(--fg); font: inherit; font-size: 13.5px; font-weight: 700; line-height: 1.5; text-align: left; cursor: pointer; }
.boundary-button span { min-width: 0; }
.boundary-button small { flex: 0 0 76px; color: var(--fg-dim); font-size: 10.5px; font-weight: 600; text-align: right; }
.boundary-button:hover, .boundary-button.opened { border-color: var(--accent); background: var(--accent-soft); }
.boundary-button.chosen { box-shadow: inset 4px 0 var(--accent); color: var(--accent); }
.outcomes { display: grid; gap: 12px; }
.outcomes > h2 { margin-bottom: 0; }
.outcome-card { min-width: 0; padding: 18px; border-radius: 16px; }
.outcome-card.primary { border-color: rgba(122, 162, 247, 0.55); }
.outcome-head > span { color: var(--accent); font-size: 11px; font-weight: 800; }
.outcome-head h3 { margin: 4px 0 14px; font-size: 15px; line-height: 1.5; }
.outcome-card dl { display: grid; gap: 9px; margin: 0; }
.outcome-card dl > div { padding: 12px; border-radius: 10px; }
.outcome-card dl .kept { background: rgba(158, 206, 106, 0.09); }
.outcome-card dl .lost { background: rgba(247, 118, 142, 0.08); }
.outcome-card dt { margin-bottom: 4px; font-size: 11px; font-weight: 800; }
.kept dt { color: var(--good); }
.lost dt { color: var(--bad); }
.outcome-card dd { margin: 0; font-size: 13px; line-height: 1.65; }
.scenario { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
.scenario strong { font-size: 12px; }
.scenario p { margin: 5px 0 0; font-size: 13.5px; line-height: 1.75; }
.recommendation { padding: 20px; border-color: rgba(224, 175, 104, 0.55); border-radius: 16px; background: linear-gradient(180deg, rgba(224, 175, 104, 0.08), transparent), var(--bg-card); }
.recommend-label { color: var(--warn); font-size: 11.5px; font-weight: 800; }
.recommendation h2 { margin: 5px 0 10px; font-size: 16px; line-height: 1.5; }

@keyframes timeout-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 420px) {
  .hero h1 { font-size: 23px; }
  .situation, .outcome-card, .recommendation { padding: 16px 14px; }
  .step-card { align-items: flex-start; flex-direction: column; gap: 3px; }
  .step-card small { margin-left: 0; white-space: normal; }
  .boundary-button { align-items: flex-start; flex-direction: column; gap: 4px; }
  .boundary-button small { flex-basis: auto; text-align: left; }
}
</style>

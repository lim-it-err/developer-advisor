<script setup>
import { computed, ref } from 'vue'
import { inspectProbeRound } from '../games/probeEngine.js'
import { localDateKey } from '../store/seasonStats.js'
import { useMissions } from '../store/missions.js'

const store = useMissions()
const today = localDateKey()
const viewingDate = ref(today)

const round = computed(() => store.probeRoundForDate(viewingDate.value))
const session = computed(() => store.state.probeSessions[viewingDate.value] ?? null)
const view = computed(() => inspectProbeRound(round.value, session.value))
const isToday = computed(() => viewingDate.value === today)
const pastDates = computed(() => Object.keys(store.state.probeSessions)
  .filter((date) => date < today)
  .sort((a, b) => b.localeCompare(a)))
const otherProbes = computed(() => round.value?.probes.filter(
  (probe) => probe.key !== view.value.probe?.key,
) ?? [])
const correctHypothesis = computed(() => round.value?.hypotheses.find(
  (hypothesis) => hypothesis.key === round.value?.answerKey,
) ?? null)

function observe(probeKey) {
  if (isToday.value) store.chooseProbe(probeKey)
}

function chooseVerdict(verdictKey) {
  if (isToday.value) store.chooseProbeVerdict(verdictKey)
}

function displayDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}
</script>

<template>
  <div class="probe-page">
    <router-link to="/games" class="back-link">← 미니게임</router-link>

    <template v-if="round">
      <header class="hero">
        <div class="eyebrow">{{ round.emoji }} {{ isToday ? '오늘의 한 판' : displayDate(viewingDate) }}</div>
        <h1>한 번만 물어본다면</h1>
        <p class="rule">관측은 한 번뿐. 결과를 본 뒤 가장 그럴듯한 가설을 지목하세요.</p>
      </header>

      <section class="situation card" aria-labelledby="round-title">
        <span class="round-label">상황</span>
        <h2 id="round-title">{{ round.title }}</h2>
        <p>{{ round.situation }}</p>
      </section>

      <section class="step" aria-labelledby="hypothesis-title">
        <div class="step-head">
          <span>가설</span>
          <strong v-if="view.probe">관측 결과로 가능성을 좁혔습니다</strong>
        </div>
        <h2 id="hypothesis-title">무엇이 원인일까요?</h2>
        <div class="hypothesis-list">
          <button
            v-for="hypothesis in round.hypotheses"
            :key="hypothesis.key"
            class="hypothesis"
            :class="{
              eliminated: view.eliminatedKeys.includes(hypothesis.key),
              selected: session?.verdictKey === hypothesis.key,
            }"
            :disabled="!isToday || !view.probe || Boolean(view.verdict)"
            @click="chooseVerdict(hypothesis.key)"
          >
            <span>{{ hypothesis.label }}</span>
            <small v-if="view.eliminatedKeys.includes(hypothesis.key)">관측으로 가능성 낮아짐</small>
          </button>
        </div>
      </section>

      <section class="step" aria-labelledby="probe-title">
        <div class="step-head"><span>1 · 관측</span></div>
        <h2 id="probe-title">딱 하나만 확인할 수 있다면?</h2>
        <div class="probe-list">
          <button
            v-for="probe in round.probes"
            :key="probe.key"
            class="probe-button"
            :class="{ selected: session?.probeKey === probe.key }"
            :disabled="!isToday || Boolean(view.probe)"
            @click="observe(probe.key)"
          >{{ probe.label }}</button>
        </div>
        <p v-if="view.probe" class="locked-note">🔒 관측은 한 번뿐 — 선택을 바꿀 수 없습니다.</p>
      </section>

      <section v-if="view.probe" class="observation card" aria-live="polite">
        <span class="round-label">관측 결과</span>
        <h2>{{ view.probe.label }}</h2>
        <p>{{ view.probe.result }}</p>
        <p v-if="!view.verdict && isToday" class="next-hint">이제 위의 가설 하나를 지목하세요.</p>
      </section>

      <section v-if="view.verdict" class="resolution card" aria-live="polite">
        <div class="result" :class="view.correct ? 'correct' : 'missed'">
          {{ view.correct ? '적중' : '빗나감' }}
        </div>
        <p v-if="!view.correct && correctHypothesis" class="answer">
          가장 잘 설명하는 가설: {{ correctHypothesis.label }}
        </p>

        <h2>사건의 결말</h2>
        <p>{{ round.resolution }}</p>

        <div class="info-note">
          <h3>내 관측의 정보량</h3>
          <p>{{ view.probe.infoNote }}</p>
          <p class="best-probe">
            {{ view.choseBestProbe ? '최선의 관측을 골랐습니다.' : `최선의 관측은 “${view.bestProbe?.label}”였습니다.` }}
          </p>
        </div>

        <details v-if="otherProbes.length" class="other-notes">
          <summary>다른 관측들의 정보량 해설</summary>
          <div v-for="probe in otherProbes" :key="probe.key" class="other-note">
            <strong>{{ probe.label }}</strong>
            <p>{{ probe.infoNote }}</p>
          </div>
        </details>
      </section>

      <section v-if="pastDates.length" class="history" aria-labelledby="history-title">
        <div class="history-head">
          <h2 id="history-title">지난 라운드</h2>
          <button v-if="!isToday" class="today-button" @click="viewingDate = today">오늘로 돌아가기</button>
        </div>
        <div class="history-list">
          <button
            v-for="date in pastDates"
            :key="date"
            :class="{ active: viewingDate === date }"
            @click="viewingDate = date"
          >{{ displayDate(date) }}</button>
        </div>
        <p v-if="!isToday" class="past-note">지난 판은 자유롭게 읽을 수 있지만 선택은 바꿀 수 없습니다.</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.probe-page { width: 100%; max-width: 680px; min-width: 0; margin: 0 auto; overflow-wrap: anywhere; }
.back-link { color: var(--accent); text-decoration: none; font-size: 13.5px; }
.hero { margin: 18px 0 20px; }
.eyebrow, .round-label, .step-head span { color: var(--accent); font-size: 12px; font-weight: 800; }
.hero h1 { margin: 4px 0 6px; font-size: 26px; }
.rule { margin: 0; color: var(--fg-dim); font-size: 13.5px; line-height: 1.6; }
.situation { padding: 20px; border-radius: 16px; }
.situation h2 { margin: 5px 0 10px; font-size: 19px; }
.situation p, .observation p, .resolution > p, .info-note p { margin: 0; font-size: 14px; line-height: 1.75; }
.step { margin-top: 24px; }
.step-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.step-head strong { color: var(--fg-dim); font-size: 11.5px; }
.step > h2 { margin: 4px 0 11px; font-size: 17px; }
.hypothesis-list, .probe-list { display: grid; gap: 9px; }
.hypothesis, .probe-button {
  width: 100%; min-width: 0; min-height: 50px; padding: 12px 14px;
  border: 1px solid var(--border); border-radius: 11px; background: var(--bg-soft);
  color: var(--fg); font: inherit; font-size: 13.5px; font-weight: 650;
  line-height: 1.5; text-align: left; cursor: pointer; overflow-wrap: anywhere;
}
.hypothesis { display: flex; align-items: center; justify-content: space-between; gap: 12px; transition: opacity 0.2s, filter 0.2s; }
.hypothesis small { flex: 0 0 78px; color: var(--fg-dim); font-size: 10.5px; font-weight: 500; text-align: right; }
.hypothesis.eliminated { opacity: 0.38; filter: grayscale(0.8); text-decoration: none; }
.hypothesis:hover:not(:disabled), .probe-button:hover:not(:disabled),
.hypothesis.selected, .probe-button.selected { border-color: var(--accent); background: var(--accent-soft); }
.hypothesis:disabled, .probe-button:disabled { cursor: default; }
.hypothesis:not(.eliminated):disabled, .probe-button:disabled:not(.selected) { opacity: 0.68; }
.hypothesis.selected:disabled, .probe-button.selected:disabled { opacity: 1; color: var(--accent); }
.locked-note, .next-hint, .past-note { margin: 9px 0 0; color: var(--fg-dim); font-size: 12px; }
.observation { margin-top: 18px; padding: 18px; border-color: rgba(122, 162, 247, 0.45); }
.observation h2 { margin: 5px 0 9px; font-size: 15px; }
.next-hint { color: var(--accent); font-weight: 700; }
.resolution { margin-top: 20px; padding: 20px; }
.result { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 800; }
.result.correct { color: var(--good); background: rgba(158, 206, 106, 0.12); }
.result.missed { color: var(--bad); background: rgba(247, 118, 142, 0.12); }
.answer { margin-top: 10px !important; color: var(--accent); font-weight: 700; }
.resolution > h2 { margin: 20px 0 8px; font-size: 17px; }
.info-note { margin-top: 20px; padding: 16px; border-radius: 12px; background: var(--bg-soft); }
.info-note h3 { margin: 0 0 7px; font-size: 15px; }
.best-probe { margin-top: 12px !important; color: var(--accent); font-weight: 750; }
.other-notes { margin-top: 16px; border-top: 1px solid var(--border); }
.other-notes summary { padding: 15px 0 4px; color: var(--accent); font-size: 13px; font-weight: 750; cursor: pointer; }
.other-note { padding: 12px 0 2px; }
.other-note + .other-note { border-top: 1px solid var(--border); }
.other-note strong { font-size: 13px; }
.other-note p { margin: 5px 0 0; color: var(--fg-dim); font-size: 13px; line-height: 1.7; }
.history { margin-top: 28px; }
.history-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.history-head h2 { margin: 0; font-size: 16px; }
.today-button, .history-list button { border: 1px solid var(--border); border-radius: 999px; background: var(--bg-soft); color: var(--fg); font: inherit; font-size: 12px; cursor: pointer; }
.today-button { padding: 7px 11px; }
.history-list { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
.history-list button { padding: 8px 12px; }
.history-list button.active { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

@media (max-width: 420px) {
  .hero h1 { font-size: 23px; }
  .situation, .resolution { padding: 16px 14px; }
  .hypothesis { align-items: flex-start; flex-direction: column; gap: 4px; }
  .hypothesis small { flex-basis: auto; text-align: left; }
}
</style>

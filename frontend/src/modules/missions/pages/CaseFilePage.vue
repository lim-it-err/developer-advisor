<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownBlock from '../components/MarkdownBlock.vue'
import caseFileData from '../data/sampleCaseFiles.js'
import { useMissions } from '../store/missions.js'

const route = useRoute()
const store = useMissions()

const caseId = computed(() => (typeof route.params.caseId === 'string' ? route.params.caseId : ''))
const caseFile = computed(() => caseFileData.caseFiles.find((entry) => entry.id === caseId.value) ?? null)
const progress = computed(() => store.state.caseProgress[caseId.value] ?? null)
const openedDays = computed(() => Math.min(caseFile.value?.days.length ?? 0, progress.value?.openedDays ?? 0))
const openedClues = computed(() => caseFile.value?.days.slice(0, openedDays.value) ?? [])
const finaleUnlocked = computed(() => caseFile.value && openedDays.value >= caseFile.value.days.length)
const verdict = computed(() => progress.value?.verdict ?? null)
const correct = computed(() => verdict.value === caseFile.value?.finale.answerKey)
const correctOption = computed(() => caseFile.value?.finale.options.find(
  (option) => option.key === caseFile.value?.finale.answerKey,
) ?? null)

watch([caseId, caseFile], ([id, current]) => {
  if (id && current) store.openCase(id, current.days.length)
}, { immediate: true })

function binge() {
  if (caseFile.value) store.bingeCase(caseId.value, caseFile.value.days.length)
}

function chooseVerdict(key) {
  if (!caseFile.value) return
  store.chooseCaseVerdict(
    caseId.value,
    key,
    caseFile.value.finale.answerKey,
    caseFile.value.days.length,
  )
}
</script>

<template>
  <div class="case-page">
    <router-link to="/games" class="back-link">← 미니게임</router-link>

    <template v-if="caseFile">
      <header class="hero">
        <div class="eyebrow">{{ caseFile.emoji }} 사건 파일 · {{ openedDays }}/{{ caseFile.days.length }}일</div>
        <h1>{{ caseFile.title }}</h1>
        <p class="tagline">{{ caseFile.tagline }}</p>
        <p class="intro">{{ caseFile.intro }}</p>
      </header>

      <div v-if="openedDays < caseFile.days.length" class="release-note card">
        <div>
          <strong>하루에 단서 하나</strong>
          <p>로컬 날짜가 바뀌면 다음 단서가 열립니다.</p>
        </div>
        <button class="btn binge-button" @click="binge">몰아보기</button>
      </div>

      <section class="clue-list" aria-labelledby="clue-title">
        <h2 id="clue-title">수사 기록</h2>
        <details
          v-for="day in openedClues"
          :key="day.day"
          class="clue card"
          :open="day.day === openedDays"
        >
          <summary>
            <span>Day {{ day.day }} · {{ day.kind }}</span>
            <strong>{{ day.title }}</strong>
          </summary>
          <MarkdownBlock :source="day.content" />
        </details>
      </section>

      <section v-if="finaleUnlocked" class="finale card" aria-labelledby="finale-title">
        <div class="finale-kicker">최종 지목</div>
        <h2 id="finale-title">{{ caseFile.finale.question }}</h2>
        <div class="verdict-list">
          <button
            v-for="option in caseFile.finale.options"
            :key="option.key"
            class="verdict-button"
            :class="{ selected: verdict === option.key }"
            :disabled="Boolean(verdict)"
            @click="chooseVerdict(option.key)"
          >{{ option.label }}</button>
        </div>

        <div v-if="verdict" class="resolution" aria-live="polite">
          <strong class="result" :class="correct ? 'correct' : 'missed'">
            {{ correct ? '적중' : '빗나감' }}
          </strong>
          <p v-if="!correct && correctOption" class="answer">정답: {{ correctOption.label }}</p>
          <h3>해설</h3>
          <MarkdownBlock :source="caseFile.finale.explanation" />
          <h3>에필로그</h3>
          <MarkdownBlock :source="caseFile.finale.epilogue" />
        </div>
      </section>
    </template>

    <section v-else class="not-found card">
      <h1>사건 파일을 찾을 수 없습니다</h1>
      <router-link to="/games">미니게임으로 돌아가기</router-link>
    </section>
  </div>
</template>

<style scoped>
.case-page { width: 100%; max-width: 720px; min-width: 0; margin: 0 auto; overflow-wrap: anywhere; }
.back-link { color: var(--accent); text-decoration: none; font-size: 13.5px; }
.hero { margin: 18px 0 22px; }
.eyebrow, .finale-kicker { color: var(--accent); font-size: 12px; font-weight: 700; }
.hero h1 { margin: 4px 0; font-size: 26px; line-height: 1.35; }
.tagline { margin: 0; color: var(--fg-dim); font-size: 14px; }
.intro { margin: 18px 0 0; line-height: 1.8; font-size: 14px; }
.release-note { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px; }
.release-note p { margin: 2px 0 0; color: var(--fg-dim); font-size: 12.5px; }
.binge-button { flex-shrink: 0; }
.clue-list { margin-top: 26px; }
.clue-list > h2 { margin: 0 0 12px; font-size: 17px; }
.clue { min-width: 0; padding: 0; overflow: hidden; }
.clue + .clue { margin-top: 10px; }
.clue summary { display: flex; flex-direction: column; gap: 3px; padding: 16px 18px; cursor: pointer; list-style-position: inside; }
.clue summary span { color: var(--fg-dim); font-size: 11.5px; font-weight: 700; }
.clue summary strong { font-size: 15px; line-height: 1.45; }
.clue[open] summary { border-bottom: 1px solid var(--border); }
.clue :deep(.md) { min-width: 0; padding: 8px 18px 16px; font-size: 14px; }
.clue :deep(pre) { max-width: 100%; }
.finale { margin-top: 28px; padding: 20px; }
.finale h2 { margin: 4px 0 16px; font-size: 18px; line-height: 1.5; }
.verdict-list { display: grid; gap: 9px; }
.verdict-button { width: 100%; min-width: 0; min-height: 50px; padding: 11px 13px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-soft); color: var(--fg); font: inherit; font-size: 13.5px; line-height: 1.5; text-align: left; overflow-wrap: anywhere; }
.verdict-button:hover:not(:disabled), .verdict-button.selected { border-color: var(--accent); background: var(--accent-soft); }
.verdict-button:disabled { cursor: default; opacity: 0.55; }
.verdict-button.selected:disabled { opacity: 1; color: var(--accent); }
.resolution { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); }
.result { display: inline-block; padding: 3px 11px; border-radius: 999px; font-size: 13px; }
.result.correct { color: var(--good); background: rgba(158, 206, 106, 0.12); }
.result.missed { color: var(--bad); background: rgba(247, 118, 142, 0.12); }
.answer { color: var(--accent); font-size: 13px; font-weight: 700; }
.resolution h3 { margin: 20px 0 4px; font-size: 15px; }
.resolution :deep(.md) { font-size: 14px; }
.not-found { margin-top: 24px; text-align: center; }
.not-found h1 { font-size: 19px; }

@media (max-width: 420px) {
  .hero h1 { font-size: 23px; }
  .release-note { align-items: flex-start; flex-direction: column; }
  .binge-button { width: 100%; min-height: 44px; }
  .clue summary, .clue :deep(.md) { padding-left: 14px; padding-right: 14px; }
  .finale { padding: 16px 14px; }
}
</style>

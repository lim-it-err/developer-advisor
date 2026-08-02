<script setup>
// 입력 원칙 — 선택 우선: findings.md/critique.md를 자유 마크다운 대신 구조화된 카드로 쌓는다.
// 카드 → findings.md 마크다운으로 자동 조립되어 부모의 files(v-model)에 반영된다.
import { ref, computed, watch } from 'vue'
import { useMissions } from '../store/missions.js'

const props = defineProps({
  missionId: { type: String, required: true },
  modelValue: { type: Array, required: true }, // [{ path, content }] — 부모(MissionPage)의 제출 files
})
const emit = defineEmits(['update:modelValue'])

const store = useMissions()

const SEVERITIES = [
  { key: '치명', icon: '🔴' },
  { key: '중요', icon: '🟠' },
  { key: '사소', icon: '🟡' },
]

function blankCard() {
  return { location: '', severity: '중요', symptom: '', cause: '', fix: '' }
}

const draft = store.getFindingsDraft(props.missionId)
const cards = ref(draft.length ? draft.map((c) => ({ ...c })) : [blankCard()])

function addCard() {
  cards.value.push(blankCard())
}

function removeCard(i) {
  if (cards.value.length === 1) {
    cards.value[0] = blankCard()
    return
  }
  cards.value.splice(i, 1)
}

function setSeverity(card, key) {
  card.severity = key
}

function severityIcon(key) {
  return SEVERITIES.find((s) => s.key === key)?.icon ?? ''
}

const assembledMarkdown = computed(() => {
  const filled = cards.value.filter(
    (c) => c.location.trim() || c.symptom.trim() || c.cause.trim() || c.fix.trim(),
  )
  if (!filled.length) return ''
  return filled
    .map((c, i) => {
      const lines = [`## 발견 ${i + 1} — ${c.location.trim() || '(위치 미기재)'}`, '']
      lines.push(`- **심각도**: ${severityIcon(c.severity)} ${c.severity}`)
      if (c.symptom.trim()) lines.push(`- **증상**: ${c.symptom.trim()}`)
      if (c.cause.trim()) lines.push(`- **원인**: ${c.cause.trim()}`)
      if (c.fix.trim()) lines.push(`- **수정 방향**: ${c.fix.trim()}`)
      return lines.join('\n')
    })
    .join('\n\n')
})

// 카드가 바뀔 때마다: (1) 드래프트로 저장 (2) 부모 files를 findings.md 하나로 재조립.
watch(
  cards,
  (val) => {
    store.setFindingsDraft(props.missionId, val.map((c) => ({ ...c })))
    emit('update:modelValue', [{ path: 'findings.md', content: assembledMarkdown.value }])
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <div class="builder">
    <p class="hint">
      위치·심각도·증상·원인을 카드로 쌓으면 findings.md가 자동으로 조립됩니다. 실행은 없습니다 — 읽고 판정하는 훈련입니다.
    </p>

    <div v-for="(c, i) in cards" :key="i" class="finding-card card">
      <div class="card-head">
        <span class="card-no">발견 {{ i + 1 }}</span>
        <button class="remove" title="이 발견 제거" @click="removeCard(i)">✕</button>
      </div>

      <label class="field">
        <span class="field-label">위치</span>
        <input v-model="c.location" type="text" placeholder="예: WineRecommender.java 42번째 줄" />
      </label>

      <div class="field">
        <span class="field-label">심각도</span>
        <div class="severity-buttons">
          <button
            v-for="s in SEVERITIES"
            :key="s.key"
            class="sev-btn"
            :class="{ active: c.severity === s.key }"
            @click="setSeverity(c, s.key)"
          >{{ s.icon }} {{ s.key }}</button>
        </div>
      </div>

      <label class="field">
        <span class="field-label">증상</span>
        <input v-model="c.symptom" type="text" placeholder="무엇이 잘못 동작하는가" />
      </label>

      <label class="field">
        <span class="field-label">원인</span>
        <input v-model="c.cause" type="text" placeholder="왜 그런 일이 벌어지는가" />
      </label>

      <label class="field">
        <span class="field-label">수정 방향 <span class="optional">(선택)</span></span>
        <input v-model="c.fix" type="text" placeholder="어떻게 고칠 것인가" />
      </label>
    </div>

    <button class="btn add-card" @click="addCard">+ 발견 추가</button>

    <details class="preview card">
      <summary>findings.md 미리보기</summary>
      <pre v-if="assembledMarkdown" class="preview-content mono">{{ assembledMarkdown }}</pre>
      <p v-else class="dim">아직 채워진 카드가 없습니다.</p>
    </details>
  </div>
</template>

<style scoped>
.builder { display: flex; flex-direction: column; gap: 14px; }
.hint { color: var(--fg-dim); font-size: 13px; margin: 0; }
.finding-card { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.card-head { display: flex; justify-content: space-between; align-items: center; }
.card-no { font-weight: 700; font-size: 13px; color: var(--accent); }
.remove {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--fg-dim);
  width: 34px;
  min-height: 34px;
}
.remove:hover { color: var(--bad); border-color: var(--bad); }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12.5px; font-weight: 700; color: var(--fg-dim); }
.optional { font-weight: 400; }
.field input {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg);
  padding: 11px 12px;
  font-size: 14px;
  min-height: 44px;
}
.field input:focus { outline: none; border-color: var(--accent); }
.severity-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.sev-btn {
  flex: 1 1 auto;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg-dim);
  font-size: 13.5px;
  font-weight: 600;
  padding: 10px 14px;
  min-height: 44px;
  white-space: nowrap;
}
.sev-btn.active { background: var(--accent-soft); color: var(--accent); border-color: transparent; }
.add-card { width: 100%; min-height: 48px; font-weight: 700; }
.preview { padding: 14px; }
.preview summary { cursor: pointer; font-weight: 600; font-size: 13.5px; color: var(--accent); }
.preview-content {
  margin: 12px 0 0;
  padding: 12px;
  background: var(--code-bg);
  border-radius: 8px;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-x: auto;
}
.dim { color: var(--fg-dim); font-size: 13px; margin: 10px 0 0; }

@media (max-width: 700px) {
  .severity-buttons { flex-wrap: wrap; }
  .sev-btn { flex: 1 1 30%; }
}
</style>

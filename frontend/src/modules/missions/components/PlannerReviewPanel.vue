<script setup>
// 기획자 · 검토 모드: 다차원 검토서 작성. 트레이드오프를 명시한 검토서 제출.
import { ref } from 'vue'
import { useMissions } from '../store/missions.js'
import MarkdownBlock from './MarkdownBlock.vue'

const props = defineProps({
  missionId: { type: String, required: true },
  plannerReview: { type: Object, required: true },
})

const store = useMissions()

const submission = ref(store.getPlannerSubmission(props.missionId, 'review'))
const reviewText = ref(submission.value?.text ?? '')

function submitReview() {
  const text = reviewText.value.trim()
  if (!text) return
  store.submitPlannerDeliverable(props.missionId, 'review', text)
  submission.value = store.getPlannerSubmission(props.missionId, 'review')
}
</script>

<template>
  <div class="panel">
    <div class="card block">
      <h2 class="panel-title">📋 검토 브리핑</h2>
      <MarkdownBlock :source="plannerReview.brief" />
    </div>

    <div v-if="plannerReview.dimensions?.length" class="card block">
      <h2 class="panel-title">검토 관점</h2>
      <div class="dimensions">
        <div
          v-for="d in plannerReview.dimensions"
          :key="d.name"
          class="dimension card"
        >
          <div class="d-name">{{ d.name }}</div>
          <p class="d-question">{{ d.question }}</p>
        </div>
      </div>
    </div>

    <div class="card block">
      <h2 class="panel-title">📝 검토서 작성</h2>
      <textarea
        v-model="reviewText"
        class="deliverable-input mono"
        rows="18"
        :placeholder="plannerReview.deliverable"
      ></textarea>
      <div class="submit-row">
        <button class="btn primary" :disabled="!reviewText.trim()" @click="submitReview">제출</button>
        <span v-if="submission" class="dim">
          이전 제출: {{ new Date(submission.submittedAt).toLocaleString('ko-KR') }}
        </span>
      </div>
      <div v-if="submission" class="confirm card">
        검토서가 기록되었습니다. 트레이드오프 표와 "개발하지 않는 옵션"이 있는지 확인하세요.
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-title { font-size: 16px; margin: 0 0 10px; }
.block { margin-bottom: 16px; }
.dimensions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.dimension { padding: 14px; }
.d-name { font-weight: 700; font-size: 14.5px; color: var(--accent); }
.d-question { margin: 6px 0 0; font-size: 13.5px; color: var(--fg-dim); }
.deliverable-input {
  width: 100%;
  min-height: 320px;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--fg);
  padding: 14px;
  font-size: 14px;
  line-height: 1.7;
  font-family: inherit;
  resize: vertical;
}
.deliverable-input:focus { outline: none; border-color: var(--accent); }
.submit-row { display: flex; align-items: center; gap: 14px; margin-top: 12px; }
.dim { color: var(--fg-dim); font-size: 13.5px; }
.confirm {
  margin-top: 14px;
  background: rgba(158, 206, 106, 0.08);
  border-color: rgba(158, 206, 106, 0.3);
  color: var(--good);
  font-size: 13.5px;
  padding: 12px 16px;
}
</style>

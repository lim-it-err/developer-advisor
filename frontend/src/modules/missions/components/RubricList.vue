<script setup>
import { computed } from 'vue'

const props = defineProps({
  rubric: { type: Array, required: true },
})

const visible = computed(() => props.rubric.filter((r) => r.visibleToLearner))
const hiddenCount = computed(() => props.rubric.length - visible.value.length)
</script>

<template>
  <div class="rubric">
    <div v-for="r in visible" :key="r.name" class="item">
      <div class="head">
        <span class="name">{{ r.name }}</span>
        <span class="chip neutral">{{ r.weight }}%</span>
      </div>
      <p class="desc">{{ r.description }}</p>
    </div>
    <p v-if="hiddenCount > 0" class="hidden-note">
      🔒 비공개 평가 항목 {{ hiddenCount }}개 — 리뷰에서 공개됩니다. 현업처럼, 모든 평가 기준이 미리 주어지지는 않습니다.
    </p>
  </div>
</template>

<style scoped>
.rubric { display: flex; flex-direction: column; gap: 10px; }
.item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--bg-soft);
}
.head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.name { font-weight: 600; font-size: 14px; }
.desc { margin: 6px 0 0; color: var(--fg-dim); font-size: 13px; }
.hidden-note { color: var(--fg-dim); font-size: 13px; margin: 4px 0 0; }
</style>

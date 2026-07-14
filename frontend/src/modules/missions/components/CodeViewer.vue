<script setup>
import { ref } from 'vue'

const props = defineProps({
  files: { type: Array, required: true }, // [{ path, content }]
})

const active = ref(0)
const copied = ref(false)
let copiedTimer = null

async function copyActive() {
  const text = props.files[active.value]?.content ?? ''
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // clipboard API가 막힌 환경(http 등) 폴백
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <div class="viewer">
    <div class="bar">
      <div class="tabs">
        <button
          v-for="(f, i) in files"
          :key="f.path"
          class="tab mono"
          :class="{ active: i === active }"
          @click="active = i"
        >
          {{ f.path }}
        </button>
      </div>
      <button class="copy" :class="{ ok: copied }" @click="copyActive">
        {{ copied ? '✓ 복사됨' : '📋 복사' }}
      </button>
    </div>
    <pre class="code mono"><code>{{ files[active]?.content }}</code></pre>
  </div>
</template>

<style scoped>
.viewer {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
.bar {
  display: flex;
  align-items: flex-end;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--border);
  padding: 6px 8px 0;
}
.tabs {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  flex: 1;
}
.tab {
  border: 1px solid transparent;
  border-bottom: none;
  background: none;
  color: var(--fg-dim);
  font-size: 12.5px;
  padding: 7px 14px;
  border-radius: 8px 8px 0 0;
}
.tab.active {
  background: var(--code-bg);
  color: var(--fg);
  border-color: var(--border);
}
.copy {
  flex-shrink: 0;
  margin: 0 4px 6px 8px;
  border: 1px solid var(--border);
  background: none;
  color: var(--fg-dim);
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 7px;
  white-space: nowrap;
}
.copy:hover { color: var(--fg); border-color: var(--accent); }
.copy.ok { color: var(--good); border-color: var(--good); }
.code {
  margin: 0;
  padding: 16px;
  background: var(--code-bg);
  font-size: 13px;
  line-height: 1.55;
  overflow-x: auto;
  max-height: 520px;
  overflow-y: auto;
}
</style>

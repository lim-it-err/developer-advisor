<script setup>
// 로컬 IDE에서 작성한 파일을 붙여넣어 제출하는 에디터.
const props = defineProps({
  modelValue: { type: Array, required: true }, // [{ path, content }]
})
const emit = defineEmits(['update:modelValue'])

function update(i, key, value) {
  const next = props.modelValue.map((f, idx) => (idx === i ? { ...f, [key]: value } : f))
  emit('update:modelValue', next)
}

function addFile() {
  emit('update:modelValue', [...props.modelValue, { path: '', content: '' }])
}

function removeFile(i) {
  emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
}
</script>

<template>
  <div class="editor">
    <div v-for="(f, i) in modelValue" :key="i" class="file card">
      <div class="file-head">
        <input
          class="path mono"
          :value="f.path"
          placeholder="예: src/main/java/wine/WineRecommender.java"
          @input="update(i, 'path', $event.target.value)"
        />
        <button class="remove" title="파일 제거" @click="removeFile(i)">✕</button>
      </div>
      <textarea
        class="content mono"
        :value="f.content"
        rows="14"
        placeholder="IntelliJ에서 작성한 코드를 여기에 붙여넣으세요"
        @input="update(i, 'content', $event.target.value)"
      ></textarea>
    </div>
    <button class="btn" @click="addFile">+ 파일 추가</button>
  </div>
</template>

<style scoped>
.editor { display: flex; flex-direction: column; gap: 14px; align-items: flex-start; }
.file { width: 100%; padding: 12px; }
.file-head { display: flex; gap: 8px; margin-bottom: 8px; }
.path {
  flex: 1;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--fg);
  padding: 7px 10px;
  font-size: 13px;
}
.remove {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--fg-dim);
  width: 34px;
}
.remove:hover { color: var(--bad); border-color: var(--bad); }
.content {
  width: 100%;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg);
  padding: 12px;
  font-size: 13px;
  line-height: 1.55;
  resize: vertical;
}
.path:focus, .content:focus { outline: none; border-color: var(--accent); }
</style>

<script setup>
// 제출/성장 기록 진입 시 뜨는 닉네임 게이트. 인증 아님 — 기록 구분용 문자열 하나.
import { ref } from 'vue'
import { useMissions } from '../store/missions.js'

const props = defineProps({
  initial: { type: String, default: '' },
})
const emit = defineEmits(['confirmed', 'cancelled'])

const store = useMissions()
const value = ref(props.initial)

function confirm() {
  const name = value.value.trim()
  if (!name) return
  store.setNickname(name)
  emit('confirmed')
}

function cancel() {
  emit('cancelled')
}
</script>

<template>
  <div class="overlay" @click.self="cancel">
    <div class="card modal">
      <button class="close" aria-label="닫기" @click="cancel">✕</button>
      <h2 class="title">기록에 이름을 남깁니다</h2>
      <p class="desc">커밋에 작성자가 있듯, 제출에도 이름이 남습니다. 구분용 닉네임 하나면 됩니다.</p>
      <input
        v-model="value"
        class="input"
        maxlength="12"
        placeholder="예: 김부장"
        autofocus
        @keydown.enter="confirm"
      />
      <button class="btn primary confirm-btn" :disabled="!value.trim()" @click="confirm">확인</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 16, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal {
  position: relative;
  width: 100%;
  max-width: 340px;
  padding: 22px;
  box-sizing: border-box;
}
.close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: var(--fg-dim);
  font-size: 15px;
  line-height: 1;
  padding: 8px;
}
.close:hover { color: var(--fg); }
.title { font-size: 16.5px; margin: 0 8px 10px 0; padding-right: 16px; }
.desc { color: var(--fg-dim); font-size: 13px; margin: 0 0 16px; line-height: 1.6; }
.input {
  display: block;
  width: 100%;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg);
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  margin-bottom: 14px;
  box-sizing: border-box;
}
.input:focus { outline: none; border-color: var(--accent); }
.confirm-btn { width: 100%; text-align: center; }
</style>

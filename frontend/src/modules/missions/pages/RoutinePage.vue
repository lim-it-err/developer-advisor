<script setup>
import { computed, ref } from 'vue'
import { useMissions } from '../store/missions.js'

const store = useMissions()

// 요일 선택: 기본은 오늘. 다른 요일을 고르면 그 요일 덱을 미리보기로 보여준다(체크는 당일에만).
const WEEKDAY_TABS = [
  { day: 1, label: '월' }, { day: 2, label: '화' }, { day: 3, label: '수' },
  { day: 4, label: '목' }, { day: 5, label: '금' }, { day: 6, label: '토' }, { day: 0, label: '일' },
]
const todayDay = new Date().getDay()
const selectedDay = ref(todayDay)
const isToday = computed(() => selectedDay.value === todayDay)

// routineToday()는 호출 시점에 오늘의 완료 슬롯 수를 routineHistory에 기록한다(스토어 쪽 부수효과).
// 미리보기(routineForWeekday)는 부수효과가 없다.
const routine = computed(() =>
  isToday.value ? store.routineToday() : store.routineForWeekday(selectedDay.value),
)

const dateLabel = computed(() =>
  isToday.value
    ? new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    : `${WEEKDAY_TABS.find((t) => t.day === selectedDay.value)?.label}요일 미리보기`,
)

// 현재 어느 슬롯을 강조할지 — 평일(3슬롯)은 시간대(11/17시) 기준, 주말(2슬롯)은 정오 기준으로 반씩.
const currentBandIndex = computed(() => {
  const h = new Date().getHours()
  const n = routine.value.slots.length
  if (n <= 1) return 0
  if (n === 2) return h < 14 ? 0 : 1
  if (h < 11) return 0
  if (h < 17) return 1
  return 2
})

function check(slot) {
  if (slot.checkIndex == null) return
  store.checkRoutineSlot(slot.checkIndex)
}
</script>

<template>
  <div class="routine-page">
    <section class="hero">
      <h1>오늘의 훈련</h1>
      <div class="hero-meta">
        <span class="hero-date">{{ dateLabel }}</span>
        <span v-if="routine.streak > 0" class="chip streak-badge">🔥 {{ routine.streak }}일 연속</span>
      </div>
      <div class="weekday-tabs">
        <button
          v-for="t in WEEKDAY_TABS"
          :key="t.day"
          class="weekday-tab"
          :class="{ active: selectedDay === t.day, today: t.day === todayDay }"
          @click="selectedDay = t.day"
        >{{ t.label }}</button>
      </div>
      <div class="hero-theme">
        <span class="theme-name">{{ routine.name }}</span>
        <span class="theme-tagline">{{ routine.tagline }}</span>
      </div>
      <p v-if="!isToday" class="preview-note dim">
        다른 요일의 덱입니다 — 미션은 지금 바로 해도 되지만, 체크와 스트릭은 당일에만 쌓입니다.
      </p>
    </section>

    <div class="slots">
      <div
        v-for="(s, i) in routine.slots"
        :key="i"
        class="slot card"
        :class="{ active: isToday && currentBandIndex === i, done: isToday && s.done }"
      >
        <div class="slot-top">
          <span class="slot-emoji">{{ s.emoji }}</span>
          <div class="slot-heading">
            <div class="slot-time">{{ s.time }}</div>
            <div class="slot-label">{{ s.label }}</div>
          </div>
          <span v-if="isToday && s.done" class="slot-check">✓ 완료</span>
        </div>

        <router-link v-if="s.linkTo" :to="s.linkTo" class="slot-mission">
          {{ s.title }}
        </router-link>
        <p v-else class="slot-empty dim">오늘 배정할 항목이 없습니다. 세상이 텅 비었습니다.</p>

        <button
          v-if="isToday && s.manualCheckable && !s.done"
          class="btn read-check"
          @click="check(s)"
        >{{ s.checkLabel }}</button>
      </div>
    </div>

    <p class="footer-line dim">
      3칸을 다 채울 필요는 없습니다. 어제의 나보다 한 문단 더 읽었으면 이긴 겁니다.
    </p>
  </div>
</template>

<style scoped>
.routine-page {
  max-width: 480px;
  margin: 0 auto;
}
.hero { margin-bottom: 20px; }
.hero h1 { font-size: 22px; margin: 0 0 8px; }
.hero-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.hero-date { color: var(--fg-dim); font-size: 14px; }
.streak-badge { background: rgba(224, 175, 104, 0.15); color: var(--warn); font-weight: 700; }
.weekday-tabs {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}
.weekday-tab {
  flex: 1;
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-soft);
  color: var(--fg-dim);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.weekday-tab.today { color: var(--fg); }
.weekday-tab.active {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(122, 162, 247, 0.12);
}
.preview-note { font-size: 12.5px; margin: 8px 0 0; }
.hero-theme {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.theme-name { display: block; font-weight: 700; font-size: 14px; color: var(--accent); }
.theme-tagline { display: block; color: var(--fg-dim); font-size: 12.5px; margin-top: 2px; }

.slots {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.slot {
  padding: 18px;
  border-radius: 16px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.slot.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 0 24px rgba(122, 162, 247, 0.18);
}
.slot.done { border-color: rgba(158, 206, 106, 0.4); }

.slot-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.slot-emoji { font-size: 28px; line-height: 1.1; }
.slot-heading { flex: 1; min-width: 0; }
.slot-time { font-size: 12.5px; color: var(--fg-dim); font-weight: 600; }
.slot-label { font-size: 16px; font-weight: 700; margin-top: 2px; }
.slot-check {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--good);
  white-space: nowrap;
  flex-shrink: 0;
}

.slot-mission {
  display: block;
  color: var(--fg);
  text-decoration: none;
  font-size: 14.5px;
  line-height: 1.5;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
}
.slot-mission:hover { border-color: var(--accent); color: var(--accent); }
.slot-empty { font-size: 13.5px; margin: 0; padding: 12px 14px; }

.read-check {
  margin-top: 12px;
  width: 100%;
  min-height: 48px;
  font-size: 15px;
  font-weight: 700;
}

.footer-line {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  line-height: 1.7;
  padding: 0 8px;
}
.dim { color: var(--fg-dim); }

/* 375px가 기본 레이아웃 — 아래는 넓은 화면에서 살짝 여유를 더 주는 정도 */
@media (min-width: 560px) {
  .hero h1 { font-size: 24px; }
  .slot { padding: 20px 22px; }
}
</style>

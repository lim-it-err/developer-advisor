<script setup>
import { computed, ref } from 'vue'
import { useMissions } from '../store/missions.js'
import { PARTS } from '../store/missions.js'

const store = useMissions()
const { state, stages, missionStatus } = store

const routine = computed(() => store.routineToday())
const routineDoneCount = computed(() => routine.value.slots.filter((s) => s.done).length)

const stagesByPart = computed(() =>
  PARTS.map((p) => ({ ...p, stages: stages.filter((s) => s.part === p.no) })),
)

const doneCount = computed(() => Object.keys(state.submissions).length)

// ---- 미션 필터: 난이도 / 범위 / 유형 (그룹 내 OR, 그룹 간 AND) + 텍스트 검색 ----
const FILTER_GROUPS = [
  { key: 'difficulty', label: '난이도', options: ['Easy', 'Normal', 'Hard'] },
  { key: 'scope', label: '범위', options: ['단일 파일', '여러 파일', '모듈 경계'] },
  { key: 'missionType', label: '유형', options: ['리팩토링', '기능 추가', '도메인 로직 구현', '설계 리뷰', '코드 판독', '배역극'] },
]

const selected = ref({ difficulty: [], scope: [], missionType: [] })
const search = ref('')

function toggleFilter(groupKey, option) {
  const list = selected.value[groupKey]
  const i = list.indexOf(option)
  if (i === -1) list.push(option)
  else list.splice(i, 1)
}

const filtersActive = computed(() =>
  FILTER_GROUPS.some((g) => selected.value[g.key].length > 0) || search.value.trim().length > 0,
)

function resetFilters() {
  for (const g of FILTER_GROUPS) selected.value[g.key] = []
  search.value = ''
}

const filteredMissions = computed(() => {
  const q = search.value.trim().toLowerCase()
  return state.missions.filter((m) => {
    for (const g of FILTER_GROUPS) {
      const picked = selected.value[g.key]
      if (picked.length && !picked.includes(m[g.key])) return false
    }
    if (q) {
      const haystack = `${m.title ?? ''} ${m.domain ?? ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
})

const missionsByStage = computed(() => {
  const map = {}
  for (const m of filteredMissions.value) (map[m.stage] ??= []).push(m)
  return map
})

// 필터 적용 중, 매칭 미션이 없는 스테이지는 박스를 통째로 접는다(숨긴다).
const stagesByPartFiltered = computed(() =>
  stagesByPart.value
    .map((p) => ({
      ...p,
      stages: filtersActive.value ? p.stages.filter((s) => missionsByStage.value[s.no]?.length) : p.stages,
    }))
    .filter((p) => !filtersActive.value || p.stages.length),
)
</script>

<template>
  <div>
    <section class="hero">
      <h1>오늘도 세상 하나를 구조로 읽어봅시다</h1>
      <p class="sub">
        도메인 상식 브리핑 → 레거시 리팩토링/기능 추가 → 에이전트 리뷰 → 설명 훈련.
        지금까지 <strong>{{ doneCount }}</strong>개 미션을 제출했습니다.
      </p>
    </section>

    <router-link to="/routine" class="routine-banner card">
      <span class="rb-emojis">
        <span
          v-for="(s, i) in routine.slots"
          :key="i"
          class="rb-emoji"
          :class="{ done: s.done }"
        >{{ s.emoji }}</span>
      </span>
      <span class="rb-text">오늘의 훈련 {{ routineDoneCount }}/{{ routine.slots.length }}</span>
      <span class="rb-arrow">→</span>
    </router-link>

    <router-link v-if="state.projects?.length" to="/projects" class="project-banner card">
      <span class="pb-text">🚲 새로운 모드: 프로젝트 — 맨땅에서</span>
      <span class="pb-arrow">→</span>
    </router-link>

    <section class="filter-bar card">
      <div class="filter-groups">
        <div v-for="g in FILTER_GROUPS" :key="g.key" class="filter-group">
          <span class="filter-group-label">{{ g.label }}</span>
          <div class="chip-toggles">
            <button
              v-for="opt in g.options"
              :key="opt"
              class="chip-toggle"
              :class="{ active: selected[g.key].includes(opt) }"
              @click="toggleFilter(g.key, opt)"
            >{{ opt }}</button>
          </div>
        </div>
        <div class="filter-group filter-search">
          <span class="filter-group-label">검색</span>
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="제목·도메인으로 찾기"
          />
        </div>
      </div>
      <div class="filter-footer">
        <span class="filter-count">
          {{ filtersActive ? `${filteredMissions.length}개 미션 표시 중` : `총 ${state.missions.length}개 미션` }}
        </span>
        <button v-if="filtersActive" class="btn filter-reset" @click="resetFilters">필터 초기화</button>
      </div>
    </section>

    <p v-if="filtersActive && !filteredMissions.length" class="empty-filter dim">
      조건에 맞는 미션이 없습니다. 필터를 좁혔더니 세상이 텅 비었습니다.
    </p>

    <section v-for="p in stagesByPartFiltered" :key="p.no" class="part">
      <div class="part-head">
        <span class="part-no">제{{ p.no }}부</span>
        <span class="part-title">{{ p.title }}</span>
        <span class="part-tagline">{{ p.tagline }}</span>
      </div>
      <div class="stages">
      <div
        v-for="s in p.stages"
        :key="s.no"
        class="stage"
        :class="{ empty: !missionsByStage[s.no] }"
      >
        <div class="stage-head">
          <span class="stage-no">S{{ s.no }}</span>
          <div>
            <div class="stage-title">{{ s.title }}</div>
            <div class="stage-q">“{{ s.question }}”</div>
          </div>
        </div>

        <div v-if="missionsByStage[s.no]" class="mission-cards">
          <router-link
            v-for="m in missionsByStage[s.no]"
            :key="m.id"
            :to="`/missions/${m.id}`"
            class="mission-card card"
          >
            <div class="mc-top">
              <span class="mc-domain">{{ m.domainEmoji }} {{ m.domain }}</span>
              <span class="chips">
                <span
                  v-if="m.difficulty"
                  class="chip"
                  :class="'diff-' + String(m.difficulty).toLowerCase()"
                >{{ m.difficulty }}</span>
                <span class="chip">{{ m.missionType }}</span>
                <span v-if="m.modes?.length > 1" class="chip neutral">🤝 기획자 모드</span>
              </span>
            </div>
            <div class="mc-title">{{ m.title }}</div>
            <div class="mc-bottom">
              <span class="chip neutral">~{{ m.estimatedMinutes }}분<template v-if="m.scope"> · {{ m.scope }}</template></span>
              <span
                class="mc-status"
                :class="{ done: missionStatus(m.id) === '제출됨' }"
              >{{ missionStatus(m.id) }}</span>
            </div>
          </router-link>
        </div>
        <p v-else class="coming">미션 준비 중 — 에이전트가 생성합니다</p>
      </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero h1 { font-size: 24px; margin: 0 0 6px; }
.sub { color: var(--fg-dim); margin: 0 0 26px; }
.routine-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--fg);
  margin-bottom: 12px;
  padding: 10px 18px;
  border-color: var(--border);
  transition: border-color 0.15s;
}
.routine-banner:hover { border-color: var(--accent); }
.rb-emojis { display: inline-flex; gap: 4px; font-size: 16px; }
.rb-emoji { opacity: 0.35; filter: grayscale(0.6); }
.rb-emoji.done { opacity: 1; filter: none; }
.rb-text { font-weight: 600; font-size: 13.5px; }
.rb-arrow { color: var(--accent); font-weight: 700; margin-left: auto; }
.project-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  color: var(--fg);
  margin-bottom: 30px;
  padding: 14px 20px;
  border-color: rgba(122, 162, 247, 0.35);
  background: linear-gradient(90deg, rgba(122, 162, 247, 0.08), transparent 60%), var(--bg-card);
  transition: border-color 0.15s;
}
.project-banner:hover { border-color: var(--accent); }
.pb-text { font-weight: 600; font-size: 14.5px; }
.pb-arrow { color: var(--accent); font-weight: 700; }

.filter-bar { margin-bottom: 24px; padding: 16px 18px; }
.filter-groups { display: flex; flex-wrap: wrap; gap: 18px 28px; }
.filter-group { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.filter-group-label { font-size: 12px; font-weight: 700; color: var(--fg-dim); letter-spacing: 0.3px; }
.chip-toggles { display: flex; flex-wrap: wrap; gap: 6px; max-width: 100%; }
.chip-toggle {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--fg-dim);
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 12px;
  white-space: nowrap;
}
.chip-toggle.active { background: var(--accent-soft); color: var(--accent); border-color: transparent; }
.filter-search { flex: 1 1 200px; }
.search-input {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg);
  padding: 7px 12px;
  font-size: 13px;
  width: 100%;
  max-width: 260px;
}
.search-input:focus { outline: none; border-color: var(--accent); }
.filter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.filter-count { font-size: 12.5px; color: var(--fg-dim); }
.filter-reset { padding: 6px 14px; font-size: 12.5px; min-height: 0; }
.empty-filter { text-align: center; padding: 20px; }

.part { margin-bottom: 34px; }
.part-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.part-no {
  font-weight: 800;
  font-size: 13px;
  color: var(--accent);
  letter-spacing: 0.5px;
}
.part-title { font-weight: 800; font-size: 18px; }
.part-tagline { color: var(--fg-dim); font-size: 12.5px; }
.stages { display: flex; flex-direction: column; gap: 18px; }
.stage {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px 20px;
  background: var(--bg-soft);
}
.stage.empty { opacity: 0.55; }
.stage-head { display: flex; gap: 14px; align-items: center; margin-bottom: 6px; }
.stage-no {
  font-weight: 800;
  color: var(--accent);
  font-size: 15px;
  background: var(--accent-soft);
  border-radius: 8px;
  padding: 4px 10px;
}
.stage-title { font-weight: 700; font-size: 16px; }
.stage-q { color: var(--fg-dim); font-size: 13px; }
.coming { color: var(--fg-dim); font-size: 13px; margin: 8px 0 0 4px; }
.mission-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.mission-card { text-decoration: none; color: var(--fg); display: block; transition: border-color 0.15s; }
.mission-card:hover { border-color: var(--accent); }
.mc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.mc-domain { font-size: 13px; color: var(--fg-dim); }
.chips { display: flex; gap: 6px; }
.chip.diff-easy { background: rgba(158, 206, 106, 0.15); color: var(--good); }
.chip.diff-normal { background: var(--accent-soft); color: var(--accent); }
.chip.diff-hard { background: rgba(247, 118, 142, 0.15); color: var(--bad); }
.mc-title { font-weight: 600; font-size: 15px; margin-bottom: 12px; line-height: 1.4; }
.mc-bottom { display: flex; justify-content: space-between; align-items: center; }
.mc-status { font-size: 12.5px; color: var(--fg-dim); }
.mc-status.done { color: var(--good); }

@media (max-width: 700px) {
  .hero h1 { font-size: 19px; }
  .stage { padding: 14px 14px; }
  .stage-head { flex-wrap: wrap; gap: 8px; }
  .mission-cards {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  .mc-top { flex-wrap: wrap; gap: 6px; }
  .chips { flex-wrap: wrap; }
  .filter-bar { padding: 14px; }
  .filter-groups { gap: 14px; }
  .filter-search { flex-basis: 100%; }
  .search-input { max-width: 100%; }
  .filter-footer { flex-wrap: wrap; }
}

@media (max-width: 400px) {
  .mission-cards {
    grid-template-columns: 1fr;
  }
}
</style>

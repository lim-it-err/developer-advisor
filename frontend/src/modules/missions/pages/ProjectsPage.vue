<script setup>
import { computed } from 'vue'
import { useMissions } from '../store/missions.js'

const store = useMissions()

const projects = computed(() =>
  store.state.projects.map((p) => ({ ...p, progress: store.projectProgress(p.id) })),
)
</script>

<template>
  <div>
    <section class="hero">
      <h1>프로젝트 — 맨땅에서</h1>
      <p class="sub">이번엔 물려받을 코드가 없습니다.</p>
    </section>

    <div v-if="projects.length" class="project-cards">
      <router-link
        v-for="p in projects"
        :key="p.id"
        :to="`/projects/${p.id}`"
        class="project-card card"
      >
        <div class="pc-top">
          <span class="pc-emoji">{{ p.emoji }}</span>
          <span class="pc-domain">{{ p.domain }}</span>
        </div>
        <div class="pc-title">{{ p.title }}</div>
        <p class="pc-pitch">{{ p.pitch }}</p>
        <div class="pc-progress">
          <div class="bar">
            <div
              class="bar-fill"
              :style="{ width: p.progress.total ? `${(p.progress.done / p.progress.total) * 100}%` : '0%' }"
            ></div>
          </div>
          <span class="bar-label">{{ p.progress.done }} / {{ p.progress.total }}</span>
        </div>
      </router-link>
    </div>
    <p v-else class="empty card">첫 프로젝트를 준비 중입니다.</p>
  </div>
</template>

<style scoped>
.hero h1 { font-size: 24px; margin: 0 0 6px; }
.sub { color: var(--fg-dim); margin: 0 0 26px; }
.empty {
  color: var(--fg-dim);
  text-align: center;
  padding: 40px 20px;
}
.project-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.project-card {
  text-decoration: none;
  color: var(--fg);
  display: block;
  transition: border-color 0.15s;
}
.project-card:hover { border-color: var(--accent); }
.pc-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.pc-emoji { font-size: 22px; }
.pc-domain { color: var(--fg-dim); font-size: 13px; }
.pc-title { font-weight: 700; font-size: 16px; margin-bottom: 8px; }
.pc-pitch { color: var(--fg-dim); font-size: 13.5px; margin: 0 0 16px; line-height: 1.6; }
.pc-progress { display: flex; align-items: center; gap: 10px; }
.bar {
  flex: 1;
  height: 6px;
  background: var(--bg-soft);
  border-radius: 999px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.2s;
}
.bar-label { font-size: 12px; color: var(--fg-dim); white-space: nowrap; }

@media (max-width: 700px) {
  .hero h1 { font-size: 19px; }
  .project-cards { grid-template-columns: 1fr; }
}
</style>

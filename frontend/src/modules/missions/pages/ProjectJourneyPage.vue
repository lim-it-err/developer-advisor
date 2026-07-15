<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMissions } from '../store/missions.js'
import MarkdownBlock from '../components/MarkdownBlock.vue'
import FileSubmitEditor from '../components/FileSubmitEditor.vue'
import NicknamePrompt from '../components/NicknamePrompt.vue'

const route = useRoute()
const store = useMissions()

const project = computed(() => store.getProject(route.params.id))

const ICON = { done: '✓', current: '▶', locked: '🔒' }

const nodes = computed(() => {
  const p = project.value
  if (!p?.subMissions?.length) return []
  return p.subMissions.map((sm, i) => {
    const submitted = !!store.state.projectSubmissions[sm.id]
    const unlocked = store.isSubMissionUnlocked(p, i)
    return {
      ...sm,
      index: i,
      submitted,
      submission: store.state.projectSubmissions[sm.id] ?? null,
      status: submitted ? 'done' : unlocked ? 'current' : 'locked',
      review: submitted ? store.getSubReview(sm.id) : null,
    }
  })
})

const progress = computed(() => store.projectProgress(route.params.id))

// 기본으로 열어둘 노드: 지금 해야 할(또는 마지막으로 끝낸) 소미션.
const initialIndex = Math.max(progress.value.currentIndex, 0)
const expandedId = ref(project.value?.subMissions?.[initialIndex]?.id ?? null)

function toggle(node) {
  if (node.status === 'locked') return
  expandedId.value = expandedId.value === node.id ? null : node.id
}

// 소미션별 제출 파일 상태. 지연 초기화 — 기존 제출물이 있으면 그걸로 채운다.
const filesState = reactive({})
function filesFor(smId) {
  if (!filesState[smId]) {
    const existing = store.state.projectSubmissions[smId]
    filesState[smId] = existing?.files?.map((f) => ({ ...f })) ?? [{ path: '', content: '' }]
  }
  return filesState[smId]
}

const submittingId = ref(null)

// 닉네임 게이트: 제출 전 닉네임이 없으면 프롬프트, 확인 시에만 이어간다.
const showNicknamePrompt = ref(false)
let pendingAction = null

function requireNickname(action) {
  if (store.state.learner.nickname) {
    action()
  } else {
    pendingAction = action
    showNicknamePrompt.value = true
  }
}

function onNicknameConfirmed() {
  showNicknamePrompt.value = false
  const action = pendingAction
  pendingAction = null
  if (action) action()
}

function onNicknameCancelled() {
  showNicknamePrompt.value = false
  pendingAction = null
}

function doSubmit(node) {
  submittingId.value = node.id
  store.submitSubMission(node.id, filesFor(node.id))
  // 실서비스: Reviewer Agent 호출. 프로토타입은 샘플 리뷰로 즉시 반영.
  setTimeout(() => {
    submittingId.value = null
  }, 700)
}

function submit(node) {
  requireNickname(() => doSubmit(node))
}

function scoreColor(score) {
  if (score >= 80) return 'var(--good)'
  if (score >= 60) return 'var(--warn)'
  return 'var(--bad)'
}
</script>

<template>
  <div v-if="project">
    <router-link to="/projects" class="back">← 프로젝트 목록</router-link>

    <div class="head">
      <div class="head-meta">
        <span class="chip">{{ project.emoji }} {{ project.domain }}</span>
      </div>
      <h1>{{ project.title }}</h1>
      <p class="pitch">{{ project.pitch }}</p>
    </div>

    <details v-if="project.briefing" class="card briefing" open>
      <summary>{{ project.briefing.title }}</summary>
      <MarkdownBlock :source="project.briefing.content" />
    </details>

    <div class="progress-row">
      <div class="bar">
        <div
          class="bar-fill"
          :style="{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : '0%' }"
        ></div>
      </div>
      <span class="bar-label">{{ progress.done }} / {{ progress.total }}</span>
    </div>

    <div v-if="nodes.length" class="chain">
      <div v-for="node in nodes" :key="node.id" class="node-row">
        <div class="node-rail">
          <div class="node-icon" :class="node.status">{{ ICON[node.status] }}</div>
          <div
            v-if="node.index < nodes.length - 1"
            class="node-connector"
            :class="{ done: node.status === 'done' }"
          ></div>
        </div>

        <div class="node-body">
          <button
            class="node-card"
            :class="node.status"
            :disabled="node.status === 'locked'"
            @click="toggle(node)"
          >
            <div class="node-card-top">
              <span class="node-title">{{ node.title }}</span>
              <span class="node-minutes">~{{ node.estimatedMinutes }}분</span>
            </div>
            <div class="node-goal">{{ node.goal }}</div>
          </button>

          <div v-if="expandedId === node.id && node.status !== 'locked'" class="node-panel card">
            <div v-if="node.carryForward" class="carry-notice">
              이전 소미션의 제출물 위에 쌓입니다 — 어제의 코드가 오늘의 레거시입니다.
            </div>

            <MarkdownBlock :source="node.brief" />

            <div v-if="node.keyDecisions?.length" class="key-decisions">
              <h3>스스로 결정하세요</h3>
              <ul>
                <li v-for="kd in node.keyDecisions" :key="kd">☐ {{ kd }}</li>
              </ul>
            </div>

            <p class="deliverable"><strong>제출물</strong> — {{ node.deliverable }}</p>

            <template v-if="!node.submitted">
              <FileSubmitEditor
                :model-value="filesFor(node.id)"
                @update:model-value="(v) => (filesState[node.id] = v)"
              />
              <div class="submit-row">
                <button
                  class="btn primary"
                  :disabled="submittingId === node.id"
                  @click="submit(node)"
                >
                  {{ submittingId === node.id ? '리뷰 요청 중…' : '제출하고 리뷰 받기' }}
                </button>
              </div>
            </template>

            <template v-else>
              <p class="submitted-at dim">
                제출됨 · {{ new Date(node.submission.submittedAt).toLocaleString('ko-KR') }}
              </p>

              <div v-if="node.review" class="sub-review">
                <div class="sr-overall-row">
                  <div class="sr-overall" :style="{ color: scoreColor(node.review.overall) }">
                    {{ node.review.overall }}
                  </div>
                  <p class="sr-summary">{{ node.review.summary }}</p>
                </div>
                <div class="sr-items">
                  <div v-for="item in node.review.items" :key="item.aspect" class="sr-item">
                    <div class="sr-aspect">{{ item.aspect }}</div>
                    <p class="sr-feedback">{{ item.feedback }}</p>
                  </div>
                </div>
                <div v-if="node.review.nextForward" class="sr-next">
                  <span class="sr-next-label">다음 소미션 예고</span>
                  <p>{{ node.review.nextForward }}</p>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="empty card">소미션을 준비 중입니다.</p>

    <NicknamePrompt
      v-if="showNicknamePrompt"
      @confirmed="onNicknameConfirmed"
      @cancelled="onNicknameCancelled"
    />
  </div>
  <p v-else class="empty card">존재하지 않는 프로젝트입니다.</p>
</template>

<style scoped>
.back { font-size: 13px; text-decoration: none; color: var(--fg-dim); }
.back:hover { color: var(--accent); }
.head { margin: 14px 0 18px; }
.head-meta { display: flex; gap: 8px; margin-bottom: 10px; }
h1 { font-size: 22px; margin: 0 0 6px; }
.pitch { color: var(--fg-dim); margin: 0; font-size: 14px; }

.briefing { margin-bottom: 20px; }
.briefing summary {
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  list-style: none;
}
.briefing summary::-webkit-details-marker { display: none; }
.briefing summary::before { content: '▸ '; color: var(--accent); }
.briefing[open] summary::before { content: '▾ '; }

.progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 26px; }
.bar { flex: 1; height: 6px; background: var(--bg-soft); border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.2s; }
.bar-label { font-size: 12px; color: var(--fg-dim); white-space: nowrap; }

.empty { color: var(--fg-dim); text-align: center; padding: 40px 20px; }

.chain { display: flex; flex-direction: column; }
.node-row { display: grid; grid-template-columns: 34px 1fr; gap: 14px; }
.node-rail { display: flex; flex-direction: column; align-items: center; }
.node-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  color: var(--fg-dim);
  flex-shrink: 0;
}
.node-icon.done { background: rgba(158, 206, 106, 0.15); border-color: var(--good); color: var(--good); }
.node-icon.current { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
.node-icon.locked { opacity: 0.6; }
.node-connector {
  flex: 1;
  width: 2px;
  min-height: 24px;
  background: var(--border);
  margin: 2px 0;
}
.node-connector.done { background: var(--good); }
.node-body { padding-bottom: 20px; min-width: 0; }
.node-card {
  width: 100%;
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  color: var(--fg);
  transition: border-color 0.15s;
}
.node-card:not(:disabled):hover { border-color: var(--accent); }
.node-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}
.node-card.current { border-color: rgba(122, 162, 247, 0.4); }
.node-card.done { border-color: rgba(158, 206, 106, 0.3); }
.node-card-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 4px; }
.node-title { font-weight: 700; font-size: 15px; }
.node-minutes { font-size: 12px; color: var(--fg-dim); white-space: nowrap; }
.node-goal { font-size: 13.5px; color: var(--fg-dim); }

.node-panel {
  margin-top: 10px;
  padding: 18px;
}
.carry-notice {
  margin-bottom: 14px;
  padding: 10px 14px;
  border: 1px dashed var(--warn);
  border-radius: 10px;
  background: rgba(224, 175, 104, 0.08);
  color: var(--warn);
  font-size: 13.5px;
}
.key-decisions { margin: 16px 0; }
.key-decisions h3 { font-size: 14px; margin: 0 0 8px; color: var(--accent); }
.key-decisions ul { margin: 0; padding-left: 4px; list-style: none; }
.key-decisions li { margin: 6px 0; font-size: 13.5px; }
.deliverable {
  font-size: 13.5px;
  margin: 14px 0;
  padding: 10px 14px;
  background: var(--bg-soft);
  border-radius: 8px;
}
.submit-row { margin-top: 16px; }
.submitted-at { margin: 0 0 14px; }
.dim { color: var(--fg-dim); font-size: 13px; }

.sub-review {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  background: var(--bg-soft);
}
.sr-overall-row { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
.sr-overall { font-size: 32px; font-weight: 800; }
.sr-summary { margin: 0; font-size: 14px; }
.sr-items { display: flex; flex-direction: column; gap: 10px; }
.sr-item { border-top: 1px solid var(--border); padding-top: 10px; }
.sr-aspect { font-weight: 600; font-size: 13.5px; margin-bottom: 4px; }
.sr-feedback { margin: 0; font-size: 13.5px; color: var(--fg-dim); }
.sr-next {
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px dashed var(--accent);
  border-radius: 10px;
  background: var(--accent-soft);
}
.sr-next-label { font-weight: 700; font-size: 12.5px; color: var(--accent); }
.sr-next p { margin: 6px 0 0; font-size: 13.5px; }

@media (max-width: 700px) {
  h1 { font-size: 19px; }
  .node-row { grid-template-columns: 28px 1fr; gap: 10px; }
  .node-icon { width: 28px; height: 28px; font-size: 12px; }
  .node-card { padding: 12px; }
  .node-panel { padding: 14px; }
  .sr-overall { font-size: 26px; }
  .submit-row .btn.primary { width: 100%; text-align: center; min-height: 40px; }
}
</style>

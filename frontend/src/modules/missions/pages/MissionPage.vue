<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMissions } from '../store/missions.js'
import MarkdownBlock from '../components/MarkdownBlock.vue'
import CodeViewer from '../components/CodeViewer.vue'
import FileSubmitEditor from '../components/FileSubmitEditor.vue'
import RubricList from '../components/RubricList.vue'
import ChatPanel from '../components/ChatPanel.vue'
import PlannerMeetingPanel from '../components/PlannerMeetingPanel.vue'
import PlannerReviewPanel from '../components/PlannerReviewPanel.vue'
import NicknamePrompt from '../components/NicknamePrompt.vue'

const route = useRoute()
const router = useRouter()
const store = useMissions()

const mission = computed(() => store.getMission(route.params.id))
const isDomainLogic = computed(() => mission.value?.missionType === '도메인 로직 구현')

// 기획자 모드: mission.modes가 2개 이상일 때만 선택창 표시. 기본은 항상 개발자 모드.
const MODE_META = {
  developer: { label: '💻 개발자' },
  plannerMeeting: { label: '🤝 기획자 · 회의' },
  plannerReview: { label: '📋 기획자 · 검토' },
}
const mode = ref('developer')

// 결말 분기 상태창 메타 (grade: calm | hotfix | dawn | hidden)
const ENDING_META = {
  calm: { icon: '☕' },
  hotfix: { icon: '🔧' },
  dawn: { icon: '🚨' },
  hidden: { icon: '🔒' },
}

const TABS = ['도메인 브리핑', '미션', '제출', '설명 훈련']
const tab = ref('도메인 브리핑')

// 제출 상태
const existing = store.state.submissions[route.params.id]
const files = ref(
  existing?.files?.map((f) => ({ ...f })) ?? [{ path: '', content: '' }],
)
const submitting = ref(false)

// 닉네임 게이트: 제출 액션 전, 닉네임이 없으면 프롬프트를 띄우고 확인 시에만 이어간다.
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

function doSubmit() {
  submitting.value = true
  store.submitCode(mission.value.id, files.value)
  // 실서비스: Reviewer Agent 호출 (20~60초). 프로토타입은 샘플 리뷰로 즉시 이동.
  setTimeout(() => {
    submitting.value = false
    router.push(`/missions/${mission.value.id}/review`)
  }, 900)
}

function submit() {
  requireNickname(doSubmit)
}

// 설명 훈련
const explainText = ref(store.state.explanations[route.params.id]?.text ?? '')

function doSubmitExplanation() {
  store.submitExplanation(mission.value.id, explainText.value)
  router.push(`/missions/${mission.value.id}/review?focus=explain`)
}

function submitExplanation() {
  requireNickname(doSubmitExplanation)
}
</script>

<template>
  <div v-if="mission">
    <router-link to="/missions" class="back">← 미션 목록</router-link>

    <div class="head">
      <div class="head-meta">
        <span class="chip">S{{ mission.stage }} · {{ mission.stageTitle }}</span>
        <span class="chip neutral">{{ mission.missionType }}</span>
        <span
          v-if="mission.difficulty"
          class="chip"
          :class="'diff-' + String(mission.difficulty).toLowerCase()"
        >{{ mission.difficulty }}</span>
        <span v-if="mission.scope" class="chip neutral">📐 {{ mission.scope }}</span>
        <span class="chip neutral">{{ mission.domainEmoji }} {{ mission.domain }}</span>
      </div>
      <h1>{{ mission.title }}</h1>
    </div>

    <!-- 기획자 모드: 같은 문제, 다른 의자 -->
    <div v-if="mission.modes?.length > 1" class="mode-select">
      <button
        v-for="m in mission.modes"
        :key="m"
        class="mode-btn"
        :class="{ active: mode === m }"
        @click="mode = m"
      >{{ MODE_META[m]?.label ?? m }}</button>
    </div>

    <PlannerMeetingPanel
      v-if="mode === 'plannerMeeting' && mission.plannerMeeting"
      :mission-id="mission.id"
      :planner-meeting="mission.plannerMeeting"
    />
    <PlannerReviewPanel
      v-else-if="mode === 'plannerReview' && mission.plannerReview"
      :mission-id="mission.id"
      :planner-review="mission.plannerReview"
    />

    <template v-else>
    <nav class="tabs">
      <button
        v-for="t in TABS"
        :key="t"
        class="tab"
        :class="{ active: tab === t }"
        @click="tab = t"
      >{{ t }}</button>
    </nav>

    <!-- 도메인 브리핑: 코드 전에 세상 먼저 -->
    <section v-if="tab === '도메인 브리핑'" class="panel card">
      <h2 class="panel-title">{{ mission.briefing.title }}</h2>
      <MarkdownBlock :source="mission.briefing.content" />
      <div class="panel-next">
        <button class="btn primary" @click="tab = '미션'">브리핑 읽었어요 → 미션 보기</button>
      </div>
    </section>

    <!-- 미션: 시나리오 + 레거시 + 요구사항 -->
    <section v-if="tab === '미션'" class="panel">
      <div class="card block">
        <h2 class="panel-title">상황</h2>
        <MarkdownBlock :source="mission.scenario" />
      </div>

      <!-- 결말 분기: 이 코드의 가능한 미래들 (게임 상태창) -->
      <div v-if="mission.endings?.length" class="card block endings">
        <h2 class="panel-title">🎮 결말 분기 <span class="endings-sub">— 이 코드의 가능한 미래들. 리뷰의 시나리오가 도달한 결말을 알려줍니다.</span></h2>
        <div class="ending-rows">
          <div
            v-for="e in mission.endings"
            :key="e.grade"
            class="ending"
            :class="[e.grade]"
          >
            <span class="ending-icon">{{ ENDING_META[e.grade]?.icon ?? '❓' }}</span>
            <span class="ending-title">{{ e.title }}</span>
            <span class="ending-teaser">{{ e.teaser }}</span>
          </div>
        </div>
      </div>

      <div v-if="mission.providedFiles?.length" class="card block engine">
        <h2 class="panel-title">⚙️ 제공 코드 — 엔진</h2>
        <p class="dim">
          이미 구현되어 있습니다. 그대로 사용하세요 — 내부를 다시 구현하거나 수정할 필요가 없습니다.
          당신의 연습은 이 엔진의 구현이 아니라, 이 엔진을 <strong>어떤 인터페이스 뒤에 둘 것인가</strong>입니다.
        </p>
        <CodeViewer :files="mission.providedFiles" />
      </div>

      <div class="card block">
        <h2 class="panel-title">{{ isDomainLogic ? '구현할 뼈대' : '물려받은 코드' }}</h2>
        <p class="dim">
          {{ isDomainLogic
            ? '이 뼈대를 로컬 IDE로 옮겨서 채워 넣으세요. 계층과 인터페이스 경계는 스스로 결정합니다.'
            : '이 코드를 로컬 IDE로 옮겨서 작업하세요. 동작은 보존해야 합니다.' }}
        </p>
        <CodeViewer :files="mission.legacyFiles" />
      </div>

      <div class="two-col">
        <div class="card block">
          <h2 class="panel-title">요구사항</h2>
          <ol class="req">
            <li v-for="r in mission.requirements" :key="r">{{ r }}</li>
          </ol>
        </div>
        <div class="card block">
          <h2 class="panel-title">제약</h2>
          <ul class="req">
            <li v-for="c in mission.constraints" :key="c">{{ c }}</li>
          </ul>
          <h2 class="panel-title" style="margin-top: 18px">학습 목표</h2>
          <ul class="req">
            <li v-for="g in mission.learningGoals" :key="g">{{ g }}</li>
          </ul>
        </div>
      </div>

      <div class="card block">
        <h2 class="panel-title">평가 기준 (공개분)</h2>
        <RubricList :rubric="mission.rubric" />
        <p v-if="mission.hiddenCases?.length" class="hidden-cases">
          🕵️ 이 미션에는 요구사항에 없는 <strong>히든 케이스 {{ mission.hiddenCases.length }}개</strong>가 숨어 있습니다.
          현실의 입력은 명세를 읽지 않으니까요. 리뷰에서 공개됩니다.
        </p>
      </div>

      <details class="card block hints">
        <summary>힌트 보기 (막혔을 때만)</summary>
        <ol>
          <li v-for="h in mission.hints" :key="h">{{ h }}</li>
        </ol>
      </details>
    </section>

    <!-- 제출 -->
    <section v-if="tab === '제출'" class="panel">
      <p class="dim">
        로컬에서 작업한 결과 파일들을 붙여넣으세요. 파일 여러 개 제출 가능합니다.
        제출하면 Reviewer Agent가 루브릭 기반으로 리뷰합니다.
      </p>
      <FileSubmitEditor v-model="files" />
      <div class="submit-row">
        <button class="btn primary" :disabled="submitting" @click="submit">
          {{ submitting ? '리뷰 요청 중…' : '제출하고 리뷰 받기' }}
        </button>
        <span v-if="existing" class="dim">
          이전 제출: {{ new Date(existing.submittedAt).toLocaleString('ko-KR') }}
        </span>
      </div>
    </section>

    <!-- 설명 훈련 -->
    <section v-if="tab === '설명 훈련'" class="panel">
      <div class="card block explain-brief">
        <h2 class="panel-title">🎙 설명 과제</h2>
        <p><strong>청자:</strong> {{ mission.explainTask.audience }}</p>
        <MarkdownBlock :source="mission.explainTask.prompt" />
      </div>
      <textarea
        v-model="explainText"
        class="explain-input mono"
        rows="12"
        placeholder="말하듯이 써보세요. 에이전트가 논리 구조, 용어 선택, 비유의 적절성을 피드백합니다."
      ></textarea>
      <div class="submit-row">
        <button class="btn primary" :disabled="!explainText.trim()" @click="submitExplanation">
          설명 제출하고 피드백 받기
        </button>
      </div>
    </section>
    </template>
    <ChatPanel v-if="mode === 'developer'" :mission-id="mission.id" />
    <NicknamePrompt
      v-if="showNicknamePrompt"
      @confirmed="onNicknameConfirmed"
      @cancelled="onNicknameCancelled"
    />
  </div>
  <p v-else>존재하지 않는 미션입니다.</p>
</template>

<style scoped>
.back { font-size: 13px; text-decoration: none; color: var(--fg-dim); }
.endings-sub { color: var(--fg-dim); font-size: 12.5px; font-weight: 400; }
.ending-rows { display: flex; flex-direction: column; gap: 8px; }
.ending {
  display: grid;
  grid-template-columns: 28px minmax(96px, auto) 1fr;
  gap: 10px;
  align-items: baseline;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-soft);
  font-size: 13.5px;
}
.ending-title { font-weight: 700; }
.ending-teaser { color: var(--fg-dim); }
.ending.calm { border-color: rgba(158, 206, 106, 0.3); }
.ending.hotfix { border-color: rgba(224, 175, 104, 0.3); }
.ending.dawn { border-color: rgba(247, 118, 142, 0.3); }
.ending.hidden { opacity: 0.6; border-style: dashed; }
.hidden-cases {
  margin: 12px 0 0;
  padding: 10px 14px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  color: var(--fg-dim);
  font-size: 13.5px;
}
.chip.diff-easy { background: rgba(158, 206, 106, 0.15); color: var(--good); }
.chip.diff-normal { background: var(--accent-soft); color: var(--accent); }
.chip.diff-hard { background: rgba(247, 118, 142, 0.15); color: var(--bad); }
.engine { border-color: rgba(158, 206, 106, 0.35); }
.back:hover { color: var(--accent); }
.head { margin: 14px 0 18px; }
.head-meta { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
h1 { font-size: 22px; margin: 0; }
.mode-select {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  margin-bottom: 18px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.mode-btn {
  background: none;
  border: none;
  border-radius: 7px;
  color: var(--fg-dim);
  font-size: 13.5px;
  padding: 8px 14px;
  white-space: nowrap;
}
.mode-btn.active { background: var(--accent); color: #10131c; font-weight: 700; }
.tabs {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  background: none;
  border: none;
  color: var(--fg-dim);
  font-size: 14px;
  padding: 10px 16px;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
}
.tab.active { color: var(--fg); border-bottom-color: var(--accent); font-weight: 600; }
.panel-title { font-size: 16px; margin: 0 0 10px; }
.block { margin-bottom: 16px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 800px) { .two-col { grid-template-columns: 1fr; } }
.req { margin: 0; padding-left: 20px; }
.req li { margin: 7px 0; font-size: 14px; }
.dim { color: var(--fg-dim); font-size: 13.5px; }
.hints summary { cursor: pointer; color: var(--warn); font-size: 14px; }
.hints ol { margin: 10px 0 0; }
.hints li { margin: 6px 0; font-size: 14px; }
.panel-next { margin-top: 20px; }
.submit-row { display: flex; align-items: center; gap: 14px; margin-top: 16px; }
.explain-brief { margin-bottom: 14px; }
.explain-input {
  width: 100%;
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
.explain-input:focus { outline: none; border-color: var(--accent); }

@media (max-width: 700px) {
  h1 { font-size: 19px; }
  .head-meta { row-gap: 8px; }
  .card, .panel > .card { padding: 14px; }
  .mode-select { flex-wrap: wrap; width: 100%; }
  .mode-btn { flex: 1 1 auto; text-align: center; min-height: 40px; }
  .ending {
    grid-template-columns: 28px 1fr;
    grid-template-areas:
      "icon title"
      "teaser teaser";
    row-gap: 4px;
  }
  .ending-icon { grid-area: icon; }
  .ending-title { grid-area: title; }
  .ending-teaser { grid-area: teaser; font-size: 12.5px; }
  .hidden-cases { font-size: 12.5px; padding: 8px 12px; }
  .submit-row { flex-wrap: wrap; margin-bottom: 64px; }
  .btn.primary { min-height: 40px; }
}
</style>

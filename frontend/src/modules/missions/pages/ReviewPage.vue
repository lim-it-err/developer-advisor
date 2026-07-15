<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMissions } from '../store/missions.js'
import MarkdownBlock from '../components/MarkdownBlock.vue'

const route = useRoute()
const store = useMissions()

const mission = computed(() => store.getMission(route.params.id))
const review = computed(() => store.getReview(route.params.id))
const explainFeedback = computed(() => store.getExplainFeedback(route.params.id))
const reputation = computed(() => (review.value ? store.getReputation(route.params.id) : null))
const explanation = computed(() => store.state.explanations[route.params.id])

const ENDING_ICONS = { calm: '☕', hotfix: '🔧', dawn: '🚨', hidden: '🔓' }

function scoreColor(score) {
  if (score >= 80) return 'var(--good)'
  if (score >= 60) return 'var(--warn)'
  return 'var(--bad)'
}

// 항목 점수는 배점(weight) 대비 획득 점수 — 색상은 비율 기준
function itemWeight(rubricName) {
  return mission.value?.rubric.find((r) => r.name === rubricName)?.weight ?? 100
}

function itemColor(item) {
  return scoreColor((item.score / itemWeight(item.rubricName)) * 100)
}
</script>

<template>
  <div v-if="mission">
    <router-link :to="`/missions/${mission.id}`" class="back">← 미션으로</router-link>
    <h1>리뷰 — {{ mission.title }}</h1>
    <p class="proto-note">
      ⚠️ 프로토타입: 아래 리뷰는 에이전트가 미리 생성한 <strong>샘플</strong>입니다.
      실서비스에서는 방금 제출한 코드를 Reviewer Agent가 직접 분석합니다.
    </p>

    <!-- 코드 리뷰 -->
    <section v-if="review" class="card block">
      <div class="overall">
        <div class="overall-score" :style="{ color: scoreColor(review.overall) }">
          {{ review.overall }}
        </div>
        <div>
          <div class="overall-label">종합 점수</div>
          <p class="overall-summary">{{ review.summary }}</p>
        </div>
      </div>

      <div class="items">
        <div v-for="item in review.items" :key="item.rubricName" class="item">
          <div class="item-head">
            <span class="item-name">{{ item.rubricName }}</span>
            <span class="item-score" :style="{ color: itemColor(item) }">{{ item.score }} / {{ itemWeight(item.rubricName) }}점</span>
          </div>
          <blockquote class="evidence mono">{{ item.evidence }}</blockquote>
          <p class="feedback">{{ item.feedback }}</p>
        </div>
      </div>

      <template v-if="review.hiddenCases?.length">
        <h2 class="sec">🕵️ 히든 케이스 공개</h2>
        <div class="hc-list">
          <div v-for="hc in review.hiddenCases" :key="hc.title" class="hc" :class="{ pass: hc.passed }">
            <div class="hc-head">
              <span class="hc-mark">{{ hc.passed ? '✅ 방어함' : '💥 뚫림' }}</span>
              <span class="hc-title">{{ hc.title }}</span>
            </div>
            <p class="hc-note">{{ hc.note }}</p>
            <p v-if="hc.warStory" class="hc-story">📜 {{ hc.warStory }}</p>
          </div>
        </div>
      </template>

      <!-- 히든 퀘스트: 지문에 심어진 문장을 알아챘는가. 리뷰에서만 공개 -->
      <template v-if="review.hiddenQuest">
        <h2 class="sec">🗝 히든 퀘스트</h2>
        <div class="quest" :class="{ found: review.hiddenQuest.found }">
          <div class="quest-mark">{{ review.hiddenQuest.found ? '🏅 발견' : '🌫 스쳐 지나감' }}</div>
          <p class="quest-text">{{ review.hiddenQuest.text }}</p>
        </div>
      </template>

      <h2 class="sec">다음 단계</h2>
      <ul>
        <li v-for="s in review.nextSteps" :key="s">{{ s }}</li>
      </ul>

      <h2 class="sec">꼬리 질문 <span class="dim">(인터뷰 모드의 씨앗)</span></h2>
      <ol>
        <li v-for="q in review.followUpQuestions" :key="q">{{ q }}</li>
      </ol>
    </section>
    <section v-else class="card block dim">
      아직 코드를 제출하지 않았습니다.
      <router-link :to="`/missions/${mission.id}`">미션 페이지</router-link>에서 제출하세요.
    </section>

    <!-- 평판: 질문 창 대화에 대한 정성 평가 (채점과 별도) -->
    <section v-if="reputation" class="card block rep">
      <h2 class="sec" style="margin-top: 0">🤝 평판 <span class="dim">— 질문 창 소통에 대한 평가, 점수와는 별개입니다</span></h2>
      <div class="rep-level">
        <span class="rep-badge">{{ reputation.level }}</span>
        <p class="rep-summary">{{ reputation.summary }}</p>
      </div>
      <div class="rep-grid">
        <div class="rep-col">
          <div class="rep-label good-label">잘한 소통</div>
          <ul><li v-for="s in reputation.strengths" :key="s">{{ s }}</li></ul>
        </div>
        <div class="rep-col">
          <div class="rep-label warn-label">아쉬운 소통</div>
          <ul><li v-for="s in reputation.improvements" :key="s">{{ s }}</li></ul>
        </div>
      </div>
    </section>

    <!-- 시나리오: 코드가 배포된 후의 이야기 -->
    <section v-if="review?.scenario" class="card block scenario">
      <h2 class="sec" style="margin-top: 0">📖 시나리오 <span class="dim">— 당신의 코드가 배포된 후</span></h2>
      <div v-if="review.ending" class="ending-stamp" :class="review.ending.grade">
        <span class="stamp-label">도달한 결말</span>
        <span class="stamp-title">{{ ENDING_ICONS[review.ending.grade] ?? '❓' }} {{ review.ending.title }}</span>
        <span v-if="review.ending.grade === 'hidden'" class="stamp-unlock">🎉 히든 결말 해금!</span>
      </div>
      <MarkdownBlock :source="review.scenario" />
    </section>

    <!-- 설명 피드백 -->
    <section v-if="explainFeedback" class="card block">
      <h2 class="sec" style="margin-top: 0">🎙 설명 훈련 피드백</h2>
      <h3 class="sub-h">내가 쓴 설명</h3>
      <blockquote class="transcript">{{ explanation?.text || explainFeedback.transcript }}</blockquote>
      <div class="fb-grid">
        <div class="fb">
          <div class="fb-label">논리 구조</div>
          <p>{{ explainFeedback.feedback.structure }}</p>
        </div>
        <div class="fb">
          <div class="fb-label">명료성 · 용어</div>
          <p>{{ explainFeedback.feedback.clarity }}</p>
        </div>
        <div class="fb">
          <div class="fb-label">비유</div>
          <p>{{ explainFeedback.feedback.analogy }}</p>
        </div>
      </div>
      <h3 class="sub-h">이렇게 말하면 더 조리 있습니다</h3>
      <div class="improved">
        <MarkdownBlock :source="explainFeedback.feedback.improved" />
      </div>
    </section>

    <div class="actions">
      <router-link :to="`/missions/${mission.id}`" class="btn">코드 고쳐서 재제출</router-link>
      <router-link to="/missions" class="btn primary">다음 미션으로</router-link>
    </div>
  </div>
</template>

<style scoped>
.back { font-size: 13px; text-decoration: none; color: var(--fg-dim); }
h1 { font-size: 22px; margin: 12px 0 8px; }
.proto-note {
  color: var(--warn);
  font-size: 13px;
  background: rgba(224, 175, 104, 0.08);
  border: 1px solid rgba(224, 175, 104, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
}
.block { margin-bottom: 18px; }
.overall { display: flex; gap: 20px; align-items: center; margin-bottom: 20px; }
.overall-score { font-size: 46px; font-weight: 800; }
.overall-label { color: var(--fg-dim); font-size: 13px; }
.overall-summary { margin: 4px 0 0; font-size: 14.5px; }
.items { display: flex; flex-direction: column; gap: 14px; }
.item { border: 1px solid var(--border); border-radius: 10px; padding: 14px; background: var(--bg-soft); }
.item-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
.item-name { font-weight: 600; }
.item-score { font-weight: 700; }
.evidence {
  margin: 0 0 8px;
  padding: 10px 12px;
  background: var(--code-bg);
  border-left: 3px solid var(--accent);
  border-radius: 0 8px 8px 0;
  font-size: 12.5px;
  white-space: pre-wrap;
  color: var(--fg-dim);
}
.feedback { margin: 0; font-size: 14px; }
.sec { font-size: 16px; margin: 22px 0 8px; }
.sub-h { font-size: 14px; color: var(--fg-dim); margin: 14px 0 6px; }
.dim { color: var(--fg-dim); font-weight: 400; font-size: 13px; }
.transcript {
  margin: 0;
  padding: 12px 14px;
  background: var(--bg-soft);
  border-left: 3px solid var(--fg-dim);
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  white-space: pre-wrap;
}
.fb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 14px 0; }
@media (max-width: 800px) { .fb-grid { grid-template-columns: 1fr; } }
.fb { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
.fb-label { font-weight: 700; font-size: 13px; color: var(--accent); margin-bottom: 6px; }
.fb p { margin: 0; font-size: 13.5px; }
.improved {
  background: rgba(158, 206, 106, 0.07);
  border: 1px solid rgba(158, 206, 106, 0.25);
  border-radius: 10px;
  padding: 4px 16px;
}
.actions { display: flex; gap: 10px; margin-top: 8px; }
.ending-stamp {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin: 4px 0 14px;
  background: var(--bg-soft);
}
.stamp-label { color: var(--fg-dim); font-size: 12px; white-space: nowrap; }
.stamp-title { font-weight: 800; font-size: 15px; }
.stamp-unlock { color: var(--accent); font-size: 13px; font-weight: 700; }
.ending-stamp.calm { border-color: rgba(158, 206, 106, 0.4); }
.ending-stamp.hotfix { border-color: rgba(224, 175, 104, 0.4); }
.ending-stamp.dawn { border-color: rgba(247, 118, 142, 0.4); }
.ending-stamp.hidden { border-color: var(--accent); }
.scenario {
  border-color: rgba(122, 162, 247, 0.35);
  background: linear-gradient(180deg, rgba(122, 162, 247, 0.05), transparent 40%), var(--bg-card);
}
.quest {
  border: 1px dashed var(--fg-dim);
  border-radius: 10px;
  padding: 14px 16px;
  background: var(--bg-soft);
  font-style: italic;
}
.quest.found { border-color: var(--accent); background: var(--accent-soft); font-style: normal; }
.quest-mark { font-weight: 800; font-size: 13px; margin-bottom: 6px; }
.quest-text { margin: 0; font-size: 14px; line-height: 1.7; }
.hc-list { display: flex; flex-direction: column; gap: 10px; }
.hc {
  border: 1px solid rgba(247, 118, 142, 0.35);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--bg-soft);
}
.hc.pass { border-color: rgba(158, 206, 106, 0.35); }
.hc-head { display: flex; gap: 10px; align-items: center; }
.hc-mark { font-size: 13px; font-weight: 700; white-space: nowrap; }
.hc-title { font-weight: 600; font-size: 14px; }
.hc-note { margin: 6px 0 0; font-size: 13.5px; }
.hc-story { margin: 8px 0 0; font-size: 13px; color: var(--fg-dim); font-style: italic; }
.rep-level { display: flex; align-items: center; gap: 14px; margin: 12px 0; }
.rep-badge {
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 10px;
  padding: 8px 14px;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}
.rep-summary { margin: 0; font-size: 14px; }
.rep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 800px) { .rep-grid { grid-template-columns: 1fr; } }
.rep-col { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
.rep-col ul { margin: 6px 0 0; padding-left: 18px; }
.rep-col li { font-size: 13.5px; margin: 5px 0; }
.rep-label { font-weight: 700; font-size: 13px; }
.good-label { color: var(--good); }
.warn-label { color: var(--warn); }

@media (max-width: 700px) {
  h1 { font-size: 19px; }
  .card { padding: 14px; }
  .overall { flex-wrap: wrap; gap: 12px; }
  .overall-score { font-size: 34px; }
  .ending-stamp { flex-wrap: wrap; row-gap: 6px; }
  .hc { padding: 10px 12px; }
  .actions { flex-wrap: wrap; }
  .actions .btn { flex: 1 1 auto; text-align: center; min-height: 40px; }
}
</style>

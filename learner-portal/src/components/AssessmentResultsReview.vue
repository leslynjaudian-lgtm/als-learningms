<template>
  <div class="assessment-results-review">
    <!-- Simple Completion Card -->
    <div class="results-score-card">
      <div class="results-check-circle" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <h2 class="results-done-title">Nahuman na!</h2>
      <p class="results-done-subtitle">
        Naka-answer ka og <strong>{{ score }}</strong> sa <strong>{{ total }}</strong> ka pangutana.
      </p>

      <div class="results-score-pill">
        <span>Imong Iskor:</span>
        <strong>{{ score }} / {{ total }}</strong>
      </div>

      <!-- Primary Action Button -->
      <button
        type="button"
        class="results-primary-btn"
        @click="$emit('proceed')"
      >
        <span>{{ proceedButtonLabel }}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <!-- Secondary Option: Toggle Answer Review (Collapsed by Default) -->
      <button
        v-if="questions.length > 0"
        type="button"
        class="results-secondary-btn"
        :aria-expanded="showAnswerReview"
        @click="showAnswerReview = !showAnswerReview"
      >
        <span>{{ showAnswerReview ? 'Tagoa ang Imong mga Tubag' : 'Tan-awa ang Imong mga Tubag' }}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline :points="showAnswerReview ? '18 15 12 9 6 15' : '6 9 12 15 18 9'" />
        </svg>
      </button>
    </div>

    <!-- Collapsible Submitted Answers Review -->
    <div v-if="showAnswerReview && questions.length > 0" class="readonly-review-section">
      <div class="review-questions-list">
        <div
          v-for="(q, qIdx) in questions"
          :key="`q-review-${q.id || qIdx}`"
          class="review-question-card"
        >
          <div class="review-q-header">
            <span class="q-num-pill">Pangutana {{ qIdx + 1 }}</span>
            <span
              class="q-result-tag"
              :class="isAnswerCorrect(q) ? 'tag-correct' : 'tag-incorrect'"
            >
              <svg v-if="isAnswerCorrect(q)" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>{{ isAnswerCorrect(q) ? 'Sakto' : 'Sayop' }}</span>
            </span>
          </div>

          <h4 class="review-q-text">{{ q.question }}</h4>
          <div class="review-translate-row">
            <TranslateBisayaButton
              :loading="getTranslation(`rev-q-${q.id || qIdx}`).loading"
              :active="getTranslation(`rev-q-${q.id || qIdx}`).visible"
              :error="getTranslation(`rev-q-${q.id || qIdx}`).error"
              @toggle="toggleQuestionTranslation(`rev-q-${q.id || qIdx}`, q.question, q.options)"
            />
          </div>
          <div
            v-if="getTranslation(`rev-q-${q.id || qIdx}`).visible"
            class="review-bisaya-box"
          >
            {{ getTranslation(`rev-q-${q.id || qIdx}`).questionText }}
          </div>

          <div class="review-options-list">
            <div
              v-for="(opt, optIdx) in q.options"
              :key="opt.id || optIdx"
              class="review-opt-item"
              :class="{
                'chosen-correct': isUserOption(q, opt) && isCorrectOption(q, opt),
                'chosen-wrong': isUserOption(q, opt) && !isCorrectOption(q, opt),
                'is-correct-target': !isUserOption(q, opt) && isCorrectOption(q, opt)
              }"
            >
              <div
                v-if="isUserOption(q, opt) || isCorrectOption(q, opt)"
                class="review-opt-label-row"
              >
                <span
                  v-if="isUserOption(q, opt) && isCorrectOption(q, opt)"
                  class="badge-user-choice badge-choice-correct"
                >
                  Imong Tubag &bull; Sakto
                </span>
                <span
                  v-else-if="isUserOption(q, opt)"
                  class="badge-user-choice badge-choice-wrong"
                >
                  Imong Tubag
                </span>
                <span
                  v-else-if="isCorrectOption(q, opt)"
                  class="badge-correct-choice"
                >
                  Saktong Tubag
                </span>
              </div>

              <div class="review-opt-content">
                <div class="review-opt-circle">
                  <svg v-if="isCorrectOption(q, opt)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <svg v-else-if="isUserOption(q, opt)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <div class="review-opt-text-stack">
                  <span class="review-opt-text">{{ formatChoiceText(opt.text) }}</span>
                  <span
                    v-if="getTranslation(`rev-q-${q.id || qIdx}`).visible && getTranslation(`rev-q-${q.id || qIdx}`).optionsMap[opt.id]"
                    class="review-opt-bisaya"
                  >
                    {{ getTranslation(`rev-q-${q.id || qIdx}`).optionsMap[opt.id] }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="resolveFeedback(q)" class="review-feedback-card">
            <div><strong>Giya:</strong> {{ resolveFeedback(q) }}</div>
            <div class="review-translate-row">
              <TranslateBisayaButton
                :loading="getTranslation(`rev-fb-${q.id || qIdx}`).loading"
                :active="getTranslation(`rev-fb-${q.id || qIdx}`).visible"
                :error="getTranslation(`rev-fb-${q.id || qIdx}`).error"
                @toggle="toggleTextTranslation(`rev-fb-${q.id || qIdx}`, resolveFeedback(q))"
              />
            </div>
            <div
              v-if="getTranslation(`rev-fb-${q.id || qIdx}`).visible"
              class="review-bisaya-box"
              style="margin-top: 0.4rem; margin-bottom: 0;"
            >
              {{ getTranslation(`rev-fb-${q.id || qIdx}`).text }}
            </div>
          </div>
        </div>
      </div>

      <div class="results-bottom-actions">
        <button
          type="button"
          class="results-primary-btn"
          @click="$emit('proceed')"
        >
          <span>{{ proceedButtonLabel }}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import TranslateBisayaButton from './TranslateBisayaButton.vue';
import { useBisayaTranslation } from '../composables/useBisayaTranslation.js';

const {
  getEntry: getTranslation,
  toggleTextTranslation,
  toggleQuestionTranslation,
} = useBisayaTranslation();

const props = defineProps({
  testType: {
    type: String,
    default: 'preTest',
  },
  proceedLabel: {
    type: String,
    default: '',
  },
  score: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  percent: {
    type: Number,
    default: 0,
  },
  questions: {
    type: Array,
    default: () => [],
  },
  answers: {
    type: Object,
    default: () => ({}),
  },
  getFeedback: {
    type: Function,
    default: null,
  },
});

defineEmits(['proceed']);

const showAnswerReview = ref(false);

const isPostTest = computed(() => {
  const t = (props.testType || '').toLowerCase().trim();
  return t === 'posttest' || t === 'post_test' || t === 'post-test' || t === 'post';
});

const proceedButtonLabel = computed(() => {
  if (props.proceedLabel && props.proceedLabel.trim()) {
    return props.proceedLabel.trim();
  }
  return isPostTest.value ? 'Ipasa ang Imong Activity' : 'Basaha ang Module';
});

function formatChoiceText(text) {
  const s = String(text ?? '').trim();
  if (s.toLowerCase() === 'true') return 'True (Tinuod)';
  if (s.toLowerCase() === 'false') return 'False (Dili tinuod)';
  return text;
}

function getUserAnswer(q) {
  if (!props.answers || !q) return null;
  return props.answers[q.id];
}

function isAnswerCorrect(q) {
  const ans = getUserAnswer(q);
  if (ans === null || ans === undefined || q.correctAnswer === null || q.correctAnswer === undefined) {
    return false;
  }
  return String(ans) === String(q.correctAnswer);
}

function isUserOption(q, opt) {
  const ans = getUserAnswer(q);
  if (ans === null || ans === undefined) return false;
  return String(ans) === String(opt.id);
}

function isCorrectOption(q, opt) {
  if (q.correctAnswer === null || q.correctAnswer === undefined) return false;
  return String(q.correctAnswer) === String(opt.id);
}

function resolveFeedback(q) {
  const correct = isAnswerCorrect(q);
  if (typeof props.getFeedback === 'function') {
    return props.getFeedback(q, correct);
  }
  if (correct && q.correctFeedback && String(q.correctFeedback).trim()) {
    return String(q.correctFeedback).trim();
  }
  if (!correct && q.incorrectFeedback && String(q.incorrectFeedback).trim()) {
    return String(q.incorrectFeedback).trim();
  }
  return q.feedback ? String(q.feedback).trim() : '';
}
</script>

<style scoped>
.assessment-results-review {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.results-score-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.results-check-circle {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #f0fdf4;
  border: 2px solid #bbf7d0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.results-done-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0b1e36;
  margin: 0;
  line-height: 1.2;
}

.results-done-subtitle {
  font-size: 1rem;
  color: #334155;
  margin: 0;
  line-height: 1.45;
}

.results-score-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.9rem;
  border-radius: 9999px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #0b1e36;
  font-size: 0.95rem;
}

.results-score-pill strong {
  color: #165dfc;
  font-weight: 800;
}

.results-primary-btn {
  width: 100%;
  min-height: 50px;
  padding: 0.8rem 1.25rem;
  margin-top: 0.35rem;
  font-size: 1rem;
  font-weight: 800;
  background-color: #165dfc;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.results-primary-btn:hover {
  background-color: #0d4ed8;
}

.results-secondary-btn {
  width: 100%;
  min-height: 46px;
  padding: 0.65rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
}

.results-secondary-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.readonly-review-section {
  width: 100%;
  text-align: left;
}

.review-questions-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.review-question-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem;
}

.review-q-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.q-num-pill {
  font-size: 0.8rem;
  font-weight: 800;
  color: #64748b;
}

.q-result-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.q-result-tag.tag-correct {
  background: #dcfce7;
  color: #15803d;
}

.q-result-tag.tag-incorrect {
  background: #fee2e2;
  color: #b91c1c;
}

.review-q-text {
  font-size: 0.975rem;
  font-weight: 700;
  color: #0b1e36;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.review-options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.review-opt-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.65rem 0.8rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  overflow-wrap: anywhere;
}

.review-opt-item.chosen-correct,
.review-opt-item.is-correct-target {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.review-opt-item.chosen-wrong {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
}

.review-opt-label-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.badge-user-choice,
.badge-correct-choice {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.12rem 0.45rem;
  border-radius: 4px;
}

.badge-choice-correct,
.badge-correct-choice {
  background: #dcfce7;
  color: #15803d;
}

.badge-choice-wrong {
  background: #fee2e2;
  color: #b91c1c;
}

.review-opt-content {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}

.review-opt-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.review-opt-item.chosen-correct .review-opt-circle,
.review-opt-item.is-correct-target .review-opt-circle {
  background: #dcfce7;
  border-color: #16a34a;
}

.review-opt-item.chosen-wrong .review-opt-circle {
  background: #fee2e2;
  border-color: #dc2626;
}

.review-opt-text {
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}

.review-feedback-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #165dfc;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.45;
  margin-top: 0.65rem;
}

.results-bottom-actions {
  margin-top: 1.25rem;
  margin-bottom: 2.5rem;
}

.review-translate-row {
  margin: 0.45rem 0;
}

.review-bisaya-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 0.65rem 0.8rem;
  font-size: 0.9rem;
  color: #0b1e36;
  line-height: 1.45;
  margin-bottom: 0.65rem;
}

.review-opt-text-stack {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.review-opt-bisaya {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1d4ed8;
  background: #eff6ff;
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
  line-height: 1.35;
}
</style>

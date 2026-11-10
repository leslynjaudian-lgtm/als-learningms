<template>
  <div class="assessment-results-review">
    <!-- Score Summary Card -->
    <div class="results-score-card">
      <div class="results-score-content">
        <!-- Circular Score Indicator -->
        <div class="score-circle-indicator">
          <span class="score-circle-fraction">{{ score }}/{{ total }}</span>
          <span class="score-circle-percent">{{ percent }}%</span>
        </div>

        <!-- Saved Confirmation and Summary Details -->
        <div class="score-details-col">
          <div class="score-saved-row">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span class="score-saved-text">Your answers have been saved.</span>
          </div>
          <p class="score-summary-subtitle">
            You answered {{ score }} out of {{ total }} questions correctly.
          </p>
        </div>
      </div>

      <!-- Primary Action Button (Top Instance) -->
      <div class="results-actions-row">
        <button
          type="button"
          class="btn-primary results-primary-btn"
          @click="$emit('proceed')"
        >
          <span>{{ proceedButtonLabel }}</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Review Submitted Answers Section -->
    <div v-if="questions.length > 0" class="readonly-review-section">
      <div class="review-section-header">
        <h3 class="review-title">Review Submitted Answers</h3>
        <span class="review-count">
          {{ questions.length }} {{ questions.length === 1 ? 'Question' : 'Questions' }}
        </span>
      </div>

      <div class="review-questions-list">
        <div
          v-for="(q, qIdx) in questions"
          :key="`q-review-${q.id || qIdx}`"
          class="review-question-card"
        >
          <!-- Card Header: Question Number & Result Status Tag -->
          <div class="review-q-header">
            <span class="q-num-pill">Question {{ qIdx + 1 }}</span>
            <span
              class="q-result-tag"
              :class="isAnswerCorrect(q) ? 'tag-correct' : 'tag-incorrect'"
            >
              <svg
                v-if="isAnswerCorrect(q)"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg
                v-else
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>{{ isAnswerCorrect(q) ? 'Correct' : 'Incorrect' }}</span>
            </span>
          </div>

          <!-- Question Prompt -->
          <h4 class="review-q-text">{{ q.question }}</h4>

          <!-- Multiple-Choice Options List -->
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
              <!-- Label above option text when relevant -->
              <div
                v-if="isUserOption(q, opt) || isCorrectOption(q, opt)"
                class="review-opt-label-row"
              >
                <span
                  v-if="isUserOption(q, opt) && isCorrectOption(q, opt)"
                  class="badge-user-choice badge-choice-correct"
                >
                  Your Answer &bull; Correct
                </span>
                <span
                  v-else-if="isUserOption(q, opt)"
                  class="badge-user-choice badge-choice-wrong"
                >
                  Your Answer
                </span>
                <span
                  v-else-if="isCorrectOption(q, opt)"
                  class="badge-correct-choice"
                >
                  Correct Answer
                </span>
              </div>

              <!-- Option circle and text -->
              <div class="review-opt-content">
                <div class="review-opt-circle">
                  <svg
                    v-if="isCorrectOption(q, opt)"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16a34a"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <svg
                    v-else-if="isUserOption(q, opt)"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dc2626"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <span class="review-opt-text">{{ opt.text }}</span>
              </div>
            </div>
          </div>

          <!-- Teacher Feedback -->
          <div v-if="resolveFeedback(q)" class="review-feedback-card">
            <strong>Feedback:</strong> {{ resolveFeedback(q) }}
          </div>
        </div>
      </div>

      <!-- Primary Action Button (Bottom Instance: Appears after the last question card) -->
      <div class="results-bottom-actions">
        <button
          type="button"
          class="btn-primary results-primary-btn"
          @click="$emit('proceed')"
        >
          <span>{{ proceedButtonLabel }}</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  testType: {
    type: String,
    default: 'preTest', // 'preTest' | 'postTest'
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

const isPostTest = computed(() => {
  const t = (props.testType || '').toLowerCase().trim();
  return t === 'posttest' || t === 'post_test' || t === 'post-test' || t === 'post';
});

const proceedButtonLabel = computed(() => {
  if (props.proceedLabel && props.proceedLabel.trim()) {
    return props.proceedLabel.trim();
  }
  return isPostTest.value ? 'Proceed to Submit Activity' : 'Proceed to Read Module';
});

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

/* Results Score Summary Card */
.results-score-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  margin-bottom: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

.results-score-content {
  display: flex;
  align-items: center;
  gap: 1.15rem;
  width: 100%;
  box-sizing: border-box;
}

/* Circular Score Indicator */
.score-circle-indicator {
  width: 76px;
  height: 76px;
  min-width: 76px;
  min-height: 76px;
  max-width: 76px;
  max-height: 76px;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: #eff6ff;
  border: 3px solid #2563eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  box-sizing: border-box;
  text-align: center;
  padding: 0;
  margin: 0;
}

.score-circle-fraction {
  display: block;
  width: 100%;
  text-align: center;
  margin: 0;
  padding: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1e3a8a;
  line-height: 1.15;
  letter-spacing: 0;
}

.score-circle-percent {
  display: block;
  width: 100%;
  text-align: center;
  margin: 0;
  padding: 0;
  font-size: 0.775rem;
  font-weight: 700;
  color: #2563eb;
  line-height: 1.15;
  letter-spacing: 0;
}

.score-details-col {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
  justify-content: center;
}

.score-saved-row {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #15803d;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
}

.score-saved-row svg {
  flex-shrink: 0;
}

.score-summary-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.4;
  font-weight: 500;
}

/* Primary Action Buttons */
.results-actions-row {
  width: 100%;
}

.results-primary-btn {
  width: 100%;
  min-height: 46px;
  padding: 0.75rem 1.25rem;
  font-size: 0.925rem;
  font-weight: 700;
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  box-sizing: border-box;
  text-decoration: none;
}

.results-primary-btn:hover {
  background-color: #1d4ed8;
}

.results-primary-btn:active {
  background-color: #1e40af;
}

/* Review Submitted Answers Section */
.readonly-review-section {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  text-align: left;
}

.review-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
  width: 100%;
  box-sizing: border-box;
}

.review-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.review-count {
  font-size: 0.75rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #64748b;
  padding: 0.22rem 0.6rem;
  border-radius: 12px;
  white-space: nowrap;
}

.review-questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.review-question-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.15rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.review-q-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
  width: 100%;
  box-sizing: border-box;
}

.q-num-pill {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.q-result-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  white-space: nowrap;
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
  color: #0f172a;
  margin: 0 0 0.85rem 0;
  line-height: 1.45;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Options */
.review-options-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 0.75rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.review-opt-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
  padding: 0.65rem 0.8rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
  transition: background-color 0.12s ease, border-color 0.12s ease;
}

.review-opt-item.chosen-correct {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.review-opt-item.chosen-wrong {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
}

.review-opt-item.is-correct-target {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.review-opt-label-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin-bottom: 0.15rem;
}

.badge-user-choice {
  font-size: 0.675rem;
  font-weight: 800;
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  line-height: 1.2;
  width: fit-content;
  max-width: 100%;
  white-space: nowrap;
}

.badge-choice-correct {
  background: #dcfce7;
  color: #15803d;
  border-color: #bbf7d0;
}

.badge-choice-wrong {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fecaca;
}

.badge-correct-choice {
  font-size: 0.675rem;
  font-weight: 800;
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  line-height: 1.2;
  width: fit-content;
  max-width: 100%;
  white-space: nowrap;
}

.review-opt-content {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
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
  margin-top: 2px;
  box-sizing: border-box;
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
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.4;
  box-sizing: border-box;
}

/* Feedback Card */
.review-feedback-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #2563eb;
  border-radius: 6px;
  padding: 0.7rem 0.85rem;
  font-size: 0.825rem;
  color: #334155;
  line-height: 1.45;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  margin-top: 0.65rem;
}

/* Bottom Action Button (after last question) */
.results-bottom-actions {
  width: 100%;
  margin-top: 1.5rem;
  margin-bottom: 3.5rem; /* Ensures the fixed bottom navigation never overlaps the button */
  box-sizing: border-box;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .results-score-card {
    padding: 1.1rem 1rem;
    gap: 1rem;
  }

  .results-score-content {
    gap: 0.85rem;
  }

  .score-circle-indicator {
    width: 76px;
    height: 76px;
    min-width: 76px;
    min-height: 76px;
    flex-shrink: 0;
  }

  .score-circle-fraction {
    font-size: 1.05rem;
  }

  .score-circle-percent {
    font-size: 0.775rem;
  }

  .score-saved-row {
    font-size: 0.875rem;
  }

  .score-summary-subtitle {
    font-size: 0.8rem;
  }

  .review-question-card {
    padding: 0.95rem 1rem;
  }

  .review-opt-item {
    padding: 0.6rem 0.7rem;
  }
}

@media (max-width: 360px) {
  .results-score-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>


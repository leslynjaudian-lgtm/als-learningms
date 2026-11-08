<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-overlay"
      @click.self="handleClose"
    >
      <div
        class="modal-box record-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-learner-record-title"
      >
        <!-- Fixed Modal Header -->
        <div class="modal-header">
          <div>
            <h2 id="add-learner-record-title" class="modal-title-text">Add Learner Record</h2>
            <p class="modal-sub-text">
              Record module assessment and learning activities for {{ record.learnerName || fallbackLearnerName || 'learner' }}.
            </p>
          </div>
          <button
            type="button"
            class="modal-close-btn"
            aria-label="Close"
            @click="handleClose"
          >
            &times;
          </button>
        </div>

        <!-- Form with Scrollable Content & Fixed Footer -->
        <form @submit.prevent="emit('save')" class="record-edit-form">
          <div class="record-modal-scroll-body">
            <!-- 1. Learner Name (Always Read-Only to keep learner identity fixed) -->
            <div class="form-group">
              <label class="form-label">Learner Name</label>
              <LockedFieldTooltip message="This field cannot be edited.">
                <input
                  :value="record.learnerName || fallbackLearnerName || ''"
                  type="text"
                  class="form-input is-readonly-field"
                  readonly
                  title="This field cannot be edited."
                />
              </LockedFieldTooltip>
            </div>

            <!-- 2. Module Title -->
            <div class="form-group">
              <label class="form-label">
                Module Title <span v-if="mode === 'manual'" class="req">*</span>
              </label>
              <LockedFieldTooltip
                v-if="mode === 'submission'"
                message="This field cannot be edited."
              >
                <input
                  :value="record.moduleTitle || '—'"
                  type="text"
                  class="form-input is-readonly-field"
                  readonly
                  title="This field cannot be edited."
                />
              </LockedFieldTooltip>
              <input
                v-else
                v-model="record.moduleTitle"
                type="text"
                class="form-input"
                placeholder="e.g., Communication Skills (English) Module 1: Active Listening"
                required
                @input="emit('clear-error')"
              />
            </div>

            <!-- 3. Learning Strand -->
            <div class="form-group">
              <label class="form-label">
                Learning Strand <span v-if="mode === 'manual'" class="req">*</span>
              </label>
              <LockedFieldTooltip
                v-if="mode === 'submission'"
                message="This field cannot be edited."
              >
                <input
                  :value="record.strandName || '—'"
                  type="text"
                  class="form-input is-readonly-field"
                  readonly
                  title="This field cannot be edited."
                />
              </LockedFieldTooltip>
              <select
                v-else
                v-model="record.strandName"
                class="form-select custom-select-arrow"
                required
                @change="emit('clear-error')"
              >
                <option value="" disabled>Select Learning Strand</option>
                <option
                  v-for="strandOpt in learningStrandOptions"
                  :key="strandOpt"
                  :value="strandOpt"
                >
                  {{ strandOpt }}
                </option>
              </select>
            </div>

            <!-- 4 & 5. Date Started & Date Finished (2-Column Grid) -->
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">
                  Date Started <span v-if="mode === 'manual'" class="req">*</span>
                </label>
                <LockedFieldTooltip
                  v-if="mode === 'submission'"
                  message="This field cannot be edited."
                >
                  <input
                    :value="record.dateStarted || '—'"
                    type="text"
                    class="form-input is-readonly-field"
                    readonly
                    title="This field cannot be edited."
                  />
                </LockedFieldTooltip>
                <input
                  v-else
                  v-model="record.dateStarted"
                  type="date"
                  class="form-input date-input"
                  required
                  @change="emit('clear-error')"
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  Date Finished <span v-if="mode === 'manual'" class="req">*</span>
                </label>
                <LockedFieldTooltip
                  v-if="mode === 'submission'"
                  message="This field cannot be edited."
                >
                  <input
                    :value="record.dateFinished || '—'"
                    type="text"
                    class="form-input is-readonly-field"
                    readonly
                    title="This field cannot be edited."
                  />
                </LockedFieldTooltip>
                <input
                  v-else
                  v-model="record.dateFinished"
                  type="date"
                  class="form-input date-input"
                  required
                  @change="emit('clear-error')"
                />
              </div>
            </div>

            <!-- 6 & 7. Pre-Test and Post-Test Score (2-Column Grid) -->
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Pre-Test Score</label>
                <LockedFieldTooltip
                  v-if="mode === 'submission'"
                  message="This field cannot be edited."
                >
                  <input
                    :value="formatScoreDisplay(record.preTestScore, record.preTestTotal)"
                    type="text"
                    class="form-input is-readonly-field score-readonly-input"
                    readonly
                    title="This field cannot be edited."
                  />
                </LockedFieldTooltip>
                <div v-else class="score-input-split">
                  <input
                    v-model="record.preTestScore"
                    type="number"
                    min="0"
                    step="1"
                    class="form-input score-num-in"
                    placeholder="Score"
                    @input="emit('clear-error')"
                  />
                  <span class="slash-div">/</span>
                  <input
                    v-model="record.preTestTotal"
                    type="number"
                    min="1"
                    step="1"
                    class="form-input score-num-in"
                    placeholder="Total"
                    @input="emit('clear-error')"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Post-Test Score</label>
                <LockedFieldTooltip
                  v-if="mode === 'submission'"
                  message="This field cannot be edited."
                >
                  <input
                    :value="formatScoreDisplay(record.postTestScore, record.postTestTotal)"
                    type="text"
                    class="form-input is-readonly-field score-readonly-input"
                    readonly
                    title="This field cannot be edited."
                  />
                </LockedFieldTooltip>
                <div v-else class="score-input-split">
                  <input
                    v-model="record.postTestScore"
                    type="number"
                    min="0"
                    step="1"
                    class="form-input score-num-in"
                    placeholder="Score"
                    @input="emit('clear-error')"
                  />
                  <span class="slash-div">/</span>
                  <input
                    v-model="record.postTestTotal"
                    type="number"
                    min="1"
                    step="1"
                    class="form-input score-num-in"
                    placeholder="Total"
                    @input="emit('clear-error')"
                  />
                </div>
              </div>
            </div>

            <!-- Teacher-Editable Field 1: Other Related Activities Accomplished -->
            <div class="form-group">
              <label class="form-label">Other Related Activities Accomplished</label>
              <textarea
                v-model="record.otherActivities"
                rows="3"
                class="form-textarea"
                placeholder="e.g., worksheets, performance tasks, projects, reading activities, etc."
              ></textarea>
            </div>

            <!-- Teacher-Editable Field 2: ALS Teacher's Assessment -->
            <div class="form-group">
              <label class="form-label">ALS Teacher's Assessment <span class="req">*</span></label>
              <div class="assessment-cards-grid">
                <!-- Mastered Card -->
                <div
                  class="assessment-card card-mastered"
                  :class="{ 'is-selected': record.assessment === 'Mastered' }"
                  role="button"
                  tabindex="0"
                  @click="selectAssessment('Mastered')"
                  @keydown.space.prevent="selectAssessment('Mastered')"
                  @keydown.enter.prevent="selectAssessment('Mastered')"
                >
                  <div class="assessment-radio-circle">
                    <span v-if="record.assessment === 'Mastered'" class="radio-dot"></span>
                  </div>
                  <div class="assessment-card-info">
                    <span class="assessment-card-title">Mastered</span>
                    <span class="assessment-card-desc">Learner has met the required competencies.</span>
                  </div>
                </div>

                <!-- Not Mastered Card -->
                <div
                  class="assessment-card card-not-mastered"
                  :class="{ 'is-selected': record.assessment === 'Not Mastered' }"
                  role="button"
                  tabindex="0"
                  @click="selectAssessment('Not Mastered')"
                  @keydown.space.prevent="selectAssessment('Not Mastered')"
                  @keydown.enter.prevent="selectAssessment('Not Mastered')"
                >
                  <div class="assessment-radio-circle">
                    <span v-if="record.assessment === 'Not Mastered'" class="radio-dot"></span>
                  </div>
                  <div class="assessment-card-info">
                    <span class="assessment-card-title">Not Mastered</span>
                    <span class="assessment-card-desc">Learner still needs to develop competencies.</span>
                  </div>
                </div>
              </div>
              <p v-if="errorMessage" class="modal-validation-error">{{ errorMessage }}</p>
            </div>

            <!-- Teacher-Editable Field 3: Teacher Remarks -->
            <div class="form-group form-group-last">
              <label class="form-label">Teacher Remarks</label>
              <textarea
                v-model="record.remarks"
                rows="3"
                class="form-textarea"
                placeholder="Enter remarks, observations, or recommendations..."
              ></textarea>
            </div>
          </div>

          <!-- Fixed Modal Action Buttons Footer -->
          <div class="modal-actions-footer">
            <button type="button" class="btn btn-secondary" @click="handleClose">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Record' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue';
import LockedFieldTooltip from './LockedFieldTooltip.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'manual', // 'manual' | 'submission'
  },
  record: {
    type: Object,
    required: true,
  },
  fallbackLearnerName: {
    type: String,
    default: '',
  },
  saving: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'close', 'save', 'clear-error']);

const learningStrandOptions = [
  'Communication Skills (English)',
  'Communication Skills (Filipino)',
  'Scientific & Critical Thinking Skills',
  'Mathematical & Problem Solving Skills',
  'Life and Career Skills',
  'Understanding Self & Society',
  'Digital Citizenship',
];

function formatScoreDisplay(score, total) {
  if (score === null || score === undefined || score === '') {
    return 'Not Taken';
  }
  const resolvedTotal = total !== null && total !== undefined && total !== '' ? total : 10;
  return `${score} / ${resolvedTotal}`;
}

function selectAssessment(val) {
  props.record.assessment = val;
  emit('clear-error');
}

function handleClose() {
  emit('update:modelValue', false);
  emit('close');
}

// Prevent background page from scrolling while the modal is open
let previousBodyOverflow = '';

watch(
  () => props.modelValue,
  (isOpen) => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousBodyOverflow || '';
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = previousBodyOverflow || '';
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
  overflow: hidden;
  box-sizing: border-box;
}

.modal-box.record-edit-modal {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  margin: 0 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.modal-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
}

.modal-title-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal-sub-text {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 0 0.15rem;
}

.modal-close-btn:hover {
  color: #475569;
}

.record-edit-form {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.record-modal-scroll-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.25rem 1.75rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: #94a3b8 #f1f5f9;
}

.record-modal-scroll-body::-webkit-scrollbar {
  width: 6px;
}

.record-modal-scroll-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 999px;
  margin: 6px 0;
}

.record-modal-scroll-body::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
  border-radius: 999px;
}

.record-modal-scroll-body::-webkit-scrollbar-thumb:hover {
  background-color: #64748b;
}

.form-group {
  margin-bottom: 0.95rem;
}

.form-group-last {
  margin-bottom: 0.25rem;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.score-input-split {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-num-in {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-weight: 600;
}

.slash-div {
  font-size: 1.15rem;
  font-weight: 700;
  color: #94a3b8;
  user-select: none;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-select:disabled {
  background: #f8fafc;
  color: #334155;
  cursor: default;
}

.form-input.is-readonly-field {
  background-color: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
  font-weight: 500;
  cursor: default;
}

.form-input.is-readonly-field:focus {
  border-color: #cbd5e1;
  box-shadow: none;
}

.form-input.score-readonly-input {
  font-weight: 600;
}

.modal-validation-error {
  margin: 0.45rem 0 0;
  font-size: 0.82rem;
  font-weight: 500;
  color: #dc2626;
}

.custom-select-arrow {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.85rem center;
  background-size: 1.1rem;
  padding-right: 2.25rem;
  cursor: pointer;
}

.date-input {
  color: #334155;
  cursor: pointer;
}

.assessment-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.assessment-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  border: 1.5px solid transparent;
}

.assessment-card.card-mastered {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
}

.assessment-card.card-mastered:hover {
  border-color: #86efac;
}

.assessment-card.card-mastered.is-selected {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
}

.assessment-card.card-not-mastered {
  background-color: #fef2f2;
  border-color: #fecaca;
}

.assessment-card.card-not-mastered:hover {
  border-color: #fca5a5;
}

.assessment-card.card-not-mastered.is-selected {
  border-color: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
}

.assessment-radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.15s ease;
}

.card-mastered .assessment-radio-circle {
  border: 2px solid #22c55e;
}

.card-not-mastered .assessment-radio-circle {
  border: 2px solid #ef4444;
}

.assessment-radio-circle .radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.card-mastered .assessment-radio-circle .radio-dot {
  background-color: #16a34a;
}

.card-not-mastered .assessment-radio-circle .radio-dot {
  background-color: #dc2626;
}

.assessment-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.assessment-card-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0f172a;
}

.assessment-card-desc {
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.35;
}

.modal-actions-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.75rem 1.25rem;
  border-top: 1px solid #f1f5f9;
  background: #ffffff;
}

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.req {
  color: #ef4444;
}

@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.65rem;
  }

  .modal-header {
    padding: 1rem 1.25rem 0.75rem;
  }

  .record-modal-scroll-body {
    padding: 1rem 1.25rem;
  }

  .modal-actions-footer {
    padding: 0.85rem 1.25rem 1rem;
  }

  .form-grid-2,
  .assessment-cards-grid {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
}
</style>


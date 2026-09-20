<template>
  <div class="page-container">
    <!-- Breadcrumb / Back Link -->
    <nav class="breadcrumb">
      <router-link :to="`/modules/${moduleId}/activities`" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Back to Activities</span>
      </router-link>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Create Activity / Answer Sheet</h1>
        <p>Add questions for this activity.</p>
      </div>
    </div>

    <form @submit.prevent="saveActivity" style="max-width: 820px; display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Card 1: Activity Information -->
      <div class="form-card">
        <h3 class="card-section-title">Activity Information</h3>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Activity Title <span class="required">*</span></label>
            <input
              v-model="form.title"
              type="text"
              class="form-input"
              placeholder="e.g. Reading Comprehension"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Page Number <span class="required">*</span></label>
            <input
              v-model.number="form.page"
              type="number"
              min="1"
              class="form-input"
              placeholder="e.g. 5"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Activity Type <span class="required">*</span></label>
          <select v-model="form.type" class="form-select-full" required>
            <option value="Multiple Choice">Multiple Choice</option>
            <option value="Identification">Identification</option>
            <option value="Essay">Essay</option>
            <option value="True or False">True or False</option>
            <option value="Matching Type">Matching Type</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Instructions (Optional)</label>
          <textarea
            v-model="form.instructions"
            class="form-textarea"
            rows="2"
            placeholder="e.g. Read the questions carefully and choose the best answer."
          ></textarea>
        </div>
      </div>

      <!-- Card 2: Add Questions -->
      <div class="form-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 class="card-section-title" style="margin-bottom: 0;">Add Questions</h3>
          <span class="badge badge-info">{{ questions.length }} Questions</span>
        </div>

        <div class="questions-list">
          <div v-for="(q, qIdx) in questions" :key="qIdx" class="question-builder-item">
            <div class="q-header-row">
              <span class="q-title-label">Question {{ qIdx + 1 }}</span>
              <button
                v-if="questions.length > 1"
                type="button"
                class="btn-delete-q"
                @click="deleteQuestion(qIdx)"
                title="Delete question"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span>Delete</span>
              </button>
            </div>

            <!-- Question Text -->
            <div class="form-group">
              <label class="form-label">Question Text <span class="required">*</span></label>
              <input
                v-model="q.text"
                type="text"
                class="form-input"
                placeholder="e.g. What is the main idea of the passage?"
                required
              />
            </div>

            <!-- Multiple Choice Choices -->
            <div v-if="form.type === 'Multiple Choice'" class="choices-container">
              <label class="form-label">Choices &amp; Correct Answer</label>
              
              <div v-for="(choice, cIdx) in q.choices" :key="cIdx" class="choice-option-row">
                <span class="choice-letter-badge">{{ String.fromCharCode(65 + cIdx) }}</span>
                <input
                  v-model="q.choices[cIdx]"
                  type="text"
                  class="form-input"
                  :placeholder="`Option ${String.fromCharCode(65 + cIdx)}`"
                  required
                />
                <label class="correct-radio-label" title="Mark as correct answer">
                  <input
                    type="radio"
                    :name="`correct_${qIdx}`"
                    :value="cIdx"
                    v-model="q.correctAnswer"
                  />
                  <span class="correct-text" :class="{ 'is-correct': q.correctAnswer === cIdx }">
                    {{ q.correctAnswer === cIdx ? 'Correct Answer' : 'Mark Correct' }}
                  </span>
                </label>
              </div>
            </div>

            <!-- Feedback / Explanation -->
            <div class="form-group" style="margin-top: 1rem; margin-bottom: 0;">
              <label class="form-label">Feedback / Explanation (Optional)</label>
              <input
                v-model="q.feedback"
                type="text"
                class="form-input"
                placeholder="e.g. Understanding information is the primary focus described on page 5."
              />
            </div>
          </div>
        </div>

        <!-- Add Question Button -->
        <button type="button" class="btn btn-outline" style="width: 100%; margin-top: 1.25rem;" @click="addQuestion">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>+ Add Question</span>
        </button>
      </div>

      <!-- Footer Buttons -->
      <div class="form-footer-card">
        <router-link :to="`/modules/${moduleId}/activities`" class="btn btn-secondary">Cancel</router-link>
        <button type="submit" class="btn btn-primary">Save Activity</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const moduleId = route.params.id || 1;

const form = reactive({
  title: 'Reading Comprehension',
  page: 5,
  type: 'Multiple Choice',
  instructions: 'Read the questions carefully and choose the best answer.',
});

const questions = ref([
  {
    text: 'What is the main idea of the passage?',
    choices: ['Reading', 'Understanding information', 'Writing', 'Speaking'],
    correctAnswer: 1,
    feedback: 'Comprehension focuses on understanding meaning and information.',
  },
  {
    text: 'Which part of our body converts symbols into meaningful words?',
    choices: ['Eyes', 'Brain', 'Ears', 'Hands'],
    correctAnswer: 1,
    feedback: 'Our brain converts the symbols received by our eyes into words.',
  },
]);

function addQuestion() {
  questions.value.push({
    text: '',
    choices: ['', '', '', ''],
    correctAnswer: 0,
    feedback: '',
  });
}

function deleteQuestion(idx) {
  questions.value.splice(idx, 1);
}

function saveActivity() {
  if (!form.title) {
    alert('Please enter an activity title.');
    return;
  }
  alert(`Activity "${form.title}" saved successfully with ${questions.value.length} questions.`);
  router.push(`/modules/${moduleId}/activities`);
}
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.card-section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 1.25rem;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-textarea {
  width: 100%;
  padding: 0.55rem 0.85rem;
  font-size: 0.875rem;
  color: var(--color-text);
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: none;
  font-family: inherit;
  transition: all var(--transition-fast);
}

.form-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.question-builder-item {
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

.q-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.q-title-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
}

.btn-delete-q {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #fee2e2;
  color: #ef4444;
  border: 1px solid #fecaca;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-delete-q:hover {
  background: #fca5a5;
}

.choices-container {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 0.75rem;
}

.choice-option-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.choice-letter-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.correct-radio-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.correct-radio-label input {
  accent-color: var(--color-success);
}

.correct-text.is-correct {
  color: #15803d;
}

.form-footer-card {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.85rem;
  padding: 1.25rem 0;
}
</style>

<template>
  <div class="page-container">
    <!-- Standardized Page Header -->
    <PageHeader
      title="Record Assessment Score"
      description="Encode scores from face-to-face or paper-based assessments."
      :breadcrumbs="[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Assessments', to: '/dashboard/assessments' },
        { label: 'Record Assessment Score' },
      ]"
    />

    <!-- Form Card -->
    <div class="form-card" style="max-width: 680px;">
      <form @submit.prevent="saveScore">
        <!-- Selected Learner Card Block -->
        <div class="selected-learner-chip">
          <div class="learner-avatar-circle">
            {{ learnerInitials }}
          </div>
          <div class="learner-meta-info">
            <h3>{{ selectedLearner.name }}</h3>
            <span>{{ selectedLearner.level }} | {{ selectedLearner.learningCenter }}</span>
          </div>
          <button
            type="button"
            class="btn-outline"
            style="margin-left: auto; font-size: 0.775rem; padding: 0.3rem 0.65rem;"
            @click="showChangeLearner = !showChangeLearner"
          >
            Change Learner
          </button>
        </div>

        <!-- Switch Learner Select (optional toggle) -->
        <div v-if="showChangeLearner" class="form-group" style="margin-top: 1rem;">
          <label class="form-label">Select Learner <span class="required">*</span></label>
          <select v-model="selectedLearnerId" class="form-select-full" @change="onLearnerChange">
            <option v-for="l in learnersList" :key="l.id" :value="l.id">
              {{ l.name }} ({{ l.level }})
            </option>
          </select>
        </div>

        <!-- Module Selection -->
        <div class="form-group" style="margin-top: 1.25rem;">
          <label class="form-label">Module <span class="required">*</span></label>
          <select v-model="form.module" class="form-select-full" required>
            <option value="Communication Skills Module 1">Communication Skills Module 1</option>
            <option value="Scientific & Critical Thinking Skills Module 1">Scientific & Critical Thinking Skills Module 1</option>
            <option value="Mathematical & Problem Solving Module 2">Mathematical & Problem Solving Module 2</option>
            <option value="Life and Career Skills Module 1">Life and Career Skills Module 1</option>
          </select>
        </div>

        <!-- Assessment / Activity -->
        <div class="form-group">
          <label class="form-label">Assessment <span class="required">*</span></label>
          <select v-model="form.assessment" class="form-select-full" required>
            <option value="Reflection Journal (Face-to-Face)">Reflection Journal (Face-to-Face)</option>
            <option value="Reading Comprehension Activity">Reading Comprehension Activity</option>
            <option value="Vocabulary Practice">Vocabulary Practice</option>
            <option value="Classroom Oral Discussion">Classroom Oral Discussion</option>
            <option value="Module Mastery Quiz (Face-to-Face)">Module Mastery Quiz (Face-to-Face)</option>
          </select>
        </div>

        <!-- Score and Total Items Row -->
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Score <span class="required">*</span></label>
            <input
              v-model.number="form.score"
              type="number"
              min="0"
              :max="form.totalItems"
              class="form-input"
              placeholder="e.g. 8"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Total Items <span class="required">*</span></label>
            <input
              v-model.number="form.totalItems"
              type="number"
              min="1"
              class="form-input"
              placeholder="e.g. 10"
              required
            />
          </div>
        </div>

        <!-- Date Taken -->
        <div class="form-group">
          <label class="form-label">Date Taken <span class="required">*</span></label>
          <input
            v-model="form.dateTaken"
            type="date"
            class="form-input"
            required
          />
        </div>

        <!-- Remarks -->
        <div class="form-group">
          <label class="form-label">Remarks (Optional)</label>
          <textarea
            v-model="form.remarks"
            class="form-textarea"
            rows="3"
            placeholder="e.g. Shows improvement in understanding the main idea."
          ></textarea>
        </div>

        <!-- Action Buttons -->
        <div class="form-footer-actions">
          <router-link to="/dashboard/learners" class="btn btn-secondary">Cancel</router-link>
          <button type="submit" class="btn btn-primary">Save Score</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';

const route = useRoute();
const router = useRouter();

const showChangeLearner = ref(false);
const selectedLearnerId = ref(6);

const learnersList = [
  { id: 1, name: 'Ana Mae B. Dela Cruz', level: 'A&E Elementary', learningCenter: 'Poblacion CLC' },
  { id: 2, name: 'John Rey L. Abad', level: 'A&E Junior High', learningCenter: 'Poblacion CLC' },
  { id: 3, name: 'Maria Fe S. Ignacio', level: 'A&E Elementary', learningCenter: 'Poblacion CLC' },
  { id: 4, name: 'Carla M. Baylon', level: 'A&E Junior High', learningCenter: 'Poblacion CLC' },
  { id: 5, name: 'Liza T. Ramon', level: 'A&E Junior High', learningCenter: 'Poblacion CLC' },
  { id: 6, name: 'Juan Dela Cruz', level: 'A&E Elementary', learningCenter: 'Poblacion CLC' },
];

const selectedLearner = ref({
  id: 6,
  name: 'Juan Dela Cruz',
  level: 'A&E Elementary',
  learningCenter: 'Poblacion CLC',
});

const learnerInitials = computed(() => {
  if (!selectedLearner.value.name) return 'JD';
  return selectedLearner.value.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
});

const form = reactive({
  module: 'Communication Skills Module 1',
  assessment: 'Reflection Journal (Face-to-Face)',
  score: 8,
  totalItems: 10,
  dateTaken: '2026-09-13',
  remarks: 'Shows improvement in understanding the main idea.',
});

onMounted(() => {
  if (route.query.learnerId) {
    const id = Number(route.query.learnerId);
    const found = learnersList.find((l) => l.id === id);
    if (found) {
      selectedLearner.value = found;
      selectedLearnerId.value = found.id;
    }
  }
});

function onLearnerChange() {
  const found = learnersList.find((l) => l.id === selectedLearnerId.value);
  if (found) {
    selectedLearner.value = found;
    showChangeLearner.value = false;
  }
}

function saveScore() {
  alert(`Score of ${form.score}/${form.totalItems} recorded for ${selectedLearner.value.name} on "${form.assessment}".`);
  router.push(`/dashboard/learners/${selectedLearner.value.id}`);
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

.selected-learner-chip {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
}

.learner-avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.learner-meta-info h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.learner-meta-info span {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
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

.form-footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.85rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}
</style>

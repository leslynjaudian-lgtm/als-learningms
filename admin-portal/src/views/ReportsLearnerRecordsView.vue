<template>
  <div class="page-container">
    <!-- Standardized Page Header -->
    <ReportsPageHeader
      title="Learner Records"
      description="View complete individual learner records including information, modules, assessments, and progress."
    />

    <!-- Learner Search / Selector -->
    <div class="filter-card">
      <div class="filter-search-wrap" style="flex: 1;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-search-input"
          placeholder="Search learner by name or LRN..."
        />
      </div>

      <div class="filter-dropdown-group">
        <div class="filter-dropdown-item">
          <label>Learning Center</label>
          <select v-model="selectedCenter" class="filter-select">
            <option value="">All</option>
            <option v-for="center in learningCenters" :key="center.id" :value="center.name">
              {{ center.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Learner List or Selected Learner -->
    <div v-if="!selectedLearner" class="table-card">
      <div class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <h3>No learner records available</h3>
        <p>Search for a learner or add learners to the system to view their complete records.</p>
      </div>
    </div>

    <!-- Selected Learner Detail -->
    <div v-else>
      <!-- Learner Header Card -->
      <div class="card-box" style="margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="margin-bottom: 0.25rem;">{{ selectedLearner.name }}</h3>
            <p style="color: var(--color-text-secondary); font-size: 0.875rem;">
              LRN: {{ selectedLearner.lrn }} · {{ selectedLearner.center }}
            </p>
          </div>
          <button class="btn btn-secondary" @click="selectedLearner = null">
            ← Back to List
          </button>
        </div>
      </div>

      <!-- Record Tabs -->
      <div class="tab-bar-card">
        <button
          v-for="tab in recordTabs"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="table-card">
        <!-- Learner Information Tab -->
        <div v-if="activeTab === 'Learner Information'" class="record-section">
          <div class="empty-state-box">
            <div class="empty-state-graphic">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3>Learner information</h3>
            <p>Personal details, enrollment status, and assigned teacher/learning center will be displayed here.</p>
          </div>
        </div>

        <!-- Module Records Tab -->
        <div v-if="activeTab === 'Module Records'" class="record-section">
          <div class="empty-state-box">
            <div class="empty-state-graphic">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
              </svg>
            </div>
            <h3>No module records yet</h3>
            <p>Module assignments and completion records will appear here once the teacher assigns modules to this learner.</p>
          </div>
        </div>

        <!-- Assessment Records Tab -->
        <div v-if="activeTab === 'Assessment Records'" class="record-section">
          <div class="empty-state-box">
            <div class="empty-state-graphic">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3>No assessment records yet</h3>
            <p>Pre-test and post-test results will appear here once the learner completes assessments.</p>
          </div>
        </div>

        <!-- Learning Progress Tab -->
        <div v-if="activeTab === 'Learning Progress'" class="record-section">
          <div class="empty-state-box">
            <div class="empty-state-graphic">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
              </svg>
            </div>
            <h3>No learning progress data yet</h3>
            <p>Overall learning progress and strand completion tracking will appear here once data is recorded.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ReportsPageHeader from '../components/ReportsPageHeader.vue';
import { getLearningCenters } from '../api/learningCenters.js';

const searchQuery = ref('');
const selectedCenter = ref('');
const learningCenters = ref([]);
const selectedLearner = ref(null);
const activeTab = ref('Learner Information');

const recordTabs = [
  'Learner Information',
  'Module Records',
  'Assessment Records',
  'Learning Progress',
];

async function loadCenters() {
  try {
    const { data } = await getLearningCenters();
    learningCenters.value = data;
  } catch {
    // Fail silently
  }
}

onMounted(loadCenters);
</script>

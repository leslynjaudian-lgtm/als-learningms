<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Attendance</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Take Attendance</h1>
        <p>Record attendance for your learners.</p>
      </div>
    </div>

    <!-- Selection Bar Card -->
    <div class="filter-card">
      <div class="filter-dropdown-group" style="flex: 1;">
        <div class="filter-dropdown-item">
          <label>Learning Center</label>
          <select v-model="selectedCenter" class="filter-select">
            <option value="">All</option>
            <option value="Naawan Central LC">Naawan Central LC</option>
            <option value="Poblacion CLC">Poblacion CLC</option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>Date</label>
          <input
            v-model="attendanceDate"
            type="date"
            class="filter-select"
            style="padding-right: 0.5rem;"
          />
        </div>
      </div>
    </div>

    <!-- Search Learner Card -->
    <div class="filter-card">
      <div class="filter-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-search-input"
          placeholder="Search learners..."
        />
      </div>
    </div>

    <!-- Attendance Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px;">#</th>
              <th>Name</th>
              <th style="width: 260px;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(learner, idx) in filteredLearners" :key="learner.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 600;">{{ learner.name }}</td>
              <td>
                <div class="attendance-radio-group">
                  <label class="radio-item">
                    <input
                      type="radio"
                      :name="`attendance_${learner.id}`"
                      value="Present"
                      v-model="learner.status"
                    />
                    <span>Present</span>
                  </label>
                  <label class="radio-item">
                    <input
                      type="radio"
                      :name="`attendance_${learner.id}`"
                      value="Absent"
                      v-model="learner.status"
                    />
                    <span>Absent</span>
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state if no learners found -->
      <div v-if="filteredLearners.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h3>No learners found</h3>
        <p>Assign learners to this learning center to record attendance.</p>
      </div>

      <!-- Save Attendance Footer Action -->
      <div style="padding: 1.25rem; display: flex; justify-content: flex-end; border-top: 1px solid var(--color-border-light);">
        <button class="btn btn-primary" @click="saveAttendance" :disabled="filteredLearners.length === 0">
          Save Attendance
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const selectedCenter = ref('Naawan Central LC');
const attendanceDate = ref(new Date().toISOString().split('T')[0]);
const searchQuery = ref('');

const learners = ref([
  { id: 1, name: 'Maria Santos', status: 'Present' },
  { id: 2, name: 'Juan Dela Cruz', status: 'Present' },
  { id: 3, name: 'Ana Reyes', status: 'Present' },
]);

const filteredLearners = computed(() => {
  return learners.value.filter((l) =>
    !searchQuery.value || l.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function saveAttendance() {
  alert(`Attendance recorded for ${learners.value.length} learners on ${attendanceDate.value}.`);
}
</script>

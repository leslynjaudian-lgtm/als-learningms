<template>
  <div class="page-container">
    <!-- Standardized Page Header -->
    <ReportsPageHeader
      title="Attendance Report"
      breadcrumb-title="Attendance"
      description="View consolidated attendance records across learning centers."
    />

    <!-- Filter Card -->
    <div class="filter-card">
      <div class="filter-dropdown-group" style="flex: 1;">
        <div class="filter-dropdown-item">
          <label>Learning Center</label>
          <select v-model="selectedCenter" class="filter-select">
            <option value="">All</option>
            <option v-for="center in learningCenters" :key="center.id" :value="center.name">
              {{ center.name }}
            </option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>Teacher</label>
          <select v-model="selectedTeacher" class="filter-select">
            <option value="">All</option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>Date From</label>
          <input
            v-model="dateFrom"
            type="date"
            class="filter-select"
            style="padding-right: 0.5rem;"
          />
        </div>

        <div class="filter-dropdown-item">
          <label>Date To</label>
          <input
            v-model="dateTo"
            type="date"
            class="filter-select"
            style="padding-right: 0.5rem;"
          />
        </div>
      </div>

      <button class="btn btn-primary" @click="generateReport">
        Generate Report
      </button>
    </div>

    <!-- Report Body Card -->
    <div class="table-card">
      <div class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h3>No attendance data available</h3>
        <p>Attendance records will appear here once teachers record attendance in the system.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ReportsPageHeader from '../components/ReportsPageHeader.vue';
import { getLearningCenters } from '../api/learningCenters.js';

const selectedCenter = ref('');
const selectedTeacher = ref('');
const dateFrom = ref('');
const dateTo = ref('');
const learningCenters = ref([]);

async function loadCenters() {
  try {
    const { data } = await getLearningCenters();
    learningCenters.value = data;
  } catch {
    // Fail silently
  }
}

function generateReport() {
  alert('Generating attendance report...');
}

onMounted(loadCenters);
</script>

<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">My Learners</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>My Assigned Learners</h1>
        <p>Manage learning agreements (ILA), assigned modules, and track individual progress.</p>
      </div>
      <div class="header-badge-notice">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>Learners are officially assigned by ALS Coordinator / Admin</span>
      </div>
    </div>

    <!-- Filter Card -->
    <div class="filter-card">
      <div class="filter-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-search-input"
          placeholder="Search by learner name or LRN..."
        />
      </div>

      <div class="filter-dropdown-group">
        <div class="filter-dropdown-item">
          <label>Learning Center</label>
          <select v-model="selectedCenter" class="filter-select">
            <option value="">All Centers</option>
            <option value="Poblacion CLC">Poblacion CLC</option>
            <option value="Naawan Central LC">Naawan Central LC</option>
            <option value="Mat-i CLC">Mat-i CLC</option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>ALS Level</label>
          <select v-model="selectedLevel" class="filter-select">
            <option value="">All Levels</option>
            <option value="Basic Literacy">Basic Literacy</option>
            <option value="A&E Elementary">A&E Elementary</option>
            <option value="A&E Junior">A&E Junior</option>
            <option value="ALS K-12">ALS K-12</option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>ILA Status</label>
          <select v-model="selectedIlaStatus" class="filter-select">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Needs Review">Needs Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button class="btn-outline" @click="clearFilters">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span>Clear Filters</span>
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Learner Name</th>
              <th>LRN</th>
              <th>ALS Level</th>
              <th>Learning Center</th>
              <th>ILA Status</th>
              <th>Module Progress</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(learner, idx) in filteredLearners" :key="learner.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 600;">
                <router-link :to="`/learners/${learner.id}`" class="learner-name-link">
                  {{ learner.name }}
                </router-link>
              </td>
              <td>{{ learner.lrn || '—' }}</td>
              <td>{{ learner.level }}</td>
              <td>{{ learner.learningCenter }}</td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-success': learner.ilaStatus === 'Active',
                    'badge-warning': learner.ilaStatus === 'Needs Review',
                    'badge-info': learner.ilaStatus === 'Completed',
                  }"
                >
                  {{ learner.ilaStatus }}
                </span>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <div class="progress-bar-mini" style="width: 70px;">
                    <div class="progress-fill" :style="{ width: learner.progress + '%' }"></div>
                  </div>
                  <span style="font-size: 0.775rem; font-weight: 600;">{{ learner.progress }}%</span>
                </div>
              </td>
              <td>
                <div class="cell-actions" style="justify-content: flex-end;">
                  <router-link :to="`/learners/${learner.id}`" class="btn-outline" style="font-size: 0.775rem; padding: 0.3rem 0.65rem;">
                    Open Profile &amp; ILA
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredLearners.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <h3>No assigned learners found</h3>
        <p>No learners match your search criteria. Contact your ALS Coordinator if you need new learners assigned.</p>
      </div>

      <!-- Pagination Footer -->
      <div class="table-pagination-row">
        <div>
          Showing {{ filteredLearners.length === 0 ? 0 : 1 }} to {{ filteredLearners.length }} of {{ filteredLearners.length }} assigned learners
        </div>
        <div class="pagination-controls">
          <div class="pagination-rows-select">
            <span>Rows per page:</span>
            <select class="filter-select" style="padding: 0.25rem 1.5rem 0.25rem 0.5rem;">
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
          </div>
          <div class="pagination-nav-group">
            <button class="pagination-btn" disabled>&lt; Previous</button>
            <button class="pagination-btn" disabled>Next &gt;</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const selectedCenter = ref('');
const selectedLevel = ref('');
const selectedIlaStatus = ref('');

const learners = ref([
  { id: 1, name: 'Ana Mae B. Dela Cruz', lrn: '109823481231', level: 'A&E Elementary', learningCenter: 'Poblacion CLC', ilaStatus: 'Active', progress: 95 },
  { id: 2, name: 'John Rey L. Abad', lrn: '109823481232', level: 'A&E Junior', learningCenter: 'Poblacion CLC', ilaStatus: 'Active', progress: 88 },
  { id: 3, name: 'Maria Fe S. Ignacio', lrn: '109823481233', level: 'A&E Elementary', learningCenter: 'Naawan Central LC', ilaStatus: 'Needs Review', progress: 60 },
  { id: 4, name: 'Carla M. Baylon', lrn: '109823481234', level: 'ALS K-12', learningCenter: 'Poblacion CLC', ilaStatus: 'Active', progress: 90 },
  { id: 5, name: 'Liza T. Ramon', lrn: '109823481235', level: 'A&E Junior', learningCenter: 'Naawan Central LC', ilaStatus: 'Active', progress: 84 },
  { id: 6, name: 'Juan Dela Cruz', lrn: '109823481236', level: 'A&E Elementary', learningCenter: 'Poblacion CLC', ilaStatus: 'Needs Review', progress: 85 },
  { id: 7, name: 'Pedro S. Penduko', lrn: '109823481237', level: 'A&E Junior', learningCenter: 'Poblacion CLC', ilaStatus: 'Active', progress: 76 },
  { id: 8, name: 'Mark Anthony Perez', lrn: '109823481238', level: 'ALS K-12', learningCenter: 'Mat-i CLC', ilaStatus: 'Completed', progress: 100 },
]);

function clearFilters() {
  searchQuery.value = '';
  selectedCenter.value = '';
  selectedLevel.value = '';
  selectedIlaStatus.value = '';
}

const filteredLearners = computed(() => {
  return learners.value.filter((l) => {
    const matchesQuery =
      !searchQuery.value ||
      l.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (l.lrn && l.lrn.includes(searchQuery.value));
    const matchesCenter = !selectedCenter.value || l.learningCenter === selectedCenter.value;
    const matchesLevel = !selectedLevel.value || l.level === selectedLevel.value;
    const matchesIla = !selectedIlaStatus.value || l.ilaStatus === selectedIlaStatus.value;
    return matchesQuery && matchesCenter && matchesLevel && matchesIla;
  });
});
</script>

<style scoped>
.header-badge-notice {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #f1f5f9;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
}

.learner-name-link {
  color: var(--color-primary);
  text-decoration: none;
}

.learner-name-link:hover {
  text-decoration: underline;
}

.progress-bar-mini {
  height: 6px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  border-radius: 9999px;
}
</style>

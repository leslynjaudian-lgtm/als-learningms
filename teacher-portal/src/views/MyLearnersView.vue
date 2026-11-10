<template>
  <div class="page-container my-learners-page">
    <PageHeader
      title="My Assigned Learners"
      description="View and manage learners assigned to you."
      :breadcrumbs="[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'My Learners' },
      ]"
    />

    <!-- Filter Section Card -->
    <div class="filter-card learners-filter-card">
      <div class="filter-controls-row">
        <!-- 1. Search Field -->
        <div class="filter-group filter-group-search">
          <label class="filter-label" for="search-learners">Search Learners</label>
          <div class="search-input-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              id="search-learners"
              v-model="searchQuery"
              type="text"
              class="filter-search-input"
              placeholder="Search by learner name or LRN..."
            />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear-btn"
              title="Clear search"
              aria-label="Clear search"
              @click="searchQuery = ''"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 2. Learning Center Filter -->
        <div class="filter-group filter-group-center">
          <label class="filter-label" for="filter-learning-center">Learning Center</label>
          <div class="select-wrapper">
            <select id="filter-learning-center" v-model="selectedCenter" class="filter-select">
              <option value="">All Learning Centers</option>
              <option v-for="center in availableCenters" :key="center.id || center.name" :value="center.name">
                {{ center.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 3. ALS Level Filter -->
        <div class="filter-group filter-group-level">
          <label class="filter-label" for="filter-als-level">ALS Level</label>
          <div class="select-wrapper">
            <select id="filter-als-level" v-model="selectedLevel" class="filter-select">
              <option value="">All ALS Levels</option>
              <option v-for="lvl in assignedLevelOptions" :key="lvl" :value="lvl">
                {{ lvl }}
              </option>
            </select>
          </div>
        </div>

        <!-- 4. Clear Filters Button -->
        <div class="filter-action-cell">
          <ClearFiltersButton @click="clearFilters" />
        </div>
      </div>
    </div>

    <!-- Table Card Container -->
    <div class="table-card">
      <div class="table-responsive">
        <table class="learners-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>LEARNER NAME</th>
              <th>LRN</th>
              <th>ALS LEVEL</th>
              <th>LEARNING CENTER</th>
              <th class="th-status" style="text-align: center;">STATUS</th>
              <th class="th-action" style="text-align: center;">ACTION</th>
            </tr>
          </thead>
          <tbody v-if="!loading && pagedLearners.length > 0">
            <tr v-for="(learner, idx) in pagedLearners" :key="learner.id">
              <td class="cell-index">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td class="cell-name">
                <router-link :to="`/dashboard/learners/${learner.id}`" class="learner-name-link">
                  {{ learner.name }}
                </router-link>
              </td>
              <td class="cell-lrn">{{ learner.lrn || '-' }}</td>
              <td class="cell-level table-cell-als-level">{{ formatAlsLevel(learner.level) }}</td>
              <td class="cell-center">{{ learner.learningCenter || '-' }}</td>
              <td class="cell-status" style="text-align: center;">
                <span class="status-badge" :class="learner.status === 'Active' ? 'badge-active' : 'badge-inactive'">
                  {{ learner.status || 'Active' }}
                </span>
              </td>
              <td class="cell-action" style="text-align: center;">
                <router-link
                  :to="`/dashboard/learners/${learner.id}`"
                  class="btn-view-icon"
                  title="View"
                  aria-label="View Learner Information"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="state-container">
        <div class="state-icon-circle">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
          </svg>
        </div>
        <h3 class="state-title">Loading assigned learners...</h3>
      </div>

      <!-- Empty State matching reference image -->
      <div v-else-if="filteredLearners.length === 0" class="state-container empty-state">
        <div class="state-icon-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h3 class="state-title">No learners found</h3>
        <p class="state-description">There are no learners assigned to you yet.</p>
      </div>

      <!-- Pagination Footer matching reference image -->
      <div class="pagination-footer">
        <div class="pagination-info">
          Showing {{ totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }} learners
        </div>
        <div class="pagination-actions">
          <div class="rows-per-page">
            <span>Rows per page:</span>
            <select v-model="pageSize" class="rows-select">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>
          <div class="page-nav-buttons">
            <button
              class="page-nav-btn"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              &lt; Previous
            </button>
            <button
              class="page-nav-btn"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import ClearFiltersButton from '../components/ClearFiltersButton.vue';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getAssignedLearners } from '../api/learners.js';

const route = useRoute();
const { teacherId, assignedCenters, assignedLevelOptions } = useTeacherSession();

const loading = ref(false);
const learners = ref([]);
const searchQuery = ref('');
const selectedCenter = ref('');
const selectedLevel = ref('');
const pageSize = ref(10);
const currentPage = ref(1);

// When center changes or assigned levels change, ensure selectedLevel remains valid
watch(selectedCenter, () => {
  if (selectedLevel.value && !assignedLevelOptions.value.includes(selectedLevel.value)) {
    selectedLevel.value = '';
  }
});

watch(assignedLevelOptions, (newOpts) => {
  if (selectedLevel.value && !newOpts.includes(selectedLevel.value)) {
    selectedLevel.value = '';
  }
}, { immediate: true });

// Computed available centers combining assignedCenters and distinct centers from assigned learners
const availableCenters = computed(() => {
  const map = new Map();
  // Include assigned centers from teacher profile
  (assignedCenters.value || []).forEach((c) => {
    if (c.name && c.name !== '—') {
      const key = c.name.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { id: c.id || key, name: c.name.trim() });
      }
    }
  });
  // Also include distinct centers from the teacher's assigned learners
  (learners.value || []).forEach((l) => {
    if (l.learningCenter && l.learningCenter !== '—') {
      const key = l.learningCenter.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { id: key, name: l.learningCenter.trim() });
      }
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
});

async function loadAssignedLearners() {
  if (!teacherId.value) return;
  loading.value = true;
  try {
    const { data } = await getAssignedLearners({ teacherId: teacherId.value });
    learners.value = (data || []).map((l) => ({
      id: l.id,
      name: l.name || (l.lastName && l.firstName ? `${l.lastName}, ${l.firstName}${l.middleName ? ' ' + l.middleName : ''}` : (l.fullName || 'Learner')),
      firstName: l.firstName || '',
      lastName: l.lastName || '',
      middleName: l.middleName || '',
      lrn: l.lrn || '',
      level: l.level === 'ELEMENTARY' ? 'A&E Elementary' : (l.level === 'JUNIOR' || l.level === 'LOWER_SECONDARY' || String(l.level || '').toUpperCase().includes('JUN') ? 'A&E Junior High' : l.level) || 'A&E Elementary',
      learningCenter: l.learningCenter || (l.center ? l.center.name : ''),
      progress: typeof l.progress === 'number' ? l.progress : 0,
      status: l.status || 'Active',
    }));
  } catch (err) {
    console.error('Failed to load assigned learners:', err);
    learners.value = [];
  } finally {
    loading.value = false;
  }
}

const filteredLearners = computed(() => {
  return learners.value.filter((l) => {
    // 1. Search filter: Learner Name or LRN
    if (searchQuery.value && searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase();
      const nameMatch =
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.firstName && l.firstName.toLowerCase().includes(q)) ||
        (l.lastName && l.lastName.toLowerCase().includes(q)) ||
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(q);
      const lrnMatch = l.lrn && String(l.lrn).toLowerCase().includes(q);
      if (!nameMatch && !lrnMatch) {
        return false;
      }
    }

    // 2. Learning Center filter
    if (selectedCenter.value && selectedCenter.value.trim()) {
      const centerStr = (l.learningCenter || '').toLowerCase().trim();
      const targetCenter = selectedCenter.value.toLowerCase().trim();
      if (centerStr !== targetCenter) {
        return false;
      }
    }

    // 3. ALS Level filter
    if (selectedLevel.value && selectedLevel.value.trim()) {
      const lvlStr = (l.level || '').toLowerCase().trim();
      const targetLvl = selectedLevel.value.toLowerCase().trim();
      if (lvlStr !== targetLvl && !lvlStr.includes(targetLvl) && !(lvlStr.includes('junior') && targetLvl.includes('junior'))) {
        return false;
      }
    }

    return true;
  });
});

const totalCount = computed(() => filteredLearners.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));

const pagedLearners = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredLearners.value.slice(start, start + pageSize.value);
});

function clearFilters() {
  searchQuery.value = '';
  selectedCenter.value = '';
  selectedLevel.value = '';
  currentPage.value = 1;
}

watch([searchQuery, selectedCenter, selectedLevel, pageSize], () => {
  currentPage.value = 1;
});

watch(teacherId, (newId) => {
  if (newId) {
    loadAssignedLearners();
  }
});

function formatAlsLevel(val) {
  if (!val) return '—';
  const s = String(val).toUpperCase();
  if (s.includes('ELEM')) return 'A&E Elementary';
  if (s.includes('JUN') || s.includes('LOWER_SEC') || s.includes('SEC')) return 'A&E Junior High';
  return String(val).trim();
}

onMounted(() => {
  if (route.query.center) {
    selectedCenter.value = route.query.center;
  }
  loadAssignedLearners();
});
</script>

<style scoped>
.my-learners-page {
  padding-bottom: 2.5rem;
}

/* Breadcrumb */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  margin-bottom: 0.5rem;
}

.breadcrumb-link {
  color: #64748b;
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: #2563eb;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

.breadcrumb-current {
  color: #64748b;
  font-weight: 500;
}

/* Page Header */
.page-header-row {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.625rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.35rem 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0;
}

/* Filter Card */
.learners-filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.15rem 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.filter-controls-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.8fr) minmax(180px, 1fr) minmax(160px, 1fr) auto;
  gap: 1rem;
  align-items: end;
  width: 100%;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  color: #94a3b8;
  pointer-events: none;
}

.filter-search-input {
  width: 100%;
  height: 42px;
  min-height: 42px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 2.25rem 0 2.45rem;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.filter-search-input::placeholder {
  color: #94a3b8;
}

.filter-search-input:focus {
  border-color: #2563eb;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.search-clear-btn {
  position: absolute;
  right: 0.65rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.search-clear-btn:hover {
  color: #334155;
  background: #e2e8f0;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.filter-select {
  width: 100%;
  height: 42px;
  min-height: 42px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 2.25rem 0 0.85rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: #0f172a;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px 8px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.filter-select:hover {
  border-color: #94a3b8;
}

.filter-select:focus {
  border-color: #2563eb;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.filter-action-cell {
  display: flex;
  align-items: flex-end;
}

/* Table Card */
.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.learners-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.learners-table th {
  background: #f8fafc;
  padding: 0.85rem 1rem;
  font-size: 0.725rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.learners-table td {
  padding: 0.95rem 1rem;
  font-size: 0.875rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.cell-index {
  color: #94a3b8;
  font-size: 0.8125rem;
}

.cell-name {
  font-weight: 600;
}

.learner-name-link {
  color: #0f172a;
  text-decoration: none;
  transition: color 0.15s ease;
}

.learner-name-link:hover {
  color: #2563eb;
}

.cell-lrn {
  color: #64748b;
  font-family: monospace;
  font-size: 0.8125rem;
}

.level-pill {
  display: inline-block;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid rgba(37, 99, 235, 0.15);
}

/* Progress bar */
.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.progress-track {
  width: 80px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2563eb;
  border-radius: 9999px;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}

/* Status badge & column */
.th-status,
.cell-status {
  text-align: center;
}

.th-action,
.cell-action {
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-active {
  background: #dcfce7;
  color: #15803d;
}

.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
}

/* Action button */
.btn-view-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--action-view-border, #DCE7F6);
  background: var(--action-view-bg, #EFF6FF);
  border-radius: 6px;
  color: var(--action-view-color, #4169A8);
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-view-icon:hover {
  background: var(--action-view-hover-bg, #E0EEFE);
  color: var(--action-view-hover-color, #315488);
  border-color: var(--action-view-hover-border, #B9D3F4);
}

.btn-view-icon:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8);
  outline-offset: 1px;
  box-shadow: 0 0 0 3px var(--action-view-focus-ring, rgba(65, 105, 168, 0.35));
}

.view-profile-btn {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 6px;
  font-size: 0.775rem;
  font-weight: 600;
  color: #334155;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.view-profile-btn:hover {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

/* State (Empty / Loading) Container matching reference */
.state-container {
  padding: 4.5rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.state-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.15rem;
}

.state-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.35rem 0;
}

.state-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* Pagination Footer */
.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.8125rem;
  color: #64748b;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.rows-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rows-select {
  padding: 0.25rem 1.5rem 0.25rem 0.5rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #0f172a;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.4rem center;
  background-size: 12px;
}

.page-nav-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-nav-btn {
  background: transparent;
  border: none;
  font-size: 0.8125rem;
  color: #475569;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.page-nav-btn:hover:not(:disabled) {
  color: #2563eb;
  background: #eff6ff;
}

.page-nav-btn:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .filter-controls-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .filter-group-search {
    grid-column: 1 / -1;
  }
  .filter-action-cell {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width: 640px) {
  .filter-controls-row {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
  .filter-action-cell .btn-clear-filters {
    width: 100%;
    justify-content: center;
  }
  .pagination-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

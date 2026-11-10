<template>
  <div class="page-container attendance-history-page">
    <!-- ============================================================ -->
    <!-- VIEW 1: ATTENDANCE HISTORY — LEARNER LIST                    -->
    <!-- ============================================================ -->
    <template v-if="!selectedLearner">
      <!-- Standardized Page Header -->
      <PageHeader
        title="Attendance History"
        description="View and monitor learner attendance records."
        :breadcrumbs="[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Attendance', to: '/dashboard/attendance' },
          { label: 'Attendance History' },
        ]"
      >
        <template #actions>
          <router-link to="/dashboard/attendance" class="btn-take-attendance">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Take Attendance</span>
          </router-link>
        </template>
      </PageHeader>

      <!-- Filter Section Card -->
      <div class="filter-card">
        <div class="filter-card-header">
          <div class="filter-header-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span class="filter-card-title">Filter Attendance Records</span>
          </div>
          <button
            type="button"
            class="btn-clear-filters"
            :class="{ 'is-active': hasActiveFilters }"
            @click="resetFilters"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Clear Filters</span>
          </button>
        </div>

        <div class="filters-grid">
          <!-- 1. Learning Center Dropdown -->
          <div class="filter-field">
            <label class="filter-label" for="att-filter-center">Learning Center</label>
            <div class="select-wrapper">
              <select id="att-filter-center" v-model="selectedCenter" class="filter-select">
                <option value="">All Learning Centers</option>
                <option v-for="center in centerOptions" :key="center" :value="center">
                  {{ center }}
                </option>
              </select>
              <span class="select-chevron">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </div>
          </div>

          <!-- 2. ALS Level Dropdown -->
          <div class="filter-field">
            <label class="filter-label" for="att-filter-level">ALS Level</label>
            <div class="select-wrapper">
              <select id="att-filter-level" v-model="selectedProgramLevel" class="filter-select">
                <option value="">All ALS Levels</option>
                <option v-for="lvl in assignedLevelOptions" :key="lvl" :value="lvl">
                  {{ lvl }}
                </option>
              </select>
              <span class="select-chevron">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </div>
          </div>

          <!-- 3. Date Range: Start Date -->
          <div class="filter-field">
            <label class="filter-label" for="att-filter-start">Start Date</label>
            <input
              id="att-filter-start"
              v-model="startDate"
              type="date"
              class="filter-date-input"
              aria-label="Start Date"
            />
          </div>

          <!-- 4. Date Range: End Date -->
          <div class="filter-field">
            <label class="filter-label" for="att-filter-end">End Date</label>
            <input
              id="att-filter-end"
              v-model="endDate"
              type="date"
              class="filter-date-input"
              aria-label="End Date"
            />
          </div>

          <!-- 5. Search Bar -->
          <div class="filter-field search-field">
            <label class="filter-label" for="att-filter-search">Search</label>
            <div class="search-input-wrapper">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="att-filter-search"
                v-model="searchQuery"
                type="text"
                class="filter-search-input"
                placeholder="Search learner name or LRN..."
              />
              <button
                v-if="searchQuery"
                type="button"
                class="clear-search-btn"
                @click="searchQuery = ''"
                aria-label="Clear search query"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Banner -->
      <div v-if="loadError" class="att-error-banner" role="alert">
        <span>{{ loadError }}</span>
        <button type="button" class="btn-retry-inline" @click="loadAttendanceData">Retry</button>
      </div>

      <!-- Learner Attendance Summary Table Card -->
      <div class="table-card learners-attendance-card">
        <div v-if="loading" class="empty-state-box">
          <p class="empty-desc">Loading learner attendance records...</p>
        </div>

        <div v-else-if="filteredLearnersWithStats.length === 0" class="empty-state-box">
          <div class="empty-icon-wrap">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 class="empty-title">
            {{ assignedLearners.length === 0 ? 'No assigned learners yet' : 'No matching learners found' }}
          </h3>
          <p class="empty-desc">
            {{ assignedLearners.length === 0
              ? 'Learners assigned to your learning centers will appear here for attendance monitoring.'
              : 'No learners match your selected filter criteria. Try adjusting or clearing your filters.'
            }}
          </p>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="btn-primary-empty"
            @click="resetFilters"
          >
            Clear Filters
          </button>
        </div>

        <div v-else class="table-responsive">
          <table class="data-table learner-history-table">
            <thead>
              <tr>
                <th class="th-learner-name">Learner Name</th>
                <th class="th-lrn">LRN</th>
                <th class="th-level">ALS Level</th>
                <th class="th-center">Learning Center</th>
                <th class="th-rate">Attendance Rate</th>
                <th class="th-action">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredLearnersWithStats"
                :key="row.id"
                class="session-row"
                @click="openLearnerAttendance(row)"
              >
                <td class="col-name">
                  <div class="learner-cell-flex">
                    <span class="learner-avatar-icon" aria-hidden="true">
                      <img
                        v-if="row.profilePhoto"
                        :src="row.profilePhoto"
                        :alt="row.name"
                        class="learner-avatar-img"
                        @error="row.profilePhoto = null"
                      />
                      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <span class="learner-name-strong">{{ row.name }}</span>
                  </div>
                </td>
                <td class="col-lrn">
                  <span class="lrn-mono">{{ row.lrn || '—' }}</span>
                </td>
                <td class="col-program table-cell-als-level">
                  {{ formatAlsLevel(row.level) }}
                </td>
                <td class="col-center">
                  <span class="center-text">{{ row.learningCenter || '—' }}</span>
                </td>
                <td class="col-rate">
                  <span class="rate-value-pill" :class="getRateBadgeClass(row.attendanceRate, row.totalSessions)">
                    {{ row.attendanceRate }}%
                  </span>
                </td>
                <td class="col-action" @click.stop>
                  <button
                    type="button"
                    class="btn-view-attendance"
                    @click="openLearnerAttendance(row)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span>View Attendance</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Footer / Count -->
        <div v-if="filteredLearnersWithStats.length > 0" class="table-footer-bar">
          <span class="footer-count-text">
            Showing <strong>{{ filteredLearnersWithStats.length }}</strong> learner{{ filteredLearnersWithStats.length === 1 ? '' : 's' }}
          </span>
        </div>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- VIEW 2: INDIVIDUAL LEARNER ATTENDANCE DETAILS PAGE           -->
    <!-- ============================================================ -->
    <template v-else>
      <!-- Breadcrumb -->
      <nav class="breadcrumb-nav" aria-label="Breadcrumb">
        <router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-link-muted">Attendance</span>
        <span class="breadcrumb-separator">/</span>
        <button type="button" class="breadcrumb-btn-link" @click="backToLearnersList">
          Attendance History
        </button>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{{ selectedLearner.name }}</span>
      </nav>

      <!-- Page Header -->
      <div class="page-header-row">
        <div class="page-title-group">
          <h1 class="page-title">Attendance History</h1>
          <p class="page-subtitle">View the attendance records of the selected learner.</p>
        </div>

        <div class="header-actions detail-header-actions">
          <button
            type="button"
            class="btn-back-learners"
            @click="backToLearnersList"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            <span>Back to Learners</span>
          </button>

          <router-link to="/dashboard/attendance" class="btn-take-attendance">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Take Attendance</span>
          </router-link>
        </div>
      </div>

      <!-- Compact Learner Information Section -->
      <div class="learner-info-compact-card">
        <span class="learner-avatar-icon lg" aria-hidden="true">
          <img
            v-if="selectedLearner.profilePhoto"
            :src="selectedLearner.profilePhoto"
            :alt="selectedLearner.name"
            class="learner-avatar-img"
            @error="selectedLearner.profilePhoto = null"
          />
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>

        <div class="learner-info-compact-content">
          <h2 class="learner-info-name">{{ selectedLearner.name }}</h2>
          <div class="learner-info-inline-meta">
            <span><strong>LRN:</strong> {{ selectedLearner.lrn || '—' }}</span>
            <span class="meta-dot">&bull;</span>
            <span><strong>ALS Level:</strong> {{ selectedLearner.level }}</span>
            <span class="meta-dot">&bull;</span>
            <span><strong>Learning Center:</strong> {{ selectedLearner.learningCenter || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Filter Attendance Records by Date (Selected Learner Only) -->
      <div class="learner-date-filter-card">
        <div class="learner-date-filter-row">
          <div class="filter-field">
            <label class="filter-label" for="learner-start-date">Start Date</label>
            <input
              id="learner-start-date"
              v-model="learnerStartDateInput"
              type="date"
              class="filter-date-input"
              aria-label="Start Date"
            />
          </div>

          <div class="filter-field">
            <label class="filter-label" for="learner-end-date">End Date</label>
            <input
              id="learner-end-date"
              v-model="learnerEndDateInput"
              type="date"
              class="filter-date-input"
              aria-label="End Date"
            />
          </div>

          <div class="learner-date-actions">
            <button
              type="button"
              class="btn-date-clear"
              @click="clearLearnerDateFilter"
            >
              Clear
            </button>
            <button
              type="button"
              class="btn-date-apply"
              @click="applyLearnerDateFilter"
            >
              Apply
            </button>
          </div>
        </div>

        <p v-if="learnerDateError" class="date-filter-error" role="alert">
          {{ learnerDateError }}
        </p>
      </div>

      <!-- Attendance Summary Statistics (Four Compact Summary Cards in One Horizontal Row) -->
      <div class="summary-cards-four-grid">
        <!-- Card 1: Total Sessions -->
        <div class="summary-stat-card">
          <div class="stat-card-icon icon-sessions" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="stat-card-body">
            <span class="stat-card-label">Total Sessions</span>
            <strong class="stat-card-value">{{ selectedLearnerSummary.totalSessions }}</strong>
          </div>
        </div>

        <!-- Card 2: Present -->
        <div class="summary-stat-card">
          <div class="stat-card-icon icon-present" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-card-body">
            <span class="stat-card-label">Present</span>
            <strong class="stat-card-value text-green">{{ selectedLearnerSummary.present }}</strong>
          </div>
        </div>

        <!-- Card 3: Absent -->
        <div class="summary-stat-card">
          <div class="stat-card-icon icon-absent" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="stat-card-body">
            <span class="stat-card-label">Absent</span>
            <strong class="stat-card-value text-red">{{ selectedLearnerSummary.absent }}</strong>
          </div>
        </div>

        <!-- Card 4: Attendance Rate -->
        <div class="summary-stat-card">
          <div class="stat-card-icon icon-rate" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div class="stat-card-body">
            <span class="stat-card-label">Attendance Rate</span>
            <strong class="stat-card-value text-blue">{{ selectedLearnerSummary.attendanceRate }}%</strong>
          </div>
        </div>
      </div>

      <!-- Individual Learner Attendance Records Table -->
      <div class="table-card learner-records-table-card">
        <div class="records-card-header">
          <h3 class="records-card-title">Attendance Records</h3>
          <span class="records-count-pill">
            {{ selectedLearnerFilteredRecords.length }} {{ selectedLearnerFilteredRecords.length === 1 ? 'Session' : 'Sessions' }}
          </span>
        </div>

        <div v-if="selectedLearnerFilteredRecords.length === 0" class="empty-state-box compact">
          <div class="empty-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h3 class="empty-title">No attendance records found</h3>
          <p class="empty-desc">
            {{ (appliedLearnerStartDate || appliedLearnerEndDate)
              ? 'No attendance sessions were recorded for this learner within the selected date range.'
              : 'No attendance sessions have been recorded for this learner yet.'
            }}
          </p>
          <button
            v-if="appliedLearnerStartDate || appliedLearnerEndDate"
            type="button"
            class="btn-primary-empty"
            @click="clearLearnerDateFilter"
          >
            Clear Date Filter
          </button>
        </div>

        <div v-else class="table-responsive">
          <table class="data-table individual-records-table">
            <thead>
              <tr>
                <th class="th-no">No.</th>
                <th class="th-date">Date</th>
                <th class="th-center">Learning Center</th>
                <th class="th-level">ALS Level</th>
                <th class="th-status">Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(rec, idx) in selectedLearnerFilteredRecords"
                :key="rec.uniqueKey || rec.id || idx"
              >
                <td class="col-num">{{ idx + 1 }}</td>
                <td class="col-date">
                  <span class="date-text">{{ formatDisplayDate(rec.date) }}</span>
                </td>
                <td class="col-center">
                  <span class="center-text">{{ rec.learningCenter || selectedLearner.learningCenter || '—' }}</span>
                </td>
                <td class="col-program table-cell-als-level">
                  {{ formatAlsLevel(rec.level || selectedLearner.level) }}
                </td>
                <td class="col-status">
                  <span
                    class="status-badge"
                    :class="getStatusBadgeClass(rec.status)"
                  >
                    <span class="status-dot"></span>
                    {{ formatStatusLabel(rec.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getAssignedLearners } from '../api/learners.js';
import { getAttendanceRecords } from '../api/attendance.js';

const route = useRoute();
const router = useRouter();
const { currentTeacher, teacherId, assignedCenters, assignedLevelOptions } = useTeacherSession();

// Main Page Filter State (Preserved when viewing a learner and returning)
const selectedCenter = ref('');
const selectedProgramLevel = ref('');
const startDate = ref('');
const endDate = ref('');
const searchQuery = ref('');

// When learning center changes or assigned levels change, ensure selectedProgramLevel remains valid
watch(selectedCenter, () => {
  if (selectedProgramLevel.value && !assignedLevelOptions.value.includes(selectedProgramLevel.value)) {
    selectedProgramLevel.value = '';
  }
});

watch(assignedLevelOptions, (newOpts) => {
  if (selectedProgramLevel.value && !newOpts.includes(selectedProgramLevel.value)) {
    selectedProgramLevel.value = '';
  }
}, { immediate: true });

// Data State
const loading = ref(false);
const loadError = ref('');
const assignedLearners = ref([]);
const attendanceRecords = ref([]);

// Selected Learner State for Individual Attendance Page
const selectedLearnerId = ref(null);
const learnerStartDateInput = ref('');
const learnerEndDateInput = ref('');
const appliedLearnerStartDate = ref('');
const appliedLearnerEndDate = ref('');
const learnerDateError = ref('');

function formatAlsLevel(levelVal) {
  if (!levelVal) return 'A&E Elementary';
  const norm = String(levelVal).toLowerCase().trim();
  if (norm.includes('junior') || norm.includes('jhs') || norm.includes('sec')) {
    return 'A&E Junior High';
  }
  return 'A&E Elementary';
}

function normalizeStatusUpper(statusVal) {
  const s = String(statusVal || 'PRESENT').trim().toUpperCase();
  if (s === 'ABSENT') return 'ABSENT';
  if (s === 'LATE') return 'LATE';
  if (s === 'EXCUSED') return 'EXCUSED';
  return 'PRESENT';
}

function formatStatusLabel(statusVal) {
  const s = normalizeStatusUpper(statusVal);
  if (s === 'ABSENT') return 'Absent';
  if (s === 'LATE') return 'Late';
  if (s === 'EXCUSED') return 'Excused';
  return 'Present';
}

function getStatusBadgeClass(statusVal) {
  const s = normalizeStatusUpper(statusVal);
  if (s === 'ABSENT') return 'badge-absent';
  if (s === 'LATE') return 'badge-late';
  if (s === 'EXCUSED') return 'badge-excused';
  return 'badge-present';
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  const clean = String(dateStr).split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${monthName} ${parseInt(d, 10)}, ${y}`;
  }
  return String(dateStr);
}

// Learning Center Options (Teacher's assigned centers + centers of assigned learners)
const centerOptions = computed(() => {
  const seen = new Set();
  const list = [];
  for (const c of assignedCenters.value || []) {
    if (c.name && c.name !== '—' && !seen.has(c.name)) {
      seen.add(c.name);
      list.push(c.name);
    }
  }
  for (const l of assignedLearners.value || []) {
    if (l.learningCenter && l.learningCenter !== '—' && !seen.has(l.learningCenter)) {
      seen.add(l.learningCenter);
      list.push(l.learningCenter);
    }
  }
  return list;
});

// Load Assigned Learners and Attendance Records from Backend + Local Teacher Storage Fallback
async function loadAttendanceData() {
  loading.value = true;
  loadError.value = '';
  const tid = teacherId.value || currentTeacher.value?.id;

  if (!tid) {
    assignedLearners.value = [];
    attendanceRecords.value = [];
    loading.value = false;
    return;
  }

  try {
    const [learnersRes, attRes] = await Promise.allSettled([
      getAssignedLearners({ teacherId: tid }),
      getAttendanceRecords({ teacherId: tid }),
    ]);

    // 1. Assigned Learners
    if (learnersRes.status === 'fulfilled' && Array.isArray(learnersRes.value.data)) {
      const uniqueLearnersMap = new Map();
      for (const l of learnersRes.value.data) {
        const lid = Number(l.id);
        if (!lid || uniqueLearnersMap.has(lid)) continue;
        uniqueLearnersMap.set(lid, {
          id: lid,
          name: l.name || l.fullName || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Learner',
          lrn: l.lrn || '',
          level: formatAlsLevel(l.level),
          learningCenter: l.learningCenter && l.learningCenter !== '—' ? l.learningCenter : (l.center ? l.center.name : ''),
          learningCenterId: l.learningCenterId || null,
          profilePhoto: l.profilePhoto || null,
        });
      }
      assignedLearners.value = Array.from(uniqueLearnersMap.values());
    } else {
      assignedLearners.value = [];
    }

    // 2. Attendance Records (Database records + any un-synced local session entries without duplicates)
    const rawDbRecords =
      attRes.status === 'fulfilled' && Array.isArray(attRes.value.data)
        ? attRes.value.data
        : [];

    const normalizedList = [];
    const seenSessionLearnerKeys = new Set();

    for (const r of rawDbRecords) {
      const lid = Number(r.learnerId);
      if (!lid) continue;
      const dateStr = String(r.date || r.sessionDate || '').split('T')[0];
      if (!dateStr) continue;

      const centerName = r.learningCenter && r.learningCenter !== '—' ? r.learningCenter : '';
      const levelLabel = formatAlsLevel(r.level);
      // Unique key per recorded attendance row (id if present, otherwise learnerId + date + center)
      const uniqueKey = r.id ? `db_${r.id}` : `db_${lid}_${dateStr}_${centerName}`;
      const semanticDateCenterKey = `${lid}_${dateStr}_${centerName.toLowerCase()}`;

      if (!seenSessionLearnerKeys.has(uniqueKey)) {
        seenSessionLearnerKeys.add(uniqueKey);
        seenSessionLearnerKeys.add(semanticDateCenterKey);
        normalizedList.push({
          uniqueKey,
          id: r.id,
          learnerId: lid,
          learnerName: r.learnerName || '',
          date: dateStr,
          learningCenter: centerName,
          level: levelLabel,
          status: normalizeStatusUpper(r.status),
          remarks: r.remarks || '',
        });
      }
    }

    // Check localStorage sessions for any offline-recorded sessions not already in DB
    try {
      const rawLocal = localStorage.getItem(`als_attendance_sessions_${tid}`);
      if (rawLocal) {
        const localSessions = JSON.parse(rawLocal);
        if (Array.isArray(localSessions)) {
          for (const sess of localSessions) {
            const dateStr = String(sess.date || '').split('T')[0];
            if (!dateStr || !Array.isArray(sess.learners)) continue;
            const centerName = sess.learningCenter || '';
            const levelLabel = formatAlsLevel(sess.programLevel);

            for (const lItem of sess.learners) {
              const lid = Number(lItem.id || lItem.learnerId);
              if (!lid) continue;
              const semanticKey = `${lid}_${dateStr}_${centerName.toLowerCase()}`;
              const sessSpecificKey = `${sess.id || dateStr}_${lid}`;
              if (!seenSessionLearnerKeys.has(semanticKey) && !seenSessionLearnerKeys.has(sessSpecificKey)) {
                seenSessionLearnerKeys.add(sessSpecificKey);
                normalizedList.push({
                  uniqueKey: `local_${sessSpecificKey}`,
                  id: sessSpecificKey,
                  learnerId: lid,
                  learnerName: lItem.name || '',
                  date: dateStr,
                  learningCenter: centerName,
                  level: formatAlsLevel(lItem.level || levelLabel),
                  status: normalizeStatusUpper(lItem.status),
                  remarks: lItem.remarks || '',
                });
              }
            }
          }
        }
      }
    } catch {
      // ignore local storage parse errors
    }

    // Sort all attendance records by most recent date first
    normalizedList.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    attendanceRecords.value = normalizedList;
  } catch (err) {
    console.error('Error loading attendance history data:', err);
    loadError.value = 'Unable to load learner attendance records. Please try again.';
  } finally {
    loading.value = false;
  }
}

// Compute attendance statistics for a given learner ID and optional date range
function computeLearnerStats(learnerId, fromDateStr = '', toDateStr = '') {
  const lid = Number(learnerId);
  const recs = attendanceRecords.value.filter((r) => {
    if (Number(r.learnerId) !== lid) return false;
    if (fromDateStr && r.date < fromDateStr) return false;
    if (toDateStr && r.date > toDateStr) return false;
    return true;
  });

  const totalSessions = recs.length;
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const r of recs) {
    const st = normalizeStatusUpper(r.status);
    if (st === 'PRESENT') present += 1;
    else if (st === 'ABSENT') absent += 1;
    else if (st === 'LATE') late += 1;
    else if (st === 'EXCUSED') excused += 1;
  }

  // Existing ALS LMS attendance policy: Present (and Late if applicable) count toward attendance rate
  const attendedCount = present + late;
  const attendanceRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

  return {
    records: recs,
    totalSessions,
    present,
    absent,
    late,
    excused,
    attendanceRate,
  };
}

// Main Page Filter Computation
const hasActiveFilters = computed(() => {
  return Boolean(
    selectedCenter.value !== '' ||
      selectedProgramLevel.value !== '' ||
      startDate.value !== '' ||
      endDate.value !== '' ||
      searchQuery.value.trim() !== ''
  );
});

// Each assigned learner appears once with their computed attendance rate
const filteredLearnersWithStats = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();

  return assignedLearners.value
    .filter((learner) => {
      // 1. Learning Center Filter
      if (selectedCenter.value) {
        const lCenter = (learner.learningCenter || '').trim().toLowerCase();
        const targetCenter = selectedCenter.value.trim().toLowerCase();
        if (lCenter !== targetCenter) return false;
      }

      // 2. ALS Level Filter
      if (selectedProgramLevel.value) {
        if (formatAlsLevel(learner.level) !== selectedProgramLevel.value) {
          return false;
        }
      }

      // 3. Search Filter (Learner Name or LRN)
      if (q) {
        const matchName = (learner.name || '').toLowerCase().includes(q);
        const matchLrn = (learner.lrn || '').toLowerCase().includes(q);
        if (!matchName && !matchLrn) return false;
      }

      return true;
    })
    .map((learner) => {
      const stats = computeLearnerStats(learner.id, startDate.value, endDate.value);
      return {
        ...learner,
        totalSessions: stats.totalSessions,
        presentCount: stats.present,
        absentCount: stats.absent,
        attendanceRate: stats.attendanceRate,
      };
    });
});

function getRateBadgeClass(rate, totalSessions) {
  if (!totalSessions) return 'rate-neutral';
  if (rate >= 80) return 'rate-good';
  if (rate >= 60) return 'rate-warn';
  return 'rate-low';
}

function resetFilters() {
  selectedCenter.value = '';
  selectedProgramLevel.value = '';
  startDate.value = '';
  endDate.value = '';
  searchQuery.value = '';
}

// Selected Learner Object for Individual Attendance View
const selectedLearner = computed(() => {
  if (!selectedLearnerId.value) return null;
  return (
    assignedLearners.value.find(
      (l) => Number(l.id) === Number(selectedLearnerId.value)
    ) || null
  );
});

// Selected Learner Summary & Filtered Records (based on applied date filter)
const selectedLearnerStatsObj = computed(() => {
  if (!selectedLearner.value) {
    return {
      records: [],
      totalSessions: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0,
    };
  }
  return computeLearnerStats(
    selectedLearner.value.id,
    appliedLearnerStartDate.value,
    appliedLearnerEndDate.value
  );
});

const selectedLearnerSummary = computed(() => selectedLearnerStatsObj.value);
const selectedLearnerFilteredRecords = computed(() => selectedLearnerStatsObj.value.records);

function openLearnerAttendance(learner) {
  if (!learner || !learner.id) return;
  selectedLearnerId.value = Number(learner.id);
  // Initialize learner date filter from main page date filter if set, or empty
  learnerStartDateInput.value = startDate.value || '';
  learnerEndDateInput.value = endDate.value || '';
  appliedLearnerStartDate.value = startDate.value || '';
  appliedLearnerEndDate.value = endDate.value || '';
  learnerDateError.value = '';

  const targetPath = `/dashboard/attendance/history/${learner.id}`;
  if (route.path !== targetPath) {
    router.push(targetPath).catch(() => {});
  }
}

function backToLearnersList() {
  selectedLearnerId.value = null;
  learnerDateError.value = '';
  if (route.params.learnerId) {
    router.push('/dashboard/attendance/history').catch(() => {});
  }
}

function applyLearnerDateFilter() {
  learnerDateError.value = '';
  if (
    learnerStartDateInput.value &&
    learnerEndDateInput.value &&
    learnerEndDateInput.value < learnerStartDateInput.value
  ) {
    learnerDateError.value = 'End Date cannot be earlier than Start Date.';
    return;
  }
  appliedLearnerStartDate.value = learnerStartDateInput.value;
  appliedLearnerEndDate.value = learnerEndDateInput.value;
}

function clearLearnerDateFilter() {
  learnerStartDateInput.value = '';
  learnerEndDateInput.value = '';
  appliedLearnerStartDate.value = '';
  appliedLearnerEndDate.value = '';
  learnerDateError.value = '';
}

onMounted(async () => {
  await loadAttendanceData();
  if (route.params.learnerId) {
    const lid = Number(route.params.learnerId);
    if (!isNaN(lid) && assignedLearners.value.some((l) => Number(l.id) === lid)) {
      selectedLearnerId.value = lid;
    }
  }
});

watch(
  () => route.params.learnerId,
  (newLid) => {
    if (!newLid) {
      selectedLearnerId.value = null;
      learnerDateError.value = '';
    } else {
      const lid = Number(newLid);
      if (!isNaN(lid) && lid !== selectedLearnerId.value) {
        selectedLearnerId.value = lid;
      }
    }
  }
);
</script>

<style scoped>
.attendance-history-page {
  padding-bottom: 3rem;
}

/* Breadcrumbs */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
}

.breadcrumb-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-btn-link {
  background: transparent;
  border: none;
  padding: 0;
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
}

.breadcrumb-btn-link:hover {
  text-decoration: underline;
}

.breadcrumb-link-muted {
  color: #64748b;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

.breadcrumb-current {
  color: #0f172a;
  font-weight: 600;
}

/* Page Header */
.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.35rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.65rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
}

.detail-header-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.btn-back-learners {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.58rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-back-learners:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-take-attendance {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.15rem;
  height: 40px;
  background: #2563eb;
  color: #ffffff;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.22);
  transition: all 0.15s ease;
  white-space: nowrap;
  box-sizing: border-box;
}

.btn-take-attendance:hover {
  background: #1d4ed8;
}

/* Filter Card (Main View) */
.filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.filter-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1.25rem;
  margin: 0;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;
}

.filter-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 700;
}

.filter-card-title {
  color: #1e293b;
}

.btn-clear-filters {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-clear-filters:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-clear-filters.is-active {
  background: #ffffff;
  color: #2563eb;
  border-color: #93c5fd;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(0, 1.4fr);
  gap: 0.875rem;
  align-items: flex-end;
  padding: 1rem 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

.filter-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.select-wrapper,
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 42px;
}

.filter-select,
.filter-date-input,
.filter-search-input {
  width: 100%;
  height: 42px;
  min-height: 42px;
  max-height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 0.85rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
  line-height: normal;
}

.filter-date-input {
  display: flex;
  align-items: center;
}

.filter-select {
  appearance: none;
  padding-right: 2rem;
  cursor: pointer;
}

.select-chevron {
  position: absolute;
  right: 0.75rem;
  pointer-events: none;
  color: #64748b;
  display: flex;
  align-items: center;
}

.search-input-wrapper svg {
  position: absolute;
  left: 0.75rem;
  color: #94a3b8;
  pointer-events: none;
}

.filter-search-input {
  padding-left: 2.25rem;
  padding-right: 2rem;
}

.filter-select:focus,
.filter-date-input:focus,
.filter-search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.15rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

/* Error Banner */
.att-error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  margin-bottom: 1.15rem;
  font-size: 0.875rem;
}

.btn-retry-inline {
  background: #ffffff;
  border: 1px solid #fca5a5;
  color: #991b1b;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
}

/* Table Card */
.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table thead tr {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  padding: 0.85rem 1.15rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #475569;
  white-space: nowrap;
}

.data-table td {
  padding: 0.85rem 1.15rem;
  font-size: 0.875rem;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* Learner List Table Columns */
.th-learner-name {
  width: 28%;
  min-width: 200px;
}

.th-lrn {
  width: 16%;
  min-width: 130px;
}

.th-level {
  width: 16%;
  min-width: 135px;
}

.th-center {
  width: 18%;
  min-width: 145px;
}

.th-rate,
.col-rate {
  width: 12%;
  min-width: 120px;
  text-align: center;
}

.th-action,
.col-action {
  width: 10%;
  min-width: 150px;
  text-align: center;
}

.session-row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.session-row:hover {
  background: #f8fafc;
}

.learner-cell-flex {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.learner-avatar-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.learner-avatar-icon.lg {
  width: 44px;
  height: 44px;
  background: #eff6ff;
  border-color: #dbeafe;
  color: #2563eb;
}

.learner-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.learner-name-strong {
  font-weight: 600;
  color: #0f172a;
}

.lrn-mono {
  font-family: monospace;
  color: #475569;
}

.level-subtle-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.65rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.center-text {
  color: #334155;
  font-weight: 400;
}

.rate-value-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 0.22rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 700;
}

.rate-value-pill.rate-good {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.rate-value-pill.rate-warn {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.rate-value-pill.rate-low {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.rate-value-pill.rate-neutral {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-view-attendance {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--action-view-bg, #eff6ff);
  border: 1px solid var(--action-view-border, #dce7f6);
  color: var(--action-view-color, #2563eb);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.42rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-view-attendance:hover {
  background: var(--action-view-hover-bg, #dbeafe);
  border-color: var(--action-view-hover-border, #93c5fd);
  color: #1d4ed8;
}

.table-footer-bar {
  padding: 0.85rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-count-text {
  font-size: 0.8125rem;
  color: #64748b;
}

/* ============================================================ */
/* VIEW 2: INDIVIDUAL LEARNER ATTENDANCE DETAILS STYLES         */
/* ============================================================ */
.learner-info-compact-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.15rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.learner-info-compact-content {
  min-width: 0;
  flex: 1;
}

.learner-info-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.learner-info-inline-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.86rem;
  color: #475569;
}

.learner-info-inline-meta strong {
  color: #334155;
  font-weight: 600;
}

.meta-dot {
  color: #cbd5e1;
}

/* Date Filter Bar on Individual Learner Page */
.learner-date-filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.learner-date-filter-row {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 220px) auto;
  gap: 1rem;
  align-items: flex-end;
}

.learner-date-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.btn-date-clear {
  height: 42px;
  min-height: 42px;
  padding: 0 1rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-date-clear:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-date-apply {
  height: 42px;
  min-height: 42px;
  padding: 0 1.2rem;
  background: #2563eb;
  border: 1px solid #2563eb;
  color: #ffffff;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-date-apply:hover {
  background: #1d4ed8;
}

.date-filter-error {
  margin: 0.65rem 0 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #dc2626;
}

/* Four Compact Summary Cards */
.summary-cards-four-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.summary-stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.stat-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card-icon.icon-sessions {
  background: #f1f5f9;
  color: #334155;
}

.stat-card-icon.icon-present {
  background: #f0fdf4;
  color: #16a34a;
}

.stat-card-icon.icon-absent {
  background: #fef2f2;
  color: #dc2626;
}

.stat-card-icon.icon-rate {
  background: #eff6ff;
  color: #2563eb;
}

.stat-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.stat-card-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
}

.stat-card-value {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.15;
}

.stat-card-value.text-green {
  color: #15803d;
}

.stat-card-value.text-red {
  color: #b91c1c;
}

.stat-card-value.text-blue {
  color: #1d4ed8;
}

/* Individual Learner Attendance Records Table Card */
.records-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.records-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.records-count-pill {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
}

.th-no,
.col-num {
  width: 65px;
  color: #64748b;
  font-weight: 600;
}

.th-date,
.col-date {
  width: 22%;
  min-width: 140px;
}

.date-text {
  font-weight: 600;
  color: #0f172a;
}

.th-status,
.col-status {
  width: 180px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.badge-present {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.badge-present .status-dot {
  background: #16a34a;
}

.badge-absent {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.badge-absent .status-dot {
  background: #dc2626;
}

.badge-late {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.badge-late .status-dot {
  background: #d97706;
}

.badge-excused {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.badge-excused .status-dot {
  background: #2563eb;
}

/* Empty State */
.empty-state-box {
  padding: 3.5rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-state-box.compact {
  padding: 2.75rem 1.5rem;
}

.empty-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.9rem;
}

.empty-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.35rem 0;
}

.empty-desc {
  font-size: 0.875rem;
  color: #64748b;
  max-width: 420px;
  line-height: 1.5;
  margin: 0 0 1.1rem 0;
}

.btn-primary-empty {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 1.15rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-primary-empty:hover {
  background: #1d4ed8;
}

/* Responsive Breakpoints */
@media (max-width: 1200px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.875rem;
    padding: 1rem 1.15rem;
  }
  .search-field {
    grid-column: 1 / -1;
  }
  .summary-cards-four-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .learner-date-filter-row {
    grid-template-columns: 1fr 1fr;
  }
  .learner-date-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}

@media (max-width: 640px) {
  .page-header-row {
    align-items: stretch;
  }
  .filter-card-header {
    padding: 0.75rem 1rem;
  }
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
  }
  .search-field {
    grid-column: auto;
  }
  .learner-date-filter-row {
    grid-template-columns: 1fr;
  }
  .learner-date-actions .btn-date-clear,
  .learner-date-actions .btn-date-apply {
    flex: 1;
  }
  .summary-cards-four-grid {
    grid-template-columns: 1fr;
  }
}
</style>

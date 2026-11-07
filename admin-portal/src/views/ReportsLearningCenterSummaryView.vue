<template>
  <div class="page-container lc-summary-view">
    <!-- Standardized Page Header & Breadcrumb (no-print) -->
    <ReportsPageHeader
      title="Learning Center Summary"
      description="Administrative overview of Community Learning Centers."
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-secondary"
          @click="loadData"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>Refresh</span>
        </button>

        <router-link to="/dashboard/learning-centers" class="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
          </svg>
          <span>Manage Learning Centers</span>
        </router-link>
      </template>
    </ReportsPageHeader>

    <!-- Summary Cards (Single Horizontal Row) -->
    <div class="report-stats-grid">
      <!-- Card 1: Total Learning Centers -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
          </svg>
        </div>
        <span class="report-card-label">Total Learning Centers</span>
        <span class="report-card-value">{{ learningCenters.length }}</span>
        <span class="report-card-desc">Registered Community Learning Centers</span>
      </div>

      <!-- Card 2: Total Learners -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <span class="report-card-label">Total Learners</span>
        <span class="report-card-value text-green">{{ learners.length }}</span>
        <span class="report-card-desc">Learners enrolled across centers</span>
      </div>

      <!-- Card 3: Total ALS Teachers -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
          </svg>
        </div>
        <span class="report-card-label">Total ALS Teachers</span>
        <span class="report-card-value text-purple">{{ teachers.length }}</span>
        <span class="report-card-desc">Assigned ALS Teachers</span>
      </div>

      <!-- Card 4: Average Attendance Rate -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-amber">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <span class="report-card-label">Average Attendance Rate</span>
        <span class="report-card-value text-amber">{{ districtAvgAttendanceRate }}%</span>
        <span class="report-card-desc">Combined Community Learning Center Attendance Rate</span>
      </div>
    </div>

    <!-- Search and Status Filter (One Row) -->
    <div class="report-filter-bar">
      <div class="report-filter-controls">
        <div class="filter-field-col filter-field-search">
          <label>Search</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search learning center or assigned teacher..."
          />
        </div>

        <div class="filter-field-col filter-field-status">
          <label>Status</label>
          <select v-model="statusFilter">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button
          v-if="searchQuery || statusFilter"
          type="button"
          class="btn btn-secondary"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </div>
    </div>

    <!-- Table: Community Learning Centers Breakdown -->
    <div class="table-card breakdown-card">
      <div class="table-header-row breakdown-header">
        <div class="header-title-wrap">
          <h3 class="breakdown-title">Community Learning Centers Breakdown</h3>
          <p class="breakdown-subtitle">Consolidated administrative overview of each center</p>
        </div>
      </div>

      <!-- Empty State if no records exist -->
      <div v-if="filteredCenterRows.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
          </svg>
        </div>
        <h3>No records found</h3>
        <p>Community learning centers entered in the system will appear here.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-responsive">
        <table class="data-table breakdown-table">
          <thead>
            <tr>
              <th class="col-no text-center">No.</th>
              <th class="col-center text-left">Learning Center</th>
              <th class="col-teachers text-left">Assigned ALS Teachers</th>
              <th class="col-learners text-center">Total Learners</th>
              <th class="col-elem text-center">A&E Elementary</th>
              <th class="col-jhs text-center">A&E Junior High</th>
              <th class="col-rate text-center">Attendance Rate</th>
              <th class="col-status text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in filteredCenterRows" :key="row.id || idx">
              <td class="col-no text-center cell-num">{{ idx + 1 }}</td>
              <td class="col-center cell-center-info">
                <div class="center-name">{{ row.name }}</div>
                <div class="center-address">{{ row.locationAddress || 'Naawan, Misamis Oriental' }}</div>
              </td>
              <td class="col-teachers cell-teachers">
                <div v-if="row.assignedTeachers.length > 0" class="teachers-wrap">
                  <span
                    v-for="(t, tIdx) in row.assignedTeachers"
                    :key="tIdx"
                    class="teacher-pill"
                  >
                    {{ t }}
                  </span>
                </div>
                <span v-else class="text-muted text-sm">—</span>
              </td>
              <td class="col-learners text-center font-mono">{{ row.totalLearners }}</td>
              <td class="col-elem text-center font-mono">{{ row.elementaryLearners }}</td>
              <td class="col-jhs text-center font-mono">{{ row.juniorLearners }}</td>
              <td class="col-rate text-center">
                <span
                  v-if="row.attendanceRate !== null"
                  class="badge"
                  :class="row.attendanceRate >= 80 ? 'badge-green' : row.attendanceRate >= 60 ? 'badge-amber' : 'badge-red'"
                >
                  {{ row.attendanceRate }}%
                </span>
                <span v-else class="text-muted text-sm">—</span>
              </td>
              <td class="col-status text-center">
                <span
                  class="badge"
                  :class="(row.status || '').toLowerCase() === 'active' ? 'badge-green' : 'badge-amber'"
                >
                  {{ (row.status || 'Active').toUpperCase() }}
                </span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="table-total-row">
              <td class="col-no text-center text-muted">—</td>
              <td class="col-center font-bold text-main">Total</td>
              <td class="col-teachers text-muted">—</td>
              <td class="col-learners text-center font-mono font-bold text-main">{{ totalFilteredLearners }}</td>
              <td class="col-elem text-center font-mono font-bold text-main">{{ totalElementaryLearners }}</td>
              <td class="col-jhs text-center font-mono font-bold text-main">{{ totalJuniorLearners }}</td>
              <td class="col-rate text-center font-mono font-bold">
                <span
                  v-if="filteredAvgAttendanceRate !== null"
                  class="badge"
                  :class="filteredAvgAttendanceRate >= 80 ? 'badge-green' : filteredAvgAttendanceRate >= 60 ? 'badge-amber' : 'badge-red'"
                >
                  {{ filteredAvgAttendanceRate }}%
                </span>
                <span v-else class="text-muted text-sm">—</span>
              </td>
              <td class="col-status text-center text-muted">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ReportsPageHeader from '../components/ReportsPageHeader.vue';
import { getLearningCenters } from '../api/learningCenters.js';
import { getTeachers } from '../api/teachers.js';
import { getLearners } from '../api/learners.js';
import { getAttendanceRecords } from '../api/reports.js';

const learningCenters = ref([]);
const teachers = ref([]);
const learners = ref([]);
const attendanceLogs = ref([]);

const searchQuery = ref('');
const statusFilter = ref('');

async function loadData() {
  try {
    const [centersRes, teachersRes, learnersRes, attData] = await Promise.all([
      getLearningCenters().catch(() => ({ data: [] })),
      getTeachers().catch(() => ({ data: [] })),
      getLearners().catch(() => ({ data: [] })),
      getAttendanceRecords().catch(() => []),
    ]);

    learningCenters.value = Array.isArray(centersRes.data) ? centersRes.data : [];
    teachers.value = Array.isArray(teachersRes.data) ? teachersRes.data : [];
    learners.value = Array.isArray(learnersRes.data) ? learnersRes.data : [];
    attendanceLogs.value = Array.isArray(attData) ? attData : [];
  } catch (err) {
    console.error('Error loading learning center summary:', err);
  }
}

onMounted(() => {
  loadData();
});

function resetFilters() {
  searchQuery.value = '';
  statusFilter.value = '';
}

const centerRows = computed(() => {
  return learningCenters.value.map((center) => {
    const assignedTeachers = teachers.value
      .filter((t) => t.learningCenterId === center.id || t.learningCenter === center.name)
      .map((t) => t.fullName);

    const centerLearners = learners.value.filter(
      (l) => l.learningCenterId === center.id || l.learningCenter === center.name
    );

    const elemCount = centerLearners.filter((l) => {
      const lvl = (l.level || '').toLowerCase();
      return lvl.includes('elem');
    }).length;

    const jhsCount = centerLearners.filter((l) => {
      const lvl = (l.level || '').toLowerCase();
      return lvl.includes('junior') || lvl.includes('jhs');
    }).length;

    const centerLogs = attendanceLogs.value.filter(
      (log) =>
        log.learningCenterId === center.id ||
        (log.learningCenter || '').toLowerCase().trim() === center.name.toLowerCase().trim()
    );

    let attendanceRate = null;
    if (centerLogs.length > 0) {
      const present = centerLogs.filter((l) => {
        const s = (l.status || '').toUpperCase();
        return s === 'PRESENT' || s === 'LATE';
      }).length;
      attendanceRate = Math.round((present / centerLogs.length) * 100);
    }

    return {
      id: center.id,
      name: center.name,
      locationAddress: center.locationAddress || center.address || '',
      status: center.status || 'active',
      assignedTeachers,
      totalLearners: centerLearners.length,
      elementaryLearners: elemCount,
      juniorLearners: jhsCount,
      attendanceRate,
    };
  });
});

const filteredCenterRows = computed(() => {
  let list = centerRows.value;

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((r) => {
      const matchName = r.name.toLowerCase().includes(q);
      const matchTeacher = r.assignedTeachers.some((t) => t.toLowerCase().includes(q));
      return matchName || matchTeacher;
    });
  }

  if (statusFilter.value) {
    list = list.filter((r) => (r.status || '').toLowerCase() === statusFilter.value.toLowerCase());
  }

  return list;
});

const districtAvgAttendanceRate = computed(() => {
  if (attendanceLogs.value.length === 0) return 0;
  const present = attendanceLogs.value.filter((l) => {
    const s = (l.status || '').toUpperCase();
    return s === 'PRESENT' || s === 'LATE';
  }).length;
  return Math.round((present / attendanceLogs.value.length) * 100);
});

// Computed totals for the Community Learning Centers Breakdown table
const totalFilteredLearners = computed(() => {
  return filteredCenterRows.value.reduce((acc, row) => acc + (row.totalLearners || 0), 0);
});

const totalElementaryLearners = computed(() => {
  return filteredCenterRows.value.reduce((acc, row) => acc + (row.elementaryLearners || 0), 0);
});

const totalJuniorLearners = computed(() => {
  return filteredCenterRows.value.reduce((acc, row) => acc + (row.juniorLearners || 0), 0);
});

const filteredAvgAttendanceRate = computed(() => {
  const rowsWithRate = filteredCenterRows.value.filter((r) => r.attendanceRate !== null);
  if (rowsWithRate.length === 0) return null;
  const sum = rowsWithRate.reduce((acc, r) => acc + r.attendanceRate, 0);
  return Math.round(sum / rowsWithRate.length);
});
</script>

<style scoped>
.lc-summary-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.filter-field-search {
  flex: 1 1 280px;
  min-width: 220px;
  max-width: 380px;
}

.filter-field-status {
  flex: 0 0 170px;
  width: 170px;
}

/* Community Learning Centers Breakdown Section */
.breakdown-card {
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-xl, 12px);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.breakdown-header {
  padding: 1.35rem 1.5rem 1.25rem 1.5rem; /* Consistent 24px left and right padding */
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-light, #f1f5f9);
}

.header-title-wrap {
  display: flex;
  flex-direction: column;
}

.breakdown-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
  margin: 0;
  letter-spacing: -0.01em;
}

.breakdown-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #64748b);
  margin: 8px 0 0 0; /* Exactly 8px between section title and description */
}

.breakdown-table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

.breakdown-table th {
  padding: 0.75rem 1rem;
  background-color: #f8fafc;
  color: var(--color-text-secondary, #475569);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  white-space: nowrap;
}

.breakdown-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border-light, #f1f5f9);
  vertical-align: middle;
}

.breakdown-table tbody tr:hover {
  background-color: #f8fafc;
}

/* Optimized proportional column widths */
.col-no {
  width: 50px;
  min-width: 44px;
}

.col-center {
  min-width: 220px;
  width: 26%;
}

.col-teachers {
  min-width: 190px;
  width: 24%;
}

.col-learners {
  width: 115px;
  min-width: 100px;
}

.col-elem {
  width: 125px;
  min-width: 110px;
}

.col-jhs {
  width: 125px;
  min-width: 110px;
}

.col-rate {
  width: 125px;
  min-width: 110px;
}

.col-status {
  width: 100px;
  min-width: 90px;
}

/* Center name and address styling */
.cell-center-info {
  display: flex;
  flex-direction: column;
}

.center-name {
  font-weight: 400;
  color: var(--color-text, #0f172a);
  font-size: 0.875rem;
  line-height: 1.35;
}

.center-address {
  font-size: 0.775rem;
  color: var(--color-text-muted, #64748b);
  margin-top: 3px;
  line-height: 1.3;
}

.teachers-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Total row styling */
.table-total-row {
  background: #f8fafc;
  border-top: 2px solid var(--color-border, #cbd5e1);
}

.table-total-row td {
  padding: 0.85rem 1rem;
  border-bottom: none !important;
  font-weight: 700;
}

.text-green {
  color: var(--color-green-text, #15803d) !important;
}

.text-purple {
  color: var(--color-purple-text, #7e22ce) !important;
}

.text-amber {
  color: var(--color-amber-text, #b45309) !important;
}

.text-muted {
  color: var(--color-text-muted);
}

.text-xs {
  font-size: 0.75rem;
}

.teacher-pill {
  display: inline-block;
  background: none;
  color: #0f172a;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0;
  border-radius: 0;
  margin-right: 6px;
  margin-bottom: 2px;
}

@media (max-width: 768px) {
  .breakdown-header {
    padding: 1rem 1.25rem;
  }

  .filter-field-search,
  .filter-field-status {
    flex: 1 1 100%;
    max-width: 100%;
    width: 100%;
  }
}
</style>

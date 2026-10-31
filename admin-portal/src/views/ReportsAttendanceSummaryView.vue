<template>
  <div class="page-container attendance-summary-view">
    <!-- Breadcrumb -->
    <nav class="breadcrumb no-print">
      <router-link to="/dashboard">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <router-link to="/dashboard/reports">Reports</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Attendance Summary</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row no-print">
      <div class="page-title-group">
        <h1>Attendance Summary</h1>
        <p>Monitor attendance records across Community Learning Centers.</p>
      </div>

      <div class="header-actions-group">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="isRefreshing"
          @click="handleRefresh"
        >
          <span v-if="isRefreshing" class="btn-spinner" style="border-top-color: #475569; width: 14px; height: 14px; border-width: 2px;"></span>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- Summary Stats Cards (Single Horizontal Row) -->
    <div class="report-stats-grid no-print">
      <!-- Card 1: Total Learners -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <span class="report-card-label">Total Learners</span>
        <span class="report-card-value">{{ learnerAggregates.length }}</span>
        <span class="report-card-desc">Learners in current filter scope</span>
      </div>

      <!-- Card 2: Total Attendance Sessions -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span class="report-card-label">Total Attendance Sessions</span>
        <span class="report-card-value">{{ totalDistinctSessions }}</span>
        <span class="report-card-desc">Recorded attendance sessions</span>
      </div>

      <!-- Card 3: District Attendance Rate -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <span class="report-card-label">Attendance Rate</span>
        <span class="report-card-value text-green">{{ overallAttendanceRate }}%</span>
        <span class="report-card-desc">
          {{ selectedCenter ? `Based on ${selectedCenter} records` : 'District-wide attendance percentage' }}
        </span>
      </div>

      <!-- Card 4: Total Present Records -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span class="report-card-label">Total Present Records</span>
        <span class="report-card-value text-blue">{{ totalPresentCount }}</span>
        <span class="report-card-desc">Total marked present</span>
      </div>
    </div>

    <!-- Filters Card (Organized into consistent dropdowns and date/action rows) -->
    <div class="filters-card no-print">
      <!-- Row 1: 4 Dropdowns with consistent sizing -->
      <div class="filters-dropdowns-row">
        <!-- 1. Learning Center -->
        <div class="filter-field-col">
          <label>Learning Center</label>
          <select v-model="selectedCenter" @change="handleCenterChange">
            <option value="">All Learning Centers</option>
            <option v-for="c in learningCenters" :key="c.id" :value="c.name">
              {{ c.name }}
            </option>
          </select>
        </div>

        <!-- 2. ALS Level -->
        <div class="filter-field-col">
          <label>ALS Level</label>
          <select v-model="selectedLevel">
            <option value="">All ALS Levels</option>
            <option value="A&E Elementary">A&E Elementary</option>
            <option value="A&E Junior High">A&E Junior High</option>
          </select>
        </div>

        <!-- 3. ALS Teacher -->
        <div class="filter-field-col">
          <label>ALS Teacher</label>
          <select v-model="selectedTeacher">
            <option value="">All ALS Teachers</option>
            <option v-for="t in filteredTeachers" :key="t.id" :value="t.fullName">
              {{ t.fullName }}
            </option>
          </select>
        </div>

        <!-- 4. Learner Name -->
        <div class="filter-field-col">
          <label>Learner Name</label>
          <select v-model="selectedLearnerName">
            <option value="">All Learners</option>
            <option v-for="l in filteredLearnersList" :key="l.id" :value="l.fullName || l.name">
              {{ formatLearnerFullName(l) }}
            </option>
          </select>
        </div>
      </div>

      <!-- Row 2: Date Filters & Action Buttons -->
      <div class="filters-bottom-row">
        <div class="filters-dates-group">
          <!-- 5. From Date -->
          <div class="filter-field-col col-date">
            <label>From Date</label>
            <input
              v-model="fromDate"
              type="date"
              @change="dateError = ''"
            />
          </div>

          <!-- 6. To Date -->
          <div class="filter-field-col col-date">
            <label>To Date</label>
            <input
              v-model="toDate"
              type="date"
              @change="dateError = ''"
            />
          </div>
        </div>

        <div class="filter-actions">
          <button type="button" class="btn btn-secondary filter-reset-btn" @click="resetFilters">
            Reset Filters
          </button>
          <button
            type="button"
            class="btn-generate-report"
            @click="handleGenerateReport"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      <!-- Date Range Validation Error -->
      <div v-if="dateError" class="filter-error-text">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ dateError }}</span>
      </div>
    </div>

    <!-- Official Generated Report Output / Dedicated Print & PDF Section -->
    <div class="report-output-wrapper">
      <div id="report-content" ref="reportContentRef" class="report-paper-sheet attendance-report-sheet">
        <!-- Official Header with Logos -->
        <header class="report-official-header">
          <div class="header-logo left-logo-box">
            <img src="/logo.png" alt="DepEd ALS Seal" class="als-district-logo" />
          </div>

          <div class="header-title-box">
            <h2 class="official-title">Summary of Learner’s Attendance</h2>
          </div>

          <div class="header-logo right-logo-box">
            <img src="/als-logo.png" alt="ALS Logo" class="als-logo-image" />
          </div>
        </header>

        <!-- Attendance Summary Table Matching Attached Template -->
        <div class="attendance-table-container">
          <table class="summary-attendance-table">
            <thead>
              <tr class="header-main-row">
                <th rowspan="2" class="col-no">No.</th>
                <th rowspan="2" class="col-learner-name">
                  <div class="header-name-wrap">
                    <span class="main-title">Learner’s Name</span>
                    <span class="sub-title">(Last Name, First Name, Middle Name)</span>
                  </div>
                </th>
                <th rowspan="2" class="col-learning-center">Learning Center</th>
                <th rowspan="2" class="col-program-level">ALS Level</th>
                <th colspan="2" class="col-attendance-summary">Attendance Summary</th>
                <th rowspan="2" class="col-attendance-rate">Attendance Rate<br>(%)</th>
                <th rowspan="2" class="col-actions print-hidden">Actions</th>
              </tr>
              <tr class="header-sub-row">
                <th class="col-present">Present</th>
                <th class="col-absent">Absent</th>
              </tr>
            </thead>
            <tbody>
              <!-- Male Section Header -->
              <tr class="section-divider-row">
                <td colspan="8" class="section-divider-cell">Male</td>
              </tr>

              <!-- Male Learners Rows -->
              <tr v-for="(item, idx) in maleLearners" :key="'male-' + (item.learnerId || idx)" class="data-row">
                <td class="cell-no">{{ idx + 1 }}.</td>
                <td class="cell-name">
                  <div class="learner-name-cell">
                    <button
                      type="button"
                      class="btn-learner-person-icon no-print"
                      title="View"
                      aria-label="View Learner Information"
                      @click="openLearnerInfoModal(item.learnerObj || item)"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </button>
                    <span class="learner-name-text">{{ item.learnerName }}</span>
                  </div>
                </td>
                <td class="cell-center">{{ item.learningCenter }}</td>
                <td class="cell-level">{{ item.level }}</td>
                <td class="cell-stat">{{ item.presentCount }}</td>
                <td class="cell-stat">{{ item.absentCount }}</td>
                <td class="cell-rate">
                  <div class="rate-stack">
                    <span class="rate-percentage">{{ item.rate }}%</span>
                    <span class="rate-sessions">(out of {{ item.totalSessions }} {{ item.totalSessions === 1 ? 'session' : 'sessions' }})</span>
                  </div>
                </td>
                <td class="cell-actions print-hidden">
                  <button
                    type="button"
                    class="btn-view-details no-print"
                    @click="openDetailsModal(item)"
                  >
                    View Details
                  </button>
                </td>
              </tr>

              <!-- Empty Male Grid Lines (Matching Attached Official Form) -->
              <tr v-for="n in emptyMaleRowsCount" :key="'empty-male-' + n" class="empty-line-row">
                <td class="cell-no"></td>
                <td class="cell-name"></td>
                <td class="cell-center"></td>
                <td class="cell-level"></td>
                <td class="cell-stat"></td>
                <td class="cell-stat"></td>
                <td class="cell-rate"></td>
                <td class="cell-actions print-hidden"></td>
              </tr>

              <!-- Female Section Header -->
              <tr class="section-divider-row">
                <td colspan="8" class="section-divider-cell">Female</td>
              </tr>

              <!-- Female Learners Rows -->
              <tr v-for="(item, idx) in femaleLearners" :key="'female-' + (item.learnerId || idx)" class="data-row">
                <td class="cell-no">{{ idx + 1 }}.</td>
                <td class="cell-name">
                  <div class="learner-name-cell">
                    <button
                      type="button"
                      class="btn-learner-person-icon no-print"
                      title="View"
                      aria-label="View Learner Information"
                      @click="openLearnerInfoModal(item.learnerObj || item)"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </button>
                    <span class="learner-name-text">{{ item.learnerName }}</span>
                  </div>
                </td>
                <td class="cell-center">{{ item.learningCenter }}</td>
                <td class="cell-level">{{ item.level }}</td>
                <td class="cell-stat">{{ item.presentCount }}</td>
                <td class="cell-stat">{{ item.absentCount }}</td>
                <td class="cell-rate">
                  <div class="rate-stack">
                    <span class="rate-percentage">{{ item.rate }}%</span>
                    <span class="rate-sessions">(out of {{ item.totalSessions }} {{ item.totalSessions === 1 ? 'session' : 'sessions' }})</span>
                  </div>
                </td>
                <td class="cell-actions print-hidden">
                  <button
                    type="button"
                    class="btn-view-details no-print"
                    @click="openDetailsModal(item)"
                  >
                    View Details
                  </button>
                </td>
              </tr>

              <!-- Empty Female Grid Lines (Matching Attached Official Form) -->
              <tr v-for="n in emptyFemaleRowsCount" :key="'empty-female-' + n" class="empty-line-row">
                <td class="cell-no"></td>
                <td class="cell-name"></td>
                <td class="cell-center"></td>
                <td class="cell-level"></td>
                <td class="cell-stat"></td>
                <td class="cell-stat"></td>
                <td class="cell-rate"></td>
                <td class="cell-actions print-hidden"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- View Details Modal (Session-by-session history for learner) -->
    <div v-if="selectedLearnerForDetails" class="modal-overlay no-print" @click.self="selectedLearnerForDetails = null">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>{{ selectedLearnerForDetails.learnerName }}</h3>
            <p class="modal-subtitle">
              LRN: {{ selectedLearnerForDetails.lrn || '—' }} · {{ selectedLearnerForDetails.level }} · {{ selectedLearnerForDetails.learningCenter }}
            </p>
          </div>
          <button type="button" class="modal-close-btn" @click="selectedLearnerForDetails = null">&times;</button>
        </div>

        <div class="modal-stats-row">
          <div class="modal-mini-stat">
            <span class="label">Total Sessions</span>
            <span class="val font-mono">{{ selectedLearnerForDetails.totalSessions }}</span>
          </div>
          <div class="modal-mini-stat">
            <span class="label">Present</span>
            <span class="val font-mono text-green">{{ selectedLearnerForDetails.presentCount }}</span>
          </div>
          <div class="modal-mini-stat">
            <span class="label">Absent</span>
            <span class="val font-mono text-amber">{{ selectedLearnerForDetails.absentCount }}</span>
          </div>
          <div class="modal-mini-stat">
            <span class="label">Attendance Rate</span>
            <span class="val font-mono font-bold">{{ selectedLearnerForDetails.rate }}%</span>
          </div>
        </div>

        <div class="table-responsive" style="max-height: 380px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in selectedLearnerForDetails.logs" :key="log.id">
                <td class="font-mono text-sm">{{ log.sessionDate || log.date || '—' }}</td>
                <td>
                  <span
                    class="badge"
                    :class="log.status === 'PRESENT' || log.status === 'Present' ? 'badge-green' : 'badge-amber'"
                  >
                    {{ log.status }}
                  </span>
                </td>
                <td class="text-sm">{{ log.remarks || '—' }}</td>
                <td class="text-sm">{{ log.teacherName || selectedLearnerForDetails.teacherName || '—' }}</td>
              </tr>
              <tr v-if="!selectedLearnerForDetails.logs || selectedLearnerForDetails.logs.length === 0">
                <td colspan="4" class="text-center text-muted" style="padding: 1.5rem;">No session records found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="selectedLearnerForDetails = null">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- View Learner Information Modal (Opened via 👤 icon beside learner name) -->
    <div v-if="showLearnerModal" class="modal-overlay no-print" @click.self="closeLearnerModal">
      <div class="modal" style="max-width: 580px; width: 90%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.1));">
        <div class="modal-header-fixed" style="border-bottom: 1px solid var(--color-border, #e2e8f0); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 class="modal-title" style="font-size: 1.2rem; font-weight: 700; color: var(--color-text, #1e293b); margin: 0;">Learner Information</h2>
            <p class="modal-subtitle" style="font-size: 0.85rem; color: var(--color-text-secondary, #64748b); margin: 4px 0 0 0;">Comprehensive student record details</p>
          </div>
          <button type="button" class="modal-close-btn" @click="closeLearnerModal" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body-scrollable" style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
          <div v-if="loadingLearnerInfo" class="modal-loading-state" style="padding: 2.5rem 1rem; text-align: center;">
            <div class="spinner-blue" style="margin: 0 auto 0.75rem auto;"></div>
            <p style="color: #64748b; font-size: 0.875rem; margin: 0;">Loading learner information...</p>
          </div>
          <div v-else-if="viewingLearner" class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Full Name</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-primary, #2563eb);">{{ viewingLearner?.name || viewingLearner?.fullName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">LRN</span>
              <span class="detail-value">{{ viewingLearner?.lrn || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ALS Level</span>
              <span class="detail-value">{{ formatLearnerLevel(viewingLearner?.level || viewingLearner?.programLevel) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Learning Center</span>
              <span class="detail-value">{{ viewingLearner?.learningCenter || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Assigned Teacher</span>
              <span class="detail-value" style="font-weight: 600; color: #1e40af;">{{ viewingLearner?.assignedTeacher || viewingLearner?.teacher || viewingLearner?.teacherName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="badge" :class="viewingLearner?.status === 'Active' ? 'badge-success' : 'badge-muted'">
                  {{ viewingLearner?.status || 'Active' }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Sex / Gender</span>
              <span class="detail-value">{{ viewingLearner?.sex || viewingLearner?.gender || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date of Birth</span>
              <span class="detail-value">{{ viewingLearner?.dob || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Contact Number</span>
              <span class="detail-value">{{ viewingLearner?.contactNumber || '—' }}</span>
            </div>
            <div class="detail-item details-full-width">
              <span class="detail-label">Address</span>
              <span class="detail-value">{{ viewingLearner?.address || '—' }}</span>
            </div>
            <div class="detail-item details-full-width">
              <span class="detail-label">Date Registered</span>
              <span class="detail-value">{{ viewingLearner?.dateRegistered || '—' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer-fixed" style="border-top: 1px solid var(--color-border, #e2e8f0); padding: 1rem 1.5rem; display: flex; justify-content: flex-end; background: #f8fafc;">
          <button type="button" class="btn btn-secondary" @click="closeLearnerModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminSession } from '../composables/useAdminSession.js';
import { getLearningCenters } from '../api/learningCenters.js';
import { getTeachers } from '../api/teachers.js';
import { getLearners, getLearner } from '../api/learners.js';
import { getAttendanceRecords } from '../api/reports.js';

const { adminName } = useAdminSession();
const reportContentRef = ref(null);

const pdfFilename = computed(() => {
  const dateStr = new Date().toISOString().split('T')[0];
  const centerPart = selectedCenter.value ? selectedCenter.value.replace(/[^a-zA-Z0-9_-]/g, '_') : 'District';
  return `Summary_of_Learners_Attendance_${centerPart}_${dateStr}.pdf`;
});

const learningCenters = ref([]);
const teachers = ref([]);
const learners = ref([]);
const rawAttendanceLogs = ref([]);

// Filters
const selectedCenter = ref('');
const selectedLevel = ref('');
const selectedTeacher = ref('');
const selectedLearnerName = ref('');
const fromDate = ref('');
const toDate = ref('');
const isRefreshing = ref(false);
const dateError = ref('');

// Modals State
const selectedLearnerForDetails = ref(null);
const showLearnerModal = ref(false);
const viewingLearner = ref(null);
const loadingLearnerInfo = ref(false);

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
    rawAttendanceLogs.value = Array.isArray(attData) ? attData : [];
  } catch (err) {
    console.error('Error loading attendance summary:', err);
  }
}

onMounted(() => {
  loadData();
});

// Helper: Format learner name strictly as Last Name, First Name Middle Name
function formatLearnerFullName(l) {
  if (!l) return '—';
  const first = (l.firstName && l.firstName !== 'null' ? l.firstName : '').trim();
  const middle = (l.middleName && l.middleName !== 'null' && l.middleName !== 'undefined' ? l.middleName : '').trim();
  const last = (l.lastName && l.lastName !== 'null' ? l.lastName : '').trim();

  if (last && first) {
    return middle ? `${last}, ${first} ${middle}` : `${last}, ${first}`;
  }

  const raw = (l.fullName || l.name || '').trim();
  if (raw.includes(',')) {
    return raw;
  }
  if (raw) {
    const parts = raw.split(/\s+/);
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[1]}, ${parts[0]}`;
    const lastPart = parts[parts.length - 1];
    const rest = parts.slice(0, parts.length - 1).join(' ');
    return `${lastPart}, ${rest}`;
  }
  return '—';
}

function formatLearnerLevel(levelStr) {
  if (!levelStr) return 'A&E Elementary';
  const norm = String(levelStr).toUpperCase();
  if (norm.includes('ELEM')) return 'A&E Elementary';
  if (norm.includes('JUNIOR') || norm.includes('JHS') || norm.includes('LOWER_SECONDARY')) return 'A&E Junior High';
  return levelStr;
}

function getLearnerGender(l) {
  if (!l) return 'Male';
  const g = String(l.sex || l.gender || '').toLowerCase().trim();
  if (g.startsWith('f')) return 'Female';
  return 'Male';
}

// Cascading teachers
const filteredTeachers = computed(() => {
  if (!selectedCenter.value) return teachers.value;
  const targetCenter = learningCenters.value.find((c) => c.name === selectedCenter.value);
  if (!targetCenter) return teachers.value;
  return teachers.value.filter(
    (t) => t.learningCenterId === targetCenter.id || t.learningCenter === selectedCenter.value
  );
});

// Cascading learners
const filteredLearnersList = computed(() => {
  return learners.value.filter((l) => {
    if (selectedCenter.value && l.learningCenter !== selectedCenter.value) return false;
    if (selectedLevel.value) {
      const lvlQuery = selectedLevel.value.toLowerCase();
      const norm = (l.level || '').toLowerCase();
      if (lvlQuery.includes('elem') && !norm.includes('elem')) return false;
      if (lvlQuery.includes('junior') && !norm.includes('junior') && !norm.includes('jhs')) return false;
    }
    if (selectedTeacher.value) {
      const t = (l.assignedTeacher || l.teacher || '').toLowerCase().trim();
      if (t !== selectedTeacher.value.toLowerCase().trim()) return false;
    }
    return true;
  });
});

function handleCenterChange() {
  const isValidTeacher = filteredTeachers.value.some((t) => t.fullName === selectedTeacher.value);
  if (!isValidTeacher) selectedTeacher.value = '';
}

async function handleRefresh() {
  isRefreshing.value = true;
  try {
    await loadData();
  } finally {
    isRefreshing.value = false;
  }
}

function handleGenerateReport() {
  dateError.value = '';
  if (fromDate.value && toDate.value && fromDate.value > toDate.value) {
    dateError.value = 'From date cannot be later than To date.';
    return;
  }
  const el = document.getElementById('report-content');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function resetFilters() {
  selectedCenter.value = '';
  selectedLevel.value = '';
  selectedTeacher.value = '';
  selectedLearnerName.value = '';
  fromDate.value = '';
  toDate.value = '';
  dateError.value = '';
}

// Filtered raw logs based on user filter selections
const filteredLogs = computed(() => {
  return rawAttendanceLogs.value.filter((log) => {
    if (selectedCenter.value) {
      const c = (log.learningCenter || '').toLowerCase().trim();
      if (c !== selectedCenter.value.toLowerCase().trim()) return false;
    }

    if (selectedLevel.value) {
      const lvlQuery = selectedLevel.value.toLowerCase();
      const norm = (log.level || '').toLowerCase();
      if (lvlQuery.includes('elem') && !norm.includes('elem')) return false;
      if (lvlQuery.includes('junior') && !norm.includes('junior') && !norm.includes('jhs')) return false;
    }

    if (selectedTeacher.value) {
      const t = (log.teacherName || log.teacher || '').toLowerCase().trim();
      if (t !== selectedTeacher.value.toLowerCase().trim()) return false;
    }

    if (selectedLearnerName.value) {
      const ln = (log.learnerName || '').toLowerCase().trim();
      if (ln !== selectedLearnerName.value.toLowerCase().trim()) return false;
    }

    const logDate = log.sessionDate || log.date;
    if (fromDate.value && logDate) {
      if (new Date(logDate) < new Date(fromDate.value)) return false;
    }
    if (toDate.value && logDate) {
      if (new Date(logDate) > new Date(toDate.value)) return false;
    }

    return true;
  });
});

// Consolidate learners in district with their attendance stats
const learnerAggregates = computed(() => {
  const candidateLearners = filteredLearnersList.value;

  const rows = candidateLearners.map((learner) => {
    const learnerLogs = filteredLogs.value.filter((log) => {
      const matchId = log.learnerId === learner.id || String(log.learnerId) === String(learner.id);
      const matchName = (log.learnerName || '').trim().toLowerCase() === (learner.fullName || learner.name || '').trim().toLowerCase();
      return matchId || matchName;
    });

    const presentCount = learnerLogs.filter((l) => {
      const st = (l.status || '').toUpperCase();
      return st === 'PRESENT' || st === 'LATE';
    }).length;

    const absentCount = learnerLogs.filter((l) => {
      const st = (l.status || '').toUpperCase();
      return st === 'ABSENT';
    }).length;

    const totalSessions = presentCount + absentCount;
    const rate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    return {
      learnerId: learner.id,
      learnerObj: learner,
      learnerName: formatLearnerFullName(learner),
      lrn: learner.lrn || '',
      level: formatLearnerLevel(learner.level || learner.programLevel),
      learningCenter: learner.learningCenter || learner.learningCenterDetails?.name || '—',
      teacherName: learner.assignedTeacher || learner.teacher || learner.teacherName || '—',
      gender: getLearnerGender(learner),
      presentCount,
      absentCount,
      totalSessions,
      rate,
      logs: learnerLogs,
    };
  });

  // Handle any orphan attendance logs that might belong to learners not in candidate list
  const handledIds = new Set(rows.map((r) => r.learnerId));
  filteredLogs.value.forEach((log) => {
    if (log.learnerId && !handledIds.has(log.learnerId)) {
      handledIds.add(log.learnerId);
      const st = (log.status || '').toUpperCase();
      const presentCount = (st === 'PRESENT' || st === 'LATE') ? 1 : 0;
      const absentCount = st === 'ABSENT' ? 1 : 0;
      const totalSessions = presentCount + absentCount;
      rows.push({
        learnerId: log.learnerId,
        learnerObj: log.learner || log,
        learnerName: formatLearnerFullName(log.learner || { fullName: log.learnerName }),
        lrn: log.lrn || '',
        level: formatLearnerLevel(log.level),
        learningCenter: log.learningCenter || '—',
        teacherName: log.teacherName || log.teacher || '—',
        gender: getLearnerGender(log.learner || log),
        presentCount,
        absentCount,
        totalSessions,
        rate: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0,
        logs: [log],
      });
    }
  });

  return rows;
});

// Group by Male and Female
const maleLearners = computed(() => {
  return learnerAggregates.value
    .filter((l) => l.gender === 'Male')
    .sort((a, b) => a.learnerName.localeCompare(b.learnerName));
});

const femaleLearners = computed(() => {
  return learnerAggregates.value
    .filter((l) => l.gender === 'Female')
    .sort((a, b) => a.learnerName.localeCompare(b.learnerName));
});

// Empty grid lines matching official DepEd format
const emptyMaleRowsCount = computed(() => {
  return maleLearners.value.length === 0 ? 8 : Math.max(0, 3 - maleLearners.value.length);
});

const emptyFemaleRowsCount = computed(() => {
  return femaleLearners.value.length === 0 ? 8 : Math.max(0, 3 - femaleLearners.value.length);
});

const totalDistinctSessions = computed(() => {
  const set = new Set(filteredLogs.value.map((l) => l.sessionDate || l.date).filter(Boolean));
  return set.size;
});

const totalPresentCount = computed(() => {
  return filteredLogs.value.filter((l) => {
    const st = (l.status || '').toUpperCase();
    return st === 'PRESENT' || st === 'LATE';
  }).length;
});

const overallAttendanceRate = computed(() => {
  const total = learnerAggregates.value.reduce((acc, r) => acc + r.totalSessions, 0);
  const present = learnerAggregates.value.reduce((acc, r) => acc + r.presentCount, 0);
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
});

function openDetailsModal(item) {
  selectedLearnerForDetails.value = item;
}

// Open Learner Information modal with full student record
async function openLearnerInfoModal(learner) {
  if (!learner) return;

  viewingLearner.value = {
    ...learner,
    name: formatLearnerFullName(learner),
    fullName: formatLearnerFullName(learner),
    level: learner.level || learner.programLevel,
    learningCenter: learner.learningCenter,
    assignedTeacher: learner.assignedTeacher || learner.teacherName || learner.teacher,
    sex: learner.sex || learner.gender,
    gender: learner.gender || learner.sex,
    status: learner.status || 'Active',
  };
  showLearnerModal.value = true;
  loadingLearnerInfo.value = true;

  try {
    const targetId = learner.id || learner.learnerId;
    if (targetId) {
      const res = await getLearner(targetId);
      const data = res.data || res;
      if (data) {
        viewingLearner.value = {
          ...viewingLearner.value,
          ...data,
          name: formatLearnerFullName(data),
          fullName: formatLearnerFullName(data),
          level: data.level || viewingLearner.value.level,
          learningCenter: data.learningCenter || viewingLearner.value.learningCenter,
          assignedTeacher: data.assignedTeacher || data.teacher || viewingLearner.value.assignedTeacher,
          sex: data.sex || data.gender || viewingLearner.value.sex,
          gender: data.gender || data.sex || viewingLearner.value.gender,
        };
      }
    }
  } catch (err) {
    console.warn('Could not fetch full learner profile from server, using local record:', err);
  } finally {
    loadingLearnerInfo.value = false;
  }
}

function closeLearnerModal() {
  showLearnerModal.value = false;
  viewingLearner.value = null;
}
</script>

<style scoped>
.attendance-summary-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.text-green {
  color: var(--color-green-text, #15803d) !important;
}

.text-amber {
  color: var(--color-amber-text, #b45309) !important;
}

.text-blue {
  color: var(--color-blue-text, #1d4ed8) !important;
}

/* Stats Cards */
.report-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 1200px) {
  .report-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .report-stats-grid {
    grid-template-columns: 1fr;
  }
}

.report-summary-card {
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.report-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.85rem;
}

.stat-icon-blue {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon-purple {
  background: #faf5ff;
  color: #7c3aed;
}

.stat-icon-green {
  background: #f0fdf4;
  color: #16a34a;
}

.report-card-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary, #64748b);
  margin-bottom: 0.25rem;
}

.report-card-value {
  font-size: 1.625rem;
  font-weight: 800;
  color: var(--color-text, #0f172a);
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.report-card-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted, #94a3b8);
}

/* Filters Card Layout */
.filters-card {
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.15rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters-dropdowns-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

@media (max-width: 1024px) {
  .filters-dropdowns-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .filters-dropdowns-row {
    grid-template-columns: 1fr;
  }
}

.filters-bottom-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.filters-dates-group {
  display: flex;
  align-items: flex-end;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.col-date {
  width: 155px;
  flex: 0 0 155px;
}

@media (max-width: 640px) {
  .col-date {
    width: 100%;
    flex: 1 1 calc(50% - 0.5rem);
  }
}

.filter-reset-btn {
  height: 38px;
  padding: 0 1.15rem;
  border-radius: 8px;
}

.filter-error-text {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #dc2626;
  font-size: 0.8125rem;
  font-weight: 500;
  padding-top: 0.5rem;
  border-top: 1px solid #fee2e2;
}

.filter-field-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 140px;
}

.filter-field-col label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.filter-field-col select,
.filter-field-col input {
  width: 100%;
  height: 38px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.filter-field-col select:focus,
.filter-field-col input:focus {
  border-color: #3b82f6;
  background: #ffffff;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.btn-generate-report {
  height: 38px;
  padding: 0 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  background-color: #2563eb;
  color: #ffffff;
  border: 1px solid #2563eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
}

.btn-generate-report:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
}

/* Official Report Paper Sheet */
.attendance-report-sheet {
  background: #ffffff;
  padding: 2.25rem 2.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  max-width: 100%;
  margin: 0 auto 1.5rem;
}

.report-official-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
}

.header-logo {
  width: 65px;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.als-district-logo,
.als-logo-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.header-title-box {
  text-align: center;
  flex: 1;
}

.official-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #000000;
  margin: 0;
  text-transform: none;
  letter-spacing: -0.01em;
}

/* Table Container & Borders */
.attendance-table-container {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.summary-attendance-table {
  width: 100%;
  border-collapse: collapse;
  font-family: inherit;
  font-size: 0.8125rem;
  color: #000000;
  border: 1.5px solid #000000;
}

.summary-attendance-table th,
.summary-attendance-table td {
  border: 1px solid #000000;
  padding: 5px 8px;
  vertical-align: middle;
}

.data-row td,
.empty-line-row td {
  height: 34px;
  box-sizing: border-box;
}

.col-actions {
  width: 125px;
  min-width: 125px;
  text-align: center;
  vertical-align: middle;
}

.summary-attendance-table thead th {
  background-color: #ffffff;
  font-weight: 700;
  color: #000000;
  text-align: center;
  line-height: 1.25;
}

.header-name-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-name-wrap .main-title {
  font-weight: 700;
}

.header-name-wrap .sub-title {
  font-size: 0.725rem;
  font-weight: 400;
}

.section-divider-row {
  background-color: #ffffff;
}

.section-divider-cell {
  font-weight: 700;
  font-size: 0.875rem;
  color: #000000;
  padding: 0.45rem 0.6rem !important;
  text-align: left;
  border-top: 1.5px solid #000000 !important;
  border-bottom: 1px solid #000000 !important;
}

.data-row:hover {
  background-color: #f8fafc;
}

.cell-no {
  text-align: center;
  width: 45px;
  font-weight: 500;
}

.cell-name {
  text-align: left;
}

.learner-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.btn-learner-person-icon {
  background: var(--action-view-bg, #EFF6FF);
  border: 1px solid var(--action-view-border, #DCE7F6);
  cursor: pointer;
  padding: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--action-view-color, #4169A8);
  border-radius: 4px;
  transition: all 0.15s ease;
}

.btn-learner-person-icon:hover {
  background: var(--action-view-hover-bg, #E0EEFE);
  color: var(--action-view-hover-color, #315488);
  border-color: var(--action-view-hover-border, #B9D3F4);
}

.btn-learner-person-icon:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8);
  outline-offset: 1px;
}

.learner-name-text {
  font-weight: 600;
  color: #000000;
}

.cell-center {
  text-align: center;
}

.cell-level {
  text-align: center;
}

.cell-stat {
  text-align: center;
  font-weight: 600;
  width: 75px;
}

.cell-rate {
  text-align: center;
  width: 140px;
}

.rate-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.15;
}

.rate-percentage {
  font-weight: 700;
  color: #dc2626;
  font-size: 0.8125rem;
}

.rate-sessions {
  font-size: 0.675rem;
  color: #475569;
  line-height: 1.1;
}

.cell-actions {
  text-align: center;
  vertical-align: middle;
  width: 125px;
  min-width: 125px;
  padding: 4px 6px !important;
  white-space: nowrap;
}

.btn-view-details {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--action-view-bg, #EFF6FF);
  color: var(--action-view-color, #4169A8);
  border: 1px solid var(--action-view-border, #DCE7F6);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap !important;
  cursor: pointer;
  box-sizing: border-box;
  height: 26px;
  transition: all 0.15s ease;
  user-select: none;
  margin: 0 auto;
}

.btn-view-details:hover {
  background-color: var(--action-view-hover-bg, #E0EEFE);
  color: var(--action-view-hover-color, #315488);
  border-color: var(--action-view-hover-border, #B9D3F4);
}

.btn-view-details:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8);
  outline-offset: 1px;
}

.empty-line-row td {
  height: 34px;
  box-sizing: border-box;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-card {
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  width: 100%;
  max-width: 650px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
}

.modal-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #64748b);
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #64748b;
  cursor: pointer;
}

.modal-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.modal-mini-stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.modal-mini-stat .label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.modal-mini-stat .val {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
}

/* Learner Information Modal Detail Items */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1.25rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.details-full-width {
  grid-column: span 2;
}

.detail-label {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.detail-value {
  font-size: 0.925rem;
  color: #0f172a;
}

.spinner-blue {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Print Rules: ONLY report content is printed */
@media print {
  .no-print,
  .print-hidden,
  .col-actions,
  .cell-actions,
  .breadcrumb,
  .page-header-row,
  .report-stats-grid,
  .report-filter-bar,
  .btn-view-details,
  .btn-learner-person-icon,
  .modal-overlay {
    display: none !important;
  }

  body,
  .page-container {
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .attendance-report-sheet {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    max-width: 100% !important;
  }

  .summary-attendance-table {
    border: 1.5px solid #000000 !important;
  }

  .summary-attendance-table th,
  .summary-attendance-table td {
    border: 1px solid #000000 !important;
  }
}

@media (max-width: 1024px) {
  .report-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .report-stats-grid {
    grid-template-columns: 1fr;
  }
  .report-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .report-filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-field-col {
    width: 100%;
  }
}
</style>

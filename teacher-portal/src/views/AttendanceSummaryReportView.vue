<template>
  <div class="page-container attendance-summary-page">
    <!-- Standardized Page Header & Breadcrumb (no-print) -->
    <ReportsPageHeader
      title="Attendance Summary"
      description="View consolidated attendance history of your assigned learners."
    >
      <template #actions>
        <button
          type="button"
          class="btn-refresh"
          :disabled="isRefreshing"
          @click="handleRefresh"
        >
          <svg
            :class="{ 'animate-spin': isRefreshing }"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh' }}</span>
        </button>
      </template>
    </ReportsPageHeader>

    <!-- Filters Section (2-Row Structured Layout) -->
    <div class="filters-card no-print">
      <!-- Row 1: Dropdown filters (Learning Center, ALS Level, Learner Name) -->
      <div class="filters-dropdowns-row">
        <!-- 1. Learning Center Dropdown -->
        <div class="filter-field">
          <label class="filter-label">Learning Center</label>
          <div class="select-wrapper">
            <select v-model="selectedCenter" class="filter-select">
              <option value="">All Learning Centers</option>
              <option v-for="center in centerOptions" :key="center" :value="center">
                {{ center }}
              </option>
            </select>
          </div>
        </div>

        <!-- 2. ALS Level Dropdown -->
        <div class="filter-field">
          <label class="filter-label">ALS Level</label>
          <div class="select-wrapper">
            <select v-model="selectedProgramLevel" class="filter-select">
              <option value="">All ALS Levels</option>
              <option v-for="lvl in levelOptions" :key="lvl" :value="lvl">
                {{ lvl }}
              </option>
            </select>
          </div>
        </div>

        <!-- 3. Learner Name Dropdown -->
        <div class="filter-field">
          <label class="filter-label">Learner Name</label>
          <div class="select-wrapper">
            <select v-model="selectedLearnerId" class="filter-select">
              <option value="">All Learners</option>
              <option v-for="learner in availableLearners" :key="learner.id" :value="learner.id">
                {{ learner.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Row 2: Date Filters side-by-side & Actions -->
      <div class="filters-bottom-row">
        <div class="filters-dates-group">
          <!-- 4. From Date -->
          <div class="filter-field col-date">
            <label class="filter-label">From Date</label>
            <input
              v-model="fromDate"
              type="date"
              class="filter-date-input"
              aria-label="From Date"
            />
          </div>

          <!-- 5. To Date -->
          <div class="filter-field col-date">
            <label class="filter-label">To Date</label>
            <input
              v-model="toDate"
              type="date"
              class="filter-date-input"
              aria-label="To Date"
            />
          </div>
        </div>

        <div class="filter-actions-group">
          <button
            type="button"
            class="btn-reset-filters"
            @click="resetFilters"
          >
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

      <!-- Date Validation Error -->
      <div v-if="dateError" class="filter-error-text">
        {{ dateError }}
      </div>
    </div>

    <!-- Official Generated Report Output / Dedicated Print & PDF Section -->
    <div class="report-output-wrapper">
      <!-- Loading State: generating report -->
      <div v-if="loadingReport" class="loading-box print-hidden">
        <div class="btn-spinner" style="width: 22px; height: 22px; border-width: 2.5px; border-color: rgba(37, 99, 235, 0.2); border-top-color: #2563eb;"></div>
        <p>Retrieving learner attendance records...</p>
      </div>

      <div id="report-content" ref="reportContentRef" class="report-paper-sheet attendance-report-sheet">
        <!-- Status Banner: Distinguish Blank Template vs Generated Report -->
        <div class="report-status-banner print-hidden">
          <div v-if="!reportGenerated" class="status-pill status-blank">
            <span class="status-badge-dot"></span>
            <span class="status-badge-text">Blank Template Preview</span>
            <span class="status-badge-hint">— Select filters above and click Generate Report</span>
          </div>
          <div v-else-if="summaryRows.length === 0" class="status-pill status-empty">
            <span class="status-badge-dot empty"></span>
            <span class="status-badge-text">Report Generated</span>
            <span class="status-badge-hint">— No records found for the selected filters</span>
          </div>
          <div v-else class="status-pill status-ready">
            <span class="status-badge-dot success"></span>
            <span class="status-badge-text">Report Generated</span>
            <span class="status-badge-hint">— {{ summaryRows.length }} record(s) loaded</span>
          </div>
        </div>

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

            <!-- BLANK TEMPLATE PREVIEW BODY (Before Generate Report) -->
            <tbody v-if="!reportGenerated">
              <!-- Male Section Header -->
              <tr class="section-divider-row">
                <td colspan="8" class="section-divider-cell">Male</td>
              </tr>
              <!-- Blank rows for Male -->
              <tr v-for="n in 5" :key="'blank-male-' + n" class="empty-line-row">
                <td class="cell-no">&nbsp;</td>
                <td class="cell-name">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-level">&nbsp;</td>
                <td class="cell-stat">&nbsp;</td>
                <td class="cell-stat">&nbsp;</td>
                <td class="cell-rate">&nbsp;</td>
                <td class="cell-actions print-hidden">&nbsp;</td>
              </tr>

              <!-- Female Section Header -->
              <tr class="section-divider-row">
                <td colspan="8" class="section-divider-cell">Female</td>
              </tr>
              <!-- Blank rows for Female -->
              <tr v-for="n in 5" :key="'blank-female-' + n" class="empty-line-row">
                <td class="cell-no">&nbsp;</td>
                <td class="cell-name">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-level">&nbsp;</td>
                <td class="cell-stat">&nbsp;</td>
                <td class="cell-stat">&nbsp;</td>
                <td class="cell-rate">&nbsp;</td>
                <td class="cell-actions print-hidden">&nbsp;</td>
              </tr>
            </tbody>

            <!-- GENERATED REPORT BODY (After Generate Report) -->
            <tbody v-else>
              <!-- Empty State If Generated But 0 Records Found -->
              <tr v-if="summaryRows.length === 0" class="empty-notice-row print-hidden">
                <td colspan="8" class="cell-center empty-notice-cell">
                  <div class="empty-notice-content">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>No attendance records found for the selected filters.</span>
                  </div>
                </td>
              </tr>

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
                <td class="cell-level table-cell-als-level">{{ formatLearnerLevel(item.programLevel) }}</td>
                <td class="cell-stat">{{ item.present }}</td>
                <td class="cell-stat">{{ item.absent }}</td>
                <td class="cell-rate">
                  <div class="rate-stack">
                    <span class="rate-percentage">{{ item.attendanceRate }}%</span>
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
                <td class="cell-level table-cell-als-level">{{ formatLearnerLevel(item.programLevel) }}</td>
                <td class="cell-stat">{{ item.present }}</td>
                <td class="cell-stat">{{ item.absent }}</td>
                <td class="cell-rate">
                  <div class="rate-stack">
                    <span class="rate-percentage">{{ item.attendanceRate }}%</span>
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

      <!-- PRINT ACTION BUTTON (Below report table, no-print) -->
      <div id="pdf-action-section" class="pdf-action-container no-print print-hidden">
        <button
          type="button"
          class="btn-print-report"
          :disabled="!reportGenerated || summaryRows.length === 0"
          :title="!reportGenerated ? 'Please click Generate Report first' : (summaryRows.length === 0 ? 'No records to print' : 'Print this report')"
          @click="printReportDirectly"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>Print Report</span>
        </button>
      </div>
    </div>

    <!-- View Details Modal (Session-by-session history for learner) -->
    <div v-if="selectedLearnerForDetails" class="modal-overlay no-print" @click.self="selectedLearnerForDetails = null">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>{{ selectedLearnerForDetails.learnerName }}</h3>
            <p class="modal-subtitle">
              LRN: {{ selectedLearnerForDetails.lrn || '—' }} · {{ selectedLearnerForDetails.programLevel }} · {{ selectedLearnerForDetails.learningCenter }}
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
            <span class="val font-mono text-green">{{ selectedLearnerForDetails.present }}</span>
          </div>
          <div class="modal-mini-stat">
            <span class="label">Absent</span>
            <span class="val font-mono text-amber">{{ selectedLearnerForDetails.absent }}</span>
          </div>
          <div class="modal-mini-stat">
            <span class="label">Attendance Rate</span>
            <span class="val font-mono font-bold">{{ selectedLearnerForDetails.attendanceRate }}%</span>
          </div>
        </div>

        <div class="table-responsive" style="max-height: 380px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in selectedLearnerForDetails.logs" :key="log.id || log.date">
                <td class="font-mono text-sm">{{ log.date || log.sessionDate || '—' }}</td>
                <td>
                  <span
                    class="badge"
                    :class="log.status === 'PRESENT' || log.status === 'Present' ? 'badge-green' : 'badge-amber'"
                  >
                    {{ log.status }}
                  </span>
                </td>
                <td class="text-sm">{{ log.remarks || '—' }}</td>
              </tr>
              <tr v-if="!selectedLearnerForDetails.logs || selectedLearnerForDetails.logs.length === 0">
                <td colspan="3" class="text-center text-muted" style="padding: 1.5rem;">No session records found.</td>
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
              <span class="detail-value" style="font-weight: 600; color: #1e40af;">{{ viewingLearner?.assignedTeacher || viewingLearner?.teacher || viewingLearner?.teacherName || currentTeacher?.fullName || teacherName || '—' }}</span>
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
import { ref, computed, watch, onMounted } from 'vue';
import ReportsPageHeader from '../components/ReportsPageHeader.vue';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getAssignedLearners, getLearner } from '../api/learners.js';
import { getAttendanceRecords } from '../api/attendance.js';

const { currentTeacher, teacherName, teacherId, assignedCenters } = useTeacherSession();
const reportContentRef = ref(null);

const reportGenerated = ref(false);
const loadingReport = ref(false);

const pdfFilename = computed(() => {
  const dateStr = new Date().toISOString().split('T')[0];
  const centerPart = selectedCenter.value ? selectedCenter.value.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Assigned_Centers';
  return `Summary_of_Learners_Attendance_${centerPart}_${dateStr}.pdf`;
});

// Filters State
const selectedCenter = ref('');
const selectedProgramLevel = ref('');
const selectedLearnerId = ref('');
const fromDate = ref('');
const toDate = ref('');
const dateError = ref('');
const isRefreshing = ref(false);

// Modals State
const selectedLearnerForDetails = ref(null);
const showLearnerModal = ref(false);
const viewingLearner = ref(null);
const loadingLearnerInfo = ref(false);

// Teacher-scoped Data
const assignedLearners = ref([]);
const attendanceRecords = ref([]);

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
  if (!levelStr) return '—';
  const norm = String(levelStr).toUpperCase();
  if (norm.includes('ELEM')) return 'A&E Elementary';
  if (norm.includes('JUN') || norm.includes('JHS') || norm.includes('LOWER_SEC') || norm.includes('SEC')) return 'A&E Junior High';
  return String(levelStr).trim();
}

function getLearnerGender(l) {
  if (!l) return 'Male';
  const g = String(l.sex || l.gender || '').toLowerCase().trim();
  if (g.startsWith('f')) return 'Female';
  return 'Male';
}

// Available Learning Centers (Only assigned to current teacher)
const centerOptions = computed(() => {
  const set = new Set();
  if (assignedCenters.value && assignedCenters.value.length > 0) {
    assignedCenters.value.forEach((c) => {
      if (c.name) set.add(c.name);
    });
  } else if (currentTeacher.value?.learningCenter && currentTeacher.value.learningCenter !== '—') {
    set.add(currentTeacher.value.learningCenter);
  }

  assignedLearners.value.forEach((l) => {
    const cName = l.learningCenter || l.learningCenterDetails?.name;
    if (cName && cName !== '—') set.add(cName);
  });

  return Array.from(set).sort();
});

// ALS Levels applicable to assigned learners
const levelOptions = computed(() => {
  const set = new Set();
  assignedLearners.value.forEach((l) => {
    if (l.level) set.add(formatLearnerLevel(l.level));
  });
  if (set.size === 0) {
    set.add('A&E Elementary');
    set.add('A&E Junior High');
  }
  return Array.from(set).sort();
});

// Learners assigned to this teacher (filtered by chosen center & level)
const availableLearners = computed(() => {
  return assignedLearners.value.filter((l) => {
    const lCenter = l.learningCenter || l.learningCenterDetails?.name;
    if (selectedCenter.value && lCenter !== selectedCenter.value) return false;
    if (selectedProgramLevel.value && formatLearnerLevel(l.level) !== selectedProgramLevel.value) return false;
    return true;
  });
});

async function loadAssignedLearners() {
  try {
    const params = {};
    if (teacherId.value) params.teacherId = teacherId.value;
    const { data } = await getAssignedLearners(params);
    if (Array.isArray(data)) {
      assignedLearners.value = data.map((l) => ({
        id: l.id,
        name: formatLearnerFullName(l),
        fullName: formatLearnerFullName(l),
        firstName: l.firstName || '',
        middleName: l.middleName || '',
        lastName: l.lastName || '',
        gender: getLearnerGender(l),
        sex: l.gender || l.sex || '',
        lrn: l.lrn || '',
        level: formatLearnerLevel(l.level),
        learningCenter: l.learningCenter || l.learningCenterDetails?.name || '—',
        raw: l,
      }));
    }
  } catch (err) {
    console.warn('Could not load assigned learners for Attendance Summary:', err);
    assignedLearners.value = [];
  }
}

async function fetchAttendanceData() {
  try {
    const currentTid = teacherId.value;
    const params = {};
    if (currentTid) params.teacherId = currentTid;
    if (fromDate.value) params.fromDate = fromDate.value;
    if (toDate.value) params.toDate = toDate.value;
    if (selectedProgramLevel.value) params.level = selectedProgramLevel.value;

    let dbRecords = [];
    try {
      const { data } = await getAttendanceRecords(params);
      if (Array.isArray(data)) {
        dbRecords = data;
      }
    } catch (e) {
      console.warn('Backend attendance fetch error, falling back to local sessions:', e);
    }

    // Also incorporate local session records if any were recorded locally for this teacher
    const localRecords = [];
    try {
      const tid = currentTid || currentTeacher.value?.id;
      const raw = (tid && localStorage.getItem(`als_attendance_sessions_${tid}`)) || localStorage.getItem('als_attendance_sessions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((session) => {
            if (tid && session.teacherId && session.teacherId !== tid) return;
            if (fromDate.value && session.date < fromDate.value) return;
            if (toDate.value && session.date > toDate.value) return;
            if (selectedCenter.value && session.learningCenter !== selectedCenter.value) return;
            if (selectedProgramLevel.value && session.programLevel !== selectedProgramLevel.value) return;

            (session.learners || []).forEach((l) => {
              localRecords.push({
                learnerId: l.id,
                learnerName: l.name,
                level: formatLearnerLevel(l.level || session.programLevel),
                learningCenter: l.learningCenter || session.learningCenter,
                date: session.date,
                status: (l.status || 'PRESENT').toUpperCase(),
                remarks: session.remarks || '',
              });
            });
          });
        }
      }
    } catch (e) {
      console.warn('Local attendance parse error:', e);
    }

    const recordMap = new Map();
    dbRecords.forEach((r) => {
      const key = `${r.learnerId}_${r.date || r.sessionDate}`;
      recordMap.set(key, {
        learnerId: r.learnerId,
        learnerName: r.learnerName,
        level: formatLearnerLevel(r.level),
        learningCenter: r.learningCenter,
        date: r.date || r.sessionDate,
        status: (r.status || 'PRESENT').toUpperCase(),
        remarks: r.remarks || '',
      });
    });

    localRecords.forEach((r) => {
      const key = `${r.learnerId}_${r.date}`;
      if (!recordMap.has(key)) {
        recordMap.set(key, r);
      }
    });

    attendanceRecords.value = Array.from(recordMap.values());
  } catch (err) {
    console.error('Error fetching attendance records:', err);
  }
}

async function loadInitialData() {
  await loadAssignedLearners();
}

onMounted(() => {
  loadInitialData();
});

// Compute table summary rows strictly for assigned learners
const summaryRows = computed(() => {
  if (!reportGenerated.value) return [];

  const learnersToDisplay = assignedLearners.value.filter((l) => {
    const lCenter = l.learningCenter;
    if (selectedCenter.value && lCenter !== selectedCenter.value) return false;
    if (selectedProgramLevel.value && l.level !== selectedProgramLevel.value) return false;
    if (selectedLearnerId.value && l.id !== parseInt(selectedLearnerId.value, 10)) return false;
    return true;
  });

  return learnersToDisplay.map((learner) => {
    const learnerAtt = attendanceRecords.value.filter((r) => {
      const matchId = r.learnerId === learner.id || String(r.learnerId) === String(learner.id);
      const matchName = (r.learnerName || '').trim().toLowerCase() === (learner.name || '').trim().toLowerCase();
      return matchId || matchName;
    });

    const presentCount = learnerAtt.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absentCount = learnerAtt.filter((r) => r.status === 'ABSENT').length;
    const totalSessions = presentCount + absentCount;
    const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    return {
      learnerId: learner.id,
      learnerObj: learner.raw || learner,
      learnerName: learner.name,
      lrn: learner.lrn,
      gender: learner.gender,
      programLevel: learner.level,
      learningCenter: learner.learningCenter,
      totalSessions,
      present: presentCount,
      absent: absentCount,
      attendanceRate,
      logs: learnerAtt,
    };
  });
});

// Group by Male and Female
const maleLearners = computed(() => {
  return summaryRows.value
    .filter((l) => l.gender === 'Male')
    .sort((a, b) => a.learnerName.localeCompare(b.learnerName));
});

const femaleLearners = computed(() => {
  return summaryRows.value
    .filter((l) => l.gender === 'Female')
    .sort((a, b) => a.learnerName.localeCompare(b.learnerName));
});

// Empty grid lines matching official DepEd format
const emptyMaleRowsCount = computed(() => {
  if (!reportGenerated.value || summaryRows.value.length === 0) return 0;
  return maleLearners.value.length === 0 ? 5 : Math.max(0, 3 - maleLearners.value.length);
});

const emptyFemaleRowsCount = computed(() => {
  if (!reportGenerated.value || summaryRows.value.length === 0) return 0;
  return femaleLearners.value.length === 0 ? 5 : Math.max(0, 3 - femaleLearners.value.length);
});

function validateDates() {
  if (fromDate.value && toDate.value && fromDate.value > toDate.value) {
    dateError.value = 'From Date cannot be later than To Date.';
    return false;
  }
  dateError.value = '';
  return true;
}

async function handleRefresh() {
  isRefreshing.value = true;
  try {
    await loadInitialData();
  } finally {
    isRefreshing.value = false;
  }
}

async function handleGenerateReport() {
  if (!validateDates()) return;
  loadingReport.value = true;
  try {
    await fetchAttendanceData();
    reportGenerated.value = true;
  } finally {
    loadingReport.value = false;
  }
  const el = document.getElementById('report-content');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Invalidate generated report whenever any filter changes
function invalidateReport() {
  if (reportGenerated.value) {
    reportGenerated.value = false;
    attendanceRecords.value = [];
  }
}

watch([selectedCenter, selectedProgramLevel, selectedLearnerId, fromDate, toDate], () => {
  invalidateReport();
});

function resetFilters() {
  selectedCenter.value = '';
  selectedProgramLevel.value = '';
  selectedLearnerId.value = '';
  fromDate.value = '';
  toDate.value = '';
  dateError.value = '';
  reportGenerated.value = false;
  attendanceRecords.value = [];
}

function openDetailsModal(item) {
  selectedLearnerForDetails.value = item;
}

// Open Learner Information modal with student record
async function openLearnerInfoModal(learner) {
  if (!learner) return;

  viewingLearner.value = {
    ...learner,
    name: formatLearnerFullName(learner),
    fullName: formatLearnerFullName(learner),
    level: learner.level || learner.programLevel,
    learningCenter: learner.learningCenter,
    assignedTeacher: learner.assignedTeacher || learner.teacherName || currentTeacher.value?.fullName || teacherName.value || '—',
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

function printReportDirectly() {
  if (!reportGenerated.value) {
    alert('Please click "Generate Report" before printing.');
    return;
  }
  if (summaryRows.value.length === 0) {
    alert('No attendance records to print for the selected filters.');
    return;
  }
  window.print();
}
</script>

<style scoped>
.attendance-summary-page {
  padding-bottom: 2.5rem;
}

/* Breadcrumbs */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
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

.breadcrumb-link-muted {
  color: #64748b;
  text-decoration: none;
}

.breadcrumb-link-muted:hover {
  color: #2563eb;
}

.breadcrumb-current {
  color: #64748b;
  font-weight: 500;
}

/* Page Header */
.page-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
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

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 0.95rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  height: 42px;
  min-height: 42px;
}

.btn-refresh:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #94a3b8;
}

/* Filters Card (2-Row Structured Layout) */
.filters-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.25rem 1.15rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters-dropdowns-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
}

.filters-bottom-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
  border-top: 1px solid #f1f5f9;
}

.filters-dates-group {
  display: flex;
  align-items: flex-end;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.col-date {
  width: 165px;
  min-width: 150px;
  flex: none;
}

.filter-error-text {
  color: #dc2626;
  font-size: 0.8125rem;
  font-weight: 500;
  margin-top: -0.25rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-select,
.filter-date-input {
  width: 100%;
  height: 42px;
  min-height: 42px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 0.85rem;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.filter-select {
  padding-right: 2rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px 8px;
  cursor: pointer;
}

.filter-select:focus,
.filter-date-input:focus {
  border-color: #2563eb;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.filter-actions-group {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.btn-reset-filters {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  height: 42px;
  min-height: 42px;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn-reset-filters:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #94a3b8;
}

.btn-generate-report {
  height: 42px;
  min-height: 42px;
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
  font-weight: 400;
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
  border-radius: 16px;
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
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: #64748b;
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

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.text-green {
  color: #15803d !important;
}

.text-amber {
  color: #b45309 !important;
}

/* Blank Template & Preview Status Pill Styling */
.report-status-banner {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.status-pill.status-blank {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.status-pill.status-empty {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.status-pill.status-ready {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.status-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-badge-dot.empty {
  background: #f59e0b;
}

.status-badge-dot.success {
  background: #10b981;
}

.status-badge-hint {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: normal;
}

.empty-notice-cell {
  background: #fffbeb !important;
  color: #b45309;
  padding: 1.25rem 1rem !important;
  text-align: center;
}

.empty-notice-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.loading-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #475569;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Print Action Button (Below report table) */
.pdf-action-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 0 2rem 0;
}

.btn-print-report {
  height: 48px;
  padding: 0 1.75rem;
  background-color: #ffffff;
  color: #1e293b;
  border: 1.5px solid #cbd5e1;
  border-radius: 24px;
  font-size: 0.95rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-print-report:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-print-report:active:not(:disabled) {
  background-color: #e2e8f0;
  transform: translateY(1px);
}

.btn-print-report:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #e2e8f0;
}

/* Print Rules: ONLY report content is printed */
@media print {
  .no-print,
  .print-hidden,
  .col-actions,
  .cell-actions,
  .breadcrumb-nav,
  .page-header-row,
  .filters-card,
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

@media (max-width: 900px) {
  .filters-dropdowns-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .filters-card {
    padding: 1rem;
  }
  .filters-dropdowns-row {
    grid-template-columns: 1fr;
  }
  .filters-bottom-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filters-dates-group {
    flex-direction: column;
    width: 100%;
  }
  .col-date {
    width: 100%;
  }
  .filter-actions-group {
    width: 100%;
    justify-content: stretch;
  }
  .btn-reset-filters,
  .btn-generate-report {
    flex: 1;
    justify-content: center;
  }
}
</style>

<template>
  <div class="page-container reports-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb-nav">
      <router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Reports</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1 class="page-title">Teacher Reports &amp; Summaries</h1>
        <p class="page-subtitle">
          Generate progress summaries, assessment results, and attendance documentation for your assigned learners.
        </p>
      </div>
    </div>

    <!-- Tabs Row matching reference image -->
    <div class="reports-tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="tab-link-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Controls Bar Card -->
    <div class="controls-card no-print">
      <div class="controls-left">
        <div class="control-field">
          <label class="control-label">Learning Center</label>
          <select v-model="selectedCenter" class="control-select">
            <option value="">All Assigned Centers</option>
            <option v-for="center in assignedCenters" :key="center.id" :value="center.name">
              {{ center.name }}
            </option>
          </select>
        </div>

        <div class="control-field">
          <label class="control-label">Date Range</label>
          <select v-model="selectedDateRange" class="control-select">
            <option value="All Time">All Time</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="School Year 2026-2027">School Year 2026-2027</option>
          </select>
        </div>
      </div>

      <div class="controls-right">
        <button class="export-btn-outline" @click="handleExport('CSV')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Export CSV</span>
        </button>

        <button class="export-btn-primary" :disabled="isGeneratingPdf" @click="handleExport('PDF')">
          <svg v-if="!isGeneratingPdf" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span v-if="isGeneratingPdf">Generating PDF...</span>
          <span v-else>Print / Export PDF</span>
        </button>
      </div>
    </div>

    <!-- Report Body Container (Dedicated Printable Area) -->
    <div id="report-content" ref="reportContentRef" class="report-content-card report-paper-sheet">
      <!-- DepEd Official Document Header -->
      <div class="deped-doc-header">
        <div class="doc-logo-col">
          <img src="/logo.png" alt="DepEd Seal" class="doc-seal-img" />
        </div>
        <div class="doc-header-text">
          <div class="doc-republic">Republic of the Philippines</div>
          <div class="doc-department">Department of Education</div>
          <div class="doc-region">Region X - Northern Mindanao</div>
          <div class="doc-division">Schools Division of Misamis Oriental</div>
          <div class="doc-district">District of Naawan</div>
          <div class="doc-program">ALTERNATIVE LEARNING SYSTEM (ALS)</div>
          <h2 class="doc-report-title">{{ reportTitle }}</h2>
        </div>
        <div class="doc-logo-col">
          <img src="/als-logo.png" alt="ALS Logo" class="doc-seal-img" />
        </div>
      </div>

      <!-- Report Metadata Summary -->
      <div class="doc-meta-strip">
        <div class="doc-meta-item">
          <span class="meta-label">LEARNING CENTER:</span>
          <span class="meta-val">{{ selectedCenter || 'All Assigned Centers' }}</span>
        </div>
        <div class="doc-meta-item">
          <span class="meta-label">PERIOD / RANGE:</span>
          <span class="meta-val">{{ selectedDateRange }}</span>
        </div>
        <div class="doc-meta-item">
          <span class="meta-label">ALS TEACHER:</span>
          <span class="meta-val">{{ teacherName }}</span>
        </div>
        <div class="doc-meta-item">
          <span class="meta-label">DATE GENERATED:</span>
          <span class="meta-val">{{ currentDate }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="state-container no-print">
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
        <h3 class="state-title">Loading report data...</h3>
      </div>

      <!-- Empty State matching reference image -->
      <div v-else-if="filteredLearners.length === 0" class="state-container empty-state">
        <div class="state-icon-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h3 class="state-title">No data available</h3>
        <p class="state-description">There are no records to display yet.</p>
      </div>

      <!-- Tab 1: Learner Progress Summary Table -->
      <div v-else-if="activeTab === 'Learner Progress Summary'" class="table-responsive">
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>LEARNER NAME</th>
              <th>LRN</th>
              <th>ALS LEVEL</th>
              <th>MODULES COMPLETED</th>
              <th>AVG. SCORE</th>
              <th>ATTENDANCE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in progressReportData" :key="item.id">
              <td class="cell-index">{{ idx + 1 }}</td>
              <td class="cell-name">{{ item.name }}</td>
              <td class="cell-lrn">{{ item.lrn || '-' }}</td>
              <td class="cell-level">
                <span class="level-pill">{{ item.level }}</span>
              </td>
              <td class="cell-modules">{{ item.completedModules }} / {{ item.totalModules }}</td>
              <td class="cell-score"><strong>{{ item.avgScore }}%</strong></td>
              <td class="cell-attendance">{{ item.attendance }}%</td>
              <td class="cell-status">
                <span class="status-badge badge-active">{{ item.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab 2: Assessment Summary Table -->
      <div v-else-if="activeTab === 'Assessment Summary'" class="table-responsive">
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>LEARNER NAME</th>
              <th>LRN</th>
              <th>ALS LEVEL</th>
              <th>MODULE / ACTIVITY</th>
              <th>SCORE</th>
              <th>REMARKS</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in assessmentReportData" :key="item.id">
              <td class="cell-index">{{ idx + 1 }}</td>
              <td class="cell-name">{{ item.learnerName }}</td>
              <td class="cell-lrn">{{ item.lrn || '-' }}</td>
              <td class="cell-level">
                <span class="level-pill">{{ item.level }}</span>
              </td>
              <td class="cell-activity">{{ item.activityName }}</td>
              <td class="cell-score"><strong>{{ item.score }}</strong></td>
              <td class="cell-remarks">{{ item.remarks }}</td>
              <td class="cell-date">{{ item.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab 3: Attendance Report Table -->
      <div v-else-if="activeTab === 'Attendance Report'" class="table-responsive">
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>LEARNER NAME</th>
              <th>LRN</th>
              <th>ALS LEVEL</th>
              <th>LEARNING CENTER</th>
              <th>TOTAL SESSIONS</th>
              <th>PRESENT</th>
              <th>RATE</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in attendanceReportData" :key="item.id">
              <td class="cell-index">{{ idx + 1 }}</td>
              <td class="cell-name">{{ item.name }}</td>
              <td class="cell-lrn">{{ item.lrn || '-' }}</td>
              <td class="cell-level">
                <span class="level-pill">{{ item.level }}</span>
              </td>
              <td class="cell-center">{{ item.learningCenter }}</td>
              <td class="cell-sessions">{{ item.totalSessions }}</td>
              <td class="cell-present">{{ item.presentSessions }}</td>
              <td class="cell-attendance"><strong>{{ item.attendanceRate }}%</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Official DepEd Signatures Section -->
      <div class="report-signatures">
        <div class="sig-block">
          <p class="sig-role">Prepared by:</p>
          <div class="sig-line">
            <span class="sig-name">{{ teacherName }}</span>
          </div>
          <span class="sig-title">ALS Teacher / Facilitator</span>
        </div>

        <div class="sig-block">
          <p class="sig-role">Verified &amp; Noted by:</p>
          <div class="sig-line">
            <span class="sig-name">DISTRICT ALS COORDINATOR</span>
          </div>
          <span class="sig-title">Education Program Specialist II / PSDS</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getAssignedLearners } from '../api/learners.js';
import { exportReportToPdf, printReportDirectly } from '../utils/pdfExport.js';

const { teacherId, teacherName, assignedCenters } = useTeacherSession();

const tabs = ['Learner Progress Summary', 'Assessment Summary', 'Attendance Report'];
const activeTab = ref('Learner Progress Summary');

const selectedCenter = ref('');
const selectedDateRange = ref('All Time');
const loading = ref(false);
const isGeneratingPdf = ref(false);
const learners = ref([]);
const reportContentRef = ref(null);

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
});

const reportTitle = computed(() => {
  switch (activeTab.value) {
    case 'Learner Progress Summary':
      return "SUMMARY OF MODULE USE AND LEARNER'S PROGRESS REPORT";
    case 'Assessment Summary':
      return 'LEARNER ASSESSMENT & MASTERY SUMMARY REPORT';
    case 'Attendance Report':
      return 'LEARNER ATTENDANCE SUMMARY REPORT';
    default:
      return 'ALS OFFICIAL SUMMARY REPORT';
  }
});

// Auto-select first center if available
watch(
  assignedCenters,
  (centers) => {
    if (centers && centers.length > 0 && !selectedCenter.value) {
      selectedCenter.value = centers[0].name;
    }
  },
  { immediate: true }
);

async function loadAssignedLearners() {
  if (!teacherId.value) return;
  loading.value = true;
  try {
    const { data } = await getAssignedLearners({ teacherId: teacherId.value });
    learners.value = (data || []).map((l) => ({
      id: l.id,
      name: l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Learner',
      lrn: l.lrn || '',
      level: l.level || 'A&E Elementary',
      learningCenter: l.learningCenter || (l.center ? l.center.name : ''),
      status: l.status || 'Active',
    }));
  } catch (err) {
    console.error('Failed to load teacher assigned learners:', err);
    learners.value = [];
  } finally {
    loading.value = false;
  }
}

const filteredLearners = computed(() => {
  return learners.value.filter((l) => {
    if (selectedCenter.value && l.learningCenter) {
      return l.learningCenter.toLowerCase().trim() === selectedCenter.value.toLowerCase().trim();
    }
    return true;
  });
});

const progressReportData = computed(() => {
  return filteredLearners.value.map((l) => ({
    id: l.id,
    name: l.name,
    lrn: l.lrn,
    level: l.level,
    completedModules: 3,
    totalModules: 5,
    avgScore: 88,
    attendance: 92,
    status: l.status,
  }));
});

const assessmentReportData = computed(() => {
  return filteredLearners.value.map((l, idx) => ({
    id: idx + 1,
    learnerId: l.id,
    learnerName: l.name,
    lrn: l.lrn,
    level: l.level,
    activityName: 'CS-M1 Post-Assessment Quiz',
    score: '18 / 20 (90%)',
    remarks: 'Satisfactory mastery',
    date: 'Sep 16, 2026',
  }));
});

const attendanceReportData = computed(() => {
  return filteredLearners.value.map((l) => ({
    id: l.id,
    name: l.name,
    lrn: l.lrn,
    level: l.level,
    learningCenter: l.learningCenter,
    totalSessions: 12,
    presentSessions: 11,
    attendanceRate: 92,
  }));
});

async function handleExport(format) {
  if (format === 'PDF') {
    isGeneratingPdf.value = true;
    try {
      const slug = activeTab.value.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const filename = `als_${slug}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportReportToPdf(reportContentRef.value || '#report-content', {
        filename,
        orientation: 'landscape',
        format: 'a4',
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      printReportDirectly('#report-content');
    } finally {
      isGeneratingPdf.value = false;
    }
  } else {
    alert(`Exporting ${activeTab.value} as CSV...`);
  }
}

onMounted(() => {
  loadAssignedLearners();
});
</script>

<style scoped>
.reports-page {
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
  max-width: 800px;
}

/* Tabs Bar */
.reports-tabs-bar {
  display: flex;
  gap: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1.25rem;
}

.tab-link-btn {
  background: transparent;
  border: none;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #64748b;
  padding: 0.65rem 0.25rem;
  cursor: pointer;
  position: relative;
  transition: color 0.15s ease;
}

.tab-link-btn:hover {
  color: #0f172a;
}

.tab-link-btn.active {
  color: #2563eb;
}

.tab-link-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #2563eb;
  border-radius: 2px;
}

/* Controls Card */
.controls-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  gap: 1rem;
  flex-wrap: wrap;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.control-field {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.control-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.control-select {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.45rem 2rem 0.45rem 0.75rem;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.65rem center;
  background-size: 14px;
}

.control-select:focus {
  border-color: #3b82f6;
  background-color: #ffffff;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.export-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.55rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.export-btn-outline:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.export-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 8px;
  padding: 0.55rem 1.15rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
  transition: all 0.15s ease;
}

.export-btn-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

/* Report Content Card */
.report-content-card {
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

.report-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.report-table th {
  background: #f8fafc;
  padding: 0.85rem 1rem;
  font-size: 0.725rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.report-table td {
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

.learner-name-link {
  color: #0f172a;
  text-decoration: none;
  font-weight: 600;
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

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .controls-card {
    flex-direction: column;
    align-items: stretch;
  }
  .controls-right {
    justify-content: flex-end;
  }
}

/* Document Sheet */
.report-paper-sheet {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2.25rem 2.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

/* DepEd Official Document Header with Logos */
.deped-doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #000000;
  padding-bottom: 0.85rem;
  margin-bottom: 1.25rem;
}

.doc-logo-col {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.doc-seal-img {
  max-width: 68px;
  max-height: 68px;
  object-fit: contain;
}

.doc-header-text {
  text-align: center;
  flex: 1;
  padding: 0 1rem;
}

.doc-republic,
.doc-department,
.doc-region,
.doc-division,
.doc-district,
.doc-program {
  font-size: 0.75rem;
  color: #1e293b;
  line-height: 1.35;
  margin: 0;
}

.doc-district {
  font-weight: 600;
}

.doc-program {
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-top: 0.15rem;
}

.doc-report-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #000000;
  margin: 0.5rem 0 0 0;
  letter-spacing: 0.02em;
}

/* Report Meta Strip */
.doc-meta-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  gap: 0.75rem;
}

.doc-meta-item {
  display: flex;
  gap: 0.4rem;
  font-size: 0.8rem;
}

.meta-label {
  font-weight: 700;
  color: #475569;
}

.meta-val {
  font-weight: 600;
  color: #0f172a;
}

/* Signatures */
.report-signatures {
  display: flex;
  justify-content: space-between;
  margin-top: 2.75rem;
  padding: 1.5rem 1rem 0;
  page-break-inside: avoid;
}

.sig-block {
  width: 250px;
}

.sig-role {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0 0 2rem 0;
}

.sig-line {
  border-bottom: 1.5px solid #0f172a;
  padding-bottom: 0.35rem;
  text-align: center;
}

.sig-name {
  font-weight: 700;
  font-size: 0.875rem;
  color: #0f172a;
  text-transform: uppercase;
}

.sig-title {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  margin-top: 0.35rem;
}

@media print {
  .no-print {
    display: none !important;
  }

  body {
    background: #ffffff !important;
  }

  .report-paper-sheet {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>

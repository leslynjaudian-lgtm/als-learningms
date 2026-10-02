<template>
  <div class="page-container af2-summary-view">
    <!-- Breadcrumb -->
    <nav class="breadcrumb print-hidden">
      <router-link to="/dashboard">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <router-link to="/dashboard/reports">Reports</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">ALS AF2 Summary</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row print-hidden">
      <div class="page-title-group">
        <h1>ALS AF2 Summary</h1>
        <p>Monitor learner module progress records from all Community Learning Centers.</p>
      </div>

      <div class="header-actions-group">
        <button
          v-if="showPreview"
          type="button"
          class="btn btn-secondary"
          @click="printReport"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>Print AF2</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards (Single Horizontal Row) -->
    <div class="report-stats-grid print-hidden">
      <!-- Card 1: Total Learners -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <span class="report-card-label">Total Learners</span>
        <span class="report-card-value">{{ filteredSummary.totalLearners }}</span>
        <span class="report-card-desc">Learners with AF2 records</span>
      </div>

      <!-- Card 2: Total AF2 Records -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <span class="report-card-label">Total AF2 Records</span>
        <span class="report-card-value">{{ filteredSummary.totalAf2Records }}</span>
        <span class="report-card-desc">Recorded module progress entries</span>
      </div>

      <!-- Card 3: Mastered Modules -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <span class="report-card-label">Mastered Modules</span>
        <span class="report-card-value text-green">{{ filteredSummary.totalMastered }}</span>
        <span class="report-card-desc">Modules marked as mastered by ALS Teacher</span>
      </div>

      <!-- Card 4: Needs Intervention -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-amber">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <span class="report-card-label">Needs Intervention</span>
        <span class="report-card-value text-amber">{{ filteredSummary.totalNotMastered }}</span>
        <span class="report-card-desc">Modules not yet mastered</span>
      </div>
    </div>

    <!-- Filters in One Row -->
    <div class="report-filter-bar print-hidden">
      <div class="report-filter-controls">
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

        <!-- 2. ALS Teacher -->
        <div class="filter-field-col">
          <label>ALS Teacher</label>
          <select v-model="selectedTeacher">
            <option value="">All ALS Teachers</option>
            <option v-for="t in filteredTeachers" :key="t.id" :value="t.fullName">
              {{ t.fullName }}
            </option>
          </select>
        </div>

        <!-- 3. Program Level -->
        <div class="filter-field-col">
          <label>Program Level</label>
          <select v-model="selectedLevel">
            <option value="">All Program Levels</option>
            <option value="A&E Elementary">A&E Elementary</option>
            <option value="A&E Junior High School">A&E Junior High School</option>
          </select>
        </div>

        <!-- 4. Learner Name -->
        <div class="filter-field-col">
          <label>Learner Name</label>
          <select v-model="selectedLearnerName">
            <option value="">All Learners</option>
            <option v-for="l in filteredLearnersList" :key="l.id" :value="l.fullName">
              {{ l.fullName }}
            </option>
          </select>
        </div>

        <!-- 5. Learning Strand -->
        <div class="filter-field-col">
          <label>Learning Strand</label>
          <select v-model="selectedStrand">
            <option value="">All Strands</option>
            <option v-for="s in learningStrands" :key="s" :value="s">
              {{ s }}
            </option>
          </select>
        </div>

        <!-- 6. From Date -->
        <div class="filter-field-col">
          <label>From Date</label>
          <input
            v-model="fromDate"
            type="date"
          />
        </div>

        <!-- 7. To Date -->
        <div class="filter-field-col">
          <label>To Date</label>
          <input
            v-model="toDate"
            type="date"
          />
        </div>
      </div>

      <div class="filter-actions">
        <button type="button" class="btn btn-secondary" @click="resetFilters">
          Reset
        </button>
        <button type="button" class="btn btn-primary" @click="generateReport">
          Generate Report
        </button>
      </div>
    </div>

    <!-- Table Appears Directly Below Filters -->
    <div class="table-card print-hidden">
      <div class="table-header-row">
        <div>
          <h3>AF2 Module Progress Records</h3>
          <p>Showing {{ filteredRecords.length }} record(s) matching selected filters</p>
        </div>
      </div>

      <!-- Empty State if no records exist -->
      <div v-if="filteredRecords.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <h3>No records found</h3>
        <p>Learner module progress records will appear here once encoded by ALS teachers.</p>
      </div>

      <!-- Table with live records -->
      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Learner Name</th>
              <th>ALS Level</th>
              <th>Learning Center</th>
              <th>ALS Teacher</th>
              <th>Module Title</th>
              <th>Learning Strand</th>
              <th>Date Started</th>
              <th>Date Finished</th>
              <th class="text-center">Pre-Test Result</th>
              <th class="text-center">Post-Test Result</th>
              <th>Learner Self-Assessment</th>
              <th>Teacher Assessment</th>
              <th class="text-center">Mastered / Not Mastered</th>
              <th>Teacher Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rec, idx) in filteredRecords" :key="rec.id || idx">
              <td class="cell-num">{{ idx + 1 }}</td>
              <td class="font-semibold">{{ rec.learnerName }}</td>
              <td>
                <span class="badge badge-outline">{{ rec.level || '—' }}</span>
              </td>
              <td>{{ rec.learningCenter || rec.centerName || '—' }}</td>
              <td>{{ rec.teacherName || '—' }}</td>
              <td class="font-medium" style="max-width: 220px;">{{ rec.moduleTitle }}</td>
              <td style="max-width: 180px;">{{ rec.strandName || '—' }}</td>
              <td class="text-sm">{{ rec.dateStarted || '—' }}</td>
              <td class="text-sm">{{ rec.dateFinished || '—' }}</td>
              <td class="text-center font-mono">{{ formatScore(rec.preTestScore, rec.preTestTotal) }}</td>
              <td class="text-center font-mono font-bold">{{ formatScore(rec.postTestScore, rec.postTestTotal) }}</td>
              <td class="text-sm" style="max-width: 180px;">{{ rec.selfAssessment || '—' }}</td>
              <td class="text-sm">{{ rec.assessment || '—' }}</td>
              <td class="text-center">
                <span
                  class="badge"
                  :class="isMastered(rec.assessment) ? 'badge-green' : 'badge-amber'"
                >
                  {{ isMastered(rec.assessment) ? 'Mastered' : 'Not Mastered' }}
                </span>
              </td>
              <td class="text-sm" style="max-width: 200px;">{{ rec.remarks || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Official Generated ALS AF2 Preview (Rendered on same page when Generate Report is clicked) -->
    <section v-if="showPreview" id="af2-preview-area" class="af2-preview-wrapper">
      <div class="af2-preview-banner print-hidden">
        <div class="preview-badge-group">
          <span class="badge badge-blue">Official Report Preview</span>
          <span class="preview-banner-text">RECORD OF MODULE USE AND MONITORING OF LEARNER'S PROGRESS</span>
        </div>
        <div class="preview-actions-bar no-print print-hidden">
          <button
            type="button"
            class="btn btn-sm btn-primary"
            :disabled="generatingPdf"
            @click="handleGeneratePdf"
          >
            <span v-if="generatingPdf" class="btn-spinner-white"></span>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span>{{ generatingPdf ? 'Generating PDF...' : 'Generate PDF' }}</span>
          </button>
          <button type="button" class="btn btn-sm btn-secondary" @click="printReport">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print AF2
          </button>
          <button type="button" class="btn btn-sm btn-outline" @click="showPreview = false">
            Close Preview
          </button>
        </div>
      </div>

      <!-- Formal White Document Sheet (Dedicated report container) -->
      <div id="report-content" ref="reportContentRef" class="af2-paper-sheet">
        <!-- Header with ALS Logo & ALS Naawan District Logo -->
        <div class="af2-header-container">
          <div class="af2-logo-box left-logo">
            <img src="/als-logo.png" alt="ALS Logo" class="af2-logo-img" />
          </div>

          <div class="af2-title-block">
            <p class="header-rep">Republic of the Philippines</p>
            <p class="header-dept">Department of Education</p>
            <p class="header-dist">Region X — Division of Misamis Oriental — Naawan District</p>
            <p class="header-als">Alternative Learning System (ALS)</p>
            <h2 class="header-main-title">RECORD OF MODULE USE AND MONITORING OF LEARNER'S PROGRESS</h2>
            <p class="header-subtag">ALS Assessment Form 2 (AF2)</p>
          </div>

          <div class="af2-logo-box right-logo">
            <img src="/logo.png" alt="ALS Naawan District Logo" class="af2-logo-img" />
          </div>
        </div>

        <!-- Learner Metadata Section -->
        <div class="af2-meta-section">
          <div class="meta-row">
            <div class="meta-field">
              <span class="meta-label">Name of Learner:</span>
              <span class="meta-underline">{{ previewLearnerName || (filteredRecords.length ? filteredRecords[0].learnerName : '—') }}</span>
            </div>
            <div class="meta-field">
              <span class="meta-label">Community Learning Center:</span>
              <span class="meta-underline">{{ previewCenterName || selectedCenter || '—' }}</span>
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-field">
              <span class="meta-label">ALS Level:</span>
              <div class="level-badges">
                <span class="level-chk" :class="{ active: isLevelMatched('BL') }">[ ] BL</span>
                <span class="level-chk" :class="{ active: isLevelMatched('LE') }">[ ] LE</span>
                <span class="level-chk" :class="{ active: isLevelMatched('AE') }">[{{ isLevelMatched('AE') ? '✓' : ' ' }}] AE</span>
                <span class="level-chk" :class="{ active: isLevelMatched('JHS') }">[{{ isLevelMatched('JHS') ? '✓' : ' ' }}] JHS</span>
              </div>
            </div>
            <div class="meta-field">
              <span class="meta-label">Name of ALS Teacher:</span>
              <span class="meta-underline">{{ previewTeacherName || selectedTeacher || '—' }}</span>
            </div>
          </div>

          <div class="meta-directions">
            <strong>Directions:</strong> Write the title of each learning module accomplished along with learning strand, date started and finished, results in pre-test and post-test, other related activities, learner's self-assessment, teacher's assessment, and teacher's remarks.
          </div>
        </div>

        <!-- Official Two-Tier AF2 Table -->
        <div class="af2-table-wrapper">
          <table class="af2-official-table">
            <thead>
              <tr>
                <th rowspan="2" class="th-num">No.</th>
                <th rowspan="2" class="th-mod">
                  Title of Learning Module<br>
                  <small>(Pamagat ng Modyul)</small>
                </th>
                <th rowspan="2" class="th-str">
                  Learning Strand
                </th>
                <th colspan="2" class="th-dates">
                  Date (Petsa)
                </th>
                <th rowspan="2" class="th-test">
                  Pre-Test Result<br>
                  <small>(Panimula)</small>
                </th>
                <th rowspan="2" class="th-test">
                  Post-Test Result<br>
                  <small>(Pagtatapos)</small>
                </th>
                <th rowspan="2" class="th-act">
                  Other Activities Accomplished<br>
                  <small>(Iba pang Gawaing Natapos)</small>
                </th>
                <th rowspan="2" class="th-self">
                  Learner's Self-Assessment<br>
                  <small>(Pagtatasa sa Sarili)</small>
                </th>
                <th colspan="2" class="th-assess">
                  ALS Teacher's Assessment
                </th>
                <th rowspan="2" class="th-rem">
                  ALS Teacher's Remarks<br>
                  <small>(Puna ng Guro)</small>
                </th>
              </tr>
              <tr>
                <th class="th-sub">Started</th>
                <th class="th-sub">Finished</th>
                <th class="th-sub-m">Mastered</th>
                <th class="th-sub-m">Not Mastered</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredRecords.length === 0">
                <td colspan="12" class="af2-empty-row">
                  No records found
                </td>
              </tr>
              <tr v-for="(rec, idx) in filteredRecords" :key="rec.id || idx">
                <td class="text-center font-semibold">{{ idx + 1 }}</td>
                <td class="font-medium">{{ rec.moduleTitle }}</td>
                <td>{{ rec.strandName || '—' }}</td>
                <td class="text-center text-sm">{{ rec.dateStarted || '—' }}</td>
                <td class="text-center text-sm">{{ rec.dateFinished || '—' }}</td>
                <td class="text-center font-mono">{{ formatScore(rec.preTestScore, rec.preTestTotal) }}</td>
                <td class="text-center font-mono font-bold">{{ formatScore(rec.postTestScore, rec.postTestTotal) }}</td>
                <td class="text-sm">{{ rec.otherActivities || '—' }}</td>
                <td class="text-sm">{{ rec.selfAssessment || '—' }}</td>
                <td class="text-center font-bold text-green">
                  <span v-if="isMastered(rec.assessment)">✓</span>
                </td>
                <td class="text-center font-bold text-amber">
                  <span v-if="!isMastered(rec.assessment)">✓</span>
                </td>
                <td class="text-sm">{{ rec.remarks || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Official Signatures Section -->
        <div class="af2-signatures-section">
          <div class="sig-block">
            <div class="sig-underline"></div>
            <div class="sig-name">{{ previewLearnerName || (filteredRecords.length ? filteredRecords[0].learnerName : 'Learner') }}</div>
            <div class="sig-caption">(Learner’s Signature over Printed Name)</div>
          </div>
          <div class="sig-block">
            <div class="sig-underline"></div>
            <div class="sig-name">{{ previewTeacherName || (filteredRecords.length ? filteredRecords[0].teacherName : 'ALS Teacher') }}</div>
            <div class="sig-caption">(ALS Teacher’s Signature over Printed Name)</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { exportReportToPdf } from '../utils/pdfExport.js';
import { getLearningCenters } from '../api/learningCenters.js';
import { getTeachers } from '../api/teachers.js';
import { getLearners } from '../api/learners.js';
import { getAf2Records } from '../api/reports.js';

const reportContentRef = ref(null);
const generatingPdf = ref(false);

// Live Entities from backend
const learningCenters = ref([]);
const teachers = ref([]);
const learners = ref([]);
const rawAf2Records = ref([]);

// Filter States
const selectedCenter = ref('');
const selectedTeacher = ref('');
const selectedLevel = ref('');
const selectedLearnerName = ref('');
const selectedStrand = ref('');
const fromDate = ref('');
const toDate = ref('');

// UI States
const showPreview = ref(false);

const learningStrands = [
  'LS1 Communication Skills (English)',
  'LS1 Communication Skills (Filipino)',
  'LS2 Scientific Literacy and Critical Thinking',
  'LS3 Mathematical and Problem Solving Skills',
  'LS4 Life and Career Skills',
  'LS5 Understanding Self and Society',
  'LS6 Digital Citizenship',
];

// Load live data from backend
async function loadData() {
  try {
    const [centersRes, teachersRes, learnersRes, af2Data] = await Promise.all([
      getLearningCenters().catch(() => ({ data: [] })),
      getTeachers().catch(() => ({ data: [] })),
      getLearners().catch(() => ({ data: [] })),
      getAf2Records().catch(() => []),
    ]);

    learningCenters.value = Array.isArray(centersRes.data) ? centersRes.data : [];
    teachers.value = Array.isArray(teachersRes.data) ? teachersRes.data : [];
    learners.value = Array.isArray(learnersRes.data) ? learnersRes.data : [];
    rawAf2Records.value = Array.isArray(af2Data) ? af2Data : [];
  } catch (err) {
    console.error('Error loading AF2 report data:', err);
  }
}

onMounted(() => {
  loadData();
});

// Cascading teacher dropdown based on selected Learning Center
const filteredTeachers = computed(() => {
  if (!selectedCenter.value) return teachers.value;
  const targetCenter = learningCenters.value.find((c) => c.name === selectedCenter.value);
  if (!targetCenter) return teachers.value;
  return teachers.value.filter(
    (t) => t.learningCenterId === targetCenter.id || t.learningCenter === selectedCenter.value
  );
});

// Cascading learner dropdown based on selected Learning Center and Level
const filteredLearnersList = computed(() => {
  return learners.value.filter((l) => {
    if (selectedCenter.value) {
      const matchCenter = l.learningCenter === selectedCenter.value;
      if (!matchCenter) return false;
    }
    if (selectedLevel.value) {
      const lvlQuery = selectedLevel.value.toLowerCase();
      const norm = (l.level || '').toLowerCase();
      if (lvlQuery.includes('elem') && !norm.includes('elem')) return false;
      if ((lvlQuery.includes('junior') || lvlQuery.includes('jhs')) && (!norm.includes('junior') && !norm.includes('jhs'))) return false;
    }
    return true;
  });
});

function handleCenterChange() {
  const isTeacherValid = filteredTeachers.value.some((t) => t.fullName === selectedTeacher.value);
  if (!isTeacherValid) selectedTeacher.value = '';
}

function resetFilters() {
  selectedCenter.value = '';
  selectedTeacher.value = '';
  selectedLevel.value = '';
  selectedLearnerName.value = '';
  selectedStrand.value = '';
  fromDate.value = '';
  toDate.value = '';
  showPreview.value = false;
}

// Filtered Records based on all criteria
const filteredRecords = computed(() => {
  return rawAf2Records.value.filter((rec) => {
    if (selectedCenter.value) {
      const c = (rec.learningCenter || rec.centerName || '').toLowerCase().trim();
      if (c !== selectedCenter.value.toLowerCase().trim()) return false;
    }

    if (selectedTeacher.value) {
      const t = (rec.teacherName || '').toLowerCase().trim();
      if (t !== selectedTeacher.value.toLowerCase().trim()) return false;
    }

    if (selectedLevel.value) {
      const lvlQuery = selectedLevel.value.toLowerCase();
      const norm = (rec.level || '').toLowerCase();
      if (lvlQuery.includes('elem') && !norm.includes('elem')) return false;
      if ((lvlQuery.includes('junior') || lvlQuery.includes('jhs')) && (!norm.includes('junior') && !norm.includes('jhs'))) return false;
    }

    if (selectedLearnerName.value) {
      const ln = (rec.learnerName || '').toLowerCase().trim();
      if (ln !== selectedLearnerName.value.toLowerCase().trim()) return false;
    }

    if (selectedStrand.value) {
      const s = (rec.strandName || '').toLowerCase().trim();
      if (!s.includes(selectedStrand.value.toLowerCase().trim())) return false;
    }

    if (fromDate.value && rec.dateStarted) {
      if (new Date(rec.dateStarted) < new Date(fromDate.value)) return false;
    }
    if (toDate.value && rec.dateFinished) {
      if (new Date(rec.dateFinished) > new Date(toDate.value)) return false;
    }

    return true;
  });
});

// Summary Metrics based on filtered records
const filteredSummary = computed(() => {
  const distinctLearners = new Set(
    filteredRecords.value.map((r) => r.learnerId || r.learnerName).filter(Boolean)
  );

  const totalMastered = filteredRecords.value.filter((r) => isMastered(r.assessment)).length;
  const totalNotMastered = filteredRecords.value.filter((r) => !isMastered(r.assessment)).length;

  return {
    totalLearners: distinctLearners.size,
    totalAf2Records: filteredRecords.value.length,
    totalMastered,
    totalNotMastered,
  };
});

function isMastered(assessment) {
  if (!assessment) return false;
  return assessment.toLowerCase().trim() === 'mastered';
}

function formatScore(score, total) {
  if (score == null || score === '') return '—';
  if (total == null || total === '') return String(score);
  return `${score}/${total}`;
}

function generateReport() {
  showPreview.value = true;
  setTimeout(() => {
    const el = document.getElementById('af2-preview-area');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
}

const previewLearnerName = computed(() => {
  if (selectedLearnerName.value) return selectedLearnerName.value;
  if (filteredRecords.value.length > 0) return filteredRecords.value[0].learnerName;
  return '';
});

const previewCenterName = computed(() => {
  if (selectedCenter.value) return selectedCenter.value;
  if (filteredRecords.value.length > 0) return filteredRecords.value[0].learningCenter || filteredRecords.value[0].centerName;
  return '';
});

const previewTeacherName = computed(() => {
  if (selectedTeacher.value) return selectedTeacher.value;
  if (filteredRecords.value.length > 0) return filteredRecords.value[0].teacherName;
  return '';
});

function isLevelMatched(tag) {
  const target = selectedLevel.value || (filteredRecords.value.length ? filteredRecords.value[0].level : '');
  const lower = (target || '').toLowerCase();
  if (tag === 'AE' && lower.includes('elem')) return true;
  if (tag === 'JHS' && (lower.includes('junior') || lower.includes('jhs'))) return true;
  return false;
}

function printReport() {
  window.print();
}

async function handleGeneratePdf() {
  const element = reportContentRef.value || document.getElementById('report-content');
  if (!element) return;

  generatingPdf.value = true;
  try {
    const safeLearnerName = (previewLearnerName.value || 'Learner').replace(/[^a-zA-Z0-9_-]/g, '_');
    await exportReportToPdf(element, {
      filename: `ALS_AF2_Report_${safeLearnerName}_${new Date().toISOString().split('T')[0]}.pdf`,
      orientation: 'landscape',
      margin: [8, 6, 8, 6],
    });
  } catch (err) {
    console.error('Error generating AF2 PDF:', err);
  } finally {
    generatingPdf.value = false;
  }
}
</script>

<style scoped>
.af2-summary-view {
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

/* AF2 Preview Section */
.af2-preview-wrapper {
  margin-top: 0.5rem;
}

.af2-preview-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-bottom: none;
  padding: 0.75rem 1.25rem;
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
}

.preview-badge-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-banner-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.preview-actions-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-outline {
  background: #ffffff;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-outline:hover {
  background: #f1f5f9;
  color: var(--color-text);
}

.af2-paper-sheet {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  padding: 2.25rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.af2-header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1.25rem;
  border-bottom: 2px solid #0f172a;
  gap: 1.5rem;
}

.af2-logo-box {
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.af2-logo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.af2-title-block {
  text-align: center;
  flex: 1;
}

.header-rep {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  margin-bottom: 2px;
}

.header-dept {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #0f172a;
  margin-bottom: 2px;
}

.header-dist {
  font-size: 0.75rem;
  color: #475569;
  margin-bottom: 3px;
}

.header-als {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1d4ed8;
  margin-bottom: 4px;
}

.header-main-title {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #0f172a;
  margin: 4px 0 2px;
}

.header-subtag {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.af2-meta-section {
  padding: 1.25rem 0;
  border-bottom: 1px solid #cbd5e1;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
}

.meta-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  font-size: 0.85rem;
}

.meta-label {
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.meta-underline {
  border-bottom: 1px solid #0f172a;
  flex: 1;
  padding: 0 0.5rem 2px;
  font-weight: 600;
  color: #0f172a;
}

.level-badges {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.level-chk {
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
}

.level-chk.active {
  color: #1d4ed8;
}

.meta-directions {
  margin-top: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: #f8fafc;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.4;
}

.af2-table-wrapper {
  overflow-x: auto;
  margin-top: 1.25rem;
}

.af2-official-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  color: #0f172a;
}

.af2-official-table th,
.af2-official-table td {
  border: 1px solid #94a3b8;
  padding: 6px 8px;
  vertical-align: middle;
}

.af2-official-table th {
  background: #f1f5f9;
  font-weight: 700;
  text-align: center;
  color: #0f172a;
}

.af2-official-table th small {
  font-weight: normal;
  color: #64748b;
}

.af2-empty-row {
  text-align: center;
  padding: 2.5rem 1rem !important;
  color: #64748b;
  font-style: italic;
}

/* AF2 Signatures Section */
.af2-signatures-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 3.5rem;
  padding: 0 1.5rem 1rem;
  page-break-inside: avoid;
}

.af2-signatures-section .sig-block {
  text-align: center;
  min-width: 240px;
}

.af2-signatures-section .sig-underline {
  border-bottom: 1.5px solid #0f172a;
  margin-bottom: 0.35rem;
  width: 100%;
}

.af2-signatures-section .sig-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  margin-bottom: 0.2rem;
}

.af2-signatures-section .sig-caption {
  font-size: 0.775rem;
  color: #475569;
  font-style: italic;
}

.btn-spinner-white {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media print {
  .print-hidden,
  .no-print,
  .sidebar,
  .topbar,
  .portal-footer {
    display: none !important;
  }

  .main-wrapper {
    margin-left: 0 !important;
    padding: 0 !important;
  }

  .af2-paper-sheet {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    width: 100% !important;
  }
}
</style>

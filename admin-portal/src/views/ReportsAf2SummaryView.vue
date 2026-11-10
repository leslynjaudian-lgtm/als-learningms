<template>
  <div class="page-container af2-summary-view">
    <!-- Standardized Page Header -->
    <ReportsPageHeader
      title="ALS AF2 Summary"
      description="Monitor learner module progress records from all Community Learning Centers."
    >
      <template v-if="showPreview" #actions>
        <button
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
      </template>
    </ReportsPageHeader>

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

        <!-- 3. ALS Level -->
        <div class="filter-field-col">
          <label>ALS Level</label>
          <select v-model="selectedLevel">
            <option value="">All ALS Levels</option>
            <option value="A&E Elementary">A&E Elementary</option>
            <option value="A&E Junior High">A&E Junior High</option>
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
              <td class="table-cell-name">{{ rec.learnerName }}</td>
              <td class="table-cell-als-level">{{ formatAlsLevel(rec.level) }}</td>
              <td>{{ rec.learningCenter || rec.centerName || '—' }}</td>
              <td class="table-cell-name">{{ rec.teacherName || '—' }}</td>
              <td style="max-width: 220px;">{{ rec.moduleTitle }}</td>
              <td class="text-center" style="width: 56px; max-width: 56px;">{{ formatStrandDisplay(rec.strandName, rec.moduleTitle) }}</td>
              <td class="text-sm">{{ rec.dateStarted || '—' }}</td>
              <td class="text-sm">{{ rec.dateFinished || '—' }}</td>
              <td class="text-center font-mono">{{ formatScore(rec.preTestScore, rec.preTestTotal) }}</td>
              <td class="text-center font-mono">{{ formatScore(rec.postTestScore, rec.postTestTotal) }}</td>
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

    <!-- Official Generated ALS AF2 Preview (Rendered using exact DepEd ALS Assessment Form 2 PDF measurements) -->
    <section v-if="showPreview" id="af2-preview-area" class="af2-preview-wrapper">
      <div class="af2-preview-banner print-hidden">
        <div class="preview-badge-group">
          <span class="badge badge-blue">Official Report Preview</span>
          <span class="preview-banner-text">RECORD OF MODULE USE AND MONITORING OF LEARNER’S PROGRESS</span>
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

      <!-- Dedicated Multi-Page Monthly AF2 Report Container -->
      <div id="report-content" ref="reportContentRef" class="af2-pages-container">
        <div
          v-for="(page, pageIdx) in monthlyReportPages"
          :key="page.pageKey"
          class="af2-page-unit"
          :class="{ 'has-page-break': pageIdx < monthlyReportPages.length - 1 }"
        >
          <div v-if="page.monthLabel" class="af2-month-page-bar print-hidden">
            <span class="month-bar-title">{{ page.monthLabel }}</span>
            <span class="month-bar-sep">—</span>
            <span class="month-bar-page">Page {{ page.pageNumber }} of {{ page.totalPagesInMonth }}</span>
          </div>

          <div class="af2-paper-scroll-wrapper">
            <div class="af2-report-paper">
              <!-- Top-Right Form Identifier (Arial 8pt Regular) -->
              <div class="af2-top-form-code">ALS Assessment Form 2</div>

              <!-- Main Report Title (Arial 12pt Bold Centered) -->
              <div class="af2-clean-header">
                <h2 class="af2-main-title">RECORD OF MODULE USE AND MONITORING OF LEARNER’S PROGRESS</h2>
              </div>

              <!-- Learner Information Section -->
              <div class="af2-info-section">
                <div class="info-row">
                  <div class="info-col info-col-left">
                    <span class="info-label">Name of Learner:</span>
                    <span class="info-underline">{{ previewLearnerName || '' }}</span>
                  </div>
                  <div class="info-col info-col-right">
                    <span class="info-label">Community Learning Center:</span>
                    <span class="info-underline">{{ previewCenterName || '' }}</span>
                  </div>
                </div>

                <div class="info-row">
                  <div class="info-col info-col-left level-col">
                    <span class="info-label">Level:</span>
                    <div class="level-checkboxes">
                      <span class="level-box-item">
                        <span class="check-square" :class="{ checked: isLevelMatched('BL') }">
                          <span v-if="isLevelMatched('BL')" class="check-mark">✓</span>
                        </span>
                        <span class="level-text">BL</span>
                      </span>
                      <span class="level-box-item">
                        <span class="check-square" :class="{ checked: isLevelMatched('LE') }">
                          <span v-if="isLevelMatched('LE')" class="check-mark">✓</span>
                        </span>
                        <span class="level-text">LE</span>
                      </span>
                      <span class="level-box-item">
                        <span class="check-square" :class="{ checked: isLevelMatched('AE') }">
                          <span v-if="isLevelMatched('AE')" class="check-mark">✓</span>
                        </span>
                        <span class="level-text">AE</span>
                      </span>
                      <span class="level-box-item">
                        <span class="check-square" :class="{ checked: isLevelMatched('JHS') }">
                          <span v-if="isLevelMatched('JHS')" class="check-mark">✓</span>
                        </span>
                        <span class="level-text">JHS</span>
                      </span>
                    </div>
                  </div>
                  <div class="info-col info-col-right">
                    <span class="info-label">Name of ALS Teacher:</span>
                    <span class="info-underline">{{ previewTeacherName || '' }}</span>
                  </div>
                </div>
              </div>

              <!-- Official Report Table -->
              <div class="table-outer-wrapper">
                <table class="af2-table">
                  <colgroup :key="'colgroup-' + page.pageKey">
                    <col class="col-module" style="width: 179.23pt;" />
                    <col class="col-strand" style="width: 28.51pt;" />
                    <col class="col-date-started" style="width: 48.88pt;" />
                    <col class="col-date-finished" style="width: 48.88pt;" />
                    <col class="col-pretest" style="width: 33.40pt;" />
                    <col class="col-posttest" style="width: 33.40pt;" />
                    <col class="col-activities" style="width: 127.09pt;" />
                    <col class="col-self" style="width: 97.76pt;" />
                    <col class="col-mastered" style="width: 39.51pt;" />
                    <col class="col-not-mastered" style="width: 39.51pt;" />
                    <col class="col-remarks" style="width: 138.51pt;" />
                  </colgroup>
                  <thead :key="'thead-' + page.pageKey">
                    <tr class="thead-row-1">
                      <th rowspan="2" class="th-module">
                        <span class="th-en-11">Title of Learning Module</span>
                        <span class="th-tl-10">(Pamagat ng Modyul)</span>
                      </th>
                      <th rowspan="2" class="th-strand">
                        <span class="th-en-65">Learning<br>Strand</span>
                      </th>
                      <th colspan="2" class="th-date">
                        <span class="th-en-11">Date</span>
                        <span class="th-tl-10">(Petsa)</span>
                      </th>
                      <th rowspan="2" class="th-score th-pretest">
                        <span class="th-en-95">Pre-<br>Test<br>Result</span>
                        <span class="th-tl-55">(Resulta ng<br>Panimulang<br>Pagtataya)</span>
                      </th>
                      <th rowspan="2" class="th-score th-posttest">
                        <span class="th-en-95">Post-<br>Test<br>Result</span>
                        <span class="th-tl-55">(Resulta ng<br>Pagtatapos na<br>Pagtataya)</span>
                      </th>
                      <th rowspan="2" class="th-activities">
                        <span class="th-en-11">Other Related<br>Activities<br>Accomplished</span>
                        <span class="th-tl-10">(Iba pang<br>Gawaing<br>Natapos)</span>
                      </th>
                      <th rowspan="2" class="th-self">
                        <span class="th-en-11">Learner’s<br>Self-Assessment of<br>Performance</span>
                        <span class="th-tl-10">(Pagtatasa sa<br>Sarili sa<br>Pagganap)</span>
                      </th>
                      <th colspan="2" class="th-teacher-assessment">
                        <span class="th-en-11">ALS<br>Teacher’s<br>Assessment</span>
                        <span class="th-tl-10">(Pagtatasa ng<br>Guro sa ALS)</span>
                      </th>
                      <th rowspan="2" class="th-remarks">
                        <span class="th-en-11">ALS Teacher’s Remarks</span>
                        <span class="th-tl-10">(Puna ng Guro sa ALS)</span>
                      </th>
                    </tr>
                    <tr class="thead-row-2">
                      <th class="th-sub-date th-sub-date-started">
                        <span class="th-en-8">Started</span>
                        <span class="th-tl-6">(Simula)</span>
                      </th>
                      <th class="th-sub-date th-sub-date-finished">
                        <span class="th-en-8">Finished</span>
                        <span class="th-tl-6">(Pagtapos)</span>
                      </th>
                      <th class="th-sub-mastery th-sub-mastered">
                        <span class="th-en-8">Mastered</span>
                        <span class="th-tl-6-bold">(Natuto)</span>
                      </th>
                      <th class="th-sub-mastery th-sub-not-mastered">
                        <span class="th-en-8">Not<br>Mastered</span>
                        <span class="th-tl-6-bold">(Hindi Natuto)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, rIdx) in page.rows"
                      :key="row.rowKey || rIdx"
                      :class="row.isBlank ? 'blank-row' : 'record-row'"
                    >
                      <td class="cell-left td-module">
                        <div class="cell-single-line">{{ row.moduleTitle }}</div>
                      </td>
                      <td class="cell-center td-strand">
                        <div class="cell-single-line">{{ row.strandCode }}</div>
                      </td>
                      <td class="cell-center td-date td-date-started">
                        <div class="cell-single-line">{{ row.dateStarted }}</div>
                      </td>
                      <td class="cell-center td-date td-date-finished">
                        <div class="cell-single-line">{{ row.dateFinished }}</div>
                      </td>
                      <td class="cell-center td-score td-pretest">
                        <div class="cell-single-line">{{ row.preTest }}</div>
                      </td>
                      <td class="cell-center td-score td-posttest">
                        <div class="cell-single-line">{{ row.postTest }}</div>
                      </td>
                      <td class="cell-left td-activities">
                        <div class="cell-single-line">{{ row.otherActivities }}</div>
                      </td>
                      <td class="cell-left td-self">
                        <div class="cell-single-line">{{ row.selfAssessment }}</div>
                      </td>
                      <td class="cell-center td-check td-mastered">
                        <span v-if="row.isMastered" class="af2-check-mark">✓</span>
                      </td>
                      <td class="cell-center td-check td-not-mastered">
                        <span v-if="row.isNotMastered" class="af2-check-mark">✓</span>
                      </td>
                      <td class="cell-left td-remarks">
                        <div class="cell-single-line">{{ row.remarks }}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Bottom Signatures Section -->
              <div class="af2-signatures-section">
                <div class="signature-block sig-block-left">
                  <div class="sig-name-slot">
                    <span class="sig-printed-name">{{ previewLearnerName || '' }}</span>
                  </div>
                  <div class="sig-caption">(Learner’s Signature over Printed Name)</div>
                  <div class="sig-date-row">
                    <span class="sig-date-label">Date:</span>
                    <span class="sig-date-line"></span>
                  </div>
                </div>

                <div class="signature-block sig-block-right">
                  <div class="sig-name-slot">
                    <span class="sig-printed-name">{{ previewTeacherName || '' }}</span>
                  </div>
                  <div class="sig-caption">(ALS Teacher’s Signature over Printed Name)</div>
                  <div class="sig-date-row">
                    <span class="sig-date-label">Date:</span>
                    <span class="sig-date-line"></span>
                  </div>
                </div>
              </div>

              <!-- Bottom-Right Revision Footer -->
              <div class="af2-bottom-revision">10/2020</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ReportsPageHeader from '../components/ReportsPageHeader.vue';
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
const showPreview = ref(true);

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
  const s = String(assessment).toLowerCase().trim();
  return s === 'mastered' || s === 'completed';
}

function isNotMastered(assessment) {
  if (!assessment) return false;
  const s = String(assessment).toLowerCase().trim();
  return s === 'not mastered' || s === 'not_mastered';
}

function formatAlsLevel(val) {
  if (!val) return '—';
  const s = String(val).toUpperCase();
  if (s.includes('ELEM')) return 'A&E Elementary';
  if (s.includes('JUN') || s.includes('LOWER_SEC') || s.includes('SEC')) return 'A&E Junior High';
  return String(val).trim();
}

function formatScore(score, total) {
  if (score == null || score === '') return '—';
  if (total == null || total === '') return String(score);
  return `${score}/${total}`;
}

function formatScoreCell(score, total) {
  if (score == null || score === '') return '';
  if (total == null || total === '') return String(score);
  return `${score}/${total}`;
}

function formatDateCell(dStr) {
  if (!dStr) return '';
  if (typeof dStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dStr)) {
    const parts = dStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
  }
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return dStr;
  }
}

function formatStrandDisplay(strand, moduleTitle = '') {
  const source = String(strand || moduleTitle || '').trim();
  if (!source) return 'LS1';
  const codeMatch = source.match(/\b(LS\s*[1-6])\b/i);
  if (codeMatch) {
    return codeMatch[1].replace(/\s+/g, '').toUpperCase();
  }
  const lower = source.toLowerCase();
  if (lower.includes('english') || lower.includes('filipino') || lower.includes('communication')) return 'LS1';
  if (lower.includes('scientific') || lower.includes('science') || lower.includes('critical')) return 'LS2';
  if (lower.includes('math') || lower.includes('problem')) return 'LS3';
  if (lower.includes('career') || lower.includes('life')) return 'LS4';
  if (lower.includes('digital') || lower.includes('computer')) return 'LS5';
  if (lower.includes('self') || lower.includes('society') || lower.includes('personal')) return 'LS6';
  return 'LS1';
}

const ROWS_PER_PAGE = 10;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function createBlankRow(key) {
  return {
    rowKey: key,
    isBlank: true,
    isContinuation: false,
    moduleTitle: '',
    strandCode: '',
    dateStarted: '',
    dateFinished: '',
    preTest: '',
    postTest: '',
    otherActivities: '',
    selfAssessment: '',
    isMastered: false,
    isNotMastered: false,
    remarks: '',
  };
}

function splitTextToLines(rawText, maxCharsPerLine = 24) {
  if (rawText == null) return [];
  const str = String(rawText).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!str || str === '—') return [];

  const rawLines = str.split('\n');
  const result = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxCharsPerLine) {
      result.push(trimmed);
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        if (word.length <= maxCharsPerLine) {
          currentLine = word;
        } else {
          let idx = 0;
          while (idx < word.length) {
            const chunk = word.slice(idx, idx + maxCharsPerLine);
            if (chunk.length === maxCharsPerLine && idx + maxCharsPerLine < word.length) {
              result.push(chunk);
            } else {
              currentLine = chunk;
            }
            idx += maxCharsPerLine;
          }
        }
      } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
        currentLine += ' ' + word;
      } else {
        result.push(currentLine);
        if (word.length <= maxCharsPerLine) {
          currentLine = word;
        } else {
          currentLine = '';
          let idx = 0;
          while (idx < word.length) {
            const chunk = word.slice(idx, idx + maxCharsPerLine);
            if (chunk.length === maxCharsPerLine && idx + maxCharsPerLine < word.length) {
              result.push(chunk);
            } else {
              currentLine = chunk;
            }
            idx += maxCharsPerLine;
          }
        }
      }
    }

    if (currentLine) {
      result.push(currentLine);
    }
  }

  return result;
}

function expandRecordToRows(rec, recIdx) {
  const titleLines = splitTextToLines(rec.moduleTitle, 32);
  const activityLines = splitTextToLines(rec.otherActivities, 22);
  const selfLines = splitTextToLines(rec.selfAssessment, 17);
  const remarkLines = splitTextToLines(rec.remarks, 24);

  const totalLines = Math.max(
    1,
    titleLines.length,
    activityLines.length,
    selfLines.length,
    remarkLines.length
  );

  const strandCode = formatStrandDisplay(rec.strandName, rec.moduleTitle);
  const dateStarted = formatDateCell(rec.dateStarted);
  const dateFinished = formatDateCell(rec.dateFinished || rec.dateCompleted);
  const preTest = formatScoreCell(rec.preTestScore, rec.preTestTotal);
  const postTest = formatScoreCell(rec.postTestScore, rec.postTestTotal);
  const mastered = isMastered(rec.assessment || rec.moduleStatus);
  const notMastered = isNotMastered(rec.assessment || rec.moduleStatus);

  const rows = [];
  for (let i = 0; i < totalLines; i++) {
    if (i === 0) {
      rows.push({
        rowKey: `${rec.id || recIdx}-line-0`,
        isBlank: false,
        isContinuation: false,
        moduleTitle: titleLines[0] || '',
        strandCode,
        dateStarted,
        dateFinished,
        preTest,
        postTest,
        otherActivities: activityLines[0] || '',
        selfAssessment: selfLines[0] || '',
        isMastered: mastered,
        isNotMastered: notMastered,
        remarks: remarkLines[0] || '',
      });
    } else {
      rows.push({
        rowKey: `${rec.id || recIdx}-line-${i}`,
        isBlank: false,
        isContinuation: true,
        moduleTitle: titleLines[i] || '',
        strandCode: '',
        dateStarted: '',
        dateFinished: '',
        preTest: '',
        postTest: '',
        otherActivities: activityLines[i] || '',
        selfAssessment: selfLines[i] || '',
        isMastered: false,
        isNotMastered: false,
        remarks: remarkLines[i] || '',
      });
    }
  }
  return rows;
}

function extractRecordMonthInfo(rec) {
  const rawDate = (rec.dateFinished || rec.dateCompleted || rec.dateStarted || '').toString().trim();
  if (rawDate) {
    const isoMatch = rawDate.match(/^(\d{4})-(\d{2})/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const monthIdx = Number(isoMatch[2]) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return {
          monthKey: `${isoMatch[1]}-${isoMatch[2]}`,
          monthLabel: `${MONTH_NAMES[monthIdx]} ${year}`,
        };
      }
    }
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const monthIdx = parsed.getMonth();
      const mm = String(monthIdx + 1).padStart(2, '0');
      return {
        monthKey: `${year}-${mm}`,
        monthLabel: `${MONTH_NAMES[monthIdx]} ${year}`,
      };
    }
  }
  return {
    monthKey: '9999-99',
    monthLabel: 'General Records',
  };
}

const monthlyReportPages = computed(() => {
  if (filteredRecords.value.length === 0) {
    const blankRows = Array.from({ length: ROWS_PER_PAGE }, (_, i) => createBlankRow(`blank-init-${i}`));
    return [
      {
        pageKey: 'blank-template-page-1',
        monthKey: '',
        monthLabel: '',
        pageNumber: 1,
        totalPagesInMonth: 1,
        rows: blankRows,
      },
    ];
  }

  const map = new Map();
  for (const rec of filteredRecords.value) {
    const { monthKey, monthLabel } = extractRecordMonthInfo(rec);
    if (!map.has(monthKey)) {
      map.set(monthKey, { monthKey, monthLabel, records: [] });
    }
    map.get(monthKey).records.push(rec);
  }

  const sortedGroups = Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  const pages = [];

  for (const group of sortedGroups) {
    const sortedRecords = [...group.records].sort((a, b) => {
      const da = (a.dateFinished || a.dateCompleted || a.dateStarted || '').toString();
      const db = (b.dateFinished || b.dateCompleted || b.dateStarted || '').toString();
      return da.localeCompare(db);
    });

    const expandedRows = [];
    sortedRecords.forEach((rec, idx) => {
      expandedRows.push(...expandRecordToRows(rec, `${group.monthKey}-${idx}`));
    });

    const totalPagesInMonth = Math.max(1, Math.ceil(expandedRows.length / ROWS_PER_PAGE));

    for (let p = 0; p < totalPagesInMonth; p++) {
      const slice = expandedRows.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE);
      while (slice.length < ROWS_PER_PAGE) {
        slice.push(createBlankRow(`blank-${group.monthKey}-p${p + 1}-${slice.length}`));
      }

      pages.push({
        pageKey: `${group.monthKey}-page-${p + 1}`,
        monthKey: group.monthKey,
        monthLabel: group.monthLabel,
        pageNumber: p + 1,
        totalPagesInMonth,
        rows: slice,
      });
    }
  }

  return pages;
});

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
  if (tag === 'AE' && (lower.includes('elem') || lower === 'ae')) return true;
  if (tag === 'JHS' && (lower.includes('junior') || lower.includes('jhs') || lower.includes('sec'))) return true;
  if (tag === 'BL' && (lower.includes('basic') || lower === 'bl')) return true;
  if (tag === 'LE' && (lower.includes('lower') || lower === 'le')) return true;
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
      margin: [0, 0, 0, 0],
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.af2-preview-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid var(--color-border);
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-lg);
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

.af2-pages-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.af2-page-unit {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.af2-month-page-bar {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  align-self: flex-start;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 700;
}

.month-bar-sep {
  color: #93c5fd;
  font-weight: 400;
}

.month-bar-page {
  font-weight: 600;
  color: #1d4ed8;
}

.af2-paper-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.25rem;
}

/* Exact A4 Landscape Paper Dimensions: 297mm × 210mm (841.68pt × 595.44pt) */
.af2-report-paper {
  width: 297mm;
  min-width: 297mm;
  min-height: 210mm;
  margin: 0 auto;
  padding: 7.4mm 4.66mm 4.6mm 4.66mm;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 2px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  font-family: Arial, Helvetica, sans-serif;
  color: #000000;
  position: relative;
}

.af2-top-form-code {
  text-align: right;
  padding-right: 8.25mm;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8pt;
  font-weight: 400;
  line-height: 1.1;
  color: #000000;
  margin-bottom: 2pt;
}

.af2-clean-header {
  text-align: center;
  margin: 0 0 13pt 0;
  padding: 0;
}

.af2-main-title {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12pt;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.15;
  color: #000000;
  margin: 0;
  text-transform: uppercase;
  text-align: center;
}

.af2-info-section {
  padding: 0 8.25mm 0 8.04mm;
  margin-bottom: 10pt;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 9.36pt;
  margin-bottom: 10pt;
  flex-wrap: nowrap;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-col {
  display: flex;
  align-items: flex-end;
  gap: 4pt;
}

.info-col-left {
  width: 51.5%;
  flex: 0 0 51.5%;
}

.info-col-right {
  width: 47.2%;
  flex: 0 0 47.2%;
}

.info-label {
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 700;
  color: #000000;
  white-space: nowrap;
  font-size: 12pt;
  line-height: 1.1;
}

.info-underline {
  border-bottom: 0.75pt solid #000000;
  flex: 1;
  padding: 0 4pt 1pt;
  min-height: 14pt;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 400;
  font-size: 11pt;
  line-height: 1.1;
  color: #000000;
  display: inline-flex;
  align-items: flex-end;
  white-space: nowrap;
  overflow: hidden;
}

.level-col {
  display: flex;
  align-items: center;
  gap: 8pt;
}

.level-checkboxes {
  display: inline-flex;
  align-items: center;
  gap: 13pt;
}

.level-box-item {
  display: inline-flex;
  align-items: center;
  gap: 3pt;
}

.level-text {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12pt;
  font-weight: 700;
  color: #000000;
  line-height: 1;
}

.check-square {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13.85pt;
  height: 13.1pt;
  border: 0.75pt solid #000000;
  background: #ffffff;
  border-radius: 0;
  flex-shrink: 0;
  box-sizing: border-box;
}

.check-mark {
  color: #000000;
  font-size: 10pt;
  font-weight: 700;
  line-height: 1;
}

.table-outer-wrapper {
  width: 814.68pt;
  min-width: 814.68pt;
  max-width: 814.68pt;
  margin: 0;
  box-sizing: border-box;
}

.af2-table {
  width: 814.68pt !important;
  min-width: 814.68pt !important;
  max-width: 814.68pt !important;
  border-collapse: collapse;
  table-layout: fixed !important;
  font-family: Arial, Helvetica, sans-serif;
  border: 0.75pt solid #000000;
  background: #ffffff;
  box-sizing: border-box;
}

/* Exact Column Proportions (Total = 814.68pt = 287.40mm = 100.00%) */
.af2-table col.col-module,
.af2-table th.th-module,
.af2-table td.td-module {
  width: 179.23pt !important;
  min-width: 179.23pt !important;
  max-width: 179.23pt !important;
}

.af2-table col.col-strand,
.af2-table th.th-strand,
.af2-table td.td-strand {
  width: 28.51pt !important;
  min-width: 28.51pt !important;
  max-width: 28.51pt !important;
}

.af2-table th.th-date {
  width: 97.76pt !important;
  min-width: 97.76pt !important;
  max-width: 97.76pt !important;
}

.af2-table col.col-date-started,
.af2-table th.th-sub-date-started,
.af2-table td.td-date-started {
  width: 48.88pt !important;
  min-width: 48.88pt !important;
  max-width: 48.88pt !important;
}

.af2-table col.col-date-finished,
.af2-table th.th-sub-date-finished,
.af2-table td.td-date-finished {
  width: 48.88pt !important;
  min-width: 48.88pt !important;
  max-width: 48.88pt !important;
}

.af2-table col.col-pretest,
.af2-table th.th-pretest,
.af2-table td.td-pretest {
  width: 33.40pt !important;
  min-width: 33.40pt !important;
  max-width: 33.40pt !important;
}

.af2-table col.col-posttest,
.af2-table th.th-posttest,
.af2-table td.td-posttest {
  width: 33.40pt !important;
  min-width: 33.40pt !important;
  max-width: 33.40pt !important;
}

.af2-table col.col-activities,
.af2-table th.th-activities,
.af2-table td.td-activities {
  width: 127.09pt !important;
  min-width: 127.09pt !important;
  max-width: 127.09pt !important;
}

.af2-table col.col-self,
.af2-table th.th-self,
.af2-table td.td-self {
  width: 97.76pt !important;
  min-width: 97.76pt !important;
  max-width: 97.76pt !important;
}

.af2-table th.th-teacher-assessment {
  width: 79.02pt !important;
  min-width: 79.02pt !important;
  max-width: 79.02pt !important;
}

.af2-table col.col-mastered,
.af2-table th.th-sub-mastered,
.af2-table td.td-mastered {
  width: 39.51pt !important;
  min-width: 39.51pt !important;
  max-width: 39.51pt !important;
}

.af2-table col.col-not-mastered,
.af2-table th.th-sub-not-mastered,
.af2-table td.td-not-mastered {
  width: 39.51pt !important;
  min-width: 39.51pt !important;
  max-width: 39.51pt !important;
}

.af2-table col.col-remarks,
.af2-table th.th-remarks,
.af2-table td.td-remarks {
  width: 138.51pt !important;
  min-width: 138.51pt !important;
  max-width: 138.51pt !important;
}

.af2-table th,
.af2-table td {
  border: 0.75pt solid #000000;
  vertical-align: middle;
  color: #000000;
  box-sizing: border-box;
}

.af2-table thead .thead-row-1 th {
  height: 74.78pt;
  padding: 2pt 1.5pt;
  background: #ffffff;
  text-align: center;
  vertical-align: middle;
}

.af2-table thead .thead-row-1 th.th-strand,
.af2-table thead .thead-row-1 th.th-score {
  padding: 1.5pt 1pt;
}

.af2-table thead .thead-row-2 th {
  height: 25.32pt;
  padding: 1pt 1pt;
  background: #ffffff;
  text-align: center;
  vertical-align: middle;
}

.th-en-11 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  font-weight: 700;
  line-height: 1.12;
  color: #000000;
}

.th-tl-10 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10pt;
  font-weight: 400;
  font-style: italic;
  line-height: 1.12;
  color: #000000;
  margin-top: 1pt;
}

.th-en-10 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10pt;
  font-weight: 700;
  line-height: 1.08;
  color: #000000;
}

.th-en-95 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9.5pt;
  font-weight: 700;
  line-height: 1.06;
  color: #000000;
}

.th-en-8 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8pt;
  font-weight: 700;
  line-height: 1.05;
  color: #000000;
}

.th-en-7 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 7pt;
  font-weight: 700;
  line-height: 1.1;
  color: #000000;
}

.th-en-65 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 6.5pt;
  font-weight: 700;
  line-height: 1.08;
  color: #000000;
}

.th-tl-6 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 6pt;
  font-weight: 400;
  font-style: italic;
  line-height: 1.05;
  color: #000000;
  margin-top: 1pt;
}

.th-tl-55 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 5.5pt;
  font-weight: 400;
  font-style: italic;
  line-height: 1.05;
  color: #000000;
  margin-top: 1pt;
}

.th-tl-6-bold {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 6pt;
  font-weight: 700;
  font-style: italic;
  line-height: 1.05;
  color: #000000;
  margin-top: 1pt;
}

.record-row,
.blank-row {
  height: 23.04pt !important;
  min-height: 23.04pt !important;
  max-height: 23.04pt !important;
}

.af2-table tbody .record-row td,
.af2-table tbody .blank-row td {
  height: 23.04pt !important;
  min-height: 23.04pt !important;
  max-height: 23.04pt !important;
  padding: 0 3pt;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9pt;
  font-weight: 400;
  color: #000000;
  overflow: hidden;
  vertical-align: middle;
}

.af2-table tbody .record-row td.td-strand,
.af2-table tbody .blank-row td.td-strand,
.af2-table tbody .record-row td.td-score,
.af2-table tbody .blank-row td.td-score {
  padding: 0 1pt !important;
  font-size: 9pt;
  text-align: center;
}

.af2-table tbody .record-row td.td-date,
.af2-table tbody .blank-row td.td-date {
  padding: 0 1pt !important;
  font-size: 8.5pt;
  text-align: center;
  white-space: nowrap;
}

.af2-table tbody .record-row td.td-check,
.af2-table tbody .blank-row td.td-check {
  padding: 0 !important;
  text-align: center;
}

.cell-center {
  text-align: center;
}

.cell-left {
  text-align: left;
}

.cell-single-line {
  display: block;
  width: 100%;
  height: 21pt;
  line-height: 21pt;
  white-space: nowrap;
  overflow: hidden;
}

.af2-check-mark {
  font-size: 10pt;
  font-weight: 700;
  color: #000000;
  display: inline-block;
  line-height: 1;
}

.af2-signatures-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 16pt;
  padding: 0 42mm 0 30.4mm;
}

.signature-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 233.55pt;
}

.sig-name-slot {
  width: 100%;
  min-height: 16pt;
  border-bottom: 0.75pt solid #000000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1pt;
}

.sig-printed-name {
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 700;
  font-size: 10pt;
  text-transform: uppercase;
  color: #000000;
  text-align: center;
  line-height: 1.1;
}

.sig-caption {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12pt;
  font-style: italic;
  font-weight: 400;
  color: #000000;
  text-align: center;
  margin-top: 2pt;
  margin-bottom: 11pt;
  white-space: nowrap;
}

.sig-date-row {
  display: flex;
  align-items: flex-end;
  width: 100%;
  gap: 4pt;
}

.sig-date-label {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12pt;
  font-weight: 400;
  color: #000000;
  white-space: nowrap;
  line-height: 1;
}

.sig-date-line {
  flex: 1;
  border-bottom: 0.75pt solid #000000;
  height: 11pt;
}

.af2-bottom-revision {
  text-align: right;
  padding-right: 13.5mm;
  margin-top: 3pt;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8pt;
  font-weight: 400;
  line-height: 1;
  color: #000000;
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
  @page {
    size: A4 landscape;
    margin: 0;
  }

  .print-hidden,
  .no-print,
  .sidebar,
  .topbar,
  .portal-footer,
  .af2-preview-banner,
  .af2-month-page-bar {
    display: none !important;
  }

  body, html {
    background: #ffffff !important;
    color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .main-wrapper,
  .main-content,
  .af2-summary-view,
  .af2-preview-wrapper,
  .af2-pages-container {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    gap: 0 !important;
  }

  .af2-page-unit {
    margin: 0 !important;
    padding: 0 !important;
    gap: 0 !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .af2-page-unit.has-page-break {
    page-break-after: always !important;
    break-after: page !important;
  }

  .af2-paper-scroll-wrapper {
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .af2-report-paper {
    border: none !important;
    box-shadow: none !important;
    width: 297mm !important;
    min-width: 297mm !important;
    height: 210mm !important;
    min-height: 210mm !important;
    max-height: 210mm !important;
    padding: 7.4mm 4.66mm 4.6mm 4.66mm !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  .table-outer-wrapper {
    width: 814.68pt !important;
    min-width: 814.68pt !important;
    max-width: 814.68pt !important;
    overflow: visible !important;
    margin: 0 !important;
  }

  .af2-table {
    width: 814.68pt !important;
    min-width: 814.68pt !important;
    max-width: 814.68pt !important;
    table-layout: fixed !important;
    border: 0.75pt solid #000000 !important;
    page-break-inside: avoid !important;
  }

  .af2-table tr {
    page-break-inside: avoid !important;
  }

  .af2-table th,
  .af2-table td {
    border: 0.75pt solid #000000 !important;
    color: #000000 !important;
  }
}
</style>

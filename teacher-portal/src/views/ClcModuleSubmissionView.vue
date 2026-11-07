<template>
  <div class="module-submission-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb-nav">
      <router-link to="/dashboard/clc" class="crumb-link">Learning Centers</router-link>
      <span class="crumb-sep">&gt;</span>
      <router-link :to="`/dashboard/clc/${clcSlug}`" class="crumb-link">{{ clcName }}</router-link>
      <span class="crumb-sep">&gt;</span>
      <span class="crumb-active">{{ moduleInfo.title }}</span>
    </nav>

    <!-- Header Card (Full Width, Clean Card) -->
    <div class="module-header-card">
      <div class="module-header-left">
        <div class="module-icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="module-header-info">
          <h1 class="module-header-title">{{ moduleInfo.title }}</h1>
          <p class="module-header-subtitle">{{ moduleInfo.strandName || moduleInfo.strand }} &bull; {{ moduleInfo.level }}</p>
        </div>
      </div>

      <div class="module-header-right">
        <button type="button" class="btn-view-module" @click="showFilePreview = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          <span>View Module</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs: [ Instructions ] [ Learner Submissions ] -->
    <div class="submission-tabs-row">
      <button
        type="button"
        class="submission-tab-btn"
        :class="{ active: currentTab === 'instructions' }"
        @click="currentTab = 'instructions'"
      >
        Instructions
      </button>
      <button
        type="button"
        class="submission-tab-btn"
        :class="{ active: currentTab === 'submissions' }"
        @click="currentTab = 'submissions'"
      >
        Learner Submissions
      </button>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 1: INSTRUCTIONS                                          -->
    <!-- ============================================================ -->
    <div v-if="currentTab === 'instructions'" class="instructions-card">
      <div class="card-section">
        <h3 class="section-title">Module Overview</h3>
        <p class="section-text">{{ moduleInfo.description || 'This module covers essential competencies for alternative learning learners in basic communication, listening, and expression.' }}</p>
      </div>

      <div class="card-section">
        <h3 class="section-title">Instructions &amp; Facilitator Notes</h3>
        <div class="instruction-box">
          <p>1. Ensure all learners take the diagnostic <strong>Pre-Test</strong> before accessing lesson exercises.</p>
          <p>2. Learners must complete the activity sheets and submit clear photocopies or digital photos of their hand-written outputs.</p>
          <p>3. Review submitted activity outputs in the <strong>Learner Submissions</strong> tab and provide constructive feedback.</p>
          <p>4. Learners must achieve at least 75% on the <strong>Post-Test</strong> to achieve module mastery.</p>
        </div>
      </div>

      <div class="card-section">
        <h3 class="section-title">Attached Material</h3>
        <div class="attached-file-pill">
          <div class="file-pill-icon">PDF</div>
          <div class="file-pill-meta">
            <span class="file-pill-name">{{ moduleInfo.fileName || 'LS1_Communication_Skills_Module_1.pdf' }}</span>
            <span class="file-pill-size">{{ moduleInfo.fileSize || '3.4 MB' }} &bull; Ready for instructional use</span>
          </div>
          <button type="button" class="btn-download-preview" @click="showFilePreview = true">
            Preview File
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 2: LEARNER SUBMISSIONS                                   -->
    <!-- Columns: # | Learner Name | LRN | Submission Status | Date Submitted | Action -->
    <!-- Action: View                                                 -->
    <!-- ============================================================ -->
    <div v-else-if="currentTab === 'submissions'" class="submissions-table-card">
      <div class="submissions-header-bar">
        <div class="submissions-title-block">
          <h2 class="sub-card-title">Learner Submissions</h2>
          <p class="sub-card-desc">Review submitted portfolio outputs and provide facilitator feedback.</p>
        </div>

        <div class="search-box-wrapper">
          <span class="search-lens-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search learner name or LRN..."
            class="search-text-input"
          />
        </div>
      </div>

      <div class="table-container">
        <table class="submissions-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Learner Name</th>
              <th>LRN</th>
              <th>Submission Status</th>
              <th>Date Submitted</th>
              <th style="text-align: right; width: 100px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in paginatedSubmissions" :key="item.id">
              <td class="col-num">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td class="col-name">{{ item.learnerName }}</td>
              <td class="col-lrn">{{ item.lrn }}</td>
              <td>
                <span class="status-pill" :class="statusPillClass(item.status)">
                  <span class="status-dot"></span>
                  <span>{{ item.status }}</span>
                </span>
              </td>
              <td class="col-date">{{ item.dateSubmitted || '—' }}</td>
              <td style="text-align: right;">
                <!-- ONLY View ACTION -->
                <button
                  type="button"
                  class="btn-action-view"
                  title="View"
                  aria-label="View Submission"
                  @click="openSubmissionModal(item)"
                >
                  View
                </button>
              </td>
            </tr>

            <tr v-if="filteredSubmissions.length === 0">
              <td colspan="6" class="no-submissions-msg">
                No learners found matching your search.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="submissions-foot-bar">
        <div class="pagination-nav">
          <button
            type="button"
            class="page-nav-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            &lt;
          </button>
          <span class="page-current-pill">{{ currentPage }}</span>
          <button
            type="button"
            class="page-nav-btn"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            &gt;
          </button>
        </div>

        <span class="showing-records-text">
          Showing {{ filteredSubmissions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0 }}-{{ Math.min(currentPage * pageSize, filteredSubmissions.length) }} of {{ filteredSubmissions.length }} learners
        </span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- VIEW SUBMISSION MODAL                                        -->
    <!-- Displays: Learner Name, Uploaded image/file output,          -->
    <!--           Submission date, Teacher feedback, Save button     -->
    <!-- ============================================================ -->
    <div v-if="activeSubmission" class="modal-backdrop" @click.self="activeSubmission = null">
      <div class="submission-modal-box">
        <div class="modal-head">
          <div>
            <h2 class="modal-h2">Submission Details</h2>
            <p class="modal-p">{{ moduleInfo.title }}</p>
          </div>
          <button type="button" class="close-x" @click="activeSubmission = null">&times;</button>
        </div>

        <div class="modal-body-content">
          <div class="meta-two-col">
            <div>
              <span class="meta-prop">Learner Name</span>
              <strong class="meta-val">{{ activeSubmission.learnerName }}</strong>
            </div>
            <div>
              <span class="meta-prop">LRN</span>
              <span class="meta-val">{{ activeSubmission.lrn }}</span>
            </div>
            <div>
              <span class="meta-prop">Submission Date</span>
              <span class="meta-val">{{ activeSubmission.dateSubmitted || 'Not Submitted Yet' }}</span>
            </div>
            <div>
              <span class="meta-prop">Submission Status</span>
              <span class="status-pill" :class="statusPillClass(activeSubmission.status)">
                <span class="status-dot"></span>
                <span>{{ activeSubmission.status }}</span>
              </span>
            </div>
          </div>

          <!-- Uploaded output image / file -->
          <div class="output-preview-section">
            <label class="section-field-lbl">Uploaded Image / File Output</label>
            <div v-if="activeSubmission.status === 'Submitted'" class="output-file-card">
              <div class="file-img-container">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div class="output-file-info">
                <span class="output-file-name">{{ activeSubmission.fileName || `${activeSubmission.learnerName.replace(/\s+/g, '_')}_Output.jpg` }}</span>
                <span class="output-file-size">2.1 MB &bull; High-resolution photo submitted</span>
              </div>
              <button type="button" class="btn-open-preview" @click="alertFileOpen">
                Preview
              </button>
            </div>
            <div v-else class="empty-submission-placeholder">
              <span>No output file uploaded by learner yet.</span>
            </div>
          </div>

          <!-- Teacher Feedback -->
          <div class="feedback-input-section">
            <label class="section-field-lbl">Teacher Feedback</label>
            <textarea
              v-model="activeSubmission.feedback"
              rows="4"
              class="feedback-textarea"
              placeholder="Enter constructive feedback, commendations, or specific guidance for the learner..."
            ></textarea>
          </div>
        </div>

        <div class="modal-foot-actions">
          <button type="button" class="btn-dismiss" @click="activeSubmission = null">Close</button>
          <button type="button" class="btn-save-feedback" @click="saveFeedback">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Save Feedback</span>
          </button>
        </div>
      </div>
    </div>

    <!-- File Viewer Modal -->
    <div v-if="showFilePreview" class="modal-backdrop" @click.self="showFilePreview = false">
      <div class="file-viewer-modal">
        <div class="viewer-head">
          <h3 class="viewer-title">{{ moduleInfo.title }} (Preview)</h3>
          <button type="button" class="close-x" @click="showFilePreview = false">&times;</button>
        </div>
        <div class="viewer-body">
          <div class="mock-doc-page">
            <div class="doc-header-seal">
              <strong>Department of Education &bull; Alternative Learning System (ALS)</strong>
              <h4>{{ moduleInfo.title }}</h4>
              <p>{{ moduleInfo.strandName || moduleInfo.strand }} &bull; {{ moduleInfo.level }}</p>
            </div>
            <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p><strong>Lesson 1: Developing Clear &amp; Purposeful Expression</strong></p>
            <p>Communication is the exchange of ideas, thoughts, and emotions through speech, written text, or non-verbal signals. In daily life, clear communication avoids conflict and promotes mutual understanding.</p>
            <div class="mock-activity-box">
              <strong>Activity 1.1: Reflective Dialogue</strong>
              <p>Write a brief paragraph describing how you handled a misunderstanding in your community or workplace.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { useClcData } from '../composables/useClcData.js';

const route = useRoute();
const { assignedCenters } = useTeacherSession();

const clcSlug = computed(() => route.params.clcId || 'poblacion-clc');
const clcName = computed(() => {
  const found = assignedCenters.value.find((c) => c.slug === clcSlug.value);
  return found?.name || 'Poblacion CLC';
});

const { getModuleById, addRecord, updateRecord, records } = useClcData(clcSlug);

const currentTab = ref('instructions');
const searchQuery = ref('');
const showFilePreview = ref(false);

const moduleInfo = ref({
  id: route.params.moduleId || '1',
  title: 'Communication Skills Module 1',
  strand: '1. Communication Skills (English)',
  strandName: 'Communication Skills (English)',
  level: 'A&E Elementary',
  fileName: 'LS1_Oral_Communication_Module_1.pdf',
  fileSize: '3.4 MB',
  description: 'Develops literacy and effective communication in English through real-life community discourse.',
});

onMounted(() => {
  const foundModule = getModuleById(route.params.moduleId);
  if (foundModule) {
    moduleInfo.value = {
      ...moduleInfo.value,
      ...foundModule,
    };
  }
});

// Learners submissions list
const submissionsList = ref([
  {
    id: 1,
    learnerName: 'Leslyn Jaudian',
    lrn: '123456789012',
    status: 'Submitted',
    dateSubmitted: 'September 20, 2026',
    fileName: 'Leslyn_Jaudian_LS1_Activity1.jpg',
    feedback: 'Excellent work on the sentence construction! Keep practicing the formal greeting patterns.',
  },
  {
    id: 2,
    learnerName: 'Juan Dela Cruz',
    lrn: '987654321098',
    status: 'Submitted',
    dateSubmitted: 'September 19, 2026',
    fileName: 'Juan_Dela_Cruz_Activity_Sheet.png',
    feedback: 'Well articulated answers. Good attention to punctuation.',
  },
  {
    id: 3,
    learnerName: 'Ana Reyes',
    lrn: '112233445566',
    status: 'Pending',
    dateSubmitted: '',
    fileName: '',
    feedback: '',
  },
  {
    id: 4,
    learnerName: 'Mark Angelo Lim',
    lrn: '665544332211',
    status: 'Not Submitted',
    dateSubmitted: '',
    fileName: '',
    feedback: '',
  },
]);

const currentPage = ref(1);
const pageSize = 10;

const filteredSubmissions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return submissionsList.value;
  return submissionsList.value.filter(
    (s) =>
      s.learnerName.toLowerCase().includes(q) ||
      s.lrn.toLowerCase().includes(q)
  );
});

const totalPages = computed(() => {
  return Math.ceil(filteredSubmissions.value.length / pageSize) || 1;
});

const paginatedSubmissions = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredSubmissions.value.slice(start, start + pageSize);
});

function statusPillClass(status) {
  if (status === 'Submitted') return 'status-submitted';
  if (status === 'Pending') return 'status-pending';
  return 'status-not-submitted';
}

const activeSubmission = ref(null);

function openSubmissionModal(item) {
  activeSubmission.value = JSON.parse(JSON.stringify(item));
}

function saveFeedback() {
  if (!activeSubmission.value) return;

  const target = submissionsList.value.find((s) => s.id === activeSubmission.value.id);
  if (target) {
    target.feedback = activeSubmission.value.feedback;
  }

  // Also sync with CLC Records
  const existingRecord = records.value.find(
    (r) => r.lrn === activeSubmission.value.lrn && r.moduleTitle === moduleInfo.value.title
  );

  if (existingRecord) {
    updateRecord(existingRecord.id, {
      remarks: activeSubmission.value.feedback,
      uploadedOutputs: activeSubmission.value.fileName || 'Activity_Output.jpg',
    });
  } else {
    // Add completed assessment record with number values (e.g. 8/10, 10/10)
    addRecord({
      learnerName: activeSubmission.value.learnerName,
      lrn: activeSubmission.value.lrn,
      centerName: clcName.value,
      moduleTitle: moduleInfo.value.title,
      strandName: moduleInfo.value.strandName || 'Communication Skills (English)',
      level: moduleInfo.value.level || 'A&E Elementary',
      preTestScore: 8,
      preTestTotal: 10,
      postTestScore: 10,
      postTestTotal: 10,
      moduleStatus: 'Mastered',
      dateCompleted: activeSubmission.value.dateSubmitted || 'September 20, 2026',
      uploadedOutputs: activeSubmission.value.fileName || 'Activity_Output.jpg',
      remarks: activeSubmission.value.feedback,
    });
  }

  alert('Feedback saved successfully!');
  activeSubmission.value = null;
}

function alertFileOpen() {
  alert('Opening uploaded activity worksheet image preview.');
}
</script>

<style scoped>
/* Full Width Workspace Layout */
.module-submission-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0 0 3rem;
}

/* Breadcrumb */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 1.25rem;
}

.crumb-link {
  color: #2563eb;
  text-decoration: none;
}

.crumb-link:hover {
  text-decoration: underline;
}

.crumb-sep {
  color: #94a3b8;
}

.crumb-active {
  color: #1e293b;
  font-weight: 600;
}

/* Header Card */
.module-header-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.5rem 1.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 1.5rem;
}

.module-header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.module-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background-color: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-header-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
}

.module-header-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.btn-view-module {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-view-module:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

/* Tabs */
.submission-tabs-row {
  display: flex;
  align-items: center;
  gap: 2rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
  padding-left: 0.25rem;
}

.submission-tab-btn {
  background: transparent;
  border: none;
  padding: 0.75rem 0.5rem 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  position: relative;
  transition: color 0.15s ease;
}

.submission-tab-btn:hover {
  color: #1e293b;
}

.submission-tab-btn.active {
  color: #2563eb;
  font-weight: 700;
}

.submission-tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: #2563eb;
  border-radius: 3px 3px 0 0;
}

/* Instructions Card */
.instructions-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.75rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.card-section {
  margin-bottom: 1.75rem;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.65rem 0;
}

.section-text {
  font-size: 0.92rem;
  color: #475569;
  line-height: 1.6;
}

.instruction-box {
  background: #f8fafc;
  border-left: 4px solid #2563eb;
  padding: 1rem 1.25rem;
  border-radius: 0 8px 8px 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.instruction-box p {
  font-size: 0.9rem;
  color: #334155;
  margin: 0;
}

.attached-file-pill {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1.25rem;
}

.file-pill-icon {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 800;
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  font-size: 0.82rem;
}

.file-pill-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-pill-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9rem;
}

.file-pill-size {
  font-size: 0.78rem;
  color: #64748b;
}

.btn-download-preview {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
}

.btn-download-preview:hover {
  background: #eff6ff;
  border-color: #2563eb;
}

/* Submissions Table Card */
.submissions-table-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.submissions-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.35rem 1.75rem;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 1rem;
}

.sub-card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.2rem 0;
}

.sub-card-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.search-box-wrapper {
  position: relative;
  width: 260px;
}

.search-lens-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  display: flex;
}

.search-text-input {
  width: 100%;
  padding: 0.45rem 0.75rem 0.45rem 2.2rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
}

.search-text-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.table-container {
  overflow-x: auto;
}

.submissions-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.submissions-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.submissions-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.88rem;
  color: #334155;
  vertical-align: middle;
}

.col-num {
  color: #94a3b8;
  font-weight: 400;
}

.col-name {
  font-weight: 600;
  color: #0f172a;
}

.col-lrn {
  font-family: monospace;
  color: #64748b;
}

.col-date {
  color: #64748b;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-submitted {
  background: #f0fdf4;
  color: #16a34a;
}
.status-submitted .status-dot {
  background: #22c55e;
}

.status-pending {
  background: #fffbeb;
  color: #d97706;
}
.status-pending .status-dot {
  background: #f59e0b;
}

.status-not-submitted {
  background: #f1f5f9;
  color: #64748b;
}
.status-not-submitted .status-dot {
  background: #94a3b8;
}

.btn-action-view {
  background: var(--action-view-bg, #EFF6FF);
  border: 1px solid var(--action-view-border, #DCE7F6);
  color: var(--action-view-color, #4169A8);
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action-view:hover {
  background: var(--action-view-hover-bg, #E0EEFE);
  border-color: var(--action-view-hover-border, #B9D3F4);
  color: var(--action-view-hover-color, #315488);
}

.btn-action-view:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8);
  outline-offset: 1px;
  box-shadow: 0 0 0 3px var(--action-view-focus-ring, rgba(65, 105, 168, 0.35));
}

.no-submissions-msg {
  text-align: center;
  padding: 2.5rem !important;
  color: #94a3b8;
}

.submissions-foot-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.pagination-nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.page-nav-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
}

.page-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-current-pill {
  padding: 0.3rem 0.65rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #2563eb;
}

.showing-records-text {
  font-size: 0.82rem;
  color: #64748b;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1rem;
}

.submission-modal-box {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.35rem 1.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.modal-h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal-p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.2rem 0 0;
}

.close-x {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body-content {
  padding: 1.5rem 1.75rem;
}

.meta-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  background: #f8fafc;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  margin-bottom: 1.35rem;
}

.meta-prop {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.meta-val {
  font-size: 0.92rem;
  color: #0f172a;
}

.output-preview-section {
  margin-bottom: 1.35rem;
}

.section-field-lbl {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.45rem;
}

.output-file-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1.15rem;
}

.file-img-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.output-file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.output-file-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.output-file-size {
  font-size: 0.78rem;
  color: #64748b;
}

.btn-open-preview {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #2563eb;
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.empty-submission-placeholder {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 1.25rem;
  text-align: center;
  border-radius: 10px;
  color: #94a3b8;
  font-size: 0.88rem;
}

.feedback-input-section {
  margin-bottom: 0.5rem;
}

.feedback-textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
}

.feedback-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.modal-foot-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.75rem 1.35rem;
  border-top: 1px solid #f1f5f9;
}

.btn-dismiss {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-save-feedback {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-save-feedback:hover {
  background: #1d4ed8;
}

/* File Viewer Modal */
.file-viewer-modal {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 650px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.viewer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.viewer-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.viewer-body {
  padding: 1.75rem;
  max-height: 70vh;
  overflow-y: auto;
}

.mock-doc-page {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
}

.doc-header-seal {
  text-align: center;
}

.doc-header-seal strong {
  font-size: 0.85rem;
  color: #475569;
}

.doc-header-seal h4 {
  font-size: 1.3rem;
  color: #0f172a;
  margin: 0.5rem 0 0.2rem;
}

.doc-header-seal p {
  color: #64748b;
  font-size: 0.85rem;
}

.mock-activity-box {
  background: #eff6ff;
  border-left: 3.5px solid #2563eb;
  padding: 1rem 1.25rem;
  border-radius: 0 8px 8px 0;
  margin-top: 1.5rem;
}
</style>

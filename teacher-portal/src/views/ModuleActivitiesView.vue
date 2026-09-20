<template>
  <div class="page-container">
    <!-- Breadcrumb / Back Link -->
    <nav class="breadcrumb">
      <router-link to="/modules" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Back to Modules</span>
      </router-link>
    </nav>

    <!-- Page Header Row -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>{{ moduleData.title }}</h1>
        <p>Learning Area: {{ moduleData.learningArea }} | {{ moduleData.learningCenter }}</p>
      </div>
      <button class="btn btn-outline" @click="showReaderModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
        <span>View Module</span>
      </button>
    </div>

    <!-- Subtabs -->
    <div class="tab-row-with-action">
      <div class="tab-group-inline">
        <button
          v-for="tab in tabs"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <router-link
        v-if="activeTab === 'Activities / Assessments'"
        :to="`/modules/${moduleId}/activities/create`"
        class="btn btn-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>+ Add Activity</span>
      </router-link>
    </div>

    <!-- Tab 2: Activities / Assessments Table -->
    <div v-if="activeTab === 'Activities / Assessments'" class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Activity Title</th>
              <th>Type</th>
              <th>Page</th>
              <th>Items</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(act, idx) in activities" :key="act.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 600;">
                <router-link :to="`/modules/${moduleId}/activities/create?id=${act.id}`" style="color: var(--color-primary);">
                  {{ act.title }}
                </router-link>
              </td>
              <td>{{ act.type }}</td>
              <td>{{ act.page }}</td>
              <td>{{ act.items }}</td>
              <td>
                <span class="badge badge-success">{{ act.status }}</span>
              </td>
              <td>
                <div class="cell-actions" style="justify-content: flex-end;">
                  <router-link
                    :to="`/modules/${moduleId}/activities/create?id=${act.id}`"
                    class="btn-icon"
                    title="Edit Activity"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </router-link>
                  <button class="btn-icon" title="Delete Activity" @click="deleteActivity(act.id, act.title)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="activities.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <h3>No activities created yet</h3>
        <p>Click "+ Add Activity" above to create an activity or answer sheet for this module.</p>
      </div>
    </div>

    <!-- Tab 1: Module Details -->
    <div v-else-if="activeTab === 'Module Details'" class="details-grid-2">
      <div class="detail-item">
        <span class="detail-label">Module Title</span>
        <span class="detail-value">{{ moduleData.title }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Learning Area</span>
        <span class="detail-value">{{ moduleData.learningArea }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Assigned CLC</span>
        <span class="detail-value">{{ moduleData.learningCenter }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">PDF Filename</span>
        <span class="detail-value">Communication_Skills_Module_1.pdf (5.2 MB)</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Total Activities</span>
        <span class="detail-value">{{ activities.length }} Activities Configured</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Status</span>
        <span class="detail-value"><span class="badge badge-success">Published</span></span>
      </div>
    </div>

    <!-- Tab 3: Assigned Learners -->
    <div v-else-if="activeTab === 'Assigned Learners'" class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Learner Name</th>
              <th>Level</th>
              <th>Module Progress</th>
              <th>Score Avg</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(l, idx) in assignedLearners" :key="l.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 600;">{{ l.name }}</td>
              <td>{{ l.level }}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <div class="progress-bar-mini">
                    <div class="progress-fill" :style="{ width: l.progress + '%' }"></div>
                  </div>
                  <span style="font-size: 0.8rem; font-weight: 600;">{{ l.progress }}%</span>
                </div>
              </td>
              <td><strong>{{ l.score }}</strong></td>
              <td>
                <router-link :to="`/learners/${l.id}`" class="btn-outline" style="padding: 0.25rem 0.65rem; font-size: 0.775rem;">
                  View Progress
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Interactive Learner View / Module Reader Modal (Bottom-Center Screenshot) -->
    <div v-if="showReaderModal" class="reader-modal-overlay" @click.self="showReaderModal = false">
      <div class="reader-modal-box">
        <!-- Reader Top Toolbar -->
        <div class="reader-toolbar">
          <div class="reader-toolbar-left">
            <button class="reader-tool-btn" @click="showReaderModal = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              <span>Back to Modules</span>
            </button>
            <div class="reader-module-title">
              <strong>Communication Skills Module 1</strong>
              <span>Reading & Understanding Texts</span>
            </div>
          </div>

          <div class="reader-toolbar-tools">
            <button class="reader-tool-btn" title="Notebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span>Notebook</span>
            </button>

            <!-- Highlighted Answer Sheet Button -->
            <button class="reader-tool-btn active-tool-highlight" @click="showAnswerSheetModal = true" title="Open Answer Sheet">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span>Answer Sheet</span>
            </button>

            <button class="reader-tool-btn" title="Dictionary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Dictionary</span>
            </button>

            <button class="reader-tool-btn" title="Notes">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Notes</span>
            </button>

            <button class="reader-tool-btn" title="Download">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Download</span>
            </button>
          </div>
        </div>

        <!-- Reader Document View Body -->
        <div class="reader-doc-body">
          <div class="reader-sidebar-thumbs">
            <div class="thumb-page active">Page 1</div>
            <div class="thumb-page">Page 2</div>
            <div class="thumb-page">Page 3</div>
            <div class="thumb-page">Page 4</div>
            <div class="thumb-page">Page 5</div>
          </div>
          <div class="reader-main-canvas">
            <div class="page-sheet-preview">
              <div class="page-sheet-header">
                <span class="sheet-badge">Module 1</span>
                <h2>Reading and Understanding Texts</h2>
              </div>
              <p class="sheet-content">
                Reading is the process of looking at a series of written symbols and getting meaning from them. When we read, we use our eyes to receive written symbols (letters, punctuation marks and spaces) and we use our brain to convert them into words, sentences and paragraphs that communicate something to us.
              </p>
              <div class="sheet-illustration-placeholder">
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" color="#3b82f6">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <span>Interactive Learning Content Preview</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Answer Sheet Modal -->
    <div v-if="showAnswerSheetModal" class="modal-overlay" @click.self="showAnswerSheetModal = false">
      <div class="modal" style="max-width: 650px;">
        <div class="modal-header">
          <h2>Module 1 Answer Sheet Preview</h2>
          <button class="modal-close" @click="showAnswerSheetModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.25rem;">
            This is how learners view and answer the activities created for this module.
          </p>

          <div v-for="(act, idx) in activities" :key="act.id" class="answer-sheet-act-block">
            <div class="act-block-head">
              <span class="badge badge-info">Activity {{ idx + 1 }}</span>
              <h4>{{ act.title }} ({{ act.type }})</h4>
              <span style="font-size: 0.775rem; color: #94a3b8; margin-left: auto;">Page {{ act.page }}</span>
            </div>

            <div class="act-block-question">
              <strong>Q1: What is the main idea of the passage?</strong>
              <div class="options-radio-preview">
                <label><input type="radio" name="preview_q1" /> A. Reading</label>
                <label><input type="radio" name="preview_q1" /> B. Understanding information (Correct Answer)</label>
                <label><input type="radio" name="preview_q1" /> C. Writing</label>
                <label><input type="radio" name="preview_q1" /> D. Speaking</label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showAnswerSheetModal = false">Close Answer Sheet</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const moduleId = route.params.id || 1;

const tabs = ['Module Details', 'Activities / Assessments', 'Assigned Learners'];
const activeTab = ref('Activities / Assessments');

const showReaderModal = ref(false);
const showAnswerSheetModal = ref(false);

const moduleData = reactive({
  id: 1,
  title: 'Communication Skills Module 1',
  learningArea: 'Communication Skills',
  learningCenter: 'Poblacion CLC',
});

const activities = ref([
  { id: 1, title: 'Vocabulary Practice', type: 'Identification', page: 3, items: 5, status: 'Published' },
  { id: 2, title: 'Reading Comprehension', type: 'Multiple Choice', page: 5, items: 10, status: 'Published' },
  { id: 3, title: 'Reflection Journal', type: 'Essay', page: 8, items: 1, status: 'Published' },
  { id: 4, title: 'Module Quiz', type: 'Multiple Choice', page: 10, items: 20, status: 'Published' },
]);

const assignedLearners = ref([
  { id: 1, name: 'Ana Mae B. Dela Cruz', level: 'A&E Elementary', progress: 100, score: '95%' },
  { id: 2, name: 'John Rey L. Abad', level: 'A&E Junior', progress: 75, score: '88%' },
  { id: 3, name: 'Maria Fe S. Ignacio', level: 'A&E Elementary', progress: 50, score: '82%' },
  { id: 6, name: 'Juan Dela Cruz', level: 'A&E Elementary', progress: 85, score: '90%' },
]);

function deleteActivity(id, title) {
  if (confirm(`Are you sure you want to delete "${title}"?`)) {
    activities.value = activities.value.filter((a) => a.id !== id);
  }
}
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.progress-bar-mini {
  width: 100px;
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

/* Reader Modal */
.reader-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 30, 54, 0.85);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.reader-modal-box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0f172a;
  color: #ffffff;
}

.reader-toolbar {
  height: 56px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
}

.reader-toolbar-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.reader-tool-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.reader-tool-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.active-tool-highlight {
  background: rgba(59, 130, 246, 0.15);
  border: 1.5px solid #3b82f6;
  color: #60a5fa;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
}

.reader-module-title strong {
  display: block;
  font-size: 0.875rem;
  color: #ffffff;
}

.reader-module-title span {
  font-size: 0.75rem;
  color: #94a3b8;
}

.reader-toolbar-tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reader-doc-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #0f172a;
}

.reader-sidebar-thumbs {
  width: 140px;
  background: #1e293b;
  border-right: 1px solid #334155;
  padding: 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
}

.thumb-page {
  height: 90px;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #94a3b8;
  cursor: pointer;
}

.thumb-page.active {
  border-color: #3b82f6;
  background: #1e3a8a;
  color: #ffffff;
  font-weight: 700;
}

.reader-main-canvas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
}

.page-sheet-preview {
  width: 100%;
  max-width: 650px;
  min-height: 520px;
  background: #ffffff;
  color: #0f172a;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  padding: 3rem 2.5rem;
}

.page-sheet-header {
  margin-bottom: 1.5rem;
}

.sheet-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.page-sheet-header h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.sheet-content {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #334155;
}

.sheet-illustration-placeholder {
  margin-top: 2rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #64748b;
  font-size: 0.85rem;
}

/* Answer Sheet Modal Blocks */
.answer-sheet-act-block {
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  margin-bottom: 1rem;
}

.act-block-head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.75rem;
}

.act-block-head h4 {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
}

.act-block-question {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.options-radio-preview {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.25rem;
  padding-left: 0.5rem;
}

.options-radio-preview label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
</style>

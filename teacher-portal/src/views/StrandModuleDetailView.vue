<template>
  <div class="page-container">
    <!-- Breadcrumb / Back link -->
    <nav class="breadcrumb">
      <router-link :to="`/dashboard/clc/${clcSlug}/strand/${strandSlug}`" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Back to {{ strandName }}</span>
      </router-link>
    </nav>

    <!-- Header Row matching Screen 6 -->
    <div class="page-header-row" style="margin-bottom: 1.25rem;">
      <div class="page-title-group">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <h1>{{ moduleData.title }}</h1>
          <span class="badge badge-success">{{ moduleData.status }}</span>
        </div>
        <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.2rem;">
          Uploaded on {{ moduleData.dateUploaded }}
        </p>
      </div>

      <div style="display: flex; gap: 0.65rem; align-items: center;">
        <button class="btn btn-outline" @click="showEditModal = true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span>Edit Module</span>
        </button>
        <button class="btn-icon" title="More options">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Tabs Row matching Screen 6 -->
    <div class="tab-bar-card">
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

    <!-- Tab 1: Module Details (2-Column layout matching Screen 6) -->
    <div v-if="activeTab === 'Module Details'" class="module-detail-layout-2">
      <!-- Left Column: Module Information & PDF File -->
      <div class="card-box">
        <!-- PDF File Banner -->
        <div class="pdf-file-banner">
          <div class="pdf-file-left">
            <div class="pdf-file-icon">
              <span class="pdf-tag">PDF</span>
            </div>
            <div class="pdf-file-info">
              <span class="pdf-file-title">{{ moduleData.fileName }}</span>
              <span class="pdf-file-size">{{ moduleData.fileSize }}</span>
            </div>
          </div>
          <button class="btn btn-outline" style="background: #ffffff;" @click="showReaderModal = true">
            <span>View File</span>
          </button>
        </div>

        <!-- Metadata Grid -->
        <div class="meta-details-list">
          <div class="meta-item-row">
            <span class="meta-label">Learning Strand</span>
            <span class="meta-value">{{ strandName }}</span>
          </div>

          <div class="meta-item-row">
            <span class="meta-label">Description</span>
            <span class="meta-value">{{ moduleData.description }}</span>
          </div>

          <div class="meta-item-row">
            <span class="meta-label">Assigned to</span>
            <span class="meta-value">{{ moduleData.assignedTo }}</span>
          </div>

          <div class="meta-item-row">
            <span class="meta-label">Date Uploaded</span>
            <span class="meta-value">{{ moduleData.dateUploaded }}</span>
          </div>

          <div class="meta-item-row">
            <span class="meta-label">Uploaded by</span>
            <span class="meta-value">{{ moduleData.uploadedBy }}</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Manage Activities Callout Card -->
      <div class="card-box manage-activities-callout">
        <h3 class="callout-title">Manage Activities</h3>
        <p class="callout-desc">
          Add activities or assessments for this module.
        </p>
        <button class="btn btn-primary" style="width: 100%; justify-content: center;" @click="activeTab = 'Activities / Answer Sheet'">
          <span>Manage Activities</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Tab 2: Activities / Answer Sheet -->
    <div v-else-if="activeTab === 'Activities / Answer Sheet'">
      <div class="table-card">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem 0.5rem;">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--color-text);">Module Activities &amp; Questions</h3>
            <p style="font-size: 0.8rem; color: #64748b;">These activities appear as an interactive Answer Sheet when learners open the module.</p>
          </div>
          <button class="btn btn-primary" @click="showAddActivityModal = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Activity</span>
          </button>
        </div>

        <div class="table-wrapper" style="padding-top: 0.75rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Activity Title</th>
                <th>Question Type</th>
                <th>Page Number</th>
                <th>Items</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(act, idx) in activities" :key="act.id">
                <td>{{ idx + 1 }}</td>
                <td style="font-weight: 600;">{{ act.title }}</td>
                <td>{{ act.type }}</td>
                <td>Page {{ act.page }}</td>
                <td>{{ act.items }} Questions</td>
                <td><span class="badge badge-success">{{ act.status }}</span></td>
                <td>
                  <div class="cell-actions" style="justify-content: flex-end;">
                    <button type="button" class="btn-icon btn-icon-edit" title="Edit" aria-label="Edit Activity" @click="editActivity(act)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button type="button" class="btn-icon btn-icon-danger" title="Delete" aria-label="Delete Activity" @click="deleteActivity(act.id, act.title)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 3: Assigned Learners (Automated CLC-wide access) -->
    <div v-else-if="activeTab === 'Assigned Learners'">
      <!-- Inheritance Logic Explanation Card (Req #7) -->
      <div class="clc-inheritance-card">
        <div class="inheritance-header">
          <span class="inheritance-badge">ALS LMS Assignment Logic</span>
          <h3>Automated CLC-Wide Distribution</h3>
        </div>
        <div class="hierarchy-flow-diagram">
          <div class="flow-step">
            <span class="flow-role">Teacher</span>
            <span class="flow-val">Juan Dela Cruz</span>
          </div>
          <span class="flow-arrow">↓</span>
          <div class="flow-step">
            <span class="flow-role">CLC</span>
            <span class="flow-val">Poblacion CLC</span>
          </div>
          <span class="flow-arrow">↓</span>
          <div class="flow-step">
            <span class="flow-role">Learning Strand</span>
            <span class="flow-val">{{ strandName }}</span>
          </div>
          <span class="flow-arrow">↓</span>
          <div class="flow-step">
            <span class="flow-role">Module</span>
            <span class="flow-val">{{ moduleData.title }}</span>
          </div>
          <span class="flow-arrow">↓</span>
          <div class="flow-step active-leaf">
            <span class="flow-role">All Learners</span>
            <span class="flow-val">17 Registered in Poblacion CLC</span>
          </div>
        </div>
      </div>

      <!-- Learners Table -->
      <div class="table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Learner Name</th>
                <th>LRN</th>
                <th>Level</th>
                <th>Assigned Center</th>
                <th>Access Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(l, idx) in poblacionLearners" :key="l.id">
                <td>{{ idx + 1 }}</td>
                <td style="font-weight: 600;">{{ l.name }}</td>
                <td>{{ l.lrn }}</td>
                <td>{{ l.level }}</td>
                <td>Poblacion CLC</td>
                <td><span class="badge badge-success">Granted (Active)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Reader Preview Modal -->
    <div v-if="showReaderModal" class="modal-overlay" @click.self="showReaderModal = false">
      <div class="modal" style="max-width: 750px;">
        <div class="modal-header">
          <h2>PDF Document Preview: {{ moduleData.fileName }}</h2>
          <button class="modal-close" @click="showReaderModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: 12px; padding: 2.5rem 1.5rem; text-align: center;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.5" style="margin-bottom: 1rem;">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">{{ moduleData.title }}</h3>
            <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">{{ moduleData.description }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showReaderModal = false">Close</button>
          <button class="btn btn-primary" @click="activeTab = 'Activities / Answer Sheet'; showReaderModal = false">Open Answer Sheet</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Activity Modal -->
    <div v-if="showAddActivityModal" class="modal-overlay" @click.self="showAddActivityModal = false">
      <div class="modal" style="max-width: 620px;">
        <div class="modal-header">
          <h2>Create Activity / Answer Sheet</h2>
          <button class="modal-close" @click="showAddActivityModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveActivity">
            <div class="form-group">
              <label class="form-label">Activity Title <span class="required">*</span></label>
              <input v-model="activityForm.title" type="text" class="form-input" placeholder="e.g. Vocabulary Practice" required />
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Page Number <span class="required">*</span></label>
                <input v-model.number="activityForm.page" type="number" min="1" class="form-input" placeholder="e.g. 3" required />
              </div>
              <div class="form-group">
                <label class="form-label">Question Type <span class="required">*</span></label>
                <select v-model="activityForm.type" class="form-select-full" required>
                  <option value="Multiple Choice">Multiple Choice</option>
                  <option value="Identification">Identification</option>
                  <option value="Essay">Essay</option>
                  <option value="Module Assessment">Module Assessment</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Sample Question <span class="required">*</span></label>
              <input v-model="activityForm.sampleQuestion" type="text" class="form-input" placeholder="e.g. What is the central message of the text?" required />
            </div>

            <div class="form-group">
              <label class="form-label">Correct Answer &amp; Feedback</label>
              <input v-model="activityForm.correctAnswer" type="text" class="form-input" placeholder="e.g. Reading comprehension develops active literacy." required />
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showAddActivityModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Activity</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const clcSlug = route.params.clcId || 'poblacion-clc';
const strandSlug = route.params.strandId || 'communication-skills';

const tabs = ['Module Details', 'Activities / Answer Sheet', 'Assigned Learners'];
const activeTab = ref('Module Details');

const showReaderModal = ref(false);
const showEditModal = ref(false);
const showAddActivityModal = ref(false);

const strandNamesMap = {
  'communication-skills': 'Communication Skills',
  'mathematical-skills': 'Mathematical and Problem Solving Skills',
  'scientific-literacy': 'Scientific Literacy and Critical Thinking',
  'life-career-skills': 'Life and Career Skills',
  'digital-literacy': 'Digital Literacy',
  'self-society': 'Understanding the Self and the Society',
};

const strandName = computed(() => strandNamesMap[strandSlug] || 'Communication Skills');

// Matching Screen 6 values
const moduleData = reactive({
  title: 'Communication Skills Module 4',
  status: 'Published',
  fileName: 'Communication_Skills_Module4.pdf',
  fileSize: '5.2 MB',
  description: 'This module covers reading and understanding different text types.',
  assignedTo: 'Poblacion CLC',
  dateUploaded: 'September 13, 2026',
  uploadedBy: 'Juan Dela Cruz (ALS Teacher)',
});

// Activities for this module
const activities = ref([
  { id: 1, title: 'Vocabulary Practice', type: 'Identification', page: 3, items: 5, status: 'Published' },
  { id: 2, title: 'Reading Comprehension', type: 'Multiple Choice', page: 5, items: 10, status: 'Published' },
  { id: 3, title: 'Reflection Activity', type: 'Essay', page: 8, items: 1, status: 'Published' },
  { id: 4, title: 'Module Assessment', type: 'Multiple Choice', page: 10, items: 20, status: 'Published' },
]);

const activityForm = reactive({
  title: '',
  page: 1,
  type: 'Multiple Choice',
  sampleQuestion: '',
  correctAnswer: '',
});

// All 17 learners registered under Poblacion CLC (Req #7)
const poblacionLearners = ref([
  { id: 1, name: 'Ana Mae B. Dela Cruz', lrn: '109823481231', level: 'A&E Elementary' },
  { id: 2, name: 'John Rey L. Abad', lrn: '109823481232', level: 'A&E Junior High' },
  { id: 3, name: 'Maria Fe S. Ignacio', lrn: '109823481233', level: 'A&E Elementary' },
  { id: 4, name: 'Carla M. Baylon', lrn: '109823481234', level: 'A&E Junior High' },
  { id: 5, name: 'Liza T. Ramon', lrn: '109823481235', level: 'A&E Junior High' },
  { id: 6, name: 'Juan Dela Cruz', lrn: '109823481236', level: 'A&E Elementary' },
  { id: 7, name: 'Pedro S. Penduko', lrn: '109823481237', level: 'A&E Junior High' },
  { id: 8, name: 'Mark Anthony Perez', lrn: '109823481238', level: 'A&E Junior High' },
  { id: 9, name: 'Elena G. Morales', lrn: '109823481239', level: 'A&E Elementary' },
  { id: 10, name: 'Christian D. Ramos', lrn: '109823481240', level: 'A&E Junior High' },
  { id: 11, name: 'Grace M. Tan', lrn: '109823481241', level: 'A&E Elementary' },
  { id: 12, name: 'Roberto J. Cruz', lrn: '109823481242', level: 'A&E Junior High' },
  { id: 13, name: 'Sarah Joy Lim', lrn: '109823481243', level: 'A&E Junior High' },
  { id: 14, name: 'Danilo E. Flores', lrn: '109823481244', level: 'A&E Elementary' },
  { id: 15, name: 'Jenny V. Valdez', lrn: '109823481245', level: 'A&E Junior High' },
  { id: 16, name: 'Kenneth P. Gomez', lrn: '109823481246', level: 'A&E Junior High' },
  { id: 17, name: 'Rosemarie D. Ocampo', lrn: '109823481247', level: 'A&E Elementary' },
]);

function saveActivity() {
  activities.value.push({
    id: Date.now(),
    title: activityForm.title,
    type: activityForm.type,
    page: activityForm.page,
    items: 5,
    status: 'Published',
  });
  alert(`Activity "${activityForm.title}" added to Answer Sheet.`);
  showAddActivityModal.value = false;
  activityForm.title = '';
}

function deleteActivity(id, title) {
  if (confirm(`Delete activity "${title}"?`)) {
    activities.value = activities.value.filter((a) => a.id !== id);
  }
}

function editActivity(act) {
  alert(`Editing ${act.title}`);
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

.module-detail-layout-2 {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: start;
}

/* PDF File Banner matching Screen 6 */
.pdf-file-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: 1.5rem;
}

.pdf-file-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.pdf-file-icon {
  width: 40px;
  height: 44px;
  background: #ef4444;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.75rem;
}

.pdf-file-info {
  display: flex;
  flex-direction: column;
}

.pdf-file-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.pdf-file-size {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Metadata Key-Value List matching Screen 6 */
.meta-details-list {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.meta-item-row {
  display: flex;
  align-items: flex-start;
  font-size: 0.875rem;
}

.meta-label {
  width: 150px;
  font-weight: 600;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.meta-value {
  color: var(--color-text);
  font-weight: 500;
  flex: 1;
}

/* Manage Activities Right Callout Card */
.manage-activities-callout {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.callout-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.callout-desc {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

/* Inheritance Diagram Card */
.clc-inheritance-card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-xs);
}

.inheritance-header {
  margin-bottom: 1.25rem;
}

.inheritance-badge {
  display: inline-block;
  font-size: 0.725rem;
  font-weight: 700;
  color: var(--color-primary);
  background: #eff6ff;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  margin-bottom: 0.35rem;
}

.inheritance-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}

.hierarchy-flow-diagram {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}

.flow-step {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.85rem;
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.flow-step.active-leaf {
  border-color: #10b981;
  background: #f0fdf4;
}

.flow-role {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.flow-val {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--color-text);
}

.flow-arrow {
  font-weight: 800;
  color: #94a3b8;
}

@media (max-width: 900px) {
  .module-detail-layout-2 {
    grid-template-columns: 1fr;
  }
}
</style>

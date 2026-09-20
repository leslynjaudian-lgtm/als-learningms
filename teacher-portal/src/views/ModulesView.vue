<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Learning Modules</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Learning Modules by Strand</h1>
        <p>Browse official ALS learning modules, manage activity sheets, and assign materials to learners.</p>
      </div>
      <div style="display: flex; gap: 0.65rem;">
        <button class="btn btn-outline" @click="showAssignModal = true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Assign to Learner</span>
        </button>
        <router-link to="/modules/upload" class="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Upload Module</span>
        </router-link>
      </div>
    </div>

    <!-- Learning Strands Quick Filter Badges -->
    <div class="strands-chips-row">
      <button
        class="strand-chip"
        :class="{ active: selectedStrand === '' }"
        @click="selectedStrand = ''"
      >
        All Strands ({{ modules.length }})
      </button>
      <button
        v-for="st in strandsList"
        :key="st.id"
        class="strand-chip"
        :class="{ active: selectedStrand === st.name }"
        @click="selectedStrand = st.name"
      >
        {{ st.short }}
      </button>
    </div>

    <!-- Filter Card -->
    <div class="filter-card">
      <div class="filter-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-search-input"
          placeholder="Search module title or code..."
        />
      </div>

      <div class="filter-dropdown-group">
        <div class="filter-dropdown-item">
          <label>Learning Strand</label>
          <select v-model="selectedStrand" class="filter-select">
            <option value="">All Strands</option>
            <option v-for="st in strandsList" :key="st.id" :value="st.name">{{ st.name }}</option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>Target Level</label>
          <select v-model="selectedLevel" class="filter-select">
            <option value="">All Levels</option>
            <option value="Basic Literacy">Basic Literacy</option>
            <option value="A&E Elementary">A&E Elementary</option>
            <option value="A&E Junior">A&E Junior</option>
            <option value="ALS K-12">ALS K-12</option>
          </select>
        </div>

        <button class="btn-outline" @click="clearFilters">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <span>Clear Filters</span>
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Module Title</th>
              <th>Learning Strand</th>
              <th>Target Level</th>
              <th>Activities</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mod, idx) in filteredModules" :key="mod.id">
              <td>{{ idx + 1 }}</td>
              <td>
                <router-link :to="`/modules/${mod.id}/activities`" class="table-module-link">
                  {{ mod.title }}
                </router-link>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.15rem;">
                  Code: <code>{{ mod.code }}</code> &bull; Added: {{ mod.dateUploaded }}
                </div>
              </td>
              <td><span class="strand-pill">{{ mod.strand }}</span></td>
              <td>{{ mod.level }}</td>
              <td>{{ mod.activitiesCount }} Activity Sheets</td>
              <td>
                <span class="badge badge-success">{{ mod.status }}</span>
              </td>
              <td>
                <div class="cell-actions" style="justify-content: flex-end;">
                  <button class="btn-outline" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;" @click="openAssignForModule(mod)">
                    Assign to Learner
                  </button>
                  <router-link
                    :to="`/modules/${mod.id}/activities`"
                    class="btn-icon"
                    title="Manage Activities"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredModules.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <h3>No learning modules found</h3>
        <p>Try searching for a different strand or upload a new module.</p>
      </div>

      <!-- Pagination Footer -->
      <div class="table-pagination-row">
        <div>
          Showing {{ filteredModules.length === 0 ? 0 : 1 }} to {{ filteredModules.length }} of {{ filteredModules.length }} modules
        </div>
        <div class="pagination-controls">
          <div class="pagination-rows-select">
            <span>Rows per page:</span>
            <select class="filter-select" style="padding: 0.25rem 1.5rem 0.25rem 0.5rem;">
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
          </div>
          <div class="pagination-nav-group">
            <button class="pagination-btn" disabled>&lt; Previous</button>
            <button class="pagination-btn" disabled>Next &gt;</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Assign Modal -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Assign Module to Learner</h2>
          <button class="modal-close" @click="showAssignModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitAssignToLearner">
            <div class="form-group">
              <label class="form-label">Select Module <span class="required">*</span></label>
              <select v-model="assignTarget.moduleId" class="form-select-full" required>
                <option v-for="m in modules" :key="m.id" :value="m.id">{{ m.title }} ({{ m.code }})</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Select Learner <span class="required">*</span></label>
              <select v-model="assignTarget.learnerId" class="form-select-full" required>
                <option value="6">Juan Dela Cruz (LRN: 109823481236)</option>
                <option value="1">Ana Mae B. Dela Cruz (LRN: 109823481231)</option>
                <option value="2">John Rey L. Abad (LRN: 109823481232)</option>
                <option value="3">Maria Fe S. Ignacio (LRN: 109823481233)</option>
                <option value="4">Carla M. Baylon (LRN: 109823481234)</option>
                <option value="7">Pedro S. Penduko (LRN: 109823481237)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Target Completion Date <span class="required">*</span></label>
              <input v-model="assignTarget.targetDate" type="date" class="form-input" required />
            </div>
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showAssignModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Confirm Assignment</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const searchQuery = ref('');
const selectedStrand = ref('');
const selectedLevel = ref('');

const strandsList = [
  { id: 1, name: 'Communication Skills (English/Filipino)', short: 'Strand 1: Communication' },
  { id: 2, name: 'Scientific & Critical Thinking Skills', short: 'Strand 2: Scientific' },
  { id: 3, name: 'Mathematical & Problem Solving Skills', short: 'Strand 3: Math' },
  { id: 4, name: 'Life and Career Skills', short: 'Strand 4: Life & Career' },
  { id: 5, name: 'Understanding Self & Society', short: 'Strand 5: Self & Society' },
  { id: 6, name: 'Digital Citizenship', short: 'Strand 6: Digital Citizenship' },
];

const modules = ref([
  {
    id: 1,
    title: 'Communication Skills Module 1: Effective Reading & Vocabulary',
    code: 'CS-M1',
    strand: 'Communication Skills (English/Filipino)',
    level: 'A&E Elementary',
    activitiesCount: 4,
    dateUploaded: 'Sep 01, 2026',
    status: 'Published',
  },
  {
    id: 2,
    title: 'Scientific & Critical Thinking Skills Module 1: Observation & Inquiry',
    code: 'SC-M1',
    strand: 'Scientific & Critical Thinking Skills',
    level: 'A&E Elementary',
    activitiesCount: 4,
    dateUploaded: 'Sep 03, 2026',
    status: 'Published',
  },
  {
    id: 3,
    title: 'Mathematical & Problem Solving Module 2: Budgeting & Calculations',
    code: 'MS-M2',
    strand: 'Mathematical & Problem Solving Skills',
    level: 'A&E Junior',
    activitiesCount: 4,
    dateUploaded: 'Sep 05, 2026',
    status: 'Published',
  },
  {
    id: 4,
    title: 'Life and Career Skills Module 1: Career Planning & Skills Audit',
    code: 'LC-M1',
    strand: 'Life and Career Skills',
    level: 'ALS K-12',
    activitiesCount: 3,
    dateUploaded: 'Sep 08, 2026',
    status: 'Published',
  },
  {
    id: 5,
    title: 'Understanding Self and Society Module 1: Civic Rights & Responsibilities',
    code: 'SS-M1',
    strand: 'Understanding Self & Society',
    level: 'A&E Junior',
    activitiesCount: 3,
    dateUploaded: 'Sep 10, 2026',
    status: 'Published',
  },
  {
    id: 6,
    title: 'Digital Citizenship Module 1: Safe Online Searching & Tools',
    code: 'DC-M1',
    strand: 'Digital Citizenship',
    level: 'A&E Elementary',
    activitiesCount: 4,
    dateUploaded: 'Sep 12, 2026',
    status: 'Published',
  },
]);

function clearFilters() {
  searchQuery.value = '';
  selectedStrand.value = '';
  selectedLevel.value = '';
}

const filteredModules = computed(() => {
  return modules.value.filter((m) => {
    const matchesQuery =
      !searchQuery.value ||
      m.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStrand = !selectedStrand.value || m.strand === selectedStrand.value;
    const matchesLevel = !selectedLevel.value || m.level === selectedLevel.value;
    return matchesQuery && matchesStrand && matchesLevel;
  });
});

const showAssignModal = ref(false);
const assignTarget = reactive({
  moduleId: 1,
  learnerId: '6',
  targetDate: '2026-10-15',
});

function openAssignForModule(mod) {
  assignTarget.moduleId = mod.id;
  showAssignModal.value = true;
}

function submitAssignToLearner() {
  alert('Module successfully assigned to learner.');
  showAssignModal.value = false;
}
</script>

<style scoped>
.strands-chips-row {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin-bottom: 1.25rem;
}

.strand-chip {
  background: #ffffff;
  border: 1px solid var(--color-border);
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.775rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.strand-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.strand-chip.active {
  background: var(--color-primary);
  color: #ffffff;
  border-color: var(--color-primary);
}

.strand-pill {
  display: inline-block;
  font-size: 0.75rem;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.table-module-link {
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}

.table-module-link:hover {
  text-decoration: underline;
}
</style>

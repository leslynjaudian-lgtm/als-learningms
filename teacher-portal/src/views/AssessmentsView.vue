<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Assessments</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Assessments</h1>
        <p>Manage all assessments and view submission status.</p>
      </div>
      <div style="display: flex; gap: 0.65rem; align-items: center;">
        <router-link to="/assessments/record" class="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span>Record F2F Score</span>
        </router-link>
        <button class="btn btn-primary" @click="showAddModal = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>+ Create Assessment</span>
        </button>
      </div>
    </div>

    <!-- Tabs Row matching bottom-right screenshot -->
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

    <!-- Filter Card -->
    <div class="filter-card">
      <div class="filter-dropdown-group" style="flex: 1;">
        <div class="filter-dropdown-item">
          <select v-model="selectedModule" class="filter-select">
            <option value="">All Modules</option>
            <option value="Module 1">Module 1 (Communication Skills)</option>
            <option value="Module 2">Module 2 (Scientific Thinking)</option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <select v-model="selectedType" class="filter-select">
            <option value="">All Types</option>
            <option value="Identification">Identification</option>
            <option value="Multiple Choice">Multiple Choice</option>
            <option value="Essay">Essay</option>
          </select>
        </div>

        <div class="filter-search-wrap" style="min-width: 200px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="filter-search-input"
            placeholder="Search assessments..."
          />
        </div>
      </div>
    </div>

    <!-- Table Card matching bottom-right screenshot -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Assessment Title</th>
              <th>Module</th>
              <th>Type</th>
              <th>Items</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in filteredAssessments" :key="item.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 600;">
                <router-link :to="`/modules/1/activities/create?id=${item.id}`" style="color: var(--color-primary);">
                  {{ item.title }}
                </router-link>
              </td>
              <td>{{ item.module }}</td>
              <td>{{ item.type }}</td>
              <td>{{ item.items }}</td>
              <td>
                <span class="badge badge-success">{{ item.status }}</span>
              </td>
              <td>
                <div class="cell-actions" style="justify-content: flex-end;">
                  <router-link
                    :to="`/modules/1/activities/create?id=${item.id}`"
                    class="btn-icon"
                    title="Edit Assessment"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </router-link>
                  <button class="btn-icon" title="Delete Assessment" @click="deleteAssessment(item.id, item.title)">
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
      <div v-if="filteredAssessments.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
        </div>
        <h3>No assessments found</h3>
        <p>No assessment records match your filter criteria.</p>
      </div>

      <!-- Pagination Footer -->
      <div class="table-pagination-row">
        <div>
          Showing {{ filteredAssessments.length === 0 ? 0 : 1 }} to {{ filteredAssessments.length }} of {{ filteredAssessments.length }} entries
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

    <!-- Create Assessment Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Create New Assessment</h2>
          <button class="modal-close" @click="showAddModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveAssessment">
            <div class="form-group">
              <label class="form-label">Assessment Title <span class="required">*</span></label>
              <input v-model="form.title" type="text" class="form-input" placeholder="e.g. Reading Comprehension" required />
            </div>
            <div class="form-group">
              <label class="form-label">Module <span class="required">*</span></label>
              <select v-model="form.module" class="form-select-full" required>
                <option value="Module 1">Module 1 (Communication Skills)</option>
                <option value="Module 2">Module 2 (Scientific & Critical Thinking)</option>
                <option value="Module 3">Module 3 (Mathematics)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Delivery Mode <span class="required">*</span></label>
              <select v-model="form.deliveryMode" class="form-select-full" required>
                <option value="Online">Online Assessment</option>
                <option value="Face-to-Face">Face-to-Face Assessment</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Question Type <span class="required">*</span></label>
              <select v-model="form.type" class="form-select-full" required>
                <option value="Multiple Choice">Multiple Choice</option>
                <option value="Identification">Identification</option>
                <option value="Essay">Essay</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Total Items <span class="required">*</span></label>
              <input v-model.number="form.items" type="number" min="1" class="form-input" placeholder="e.g. 10" required />
            </div>
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Assessment</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const tabs = ['All Assessments', 'Online Assessments', 'Face-to-face Assessments'];
const activeTab = ref('All Assessments');
const showAddModal = ref(false);

const searchQuery = ref('');
const selectedModule = ref('');
const selectedType = ref('');

// Rows exactly matching bottom-right screenshot
const assessments = ref([
  { id: 1, title: 'Vocabulary Practice', module: 'Module 1', type: 'Identification', items: 5, mode: 'Online', status: 'Published' },
  { id: 2, title: 'Reading Comprehension', module: 'Module 1', type: 'Multiple Choice', items: 10, mode: 'Online', status: 'Published' },
  { id: 3, title: 'Reflection Journal', module: 'Module 1', type: 'Essay', items: 1, mode: 'Face-to-Face', status: 'Published' },
  { id: 4, title: 'Module Quiz', module: 'Module 1', type: 'Multiple Choice', items: 20, mode: 'Online', status: 'Published' },
]);

const form = reactive({
  title: '',
  module: 'Module 1',
  deliveryMode: 'Online',
  type: 'Multiple Choice',
  items: 10,
  status: 'Published',
});

const filteredAssessments = computed(() => {
  return assessments.value.filter((a) => {
    const matchesTab =
      activeTab.value === 'All Assessments' ||
      (activeTab.value === 'Online Assessments' && a.mode === 'Online') ||
      (activeTab.value === 'Face-to-face Assessments' && a.mode === 'Face-to-Face');

    const matchesQuery = !searchQuery.value || a.title.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesModule = !selectedModule.value || a.module === selectedModule.value;
    const matchesType = !selectedType.value || a.type === selectedType.value;

    return matchesTab && matchesQuery && matchesModule && matchesType;
  });
});

function saveAssessment() {
  assessments.value.unshift({
    id: Date.now(),
    title: form.title,
    module: form.module,
    type: form.type,
    items: form.items,
    mode: form.deliveryMode,
    status: 'Published',
  });
  alert(`Assessment "${form.title}" created successfully.`);
  showAddModal.value = false;
  form.title = '';
}

function deleteAssessment(id, title) {
  if (confirm(`Are you sure you want to delete "${title}"?`)) {
    assessments.value = assessments.value.filter((a) => a.id !== id);
  }
}
</script>

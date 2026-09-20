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
        <h1>Learning Modules</h1>
        <p>Manage learning modules and materials.</p>
      </div>
      <button class="btn btn-primary" @click="showAddModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add Module</span>
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
          placeholder="Search modules..."
        />
      </div>

      <div class="filter-dropdown-group">
        <div class="filter-dropdown-item">
          <label>Learning Strand</label>
          <select v-model="selectedStrand" class="filter-select">
            <option value="">All</option>
            <option value="LS 1 - Communication Skills (English)">LS 1 - Communication Skills (English)</option>
            <option value="LS 1 - Communication Skills (Filipino)">LS 1 - Communication Skills (Filipino)</option>
            <option value="LS 2 - Scientific & Critical Thinking">LS 2 - Scientific & Critical Thinking</option>
            <option value="LS 3 - Mathematical & Problem Solving">LS 3 - Mathematical & Problem Solving</option>
            <option value="LS 4 - Life and Career Skills">LS 4 - Life and Career Skills</option>
            <option value="LS 5 - Understanding Self & Society">LS 5 - Understanding Self & Society</option>
            <option value="LS 6 - Digital Citizenship">LS 6 - Digital Citizenship</option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>Level</label>
          <select v-model="selectedLevel" class="filter-select">
            <option value="">All</option>
            <option value="Basic Literacy">Basic Literacy</option>
            <option value="Elementary">Elementary</option>
            <option value="Lower Secondary">Lower Secondary</option>
            <option value="Upper Secondary">Upper Secondary</option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>Status</label>
          <select v-model="selectedStatus" class="filter-select">
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Module Title</th>
              <th>Learning Strand</th>
              <th>Level</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mod, idx) in filteredModules" :key="mod.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 600;">{{ mod.title }}</td>
              <td>{{ mod.strand }}</td>
              <td>{{ mod.level }}</td>
              <td>
                <span class="badge" :class="mod.status === 'Active' ? 'badge-success' : 'badge-muted'">
                  {{ mod.status }}
                </span>
              </td>
              <td class="td-actions">
                <div class="cell-actions">
                  <button class="btn-icon btn-icon-view" title="View Module Details" @click="openViewModal(mod)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button class="btn-icon btn-icon-edit" title="Edit Module" @click="openEditModal(mod)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>
                  <button class="btn-icon btn-icon-danger" title="Delete Module" @click="openDeleteModal(mod)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredModules.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
          </svg>
        </div>
        <h3>No learning modules yet</h3>
        <p>Modules and materials will appear here once they are uploaded.</p>
      </div>
    </div>

    <!-- Add / Edit Module Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingModule ? 'Edit Learning Module' : 'Add Learning Module' }}</h2>
          <button class="modal-close" @click="showAddModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveModule">
            <div class="form-group">
              <label class="form-label">Module Title <span class="required">*</span></label>
              <input v-model="moduleForm.title" type="text" class="form-input" placeholder="e.g. Basic Literacy in English - Module 1" required />
            </div>
            <div class="form-group">
              <label class="form-label">Learning Strand <span class="required">*</span></label>
              <select v-model="moduleForm.strand" class="form-select-full" required>
                <option value="" disabled>Select strand</option>
                <option value="LS 1 - Communication Skills (English)">LS 1 - Communication Skills (English)</option>
                <option value="LS 1 - Communication Skills (Filipino)">LS 1 - Communication Skills (Filipino)</option>
                <option value="LS 2 - Scientific & Critical Thinking">LS 2 - Scientific & Critical Thinking</option>
                <option value="LS 3 - Mathematical & Problem Solving">LS 3 - Mathematical & Problem Solving</option>
                <option value="LS 4 - Life and Career Skills">LS 4 - Life and Career Skills</option>
                <option value="LS 5 - Understanding Self & Society">LS 5 - Understanding Self & Society</option>
                <option value="LS 6 - Digital Citizenship">LS 6 - Digital Citizenship</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Level <span class="required">*</span></label>
              <select v-model="moduleForm.level" class="form-select-full" required>
                <option value="" disabled>Select level</option>
                <option value="Basic Literacy">Basic Literacy</option>
                <option value="Elementary">Elementary</option>
                <option value="Lower Secondary">Lower Secondary</option>
                <option value="Upper Secondary">Upper Secondary</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="moduleForm.status" class="form-select-full">
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">{{ editingModule ? 'Save Changes' : 'Save Module' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Module Details Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal" style="max-width: 540px; width: 90%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="modal-header" style="border-bottom: 1px solid var(--color-border); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 class="modal-title" style="font-size: 1.2rem; font-weight: 700; color: var(--color-text);">Module Information</h2>
            <p class="modal-subtitle" style="font-size: 0.85rem; color: var(--color-text-secondary);">Curriculum & Learning Strand Details</p>
          </div>
          <button type="button" class="modal-close" @click="showViewModal = false" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
          <div class="details-grid">
            <div class="detail-item details-full-width">
              <span class="detail-label">Module Title</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-primary); font-size: 1.05rem;">{{ viewingModule?.title }}</span>
            </div>
            <div class="detail-item details-full-width">
              <span class="detail-label">Learning Strand</span>
              <span class="detail-value">{{ viewingModule?.strand }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Level</span>
              <span class="detail-value">{{ viewingModule?.level }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="badge" :class="viewingModule?.status === 'Active' ? 'badge-success' : 'badge-muted'">
                  {{ viewingModule?.status || 'Active' }}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div style="border-top: 1px solid var(--color-border); padding: 1rem 1.5rem; display: flex; justify-content: flex-end; background: #f8fafc;">
          <button type="button" class="btn btn-secondary" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      title="Delete Learning Module"
      :item-name="deletingModule?.title || ''"
      :loading="deleting"
      @confirm="confirmDeleteModule"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';

// Delete modal state
const showDeleteModal = ref(false);
const deletingModule = ref(null);
const deleting = ref(false);

function openDeleteModal(mod) {
  deletingModule.value = mod;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  if (deleting.value) return;
  showDeleteModal.value = false;
  deletingModule.value = null;
}

function confirmDeleteModule() {
  if (!deletingModule.value) return;
  deleting.value = true;
  modules.value = modules.value.filter((m) => m.id !== deletingModule.value.id);
  showDeleteModal.value = false;
  deletingModule.value = null;
  deleting.value = false;
}

const searchQuery = ref('');
const selectedStrand = ref('');
const selectedLevel = ref('');
const selectedStatus = ref('');
const showAddModal = ref(false);
const showViewModal = ref(false);
const viewingModule = ref(null);
const editingModule = ref(null);

const modules = ref([
  { id: 1, title: 'Basic Literacy in English - Module 1', strand: 'LS 1 - Communication Skills (English)', level: 'Basic Literacy', status: 'Active' },
  { id: 2, title: 'Pagpapaunlad ng Kasanayan sa Filipino - Modyul 1', strand: 'LS 1 - Communication Skills (Filipino)', level: 'Elementary', status: 'Active' },
  { id: 3, title: 'Scientific Thinking and Environment - Module 1', strand: 'LS 2 - Scientific & Critical Thinking', level: 'Lower Secondary', status: 'Active' },
  { id: 4, title: 'Practical Mathematics in Everyday Life', strand: 'LS 3 - Mathematical & Problem Solving', level: 'Lower Secondary', status: 'Active' },
  { id: 5, title: 'Career Exploration and Livelihood Skills', strand: 'LS 4 - Life and Career Skills', level: 'Upper Secondary', status: 'Active' },
]);

const moduleForm = reactive({
  title: '',
  strand: '',
  level: '',
  status: 'Active',
});

function openViewModal(mod) {
  viewingModule.value = mod;
  showViewModal.value = true;
}

function openEditModal(mod) {
  editingModule.value = mod;
  moduleForm.title = mod.title;
  moduleForm.strand = mod.strand;
  moduleForm.level = mod.level;
  moduleForm.status = mod.status || 'Active';
  showAddModal.value = true;
}

function openAddModal() {
  editingModule.value = null;
  moduleForm.title = '';
  moduleForm.strand = '';
  moduleForm.level = '';
  moduleForm.status = 'Active';
  showAddModal.value = true;
}

const filteredModules = computed(() => {
  return modules.value.filter((m) => {
    const matchesQuery = !searchQuery.value || m.title.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStrand = !selectedStrand.value || m.strand === selectedStrand.value;
    const matchesLevel = !selectedLevel.value || m.level === selectedLevel.value;
    const matchesStatus = !selectedStatus.value || m.status === selectedStatus.value;
    return matchesQuery && matchesStrand && matchesLevel && matchesStatus;
  });
});

function saveModule() {
  if (editingModule.value) {
    const idx = modules.value.findIndex((m) => m.id === editingModule.value.id);
    if (idx !== -1) {
      modules.value[idx] = {
        ...modules.value[idx],
        title: moduleForm.title,
        strand: moduleForm.strand,
        level: moduleForm.level,
        status: moduleForm.status,
      };
    }
  } else {
    modules.value.unshift({
      id: Date.now(),
      title: moduleForm.title,
      strand: moduleForm.strand,
      level: moduleForm.level,
      status: moduleForm.status,
    });
  }
  showAddModal.value = false;
  editingModule.value = null;
  moduleForm.title = '';
}
</script>

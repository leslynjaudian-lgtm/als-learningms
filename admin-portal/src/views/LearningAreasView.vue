<template>
  <div class="page-container">
    <!-- Toast notifications -->
    <div class="toast-container" v-if="toasts.length > 0">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="[`toast-${toast.type}`, { 'toast-exit': toast.exiting }]"
      >
        {{ toast.message }}
      </div>
    </div>

    <!-- Standardized Page Header -->
    <PageHeader
      title="Learning Areas"
      description="Manage ALS learning strands and subject areas."
      :breadcrumbs="[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Learning Areas' },
      ]"
    >
      <template #actions>
        <button type="button" class="btn btn-primary" @click="openAddModal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Add Learning Area</span>
        </button>
      </template>
    </PageHeader>

    <!-- Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">No.</th>
              <th style="width: 110px;">Code</th>
              <th>Learning Strand</th>
              <th>Description</th>
              <th style="width: 110px;">Status</th>
              <th class="th-actions" style="text-align: right; width: 140px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(area, idx) in areas" :key="area.id">
              <td>{{ idx + 1 }}</td>
              <td>
                <span class="badge badge-primary">{{ area.code }}</span>
              </td>
              <td style="font-weight: 400; color: var(--color-text);">
                {{ area.name }}
              </td>
              <td class="col-description">
                {{ area.description }}
              </td>
              <td>
                <span class="badge" :class="area.status === 'Inactive' ? 'badge-muted' : 'badge-success'">
                  {{ area.status || 'Active' }}
                </span>
              </td>
              <td class="td-actions" style="text-align: right;">
                <div class="cell-actions" style="justify-content: flex-end;">
                  <!-- View Icon -->
                  <button
                    type="button"
                    class="btn-icon btn-icon-view"
                    title="View"
                    aria-label="View Learning Area"
                    @click="openViewModal(area)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>

                  <!-- Edit Icon -->
                  <button
                    type="button"
                    class="btn-icon btn-icon-edit"
                    title="Edit"
                    aria-label="Edit Learning Area"
                    @click="openEditModal(area)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>

                  <!-- Delete Icon -->
                  <button
                    type="button"
                    class="btn-icon btn-icon-danger"
                    title="Delete"
                    aria-label="Delete Learning Area"
                    @click="openDeleteModal(area)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      <div v-if="!loading && areas.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <h3>No learning areas registered</h3>
        <p>Click "Add Learning Area" above to create an ALS learning strand.</p>
      </div>
    </div>

    <!-- Modal: Add / Edit Learning Area -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal modal-learning-area">
        <div class="modal-header">
          <div>
            <h2>{{ editingArea ? 'Edit Learning Area' : 'Add Learning Area' }}</h2>
            <p class="modal-subtitle">
              {{ editingArea ? 'Update learning area information.' : 'Create a new ALS learning strand and subject area.' }}
            </p>
          </div>
          <button type="button" class="modal-close" @click="closeFormModal" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveForm">
            <!-- Learning Strand Code * -->
            <div class="form-group">
              <label class="form-label" for="la-code">
                Learning Strand Code <span class="required">*</span>
              </label>
              <input
                id="la-code"
                v-model="form.code"
                type="text"
                class="form-input"
                placeholder="e.g. LS1"
                required
              />
            </div>

            <!-- Learning Strand Name * -->
            <div class="form-group">
              <label class="form-label" for="la-name">
                Learning Strand Name <span class="required">*</span>
              </label>
              <input
                id="la-name"
                v-model="form.name"
                type="text"
                class="form-input"
                placeholder="e.g. Communication Skills (English)"
                required
              />
            </div>

            <!-- Description * -->
            <div class="form-group">
              <label class="form-label" for="la-desc">
                Description <span class="required">*</span>
              </label>
              <textarea
                id="la-desc"
                v-model="form.description"
                rows="3"
                class="form-input"
                placeholder="e.g. Developing English communication skills for daily life and work."
                required
              ></textarea>
            </div>

            <!-- Status -->
            <div class="form-group">
              <label class="form-label" for="la-status">
                Status
              </label>
              <select id="la-status" v-model="form.status" class="form-select-full">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <!-- Modal Footer Buttons -->
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" :disabled="saving" @click="closeFormModal">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : (editingArea ? 'Save Changes' : 'Save Learning Area') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal: View Learning Area Details -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal modal-view-area">
        <div class="modal-header">
          <div>
            <h2>Learning Area Details</h2>
            <p class="modal-subtitle">ALS Learning Strand Information</p>
          </div>
          <button type="button" class="modal-close" @click="showViewModal = false" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="details-list">
            <div class="detail-row">
              <span class="detail-label">Learning Strand Code</span>
              <span class="detail-value">
                <span class="badge badge-primary">{{ viewingArea?.code }}</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Learning Strand Name</span>
              <span class="detail-value font-semibold">{{ viewingArea?.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Description</span>
              <span class="detail-value">{{ viewingArea?.description || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="badge" :class="viewingArea?.status === 'Inactive' ? 'badge-muted' : 'badge-success'">
                  {{ viewingArea?.status || 'Active' }}
                </span>
              </span>
            </div>
          </div>

          <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1.25rem;">
            <button type="button" class="btn btn-secondary" @click="showViewModal = false">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      title="Delete Learning Area"
      message="Are you sure you want to delete this learning area?"
      :item-name="deletingArea?.name || ''"
      :loading="deleting"
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="confirmDeleteArea"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import PageHeader from '../components/PageHeader.vue';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';
import {
  getLearningAreas,
  createLearningArea,
  updateLearningArea,
  deleteLearningArea,
} from '../api/learningAreas.js';

// --- Toast Notifications ---
const toasts = ref([]);
function showToast(message, type = 'success') {
  const id = Date.now() + Math.random();
  const toastObj = { id, message, type, exiting: false };
  toasts.value.push(toastObj);
  setTimeout(() => {
    toastObj.exiting = true;
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 250);
  }, 3200);
}

const areas = ref([]);
const loading = ref(true);
const saving = ref(false);

async function loadAreas() {
  loading.value = true;
  try {
    const res = await getLearningAreas();
    areas.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('Failed to load learning areas:', err);
    showToast(err.response?.data?.error || 'Failed to load learning areas.', 'error');
    areas.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadAreas();
});

// --- Modal State: Add / Edit ---
const showFormModal = ref(false);
const editingArea = ref(null);

const form = reactive({
  code: '',
  name: '',
  description: '',
  status: 'Active',
});

function openAddModal() {
  editingArea.value = null;
  form.code = '';
  form.name = '';
  form.description = '';
  form.status = 'Active';
  showFormModal.value = true;
}

function openEditModal(area) {
  editingArea.value = area;
  form.code = area.code || '';
  form.name = area.name || '';
  form.description = area.description || '';
  form.status = area.status === 'Inactive' ? 'Inactive' : 'Active';
  showFormModal.value = true;
}

function closeFormModal() {
  if (saving.value) return;
  showFormModal.value = false;
  editingArea.value = null;
}

async function saveForm() {
  if (!form.code.trim() || !form.name.trim() || !form.description.trim()) {
    showToast('Please fill out all required fields.', 'error');
    return;
  }

  const payload = {
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    status: form.status === 'Inactive' ? 'Inactive' : 'Active',
  };

  saving.value = true;
  try {
    if (editingArea.value) {
      await updateLearningArea(editingArea.value.id, payload);
      showToast('Learning area updated successfully.');
    } else {
      await createLearningArea(payload);
      showToast('Learning area added successfully.');
    }
    saving.value = false;
    closeFormModal();
    await loadAreas();
  } catch (err) {
    console.error('Failed to save learning area:', err);
    showToast(err.response?.data?.error || 'Failed to save learning area.', 'error');
  } finally {
    saving.value = false;
  }
}

// --- Modal State: View Details ---
const showViewModal = ref(false);
const viewingArea = ref(null);

function openViewModal(area) {
  viewingArea.value = area;
  showViewModal.value = true;
}

// --- Modal State: Delete Confirmation ---
const showDeleteModal = ref(false);
const deletingArea = ref(null);
const deleting = ref(false);

function openDeleteModal(area) {
  deletingArea.value = area;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  if (deleting.value) return;
  showDeleteModal.value = false;
  deletingArea.value = null;
}

async function confirmDeleteArea() {
  if (!deletingArea.value) return;
  deleting.value = true;
  const targetId = deletingArea.value.id;

  try {
    await deleteLearningArea(targetId);
    deleting.value = false;
    showDeleteModal.value = false;
    deletingArea.value = null;
    showToast('Learning area deleted successfully.');
    await loadAreas();
  } catch (err) {
    console.error('Failed to delete learning area:', err);
    showToast(
      err.response?.data?.error || 'Failed to delete learning area.',
      'error'
    );
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.modal-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-top: 0.2rem;
}

.modal-learning-area {
  max-width: 520px;
  width: 100%;
}

.modal-view-area {
  max-width: 500px;
  width: 100%;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: 0.5rem 0;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.detail-label {
  font-size: 0.775rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.detail-value {
  font-size: 0.925rem;
  color: var(--color-text);
  line-height: 1.45;
}

.font-semibold {
  font-weight: 600;
}

.col-description {
  color: var(--color-text-secondary);
  max-width: 440px;
  line-height: 1.45;
}

/* Toast container */
.toast-container {
  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  z-index: 2500;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  animation: toastSlideIn 0.25s ease-out;
  pointer-events: auto;
}

.toast-success {
  background: #065f46;
  color: #ffffff;
}

.toast-error {
  background: #dc2626;
  color: #ffffff;
}

.toast-exit {
  animation: toastSlideOut 0.25s ease-in forwards;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toastSlideOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}
</style>

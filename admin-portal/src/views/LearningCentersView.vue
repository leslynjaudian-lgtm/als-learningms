<template>
  <div class="page-container">
    <!-- Toast notifications -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="[`toast-${toast.type}`, { 'toast-exit': toast.exiting }]"
      >
        {{ toast.message }}
      </div>
    </div>

    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/dashboard">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Learning Centers</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Learning Centers</h1>
        <p>Manage ALS learning centers in Naawan District.</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add Learning Center</span>
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
          placeholder="Search learning centers..."
        />
      </div>

      <div class="filter-dropdown-group">
        <div class="filter-dropdown-item">
          <label>Status</label>
          <select v-model="selectedStatus" class="filter-select">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="table-card">
      <div class="loading-state">
        <div class="spinner spinner-lg"></div>
        <p>Loading learning centers…</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="table-card">
      <div class="empty-state-box">
        <div class="empty-state-graphic" style="background: var(--color-error-light); color: var(--color-error);">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h3>Failed to load data</h3>
        <p>{{ loadError }}</p>
        <button class="btn btn-secondary" style="margin-top: 1rem;" @click="fetchCenters">Try Again</button>
      </div>
    </div>

    <!-- Data Table & Empty State -->
    <div v-else class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Center Name</th>
              <th>Municipality</th>
              <th>Address</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(center, idx) in filteredCenters" :key="center.id">
              <td>{{ idx + 1 }}</td>
              <td>{{ center.name }}</td>
              <td>Naawan</td>
              <td>{{ center.address || '—' }}</td>
              <td>
                <span class="badge" :class="center.status === 'active' ? 'badge-success' : 'badge-muted'">
                  {{ center.status }}
                </span>
              </td>
              <td class="td-actions">
                <div class="cell-actions">
                  <button type="button" class="btn-icon btn-icon-view" title="View" aria-label="View Center" @click="openViewModal(center)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button type="button" class="btn-icon btn-icon-edit" title="Edit" aria-label="Edit Center" @click="openEditModal(center)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>
                  <button type="button" class="btn-icon btn-icon-danger" title="Delete" aria-label="Delete Center" @click="openDeleteConfirm(center)">
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
      <div v-if="filteredCenters.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
          </svg>
        </div>
        <h3>No learning centers yet</h3>
        <p>Learning center records will appear here once they are registered.</p>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal modal-learning-center">
        <!-- Modal Header -->
        <div class="modal-header-custom">
          <div>
            <h2 class="modal-title">{{ editingCenter ? 'Edit Learning Center' : 'Add Learning Center' }}</h2>
            <p class="modal-subtitle">
              {{ editingCenter ? 'Update learning center information.' : 'Add a new ALS learning center to the system.' }}
            </p>
          </div>
          <button type="button" class="modal-close-btn" @click="closeFormModal" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Modal Form -->
        <form @submit.prevent="submitForm" class="modal-form-custom">
          <!-- Center Name -->
          <div class="form-field-group">
            <label class="form-label" for="lc-name">
              Center Name <span class="required">*</span>
            </label>
            <input
              id="lc-name"
              v-model="form.name"
              type="text"
              class="form-input-custom"
              placeholder="e.g. Poblacion CLC"
              required
            />
          </div>

          <!-- Address -->
          <div class="form-field-group">
            <label class="form-label" for="lc-address">
              Address <span class="required">*</span>
            </label>
            <input
              id="lc-address"
              v-model="form.address"
              type="text"
              class="form-input-custom"
              placeholder="e.g. Barangay Hall, Naawan"
              required
            />
          </div>

          <!-- Status -->
          <div class="form-field-group">
            <label class="form-label" for="lc-status">
              Status
            </label>
            <div class="select-wrapper-custom">
              <select id="lc-status" v-model="form.status" class="form-select-custom">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer-custom">
            <button
              type="button"
              class="btn-cancel-custom"
              @click="closeFormModal"
              :disabled="submitting"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-submit-custom"
              :disabled="submitting"
            >
              {{ submitting ? (editingCenter ? 'Saving…' : 'Adding…') : (editingCenter ? 'Save Changes' : 'Add Center') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Center Details Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal" style="max-width: 540px; width: 90%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="modal-header-custom" style="border-bottom: 1px solid var(--color-border); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 class="modal-title" style="font-size: 1.2rem; font-weight: 700; color: var(--color-text);">Learning Center Details</h2>
            <p class="modal-subtitle" style="font-size: 0.85rem; color: var(--color-text-secondary);">Center Profile & Information</p>
          </div>
          <button type="button" class="modal-close-btn" @click="showViewModal = false" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Center Name</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-primary);">{{ viewingCenter?.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Municipality</span>
              <span class="detail-value">Naawan, Misamis Oriental</span>
            </div>
            <div class="detail-item details-full-width">
              <span class="detail-label">Address</span>
              <span class="detail-value">{{ viewingCenter?.address || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Contact Person / Head</span>
              <span class="detail-value">{{ viewingCenter?.contact_person || viewingCenter?.contactPerson || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Contact Number</span>
              <span class="detail-value">{{ viewingCenter?.contact_number || viewingCenter?.contactNumber || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="badge" :class="viewingCenter?.status === 'active' ? 'badge-success' : 'badge-muted'">
                  {{ viewingCenter?.status || 'active' }}
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
      title="Delete Learning Center"
      :item-name="deletingCenter?.name || ''"
      :loading="submitting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';
import {
  getLearningCenters,
  createLearningCenter,
  updateLearningCenter,
  deleteLearningCenter,
} from '../api/learningCenters.js';

const route = useRoute();
const router = useRouter();

const centers = ref([]);
const loading = ref(true);
const loadError = ref(null);
const searchQuery = ref('');
const selectedStatus = ref('');

const showFormModal = ref(false);
const showDeleteModal = ref(false);
const showViewModal = ref(false);
const viewingCenter = ref(null);
const editingCenter = ref(null);
const deletingCenter = ref(null);
const submitting = ref(false);

function openViewModal(center) {
  viewingCenter.value = center;
  showViewModal.value = true;
}

const form = reactive({
  name: '',
  address: '',
  contact_person: '',
  contact_number: '',
  status: 'active',
});

const toasts = ref([]);
let toastId = 0;

function showToast(message, type = 'success') {
  const id = ++toastId;
  toasts.value.push({ id, message, type, exiting: false });
  setTimeout(() => {
    const toast = toasts.value.find((t) => t.id === id);
    if (toast) toast.exiting = true;
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 200);
  }, 3000);
}

const filteredCenters = computed(() => {
  return centers.value.filter((c) => {
    const matchesQuery = !searchQuery.value ||
      c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesStatus = !selectedStatus.value || c.status === selectedStatus.value;
    return matchesQuery && matchesStatus;
  });
});

async function fetchCenters() {
  loading.value = true;
  loadError.value = null;
  try {
    const { data } = await getLearningCenters();
    centers.value = data;
  } catch (err) {
    loadError.value =
      err.response?.data?.error || 'Could not connect to the server. Make sure the backend is running.';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.name = '';
  form.address = '';
  form.contact_person = '';
  form.contact_number = '';
  form.status = 'active';
}

function openAddModal() {
  editingCenter.value = null;
  resetForm();
  showFormModal.value = true;
}

function openEditModal(center) {
  editingCenter.value = center;
  form.name = center.name;
  form.address = center.address || '';
  form.contact_person = center.contact_person || '';
  form.contact_number = center.contact_number || '';
  form.status = center.status || 'active';
  showFormModal.value = true;
}

function closeFormModal() {
  if (submitting.value) return;
  showFormModal.value = false;
}

async function submitForm() {
  if (!form.name.trim()) return;

  submitting.value = true;
  try {
    if (editingCenter.value) {
      await updateLearningCenter(editingCenter.value.id, { ...form });
      showToast(`"${form.name}" updated successfully.`);
    } else {
      await createLearningCenter({ ...form });
      showToast(`"${form.name}" added successfully.`);
    }
    showFormModal.value = false;
    await fetchCenters();
  } catch (err) {
    const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
    showToast(msg, 'error');
  } finally {
    submitting.value = false;
  }
}

function openDeleteConfirm(center) {
  deletingCenter.value = center;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  if (submitting.value) return;
  showDeleteModal.value = false;
}

async function confirmDelete() {
  if (!deletingCenter.value) return;

  submitting.value = true;
  try {
    await deleteLearningCenter(deletingCenter.value.id);
    showToast(`"${deletingCenter.value.name}" deleted.`);
    showDeleteModal.value = false;
    await fetchCenters();
  } catch (err) {
    const msg = err.response?.data?.error || 'Failed to delete. Please try again.';
    showToast(msg, 'error');
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await fetchCenters();
  if (route.query.view) {
    const targetId = Number(route.query.view);
    const found = centers.value.find((c) => Number(c.id) === targetId);
    if (found) {
      openViewModal(found);
    }
    router.replace({ path: route.path, query: {} });
  }
});
</script>

<style scoped>
.modal-learning-center {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  padding: 1.75rem 2rem 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
}

.modal-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.25;
  margin: 0;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.25rem 0 0;
  line-height: 1.4;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  padding: 0;
  flex-shrink: 0;
  margin-left: 0.5rem;
  margin-top: -2px;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-form-custom {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.form-input-custom,
.form-select-custom {
  width: 100%;
  padding: 0.65rem 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #0f172a;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
  box-sizing: border-box;
}

.form-input-custom:focus,
.form-select-custom:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-input-custom::placeholder {
  color: #94a3b8;
}

.select-wrapper-custom {
  position: relative;
}

.form-select-custom {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.875rem center;
  background-size: 16px 16px;
  padding-right: 2.5rem;
  cursor: pointer;
}

.modal-footer-custom {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.btn-cancel-custom {
  background: #f1f5f9;
  border: 1px solid transparent;
  color: #334155;
  border-radius: 8px;
  padding: 0.625rem 1.25rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.btn-cancel-custom:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-cancel-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-submit-custom {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: #ffffff;
  border-radius: 8px;
  padding: 0.625rem 1.35rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.btn-submit-custom:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn-submit-custom:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .modal-learning-center {
    padding: 1.5rem 1.25rem;
    border-radius: 12px;
  }
}
</style>

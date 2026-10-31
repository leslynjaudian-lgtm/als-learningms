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
      <span class="breadcrumb-current">Learners</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Learners</h1>
        <p>Manage all learners enrolled in the ALS program.</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add Learner</span>
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
          placeholder="Search learners..."
        />
      </div>

      <div class="filter-dropdown-group">
        <div class="filter-dropdown-item">
          <label>Learning Center</label>
          <select v-model="selectedCenter" class="filter-select">
            <option value="">All</option>
            <option v-for="center in learningCenters" :key="center.id" :value="center.name">
              {{ center.name }}
            </option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>ALS Level</label>
          <select v-model="selectedLevel" class="filter-select">
            <option value="">All</option>
            <option value="A&E Elementary">A&E Elementary</option>
            <option value="A&E Junior High">A&E Junior High</option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>Status</label>
          <select v-model="selectedStatus" class="filter-select">
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="table-card">
      <div class="loading-state">
        <div class="spinner spinner-lg"></div>
        <p>Loading learners…</p>
      </div>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>LRN</th>
              <th>Level</th>
              <th>Learning Center</th>
              <th>Assigned Teacher</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(learner, idx) in filteredLearners" :key="learner.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 600;">{{ learner.name }}</td>
              <td>{{ learner.lrn || '—' }}</td>
              <td>{{ learner.level === 'ELEMENTARY' ? 'A&E Elementary' : (learner.level === 'JUNIOR' || learner.level === 'LOWER_SECONDARY' || learner.level === 'A&E Junior' || learner.level === 'A&E Junior High' ? 'A&E Junior High' : learner.level) }}</td>
              <td>{{ learner.learningCenter }}</td>
              <td>
                <span v-if="learner.assignedTeacher && learner.assignedTeacher !== '—'" style="font-weight: 600; color: #1e40af;">
                  {{ learner.assignedTeacher }}
                </span>
                <span v-else style="color: #94a3b8; font-style: italic;">
                  Unassigned
                </span>
              </td>
              <td>
                <span class="badge" :class="learner.status === 'Active' ? 'badge-success' : 'badge-muted'">
                  {{ learner.status }}
                </span>
              </td>
              <td class="td-actions">
                <div class="cell-actions">
                  <button type="button" class="btn-icon btn-icon-view" title="View" aria-label="View Learner" @click="openViewModal(learner)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button type="button" class="btn-icon btn-icon-edit" title="Edit" aria-label="Edit Learner" @click="openEditModal(learner)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>
                  <button type="button" class="btn-icon btn-icon-danger" title="Delete" aria-label="Delete Learner" @click="openDeleteModal(learner)">
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
      <div v-if="filteredLearners.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <h3>No learners registered yet.</h3>
        <p>Only display learners registered by the Admin.</p>
      </div>
    </div>

    <!-- Register New Learner Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal modal-register-learner">
        <!-- Fixed Modal Header -->
        <div class="modal-header-fixed">
          <div>
            <h2 class="modal-title">{{ editingLearner ? 'Edit Learner' : 'Register New Learner' }}</h2>
            <p class="modal-subtitle">{{ editingLearner ? 'Update learner information in the system.' : 'Add a new ALS learner to the system.' }}</p>
          </div>
          <button
            type="button"
            class="modal-close-btn"
            @click="closeAddModal"
            title="Close"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Modal Form Wrapper -->
        <form class="modal-form-wrapper" @submit.prevent="handleRegisterLearner">
          <!-- Scrollable Modal Body -->
          <div class="modal-body-scrollable">
            <!-- 1. PERSONAL INFORMATION -->
            <div class="form-section-header">
              <span class="section-title">PERSONAL INFORMATION</span>
              <div class="section-line"></div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="learner-first-name">
                  First Name <span class="required">*</span>
                </label>
                <input
                  id="learner-first-name"
                  v-model="learnerForm.firstName"
                  type="text"
                  class="field-input"
                  placeholder="Enter first name"
                  required
                  autocomplete="given-name"
                />
              </div>

              <div class="field-group">
                <label class="field-label" for="learner-middle-name">
                  Middle Name
                </label>
                <input
                  id="learner-middle-name"
                  v-model="learnerForm.middleName"
                  type="text"
                  class="field-input"
                  placeholder="Enter middle name"
                  autocomplete="additional-name"
                />
              </div>
            </div>

            <div class="field-group" style="margin-bottom: 0.85rem;">
              <label class="field-label" for="learner-last-name">
                Last Name <span class="required">*</span>
              </label>
              <input
                id="learner-last-name"
                v-model="learnerForm.lastName"
                type="text"
                class="field-input"
                placeholder="Enter last name"
                required
                autocomplete="family-name"
              />
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="learner-lrn">
                  LRN
                </label>
                <input
                  id="learner-lrn"
                  v-model="learnerForm.lrn"
                  type="text"
                  class="field-input"
                  placeholder="Enter LRN"
                  maxlength="20"
                />
              </div>

              <div class="field-group">
                <label class="field-label" for="learner-dob">
                  Date of Birth <span class="required">*</span>
                </label>
                <input
                  id="learner-dob"
                  v-model="learnerForm.dob"
                  type="date"
                  class="field-input field-date"
                  required
                />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="learner-sex">
                  Sex <span class="required">*</span>
                </label>
                <div class="select-wrapper">
                  <select
                    id="learner-sex"
                    v-model="learnerForm.sex"
                    class="field-select"
                    required
                  >
                    <option value="" disabled selected>Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div class="field-group">
                <label class="field-label" for="learner-contact">Contact Number</label>
                <input
                  id="learner-contact"
                  v-model="learnerForm.contactNumber"
                  type="tel"
                  class="field-input"
                  placeholder="Enter contact number"
                  autocomplete="tel"
                />
              </div>
            </div>

            <div class="field-group" style="margin-bottom: 0.85rem;">
              <label class="field-label" for="learner-address">Address</label>
              <input
                id="learner-address"
                v-model="learnerForm.address"
                type="text"
                class="field-input"
                placeholder="Enter address"
                autocomplete="street-address"
              />
            </div>

            <!-- 2. LEARNING INFORMATION -->
            <div class="form-section-header">
              <span class="section-title">LEARNING INFORMATION</span>
              <div class="section-line"></div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="learner-center">
                  Learning Center <span class="required">*</span>
                </label>
                <div class="select-wrapper">
                  <select
                    id="learner-center"
                    v-model="learnerForm.learningCenterId"
                    class="field-select"
                    required
                  >
                    <option value="" disabled selected>Select learning center</option>
                    <option
                      v-for="center in learningCenters"
                      :key="center.id"
                      :value="center.id"
                    >
                      {{ center.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="field-group">
                <label class="field-label" for="learner-level">
                  ALS Level <span class="required">*</span>
                </label>
                <div class="select-wrapper">
                  <select
                    id="learner-level"
                    v-model="learnerForm.level"
                    class="field-select"
                    required
                  >
                    <option value="" disabled selected>Select ALS level</option>
                    <option value="A&E Elementary">A&E Elementary</option>
                    <option value="A&E Junior High">A&E Junior High</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="learner-teacher">
                  Assigned Teacher
                </label>
                <div class="select-wrapper">
                  <select
                    id="learner-teacher"
                    v-model="learnerForm.assignedTeacherId"
                    class="field-select"
                  >
                    <option value="">-- No Assigned Teacher (Unassigned) --</option>
                    <option
                      v-for="t in teachers"
                      :key="t.id"
                      :value="t.id"
                    >
                      {{ t.fullName || t.name }} ({{ t.learningCenter || 'CLC' }})
                    </option>
                  </select>
                </div>
              </div>

              <div class="field-group">
                <label class="field-label" for="learner-status">Status</label>
                <div class="select-wrapper">
                  <select
                    id="learner-status"
                    v-model="learnerForm.status"
                    class="field-select"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="learner-date-registered">Date Registered</label>
                <input
                  id="learner-date-registered"
                  v-model="learnerForm.dateRegistered"
                  type="date"
                  class="field-input field-date"
                />
              </div>
            </div>

            <!-- 3. PORTAL LOGIN CREDENTIALS -->
            <div class="form-section-header">
              <span class="section-title">PORTAL LOGIN CREDENTIALS</span>
              <div class="section-line"></div>
            </div>

            <!-- Login Information Callout Box -->
            <div class="info-alert-box" style="margin-bottom: 1.15rem;">
              <div class="info-alert-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="info-alert-icon">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="info-alert-content">
                <strong>Automatic Full Name Login:</strong>
                <p>
                  Learners will login directly using their registered <strong>Full Name</strong> (e.g. <code>{{ learnerFullNamePreview || 'Juan Dela Cruz' }}</code>). No separate username generation needed.
                </p>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="learner-login-name">Login Name (Full Name)</label>
                <input
                  id="learner-login-name"
                  :value="learnerFullNamePreview || '—'"
                  type="text"
                  class="field-input"
                  readonly
                  style="background-color: #f8fafc; color: #1e40af; font-weight: 600;"
                />
              </div>

              <div class="field-group">
                <label class="field-label" for="learner-password">Initial Password (Optional)</label>
                <input
                  id="learner-password"
                  v-model="learnerForm.password"
                  type="text"
                  class="field-input"
                  placeholder="Defaults to Full Name if left blank"
                  autocomplete="new-password"
                />
              </div>
            </div>

            <!-- Error message banner -->
            <div v-if="formError" class="form-error-banner">
              {{ formError }}
            </div>
          </div>

          <!-- Fixed Modal Footer -->
          <div class="modal-footer-fixed">
            <button
              type="button"
              class="btn-modal-cancel"
              :disabled="submitting"
              @click="closeAddModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-modal-submit"
              :disabled="submitting"
            >
              {{ submitting ? (editingLearner ? 'Saving…' : 'Registering…') : (editingLearner ? 'Save Changes' : 'Register Learner') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Learner Details Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal" style="max-width: 580px; width: 90%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="modal-header-fixed" style="border-bottom: 1px solid var(--color-border); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 class="modal-title" style="font-size: 1.2rem; font-weight: 700; color: var(--color-text);">Learner Information</h2>
            <p class="modal-subtitle" style="font-size: 0.85rem; color: var(--color-text-secondary);">Comprehensive student record details</p>
          </div>
          <button type="button" class="modal-close-btn" @click="showViewModal = false" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body-scrollable" style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Full Name</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-primary);">{{ viewingLearner?.name || viewingLearner?.fullName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">LRN</span>
              <span class="detail-value">{{ viewingLearner?.lrn || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ALS Level</span>
              <span class="detail-value">{{ viewingLearner?.level === 'ELEMENTARY' ? 'A&E Elementary' : (viewingLearner?.level === 'JUNIOR' || viewingLearner?.level === 'LOWER_SECONDARY' || viewingLearner?.level === 'A&E Junior' || viewingLearner?.level === 'A&E Junior High' ? 'A&E Junior High' : viewingLearner?.level) || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Learning Center</span>
              <span class="detail-value">{{ viewingLearner?.learningCenter || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Assigned Teacher</span>
              <span class="detail-value" style="font-weight: 600; color: #1e40af;">{{ viewingLearner?.assignedTeacher || viewingLearner?.teacher || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="badge" :class="viewingLearner?.status === 'Active' ? 'badge-success' : 'badge-muted'">
                  {{ viewingLearner?.status || 'Active' }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Sex / Gender</span>
              <span class="detail-value">{{ viewingLearner?.sex || viewingLearner?.gender || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date of Birth</span>
              <span class="detail-value">{{ viewingLearner?.dob || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Contact Number</span>
              <span class="detail-value">{{ viewingLearner?.contactNumber || '—' }}</span>
            </div>
            <div class="detail-item details-full-width">
              <span class="detail-label">Address</span>
              <span class="detail-value">{{ viewingLearner?.address || '—' }}</span>
            </div>
            <div class="detail-item details-full-width">
              <span class="detail-label">Date Registered</span>
              <span class="detail-value">{{ viewingLearner?.dateRegistered || '—' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer-fixed" style="border-top: 1px solid var(--color-border); padding: 1rem 1.5rem; display: flex; justify-content: flex-end; background: #f8fafc;">
          <button type="button" class="btn btn-secondary" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      title="Delete Learner"
      :item-name="deletingLearner?.name || deletingLearner?.fullName || ''"
      :loading="deleting"
      @confirm="confirmDeleteLearner"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';
import { getLearningCenters } from '../api/learningCenters.js';
import { getLearners, registerLearner, updateLearner, deleteLearner } from '../api/learners.js';
import { getTeachers } from '../api/teachers.js';

const route = useRoute();

// Delete Modal state
const showDeleteModal = ref(false);
const deletingLearner = ref(null);
const deleting = ref(false);

function openDeleteModal(learner) {
  deletingLearner.value = learner;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  if (deleting.value) return;
  showDeleteModal.value = false;
  deletingLearner.value = null;
}

async function confirmDeleteLearner() {
  if (!deletingLearner.value) return;
  deleting.value = true;
  const name = deletingLearner.value.name || deletingLearner.value.fullName || 'Learner';
  const id = deletingLearner.value.id;
  try {
    await deleteLearner(id);
    showToast(`Learner "${name}" deleted successfully.`);
    showDeleteModal.value = false;
    deletingLearner.value = null;
    await loadLearners();
  } catch (err) {
    console.error('Failed to delete learner:', err);
    showToast(
      err.response?.data?.error || `Failed to delete learner "${name}".`,
      'error'
    );
  } finally {
    deleting.value = false;
  }
}

// Search & Filter state
const searchQuery = ref('');
const selectedCenter = ref('');
const selectedLevel = ref('');
const selectedStatus = ref('');
const loading = ref(false);

const learners = ref([]);
const learningCenters = ref([]);
const teachers = ref([]);

// Modal & Form State
const showAddModal = ref(false);
const showViewModal = ref(false);
const viewingLearner = ref(null);
const editingLearner = ref(null);
const submitting = ref(false);
const formError = ref('');

function getTodayFormatted() {
  return new Date().toISOString().split('T')[0];
}

const learnerForm = reactive({
  lrn: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  sex: '',
  contactNumber: '',
  address: '',
  learningCenterId: '',
  assignedTeacherId: '',
  username: '',
  password: '',
  level: '',
  status: 'Active',
  dateRegistered: getTodayFormatted(),
});

const learnerFullNamePreview = computed(() => {
  const last = (learnerForm.lastName || '').trim();
  const first = (learnerForm.firstName || '').trim();
  const middle = (learnerForm.middleName || '').trim();
  if (last && first) {
    return middle ? `${last}, ${first} ${middle}` : `${last}, ${first}`;
  }
  return [last, first, middle].filter(Boolean).join(' ') || '';
});

// Toast notification system
const toasts = ref([]);
let toastId = 0;

function showToast(message, type = 'success') {
  const id = ++toastId;
  toasts.value.push({ id, message, type, exiting: false });
  setTimeout(() => {
    const item = toasts.value.find((t) => t.id === id);
    if (item) item.exiting = true;
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 300);
  }, 3500);
}

// Filtered learners
const filteredLearners = computed(() => {
  return learners.value.filter((learner) => {
    const query = searchQuery.value.toLowerCase().trim();
    const matchesQuery =
      !query ||
      (learner.name && learner.name.toLowerCase().includes(query)) ||
      (learner.lrn && learner.lrn.toLowerCase().includes(query));

    const matchesCenter =
      !selectedCenter.value || learner.learningCenter === selectedCenter.value;

    const learnerDisplayLevel =
      learner.level === 'ELEMENTARY' ? 'A&E Elementary' :
      learner.level === 'JUNIOR' || learner.level === 'LOWER_SECONDARY' || learner.level === 'A&E Junior' || learner.level === 'A&E Junior High' ? 'A&E Junior High' : learner.level;
    const matchesLevel =
      !selectedLevel.value || learnerDisplayLevel === selectedLevel.value;

    const matchesStatus =
      !selectedStatus.value || learner.status === selectedStatus.value;

    return matchesQuery && matchesCenter && matchesLevel && matchesStatus;
  });
});

function openViewModal(learner) {
  viewingLearner.value = learner;
  showViewModal.value = true;
}

function openEditModal(learner) {
  editingLearner.value = learner;
  formError.value = '';

  let firstName = learner.firstName || '';
  let middleName = learner.middleName || '';
  let lastName = learner.lastName || '';

  // Fallback parsing if firstName/lastName not directly present
  if (!firstName && !lastName) {
    const raw = learner.name || learner.fullName || '';
    if (raw.includes(',')) {
      const [lastPart, rest] = raw.split(',').map((s) => s.trim());
      lastName = lastPart;
      const restParts = (rest || '').split(' ').filter(Boolean);
      firstName = restParts[0] || '';
      middleName = restParts.slice(1).join(' ');
    } else {
      const parts = raw.split(' ').filter(Boolean);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }
  }

  const matchedCenter = learningCenters.value.find((c) => c.name === learner.learningCenter || c.id === learner.learningCenterId);

  let levelDisplay = learner.level || '';
  if (levelDisplay === 'ELEMENTARY') levelDisplay = 'A&E Elementary';
  else if (levelDisplay === 'JUNIOR' || levelDisplay === 'LOWER_SECONDARY' || levelDisplay === 'A&E Junior' || levelDisplay === 'A&E Junior High') levelDisplay = 'A&E Junior High';

  learnerForm.lrn = learner.lrn || '';
  learnerForm.firstName = firstName;
  learnerForm.middleName = middleName;
  learnerForm.lastName = lastName;
  learnerForm.dob = learner.dob || '';
  learnerForm.sex = learner.sex || learner.gender || 'Male';
  learnerForm.contactNumber = learner.contactNumber || '';
  learnerForm.address = learner.address || '';
  learnerForm.learningCenterId = matchedCenter?.id || learningCenters.value[0]?.id || '';
  learnerForm.assignedTeacherId = learner.assignedTeacherId || '';
  learnerForm.username = learner.username || '';
  learnerForm.password = '';
  learnerForm.level = levelDisplay;
  learnerForm.status = learner.status || 'Active';
  learnerForm.dateRegistered = learner.dateRegistered || getTodayFormatted();
  showAddModal.value = true;
}

function openAddModal() {
  editingLearner.value = null;
  formError.value = '';
  learnerForm.lrn = '';
  learnerForm.firstName = '';
  learnerForm.middleName = '';
  learnerForm.lastName = '';
  learnerForm.dob = '';
  learnerForm.sex = '';
  learnerForm.contactNumber = '';
  learnerForm.address = '';
  learnerForm.learningCenterId = learningCenters.value[0]?.id || '';
  learnerForm.assignedTeacherId = teachers.value[0]?.id || '';
  learnerForm.username = '';
  learnerForm.password = '';
  learnerForm.level = '';
  learnerForm.status = 'Active';
  learnerForm.dateRegistered = getTodayFormatted();
  showAddModal.value = true;
}

function closeAddModal() {
  if (submitting.value) return;
  showAddModal.value = false;
  editingLearner.value = null;
  formError.value = '';
}

async function loadCenters() {
  try {
    const { data } = await getLearningCenters();
    learningCenters.value = data;
    if (learningCenters.value.length > 0 && !learnerForm.learningCenterId) {
      learnerForm.learningCenterId = learningCenters.value[0].id;
    }
  } catch (err) {
    console.error('Failed to load learning centers:', err);
  }
}

async function loadTeachers() {
  try {
    const { data } = await getTeachers();
    teachers.value = Array.isArray(data) ? data : [];
    if (teachers.value.length > 0 && !learnerForm.assignedTeacherId && !editingLearner.value) {
      learnerForm.assignedTeacherId = teachers.value[0].id;
    }
  } catch (err) {
    console.error('Failed to load teachers:', err);
  }
}

async function loadLearners() {
  loading.value = true;
  try {
    const { data } = await getLearners();
    if (Array.isArray(data)) {
      learners.value = data;
    }
  } catch {
    // Graceful fallback
  } finally {
    loading.value = false;
  }
}

async function handleRegisterLearner() {
  formError.value = '';

  // Validations
  if (!learnerForm.firstName.trim()) {
    formError.value = 'First name is required.';
    return;
  }
  if (!learnerForm.lastName.trim()) {
    formError.value = 'Last name is required.';
    return;
  }
  if (!learnerForm.dob) {
    formError.value = 'Date of birth is required.';
    return;
  }
  if (!learnerForm.sex) {
    formError.value = 'Please select sex.';
    return;
  }
  if (!learnerForm.learningCenterId) {
    formError.value = 'Please select a learning center.';
    return;
  }
  if (!learnerForm.level) {
    formError.value = 'Please select an ALS level.';
    return;
  }

  submitting.value = true;
  const first = learnerForm.firstName.trim();
  const middle = learnerForm.middleName ? learnerForm.middleName.trim() : '';
  const last = learnerForm.lastName.trim();
  const fullName = middle ? `${last}, ${first} ${middle}` : `${last}, ${first}`;

  let apiLevel = 'JUNIOR';
  if (learnerForm.level === 'A&E Elementary' || learnerForm.level === 'ELEMENTARY') {
    apiLevel = 'ELEMENTARY';
  } else if (learnerForm.level === 'A&E Junior High' || learnerForm.level === 'A&E Junior' || learnerForm.level === 'JUNIOR') {
    apiLevel = 'JUNIOR';
  }

  const payload = {
    lrn: learnerForm.lrn.trim() || undefined,
    firstName: first,
    middleName: middle || null,
    lastName: last,
    dob: learnerForm.dob,
    sex: learnerForm.sex,
    contactNumber: learnerForm.contactNumber.trim(),
    address: learnerForm.address.trim(),
    learningCenterId: learnerForm.learningCenterId,
    assignedTeacherId: learnerForm.assignedTeacherId ? parseInt(learnerForm.assignedTeacherId, 10) : null,
    username: learnerForm.username ? learnerForm.username.trim() : undefined,
    password: learnerForm.password ? learnerForm.password.trim() : undefined,
    level: apiLevel,
    status: learnerForm.status,
    dateRegistered: learnerForm.dateRegistered,
  };

  // If editing an existing learner
  if (editingLearner.value) {
    try {
      const { data } = await updateLearner(editingLearner.value.id, payload);
      const idx = learners.value.findIndex((l) => l.id === editingLearner.value.id);
      if (idx !== -1) {
        learners.value[idx] = data;
      }
      showToast(`Learner "${fullName}" updated successfully.`);
      showAddModal.value = false;
      editingLearner.value = null;
    } catch (err) {
      formError.value = err.response?.data?.error || 'Failed to update learner.';
    } finally {
      submitting.value = false;
    }
    return;
  }

  try {
    const { data } = await registerLearner(payload);
    showToast(`Learner "${data.name || fullName}" registered successfully.`);
    showAddModal.value = false;
    await loadLearners();
  } catch (err) {
    if (err.response?.data?.error) {
      formError.value = err.response.data.error;
      return;
    }
    formError.value = 'Failed to register learner. Please check your network or server.';
  } finally {
    submitting.value = false;
  }
}

function applyRouteSearchAndView() {
  if (route.query.search) {
    searchQuery.value = String(route.query.search);
  }
  if (route.query.view) {
    const targetId = Number(route.query.view);
    const found = learners.value.find((l) => Number(l.id) === targetId);
    if (found) {
      openViewModal(found);
    }
  }
}

watch(
  () => [route.query.search, route.query.view],
  () => {
    applyRouteSearchAndView();
  }
);

onMounted(async () => {
  await Promise.all([loadCenters(), loadTeachers(), loadLearners()]);
  if (route.query.add === 'true' || route.query.add === '1') {
    openAddModal();
  }
  applyRouteSearchAndView();
});
</script>

<style scoped>
.modal-register-learner {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
  overflow: hidden;
  animation: modalEnter 0.22s ease-out;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Fixed Header */
.modal-header-fixed {
  padding: 1.5rem 1.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-shrink: 0;
  background: #ffffff;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
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

/* Form Wrapper */
.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Scrollable Body */
.modal-body-scrollable {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 1.75rem 1.25rem;
}

/* Section Header */
.form-section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.15rem 0 0.85rem;
}

.form-section-header:first-child {
  margin-top: 0.25rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.section-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

/* 2-Column Responsive Grid */
.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

@media (max-width: 600px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

/* Field Styles */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.field-input,
.field-select {
  width: 100%;
  padding: 0.625rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #0f172a;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
  box-sizing: border-box;
}

.field-input:focus,
.field-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.field-input::placeholder {
  color: #94a3b8;
}

.field-date {
  color: #0f172a;
}

.field-date::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.15s;
}

.field-date::-webkit-calendar-picker-indicator:hover {
  opacity: 0.9;
}

.select-wrapper {
  position: relative;
}

.field-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 16px;
  padding-right: 2.25rem;
  cursor: pointer;
}

/* Callout Box */
.info-alert-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-top: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  box-sizing: border-box;
}

.info-alert-icon-wrap {
  flex-shrink: 0;
  margin-top: 1px;
}

.info-alert-icon {
  color: #2563eb;
}

.info-alert-content {
  flex: 1;
}

.info-alert-content strong {
  display: block;
  font-size: 0.875rem;
  color: #1e40af;
  font-weight: 700;
  margin-bottom: 2px;
}

.info-alert-content p {
  font-size: 0.8125rem;
  color: #1d4ed8;
  margin: 0;
  line-height: 1.45;
}

/* Form Error Banner */
.form-error-banner {
  margin-top: 0.85rem;
  padding: 0.65rem 0.85rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
}

/* Fixed Footer */
.modal-footer-fixed {
  padding: 1.15rem 1.75rem 1.5rem;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
  box-sizing: border-box;
}

.btn-modal-cancel {
  background: #f1f5f9;
  border: 1px solid transparent;
  color: #334155;
  border-radius: 8px;
  padding: 0.625rem 1.35rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.btn-modal-cancel:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-modal-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-modal-submit {
  background: #165dfc;
  border: 1px solid #165dfc;
  color: #ffffff;
  border-radius: 8px;
  padding: 0.625rem 1.35rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.btn-modal-submit:hover:not(:disabled) {
  background: #0d4ed8;
  border-color: #0d4ed8;
}

.btn-modal-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .modal-register-learner {
    max-height: 94vh;
    border-radius: 12px;
  }

  .modal-header-fixed {
    padding: 1.125rem 1.25rem 0.85rem;
  }

  .modal-body-scrollable {
    padding: 0 1.25rem 1rem;
  }

  .modal-footer-fixed {
    padding: 1rem 1.25rem 1.25rem;
  }
}
</style>

<template>
  <div class="page-container">
    <!-- Toast Notifications -->
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
      <span class="breadcrumb-current">Teachers</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Teachers / Implementors</h1>
        <p>Manage ALS teachers and implementors.</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add Teacher</span>
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
          placeholder="Search teachers..."
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
        <p>Loading teachers…</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="table-card">
      <div class="empty-state-box">
        <div class="empty-state-graphic" style="background: var(--color-error-light); color: var(--color-error);">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h3>Failed to load teachers</h3>
        <p>{{ loadError }}</p>
        <button class="btn btn-secondary" style="margin-top: 1rem;" @click="loadTeachers">Try Again</button>
      </div>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">No.</th>
              <th>Name</th>
              <th>Username</th>
              <th>Position</th>
              <th>Learning Center</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(teacher, idx) in filteredTeachers" :key="teacher.id">
              <td>{{ idx + 1 }}</td>
              <td class="table-cell-name">{{ teacher.name }}</td>
              <td style="font-family: monospace; font-size: 0.85rem; font-weight: 400; color: var(--color-text);">
                {{ teacher.username || '—' }}
              </td>
              <td>{{ teacher.position || 'ALS Teacher' }}</td>
              <td>{{ teacher.learningCenter }}</td>
              <td>
                <span class="badge" :class="teacher.status === 'Active' ? 'badge-success' : 'badge-muted'">
                  {{ teacher.status }}
                </span>
              </td>
              <td class="td-actions">
                <div class="cell-actions">
                  <button type="button" class="btn-icon btn-icon-view" title="View" aria-label="View Teacher" @click="openViewModal(teacher)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button type="button" class="btn-icon btn-icon-edit" title="Edit" aria-label="Edit Teacher" @click="openEditModal(teacher)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>
                  <button type="button" class="btn-icon btn-icon-danger" title="Delete" aria-label="Delete Teacher" @click="openDeleteModal(teacher)">
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
      <div v-if="filteredTeachers.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
          </svg>
        </div>
        <h3>No ALS Teachers registered yet.</h3>
        <p>Only display teachers that are added through the Add Teacher form.</p>
      </div>
    </div>

    <!-- Register New Teacher Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-register-teacher">
        <!-- Modal Header -->
        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ editingTeacher ? 'Edit Teacher' : 'Register New Teacher' }}</h2>
            <p class="modal-subtitle">{{ editingTeacher ? 'Update ALS teacher information.' : 'Add a new ALS teacher/implementor to the system.' }}</p>
          </div>
          <button type="button" class="modal-close" @click="closeModal" title="Close" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Modal Body Form -->
        <form class="modal-form" @submit.prevent="handleRegisterTeacher">
          <div class="modal-body-scroll">
            <!-- 1. PERSONAL INFORMATION -->
            <div class="form-section-header">
              <span class="section-title">PERSONAL INFORMATION</span>
              <div class="section-line"></div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label">First Name <span class="required">*</span></label>
                <input
                  v-model="teacherForm.firstName"
                  type="text"
                  class="field-input"
                  placeholder="Enter first name"
                  required
                  autocomplete="given-name"
                />
              </div>

              <div class="field-group">
                <label class="field-label">Last Name <span class="required">*</span></label>
                <input
                  v-model="teacherForm.lastName"
                  type="text"
                  class="field-input"
                  placeholder="Enter last name"
                  required
                  autocomplete="family-name"
                />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label">Contact Number</label>
                <input
                  v-model="teacherForm.contactNumber"
                  type="tel"
                  class="field-input"
                  placeholder="Enter contact number"
                  autocomplete="tel"
                />
              </div>

              <div class="field-group">
                <label class="field-label">Email Address</label>
                <input
                  v-model="teacherForm.email"
                  type="email"
                  class="field-input"
                  placeholder="Enter email address"
                  autocomplete="email"
                />
              </div>
            </div>

            <!-- 2. ASSIGNMENT -->
            <div class="form-section-header">
              <span class="section-title">ASSIGNMENT</span>
              <div class="section-line"></div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label">Learning Center <span class="required">*</span></label>
                <div class="select-wrapper">
                  <select v-model="teacherForm.learningCenterId" class="field-select" required>
                    <option value="" disabled>Select learning center</option>
                    <option v-for="center in learningCenters" :key="center.id" :value="center.id">
                      {{ center.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Assigned ALS Level <span class="required">*</span></label>
                <div class="select-wrapper">
                  <select v-model="teacherForm.programLevel" class="field-select" required>
                    <option value="Both">Both (A&E Elementary & Junior High)</option>
                    <option value="A&E Elementary">A&E Elementary</option>
                    <option value="A&E Junior High">A&E Junior High</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label">Status</label>
                <div class="select-wrapper">
                  <select v-model="teacherForm.status" class="field-select">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 3. SYSTEM LOGIN CREDENTIALS -->
            <div class="form-section-header">
              <span class="section-title">SYSTEM LOGIN CREDENTIALS</span>
              <div class="section-line"></div>
            </div>

            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label">Username <span class="required">*</span></label>
                <input
                  v-model="teacherForm.username"
                  type="text"
                  class="field-input"
                  placeholder="e.g. als-t1001"
                  required
                  autocomplete="off"
                  @input="handleUsernameInput"
                />
                <span class="field-hint" style="font-size: 0.775rem; color: #64748b; margin-top: 0.35rem; display: block;">
                  Auto-generated format: <code>als-t1001</code>. You can edit this username before saving.
                </span>
              </div>

              <div class="field-group">
                <label class="field-label">Password <span class="required">*</span></label>
                <div class="input-with-action">
                  <input
                    v-model="teacherForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    class="field-input password-input"
                    placeholder="Enter password"
                    required
                    autocomplete="new-password"
                    @input="teacherForm.passwordModified = true"
                  />
                  <button
                    type="button"
                    class="toggle-pwd-btn"
                    :title="showPassword ? 'Hide password' : 'Show password'"
                    aria-label="Toggle password visibility"
                    @click="showPassword = !showPassword"
                  >
                    <!-- Eye Off (visible) -->
                    <svg v-if="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <!-- Eye Slashed (hidden) -->
                    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Informational box -->
            <div class="info-alert-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="info-alert-icon">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <div class="info-alert-content">
                <strong>Default Password:</strong> The teacher's username will be used as their initial password. The teacher can change the password after logging in.
              </div>
            </div>

            <!-- Error banner inside modal -->
            <div v-if="formError" class="form-error-banner">
              {{ formError }}
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button type="button" class="btn btn-modal-cancel" :disabled="submitting" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span>{{ submitting ? (editingTeacher ? 'Saving…' : 'Registering…') : (editingTeacher ? 'Save Changes' : 'Register Teacher') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Teacher Details Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal" style="max-width: 580px; width: 90%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="modal-header" style="border-bottom: 1px solid var(--color-border); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 class="modal-title" style="font-size: 1.2rem; font-weight: 700; color: var(--color-text);">Teacher Information</h2>
            <p class="modal-subtitle" style="font-size: 0.85rem; color: var(--color-text-secondary);">ALS Implementor and Teacher Profile</p>
          </div>
          <button type="button" class="modal-close" @click="showViewModal = false" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body-scroll" style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Full Name</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-primary);">{{ viewingTeacher?.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Position / Role</span>
              <span class="detail-value">{{ viewingTeacher?.position || 'ALS Teacher' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Learning Center</span>
              <span class="detail-value">{{ viewingTeacher?.learningCenter || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Assigned ALS Level</span>
              <span class="detail-value">{{ viewingTeacher?.programLevel || viewingTeacher?.specialization || 'Both' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="badge" :class="viewingTeacher?.status === 'Active' ? 'badge-success' : 'badge-muted'">
                  {{ viewingTeacher?.status || 'Active' }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Username</span>
              <span class="detail-value" style="font-family: monospace;">{{ viewingTeacher?.username || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email Address</span>
              <span class="detail-value">{{ viewingTeacher?.email || '—' }}</span>
            </div>
            <div class="detail-item details-full-width">
              <span class="detail-label">Contact Number</span>
              <span class="detail-value">{{ viewingTeacher?.contactNumber || viewingTeacher?.contactNo || '—' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="border-top: 1px solid var(--color-border); padding: 1rem 1.5rem; display: flex; justify-content: flex-end; background: #f8fafc;">
          <button type="button" class="btn btn-secondary" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      title="Delete Teacher"
      message="Are you sure you want to delete this teacher?"
      :item-name="deletingTeacher?.name || ''"
      :loading="deleting"
      @confirm="confirmDeleteTeacher"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';
import { getLearningCenters } from '../api/learningCenters.js';
import {
  getTeachers,
  registerTeacher,
  updateTeacher,
  deleteTeacher,
  getNextTeacherUsername,
  checkTeacherUsername,
} from '../api/teachers.js';

// Delete Modal state
const showDeleteModal = ref(false);
const deletingTeacher = ref(null);
const deleting = ref(false);

function openDeleteModal(teacher) {
  deletingTeacher.value = teacher;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  if (deleting.value) return;
  showDeleteModal.value = false;
  deletingTeacher.value = null;
}

async function confirmDeleteTeacher() {
  if (!deletingTeacher.value) return;
  deleting.value = true;
  const name = deletingTeacher.value.name || 'Teacher';
  const id = deletingTeacher.value.id;
  try {
    await deleteTeacher(id);
    showToast(`Teacher "${name}" deleted successfully.`);
    showDeleteModal.value = false;
    deletingTeacher.value = null;
    await loadTeachers();
  } catch (err) {
    console.error('Failed to delete teacher:', err);
    showToast(
      err.response?.data?.error || `Failed to delete teacher "${name}".`,
      'error'
    );
  } finally {
    deleting.value = false;
  }
}

// Table filters & state
const searchQuery = ref('');
const selectedCenter = ref('');
const selectedStatus = ref('');
const loading = ref(false);
const loadError = ref(null);

const teachers = ref([]);
const learningCenters = ref([]);

// Modal & form state
const showAddModal = ref(false);
const showViewModal = ref(false);
const viewingTeacher = ref(null);
const editingTeacher = ref(null);
const showPassword = ref(false);
const submitting = ref(false);
const formError = ref('');

const teacherForm = reactive({
  firstName: '',
  lastName: '',
  contactNumber: '',
  email: '',
  learningCenterId: '',
  programLevel: 'Both',
  status: 'Active',
  username: '',
  password: '',
  passwordModified: false,
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

// Filtered teachers computed property
const filteredTeachers = computed(() => {
  return teachers.value.filter((teacher) => {
    const query = searchQuery.value.toLowerCase().trim();
    const matchesQuery =
      !query ||
      (teacher.name && teacher.name.toLowerCase().includes(query)) ||
      (teacher.username && teacher.username.toLowerCase().includes(query)) ||
      (teacher.email && teacher.email.toLowerCase().includes(query));

    const matchesCenter =
      !selectedCenter.value || teacher.learningCenter === selectedCenter.value;

    const matchesStatus =
      !selectedStatus.value || teacher.status === selectedStatus.value;

    return matchesQuery && matchesCenter && matchesStatus;
  });
});

// Automatically set default password when username changes if not manually modified
function handleUsernameInput() {
  if (!teacherForm.passwordModified) {
    teacherForm.password = teacherForm.username;
  }
}

function openViewModal(teacher) {
  viewingTeacher.value = teacher;
  showViewModal.value = true;
}

function openEditModal(teacher) {
  editingTeacher.value = teacher;
  formError.value = '';
  showPassword.value = false;

  const nameParts = (teacher.name || '').split(' ');
  const firstName = teacher.firstName || nameParts[0] || '';
  const lastName = teacher.lastName || nameParts.slice(1).join(' ') || '';

  const matchedCenter = learningCenters.value.find(
    (c) => c.name === teacher.learningCenter || c.id === teacher.learningCenterId
  );

  teacherForm.firstName = firstName;
  teacherForm.lastName = lastName;
  teacherForm.contactNumber = teacher.contactNumber || teacher.contactNo || '';
  teacherForm.email = teacher.email || '';
  teacherForm.learningCenterId = matchedCenter?.id || learningCenters.value[0]?.id || '';
  teacherForm.programLevel = teacher.programLevel || teacher.specialization || 'Both';
  teacherForm.status = teacher.status || 'Active';
  teacherForm.username = teacher.username || '';
  teacherForm.password = '••••••••';
  teacherForm.passwordModified = true;
  showAddModal.value = true;
}

async function openAddModal() {
  editingTeacher.value = null;
  formError.value = '';
  showPassword.value = false;
  teacherForm.firstName = '';
  teacherForm.lastName = '';
  teacherForm.contactNumber = '';
  teacherForm.email = '';
  teacherForm.learningCenterId = learningCenters.value[0]?.id || '';
  teacherForm.programLevel = 'Both';
  teacherForm.status = 'Active';
  teacherForm.password = '';
  teacherForm.passwordModified = false;

  // Auto-generate username in format als-t1001, als-t1002, ...
  try {
    const { data } = await getNextTeacherUsername();
    teacherForm.username = data?.nextUsername || 'als-t1001';
  } catch (err) {
    teacherForm.username = 'als-t1001';
  }
  teacherForm.password = teacherForm.username;

  showAddModal.value = true;
}

function closeModal() {
  if (submitting.value) return;
  showAddModal.value = false;
  editingTeacher.value = null;
  formError.value = '';
}

// Data loading functions
async function loadCenters() {
  try {
    const { data } = await getLearningCenters();
    learningCenters.value = data;
  } catch (err) {
    console.error('Failed to load learning centers:', err);
  }
}

async function loadTeachers() {
  loading.value = true;
  loadError.value = null;
  try {
    const { data } = await getTeachers();
    teachers.value = data;
  } catch (err) {
    console.error('Failed to load teachers:', err);
    loadError.value =
      err.response?.data?.error ||
      'Could not connect to the server. Make sure the backend is running.';
  } finally {
    loading.value = false;
  }
}

// Register Teacher submission
async function handleRegisterTeacher() {
  formError.value = '';

  // Validation
  if (!teacherForm.firstName.trim()) {
    formError.value = 'First name is required.';
    return;
  }
  if (!teacherForm.lastName.trim()) {
    formError.value = 'Last name is required.';
    return;
  }
  if (!teacherForm.learningCenterId) {
    formError.value = 'Please select a learning center.';
    return;
  }
  if (!teacherForm.username.trim()) {
    formError.value = 'Username is required.';
    return;
  }
  if (teacherForm.username.trim().length < 3) {
    formError.value = 'Username must be at least 3 characters long.';
    return;
  }

  // If creating new teacher and password was not modified or is empty, use username as default password
  if (!editingTeacher.value && (!teacherForm.passwordModified || !teacherForm.password.trim())) {
    teacherForm.password = teacherForm.username.trim();
  }

  if (!teacherForm.password.trim()) {
    formError.value = 'Password is required.';
    return;
  }
  if (teacherForm.password.trim().length < 6) {
    formError.value = 'Password must be at least 6 characters long.';
    return;
  }
  if (teacherForm.email && teacherForm.email.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(teacherForm.email.trim())) {
      formError.value = 'Please enter a valid email address.';
      return;
    }
  }

  submitting.value = true;

  if (editingTeacher.value) {
    try {
      const fullName = `${teacherForm.firstName.trim()} ${teacherForm.lastName.trim()}`;
      const payload = {
        firstName: teacherForm.firstName.trim(),
        lastName: teacherForm.lastName.trim(),
        contactNumber: teacherForm.contactNumber.trim(),
        email: teacherForm.email.trim() || undefined,
        learningCenterId: teacherForm.learningCenterId,
        programLevel: teacherForm.programLevel,
        status: teacherForm.status,
        username: teacherForm.username.trim().toLowerCase(),
      };
      if (teacherForm.password && teacherForm.password !== '••••••••' && teacherForm.password.trim()) {
        payload.password = teacherForm.password.trim();
      }

      const { data } = await updateTeacher(editingTeacher.value.id, payload);
      const idx = teachers.value.findIndex((t) => t.id === editingTeacher.value.id);
      if (idx !== -1) {
        teachers.value[idx] = data;
      }
      showToast(`Teacher "${fullName}" updated successfully.`);
      showAddModal.value = false;
      editingTeacher.value = null;
    } catch (err) {
      formError.value = err.response?.data?.error || 'Failed to update teacher.';
    } finally {
      submitting.value = false;
    }
    return;
  }

  try {
    const payload = {
      firstName: teacherForm.firstName.trim(),
      lastName: teacherForm.lastName.trim(),
      contactNumber: teacherForm.contactNumber.trim(),
      email: teacherForm.email.trim() || undefined,
      learningCenterId: teacherForm.learningCenterId,
      programLevel: teacherForm.programLevel,
      status: teacherForm.status,
      username: teacherForm.username.trim().toLowerCase(),
      password: teacherForm.password.trim(),
    };

    const { data } = await registerTeacher(payload);
    showToast(`Teacher "${data.name}" registered successfully.`);
    showAddModal.value = false;
    await loadTeachers();
  } catch (err) {
    formError.value =
      err.response?.data?.error || 'Failed to register teacher. Please try again.';
  } finally {
    submitting.value = false;
  }
}

const route = useRoute();

function applyTeacherRouteQuery() {
  if (route.query.search) {
    searchQuery.value = String(route.query.search);
  }
  if (route.query.view) {
    const targetId = Number(route.query.view);
    const found = teachers.value.find((t) => Number(t.id) === targetId);
    if (found) {
      viewingTeacher.value = found;
      showViewModal.value = true;
    }
  }
}

watch(
  () => [route.query.search, route.query.view],
  () => {
    applyTeacherRouteQuery();
  }
);

onMounted(async () => {
  await Promise.all([loadCenters(), loadTeachers()]);
  applyTeacherRouteQuery();
});
</script>

<style scoped>
/* Modal Specific Styles matching reference image */
.modal-register-teacher {
  max-width: 640px;
  width: 100%;
  max-height: 90vh;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden !important;
  overflow-y: hidden !important;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem 1.75rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
  background: #ffffff;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.modal-body-scroll {
  padding: 1.25rem 1.75rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* Section Dividers */
.form-section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0 0.85rem;
}

.form-section-header:first-child {
  margin-top: 0;
}

.section-title {
  font-size: 0.725rem;
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

/* Form Fields */
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
}

.field-input:focus,
.field-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.field-input::placeholder {
  color: #94a3b8;
}

.select-wrapper {
  position: relative;
}

.field-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 16px;
  padding-right: 2.25rem;
  cursor: pointer;
}

/* Password with eye icon */
.input-with-action {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-right: 2.5rem;
}

.toggle-pwd-btn {
  position: absolute;
  right: 0.65rem;
  background: none;
  border: none;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s ease;
}

.toggle-pwd-btn:hover {
  color: #475569;
}

/* Information Box */
.info-alert-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-top: 0.85rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.45;
}

.info-alert-icon {
  color: #2563eb;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-alert-content {
  color: #1e40af;
}

.info-alert-content strong {
  color: #1d4ed8;
  font-weight: 600;
}

/* Form Error Banner */
.form-error-banner {
  margin-top: 1rem;
  padding: 0.65rem 0.85rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
}

/* Modal Footer */
.modal-footer {
  padding: 1rem 1.75rem;
  border-top: 1px solid #f1f5f9;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-modal-cancel {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #1e3a8a;
  border-radius: 8px;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.btn-modal-cancel:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #1d4ed8;
}

.btn-modal-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-footer .btn-primary {
  padding: 0.625rem 1.25rem;
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: 8px;
}

@media (max-width: 600px) {
  .modal-register-teacher {
    max-height: 92vh;
    border-radius: 12px;
  }

  .modal-header {
    padding: 1.125rem 1.25rem;
  }

  .modal-body-scroll {
    padding: 1rem 1.25rem;
  }

  .modal-footer {
    padding: 0.875rem 1.25rem;
  }
}
</style>

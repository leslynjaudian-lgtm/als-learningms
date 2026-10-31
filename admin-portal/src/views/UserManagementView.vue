<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/dashboard">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">User Management</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>User Management</h1>
        <p>Manage all system users (Teachers / Implementors and Learners).</p>
      </div>
    </div>

    <!-- 3 Summary / Stat Cards -->
    <div class="stats-grid-3">
      <!-- Total Users -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Total Users</span>
          <span class="stat-number">{{ stats.totalUsers }}</span>
          <span class="stat-status-text">{{ stats.totalUsers === 0 ? 'No users yet' : 'Registered users' }}</span>
        </div>
      </div>

      <!-- Teachers / Implementors -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Teachers / Implementors</span>
          <span class="stat-number">{{ stats.teachers }}</span>
          <span class="stat-status-text">{{ stats.teachers === 0 ? 'No teachers yet' : 'Active teachers' }}</span>
        </div>
      </div>

      <!-- Learners -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Learners</span>
          <span class="stat-number">{{ stats.learners }}</span>
          <span class="stat-status-text">{{ stats.learners === 0 ? 'No learners yet' : 'Enrolled learners' }}</span>
        </div>
      </div>
    </div>

    <!-- Tabs Row with + Add User Button -->
    <div class="tab-row-with-action">
      <div class="tab-group-inline">
        <button
          v-for="tab in roleTabs"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === tab }"
          @click="selectTab(tab)"
        >
          {{ tab }}
        </button>
      </div>

      <button class="btn btn-primary" @click="openAddModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add User</span>
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
          placeholder="Search users..."
        />
      </div>

      <div class="filter-dropdown-group">
        <div class="filter-dropdown-item">
          <label>User Type</label>
          <select v-model="selectedUserType" class="filter-select">
            <option value="">All</option>
            <option value="Teacher / Implementor">Teacher / Implementor</option>
            <option value="Learner">Learner</option>
          </select>
        </div>

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

        <button class="btn-outline" @click="clearFilters">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
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
              <th>#</th>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>User Type</th>
              <th>Learning Center</th>
              <th>Status</th>
              <th>Date Registered</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, idx) in paginatedUsers" :key="user.id">
              <td>{{ (currentPage - 1) * rowsPerPage + idx + 1 }}</td>
              <td style="font-weight: 600;">{{ user.name }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email || '—' }}</td>
              <td>
                <span class="badge" :class="user.userType === 'Teacher / Implementor' ? 'badge-muted' : 'badge-success'">
                  {{ user.userType }}
                </span>
              </td>
              <td>{{ user.learningCenter || '—' }}</td>
              <td>
                <span class="badge" :class="user.status === 'Active' ? 'badge-success' : 'badge-muted'">
                  {{ user.status }}
                </span>
              </td>
              <td>{{ user.dateRegistered || '—' }}</td>
              <td class="td-actions">
                <div class="cell-actions">
                  <button type="button" class="btn-icon btn-icon-view" title="View" aria-label="View User" @click="openViewModal(user)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button type="button" class="btn-icon btn-icon-edit" title="Edit" aria-label="Edit User" @click="editUser(user)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>
                  <button type="button" class="btn-icon btn-icon-danger" title="Delete" aria-label="Delete User" @click="openDeleteModal(user)">
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
      <div v-if="filteredUsers.length === 0" class="empty-state-box" style="padding: 3.5rem 1.5rem;">
        <div class="empty-state-graphic" style="width: 80px; height: 80px;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <h3>No users yet</h3>
        <p>User accounts will appear here once they are added to the system.</p>
        <button class="btn btn-primary" style="margin-top: 1.25rem;" @click="openAddModal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Add First User</span>
        </button>
      </div>

      <!-- Table Pagination Footer -->
      <div class="table-pagination-row">
        <div>
          Showing {{ filteredUsers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1 }} to {{ Math.min(currentPage * rowsPerPage, filteredUsers.length) }} of {{ filteredUsers.length }} entries
        </div>

        <div class="pagination-controls">
          <div class="pagination-rows-select">
            <span>Rows per page:</span>
            <select v-model.number="rowsPerPage" class="filter-select" style="padding: 0.25rem 1.5rem 0.25rem 0.5rem;">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>

          <div class="pagination-nav-group">
            <button
              class="pagination-btn"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              &lt; Previous
            </button>
            <button
              class="pagination-btn"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit User Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingUser ? 'Edit User' : 'Add User' }}</h2>
          <button class="modal-close" @click="showModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUser">
            <div class="form-group">
              <label class="form-label">Full Name <span class="required">*</span></label>
              <input v-model="form.name" type="text" class="form-input" placeholder="e.g. Juan Dela Cruz" required />
            </div>

            <div class="form-group">
              <label class="form-label">Username <span class="required">*</span></label>
              <input v-model="form.username" type="text" class="form-input" placeholder="e.g. jdelacruz" required />
            </div>

            <div class="form-group">
              <label class="form-label">Email</label>
              <input v-model="form.email" type="email" class="form-input" placeholder="e.g. user@example.com" />
            </div>

            <div class="form-group">
              <label class="form-label">User Type <span class="required">*</span></label>
              <select v-model="form.userType" class="form-select-full" required>
                <option value="Teacher / Implementor">Teacher / Implementor</option>
                <option value="Learner">Learner</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Learning Center <span class="required">*</span></label>
              <select v-model="form.learningCenter" class="form-select-full" required>
                <option value="" disabled>Select learning center</option>
                <option v-for="center in learningCenters" :key="center.id" :value="center.name">
                  {{ center.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="form.status" class="form-select-full">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">
                {{ editingUser ? 'Save Changes' : 'Add User' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View User Details Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal" style="max-width: 540px; width: 90%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="modal-header" style="border-bottom: 1px solid var(--color-border); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 class="modal-title" style="font-size: 1.2rem; font-weight: 700; color: var(--color-text);">User Account Details</h2>
            <p class="modal-subtitle" style="font-size: 0.85rem; color: var(--color-text-secondary);">Account Profile & Credentials Info</p>
          </div>
          <button type="button" class="modal-close" @click="showViewModal = false" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Full Name</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-primary);">{{ viewingUser?.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Username</span>
              <span class="detail-value" style="font-family: monospace;">{{ viewingUser?.username }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">User Type</span>
              <span class="detail-value">
                <span class="badge" :class="viewingUser?.userType === 'Teacher / Implementor' ? 'badge-muted' : 'badge-success'">
                  {{ viewingUser?.userType }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="badge" :class="viewingUser?.status === 'Active' ? 'badge-success' : 'badge-muted'">
                  {{ viewingUser?.status }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ viewingUser?.email || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Learning Center</span>
              <span class="detail-value">{{ viewingUser?.learningCenter || '—' }}</span>
            </div>
            <div class="detail-item details-full-width">
              <span class="detail-label">Date Registered</span>
              <span class="detail-value">{{ viewingUser?.dateRegistered || '—' }}</span>
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
      title="Delete User"
      :item-name="deletingUser?.name || ''"
      :loading="deleting"
      @confirm="confirmDeleteUser"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';
import { getLearningCenters } from '../api/learningCenters.js';

// View modal state
const showViewModal = ref(false);
const viewingUser = ref(null);

function openViewModal(user) {
  viewingUser.value = user;
  showViewModal.value = true;
}

// Delete modal state
const showDeleteModal = ref(false);
const deletingUser = ref(null);
const deleting = ref(false);

function openDeleteModal(user) {
  deletingUser.value = user;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  if (deleting.value) return;
  showDeleteModal.value = false;
  deletingUser.value = null;
}

function confirmDeleteUser() {
  if (!deletingUser.value) return;
  deleting.value = true;
  users.value = users.value.filter((u) => u.id !== deletingUser.value.id);
  showDeleteModal.value = false;
  deletingUser.value = null;
  deleting.value = false;
}

const roleTabs = ['All Users', 'Teachers / Implementors', 'Learners'];
const activeTab = ref('All Users');

const searchQuery = ref('');
const selectedUserType = ref('');
const selectedCenter = ref('');
const selectedStatus = ref('');

const rowsPerPage = ref(10);
const currentPage = ref(1);

const showModal = ref(false);
const editingUser = ref(null);

const learningCenters = ref([]);
const users = ref([]);

const stats = reactive({
  totalUsers: 0,
  teachers: 0,
  learners: 0,
});

const form = reactive({
  name: '',
  username: '',
  email: '',
  userType: 'Learner',
  learningCenter: '',
  status: 'Active',
});

function selectTab(tab) {
  activeTab.value = tab;
  currentPage.value = 1;
}

function clearFilters() {
  searchQuery.value = '';
  selectedUserType.value = '';
  selectedCenter.value = '';
  selectedStatus.value = '';
  currentPage.value = 1;
}

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    // Tab filter
    if (activeTab.value === 'Teachers / Implementors' && u.userType !== 'Teacher / Implementor') {
      return false;
    }
    if (activeTab.value === 'Learners' && u.userType !== 'Learner') {
      return false;
    }

    // Dropdown filters
    const matchesQuery = !searchQuery.value ||
      u.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.value.toLowerCase()));

    const matchesType = !selectedUserType.value || u.userType === selectedUserType.value;
    const matchesCenter = !selectedCenter.value || u.learningCenter === selectedCenter.value;
    const matchesStatus = !selectedStatus.value || u.status === selectedStatus.value;

    return matchesQuery && matchesType && matchesCenter && matchesStatus;
  });
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredUsers.value.length / rowsPerPage.value));
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredUsers.value.slice(start, start + rowsPerPage.value);
});

function openAddModal() {
  editingUser.value = null;
  form.name = '';
  form.username = '';
  form.email = '';
  form.userType = activeTab.value === 'Teachers / Implementors' ? 'Teacher / Implementor' : 'Learner';
  form.learningCenter = '';
  form.status = 'Active';
  showModal.value = true;
}

function editUser(user) {
  editingUser.value = user;
  form.name = user.name;
  form.username = user.username;
  form.email = user.email || '';
  form.userType = user.userType;
  form.learningCenter = user.learningCenter || '';
  form.status = user.status;
  showModal.value = true;
}

function saveUser() {
  if (editingUser.value) {
    Object.assign(editingUser.value, { ...form });
    alert(`User "${form.name}" updated.`);
  } else {
    const newUser = {
      id: Date.now(),
      ...form,
      dateRegistered: new Date().toISOString().split('T')[0],
    };
    users.value.push(newUser);
    stats.totalUsers = users.value.length;
    stats.teachers = users.value.filter((u) => u.userType === 'Teacher / Implementor').length;
    stats.learners = users.value.filter((u) => u.userType === 'Learner').length;
    alert(`User "${form.name}" added.`);
  }
  showModal.value = false;
}

async function loadCenters() {
  try {
    const { data } = await getLearningCenters();
    learningCenters.value = data;
  } catch {
    // Fail silently when server is not running
  }
}

onMounted(loadCenters);
</script>

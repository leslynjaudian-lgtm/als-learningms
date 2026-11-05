<template>
  <div class="page-container announcement-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/dashboard">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Announcements</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row announcement-header">
      <div class="page-title-group">
        <h1>Announcements</h1>
        <p>Create and manage announcements for teachers and learners.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openCreateModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Create Announcement</span>
      </button>
    </div>

    <!-- Filter Section (Matches Teacher Portal Style) -->
    <div class="filter-card announcement-filters">
      <div class="filter-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-search-input"
          placeholder="Search announcements..."
        />
      </div>

      <div class="filter-dropdown-group announcement-filter-group">
        <!-- Audience Filter (Admin options: All, All Learners, All Teachers) -->
        <div class="filter-dropdown-item">
          <label>Audience</label>
          <select v-model="selectedAudienceFilter" class="filter-select select-audience">
            <option value="">All</option>
            <option value="All Learners">All Learners</option>
            <option value="All Teachers">All Teachers</option>
          </select>
        </div>

        <!-- Learning Center Filter where applicable -->
        <div class="filter-dropdown-item">
          <label>Learning Center</label>
          <select v-model="selectedCenterFilter" class="filter-select select-center">
            <option value="">All Centers</option>
            <option v-for="c in learningCenters" :key="c.id" :value="c.name">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Announcement Table Card (Matches Teacher Portal Style) -->
    <div class="table-card announcement-table-card">
      <div class="table-wrapper">
        <table class="data-table announcement-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th class="th-title">TITLE</th>
              <th class="th-message">MESSAGE</th>
              <th class="th-audience">AUDIENCE</th>
              <th class="th-date">DATE POSTED</th>
              <th class="th-status">STATUS</th>
              <th class="th-actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody v-if="!loading && filteredAnnouncements.length > 0">
            <tr v-for="(item, idx) in filteredAnnouncements" :key="item.id">
              <td class="col-num">{{ idx + 1 }}</td>
              <td class="col-title" style="font-weight: 600;">
                <span class="title-text">{{ item.title }}</span>
                <span v-if="item.learningCenter" class="center-sub">{{ item.learningCenter }}</span>
              </td>
              <td class="col-message">
                <span class="message-preview">{{ item.message || item.content }}</span>
              </td>
              <td class="col-audience">
                <span
                  v-if="item.audience === 'All Teachers'"
                  class="audience-badge"
                >
                  All Teachers
                </span>
                <span v-else class="audience-all">
                  {{ item.audience }}
                </span>
              </td>
              <td class="col-date">{{ item.datePosted || item.date }}</td>
              <td class="col-status">
                <span class="badge badge-success">
                  {{ item.status || 'Published' }}
                </span>
              </td>
              <td class="td-actions">
                <div class="cell-actions announcement-actions">
                  <!-- View Icon -->
                  <button
                    type="button"
                    class="btn-icon btn-icon-view"
                    title="View"
                    aria-label="View Announcement"
                    @click="openViewModal(item)"
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
                    aria-label="Edit Announcement"
                    @click="openEditModal(item)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  <!-- Delete Icon -->
                  <button
                    type="button"
                    class="btn-icon btn-icon-danger"
                    title="Delete"
                    aria-label="Delete Announcement"
                    @click="openDeleteModal(item)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="empty-state-box">
        <p>Loading announcements...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredAnnouncements.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <h3>No announcements found</h3>
        <p>Announcements will appear here once they are created.</p>
      </div>
    </div>

    <!-- Modal: Create / Edit Announcement -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingAnnouncement ? 'Edit Announcement' : 'Create Announcement' }}</h2>
          <button type="button" class="modal-close" @click="closeModal" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveAnnouncement">
            <!-- Title * -->
            <div class="form-group">
              <label class="form-label">Title <span class="required">*</span></label>
              <input
                v-model="form.title"
                type="text"
                class="form-input"
                placeholder="e.g. System Maintenance or District Assessment Schedule"
                required
              />
            </div>

            <!-- Message * -->
            <div class="form-group">
              <label class="form-label">Message <span class="required">*</span></label>
              <textarea
                v-model="form.message"
                class="form-input"
                rows="4"
                placeholder="Type your announcement details here..."
                required
              ></textarea>
            </div>

            <!-- Audience * -->
            <div class="form-group">
              <label class="form-label">Audience <span class="required">*</span></label>
              <select v-model="form.audience" class="form-select-full" required>
                <option value="All Learners">All Learners</option>
                <option value="All Teachers">All Teachers</option>
              </select>
            </div>

            <!-- Date Posted (No Status field in create form) -->
            <div class="form-group">
              <label class="form-label">Date Posted</label>
              <input
                v-model="form.datePosted"
                type="date"
                class="form-input"
              />
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                {{ submitting ? 'Saving...' : (editingAnnouncement ? 'Save Changes' : 'Publish Announcement') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal: View Announcement Details (Matches Teacher Portal Style) -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal modal-details">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Announcement Details</h2>
            <p class="modal-subtitle">Published Notice Information</p>
          </div>
          <button type="button" class="modal-close" @click="showViewModal = false" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body-scrollable">
          <div class="details-grid">
            <div class="detail-item details-full-width">
              <span class="detail-label">Title</span>
              <span class="detail-value detail-value-highlight">{{ viewingAnnouncement?.title }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Target Audience</span>
              <span class="detail-value">
                {{ viewingAnnouncement?.audience }}
              </span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Scope</span>
              <span class="detail-value">{{ viewingAnnouncement?.learningCenter || 'District-wide' }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Date Posted</span>
              <span class="detail-value">{{ viewingAnnouncement?.datePosted || viewingAnnouncement?.date }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="badge badge-success">
                  {{ viewingAnnouncement?.status || 'Published' }}
                </span>
              </span>
            </div>

            <div class="detail-item details-full-width">
              <span class="detail-label">Message Content</span>
              <p class="detail-value-content">{{ viewingAnnouncement?.message || viewingAnnouncement?.content }}</p>
            </div>
          </div>
        </div>

        <div class="modal-footer-view">
          <button type="button" class="btn btn-secondary" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Modal: Delete Confirmation -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-delete">
        <div class="modal-header">
          <h2>Delete Announcement</h2>
          <button type="button" class="modal-close" @click="closeDeleteModal" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin: 0 0 1rem; color: #475569; font-size: 0.95rem;">
            Are you sure you want to delete announcement
            <strong>"{{ deletingAnnouncement?.title }}"</strong>? This action cannot be undone.
          </p>
          <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
            <button type="button" class="btn btn-secondary" @click="closeDeleteModal">Cancel</button>
            <button type="button" class="btn btn-danger" :disabled="deleting" @click="confirmDeleteAnnouncement">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../api/announcements.js';
import { getLearningCenters } from '../api/learningCenters.js';
import { useNotifications } from '../composables/useNotifications.js';

const route = useRoute();
const router = useRouter();
const { markAsRead } = useNotifications();

const announcements = ref([]);
const learningCenters = ref([]);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);

const searchQuery = ref('');
const selectedAudienceFilter = ref('');
const selectedCenterFilter = ref('');

// Modals state
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);

const editingAnnouncement = ref(null);
const viewingAnnouncement = ref(null);
const deletingAnnouncement = ref(null);

const form = reactive({
  title: '',
  message: '',
  audience: 'All Learners',
  datePosted: '',
});

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForInput(dateVal) {
  if (!dateVal) return getTodayString();
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return getTodayString();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function loadAnnouncements() {
  loading.value = true;
  try {
    const res = await getAnnouncements({ portal: 'admin' });
    announcements.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('Failed to load announcements from backend:', err);
    announcements.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadLearningCentersList() {
  try {
    const res = await getLearningCenters();
    learningCenters.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn('Could not load learning centers for announcements filter:', err);
    learningCenters.value = [];
  }
}

// Filtered Announcements
const filteredAnnouncements = computed(() => {
  return announcements.value.filter((a) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchesQuery =
      !q ||
      a.title?.toLowerCase().includes(q) ||
      a.message?.toLowerCase().includes(q) ||
      a.audience?.toLowerCase().includes(q);

    let matchesAudience = true;
    if (selectedAudienceFilter.value === 'All Teachers') {
      matchesAudience = a.audience === 'All Teachers' || a.audienceRaw === 'ALL_TEACHERS';
    } else if (selectedAudienceFilter.value === 'All Learners') {
      matchesAudience = a.audience === 'All Learners' || a.audienceRaw === 'ALL_LEARNERS';
    }

    const matchesCenter =
      !selectedCenterFilter.value || a.learningCenter === selectedCenterFilter.value;

    return matchesQuery && matchesAudience && matchesCenter;
  });
});

function openCreateModal() {
  editingAnnouncement.value = null;
  form.title = '';
  form.message = '';
  form.audience = 'All Learners';
  form.datePosted = getTodayString();
  showModal.value = true;
}

function openEditModal(item) {
  editingAnnouncement.value = item;
  form.title = item.title;
  form.message = item.message || item.content;
  form.audience = (item.audience === 'All Teachers' || item.audienceRaw === 'ALL_TEACHERS') ? 'All Teachers' : 'All Learners';
  form.datePosted = formatDateForInput(item.createdAt || item.datePosted || item.date);
  showModal.value = true;
}

function closeModal() {
  if (submitting.value) return;
  showModal.value = false;
  editingAnnouncement.value = null;
}

async function saveAnnouncement() {
  if (!form.title.trim()) {
    alert('Please enter a title.');
    return;
  }
  if (!form.message.trim()) {
    alert('Please enter announcement message.');
    return;
  }

  const payload = {
    title: form.title.trim(),
    message: form.message.trim(),
    content: form.message.trim(),
    audience: form.audience === 'All Teachers' ? 'ALL_TEACHERS' : 'ALL_LEARNERS',
    creatorRole: 'ADMIN',
    datePosted: form.datePosted,
    date: form.datePosted,
    createdAt: form.datePosted ? new Date(form.datePosted).toISOString() : new Date().toISOString(),
    status: 'PUBLISHED',
  };

  submitting.value = true;
  try {
    if (editingAnnouncement.value) {
      const targetId = editingAnnouncement.value.id;
      const { data } = await updateAnnouncement(targetId, payload);
      const idx = announcements.value.findIndex((a) => a.id === targetId);
      if (idx !== -1) {
        announcements.value[idx] = {
          ...announcements.value[idx],
          ...data,
          title: data.title || payload.title,
          message: data.message || payload.message,
          content: data.content || payload.content,
          audience: form.audience,
          audienceRaw: payload.audience,
          datePosted: data.datePosted || form.datePosted,
          date: data.date || form.datePosted,
        };
      }
    } else {
      const { data } = await createAnnouncement(payload);
      announcements.value.unshift({
        ...data,
        title: data.title || payload.title,
        message: data.message || payload.message,
        content: data.content || payload.content,
        audience: form.audience,
        audienceRaw: payload.audience,
        datePosted: data.datePosted || form.datePosted,
        date: data.date || form.datePosted,
        createdBy: 'Administrator',
      });
    }
    window.dispatchEvent(new Event('als-notifications-updated'));
    closeModal();
  } catch (err) {
    console.error('Failed to save announcement:', err);
    alert(err.response?.data?.error || 'Failed to save announcement.');
  } finally {
    submitting.value = false;
  }
}

// View Details Modal
function openViewModal(item) {
  viewingAnnouncement.value = item;
  showViewModal.value = true;
  if (item?.id) {
    markAsRead(`announcement:${item.id}`);
  }
}

// Delete Confirmation Modal
function openDeleteModal(item) {
  deletingAnnouncement.value = item;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  deletingAnnouncement.value = null;
}

async function confirmDeleteAnnouncement() {
  if (!deletingAnnouncement.value) return;
  const targetId = deletingAnnouncement.value.id;
  deleting.value = true;
  try {
    await deleteAnnouncement(targetId);
    announcements.value = announcements.value.filter((a) => a.id !== targetId);
    closeDeleteModal();
  } catch (err) {
    console.error('Failed to delete announcement:', err);
    alert(err.response?.data?.error || 'Failed to delete announcement.');
  } finally {
    deleting.value = false;
  }
}

onMounted(async () => {
  await loadLearningCentersList();
  await loadAnnouncements();
  if (route.query.action === 'create') {
    openCreateModal();
    router.replace({ path: route.path, query: {} });
  } else if (route.query.view) {
    const targetId = Number(route.query.view);
    const found = announcements.value.find((a) => Number(a.id) === targetId);
    if (found) {
      openViewModal(found);
    }
    router.replace({ path: route.path, query: {} });
  }
});
</script>

<style scoped>
/* Unified Container Layout */
.announcement-page {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.85rem;
}

.breadcrumb a {
  color: #2563eb;
  text-decoration: none;
  transition: color 0.15s ease;
}

.breadcrumb a:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

.breadcrumb-current {
  color: #0f172a;
  font-weight: 600;
}

/* Page Header */
.announcement-header,
.page-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
}

.page-title-group h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.02em;
}

.page-title-group p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  height: 42px;
  padding: 0 1.25rem;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1;
  white-space: nowrap;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #ffffff;
  color: #475569;
  border-color: #cbd5e1;
}

.btn-secondary:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Filter Card */
.announcement-filters,
.filter-card {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.filter-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  height: 42px;
  padding: 0 0.85rem;
  flex: 1;
  min-width: 260px;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.filter-search-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  background: #ffffff;
}

.filter-search-wrap svg {
  color: #94a3b8;
  flex-shrink: 0;
}

.filter-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.875rem;
  color: #0f172a;
  width: 100%;
  font-family: inherit;
}

.filter-search-input::placeholder {
  color: #94a3b8;
}

.announcement-filter-group,
.filter-dropdown-group {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.filter-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-dropdown-item label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.filter-select {
  height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  padding: 0 2.25rem 0 0.85rem;
  font-size: 0.875rem;
  color: #0f172a;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.select-audience {
  min-width: 180px;
  width: 180px;
}

.select-center {
  min-width: 220px;
  width: 220px;
}

.filter-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Table Card */
.announcement-table-card,
.table-card {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.announcement-table,
.data-table {
  width: 100%;
  min-width: 860px;
  table-layout: fixed;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.data-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  box-sizing: border-box;
}

.data-table td {
  padding: 0.95rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  vertical-align: middle;
  box-sizing: border-box;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: #f8fafc;
}

/* Specific Columns with unified percentages */
.th-num,
.col-num {
  width: 5%;
  text-align: center;
}

.th-title,
.col-title {
  width: 18%;
}

.title-text {
  color: #0f172a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}

.center-sub {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: normal;
  margin-top: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.th-message,
.col-message {
  width: 30%;
}

.message-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
  color: #475569;
  font-size: 0.85rem;
}

.th-audience,
.col-audience {
  width: 17%;
  white-space: nowrap;
}

.audience-all {
  display: inline-block;
  font-weight: 600;
  color: #0f172a;
}

.audience-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.775rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.th-date,
.col-date {
  width: 13%;
  white-space: nowrap;
  color: #64748b;
  font-size: 0.85rem;
}

.th-status,
.col-status {
  width: 10%;
  white-space: nowrap;
}

.th-actions,
.td-actions {
  width: 145px;
  min-width: 145px;
  text-align: right;
  white-space: nowrap;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: capitalize;
}

.badge-success {
  background: #dcfce7;
  color: #15803d;
}

/* Action Icons */
.announcement-actions,
.cell-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid var(--color-border, #cbd5e1);
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  box-sizing: border-box;
}

.btn-icon svg {
  width: 15px;
  height: 15px;
  stroke: currentColor;
  stroke-width: 2;
  flex-shrink: 0;
}

.btn-icon-view {
  background: var(--action-view-bg, #EFF6FF) !important;
  color: var(--action-view-color, #4169A8) !important;
  border: 1px solid var(--action-view-border, #DCE7F6) !important;
}

.btn-icon-view:hover {
  background: var(--action-view-hover-bg, #E0EEFE) !important;
  border-color: var(--action-view-hover-border, #B9D3F4) !important;
  color: var(--action-view-hover-color, #315488) !important;
}

.btn-icon-view:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8) !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 3px var(--action-view-focus-ring, rgba(65, 105, 168, 0.35)) !important;
}

.btn-icon-edit {
  background: var(--action-edit-bg, #FFF7E8) !important;
  color: var(--action-edit-color, #946B32) !important;
  border: 1px solid var(--action-edit-border, #F6E6CE) !important;
}

.btn-icon-edit:hover {
  background: var(--action-edit-hover-bg, #FDEFCF) !important;
  border-color: var(--action-edit-hover-border, #EACD9E) !important;
  color: var(--action-edit-hover-color, #7A5422) !important;
}

.btn-icon-edit:focus-visible {
  outline: 2px solid var(--action-edit-color, #946B32) !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 3px var(--action-edit-focus-ring, rgba(148, 107, 50, 0.35)) !important;
}

.btn-icon-danger {
  background: var(--action-delete-bg, #FFF1F1) !important;
  color: var(--action-delete-color, #B65B60) !important;
  border: 1px solid var(--action-delete-border, #F9D6D8) !important;
}

.btn-icon-danger:hover {
  background: var(--action-delete-hover-bg, #FDE4E4) !important;
  border-color: var(--action-delete-hover-border, #F2B8BA) !important;
  color: var(--action-delete-hover-color, #994247) !important;
}

.btn-icon-danger:focus-visible {
  outline: 2px solid var(--action-delete-color, #B65B60) !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 3px var(--action-delete-focus-ring, rgba(182, 91, 96, 0.35)) !important;
}

/* Empty State */
.empty-state-box {
  padding: 3.5rem 2rem;
  text-align: center;
  color: #64748b;
}

.empty-state-graphic {
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.empty-state-box h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.empty-state-box p {
  font-size: 0.88rem;
  color: #64748b;
  margin: 0;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-details {
  max-width: 620px;
}

.modal-delete {
  max-width: 440px;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2,
.modal-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal-subtitle {
  font-size: 0.825rem;
  color: #64748b;
  margin: 0.2rem 0 0 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body-scrollable {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-footer-view {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
}

/* Forms */
.form-group {
  margin-bottom: 1.15rem;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.55rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-select-full {
  width: 100%;
  padding: 0.55rem 2rem 0.55rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  background: #ffffff;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  box-sizing: border-box;
  font-family: inherit;
}

.form-select-full:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 1.5rem;
}

.details-full-width {
  grid-column: 1 / -1;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.detail-value {
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 500;
}

.detail-value-highlight {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.detail-value-content {
  font-size: 0.92rem;
  color: #334155;
  line-height: 1.55;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin: 0;
  white-space: pre-wrap;
}
</style>

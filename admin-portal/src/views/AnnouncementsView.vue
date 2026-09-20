<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Announcements</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Announcements</h1>
        <p>Create and manage announcements for teachers and learners.</p>
      </div>
      <button class="btn btn-primary" @click="showAddModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Create Announcement</span>
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
          placeholder="Search announcements..."
        />
      </div>

      <div class="filter-dropdown-group">
        <div class="filter-dropdown-item">
          <label>Audience</label>
          <select v-model="selectedAudience" class="filter-select">
            <option value="">All</option>
            <option value="All Users">All Users</option>
            <option value="Teachers Only">Teachers Only</option>
            <option value="Learners Only">Learners Only</option>
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
              <th>Title</th>
              <th>Message</th>
              <th>Audience</th>
              <th>Date Posted</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in filteredAnnouncements" :key="item.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 600;">{{ item.title }}</td>
              <td>{{ item.message }}</td>
              <td>{{ item.audience }}</td>
              <td>{{ item.datePosted }}</td>
              <td>
                <span class="badge" :class="item.status === 'Published' ? 'badge-success' : 'badge-muted'">
                  {{ item.status }}
                </span>
              </td>
              <td class="td-actions">
                <div class="cell-actions">
                  <button class="btn-icon btn-icon-view" title="View Announcement" @click="openViewModal(item)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button class="btn-icon btn-icon-edit" title="Edit Announcement" @click="openEditModal(item)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>
                  <button class="btn-icon btn-icon-danger" title="Delete Announcement" @click="openDeleteModal(item)">
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
      <div v-if="filteredAnnouncements.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </div>
        <h3>No announcements yet</h3>
        <p>Announcements will appear here once they are created.</p>
      </div>
    </div>

    <!-- Create / Edit Announcement Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingAnnouncement ? 'Edit Announcement' : 'Create Announcement' }}</h2>
          <button class="modal-close" @click="showAddModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveAnnouncement">
            <div class="form-group">
              <label class="form-label">Title <span class="required">*</span></label>
              <input v-model="form.title" type="text" class="form-input" placeholder="e.g. Schedule for Monthly Assessment" required />
            </div>
            <div class="form-group">
              <label class="form-label">Audience <span class="required">*</span></label>
              <select v-model="form.audience" class="form-select-full" required>
                <option value="All Users">All Users</option>
                <option value="Teachers Only">Teachers Only</option>
                <option value="Learners Only">Learners Only</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Message Content <span class="required">*</span></label>
              <textarea v-model="form.message" class="form-input" rows="4" placeholder="Type your announcement details here..." required></textarea>
            </div>
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">{{ editingAnnouncement ? 'Save Changes' : 'Publish Announcement' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Announcement Details Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal" style="max-width: 540px; width: 90%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="modal-header" style="border-bottom: 1px solid var(--color-border); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 class="modal-title" style="font-size: 1.2rem; font-weight: 700; color: var(--color-text);">Announcement Details</h2>
            <p class="modal-subtitle" style="font-size: 0.85rem; color: var(--color-text-secondary);">Published Notice Information</p>
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
              <span class="detail-label">Title</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-primary); font-size: 1.05rem;">{{ viewingAnnouncement?.title }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Target Audience</span>
              <span class="detail-value">{{ viewingAnnouncement?.audience }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date Posted</span>
              <span class="detail-value">{{ viewingAnnouncement?.datePosted }}</span>
            </div>
            <div class="detail-item details-full-width">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="badge" :class="viewingAnnouncement?.status === 'Published' ? 'badge-success' : 'badge-muted'">
                  {{ viewingAnnouncement?.status || 'Published' }}
                </span>
              </span>
            </div>
            <div class="detail-item details-full-width">
              <span class="detail-label">Message Content</span>
              <p class="detail-value" style="white-space: pre-wrap; line-height: 1.6; margin-top: 0.25rem;">{{ viewingAnnouncement?.message }}</p>
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
      title="Delete Announcement"
      :item-name="deletingAnnouncement?.title || ''"
      :loading="deleting"
      @confirm="confirmDeleteAnnouncement"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';

// Delete modal state
const showDeleteModal = ref(false);
const deletingAnnouncement = ref(null);
const deleting = ref(false);

function openDeleteModal(announcement) {
  deletingAnnouncement.value = announcement;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  if (deleting.value) return;
  showDeleteModal.value = false;
  deletingAnnouncement.value = null;
}

function confirmDeleteAnnouncement() {
  if (!deletingAnnouncement.value) return;
  deleting.value = true;
  announcements.value = announcements.value.filter((a) => a.id !== deletingAnnouncement.value.id);
  showDeleteModal.value = false;
  deletingAnnouncement.value = null;
  deleting.value = false;
}

const searchQuery = ref('');
const selectedAudience = ref('');
const showAddModal = ref(false);
const showViewModal = ref(false);
const viewingAnnouncement = ref(null);
const editingAnnouncement = ref(null);

const announcements = ref([
  {
    id: 1,
    title: 'Schedule for Monthly A&E Assessment',
    message: 'The monthly assessment for all elementary and lower secondary learners will be conducted on the last Friday of this month.',
    audience: 'All Users',
    datePosted: '2026-09-15',
    status: 'Published',
  },
  {
    id: 2,
    title: 'ALS Teachers Professional Development Session',
    message: 'All ALS implementors are requested to attend the teaching methodology session at Poblacion CLC.',
    audience: 'Teachers Only',
    datePosted: '2026-09-18',
    status: 'Published',
  },
  {
    id: 3,
    title: 'Distribution of New Learning Strand Modules',
    message: 'Printed modules for LS 1 and LS 3 are now ready for claiming at respective learning centers.',
    audience: 'Learners Only',
    datePosted: '2026-09-19',
    status: 'Published',
  },
]);

const form = reactive({
  title: '',
  audience: 'All Users',
  message: '',
});

function openViewModal(item) {
  viewingAnnouncement.value = item;
  showViewModal.value = true;
}

function openEditModal(item) {
  editingAnnouncement.value = item;
  form.title = item.title;
  form.audience = item.audience;
  form.message = item.message;
  showAddModal.value = true;
}

function openAddModal() {
  editingAnnouncement.value = null;
  form.title = '';
  form.audience = 'All Users';
  form.message = '';
  showAddModal.value = true;
}

const filteredAnnouncements = computed(() => {
  return announcements.value.filter((a) => {
    const matchesQuery = !searchQuery.value ||
      a.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesAudience = !selectedAudience.value || a.audience === selectedAudience.value;
    return matchesQuery && matchesAudience;
  });
});

function saveAnnouncement() {
  if (editingAnnouncement.value) {
    const idx = announcements.value.findIndex((a) => a.id === editingAnnouncement.value.id);
    if (idx !== -1) {
      announcements.value[idx] = {
        ...announcements.value[idx],
        title: form.title,
        audience: form.audience,
        message: form.message,
      };
    }
  } else {
    announcements.value.unshift({
      id: Date.now(),
      title: form.title,
      audience: form.audience,
      message: form.message,
      datePosted: new Date().toISOString().split('T')[0],
      status: 'Published',
    });
  }
  showAddModal.value = false;
  editingAnnouncement.value = null;
  form.title = '';
  form.message = '';
}
</script>

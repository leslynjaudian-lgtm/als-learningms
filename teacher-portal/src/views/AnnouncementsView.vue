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
        <p>Create and manage announcements for your learners.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openCreateModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Create Announcement</span>
      </button>
    </div>

    <!-- Filter Section -->
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
        <!-- Audience Dropdown (Learner Facing Only) -->
        <div class="filter-dropdown-item">
          <label>Audience</label>
          <select v-model="selectedAudienceFilter" class="filter-select select-audience">
            <option value="">All</option>
            <option value="All Learners">All Learners</option>
            <option value="Individual Learner">Individual Learner</option>
          </select>
        </div>

        <!-- Learning Center Dropdown (Assigned Centers Only) -->
        <div class="filter-dropdown-item">
          <label>Learning Center</label>
          <select v-model="selectedCenterFilter" class="filter-select select-center">
            <option value="">All</option>
            <option v-for="center in teacherLearningCenters" :key="center.id" :value="center.name">
              {{ center.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Announcement Table Card -->
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
                <span v-if="item.isSystem" class="badge" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 0.7rem; font-weight: 700; margin-left: 0.5rem;">Admin</span>
                <span v-else-if="item.learningCenter" class="center-sub">
                  {{ item.learningCenter }}
                  <span v-if="item.programLevel"> • {{ item.programLevel }}</span>
                </span>
              </td>
              <td class="col-message">
                <span class="message-preview">{{ item.message || item.content }}</span>
              </td>
              <td class="col-audience">
                <span v-if="item.isSystem || item.audience === 'All Teachers'" class="audience-badge">
                  All Teachers
                </span>
                <span v-else-if="item.targetLearnerName || item.audienceRaw === 'INDIVIDUAL_LEARNER' || item.audienceRaw === 'SPECIFIC_LEARNER'" class="audience-specific" :title="item.targetLearnerName || item.audience">
                  {{ item.targetLearnerName || item.audience }}
                </span>
                <span v-else class="audience-all">
                  All Learners
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
                    title="View Announcement"
                    aria-label="View Announcement"
                    @click="openViewModal(item)"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>

                  <!-- Edit Icon (Teacher announcements only) -->
                  <button
                    v-if="!item.isSystem"
                    type="button"
                    class="btn-icon btn-icon-edit"
                    title="Edit Announcement"
                    aria-label="Edit Announcement"
                    @click="openEditModal(item)"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  <!-- Delete Icon (Teacher announcements only) -->
                  <button
                    v-if="!item.isSystem"
                    type="button"
                    class="btn-icon btn-icon-danger"
                    title="Delete Announcement"
                    aria-label="Delete Announcement"
                    @click="openDeleteModal(item)"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                placeholder="e.g. CLC Orientation or Module Reminder"
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

            <!-- Learning Center * -->
            <div class="form-group">
              <label class="form-label">Learning Center <span class="required">*</span></label>
              <select v-model="form.learningCenterId" class="form-select-full" required @change="onLearningCenterChange">
                <option :value="null" disabled>Select Learning Center</option>
                <option v-for="center in teacherLearningCenters" :key="center.id" :value="center.id">
                  {{ center.name }}
                </option>
              </select>
            </div>

            <!-- Program Level * (Assigned levels only, specific choice required) -->
            <div class="form-group">
              <label class="form-label">Program Level <span class="required">*</span></label>
              <select v-model="form.programLevel" class="form-select-full" required @change="onProgramLevelChange">
                <option value="" disabled>Select Program Level</option>
                <option v-for="level in teacherAvailableProgramLevels" :key="level" :value="level">
                  {{ level }}
                </option>
              </select>
            </div>

            <!-- Audience * (Searchable multi-select dropdown with All Learners & individual learner names) -->
            <div class="form-group audience-dropdown-group">
              <label class="form-label">Audience <span class="required">*</span></label>
              
              <!-- Custom Dropdown Trigger -->
              <div
                class="custom-dropdown-trigger"
                :class="{ 'is-open': isAudienceDropdownOpen }"
                tabindex="0"
                @click="toggleAudienceDropdown"
                @keydown.enter.prevent="toggleAudienceDropdown"
                @keydown.space.prevent="toggleAudienceDropdown"
              >
                <span class="dropdown-trigger-text" :title="audienceDisplayText">
                  {{ audienceDisplayText }}
                </span>
                <svg
                  class="dropdown-chevron"
                  :class="{ 'is-rotated': isAudienceDropdownOpen }"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              <!-- Pure Vue backdrop overlay for closing on outside click without DOM manipulation -->
              <div
                v-if="isAudienceDropdownOpen"
                class="dropdown-backdrop"
                @click="isAudienceDropdownOpen = false"
              ></div>

              <!-- Custom Dropdown Menu -->
              <div v-if="isAudienceDropdownOpen" class="custom-dropdown-menu">
                <!-- Search Input Header -->
                <div class="dropdown-search-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    v-model="learnerSearchQuery"
                    type="text"
                    class="dropdown-search-input"
                    placeholder="Search learners..."
                    @click.stop
                  />
                  <button
                    v-if="learnerSearchQuery"
                    type="button"
                    class="dropdown-search-clear"
                    @click.stop="learnerSearchQuery = ''"
                  >
                    ×
                  </button>
                </div>

                <!-- Dropdown Options List -->
                <div class="dropdown-options-list">
                  <!-- All Learners Option (Always First) -->
                  <div
                    v-if="!learnerSearchQuery || 'all learners'.includes(learnerSearchQuery.toLowerCase())"
                    class="dropdown-option-item all-learners-item"
                    :class="{ 'is-selected': isAllLearnersSelected }"
                    @click.stop="selectAllLearners"
                  >
                    <div class="custom-checkbox" :class="{ 'is-checked': isAllLearnersSelected }">
                      <svg v-if="isAllLearnersSelected" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <span class="option-name">All Learners</span>
                    <span class="option-badge">
                      {{ filteredLearnersForForm.length }} {{ filteredLearnersForForm.length === 1 ? 'learner' : 'learners' }}
                    </span>
                  </div>

                  <div class="dropdown-divider"></div>

                  <!-- Individual Learner Options (Actual Learner Names) -->
                  <div
                    v-for="learner in searchedLearnersForForm"
                    :key="learner.id"
                    class="dropdown-option-item"
                    :class="{ 'is-selected': isLearnerSelected(learner.id) }"
                    @click.stop="toggleLearnerSelection(learner)"
                  >
                    <div class="custom-checkbox" :class="{ 'is-checked': isLearnerSelected(learner.id) }">
                      <svg v-if="isLearnerSelected(learner.id)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <span class="option-name">{{ learner.name }}</span>
                  </div>

                  <!-- Empty State inside Dropdown -->
                  <div v-if="filteredLearnersForForm.length === 0" class="dropdown-empty">
                    No active learners found for selected Learning Center and Program Level.
                  </div>
                  <div v-else-if="searchedLearnersForForm.length === 0" class="dropdown-empty">
                    No learners match "{{ learnerSearchQuery }}".
                  </div>
                </div>
              </div>
            </div>

            <!-- Date Posted (Date input, no Status field in create form) -->
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
              <button type="submit" class="btn btn-primary" :disabled="submitting || (filteredLearnersForForm.length === 0)">
                {{ submitting ? 'Saving...' : (editingAnnouncement ? 'Save Changes' : 'Publish Announcement') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal: View Announcement Details -->
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
                <strong v-if="viewingAnnouncement?.targetLearnerName" style="color: #1d4ed8; display: block;">
                  {{ viewingAnnouncement?.targetLearnerName }}
                </strong>
              </span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Learning Center</span>
              <span class="detail-value">{{ viewingAnnouncement?.learningCenter || defaultCenterName }}</span>
            </div>

            <div v-if="viewingAnnouncement?.programLevel" class="detail-item">
              <span class="detail-label">Program Level</span>
              <span class="detail-value">{{ viewingAnnouncement?.programLevel }}</span>
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
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getTeacherProfile } from '../api/auth.js';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../api/announcements.js';
import { getAssignedLearners } from '../api/learners.js';
import { getLearningCenters } from '../api/learningCenters.js';

const { currentTeacher, teacherId, teacherName, assignedCenters } = useTeacherSession();

const announcements = ref([]);
const loading = ref(false);

const searchQuery = ref('');
const selectedAudienceFilter = ref('');
const selectedCenterFilter = ref('');

// Dynamic Assigned Learning Centers for the currently logged-in teacher
const teacherLearningCenters = ref([]);

const defaultCenterName = computed(() => {
  return teacherLearningCenters.value[0]?.name || 'Community Learning Center';
});

// Program levels assigned to the currently logged-in teacher (never combined option)
const teacherAvailableProgramLevels = computed(() => {
  const spec = (currentTeacher.value?.programLevel || currentTeacher.value?.specialization || 'Both').toLowerCase();
  if (spec.includes('both')) {
    return ['A&E Elementary', 'A&E Junior High'];
  }
  if (spec.includes('elem')) {
    return ['A&E Elementary'];
  }
  if (spec.includes('jun')) {
    return ['A&E Junior High'];
  }
  return ['A&E Elementary', 'A&E Junior High'];
});

// Dynamic Assigned Learners list for the currently logged-in teacher
const assignedLearnersList = ref([]);

async function loadLearners() {
  try {
    const tid = teacherId.value || currentTeacher.value?.id;
    const { data } = await getAssignedLearners(tid ? { teacherId: tid } : {});
    if (Array.isArray(data)) {
      // Filter strictly for learners assigned to this teacher
      const filtered = data.filter((l) => {
        if (!tid) return true;
        if (l.assignedTeacherId) return Number(l.assignedTeacherId) === Number(tid);
        return true;
      });

      assignedLearnersList.value = filtered.map((l) => ({
        id: l.id,
        name: l.name || l.fullName || 'Learner',
        learningCenterId: l.learningCenterId || null,
        learningCenter: l.learningCenter || '',
        level: l.level || '',
        status: l.status || 'Active',
      }));
    } else {
      assignedLearnersList.value = [];
    }
  } catch (err) {
    console.warn('Could not load assigned learners for announcements:', err);
    assignedLearnersList.value = [];
  }
}

async function loadTeacherLearningCenters() {
  try {
    const tid = teacherId.value || currentTeacher.value?.id;
    const [profileRes, allCentersRes] = await Promise.allSettled([
      tid ? getTeacherProfile(tid) : Promise.resolve(null),
      getLearningCenters(),
    ]);

    const allCenters = allCentersRes.status === 'fulfilled' && Array.isArray(allCentersRes.value.data)
      ? allCentersRes.value.data
      : [];

    let centers = [];
    if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
      const data = profileRes.value.data;
      if (Array.isArray(data.learningCenters) && data.learningCenters.length > 0) {
        centers = [...data.learningCenters];
      } else if (data.learningCenterDetails) {
        centers = [data.learningCenterDetails];
      } else if (data.learningCenterId) {
        const found = allCenters.find((c) => c.id === data.learningCenterId);
        if (found) centers = [found];
      }
    }

    // Fallback to session
    if (centers.length === 0 && currentTeacher.value) {
      if (Array.isArray(currentTeacher.value.learningCenters) && currentTeacher.value.learningCenters.length > 0) {
        centers = [...currentTeacher.value.learningCenters];
      } else if (currentTeacher.value.learningCenterDetails) {
        centers = [currentTeacher.value.learningCenterDetails];
      } else if (currentTeacher.value.learningCenterId) {
        const found = allCenters.find((c) => c.id === currentTeacher.value.learningCenterId);
        if (found) centers = [found];
      } else if (assignedCenters.value && assignedCenters.value.length > 0) {
        centers = [...assignedCenters.value];
      }
    }

    // Include centers from teacher's assigned learners if not present
    for (const lrn of assignedLearnersList.value) {
      if (lrn.learningCenterId && !centers.some((c) => c.id === lrn.learningCenterId)) {
        const matched = allCenters.find((c) => c.id === lrn.learningCenterId);
        if (matched) centers.push(matched);
      }
    }

    // Standardize structure
    const mapped = centers.map((c) => {
      const dbMatch = allCenters.find((ac) => ac.id === c.id || ac.name === c.name);
      return {
        id: c.id || dbMatch?.id || 1,
        name: c.name || dbMatch?.name || 'Learning Center',
      };
    });

    // Remove duplicates
    const unique = [];
    const seen = new Set();
    for (const c of mapped) {
      if (!seen.has(c.id) && !seen.has(c.name)) {
        seen.add(c.id);
        seen.add(c.name);
        unique.push(c);
      }
    }

    teacherLearningCenters.value = unique;
  } catch (err) {
    console.error('Error loading teacher learning centers:', err);
    teacherLearningCenters.value = [];
  }
}

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

const submitting = ref(false);
const deleting = ref(false);

async function loadAnnouncements() {
  loading.value = true;
  try {
    const tid = teacherId.value || currentTeacher.value?.id;
    const { data } = await getAnnouncements({ portal: 'teacher', teacherId: tid });
    if (Array.isArray(data)) {
      announcements.value = data.map((d) => {
        const isAdminAnnouncement =
          d.creatorRole === 'ADMIN' ||
          d.audienceRaw === 'ALL_TEACHERS' ||
          d.audience === 'All Teachers' ||
          (!d.teacherId && (d.createdBy === 'Administrator' || d.author === 'Administrator'));

        const audienceText = d.targetLearnerName || (d.audienceRaw === 'INDIVIDUAL_LEARNER' || d.audienceRaw === 'SPECIFIC_LEARNER' ? (d.targetLearnerName || 'Individual Learner') : (d.audience || 'All Learners'));

        return {
          id: d.id,
          title: d.title,
          message: d.message || d.content,
          content: d.content || d.message,
          audience: audienceText,
          audienceRaw: d.audienceRaw || d.audience,
          targetLearnerId: d.targetLearnerId || null,
          targetLearnerName: d.targetLearnerName || '',
          learningCenterId: d.learningCenterId || null,
          learningCenter: d.learningCenter || (isAdminAnnouncement ? 'System-wide' : ''),
          programLevel: d.programLevel || '',
          datePosted: d.datePosted || d.date || '',
          date: d.datePosted || d.date || '',
          createdAt: d.createdAt,
          status: d.status || 'Published',
          isSystem: isAdminAnnouncement,
          createdBy: d.createdBy || d.author || (isAdminAnnouncement ? 'Administrator' : teacherName.value),
        };
      });
    } else {
      announcements.value = [];
    }
  } catch (err) {
    console.error('Failed to load announcements from backend:', err);
    announcements.value = [];
  } finally {
    loading.value = false;
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
      a.targetLearnerName?.toLowerCase().includes(q) ||
      a.audience?.toLowerCase().includes(q);

    let matchesAudience = true;
    if (selectedAudienceFilter.value === 'All Learners') {
      matchesAudience = (a.audience === 'All Learners' || a.audienceRaw === 'ALL_LEARNERS') && !a.targetLearnerId;
    } else if (selectedAudienceFilter.value === 'Individual Learner') {
      matchesAudience = !!a.targetLearnerId || a.audienceRaw === 'INDIVIDUAL_LEARNER' || a.audienceRaw === 'SPECIFIC_LEARNER';
    }

    const matchesCenter =
      !selectedCenterFilter.value || a.learningCenter === selectedCenterFilter.value;

    return matchesQuery && matchesAudience && matchesCenter;
  });
});

// Modal State: Create / Edit
const showModal = ref(false);
const editingAnnouncement = ref(null);

const form = reactive({
  title: '',
  message: '',
  learningCenterId: null,
  learningCenter: '',
  programLevel: '',
  datePosted: '',
});

// Dropdown & multi-select state
const isAudienceDropdownOpen = ref(false);
const learnerSearchQuery = ref('');
const isAllLearnersSelected = ref(true);
const selectedLearnerIds = ref([]);

function toggleAudienceDropdown() {
  isAudienceDropdownOpen.value = !isAudienceDropdownOpen.value;
  if (isAudienceDropdownOpen.value) {
    learnerSearchQuery.value = '';
  }
}

// Dynamic learner filtering: ONLY active learners matching current teacher + selected Center + selected Program Level
const filteredLearnersForForm = computed(() => {
  if (!form.learningCenterId || !form.programLevel) return [];

  return assignedLearnersList.value.filter((l) => {
    // 1. Must be active
    const isActive = (l.status || 'Active').toLowerCase() === 'active';
    if (!isActive) return false;

    // 2. Must match selected learning center
    const matchesCenter = Number(l.learningCenterId) === Number(form.learningCenterId);
    if (!matchesCenter) return false;

    // 3. Must match selected program level
    const lLevel = (l.level || '').toUpperCase();
    if (form.programLevel === 'A&E Elementary') {
      return lLevel.includes('ELEM');
    }
    if (form.programLevel === 'A&E Junior High') {
      return lLevel.includes('JUN');
    }
    return false;
  });
});

// Search filter inside Audience dropdown
const searchedLearnersForForm = computed(() => {
  const query = learnerSearchQuery.value.trim().toLowerCase();
  if (!query) return filteredLearnersForForm.value;
  return filteredLearnersForForm.value.filter((l) =>
    l.name.toLowerCase().includes(query)
  );
});

// Display text in the closed Audience dropdown field
const audienceDisplayText = computed(() => {
  if (filteredLearnersForForm.value.length === 0) {
    return 'No learners available';
  }
  if (isAllLearnersSelected.value) {
    return 'All Learners';
  }
  if (selectedLearnerIds.value.length === 0) {
    return 'Select learners...';
  }
  const selectedNames = filteredLearnersForForm.value
    .filter((l) => selectedLearnerIds.value.includes(l.id))
    .map((l) => l.name);

  if (selectedNames.length === 0) return 'All Learners';
  return selectedNames.join(', ');
});

function selectAllLearners() {
  isAllLearnersSelected.value = true;
  selectedLearnerIds.value = [];
}

function toggleLearnerSelection(learner) {
  isAllLearnersSelected.value = false;
  const idx = selectedLearnerIds.value.indexOf(learner.id);
  if (idx === -1) {
    selectedLearnerIds.value.push(learner.id);
  } else {
    selectedLearnerIds.value.splice(idx, 1);
  }

  // If all available individual learners are selected, switch to All Learners
  if (
    filteredLearnersForForm.value.length > 0 &&
    selectedLearnerIds.value.length === filteredLearnersForForm.value.length
  ) {
    isAllLearnersSelected.value = true;
    selectedLearnerIds.value = [];
  } else if (selectedLearnerIds.value.length === 0) {
    // If no learners selected, revert to All Learners
    isAllLearnersSelected.value = true;
  }
}

function isLearnerSelected(learnerId) {
  if (isAllLearnersSelected.value) {
    return false;
  }
  return selectedLearnerIds.value.includes(learnerId);
}

function openCreateModal() {
  editingAnnouncement.value = null;
  form.title = '';
  form.message = '';
  isAllLearnersSelected.value = true;
  selectedLearnerIds.value = [];
  learnerSearchQuery.value = '';
  isAudienceDropdownOpen.value = false;

  const defaultCenter = teacherLearningCenters.value[0];
  form.learningCenterId = defaultCenter ? defaultCenter.id : null;
  form.learningCenter = defaultCenter ? defaultCenter.name : '';

  form.programLevel = teacherAvailableProgramLevels.value[0] || 'A&E Elementary';
  form.datePosted = getTodayString();
  showModal.value = true;
}

function openEditModal(item) {
  editingAnnouncement.value = item;
  form.title = item.title;
  form.message = item.message || item.content;
  learnerSearchQuery.value = '';
  isAudienceDropdownOpen.value = false;

  const matchedCenter = teacherLearningCenters.value.find(
    (c) => Number(c.id) === Number(item.learningCenterId) || c.name === item.learningCenter
  ) || teacherLearningCenters.value[0];

  form.learningCenterId = matchedCenter ? matchedCenter.id : (item.learningCenterId || null);
  form.learningCenter = item.learningCenter || (matchedCenter ? matchedCenter.name : '');
  
  if (item.programLevel && teacherAvailableProgramLevels.value.includes(item.programLevel)) {
    form.programLevel = item.programLevel;
  } else {
    form.programLevel = teacherAvailableProgramLevels.value[0] || 'A&E Elementary';
  }

  if (item.targetLearnerId) {
    isAllLearnersSelected.value = false;
    selectedLearnerIds.value = [item.targetLearnerId];
  } else {
    isAllLearnersSelected.value = true;
    selectedLearnerIds.value = [];
  }

  form.datePosted = formatDateForInput(item.createdAt || item.datePosted || item.date);
  showModal.value = true;
}

function closeModal() {
  if (submitting.value) return;
  showModal.value = false;
  editingAnnouncement.value = null;
  isAudienceDropdownOpen.value = false;
  learnerSearchQuery.value = '';
}

function onProgramLevelChange() {
  isAudienceDropdownOpen.value = false;
  learnerSearchQuery.value = '';
  // Check if selected learners still match the new program level
  if (!isAllLearnersSelected.value) {
    selectedLearnerIds.value = selectedLearnerIds.value.filter((id) =>
      filteredLearnersForForm.value.some((l) => l.id === id)
    );
    if (selectedLearnerIds.value.length === 0) {
      isAllLearnersSelected.value = true;
    }
  }
}

function onLearningCenterChange() {
  const selectedCenter = teacherLearningCenters.value.find(
    (c) => Number(c.id) === Number(form.learningCenterId)
  );
  if (selectedCenter) {
    form.learningCenter = selectedCenter.name;
  }
  isAudienceDropdownOpen.value = false;
  learnerSearchQuery.value = '';
  // Check if selected learners still match the new center
  if (!isAllLearnersSelected.value) {
    selectedLearnerIds.value = selectedLearnerIds.value.filter((id) =>
      filteredLearnersForForm.value.some((l) => l.id === id)
    );
    if (selectedLearnerIds.value.length === 0) {
      isAllLearnersSelected.value = true;
    }
  }
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
  if (!form.learningCenterId) {
    alert('Please select a Learning Center.');
    return;
  }
  if (!form.programLevel) {
    alert('Please select a Program Level.');
    return;
  }
  if (filteredLearnersForForm.value.length === 0) {
    alert('No active learners found for the selected Learning Center and Program Level.');
    return;
  }

  const currentTid = teacherId.value || currentTeacher.value?.id || null;
  const selectedCenter = teacherLearningCenters.value.find(
    (c) => Number(c.id) === Number(form.learningCenterId)
  );
  const centerId = selectedCenter ? selectedCenter.id : form.learningCenterId;

  const isIndividual = !isAllLearnersSelected.value && selectedLearnerIds.value.length > 0;

  const payload = {
    title: form.title.trim(),
    message: form.message.trim(),
    content: form.message.trim(),
    audience: isIndividual ? 'INDIVIDUAL_LEARNER' : 'ALL_LEARNERS',
    learningCenterId: centerId ? Number(centerId) : null,
    programLevel: form.programLevel,
    teacherId: currentTid ? Number(currentTid) : null,
    creatorRole: 'TEACHER',
    datePosted: form.datePosted,
    date: form.datePosted,
    createdAt: form.datePosted ? new Date(form.datePosted).toISOString() : new Date().toISOString(),
    status: 'PUBLISHED',
  };

  submitting.value = true;
  try {
    if (editingAnnouncement.value) {
      if (isIndividual) {
        payload.targetLearnerId = selectedLearnerIds.value[0];
        const selectedLearner = filteredLearnersForForm.value.find(
          (l) => l.id === selectedLearnerIds.value[0]
        );
        payload.targetLearnerName = selectedLearner ? selectedLearner.name : null;
      } else {
        payload.targetLearnerId = null;
        payload.targetLearnerName = null;
      }

      await updateAnnouncement(editingAnnouncement.value.id, payload);
    } else {
      if (isIndividual) {
        if (selectedLearnerIds.value.length === 1) {
          payload.targetLearnerId = selectedLearnerIds.value[0];
          const selectedLearner = filteredLearnersForForm.value.find(
            (l) => l.id === selectedLearnerIds.value[0]
          );
          payload.targetLearnerName = selectedLearner ? selectedLearner.name : null;
          await createAnnouncement(payload);
        } else {
          payload.targetLearnerIds = selectedLearnerIds.value;
          await createAnnouncement(payload);
        }
      } else {
        payload.targetLearnerId = null;
        payload.targetLearnerName = null;
        await createAnnouncement(payload);
      }
    }

    await loadAnnouncements();
    closeModal();
  } catch (err) {
    console.error('Failed to save announcement:', err);
    alert(err.response?.data?.error || 'Failed to save announcement. Please check all required fields.');
  } finally {
    submitting.value = false;
  }
}

// View Details Modal
const showViewModal = ref(false);
const viewingAnnouncement = ref(null);

function openViewModal(item) {
  viewingAnnouncement.value = item;
  showViewModal.value = true;
}

// Delete Confirmation Modal
const showDeleteModal = ref(false);
const deletingAnnouncement = ref(null);

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
  await loadLearners();
  await loadTeacherLearningCenters();
  await loadAnnouncements();
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

.audience-specific {
  display: inline-block;
  font-weight: 600;
  color: #2563eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
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
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  box-sizing: border-box;
}

.btn-icon svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-icon-view {
  color: #2563eb;
  border-color: #cbd5e1;
}

.btn-icon-view:hover {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1d4ed8;
}

.btn-icon-edit {
  color: #475569;
  border-color: #cbd5e1;
}

.btn-icon-edit:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-icon-danger {
  color: #ef4444;
  border-color: #cbd5e1;
}

.btn-icon-danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}

/* Custom Multi-select Dropdown */
.audience-dropdown-group {
  position: relative;
}

.custom-dropdown-trigger {
  width: 100%;
  height: 42px;
  padding: 0 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.custom-dropdown-trigger:hover {
  border-color: #94a3b8;
}

.custom-dropdown-trigger.is-open {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.dropdown-trigger-text {
  font-size: 0.9rem;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 0.5rem;
}

.dropdown-chevron {
  color: #64748b;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.dropdown-chevron.is-rotated {
  transform: rotate(180deg);
}

.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: transparent;
}

.custom-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 101;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.dropdown-search-wrap svg {
  color: #94a3b8;
  flex-shrink: 0;
}

.dropdown-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  color: #0f172a;
  width: 100%;
  font-family: inherit;
}

.dropdown-search-clear {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 0.25rem;
}

.dropdown-options-list {
  max-height: 220px;
  overflow-y: auto;
  padding: 0.35rem 0;
}

.dropdown-option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
  transition: background 0.12s ease;
  user-select: none;
}

.dropdown-option-item:hover {
  background: #f1f5f9;
}

.dropdown-option-item.is-selected {
  background: #eff6ff;
}

.all-learners-item {
  font-weight: 600;
  border-bottom: 1px solid #f1f5f9;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.custom-checkbox.is-checked {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.option-name {
  font-size: 0.875rem;
  color: #1e293b;
  flex: 1;
}

.option-badge {
  font-size: 0.75rem;
  color: #64748b;
  background: #e2e8f0;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-weight: 500;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.25rem 0;
}

.dropdown-empty {
  padding: 1rem 0.85rem;
  text-align: center;
  font-size: 0.825rem;
  color: #64748b;
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

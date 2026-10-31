<template>
  <div class="page-container schedule-page">
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

    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/dashboard">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Schedule</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Schedule</h1>
        <p>Manage your learning sessions and activities.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openAddModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add Schedule</span>
      </button>
    </div>

    <!-- Filter Section -->
    <div class="filter-card schedule-filter-card">
      <!-- 1. View Toggle Buttons -->
      <div class="view-toggle-container">
        <div class="view-toggle-group">
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ active: currentView === 'list' }"
            @click="currentView = 'list'"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>List View</span>
          </button>
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ active: currentView === 'calendar' }"
            @click="currentView = 'calendar'"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Calendar View</span>
          </button>
        </div>
      </div>

      <!-- 2. Search Bar -->
      <div class="filter-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-search-input"
          placeholder="Search schedules..."
        />
      </div>

      <!-- 3. Dropdowns Row -->
      <div class="filter-dropdown-group">
        <!-- Activity Type Filter -->
        <div class="filter-dropdown-item">
          <label>Activity Type</label>
          <select v-model="selectedActivityType" class="filter-select">
            <option value="">All Activities</option>
            <option value="Learning Session">Learning Session</option>
            <option value="Module Consultation">Module Consultation</option>
            <option value="Assessment">Assessment</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <!-- Month Date Selector -->
        <div class="filter-dropdown-item">
          <label>Month</label>
          <div class="month-selector-wrap">
            <select v-model="selectedMonthKey" class="filter-select">
              <option v-for="m in monthOptions" :key="m.key" :value="m.key">
                {{ m.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW 1: List View -->
    <div v-if="currentView === 'list'" class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 45px;">#</th>
              <th style="width: 130px;">Date</th>
              <th style="width: 165px;">Time</th>
              <th>Activity</th>
              <th>Learning Center</th>
              <th>Description</th>
              <th style="width: 110px;">Status</th>
              <th class="th-actions" style="text-align: right; width: 80px;">Actions</th>
            </tr>
          </thead>
          <tbody v-if="filteredSchedules.length > 0">
            <tr v-for="(item, idx) in filteredSchedules" :key="item.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 500; white-space: nowrap;">{{ item.formattedDate }}</td>
              <td class="col-time" style="white-space: nowrap;">
                <span class="time-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ item.formattedTime }}
                </span>
              </td>
              <td>
                <div class="activity-title-cell">
                  <span class="activity-name">{{ item.title }}</span>
                  <span class="activity-type-tag" :class="getTypeTagClass(item.activityType || item.type)">
                    {{ item.activityType || item.type }}
                  </span>
                </div>
              </td>
              <td>
                <span class="center-pill">{{ item.learningCenter }}</span>
              </td>
              <td class="col-description">
                {{ item.description || '—' }}
              </td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(item.status)">
                  {{ item.status }}
                </span>
              </td>
              <td class="td-actions" style="text-align: right;">
                <div class="cell-actions" style="justify-content: flex-end;">
                  <!-- View Icon -->
                  <button
                    type="button"
                    class="btn-icon btn-icon-view"
                    title="View"
                    aria-label="View Schedule Details"
                    @click="openViewModal(item)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>

                  <!-- Edit Icon (Only for own schedule) -->
                  <button
                    v-if="canManageSchedule(item)"
                    type="button"
                    class="btn-icon btn-icon-edit"
                    title="Edit"
                    aria-label="Edit Schedule"
                    @click="openEditModal(item)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>

                  <!-- Delete Icon (Only for own schedule) -->
                  <button
                    v-if="canManageSchedule(item)"
                    type="button"
                    class="btn-icon btn-icon-danger"
                    title="Delete"
                    aria-label="Delete Schedule"
                    @click="openDeleteModal(item)"
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
      <div v-if="filteredSchedules.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h3>No schedules yet</h3>
        <p>Schedules created by the Admin will appear here.</p>
      </div>
    </div>

    <!-- VIEW 2: Calendar View -->
    <div v-if="currentView === 'calendar'" class="calendar-card">
      <!-- Calendar Controls Header -->
      <div class="calendar-header-bar">
        <div class="calendar-nav-controls">
          <button type="button" class="cal-nav-btn" @click="prevMonth" title="Previous Month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 class="calendar-month-title">{{ currentCalendarMonthLabel }}</h2>
          <button type="button" class="cal-nav-btn" @click="nextMonth" title="Next Month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <div class="calendar-header-actions">
          <button type="button" class="btn btn-secondary btn-sm" @click="jumpToToday">
            Today
          </button>
        </div>
      </div>

      <!-- Calendar Days of Week Header -->
      <div class="calendar-grid-header">
        <div class="cal-weekday">Sun</div>
        <div class="cal-weekday">Mon</div>
        <div class="cal-weekday">Tue</div>
        <div class="cal-weekday">Wed</div>
        <div class="cal-weekday">Thu</div>
        <div class="cal-weekday">Fri</div>
        <div class="cal-weekday">Sat</div>
      </div>

      <!-- Calendar Days Matrix -->
      <div class="calendar-grid-body">
        <div
          v-for="(cell, index) in calendarDays"
          :key="index"
          class="cal-day-cell"
          :class="{
            'other-month': !cell.isCurrentMonth,
            'is-today': cell.isToday,
            'has-events': cell.events.length > 0
          }"
          @click="onDayCellClick(cell)"
        >
          <div class="cal-day-header">
            <span class="cal-day-number">{{ cell.dayNumber }}</span>
            <span v-if="cell.events.length > 0" class="cal-event-count">
              {{ cell.events.length }}
            </span>
          </div>

          <div class="cal-events-list">
            <div
              v-for="event in cell.events"
              :key="event.id"
              class="cal-event-chip"
              :class="getEventChipClass(event.activityType || event.type)"
              :title="`${event.title} (${event.formattedTime})`"
              @click.stop="openViewModal(event)"
            >
              <span class="event-time-short">{{ event.startTime }}</span>
              <span class="event-title-short">{{ event.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: View Schedule Details -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal modal-schedule-view">
        <div class="modal-header">
          <div>
            <h2>Schedule Details</h2>
            <p class="modal-subtitle">Activity & Session Information</p>
          </div>
          <button type="button" class="modal-close" @click="showViewModal = false" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="details-list">
            <!-- Activity Title -->
            <div class="detail-row">
              <span class="detail-label">Activity Title</span>
              <span class="detail-value font-bold" style="font-size: 1.05rem;">
                {{ viewingSchedule?.title }}
              </span>
            </div>

            <!-- Date -->
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value font-medium">
                {{ viewingSchedule?.formattedDate }}
              </span>
            </div>

            <!-- Time -->
            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value font-medium">
                {{ viewingSchedule?.formattedTime }}
              </span>
            </div>

            <!-- Description -->
            <div class="detail-row">
              <span class="detail-label">Description</span>
              <span class="detail-value" style="white-space: pre-wrap; line-height: 1.5;">
                {{ viewingSchedule?.description || 'No additional description provided.' }}
              </span>
            </div>

            <!-- Created Date -->
            <div class="detail-row">
              <span class="detail-label">Created Date</span>
              <span class="detail-value text-muted" style="font-size: 0.825rem;">
                {{ formatCreatedDate(viewingSchedule?.createdAt) }}
              </span>
            </div>
          </div>

          <div class="modal-footer" style="padding: 1.15rem 0 0; margin-top: 1.25rem;">
            <button type="button" class="btn btn-secondary" @click="showViewModal = false">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Add / Edit Schedule -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal modal-schedule-form">
        <div class="modal-header">
          <div>
            <h2>{{ editingSchedule ? 'Edit Schedule' : 'Add Schedule' }}</h2>
            <p class="modal-subtitle">
              {{ editingSchedule ? 'Update session details' : 'Create a new learning session for your assigned learners' }}
            </p>
          </div>
          <button type="button" class="modal-close" @click="closeFormModal" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveSchedule">
            <!-- Date * -->
            <div class="form-group">
              <label class="form-label" for="teacher-sched-date">
                Date <span class="required">*</span>
              </label>
              <input
                id="teacher-sched-date"
                v-model="form.date"
                type="date"
                class="form-input"
                required
              />
            </div>

            <!-- Start Time & End Time * -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="teacher-sched-start">
                  Start Time <span class="required">*</span>
                </label>
                <input
                  id="teacher-sched-start"
                  v-model="form.startTime"
                  type="time"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="teacher-sched-end">
                  End Time <span class="required">*</span>
                </label>
                <input
                  id="teacher-sched-end"
                  v-model="form.endTime"
                  type="time"
                  class="form-input"
                  required
                />
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label" for="teacher-sched-desc">
                Description
              </label>
              <textarea
                id="teacher-sched-desc"
                v-model="form.description"
                rows="4"
                class="form-input"
                placeholder="Module discussion, activities, etc."
              ></textarea>
            </div>

            <!-- Modal Footer Buttons -->
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1.25rem;">
              <button type="button" class="btn btn-secondary" @click="closeFormModal" :disabled="submitting">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                {{ submitting ? 'Saving...' : editingSchedule ? 'Save Changes' : 'Save Schedule' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL: Delete Confirmation -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-delete-confirm">
        <div class="delete-icon-badge">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </div>
        <h2 class="delete-title">Delete Schedule</h2>
        <p class="delete-msg">
          Are you sure you want to delete
          <strong v-if="deletingSchedule?.title">"{{ deletingSchedule.title }}"</strong>?
          This action cannot be undone.
        </p>
        <div class="delete-actions-row">
          <button type="button" class="btn btn-secondary" @click="closeDeleteModal" :disabled="submitting">
            Cancel
          </button>
          <button type="button" class="btn btn-danger-custom" @click="confirmDelete" :disabled="submitting">
            {{ submitting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../api/schedules.js';
import { useTeacherSession } from '../composables/useTeacherSession.js';

const { teacherName, teacherId, assignedCenters } = useTeacherSession();

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

// --- View Mode: 'list' or 'calendar' ---
const currentView = ref('list');

// --- Filter State ---
const searchQuery = ref('');
const selectedActivityType = ref('');

// Month Options for dropdown filter
const monthOptions = [
  { key: '2026-08', label: 'August 2026', year: 2026, month: 7 },
  { key: '2026-09', label: 'September 2026', year: 2026, month: 8 },
  { key: '2026-10', label: 'October 2026', year: 2026, month: 9 },
  { key: '2026-11', label: 'November 2026', year: 2026, month: 10 },
  { key: '2026-12', label: 'December 2026', year: 2026, month: 11 },
  { key: '2027-01', label: 'January 2027', year: 2027, month: 0 },
];

const selectedMonthKey = ref('2026-09');

// Calendar active month / year tracker
const calYear = ref(2026);
const calMonth = ref(8); // 8 is September (0-indexed)

const currentCalendarMonthLabel = computed(() => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[calMonth.value]} ${calYear.value}`;
});

function prevMonth() {
  if (calMonth.value === 0) {
    calMonth.value = 11;
    calYear.value -= 1;
  } else {
    calMonth.value -= 1;
  }
  syncSelectedMonthDropdown();
}

function nextMonth() {
  if (calMonth.value === 11) {
    calMonth.value = 0;
    calYear.value += 1;
  } else {
    calMonth.value += 1;
  }
  syncSelectedMonthDropdown();
}

function jumpToToday() {
  calYear.value = 2026;
  calMonth.value = 8; // September
  syncSelectedMonthDropdown();
}

function syncSelectedMonthDropdown() {
  const m = String(calMonth.value + 1).padStart(2, '0');
  selectedMonthKey.value = `${calYear.value}-${m}`;
}

// Watch dropdown selection to sync calendar
watch(selectedMonthKey, (newVal) => {
  if (newVal) {
    const parts = newVal.split('-');
    if (parts.length === 2) {
      calYear.value = parseInt(parts[0], 10);
      calMonth.value = parseInt(parts[1], 10) - 1;
    }
  }
});

// --- Date Formatting Helpers ---
function formatToPhilippineTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const m = minutes || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(m, 10) - 1] || m;
  return `${monthName} ${parseInt(d, 10)}, ${y}`;
}

function formatCreatedDate(createdAt) {
  if (!createdAt) return '—';
  try {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return String(createdAt);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch (e) {
    return String(createdAt);
  }
}

// --- Schedules State ---
const schedules = ref([]);
const loading = ref(false);

async function loadSchedules() {
  loading.value = true;
  try {
    const res = await getSchedules();
    const data = res.data?.data || res.data || [];
    schedules.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load schedules in Teacher Portal:', err);
    schedules.value = [];
  } finally {
    loading.value = false;
  }
}

// Computed list with formatted display fields
const enrichedSchedules = computed(() => {
  return schedules.value.map((s) => ({
    ...s,
    formattedDate: formatDisplayDate(s.date),
    formattedTime: `${formatToPhilippineTime(s.startTime)} - ${formatToPhilippineTime(s.endTime)}`,
  }));
});

// Filtered schedules for List View
const filteredSchedules = computed(() => {
  return enrichedSchedules.value.filter((s) => {
    // 1. Search Query
    const q = searchQuery.value.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.title?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.learningCenter?.toLowerCase().includes(q);

    // 2. Activity Type
    const actType = s.activityType || s.type;
    const matchesType = !selectedActivityType.value || actType === selectedActivityType.value;

    // 3. Month Filter
    let matchesMonth = true;
    if (selectedMonthKey.value && s.date) {
      matchesMonth = s.date.startsWith(selectedMonthKey.value);
    }

    return matchesSearch && matchesType && matchesMonth;
  });
});

// --- Calendar Matrix Calculation ---
const calendarDays = computed(() => {
  const year = calYear.value;
  const month = calMonth.value;

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthNum = month === 0 ? 12 : month;
    const prevYearNum = month === 0 ? year - 1 : year;
    const dateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(dateStr),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === '2026-09-21';
    days.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: true,
      isToday,
      events: getEventsForDate(dateStr),
    });
  }

  // Next month leading days to complete grid (up to 35 or 42 cells)
  const totalCells = days.length <= 35 ? 35 : 42;
  const remaining = totalCells - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthNum = month === 11 ? 1 : month + 2;
    const nextYearNum = month === 11 ? year + 1 : year;
    const dateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(dateStr),
    });
  }

  return days;
});

function getEventsForDate(dateStr) {
  return enrichedSchedules.value.filter((s) => {
    if (s.date !== dateStr) return false;
    const actType = s.activityType || s.type;
    if (selectedActivityType.value && actType !== selectedActivityType.value) return false;
    if (searchQuery.value) {
      const q = searchQuery.value.trim().toLowerCase();
      const m =
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.learningCenter?.toLowerCase().includes(q);
      if (!m) return false;
    }
    return true;
  });
}

// --- Status & Tag Styles ---
function getStatusBadgeClass(status) {
  switch (status) {
    case 'Completed':
      return 'badge-muted';
    case 'Ongoing':
      return 'badge-warning';
    case 'Cancelled':
      return 'badge-error';
    case 'Upcoming':
    default:
      return 'badge-success';
  }
}

function getTypeTagClass(type) {
  switch (type) {
    case 'Learning Session':
      return 'tag-blue';
    case 'Module Consultation':
      return 'tag-purple';
    case 'Assessment':
      return 'tag-emerald';
    default:
      return 'tag-amber';
  }
}

function getEventChipClass(type) {
  switch (type) {
    case 'Learning Session':
      return 'chip-blue';
    case 'Module Consultation':
      return 'chip-purple';
    case 'Assessment':
      return 'chip-emerald';
    default:
      return 'chip-amber';
  }
}

// --- Modal State: View Details ---
const showViewModal = ref(false);
const viewingSchedule = ref(null);

function openViewModal(item) {
  viewingSchedule.value = item;
  showViewModal.value = true;
}

// --- Modal State: Add / Edit ---
const showFormModal = ref(false);
const editingSchedule = ref(null);
const submitting = ref(false);

const form = reactive({
  title: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '17:00',
  description: '',
  activityType: 'Learning Session',
  status: 'Upcoming',
});

function openAddModal() {
  editingSchedule.value = null;
  form.title = '';
  form.date = new Date().toISOString().split('T')[0];
  form.startTime = '09:00';
  form.endTime = '17:00';
  form.description = '';
  form.activityType = 'Learning Session';
  form.status = 'Upcoming';
  showFormModal.value = true;
}

function openAddModalWithDate(dateStr) {
  openAddModal();
  if (dateStr) {
    form.date = dateStr;
  }
}

function openEditModal(item) {
  editingSchedule.value = item;
  form.title = item.title || '';
  form.date = item.date || new Date().toISOString().split('T')[0];
  form.startTime = item.startTime || '09:00';
  form.endTime = item.endTime || '17:00';
  form.description = item.description || '';
  form.activityType = item.activityType || item.type || 'Learning Session';
  form.status = item.status || 'Upcoming';
  showFormModal.value = true;
}

function closeFormModal() {
  showFormModal.value = false;
  editingSchedule.value = null;
}

async function saveSchedule() {
  if (!form.date) {
    showToast('Please select a date.', 'error');
    return;
  }
  if (!form.startTime) {
    showToast('Please enter a start time.', 'error');
    return;
  }
  if (!form.endTime) {
    showToast('Please enter an end time.', 'error');
    return;
  }

  submitting.value = true;
  try {
    const descText = form.description ? form.description.trim() : '';
    const autoTitle = descText ? descText.split('\n')[0].slice(0, 60) : 'Learning Session';

    // Automatically use teacher's assigned learning center
    const centerId = assignedCenters.value?.[0]?.id || undefined;

    const payload = {
      title: editingSchedule.value?.title || form.title || autoTitle,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      description: descText || null,
      activityType: editingSchedule.value?.activityType || form.activityType || 'Learning Session',
      learningCenterId: editingSchedule.value?.learningCenterId || centerId,
      teacherId: teacherId.value || undefined,
      status: editingSchedule.value?.status || form.status || 'Upcoming',
    };

    if (editingSchedule.value) {
      await updateSchedule(editingSchedule.value.id, payload);
      showToast('Schedule updated successfully.');
    } else {
      await createSchedule(payload);
      showToast('Schedule created successfully.');
    }

    closeFormModal();
    await loadSchedules();
  } catch (err) {
    console.error('Error saving schedule:', err);
    const msg = err.response?.data?.error || 'Failed to save schedule.';
    showToast(msg, 'error');
  } finally {
    submitting.value = false;
  }
}

// --- Modal State: Delete Confirmation ---
const showDeleteModal = ref(false);
const deletingSchedule = ref(null);

function openDeleteModal(item) {
  deletingSchedule.value = item;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  deletingSchedule.value = null;
}

async function confirmDelete() {
  if (!deletingSchedule.value) return;
  submitting.value = true;
  try {
    await deleteSchedule(deletingSchedule.value.id);
    showToast('Schedule deleted successfully.');
    closeDeleteModal();
    await loadSchedules();
  } catch (err) {
    console.error('Error deleting schedule:', err);
    const msg = err.response?.data?.error || 'Failed to delete schedule.';
    showToast(msg, 'error');
  } finally {
    submitting.value = false;
  }
}

function canManageSchedule(item) {
  if (!item) return false;
  if (teacherId.value && item.teacherId && Number(item.teacherId) === Number(teacherId.value)) {
    return true;
  }
  if (item.teacher && teacherName.value && item.teacher.toLowerCase() === teacherName.value.toLowerCase()) {
    return true;
  }
  return false;
}

function onDayCellClick(cell) {
  if (cell.isCurrentMonth) {
    openAddModalWithDate(cell.dateStr);
  }
}

onMounted(() => {
  loadSchedules();
});
</script>

<style scoped>
/* Filter Card Customizations */
.schedule-filter-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.15rem 1.35rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-xs);
}

.view-toggle-container {
  display: flex;
  align-items: center;
}

.view-toggle-group {
  display: inline-flex;
  background: #f1f5f9;
  border-radius: var(--radius-md);
  padding: 3px;
  border: 1px solid var(--color-border);
}

.view-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.825rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.view-toggle-btn.active {
  background: #ffffff;
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.month-selector-wrap {
  position: relative;
}

/* Table Activity Styling */
.activity-title-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.9rem;
}

.activity-type-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.725rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
}

.tag-blue {
  background: #eff6ff;
  color: #1d4ed8;
}

.tag-purple {
  background: #faf5ff;
  color: #7e22ce;
}

.tag-emerald {
  background: #ecfdf5;
  color: #047857;
}

.tag-amber {
  background: #fffbeb;
  color: #b45309;
}

.tag-slate {
  background: #f1f5f9;
  color: #475569;
}

.time-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  background: #f8fafc;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  border: 1px solid var(--color-border-light);
}

.center-pill {
  font-weight: 500;
  color: var(--color-text);
  font-size: 0.875rem;
}

.col-description {
  max-width: 320px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* CALENDAR VIEW STYLES */
.calendar-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

.calendar-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: #ffffff;
}

.calendar-nav-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.calendar-month-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text);
  min-width: 180px;
}

.cal-nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: #ffffff;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cal-nav-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.calendar-grid-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid var(--color-border);
}

.cal-weekday {
  padding: 0.65rem 0.5rem;
  text-align: center;
  font-size: 0.775rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-grid-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--color-border-light);
  gap: 1px;
}

.cal-day-cell {
  background: #ffffff;
  min-height: 110px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  transition: background 0.15s ease;
  cursor: pointer;
}

.cal-day-cell:hover {
  background: #fafafa;
}

.cal-day-cell.other-month {
  background: #fcfdfd;
  opacity: 0.55;
}

.cal-day-cell.is-today {
  background: #eff6ff;
}

.cal-day-cell.is-today .cal-day-number {
  background: var(--color-primary);
  color: #ffffff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.cal-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}

.cal-day-number {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1;
}

.cal-event-count {
  font-size: 0.675rem;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-50);
  padding: 1px 5px;
  border-radius: 10px;
}

.cal-events-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.cal-event-chip {
  padding: 0.25rem 0.45rem;
  border-radius: 5px;
  font-size: 0.725rem;
  line-height: 1.25;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  border-left: 3px solid transparent;
}

.cal-event-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

.event-time-short {
  font-size: 0.65rem;
  font-weight: 600;
  opacity: 0.85;
}

.event-title-short {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Event Chip Color Themes */
.chip-blue {
  background: #eff6ff;
  color: #1e40af;
  border-left-color: #2563eb;
}

.chip-purple {
  background: #faf5ff;
  color: #6b21a8;
  border-left-color: #9333ea;
}

.chip-emerald {
  background: #ecfdf5;
  color: #065f46;
  border-left-color: #10b981;
}

.chip-amber {
  background: #fffbeb;
  color: #92400e;
  border-left-color: #f59e0b;
}

.chip-slate {
  background: #f1f5f9;
  color: #334155;
  border-left-color: #64748b;
}

/* Modals */
.modal-schedule-form {
  max-width: 540px;
  width: 100%;
}

.modal-schedule-view {
  max-width: 520px;
  width: 100%;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.radio-options-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.radio-option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text);
  cursor: pointer;
}

.radio-option-item input[type="radio"] {
  accent-color: var(--color-primary);
  width: 16px;
  height: 16px;
}

.specific-learner-box {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

/* Modals */
.modal-schedule-form {
  max-width: 540px;
  width: 100%;
}

.modal-schedule-view {
  max-width: 520px;
  width: 100%;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* View Modal Details */
.details-list {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-row-inline-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-label {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.detail-value {
  font-size: 0.925rem;
  color: var(--color-text);
}

.font-medium {
  font-weight: 500;
}

.font-semibold {
  font-weight: 600;
}

.font-bold {
  font-weight: 700;
}

.text-muted {
  color: var(--color-text-secondary);
}

/* Delete Modal */
.modal-delete-confirm {
  max-width: 440px;
  width: 100%;
  text-align: center;
  padding: 2.25rem 2rem 2rem;
}

.delete-icon-badge {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #fee2e2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.15rem;
}

.delete-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.delete-msg {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.delete-actions-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.btn-danger-custom {
  background: #dc2626;
  color: #ffffff;
  border: 1px solid #dc2626;
  padding: 0.55rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-danger-custom:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}

/* Toast styling */
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

<template>
  <div class="page-container attendance-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb-nav">
      <router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-link-muted">Attendance</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Take Attendance</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1 class="page-title">Take Attendance</h1>
        <p class="page-subtitle">Record attendance for your learners.</p>
      </div>

      <div class="header-actions">
        <router-link to="/dashboard/attendance/history" class="btn-link-history">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>View Attendance History</span>
        </router-link>
      </div>
    </div>

    <!-- Success Feedback Alert -->
    <div v-if="saveSuccessMessage" class="attendance-alert-success">
      <div class="alert-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="alert-body">
        <strong>Attendance Saved!</strong>
        <span>{{ saveSuccessMessage }}</span>
      </div>
      <button type="button" class="alert-dismiss-btn" @click="saveSuccessMessage = ''">&times;</button>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="attendance-alert-error">
      <div class="alert-icon-error">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="alert-body">
        <strong>Incomplete Information:</strong>
        <span>{{ errorMessage }}</span>
      </div>
      <button type="button" class="alert-dismiss-btn" @click="errorMessage = ''">&times;</button>
    </div>

    <!-- Session Information Card (Learning Center, ALS Level, Date) -->
    <div class="session-info-card">
      <div class="card-header-section">
        <div class="card-title-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h2 class="card-section-title">Session Information</h2>
        </div>
        <span class="required-note"><span class="required-star">*</span> Required fields</span>
      </div>

      <div class="session-form-grid">
        <!-- 1. Learning Center * -->
        <div class="form-group">
          <label class="form-label" for="session-center">
            Learning Center <span class="required-star">*</span>
          </label>
          <div class="select-wrapper">
            <select
              id="session-center"
              v-model="selectedCenter"
              class="form-select"
              @change="onSessionFieldChange"
            >
              <option value="" disabled>Select Learning Center</option>
              <option v-for="center in centerOptions" :key="center" :value="center">
                {{ center }}
              </option>
            </select>
            <span class="select-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>

        <!-- 2. ALS Level * (A&E Elementary & A&E Junior High only) -->
        <div class="form-group">
          <label class="form-label" for="session-level">
            ALS Level <span class="required-star">*</span>
          </label>
          <div class="select-wrapper">
            <select
              id="session-level"
              v-model="selectedProgramLevel"
              class="form-select"
              @change="onSessionFieldChange"
            >
              <option value="" disabled>Select ALS Level</option>
              <option value="A&E Elementary">A&E Elementary</option>
              <option value="A&E Junior High">A&E Junior High</option>
            </select>
            <span class="select-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>

        <!-- 3. Date * -->
        <div class="form-group">
          <label class="form-label" for="session-date">
            Date <span class="required-star">*</span>
          </label>
          <input
            id="session-date"
            v-model="attendanceDate"
            type="date"
            class="form-input"
            @change="onSessionFieldChange"
          />
        </div>
      </div>
    </div>

    <!-- Learner Attendance Recording Section -->
    <div class="attendance-table-container">
      <!-- Empty State: Before selecting all required fields -->
      <div v-if="!isSessionConfigured" class="incomplete-session-prompt">
        <div class="prompt-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
        <h3 class="prompt-title">Complete Attendance Information</h3>
        <p class="prompt-desc">
          Please select <strong>Learning Center</strong>, <strong>ALS Level</strong>, and <strong>Date</strong> to view assigned learners and record attendance.
        </p>
      </div>

      <!-- Session configured -> Replace empty state with Learner Attendance Table -->
      <div v-else class="table-card attendance-table-card">
        <!-- Table Toolbar: Learners Title, Sort By, Search, Apply -->
        <div class="table-toolbar">
          <div class="toolbar-title-wrap">
            <h3 class="toolbar-section-title">Learners</h3>
          </div>

          <div class="toolbar-controls-wrap">
            <!-- Sort By Dropdown -->
            <div class="sort-select-wrapper">
              <select v-model="sortOrder" class="sort-select" aria-label="Sort learners">
                <option value="asc">Learner Name (A-Z)</option>
                <option value="desc">Learner Name (Z-A)</option>
              </select>
              <span class="select-chevron">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </div>

            <!-- Search Field -->
            <div class="toolbar-search-wrapper">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                v-model="searchInput"
                type="text"
                class="search-input"
                placeholder="Search learner name..."
                @keydown.enter.prevent="applyFilters"
              />
              <button
                v-if="searchInput"
                type="button"
                class="clear-search-btn"
                @click="clearSearch"
                aria-label="Clear search"
              >
                &times;
              </button>
            </div>

            <!-- Apply Button -->
            <button type="button" class="btn-apply-filters" @click="applyFilters">
              Apply
            </button>
          </div>
        </div>

        <!-- Quick Batch Actions Toolbar Sub-Row -->
        <div class="batch-action-bar" v-if="filteredLearners.length > 0">
          <span class="batch-lbl">Quick mark:</span>
          <button type="button" class="btn-batch-action btn-batch-present" @click="markAll('Present')">
            Mark All Present
          </button>
          <button type="button" class="btn-batch-action btn-batch-absent" @click="markAll('Absent')">
            Mark All Absent
          </button>
          <span class="batch-count">
            Showing <strong>{{ filteredLearners.length }}</strong> learner{{ filteredLearners.length === 1 ? '' : 's' }}
          </span>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="state-container">
          <div class="state-spinner"></div>
          <p class="state-text">Loading assigned learners...</p>
        </div>

        <!-- Empty State: No learners found in DB -->
        <div v-else-if="filteredLearners.length === 0" class="empty-state-box">
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <h3 class="empty-state-title">No learners found</h3>
          <p class="empty-state-desc">
            No assigned learners match the selected Learning Center and ALS Level.
          </p>
        </div>

        <!-- Table View: Assigned Learners -->
        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 60px; text-align: center;">No.</th>
                <th>Learner Name</th>
                <th style="width: 220px;">ALS Level</th>
                <th style="width: 200px;">Learning Center</th>
                <th style="width: 250px; text-align: center;">Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(learner, idx) in filteredLearners"
                :key="learner.id"
                :class="{ 'row-absent': learner.status === 'Absent' }"
              >
                <td class="col-index" style="text-align: center;">{{ idx + 1 }}</td>
                <td class="col-name">
                  <span class="learner-name-text">{{ learner.name }}</span>
                  <span v-if="learner.lrn" class="learner-lrn-sub">LRN: {{ learner.lrn }}</span>
                </td>
                <td class="col-level table-cell-als-level">
                  {{ formatAlsLevel(learner.level || selectedProgramLevel) }}
                </td>
                <td class="col-center">
                  {{ learner.learningCenter || selectedCenter }}
                </td>
                <td class="col-status" style="text-align: center;">
                  <div class="attendance-radio-group">
                    <!-- Present Option -->
                    <label class="radio-option radio-present" :class="{ active: learner.status === 'Present' }">
                      <input
                        type="radio"
                        :name="`attendance_${learner.id}`"
                        value="Present"
                        v-model="learner.status"
                      />
                      <span class="radio-custom-circle"></span>
                      <span class="radio-text">Present</span>
                    </label>

                    <!-- Absent Option -->
                    <label class="radio-option radio-absent" :class="{ active: learner.status === 'Absent' }">
                      <input
                        type="radio"
                        :name="`attendance_${learner.id}`"
                        value="Absent"
                        v-model="learner.status"
                      />
                      <span class="radio-custom-circle"></span>
                      <span class="radio-text">Absent</span>
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Save Attendance Action Footer Bar -->
        <div class="attendance-footer-bar">
          <div class="footer-summary-counts">
            <span class="summary-pill pill-present">
              Present: <strong>{{ countPresent }}</strong>
            </span>
            <span class="summary-pill pill-absent">
              Absent: <strong>{{ countAbsent }}</strong>
            </span>
            <span class="summary-pill pill-total">
              Total: <strong>{{ filteredLearners.length }}</strong>
            </span>
          </div>

          <button
            type="button"
            class="btn btn-save-attendance"
            @click="saveAttendance"
            :disabled="filteredLearners.length === 0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Save Attendance</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getAssignedLearners } from '../api/learners.js';
import { recordAttendanceBatch } from '../api/attendance.js';

const { currentTeacher, teacherId, assignedCenters } = useTeacherSession();

function formatAlsLevel(val) {
  if (!val) return '—';
  const s = String(val).toUpperCase();
  if (s.includes('ELEM')) return 'A&E Elementary';
  if (s.includes('JUN') || s.includes('LOWER_SEC') || s.includes('SEC')) return 'A&E Junior High';
  return String(val).trim();
}

// Session Information Fields (Only 1. Learning Center, 2. ALS Level, 3. Date)
const selectedCenter = ref('');
const selectedProgramLevel = ref('');
const attendanceDate = ref('');

// UI state
const sortOrder = ref('asc');
const searchInput = ref('');
const appliedSortOrder = ref('asc');
const appliedSearchQuery = ref('');
const loading = ref(false);
const saveSuccessMessage = ref('');
const errorMessage = ref('');
const learners = ref([]);

const centerOptions = computed(() => {
  if (assignedCenters.value && assignedCenters.value.length > 0) {
    return assignedCenters.value.map((c) => c.name);
  }
  return ['Mapulog CLC', 'Poblacion CLC', 'Naawan Central LC'];
});

// Check whether all required fields (Learning Center, ALS Level, Date) are completed
const isSessionConfigured = computed(() => {
  return (
    Boolean(selectedCenter.value) &&
    Boolean(selectedProgramLevel.value) &&
    Boolean(attendanceDate.value)
  );
});

// Load real assigned learners from API based on teacherId, center, and ALS level
async function loadLearners() {
  if (!isSessionConfigured.value) {
    learners.value = [];
    return;
  }

  loading.value = true;
  try {
    const tid = teacherId.value || currentTeacher.value?.id;
    const params = {};
    if (tid) params.teacherId = tid;
    if (selectedProgramLevel.value) params.level = selectedProgramLevel.value;

    const { data } = await getAssignedLearners(params);
    if (Array.isArray(data) && data.length > 0) {
      // Filter by selected learning center and ALS level
      learners.value = data
        .filter((l) => {
          const lCenter = l.learningCenter || l.learningCenterDetails?.name;
          const matchCenter = !selectedCenter.value || lCenter === selectedCenter.value;
          const matchLevel = !selectedProgramLevel.value || 
            l.level === selectedProgramLevel.value ||
            ((selectedProgramLevel.value || '').toLowerCase().includes('junior') && (l.level || '').toLowerCase().includes('junior'));
          return matchCenter && matchLevel;
        })
        .map((l) => ({
          id: l.id,
          name: l.name || (l.lastName && l.firstName ? `${l.lastName}, ${l.firstName}${l.middleName ? ' ' + l.middleName : ''}` : (l.fullName || 'Learner')),
          lrn: l.lrn || '',
          level: l.level || selectedProgramLevel.value,
          learningCenter: l.learningCenter || l.learningCenterDetails?.name || selectedCenter.value,
          status: 'Present',
        }));
    } else {
      learners.value = [];
    }
  } catch (err) {
    console.warn('Could not load assigned learners:', err);
    learners.value = [];
  } finally {
    loading.value = false;
  }
}

function onSessionFieldChange() {
  if (isSessionConfigured.value) {
    loadLearners();
  } else {
    learners.value = [];
  }
}

function applyFilters() {
  appliedSortOrder.value = sortOrder.value;
  appliedSearchQuery.value = searchInput.value.trim();
}

function clearSearch() {
  searchInput.value = '';
  appliedSearchQuery.value = '';
}

const filteredLearners = computed(() => {
  let list = [...learners.value];

  // 1. Search by full name
  const query = (appliedSearchQuery.value || searchInput.value).trim().toLowerCase();
  if (query) {
    list = list.filter((l) => (l.name || '').toLowerCase().includes(query));
  }

  // 2. Sort alphabetically based on full name
  const currentSort = appliedSortOrder.value || sortOrder.value;
  list.sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    if (currentSort === 'desc') {
      return nameB.localeCompare(nameA);
    }
    return nameA.localeCompare(nameB);
  });

  return list;
});

const countPresent = computed(() => {
  return filteredLearners.value.filter((l) => l.status === 'Present').length;
});

const countAbsent = computed(() => {
  return filteredLearners.value.filter((l) => l.status === 'Absent').length;
});

function markAll(status) {
  filteredLearners.value.forEach((l) => {
    l.status = status;
  });
}

async function saveAttendance() {
  if (!isSessionConfigured.value) {
    errorMessage.value = 'Please select Learning Center, ALS Level, and Date to record attendance.';
    return;
  }

  if (filteredLearners.value.length === 0) {
    errorMessage.value = 'No learners available for the selected Learning Center and ALS Level.';
    return;
  }

  errorMessage.value = '';

  // Build the session attendance record based on Date, Learning Center, ALS Level
  const tid = teacherId.value || currentTeacher.value?.id;
  const sessionTitle = `${selectedProgramLevel.value} Attendance Session`;
  const matchedCenter = (assignedCenters.value || []).find((c) => c.name === selectedCenter.value);

  const newSessionRecord = {
    id: `sess_${Date.now()}`,
    sessionTitle,
    teacherId: tid,
    learningCenter: selectedCenter.value,
    learningCenterId: matchedCenter?.id || null,
    programLevel: selectedProgramLevel.value,
    date: attendanceDate.value,
    time: '—',
    timestamp: Date.now(),
    learners: filteredLearners.value.map((l) => ({
      id: l.id,
      name: l.name,
      level: l.level || selectedProgramLevel.value,
      learningCenter: l.learningCenter || selectedCenter.value,
      status: l.status,
      remarks: l.status === 'Present' ? '-' : 'Absent',
    })),
  };

  try {
    // 1. Save to teacher-scoped attendance sessions list
    const historyKey = tid ? `als_attendance_sessions_${tid}` : 'als_attendance_sessions';
    const rawHistory = localStorage.getItem(historyKey);
    const historySessions = rawHistory ? JSON.parse(rawHistory) : [];

    // Replace if same date, center, and level already recorded, or append
    const existingIdx = historySessions.findIndex(
      (s) =>
        s.date === newSessionRecord.date &&
        s.learningCenter === newSessionRecord.learningCenter &&
        s.programLevel === newSessionRecord.programLevel
    );

    if (existingIdx !== -1) {
      historySessions[existingIdx] = newSessionRecord;
    } else {
      historySessions.unshift(newSessionRecord);
    }

    localStorage.setItem(historyKey, JSON.stringify(historySessions));

    // Also update global history list with teacherId tag
    try {
      const rawGlobal = localStorage.getItem('als_attendance_sessions');
      const allGlobal = rawGlobal ? JSON.parse(rawGlobal) : [];
      const gIdx = allGlobal.findIndex(
        (s) =>
          s.date === newSessionRecord.date &&
          s.learningCenter === newSessionRecord.learningCenter &&
          s.programLevel === newSessionRecord.programLevel &&
          s.teacherId === tid
      );
      if (gIdx !== -1) allGlobal[gIdx] = newSessionRecord;
      else allGlobal.unshift(newSessionRecord);
      localStorage.setItem('als_attendance_sessions', JSON.stringify(allGlobal));
    } catch {
      // ignore
    }

    // 2. Also keep global sessions synced for Attendance Summary reports
    const globalKey = 'als_attendance_global_sessions';
    const rawGlobal = localStorage.getItem(globalKey);
    const globalSessions = rawGlobal ? JSON.parse(rawGlobal) : [];
    globalSessions.unshift({
      date: newSessionRecord.date,
      teacherId: tid,
      learningCenter: newSessionRecord.learningCenter,
      records: newSessionRecord.learners.map((l) => ({
        learnerId: l.id,
        learnerName: l.name,
        level: l.level,
        status: l.status,
      })),
      timestamp: Date.now(),
    });
    localStorage.setItem(globalKey, JSON.stringify(globalSessions));

    // 3. Sync to backend API (/api/attendance/batch) with authentication
    try {
      await recordAttendanceBatch({
        learningCenterId: matchedCenter?.id,
        teacherId: tid,
        sessionDate: newSessionRecord.date,
        records: newSessionRecord.learners.map((l) => ({
          learnerId: l.id,
          status: l.status.toUpperCase(),
          remarks: l.remarks,
        })),
      });
    } catch (err) {
      console.warn('Could not sync attendance to backend:', err);
    }

    saveSuccessMessage.value = `Attendance successfully recorded for ${filteredLearners.value.length} learner(s) on ${attendanceDate.value} (${countPresent.value} Present, ${countAbsent.value} Absent).`;
    setTimeout(() => {
      saveSuccessMessage.value = '';
    }, 6000);
  } catch (err) {
    console.error('Error saving attendance:', err);
    errorMessage.value = 'Failed to save attendance record. Please try again.';
  }
}
</script>

<style scoped>
.attendance-page {
  padding-bottom: 3.5rem;
}

/* Breadcrumb */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 1.25rem;
}

.breadcrumb-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-link-muted {
  color: #64748b;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

.breadcrumb-current {
  color: #0f172a;
  font-weight: 600;
}

/* Page Header */
.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.92rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
}

.btn-link-history {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-link-history:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Alerts */
.attendance-alert-success {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 0.95rem 1.25rem;
  margin-bottom: 1.25rem;
  color: #166534;
}

.alert-icon {
  width: 28px;
  height: 28px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #16a34a;
}

.attendance-alert-error {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 0.95rem 1.25rem;
  margin-bottom: 1.25rem;
  color: #991b1b;
}

.alert-icon-error {
  width: 28px;
  height: 28px;
  background: #fee2e2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #dc2626;
}

.alert-body {
  flex: 1;
  font-size: 0.9rem;
}

.alert-body strong {
  margin-right: 0.4rem;
}

.alert-dismiss-btn {
  background: transparent;
  border: none;
  font-size: 1.3rem;
  color: currentColor;
  opacity: 0.7;
  cursor: pointer;
  line-height: 1;
}

.alert-dismiss-btn:hover {
  opacity: 1;
}

/* Session Information Card */
.session-info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.15rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: #1e293b;
}

.card-section-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
}

.required-note {
  font-size: 0.78rem;
  color: #64748b;
}

.required-star {
  color: #dc2626;
  font-weight: bold;
}

/* 3-Column Horizontal Grid: Learning Center | ALS Level | Date */
.session-form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.15rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-select,
.form-input {
  width: 100%;
  height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 0.85rem;
  font-size: 0.9rem;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.form-select {
  appearance: none;
  padding-right: 2rem;
  cursor: pointer;
}

.select-chevron {
  position: absolute;
  right: 0.75rem;
  pointer-events: none;
  color: #64748b;
  display: flex;
  align-items: center;
}

.form-select:focus,
.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* Incomplete Session Prompt (Empty State) */
.incomplete-session-prompt {
  background: #ffffff;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 3.5rem 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

.prompt-icon {
  width: 54px;
  height: 54px;
  background: #eff6ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #2563eb;
}

.prompt-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem 0;
}

.prompt-desc {
  font-size: 0.9rem;
  color: #64748b;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Table Card */
.attendance-table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.table-toolbar {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.toolbar-section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.toolbar-controls-wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.sort-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 190px;
}

.sort-select {
  width: 100%;
  height: 42px;
  min-height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 1.85rem 0 0.85rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.sort-select:hover {
  border-color: #94a3b8;
}

.sort-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.toolbar-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 250px;
}

.toolbar-search-wrapper svg {
  position: absolute;
  left: 0.75rem;
  color: #94a3b8;
  pointer-events: none;
}

.toolbar-search-wrapper .search-input {
  width: 100%;
  height: 42px;
  min-height: 42px;
  padding-left: 2.25rem;
  padding-right: 2rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.toolbar-search-wrapper .search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 0.5rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
}

.clear-search-btn:hover {
  color: #475569;
}

.btn-apply-filters {
  height: 42px;
  min-height: 42px;
  box-sizing: border-box;
  padding: 0 1.15rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.btn-apply-filters:hover {
  background: #1d4ed8;
}

.batch-action-bar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1.25rem;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.batch-count {
  margin-left: auto;
  font-size: 0.82rem;
  color: #64748b;
}

.btn-batch-action {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-batch-present {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}

.btn-batch-present:hover {
  background: #dbeafe;
}

.btn-batch-absent {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.btn-batch-absent:hover {
  background: #fee2e2;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
  padding: 0.85rem 1.25rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #475569;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 0.95rem 1.25rem;
  font-size: 0.88rem;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.row-absent {
  background-color: #fffbfb;
}

.col-index {
  color: #64748b;
  font-weight: 600;
}

.col-name {
  font-weight: 600;
}

.learner-name-text {
  display: block;
  color: #0f172a;
}

.learner-lrn-sub {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: normal;
  margin-top: 0.15rem;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.775rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-elem {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.badge-jhs {
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
}

.col-center {
  color: #475569;
}

/* Radio Group: Present / Absent */
.attendance-radio-group {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  cursor: pointer;
  user-select: none;
  font-size: 0.84rem;
  font-weight: 600;
  transition: all 0.15s ease;
}

.radio-option input[type="radio"] {
  display: none;
}

.radio-custom-circle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: inline-block;
  transition: all 0.15s ease;
}

.radio-present.active {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #15803d;
}

.radio-present.active .radio-custom-circle {
  border-color: #22c55e;
  background: #22c55e;
  box-shadow: inset 0 0 0 2.5px #ffffff;
}

.radio-absent.active {
  background: #fef2f2;
  border-color: #ef4444;
  color: #b91c1c;
}

.radio-absent.active .radio-custom-circle {
  border-color: #ef4444;
  background: #ef4444;
  box-shadow: inset 0 0 0 2.5px #ffffff;
}

/* States */
.state-container {
  padding: 3rem 2rem;
  text-align: center;
}

.state-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-text {
  color: #64748b;
  font-size: 0.9rem;
}

.empty-state-box {
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-state-graphic {
  width: 54px;
  height: 54px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.85rem;
  color: #94a3b8;
}

.empty-state-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.35rem;
}

.empty-state-desc {
  font-size: 0.88rem;
  color: #64748b;
}

/* Save Attendance Footer Bar */
.attendance-footer-bar {
  padding: 1.15rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-summary-counts {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.summary-pill {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 500;
}

.pill-present {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.pill-absent {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.pill-total {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.btn-save-attendance {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 1.35rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
}

.btn-save-attendance:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-save-attendance:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .session-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="page-container attendance-history-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb-nav">
      <router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-link-muted">Attendance</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Attendance History</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1 class="page-title">Attendance History</h1>
        <p class="page-subtitle">View and monitor previous attendance sessions and learner attendance records.</p>
      </div>

      <div class="header-actions">
        <router-link to="/dashboard/attendance" class="btn-take-attendance">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Take Attendance</span>
        </router-link>
      </div>
    </div>

    <!-- Filter Section Card -->
    <div class="filter-card">
      <div class="filter-card-header">
        <div class="filter-header-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span class="filter-card-title">Filter Sessions</span>
        </div>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="btn-clear-filters"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </div>

      <div class="filters-grid">
        <!-- 1. Learning Center Dropdown -->
        <div class="filter-field">
          <label class="filter-label">Learning Center</label>
          <div class="select-wrapper">
            <select v-model="selectedCenter" class="filter-select">
              <option value="">All Learning Centers</option>
              <option v-for="center in centerOptions" :key="center" :value="center">
                {{ center }}
              </option>
            </select>
            <span class="select-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>

        <!-- 2. Program Level Dropdown (A&E Elementary & A&E Junior High School only) -->
        <div class="filter-field">
          <label class="filter-label">Program Level</label>
          <div class="select-wrapper">
            <select v-model="selectedProgramLevel" class="filter-select">
              <option value="">All Program Levels</option>
              <option value="A&E Elementary">A&E Elementary</option>
              <option value="A&E Junior High School">A&E Junior High School</option>
            </select>
            <span class="select-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>

        <!-- 3. Date Range: Start Date -->
        <div class="filter-field">
          <label class="filter-label">Start Date</label>
          <input
            v-model="startDate"
            type="date"
            class="filter-date-input"
            aria-label="Start Date"
          />
        </div>

        <!-- 4. Date Range: End Date -->
        <div class="filter-field">
          <label class="filter-label">End Date</label>
          <input
            v-model="endDate"
            type="date"
            class="filter-date-input"
            aria-label="End Date"
          />
        </div>

        <!-- 5. Search Bar -->
        <div class="filter-field search-field">
          <label class="filter-label">Search</label>
          <div class="search-input-wrapper">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="filter-search-input"
              placeholder="Search learner name or learning center..."
            />
            <button
              v-if="searchQuery"
              type="button"
              class="clear-search-btn"
              @click="searchQuery = ''"
              aria-label="Clear search query"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance Session Table Card -->
    <div class="table-card sessions-table-card">
      <!-- Empty State: Zero sample/dummy data -->
      <div v-if="filteredSessions.length === 0" class="empty-state-box">
        <div class="empty-icon-wrap">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h3 class="empty-title">
          {{ sessionsList.length === 0 ? 'No attendance sessions recorded yet' : 'No matching sessions found' }}
        </h3>
        <p class="empty-desc">
          {{ sessionsList.length === 0
            ? 'When you record attendance for a session in the Take Attendance page, it will automatically appear here.'
            : 'No recorded sessions match your selected filter criteria. Try adjusting or clearing your filters.'
          }}
        </p>
        <router-link
          v-if="sessionsList.length === 0"
          to="/dashboard/attendance"
          class="btn-primary-empty"
        >
          Record Attendance Now
        </router-link>
        <button
          v-else-if="hasActiveFilters"
          type="button"
          class="btn-primary-empty"
          @click="resetFilters"
        >
          Clear Filters
        </button>
      </div>

      <!-- Display user-recorded sessions -->
      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 55px; text-align: center;">No.</th>
              <th style="width: 160px;">Date</th>
              <th style="width: 220px;">Program Level</th>
              <th>Learning Center</th>
              <th style="width: 120px; text-align: center;">Learners</th>
              <th style="width: 90px; text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(session, idx) in filteredSessions"
              :key="session.id || idx"
              class="session-row"
              @click="openSessionModal(session)"
            >
              <td class="col-num" style="text-align: center;">{{ idx + 1 }}</td>
              <td class="col-date">
                <span class="date-text">{{ session.formattedDate || session.date }}</span>
              </td>
              <td class="col-program">
                <span
                  class="level-badge"
                  :class="session.programLevel === 'A&E Elementary' ? 'badge-elem' : 'badge-jhs'"
                >
                  {{ session.programLevel }}
                </span>
              </td>
              <td class="col-center">
                <span class="center-text">{{ session.learningCenter }}</span>
              </td>
              <td class="col-learners" style="text-align: center;">
                <span class="learners-badge">
                  {{ (session.learners && session.learners.length) || 0 }}
                </span>
              </td>
              <td class="col-action" style="text-align: center;" @click.stop>
                <!-- Action Column: Icon-only Eye Icon -->
                <button
                  type="button"
                  class="btn-action-icon"
                  title="View attendance details"
                  :aria-label="`View attendance details for ${session.sessionTitle}`"
                  @click="openSessionModal(session)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer / Count -->
      <div v-if="filteredSessions.length > 0" class="table-footer-bar">
        <span class="footer-count-text">
          Showing <strong>{{ filteredSessions.length }}</strong> recorded session{{ filteredSessions.length === 1 ? '' : 's' }}
        </span>
      </div>
    </div>

    <!-- Session Details Modal -->
    <div
      v-if="selectedSession"
      class="modal-backdrop"
      @click.self="closeSessionModal"
      @keydown.esc="closeSessionModal"
      tabindex="-1"
    >
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-session-title">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-header-text">
            <span class="modal-pre-title">Session Attendance Details</span>
            <h2 id="modal-session-title" class="modal-session-title">{{ selectedSession.sessionTitle }}</h2>
          </div>
          <button
            type="button"
            class="modal-close-btn"
            @click="closeSessionModal"
            aria-label="Close session details"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Session Metadata Header Cards -->
          <div class="session-meta-panel">
            <div class="meta-item">
              <span class="meta-label">Date</span>
              <span class="meta-value">{{ selectedSession.fullDateFormatted || selectedSession.formattedDate || selectedSession.date }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Time</span>
              <span class="meta-value">{{ selectedSession.time || '—' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Learning Center</span>
              <span class="meta-value text-primary">{{ selectedSession.learningCenter }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Program Level</span>
              <span
                class="level-badge"
                :class="selectedSession.programLevel === 'A&E Elementary' ? 'badge-elem' : 'badge-jhs'"
              >
                {{ selectedSession.programLevel }}
              </span>
            </div>
          </div>

          <!-- Session Summary Cards -->
          <div class="summary-cards-grid">
            <div class="summary-card card-total">
              <span class="card-label">Total Learners</span>
              <strong class="card-value">{{ modalStats.total }}</strong>
              <span class="card-hint">Recorded for this session</span>
            </div>

            <div class="summary-card card-present">
              <span class="card-label">Present</span>
              <strong class="card-value value-green">{{ modalStats.present }}</strong>
              <span class="card-hint">Learners in attendance</span>
            </div>

            <div class="summary-card card-absent">
              <span class="card-label">Absent</span>
              <strong class="card-value value-red">{{ modalStats.absent }}</strong>
              <span class="card-hint">Unexcused / excused</span>
            </div>

            <div class="summary-card card-rate">
              <span class="card-label">Attendance Rate</span>
              <strong class="card-value value-rate" :class="getRateColorClass(modalStats.rate)">
                {{ modalStats.rate }}%
              </strong>
              <span class="card-hint">Completion rate</span>
            </div>
          </div>

          <!-- Learner Attendance Records Table -->
          <div class="records-section">
            <div class="records-header">
              <h3 class="records-title">Learner Attendance Records</h3>
              <span class="records-subtitle">Showing only learners included in this specific session</span>
            </div>

            <div class="records-table-wrap">
              <table class="modal-records-table">
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">No.</th>
                    <th>Learner Name</th>
                    <th style="width: 200px;">Program Level</th>
                    <th style="width: 130px; text-align: center;">Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(learner, lIdx) in (selectedSession.learners || [])"
                    :key="learner.id || lIdx"
                    :class="{ 'row-absent-highlight': learner.status === 'Absent' }"
                  >
                    <td class="col-idx" style="text-align: center;">{{ lIdx + 1 }}</td>
                    <td class="col-learner-name">
                      <strong>{{ learner.name }}</strong>
                    </td>
                    <td class="col-learner-level">
                      {{ learner.level || selectedSession.programLevel }}
                    </td>
                    <td class="col-learner-status" style="text-align: center;">
                      <span
                        class="status-badge"
                        :class="learner.status === 'Present' ? 'badge-present' : 'badge-absent'"
                      >
                        <span class="status-dot"></span>
                        {{ learner.status }}
                      </span>
                    </td>
                    <td class="col-learner-remarks">
                      <span :class="{ 'text-muted': !learner.remarks || learner.remarks === '-' }">
                        {{ learner.remarks || '-' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn-close-modal" @click="closeSessionModal">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getAttendanceRecords } from '../api/attendance.js';

// Access teacher session context
const { currentTeacher, teacherId, assignedCenters } = useTeacherSession();

// Learning Center Options
const centerOptions = computed(() => {
  if (assignedCenters.value && assignedCenters.value.length > 0) {
    return assignedCenters.value.map((c) => c.name);
  }
  return ['Mapulog CLC', 'Poblacion CLC', 'Naawan Central LC'];
});

// Filters State
const selectedCenter = ref('');
const selectedProgramLevel = ref('');
const startDate = ref('');
const endDate = ref('');
const searchQuery = ref('');

// Modal State
const selectedSession = ref(null);

// User-entered sessions loaded dynamically from storage — ZERO dummy data!
const sessionsList = ref([]);

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(m, 10) - 1] || m;
  return `${monthName} ${parseInt(d, 10)}, ${y}`;
}

function formatFullDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = fullMonths[parseInt(m, 10) - 1] || m;
  return `${monthName} ${parseInt(d, 10)}, ${y}`;
}

// Retrieve saved attendance sessions for current teacher from backend API and storage
async function loadSavedSessions() {
  sessionsList.value = [];
  const tid = teacherId.value || currentTeacher.value?.id;
  if (!tid) return;

  try {
    // 1. Fetch live attendance records from backend
    let dbRecords = [];
    try {
      const { data } = await getAttendanceRecords({ teacherId: tid });
      if (Array.isArray(data)) dbRecords = data;
    } catch (e) {
      console.warn('Backend attendance fetch error:', e);
    }

    // 2. Fetch local sessions scoped to this teacher
    let localSessions = [];
    try {
      const raw = localStorage.getItem(`als_attendance_sessions_${tid}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localSessions = parsed;
      }
    } catch {
      // ignore
    }

    // 3. Build sessions from backend records
    const sessionMap = new Map();
    for (const r of dbRecords) {
      const sessionKey = `${r.date || r.sessionDate}_${r.learningCenterId || r.learningCenter}_${r.level || ''}`;
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, {
          id: `sess_db_${sessionKey}`,
          sessionTitle: `${r.level || 'A&E'} Attendance Session`,
          date: r.date || r.sessionDate,
          learningCenter: r.learningCenter,
          programLevel: r.level || 'A&E Elementary',
          teacherId: tid,
          time: '—',
          learners: [],
        });
      }
      sessionMap.get(sessionKey).learners.push({
        id: r.learnerId,
        name: r.learnerName,
        status: (r.status || 'PRESENT') === 'PRESENT' ? 'Present' : 'Absent',
        remarks: r.remarks,
      });
    }

    // Merge without duplicates
    const combined = [...sessionMap.values()];
    for (const ls of localSessions) {
      const key = `${ls.date}_${ls.learningCenter}_${ls.programLevel || ''}`;
      if (!sessionMap.has(key)) {
        combined.push(ls);
      }
    }

    sessionsList.value = combined.map((item) => ({
      ...item,
      formattedDate: item.formattedDate || formatDisplayDate(item.date),
      fullDateFormatted: item.fullDateFormatted || formatFullDisplayDate(item.date),
    }));
  } catch (err) {
    console.warn('Could not read saved sessions:', err);
    sessionsList.value = [];
  }
}

// Filter Computation
const hasActiveFilters = computed(() => {
  return (
    selectedCenter.value !== '' ||
    selectedProgramLevel.value !== '' ||
    startDate.value !== '' ||
    endDate.value !== '' ||
    searchQuery.value.trim() !== ''
  );
});

const filteredSessions = computed(() => {
  return sessionsList.value.filter((session) => {
    // 1. Learning Center Filter
    if (selectedCenter.value && session.learningCenter !== selectedCenter.value) {
      return false;
    }

    // 2. Program Level Filter (Only A&E Elementary & A&E Junior High School)
    if (selectedProgramLevel.value && session.programLevel !== selectedProgramLevel.value) {
      return false;
    }

    // 3. Date Range Filter
    if (startDate.value && session.date < startDate.value) {
      return false;
    }
    if (endDate.value && session.date > endDate.value) {
      return false;
    }

    // 4. Search Filter (Learner Name or Learning Center)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase();
      const matchCenter = (session.learningCenter || '').toLowerCase().includes(q);
      const matchLearner = Array.isArray(session.learners) && session.learners.some((l) =>
        (l.name || '').toLowerCase().includes(q)
      );
      if (!matchCenter && !matchLearner) {
        return false;
      }
    }

    return true;
  });
});

function resetFilters() {
  selectedCenter.value = '';
  selectedProgramLevel.value = '';
  startDate.value = '';
  endDate.value = '';
  searchQuery.value = '';
}

// Modal Handling
function openSessionModal(session) {
  selectedSession.value = session;
}

function closeSessionModal() {
  selectedSession.value = null;
}

// Modal Statistics Computation
const modalStats = computed(() => {
  if (!selectedSession.value || !Array.isArray(selectedSession.value.learners)) {
    return { total: 0, present: 0, absent: 0, rate: 0 };
  }
  const total = selectedSession.value.learners.length;
  const present = selectedSession.value.learners.filter((l) => l.status === 'Present').length;
  const absent = total - present;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  return { total, present, absent, rate };
});

function getRateColorClass(rate) {
  if (rate >= 85) return 'rate-high';
  if (rate >= 70) return 'rate-mid';
  return 'rate-low';
}

onMounted(() => {
  loadSavedSessions();
});
</script>

<style scoped>
.attendance-history-page {
  padding-bottom: 3.5rem;
}

/* Breadcrumbs */
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

.btn-take-attendance {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.15rem;
  background: #2563eb;
  color: #ffffff;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
  transition: all 0.15s ease;
}

.btn-take-attendance:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

/* Filter Card */
.filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.filter-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.filter-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 700;
}

.filter-card-title {
  color: #1e293b;
}

.btn-clear-filters {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.775rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-clear-filters:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(0, 1.35fr);
  gap: 0.85rem;
  align-items: flex-end;
  width: 100%;
}

.filter-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.search-field {
  min-width: 0;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #475569;
  letter-spacing: 0.03em;
  margin-bottom: 0.35rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.filter-select,
.filter-date-input,
.filter-search-input {
  width: 100%;
  height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 0.85rem;
  font-size: 0.875rem;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.filter-select {
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

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-input-wrapper svg {
  position: absolute;
  left: 0.75rem;
  color: #94a3b8;
  pointer-events: none;
}

.filter-search-input {
  padding-left: 2.25rem;
  padding-right: 2rem;
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

.filter-select:focus,
.filter-date-input:focus,
.filter-search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* Sessions Table Card */
.sessions-table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
  padding: 0.9rem 1.15rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #475569;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 0.95rem 1.15rem;
  font-size: 0.88rem;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.session-row {
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.session-row:hover {
  background-color: #f8fafc;
}

.col-num {
  color: #64748b;
  font-weight: 600;
  font-size: 0.82rem;
}

.col-date .date-text {
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
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

.col-center .center-text {
  color: #334155;
  font-weight: 500;
}

.learners-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 26px;
  padding: 0 0.5rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
}

/* Icon-Only Action Button */
.btn-action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action-icon:hover {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  transform: translateY(-1px);
}

/* Table Footer Bar */
.table-footer-bar {
  padding: 0.85rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 0.82rem;
  color: #64748b;
}

/* Empty State */
.empty-state-box {
  padding: 4rem 1.5rem;
  text-align: center;
}

.empty-icon-wrap {
  width: 60px;
  height: 60px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #94a3b8;
}

.empty-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.4rem;
}

.empty-desc {
  font-size: 0.88rem;
  color: #64748b;
  max-width: 440px;
  margin: 0 auto 1.5rem;
  line-height: 1.5;
}

.btn-primary-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.35rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s ease;
}

.btn-primary-empty:hover {
  background: #1d4ed8;
}

/* ==========================================================
   Session Details Modal
   ========================================================== */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.15s ease-out;
}

.modal-dialog {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: scaleUp 0.18s ease-out;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-pre-title {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #2563eb;
  margin-bottom: 0.2rem;
}

.modal-session-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.modal-close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Session Metadata Panel */
.session-meta-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.25rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-label {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
}

.meta-value {
  font-size: 0.92rem;
  font-weight: 600;
  color: #0f172a;
}

.text-primary {
  color: #2563eb;
}

/* Summary Cards Grid */
.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem;
}

.summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.03em;
  margin-bottom: 0.25rem;
}

.card-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
  margin-bottom: 0.2rem;
}

.value-green {
  color: #16a34a;
}

.value-red {
  color: #dc2626;
}

.rate-high {
  color: #16a34a;
}

.rate-mid {
  color: #d97706;
}

.rate-low {
  color: #dc2626;
}

.card-hint {
  font-size: 0.725rem;
  color: #94a3b8;
}

/* Learner Records Table */
.records-section {
  display: flex;
  flex-direction: column;
}

.records-header {
  margin-bottom: 0.75rem;
}

.records-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.records-subtitle {
  font-size: 0.8rem;
  color: #64748b;
}

.records-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.modal-records-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.modal-records-table th {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #475569;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #e2e8f0;
}

.modal-records-table td {
  padding: 0.85rem 1rem;
  font-size: 0.875rem;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.modal-records-table tr:last-child td {
  border-bottom: none;
}

.row-absent-highlight {
  background-color: #fffbfb;
}

.col-idx {
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.8rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.775rem;
  font-weight: 700;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.badge-present {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.badge-absent {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.col-learner-remarks {
  font-size: 0.825rem;
  color: #475569;
}

.text-muted {
  color: #94a3b8;
}

/* Modal Footer */
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
}

.btn-close-modal {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-close-modal:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr) 1fr 1fr;
  }
  .search-field {
    grid-column: span 4;
  }
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
  .search-field {
    grid-column: span 1;
  }
  .summary-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .session-meta-panel {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="page-container center-detail-page">
    <!-- Breadcrumb Navigation -->
    <nav class="breadcrumb-nav">
      <router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <router-link to="/dashboard/learning-centers" class="breadcrumb-link">My Learning Centers</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">{{ center?.name || 'Learning Center Details' }}</span>
    </nav>

    <!-- Loading State -->
    <div v-if="loading" class="state-container">
      <div class="state-icon-circle">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
          <line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
        </svg>
      </div>
      <h3 class="state-title">Loading learning center details...</h3>
    </div>

    <!-- Error State -->
    <div v-else-if="!center" class="state-container empty-state-card">
      <div class="empty-graphic-wrapper">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3 class="empty-title">Learning Center Not Found</h3>
      <p class="empty-desc">The requested learning center could not be found or is not assigned to you.</p>
      <router-link to="/dashboard/learning-centers" class="btn btn-primary" style="margin-top: 1rem;">
        Back to Learning Centers
      </router-link>
    </div>

    <template v-else>
      <!-- Center Information Overview Card (View-Only) -->
      <div class="center-header-card">
        <div class="center-header-top">
          <div class="center-title-row">
            <div class="center-icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21h18"/>
                <path d="M5 21V7l8-4v18"/>
                <path d="M19 21V11l-6-4"/>
                <path d="M9 9h1"/>
                <path d="M9 13h1"/>
                <path d="M9 17h1"/>
              </svg>
            </div>
            <div>
              <div class="title-with-pill">
                <h1 class="center-title">{{ center.name }}</h1>
                <span v-if="center.code" class="center-code-tag">{{ center.code }}</span>
              </div>
              <p class="center-subtitle">Learning Center assigned to you</p>
            </div>
          </div>

          <router-link to="/dashboard/learning-centers" class="btn-back-outline">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to Learning Centers</span>
          </router-link>
        </div>

        <!-- Detail Metrics Grid -->
        <div class="center-metrics-grid">
          <div class="metric-item">
            <span class="metric-label">Center Name</span>
            <span class="metric-value font-semibold">{{ center.name }}</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">Address</span>
            <span class="metric-value">{{ center.address || '—' }}</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">ALS Level</span>
            <span class="metric-value">
              <span class="program-level-tag">{{ centerProgramLevel }}</span>
            </span>
          </div>

          <div class="metric-item">
            <span class="metric-label">Total Learner</span>
            <span class="metric-value font-bold text-blue">{{ assignedLearnersInCenter.length }}</span>
          </div>
        </div>
      </div>

      <!-- Assigned Learners Section -->
      <div class="learners-card">
        <div class="card-header-bar">
          <div>
            <h2 class="card-title">Assigned Learners</h2>
            <p class="card-desc">Learners assigned to you in {{ center.name }}</p>
          </div>
          <span class="count-pill">{{ assignedLearnersInCenter.length }} {{ assignedLearnersInCenter.length === 1 ? 'Learner' : 'Learners' }}</span>
        </div>

        <!-- Empty Learners State -->
        <div v-if="assignedLearnersInCenter.length === 0" class="learners-empty-state">
          <div class="empty-icon-sub">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>No learners assigned yet</h3>
          <p>You currently have no learners assigned to you in this learning center.</p>
        </div>

        <!-- Learners Table -->
        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Learner Name</th>
                <th>LRN</th>
                <th>ALS Level</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: center; width: 100px;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(learner, idx) in assignedLearnersInCenter" :key="learner.id">
                <td class="col-num">{{ idx + 1 }}</td>
                <td class="col-name font-semibold" style="color: #0f172a;">{{ learner.name }}</td>
                <td class="col-lrn text-muted">{{ learner.lrn || '—' }}</td>
                <td class="col-level table-cell-als-level">{{ formatLearnerLevel(learner.level) }}</td>
                <td class="col-status" style="text-align: center;">
                  <span class="status-badge" :class="learner.status === 'Active' ? 'badge-active' : 'badge-inactive'">
                    {{ learner.status || 'Active' }}
                  </span>
                </td>
                <td class="col-action" style="text-align: center;">
                  <router-link
                    :to="`/dashboard/learners/${learner.id}`"
                    class="btn-view-icon"
                    title="View"
                    aria-label="View Learner Profile"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getTeacherProfile } from '../api/auth.js';
import { getAssignedLearners } from '../api/learners.js';
import { getLearningCenters, getLearningCenter } from '../api/learningCenters.js';

const route = useRoute();
const { currentTeacher, teacherId, assignedProgramLevel } = useTeacherSession();

const loading = ref(true);
const center = ref(null);
const assignedLearnersInCenter = ref([]);

function formatLearnerLevel(level) {
  if (!level) return '—';
  const lower = String(level).toLowerCase();
  if (lower.includes('elem')) return 'A&E Elementary';
  if (lower.includes('jun') || lower.includes('sec')) return 'A&E Junior High';
  return level;
}

async function loadCenterDetail() {
  loading.value = true;
  try {
    const idParam = route.params.id || route.params.clcId;
    const tid = teacherId.value || currentTeacher.value?.id;
    const queryProgramLevel = (route.query.programLevel || route.query.level || '').trim();

    // Prepare API params with level filter if provided
    const learnerParams = { teacherId: tid };
    if (queryProgramLevel) {
      if (queryProgramLevel.toLowerCase().includes('elem')) {
        learnerParams.level = 'ELEMENTARY';
      } else if (queryProgramLevel.toLowerCase().includes('jun') || queryProgramLevel.toLowerCase().includes('sec')) {
        learnerParams.level = 'JUNIOR';
      }
    }

    const [profileRes, learnersRes, allCentersRes] = await Promise.allSettled([
      tid ? getTeacherProfile(tid) : Promise.resolve(null),
      getAssignedLearners(learnerParams),
      getLearningCenters(),
    ]);

    const allCenters = allCentersRes.status === 'fulfilled' && Array.isArray(allCentersRes.value.data)
      ? allCentersRes.value.data
      : [];

    const learners = learnersRes.status === 'fulfilled' && Array.isArray(learnersRes.value.data)
      ? learnersRes.value.data
      : [];

    // Find center from allCenters by ID or slug/name
    let matchedCenter = null;
    const isNum = !isNaN(parseInt(idParam, 10)) && String(parseInt(idParam, 10)) === String(idParam);

    if (isNum) {
      matchedCenter = allCenters.find((c) => c.id === parseInt(idParam, 10));
      if (!matchedCenter) {
        try {
          const direct = await getLearningCenter(idParam);
          if (direct.data) matchedCenter = direct.data;
        } catch {
          // ignore
        }
      }
    }

    if (!matchedCenter) {
      // Try slug or name match
      const paramLower = String(idParam).toLowerCase();
      matchedCenter = allCenters.find((c) => {
        const slug = (c.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return slug === paramLower || c.name?.toLowerCase() === paramLower;
      });
    }

    // Check teacher assigned centers from profile or session if still not matched
    if (!matchedCenter && profileRes.status === 'fulfilled' && profileRes.value?.data) {
      const data = profileRes.value.data;
      const tCenters = data.learningCenters || (data.learningCenterDetails ? [data.learningCenterDetails] : []);
      matchedCenter = tCenters.find((c) => {
        const slug = (c.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return String(c.id) === String(idParam) || slug === String(idParam).toLowerCase();
      });
    }

    if (!matchedCenter && currentTeacher.value) {
      const tCenters = currentTeacher.value.learningCenters || (currentTeacher.value.learningCenterDetails ? [currentTeacher.value.learningCenterDetails] : []);
      matchedCenter = tCenters.find((c) => {
        const slug = (c.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return String(c.id) === String(idParam) || slug === String(idParam).toLowerCase();
      });
    }

    if (matchedCenter) {
      center.value = {
        id: matchedCenter.id,
        name: matchedCenter.name,
        code: matchedCenter.code || '',
        address:
          matchedCenter.address ||
          matchedCenter.location_address ||
          matchedCenter.locationAddress ||
          matchedCenter.location ||
          (matchedCenter.municipality ? `${matchedCenter.municipality}, ${matchedCenter.province || 'Misamis Oriental'}` : 'Naawan, Misamis Oriental'),
      };

      // Filter assigned learners for this teacher in this center
      let filteredLearners = learners.filter((l) => {
        if (matchedCenter.id && l.learningCenterId) {
          return Number(l.learningCenterId) === Number(matchedCenter.id);
        }
        if (l.learningCenter && matchedCenter.name) {
          return l.learningCenter.trim().toLowerCase() === matchedCenter.name.trim().toLowerCase();
        }
        return false;
      });

      // Filter by selected ALS Level if provided
      if (queryProgramLevel) {
        const isElem = queryProgramLevel.toLowerCase().includes('elem');
        const isJunior = queryProgramLevel.toLowerCase().includes('jun') || queryProgramLevel.toLowerCase().includes('sec');
        filteredLearners = filteredLearners.filter((l) => {
          const lvl = String(l.level || l.programLevel || '').toLowerCase();
          if (isElem) return lvl.includes('elem');
          if (isJunior) return lvl.includes('jun') || lvl.includes('sec');
          return true;
        });
      }

      assignedLearnersInCenter.value = filteredLearners;
    } else {
      center.value = null;
      assignedLearnersInCenter.value = [];
    }
  } catch (err) {
    console.error('Error loading learning center details:', err);
    center.value = null;
  } finally {
    loading.value = false;
  }
}

// Compute ALS level for this center based on selected query or actual learners
const centerProgramLevel = computed(() => {
  const qLevel = (route.query.programLevel || route.query.level || '').trim();
  if (qLevel) {
    if (qLevel.toLowerCase().includes('elem')) return 'A&E Elementary';
    if (qLevel.toLowerCase().includes('jun') || qLevel.toLowerCase().includes('sec')) return 'A&E Junior High';
    return qLevel;
  }

  const learners = assignedLearnersInCenter.value;
  const hasElem = learners.some((l) => String(l.level || '').toLowerCase().includes('elem'));
  const hasJun = learners.some((l) => String(l.level || '').toLowerCase().includes('jun') || String(l.level || '').toLowerCase().includes('sec'));

  if (hasElem && hasJun) {
    return 'A&E Elementary / A&E Junior High';
  }
  if (hasElem) {
    return 'A&E Elementary';
  }
  if (hasJun) {
    return 'A&E Junior High';
  }

  const tLevel = (assignedProgramLevel.value || '').trim();
  if (tLevel.toLowerCase().includes('elem') && !tLevel.toLowerCase().includes('jun')) {
    return 'A&E Elementary';
  }
  if ((tLevel.toLowerCase().includes('jun') || tLevel.toLowerCase().includes('sec')) && !tLevel.toLowerCase().includes('elem')) {
    return 'A&E Junior High';
  }
  return 'A&E Elementary / A&E Junior High';
});

watch(
  () => [route.params.id, route.params.clcId, route.query.programLevel, route.query.level],
  () => {
    loadCenterDetail();
  }
);

onMounted(() => {
  loadCenterDetail();
});
</script>

<style scoped>
.page-container {
  width: 100%;
  max-width: 100%;
  padding-bottom: 3rem;
  box-sizing: border-box;
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

.breadcrumb-separator {
  color: #cbd5e1;
}

.breadcrumb-current {
  color: #0f172a;
  font-weight: 600;
}

/* Overview Header Card */
.center-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.75rem 2rem;
  margin-bottom: 1.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.center-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 1.5rem;
}

.center-title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.center-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-with-pill {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.center-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.center-code-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
}

.center-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.btn-back-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.95rem;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 8px;
  font-size: 0.825rem;
  font-weight: 600;
  color: #334155;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-back-outline:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Detail Metrics Grid */
.center-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  font-size: 0.95rem;
  color: #0f172a;
}

.program-level-tag {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  background: #f1f5f9;
  color: #334155;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.font-semibold {
  font-weight: 600;
}

.font-bold {
  font-weight: 700;
}

.text-blue {
  color: #2563eb;
  font-size: 1.25rem;
}

/* Learners Card */
.learners-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.card-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.count-pill {
  padding: 0.25rem 0.65rem;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 0.775rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 0.95rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background-color: #f8fafc;
}

.col-num {
  color: #94a3b8;
  font-weight: 500;
}

.col-name {
  color: #0f172a;
}

.text-muted {
  color: #64748b;
}

.level-pill {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-active {
  background: #dcfce7;
  color: #15803d;
}

.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
}

.btn-view-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--action-view-border, #DCE7F6);
  background: var(--action-view-bg, #EFF6FF);
  border-radius: 6px;
  color: var(--action-view-color, #4169A8);
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-view-icon:hover {
  background: var(--action-view-hover-bg, #E0EEFE);
  color: var(--action-view-hover-color, #315488);
  border-color: var(--action-view-hover-border, #B9D3F4);
}

.btn-view-icon:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8);
  outline-offset: 1px;
  box-shadow: 0 0 0 3px var(--action-view-focus-ring, rgba(65, 105, 168, 0.35));
}

/* Loading & Empty States */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4.5rem 1.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
}

.state-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  margin-bottom: 1rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.state-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.35rem;
}

.empty-graphic-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.35rem;
}

.empty-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  max-width: 400px;
}

.learners-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1.5rem;
  text-align: center;
}

.empty-icon-sub {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.learners-empty-state h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.learners-empty-state p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.btn-primary {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: #ffffff;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.875rem;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>

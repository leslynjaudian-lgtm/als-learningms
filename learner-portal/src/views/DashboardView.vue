<template>
  <div class="dashboard-page">
    <!-- Welcome Header -->
    <div class="welcome-box">
      <h1 class="page-title">Welcome, {{ learnerName }}!</h1>
      <p class="page-subtitle">
        Keep learning. A brighter future is within your reach.
      </p>
    </div>

    <!-- Assignment Info Card: Teacher & Learning Center -->
    <div class="dashboard-info-card">
      <div class="info-column">
        <div class="info-icon-badge badge-clc">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div class="info-text-wrap">
          <div class="info-label label-clc">CLC</div>
          <div class="info-value value-clc" :title="displayLearningCenter">{{ displayLearningCenter }}</div>
        </div>
      </div>

      <div class="info-column">
        <div class="info-icon-badge badge-teacher">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="info-text-wrap">
          <div class="info-label label-teacher">Teacher</div>
          <div class="info-value value-teacher" :title="displayTeacher">{{ displayTeacher }}</div>
        </div>
      </div>
    </div>

    <!-- Announcement Alert (if available) -->
    <div
      v-if="latestAnnouncement"
      class="announcement-alert-card"
    >
      <div class="alert-content-left">
        <div class="alert-icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div class="alert-text-box">
          <div class="alert-eyebrow">Notice</div>
          <div class="alert-title">{{ latestAnnouncement.title }}</div>
          <div v-if="latestAnnouncement.message || latestAnnouncement.content" class="alert-preview">
            {{ latestAnnouncement.message || latestAnnouncement.content }}
          </div>
        </div>
      </div>
      <router-link to="/notifications" class="alert-link">
        View Notice →
      </router-link>
    </div>

    <!-- 4-Grid Stats (Default 0 when no data) -->
    <div class="stat-grid-2x2">
      <!-- Modules In Progress -->
      <div class="stat-item-box">
        <div class="stat-icon-row">
          <div class="stat-icon-badge" style="background: #eff6ff; color: #165dfc;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
        </div>
        <div class="stat-val">{{ stats.modulesInProgress }}</div>
        <div class="stat-label">Active<br />Modules</div>
      </div>

      <!-- Completed Modules -->
      <div class="stat-item-box">
        <div class="stat-icon-row">
          <div class="stat-icon-badge" style="background: #f0fdf4; color: #16a34a;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
        </div>
        <div class="stat-val">{{ stats.completedModules }}</div>
        <div class="stat-label">Completed<br />Modules</div>
      </div>

      <!-- Pending Assessments -->
      <div class="stat-item-box">
        <div class="stat-icon-row">
          <div class="stat-icon-badge" style="background: #fffbeb; color: #d97706;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1"/>
            </svg>
          </div>
        </div>
        <div class="stat-val">{{ stats.pendingAssessments }}</div>
        <div class="stat-label">Pending<br />Assessments</div>
      </div>

      <!-- Overall Progress -->
      <div class="stat-item-box">
        <div class="stat-icon-row">
          <div class="stat-icon-badge" style="background: #eff6ff; color: #2563eb;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
        </div>
        <div class="stat-val">{{ stats.overallProgress }}%</div>
        <div class="stat-label">Overall<br />Progress</div>
      </div>
    </div>

    <!-- New Learning Modules Section -->
    <div class="continue-learning-section">
      <div class="section-header-row">
        <h2 class="section-title">New Learning Modules</h2>
        <router-link to="/modules" class="section-link">
          View All ({{ newLearningModules.length }})
        </router-link>
      </div>

      <!-- If has new or in-progress modules -->
      <template v-if="newLearningModules.length > 0">
        <div
          v-for="mod in newLearningModules"
          :key="mod.id"
          class="learner-card active-module-card"
        >
          <div class="active-module-header">
            <div class="active-module-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div class="active-module-info">
              <h3 class="active-module-title">
                {{ mod.title }}
              </h3>
              <div class="active-module-strand">
                {{ getModuleStrand(mod) }}
              </div>
              <div class="active-module-teacher">
                Teacher: {{ mod.teacherName || mod.teacher?.fullName || (typeof mod.teacher === 'string' ? mod.teacher : 'Assigned Teacher') }}
              </div>
            </div>
          </div>

          <div class="active-module-progress-wrap">
            <div class="active-module-progress-text">
              {{ mod.progress || 0 }}%
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" :style="{ width: `${mod.progress || 0}%` }"></div>
            </div>
          </div>

          <router-link :to="`/modules/${mod.id}`" class="btn-primary continue-btn">
            {{ getModuleActionLabel(mod) }}
          </router-link>
        </div>
      </template>

      <!-- Empty state when all assigned modules are completed, or no unfinished modules are available -->
      <div v-else class="learner-card empty-module-card">
        <div class="empty-module-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <p class="empty-module-main-text">No new learning modules</p>
        <p class="empty-module-sub-text">
          Your teacher hasn't added any new modules yet.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import api from '../api/axios';
import { useNotifications } from '../composables/useNotifications.js';
import { formatStrandName } from '../utils/formatStrand.js';

const { notifications, fetchNotifications } = useNotifications();

const rawStored = localStorage.getItem('als_learner_user');
const userStored = ref(rawStored ? JSON.parse(rawStored) : {});

const learnerInfo = reactive({
  learningCenter: userStored.value.learningCenter && userStored.value.learningCenter !== '—' ? userStored.value.learningCenter : 'None Assigned',
  teacher: userStored.value.teacher && userStored.value.teacher !== '—' ? userStored.value.teacher : (userStored.value.assignedTeacher && userStored.value.assignedTeacher !== '—' ? userStored.value.assignedTeacher : 'None Assigned'),
  teacherFirstName: userStored.value.teacherDetails?.firstName || userStored.value.assignedTeacher?.firstName || userStored.value.teacherFirstName || '',
});

// Home Information Card display values:
// 1. CLC: Remove trailing "CLC" abbreviation from the displayed name (e.g. "Mapulog CLC" -> "Mapulog")
const displayLearningCenter = computed(() => {
  const lc = learnerInfo.learningCenter;
  if (!lc || lc === 'None Assigned' || lc === '—') return 'None Assigned';
  const trimmed = String(lc).trim();
  const cleaned = trimmed.replace(/\s*\(?\bCLC\b\)?\.?$/i, '').trim();
  return cleaned || trimmed;
});

// 2. Teacher: Display only First Name (e.g. "Abella Titaluth" -> "Abella")
const displayTeacher = computed(() => {
  if (learnerInfo.teacherFirstName && String(learnerInfo.teacherFirstName).trim()) {
    return String(learnerInfo.teacherFirstName).trim();
  }
  const teacher = learnerInfo.teacher;
  if (!teacher || teacher === 'None Assigned' || teacher === '—') return 'None Assigned';
  const raw = String(teacher).trim();
  if (raw.includes(',')) {
    const afterComma = raw.split(',')[1]?.trim();
    if (afterComma) return afterComma.split(/\s+/)[0];
  }
  return raw.split(/\s+/)[0];
});

const learnerName = ref(userStored.value.fullName || userStored.value.name || 'Learner');

const stats = reactive({
  modulesInProgress: 0,
  completedModules: 0,
  pendingAssessments: 0,
  overallProgress: 0,
});

const modules = ref([]);
const latestAnnouncement = ref(null);

// Module completion and progress checks (matching backend and My Modules)
function isModuleCompleted(mod) {
  if (!mod) return false;
  return Boolean(
    mod.completed === true ||
    mod.progressStatus === 'COMPLETED' ||
    (mod.progress != null && Number(mod.progress) >= 100)
  );
}

function isModuleInProgress(mod) {
  if (!mod || isModuleCompleted(mod)) return false;
  return Boolean(
    mod.progressStatus === 'IN_PROGRESS' ||
    (mod.progress != null && Number(mod.progress) > 0)
  );
}

function getModuleActionLabel(mod) {
  return isModuleInProgress(mod) ? 'Continue Module' : 'Open Module';
}

function getModuleStrand(mod) {
  if (!mod) return 'General Curriculum';
  const raw = mod.strand?.name || mod.strand || mod.learningArea?.name || 'General Curriculum';
  return formatStrandName(raw, mod.strand?.code || mod.code || mod.learningArea?.code);
}

// Published/assigned modules excluding mock dummy records
const assignedModules = computed(() => {
  return modules.value.filter(
    (m) => m && m.code !== 'LS2-MOCK-001' && m.id !== 'ls2-mock-001'
  );
});

// New Learning Modules section shows only NEW and IN_PROGRESS modules (completed modules are excluded)
const newLearningModules = computed(() => {
  return assignedModules.value.filter((m) => !isModuleCompleted(m));
});

async function loadLearnerData() {
  let meData = null;
  try {
    // 1. Fetch fresh learner profile from backend
    const meRes = await api.get('/learners/me');
    const d = meRes.data?.data || meRes.data;
    if (d) {
      meData = d;
      if (d.learningCenter) {
        learnerInfo.learningCenter = typeof d.learningCenter === 'string'
          ? d.learningCenter
          : (d.learningCenter.name || d.learningCenter.code || 'None Assigned');
      } else if (d.learningCenterDetails?.name) {
        learnerInfo.learningCenter = d.learningCenterDetails.name;
      }

      if (d.teacher || d.assignedTeacher) {
        const t = d.teacher || d.assignedTeacher;
        if (typeof t === 'object' && t !== null) {
          learnerInfo.teacher = t.fullName || t.name || 'None Assigned';
          if (t.firstName) learnerInfo.teacherFirstName = t.firstName;
        } else {
          learnerInfo.teacher = typeof t === 'string' ? t : 'None Assigned';
        }
      } else if (d.teacherDetails?.fullName) {
        learnerInfo.teacher = d.teacherDetails.fullName;
        if (d.teacherDetails.firstName) {
          learnerInfo.teacherFirstName = d.teacherDetails.firstName;
        }
      }

      if (d.fullName || d.name) {
        learnerName.value = d.fullName || d.name;
      }
    }
  } catch (err) {
    console.error('Failed to load profile details:', err);
  }

  try {
    // 2. Fetch scoped modules assigned to this learner
    const modulesRes = await api.get('/modules');
    const mods = modulesRes.data?.data || modulesRes.data || [];
    modules.value = Array.isArray(mods) ? mods : [];
    
    const validMods = assignedModules.value;
    const completed = validMods.filter(isModuleCompleted).length;
    const inProgress = validMods.filter(isModuleInProgress).length;
    stats.completedModules = completed;
    stats.modulesInProgress = inProgress;
    
    if (validMods.length > 0) {
      const totalProg = validMods.reduce((acc, m) => acc + (m.progress || 0), 0);
      stats.overallProgress = Math.round(totalProg / validMods.length);
    } else {
      stats.overallProgress = meData?.progress || 0;
    }

    let pendingCount = 0;
    for (const m of validMods) {
      if (Array.isArray(m.assessments)) {
        for (const ass of m.assessments) {
          if (!ass.attempts || ass.attempts.length === 0) {
            pendingCount++;
          }
        }
      }
    }
    stats.pendingAssessments = pendingCount;
  } catch (err) {
    console.error('Failed to load modules:', err);
    modules.value = [];
    stats.modulesInProgress = 0;
    stats.completedModules = 0;
    stats.pendingAssessments = 0;
    stats.overallProgress = 0;
  }

  try {
    // 3. Fetch latest announcements for learner
    let learnerId = null;
    let learningCenterId = null;
    try {
      const rawUser = localStorage.getItem('als_learner_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        learnerId = u.profile?.id || u.id;
        learningCenterId = u.profile?.learningCenterId || u.learningCenterId;
      }
    } catch (e) {
      // ignore
    }

    // If fresh profile from /me was loaded, prefer its IDs
    if (meData?.id) {
      learnerId = meData.id;
      learningCenterId = meData.learningCenterId || learningCenterId;
    }

    const annRes = await api.get('/announcements', {
      params: {
        portal: 'learner',
        learnerId: learnerId || undefined,
        learningCenterId: learningCenterId || undefined,
      },
    });
    const anns = annRes.data?.data || annRes.data || [];
    await fetchNotifications();
    if (Array.isArray(anns) && anns.length > 0) {
      // Prefer the most recent unread announcement if one exists, otherwise the latest announcement
      const unreadAnn = anns.find((a) =>
        notifications.value.some((n) => n.notificationKey === `announcement:${a.id}` && !n.isRead)
      );
      latestAnnouncement.value = unreadAnn || anns[0];
    }
  } catch (err) {
    console.warn('Could not load announcement for dashboard:', err);
  }
}

onMounted(() => {
  loadLearnerData();
  window.addEventListener('als-progress-updated', loadLearnerData);
  window.addEventListener('focus', loadLearnerData);
});

onUnmounted(() => {
  window.removeEventListener('als-progress-updated', loadLearnerData);
  window.removeEventListener('focus', loadLearnerData);
});
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 100%;
}

.welcome-box {
  margin-bottom: 0.15rem;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
  letter-spacing: -0.02em;
  word-break: break-word;
}

.page-subtitle {
  font-size: 0.825rem;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.4;
}

/* 2-column Assignment Info Card */
.dashboard-info-card {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f0f7ff 0%, #e0effe 100%);
  border: 1px solid #bae0fd;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.info-column {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.info-icon-badge {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.badge-clc {
  background: #0284c7;
  color: #ffffff;
}

.badge-teacher {
  background: #165dfc;
  color: #ffffff;
}

.info-text-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.info-label {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.2;
}

.label-clc {
  color: #0369a1;
}

.label-teacher {
  color: #1d4ed8;
}

.info-value {
  font-size: 0.85rem;
  font-weight: 800;
  color: #0c4a6e;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.value-teacher {
  color: #1e3a8a;
}

/* Announcement Alert Card */
.announcement-alert-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
}

.alert-content-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex: 1;
}

.alert-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #dbeafe;
  color: #165dfc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-text-box {
  min-width: 0;
  flex: 1;
}

.alert-eyebrow {
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #165dfc;
  letter-spacing: 0.04em;
}

.alert-title {
  font-size: 0.825rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-preview {
  font-size: 0.725rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-link {
  font-size: 0.75rem;
  font-weight: 700;
  color: #165dfc;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 4-Grid Stats (Strict 2x2) */
.stat-grid-2x2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  width: 100%;
}

.stat-item-box {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 118px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
}

.stat-icon-row {
  display: flex;
  align-items: center;
}

.stat-icon-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-val {
  font-size: 1.55rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
  margin-top: 0.45rem;
  margin-bottom: 0.15rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  line-height: 1.25;
}

/* New Learning Modules */
.continue-learning-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.section-link {
  font-size: 0.825rem;
  font-weight: 700;
  color: #165dfc;
}

.active-module-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.15rem;
}

.active-module-header {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}

.active-module-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eff6ff;
  color: #165dfc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.active-module-info {
  flex: 1;
  min-width: 0;
}

.active-module-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
  word-break: break-word;
}

.active-module-strand {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-module-teacher {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-module-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.active-module-progress-text {
  display: flex;
  justify-content: flex-end;
  font-size: 0.75rem;
  font-weight: 700;
  color: #165dfc;
}

.continue-btn {
  width: 100%;
  text-align: center;
  margin-top: 0.25rem;
}

.empty-module-card {
  padding: 1.75rem 1rem;
  text-align: center;
}

.empty-module-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 0.75rem;
  border-radius: 12px;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-module-main-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.empty-module-sub-text {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 2px;
}
</style>

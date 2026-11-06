<template>
  <div class="dashboard-page">
    <!-- Welcome Header -->
    <div class="welcome-box" style="margin-bottom: 1.25rem;">
      <h1 class="page-title">Welcome, {{ learnerName }}!</h1>
      <p class="page-subtitle" style="margin-bottom: 0;">
        Keep learning. A brighter future is within your reach.
      </p>
    </div>

    <!-- Assignment Info Card: Teacher & Learning Center -->
    <div class="learner-card" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <div style="width: 38px; height: 38px; border-radius: 10px; background: #0284c7; color: #ffffff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #0369a1; letter-spacing: 0.05em;">Community Learning Center</div>
          <div style="font-size: 0.875rem; font-weight: 800; color: #0c4a6e;">{{ learnerInfo.learningCenter || 'None Assigned' }}</div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <div style="width: 38px; height: 38px; border-radius: 10px; background: #165dfc; color: #ffffff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #1e40af; letter-spacing: 0.05em;">Assigned Teacher</div>
          <div style="font-size: 0.875rem; font-weight: 800; color: #1e3a8a;">{{ learnerInfo.teacher || 'None Assigned' }}</div>
        </div>
      </div>
    </div>

    <!-- Announcement Alert (if available) -->
    <div
      v-if="latestAnnouncement"
      class="learner-card"
      style="margin-bottom: 1.25rem; padding: 0.875rem 1rem; border-left: 4px solid #165dfc; background: #ffffff; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;"
    >
      <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: #eff6ff; color: #165dfc; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div style="min-width: 0;">
          <div style="font-size: 0.675rem; font-weight: 700; color: #165dfc; text-transform: uppercase; letter-spacing: 0.05em;">Notice</div>
          <div style="font-size: 0.875rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ latestAnnouncement.title }}</div>
          <div v-if="latestAnnouncement.message || latestAnnouncement.content" style="font-size: 0.775rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 0.15rem;">
            {{ latestAnnouncement.message || latestAnnouncement.content }}
          </div>
        </div>
      </div>
      <router-link to="/announcements" style="font-size: 0.8rem; font-weight: 700; color: #165dfc; white-space: nowrap; flex-shrink: 0;">
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

    <!-- Continue Learning Section -->
    <div class="continue-learning-section">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
        <h2 style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">Assigned Learning Modules</h2>
        <router-link to="/modules" style="font-size: 0.825rem; font-weight: 700; color: #165dfc;">
          View All ({{ modules.length }})
        </router-link>
      </div>

      <!-- If has active module -->
      <div v-if="activeModule" class="learner-card" style="display: flex; flex-direction: column; gap: 0.85rem; padding: 1.15rem;">
        <div style="display: flex; gap: 0.85rem; align-items: flex-start;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: #eff6ff; color: #165dfc; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1.25;">
              {{ activeModule.title }}
            </h3>
            <div style="font-size: 0.8rem; font-weight: 600; color: #64748b;">
              {{ activeModule.strand?.name || activeModule.strand || 'General Strand' }}
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">
              Teacher: {{ activeModule.teacher?.fullName || 'Assigned Teacher' }}
            </div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: flex-end; font-size: 0.75rem; font-weight: 700; color: #165dfc;">
            {{ activeModule.progress || 0 }}%
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: `${activeModule.progress || 0}%` }"></div>
          </div>
        </div>

        <router-link :to="`/modules/${activeModule.id}`" class="btn-primary" style="width: 100%; text-align: center; margin-top: 0.25rem;">
          Continue Learning
        </router-link>
      </div>

      <!-- Empty state when no modules in progress -->
      <div v-else class="learner-card" style="padding: 1.75rem 1rem; text-align: center;">
        <div style="width: 44px; height: 44px; margin: 0 auto 0.75rem; border-radius: 12px; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <p style="font-size: 0.875rem; font-weight: 600; color: #475569;">No learning modules available yet.</p>
        <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">
          Your assigned teacher ({{ learnerInfo.teacher || 'ALS Teacher' }}) will assign modules to your account.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import api from '../api/axios';
import { useNotifications } from '../composables/useNotifications.js';

const { notifications, fetchNotifications } = useNotifications();

const rawStored = localStorage.getItem('als_learner_user');
const userStored = ref(rawStored ? JSON.parse(rawStored) : {});

const learnerInfo = reactive({
  learningCenter: userStored.value.learningCenter && userStored.value.learningCenter !== '—' ? userStored.value.learningCenter : 'None Assigned',
  teacher: userStored.value.teacher && userStored.value.teacher !== '—' ? userStored.value.teacher : (userStored.value.assignedTeacher && userStored.value.assignedTeacher !== '—' ? userStored.value.assignedTeacher : 'None Assigned'),
});

const learnerName = ref(userStored.value.fullName || userStored.value.name || 'Learner');

const stats = reactive({
  modulesInProgress: 0,
  completedModules: 0,
  pendingAssessments: 0,
  overallProgress: 0,
});

const modules = ref([]);
const activeModule = ref(null);
const latestAnnouncement = ref(null);

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
        learnerInfo.teacher = typeof t === 'string'
          ? t
          : (t.fullName || t.name || 'None Assigned');
      } else if (d.teacherDetails?.fullName) {
        learnerInfo.teacher = d.teacherDetails.fullName;
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
    
    const completed = modules.value.filter((m) => m.completed || m.progressStatus === 'COMPLETED' || m.progress === 100).length;
    stats.completedModules = completed;
    stats.modulesInProgress = Math.max(0, modules.value.length - completed);
    
    if (modules.value.length > 0) {
      const totalProg = modules.value.reduce((acc, m) => acc + (m.progress || 0), 0);
      stats.overallProgress = Math.round(totalProg / modules.value.length);
      activeModule.value = modules.value.find((m) => !m.completed && m.progressStatus !== 'COMPLETED' && (m.progress || 0) < 100) || modules.value[0] || null;
    } else {
      stats.overallProgress = meData?.progress || 0;
      activeModule.value = null;
    }

    let pendingCount = 0;
    for (const m of modules.value) {
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
    activeModule.value = null;
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

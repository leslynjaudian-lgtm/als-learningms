<template>
  <div class="home-page">
    <!-- Welcome Section -->
    <section class="welcome-card" aria-label="Pagtimbaya">
      <div class="welcome-text-col">
        <h1 class="welcome-title">Maayong adlaw, {{ learnerFirstName }}!</h1>
        <p class="welcome-subtitle">Padayon sa imong pagtuon sa ALS.</p>
      </div>
      <div class="welcome-illustration" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>
    </section>

    <!-- Main Action — Continue Learning -->
    <section class="main-action-section" aria-label="Pangunahing Lakang">
      <div v-if="loadingModules" class="primary-action-card primary-action-loading">
        <div class="primary-action-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div class="primary-action-text">
          <span class="primary-action-kicker">Nagkarga...</span>
          <span class="primary-action-title">Gikuha ang imong mga module</span>
        </div>
      </div>

      <router-link
        v-else-if="currentUnfinishedModule"
        :to="`/modules/${currentUnfinishedModule.id}`"
        class="primary-action-card"
      >
        <div class="primary-action-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div class="primary-action-text">
          <span class="primary-action-kicker">Padayon sa Module</span>
          <span class="primary-action-title">{{ currentUnfinishedModule.title }}</span>
        </div>
        <div class="primary-action-arrow" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </router-link>

      <router-link
        v-else
        to="/modules"
        class="primary-action-card"
      >
        <div class="primary-action-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div class="primary-action-text">
          <span class="primary-action-kicker">Tan-awa ang mga Module</span>
          <span class="primary-action-title">
            {{ assignedModules.length > 0 ? 'Nahuman na nimo ang tanang module' : 'Ablihi ang imong mga module' }}
          </span>
        </div>
        <div class="primary-action-arrow" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </router-link>
    </section>

    <!-- Quick Access Menu (2x2 grid) -->
    <section class="quick-access-section" aria-label="Dali nga Pag-abli">
      <div class="quick-access-header">
        <h2 class="quick-access-heading">Mga Opsyon</h2>
        <p class="quick-access-subtitle">Pilia ug pindota ang usa sa mga opsyon sa ubos.</p>
      </div>
      <div class="quick-access-grid">
        <!-- Option 1: Akong mga Module (BookOpen) -->
        <router-link to="/modules" class="quick-access-card">
          <div class="quick-icon-wrap icon-blue" aria-hidden="true">
            <svg class="quick-option-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 7v14" />
              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
            </svg>
          </div>
          <span class="quick-card-label">Akong mga Module</span>
        </router-link>

        <!-- Option 2: Mga Pahibalo (Bell) -->
        <router-link to="/notifications" class="quick-access-card">
          <div class="quick-icon-wrap icon-blue" aria-hidden="true">
            <svg class="quick-option-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
            <span v-if="unreadCount > 0" class="quick-unread-dot" aria-hidden="true"></span>
          </div>
          <span class="quick-card-label">Mga Pahibalo</span>
        </router-link>

        <!-- Option 3: Tabang / Giya (CircleHelp) -->
        <router-link to="/help" class="quick-access-card">
          <div class="quick-icon-wrap icon-blue" aria-hidden="true">
            <svg class="quick-option-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <span class="quick-card-label">Tabang / Giya</span>
        </router-link>

        <!-- Option 4: Akong Profile (UserRound) -->
        <router-link to="/profile" class="quick-access-card">
          <div class="quick-icon-wrap icon-blue" aria-hidden="true">
            <svg class="quick-option-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
          </div>
          <span class="quick-card-label">Akong Profile</span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import api from '../api/axios';
import { useNotifications } from '../composables/useNotifications.js';

const { unreadCount, fetchNotifications } = useNotifications();

function loadStoredUser() {
  try {
    const raw = localStorage.getItem('als_learner_user');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const userStored = ref(loadStoredUser());
const modules = ref([]);
const loadingModules = ref(true);

function extractFirstName(userObj) {
  if (!userObj || typeof userObj !== 'object') return 'Learner';
  const explicitFirst = userObj.firstName || userObj.profile?.firstName;
  if (explicitFirst && String(explicitFirst).trim()) {
    return String(explicitFirst).trim();
  }
  const full = String(userObj.fullName || userObj.name || '').trim();
  if (!full) return 'Learner';
  if (full.includes(',')) {
    const afterComma = full.split(',')[1]?.trim();
    if (afterComma) return afterComma.split(/\s+/)[0];
  }
  return full.split(/\s+/)[0] || 'Learner';
}

const learnerFirstName = computed(() => extractFirstName(userStored.value));

function isModuleCompleted(mod) {
  if (!mod) return false;
  const pct = Number(mod.progress ?? 0);
  const hasSavedCompletedRecord =
    Array.isArray(mod.learnerProgress) &&
    mod.learnerProgress.some((lp) => lp && (lp.status === 'COMPLETED' || Boolean(lp.completedAt)));
  return Boolean(
    mod.completed === true ||
      mod.progressStatus === 'COMPLETED' ||
      Boolean(mod.completedAt) ||
      hasSavedCompletedRecord ||
      pct >= 100
  );
}

function isModuleInProgress(mod) {
  if (!mod || isModuleCompleted(mod)) return false;
  const pct = Number(mod.progress ?? 0);
  if (pct > 0) return true;

  const hasReadingActivity = Boolean(
    (mod.completedPages != null && Number(mod.completedPages) > 0) ||
      (Array.isArray(mod.pagesRead) && mod.pagesRead.length > 0) ||
      (Number(mod.highestPageReached) > 0 && Array.isArray(mod.pagesRead) && mod.pagesRead.length > 0) ||
      mod.readingStarted === true
  );

  const hasAssessmentActivity = Boolean(
    mod.preTestScore != null ||
      mod.postTestScore != null ||
      mod.hasPreTestAttempt === true ||
      (Array.isArray(mod.assessments) && mod.assessments.some((a) => Array.isArray(a.attempts) && a.attempts.length > 0))
  );

  const hasSubmissionActivity = Boolean(
    (Array.isArray(mod.submissions) && mod.submissions.length > 0) ||
      mod.activitySubmitted === true
  );

  return hasReadingActivity || hasAssessmentActivity || hasSubmissionActivity;
}

const assignedModules = computed(() => {
  return modules.value.filter(
    (m) =>
      m &&
      m.code !== 'LS2-MOCK-001' &&
      m.id !== 'ls2-mock-001' &&
      (!m.status || String(m.status).toUpperCase() === 'PUBLISHED')
  );
});

const currentUnfinishedModule = computed(() => {
  const unfinished = assignedModules.value.filter((mod) => !isModuleCompleted(mod));
  if (unfinished.length === 0) return null;
  const inProgress = unfinished.find((mod) => isModuleInProgress(mod));
  return inProgress || unfinished[0];
});

async function loadLearnerData() {
  loadingModules.value = modules.value.length === 0;
  try {
    const meRes = await api.get('/learners/me');
    const d = meRes.data?.data || meRes.data;
    if (d) {
      userStored.value = {
        ...userStored.value,
        ...d,
      };
    }
  } catch (err) {
    console.error('Failed to load profile details:', err);
  }

  try {
    const modulesRes = await api.get('/modules');
    const mods = modulesRes.data?.data || modulesRes.data || [];
    modules.value = Array.isArray(mods) ? mods : [];
  } catch (err) {
    console.error('Failed to load modules:', err);
    modules.value = [];
  } finally {
    loadingModules.value = false;
  }

  try {
    await fetchNotifications();
  } catch {
    // ignore notification refresh error
  }
}

function resetDashboardState() {
  modules.value = [];
  userStored.value = loadStoredUser();
}

onMounted(() => {
  loadLearnerData();
  window.addEventListener('als-progress-updated', loadLearnerData);
  window.addEventListener('als-learner-session-changed', resetDashboardState);
  window.addEventListener('focus', loadLearnerData);
});

onUnmounted(() => {
  window.removeEventListener('als-progress-updated', loadLearnerData);
  window.removeEventListener('als-learner-session-changed', resetDashboardState);
  window.removeEventListener('focus', loadLearnerData);
});
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  padding: 0.25rem 0;
}

/* Welcome Section */
.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.welcome-text-col {
  flex: 1;
  min-width: 0;
}

.welcome-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0b1e36;
  line-height: 1.25;
  margin: 0;
  word-break: break-word;
}

.welcome-subtitle {
  font-size: 0.95rem;
  color: #475569;
  margin: 0.3rem 0 0;
  line-height: 1.4;
}

.welcome-illustration {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #eff6ff;
  color: #165dfc;
  border: 1px solid #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Main Action — Continue Learning */
.main-action-section {
  width: 100%;
}

.primary-action-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  min-height: 84px;
  padding: 1.15rem 1.1rem;
  background: #165dfc;
  color: #ffffff;
  border-radius: 16px;
  text-decoration: none;
  border: 1px solid #165dfc;
  box-shadow: 0 2px 8px rgba(22, 93, 252, 0.2);
  transition: background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.primary-action-card:hover {
  background: #0d4ed8;
}

.primary-action-card:active {
  background: #1e40af;
  transform: scale(0.99);
}

.primary-action-loading {
  opacity: 0.85;
  cursor: default;
}

.primary-action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.primary-action-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.primary-action-kicker {
  font-size: 0.85rem;
  font-weight: 700;
  color: #dbeafe;
  line-height: 1.2;
}

.primary-action-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.3;
  word-break: break-word;
}

.primary-action-arrow {
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Quick Access Menu (2x2 grid) */
.quick-access-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.quick-access-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: left;
}

.quick-access-heading {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0b1e36;
  margin: 0;
}

.quick-access-subtitle {
  font-size: 0.9rem;
  color: #475569;
  margin: 0;
  line-height: 1.4;
}

.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: stretch;
}

.quick-access-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  height: 100%;
  min-width: 44px;
  min-height: 118px;
  padding: 1rem 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.12s ease, border-color 0.12s ease, transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}

.quick-access-card:hover {
  background: #f8fafc;
  border-color: #93c5fd;
}

.quick-access-card:active {
  background: #eff6ff;
  border-color: #165dfc;
  transform: scale(0.98);
}

.quick-access-card:focus-visible {
  outline: 2px solid #165dfc;
  outline-offset: 2px;
  border-color: #165dfc;
}

.quick-icon-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-option-svg {
  width: 28px;
  height: 28px;
  display: block;
  flex-shrink: 0;
}

.icon-blue {
  background: #eff6ff;
  color: #165dfc;
  border: 1px solid #dbeafe;
}

.quick-unread-dot {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #eff6ff;
}

.quick-card-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0b1e36;
  line-height: 1.25;
  text-align: center;
  word-break: break-word;
}

@media (max-width: 359px) {
  .quick-access-grid {
    gap: 0.6rem;
  }
  .quick-access-card {
    min-height: 108px;
    padding: 0.85rem 0.5rem;
  }
  .quick-icon-wrap {
    width: 48px;
    height: 48px;
  }
  .quick-option-svg {
    width: 26px;
    height: 26px;
  }
  .quick-card-label {
    font-size: 0.84rem;
  }
}

@media (max-width: 319px) {
  .quick-access-grid {
    grid-template-columns: 1fr;
  }
  .quick-access-card {
    min-height: 96px;
    padding: 0.85rem 0.75rem;
  }
}
</style>

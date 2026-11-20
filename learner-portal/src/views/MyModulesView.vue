<template>
  <div class="my-modules-page">
    <!-- Page Header -->
    <div class="modules-header">
      <h1 class="page-title">Akong mga Module</h1>
      <p class="page-subtitle">Pilia ang module nga gusto nimong tun-an.</p>
    </div>

    <!-- Three Simple Horizontal Filter Buttons -->
    <div class="filter-row" role="tablist" aria-label="Filter sa mga Module">
      <button
        type="button"
        role="tab"
        :aria-selected="currentFilter === 'all'"
        class="filter-btn"
        :class="{ active: currentFilter === 'all' }"
        @click="currentFilter = 'all'"
      >
        Tanan
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="currentFilter === 'in_progress'"
        class="filter-btn"
        :class="{ active: currentFilter === 'in_progress' }"
        @click="currentFilter = 'in_progress'"
      >
        Gipadayon
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="currentFilter === 'completed'"
        class="filter-btn"
        :class="{ active: currentFilter === 'completed' }"
        @click="currentFilter = 'completed'"
      >
        Nahuman
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="state-card">
      <p class="state-title">Nagkarga sa mga module...</p>
    </div>

    <!-- Empty State: No modules assigned -->
    <div v-else-if="allModules.length === 0" class="state-card">
      <div class="state-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <h2 class="state-title">Wala Pay Module</h2>
      <p class="state-desc">Wala pay naka-assign nga module sa pagkakaron.</p>
    </div>

    <!-- Empty State: Filtered list is empty -->
    <div v-else-if="filteredModules.length === 0" class="state-card">
      <h2 class="state-title">
        {{
          currentFilter === 'completed'
            ? 'Wala pay nahuman nga module'
            : 'Wala pay gipadayon nga module'
        }}
      </h2>
      <p class="state-desc">
        {{
          currentFilter === 'completed'
            ? 'Kung mahuman nimo ang usa ka module, makita nimo kini dinhi.'
            : 'Pindota ang Tanan aron makita ug masugdan ang imong mga module.'
        }}
      </p>
      <button type="button" class="state-action-btn" @click="currentFilter = 'all'">
        Tan-awa ang Tanan
      </button>
    </div>

    <!-- Module Cards List -->
    <div v-else class="modules-list">
      <article v-for="mod in filteredModules" :key="mod.id" class="module-card">
        <div class="module-card-top">
          <div class="module-thumb-wrap">
            <ModuleThumbnail
              :file-url="mod.fileUrl"
              :cover-image-url="mod.coverImageUrl"
              :title="mod.title"
              :module-id="mod.id"
            />
          </div>

          <div class="module-info-col">
            <h2 class="module-title">{{ mod.title }}</h2>
            <p class="module-strand">{{ getModuleStrandLabel(mod) }}</p>

            <div class="module-status-row">
              <span class="status-badge" :class="getStatusClass(mod)">
                {{ getStatusLabel(mod) }}
              </span>
              <span v-if="shouldShowProgress(mod)" class="progress-label">
                Progress: {{ getProgressPercent(mod) }}%
              </span>
            </div>

            <div v-if="shouldShowProgress(mod)" class="progress-track" aria-hidden="true">
              <div class="progress-fill" :style="{ width: `${getProgressPercent(mod)}%` }"></div>
            </div>
          </div>
        </div>

        <router-link :to="`/modules/${mod.id}`" class="module-action-btn">
          {{ getActionButtonLabel(mod) }}
        </router-link>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import api from '../api/axios';
import ModuleThumbnail from '../components/ModuleThumbnail.vue';
import { formatStrandCode, formatStrandName } from '../utils/formatStrand.js';

const currentFilter = ref('all');
const rawModules = ref([]);
const loading = ref(false);

const allModules = computed(() => {
  const list = Array.isArray(rawModules.value) ? rawModules.value : [];
  return list.filter(
    (m) =>
      m &&
      typeof m === 'object' &&
      m.code !== 'LS2-MOCK-001' &&
      m.id !== 'ls2-mock-001' &&
      (!m.status || String(m.status).toUpperCase() === 'PUBLISHED')
  );
});

function isModuleCompleted(mod) {
  if (!mod || typeof mod !== 'object') return false;
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

const filteredModules = computed(() => {
  const list = allModules.value;
  if (currentFilter.value === 'in_progress') {
    return list.filter((m) => isModuleInProgress(m));
  }
  if (currentFilter.value === 'completed') {
    return list.filter((m) => isModuleCompleted(m));
  }
  return list;
});

function getModuleStrandLabel(mod) {
  if (!mod || typeof mod !== 'object') return 'General Strand';
  const code = formatStrandCode(mod.learningArea?.code || mod.strandCode || '');
  const rawName = mod.learningArea?.name || mod.strand || 'General Strand';
  const name = formatStrandName(rawName, code);
  if (code && name) return `${code} – ${name}`;
  return code || name || 'General Strand';
}

function getStatusLabel(mod) {
  if (isModuleCompleted(mod)) return 'Nahuman';
  if (isModuleInProgress(mod)) return 'Padayon';
  return 'Wala Pa Nasugdi';
}

function getStatusClass(mod) {
  if (isModuleCompleted(mod)) return 'status-completed';
  if (isModuleInProgress(mod)) return 'status-in-progress';
  return 'status-not-started';
}

function getProgressPercent(mod) {
  if (isModuleCompleted(mod)) return 100;
  const pct = Math.round(Number(mod?.progress ?? 0));
  return Math.max(0, Math.min(100, pct));
}

function shouldShowProgress(mod) {
  if (isModuleCompleted(mod)) return true;
  if (isModuleInProgress(mod)) return mod?.progress != null;
  return Number(mod?.progress ?? 0) > 0;
}

function getActionButtonLabel(mod) {
  if (isModuleCompleted(mod)) return 'Tan-awa';
  if (isModuleInProgress(mod)) return 'Padayon';
  return 'Sugdi';
}

async function loadModules() {
  loading.value = rawModules.value.length === 0;
  try {
    const modRes = await api.get('/modules');
    const data = modRes.data?.data || modRes.data || [];
    rawModules.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load backend modules:', err);
    rawModules.value = [];
  } finally {
    loading.value = false;
  }
}

function resetModulesState() {
  rawModules.value = [];
}

onMounted(() => {
  loadModules();
  window.addEventListener('als-progress-updated', loadModules);
  window.addEventListener('als-learner-session-changed', resetModulesState);
  window.addEventListener('focus', loadModules);
});

onUnmounted(() => {
  window.removeEventListener('als-progress-updated', loadModules);
  window.removeEventListener('als-learner-session-changed', resetModulesState);
  window.removeEventListener('focus', loadModules);
});
</script>

<style scoped>
.my-modules-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1.5rem;
}

.modules-header {
  margin-bottom: 0.1rem;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0b1e36;
  margin: 0;
  line-height: 1.25;
}

.page-subtitle {
  font-size: 0.925rem;
  color: #475569;
  margin: 0.25rem 0 0;
  line-height: 1.4;
}

/* Three Simple Horizontal Filter Buttons */
.filter-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.filter-btn {
  min-height: 44px;
  padding: 0.6rem 0.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.925rem;
  font-weight: 700;
  color: #334155;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.filter-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.filter-btn.active {
  background: #165dfc;
  border-color: #165dfc;
  color: #ffffff;
}

/* State Cards */
.state-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 2rem 1.25rem;
  text-align: center;
}

.state-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 0.75rem;
  border-radius: 12px;
  background: #eff6ff;
  color: #165dfc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.state-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0b1e36;
  margin: 0 0 0.35rem;
}

.state-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.45;
}

.state-action-btn {
  margin-top: 1rem;
  min-height: 44px;
  padding: 0.6rem 1.25rem;
  background: #165dfc;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 12px;
}

/* Module Cards List */
.modules-list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.module-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1rem;
}

.module-card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.module-thumb-wrap {
  flex-shrink: 0;
}

.module-thumb-wrap :deep(.module-thumb-box) {
  width: 64px;
  height: 82px;
  border-radius: 10px;
}

.module-info-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.module-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0b1e36;
  line-height: 1.3;
  margin: 0;
  word-break: break-word;
}

.module-strand {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  line-height: 1.35;
  margin: 0;
}

.module-status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
}

.status-not-started {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.status-in-progress {
  background: #eff6ff;
  color: #165dfc;
  border: 1px solid #bfdbfe;
}

.status-completed {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.progress-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0b1e36;
}

.progress-track {
  width: 100%;
  height: 7px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
  margin-top: 0.2rem;
}

.progress-fill {
  height: 100%;
  background: #165dfc;
  border-radius: 9999px;
}

.module-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  padding: 0.75rem 1rem;
  background: #165dfc;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 12px;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.module-action-btn:hover {
  background: #0d4ed8;
}
</style>

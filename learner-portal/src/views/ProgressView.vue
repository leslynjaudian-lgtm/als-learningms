<template>
  <div class="progress-page">
    <h1 class="page-title">My Progress</h1>
    <p class="page-subtitle">Track your learning journey.</p>

    <!-- Loading State -->
    <div v-if="loading" class="learner-card" style="padding: 3rem 1.5rem; text-align: center; margin-bottom: 1.25rem;">
      <div class="progress-spinner"></div>
      <p style="font-size: 0.875rem; font-weight: 600; color: #475569; margin: 0.75rem 0 0;">Loading your progress...</p>
    </div>

    <!-- Error State (Do not show misleading 0% on failure) -->
    <div v-else-if="error" class="learner-card error-card" style="padding: 2rem 1.5rem; text-align: center; margin-bottom: 1.25rem;">
      <div class="error-icon-bubble">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3 style="font-size: 0.95rem; font-weight: 700; color: #991b1b; margin-bottom: 0.35rem;">Unable to Load Progress</h3>
      <p style="font-size: 0.8rem; color: #b91c1c; margin-bottom: 1rem;">{{ error }}</p>
      <button type="button" class="btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.4rem;" @click="loadProgress">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
        Retry
      </button>
    </div>

    <!-- Loaded Content -->
    <div v-else>
      <!-- Circular Progress Gauge Card -->
      <div class="learner-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem 1rem; margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 0.75rem;">
          Overall Progress
        </div>

        <!-- SVG Donut Chart -->
        <div style="position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
          <svg width="120" height="120" viewBox="0 0 120 120" style="transform: rotate(-90deg);">
            <!-- Track -->
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="transparent"
              stroke="#e2e8f0"
              stroke-width="10"
            />
            <!-- Fill -->
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="transparent"
              stroke="#165dfc"
              stroke-width="10"
              stroke-dasharray="301.59"
              :stroke-dashoffset="301.59 - (301.59 * overallProgress / 100)"
              stroke-linecap="round"
            />
          </svg>

          <div style="position: absolute; text-align: center;">
            <div style="font-size: 1.6rem; font-weight: 800; color: #0f172a; line-height: 1;">
              {{ overallProgress }}%
            </div>
          </div>
        </div>

        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.75rem;">
          Overall Progress
        </div>
      </div>

      <!-- 2 Metric Summary Boxes -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.25rem;">
        <div class="learner-card" style="display: flex; gap: 0.65rem; align-items: center; padding: 0.85rem;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: #eff6ff; color: #165dfc; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a; line-height: 1.1;">
              {{ modulesCompleted }} / {{ totalModules }}
            </div>
            <div style="font-size: 0.7rem; font-weight: 600; color: #64748b;">Modules<br />Completed</div>
          </div>
        </div>

        <div class="learner-card" style="display: flex; gap: 0.65rem; align-items: center; padding: 0.85rem;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: #fffbeb; color: #d97706; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1"/>
            </svg>
          </div>
          <div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a; line-height: 1.1;">
              {{ assessmentsTaken }} / {{ totalAssessments }}
            </div>
            <div style="font-size: 0.7rem; font-weight: 600; color: #64748b;">Assessments<br />Taken</div>
          </div>
        </div>
      </div>

      <!-- Empty State Explanation (When learner has no assigned modules) -->
      <div v-if="totalModules === 0" class="learner-card empty-notice-box" style="margin-bottom: 1.25rem; padding: 1.15rem; background: #f8fafc; border: 1px dashed #cbd5e1; text-align: center;">
        <div style="width: 36px; height: 36px; margin: 0 auto 0.5rem; border-radius: 10px; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
        <p style="font-size: 0.8rem; font-weight: 700; color: #475569; margin: 0 0 0.25rem;">No Modules Assigned Yet</p>
        <p style="font-size: 0.75rem; color: #64748b; margin: 0; line-height: 1.4;">
          Your assigned teacher will assign learning modules to your account. Your progress and assessments will update automatically as you complete them.
        </p>
      </div>

      <!-- Learning Strands Progress (All 7 Official ALS Strands) -->
      <div class="learner-card strands-card" style="padding: 1.15rem;">
        <h2 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-bottom: 1.1rem;">
          Learning Strands Progress
        </h2>

        <div style="display: flex; flex-direction: column; gap: 1.15rem;">
          <div v-for="strand in strands" :key="strand.code || strand.name" class="strand-item">
            <!-- Strand Header: Title + Percentage -->
            <div class="strand-header">
              <span class="strand-title">{{ strand.name }}</span>
              <span class="strand-pct">{{ strand.progress }}%</span>
            </div>

            <!-- Progress Bar Track -->
            <div class="progress-bar-track" style="height: 6px;">
              <div class="progress-bar-fill" :style="{ width: `${strand.progress}%` }"></div>
            </div>

            <!-- Module Count / Status Detail -->
            <div class="strand-detail">
              <span v-if="strand.totalModules > 0">
                {{ strand.modulesCompleted }} / {{ strand.totalModules }} modules completed
              </span>
              <span v-else class="strand-empty-tag">
                No modules assigned yet
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../api/axios';

const loading = ref(true);
const error = ref(null);

const overallProgress = ref(0);
const modulesCompleted = ref(0);
const totalModules = ref(0);
const assessmentsTaken = ref(0);
const totalAssessments = ref(0);

// All 7 official ALS Learning Strands initialized
const strands = ref([
  {
    code: 'LS1-ENG',
    name: 'LS1 — Communication Skills (English)',
    progress: 0,
    modulesCompleted: 0,
    totalModules: 0,
  },
  {
    code: 'LS1-FIL',
    name: 'LS1 — Communication Skills (Filipino)',
    progress: 0,
    modulesCompleted: 0,
    totalModules: 0,
  },
  {
    code: 'LS2',
    name: 'LS2 — Scientific Literacy and Critical Thinking Skills',
    progress: 0,
    modulesCompleted: 0,
    totalModules: 0,
  },
  {
    code: 'LS3',
    name: 'LS3 — Mathematical and Problem Solving Skills',
    progress: 0,
    modulesCompleted: 0,
    totalModules: 0,
  },
  {
    code: 'LS4',
    name: 'LS4 — Life and Career Skills',
    progress: 0,
    modulesCompleted: 0,
    totalModules: 0,
  },
  {
    code: 'LS5',
    name: 'LS5 — Understanding the Self and Society',
    progress: 0,
    modulesCompleted: 0,
    totalModules: 0,
  },
  {
    code: 'LS6',
    name: 'LS6 — Digital Citizenship',
    progress: 0,
    modulesCompleted: 0,
    totalModules: 0,
  },
]);

async function loadProgress() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get('/learners/me/progress');
    const d = res.data?.data || res.data;
    if (d) {
      overallProgress.value = Number(d.overallProgress) || 0;
      modulesCompleted.value = Number(d.modulesCompleted) || 0;
      totalModules.value = Number(d.totalModules) || 0;
      assessmentsTaken.value = Number(d.assessmentsTaken) || 0;
      totalAssessments.value = Number(d.totalAssessments) || 0;

      if (Array.isArray(d.strands) && d.strands.length > 0) {
        strands.value = d.strands;
      }
    }
  } catch (err) {
    console.error('Failed to load learner progress metrics:', err);
    error.value = err.response?.data?.error || err.message || 'Unable to connect to the server to load progress.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadProgress();
});
</script>

<style scoped>
.progress-page {
  /* Generous bottom padding to ensure fixed bottom navigation bar (.bottom-nav) never overlaps the 7th strand */
  padding-bottom: 4rem;
}

.progress-spinner {
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border: 3px solid #e2e8f0;
  border-top-color: #165dfc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-card {
  border: 1px solid #fecaca;
  background: #fff5f5;
}

.error-icon-bubble {
  width: 42px;
  height: 42px;
  margin: 0 auto 0.75rem;
  border-radius: 50%;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
}

.strand-item {
  display: flex;
  flex-direction: column;
}

.strand-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.strand-title {
  color: #334155;
  line-height: 1.3;
}

.strand-pct {
  color: #165dfc;
  flex-shrink: 0;
}

.strand-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.strand-empty-tag {
  color: #94a3b8;
  font-style: italic;
}
</style>

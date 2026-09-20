<template>
  <div class="dashboard-page">
    <!-- Welcome Header -->
    <div class="welcome-box" style="margin-bottom: 1.25rem;">
      <h1 class="page-title">Welcome, Learner!</h1>
      <p class="page-subtitle" style="margin-bottom: 0;">
        Keep learning. A brighter future is within your reach.
      </p>
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
        <div class="stat-label">Modules<br />In Progress</div>
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
        <h2 style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">Continue Learning</h2>
        <router-link to="/modules" style="font-size: 0.825rem; font-weight: 700; color: #165dfc;">
          View All
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
            <div style="font-size: 0.8rem; font-weight: 600; color: #64748b;">{{ activeModule.strand }}</div>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">{{ activeModule.subtitle }}</div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: flex-end; font-size: 0.75rem; font-weight: 700; color: #165dfc;">
            {{ activeModule.progress }}%
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: `${activeModule.progress}%` }"></div>
          </div>
        </div>

        <router-link :to="`/modules/${activeModule.id}`" class="btn-primary" style="width: 100%; text-align: center; margin-top: 0.25rem;">
          Continue
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
        <p style="font-size: 0.875rem; font-weight: 600; color: #475569;">No active learning modules yet</p>
        <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">Your teacher will assign modules to your account.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';

// Zero Fake Data rule: Counts default to 0 when there is no database record
const stats = reactive({
  modulesInProgress: 0,
  completedModules: 0,
  pendingAssessments: 0,
  overallProgress: 0,
});

const activeModule = ref(null);
</script>

<template>
  <div class="progress-page">
    <h1 class="page-title">My Progress</h1>
    <p class="page-subtitle">Track your learning journey.</p>

    <!-- Circular Progress Gauge Card (0% Default) -->
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
          <!-- Fill: 0% has dashoffset = 301.59 (empty circle) -->
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

    <!-- 2 Metric Summary Boxes (Default 0/0) -->
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

    <!-- Learning Strands Progress -->
    <div class="learner-card" style="padding: 1.15rem;">
      <h2 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem;">
        Learning Strands Progress
      </h2>

      <div v-if="strands.length > 0" style="display: flex; flex-direction: column; gap: 1rem;">
        <div v-for="strand in strands" :key="strand.name">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; margin-bottom: 0.35rem;">
            <span style="color: #334155;">{{ strand.name }}</span>
            <span style="color: #165dfc;">{{ strand.progress }}%</span>
          </div>
          <div class="progress-bar-track" style="height: 6px;">
            <div class="progress-bar-fill" :style="{ width: `${strand.progress}%` }"></div>
          </div>
        </div>
      </div>

      <div v-else style="padding: 1rem 0; text-align: center;">
        <p style="font-size: 0.825rem; color: #94a3b8;">No strand activity recorded yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Zero Fake Data Rule: starts at 0
const overallProgress = ref(0);
const modulesCompleted = ref(0);
const totalModules = ref(0);
const assessmentsTaken = ref(0);
const totalAssessments = ref(0);

const strands = ref([
  { name: 'Communication Skills (Eng)', progress: 0 },
  { name: 'Communication Skills (Fil)', progress: 0 },
  { name: 'Scientific Literacy', progress: 0 },
  { name: 'Mathematical Skills', progress: 0 },
]);
</script>

<template>
  <div class="assessments-page">
    <h1 class="page-title">Assessments</h1>
    <p class="page-subtitle">Take your assessments to check your learning progress.</p>

    <!-- Filter Tabs -->
    <div class="filter-tabs-row">
      <button
        type="button"
        class="filter-tab-btn"
        :class="{ active: currentTab === 'pending' }"
        @click="currentTab = 'pending'"
      >
        Pending ({{ pendingTests.length }})
      </button>
      <button
        type="button"
        class="filter-tab-btn"
        :class="{ active: currentTab === 'completed' }"
        @click="currentTab = 'completed'"
      >
        Completed ({{ completedTests.length }})
      </button>
    </div>

    <!-- Pending Assessments Tab -->
    <div v-if="currentTab === 'pending'">
      <div v-if="pendingTests.length > 0" style="display: flex; flex-direction: column; gap: 0.85rem;">
        <div
          v-for="test in pendingTests"
          :key="test.id"
          class="learner-card"
          style="display: flex; flex-direction: column; gap: 0.85rem; padding: 1.15rem;"
        >
          <div style="display: flex; gap: 0.85rem; align-items: flex-start;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: #eff6ff; color: #165dfc; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>

            <div style="flex: 1;">
              <h2 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1.25;">
                {{ test.title }}
              </h2>
              <div style="font-size: 0.775rem; color: #64748b; margin-top: 2px;">
                {{ test.subject }}
              </div>
              <div style="display: flex; align-items: center; gap: 0.85rem; font-size: 0.75rem; color: #94a3b8; margin-top: 0.35rem;">
                <span>📋 {{ test.items }} items</span>
                <span>⏱️ {{ test.duration }}</span>
              </div>
            </div>
          </div>

          <button type="button" class="btn-primary" style="width: 100%; text-align: center;" @click="startAssessment(test)">
            Start
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="learner-card" style="padding: 2.5rem 1.5rem; text-align: center;">
        <div style="width: 52px; height: 52px; margin: 0 auto 0.85rem; border-radius: 14px; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <h3 style="font-size: 0.95rem; font-weight: 700; color: #334155;">No pending assessments</h3>
        <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">
          You are all caught up! New tests and quizzes will appear here when scheduled.
        </p>
      </div>
    </div>

    <!-- Completed Assessments Tab -->
    <div v-else>
      <div v-if="completedTests.length > 0" style="display: flex; flex-direction: column; gap: 0.85rem;">
        <div
          v-for="test in completedTests"
          :key="test.id"
          class="learner-card"
          style="padding: 1.15rem; display: flex; align-items: center; justify-content: space-between;"
        >
          <div>
            <h2 style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">{{ test.title }}</h2>
            <div style="font-size: 0.775rem; color: #64748b;">{{ test.subject }}</div>
            <div style="font-size: 0.75rem; color: #16a34a; font-weight: 700; margin-top: 2px;">
              Score: {{ test.score }}
            </div>
          </div>
          <span style="font-size: 0.75rem; font-weight: 700; background: #f0fdf4; color: #16a34a; padding: 0.25rem 0.6rem; border-radius: 20px;">
            Completed
          </span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="learner-card" style="padding: 2.5rem 1.5rem; text-align: center;">
        <div style="width: 52px; height: 52px; margin: 0 auto 0.85rem; border-radius: 14px; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 style="font-size: 0.95rem; font-weight: 700; color: #334155;">No completed assessments yet</h3>
        <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">
          Your test scores and submission history will be recorded here.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const currentTab = ref('pending');

// Zero Fake Data Rule: starts empty
const pendingTests = ref([]);
const completedTests = ref([]);

function startAssessment(test) {
  alert(`Starting assessment: ${test.title}`);
}
</script>

<template>
  <div class="page-container">
    <!-- Welcome Banner with Quote -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <h1>Welcome, Admin!</h1>
        <p>Alternative Learning System — Naawan District</p>
      </div>
      <div class="welcome-quote">
        "Lifelong Learning for a Brighter Tomorrow."
      </div>
    </div>

    <!-- 4 Stat Cards -->
    <div class="stats-grid-4">
      <!-- Total Learners -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Total Learners</span>
          <span class="stat-number">{{ stats.learners }}</span>
          <span class="stat-status-text">{{ stats.learners === 0 ? 'No learners yet' : 'Enrolled learners' }}</span>
        </div>
      </div>

      <!-- Total Teachers -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Total Teachers</span>
          <span class="stat-number">{{ stats.teachers }}</span>
          <span class="stat-status-text">{{ stats.teachers === 0 ? 'No teachers yet' : 'Active implementors' }}</span>
        </div>
      </div>

      <!-- Learning Centers -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Learning Centers</span>
          <span class="stat-number">{{ stats.learningCenters }}</span>
          <span class="stat-status-text">{{ stats.learningCenters === 0 ? 'No centers yet' : 'Registered centers' }}</span>
        </div>
      </div>

      <!-- Learning Areas -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Learning Areas</span>
          <span class="stat-number">{{ stats.learningAreas }}</span>
          <span class="stat-status-text">{{ stats.learningAreas === 0 ? 'No learning areas yet' : 'ALS learning strands' }}</span>
        </div>
      </div>
    </div>

    <!-- Dashboard 2-Column Section -->
    <div class="dashboard-grid-2">
      <!-- Recent Activities -->
      <div class="card-box">
        <h3 class="card-box-header">Recent Activities</h3>
        <div class="empty-state-box" style="padding: 2.5rem 1rem;">
          <div class="empty-state-graphic">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <h3>No recent activities yet</h3>
          <p>System activities will appear here once data is added.</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card-box">
        <h3 class="card-box-header">Quick Actions</h3>
        <div class="quick-actions-grid">
          <router-link to="/learners/add" class="action-btn-card action-blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Add Learner</span>
          </router-link>

          <router-link to="/teachers" class="action-btn-card action-green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Add Teacher</span>
          </router-link>

          <router-link to="/learning-centers" class="action-btn-card action-amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Add Learning Center</span>
          </router-link>

          <router-link to="/reports" class="action-btn-card action-purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
            <span>View Reports</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { getLearningCentersCount } from '../api/learningCenters.js';

// Starts at 0 per CLAUDE.md §6 — no hardcoded fake data
const stats = reactive({
  learners: 0,
  teachers: 0,
  learningCenters: 0,
  learningAreas: 7,
});

async function fetchStats() {
  try {
    const { data } = await getLearningCentersCount();
    stats.learningCenters = data.count;
  } catch {
    // 0 is the fallback
  }
}

onMounted(fetchStats);
</script>

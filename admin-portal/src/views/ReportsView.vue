<template>
  <div class="page-container">
    <!-- Standardized Page Header -->
    <PageHeader
      title="Reports"
      description="ALS Coordinator & Admin district-level monitoring and official reports."
      :breadcrumbs="[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Reports' },
      ]"
    />

    <!-- Report Hub Cards -->
    <div class="report-hub-grid">
      <!-- 1. Summary of Module Use and Learner's Progress -->
      <router-link to="/dashboard/reports/module-progress" class="report-hub-card">
        <div class="report-hub-icon report-hub-icon-purple">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="report-hub-info">
          <h3>Summary of Module Use and Learner's Progress</h3>
          <p>Official Record of Module Use and Monitoring of Learner's Progress across all Learning Centers and ALS Teachers.</p>
        </div>
        <div class="report-hub-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </router-link>

      <!-- 2. Attendance Summary -->
      <router-link to="/dashboard/reports/attendance-summary" class="report-hub-card">
        <div class="report-hub-icon report-hub-icon-blue">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="report-hub-info">
          <h3>Attendance Summary</h3>
          <p>Consolidated learner attendance records and Community Learning Center attendance rates across Naawan District.</p>
        </div>
        <div class="report-hub-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </router-link>

      <!-- 3. Learning Center Summary -->
      <router-link to="/dashboard/reports/learning-center-summary" class="report-hub-card">
        <div class="report-hub-icon report-hub-icon-green">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
          </svg>
        </div>
        <div class="report-hub-info">
          <h3>Learning Center Summary</h3>
          <p>Administrative overview of each Community Learning Center, assigned teachers, enrolled learners, and attendance rates.</p>
        </div>
        <div class="report-hub-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import PageHeader from '../components/PageHeader.vue';
</script>

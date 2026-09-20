<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Reports</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Reports</h1>
        <p>View consolidated reports for attendance and learner records.</p>
      </div>
    </div>

    <!-- Report Hub Cards -->
    <div class="report-hub-grid">
      <!-- Attendance Report -->
      <router-link to="/reports/attendance" class="report-hub-card">
        <div class="report-hub-icon report-hub-icon-blue">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="report-hub-info">
          <h3>Attendance</h3>
          <p>View consolidated attendance records across learning centers and teachers.</p>
        </div>
        <div class="report-hub-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </router-link>

      <!-- Learner Records -->
      <router-link to="/reports/learner-records" class="report-hub-card">
        <div class="report-hub-icon report-hub-icon-green">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div class="report-hub-info">
          <h3>Learner Records</h3>
          <p>View complete individual learner records — information, module records, assessments, and progress.</p>
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
</script>

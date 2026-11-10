<template>
  <div class="page-container teacher-dashboard">
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <span class="breadcrumb-current">Dashboard</span>
    </nav>

    <!-- Welcome Header & Quick Actions -->
    <div class="welcome-header-card">
      <div class="welcome-info-col">
        <h1 class="welcome-title">Welcome, {{ teacherFullName }}</h1>
        <div class="welcome-meta-list">
          <div class="meta-item">
            <span class="meta-label">Role:</span>
            <span class="meta-value role-badge">{{ teacherPositionDisplay }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Assigned Learning Center:</span>
            <span class="meta-value text-strong">{{ assignedCenterDisplay }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Handled ALS Level:</span>
            <span class="meta-value text-strong">{{ handledProgramLevelDisplay }}</span>
          </div>
        </div>
      </div>

      <!-- Header Refresh Action -->
      <div class="quick-actions-box">
        <div class="quick-actions-buttons">
          <button
            type="button"
            class="quick-act-btn quick-act-secondary refresh-btn"
            :class="{ 'is-loading': loading }"
            @click="fetchDashboardData"
            title="Refresh dashboard data"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              :class="{ 'spin-icon': loading }"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{{ loading ? 'Updating...' : 'Refresh' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- TEACHER DASHBOARD FILTERS BAR -->
    <section class="dashboard-filter-card" aria-label="Teacher Dashboard Filters">
      <div class="filter-bar-inner">
        <div class="filter-title-group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="filter-icon">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span class="filter-bar-label">Dashboard Filters</span>
        </div>

        <div
          class="filter-controls-grid"
          :class="{ 'two-filters': !showLearningCenterFilter }"
        >
          <!-- Filter 1: School Year -->
          <div class="filter-control-item">
            <label for="teacher-filter-school-year" class="filter-item-label">School Year</label>
            <select
              id="teacher-filter-school-year"
              v-model="filters.schoolYear"
              class="filter-select-input"
              @change="handleFilterChange"
            >
              <option value="">All School Years</option>
              <option v-for="sy in filterOptions.schoolYears" :key="sy" :value="sy">
                SY {{ sy }}
              </option>
            </select>
          </div>

          <!-- Filter 2: ALS Level -->
          <div class="filter-control-item">
            <label for="teacher-filter-als-level" class="filter-item-label">ALS Level</label>
            <select
              id="teacher-filter-als-level"
              v-model="filters.level"
              class="filter-select-input"
              @change="handleFilterChange"
            >
              <option value="">All ALS Levels</option>
              <option v-for="lvl in assignedLevelOptions" :key="lvl" :value="lvl">
                {{ lvl }}
              </option>
            </select>
          </div>

          <!-- Filter 3: Community Learning Center (ONLY shown if teacher is assigned to multiple centers) -->
          <div v-if="showLearningCenterFilter" class="filter-control-item">
            <label for="teacher-filter-clc" class="filter-item-label">Community Learning Center</label>
            <select
              id="teacher-filter-clc"
              v-model="filters.learningCenterId"
              class="filter-select-input"
              @change="handleFilterChange"
            >
              <option value="">All Assigned Centers</option>
              <option
                v-for="center in filterOptions.learningCenters"
                :key="center.id"
                :value="String(center.id)"
              >
                {{ center.name }}
              </option>
            </select>
          </div>

          <!-- Reset Button -->
          <div class="filter-action-item">
            <button
              type="button"
              class="btn-reset-filters"
              :disabled="!hasActiveFilters || loading"
              @click="resetFilters"
              title="Reset all filters to view all assigned learners"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Error Banner State -->
    <div v-if="errorMessage" class="dashboard-error-banner" role="alert">
      <div class="error-banner-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
      <button type="button" class="btn-retry" @click="fetchDashboardData">
        Retry
      </button>
    </div>

    <!-- SECTION 1: DASHBOARD SUMMARY CARDS -->
    <section class="dashboard-section" aria-label="Teacher Summary Metrics">
      <div class="summary-cards-grid">
        <!-- Card 1: My Total Learners -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-title">My Total Learners</span>
            <div class="stat-icon-wrap icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div class="stat-card-body">
            <span v-if="loading && !hasLoadedOnce" class="stat-value-loading">...</span>
            <span v-else class="stat-value">{{ summary.totalLearners }}</span>
            <span class="stat-hint">
              {{ summary.totalLearners > 0 ? 'Learners currently assigned to you' : 'No assigned learners in current filter' }}
            </span>
          </div>
        </div>

        <!-- Card 2: A&E Elementary Learners (only if assigned) -->
        <div v-if="hasElemAssigned" class="stat-card">
          <div class="stat-card-header">
            <span class="stat-title">A&amp;E Elementary Learners</span>
            <div class="stat-icon-wrap icon-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
          </div>
          <div class="stat-card-body">
            <span v-if="loading && !hasLoadedOnce" class="stat-value-loading">...</span>
            <span v-else class="stat-value">{{ summary.elementaryLearners }}</span>
            <span class="stat-hint">Assigned learners in A&amp;E Elementary</span>
          </div>
        </div>

        <!-- Card 3: A&E Junior High Learners (only if assigned) -->
        <div v-if="hasJhsAssigned" class="stat-card">
          <div class="stat-card-header">
            <span class="stat-title">A&amp;E Junior High Learners</span>
            <div class="stat-icon-wrap icon-emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
          </div>
          <div class="stat-card-body">
            <span v-if="loading && !hasLoadedOnce" class="stat-value-loading">...</span>
            <span v-else class="stat-value">{{ summary.juniorHighLearners }}</span>
            <span class="stat-hint">Assigned learners in A&amp;E Junior High</span>
          </div>
        </div>

        <!-- Card 4: Average Attendance Rate -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-title">Average Attendance Rate</span>
            <div class="stat-icon-wrap icon-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div class="stat-card-body">
            <span v-if="loading && !hasLoadedOnce" class="stat-value-loading">...</span>
            <span v-else class="stat-value text-primary-rate">{{ summary.averageAttendanceRate }}%</span>
            <span class="stat-hint">
              {{
                summary.totalAttendanceRecords > 0
                  ? `${summary.presentAttendanceRecords} of ${summary.totalAttendanceRecords} present across ${summary.totalSessions} ${summary.totalSessions === 1 ? 'session' : 'sessions'}`
                  : 'No attendance records in current filter'
              }}
            </span>
          </div>
        </div>

        <!-- Card 5: Pending Submissions -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-title">Pending Submissions</span>
            <div class="stat-icon-wrap icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
          </div>
          <div class="stat-card-body">
            <span v-if="loading && !hasLoadedOnce" class="stat-value-loading">...</span>
            <span v-else class="stat-value">{{ summary.pendingSubmissions ?? 0 }}</span>
            <span class="stat-hint">
              {{
                (summary.pendingSubmissions ?? 0) > 0
                  ? 'Learner outputs awaiting your review'
                  : 'All learner submissions reviewed'
              }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: LEARNERS NEEDING ATTENTION -->
    <section class="dashboard-section" aria-label="Learners Needing Attention">
      <div class="chart-card">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Learners Needing Attention</h2>
            <p class="chart-card-subtitle">
              Monitoring indicators strictly for learners assigned to you.
            </p>
          </div>
          <span
            v-if="errorMessage && !hasLoadedOnce"
            class="badge badge-error-pill"
          >
            Failed to Load
          </span>
          <span
            v-else-if="loading && !hasLoadedOnce"
            class="badge badge-neutral-pill"
          >
            Checking...
          </span>
          <span
            v-else
            class="badge"
            :class="uniqueAttentionCount > 0 ? 'badge-warning-pill' : 'badge-success-pill'"
          >
            {{
              uniqueAttentionCount > 0
                ? `${uniqueAttentionCount} ${
                    uniqueAttentionCount === 1
                      ? 'Learner Needs'
                      : 'Learners Need'
                  } Attention`
                : 'All Clear'
            }}
          </span>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Checking assigned learners needing attention...</span>
        </div>

        <div v-else-if="errorMessage && !hasLoadedOnce" class="attention-error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Unable to load learners needing attention. Please retry.</span>
        </div>

        <template v-else>
          <!-- When all counts are zero: show the green All Clear message banner above the 3 cards -->
          <div
            v-if="uniqueAttentionCount === 0"
            class="attention-clear-banner"
          >
            <svg
              class="attention-clear-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span class="attention-clear-text">
              All Clear — No assigned learners currently need attention across attendance, module progress, or recent learning activity.
            </span>
          </div>

          <!-- ALWAYS render all three category cards side by side -->
          <div class="attention-categories-grid">
            <div
              v-for="item in attentionCategories"
              :key="item.key"
              class="attention-category-card"
              :class="`theme-${item.key}`"
            >
              <div class="attention-item-top">
                <div class="attention-item-heading-group">
                  <div class="attention-category-icon-wrap">
                    <!-- Card 1: Red Calendar Icon -->
                    <svg
                      v-if="item.key === 'lowAttendance'"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <!-- Card 2: Orange Module Icon -->
                    <svg
                      v-else-if="item.key === 'delayedProgress'"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <!-- Card 3: Blue Clock Icon -->
                    <svg
                      v-else
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div class="attention-item-heading-wrap">
                    <h3 class="attention-item-label">{{ item.label }}</h3>
                    <p class="attention-item-desc">{{ item.description }}</p>
                  </div>
                </div>
                <span
                  class="attention-count-badge"
                  :class="item.count > 0 ? 'count-alert' : 'count-zero'"
                >
                  {{ formatCategoryCount(item.count) }}
                </span>
              </div>

              <!-- When category has affected learners: render list of learners with action buttons -->
              <div v-if="item.learners && item.learners.length > 0" class="attention-learner-list">
                <div
                  v-for="lrn in item.learners"
                  :key="`${item.key}_${lrn.id}`"
                  class="attention-learner-row"
                >
                  <div class="attention-learner-info">
                    <div class="attention-learner-name-line">
                      <span class="attention-learner-name">{{ lrn.fullName }}</span>
                      <span v-if="lrn.level" class="meta-pill pill-level">{{ lrn.level }}</span>
                    </div>
                    <div class="attention-learner-sub">
                      <span v-if="lrn.learningCenter || assignedCenterDisplay" class="attention-learner-center">
                        {{ lrn.learningCenter || assignedCenterDisplay }}
                      </span>
                      <span
                        v-if="(lrn.learningCenter || assignedCenterDisplay) && getCategoryLearnerIndicator(item.key, lrn)"
                        class="attention-dot-sep"
                      >•</span>
                      <strong class="attention-indicator-text">
                        {{ getCategoryLearnerIndicator(item.key, lrn) }}
                      </strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn-attention-action"
                    @click="openAttentionLearnerModal(lrn, item.actionType || lrn.actionType || item.key)"
                  >
                    {{ item.actionLabel || lrn.actionLabel || getAttentionActionLabel(item.key) }}
                  </button>
                </div>
              </div>

              <!-- When category has zero learners: empty-state message (no action buttons) -->
              <div v-else class="attention-category-empty">
                <svg
                  class="empty-check-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="16 10 11 15 8 12" />
                </svg>
                <span>{{ getCategoryEmptyMessage(item.key) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- SECTION 3: TWO-COLUMN LAYOUT: LEFT (MODULE USE & LEARNER PROGRESS TABLE) | RIGHT (SCHEDULE & ANNOUNCEMENTS) -->
    <div class="dashboard-grid-2-balanced dashboard-two-col-layout">
      <!-- LEFT COLUMN -->
      <div class="dashboard-column dashboard-col-left">
        <!-- MODULE USE AND LEARNER'S PROGRESS PREVIEW -->
        <section class="chart-card module-use-preview-card" aria-label="Module Use and Learner's Progress">
          <div class="card-box-header-wrap">
            <div>
              <h2 class="chart-card-title">Module Use and Learner's Progress</h2>
              <p class="chart-card-subtitle">
                Overview of your assigned learners' module progress and recorded assessments.
              </p>
            </div>
            <!-- Month Filter in Upper-Right Corner -->
            <div class="card-header-filter-wrap">
              <label for="module-use-month-filter" class="card-filter-label">Month</label>
              <select
                id="module-use-month-filter"
                v-model="selectedModuleUseMonth"
                class="card-filter-select"
                aria-label="Filter module use by month"
                @change="handleModuleUseMonthChange"
              >
                <option value="">All Months</option>
                <option v-for="m in monthOptions" :key="m" :value="m">
                  {{ m }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
            <div class="spinner"></div>
            <span>Loading module use and learner progress...</span>
          </div>

          <div v-else-if="loadingModuleProgress && moduleProgressPreviewLearners.length === 0" class="chart-loading-box">
            <div class="spinner"></div>
            <span>Updating module progress for {{ selectedModuleUseMonth || 'selected month' }}...</span>
          </div>

          <div v-else-if="moduleProgressPreviewLearners.length === 0" class="empty-state-box empty-state-compact">
            <div class="empty-state-graphic">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3 class="empty-state-title">No module progress records found.</h3>
            <p class="empty-state-text">Module use and progress records for your assigned learners will appear here.</p>
          </div>

          <div v-else class="module-use-table-wrap" :class="{ 'is-refreshing': loadingModuleProgress }">
            <table class="module-use-preview-table">
              <thead>
                <tr>
                  <th class="th-learner-name">Learner Name</th>
                  <th class="th-center">Mastered</th>
                  <th class="th-center">Not Mastered</th>
                  <th class="th-center">Pending</th>
                  <th class="th-center">Progress (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="learner in moduleProgressPreviewLearners" :key="learner.id" class="preview-table-row">
                  <td class="td-learner-name">
                    <span class="learner-name-text">{{ learner.fullName || learner.name }}</span>
                  </td>
                  <td class="td-center font-num">{{ learner.mastered }}</td>
                  <td class="td-center font-num">{{ learner.notMastered }}</td>
                  <td class="td-center font-num">{{ learner.pending }}</td>
                  <td class="td-center font-num td-progress">{{ learner.progress }}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom View All Button with Right Arrow -->
          <div class="card-bottom-action-wrap">
            <router-link :to="viewAllModuleProgressUrl" class="btn-card-view-all">
              <span>View All</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </router-link>
          </div>
        </section>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="dashboard-column">
        <!-- 1. UPCOMING SCHEDULE -->
        <section class="chart-card operational-card-section" aria-label="Upcoming Schedule">
          <div class="card-box-header-wrap">
            <div>
              <h2 class="chart-card-title">Upcoming Schedule</h2>
              <p class="chart-card-subtitle">
                Next three upcoming learning sessions or activities assigned to you
              </p>
            </div>
            <div class="card-header-actions">
              <router-link to="/dashboard/schedule" class="link-view-all">
                <span>View All</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </router-link>
            </div>
          </div>

          <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
            <div class="spinner"></div>
            <span>Loading upcoming schedules...</span>
          </div>

          <div v-else-if="upcomingSchedules.length === 0" class="empty-state-box empty-state-compact">
            <div class="empty-state-graphic">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 class="empty-state-title">No upcoming schedules.</h3>
            <p class="empty-state-text">Your upcoming ALS learning sessions and activities will be listed here.</p>
          </div>

          <div v-else class="operational-list">
            <article
              v-for="sched in upcomingSchedules"
              :key="sched.id"
              class="operational-list-item schedule-item-card"
            >
              <div class="oli-top-row">
                <h3 class="oli-title">{{ sched.title }}</h3>
                <span v-if="sched.alsLevel" class="meta-pill pill-level">
                  {{ sched.alsLevel }}
                </span>
              </div>
              <div class="schedule-meta-grid">
                <span class="oli-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {{ sched.formattedDate || sched.date }}
                </span>
                <span class="oli-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {{ sched.formattedTime }}
                </span>
                <span class="oli-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {{ sched.learningCenter }}
                </span>
              </div>
            </article>
          </div>
        </section>

        <!-- 2. ANNOUNCEMENTS -->
        <section class="chart-card operational-card-section" aria-label="Announcements">
          <div class="card-box-header-wrap">
            <div>
              <h2 class="chart-card-title">Announcements</h2>
              <p class="chart-card-subtitle">
                Latest three announcements from the Admin and your own published notices
              </p>
            </div>
            <div class="card-header-actions">
              <router-link
                to="/dashboard/announcements?action=create"
                class="btn-card-action btn-card-primary"
                title="Create a new announcement for your assigned learners"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Create Announcement</span>
              </router-link>
              <router-link to="/dashboard/announcements" class="link-view-all">
                <span>View All</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </router-link>
            </div>
          </div>

          <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
            <div class="spinner"></div>
            <span>Loading announcements...</span>
          </div>

          <div v-else-if="announcements.length === 0" class="empty-state-box empty-state-compact">
            <div class="empty-state-graphic">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h3 class="empty-state-title">No announcements available.</h3>
            <p class="empty-state-text">Notices from the Admin or announcements you create for your learners will appear here.</p>
          </div>

          <div v-else class="operational-list">
            <article
              v-for="ann in announcements"
              :key="ann.id"
              class="operational-list-item"
            >
              <div class="oli-top-row">
                <h3 class="oli-title">{{ ann.title }}</h3>
                <div class="oli-badges">
                  <span v-if="ann.priorityLabel" class="meta-pill pill-priority">
                    {{ ann.priorityLabel }}
                  </span>
                  <span
                    class="meta-pill"
                    :class="ann.source === 'My Announcement' ? 'pill-source-own' : 'pill-source-admin'"
                  >
                    {{ ann.source || 'From Admin' }}
                  </span>
                </div>
              </div>
              <p class="oli-desc">{{ ann.description || ann.content }}</p>
              <div class="oli-footer-row">
                <span class="oli-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Published {{ ann.publicationDate || ann.datePosted }}
                </span>
                <router-link :to="`/dashboard/announcements?view=${ann.id}`" class="oli-inline-link">
                  Read details
                </router-link>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <!-- SECTION 5: SEX DISTRIBUTION (LEFT) & MONTHLY ATTENDANCE TREND (RIGHT) SIDE BY SIDE -->
    <div class="dashboard-grid-2-balanced">
      <!-- LEFT: SEX DISTRIBUTION BY ALS LEVEL -->
      <section class="chart-card chart-card-section" aria-label="Sex Distribution by ALS Level">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Sex Distribution by ALS Level</h2>
            <p class="chart-card-subtitle">Male and Female distribution across your assigned ALS levels</p>
          </div>
          <div class="inline-legend-pills">
            <span class="legend-pill">
              Total Learners: <strong>{{ sexDistributionByLevel.totalLearners }}</strong>
            </span>
            <span class="legend-pill">
              <span class="legend-swatch" style="background-color: #2563eb;"></span>
              Male: <strong>{{ sexDistributionByLevel.totalMale }}</strong>
            </span>
            <span class="legend-pill">
              <span class="legend-swatch" style="background-color: #e11d48;"></span>
              Female: <strong>{{ sexDistributionByLevel.totalFemale }}</strong>
            </span>
          </div>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading sex distribution...</span>
        </div>

        <div v-else-if="sexDistributionByLevel.totalLearners === 0" class="empty-state-box">
          <div class="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <p class="empty-state-title">No sex distribution data</p>
          <p class="empty-state-desc">Male and Female counts will appear when learners are assigned to you.</p>
        </div>

        <div v-else class="vbar-chart-wrapper">
          <svg viewBox="0 0 500 235" class="svg-vbar-chart" role="img" aria-label="Sex Distribution by ALS Level grouped vertical bar chart">
            <text x="16" y="16" class="svg-axis-unit">Learners</text>

            <!-- Horizontal Grid Lines -->
            <g v-for="(tick, tIdx) in sexDistributionChart.yTicks" :key="tIdx">
              <line
                x1="48"
                :y1="tick.y"
                x2="470"
                :y2="tick.y"
                :stroke="tick.isZero ? '#cbd5e1' : '#e2e8f0'"
                :stroke-width="tick.isZero ? 1.5 : 1"
                :stroke-dasharray="tick.isZero ? 'none' : '3 3'"
              />
              <text x="40" :y="tick.y + 4" text-anchor="end" class="svg-axis-label">
                {{ tick.value }}
              </text>
            </g>

            <!-- Grouped Bars per ALS Level (Male & Female separate bars) -->
            <g v-for="group in sexDistributionChart.groups" :key="group.key">
              <g v-for="bar in group.bars" :key="bar.key">
                <rect
                  v-if="bar.height > 0"
                  :x="bar.x"
                  :y="bar.y"
                  :width="bar.width"
                  :height="bar.height"
                  :fill="bar.color"
                  rx="5"
                  ry="5"
                  class="svg-vbar-rect"
                >
                  <title>{{ group.label }} — {{ bar.sexLabel }}: {{ bar.count }} {{ bar.count === 1 ? 'Learner' : 'Learners' }}</title>
                </rect>
                <rect
                  v-else
                  :x="bar.x"
                  :y="sexDistributionChart.baselineY - 3"
                  :width="bar.width"
                  height="3"
                  :fill="bar.color"
                  opacity="0.4"
                  rx="1.5"
                >
                  <title>{{ group.label }} — {{ bar.sexLabel }}: 0 Learners</title>
                </rect>

                <text
                  :x="bar.cx"
                  :y="bar.labelY"
                  text-anchor="middle"
                  class="svg-bar-value"
                >
                  {{ bar.count }}
                </text>

                <text
                  :x="bar.cx"
                  :y="sexDistributionChart.baselineY + 15"
                  text-anchor="middle"
                  class="svg-subbar-label"
                >
                  {{ bar.sexLabel }}
                </text>
              </g>

              <text
                :x="group.cx"
                :y="sexDistributionChart.baselineY + 33"
                text-anchor="middle"
                class="svg-x-category"
              >
                {{ group.label }}
              </text>
            </g>
          </svg>

          <!-- Legend Footer -->
          <div class="chart-legend-row">
            <div class="legend-badge">
              <span>Total Learners: <strong>{{ sexDistributionByLevel.totalLearners }}</strong></span>
            </div>
            <div class="legend-badge">
              <span class="legend-swatch" style="background-color: #2563eb;"></span>
              <span>Male: <strong>{{ sexDistributionByLevel.totalMale }}</strong>{{ maleLegendBreakdown }}</span>
            </div>
            <div class="legend-badge">
              <span class="legend-swatch" style="background-color: #e11d48;"></span>
              <span>Female: <strong>{{ sexDistributionByLevel.totalFemale }}</strong>{{ femaleLegendBreakdown }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- RIGHT: MONTHLY ATTENDANCE TREND -->
      <section class="chart-card chart-card-section" aria-label="Monthly Attendance Trend">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Monthly Attendance Trend</h2>
            <p class="chart-card-subtitle">
              Current school year attendance percentages and recorded ALS sessions
            </p>
          </div>

          <div class="attendance-kpi-group">
            <div v-if="showElemChart" class="kpi-tag">
              <span class="legend-line-swatch" style="background-color: #2563eb;"></span>
              <span>
                A&amp;E Elementary:
                <strong>{{ attendanceTrend.elementaryHasRecords ? `${attendanceTrend.elementaryRate}%` : 'No sessions' }}</strong>
              </span>
            </div>
            <div v-if="showJhsChart" class="kpi-tag">
              <span class="legend-line-swatch" style="background-color: #0d9488;"></span>
              <span>
                A&amp;E Junior High:
                <strong>{{ attendanceTrend.juniorHighHasRecords ? `${attendanceTrend.juniorHighRate}%` : 'No sessions' }}</strong>
              </span>
            </div>
            <div class="kpi-tag">
              <span class="kpi-dot bg-purple"></span>
              <span>
                Recorded ALS Sessions:
                <strong>{{ attendanceTrend.hasData ? attendanceTrend.totalSessions : 'No sessions' }}</strong>
              </span>
            </div>
          </div>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading monthly attendance trend...</span>
        </div>

        <div v-else-if="!attendanceTrend.hasData || attendanceTrend.totalRecords === 0" class="empty-state-box">
          <div class="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p class="empty-state-title">No sessions recorded yet</p>
          <p class="empty-state-desc">
            Record attendance sessions for your assigned learners to populate the monthly attendance trend chart.
          </p>
        </div>

        <!-- Monthly Attendance Line Chart (Discontinuous across months without sessions) -->
        <div v-else class="line-chart-wrapper">
          <div class="line-chart-hover-banner" aria-live="polite">
            <template v-if="hoveredMonthPoint">
              <span class="hover-month-name">{{ hoveredMonthPoint.label }}</span>
              <span v-if="showElemChart" class="hover-level-item">
                <span class="legend-swatch" style="background-color: #2563eb;"></span>
                A&amp;E Elementary:
                <strong v-if="hoveredMonthPoint.elementary.hasRecords">
                  {{ hoveredMonthPoint.elementary.attendancePercentage }}%
                  ({{ hoveredMonthPoint.elementary.sessionsCount }} {{ hoveredMonthPoint.elementary.sessionsCount === 1 ? 'session' : 'sessions' }})
                </strong>
                <span v-else class="text-muted">No sessions</span>
              </span>
              <span v-if="showJhsChart" class="hover-level-item">
                <span class="legend-swatch" style="background-color: #0d9488;"></span>
                A&amp;E Junior High:
                <strong v-if="hoveredMonthPoint.juniorHigh.hasRecords">
                  {{ hoveredMonthPoint.juniorHigh.attendancePercentage }}%
                  ({{ hoveredMonthPoint.juniorHigh.sessionsCount }} {{ hoveredMonthPoint.juniorHigh.sessionsCount === 1 ? 'session' : 'sessions' }})
                </strong>
                <span v-else class="text-muted">No sessions</span>
              </span>
            </template>
            <template v-else>
              <span class="hover-hint-text">
                Hover over a month to inspect recorded ALS sessions and attendance rates. Months without recorded sessions show "No sessions".
              </span>
            </template>
          </div>

          <div class="chart-canvas-container">
            <svg
              class="trend-line-svg"
              viewBox="0 0 560 225"
              role="img"
              aria-label="Monthly Attendance Trend line chart comparing A&E Elementary and A&E Junior High"
            >
              <!-- Horizontal Grid Lines (0%, 25%, 50%, 75%, 100%) -->
              <g v-for="grid in attendanceLineChart.yGrid" :key="grid.pct">
                <line
                  x1="48"
                  :y1="grid.y"
                  x2="532"
                  :y2="grid.y"
                  :stroke="grid.pct === 0 ? '#cbd5e1' : '#e2e8f0'"
                  :stroke-width="grid.pct === 0 ? 1.5 : 1"
                  :stroke-dasharray="grid.pct === 0 ? 'none' : '3 3'"
                />
                <text x="40" :y="grid.y + 4" class="chart-axis-text" text-anchor="end">
                  {{ grid.pct }}%
                </text>
              </g>

              <!-- Discontinuous Line Segments for A&E Elementary (never connecting across missing months) -->
              <template v-if="showElemChart">
                <polyline
                  v-for="(seg, sIdx) in attendanceLineChart.elementarySegments"
                  :key="`elem_seg_${sIdx}`"
                  :points="seg"
                  fill="none"
                  stroke="#2563eb"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </template>

              <!-- Discontinuous Line Segments for A&E Junior High (never connecting across missing months) -->
              <template v-if="showJhsChart">
                <polyline
                  v-for="(seg, sIdx) in attendanceLineChart.juniorHighSegments"
                  :key="`jhs_seg_${sIdx}`"
                  :points="seg"
                  fill="none"
                  stroke="#0d9488"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </template>

              <!-- Month Columns, Interactive Hover Zones & Data Points (Plotted ONLY when hasRecords is true) -->
              <g
                v-for="(pt, idx) in attendanceLineChart.points"
                :key="pt.key || idx"
                class="month-point-group"
                @mouseenter="hoveredMonthIndex = idx"
                @mouseleave="hoveredMonthIndex = null"
              >
                <line
                  v-if="hoveredMonthIndex === idx"
                  :x1="pt.x"
                  y1="22"
                  :x2="pt.x"
                  :y2="attendanceLineChart.baselineY"
                  stroke="#94a3b8"
                  stroke-width="1"
                  stroke-dasharray="3 3"
                />

                <rect
                  :x="pt.x - 28"
                  y="18"
                  width="56"
                  :height="attendanceLineChart.baselineY - 8"
                  fill="transparent"
                  style="cursor: pointer;"
                >
                  <title>{{ pt.tooltipText }}</title>
                </rect>

                <!-- A&E Elementary Point (Only plotted if sessions were recorded) -->
                <circle
                  v-if="showElemChart && pt.elementary.hasRecords && pt.elemY !== null"
                  :cx="pt.x"
                  :cy="pt.elemY"
                  :r="hoveredMonthIndex === idx ? 6 : 4.5"
                  fill="#2563eb"
                  stroke="#ffffff"
                  stroke-width="2"
                  class="chart-point"
                >
                  <title>{{ pt.label }} — A&amp;E Elementary: {{ pt.elementary.attendancePercentage }}% ({{ pt.elementary.sessionsCount }} {{ pt.elementary.sessionsCount === 1 ? 'session' : 'sessions' }})</title>
                </circle>

                <text
                  v-if="showElemChart && pt.elementary.hasRecords && pt.elemLabelY !== null"
                  :x="pt.x"
                  :y="pt.elemLabelY"
                  class="point-tooltip-text elem-point-text"
                  text-anchor="middle"
                >
                  {{ pt.elementary.attendancePercentage }}%
                </text>

                <!-- A&E Junior High Point (Only plotted if sessions were recorded) -->
                <circle
                  v-if="showJhsChart && pt.juniorHigh.hasRecords && pt.jhsY !== null"
                  :cx="pt.x"
                  :cy="pt.jhsY"
                  :r="hoveredMonthIndex === idx ? 6 : 4.5"
                  fill="#0d9488"
                  stroke="#ffffff"
                  stroke-width="2"
                  class="chart-point"
                >
                  <title>{{ pt.label }} — A&amp;E Junior High: {{ pt.juniorHigh.attendancePercentage }}% ({{ pt.juniorHigh.sessionsCount }} {{ pt.juniorHigh.sessionsCount === 1 ? 'session' : 'sessions' }})</title>
                </circle>

                <text
                  v-if="showJhsChart && pt.juniorHigh.hasRecords && pt.jhsLabelY !== null"
                  :x="pt.x"
                  :y="pt.jhsLabelY"
                  class="point-tooltip-text jhs-point-text"
                  text-anchor="middle"
                >
                  {{ pt.juniorHigh.attendancePercentage }}%
                </text>

                <!-- "No sessions" marker on axis for months without recorded sessions -->
                <text
                  v-if="!pt.hasVisibleRecords"
                  :x="pt.x"
                  :y="attendanceLineChart.baselineY - 8"
                  class="no-session-axis-label"
                  text-anchor="middle"
                >
                  No sessions
                </text>

                <text
                  :x="pt.x"
                  :y="attendanceLineChart.baselineY + 20"
                  class="chart-axis-text month-x-label"
                  text-anchor="middle"
                >
                  {{ pt.label }}
                </text>
              </g>
            </svg>
          </div>

          <!-- Monthly Breakdown Pills -->
          <div class="monthly-breakdown-row">
            <div
              v-for="(m, mIdx) in attendanceTrend.monthly"
              :key="m.key"
              class="month-breakdown-card"
              :class="{ 'is-hovered': hoveredMonthIndex === mIdx }"
              @mouseenter="hoveredMonthIndex = mIdx"
              @mouseleave="hoveredMonthIndex = null"
            >
              <div class="mbc-header">
                <span class="mbc-month">{{ m.month }}</span>
                <span class="mbc-sessions-badge">
                  {{ m.hasRecords && m.sessionsCount > 0 ? `${m.sessionsCount} ${m.sessionsCount === 1 ? 'Session' : 'Sessions'}` : 'No sessions' }}
                </span>
              </div>
              <div class="mbc-levels-list">
                <div v-if="showElemChart" class="mbc-level-row">
                  <span class="mbc-level-name">
                    <span class="legend-swatch-sm" style="background-color: #2563eb;"></span>
                    A&amp;E Elementary
                  </span>
                  <strong v-if="m.elementary?.hasRecords && m.elementary.attendancePercentage !== null" class="mbc-level-val text-blue">
                    {{ m.elementary.attendancePercentage }}%
                  </strong>
                  <span v-else class="mbc-no-session">No sessions</span>
                </div>
                <div v-if="showJhsChart" class="mbc-level-row">
                  <span class="mbc-level-name">
                    <span class="legend-swatch-sm" style="background-color: #0d9488;"></span>
                    A&amp;E Junior High
                  </span>
                  <strong v-if="m.juniorHigh?.hasRecords && m.juniorHigh.attendancePercentage !== null" class="mbc-level-val text-teal">
                    {{ m.juniorHigh.attendancePercentage }}%
                  </strong>
                  <span v-else class="mbc-no-session">No sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- SECTION 6: RECENT ACTIVITIES (LEARNER ACTIVITIES & TEACHER ACTIVITIES TABS) -->
    <section class="dashboard-section" aria-label="Recent Activities">
      <div class="chart-card">
        <div class="card-box-header-wrap recent-activities-header">
          <div>
            <h2 class="chart-card-title">Recent Activities</h2>
            <p class="chart-card-subtitle">
              {{
                activeActivityTab === 'learners'
                  ? 'Five most recent recorded activities from learners assigned to you'
                  : 'Five most recent actions performed by you'
              }}
            </p>
          </div>

          <div class="activity-tabs-bar" role="tablist" aria-label="Recent Activities Tabs">
            <button
              type="button"
              role="tab"
              :aria-selected="activeActivityTab === 'learners'"
              class="activity-tab-btn"
              :class="{ 'is-active': activeActivityTab === 'learners' }"
              @click="activeActivityTab = 'learners'"
            >
              <span>Learner Activities</span>
              <span class="activity-tab-count">{{ recentLearnerActivities.length }}</span>
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="activeActivityTab === 'teacher'"
              class="activity-tab-btn"
              :class="{ 'is-active': activeActivityTab === 'teacher' }"
              @click="activeActivityTab = 'teacher'"
            >
              <span>Teacher Activities</span>
              <span class="activity-tab-count">{{ recentTeacherActivities.length }}</span>
            </button>
          </div>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading recent activities...</span>
        </div>

        <!-- TAB 1: LEARNER ACTIVITIES (Default Tab) -->
        <div v-else-if="activeActivityTab === 'learners'" role="tabpanel">
          <div v-if="recentLearnerActivities.length === 0" class="empty-state-box empty-state-compact">
            <div class="empty-state-graphic">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 class="empty-state-title">No recent learner activities</h3>
            <p class="empty-state-text">
              Pre-Tests, Post-Tests, module completions, and activity submissions from your assigned learners will appear here.
            </p>
          </div>

          <div v-else class="activity-feed-list">
            <button
              v-for="act in recentLearnerActivities"
              :key="act.id"
              type="button"
              class="activity-feed-row activity-feed-clickable"
              @click="handleLearnerActivityClick(act)"
            >
              <div class="activity-icon-dot" :class="`act-type-${act.type || 'default'}`">
                <svg v-if="act.type === 'module_completed'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <svg v-else-if="act.type === 'assessment_submitted' || act.type === 'activity_submitted'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>

              <div class="activity-main-info">
                <div class="activity-learner-row">
                  <span class="activity-learner-name">{{ act.learnerName }}</span>
                  <span class="meta-pill pill-level">{{ act.alsLevel }}</span>
                  <span class="meta-pill pill-activity-type">{{ act.activityType || 'Learning Activity' }}</span>
                  <span v-if="act.status" class="meta-pill pill-activity-status">{{ act.status }}</span>
                </div>
                <p class="activity-desc-text">
                  <strong v-if="act.moduleTitle">{{ act.moduleTitle }}</strong>
                  <span v-if="act.moduleTitle && act.description"> — </span>
                  <span>{{ act.description }}</span>
                </p>
              </div>

              <div class="activity-right-col">
                <span class="activity-datetime-text">{{ act.dateTime }}</span>
                <span class="activity-open-hint">View Details →</span>
              </div>
            </button>
          </div>
        </div>

        <!-- TAB 2: TEACHER ACTIVITIES -->
        <div v-else role="tabpanel">
          <div v-if="recentTeacherActivities.length === 0" class="empty-state-box empty-state-compact">
            <div class="empty-state-graphic">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 class="empty-state-title">No recorded teacher activities yet</h3>
            <p class="empty-state-text">
              Your recent actions—such as uploading modules, reviewing submissions, recording attendance, or creating announcements—will appear here.
            </p>
          </div>

          <div v-else class="activity-feed-list">
            <div
              v-for="tAct in recentTeacherActivities"
              :key="tAct.id"
              class="activity-feed-row"
              :class="{ 'activity-feed-clickable': Boolean(tAct.linkUrl) }"
              @click="tAct.linkUrl ? router.push(tAct.linkUrl) : null"
            >
              <div class="activity-icon-dot act-type-teacher">
                <svg v-if="tAct.type === 'MODULE_UPLOADED' || tAct.type === 'MODULE_UPDATED'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <svg v-else-if="tAct.type === 'ATTENDANCE_RECORDED'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <svg v-else-if="tAct.type === 'ANNOUNCEMENT_CREATED'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <svg v-else-if="tAct.type === 'SCHEDULE_CREATED'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>

              <div class="activity-main-info">
                <div class="activity-learner-row">
                  <span class="activity-learner-name">{{ tAct.activityType }}</span>
                  <span v-if="tAct.relatedEntity" class="meta-pill pill-source-admin">{{ tAct.relatedEntity }}</span>
                </div>
                <p class="activity-desc-text">{{ tAct.description }}</p>
              </div>

              <span class="activity-datetime-text">{{ tAct.dateTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 7: QUICK ACTIONS (BOTTOM OF DASHBOARD - 3-COLUMN DESKTOP GRID) -->
    <section class="dashboard-section" aria-label="Quick Actions">
      <div class="chart-card">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Quick Actions</h2>
            <p class="chart-card-subtitle">
              Direct shortcuts to your core instructional and learner management workflows
            </p>
          </div>
        </div>

        <div class="quick-actions-grid-3">
          <!-- 1. Take Attendance -->
          <router-link to="/dashboard/attendance" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Take Attendance</span>
              <span class="qa-sub">Record learner attendance for ALS sessions</span>
            </div>
          </router-link>

          <!-- 2. Upload Module -->
          <router-link to="/dashboard/modules?action=create" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="12" y1="8" x2="12" y2="14" /><line x1="9" y1="11" x2="15" y2="11" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Upload Module</span>
              <span class="qa-sub">Create and publish a new learning module</span>
            </div>
          </router-link>

          <!-- 3. Review Submissions -->
          <router-link :to="summary.reviewSubmissionsRoute || '/dashboard/modules'" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <polyline points="9 15 11 17 15 13" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Review Submissions</span>
              <span class="qa-sub">Check and grade learner activity outputs</span>
            </div>
          </router-link>

          <!-- 4. Add Learner Record -->
          <router-link to="/dashboard/records" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Add Learner Record</span>
              <span class="qa-sub">Select a learner and record AF2 performance</span>
            </div>
          </router-link>

          <!-- 5. Create Announcement -->
          <router-link to="/dashboard/announcements?action=create" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Create Announcement</span>
              <span class="qa-sub">Post a notice to your assigned learners</span>
            </div>
          </router-link>

          <!-- 6. Create Schedule -->
          <router-link to="/dashboard/schedule?action=create" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="12" y1="14" x2="12" y2="18" /><line x1="10" y1="16" x2="14" y2="16" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Create Schedule</span>
              <span class="qa-sub">Schedule an upcoming ALS learning session</span>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- LEARNER-SPECIFIC DETAILS MODAL (Attendance, Module Progress, Recent Activity & Submission Details) -->
    <div
      v-if="learnerModal.open && learnerModal.learner"
      class="dashboard-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-learner-modal-title"
      @click.self="closeLearnerModal"
    >
      <div class="dashboard-modal-card">
        <div class="dashboard-modal-header">
          <div>
            <h3 id="dashboard-learner-modal-title" class="dashboard-modal-title">
              {{ learnerModal.learner.fullName }}
            </h3>
            <div class="dashboard-modal-meta">
              <span class="meta-pill pill-level">{{ learnerModal.learner.level }}</span>
              <span>LRN: <strong>{{ learnerModal.learner.lrn || '—' }}</strong></span>
              <span>•</span>
              <span>{{ learnerModal.learner.learningCenter || assignedCenterDisplay }}</span>
            </div>
          </div>
          <button type="button" class="dashboard-modal-close" aria-label="Close modal" @click="closeLearnerModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Modal View Switcher -->
        <div class="dashboard-modal-tabs">
          <button
            type="button"
            class="modal-tab-btn"
            :class="{ 'is-active': learnerModal.mode === 'attendance' }"
            @click="learnerModal.mode = 'attendance'"
          >
            Attendance Details
          </button>
          <button
            type="button"
            class="modal-tab-btn"
            :class="{ 'is-active': learnerModal.mode === 'module' }"
            @click="learnerModal.mode = 'module'"
          >
            Module Progress
          </button>
          <button
            type="button"
            class="modal-tab-btn"
            :class="{ 'is-active': learnerModal.mode === 'activity' }"
            @click="learnerModal.mode = 'activity'"
          >
            Recent Activity
          </button>
        </div>

        <div class="dashboard-modal-body">
          <!-- Selected Submission Highlight (when opened from a submission activity) -->
          <div v-if="learnerModal.selectedActivity?.submissionDetails" class="modal-submission-highlight">
            <div class="msh-top">
              <span class="msh-title">
                {{ learnerModal.selectedActivity.activityType }}: {{ learnerModal.selectedActivity.submissionDetails.activityTitle }}
              </span>
              <span class="meta-pill pill-activity-status">
                {{ learnerModal.selectedActivity.submissionDetails.status }}
              </span>
            </div>
            <p class="msh-sub">
              Module: <strong>{{ learnerModal.selectedActivity.submissionDetails.moduleTitle }}</strong>
              • Submitted {{ learnerModal.selectedActivity.submissionDetails.submittedAt }}
            </p>
            <p v-if="learnerModal.selectedActivity.submissionDetails.fileNames?.length" class="msh-files">
              Attached Files: {{ learnerModal.selectedActivity.submissionDetails.fileNames.join(', ') }}
            </p>
          </div>

          <!-- VIEW 1: ATTENDANCE DETAILS -->
          <div v-if="learnerModal.mode === 'attendance'">
            <div class="modal-kpi-row">
              <div class="modal-kpi-box">
                <span class="mkpi-label">Attendance Rate</span>
                <strong class="mkpi-val text-blue">
                  {{
                    learnerModal.learner.attendanceDetails?.attendanceRate != null
                      ? `${learnerModal.learner.attendanceDetails.attendanceRate}%`
                      : 'No sessions'
                  }}
                </strong>
              </div>
              <div class="modal-kpi-box">
                <span class="mkpi-label">Present / Late</span>
                <strong class="mkpi-val">{{ learnerModal.learner.attendanceDetails?.presentCount ?? 0 }}</strong>
              </div>
              <div class="modal-kpi-box">
                <span class="mkpi-label">Absent</span>
                <strong class="mkpi-val">{{ learnerModal.learner.attendanceDetails?.absentCount ?? 0 }}</strong>
              </div>
              <div class="modal-kpi-box">
                <span class="mkpi-label">Recorded Sessions</span>
                <strong class="mkpi-val">{{ learnerModal.learner.attendanceDetails?.totalSessions ?? 0 }}</strong>
              </div>
            </div>

            <h4 class="modal-section-subtitle">Recent Session Logs</h4>
            <div
              v-if="!learnerModal.learner.attendanceDetails?.recentSessions?.length"
              class="modal-empty-note"
            >
              No attendance sessions recorded for this learner in the current school year.
            </div>
            <div v-else class="modal-list-table">
              <div
                v-for="sess in learnerModal.learner.attendanceDetails.recentSessions"
                :key="sess.id"
                class="modal-list-row"
              >
                <div>
                  <strong class="mlr-primary">{{ sess.date }}</strong>
                  <span class="mlr-secondary">{{ sess.learningCenter }}</span>
                </div>
                <div class="mlr-right">
                  <span
                    class="meta-pill"
                    :class="sess.status === 'Absent' ? 'pill-priority' : 'pill-source-own'"
                  >
                    {{ sess.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- VIEW 2: MODULE PROGRESS DETAILS -->
          <div v-else-if="learnerModal.mode === 'module'">
            <div class="modal-kpi-row">
              <div class="modal-kpi-box">
                <span class="mkpi-label">Average Progress</span>
                <strong class="mkpi-val text-blue">{{ learnerModal.learner.moduleDetails?.averageProgress ?? 0 }}%</strong>
              </div>
              <div class="modal-kpi-box">
                <span class="mkpi-label">Assigned Modules</span>
                <strong class="mkpi-val">{{ learnerModal.learner.moduleDetails?.assignedCount ?? 0 }}</strong>
              </div>
              <div class="modal-kpi-box">
                <span class="mkpi-label">Completed</span>
                <strong class="mkpi-val">{{ learnerModal.learner.moduleDetails?.completedCount ?? 0 }}</strong>
              </div>
              <div class="modal-kpi-box">
                <span class="mkpi-label">In Progress</span>
                <strong class="mkpi-val">{{ learnerModal.learner.moduleDetails?.inProgressCount ?? 0 }}</strong>
              </div>
            </div>

            <h4 class="modal-section-subtitle">Assigned Learning Modules</h4>
            <div
              v-if="!learnerModal.learner.moduleDetails?.modules?.length"
              class="modal-empty-note"
            >
              No active modules assigned to this learner yet.
            </div>
            <div v-else class="modal-list-table">
              <div
                v-for="mod in learnerModal.learner.moduleDetails.modules"
                :key="mod.moduleId"
                class="modal-list-row"
              >
                <div class="mlr-col-main">
                  <div class="mlr-title-wrap">
                    <strong class="mlr-primary">{{ mod.title }}</strong>
                    <span class="meta-pill pill-source-admin">{{ mod.code }}</span>
                    <span v-if="mod.isDelayed" class="meta-pill pill-priority">{{ mod.delayReason || 'Delayed' }}</span>
                  </div>
                  <span class="mlr-secondary">
                    Pre-Test: {{ mod.preTestScore != null ? mod.preTestScore : '—' }} •
                    Post-Test: {{ mod.postTestScore != null ? mod.postTestScore : '—' }}
                    <template v-if="mod.dueDate"> • Due: {{ mod.dueDate }}</template>
                  </span>
                </div>
                <div class="mlr-right">
                  <span class="meta-pill" :class="mod.statusLabel === 'Completed' ? 'pill-source-own' : 'pill-level'">
                    {{ mod.statusLabel }} ({{ mod.progressPct }}%)
                  </span>
                  <router-link
                    :to="`/dashboard/modules/${mod.moduleId}`"
                    class="modal-inline-btn"
                    @click="closeLearnerModal"
                  >
                    Open Module
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- VIEW 3: RECENT ACTIVITY DETAILS -->
          <div v-else>
            <div class="modal-kpi-row">
              <div class="modal-kpi-box">
                <span class="mkpi-label">Last Recorded Activity</span>
                <strong class="mkpi-val mkpi-val-sm">
                  {{ learnerModal.learner.activityDetails?.lastActivityDate || 'No recorded activity' }}
                </strong>
              </div>
              <div class="modal-kpi-box">
                <span class="mkpi-label">Submissions</span>
                <strong class="mkpi-val">{{ learnerModal.learner.activityDetails?.totalSubmissions ?? 0 }}</strong>
              </div>
              <div class="modal-kpi-box">
                <span class="mkpi-label">Assessments Taken</span>
                <strong class="mkpi-val">{{ learnerModal.learner.activityDetails?.totalAssessmentsTaken ?? 0 }}</strong>
              </div>
              <div class="modal-kpi-box">
                <span class="mkpi-label">Sessions Present</span>
                <strong class="mkpi-val">{{ learnerModal.learner.activityDetails?.totalSessionsAttended ?? 0 }}</strong>
              </div>
            </div>

            <h4 class="modal-section-subtitle">Learner Activity Log</h4>
            <div
              v-if="!learnerModal.learner.activityDetails?.recentEvents?.length"
              class="modal-empty-note"
            >
              No recent learning activities recorded for this learner.
            </div>
            <div v-else class="modal-list-table">
              <div
                v-for="ev in learnerModal.learner.activityDetails.recentEvents"
                :key="ev.id"
                class="modal-list-row"
              >
                <div>
                  <strong class="mlr-primary">{{ ev.activityType }} — {{ ev.moduleTitle }}</strong>
                  <span class="mlr-secondary">{{ ev.dateTime }}</span>
                </div>
                <div class="mlr-right">
                  <span class="meta-pill pill-level">{{ ev.statusLabel }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-modal-footer">
          <button type="button" class="btn-modal-secondary" @click="closeLearnerModal">
            Close
          </button>
          <router-link
            v-if="learnerModal.selectedActivity?.targetRoute"
            :to="learnerModal.selectedActivity.targetRoute"
            class="btn-modal-primary"
            @click="closeLearnerModal"
          >
            {{
              learnerModal.selectedActivity.actionType === 'submission'
                ? 'Open Submission Review'
                : 'Open Module Details'
            }}
          </router-link>
          <router-link
            v-else-if="learnerModal.mode === 'attendance'"
            to="/dashboard/attendance"
            class="btn-modal-primary"
            @click="closeLearnerModal"
          >
            Go to Attendance
          </router-link>
          <router-link
            v-else
            :to="`/dashboard/learners/${learnerModal.learner.id}`"
            class="btn-modal-primary"
            @click="closeLearnerModal"
          >
            Open Learner Profile
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getTeacherDashboardData } from '../api/dashboard.js';
import { getModuleProgressReport } from '../api/reports.js';

const router = useRouter();

const {
  currentTeacher,
  teacherName,
  teacherPosition,
  teacherId,
  assignedCenters,
  assignedProgramLevel,
  assignedLevelOptions,
} = useTeacherSession();

const loading = ref(true);
const hasLoadedOnce = ref(false);
const errorMessage = ref('');
const hoveredMonthIndex = ref(null);

// Teacher profile metadata from backend response (with session fallback)
const teacherMeta = ref({
  id: null,
  fullName: '',
  position: '',
  handledLevels: '',
  assignedCenters: [],
});

const teacherFullName = computed(() => {
  return teacherMeta.value.fullName || teacherName.value || currentTeacher.value?.fullName || 'ALS Teacher';
});

const teacherPositionDisplay = computed(() => {
  return teacherMeta.value.position || teacherPosition.value || 'ALS Teacher';
});

const assignedCenterDisplay = computed(() => {
  if (Array.isArray(teacherMeta.value.assignedCenters) && teacherMeta.value.assignedCenters.length > 0) {
    return teacherMeta.value.assignedCenters.map((c) => c.name).join(', ');
  }
  if (assignedCenters.value && assignedCenters.value.length > 0) {
    return assignedCenters.value.map((c) => c.name).join(', ');
  }
  if (currentTeacher.value?.learningCenter && currentTeacher.value.learningCenter !== '—') {
    return currentTeacher.value.learningCenter;
  }
  return '—';
});

function sanitizeLevelLabel(rawLevel) {
  const str = String(rawLevel || '').trim();
  if (!str || str.toLowerCase().includes('both')) {
    return 'A&E Elementary / A&E Junior High';
  }
  const upper = str.toUpperCase();
  if (upper.includes('ELEM') && (upper.includes('JUN') || upper.includes('HIGH'))) {
    return 'A&E Elementary / A&E Junior High';
  }
  if (upper.includes('ELEM')) {
    return 'A&E Elementary';
  }
  if (upper.includes('JUN') || upper.includes('HIGH')) {
    return 'A&E Junior High';
  }
  return 'A&E Elementary / A&E Junior High';
}

const handledProgramLevelDisplay = computed(() => {
  if (teacherMeta.value.handledLevels) {
    return sanitizeLevelLabel(teacherMeta.value.handledLevels);
  }
  return sanitizeLevelLabel(assignedProgramLevel.value);
});

// Dashboard Filters
const filters = reactive({
  schoolYear: '',
  level: '',
  learningCenterId: '',
});

const filterOptions = ref({
  schoolYears: [],
  levels: ['A&E Elementary', 'A&E Junior High'],
  learningCenters: [],
  hasMultipleCenters: false,
});

// Requirement 9: Show Community Learning Center filter ONLY if the teacher is assigned to multiple centers
const showLearningCenterFilter = computed(() => {
  const apiCentersCount = Array.isArray(filterOptions.value.learningCenters)
    ? filterOptions.value.learningCenters.length
    : 0;
  const sessionCentersCount = Array.isArray(assignedCenters.value)
    ? assignedCenters.value.length
    : 0;
  return apiCentersCount > 1 || sessionCentersCount > 1;
});

const hasActiveFilters = computed(() => {
  return Boolean(filters.schoolYear || filters.level || filters.learningCenterId);
});

// Teacher Level Assignments & Graph Visibility
const hasElemAssigned = computed(() => {
  if (Array.isArray(teacherMeta.value.assignedLevels) && teacherMeta.value.assignedLevels.length > 0) {
    return teacherMeta.value.assignedLevels.includes('A&E Elementary');
  }
  return assignedLevelOptions.value.length === 0 || assignedLevelOptions.value.includes('A&E Elementary');
});

const hasJhsAssigned = computed(() => {
  if (Array.isArray(teacherMeta.value.assignedLevels) && teacherMeta.value.assignedLevels.length > 0) {
    return teacherMeta.value.assignedLevels.includes('A&E Junior High');
  }
  return assignedLevelOptions.value.length === 0 || assignedLevelOptions.value.includes('A&E Junior High');
});

const showElemChart = computed(() => {
  if (!hasElemAssigned.value) return false;
  if (!filters.level) return true;
  return filters.level.toLowerCase().includes('elem');
});

const showJhsChart = computed(() => {
  if (!hasJhsAssigned.value) return false;
  if (!filters.level) return true;
  const l = filters.level.toLowerCase();
  return l.includes('jun') || l.includes('jhs') || l.includes('sec');
});

// Top Section: Summary Cards (includes Pending Submissions)
const summary = ref({
  totalLearners: 0,
  elementaryLearners: 0,
  juniorHighLearners: 0,
  averageAttendanceRate: 0,
  totalAttendanceRecords: 0,
  presentAttendanceRecords: 0,
  totalSessions: 0,
  pendingSubmissions: 0,
  reviewedSubmissions: 0,
  totalSubmissions: 0,
  reviewSubmissionsRoute: '/dashboard/modules',
});

// Operational Sections (Strictly scoped to logged-in teacher)
const announcements = ref([]);
const upcomingSchedules = ref([]);
const learnersNeedingAttention = ref({
  hasIssues: false,
  totalIssues: 0,
  totalAffectedLearners: 0,
  lowAttendanceCount: 0,
  delayedProgressCount: 0,
  noRecentActivityCount: 0,
  items: [
    {
      key: 'lowAttendance',
      label: 'Low Attendance',
      description: 'Learners with attendance rates below 75%.',
      count: 0,
      actionType: 'attendance',
      actionLabel: 'View Attendance',
      route: '/dashboard/learners',
      learners: [],
    },
    {
      key: 'delayedProgress',
      label: 'Delayed Module Progress',
      description: 'Learners with overdue modules or delayed progress.',
      count: 0,
      actionType: 'module',
      actionLabel: 'View Module',
      route: '/dashboard/learners',
      learners: [],
    },
    {
      key: 'noRecentActivity',
      label: 'No Recent Learning Activity',
      description: 'Learners with no recorded learning activity in the last 30 days.',
      count: 0,
      actionType: 'activity',
      actionLabel: 'View Details',
      route: '/dashboard/learners',
      learners: [],
    },
  ],
});
const recentLearnerActivities = ref([]);
const recentTeacherActivities = ref([]);
const activeActivityTab = ref('learners');

const uniqueAttentionCount = computed(() => {
  if (learnersNeedingAttention.value?.totalAffectedLearners != null) {
    return Number(learnersNeedingAttention.value.totalAffectedLearners);
  }
  const idSet = new Set();
  const items = learnersNeedingAttention.value?.items || [];
  for (const item of items) {
    for (const lrn of (item.learners || [])) {
      if (lrn?.id) idSet.add(lrn.id);
    }
  }
  return idSet.size;
});

// Always provide all three category cards in exact order
const attentionCategories = computed(() => {
  const definitions = [
    {
      key: 'lowAttendance',
      label: 'Low Attendance',
      description: 'Learners with attendance rates below 75%.',
      actionType: 'attendance',
      actionLabel: 'View Attendance',
      route: '/dashboard/learners',
    },
    {
      key: 'delayedProgress',
      label: 'Delayed Module Progress',
      description: 'Learners with overdue modules or delayed progress.',
      actionType: 'module',
      actionLabel: 'View Module',
      route: '/dashboard/learners',
    },
    {
      key: 'noRecentActivity',
      label: 'No Recent Learning Activity',
      description: 'Learners with no recorded learning activity in the last 30 days.',
      actionType: 'activity',
      actionLabel: 'View Details',
      route: '/dashboard/learners',
    },
  ];

  const rawItems = learnersNeedingAttention.value?.items || [];
  return definitions.map((def) => {
    const found = rawItems.find((it) => it.key === def.key);
    const learners = (found && Array.isArray(found.learners)) ? found.learners : [];
    const count = learners.length || (found ? Number(found.count) || 0 : 0);
    return {
      ...def,
      ...(found || {}),
      label: def.label,
      description: def.description,
      learners,
      count,
    };
  });
});

function formatCategoryCount(count) {
  const n = Number(count) || 0;
  if (n === 1) return '1 Learner';
  return `${n} Learners`;
}

function getCategoryEmptyMessage(key) {
  if (key === 'lowAttendance') return 'No learners with low attendance.';
  if (key === 'delayedProgress') return 'No learners with delayed module progress.';
  if (key === 'noRecentActivity') return 'No learners with inactive learning activity.';
  return 'No learners needing attention in this category.';
}

function getCategoryLearnerIndicator(key, lrn) {
  if (!lrn) return '';
  if (key === 'lowAttendance') {
    if (lrn.attendanceRate != null) {
      return `${lrn.attendanceRate}% Attendance`;
    }
    return lrn.indicator || 'Low Attendance (<75%)';
  }
  if (key === 'delayedProgress') {
    return lrn.indicator || 'Delayed Module Progress';
  }
  if (key === 'noRecentActivity') {
    if (lrn.activityDetails?.daysSinceLastActivity != null) {
      return `Inactive for ${lrn.activityDetails.daysSinceLastActivity} days`;
    }
    return lrn.indicator || 'No activity in 30+ days';
  }
  return lrn.indicator || '';
}

// Learner Details Modal State
const learnerModal = reactive({
  open: false,
  mode: 'attendance',
  learner: null,
  selectedActivity: null,
});

function getAttentionActionLabel(key) {
  if (key === 'lowAttendance' || key === 'attendance') return 'View Attendance';
  if (key === 'delayedProgress' || key === 'module') return 'View Module';
  return 'View Details';
}

function openAttentionLearnerModal(learner, actionType) {
  if (!learner) return;
  learnerModal.learner = learner;
  learnerModal.selectedActivity = null;
  if (actionType === 'attendance' || actionType === 'lowAttendance') {
    learnerModal.mode = 'attendance';
  } else if (actionType === 'module' || actionType === 'delayedProgress') {
    learnerModal.mode = 'module';
  } else {
    learnerModal.mode = 'activity';
  }
  learnerModal.open = true;
}

function handleLearnerActivityClick(act) {
  if (!act) return;
  if (act.learnerDetail) {
    learnerModal.learner = act.learnerDetail;
    learnerModal.selectedActivity = act;
    if (act.type === 'attendance') {
      learnerModal.mode = 'attendance';
    } else if (act.type === 'module') {
      learnerModal.mode = 'module';
    } else {
      learnerModal.mode = 'activity';
    }
    learnerModal.open = true;
    return;
  }
  if (act.targetRoute) {
    router.push(act.targetRoute);
  }
}

function closeLearnerModal() {
  learnerModal.open = false;
}

// Learners by Level summary data
const learnersByLevel = ref({
  total: 0,
  elementary: 0,
  junior: 0,
  juniorHigh: 0,
  elementaryPct: 0,
  juniorPct: 0,
  juniorHighPct: 0,
});

// Sex Distribution by ALS Level
const sexDistributionByLevel = ref({
  totalLearners: 0,
  totalMale: 0,
  totalFemale: 0,
  elementary: { label: 'A&E Elementary', male: 0, female: 0, total: 0 },
  juniorHigh: { label: 'A&E Junior High', male: 0, female: 0, total: 0 },
});

// Module Use and Learner's Progress Preview (Dynamic Table with Month Filter)
const moduleProgressPreviewLearners = ref([]);
const selectedModuleUseMonth = ref('');
const loadingModuleProgress = ref(false);

const monthOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getMonthDateRange(monthName, schoolYear) {
  if (!monthName || monthName === 'All Months') return null;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const mIdx = monthNames.indexOf(monthName);
  if (mIdx === -1) return null;

  let yr = new Date().getFullYear();
  const sy = String(schoolYear || '').trim();
  if (sy && sy.includes('-')) {
    const [syStart, syEnd] = sy.split('-').map(Number);
    if (!isNaN(syStart) && !isNaN(syEnd)) {
      yr = mIdx >= 5 ? syStart : syEnd;
    }
  } else if (sy) {
    const parsed = Number(sy);
    if (!isNaN(parsed) && parsed > 1900) yr = parsed;
  }

  const lastDay = new Date(yr, mIdx + 1, 0).getDate();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    year: yr,
    monthIndex: mIdx,
    monthNumber: mIdx + 1,
    fromDate: `${yr}-${pad(mIdx + 1)}-01`,
    toDate: `${yr}-${pad(mIdx + 1)}-${pad(lastDay)}`,
  };
}

const viewAllModuleProgressUrl = computed(() => {
  const query = {};
  if (selectedModuleUseMonth.value) {
    const range = getMonthDateRange(selectedModuleUseMonth.value, filters.schoolYear);
    if (range) {
      query.fromDate = range.fromDate;
      query.toDate = range.toDate;
      query.month = selectedModuleUseMonth.value;
      if (range.year) query.year = String(range.year);
    }
  }
  if (filters.schoolYear) {
    query.schoolYear = filters.schoolYear;
  }
  if (filters.level) {
    query.level = filters.level;
  }
  if (showLearningCenterFilter.value && filters.learningCenterId) {
    query.learningCenterId = filters.learningCenterId;
  }
  return {
    path: '/dashboard/reports/module-progress',
    query,
  };
});

async function fetchModuleProgressPreview() {
  const tid = teacherId.value || currentTeacher.value?.id;
  if (!tid) return;

  loadingModuleProgress.value = true;
  try {
    const reportParams = {
      teacherId: tid,
    };
    if (filters.level) reportParams.programLevel = filters.level;
    if (showLearningCenterFilter.value && filters.learningCenterId) {
      reportParams.learningCenterId = filters.learningCenterId;
    }
    if (filters.schoolYear) {
      reportParams.schoolYear = filters.schoolYear;
    }

    if (selectedModuleUseMonth.value) {
      const range = getMonthDateRange(selectedModuleUseMonth.value, filters.schoolYear);
      if (range) {
        reportParams.fromDate = range.fromDate;
        reportParams.toDate = range.toDate;
        reportParams.month = selectedModuleUseMonth.value;
        reportParams.year = range.year;
      }
    }

    const moduleReportData = await getModuleProgressReport(reportParams);
    if (moduleReportData) {
      const rawLearners = Array.isArray(moduleReportData.all) && moduleReportData.all.length > 0
        ? moduleReportData.all
        : [...(moduleReportData.male || []), ...(moduleReportData.female || [])];

      // Consistent alphabetical ordering by learner full name
      const sortedLearners = [...rawLearners].sort((a, b) => {
        const nameA = (a.fullName || a.name || '').trim().toLowerCase();
        const nameB = (b.fullName || b.name || '').trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Display all assigned learners matching the active filters
      moduleProgressPreviewLearners.value = sortedLearners.map((l) => ({
        id: l.id,
        fullName: l.fullName || l.name || 'Learner',
        mastered: Number(l.mastered || 0),
        notMastered: Number(l.notMastered || 0),
        pending: Number(l.pending || 0),
        progress: Number(l.progress || 0),
      }));
    } else {
      moduleProgressPreviewLearners.value = [];
    }
  } catch (err) {
    console.warn('Could not load module progress report preview for dashboard:', err);
  } finally {
    loadingModuleProgress.value = false;
  }
}

function handleModuleUseMonthChange() {
  fetchModuleProgressPreview();
}

// Module Completion by ALS Level
const moduleCompletionByLevel = ref({
  unit: 'Learners',
  totalLearners: 0,
  totalCompleted: 0,
  totalInProgress: 0,
  totalNotStarted: 0,
  elementary: { label: 'A&E Elementary', completed: 0, inProgress: 0, notStarted: 0, total: 0 },
  juniorHigh: { label: 'A&E Junior High', completed: 0, inProgress: 0, notStarted: 0, total: 0 },
});

// Learner Progress by ALS Level
const learnerProgressByLevel = ref({
  hasData: false,
  elementary: {
    label: 'A&E Elementary',
    averageProgress: 0,
    learnersCount: 0,
    completedLearnersCount: 0,
    inProgressLearnersCount: 0,
    notStartedLearnersCount: 0,
    assignedModulesCount: 0,
    completedModulesCount: 0,
    inProgressModulesCount: 0,
    notStartedModulesCount: 0,
  },
  juniorHigh: {
    label: 'A&E Junior High',
    averageProgress: 0,
    learnersCount: 0,
    completedLearnersCount: 0,
    inProgressLearnersCount: 0,
    notStartedLearnersCount: 0,
    assignedModulesCount: 0,
    completedModulesCount: 0,
    inProgressModulesCount: 0,
    notStartedModulesCount: 0,
  },
});

// Monthly Attendance Trend
const attendanceTrend = ref({
  hasData: false,
  totalRecords: 0,
  totalSessions: 0,
  presentRecords: 0,
  absentRecords: 0,
  averageRate: 0,
  elementaryRate: 0,
  elementaryHasRecords: false,
  juniorHighRate: 0,
  juniorHighHasRecords: false,
  monthly: [],
});

async function fetchDashboardData() {
  const tid = teacherId.value || currentTeacher.value?.id;
  if (!tid) {
    loading.value = false;
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  try {
    const [data] = await Promise.all([
      getTeacherDashboardData({
        teacherId: tid,
        schoolYear: filters.schoolYear,
        level: filters.level,
        learningCenterId: showLearningCenterFilter.value ? filters.learningCenterId : '',
      }),
      fetchModuleProgressPreview(),
    ]);

    if (data) {
      if (data.teacher) {
        teacherMeta.value = data.teacher;
      }
      if (data.filterOptions) {
        const authorizedCenters = Array.isArray(data.filterOptions.learningCenters)
          ? data.filterOptions.learningCenters
          : [];
        filterOptions.value = {
          schoolYears: Array.isArray(data.filterOptions.schoolYears) ? data.filterOptions.schoolYears : [],
          levels: Array.isArray(data.filterOptions.levels) ? data.filterOptions.levels : ['A&E Elementary', 'A&E Junior High'],
          learningCenters: authorizedCenters,
          hasMultipleCenters: Boolean(data.filterOptions.hasMultipleCenters || authorizedCenters.length > 1),
        };
      }
      if (data.summary) {
        summary.value = {
          totalLearners: data.summary.totalLearners ?? 0,
          elementaryLearners: data.summary.elementaryLearners ?? 0,
          juniorHighLearners: data.summary.juniorHighLearners ?? 0,
          averageAttendanceRate: data.summary.averageAttendanceRate ?? 0,
          totalAttendanceRecords: data.summary.totalAttendanceRecords ?? 0,
          presentAttendanceRecords: data.summary.presentAttendanceRecords ?? 0,
          totalSessions: data.summary.totalSessions ?? 0,
          pendingSubmissions: data.summary.pendingSubmissions ?? 0,
          reviewedSubmissions: data.summary.reviewedSubmissions ?? 0,
          totalSubmissions: data.summary.totalSubmissions ?? 0,
          reviewSubmissionsRoute: data.summary.reviewSubmissionsRoute || '/dashboard/modules',
        };
      }
      if (Array.isArray(data.announcements)) {
        announcements.value = data.announcements.slice(0, 3);
      }
      if (Array.isArray(data.upcomingSchedules)) {
        upcomingSchedules.value = data.upcomingSchedules.slice(0, 3);
      }
      const dist = data.learnersByLevel || data.learnerDistribution;
      if (dist) {
        learnersByLevel.value = {
          ...dist,
          juniorHigh: dist.juniorHigh ?? dist.junior ?? 0,
          juniorHighPct: dist.juniorHighPct ?? dist.juniorPct ?? 0,
        };
      }
      if (data.sexDistributionByLevel) sexDistributionByLevel.value = data.sexDistributionByLevel;
      if (data.moduleCompletionByLevel) moduleCompletionByLevel.value = data.moduleCompletionByLevel;
      if (data.learnerProgressByLevel) learnerProgressByLevel.value = data.learnerProgressByLevel;
      if (data.attendanceTrend) attendanceTrend.value = data.attendanceTrend;
      if (data.learnersNeedingAttention) learnersNeedingAttention.value = data.learnersNeedingAttention;
      if (Array.isArray(data.recentLearnerActivities)) {
        recentLearnerActivities.value = data.recentLearnerActivities.slice(0, 5);
      }
      if (Array.isArray(data.recentTeacherActivities)) {
        recentTeacherActivities.value = data.recentTeacherActivities.slice(0, 5);
      }
      hasLoadedOnce.value = true;
    }
  } catch (err) {
    console.error('Failed to load teacher dashboard data from API:', err);
    errorMessage.value = 'Unable to load your latest dashboard statistics. Please check your connection and try again.';
  } finally {
    loading.value = false;
  }
}

function handleFilterChange() {
  hoveredMonthIndex.value = null;
  fetchDashboardData();
}

function resetFilters() {
  filters.schoolYear = '';
  filters.level = '';
  filters.learningCenterId = '';
  hoveredMonthIndex.value = null;
  fetchDashboardData();
}

watch(() => filters.learningCenterId, () => {
  if (filters.level && !assignedLevelOptions.value.includes(filters.level)) {
    filters.level = '';
    handleFilterChange();
  }
});

watch(assignedLevelOptions, (newOpts) => {
  if (filters.level && !newOpts.includes(filters.level)) {
    filters.level = '';
    handleFilterChange();
  }
});

watch(teacherId, (newTid) => {
  if (newTid) {
    fetchDashboardData();
  }
});

// Helper to compute clean integer Y-axis ticks for vertical bar charts
function buildYAxisTicks(maxVal, topY = 28, baselineY = 192) {
  const usableHeight = baselineY - topY;
  const safeMax = Math.max(4, Math.ceil(maxVal * 1.15));
  const step = Math.max(1, Math.ceil(safeMax / 4));
  const niceMax = step * 4;
  const ticks = [];
  for (let i = 0; i <= 4; i++) {
    const value = i * step;
    const y = baselineY - (value / niceMax) * usableHeight;
    ticks.push({
      value,
      y: Math.round(y * 10) / 10,
      isZero: i === 0,
    });
  }
  return { niceMax, usableHeight, topY, baselineY, ticks };
}

const maleLegendBreakdown = computed(() => {
  const parts = [];
  if (showElemChart.value) {
    parts.push(`A&E Elementary: ${sexDistributionByLevel.value.elementary?.male || 0}`);
  }
  if (showJhsChart.value) {
    parts.push(`A&E Junior High: ${sexDistributionByLevel.value.juniorHigh?.male || 0}`);
  }
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
});

const femaleLegendBreakdown = computed(() => {
  const parts = [];
  if (showElemChart.value) {
    parts.push(`A&E Elementary: ${sexDistributionByLevel.value.elementary?.female || 0}`);
  }
  if (showJhsChart.value) {
    parts.push(`A&E Junior High: ${sexDistributionByLevel.value.juniorHigh?.female || 0}`);
  }
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
});

// Computed Geometry: Sex Distribution by ALS Level (Grouped Vertical Bars)
const sexDistributionChart = computed(() => {
  const elem = sexDistributionByLevel.value.elementary || { male: 0, female: 0 };
  const jhs = sexDistributionByLevel.value.juniorHigh || { male: 0, female: 0 };
  const bothVisible = showElemChart.value && showJhsChart.value;

  const maxVal = Math.max(
    showElemChart.value ? Math.max(elem.male || 0, elem.female || 0) : 0,
    showJhsChart.value ? Math.max(jhs.male || 0, jhs.female || 0) : 0
  );
  const { niceMax, usableHeight, baselineY, ticks } = buildYAxisTicks(maxVal, 28, 186);

  const barWidth = bothVisible ? 44 : 52;
  const barGap = bothVisible ? 14 : 20;

  const groupConfigs = [];
  if (showElemChart.value) {
    groupConfigs.push({
      key: 'elementary',
      label: 'A&E Elementary',
      cx: bothVisible ? 170 : 260,
      male: elem.male || 0,
      female: elem.female || 0,
    });
  }
  if (showJhsChart.value) {
    groupConfigs.push({
      key: 'juniorHigh',
      label: 'A&E Junior High',
      cx: bothVisible ? 350 : 260,
      male: jhs.male || 0,
      female: jhs.female || 0,
    });
  }

  const groups = groupConfigs.map((g) => {
    const maleCx = g.cx - (barWidth + barGap) / 2;
    const femaleCx = g.cx + (barWidth + barGap) / 2;

    const rawItems = [
      { key: 'male', sexLabel: 'Male', count: g.male, cx: maleCx, color: '#2563eb' },
      { key: 'female', sexLabel: 'Female', count: g.female, cx: femaleCx, color: '#e11d48' },
    ];

    const bars = rawItems.map((item) => {
      const height = item.count > 0 ? Math.max(6, (item.count / niceMax) * usableHeight) : 0;
      const y = baselineY - height;
      return {
        ...item,
        width: barWidth,
        x: item.cx - barWidth / 2,
        y,
        height,
        labelY: item.count > 0 ? y - 7 : baselineY - 9,
      };
    });

    return {
      key: g.key,
      label: g.label,
      cx: g.cx,
      bars,
    };
  });

  return { baselineY, yTicks: ticks, groups };
});

// Computed Geometry: Module Completion by ALS Level (Grouped Vertical Bars: 3 Bars per Level)
const moduleCompletionChart = computed(() => {
  const elem = moduleCompletionByLevel.value.elementary || { completed: 0, inProgress: 0, notStarted: 0 };
  const jhs = moduleCompletionByLevel.value.juniorHigh || { completed: 0, inProgress: 0, notStarted: 0 };
  const bothVisible = showElemChart.value && showJhsChart.value;

  const maxVal = Math.max(
    showElemChart.value ? Math.max(elem.completed || 0, elem.inProgress || 0, elem.notStarted || 0) : 0,
    showJhsChart.value ? Math.max(jhs.completed || 0, jhs.inProgress || 0, jhs.notStarted || 0) : 0
  );
  const { niceMax, usableHeight, baselineY, ticks } = buildYAxisTicks(maxVal, 28, 190);

  const barWidth = bothVisible ? 34 : 44;
  const barGap = bothVisible ? 10 : 14;

  const groupConfigs = [];
  if (showElemChart.value) {
    groupConfigs.push({
      key: 'elementary',
      label: 'A&E Elementary',
      cx: bothVisible ? 165 : 260,
      completed: elem.completed || 0,
      inProgress: elem.inProgress || 0,
      notStarted: elem.notStarted || 0,
    });
  }
  if (showJhsChart.value) {
    groupConfigs.push({
      key: 'juniorHigh',
      label: 'A&E Junior High',
      cx: bothVisible ? 355 : 260,
      completed: jhs.completed || 0,
      inProgress: jhs.inProgress || 0,
      notStarted: jhs.notStarted || 0,
    });
  }

  const groups = groupConfigs.map((g) => {
    const step = barWidth + barGap;
    const rawItems = [
      {
        key: 'completed',
        statusLabel: 'Completed',
        shortLabel: 'Completed',
        count: g.completed,
        cx: g.cx - step,
        color: '#10b981',
      },
      {
        key: 'inProgress',
        statusLabel: 'In Progress',
        shortLabel: 'In Prog.',
        count: g.inProgress,
        cx: g.cx,
        color: '#f59e0b',
      },
      {
        key: 'notStarted',
        statusLabel: 'Not Started',
        shortLabel: 'Not Start.',
        count: g.notStarted,
        cx: g.cx + step,
        color: '#64748b',
      },
    ];

    const bars = rawItems.map((item) => {
      const height = item.count > 0 ? Math.max(6, (item.count / niceMax) * usableHeight) : 0;
      const y = baselineY - height;
      return {
        ...item,
        width: barWidth,
        x: item.cx - barWidth / 2,
        y,
        height,
        labelY: item.count > 0 ? y - 7 : baselineY - 9,
      };
    });

    return {
      key: g.key,
      label: g.label,
      cx: g.cx,
      bars,
    };
  });

  return { baselineY, yTicks: ticks, groups };
});

// Helper to build discontinuous polyline segments for months with recorded sessions only
function buildAttendanceSegments(pointsList, yKey, hasRecordsFn) {
  const segments = [];
  let current = [];
  for (const pt of pointsList) {
    if (hasRecordsFn(pt) && pt[yKey] !== null && pt[yKey] !== undefined) {
      current.push(`${pt.x},${pt[yKey]}`);
    } else if (current.length > 0) {
      if (current.length >= 2) {
        segments.push(current.join(' '));
      }
      current = [];
    }
  }
  if (current.length >= 2) {
    segments.push(current.join(' '));
  }
  return segments;
}

// Computed Geometry: Monthly Attendance Trend (Side-by-Side Card ViewBox 0 0 560 225)
const attendanceLineChart = computed(() => {
  const months = attendanceTrend.value?.monthly || [];
  const topY = 24;
  const baselineY = 182;
  const usableHeight = baselineY - topY;
  const startX = 76;
  const endX = 512;

  const yGrid = [100, 75, 50, 25, 0].map((pct) => ({
    pct,
    y: Math.round((baselineY - (pct / 100) * usableHeight) * 10) / 10,
  }));

  if (months.length === 0) {
    return {
      baselineY,
      yGrid,
      points: [],
      elementarySegments: [],
      juniorHighSegments: [],
    };
  }

  const count = months.length;
  const stepX = count > 1 ? (endX - startX) / (count - 1) : 0;

  const points = months.map((m, idx) => {
    const x = count === 1 ? (startX + endX) / 2 : Math.round((startX + idx * stepX) * 10) / 10;
    const elemObj = m.elementary || {
      hasRecords: false,
      attendancePercentage: null,
      presentRecords: 0,
      totalRecords: 0,
      sessionsCount: 0,
    };
    const jhsObj = m.juniorHigh || {
      hasRecords: false,
      attendancePercentage: null,
      presentRecords: 0,
      totalRecords: 0,
      sessionsCount: 0,
    };

    const elemHasRecords = Boolean(elemObj.hasRecords && elemObj.attendancePercentage !== null);
    const jhsHasRecords = Boolean(jhsObj.hasRecords && jhsObj.attendancePercentage !== null);

    const elemPct = elemHasRecords ? Math.min(100, Math.max(0, Number(elemObj.attendancePercentage) || 0)) : null;
    const jhsPct = jhsHasRecords ? Math.min(100, Math.max(0, Number(jhsObj.attendancePercentage) || 0)) : null;

    // Never plot 0% points for months without recorded attendance sessions
    const elemY = elemHasRecords ? Math.round((baselineY - (elemPct / 100) * usableHeight) * 10) / 10 : null;
    const jhsY = jhsHasRecords ? Math.round((baselineY - (jhsPct / 100) * usableHeight) * 10) / 10 : null;

    let elemLabelY = elemY !== null ? elemY - 9 : null;
    let jhsLabelY = jhsY !== null ? jhsY - 9 : null;
    if (
      showElemChart.value &&
      showJhsChart.value &&
      elemY !== null &&
      jhsY !== null &&
      Math.abs(elemY - jhsY) < 16
    ) {
      if (elemY <= jhsY) {
        elemLabelY = elemY - 10;
        jhsLabelY = Math.min(baselineY - 4, jhsY + 15);
      } else {
        jhsLabelY = jhsY - 10;
        elemLabelY = Math.min(baselineY - 4, elemY + 15);
      }
    }

    const tooltips = [m.month];
    if (showElemChart.value) {
      tooltips.push(
        elemHasRecords
          ? `A&E Elementary: ${elemPct}% (${elemObj.presentRecords}/${elemObj.totalRecords} present)`
          : 'A&E Elementary: No sessions'
      );
    }
    if (showJhsChart.value) {
      tooltips.push(
        jhsHasRecords
          ? `A&E Junior High: ${jhsPct}% (${jhsObj.presentRecords}/${jhsObj.totalRecords} present)`
          : 'A&E Junior High: No sessions'
      );
    }

    const hasVisibleRecords = Boolean(
      (showElemChart.value && elemHasRecords) || (showJhsChart.value && jhsHasRecords)
    );

    return {
      key: m.key,
      label: m.month,
      x,
      elemY,
      jhsY,
      elemLabelY,
      jhsLabelY,
      hasVisibleRecords,
      elementary: {
        ...elemObj,
        hasRecords: elemHasRecords,
        attendancePercentage: elemPct,
      },
      juniorHigh: {
        ...jhsObj,
        hasRecords: jhsHasRecords,
        attendancePercentage: jhsPct,
      },
      tooltipText: tooltips.join('\n'),
    };
  });

  const elementarySegments = showElemChart.value
    ? buildAttendanceSegments(points, 'elemY', (p) => p.elementary.hasRecords)
    : [];
  const juniorHighSegments = showJhsChart.value
    ? buildAttendanceSegments(points, 'jhsY', (p) => p.juniorHigh.hasRecords)
    : [];

  return {
    baselineY,
    yGrid,
    points,
    elementarySegments,
    juniorHighSegments,
  };
});

const hoveredMonthPoint = computed(() => {
  if (hoveredMonthIndex.value === null) return null;
  return attendanceLineChart.value.points[hoveredMonthIndex.value] || null;
});

onMounted(fetchDashboardData);
</script>

<style scoped>
.teacher-dashboard {
  padding-bottom: 3rem;
}

/* Welcome Section & Quick Actions Card */
.welcome-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.welcome-info-col {
  flex: 1;
}

.welcome-title {
  font-size: 1.65rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.65rem 0;
  letter-spacing: -0.02em;
}

.welcome-meta-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
  font-size: 0.875rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.meta-label {
  color: #64748b;
  font-weight: 500;
}

.meta-value {
  color: #1e293b;
}

.meta-value.text-strong {
  font-weight: 600;
  color: #0f172a;
}

.role-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.775rem;
  font-weight: 700;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
}

/* Quick Actions Box */
.quick-actions-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.quick-actions-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.quick-actions-buttons {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.quick-act-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 40px;
  padding: 0.5rem 0.95rem;
  font-size: 0.84rem;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.quick-act-primary {
  background: #2563eb;
  color: #ffffff;
  border: 1px solid #1d4ed8;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
}

.quick-act-primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.quick-act-secondary {
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #cbd5e1;
}

.quick-act-secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
  transform: translateY(-1px);
}

.refresh-btn.is-loading {
  opacity: 0.75;
  pointer-events: none;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Dashboard Filter Bar (Fitts's Law & Accessible Controls) */
.dashboard-filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.filter-bar-inner {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.filter-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.875rem;
}

.filter-icon {
  color: #2563eb;
}

.filter-controls-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.25fr) auto;
  gap: 1rem;
  align-items: end;
  width: 100%;
}

.filter-controls-grid.two-filters {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
}

.filter-control-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.filter-item-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
}

.filter-select-input {
  width: 100%;
  height: 42px;
  min-height: 42px;
  box-sizing: border-box;
  padding: 0 2.25rem 0 0.85rem;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 400;
  color: #0f172a;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px 8px;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.filter-select-input:hover {
  background-color: #ffffff;
  border-color: #94a3b8;
}

.filter-select-input:focus {
  outline: none;
  background-color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.btn-reset-filters {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  height: 42px;
  min-height: 42px;
  box-sizing: border-box;
  padding: 0 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-reset-filters:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

.btn-reset-filters:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  outline: none;
}

.btn-reset-filters:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Error Banner */
.dashboard-error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  margin-bottom: 1.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 0.875rem;
  font-weight: 500;
}

.error-banner-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.btn-retry {
  padding: 0.4rem 0.85rem;
  background: #ffffff;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  color: #b91c1c;
  font-size: 0.8125rem;
  font-weight: 600;
}

.btn-retry:hover {
  background: #fee2e2;
}

.dashboard-section {
  margin-bottom: 1.5rem;
}

/* TOP SECTION: Summary Cards Grid */
.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(195px, 1fr));
  gap: 1.15rem;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.stat-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  line-height: 1.35;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.stat-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue {
  background: #eff6ff;
  color: #2563eb;
}

.icon-emerald {
  background: #ecfdf5;
  color: #059669;
}

.icon-amber {
  background: #fffbeb;
  color: #d97706;
}

.icon-purple {
  background: #faf5ff;
  color: #7c3aed;
}

.stat-card-body {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.85rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.15;
}

.text-primary-rate {
  color: #2563eb;
}

.stat-value-loading {
  font-size: 1.75rem;
  font-weight: 800;
  color: #cbd5e1;
}

.stat-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.35rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 2-Column Balanced Grid (Desktop 2 columns, Mobile 1 column) */
.dashboard-grid-2-balanced {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.dashboard-two-col-layout {
  align-items: stretch;
}

.dashboard-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard-col-left {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.module-use-preview-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.card-header-filter-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.card-filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.card-filter-select {
  padding: 0.38rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #0f172a;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  min-width: 130px;
}

.card-filter-select:hover {
  border-color: #94a3b8;
}

.card-filter-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.module-use-table-wrap {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: auto;
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.module-use-table-wrap.is-refreshing {
  opacity: 0.6;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.module-use-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.module-use-table-wrap::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 4px;
}

.module-use-table-wrap::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.module-use-table-wrap::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.module-use-preview-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.84rem;
}

.module-use-preview-table thead {
  position: sticky;
  top: 0;
  z-index: 2;
}

.module-use-preview-table th {
  position: sticky;
  top: 0;
  background-color: #f8fafc;
  padding: 0.75rem 0.85rem;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #475569;
  border-bottom: 1px solid #cbd5e1;
  border-right: 1px solid #e2e8f0;
  white-space: nowrap;
}

.module-use-preview-table th:last-child {
  border-right: none;
}

.module-use-preview-table th.th-learner-name {
  text-align: left;
}

.module-use-preview-table th.th-center {
  text-align: center;
}

.module-use-preview-table tbody tr {
  transition: background-color 0.12s ease;
}

.module-use-preview-table tbody tr:hover {
  background-color: #f8fafc;
}

.module-use-preview-table td {
  padding: 0.75rem 0.85rem;
  font-size: 0.82rem;
  color: #1e293b;
  vertical-align: middle;
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
}

.module-use-preview-table td:last-child {
  border-right: none;
}

.module-use-preview-table tbody tr:last-child td {
  border-bottom: none;
}

.module-use-preview-table .td-learner-name {
  text-align: left;
  font-weight: 600;
  color: #0f172a;
}

.module-use-preview-table .td-center {
  text-align: center;
}

.module-use-preview-table .font-num {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.module-use-preview-table .td-progress {
  color: #1d4ed8;
  font-weight: 700;
}

.card-bottom-action-wrap {
  margin-top: auto;
  padding-top: 1.25rem;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.btn-card-view-all {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.45rem 0.95rem;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.15s ease;
  min-height: 34px;
}

.btn-card-view-all:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.chart-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.35rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.chart-card-section {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-box-header-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.chart-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.2rem 0;
}

.chart-card-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

.badge-info-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  white-space: nowrap;
}

/* Vertical Bar Chart SVG Styling */
.vbar-chart-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.svg-vbar-chart {
  width: 100%;
  height: auto;
  max-height: 245px;
  display: block;
  overflow: visible;
}

.svg-axis-unit {
  font-size: 10.5px;
  font-weight: 600;
  fill: #64748b;
}

.svg-axis-label {
  font-size: 11px;
  font-weight: 500;
  fill: #64748b;
}

.svg-bar-value {
  font-size: 12.5px;
  font-weight: 800;
  fill: #0f172a;
}

.svg-x-category {
  font-size: 12px;
  font-weight: 700;
  fill: #0f172a;
}

.svg-subbar-label {
  font-size: 10.5px;
  font-weight: 600;
  fill: #475569;
}

.svg-subbar-label-sm {
  font-size: 9.5px;
  font-weight: 600;
  fill: #475569;
}

.svg-vbar-rect {
  transition: opacity 0.15s ease;
  cursor: pointer;
}

.svg-vbar-rect:hover {
  opacity: 0.88;
}

.inline-legend-pills {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.legend-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.775rem;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.25rem 0.55rem;
}

.chart-legend-row {
  display: flex;
  gap: 1.15rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.legend-badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: #475569;
}

.legend-swatch {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  flex-shrink: 0;
  display: inline-block;
}

.legend-swatch-sm {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex-shrink: 0;
  display: inline-block;
}

.legend-line-swatch {
  width: 16px;
  height: 4px;
  border-radius: 2px;
  flex-shrink: 0;
  display: inline-block;
}

/* Horizontal Percentage Progress Visualization (Graph 4) */
.horizontal-progress-container {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  justify-content: center;
  flex: 1;
  padding: 0.35rem 0;
}

.progress-level-block {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.progress-level-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.progress-level-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.progress-level-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 0.35rem;
  flex-shrink: 0;
}

.progress-level-name {
  display: block;
  font-size: 0.925rem;
  font-weight: 700;
  color: #0f172a;
}

.progress-level-meta {
  display: block;
  font-size: 0.775rem;
  color: #475569;
  margin-top: 0.1rem;
}

.progress-percentage-badge {
  font-size: 0.85rem;
  font-weight: 800;
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  flex-shrink: 0;
}

.pct-blue {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.pct-teal {
  background: #f0fdfa;
  color: #0f766e;
  border: 1px solid #99f6e4;
}

.progress-bar-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.progress-track-horizontal {
  flex: 1;
  height: 16px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill-horizontal {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fill-elementary {
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
}

.fill-junior-high {
  background: linear-gradient(90deg, #0d9488 0%, #14b8a6 100%);
}

.progress-side-pct {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  min-width: 44px;
  text-align: right;
}

.progress-breakdown-tags {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
  border-top: 1px dashed #e2e8f0;
}

.prog-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.775rem;
  color: #475569;
}

.prog-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Monthly Attendance Trend Line Chart (Graph 5) */
.attendance-kpi-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.kpi-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: #475569;
  background: #f8fafc;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.kpi-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bg-purple {
  background-color: #7e22ce;
}

.line-chart-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.line-chart-hover-banner {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  min-height: 40px;
  font-size: 0.8125rem;
}

.hover-month-name {
  font-weight: 700;
  color: #0f172a;
  background: #e2e8f0;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.hover-level-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #475569;
}

.hover-hint-text {
  color: #94a3b8;
  font-size: 0.8rem;
}

.text-muted {
  color: #94a3b8;
}

.chart-canvas-container {
  width: 100%;
  overflow-x: auto;
}

.trend-line-svg {
  width: 100%;
  min-width: 520px;
  height: 230px;
  display: block;
}

.chart-axis-text {
  font-size: 11px;
  font-weight: 500;
  fill: #64748b;
  font-family: inherit;
}

.month-x-label {
  font-weight: 600;
  fill: #334155;
}

.point-tooltip-text {
  font-size: 11px;
  font-weight: 800;
  font-family: inherit;
}

.elem-point-text {
  fill: #1d4ed8;
}

.jhs-point-text {
  fill: #0f766e;
}

.chart-point {
  transition: r 0.15s ease;
  cursor: pointer;
}

.monthly-breakdown-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.month-breakdown-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.65rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.month-breakdown-card.is-hovered {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.mbc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.mbc-month {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
}

.mbc-sessions-badge {
  font-size: 0.68rem;
  font-weight: 600;
  color: #475569;
  background: #e2e8f0;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.mbc-levels-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mbc-level-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
}

.mbc-level-name {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #475569;
}

.mbc-level-val {
  font-weight: 700;
}

.text-blue {
  color: #1d4ed8;
}

.text-teal {
  color: #0f766e;
}

.mbc-no-session {
  font-size: 0.7rem;
  color: #94a3b8;
  font-style: italic;
}

/* Loading & Empty States */
.chart-loading-box {
  padding: 2.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  color: #64748b;
  font-size: 0.85rem;
}

.empty-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.25rem 1.5rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  min-height: 180px;
}

.empty-state-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #eff6ff;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.empty-state-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #334155;
  margin: 0 0 0.25rem 0;
}

.empty-state-desc {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
  max-width: 320px;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .summary-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 960px) {
  .welcome-header-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .quick-actions-box {
    align-items: flex-start;
    width: 100%;
  }
  .quick-actions-buttons {
    width: 100%;
  }
  .quick-act-btn {
    flex: 1;
    justify-content: center;
  }
  .filter-controls-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .filter-controls-grid.two-filters {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .filter-action-item {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  }
  .dashboard-grid-2-balanced {
    grid-template-columns: 1fr;
  }
  .dashboard-col-left {
    height: auto;
    min-height: initial;
  }
  .module-use-preview-card {
    flex: initial;
    height: auto;
    min-height: initial;
  }
  .module-use-table-wrap {
    flex: initial;
    max-height: 440px;
  }
}

@media (max-width: 640px) {
  .filter-controls-grid,
  .filter-controls-grid.two-filters {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
  .filter-action-item .btn-reset-filters {
    width: 100%;
  }
  .summary-cards-grid {
    grid-template-columns: 1fr;
  }
  .welcome-meta-list {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

/* Operational Sections (Announcements, Upcoming Schedule, Learners Needing Attention, Recent Learner Activities, Quick Actions) */
.empty-state-compact {
  padding: 1.75rem 1rem;
}

.operational-card-section {
  display: flex;
  flex-direction: column;
}

.card-header-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.btn-card-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.42rem 0.8rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
  min-height: 34px;
}

.btn-card-primary {
  background: #2563eb;
  color: #ffffff;
  border: 1px solid #2563eb;
}

.btn-card-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.link-view-all {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  padding: 0.38rem 0.65rem;
  border-radius: 8px;
  background: #eff6ff;
  transition: background 0.15s ease, color 0.15s ease;
  min-height: 34px;
}

.link-view-all:hover {
  background: #dbeafe;
  color: #1d4ed8;
}

.operational-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.operational-list-item {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.operational-list-item:hover {
  border-color: #cbd5e1;
  background: #ffffff;
}

.oli-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.oli-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.35;
}

.oli-badges {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.pill-priority {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.pill-source-admin {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.pill-source-own {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.pill-level {
  background: #f0fdfa;
  color: #0f766e;
  border: 1px solid #99f6e4;
}

.oli-desc {
  font-size: 0.81rem;
  color: #475569;
  margin: 0;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.oli-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.15rem;
  flex-wrap: wrap;
}

.oli-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  color: #64748b;
  font-weight: 500;
}

.oli-inline-link {
  font-size: 0.76rem;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
}

.oli-inline-link:hover {
  text-decoration: underline;
}

.schedule-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-top: 0.15rem;
}

/* Learners Needing Attention */
.badge-warning-pill {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-success-pill {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.attention-clear-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.95rem 1.15rem;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.45;
  margin-bottom: 1rem;
}

.attention-clear-only {
  margin-bottom: 0;
}

.attention-clear-icon {
  flex-shrink: 0;
  color: #059669;
}

.attention-clear-text {
  flex: 1;
}

.attention-error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.95rem 1.15rem;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.badge-error-pill {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-neutral-pill {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.attention-categories-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}

@media (max-width: 1024px) {
  .attention-categories-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .attention-categories-grid {
    grid-template-columns: 1fr !important;
  }
}

.attention-category-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 1.15rem 1.2rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  min-height: 190px;
  transition: all 0.2s ease;
}

.attention-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.65rem;
}

.attention-item-heading-group {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.attention-category-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.05rem;
}

.attention-item-heading-wrap {
  flex: 1;
  min-width: 0;
}

.attention-item-label {
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
}

.attention-item-desc {
  font-size: 0.78rem;
  color: #475569;
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

.attention-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.attention-count-badge.count-zero {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

/* Category 1: Low Attendance (Subtle light-red theme) */
.attention-category-card.theme-lowAttendance {
  background: #fef2f2;
  border-color: #fecaca;
}
.attention-category-card.theme-lowAttendance .attention-category-icon-wrap {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.attention-category-card.theme-lowAttendance .attention-item-label {
  color: #991b1b;
}
.attention-category-card.theme-lowAttendance .attention-count-badge.count-alert {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
.attention-category-card.theme-lowAttendance .attention-learner-row {
  border-color: #fecaca;
}
.attention-category-card.theme-lowAttendance .attention-indicator-text {
  color: #b91c1c;
}
.attention-category-card.theme-lowAttendance .btn-attention-action {
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
}
.attention-category-card.theme-lowAttendance .btn-attention-action:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}
.theme-lowAttendance .attention-category-empty {
  background: #ffffff;
  border: 1px dashed #fca5a5;
  color: #991b1b;
}

/* Category 2: Delayed Module Progress (Subtle light-orange theme) */
.attention-category-card.theme-delayedProgress {
  background: #fff7ed;
  border-color: #fed7aa;
}
.attention-category-card.theme-delayedProgress .attention-category-icon-wrap {
  background: #ffedd5;
  color: #ea580c;
  border: 1px solid #fed7aa;
}
.attention-category-card.theme-delayedProgress .attention-item-label {
  color: #9a3412;
}
.attention-category-card.theme-delayedProgress .attention-count-badge.count-alert {
  background: #ffedd5;
  color: #9a3412;
  border: 1px solid #fdba74;
}
.attention-category-card.theme-delayedProgress .attention-learner-row {
  border-color: #fed7aa;
}
.attention-category-card.theme-delayedProgress .attention-indicator-text {
  color: #c2410c;
}
.attention-category-card.theme-delayedProgress .btn-attention-action {
  background: #ea580c;
  border-color: #ea580c;
  color: #ffffff;
}
.attention-category-card.theme-delayedProgress .btn-attention-action:hover {
  background: #c2410c;
  border-color: #c2410c;
}
.theme-delayedProgress .attention-category-empty {
  background: #ffffff;
  border: 1px dashed #fdba74;
  color: #9a3412;
}

/* Category 3: No Recent Learning Activity (Subtle light-blue theme) */
.attention-category-card.theme-noRecentActivity {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.attention-category-card.theme-noRecentActivity .attention-category-icon-wrap {
  background: #dbeafe;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}
.attention-category-card.theme-noRecentActivity .attention-item-label {
  color: #1e40af;
}
.attention-category-card.theme-noRecentActivity .attention-count-badge.count-alert {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}
.attention-category-card.theme-noRecentActivity .attention-learner-row {
  border-color: #bfdbfe;
}
.attention-category-card.theme-noRecentActivity .attention-indicator-text {
  color: #1d4ed8;
}
.attention-category-card.theme-noRecentActivity .btn-attention-action {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}
.attention-category-card.theme-noRecentActivity .btn-attention-action:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}
.theme-noRecentActivity .attention-category-empty {
  background: #ffffff;
  border: 1px dashed #93c5fd;
  color: #1e40af;
}

.attention-category-empty {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-radius: 9px;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.empty-check-icon {
  flex-shrink: 0;
  opacity: 0.85;
}

.attention-learner-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.4rem;
  max-height: 270px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.attention-learner-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding: 0.65rem 0.8rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.attention-learner-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
}

.attention-learner-name-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.attention-learner-name {
  font-size: 0.83rem;
  font-weight: 700;
  color: #0f172a;
}

.attention-learner-sub {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  font-size: 0.74rem;
  color: #475569;
}

.attention-learner-center {
  color: #64748b;
  font-weight: 500;
}

.attention-dot-sep {
  color: #94a3b8;
}

.attention-indicator-text {
  font-weight: 600;
}

.btn-attention-action {
  padding: 0.38rem 0.75rem;
  border-radius: 7px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.btn-attention-action:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.no-session-axis-label {
  font-size: 8.5px;
  font-weight: 600;
  fill: #94a3b8;
}

/* Recent Activities Tabs & Feed */
.recent-activities-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.activity-tabs-bar {
  display: inline-flex;
  align-items: center;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  gap: 0.25rem;
}

.activity-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.activity-tab-btn:hover {
  color: #0f172a;
}

.activity-tab-btn.active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.activity-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
  font-size: 0.7rem;
  font-weight: 700;
}

.activity-tab-btn.active .activity-tab-count {
  background: #dbeafe;
  color: #1d4ed8;
}

.activity-feed-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.activity-feed-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 0.95rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.activity-feed-clickable {
  cursor: pointer;
  transition: all 0.15s ease;
}

.activity-feed-clickable:hover {
  background: #ffffff;
  border-color: #93c5fd;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.06);
}

.activity-icon-dot {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #eff6ff;
  color: #2563eb;
}

.act-type-module_completed {
  background: #ecfdf5;
  color: #059669;
}

.act-type-assessment_submitted,
.act-type-activity_submitted {
  background: #fef3c7;
  color: #d97706;
}

.act-type-attendance_recorded {
  background: #f3e8ff;
  color: #7c3aed;
}

.act-type-progress_updated {
  background: #f0fdfa;
  color: #0d9488;
}

.act-type-teacher {
  background: #eff6ff;
  color: #2563eb;
}

.activity-main-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.activity-learner-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.activity-learner-name {
  font-size: 0.87rem;
  font-weight: 700;
  color: #0f172a;
}

.pill-activity-type {
  background: #e2e8f0;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.pill-activity-status {
  font-weight: 600;
}

.status-pill-success {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.status-pill-warning {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.status-pill-neutral {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.activity-desc-text {
  font-size: 0.8rem;
  color: #475569;
  margin: 0;
}

.activity-right-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  flex-shrink: 0;
}

.activity-datetime-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.activity-open-hint {
  font-size: 0.72rem;
  font-weight: 600;
  color: #2563eb;
}

@media (max-width: 640px) {
  .activity-feed-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .activity-right-col {
    align-items: flex-start;
  }
}

/* Quick Actions Grid (3 Columns on Desktop) */
.quick-actions-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 960px) {
  .quick-actions-grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .quick-actions-grid-3 {
    grid-template-columns: 1fr;
  }
}

.quick-action-card-btn {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.95rem 1.05rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  text-decoration: none;
  transition: all 0.18s ease;
  min-height: 64px;
}

.quick-action-card-btn:hover {
  border-color: #2563eb;
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px -1px rgba(15, 23, 42, 0.05);
}

.qa-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qa-amber {
  background: #fef3c7;
  color: #d97706;
}

.qa-green {
  background: #ecfdf5;
  color: #059669;
}

.qa-blue {
  background: #eff6ff;
  color: #2563eb;
}

.qa-purple {
  background: #f3e8ff;
  color: #7c3aed;
}

.qa-text-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.qa-title {
  font-size: 0.86rem;
  font-weight: 700;
  color: #0f172a;
}

.qa-sub {
  font-size: 0.74rem;
  color: #475569;
}

/* Learner Details Modal */
.dashboard-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  z-index: 1200;
}

.dashboard-modal-card {
  width: 100%;
  max-width: 640px;
  max-height: 86vh;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.35rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.dashboard-modal-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.dashboard-modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.dashboard-modal-meta {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.modal-meta-text {
  font-size: 0.76rem;
  color: #475569;
  font-weight: 500;
}

.dashboard-modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard-modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.dashboard-modal-tabs {
  display: flex;
  gap: 0.35rem;
  padding: 0.65rem 1.35rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.modal-tab-btn {
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.modal-tab-btn:hover {
  background: #f8fafc;
  color: #0f172a;
}

.modal-tab-btn.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.dashboard-modal-body {
  padding: 1.2rem 1.35rem;
  overflow-y: auto;
  flex: 1;
}

.modal-submission-highlight {
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  margin-bottom: 1rem;
}

.modal-submission-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.modal-submission-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.2rem 0;
}

.modal-submission-desc {
  font-size: 0.8rem;
  color: #334155;
  margin: 0 0 0.25rem 0;
}

.modal-submission-date {
  font-size: 0.73rem;
  color: #64748b;
}

.modal-kpi-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.modal-kpi-box {
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.modal-kpi-label {
  font-size: 0.74rem;
  color: #64748b;
  font-weight: 600;
}

.modal-kpi-val {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-section-subtitle {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.6rem 0;
}

.modal-empty-note {
  padding: 0.9rem;
  border-radius: 9px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  font-size: 0.8rem;
  text-align: center;
}

.modal-list-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 9px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.modal-list-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.modal-list-primary {
  font-size: 0.82rem;
  font-weight: 600;
  color: #0f172a;
}

.modal-list-secondary {
  font-size: 0.74rem;
  color: #64748b;
}

.modal-list-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.modal-inline-btn {
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 0.74rem;
  font-weight: 600;
  text-decoration: none;
}

.modal-inline-btn:hover {
  background: #dbeafe;
}

.dashboard-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1.35rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn-modal-secondary {
  padding: 0.5rem 0.95rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-modal-secondary:hover {
  background: #f1f5f9;
}

.btn-modal-primary {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #1d4ed8;
  background: #2563eb;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
}

.btn-modal-primary:hover {
  background: #1d4ed8;
}
</style>

<template>
  <div class="page-container admin-dashboard">
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <span class="breadcrumb-current">Dashboard</span>
    </nav>

    <!-- Welcome Header & Refresh Action -->
    <div class="welcome-header-card">
      <div class="welcome-info-col">
        <h1 class="welcome-title">Welcome back, Admin</h1>
        <p class="welcome-subtitle">
          Here is a district-wide overview of ALS learning centers, teachers, learners, attendance, and module progress in Naawan.
        </p>
      </div>

      <!-- Header Refresh Action -->
      <div class="quick-actions-box">
        <div class="quick-actions-buttons">
          <button
            type="button"
            class="quick-act-btn quick-act-secondary refresh-btn"
            :class="{ 'is-loading': loading }"
            :disabled="loading"
            @click="handleManualRefresh"
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
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{{ loading ? 'Updating...' : 'Refresh Data' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- DASHBOARD FILTERS BAR -->
    <section class="dashboard-filter-card" aria-label="Dashboard Filters">
      <div class="filter-bar-inner">
        <div class="filter-title-group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="filter-icon">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span class="filter-bar-label">Dashboard Filters</span>
        </div>

        <div class="filter-controls-grid">
          <!-- Filter 1: School Year -->
          <div class="filter-control-item">
            <label for="filter-school-year" class="filter-item-label">School Year</label>
            <select
              id="filter-school-year"
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
            <label for="filter-als-level" class="filter-item-label">ALS Level</label>
            <select
              id="filter-als-level"
              v-model="filters.level"
              class="filter-select-input"
              @change="handleFilterChange"
            >
              <option value="">All ALS Levels</option>
              <option value="A&E Elementary">A&amp;E Elementary</option>
              <option value="A&E Junior High">A&amp;E Junior High</option>
            </select>
          </div>

          <!-- Filter 3: Community Learning Center -->
          <div class="filter-control-item">
            <label for="filter-clc" class="filter-item-label">Community Learning Center</label>
            <select
              id="filter-clc"
              v-model="filters.learningCenterId"
              class="filter-select-input"
              @change="handleFilterChange"
            >
              <option value="">All Learning Centers</option>
              <option
                v-for="center in filterOptions.learningCenters"
                :key="center.id"
                :value="String(center.id)"
              >
                {{ center.name }}
              </option>
            </select>
          </div>

          <!-- Clear Filters Button -->
          <div class="filter-action-item">
            <ClearFiltersButton
              :disabled="!hasActiveFilters || loading"
              aria-label="Clear all filters"
              @click="resetFilters"
            />
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
      <button type="button" class="btn-retry" @click="handleManualRefresh">
        Retry
      </button>
    </div>

    <!-- SECTION 1: DASHBOARD SUMMARY CARDS (4 cards in balanced grid) -->
    <section class="dashboard-section" aria-label="District Summary Metrics">
      <div class="summary-cards-grid">
        <!-- Card 1: Total Learning Centers -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-title">Total Learning Centers</span>
            <div class="stat-icon-wrap icon-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
                <path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" />
                <path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
              </svg>
            </div>
          </div>
          <div class="stat-card-body">
            <span v-if="loading && !hasLoadedOnce" class="stat-value-loading">...</span>
            <span v-else class="stat-value">{{ summary.totalLearningCenters }}</span>
            <span class="stat-hint">Community Learning Centers</span>
          </div>
        </div>

        <!-- Card 2: Total ALS Teachers -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-title">Total ALS Teachers</span>
            <div class="stat-icon-wrap icon-emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
          <div class="stat-card-body">
            <span v-if="loading && !hasLoadedOnce" class="stat-value-loading">...</span>
            <span v-else class="stat-value">{{ summary.totalTeachers }}</span>
            <span class="stat-hint">Registered ALS Teachers</span>
          </div>
        </div>

        <!-- Card 3: Total Learners -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-title">Total Learners</span>
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
              {{ learnerDistribution.elementary }} Elementary &bull; {{ learnerDistribution.juniorHigh }} Junior High
            </span>
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
                  ? `Based on ${summary.totalAttendanceRecords} recorded attendance logs`
                  : 'No attendance records logged yet'
              }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: LEARNING CENTERS NEEDING ATTENTION -->
    <section class="dashboard-section" aria-label="Learning Centers Needing Attention">
      <div class="chart-card">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Learning Centers Needing Attention</h2>
            <p class="chart-card-subtitle">
              Monitor Learning Centers that may need additional support.
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
                      ? 'Learning Center Needs'
                      : 'Learning Centers Need'
                  } Attention`
                : 'All Clear'
            }}
          </span>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Checking learning centers needing attention...</span>
        </div>

        <div v-else-if="errorMessage && !hasLoadedOnce" class="attention-error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Unable to load monitoring alerts. Please retry.</span>
        </div>

        <template v-else>
          <!-- When all alerts are zero: green All Clear banner above the 3 cards -->
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
              All Clear — No Learning Centers currently need attention across attendance, module progress, or recent learning activity.
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
                  {{ formatCenterCategoryCount(item.count) }}
                </span>
              </div>

              <!-- When category has affected centers: list them with action buttons -->
              <div v-if="item.centers && item.centers.length > 0" class="attention-learner-list">
                <div
                  v-for="clc in item.centers"
                  :key="`${item.key}_${clc.id}`"
                  class="attention-learner-row"
                >
                  <div class="attention-learner-info">
                    <div class="attention-learner-name-line">
                      <span class="attention-learner-name">{{ clc.name }}</span>
                    </div>
                    <div class="attention-learner-sub">
                      <span v-if="item.key === 'lowAttendance'" class="attention-indicator-text">
                        Attendance Rate: {{ clc.attendanceRate }}%
                      </span>
                      <span v-else-if="item.key === 'delayedProgress'" class="attention-indicator-text">
                        {{ clc.overdueModulesCount }} Overdue/Delayed
                      </span>
                      <span v-else class="attention-indicator-text">
                        Last Activity: {{ clc.lastActivityDate || 'No recorded activity' }}
                      </span>
                      <span class="attention-dot-sep">&bull;</span>
                      <span class="attention-learner-center">
                        {{ clc.affectedLearnersCount }} {{ clc.affectedLearnersCount === 1 ? 'Learner' : 'Learners' }}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn-attention-action"
                    @click="openCenterMonitoringModal(clc.id, item.actionType)"
                  >
                    {{ item.actionLabel }}
                  </button>
                </div>
              </div>

              <!-- When category has zero affected centers: empty-state message -->
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
                <span>{{ item.emptyMessage }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- SECTION 3: TWO-COLUMN BALANCED LAYOUT: LEFT (MODULE USE TABLE) | RIGHT (SCHEDULE & ANNOUNCEMENTS) -->
    <div class="dashboard-grid-2-balanced dashboard-two-col-layout">
      <!-- LEFT COLUMN -->
      <div class="dashboard-column dashboard-col-left">
        <!-- MODULE USE AND LEARNER'S PROGRESS PREVIEW -->
        <section class="chart-card module-use-preview-card" aria-label="Module Use and Learner's Progress">
          <div class="card-box-header-wrap">
            <div>
              <h2 class="chart-card-title">Module Use and Learner's Progress</h2>
              <p class="chart-card-subtitle">
                Overview of district learners' module progress and recorded assessments.
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
            <p class="empty-state-text">Module use and progress records for district learners will appear here.</p>
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
                Next three upcoming learning sessions or activities across the district
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
            <p class="empty-state-text">Upcoming ALS learning sessions, assessments, and district events will be listed here.</p>
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
                Latest three official announcements and published notices
              </p>
            </div>
            <div class="card-header-actions">
              <router-link
                to="/dashboard/announcements?action=create"
                class="btn-card-action btn-card-primary"
                title="Create a new district announcement"
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

          <div v-else-if="latestAnnouncements.length === 0" class="empty-state-box empty-state-compact">
            <div class="empty-state-graphic">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h3 class="empty-state-title">No announcements available.</h3>
            <p class="empty-state-text">Official announcements published by the ALS District Coordinator will appear here.</p>
          </div>

          <div v-else class="operational-list">
            <article
              v-for="ann in latestAnnouncements"
              :key="ann.id"
              class="operational-list-item"
            >
              <div class="oli-top-row">
                <h3 class="oli-title">{{ ann.title }}</h3>
                <div class="oli-badges">
                  <span v-if="ann.isPinned" class="meta-pill pill-priority">
                    Pinned
                  </span>
                  <span class="meta-pill pill-source-admin">
                    {{ ann.recipients || ann.audience || 'All Centers' }}
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
                  Published {{ ann.datePosted || ann.publicationDate }}
                </span>
                <button
                  type="button"
                  class="btn-read-details-inline"
                  @click="openAnnouncementDetails(ann)"
                >
                  Read details &rarr;
                </button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <!-- SECTION 4: SEX DISTRIBUTION (LEFT) & MONTHLY ATTENDANCE TREND (RIGHT) SIDE BY SIDE -->
    <div class="dashboard-grid-2-balanced">
      <!-- LEFT: SEX DISTRIBUTION BY ALS LEVEL -->
      <section class="chart-card chart-card-section" aria-label="Sex Distribution by ALS Level">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Sex Distribution by ALS Level</h2>
            <p class="chart-card-subtitle">Male and Female distribution across ALS levels in Naawan District</p>
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
          <p class="empty-state-desc">Male and Female counts will appear when learners are registered in the district.</p>
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

            <!-- Grouped Bars per ALS Level -->
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
            <div class="kpi-tag">
              <span class="legend-line-swatch" style="background-color: #2563eb;"></span>
              <span>
                A&amp;E Elementary:
                <strong>{{ attendanceTrend.elementaryHasRecords ? `${attendanceTrend.elementaryRate}%` : 'No sessions' }}</strong>
              </span>
            </div>
            <div class="kpi-tag">
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
            Attendance sessions recorded across learning centers will populate the monthly attendance trend chart.
          </p>
        </div>

        <!-- Monthly Attendance Line Chart (Discontinuous across months without sessions) -->
        <div v-else class="line-chart-wrapper">
          <div class="line-chart-hover-banner" aria-live="polite">
            <template v-if="hoveredMonthPoint">
              <span class="hover-month-name">{{ hoveredMonthPoint.label }}</span>
              <span class="hover-level-item">
                <span class="legend-swatch" style="background-color: #2563eb;"></span>
                A&amp;E Elementary:
                <strong v-if="hoveredMonthPoint.elementary.hasRecords">
                  {{ hoveredMonthPoint.elementary.attendancePercentage }}%
                  ({{ hoveredMonthPoint.elementary.sessionsCount }} {{ hoveredMonthPoint.elementary.sessionsCount === 1 ? 'session' : 'sessions' }})
                </strong>
                <span v-else class="text-muted">No sessions</span>
              </span>
              <span class="hover-level-item">
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

              <!-- Discontinuous Line Segments for A&E Elementary -->
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

              <!-- Discontinuous Line Segments for A&E Junior High -->
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

              <!-- Month Columns & Interactive Data Points -->
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

                <!-- Elementary Point -->
                <circle
                  v-if="pt.elementary.hasRecords && pt.elemY !== null"
                  :cx="pt.x"
                  :cy="pt.elemY"
                  :r="hoveredMonthIndex === idx ? 6 : 4.5"
                  fill="#2563eb"
                  stroke="#ffffff"
                  stroke-width="2"
                  class="chart-point"
                >
                  <title>{{ pt.label }} — A&amp;E Elementary: {{ pt.elementary.attendancePercentage }}%</title>
                </circle>

                <text
                  v-if="pt.elementary.hasRecords && pt.elemLabelY !== null"
                  :x="pt.x"
                  :y="pt.elemLabelY"
                  class="point-tooltip-text elem-point-text"
                  text-anchor="middle"
                >
                  {{ pt.elementary.attendancePercentage }}%
                </text>

                <!-- Junior High Point -->
                <circle
                  v-if="pt.juniorHigh.hasRecords && pt.jhsY !== null"
                  :cx="pt.x"
                  :cy="pt.jhsY"
                  :r="hoveredMonthIndex === idx ? 6 : 4.5"
                  fill="#0d9488"
                  stroke="#ffffff"
                  stroke-width="2"
                  class="chart-point"
                >
                  <title>{{ pt.label }} — A&amp;E Junior High: {{ pt.juniorHigh.attendancePercentage }}%</title>
                </circle>

                <text
                  v-if="pt.juniorHigh.hasRecords && pt.jhsLabelY !== null"
                  :x="pt.x"
                  :y="pt.jhsLabelY"
                  class="point-tooltip-text jhs-point-text"
                  text-anchor="middle"
                >
                  {{ pt.juniorHigh.attendancePercentage }}%
                </text>

                <!-- No Sessions text -->
                <text
                  v-if="!pt.elementary.hasRecords && !pt.juniorHigh.hasRecords"
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
                <div class="mbc-level-row">
                  <span class="mbc-level-name">
                    <span class="legend-swatch-sm" style="background-color: #2563eb;"></span>
                    A&amp;E Elementary
                  </span>
                  <strong v-if="m.elementary?.hasRecords && m.elementary.attendancePercentage !== null" class="mbc-level-val text-blue">
                    {{ m.elementary.attendancePercentage }}%
                  </strong>
                  <span v-else class="mbc-no-session">No sessions</span>
                </div>
                <div class="mbc-level-row">
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

    <!-- SECTION 5: RECENT ACTIVITIES (LEARNER ACTIVITIES & TEACHER & ADMIN ACTIVITIES TABS) -->
    <section class="dashboard-section" aria-label="Recent Activities">
      <div class="chart-card">
        <div class="card-box-header-wrap recent-activities-header">
          <div>
            <h2 class="chart-card-title">Recent Activities</h2>
            <p class="chart-card-subtitle">
              {{
                activeActivityTab === 'learners'
                  ? 'Five most recent recorded activities from learners across the district'
                  : 'Five most recent actions performed by ALS Teachers and District Administrators'
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
              :aria-selected="activeActivityTab === 'staff'"
              class="activity-tab-btn"
              :class="{ 'is-active': activeActivityTab === 'staff' }"
              @click="activeActivityTab = 'staff'"
            >
              <span>Teacher &amp; Admin Activities</span>
              <span class="activity-tab-count">{{ recentStaffActivities.length }}</span>
            </button>
          </div>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading recent activities...</span>
        </div>

        <!-- TAB 1: LEARNER ACTIVITIES -->
        <div v-else-if="activeActivityTab === 'learners'" role="tabpanel">
          <div v-if="recentLearnerActivities.length === 0" class="empty-state-box empty-state-compact">
            <div class="empty-state-graphic">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 class="empty-state-title">No recent learner activities</h3>
            <p class="empty-state-text">
              Assessment submissions, module completions, and activity submissions from district learners will appear here.
            </p>
          </div>

          <div v-else class="activity-feed-list">
            <div
              v-for="act in recentLearnerActivities"
              :key="act.id"
              class="activity-feed-row"
            >
              <div class="activity-icon-dot" :class="`act-type-${act.type || 'default'}`">
                <svg v-if="act.type === 'module_completion' || act.type === 'module_completed'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <svg v-else-if="act.type === 'submission' || act.type === 'assessment'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                  <span class="activity-learner-name">{{ act.userName || 'ALS Learner' }}</span>
                  <span v-if="act.alsLevel" class="meta-pill pill-level">{{ act.alsLevel }}</span>
                  <span v-if="act.learningCenter" class="meta-pill pill-source-admin">{{ act.learningCenter }}</span>
                </div>
                <p class="activity-desc-text">{{ act.description || act.title }}</p>
              </div>

              <div class="activity-right-col">
                <span class="activity-datetime-text">{{ act.dateTime }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: TEACHER & ADMIN ACTIVITIES -->
        <div v-else role="tabpanel">
          <div v-if="recentStaffActivities.length === 0" class="empty-state-box empty-state-compact">
            <div class="empty-state-graphic">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 class="empty-state-title">No recorded staff activities yet</h3>
            <p class="empty-state-text">
              Recent instructional and administrative actions—such as publishing announcements, recording attendance, updating records, or managing schedules—will appear here.
            </p>
          </div>

          <div v-else class="activity-feed-list">
            <div
              v-for="tAct in recentStaffActivities"
              :key="tAct.id"
              class="activity-feed-row"
            >
              <div class="activity-icon-dot act-type-teacher">
                <svg v-if="tAct.type === 'module' || tAct.type === 'MODULE_UPLOADED'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <svg v-else-if="tAct.type === 'attendance' || tAct.type === 'ATTENDANCE_RECORDED'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <svg v-else-if="tAct.type === 'announcement' || tAct.type === 'ANNOUNCEMENT_CREATED'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <svg v-else-if="tAct.type === 'schedule' || tAct.type === 'SCHEDULE_CREATED'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                  <span class="activity-learner-name">{{ tAct.userName }}</span>
                  <span class="meta-pill" :class="getRoleBadgeClass(tAct.userRole)">
                    {{ tAct.userRole || 'Staff' }}
                  </span>
                  <span v-if="tAct.learningCenter" class="meta-pill pill-source-admin">{{ tAct.learningCenter }}</span>
                </div>
                <p class="activity-desc-text">{{ tAct.description }}</p>
              </div>

              <span class="activity-datetime-text">{{ tAct.dateTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 6: QUICK ACTIONS (3-COLUMN DESKTOP GRID) -->
    <section class="dashboard-section" aria-label="Quick Actions">
      <div class="chart-card">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Quick Actions</h2>
            <p class="chart-card-subtitle">
              Direct shortcuts to register learners, add teachers, add learning centers, and administrative workflows
            </p>
          </div>
        </div>

        <div class="quick-actions-grid-3">
          <!-- 1. Register Learner -->
          <router-link to="/dashboard/learners?action=create" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Register Learner</span>
              <span class="qa-sub">Add a new ALS Learner</span>
            </div>
          </router-link>

          <!-- 2. Add Teacher -->
          <router-link to="/dashboard/teachers?action=create" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Add Teacher</span>
              <span class="qa-sub">Register and assign ALS teacher</span>
            </div>
          </router-link>

          <!-- 3. Add Learning Center -->
          <router-link to="/dashboard/learning-centers?action=create" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Add Learning Center</span>
              <span class="qa-sub">Create a new CLC in Naawan</span>
            </div>
          </router-link>

          <!-- 4. Create Announcement -->
          <router-link to="/dashboard/announcements?action=create" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Create Announcement</span>
              <span class="qa-sub">Post a district-wide announcement</span>
            </div>
          </router-link>

          <!-- 5. Create Schedule -->
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

          <!-- 6. View Reports -->
          <router-link to="/dashboard/reports" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">View Reports</span>
              <span class="qa-sub">Generate district ALS reports</span>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- MODAL 1: ANNOUNCEMENT DETAILS -->
    <div
      v-if="selectedAnnouncement"
      class="dashboard-modal-backdrop"
      @click.self="selectedAnnouncement = null"
    >
      <div class="dashboard-modal-card" role="dialog" aria-modal="true">
        <div class="dashboard-modal-header">
          <div class="dashboard-modal-title-wrap">
            <span class="meta-pill pill-priority">Official Announcement</span>
            <h3 class="dashboard-modal-title">{{ selectedAnnouncement.title }}</h3>
            <div class="dashboard-modal-meta">
              <span class="modal-meta-text">Published: {{ selectedAnnouncement.datePosted || selectedAnnouncement.publicationDate }}</span>
              <span class="modal-meta-text">&bull; Audience: {{ selectedAnnouncement.recipients || selectedAnnouncement.audience || 'All' }}</span>
              <span class="modal-meta-text">&bull; Author: {{ selectedAnnouncement.author || 'ALS District Coordinator' }}</span>
            </div>
          </div>
          <button
            type="button"
            class="dashboard-modal-close"
            @click="selectedAnnouncement = null"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div class="dashboard-modal-body">
          <p class="modal-announcement-content">
            {{ selectedAnnouncement.content || selectedAnnouncement.description }}
          </p>
        </div>
        <div class="dashboard-modal-footer">
          <button type="button" class="btn btn-outline" @click="selectedAnnouncement = null">
            Close
          </button>
          <router-link to="/dashboard/announcements" class="btn btn-primary" @click="selectedAnnouncement = null">
            Manage Announcements
          </router-link>
        </div>
      </div>
    </div>

    <!-- MODAL 2: LEARNING CENTER MONITORING DETAILS MODAL -->
    <div
      v-if="selectedMonitoringCenter"
      class="dashboard-modal-backdrop"
      @click.self="closeCenterMonitoringModal"
    >
      <div class="dashboard-modal-card modal-lg" role="dialog" aria-modal="true">
        <div class="dashboard-modal-header">
          <div class="dashboard-modal-title-wrap">
            <span class="meta-pill pill-source-admin">Learning Center Monitoring Details</span>
            <h3 class="dashboard-modal-title">{{ selectedMonitoringCenter.name }}</h3>
            <div class="dashboard-modal-meta">
              <span class="modal-meta-text">{{ selectedMonitoringCenter.address || 'Naawan District' }}</span>
              <span class="modal-meta-text">&bull; Assigned ALS Teacher: <strong>{{ selectedMonitoringCenter.assignedTeachers || 'Unassigned' }}</strong></span>
            </div>
          </div>
          <button
            type="button"
            class="dashboard-modal-close"
            @click="closeCenterMonitoringModal"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <!-- Modal Category Tabs -->
        <div class="modal-tabs-bar">
          <button
            type="button"
            class="modal-tab-btn"
            :class="{ active: monitoringModalTab === 'attendance' }"
            @click="monitoringModalTab = 'attendance'"
          >
            Attendance Overview
          </button>
          <button
            type="button"
            class="modal-tab-btn"
            :class="{ active: monitoringModalTab === 'modules' }"
            @click="monitoringModalTab = 'modules'"
          >
            Delayed Module Progress
          </button>
          <button
            type="button"
            class="modal-tab-btn"
            :class="{ active: monitoringModalTab === 'details' }"
            @click="monitoringModalTab = 'details'"
          >
            Center &amp; Activity Details
          </button>
        </div>

        <div class="dashboard-modal-body">
          <!-- TAB 1: ATTENDANCE OVERVIEW -->
          <div v-if="monitoringModalTab === 'attendance'">
            <div class="modal-kpi-grid">
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Attendance Status</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.attendanceStatus }}</strong>
              </div>
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Center Attendance Rate</span>
                <strong class="modal-kpi-val">
                  {{ selectedMonitoringCenter.hasSufficientAttendanceData ? `${selectedMonitoringCenter.attendanceRate}%` : 'Insufficient Data' }}
                </strong>
              </div>
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Recorded Sessions</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.totalSessions || 0 }}</strong>
              </div>
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Enrolled Learners</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.totalLearnersCount || 0 }}</strong>
              </div>
            </div>

            <h4 class="modal-section-heading">Learner Attendance Breakdown</h4>
            <div v-if="(selectedMonitoringCenter.allLearnerAttendance || []).length === 0" class="modal-empty-note">
              No learners enrolled in this Learning Center for the selected filters.
            </div>
            <div v-else class="modal-table-wrap">
              <table class="modal-data-table">
                <thead>
                  <tr>
                    <th>Learner Name</th>
                    <th>ALS Level</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Total Sessions</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="l in selectedMonitoringCenter.allLearnerAttendance" :key="l.id">
                    <td><strong>{{ l.fullName }}</strong></td>
                    <td>{{ l.level }}</td>
                    <td>{{ l.presentCount }}</td>
                    <td>{{ l.absentCount }}</td>
                    <td>{{ l.totalSessions }}</td>
                    <td>
                      <span
                        v-if="l.hasRecords"
                        class="status-tag"
                        :class="l.attendanceRate < 75 ? 'tag-overdue' : 'tag-completed'"
                      >
                        {{ l.attendanceRate }}%
                      </span>
                      <span v-else class="status-tag tag-notstarted">Insufficient Data</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 2: DELAYED MODULE PROGRESS -->
          <div v-else-if="monitoringModalTab === 'modules'">
            <div class="modal-kpi-grid">
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Affected Learners</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.delayedLearnersCount || 0 }}</strong>
              </div>
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Overdue / Delayed Modules</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.overdueModulesCount || 0 }}</strong>
              </div>
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Overdue Modules</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.strictOverdueCount || 0 }}</strong>
              </div>
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Not Mastered Modules</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.notMasteredCount || 0 }}</strong>
              </div>
            </div>

            <h4 class="modal-section-heading">Learners with Overdue or Delayed Module Progress</h4>
            <div v-if="(selectedMonitoringCenter.delayedLearners || []).length === 0" class="modal-empty-note">
              No learners in this Learning Center currently have overdue or unmastered modules.
            </div>
            <div v-else class="modal-table-wrap">
              <table class="modal-data-table">
                <thead>
                  <tr>
                    <th>Learner Name</th>
                    <th>ALS Level</th>
                    <th>Overdue</th>
                    <th>Not Mastered</th>
                    <th>Delayed Modules</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="l in selectedMonitoringCenter.delayedLearners" :key="l.id">
                    <td><strong>{{ l.fullName }}</strong></td>
                    <td>{{ l.level }}</td>
                    <td>{{ l.overdueCount }}</td>
                    <td>{{ l.notMasteredCount }}</td>
                    <td>
                      <div class="delayed-mod-tags">
                        <span
                          v-for="(dm, idx) in l.delayedModules"
                          :key="idx"
                          class="status-tag"
                          :class="dm.status === 'Overdue' ? 'tag-overdue' : 'tag-inprogress'"
                        >
                          {{ dm.title }} ({{ dm.status }})
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 3: CENTER & ACTIVITY DETAILS -->
          <div v-else>
            <div class="modal-kpi-grid">
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Center Status</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.status || 'Active' }}</strong>
              </div>
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Last Recorded Activity</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.lastActivityDate || 'No recorded activity' }}</strong>
              </div>
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Assigned ALS Teacher</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.assignedTeachers || 'Unassigned' }}</strong>
              </div>
              <div class="modal-kpi-card">
                <span class="modal-kpi-label">Affected / Enrolled Learners</span>
                <strong class="modal-kpi-val">{{ selectedMonitoringCenter.totalLearnersCount || 0 }}</strong>
              </div>
            </div>

            <h4 class="modal-section-heading">Recent Learning Activity History</h4>
            <div v-if="(selectedMonitoringCenter.recentEvents || []).length === 0" class="modal-empty-note">
              No recorded learning activities found for this Learning Center.
            </div>
            <div v-else class="modal-table-wrap">
              <table class="modal-data-table">
                <thead>
                  <tr>
                    <th>Activity Type</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(ev, idx) in selectedMonitoringCenter.recentEvents" :key="idx">
                    <td><strong>{{ ev.type }}</strong></td>
                    <td>{{ ev.description }}</td>
                    <td>{{ ev.date }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="dashboard-modal-footer">
          <button type="button" class="btn btn-outline" @click="closeCenterMonitoringModal">
            Close
          </button>
          <router-link
            v-if="monitoringModalTab === 'attendance'"
            :to="{ path: '/dashboard/reports/attendance-summary', query: { center: selectedMonitoringCenter.name } }"
            class="btn btn-primary"
            @click="closeCenterMonitoringModal"
          >
            Open Filtered Attendance Report &rarr;
          </router-link>
          <router-link
            v-else-if="monitoringModalTab === 'modules'"
            :to="{ path: '/dashboard/reports/module-progress', query: { center: selectedMonitoringCenter.name } }"
            class="btn btn-primary"
            @click="closeCenterMonitoringModal"
          >
            Open Filtered Module Progress Report &rarr;
          </router-link>
          <router-link
            v-else
            :to="{ path: '/dashboard/learning-centers', query: { search: selectedMonitoringCenter.name } }"
            class="btn btn-primary"
            @click="closeCenterMonitoringModal"
          >
            Open Learning Center Directory &rarr;
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ClearFiltersButton from '../components/ClearFiltersButton.vue';
import { getAdminDashboardData } from '../api/dashboard.js';
import { getModuleProgressReport } from '../api/reports.js';

const router = useRouter();

const loading = ref(true);
const hasLoadedOnce = ref(false);
const errorMessage = ref('');
const hoveredMonthIndex = ref(null);
const selectedAnnouncement = ref(null);
const selectedMonitoringCenter = ref(null);
const monitoringModalTab = ref('attendance');

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
});

const hasActiveFilters = computed(() => {
  return Boolean(filters.schoolYear || filters.level || filters.learningCenterId);
});

// Row 3: Overview Cards
const summary = ref({
  totalLearningCenters: 0,
  totalTeachers: 0,
  totalLearners: 0,
  averageAttendanceRate: 0,
  totalAttendanceRecords: 0,
});

// Row 4: Announcements & Schedule
const latestAnnouncements = ref([]);
const upcomingSchedules = ref([]);

// Learner Distribution (used in Total Learners card subtitle)
const learnerDistribution = ref({
  total: 0,
  elementary: 0,
  junior: 0,
  juniorHigh: 0,
  elementaryPct: 0,
  juniorPct: 0,
  juniorHighPct: 0,
});

// Row 5 (Left): Sex Distribution by ALS Level
const sexDistributionByLevel = ref({
  totalLearners: 0,
  totalMale: 0,
  totalFemale: 0,
  elementary: { label: 'A&E Elementary', male: 0, female: 0, total: 0 },
  juniorHigh: { label: 'A&E Junior High', male: 0, female: 0, total: 0 },
});

// Row 5 (Right): Monthly Attendance Trend
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

// Learning Centers Needing Attention
const learningCentersNeedingAttention = ref({
  hasIssues: false,
  totalIssues: 0,
  lowAttendanceCount: 0,
  delayedProgressCount: 0,
  noRecentActivityCount: 0,
  lowAttendanceCenters: [],
  delayedProgressCenters: [],
  noRecentActivityCenters: [],
  centersDetails: [],
});

const uniqueAttentionCount = computed(() => {
  const centerIdSet = new Set();
  const att = learningCentersNeedingAttention.value || {};
  (att.lowAttendanceCenters || []).forEach((c) => c?.id && centerIdSet.add(c.id));
  (att.delayedProgressCenters || []).forEach((c) => c?.id && centerIdSet.add(c.id));
  (att.noRecentActivityCenters || []).forEach((c) => c?.id && centerIdSet.add(c.id));
  return centerIdSet.size;
});

const attentionCategories = computed(() => {
  const att = learningCentersNeedingAttention.value || {};
  const lowCenters = Array.isArray(att.lowAttendanceCenters) ? att.lowAttendanceCenters : [];
  const delayedCenters = Array.isArray(att.delayedProgressCenters) ? att.delayedProgressCenters : [];
  const inactiveCenters = Array.isArray(att.noRecentActivityCenters) ? att.noRecentActivityCenters : [];

  return [
    {
      key: 'lowAttendance',
      label: 'Low Attendance',
      description: 'Attendance rate below 75% (with sufficient data).',
      actionType: 'attendance',
      actionLabel: 'View Attendance',
      centers: lowCenters,
      count: lowCenters.length,
      emptyMessage: 'No Learning Centers with low attendance.',
    },
    {
      key: 'delayedProgress',
      label: 'Delayed Module Progress',
      description: 'Learners with overdue modules or delayed progress.',
      actionType: 'modules',
      actionLabel: 'View Module Progress',
      centers: delayedCenters,
      count: delayedCenters.length,
      emptyMessage: 'No Learning Centers with delayed module progress.',
    },
    {
      key: 'noRecentActivity',
      label: 'No Recent Learning Activity',
      description: 'No recorded learning activity in the last 30 days.',
      actionType: 'details',
      actionLabel: 'View Details',
      centers: inactiveCenters,
      count: inactiveCenters.length,
      emptyMessage: 'No Learning Centers with inactive learning activity.',
    },
  ];
});

function formatCenterCategoryCount(count) {
  const n = Number(count) || 0;
  if (n === 1) return '1 Center';
  return `${n} Centers`;
}

// Recent Activities Tabs (Learner Activities vs Teacher & Admin Activities)
const recentLearnerActivities = ref([]);
const recentStaffActivities = ref([]);
const activeActivityTab = ref('learners');

function openAnnouncementDetails(item) {
  selectedAnnouncement.value = item;
}

function openCenterMonitoringModal(centerId, defaultTab = 'attendance') {
  const detailsList = learningCentersNeedingAttention.value.centersDetails || [];
  const found = detailsList.find((c) => Number(c.id) === Number(centerId));
  if (found) {
    selectedMonitoringCenter.value = found;
    monitoringModalTab.value = defaultTab;
  }
}

function closeCenterMonitoringModal() {
  selectedMonitoringCenter.value = null;
}

function getRoleBadgeClass(role) {
  const norm = String(role || '').toUpperCase();
  if (norm.includes('ADMIN')) return 'pill-priority';
  if (norm.includes('LEARNER')) return 'pill-level';
  return 'pill-source-admin';
}

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
  if (filters.learningCenterId) {
    query.learningCenterId = filters.learningCenterId;
  }
  return {
    path: '/dashboard/reports/module-progress',
    query,
  };
});

async function fetchModuleProgressPreview() {
  loadingModuleProgress.value = true;
  try {
    const reportParams = {};
    if (filters.level) reportParams.programLevel = filters.level;
    if (filters.learningCenterId) {
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

async function fetchDashboardData() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const data = await getAdminDashboardData({
      schoolYear: filters.schoolYear,
      level: filters.level,
      learningCenterId: filters.learningCenterId,
    });

    if (data) {
      if (data.filterOptions) {
        filterOptions.value = {
          schoolYears: Array.isArray(data.filterOptions.schoolYears) ? data.filterOptions.schoolYears : [],
          levels: ['A&E Elementary', 'A&E Junior High'],
          learningCenters: Array.isArray(data.filterOptions.learningCenters) ? data.filterOptions.learningCenters : [],
        };
      }
      if (data.summary) summary.value = data.summary;
      if (Array.isArray(data.latestAnnouncements)) {
        latestAnnouncements.value = data.latestAnnouncements.slice(0, 3);
      } else if (Array.isArray(data.announcements)) {
        latestAnnouncements.value = data.announcements.slice(0, 3);
      }
      if (Array.isArray(data.upcomingSchedules)) {
        upcomingSchedules.value = data.upcomingSchedules.slice(0, 3);
      }
      if (data.learnerDistribution) {
        learnerDistribution.value = {
          ...data.learnerDistribution,
          juniorHigh: data.learnerDistribution.juniorHigh ?? data.learnerDistribution.junior ?? 0,
          juniorHighPct: data.learnerDistribution.juniorHighPct ?? data.learnerDistribution.juniorPct ?? 0,
        };
      }
      if (data.sexDistributionByLevel) sexDistributionByLevel.value = data.sexDistributionByLevel;
      if (data.attendanceTrend) attendanceTrend.value = data.attendanceTrend;
      if (data.learningCentersNeedingAttention) {
        learningCentersNeedingAttention.value = data.learningCentersNeedingAttention;
      } else if (data.needsAttention) {
        learningCentersNeedingAttention.value = {
          hasIssues: Boolean(data.needsAttention.hasIssues),
          totalIssues: Number(data.needsAttention.totalIssues || 0),
          lowAttendanceCount: Number(data.needsAttention.lowAttendanceCount || 0),
          delayedProgressCount: Number(data.needsAttention.delayedProgressCount || 0),
          noRecentActivityCount: Number(data.needsAttention.noRecentActivityCount || data.needsAttention.inactiveCentersCount || 0),
          lowAttendanceCenters: Array.isArray(data.needsAttention.lowAttendanceCenters) ? data.needsAttention.lowAttendanceCenters : [],
          delayedProgressCenters: Array.isArray(data.needsAttention.delayedProgressCenters) ? data.needsAttention.delayedProgressCenters : [],
          noRecentActivityCenters: Array.isArray(data.needsAttention.noRecentActivityCenters) ? data.needsAttention.noRecentActivityCenters : [],
          centersDetails: Array.isArray(data.needsAttention.centersDetails) ? data.needsAttention.centersDetails : [],
        };
      }

      // Recent activities categorized
      if (Array.isArray(data.recentLearnerActivities)) {
        recentLearnerActivities.value = data.recentLearnerActivities.slice(0, 5);
      } else if (Array.isArray(data.recentActivities)) {
        recentLearnerActivities.value = data.recentActivities
          .filter((a) => String(a.userRole || '').toUpperCase().includes('LEARNER'))
          .slice(0, 5);
      }

      if (Array.isArray(data.recentStaffActivities)) {
        recentStaffActivities.value = data.recentStaffActivities.slice(0, 5);
      } else if (Array.isArray(data.recentTeacherActivities)) {
        recentStaffActivities.value = data.recentTeacherActivities.slice(0, 5);
      } else if (Array.isArray(data.recentActivities)) {
        recentStaffActivities.value = data.recentActivities
          .filter((a) => !String(a.userRole || '').toUpperCase().includes('LEARNER'))
          .slice(0, 5);
      }

      hasLoadedOnce.value = true;
    }
  } catch (err) {
    console.error('Failed to load admin dashboard data from API:', err);
    errorMessage.value = 'Unable to load the latest dashboard records. Please check your connection and try again.';
  } finally {
    loading.value = false;
  }
}

function handleFilterChange() {
  hoveredMonthIndex.value = null;
  fetchDashboardData();
  fetchModuleProgressPreview();
}

function resetFilters() {
  filters.schoolYear = '';
  filters.level = '';
  filters.learningCenterId = '';
  hoveredMonthIndex.value = null;
  fetchDashboardData();
  fetchModuleProgressPreview();
}

function handleManualRefresh() {
  fetchDashboardData();
  fetchModuleProgressPreview();
}

// Helper to compute clean integer Y-axis ticks for vertical bar charts
function buildYAxisTicks(maxVal, topY = 28, baselineY = 186) {
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

// Computed Geometry: Sex Distribution by ALS Level (Grouped Vertical Bars)
const sexDistributionChart = computed(() => {
  const elem = sexDistributionByLevel.value.elementary || { male: 0, female: 0 };
  const jhs = sexDistributionByLevel.value.juniorHigh || { male: 0, female: 0 };
  const maxVal = Math.max(elem.male || 0, elem.female || 0, jhs.male || 0, jhs.female || 0);
  const { niceMax, usableHeight, baselineY, ticks } = buildYAxisTicks(maxVal, 28, 186);

  const barWidth = 44;
  const barGap = 14;

  const groupConfigs = [
    {
      key: 'elementary',
      label: 'A&E Elementary',
      cx: 170,
      male: elem.male || 0,
      female: elem.female || 0,
    },
    {
      key: 'juniorHigh',
      label: 'A&E Junior High',
      cx: 350,
      male: jhs.male || 0,
      female: jhs.female || 0,
    },
  ];

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

const maleLegendBreakdown = computed(() => {
  const elem = sexDistributionByLevel.value.elementary?.male || 0;
  const jhs = sexDistributionByLevel.value.juniorHigh?.male || 0;
  return ` (${elem} Elem, ${jhs} JHS)`;
});

const femaleLegendBreakdown = computed(() => {
  const elem = sexDistributionByLevel.value.elementary?.female || 0;
  const jhs = sexDistributionByLevel.value.juniorHigh?.female || 0;
  return ` (${elem} Elem, ${jhs} JHS)`;
});

// Helper to build discontinuous SVG polyline segments so months without sessions are never plotted as 0%
function buildDiscontinuousSegments(points, hasRecordsFn, yFn) {
  const segments = [];
  let current = [];
  for (const pt of points) {
    if (hasRecordsFn(pt) && yFn(pt) !== null) {
      current.push(`${pt.x},${yFn(pt)}`);
    } else if (current.length > 0) {
      if (current.length >= 2) segments.push(current.join(' '));
      current = [];
    }
  }
  if (current.length >= 2) {
    segments.push(current.join(' '));
  }
  return segments;
}

// Computed Geometry: Monthly Attendance Trend
const attendanceLineChart = computed(() => {
  const months = attendanceTrend.value?.monthly || [];
  const topY = 28;
  const baselineY = 186;
  const usableHeight = baselineY - topY;
  const startX = 78;
  const endX = 485;

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

    const elemPct = elemObj.hasRecords
      ? Math.min(100, Math.max(0, Number(elemObj.attendancePercentage || 0)))
      : null;
    const jhsPct = jhsObj.hasRecords
      ? Math.min(100, Math.max(0, Number(jhsObj.attendancePercentage || 0)))
      : null;

    const elemY = elemPct !== null ? Math.round((baselineY - (elemPct / 100) * usableHeight) * 10) / 10 : null;
    const jhsY = jhsPct !== null ? Math.round((baselineY - (jhsPct / 100) * usableHeight) * 10) / 10 : null;

    let elemLabelY = elemY !== null ? elemY - 10 : null;
    let jhsLabelY = jhsY !== null ? jhsY - 10 : null;
    if (elemY !== null && jhsY !== null && Math.abs(elemY - jhsY) < 16) {
      if (elemY <= jhsY) {
        elemLabelY = elemY - 11;
        jhsLabelY = Math.min(baselineY - 4, jhsY + 16);
      } else {
        jhsLabelY = jhsY - 11;
        elemLabelY = Math.min(baselineY - 4, elemY + 16);
      }
    }

    const elemTooltip = elemObj.hasRecords
      ? `A&E Elementary: ${elemPct}% (${elemObj.presentRecords}/${elemObj.totalRecords} present)`
      : 'A&E Elementary: No sessions recorded';
    const jhsTooltip = jhsObj.hasRecords
      ? `A&E Junior High: ${jhsPct}% (${jhsObj.presentRecords}/${jhsObj.totalRecords} present)`
      : 'A&E Junior High: No sessions recorded';

    return {
      key: m.key,
      label: m.month,
      x,
      elemY,
      jhsY,
      elemLabelY,
      jhsLabelY,
      elementary: elemObj,
      juniorHigh: jhsObj,
      tooltipText: `${m.month}\n${elemTooltip}\n${jhsTooltip}`,
    };
  });

  const elementarySegments = buildDiscontinuousSegments(
    points,
    (p) => Boolean(p.elementary?.hasRecords),
    (p) => p.elemY
  );
  const juniorHighSegments = buildDiscontinuousSegments(
    points,
    (p) => Boolean(p.juniorHigh?.hasRecords),
    (p) => p.jhsY
  );

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

onMounted(() => {
  fetchDashboardData();
  fetchModuleProgressPreview();
});
</script>

<style scoped>
.admin-dashboard {
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
  margin: 0 0 0.45rem 0;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* Quick Actions Box */
.quick-actions-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
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
  cursor: pointer;
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

/* Dashboard Filter Bar */
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
  cursor: pointer;
}

.btn-retry:hover {
  background: #fee2e2;
}

.dashboard-section {
  margin-bottom: 1.5rem;
}

/* Summary Cards Grid */
.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

/* 2-Column Balanced Grid */
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

/* Vertical Bar Chart SVG */
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

/* Monthly Attendance Trend Line Chart */
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
  max-width: 340px;
}

.empty-state-compact {
  padding: 1.75rem 1rem;
}

.empty-state-graphic {
  color: #94a3b8;
  margin-bottom: 0.65rem;
}

.empty-state-text {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
  max-width: 320px;
}

/* Operational Sections */
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

.btn-read-details-inline {
  font-size: 0.76rem;
  font-weight: 600;
  color: #2563eb;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color 0.15s ease;
}

.btn-read-details-inline:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.schedule-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-top: 0.15rem;
}

/* Learning Centers Needing Attention */
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

.activity-tab-btn.is-active {
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

.activity-tab-btn.is-active .activity-tab-count {
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

.act-type-module_completion,
.act-type-module_completed {
  background: #ecfdf5;
  color: #059669;
}

.act-type-submission,
.act-type-assessment {
  background: #fef3c7;
  color: #d97706;
}

.act-type-attendance {
  background: #f3e8ff;
  color: #7c3aed;
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

/* Quick Actions Grid (3 Columns on Desktop) */
.quick-actions-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
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

.qa-blue {
  background: #eff6ff;
  color: #2563eb;
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

/* Modal Styling */
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

.dashboard-modal-card.modal-lg {
  max-width: 860px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1;
}

.dashboard-modal-close:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #b91c1c;
}

.dashboard-modal-body {
  padding: 1.25rem 1.35rem;
  overflow-y: auto;
  font-size: 0.85rem;
}

.modal-announcement-content {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #334155;
  margin: 0;
  white-space: pre-wrap;
}

.dashboard-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.95rem 1.35rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-tabs-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.35rem 0;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.modal-tab-btn {
  padding: 0.5rem 0.85rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-tab-btn:hover {
  color: #0f172a;
}

.modal-tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.modal-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}

.modal-kpi-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.modal-kpi-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.modal-kpi-val {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-section-heading {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.65rem 0;
}

.modal-empty-note {
  font-size: 0.8125rem;
  color: #64748b;
  font-style: italic;
  padding: 1rem 0;
}

.modal-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.modal-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.modal-data-table th {
  background: #f8fafc;
  padding: 0.6rem 0.75rem;
  font-weight: 700;
  color: #475569;
  border-bottom: 1px solid #cbd5e1;
  text-align: left;
}

.modal-data-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
}

.modal-data-table tbody tr:last-child td {
  border-bottom: none;
}

.status-tag {
  display: inline-flex;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.tag-completed {
  background: #ecfdf5;
  color: #047857;
}

.tag-overdue {
  background: #fef2f2;
  color: #b91c1c;
}

.tag-inprogress {
  background: #fffbeb;
  color: #b45309;
}

.tag-notstarted {
  background: #f1f5f9;
  color: #64748b;
}

.delayed-mod-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-outline {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-primary {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

/* Responsive Media Queries */
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
  .attention-categories-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .quick-actions-grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .modal-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .filter-controls-grid {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
  .filter-action-item .btn-clear-filters {
    width: 100%;
  }
  .summary-cards-grid {
    grid-template-columns: 1fr;
  }
  .attention-categories-grid {
    grid-template-columns: 1fr;
  }
  .quick-actions-grid-3 {
    grid-template-columns: 1fr;
  }
  .activity-feed-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .activity-right-col {
    align-items: flex-start;
  }
  .modal-kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="page-container teacher-dashboard">
    <!-- Breadcrumb -->
    <nav class="dashboard-breadcrumb" aria-label="Breadcrumb">
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

      <!-- Quick Actions -->
      <div class="quick-actions-box">
        <span class="quick-actions-label">Quick Actions</span>
        <div class="quick-actions-buttons">
          <router-link to="/dashboard/attendance" class="quick-act-btn quick-act-primary">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>Record Attendance</span>
          </router-link>

          <router-link to="/dashboard/learners" class="quick-act-btn quick-act-secondary">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>View Learners</span>
          </router-link>

          <router-link to="/dashboard/reports/attendance-summary" class="quick-act-btn quick-act-secondary">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Generate Report</span>
          </router-link>

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
              <option value="A&E Elementary">A&amp;E Elementary</option>
              <option value="A&E Junior High">A&amp;E Junior High</option>
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

    <!-- TOP SECTION: FOUR SUMMARY CARDS -->
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

        <!-- Card 2: A&E Elementary Learners -->
        <div class="stat-card">
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
            <span class="stat-hint">
              Assigned learners in A&amp;E Elementary
            </span>
          </div>
        </div>

        <!-- Card 3: A&E Junior High Learners -->
        <div class="stat-card">
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
            <span class="stat-hint">
              Assigned learners in A&amp;E Junior High
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
                  ? `${summary.presentAttendanceRecords} of ${summary.totalAttendanceRecords} present across ${summary.totalSessions} ${summary.totalSessions === 1 ? 'session' : 'sessions'}`
                  : 'No attendance records in current filter'
              }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ANNOUNCEMENTS AND UPCOMING SCHEDULE (Side by Side on Desktop, Stacked on Mobile) -->
    <div class="dashboard-grid-2-balanced">
      <!-- LEFT: ANNOUNCEMENTS (Latest 3 relevant: From Admin + My Announcement) -->
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

      <!-- RIGHT: UPCOMING SCHEDULE (Next 3 Upcoming Sessions Assigned to Teacher) -->
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
    </div>

    <!-- SECOND SECTION: LEFT (My Learners by ALS Level) & RIGHT (Sex Distribution by ALS Level) -->
    <div class="dashboard-grid-2-balanced">
      <!-- GRAPH 1 (LEFT): MY LEARNERS BY ALS LEVEL (Vertical Bar Chart with 2 Separate Bars) -->
      <section class="chart-card chart-card-section">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">My Learners by ALS Level</h2>
            <p class="chart-card-subtitle">Assigned learner count per ALS program level</p>
          </div>
          <span class="badge-info-pill">
            {{ learnersByLevel.total }} {{ learnersByLevel.total === 1 ? 'Learner' : 'Learners' }}
          </span>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading assigned learners by level...</span>
        </div>

        <div v-else-if="learnersByLevel.total === 0" class="empty-state-box">
          <div class="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <p class="empty-state-title">No assigned learners found</p>
          <p class="empty-state-desc">No learners assigned to your account match the selected filter.</p>
        </div>

        <div v-else class="vbar-chart-wrapper">
          <svg viewBox="0 0 500 235" class="svg-vbar-chart" role="img" aria-label="My Learners by ALS Level vertical bar chart">
            <text x="16" y="16" class="svg-axis-unit">Learners</text>

            <!-- Horizontal Grid Lines -->
            <g v-for="(tick, tIdx) in learnersByLevelChart.yTicks" :key="tIdx">
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

            <!-- Two Separate Vertical Bars: A&E Elementary & A&E Junior High -->
            <g v-for="bar in learnersByLevelChart.bars" :key="bar.key">
              <rect
                :x="bar.cx - 56"
                y="24"
                width="112"
                :height="learnersByLevelChart.baselineY - 24"
                fill="transparent"
                class="svg-bar-hover-zone"
              >
                <title>{{ bar.label }}: {{ bar.count }} {{ bar.count === 1 ? 'Learner' : 'Learners' }} ({{ bar.percentage }}%)</title>
              </rect>

              <rect
                v-if="bar.height > 0"
                :x="bar.x"
                :y="bar.y"
                :width="bar.width"
                :height="bar.height"
                :fill="bar.color"
                rx="6"
                ry="6"
                class="svg-vbar-rect"
              >
                <title>{{ bar.label }}: {{ bar.count }} {{ bar.count === 1 ? 'Learner' : 'Learners' }} ({{ bar.percentage }}%)</title>
              </rect>
              <rect
                v-else
                :x="bar.x"
                :y="learnersByLevelChart.baselineY - 3"
                :width="bar.width"
                height="3"
                :fill="bar.color"
                opacity="0.4"
                rx="1.5"
              >
                <title>{{ bar.label }}: 0 Learners (0%)</title>
              </rect>

              <!-- Actual Learner Count Above Each Bar -->
              <text
                :x="bar.cx"
                :y="bar.labelY"
                text-anchor="middle"
                class="svg-bar-value"
              >
                {{ bar.count }}
              </text>

              <!-- X-Axis ALS Level Label -->
              <text
                :x="bar.cx"
                :y="learnersByLevelChart.baselineY + 22"
                text-anchor="middle"
                class="svg-x-category"
              >
                {{ bar.label }}
              </text>
            </g>
          </svg>

          <!-- Legend Footer -->
          <div class="chart-legend-row">
            <div class="legend-badge">
              <span class="legend-swatch" style="background-color: #2563eb;"></span>
              <span>A&amp;E Elementary: <strong>{{ learnersByLevel.elementary }}</strong> ({{ learnersByLevel.elementaryPct }}%)</span>
            </div>
            <div class="legend-badge">
              <span class="legend-swatch" style="background-color: #0d9488;"></span>
              <span>A&amp;E Junior High: <strong>{{ learnersByLevel.juniorHigh }}</strong> ({{ learnersByLevel.juniorHighPct }}%)</span>
            </div>
          </div>
        </div>
      </section>

      <!-- GRAPH 2 (RIGHT): SEX DISTRIBUTION BY ALS LEVEL (Grouped Vertical Bar Chart) -->
      <section class="chart-card chart-card-section">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Sex Distribution by ALS Level</h2>
            <p class="chart-card-subtitle">Male and Female counts among your assigned learners</p>
          </div>
          <div class="inline-legend-pills">
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

                <!-- Numerical Value Above Bar -->
                <text
                  :x="bar.cx"
                  :y="bar.labelY"
                  text-anchor="middle"
                  class="svg-bar-value"
                >
                  {{ bar.count }}
                </text>

                <!-- Sub-bar Sex Label -->
                <text
                  :x="bar.cx"
                  :y="sexDistributionChart.baselineY + 15"
                  text-anchor="middle"
                  class="svg-subbar-label"
                >
                  {{ bar.sexLabel }}
                </text>
              </g>

              <!-- Group ALS Level Category Label -->
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
              <span class="legend-swatch" style="background-color: #2563eb;"></span>
              <span>Male (A&amp;E Elementary: <strong>{{ sexDistributionByLevel.elementary.male }}</strong>, A&amp;E Junior High: <strong>{{ sexDistributionByLevel.juniorHigh.male }}</strong>)</span>
            </div>
            <div class="legend-badge">
              <span class="legend-swatch" style="background-color: #e11d48;"></span>
              <span>Female (A&amp;E Elementary: <strong>{{ sexDistributionByLevel.elementary.female }}</strong>, A&amp;E Junior High: <strong>{{ sexDistributionByLevel.juniorHigh.female }}</strong>)</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- THIRD SECTION: LEFT (Module Completion by ALS Level) & RIGHT (Learner Progress by ALS Level) -->
    <div class="dashboard-grid-2-balanced">
      <!-- GRAPH 3 (LEFT): MODULE COMPLETION BY ALS LEVEL (Grouped Vertical Bar Chart - 3 Separate Bars per Level) -->
      <section class="chart-card chart-card-section">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Module Completion by ALS Level</h2>
            <p class="chart-card-subtitle">
              Number of assigned <strong>learners</strong> by module completion status (Completed, In Progress, Not Started)
            </p>
          </div>
          <span class="badge-info-pill" title="Counts represent your assigned learners grouped by module completion status">
            {{ moduleCompletionByLevel.totalLearners }} {{ moduleCompletionByLevel.totalLearners === 1 ? 'Learner' : 'Learners' }}
          </span>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading module completion data...</span>
        </div>

        <div v-else-if="moduleCompletionByLevel.totalLearners === 0" class="empty-state-box">
          <div class="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <p class="empty-state-title">No learner module records found</p>
          <p class="empty-state-desc">Module completion statuses for your assigned learners will appear here.</p>
        </div>

        <div v-else class="vbar-chart-wrapper">
          <svg viewBox="0 0 500 240" class="svg-vbar-chart" role="img" aria-label="Module Completion by ALS Level grouped vertical bar chart">
            <text x="16" y="16" class="svg-axis-unit">Learners</text>

            <!-- Horizontal Grid Lines -->
            <g v-for="(tick, tIdx) in moduleCompletionChart.yTicks" :key="tIdx">
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

            <!-- Grouped Bars per ALS Level (Completed, In Progress, Not Started) -->
            <g v-for="group in moduleCompletionChart.groups" :key="group.key">
              <g v-for="bar in group.bars" :key="bar.key">
                <rect
                  v-if="bar.height > 0"
                  :x="bar.x"
                  :y="bar.y"
                  :width="bar.width"
                  :height="bar.height"
                  :fill="bar.color"
                  rx="4"
                  ry="4"
                  class="svg-vbar-rect"
                >
                  <title>{{ group.label }} — {{ bar.statusLabel }}: {{ bar.count }} {{ bar.count === 1 ? 'Learner' : 'Learners' }}</title>
                </rect>
                <rect
                  v-else
                  :x="bar.x"
                  :y="moduleCompletionChart.baselineY - 3"
                  :width="bar.width"
                  height="3"
                  :fill="bar.color"
                  opacity="0.4"
                  rx="1.5"
                >
                  <title>{{ group.label }} — {{ bar.statusLabel }}: 0 Learners</title>
                </rect>

                <!-- Numerical Value Above Bar -->
                <text
                  :x="bar.cx"
                  :y="bar.labelY"
                  text-anchor="middle"
                  class="svg-bar-value"
                >
                  {{ bar.count }}
                </text>

                <!-- Short Status Sub-label -->
                <text
                  :x="bar.cx"
                  :y="moduleCompletionChart.baselineY + 14"
                  text-anchor="middle"
                  class="svg-subbar-label-sm"
                >
                  {{ bar.shortLabel }}
                </text>
              </g>

              <!-- Group ALS Level Category Label -->
              <text
                :x="group.cx"
                :y="moduleCompletionChart.baselineY + 33"
                text-anchor="middle"
                class="svg-x-category"
              >
                {{ group.label }}
              </text>
            </g>
          </svg>

          <!-- Clear Status Legend with Actual Learner Counts -->
          <div class="chart-legend-row">
            <div class="legend-badge">
              <span class="legend-swatch" style="background-color: #10b981;"></span>
              <span>Completed: <strong>{{ moduleCompletionByLevel.totalCompleted }}</strong> {{ moduleCompletionByLevel.totalCompleted === 1 ? 'Learner' : 'Learners' }}</span>
            </div>
            <div class="legend-badge">
              <span class="legend-swatch" style="background-color: #f59e0b;"></span>
              <span>In Progress: <strong>{{ moduleCompletionByLevel.totalInProgress }}</strong> {{ moduleCompletionByLevel.totalInProgress === 1 ? 'Learner' : 'Learners' }}</span>
            </div>
            <div class="legend-badge">
              <span class="legend-swatch" style="background-color: #64748b;"></span>
              <span>Not Started: <strong>{{ moduleCompletionByLevel.totalNotStarted }}</strong> {{ moduleCompletionByLevel.totalNotStarted === 1 ? 'Learner' : 'Learners' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- GRAPH 4 (RIGHT): LEARNER PROGRESS BY ALS LEVEL (Horizontal Percentage Progress Bars) -->
      <section class="chart-card chart-card-section">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Learner Progress by ALS Level</h2>
            <p class="chart-card-subtitle">
              Average learner module progress percentage calculated from your assigned learners' module records
            </p>
          </div>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading learner progress...</span>
        </div>

        <div v-else-if="!learnerProgressByLevel.hasData" class="empty-state-box">
          <div class="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p class="empty-state-title">No learner progress records yet</p>
          <p class="empty-state-desc">Average learner module progress will be calculated once learners are assigned.</p>
        </div>

        <div v-else class="horizontal-progress-container">
          <!-- A&E Elementary — Average Learner Progress -->
          <div class="progress-level-block">
            <div class="progress-level-header">
              <div class="progress-level-title-wrap">
                <span class="progress-level-dot" style="background-color: #2563eb;"></span>
                <div>
                  <span class="progress-level-name">A&amp;E Elementary — Average Learner Progress</span>
                  <span class="progress-level-meta">
                    {{ learnerProgressByLevel.elementary.learnersCount }}
                    {{ learnerProgressByLevel.elementary.learnersCount === 1 ? 'Learner' : 'Learners' }} Assigned
                  </span>
                </div>
              </div>
              <span class="progress-percentage-badge pct-blue">
                {{ learnerProgressByLevel.elementary.averageProgress }}%
              </span>
            </div>

            <div class="progress-bar-row">
              <div
                class="progress-track-horizontal"
                role="progressbar"
                :aria-valuenow="learnerProgressByLevel.elementary.averageProgress"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="A&E Elementary Average Learner Progress"
              >
                <div
                  class="progress-fill-horizontal fill-elementary"
                  :style="{ width: `${Math.min(100, Math.max(0, learnerProgressByLevel.elementary.averageProgress))}%` }"
                ></div>
              </div>
              <span class="progress-side-pct">{{ learnerProgressByLevel.elementary.averageProgress }}%</span>
            </div>

            <div class="progress-breakdown-tags">
              <span class="prog-tag">
                <span class="prog-dot" style="background-color: #10b981;"></span>
                Completed: <strong>{{ learnerProgressByLevel.elementary.completedLearnersCount ?? 0 }}</strong>
              </span>
              <span class="prog-tag">
                <span class="prog-dot" style="background-color: #f59e0b;"></span>
                In Progress: <strong>{{ learnerProgressByLevel.elementary.inProgressLearnersCount ?? 0 }}</strong>
              </span>
              <span class="prog-tag">
                <span class="prog-dot" style="background-color: #64748b;"></span>
                Not Started: <strong>{{ learnerProgressByLevel.elementary.notStartedLearnersCount ?? 0 }}</strong>
              </span>
            </div>
          </div>

          <!-- A&E Junior High — Average Learner Progress -->
          <div class="progress-level-block">
            <div class="progress-level-header">
              <div class="progress-level-title-wrap">
                <span class="progress-level-dot" style="background-color: #0d9488;"></span>
                <div>
                  <span class="progress-level-name">A&amp;E Junior High — Average Learner Progress</span>
                  <span class="progress-level-meta">
                    {{ learnerProgressByLevel.juniorHigh.learnersCount }}
                    {{ learnerProgressByLevel.juniorHigh.learnersCount === 1 ? 'Learner' : 'Learners' }} Assigned
                  </span>
                </div>
              </div>
              <span class="progress-percentage-badge pct-teal">
                {{ learnerProgressByLevel.juniorHigh.averageProgress }}%
              </span>
            </div>

            <div class="progress-bar-row">
              <div
                class="progress-track-horizontal"
                role="progressbar"
                :aria-valuenow="learnerProgressByLevel.juniorHigh.averageProgress"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="A&E Junior High Average Learner Progress"
              >
                <div
                  class="progress-fill-horizontal fill-junior-high"
                  :style="{ width: `${Math.min(100, Math.max(0, learnerProgressByLevel.juniorHigh.averageProgress))}%` }"
                ></div>
              </div>
              <span class="progress-side-pct">{{ learnerProgressByLevel.juniorHigh.averageProgress }}%</span>
            </div>

            <div class="progress-breakdown-tags">
              <span class="prog-tag">
                <span class="prog-dot" style="background-color: #10b981;"></span>
                Completed: <strong>{{ learnerProgressByLevel.juniorHigh.completedLearnersCount ?? 0 }}</strong>
              </span>
              <span class="prog-tag">
                <span class="prog-dot" style="background-color: #f59e0b;"></span>
                In Progress: <strong>{{ learnerProgressByLevel.juniorHigh.inProgressLearnersCount ?? 0 }}</strong>
              </span>
              <span class="prog-tag">
                <span class="prog-dot" style="background-color: #64748b;"></span>
                Not Started: <strong>{{ learnerProgressByLevel.juniorHigh.notStartedLearnersCount ?? 0 }}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- FOURTH SECTION: FULL-WIDTH MONTHLY ATTENDANCE TREND (Line Chart with Two Separate Lines) -->
    <section class="dashboard-section" aria-label="Monthly Attendance Trend">
      <div class="chart-card">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Monthly Attendance Trend</h2>
            <p class="chart-card-subtitle">
              Monthly attendance percentages (0%–100%) from your recorded ALS learning sessions
            </p>
          </div>

          <!-- Clear Legend & KPIs -->
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
            <div v-if="attendanceTrend.hasData" class="kpi-tag">
              <span class="kpi-dot bg-purple"></span>
              <span>Recorded ALS Sessions: <strong>{{ attendanceTrend.totalSessions }}</strong></span>
            </div>
          </div>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading monthly attendance trend...</span>
        </div>

        <!-- Empty state if no attendance data -->
        <div v-else-if="!attendanceTrend.hasData || attendanceTrend.totalRecords === 0" class="empty-state-box">
          <div class="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p class="empty-state-title">No attendance data available</p>
          <p class="empty-state-desc">
            Record attendance sessions for your assigned learners to populate the monthly attendance trend chart.
          </p>
        </div>

        <!-- Two-Line Chart Visual -->
        <div v-else class="line-chart-wrapper">
          <!-- Interactive Hover Tooltip Banner -->
          <div class="line-chart-hover-banner" aria-live="polite">
            <template v-if="hoveredMonthPoint">
              <span class="hover-month-name">{{ hoveredMonthPoint.label }}</span>
              <span class="hover-level-item">
                <span class="legend-swatch" style="background-color: #2563eb;"></span>
                A&amp;E Elementary:
                <strong v-if="hoveredMonthPoint.elementary.hasRecords">
                  {{ hoveredMonthPoint.elementary.attendancePercentage }}%
                  ({{ hoveredMonthPoint.elementary.presentRecords }}/{{ hoveredMonthPoint.elementary.totalRecords }} present across {{ hoveredMonthPoint.elementary.sessionsCount }} {{ hoveredMonthPoint.elementary.sessionsCount === 1 ? 'session' : 'sessions' }})
                </strong>
                <span v-else class="text-muted">No ALS sessions recorded</span>
              </span>
              <span class="hover-level-item">
                <span class="legend-swatch" style="background-color: #0d9488;"></span>
                A&amp;E Junior High:
                <strong v-if="hoveredMonthPoint.juniorHigh.hasRecords">
                  {{ hoveredMonthPoint.juniorHigh.attendancePercentage }}%
                  ({{ hoveredMonthPoint.juniorHigh.presentRecords }}/{{ hoveredMonthPoint.juniorHigh.totalRecords }} present across {{ hoveredMonthPoint.juniorHigh.sessionsCount }} {{ hoveredMonthPoint.juniorHigh.sessionsCount === 1 ? 'session' : 'sessions' }})
                </strong>
                <span v-else class="text-muted">No ALS sessions recorded</span>
              </span>
            </template>
            <template v-else>
              <span class="hover-hint-text">
                Hover over any monthly data point to inspect session attendance details per ALS level.
              </span>
            </template>
          </div>

          <div class="chart-canvas-container">
            <svg
              class="trend-line-svg"
              viewBox="0 0 760 250"
              role="img"
              aria-label="Monthly Attendance Trend line chart comparing A&E Elementary and A&E Junior High"
            >
              <!-- Horizontal Grid Lines (0%, 25%, 50%, 75%, 100%) -->
              <g v-for="grid in attendanceLineChart.yGrid" :key="grid.pct">
                <line
                  x1="56"
                  :y1="grid.y"
                  x2="720"
                  :y2="grid.y"
                  :stroke="grid.pct === 0 ? '#cbd5e1' : '#e2e8f0'"
                  :stroke-width="grid.pct === 0 ? 1.5 : 1"
                  :stroke-dasharray="grid.pct === 0 ? 'none' : '3 3'"
                />
                <text x="46" :y="grid.y + 4" class="chart-axis-text" text-anchor="end">
                  {{ grid.pct }}%
                </text>
              </g>

              <!-- Line 1: A&E Elementary (#2563eb) -->
              <polyline
                v-if="attendanceLineChart.elementaryLinePath"
                :points="attendanceLineChart.elementaryLinePath"
                fill="none"
                stroke="#2563eb"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Line 2: A&E Junior High (#0d9488) -->
              <polyline
                v-if="attendanceLineChart.juniorHighLinePath"
                :points="attendanceLineChart.juniorHighLinePath"
                fill="none"
                stroke="#0d9488"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Month Columns, Interactive Hover Zones & Data Points -->
              <g
                v-for="(pt, idx) in attendanceLineChart.points"
                :key="pt.key || idx"
                class="month-point-group"
                @mouseenter="hoveredMonthIndex = idx"
                @mouseleave="hoveredMonthIndex = null"
              >
                <!-- Vertical Guide Line on Hover -->
                <line
                  v-if="hoveredMonthIndex === idx"
                  :x1="pt.x"
                  y1="25"
                  :x2="pt.x"
                  :y2="attendanceLineChart.baselineY"
                  stroke="#94a3b8"
                  stroke-width="1"
                  stroke-dasharray="3 3"
                />

                <!-- Transparent Hover Column Target (Fitts's Law) -->
                <rect
                  :x="pt.x - 32"
                  y="20"
                  width="64"
                  :height="attendanceLineChart.baselineY - 10"
                  fill="transparent"
                  style="cursor: pointer;"
                >
                  <title>{{ pt.tooltipText }}</title>
                </rect>

                <!-- A&E Elementary Point -->
                <circle
                  :cx="pt.x"
                  :cy="pt.elemY"
                  :r="hoveredMonthIndex === idx ? 6.5 : 5"
                  :fill="pt.elementary.hasRecords ? '#2563eb' : '#ffffff'"
                  stroke="#2563eb"
                  stroke-width="2.5"
                  class="chart-point"
                >
                  <title>{{ pt.label }} — A&amp;E Elementary: {{ pt.elementary.hasRecords ? `${pt.elementary.attendancePercentage}% (${pt.elementary.presentRecords}/${pt.elementary.totalRecords} present)` : 'No ALS sessions recorded' }}</title>
                </circle>

                <!-- A&E Elementary Value Label -->
                <text
                  v-if="pt.elementary.hasRecords"
                  :x="pt.x"
                  :y="pt.elemLabelY"
                  class="point-tooltip-text elem-point-text"
                  text-anchor="middle"
                >
                  {{ pt.elementary.attendancePercentage }}%
                </text>

                <!-- A&E Junior High Point -->
                <circle
                  :cx="pt.x"
                  :cy="pt.jhsY"
                  :r="hoveredMonthIndex === idx ? 6.5 : 5"
                  :fill="pt.juniorHigh.hasRecords ? '#0d9488' : '#ffffff'"
                  stroke="#0d9488"
                  stroke-width="2.5"
                  class="chart-point"
                >
                  <title>{{ pt.label }} — A&amp;E Junior High: {{ pt.juniorHigh.hasRecords ? `${pt.juniorHigh.attendancePercentage}% (${pt.juniorHigh.presentRecords}/${pt.juniorHigh.totalRecords} present)` : 'No ALS sessions recorded' }}</title>
                </circle>

                <!-- A&E Junior High Value Label -->
                <text
                  v-if="pt.juniorHigh.hasRecords"
                  :x="pt.x"
                  :y="pt.jhsLabelY"
                  class="point-tooltip-text jhs-point-text"
                  text-anchor="middle"
                >
                  {{ pt.juniorHigh.attendancePercentage }}%
                </text>

                <!-- X-Axis Month Label -->
                <text
                  :x="pt.x"
                  :y="attendanceLineChart.baselineY + 22"
                  class="chart-axis-text month-x-label"
                  text-anchor="middle"
                >
                  {{ pt.label }}
                </text>
              </g>
            </svg>
          </div>

          <!-- Monthly Breakdown Cards per Level -->
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
                  {{ m.sessionsCount }} {{ m.sessionsCount === 1 ? 'Session' : 'Sessions' }}
                </span>
              </div>
              <div class="mbc-levels-list">
                <div class="mbc-level-row">
                  <span class="mbc-level-name">
                    <span class="legend-swatch-sm" style="background-color: #2563eb;"></span>
                    A&amp;E Elementary
                  </span>
                  <strong v-if="m.elementary?.hasRecords" class="mbc-level-val text-blue">
                    {{ m.elementary.attendancePercentage }}%
                  </strong>
                  <span v-else class="mbc-no-session">No sessions</span>
                </div>
                <div class="mbc-level-row">
                  <span class="mbc-level-name">
                    <span class="legend-swatch-sm" style="background-color: #0d9488;"></span>
                    A&amp;E Junior High
                  </span>
                  <strong v-if="m.juniorHigh?.hasRecords" class="mbc-level-val text-teal">
                    {{ m.juniorHigh.attendancePercentage }}%
                  </strong>
                  <span v-else class="mbc-no-session">No sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- LEARNERS NEEDING ATTENTION -->
    <section class="dashboard-section" aria-label="Learners Needing Attention">
      <div class="chart-card">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Learners Needing Attention</h2>
            <p class="chart-card-subtitle">
              Monitoring indicators strictly for learners assigned to you
            </p>
          </div>
          <span
            class="badge"
            :class="learnersNeedingAttention.totalIssues > 0 ? 'badge-warning-pill' : 'badge-success-pill'"
          >
            {{
              learnersNeedingAttention.totalIssues > 0
                ? `${learnersNeedingAttention.totalAffectedLearners || learnersNeedingAttention.totalIssues} ${
                    (learnersNeedingAttention.totalAffectedLearners || learnersNeedingAttention.totalIssues) === 1
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

        <div v-else>
          <div v-if="learnersNeedingAttention.totalIssues === 0" class="attention-clear-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>No learners currently need attention.</span>
          </div>

          <div class="attention-grid-3">
            <router-link
              v-for="item in learnersNeedingAttention.items"
              :key="item.key"
              :to="item.route || '/dashboard/learners'"
              class="attention-item-card"
              :class="{ 'has-alert': item.count > 0 }"
            >
              <div class="attention-item-top">
                <span class="attention-item-label">{{ item.label }}</span>
                <span
                  class="attention-count-badge"
                  :class="item.count > 0 ? 'count-alert' : 'count-zero'"
                >
                  {{ item.count }}
                </span>
              </div>
              <p class="attention-item-desc">{{ item.description }}</p>
              <span class="attention-item-cta">
                <span>{{ item.count > 0 ? 'View affected learners' : 'Open My Learners' }}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- RECENT LEARNER ACTIVITIES -->
    <section class="dashboard-section" aria-label="Recent Learner Activities">
      <div class="chart-card">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Recent Learner Activities</h2>
            <p class="chart-card-subtitle">
              Up to five recent learning activities from learners assigned to you
            </p>
          </div>
          <div class="card-header-actions">
            <router-link to="/dashboard/learners" class="link-view-all">
              <span>View My Learners</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </router-link>
          </div>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading recent learner activities...</span>
        </div>

        <div v-else-if="recentLearnerActivities.length === 0" class="empty-state-box empty-state-compact">
          <div class="empty-state-graphic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h3 class="empty-state-title">No recent learner activities</h3>
          <p class="empty-state-text">
            Module completions, submissions, and attendance updates from your assigned learners will appear here.
          </p>
        </div>

        <div v-else class="activity-feed-list">
          <div
            v-for="act in recentLearnerActivities"
            :key="act.id"
            class="activity-feed-row"
          >
            <div class="activity-icon-dot" :class="`act-type-${act.type || 'default'}`">
              <svg v-if="act.type === 'module_completed'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <svg v-else-if="act.type === 'assessment_submitted' || act.type === 'activity_submitted'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <svg v-else-if="act.type === 'attendance_recorded'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>

            <div class="activity-main-info">
              <div class="activity-learner-row">
                <span class="activity-learner-name">{{ act.learnerName }}</span>
                <span class="meta-pill pill-level">{{ act.alsLevel }}</span>
              </div>
              <p class="activity-desc-text">{{ act.description }}</p>
            </div>

            <span class="activity-datetime-text">{{ act.dateTime }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- QUICK ACTIONS SECTION -->
    <section class="dashboard-section" aria-label="Quick Actions">
      <div class="chart-card">
        <div class="card-box-header-wrap">
          <div>
            <h2 class="chart-card-title">Quick Actions</h2>
            <p class="chart-card-subtitle">
              Direct shortcuts to your core instructional workflows
            </p>
          </div>
        </div>

        <div class="quick-actions-grid-4">
          <router-link to="/dashboard/modules" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="12" y1="8" x2="12" y2="14" /><line x1="9" y1="11" x2="15" y2="11" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Upload Module</span>
              <span class="qa-sub">Publish learning materials</span>
            </div>
          </router-link>

          <router-link to="/dashboard/attendance" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Record Attendance</span>
              <span class="qa-sub">Log ALS learning sessions</span>
            </div>
          </router-link>

          <router-link to="/dashboard/learners" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">View My Learners</span>
              <span class="qa-sub">Manage assigned learners</span>
            </div>
          </router-link>

          <router-link to="/dashboard/schedule" class="quick-action-card-btn">
            <div class="qa-icon-wrap qa-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">View Schedule</span>
              <span class="qa-sub">Check upcoming sessions</span>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getTeacherDashboardData } from '../api/dashboard.js';

const {
  currentTeacher,
  teacherName,
  teacherPosition,
  teacherId,
  assignedCenters,
  assignedProgramLevel,
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

// Top Section: 4 Summary Cards
const summary = ref({
  totalLearners: 0,
  elementaryLearners: 0,
  juniorHighLearners: 0,
  averageAttendanceRate: 0,
  totalAttendanceRecords: 0,
  presentAttendanceRecords: 0,
  totalSessions: 0,
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
      label: 'Learners with low attendance',
      description: 'Assigned learners with attendance rate below 75%',
      count: 0,
      route: '/dashboard/learners',
    },
    {
      key: 'delayedProgress',
      label: 'Learners with delayed module progress',
      description: 'Assigned learners with past-due modules or unmastered assessments',
      count: 0,
      route: '/dashboard/learners',
    },
    {
      key: 'noRecentActivity',
      label: 'Learners with no recent learning activity',
      description: 'Assigned learners with no attendance, progress, or submissions in the last 30 days',
      count: 0,
      route: '/dashboard/learners',
    },
  ],
});
const recentLearnerActivities = ref([]);

// Graph 1: My Learners by ALS Level
const learnersByLevel = ref({
  total: 0,
  elementary: 0,
  junior: 0,
  juniorHigh: 0,
  elementaryPct: 0,
  juniorPct: 0,
  juniorHighPct: 0,
});

// Graph 2: Sex Distribution by ALS Level
const sexDistributionByLevel = ref({
  totalLearners: 0,
  totalMale: 0,
  totalFemale: 0,
  elementary: { label: 'A&E Elementary', male: 0, female: 0, total: 0 },
  juniorHigh: { label: 'A&E Junior High', male: 0, female: 0, total: 0 },
});

// Graph 3: Module Completion by ALS Level
const moduleCompletionByLevel = ref({
  unit: 'Learners',
  totalLearners: 0,
  totalCompleted: 0,
  totalInProgress: 0,
  totalNotStarted: 0,
  elementary: { label: 'A&E Elementary', completed: 0, inProgress: 0, notStarted: 0, total: 0 },
  juniorHigh: { label: 'A&E Junior High', completed: 0, inProgress: 0, notStarted: 0, total: 0 },
});

// Graph 4: Learner Progress by ALS Level
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

// Graph 5: Monthly Attendance Trend
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
    const data = await getTeacherDashboardData({
      teacherId: tid,
      schoolYear: filters.schoolYear,
      level: filters.level,
      learningCenterId: showLearningCenterFilter.value ? filters.learningCenterId : '',
    });

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
          levels: ['A&E Elementary', 'A&E Junior High'],
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

// Computed Geometry: Graph 1 — My Learners by ALS Level (2 Separate Vertical Bars)
const learnersByLevelChart = computed(() => {
  const elemCount = learnersByLevel.value.elementary || 0;
  const jhsCount = learnersByLevel.value.juniorHigh || 0;
  const { niceMax, usableHeight, baselineY, ticks } = buildYAxisTicks(
    Math.max(elemCount, jhsCount),
    28,
    192
  );

  const rawBars = [
    {
      key: 'elementary',
      label: 'A&E Elementary',
      count: elemCount,
      percentage: learnersByLevel.value.elementaryPct || 0,
      cx: 175,
      color: '#2563eb',
    },
    {
      key: 'juniorHigh',
      label: 'A&E Junior High',
      count: jhsCount,
      percentage: learnersByLevel.value.juniorHighPct || 0,
      cx: 345,
      color: '#0d9488',
    },
  ];

  const barWidth = 68;
  const bars = rawBars.map((b) => {
    const height = b.count > 0 ? Math.max(6, (b.count / niceMax) * usableHeight) : 0;
    const y = baselineY - height;
    return {
      ...b,
      width: barWidth,
      x: b.cx - barWidth / 2,
      y,
      height,
      labelY: b.count > 0 ? y - 8 : baselineY - 10,
    };
  });

  return { baselineY, yTicks: ticks, bars };
});

// Computed Geometry: Graph 2 — Sex Distribution by ALS Level (Grouped Vertical Bars)
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

// Computed Geometry: Graph 3 — Module Completion by ALS Level (Grouped Vertical Bars: 3 Bars per Level)
const moduleCompletionChart = computed(() => {
  const elem = moduleCompletionByLevel.value.elementary || { completed: 0, inProgress: 0, notStarted: 0 };
  const jhs = moduleCompletionByLevel.value.juniorHigh || { completed: 0, inProgress: 0, notStarted: 0 };
  const maxVal = Math.max(
    elem.completed || 0,
    elem.inProgress || 0,
    elem.notStarted || 0,
    jhs.completed || 0,
    jhs.inProgress || 0,
    jhs.notStarted || 0
  );
  const { niceMax, usableHeight, baselineY, ticks } = buildYAxisTicks(maxVal, 28, 190);

  const barWidth = 34;
  const barGap = 10;

  const groupConfigs = [
    {
      key: 'elementary',
      label: 'A&E Elementary',
      cx: 165,
      completed: elem.completed || 0,
      inProgress: elem.inProgress || 0,
      notStarted: elem.notStarted || 0,
    },
    {
      key: 'juniorHigh',
      label: 'A&E Junior High',
      cx: 355,
      completed: jhs.completed || 0,
      inProgress: jhs.inProgress || 0,
      notStarted: jhs.notStarted || 0,
    },
  ];

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

// Computed Geometry: Graph 5 — Monthly Attendance Trend (2 Separate Lines: A&E Elementary & A&E Junior High)
const attendanceLineChart = computed(() => {
  const months = attendanceTrend.value?.monthly || [];
  const topY = 28;
  const baselineY = 198;
  const usableHeight = baselineY - topY;
  const startX = 95;
  const endX = 690;

  const yGrid = [100, 75, 50, 25, 0].map((pct) => ({
    pct,
    y: Math.round((baselineY - (pct / 100) * usableHeight) * 10) / 10,
  }));

  if (months.length === 0) {
    return {
      baselineY,
      yGrid,
      points: [],
      elementaryLinePath: '',
      juniorHighLinePath: '',
    };
  }

  const count = months.length;
  const stepX = count > 1 ? (endX - startX) / (count - 1) : 0;

  const points = months.map((m, idx) => {
    const x = count === 1 ? (startX + endX) / 2 : Math.round((startX + idx * stepX) * 10) / 10;
    const elemObj = m.elementary || {
      hasRecords: false,
      attendancePercentage: 0,
      presentRecords: 0,
      totalRecords: 0,
      sessionsCount: 0,
    };
    const jhsObj = m.juniorHigh || {
      hasRecords: false,
      attendancePercentage: 0,
      presentRecords: 0,
      totalRecords: 0,
      sessionsCount: 0,
    };

    const elemPct = Math.min(100, Math.max(0, elemObj.attendancePercentage || 0));
    const jhsPct = Math.min(100, Math.max(0, jhsObj.attendancePercentage || 0));

    const elemY = Math.round((baselineY - (elemPct / 100) * usableHeight) * 10) / 10;
    const jhsY = Math.round((baselineY - (jhsPct / 100) * usableHeight) * 10) / 10;

    // Avoid label collision if both points have nearly identical Y
    let elemLabelY = elemY - 10;
    let jhsLabelY = jhsY - 10;
    if (elemObj.hasRecords && jhsObj.hasRecords && Math.abs(elemY - jhsY) < 16) {
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
      : 'A&E Elementary: No ALS sessions recorded';
    const jhsTooltip = jhsObj.hasRecords
      ? `A&E Junior High: ${jhsPct}% (${jhsObj.presentRecords}/${jhsObj.totalRecords} present)`
      : 'A&E Junior High: No ALS sessions recorded';

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

  const elementaryLinePath = points.map((p) => `${p.x},${p.elemY}`).join(' ');
  const juniorHighLinePath = points.map((p) => `${p.x},${p.jhsY}`).join(' ');

  return {
    baselineY,
    yGrid,
    points,
    elementaryLinePath,
    juniorHighLinePath,
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

.dashboard-breadcrumb {
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.breadcrumb-current {
  font-weight: 500;
  color: #475569;
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

/* TOP SECTION: 4 Summary Cards Grid */
.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
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
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.attention-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 960px) {
  .attention-grid-3 {
    grid-template-columns: 1fr;
  }
}

.attention-item-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.55rem;
  padding: 1rem 1.1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  text-decoration: none;
  transition: all 0.18s ease;
}

.attention-item-card:hover {
  border-color: #2563eb;
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06);
}

.attention-item-card.has-alert {
  background: #fffbeb;
  border-color: #fde68a;
}

.attention-item-card.has-alert:hover {
  border-color: #f59e0b;
}

.attention-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.attention-item-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
}

.attention-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  padding: 0 0.55rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 800;
}

.count-alert {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #f59e0b;
}

.count-zero {
  background: #e2e8f0;
  color: #475569;
}

.attention-item-desc {
  font-size: 0.78rem;
  color: #475569;
  margin: 0;
  line-height: 1.4;
}

.attention-item-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: #2563eb;
  margin-top: 0.2rem;
}

/* Recent Learner Activities */
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

.activity-datetime-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .activity-feed-row {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Quick Actions Grid */
.quick-actions-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 1100px) {
  .quick-actions-grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .quick-actions-grid-4 {
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
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06);
}

.qa-icon-wrap {
  width: 42px;
  height: 42px;
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
</style>

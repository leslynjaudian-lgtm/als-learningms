<template>
  <div class="page-container admin-dashboard">
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <span class="breadcrumb-current">Dashboard</span>
    </nav>

    <!-- Header -->
    <div class="dashboard-header-row">
      <div class="header-text-group">
        <h1 class="dashboard-welcome-title">Welcome back, Admin</h1>
        <p class="dashboard-subtitle">
          Monitor ALS implementation, learner progress, attendance, and Community Learning Centers.
        </p>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn btn-secondary refresh-btn"
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
          <span>{{ loading ? 'Updating...' : 'Refresh Data' }}</span>
        </button>
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
              <option value="A&E Elementary">A&E Elementary</option>
              <option value="A&E Junior High">A&E Junior High</option>
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
              <option value="">All Community Learning Centers</option>
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
              title="Reset all filters to default district-wide view"
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
      <button type="button" class="btn btn-secondary btn-sm" @click="fetchDashboardData">
        Retry
      </button>
    </div>

    <!-- TOP SECTION: FOUR EXISTING SUMMARY CARDS -->
    <section class="dashboard-section" aria-label="Summary Metrics">
      <div class="stats-grid-4">
        <!-- Card 1: Total Learning Centers -->
        <div class="summary-stat-card card-hover-effect">
          <div class="stat-card-inner">
            <div class="stat-icon-wrapper stat-icon-amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
                <path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" />
                <path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
              </svg>
            </div>
            <div class="stat-meta">
              <span class="stat-label">Total Learning Centers</span>
              <div class="stat-value-wrap">
                <span class="stat-value">{{ summary.totalLearningCenters }}</span>
              </div>
              <span class="stat-desc">Active CLCs in Naawan District</span>
            </div>
          </div>
        </div>

        <!-- Card 2: Total ALS Teachers -->
        <div class="summary-stat-card card-hover-effect">
          <div class="stat-card-inner">
            <div class="stat-icon-wrapper stat-icon-green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
            </div>
            <div class="stat-meta">
              <span class="stat-label">Total ALS Teachers</span>
              <div class="stat-value-wrap">
                <span class="stat-value">{{ summary.totalTeachers }}</span>
              </div>
              <span class="stat-desc">Assigned instructional staff</span>
            </div>
          </div>
        </div>

        <!-- Card 3: Total Learners -->
        <div class="summary-stat-card card-hover-effect">
          <div class="stat-card-inner">
            <div class="stat-icon-wrapper stat-icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div class="stat-meta">
              <span class="stat-label">Total Learners</span>
              <div class="stat-value-wrap">
                <span class="stat-value">{{ summary.totalLearners }}</span>
              </div>
              <span class="stat-desc">Learners enrolled across CLCs</span>
            </div>
          </div>
        </div>

        <!-- Card 4: Average Attendance Rate -->
        <div class="summary-stat-card card-hover-effect">
          <div class="stat-card-inner">
            <div class="stat-icon-wrapper stat-icon-purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div class="stat-meta">
              <span class="stat-label">Average Attendance Rate</span>
              <div class="stat-value-wrap">
                <span class="stat-value text-primary-rate">{{ summary.averageAttendanceRate }}%</span>
              </div>
              <span class="stat-desc">Community Learning Center attendance performance</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ANNOUNCEMENTS AND UPCOMING SCHEDULE (Side by Side on Desktop, Stacked on Mobile) -->
    <div class="dashboard-grid-2-balanced">
      <!-- LEFT: LATEST ANNOUNCEMENTS (Admin-created, Top 3) -->
      <section class="card-box operational-card-section" aria-label="Latest Announcements">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Latest Announcements</h3>
            <p class="card-box-subtitle">Three most recent announcements published by the Admin</p>
          </div>
          <div class="card-header-actions">
            <router-link
              to="/dashboard/announcements?action=create"
              class="btn-card-action btn-card-primary"
              title="Create a new announcement for Teachers or Learners"
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
          <h4 class="empty-state-title">No announcements available.</h4>
          <p class="empty-state-text">Admin announcements for ALS teachers and learners will appear here.</p>
        </div>

        <div v-else class="operational-list">
          <article
            v-for="ann in latestAnnouncements"
            :key="ann.id"
            class="operational-list-item"
          >
            <div class="oli-top-row">
              <h4 class="oli-title">{{ ann.title }}</h4>
              <div class="oli-badges">
                <span v-if="ann.priorityLabel" class="meta-pill pill-priority">
                  {{ ann.priorityLabel }}
                </span>
                <span class="meta-pill pill-recipient">
                  {{ ann.recipients || ann.audience }}
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

      <!-- RIGHT: UPCOMING SCHEDULE (Next 3 Upcoming Activities Across Authorized CLCs) -->
      <section class="card-box operational-card-section" aria-label="Upcoming Schedule">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Upcoming Schedule</h3>
            <p class="card-box-subtitle">Next three scheduled activities across Community Learning Centers</p>
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
          <h4 class="empty-state-title">No upcoming schedules.</h4>
          <p class="empty-state-text">Upcoming learning sessions and district activities will be listed here.</p>
        </div>

        <div v-else class="operational-list">
          <article
            v-for="sched in upcomingSchedules"
            :key="sched.id"
            class="operational-list-item schedule-item-card"
          >
            <div class="oli-top-row">
              <h4 class="oli-title">{{ sched.title }}</h4>
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

    <!-- SECOND SECTION: LEFT (Learners by ALS Level) & RIGHT (Sex Distribution by ALS Level) -->
    <div class="dashboard-grid-2-balanced">
      <!-- LEFT: LEARNERS BY ALS LEVEL (Vertical Bar Chart with 2 Separate Bars) -->
      <section class="card-box chart-card-section">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Learners by ALS Level</h3>
            <p class="card-box-subtitle">Enrolled learner count per ALS program level</p>
          </div>
          <span class="badge badge-info">
            {{ learnerDistribution.total }} {{ learnerDistribution.total === 1 ? 'Learner' : 'Learners' }}
          </span>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading learner distribution...</span>
        </div>

        <div v-else-if="learnerDistribution.total === 0" class="empty-state-box">
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h4 class="empty-state-title">No learners found</h4>
          <p class="empty-state-text">No registered learners match the current filter selection.</p>
        </div>

        <div v-else class="vbar-chart-wrapper">
          <svg viewBox="0 0 500 235" class="svg-vbar-chart" role="img" aria-label="Learners by ALS Level vertical bar chart">
            <!-- Y-Axis Label -->
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

            <!-- Two Separate Vertical Bars -->
            <g v-for="bar in learnersByLevelChart.bars" :key="bar.key">
              <!-- Hover Slot -->
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

              <!-- Vertical Bar -->
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

              <!-- X-Axis Level Label -->
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
              <span>A&amp;E Elementary: <strong>{{ learnerDistribution.elementary }}</strong> ({{ learnerDistribution.elementaryPct }}%)</span>
            </div>
            <div class="legend-badge">
              <span class="legend-swatch" style="background-color: #0d9488;"></span>
              <span>A&amp;E Junior High: <strong>{{ learnerDistribution.juniorHigh }}</strong> ({{ learnerDistribution.juniorHighPct }}%)</span>
            </div>
          </div>
        </div>
      </section>

      <!-- RIGHT: SEX DISTRIBUTION BY ALS LEVEL (Grouped Vertical Bar Chart) -->
      <section class="card-box chart-card-section">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Sex Distribution by ALS Level</h3>
            <p class="card-box-subtitle">Male and Female learner counts per ALS level</p>
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
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <h4 class="empty-state-title">No sex distribution data</h4>
          <p class="empty-state-text">Male and Female learner distribution will appear when learners are enrolled.</p>
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
      <!-- LEFT: MODULE COMPLETION BY ALS LEVEL (Grouped Vertical Bar Chart - 3 Separate Bars per Level) -->
      <section class="card-box chart-card-section">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Module Completion by ALS Level</h3>
            <p class="card-box-subtitle">
              Number of <strong>learners</strong> by module completion status (Completed, In Progress, Not Started)
            </p>
          </div>
          <span class="badge badge-info" title="Counts represent enrolled learners grouped by module completion status">
            {{ moduleCompletionByLevel.totalLearners }} {{ moduleCompletionByLevel.totalLearners === 1 ? 'Learner' : 'Learners' }}
          </span>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading module completion data...</span>
        </div>

        <div v-else-if="moduleCompletionByLevel.totalLearners === 0" class="empty-state-box">
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h4 class="empty-state-title">No learner module records found</h4>
          <p class="empty-state-text">Learner module completion statuses will appear once learners are enrolled.</p>
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

      <!-- RIGHT: LEARNER PROGRESS BY ALS LEVEL (Horizontal Percentage Progress Visualization) -->
      <section class="card-box chart-card-section">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Learner Progress by ALS Level</h3>
            <p class="card-box-subtitle">
              Average learner module progress percentage calculated from actual progress records
            </p>
          </div>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading learner progress...</span>
        </div>

        <div v-else-if="!learnerProgressByLevel.hasData" class="empty-state-box">
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h4 class="empty-state-title">No learner progress records yet</h4>
          <p class="empty-state-text">Average learner module progress will be calculated once learners are enrolled.</p>
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
                    {{ learnerProgressByLevel.elementary.learnersCount === 1 ? 'Learner' : 'Learners' }} Enrolled
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
                    {{ learnerProgressByLevel.juniorHigh.learnersCount === 1 ? 'Learner' : 'Learners' }} Enrolled
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
      <div class="card-box">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Monthly Attendance Trend</h3>
            <p class="card-box-subtitle">
              Monthly attendance percentages (0%–100%) based on actual recorded ALS learning sessions
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
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h4 class="empty-state-title">No attendance data available</h4>
          <p class="empty-state-text">
            ALS learning sessions recorded by teachers will populate the monthly attendance trend chart.
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

    <!-- NEEDS ATTENTION SECTION -->
    <section class="dashboard-section" aria-label="Needs Attention">
      <div class="card-box">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Needs Attention</h3>
            <p class="card-box-subtitle">
              District monitoring indicators requiring follow-up across learners and Community Learning Centers
            </p>
          </div>
          <span
            class="badge"
            :class="needsAttention.totalIssues > 0 ? 'badge-warning-pill' : 'badge-success-pill'"
          >
            {{
              needsAttention.totalIssues > 0
                ? `${needsAttention.totalIssues} ${needsAttention.totalIssues === 1 ? 'Item Needs' : 'Items Need'} Attention`
                : 'All Clear'
            }}
          </span>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Checking district monitoring indicators...</span>
        </div>

        <div v-else>
          <div v-if="needsAttention.totalIssues === 0" class="attention-clear-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>No items need attention.</span>
          </div>

          <div class="attention-grid-3">
            <router-link
              v-for="item in needsAttention.items"
              :key="item.key"
              :to="item.route"
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
                <span>{{ item.count > 0 ? 'View affected records' : 'Open management page' }}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- COMMUNITY LEARNING CENTER OVERVIEW -->
    <section class="dashboard-section" aria-label="Community Learning Center Overview">
      <div class="card-box">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Community Learning Center Overview</h3>
            <p class="card-box-subtitle">
              Authorized Community Learning Centers, learner enrollment, assigned teachers, and attendance rate
            </p>
          </div>
          <div class="card-header-actions">
            <router-link to="/dashboard/learning-centers" class="link-view-all">
              <span>View All</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </router-link>
          </div>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading Community Learning Centers...</span>
        </div>

        <div v-else-if="clcOverview.length === 0" class="empty-state-box empty-state-compact">
          <h4 class="empty-state-title">No Community Learning Centers found</h4>
          <p class="empty-state-text">Authorized Community Learning Centers in Naawan District will appear here.</p>
        </div>

        <div v-else class="clc-table-wrapper">
          <table class="clc-overview-table">
            <thead>
              <tr>
                <th>Learning Center Name</th>
                <th>Assigned Teachers</th>
                <th class="text-center">Total Learners</th>
                <th class="text-right">Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="clc in clcOverview" :key="clc.id">
                <td>
                  <router-link
                    :to="`/dashboard/learning-centers?view=${clc.id}`"
                    class="clc-name-link"
                    :title="`Open details for ${clc.name}`"
                  >
                    <span class="clc-link-text">{{ clc.name }}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </router-link>
                </td>
                <td>
                  <span class="clc-teachers-text">{{ clc.assignedTeachers }}</span>
                </td>
                <td class="text-center">
                  <span class="clc-learners-pill">{{ clc.totalLearners }}</span>
                </td>
                <td class="text-right">
                  <span
                    class="clc-rate-badge"
                    :class="
                      clc.attendanceRateNum === null
                        ? 'rate-neutral'
                        : clc.attendanceRateNum >= 75
                        ? 'rate-good'
                        : 'rate-low'
                    "
                  >
                    {{ clc.attendanceRate }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- RECENT ACTIVITIES -->
    <section class="dashboard-section" aria-label="Recent Activities">
      <div class="card-box">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Recent Activities</h3>
            <p class="card-box-subtitle">
              Latest five system activities recorded across Naawan District
            </p>
          </div>
        </div>

        <div v-if="loading && !hasLoadedOnce" class="chart-loading-box">
          <div class="spinner"></div>
          <span>Loading recent system activities...</span>
        </div>

        <div v-else-if="recentActivities.length === 0" class="empty-state-box empty-state-compact">
          <h4 class="empty-state-title">No recent activities recorded</h4>
          <p class="empty-state-text">System activities across Naawan District will appear here as records are updated.</p>
        </div>

        <div v-else class="activity-feed-list">
          <div
            v-for="act in recentActivities"
            :key="act.id"
            class="activity-feed-row"
          >
            <div class="activity-icon-dot" :class="`act-type-${act.type || 'default'}`">
              <svg v-if="act.type === 'learner'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <svg v-else-if="act.type === 'teacher'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <svg v-else-if="act.type === 'module'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <svg v-else-if="act.type === 'attendance'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
              </svg>
            </div>
            <div class="activity-main-info">
              <p class="activity-desc-text">{{ act.description || act.title }}</p>
              <span class="activity-entity-text">{{ act.entity || act.subtitle }}</span>
            </div>
            <span class="activity-datetime-text">{{ act.dateTime }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- QUICK ACTIONS -->
    <section class="dashboard-section" aria-label="Quick Actions">
      <div class="card-box">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Quick Actions</h3>
            <p class="card-box-subtitle">
              Direct shortcuts to core district management pages
            </p>
          </div>
        </div>

        <div class="quick-actions-grid-4">
          <router-link to="/dashboard/learning-centers" class="quick-action-btn">
            <div class="qa-icon-wrap qa-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Manage Learning Centers</span>
              <span class="qa-sub">View and update CLCs</span>
            </div>
          </router-link>

          <router-link to="/dashboard/teachers" class="quick-action-btn">
            <div class="qa-icon-wrap qa-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Manage Teachers</span>
              <span class="qa-sub">Assign &amp; monitor ALS teachers</span>
            </div>
          </router-link>

          <router-link to="/dashboard/learners" class="quick-action-btn">
            <div class="qa-icon-wrap qa-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Manage Learners</span>
              <span class="qa-sub">Directory of A&amp;E learners</span>
            </div>
          </router-link>

          <router-link to="/dashboard/announcements?action=create" class="quick-action-btn">
            <div class="qa-icon-wrap qa-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div class="qa-text-wrap">
              <span class="qa-title">Create Announcement</span>
              <span class="qa-sub">Publish notice to district</span>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { getAdminDashboardData } from '../api/dashboard.js';

const loading = ref(true);
const hasLoadedOnce = ref(false);
const errorMessage = ref('');
const hoveredMonthIndex = ref(null);

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

// Section 1: Summary Cards
const summary = ref({
  totalLearningCenters: 0,
  totalTeachers: 0,
  totalLearners: 0,
  averageAttendanceRate: 0,
  totalAttendanceRecords: 0,
});

// Operational Sections
const latestAnnouncements = ref([]);
const upcomingSchedules = ref([]);
const needsAttention = ref({
  hasIssues: false,
  totalIssues: 0,
  lowAttendanceCount: 0,
  delayedProgressCount: 0,
  inactiveCentersCount: 0,
  items: [
    {
      key: 'lowAttendance',
      label: 'Learners with low attendance',
      description: 'Attendance rate below 75% in recorded ALS learning sessions',
      count: 0,
      route: '/dashboard/learners',
    },
    {
      key: 'delayedProgress',
      label: 'Learners with delayed module progress',
      description: 'Learners with past-due assigned modules or unmastered module assessments',
      count: 0,
      route: '/dashboard/reports/module-progress',
    },
    {
      key: 'inactiveCenters',
      label: 'Community Learning Centers with no recent learning activity',
      description: 'Learning centers with no recorded attendance or module updates in the last 30 days',
      count: 0,
      route: '/dashboard/learning-centers',
    },
  ],
});
const clcOverview = ref([]);
const recentActivities = ref([]);

// Section 2 (Left): Learners by ALS Level
const learnerDistribution = ref({
  total: 0,
  elementary: 0,
  junior: 0,
  juniorHigh: 0,
  elementaryPct: 0,
  juniorPct: 0,
  juniorHighPct: 0,
});

// Section 2 (Right): Sex Distribution by ALS Level
const sexDistributionByLevel = ref({
  totalLearners: 0,
  totalMale: 0,
  totalFemale: 0,
  elementary: { label: 'A&E Elementary', male: 0, female: 0, total: 0 },
  juniorHigh: { label: 'A&E Junior High', male: 0, female: 0, total: 0 },
});

// Section 3 (Left): Module Completion by ALS Level
const moduleCompletionByLevel = ref({
  unit: 'Learners',
  totalLearners: 0,
  totalCompleted: 0,
  totalInProgress: 0,
  totalNotStarted: 0,
  elementary: { label: 'A&E Elementary', completed: 0, inProgress: 0, notStarted: 0, total: 0 },
  juniorHigh: { label: 'A&E Junior High', completed: 0, inProgress: 0, notStarted: 0, total: 0 },
});

// Section 3 (Right): Learner Progress by ALS Level
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

// Section 4: Monthly Attendance Trend
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
      if (data.moduleCompletionByLevel) moduleCompletionByLevel.value = data.moduleCompletionByLevel;
      if (data.learnerProgressByLevel) learnerProgressByLevel.value = data.learnerProgressByLevel;
      if (data.attendanceTrend) attendanceTrend.value = data.attendanceTrend;
      if (data.needsAttention) needsAttention.value = data.needsAttention;
      if (Array.isArray(data.clcOverview)) clcOverview.value = data.clcOverview;
      if (Array.isArray(data.recentActivities)) recentActivities.value = data.recentActivities.slice(0, 5);
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
}

function resetFilters() {
  filters.schoolYear = '';
  filters.level = '';
  filters.learningCenterId = '';
  hoveredMonthIndex.value = null;
  fetchDashboardData();
}

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

// Computed Geometry: Chart 1 — Learners by ALS Level (2 Vertical Bars)
const learnersByLevelChart = computed(() => {
  const elemCount = learnerDistribution.value.elementary || 0;
  const jhsCount = learnerDistribution.value.juniorHigh || 0;
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
      percentage: learnerDistribution.value.elementaryPct || 0,
      cx: 175,
      color: '#2563eb',
    },
    {
      key: 'juniorHigh',
      label: 'A&E Junior High',
      count: jhsCount,
      percentage: learnerDistribution.value.juniorHighPct || 0,
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

// Computed Geometry: Chart 2 — Sex Distribution by ALS Level (Grouped Vertical Bars)
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

// Computed Geometry: Chart 3 — Module Completion by ALS Level (Grouped Vertical Bars: 3 Bars per Level)
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

// Computed Geometry: Chart 4 — Monthly Attendance Trend (2 Separate Lines: A&E Elementary & A&E Junior High)
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
.admin-dashboard {
  padding-bottom: 3rem;
}

.dashboard-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 1.5rem; /* 24px spacing from header to main content */
}

.dashboard-welcome-title {
  font-size: 1.75rem; /* 28px */
  font-weight: 700;
  color: #0f172a;
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin: 0;
}

.dashboard-subtitle {
  font-size: 0.875rem; /* 14px */
  color: #64748b;
  margin: 0.375rem 0 0 0; /* 6px spacing between title and description */
  line-height: 1.5;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem; /* 14px */
  height: 2.375rem; /* 38px */
  padding: 0 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-xs);
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
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.875rem;
}

.filter-icon {
  color: var(--color-primary);
}

.filter-controls-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.35fr) auto;
  gap: 1rem;
  align-items: end;
  width: 100%;
}

@media (max-width: 960px) {
  .filter-controls-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .filter-action-item {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width: 600px) {
  .filter-controls-grid {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
  .filter-action-item .btn-reset-filters {
    width: 100%;
  }
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
  border-radius: var(--radius-md, 8px);
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text, #0f172a);
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
  border-radius: var(--radius-md, 8px);
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
  border-radius: var(--radius-lg);
  color: #b91c1c;
  font-size: 0.875rem;
  font-weight: 500;
}

.error-banner-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.dashboard-section {
  margin-bottom: 1.5rem;
}

/* 4 Summary Cards Horizontal Grid */
.summary-stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  box-shadow: var(--shadow-xs);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-hover-effect:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.stat-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.stat-value {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.1;
  margin: 0.2rem 0;
}

.text-primary-rate {
  color: var(--color-primary);
}

.stat-desc {
  font-size: 0.775rem;
  color: var(--color-text-muted);
  line-height: 1.25;
}

/* 2-Column Balanced Grid (Desktop 2 columns, Mobile 1 column) */
.dashboard-grid-2-balanced {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 960px) {
  .dashboard-grid-2-balanced {
    grid-template-columns: 1fr;
  }
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

.card-box-subtitle {
  font-size: 0.825rem;
  color: var(--color-text-secondary);
  margin-top: 0.15rem;
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
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.25rem 0.55rem;
}

.chart-legend-row {
  display: flex;
  gap: 1.15rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-light);
  flex-wrap: wrap;
}

.legend-badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
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

/* Horizontal Percentage Progress Visualization (Section 7) */
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
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
  color: var(--color-text);
}

.progress-level-meta {
  display: block;
  font-size: 0.775rem;
  color: var(--color-text-secondary);
  margin-top: 0.1rem;
}

.progress-percentage-badge {
  font-size: 0.85rem;
  font-weight: 800;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-md);
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
  color: var(--color-text);
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
  color: var(--color-text-secondary);
}

.prog-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Monthly Attendance Trend Line Chart (Section 8) */
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
  color: var(--color-text-secondary);
  background: var(--color-bg);
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
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
  color: var(--color-text);
  background: #e2e8f0;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.hover-level-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
}

.hover-hint-text {
  color: var(--color-text-muted);
  font-size: 0.8rem;
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
  border-top: 1px solid var(--color-border-light);
}

.month-breakdown-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.month-breakdown-card.is-hovered {
  border-color: var(--color-primary);
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
  color: var(--color-text);
}

.mbc-sessions-badge {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--color-text-secondary);
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
  color: var(--color-text-secondary);
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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.empty-state-box {
  padding: 2.25rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-state-graphic {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-border-light);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.empty-state-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.empty-state-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  max-width: 320px;
}

.empty-state-compact {
  padding: 1.75rem 1rem;
}

/* Operational Sections (Announcements, Upcoming Schedule, Needs Attention, CLC Overview, Recent Activities, Quick Actions) */
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
  background: var(--color-primary, #2563eb);
  color: #ffffff;
  border: 1px solid var(--color-primary, #2563eb);
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
  color: var(--color-primary, #2563eb);
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
  border: 1px solid var(--color-border-light, #e2e8f0);
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
  color: var(--color-text);
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

.pill-recipient {
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
  color: var(--color-text-secondary);
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
  color: var(--color-text-muted);
  font-weight: 500;
}

.oli-inline-link {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--color-primary, #2563eb);
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

/* Needs Attention */
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
  border: 1px solid var(--color-border);
  background: #f8fafc;
  text-decoration: none;
  transition: all 0.18s ease;
}

.attention-item-card:hover {
  border-color: var(--color-primary);
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
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
  color: var(--color-text);
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
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.attention-item-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: 0.2rem;
}

/* CLC Overview Table */
.clc-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.clc-overview-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.clc-overview-table th {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: #f8fafc;
}

.clc-overview-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border-light, #f1f5f9);
  font-size: 0.85rem;
  color: var(--color-text);
  vertical-align: middle;
}

.clc-overview-table tbody tr:last-child td {
  border-bottom: none;
}

.clc-overview-table tbody tr:hover {
  background: #f8fafc;
}

.clc-name-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 400;
  color: var(--color-primary, #2563eb);
  text-decoration: none;
}

.clc-name-link:hover .clc-link-text {
  text-decoration: underline;
}

.clc-teachers-text {
  color: #0f172a;
  font-weight: 600;
  font-size: 0.85rem;
}

.clc-learners-pill {
  font-weight: 400;
  font-size: 0.875rem;
  color: var(--color-text, #0f172a);
}

.clc-rate-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.rate-good {
  background: #ecfdf5;
  color: #047857;
}

.rate-low {
  background: #fef2f2;
  color: #b91c1c;
}

.rate-neutral {
  background: #f1f5f9;
  color: #64748b;
}

.text-center {
  text-align: center !important;
}

.text-right {
  text-align: right !important;
}

/* Recent Activities */
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
  border: 1px solid var(--color-border-light, #e2e8f0);
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

.act-type-teacher {
  background: #ecfdf5;
  color: #059669;
}

.act-type-module {
  background: #fef3c7;
  color: #d97706;
}

.act-type-attendance {
  background: #f3e8ff;
  color: #7c3aed;
}

.act-type-learning_center {
  background: #f0fdfa;
  color: #0d9488;
}

.activity-main-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.activity-desc-text {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.activity-entity-text {
  font-size: 0.77rem;
  color: var(--color-text-secondary);
}

.activity-datetime-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .activity-feed-row {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Quick Actions */
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

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.95rem 1.05rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: #f8fafc;
  text-decoration: none;
  transition: all 0.18s ease;
  min-height: 64px;
}

.quick-action-btn:hover {
  border-color: var(--color-primary);
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
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
  color: var(--color-text);
}

.qa-sub {
  font-size: 0.74rem;
  color: var(--color-text-secondary);
}
</style>

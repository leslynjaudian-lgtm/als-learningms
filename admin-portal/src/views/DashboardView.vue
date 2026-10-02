<template>
  <div class="page-container admin-dashboard">
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

    <!-- SECTION 1: SUMMARY CARDS (4 displayed horizontally) -->
    <section class="dashboard-section">
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

    <!-- SECTION 2 & SECTION 5: 2-COLUMN SECTION -->
    <div class="dashboard-grid-2-balanced">
      <!-- SECTION 2: LEARNER DISTRIBUTION -->
      <section class="card-box chart-card-section">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Learners by Program Level</h3>
            <p class="card-box-subtitle">Distribution across ALS learning stages</p>
          </div>
          <span v-if="learnerDistribution.total > 0" class="badge badge-info">
            {{ learnerDistribution.total }} Total Enrolled
          </span>
        </div>

        <!-- Empty State if no learners -->
        <div v-if="learnerDistribution.total === 0" class="empty-state-box">
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h4 class="empty-state-title">No learners registered yet</h4>
          <p class="empty-state-text">Registered learners will be visualized by program level here.</p>
        </div>

        <!-- Bar Chart Visual -->
        <div v-else class="bar-chart-container">
          <!-- A&E Elementary Bar -->
          <div class="bar-item">
            <div class="bar-header-info">
              <span class="bar-name">
                <span class="bar-bullet bullet-elem"></span>
                A&E Elementary
              </span>
              <span class="bar-count-tag">
                <strong>{{ learnerDistribution.elementary }}</strong>
                <span class="bar-pct">({{ learnerDistribution.elementaryPct }}%)</span>
              </span>
            </div>
            <div class="bar-track">
              <div
                class="bar-fill fill-elem"
                :style="{ width: `${Math.max(learnerDistribution.elementaryPct, learnerDistribution.elementary > 0 ? 6 : 0)}%` }"
              ></div>
            </div>
          </div>

          <!-- A&E Junior High School Bar -->
          <div class="bar-item">
            <div class="bar-header-info">
              <span class="bar-name">
                <span class="bar-bullet bullet-junior"></span>
                A&E Junior High School
              </span>
              <span class="bar-count-tag">
                <strong>{{ learnerDistribution.junior }}</strong>
                <span class="bar-pct">({{ learnerDistribution.juniorPct }}%)</span>
              </span>
            </div>
            <div class="bar-track">
              <div
                class="bar-fill fill-junior"
                :style="{ width: `${Math.max(learnerDistribution.juniorPct, learnerDistribution.junior > 0 ? 6 : 0)}%` }"
              ></div>
            </div>
          </div>

          <!-- Chart Footer Summary -->
          <div class="chart-legend-row">
            <div class="legend-badge">
              <span class="legend-dot dot-elem"></span>
              <span>A&E Elementary: <strong>{{ learnerDistribution.elementary }}</strong></span>
            </div>
            <div class="legend-badge">
              <span class="legend-dot dot-junior"></span>
              <span>A&E Junior High School: <strong>{{ learnerDistribution.junior }}</strong></span>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 5: ALS AF2 OVERVIEW -->
      <section class="card-box chart-card-section">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">ALS AF2 Progress Overview</h3>
            <p class="card-box-subtitle">Competency mastery status from AF2 records</p>
          </div>
        </div>

        <!-- Empty State if no AF2 records -->
        <div v-if="!af2Overview.hasData || af2Overview.totalRecords === 0" class="empty-state-box">
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h4 class="empty-state-title">No AF2 records available</h4>
          <p class="empty-state-text">AF2 module evaluation progress will display when teachers assess modules.</p>
        </div>

        <!-- AF2 Visual & Metrics -->
        <div v-else class="af2-content-wrap">
          <!-- 3 Horizontal Stat Pills -->
          <div class="af2-summary-pills">
            <div class="af2-pill pill-total">
              <span class="pill-label">Total AF2 Records</span>
              <span class="pill-value">{{ af2Overview.totalRecords }}</span>
            </div>
            <div class="af2-pill pill-mastered">
              <span class="pill-label">Mastered Modules</span>
              <span class="pill-value text-green">{{ af2Overview.mastered }}</span>
            </div>
            <div class="af2-pill pill-not-mastered">
              <span class="pill-label">Not Mastered Modules</span>
              <span class="pill-value text-amber">{{ af2Overview.notMastered }}</span>
            </div>
          </div>

          <!-- Doughnut Chart & Legend -->
          <div class="doughnut-container">
            <div class="doughnut-svg-wrap">
              <svg viewBox="0 0 100 100" class="doughnut-svg">
                <!-- Background ring -->
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#e2e8f0"
                  stroke-width="14"
                />
                <!-- Mastered segment (Green) -->
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  stroke-width="14"
                  :stroke-dasharray="`${(af2Overview.masteredPct / 100) * 238.76} 238.76`"
                  stroke-dashoffset="0"
                  transform="rotate(-90 50 50)"
                  stroke-linecap="round"
                />
                <!-- Not Mastered segment (Amber) -->
                <circle
                  v-if="af2Overview.notMasteredPct > 0"
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#f59e0b"
                  stroke-width="14"
                  :stroke-dasharray="`${(af2Overview.notMasteredPct / 100) * 238.76} 238.76`"
                  :stroke-dashoffset="`-${(af2Overview.masteredPct / 100) * 238.76}`"
                  transform="rotate(-90 50 50)"
                  stroke-linecap="round"
                />
              </svg>
              <div class="doughnut-center-text">
                <span class="center-pct">{{ af2Overview.masteredPct }}%</span>
                <span class="center-sub">Mastery</span>
              </div>
            </div>

            <div class="doughnut-legend">
              <div class="legend-row">
                <span class="legend-square bg-green"></span>
                <div class="legend-text">
                  <span class="legend-name">Mastered</span>
                  <span class="legend-data"><strong>{{ af2Overview.mastered }}</strong> ({{ af2Overview.masteredPct }}%)</span>
                </div>
              </div>
              <div class="legend-row">
                <span class="legend-square bg-amber"></span>
                <div class="legend-text">
                  <span class="legend-name">Not Mastered</span>
                  <span class="legend-data"><strong>{{ af2Overview.notMastered }}</strong> ({{ af2Overview.notMasteredPct }}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- SECTION 3: COMMUNITY LEARNING CENTER OVERVIEW -->
    <section class="dashboard-section">
      <div class="card-box">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Community Learning Center Overview</h3>
            <p class="card-box-subtitle">Status, staffing, and attendance performance per CLC</p>
          </div>
          <router-link to="/dashboard/learning-centers" class="link-action">
            Manage Centers &rarr;
          </router-link>
        </div>

        <!-- Empty state if no CLCs -->
        <div v-if="clcOverview.length === 0" class="empty-state-box">
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M9 22v-4h6v4" />
            </svg>
          </div>
          <h4 class="empty-state-title">No learning centers registered yet</h4>
          <p class="empty-state-text">Registered Community Learning Centers will be summarized here.</p>
        </div>

        <!-- CLC Table -->
        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Learning Center</th>
                <th>Assigned ALS Teacher(s)</th>
                <th>Total Learners</th>
                <th>Attendance Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="center in clcOverview" :key="center.id">
                <td class="cell-clc-name">
                  <div class="clc-identity">
                    <span class="clc-title">{{ center.name }}</span>
                    <span v-if="center.code" class="clc-code-badge">{{ center.code }}</span>
                  </div>
                </td>
                <td class="cell-teachers">
                  <div class="teacher-list-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>{{ center.assignedTeachers }}</span>
                  </div>
                </td>
                <td>
                  <span class="learner-count-badge">
                    <strong>{{ center.totalLearners }}</strong> {{ center.totalLearners === 1 ? 'Learner' : 'Learners' }}
                  </span>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="{
                      'badge-success': center.attendanceRateNum !== null && center.attendanceRateNum >= 75,
                      'badge-warning': center.attendanceRateNum !== null && center.attendanceRateNum < 75 && center.attendanceRateNum > 0,
                      'badge-muted': !center.hasAttendance || center.attendanceRateNum === 0
                    }"
                  >
                    {{ center.attendanceRate }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-success">
                    {{ center.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- SECTION 4: ATTENDANCE OVERVIEW (Monthly Trend) -->
    <section class="dashboard-section">
      <div class="card-box">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Attendance Trend</h3>
            <p class="card-box-subtitle">Monthly attendance rate based on recorded attendance sessions</p>
          </div>
          <!-- Attendance Metrics Header Indicators -->
          <div v-if="attendanceTrend.hasData" class="attendance-kpi-group">
            <div class="kpi-tag">
              <span class="kpi-dot bg-green"></span>
              <span>Present Records: <strong>{{ attendanceTrend.presentRecords }}</strong></span>
            </div>
            <div class="kpi-tag">
              <span class="kpi-dot bg-amber"></span>
              <span>Absent Records: <strong>{{ attendanceTrend.absentRecords }}</strong></span>
            </div>
            <div class="kpi-tag">
              <span class="kpi-dot bg-blue"></span>
              <span>Attendance Rate: <strong>{{ attendanceTrend.averageRate }}%</strong></span>
            </div>
          </div>
        </div>

        <!-- Empty state if no attendance data -->
        <div v-if="!attendanceTrend.hasData || attendanceTrend.totalRecords === 0" class="empty-state-box">
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h4 class="empty-state-title">No attendance data available</h4>
          <p class="empty-state-text">Attendance sessions recorded by ALS teachers will populate the monthly trend chart.</p>
        </div>

        <!-- Line Chart Visual -->
        <div v-else class="line-chart-wrapper">
          <div class="chart-canvas-container">
            <!-- SVG Line Chart -->
            <svg class="trend-line-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2563eb" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#2563eb" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <!-- Grid Horizontal Lines (0%, 25%, 50%, 75%, 100%) -->
              <line x1="40" y1="20" x2="580" y2="20" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 3" />
              <line x1="40" y1="60" x2="580" y2="60" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 3" />
              <line x1="40" y1="100" x2="580" y2="100" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 3" />
              <line x1="40" y1="140" x2="580" y2="140" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 3" />
              <line x1="40" y1="180" x2="580" y2="180" stroke="#cbd5e1" stroke-width="1" />

              <!-- Y Axis labels -->
              <text x="32" y="24" class="chart-axis-text" text-anchor="end">100%</text>
              <text x="32" y="104" class="chart-axis-text" text-anchor="end">50%</text>
              <text x="32" y="184" class="chart-axis-text" text-anchor="end">0%</text>

              <!-- Polygon Area Fill -->
              <polygon
                v-if="trendCoordinates.areaPath"
                :points="trendCoordinates.areaPath"
                fill="url(#areaGradient)"
              />

              <!-- Polyline Line -->
              <polyline
                v-if="trendCoordinates.linePath"
                :points="trendCoordinates.linePath"
                fill="none"
                stroke="#2563eb"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Data Points and Tooltips -->
              <g v-for="(pt, idx) in trendCoordinates.points" :key="idx">
                <circle
                  :cx="pt.x"
                  :cy="pt.y"
                  r="5"
                  fill="#ffffff"
                  stroke="#2563eb"
                  stroke-width="2.5"
                  class="chart-point"
                />
                <text
                  :x="pt.x"
                  :y="pt.y - 10"
                  class="point-tooltip-text"
                  text-anchor="middle"
                >
                  {{ pt.pct }}%
                </text>
                <text
                  :x="pt.x"
                  y="196"
                  class="chart-axis-text"
                  text-anchor="middle"
                >
                  {{ pt.label }}
                </text>
              </g>
            </svg>
          </div>

          <!-- Bottom Summary Cards for Month Breakdown -->
          <div class="monthly-breakdown-row">
            <div
              v-for="m in attendanceTrend.monthly"
              :key="m.key"
              class="month-breakdown-card"
            >
              <span class="mbc-month">{{ m.month }}</span>
              <span class="mbc-rate">{{ m.attendancePercentage }}%</span>
              <div class="mbc-details">
                <span class="text-green">{{ m.presentRecords }} Present</span>
                <span class="text-muted">/</span>
                <span class="text-amber">{{ m.absentRecords }} Absent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 6 & SECTION 7: 2-COLUMN SECTION -->
    <div class="dashboard-grid-2-balanced">
      <!-- SECTION 6: RECENT ACTIVITIES -->
      <section class="card-box">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Recent Activities</h3>
            <p class="card-box-subtitle">Latest district events, registrations, and updates</p>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="recentActivities.length === 0" class="empty-state-box">
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h4 class="empty-state-title">No recent activities yet</h4>
          <p class="empty-state-text">Administrative activities across the district will appear here.</p>
        </div>

        <!-- Activity Feed List -->
        <div v-else class="activity-feed-list">
          <div
            v-for="act in recentActivities"
            :key="act.id"
            class="activity-feed-item"
          >
            <!-- Icon Badge -->
            <div
              class="activity-badge"
              :class="{
                'badge-act-learner': act.type === 'learner',
                'badge-act-teacher': act.type === 'teacher',
                'badge-act-att': act.type === 'attendance',
                'badge-act-af2': act.type === 'af2',
                'badge-act-ann': act.type === 'announcement'
              }"
            >
              <!-- Learner Icon -->
              <svg v-if="act.type === 'learner'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              <!-- Teacher Icon -->
              <svg v-else-if="act.type === 'teacher'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
              </svg>
              <!-- Attendance Icon -->
              <svg v-else-if="act.type === 'attendance'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <!-- AF2 Icon -->
              <svg v-else-if="act.type === 'af2'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <!-- Announcement Icon -->
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>

            <!-- Activity Details -->
            <div class="activity-content">
              <span class="activity-title">{{ act.title }}</span>
              <span class="activity-subtitle">{{ act.subtitle }}</span>
            </div>

            <!-- Time indicator -->
            <span class="activity-time">{{ formatRelativeTime(act.timestamp) }}</span>
          </div>
        </div>
      </section>

      <!-- SECTION 7: ANNOUNCEMENTS -->
      <section class="card-box">
        <div class="card-box-header-wrap">
          <div>
            <h3 class="card-box-header">Announcements</h3>
            <p class="card-box-subtitle">Administrative notices published for teachers and learners</p>
          </div>
          <router-link to="/dashboard/announcements" class="link-action">
            Manage &rarr;
          </router-link>
        </div>

        <!-- Empty state -->
        <div v-if="announcements.length === 0" class="empty-state-box">
          <div class="empty-state-graphic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h4 class="empty-state-title">No announcements available</h4>
          <p class="empty-state-text">Published administrative bulletins and notices will appear here.</p>
        </div>

        <!-- Announcements list -->
        <div v-else class="announcements-feed-list">
          <div
            v-for="item in announcements"
            :key="item.id"
            class="announcement-item-card"
          >
            <div class="ann-top-row">
              <h4 class="ann-title">{{ item.title }}</h4>
              <span
                class="badge"
                :class="{
                  'badge-primary': item.audience === 'All Users',
                  'badge-success': item.audience === 'Teachers Only',
                  'badge-info': item.audience === 'Learners Only'
                }"
              >
                {{ item.audience }}
              </span>
            </div>
            <p v-if="item.content" class="ann-content-snippet">{{ item.content }}</p>
            <div class="ann-footer-row">
              <span class="ann-author">Posted by: {{ item.author }}</span>
              <span class="ann-date">{{ item.datePosted }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getAdminDashboardData } from '../api/dashboard.js';

// Reactive states
const loading = ref(true);

const summary = ref({
  totalLearningCenters: 0,
  totalTeachers: 0,
  totalLearners: 0,
  averageAttendanceRate: 0,
  totalAttendanceRecords: 0,
});

const learnerDistribution = ref({
  total: 0,
  elementary: 0,
  junior: 0,
  elementaryPct: 0,
  juniorPct: 0,
});

const clcOverview = ref([]);

const attendanceTrend = ref({
  hasData: false,
  totalRecords: 0,
  presentRecords: 0,
  absentRecords: 0,
  averageRate: 0,
  monthly: [],
});

const af2Overview = ref({
  hasData: false,
  totalRecords: 0,
  mastered: 0,
  notMastered: 0,
  masteredPct: 0,
  notMasteredPct: 0,
});

const recentActivities = ref([]);
const announcements = ref([]);

// Fetch complete live database records
async function fetchDashboardData() {
  loading.value = true;
  try {
    const data = await getAdminDashboardData();
    if (data) {
      if (data.summary) summary.value = data.summary;
      if (data.learnerDistribution) learnerDistribution.value = data.learnerDistribution;
      if (Array.isArray(data.clcOverview)) clcOverview.value = data.clcOverview;
      if (data.attendanceTrend) attendanceTrend.value = data.attendanceTrend;
      if (data.af2Overview) af2Overview.value = data.af2Overview;
      if (Array.isArray(data.recentActivities)) recentActivities.value = data.recentActivities;
      if (Array.isArray(data.announcements)) announcements.value = data.announcements;
    }
  } catch (err) {
    console.error('Failed to load admin dashboard data from API:', err);
  } finally {
    loading.value = false;
  }
}

// Compute SVG Line Chart coordinates for attendance trend
const trendCoordinates = computed(() => {
  const months = attendanceTrend.value?.monthly || [];
  if (months.length === 0) {
    return { points: [], linePath: '', areaPath: '' };
  }

  const svgWidth = 600;
  const svgHeight = 200;
  const paddingX = 60;
  const topPadding = 30;
  const bottomPadding = 30;
  const usableHeight = svgHeight - topPadding - bottomPadding;

  const count = months.length;
  const step = count > 1 ? (svgWidth - paddingX * 2) / (count - 1) : 0;

  const points = months.map((m, idx) => {
    const pct = Math.min(100, Math.max(0, m.attendancePercentage || 0));
    // Y: 0% is at (svgHeight - bottomPadding), 100% is at topPadding
    const x = count === 1 ? svgWidth / 2 : paddingX + idx * step;
    const y = svgHeight - bottomPadding - (pct / 100) * usableHeight;
    return {
      x,
      y,
      pct,
      label: m.month,
    };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? '' : ' '}${p.x},${p.y}`).join('');
  const baselineY = svgHeight - bottomPadding;
  const areaPath = `${points[0].x},${baselineY} ${linePath} ${points[points.length - 1].x},${baselineY}`;

  return { points, linePath, areaPath };
});

// Relative time helper for activity feed
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Recently';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

onMounted(fetchDashboardData);
</script>

<style scoped>
/* Admin Dashboard specific styling extending ALS LMS Theme */
.admin-dashboard {
  padding-bottom: 3rem;
}

.dashboard-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.dashboard-welcome-title {
  font-size: 1.65rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.dashboard-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
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

/* 2-Column Balanced Grid */
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

.card-box-header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.card-box-subtitle {
  font-size: 0.825rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}

.link-action {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.15s ease;
}

.link-action:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

/* Bar Chart Styles */
.bar-chart-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
}

.bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bar-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.bar-name {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.bar-bullet {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.bullet-elem, .fill-elem, .dot-elem {
  background-color: #2563eb;
}

.bullet-junior, .fill-junior, .dot-junior {
  background-color: #0284c7;
}

.bar-count-tag {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.bar-pct {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-left: 0.25rem;
}

.bar-track {
  height: 14px;
  width: 100%;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-legend-row {
  display: flex;
  gap: 1.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-light);
  flex-wrap: wrap;
}

.legend-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* AF2 Overview Section */
.af2-summary-pills {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.af2-pill {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.pill-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.pill-value {
  font-size: 1.25rem;
  font-weight: 700;
}

.doughnut-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 1.5rem;
  padding-top: 0.5rem;
}

.doughnut-svg-wrap {
  position: relative;
  width: 130px;
  height: 130px;
  flex-shrink: 0;
}

.doughnut-svg {
  width: 100%;
  height: 100%;
}

.doughnut-center-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.center-pct {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1;
}

.center-sub {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.doughnut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.legend-square {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.bg-green { background-color: #10b981; }
.bg-amber { background-color: #f59e0b; }
.bg-blue  { background-color: #2563eb; }

.legend-text {
  display: flex;
  flex-direction: column;
}

.legend-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text);
}

.legend-data {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* CLC Table formatting */
.cell-clc-name {
  font-weight: 600;
}

.clc-identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clc-title {
  color: var(--color-text);
}

.clc-code-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-muted);
  font-family: monospace;
}

.teacher-list-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
}

.learner-count-badge {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

/* Line Chart & Attendance KPI */
.attendance-kpi-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.kpi-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.kpi-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.line-chart-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.chart-canvas-container {
  width: 100%;
  overflow-x: auto;
}

.trend-line-svg {
  width: 100%;
  min-width: 480px;
  height: 190px;
  display: block;
}

.chart-axis-text {
  font-size: 10px;
  fill: #94a3b8;
  font-family: inherit;
}

.point-tooltip-text {
  font-size: 11px;
  font-weight: 700;
  fill: #1d4ed8;
  font-family: inherit;
}

.monthly-breakdown-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border-light);
}

.month-breakdown-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.mbc-month {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.mbc-rate {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.mbc-details {
  font-size: 0.7rem;
  display: flex;
  gap: 0.3rem;
}

/* Activity Feed */
.activity-feed-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.activity-feed-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.65rem 0.75rem;
  background: #ffffff;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  transition: background-color 0.15s ease;
}

.activity-feed-item:hover {
  background-color: var(--color-bg);
}

.activity-badge {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.badge-act-learner {
  background: var(--color-blue-bg);
  color: var(--color-blue-text);
}

.badge-act-teacher {
  background: var(--color-green-bg);
  color: var(--color-green-text);
}

.badge-act-att {
  background: #fdf2f8;
  color: #db2777;
}

.badge-act-af2 {
  background: var(--color-purple-bg);
  color: var(--color-purple-text);
}

.badge-act-ann {
  background: var(--color-amber-bg);
  color: var(--color-amber-text);
}

.activity-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time {
  font-size: 0.725rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* Announcements Feed */
.announcements-feed-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.announcement-item-card {
  padding: 0.85rem 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.ann-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.ann-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.ann-content-snippet {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ann-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.725rem;
  color: var(--color-text-muted);
  margin-top: 0.2rem;
  padding-top: 0.35rem;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

/* Standardized Empty State Box matching ALS LMS */
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
</style>

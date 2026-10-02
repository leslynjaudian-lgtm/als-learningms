<template>
  <div class="page-container dashboard-page">
    <!-- Breadcrumb -->
    <nav class="dashboard-breadcrumb" aria-label="Breadcrumb">
      <span class="breadcrumb-current">Dashboard</span>
    </nav>

    <!-- 1. Welcome Section & Quick Actions -->
    <div class="welcome-header-card">
      <div class="welcome-info-col">
        <h1 class="welcome-title">Welcome, {{ teacherFullName }}</h1>
        <div class="welcome-meta-list">
          <div class="meta-item">
            <span class="meta-label">Role:</span>
            <span class="meta-value role-badge">{{ teacherPosition }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Assigned Learning Center:</span>
            <span class="meta-value text-strong">{{ assignedCenterDisplay }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Handled Program Level:</span>
            <span class="meta-value text-strong">{{ handledProgramLevelDisplay }}</span>
          </div>
        </div>
      </div>

      <!-- 8. Quick Actions -->
      <div class="quick-actions-box">
        <span class="quick-actions-label">Quick Actions</span>
        <div class="quick-actions-buttons">
          <router-link to="/dashboard/attendance" class="quick-act-btn quick-act-primary">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Record Attendance</span>
          </router-link>

          <router-link to="/dashboard/learners" class="quick-act-btn quick-act-secondary">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>View Learners</span>
          </router-link>

          <router-link to="/dashboard/reports/attendance-summary" class="quick-act-btn quick-act-secondary">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>Generate Report</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- 2. Summary Cards (4 Cards) -->
    <div class="summary-cards-grid">
      <!-- Card 1: Total Learners -->
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-title">Total Learners</span>
          <div class="stat-icon-wrap icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-body">
          <span v-if="loadingLearners" class="stat-value-loading">...</span>
          <span v-else class="stat-value">{{ assignedLearnersCount }}</span>
          <span class="stat-hint">
            {{ assignedLearnersCount > 0 ? 'Assigned to logged-in teacher' : 'No learner records available' }}
          </span>
        </div>
      </div>

      <!-- Card 2: Community Learning Center Attendance Rate -->
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-title">Community Learning Center Attendance Rate</span>
          <div class="stat-icon-wrap icon-emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-body">
          <span v-if="totalAttendanceRecordsCount > 0" class="stat-value">{{ clcAttendanceRate }}%</span>
          <span v-else class="stat-value text-muted">-</span>
          <span class="stat-hint">
            {{ totalAttendanceRecordsCount > 0 ? `${presentAttendanceRecordsCount} of ${totalAttendanceRecordsCount} present records` : 'No attendance records available' }}
          </span>
        </div>
      </div>

      <!-- Card 3: Learners Needing Attention -->
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-title">Learners Needing Attention</span>
          <div class="stat-icon-wrap icon-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-body">
          <span class="stat-value" :class="{ 'text-amber': learnersNeedingAttentionCount > 0 }">
            {{ learnersNeedingAttentionCount }}
          </span>
          <span class="stat-hint">
            {{ learnersNeedingAttentionCount > 0 ? 'Requires monitoring or follow-up' : 'All learners in good standing' }}
          </span>
        </div>
      </div>

      <!-- Card 4: Recorded Attendance Sessions -->
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-title">Recorded Sessions</span>
          <div class="stat-icon-wrap icon-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-body">
          <span class="stat-value">{{ recordedSessionsCount }}</span>
          <span class="stat-hint">
            {{ recordedSessionsCount > 0 ? 'Teacher attendance sessions recorded' : 'No attendance records available' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 3 & 4. Graphs Section (Side-by-side) -->
    <div class="dashboard-graphs-row">
      <!-- 3. Attendance Trend Graph (Line Chart) -->
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h2 class="chart-card-title">Attendance Trend</h2>
            <p class="chart-card-subtitle">Number of present learners across recorded sessions</p>
          </div>
        </div>

        <div class="chart-content-wrap">
          <!-- Empty state if no attendance data -->
          <div v-if="attendanceTrendPoints.length === 0" class="empty-state-box">
            <div class="empty-state-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <p class="empty-state-title">No attendance data available</p>
            <p class="empty-state-desc">Record attendance sessions to view trends over time.</p>
          </div>

          <!-- Line Chart SVG Rendering -->
          <div v-else class="svg-line-chart-container">
            <svg viewBox="0 0 540 240" class="svg-line-chart" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#2563eb" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#2563eb" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <!-- Horizontal Grid Lines & Y-axis labels -->
              <g class="chart-grid">
                <line x1="45" y1="20" x2="520" y2="20" stroke="#e2e8f0" stroke-dasharray="3 3" />
                <text x="35" y="24" text-anchor="end" class="chart-axis-lbl">{{ trendMaxY }}</text>

                <line x1="45" y1="80" x2="520" y2="80" stroke="#e2e8f0" stroke-dasharray="3 3" />
                <text x="35" y="84" text-anchor="end" class="chart-axis-lbl">{{ Math.round((trendMaxY * 2) / 3) }}</text>

                <line x1="45" y1="140" x2="520" y2="140" stroke="#e2e8f0" stroke-dasharray="3 3" />
                <text x="35" y="144" text-anchor="end" class="chart-axis-lbl">{{ Math.round(trendMaxY / 3) }}</text>

                <line x1="45" y1="200" x2="520" y2="200" stroke="#cbd5e1" stroke-width="1.25" />
                <text x="35" y="204" text-anchor="end" class="chart-axis-lbl">0</text>
              </g>

              <!-- Area Fill under the line -->
              <polygon
                v-if="trendAreaPointsStr"
                :points="trendAreaPointsStr"
                fill="url(#trendGradient)"
              />

              <!-- Trend Polyline -->
              <polyline
                v-if="trendPolylineStr"
                :points="trendPolylineStr"
                fill="none"
                stroke="#2563eb"
                stroke-width="2.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Data Point Circles & Tooltips -->
              <g v-for="(pt, idx) in trendSvgPoints" :key="idx">
                <circle
                  :cx="pt.x"
                  :cy="pt.y"
                  r="5"
                  fill="#ffffff"
                  stroke="#2563eb"
                  stroke-width="2.5"
                  class="chart-dot"
                >
                  <title>{{ pt.label }}: {{ pt.count }} Present Learners</title>
                </circle>
                <!-- Point Value Label -->
                <text
                  :x="pt.x"
                  :y="pt.y - 10"
                  text-anchor="middle"
                  class="chart-point-lbl"
                >
                  {{ pt.count }}
                </text>
                <!-- X-Axis Date Label -->
                <text
                  :x="pt.x"
                  y="218"
                  text-anchor="middle"
                  class="chart-x-lbl"
                >
                  {{ pt.label }}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- 4. Learner Progress Graph (Bar Chart) -->
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h2 class="chart-card-title">Learner Progress Overview</h2>
            <p class="chart-card-subtitle">Distribution by progress status</p>
          </div>
        </div>

        <div class="chart-content-wrap">
          <!-- Empty state if no learners -->
          <div v-if="!hasProgressData" class="empty-state-box">
            <div class="empty-state-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <p class="empty-state-title">No learner progress data available</p>
            <p class="empty-state-desc">Assign learners to view their progress overview.</p>
          </div>

          <!-- Vertical Bar Chart SVG Rendering -->
          <div v-else class="svg-bar-chart-container">
            <svg viewBox="0 0 540 240" class="svg-bar-chart" preserveAspectRatio="none">
              <defs>
                <linearGradient
                  v-for="bar in progressBarsData"
                  :id="`barGrad_${bar.id}`"
                  :key="bar.id"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" :stop-color="bar.gradientStart" />
                  <stop offset="100%" :stop-color="bar.gradientEnd" />
                </linearGradient>
              </defs>

              <!-- Horizontal Grid Lines & Y-axis labels (Y-axis: Number of Learners) -->
              <g class="chart-grid">
                <!-- Y-axis Label -->
                <text x="18" y="16" class="chart-axis-title">Learners</text>

                <g v-for="(grid, gIdx) in progressYGridLines" :key="gIdx">
                  <line
                    x1="45"
                    :y1="grid.y"
                    x2="520"
                    :y2="grid.y"
                    :stroke="grid.y === 195 ? '#cbd5e1' : '#e2e8f0'"
                    :stroke-width="grid.y === 195 ? 1.5 : 1"
                    :stroke-dasharray="grid.y === 195 ? 'none' : '3 3'"
                  />
                  <text x="36" :y="grid.y + 4" text-anchor="end" class="chart-axis-lbl">
                    {{ grid.val }}
                  </text>
                </g>
              </g>

              <!-- Vertical Bars Group -->
              <g class="chart-bars-group">
                <g v-for="bar in progressBarsData" :key="bar.id" class="chart-bar-col">
                  <!-- Bar background slot subtle hover guide -->
                  <rect
                    :x="bar.cx - 36"
                    y="25"
                    width="72"
                    height="170"
                    fill="transparent"
                    class="bar-slot-hover"
                  >
                    <title>{{ bar.name }}: {{ bar.count }} Learner{{ bar.count === 1 ? '' : 's' }} ({{ bar.percentage }}%)</title>
                  </rect>

                  <!-- Vertical Bar -->
                  <rect
                    v-if="bar.barHeight > 0"
                    :x="bar.x"
                    :y="bar.y"
                    :width="bar.barWidth"
                    :height="bar.barHeight"
                    :fill="`url(#barGrad_${bar.id})`"
                    rx="5"
                    ry="5"
                    class="chart-bar-rect"
                  >
                    <title>{{ bar.name }}: {{ bar.count }} Learner{{ bar.count === 1 ? '' : 's' }} ({{ bar.percentage }}%)</title>
                  </rect>

                  <!-- 0-height baseline tick indicator when count is 0 -->
                  <rect
                    v-else
                    :x="bar.x"
                    :y="193"
                    :width="bar.barWidth"
                    height="2"
                    :fill="bar.color"
                    opacity="0.35"
                    rx="1"
                  >
                    <title>{{ bar.name }}: 0 Learners (0%)</title>
                  </rect>

                  <!-- Number / Value on each bar -->
                  <text
                    :x="bar.cx"
                    :y="bar.valueY"
                    text-anchor="middle"
                    class="chart-bar-value-lbl"
                    :class="{ 'value-zero': bar.count === 0 }"
                  >
                    {{ bar.count }}
                  </text>

                  <!-- X-Axis Progress Status Category Label -->
                  <text
                    :x="bar.cx"
                    y="213"
                    text-anchor="middle"
                    class="chart-x-lbl"
                  >
                    {{ bar.name }}
                  </text>

                  <!-- X-Axis Percentage Sub-Label -->
                  <text
                    :x="bar.cx"
                    y="228"
                    text-anchor="middle"
                    class="chart-x-sublbl"
                  >
                    {{ bar.percentage }}%
                  </text>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Learner Monitoring Table -->
    <div class="section-card">
      <div class="section-card-header">
        <div>
          <h2 class="section-title">Learner Monitoring</h2>
          <p class="section-subtitle">Real-time attendance rate and assessment status for your assigned learners</p>
        </div>
        <router-link to="/dashboard/learners" class="btn-view-all">
          <span>View All Learners</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </router-link>
      </div>

      <div class="table-container">
        <!-- Empty State if no learners -->
        <div v-if="assignedLearners.length === 0" class="empty-state-box">
          <div class="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <p class="empty-state-title">No learner records available</p>
          <p class="empty-state-desc">There are no learners currently assigned to your account.</p>
        </div>

        <table v-else class="portal-table">
          <thead>
            <tr>
              <th>Learner Name</th>
              <th>Program Level</th>
              <th>Learning Center</th>
              <th style="text-align: center;">Attendance Rate</th>
              <th style="text-align: center;">Assessment Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in assignedLearners" :key="l.id">
              <td class="cell-primary">
                <div class="cell-name-box">
                  <span class="learner-display-name">{{ l.name }}</span>
                  <span v-if="l.lrn" class="learner-lrn-text">LRN: {{ l.lrn }}</span>
                </div>
              </td>
              <td>
                <span class="level-badge" :class="l.programLevel === 'A&E Elementary' ? 'level-elem' : 'level-jhs'">
                  {{ l.programLevel }}
                </span>
              </td>
              <td>{{ l.learningCenter || assignedCenterDisplay }}</td>
              <td style="text-align: center;">
                <span v-if="l.attendanceRate !== null" class="rate-badge" :class="getRateBadgeClass(l.attendanceRate)">
                  {{ l.attendanceRate }}%
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td style="text-align: center;">
                <span class="status-pill" :class="getStatusPillClass(l.assessmentStatus)">
                  {{ l.assessmentStatus }}
                </span>
              </td>
              <td style="text-align: right;">
                <router-link :to="`/dashboard/learners/${l.id}`" class="btn-table-action">
                  View Learner Profile
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 6 & 7. Recent Attendance & Announcements Grid -->
    <div class="bottom-split-grid">
      <!-- 6. Recent Attendance Section -->
      <div class="section-card">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">Recent Attendance</h2>
            <p class="section-subtitle">Latest attendance sessions recorded</p>
          </div>
          <router-link to="/dashboard/attendance/history" class="btn-view-all">
            <span>View History</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </router-link>
        </div>

        <div class="table-container">
          <!-- Empty State -->
          <div v-if="recentAttendanceSessions.length === 0" class="empty-state-box">
            <div class="empty-state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p class="empty-state-title">No attendance records available</p>
            <p class="empty-state-desc">Recorded sessions will be listed here.</p>
          </div>

          <table v-else class="portal-table table-compact">
            <thead>
              <tr>
                <th>Date</th>
                <th>Program Level</th>
                <th>Learning Center</th>
                <th style="text-align: center;">Present</th>
                <th style="text-align: center;">Absent</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sess in recentAttendanceSessions" :key="sess.id">
                <td class="font-medium">{{ sess.displayDate }}</td>
                <td>
                  <span class="level-badge-sm" :class="sess.programLevel === 'A&E Elementary' ? 'level-elem' : 'level-jhs'">
                    {{ sess.programLevel }}
                  </span>
                </td>
                <td>{{ sess.learningCenter }}</td>
                <td style="text-align: center;">
                  <span class="badge-present">{{ sess.presentCount }}</span>
                </td>
                <td style="text-align: center;">
                  <span class="badge-absent">{{ sess.absentCount }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 7. Announcements Section -->
      <div class="section-card">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">Latest Announcements</h2>
            <p class="section-subtitle">Notices from ALS Coordinator, Admin, and Community Learning Center</p>
          </div>
          <router-link to="/dashboard/announcements" class="btn-view-all">
            <span>All Announcements</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </router-link>
        </div>

        <div class="announcements-container">
          <!-- Empty State -->
          <div v-if="relevantAnnouncements.length === 0" class="empty-state-box">
            <div class="empty-state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p class="empty-state-title">No announcements available</p>
            <p class="empty-state-desc">New announcements from coordinators and administrators will appear here.</p>
          </div>

          <div v-else class="announcements-list">
            <div
              v-for="item in relevantAnnouncements"
              :key="item.id"
              class="announcement-item"
            >
              <div class="announcement-item-top">
                <h4 class="announcement-item-title">{{ item.title }}</h4>
                <span class="announcement-date">{{ item.datePosted || item.date }}</span>
              </div>
              <p class="announcement-item-body">{{ item.message || item.content }}</p>
              <div class="announcement-item-meta">
                <span class="announcement-author-tag">
                  From: {{ item.author || item.createdBy || 'Administrator' }}
                </span>
                <span v-if="item.learningCenter" class="announcement-clc-tag">
                  {{ item.learningCenter }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getAssignedLearners } from '../api/learners.js';
import { getAttendanceRecords } from '../api/attendance.js';
import { useAf2Records } from '../composables/useAf2Records.js';
import { getAnnouncements } from '../api/announcements.js';

// Teacher session context
const {
  currentTeacher,
  teacherName,
  teacherPosition,
  teacherId,
  assignedCenters,
  assignedProgramLevel,
} = useTeacherSession();

const { getRecordsForLearner } = useAf2Records();

// Dynamic state variables — STRICTLY zero mock or sample data!
const learnersRaw = ref([]);
const loadingLearners = ref(false);
const attendanceSessions = ref([]);
const announcementsRaw = ref([]);
const loadingAnnouncements = ref(false);

// 1. Welcome Section Info
const teacherFullName = computed(() => {
  return teacherName.value || currentTeacher.value?.fullName || 'ALS Teacher';
});

const assignedCenterDisplay = computed(() => {
  if (assignedCenters.value && assignedCenters.value.length > 0) {
    return assignedCenters.value.map((c) => c.name).join(', ');
  }
  if (currentTeacher.value?.learningCenter && currentTeacher.value.learningCenter !== '—') {
    return currentTeacher.value.learningCenter;
  }
  return '—';
});

const handledProgramLevelDisplay = computed(() => {
  const lvl = assignedProgramLevel.value;
  if (!lvl || lvl === 'Both' || lvl.toLowerCase().includes('both')) {
    return 'A&E Elementary / A&E Junior High School';
  }
  return lvl;
});

// Helper: format ISO date to readable string "Sept 1" or "Sept 1, 2026"
function formatDisplayDate(dateStr, includeYear = true) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(m, 10) - 1] || m;
  const dayNum = parseInt(d, 10);
  return includeYear ? `${monthName} ${dayNum}, ${y}` : `${monthName} ${dayNum}`;
}

// 2. Data Loaders (Strictly authenticated teacher-scoped)
async function loadLearners() {
  const tid = teacherId.value || currentTeacher.value?.id;
  if (!tid) {
    learnersRaw.value = [];
    return;
  }
  loadingLearners.value = true;
  try {
    const { data } = await getAssignedLearners({ teacherId: tid });
    learnersRaw.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load assigned learners:', err);
    learnersRaw.value = [];
  } finally {
    loadingLearners.value = false;
  }
}

async function loadAttendanceSessions() {
  const tid = teacherId.value || currentTeacher.value?.id;
  if (!tid) {
    attendanceSessions.value = [];
    return;
  }

  try {
    // 1. Fetch live attendance records from backend API
    const { data } = await getAttendanceRecords({ teacherId: tid });
    const records = Array.isArray(data) ? data : [];

    // 2. Also check teacher-scoped local storage sessions
    let localSessions = [];
    try {
      const raw = localStorage.getItem(`als_attendance_sessions_${tid}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localSessions = parsed;
      }
    } catch {
      // ignore
    }

    // 3. Build session groups from backend records
    const sessionMap = new Map();
    for (const r of records) {
      const sessionKey = `${r.date || r.sessionDate}_${r.learningCenterId || r.learningCenter}_${r.level || ''}`;
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, {
          id: `sess_db_${sessionKey}`,
          date: r.date || r.sessionDate,
          learningCenter: r.learningCenter,
          programLevel: r.level || 'A&E Elementary',
          teacherId: tid,
          learners: [],
        });
      }
      sessionMap.get(sessionKey).learners.push({
        id: r.learnerId,
        name: r.learnerName,
        status: (r.status || 'PRESENT') === 'PRESENT' ? 'Present' : 'Absent',
        remarks: r.remarks,
      });
    }

    // Merge backend sessions with teacher-scoped local sessions (deduplicating by date+center+level)
    const combined = [...sessionMap.values()];
    for (const ls of localSessions) {
      const key = `${ls.date}_${ls.learningCenter}_${ls.programLevel || ''}`;
      if (!sessionMap.has(key)) {
        combined.push(ls);
      }
    }

    attendanceSessions.value = combined;
  } catch (err) {
    console.warn('Could not load attendance records from API:', err);
    try {
      const raw = localStorage.getItem(`als_attendance_sessions_${tid}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          attendanceSessions.value = parsed;
          return;
        }
      }
    } catch {
      // ignore
    }
    attendanceSessions.value = [];
  }
}

watch(teacherId, (newTid) => {
  if (newTid) {
    loadLearners();
    loadAttendanceSessions();
    loadAnnouncementsData();
  } else {
    learnersRaw.value = [];
    attendanceSessions.value = [];
  }
});

async function loadAnnouncementsData() {
  loadingAnnouncements.value = true;
  try {
    const tid = teacherId.value;
    const { data } = await getAnnouncements(tid ? { portal: 'teacher', teacherId: tid } : { portal: 'teacher' });
    announcementsRaw.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Could not load announcements:', err);
    announcementsRaw.value = [];
  } finally {
    loadingAnnouncements.value = false;
  }
}

// Summary Card 1: Total Learners
const assignedLearnersCount = computed(() => learnersRaw.value.length);

// Summary Card 4: Recorded Attendance Sessions
const recordedSessionsCount = computed(() => attendanceSessions.value.length);

// Calculate totals across all teacher attendance records
const totalAttendanceStats = computed(() => {
  let totalRecords = 0;
  let presentRecords = 0;

  for (const sess of attendanceSessions.value) {
    if (Array.isArray(sess.learners)) {
      totalRecords += sess.learners.length;
      presentRecords += sess.learners.filter((l) => l.status === 'Present').length;
    }
  }

  return {
    total: totalRecords,
    present: presentRecords,
    rate: totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : '0',
  };
});

const totalAttendanceRecordsCount = computed(() => totalAttendanceStats.value.total);
const presentAttendanceRecordsCount = computed(() => totalAttendanceStats.value.present);

// Summary Card 2: Community Learning Center Attendance Rate
const clcAttendanceRate = computed(() => totalAttendanceStats.value.rate);

// Process individual learner records: Attendance Rate, Absences, Assessment Status, Attention Need
const assignedLearners = computed(() => {
  return learnersRaw.value.map((l) => {
    const learnerName = (l.name || `${l.firstName || ''} ${l.lastName || ''}`).trim() || 'Learner';
    const learnerId = l.id;

    // 1. Calculate Attendance from all sessions
    let learnerTotalSessions = 0;
    let learnerPresentSessions = 0;
    let learnerAbsentSessions = 0;

    for (const sess of attendanceSessions.value) {
      if (Array.isArray(sess.learners)) {
        const match = sess.learners.find(
          (sl) => String(sl.id) === String(learnerId) || sl.name.trim().toLowerCase() === learnerName.toLowerCase()
        );
        if (match) {
          learnerTotalSessions++;
          if (match.status === 'Present') {
            learnerPresentSessions++;
          } else if (match.status === 'Absent') {
            learnerAbsentSessions++;
          }
        }
      }
    }

    const attendanceRate =
      learnerTotalSessions > 0
        ? Math.round((learnerPresentSessions / learnerTotalSessions) * 100)
        : null;

    // 2. Determine Assessment & Progress Status from AF2 records, DB progress, & learner progress
    const af2List = getRecordsForLearner({ learnerId, learnerName });
    let assessmentStatus = 'Not Started';

    const hasNotMastered =
      af2List.some((r) => (r.assessment || '').toLowerCase().includes('not')) ||
      (Array.isArray(l.progressRecords) && l.progressRecords.some((pr) => pr.masteryStatus === 'NOT_MASTERED'));

    const hasMastered =
      af2List.some((r) => (r.assessment || '').toLowerCase() === 'mastered') ||
      (Array.isArray(l.progressRecords) && l.progressRecords.some((pr) => pr.masteryStatus === 'MASTERED'));

    const hasInProgress =
      af2List.some((r) => (r.assessment || '').toLowerCase().includes('progress')) ||
      (Array.isArray(l.progressRecords) && l.progressRecords.some((pr) => pr.status === 'IN_PROGRESS' || pr.completedPages > 0));

    if (hasNotMastered) {
      assessmentStatus = 'Not Mastered';
    } else if (hasMastered && (l.progress == null || l.progress >= 100 || !hasInProgress)) {
      assessmentStatus = 'Mastered';
    } else if (hasInProgress || (typeof l.progress === 'number' && l.progress > 0 && l.progress < 100)) {
      assessmentStatus = 'In Progress';
    } else if (typeof l.progress === 'number' && l.progress >= 100) {
      assessmentStatus = 'Mastered';
    } else if (l.assessmentStatus && ['Mastered', 'In Progress', 'Not Mastered', 'Not Started'].includes(l.assessmentStatus)) {
      assessmentStatus = l.assessmentStatus;
    } else {
      assessmentStatus = 'Not Started';
    }

    // 3. Needs Attention logic:
    // - Low attendance rate (< 75%)
    // - Multiple absences (>= 2 absences)
    // - Not Mastered assessment status
    const needsAttention =
      (attendanceRate !== null && attendanceRate < 75) ||
      learnerAbsentSessions >= 2 ||
      assessmentStatus === 'Not Mastered';

    return {
      id: learnerId,
      name: learnerName,
      lrn: l.lrn || '',
      programLevel: l.level || l.programLevel || 'A&E Elementary',
      learningCenter: l.learningCenter || (l.center ? l.center.name : ''),
      attendanceRate,
      absentCount: learnerAbsentSessions,
      assessmentStatus,
      needsAttention,
      progress: typeof l.progress === 'number' ? l.progress : 0,
    };
  });
});

// Summary Card 3: Learners Needing Attention
const learnersNeedingAttentionCount = computed(() => {
  return assignedLearners.value.filter((l) => l.needsAttention).length;
});

// 3. Attendance Trend Graph Data
const attendanceTrendPoints = computed(() => {
  if (attendanceSessions.value.length === 0) return [];

  // Sort sessions chronologically ascending
  const sorted = [...attendanceSessions.value].sort((a, b) => {
    return new Date(a.date || 0) - new Date(b.date || 0);
  });

  return sorted.map((s) => {
    const presentCount = Array.isArray(s.learners)
      ? s.learners.filter((l) => l.status === 'Present').length
      : 0;
    return {
      date: s.date,
      label: formatDisplayDate(s.date, false),
      count: presentCount,
    };
  });
});

const trendMaxY = computed(() => {
  if (attendanceTrendPoints.value.length === 0) return 10;
  const max = Math.max(...attendanceTrendPoints.value.map((p) => p.count), 5);
  return Math.ceil(max / 5) * 5;
});

const trendSvgPoints = computed(() => {
  const pts = attendanceTrendPoints.value;
  if (pts.length === 0) return [];

  const startX = 60;
  const endX = 500;
  const bottomY = 200;
  const topY = 30;
  const maxY = trendMaxY.value || 10;

  const stepX = pts.length > 1 ? (endX - startX) / (pts.length - 1) : 0;

  return pts.map((p, idx) => {
    const x = pts.length === 1 ? (startX + endX) / 2 : startX + idx * stepX;
    const yRatio = Math.min(1, Math.max(0, p.count / maxY));
    const y = bottomY - yRatio * (bottomY - topY);
    return {
      ...p,
      x: Math.round(x),
      y: Math.round(y),
    };
  });
});

const trendPolylineStr = computed(() => {
  return trendSvgPoints.value.map((pt) => `${pt.x},${pt.y}`).join(' ');
});

const trendAreaPointsStr = computed(() => {
  const pts = trendSvgPoints.value;
  if (pts.length === 0) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  const linePoints = pts.map((pt) => `${pt.x},${pt.y}`).join(' ');
  return `${first.x},200 ${linePoints} ${last.x},200`;
});

// 4. Learner Progress Graph Data (Vertical Bar Chart - 4 Statuses)
const progressCounts = computed(() => {
  let mastered = 0;
  let inProgress = 0;
  let notMastered = 0;
  let notStarted = 0;

  for (const l of assignedLearners.value) {
    if (l.assessmentStatus === 'Mastered') {
      mastered++;
    } else if (l.assessmentStatus === 'In Progress') {
      inProgress++;
    } else if (l.assessmentStatus === 'Not Mastered') {
      notMastered++;
    } else {
      notStarted++;
    }
  }

  return { mastered, inProgress, notMastered, notStarted };
});

const hasProgressData = computed(() => {
  return assignedLearners.value.length > 0;
});

const progressCategories = computed(() => {
  const total = assignedLearners.value.length;

  return [
    {
      id: 'mastered',
      name: 'Mastered',
      count: progressCounts.value.mastered,
      percentage: total > 0 ? Math.round((progressCounts.value.mastered / total) * 100) : 0,
      color: '#16a34a', // Emerald Green
      gradientStart: '#22c55e',
      gradientEnd: '#16a34a',
    },
    {
      id: 'in-progress',
      name: 'In Progress',
      count: progressCounts.value.inProgress,
      percentage: total > 0 ? Math.round((progressCounts.value.inProgress / total) * 100) : 0,
      color: '#2563eb', // Royal Blue
      gradientStart: '#3b82f6',
      gradientEnd: '#2563eb',
    },
    {
      id: 'not-mastered',
      name: 'Not Mastered',
      count: progressCounts.value.notMastered,
      percentage: total > 0 ? Math.round((progressCounts.value.notMastered / total) * 100) : 0,
      color: '#dc2626', // Red
      gradientStart: '#ef4444',
      gradientEnd: '#dc2626',
    },
    {
      id: 'not-started',
      name: 'Not Started',
      count: progressCounts.value.notStarted,
      percentage: total > 0 ? Math.round((progressCounts.value.notStarted / total) * 100) : 0,
      color: '#64748b', // Slate Gray
      gradientStart: '#94a3b8',
      gradientEnd: '#64748b',
    },
  ];
});

const progressMaxY = computed(() => {
  const counts = [
    progressCounts.value.mastered,
    progressCounts.value.inProgress,
    progressCounts.value.notMastered,
    progressCounts.value.notStarted,
  ];
  const max = Math.max(...counts, 0);
  if (max === 0) return 4;
  if (max <= 4) return 4;
  if (max <= 8) return 8;
  if (max <= 12) return 12;
  return Math.ceil(max / 5) * 5;
});

const progressYGridLines = computed(() => {
  const maxY = progressMaxY.value;
  const topY = 25;
  const bottomY = 195;
  const lines = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = Math.round((maxY / steps) * (steps - i));
    const y = topY + (i / steps) * (bottomY - topY);
    lines.push({ val, y: Math.round(y) });
  }
  return lines;
});

const progressBarsData = computed(() => {
  const cats = progressCategories.value;
  const maxY = progressMaxY.value;

  const startX = 55;
  const endX = 515;
  const availableWidth = endX - startX;
  const slotWidth = availableWidth / cats.length;
  const barWidth = 54;
  const baselineY = 195;
  const topY = 32;
  const plottableHeight = baselineY - topY;

  return cats.map((cat, idx) => {
    const cx = Math.round(startX + idx * slotWidth + slotWidth / 2);
    const x = Math.round(cx - barWidth / 2);
    const ratio = maxY > 0 ? Math.min(1, Math.max(0, cat.count / maxY)) : 0;
    const barHeight = cat.count > 0 ? Math.max(8, Math.round(ratio * plottableHeight)) : 0;
    const y = baselineY - barHeight;
    const valueY = cat.count > 0 ? Math.max(16, y - 7) : baselineY - 7;

    return {
      ...cat,
      cx,
      x,
      y,
      barWidth,
      barHeight,
      valueY,
    };
  });
});

// 6. Recent Attendance Section (Latest 5 records, descending date)
const recentAttendanceSessions = computed(() => {
  if (attendanceSessions.value.length === 0) return [];

  const copy = [...attendanceSessions.value].sort((a, b) => {
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  return copy.slice(0, 5).map((sess) => {
    const presentCount = Array.isArray(sess.learners)
      ? sess.learners.filter((l) => l.status === 'Present').length
      : 0;
    const absentCount = Array.isArray(sess.learners)
      ? sess.learners.filter((l) => l.status === 'Absent').length
      : 0;

    return {
      id: sess.id,
      date: sess.date,
      displayDate: formatDisplayDate(sess.date, true),
      programLevel: sess.programLevel || 'A&E Elementary',
      learningCenter: sess.learningCenter || assignedCenterDisplay.value,
      presentCount,
      absentCount,
    };
  });
});

// 7. Announcements Section (Filtered for relevant notices by backend)
const relevantAnnouncements = computed(() => {
  if (announcementsRaw.value.length === 0) return [];
  return announcementsRaw.value.slice(0, 4);
});

// Table badge helpers
function getRateBadgeClass(rate) {
  if (rate >= 85) return 'badge-rate-high';
  if (rate >= 75) return 'badge-rate-med';
  return 'badge-rate-low';
}

function getStatusPillClass(status) {
  if (status === 'Mastered') return 'status-mastered';
  if (status === 'Not Mastered') return 'status-not-mastered';
  if (status === 'Not Started') return 'status-not-started';
  return 'status-in-progress';
}

onMounted(() => {
  loadLearners();
  loadAttendanceSessions();
  loadAnnouncementsData();
});
</script>

<style scoped>
.dashboard-page {
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

/* 1. Welcome Section & Quick Actions Card */
.welcome-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.5rem;
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
}

.quick-act-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.95rem;
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

/* 2. Summary Cards Grid */
.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.75rem;
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
  color: #64748b;
  line-height: 1.35;
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
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.stat-value.text-muted {
  color: #94a3b8;
}

.stat-value.text-amber {
  color: #d97706;
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

/* 3 & 4. Graphs Section */
.dashboard-graphs-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.75rem;
}

.chart-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.35rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
}

.chart-card-header {
  margin-bottom: 1.25rem;
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

.chart-content-wrap {
  flex: 1;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.svg-line-chart-container {
  width: 100%;
  height: 240px;
}

.svg-line-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chart-axis-lbl {
  font-size: 10px;
  fill: #94a3b8;
  font-family: inherit;
}

.chart-x-lbl {
  font-size: 10px;
  fill: #64748b;
  font-weight: 600;
  font-family: inherit;
}

.chart-point-lbl {
  font-size: 11px;
  fill: #1d4ed8;
  font-weight: 700;
  font-family: inherit;
}

.chart-dot {
  transition: r 0.15s ease;
  cursor: pointer;
}

.chart-dot:hover {
  r: 7;
}

/* 4. Vertical Bar Chart — Learner Progress Overview */
.svg-bar-chart-container {
  width: 100%;
  height: 240px;
}

.svg-bar-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chart-axis-title {
  font-size: 10px;
  fill: #64748b;
  font-weight: 600;
  font-family: inherit;
}

.chart-bar-rect {
  transition: transform 0.2s ease, filter 0.2s ease, height 0.3s ease, y 0.3s ease;
  cursor: pointer;
}

.chart-bar-col:hover .chart-bar-rect {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

.chart-bar-value-lbl {
  font-size: 12px;
  font-weight: 700;
  fill: #0f172a;
  font-family: inherit;
}

.chart-bar-value-lbl.value-zero {
  fill: #94a3b8;
  font-weight: 600;
}

.chart-x-sublbl {
  font-size: 9px;
  fill: #94a3b8;
  font-family: inherit;
  font-weight: 500;
}

.bar-slot-hover {
  cursor: pointer;
  transition: fill 0.15s ease;
}

.bar-slot-hover:hover {
  fill: rgba(241, 245, 249, 0.65);
}

/* 5, 6, 7. Section Cards & Tables */
.section-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.35rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  margin-bottom: 1.75rem;
}

.section-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.15rem;
  gap: 1rem;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.2rem 0;
}

.section-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

.btn-view-all {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
  transition: all 0.15s ease;
}

.btn-view-all:hover {
  background: #dbeafe;
  color: #1d4ed8;
}

.table-container {
  overflow-x: auto;
}

.portal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

.portal-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 0.775rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  border-top: 1px solid #f1f5f9;
}

.portal-table td {
  padding: 0.85rem 1rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.portal-table tr:hover td {
  background: #f8fafc;
}

.table-compact th {
  padding: 0.65rem 0.85rem;
}

.table-compact td {
  padding: 0.65rem 0.85rem;
}

.cell-name-box {
  display: flex;
  flex-direction: column;
}

.learner-display-name {
  font-weight: 600;
  color: #0f172a;
}

.learner-lrn-text {
  font-size: 0.75rem;
  color: #64748b;
}

.level-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.level-badge-sm {
  display: inline-block;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-size: 0.725rem;
  font-weight: 600;
}

.level-elem {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.level-jhs {
  background: #faf5ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}

.rate-badge {
  display: inline-block;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 700;
}

.badge-rate-high {
  background: #ecfdf5;
  color: #047857;
}

.badge-rate-med {
  background: #fffbeb;
  color: #b45309;
}

.badge-rate-low {
  background: #fef2f2;
  color: #b91c1c;
}

.status-pill {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-mastered {
  background: #dcfce7;
  color: #15803d;
}

.status-in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-not-mastered {
  background: #fee2e2;
  color: #991b1b;
}

.status-not-started {
  background: #f1f5f9;
  color: #475569;
}

.badge-present {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.775rem;
  font-weight: 700;
  background: #ecfdf5;
  color: #047857;
}

.badge-absent {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.775rem;
  font-weight: 700;
  background: #fef2f2;
  color: #b91c1c;
}

.btn-table-action {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  background: #ffffff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-table-action:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

/* Bottom Split Grid for Recent Attendance & Announcements */
.bottom-split-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.25rem;
}

.bottom-split-grid .section-card {
  margin-bottom: 0;
}

/* Announcements List */
.announcements-container {
  min-height: 220px;
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.announcement-item {
  padding: 0.95rem;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: background 0.15s ease;
}

.announcement-item:hover {
  background: #f1f5f9;
}

.announcement-item-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.announcement-item-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.announcement-date {
  font-size: 0.75rem;
  color: #94a3b8;
  white-space: nowrap;
}

.announcement-item-body {
  font-size: 0.8125rem;
  color: #475569;
  line-height: 1.45;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.announcement-item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.announcement-author-tag {
  font-size: 0.725rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
}

.announcement-clc-tag {
  font-size: 0.725rem;
  color: #64748b;
}

/* Universal Empty State Box */
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
  min-height: 160px;
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
  .bottom-split-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .welcome-header-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .quick-actions-box {
    align-items: flex-start;
    width: 100%;
  }
  .quick-actions-buttons {
    flex-wrap: wrap;
    width: 100%;
  }
  .quick-act-btn {
    flex: 1;
    justify-content: center;
  }
  .dashboard-graphs-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .summary-cards-grid {
    grid-template-columns: 1fr;
  }
  .welcome-meta-list {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>

<template>
  <div class="page-container attendance-summary-view">
    <!-- Standardized Page Header & Breadcrumb (no-print) -->
    <ReportsPageHeader
      title="Attendance Summary"
      description="Monitor attendance records across Community Learning Centers."
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="isRefreshing"
          @click="handleRefresh"
        >
          <span v-if="isRefreshing" class="btn-spinner" style="border-top-color: #475569; width: 14px; height: 14px; border-width: 2px;"></span>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh' }}</span>
        </button>
      </template>
    </ReportsPageHeader>

    <!-- Summary Stats Cards (Single Horizontal Row) -->
    <div class="report-stats-grid no-print">
      <!-- Card 1: Total Learners -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <span class="report-card-label">Total Learners</span>
        <span class="report-card-value">{{ dashboardTotalLearners }}</span>
        <span class="report-card-desc">Learners in current filter scope</span>
      </div>

      <!-- Card 2: Total Attendance Sessions -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span class="report-card-label">Total Attendance Sessions</span>
        <span class="report-card-value">{{ dashboardTotalSessions }}</span>
        <span class="report-card-desc">Recorded attendance sessions</span>
      </div>

      <!-- Card 3: District Attendance Rate -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <span class="report-card-label">Attendance Rate</span>
        <span class="report-card-value text-green">{{ dashboardAttendanceRate }}%</span>
        <span class="report-card-desc">
          {{ selectedCenter ? `Based on ${selectedCenter} records` : 'District-wide attendance percentage' }}
        </span>
      </div>

      <!-- Card 4: Total Present Records -->
      <div class="report-summary-card">
        <div class="report-card-icon stat-icon-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span class="report-card-label">Total Present Records</span>
        <span class="report-card-value text-blue">{{ dashboardTotalPresent }}</span>
        <span class="report-card-desc">Total marked present</span>
      </div>
    </div>

    <!-- Filters Bar (Single Clean Horizontal Row Container) -->
    <div class="report-filter-bar no-print">
      <div class="filter-controls-row">
        <!-- 1. Learning Center (Widest dropdown) -->
        <div class="filter-field-col col-center">
          <label class="filter-label">Learning Center</label>
          <select v-model="selectedCenter" class="filter-select" @change="handleCenterChange">
            <option value="">All Learning Centers</option>
            <option v-for="c in learningCenters" :key="c.id" :value="c.name">
              {{ c.name }}
            </option>
          </select>
        </div>

        <!-- 2. ALS Level (Sufficient width) -->
        <div class="filter-field-col col-level">
          <label class="filter-label">ALS Level</label>
          <select v-model="selectedLevel" class="filter-select">
            <option value="">All ALS Levels</option>
            <option value="A&E Elementary">A&E Elementary</option>
            <option value="A&E Junior High">A&E Junior High</option>
          </select>
        </div>

        <!-- 3. From (Date input, equal width) -->
        <div class="filter-field-col col-date">
          <label class="filter-label">From</label>
          <input
            v-model="fromDate"
            type="date"
            class="filter-input"
            @change="dateError = ''"
          />
        </div>

        <!-- 4. To (Date input, equal width) -->
        <div class="filter-field-col col-date">
          <label class="filter-label">To</label>
          <input
            v-model="toDate"
            type="date"
            class="filter-input"
            @change="dateError = ''"
          />
        </div>

        <!-- 5. Clear Filters (Beside date inputs, no label, aligned baseline) -->
        <div class="filter-btn-col col-reset">
          <ClearFiltersButton @click="resetFilters" />
        </div>

        <!-- 6. Generate Report (Beside Reset Filters, no label, aligned baseline) -->
        <div class="filter-btn-col col-generate">
          <button
            type="button"
            class="generate-report-btn"
            :disabled="loadingReport"
            @click="handleGenerateReport"
          >
            <span v-if="loadingReport" class="btn-spinner"></span>
            <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>{{ loadingReport ? 'Generating...' : 'Generate Report' }}</span>
          </button>
        </div>
      </div>

      <!-- Date Range Validation Error -->
      <div v-if="dateError" class="filter-error-text">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ dateError }}</span>
      </div>
    </div>

    <!-- Official Generated Report Output / Dedicated Print & PDF Section -->
    <div class="report-output-wrapper">
      <div id="report-content" ref="reportContentRef" class="report-paper-sheet attendance-report-sheet">
        <!-- Status Pill Banner (Standardized with AF2) -->
        <div class="report-status-banner print-hidden">
          <div v-if="!reportGenerated" class="status-pill status-blank">
            <span class="status-badge-dot"></span>
            <span class="status-badge-text">Blank Template Preview</span>
            <span class="status-badge-hint">— Select filters above and click Generate Report</span>
          </div>
          <div v-else-if="learnerAggregates.length === 0" class="status-pill status-empty">
            <span class="status-badge-dot empty"></span>
            <span class="status-badge-text">Report Generated</span>
            <span class="status-badge-hint">— No records found for the selected filters</span>
          </div>
          <div v-else class="status-pill status-ready">
            <span class="status-badge-dot success"></span>
            <span class="status-badge-text">Report Generated</span>
            <span class="status-badge-hint">— {{ learnerAggregates.length }} learner(s) loaded</span>
          </div>
        </div>

        <!-- Official Header with Logos -->
        <header class="report-official-header">
          <div class="header-logo left-logo-box">
            <img src="/logo.png" alt="DepEd ALS Seal" class="als-district-logo" />
          </div>

          <div class="header-title-box">
            <h2 class="official-title">Summary of Learner’s Attendance</h2>
          </div>

          <div class="header-logo right-logo-box">
            <img src="/als-logo.png" alt="ALS Logo" class="als-logo-image" />
          </div>
        </header>

        <!-- Attendance Summary Table Matching Attached Template -->
        <div class="table-responsive-wrapper attendance-table-container">
          <table class="als-report-table summary-attendance-table">
            <thead>
              <tr class="header-main-row">
                <th rowspan="2" class="col-no">No.</th>
                <th rowspan="2" class="col-name col-learner-name">
                  Learner's Name<br />
                  <span class="sub-header-label">(Last Name, First Name, Middle Name)</span>
                </th>
                <th rowspan="2" class="col-center col-learning-center">Learning Center</th>
                <th rowspan="2" class="col-level col-program-level">ALS Level</th>
                <th colspan="2" class="col-attendance-summary">Attendance Summary</th>
                <th rowspan="2" class="col-attendance-rate col-progress">Attendance Rate<br>(%)</th>
                <th rowspan="2" class="col-actions print-hidden">Actions</th>
              </tr>
              <tr class="header-sub-row">
                <th class="col-sub col-present">Present</th>
                <th class="col-sub col-absent">Absent</th>
              </tr>
            </thead>

            <!-- BLANK TEMPLATE PREVIEW BODY (Before Generate Report) -->
            <tbody v-if="!reportGenerated">
              <!-- Male Section Header -->
              <tr class="gender-section-header section-divider-row">
                <td colspan="8" class="section-divider-cell print-visible-span">Male</td>
              </tr>
              <!-- Blank rows for Male -->
              <tr v-for="n in 5" :key="'blank-male-' + n" class="blank-row empty-line-row">
                <td class="cell-center cell-no">&nbsp;</td>
                <td class="cell-name">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center print-hidden">&nbsp;</td>
              </tr>

              <!-- Female Section Header -->
              <tr class="gender-section-header section-divider-row">
                <td colspan="8" class="section-divider-cell print-visible-span">Female</td>
              </tr>
              <!-- Blank rows for Female -->
              <tr v-for="n in 5" :key="'blank-female-' + n" class="blank-row empty-line-row">
                <td class="cell-center cell-no">&nbsp;</td>
                <td class="cell-name">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center print-hidden">&nbsp;</td>
              </tr>
            </tbody>

            <!-- GENERATED REPORT BODY (After Generate Report) -->
            <tbody v-else>
              <!-- Empty State If Generated But 0 Records Found -->
              <tr v-if="learnerAggregates.length === 0" class="empty-notice-row print-hidden">
                <td colspan="8" class="cell-center empty-notice-cell">
                  <div class="empty-notice-content">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>No attendance records found for the selected filters.</span>
                  </div>
                </td>
              </tr>

              <!-- Male Section Header -->
              <tr class="gender-section-header section-divider-row">
                <td colspan="8" class="section-divider-cell print-visible-span">Male</td>
              </tr>

              <!-- Male Learners Rows -->
              <tr v-for="(item, idx) in maleLearners" :key="'male-' + (item.learnerId || idx)" class="data-row">
                <td class="cell-center cell-no">{{ idx + 1 }}.</td>
                <td class="cell-name">
                  <div class="learner-name-cell">
                    <button
                      type="button"
                      class="person-icon-btn btn-learner-person-icon no-print"
                      title="View"
                      aria-label="View Learner Information"
                      @click="openLearnerInfoModal(item.learnerObj || item)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </button>
                    <span class="learner-name-text">{{ item.learnerName }}</span>
                  </div>
                </td>
                <td class="cell-center">{{ item.learningCenter }}</td>
                <td class="cell-center cell-level">{{ item.level }}</td>
                <td class="cell-center cell-stat">{{ item.presentCount }}</td>
                <td class="cell-center cell-stat">{{ item.absentCount }}</td>
                <td class="cell-center cell-rate">
                  <div class="rate-stack">
                    <span class="rate-percentage">{{ item.rate }}%</span>
                    <span class="rate-sessions">(out of {{ item.totalSessions }} {{ item.totalSessions === 1 ? 'session' : 'sessions' }})</span>
                  </div>
                </td>
                <td class="cell-center cell-actions print-hidden">
                  <button
                    type="button"
                    class="btn-view-details no-print"
                    @click="openDetailsModal(item)"
                  >
                    View Details
                  </button>
                </td>
              </tr>

              <!-- Empty Male Grid Lines (Matching Attached Official Form) -->
              <tr v-for="n in emptyMaleRowsCount" :key="'empty-male-' + n" class="blank-row empty-line-row">
                <td class="cell-center cell-no"></td>
                <td class="cell-name"></td>
                <td class="cell-center"></td>
                <td class="cell-center cell-level"></td>
                <td class="cell-center cell-stat"></td>
                <td class="cell-center cell-stat"></td>
                <td class="cell-center cell-rate"></td>
                <td class="cell-center cell-actions print-hidden"></td>
              </tr>

              <!-- Female Section Header -->
              <tr class="gender-section-header section-divider-row">
                <td colspan="8" class="section-divider-cell print-visible-span">Female</td>
              </tr>

              <!-- Female Learners Rows -->
              <tr v-for="(item, idx) in femaleLearners" :key="'female-' + (item.learnerId || idx)" class="data-row">
                <td class="cell-center cell-no">{{ idx + 1 }}.</td>
                <td class="cell-name">
                  <div class="learner-name-cell">
                    <button
                      type="button"
                      class="person-icon-btn btn-learner-person-icon no-print"
                      title="View"
                      aria-label="View Learner Information"
                      @click="openLearnerInfoModal(item.learnerObj || item)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </button>
                    <span class="learner-name-text">{{ item.learnerName }}</span>
                  </div>
                </td>
                <td class="cell-center">{{ item.learningCenter }}</td>
                <td class="cell-center cell-level">{{ item.level }}</td>
                <td class="cell-center cell-stat">{{ item.presentCount }}</td>
                <td class="cell-center cell-stat">{{ item.absentCount }}</td>
                <td class="cell-center cell-rate">
                  <div class="rate-stack">
                    <span class="rate-percentage">{{ item.rate }}%</span>
                    <span class="rate-sessions">(out of {{ item.totalSessions }} {{ item.totalSessions === 1 ? 'session' : 'sessions' }})</span>
                  </div>
                </td>
                <td class="cell-center cell-actions print-hidden">
                  <button
                    type="button"
                    class="btn-view-details no-print"
                    @click="openDetailsModal(item)"
                  >
                    View Details
                  </button>
                </td>
              </tr>

              <!-- Empty Female Grid Lines (Matching Attached Official Form) -->
              <tr v-for="n in emptyFemaleRowsCount" :key="'empty-female-' + n" class="blank-row empty-line-row">
                <td class="cell-center cell-no"></td>
                <td class="cell-name"></td>
                <td class="cell-center"></td>
                <td class="cell-center cell-level"></td>
                <td class="cell-center cell-stat"></td>
                <td class="cell-center cell-stat"></td>
                <td class="cell-center cell-rate"></td>
                <td class="cell-center cell-actions print-hidden"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PRINT ACTION BUTTON (Below report table, no-print) -->
      <div id="pdf-action-section" class="pdf-action-container no-print print-hidden">
        <button
          type="button"
          class="btn-print-report"
          :disabled="!reportGenerated || learnerAggregates.length === 0"
          :title="!reportGenerated ? 'Please click Generate Report first' : (learnerAggregates.length === 0 ? 'No records to print' : 'Print this report')"
          @click="printReportDirectly"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>Print Report</span>
        </button>
      </div>
    </div>

    <!-- View Details Modal (Session-by-session history for learner) -->
    <div v-if="selectedLearnerForDetails" class="modal-overlay no-print" @click.self="selectedLearnerForDetails = null">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>{{ selectedLearnerForDetails.learnerName }}</h3>
            <p class="modal-subtitle">
              LRN: {{ selectedLearnerForDetails.lrn || '—' }} · {{ selectedLearnerForDetails.level }} · {{ selectedLearnerForDetails.learningCenter }}
            </p>
          </div>
          <button type="button" class="modal-close-btn" @click="selectedLearnerForDetails = null">&times;</button>
        </div>

        <div class="modal-stats-row">
          <div class="modal-mini-stat">
            <span class="label">Total Sessions</span>
            <span class="val font-mono">{{ selectedLearnerForDetails.totalSessions }}</span>
          </div>
          <div class="modal-mini-stat">
            <span class="label">Present</span>
            <span class="val font-mono text-green">{{ selectedLearnerForDetails.presentCount }}</span>
          </div>
          <div class="modal-mini-stat">
            <span class="label">Absent</span>
            <span class="val font-mono text-amber">{{ selectedLearnerForDetails.absentCount }}</span>
          </div>
          <div class="modal-mini-stat">
            <span class="label">Attendance Rate</span>
            <span class="val font-mono font-bold">{{ selectedLearnerForDetails.rate }}%</span>
          </div>
        </div>

        <div class="table-responsive" style="max-height: 380px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 32%;">Date</th>
                <th style="width: 28%;">Status</th>
                <th style="width: 40%;">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in selectedLearnerForDetails.logs" :key="log.id || log.date">
                <td class="font-mono text-sm" style="width: 32%;">{{ log.sessionDate || log.date || '—' }}</td>
                <td style="width: 28%;">
                  <span
                    class="badge"
                    :class="getStatusBadgeClass(log.status)"
                  >
                    {{ formatStatusLabel(log.status) }}
                  </span>
                </td>
                <td class="text-sm" style="width: 40%;">{{ log.teacherName || selectedLearnerForDetails.teacherName || '—' }}</td>
              </tr>
              <tr v-if="!selectedLearnerForDetails.logs || selectedLearnerForDetails.logs.length === 0">
                <td colspan="3" class="text-center text-muted" style="padding: 1.5rem;">No session records found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="selectedLearnerForDetails = null">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- View Learner Information Modal (Opened via 👤 icon beside learner name) -->
    <div v-if="showLearnerModal" class="modal-overlay no-print" @click.self="closeLearnerModal">
      <div class="modal" style="max-width: 580px; width: 90%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.1));">
        <div class="modal-header-fixed" style="border-bottom: 1px solid var(--color-border, #e2e8f0); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 class="modal-title" style="font-size: 1.2rem; font-weight: 700; color: var(--color-text, #1e293b); margin: 0;">Learner Information</h2>
            <p class="modal-subtitle" style="font-size: 0.85rem; color: var(--color-text-secondary, #64748b); margin: 4px 0 0 0;">Comprehensive student record details</p>
          </div>
          <button type="button" class="modal-close-btn" @click="closeLearnerModal" title="Close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body-scrollable" style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
          <div v-if="loadingLearnerInfo" class="modal-loading-state" style="padding: 2.5rem 1rem; text-align: center;">
            <div class="spinner-blue" style="margin: 0 auto 0.75rem auto;"></div>
            <p style="color: #64748b; font-size: 0.875rem; margin: 0;">Loading learner information...</p>
          </div>
          <div v-else-if="viewingLearner" class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Last Name</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-primary, #2563eb);">{{ viewingLearner?.lastName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">First Name</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-primary, #2563eb);">{{ viewingLearner?.firstName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Middle Name</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-primary, #2563eb);">{{ viewingLearner?.middleName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">LRN</span>
              <span class="detail-value">{{ viewingLearner?.lrn || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ALS Level</span>
              <span class="detail-value">{{ formatLearnerLevel(viewingLearner?.level || viewingLearner?.programLevel) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Learning Center</span>
              <span class="detail-value">{{ viewingLearner?.learningCenter || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Assigned Teacher</span>
              <span class="detail-value" style="font-weight: 600; color: #1e40af;">{{ viewingLearner?.assignedTeacher || viewingLearner?.teacher || viewingLearner?.teacherName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="badge" :class="viewingLearner?.status === 'Active' ? 'badge-success' : 'badge-muted'">
                  {{ viewingLearner?.status || 'Active' }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Sex / Gender</span>
              <span class="detail-value">{{ viewingLearner?.sex || viewingLearner?.gender || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date of Birth</span>
              <span class="detail-value">{{ viewingLearner?.dob || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Contact Number</span>
              <span class="detail-value">{{ viewingLearner?.contactNumber || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Address</span>
              <span class="detail-value">{{ viewingLearner?.address || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date Registered</span>
              <span class="detail-value">{{ viewingLearner?.dateRegistered || '—' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer-fixed" style="border-top: 1px solid var(--color-border, #e2e8f0); padding: 1rem 1.5rem; display: flex; justify-content: flex-end; background: #f8fafc;">
          <button type="button" class="btn btn-secondary" @click="closeLearnerModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import ReportsPageHeader from '../components/ReportsPageHeader.vue';
import ClearFiltersButton from '../components/ClearFiltersButton.vue';
import { useAdminSession } from '../composables/useAdminSession.js';
import { getLearningCenters } from '../api/learningCenters.js';
import { getTeachers } from '../api/teachers.js';
import { getLearners, getLearner } from '../api/learners.js';
import { getAttendanceRecords } from '../api/reports.js';

const route = useRoute();
const { adminName } = useAdminSession();
const reportContentRef = ref(null);

const reportGenerated = ref(false);
const loadingReport = ref(false);

const pdfFilename = computed(() => {
  const dateStr = new Date().toISOString().split('T')[0];
  const centerPart = selectedCenter.value ? selectedCenter.value.replace(/[^a-zA-Z0-9_-]/g, '_') : 'District';
  return `Summary_of_Learners_Attendance_${centerPart}_${dateStr}.pdf`;
});

const learningCenters = ref([]);
const teachers = ref([]);
const learners = ref([]);
const dashboardAttendanceLogs = ref([]);
const rawAttendanceLogs = ref([]);

// Filters
const selectedCenter = ref('');
const selectedLevel = ref('');
const selectedTeacher = ref('');
const selectedLearnerName = ref('');
const fromDate = ref('');
const toDate = ref('');
const isRefreshing = ref(false);
const dateError = ref('');

// Modals State
const selectedLearnerForDetails = ref(null);
const showLearnerModal = ref(false);
const viewingLearner = ref(null);
const loadingLearnerInfo = ref(false);

async function loadData() {
  try {
    const [centersRes, teachersRes, learnersRes, attData] = await Promise.all([
      getLearningCenters().catch(() => ({ data: [] })),
      getTeachers().catch(() => ({ data: [] })),
      getLearners().catch(() => ({ data: [] })),
      getAttendanceRecords().catch(() => []),
    ]);

    learningCenters.value = Array.isArray(centersRes.data) ? centersRes.data : (Array.isArray(centersRes) ? centersRes : []);
    teachers.value = Array.isArray(teachersRes.data) ? teachersRes.data : (Array.isArray(teachersRes) ? teachersRes : []);
    learners.value = Array.isArray(learnersRes.data) ? learnersRes.data : (Array.isArray(learnersRes) ? learnersRes : []);
    dashboardAttendanceLogs.value = Array.isArray(attData) ? attData : [];
  } catch (err) {
    console.error('Error loading attendance summary dashboard data:', err);
  }
}

// -------------------------------------------------------------------------
// Dashboard Statistics (Always active & calculated, independent of report)
// -------------------------------------------------------------------------
const dashboardFilteredLogs = computed(() => {
  if (!selectedCenter.value) return dashboardAttendanceLogs.value;
  return dashboardAttendanceLogs.value.filter(
    (l) => (l.learningCenter || '').toLowerCase().trim() === selectedCenter.value.toLowerCase().trim()
  );
});

const dashboardTotalLearners = computed(() => {
  if (selectedCenter.value) {
    return learners.value.filter((l) => (l.learningCenter || '').toLowerCase().trim() === selectedCenter.value.toLowerCase().trim()).length;
  }
  return learners.value.length;
});

const dashboardTotalSessions = computed(() => {
  const set = new Set(dashboardFilteredLogs.value.map((l) => l.sessionDate || l.date).filter(Boolean));
  return set.size;
});

const dashboardTotalPresent = computed(() => {
  return dashboardFilteredLogs.value.filter((l) => {
    const st = (l.status || '').toUpperCase();
    return st === 'PRESENT' || st === 'LATE';
  }).length;
});

const dashboardAttendanceRate = computed(() => {
  const total = dashboardFilteredLogs.value.length;
  if (total === 0) return 0;
  return Math.round((dashboardTotalPresent.value / total) * 100);
});

// -------------------------------------------------------------------------
// Report Template Generation (Populates only when Generate Report clicked)
// -------------------------------------------------------------------------
async function fetchAttendanceData() {
  loadingReport.value = true;
  try {
    const params = {};
    if (selectedCenter.value) params.learningCenter = selectedCenter.value;
    if (selectedLevel.value) params.level = selectedLevel.value;
    if (selectedTeacher.value) params.teacher = selectedTeacher.value;
    if (fromDate.value) params.fromDate = fromDate.value;
    if (toDate.value) params.toDate = toDate.value;

    const attData = await getAttendanceRecords(params).catch(() => []);
    rawAttendanceLogs.value = Array.isArray(attData) && attData.length > 0 ? attData : dashboardAttendanceLogs.value;
    reportGenerated.value = true;
  } catch (err) {
    console.error('Error loading attendance report logs:', err);
    rawAttendanceLogs.value = [];
    reportGenerated.value = true;
  } finally {
    loadingReport.value = false;
  }
}

onMounted(async () => {
  await loadData();
  if (route.query.center) {
    selectedCenter.value = String(route.query.center);
    await fetchAttendanceData();
  }
});

// Helper: Format learner name strictly as Last Name, First Name Middle Name
function formatLearnerFullName(l) {
  if (!l) return '—';
  const first = (l.firstName && l.firstName !== 'null' ? l.firstName : '').trim();
  const middle = (l.middleName && l.middleName !== 'null' && l.middleName !== 'undefined' ? l.middleName : '').trim();
  const last = (l.lastName && l.lastName !== 'null' ? l.lastName : '').trim();

  if (last && first) {
    return middle ? `${last}, ${first} ${middle}` : `${last}, ${first}`;
  }

  const raw = (l.fullName || l.name || '').trim();
  if (raw.includes(',')) {
    return raw;
  }
  if (raw) {
    const parts = raw.split(/\s+/);
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[1]}, ${parts[0]}`;
    const lastPart = parts[parts.length - 1];
    const rest = parts.slice(0, parts.length - 1).join(' ');
    return `${lastPart}, ${rest}`;
  }
  return '—';
}

function formatLearnerLevel(levelStr) {
  if (!levelStr) return '—';
  const norm = String(levelStr).toUpperCase();
  if (norm.includes('ELEM')) return 'A&E Elementary';
  if (norm.includes('JUN') || norm.includes('JHS') || norm.includes('LOWER_SEC') || norm.includes('SEC')) return 'A&E Junior High';
  return String(levelStr).trim();
}

function getLearnerGender(l) {
  if (!l) return 'Male';
  const g = String(l.sex || l.gender || '').toLowerCase().trim();
  if (g.startsWith('f')) return 'Female';
  return 'Male';
}

function formatStatusLabel(statusVal) {
  if (!statusVal) return '—';
  const s = String(statusVal).trim().toUpperCase();
  if (s === 'ABSENT') return 'Absent';
  if (s === 'LATE') return 'Late';
  if (s === 'EXCUSED') return 'Excused';
  if (s === 'PRESENT') return 'Present';
  return statusVal.charAt(0).toUpperCase() + statusVal.slice(1).toLowerCase();
}

function getStatusBadgeClass(statusVal) {
  const s = String(statusVal || '').trim().toUpperCase();
  if (s === 'ABSENT' || s === 'LATE') return 'badge-amber';
  if (s === 'EXCUSED') return 'badge-muted';
  return 'badge-green';
}

// Cascading teachers
const filteredTeachers = computed(() => {
  if (!selectedCenter.value) return teachers.value;
  const targetCenter = learningCenters.value.find((c) => c.name === selectedCenter.value);
  if (!targetCenter) return teachers.value;
  return teachers.value.filter(
    (t) => t.learningCenterId === targetCenter.id || t.learningCenter === selectedCenter.value
  );
});

// Cascading learners
const filteredLearnersList = computed(() => {
  return learners.value.filter((l) => {
    if (selectedCenter.value && l.learningCenter !== selectedCenter.value) return false;
    if (selectedLevel.value) {
      const lvlQuery = selectedLevel.value.toLowerCase();
      const norm = (l.level || '').toLowerCase();
      if (lvlQuery.includes('elem') && !norm.includes('elem')) return false;
      if (lvlQuery.includes('junior') && !norm.includes('junior') && !norm.includes('jhs')) return false;
    }
    if (selectedTeacher.value) {
      const t = (l.assignedTeacher || l.teacher || '').toLowerCase().trim();
      if (t !== selectedTeacher.value.toLowerCase().trim()) return false;
    }
    return true;
  });
});

function handleCenterChange() {
  const isValidTeacher = filteredTeachers.value.some((t) => t.fullName === selectedTeacher.value);
  if (!isValidTeacher) selectedTeacher.value = '';
}

async function handleRefresh() {
  isRefreshing.value = true;
  try {
    await loadData();
    if (reportGenerated.value) {
      await fetchAttendanceData();
    }
  } finally {
    isRefreshing.value = false;
  }
}

async function handleGenerateReport() {
  dateError.value = '';
  if (fromDate.value && toDate.value && fromDate.value > toDate.value) {
    dateError.value = 'From date cannot be later than To date.';
    return;
  }
  await fetchAttendanceData();
  const el = document.getElementById('report-content');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function invalidateReport() {
  if (reportGenerated.value) {
    reportGenerated.value = false;
    rawAttendanceLogs.value = [];
  }
}

watch(
  [selectedCenter, selectedLevel, selectedTeacher, selectedLearnerName, fromDate, toDate],
  () => {
    invalidateReport();
  }
);

function resetFilters() {
  selectedCenter.value = '';
  selectedLevel.value = '';
  selectedTeacher.value = '';
  selectedLearnerName.value = '';
  fromDate.value = '';
  toDate.value = '';
  dateError.value = '';
  reportGenerated.value = false;
  rawAttendanceLogs.value = [];
}

// Filtered raw logs based on user filter selections
const filteredLogs = computed(() => {
  if (!reportGenerated.value) return [];
  return rawAttendanceLogs.value.filter((log) => {
    if (selectedCenter.value) {
      const c = (log.learningCenter || '').toLowerCase().trim();
      if (c !== selectedCenter.value.toLowerCase().trim()) return false;
    }

    if (selectedLevel.value) {
      const lvlQuery = selectedLevel.value.toLowerCase();
      const norm = (log.level || '').toLowerCase();
      if (lvlQuery.includes('elem') && !norm.includes('elem')) return false;
      if (lvlQuery.includes('junior') && !norm.includes('junior') && !norm.includes('jhs')) return false;
    }

    if (selectedTeacher.value) {
      const t = (log.teacherName || log.teacher || '').toLowerCase().trim();
      if (t !== selectedTeacher.value.toLowerCase().trim()) return false;
    }

    if (selectedLearnerName.value) {
      const ln = (log.learnerName || '').toLowerCase().trim();
      if (ln !== selectedLearnerName.value.toLowerCase().trim()) return false;
    }

    const logDate = log.sessionDate || log.date;
    if (fromDate.value && logDate) {
      if (new Date(logDate) < new Date(fromDate.value)) return false;
    }
    if (toDate.value && logDate) {
      if (new Date(logDate) > new Date(toDate.value)) return false;
    }

    return true;
  });
});

// Consolidate learners in district with their attendance stats
const learnerAggregates = computed(() => {
  if (!reportGenerated.value) return [];
  const candidateLearners = filteredLearnersList.value;

  const rows = candidateLearners.map((learner) => {
    const learnerLogs = filteredLogs.value.filter((log) => {
      const matchId = log.learnerId === learner.id || String(log.learnerId) === String(learner.id);
      const matchName = (log.learnerName || '').trim().toLowerCase() === (learner.fullName || learner.name || '').trim().toLowerCase();
      return matchId || matchName;
    });

    const presentCount = learnerLogs.filter((l) => {
      const st = (l.status || '').toUpperCase();
      return st === 'PRESENT' || st === 'LATE';
    }).length;

    const absentCount = learnerLogs.filter((l) => {
      const st = (l.status || '').toUpperCase();
      return st === 'ABSENT';
    }).length;

    const totalSessions = presentCount + absentCount;
    const rate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    return {
      learnerId: learner.id,
      learnerObj: learner,
      learnerName: formatLearnerFullName(learner),
      lrn: learner.lrn || '',
      level: formatLearnerLevel(learner.level || learner.programLevel),
      learningCenter: learner.learningCenter || learner.learningCenterDetails?.name || '—',
      teacherName: learner.assignedTeacher || learner.teacher || learner.teacherName || '—',
      gender: getLearnerGender(learner),
      presentCount,
      absentCount,
      totalSessions,
      rate,
      logs: learnerLogs,
    };
  });

  // Handle any orphan attendance logs that might belong to learners not in candidate list
  const handledIds = new Set(rows.map((r) => r.learnerId));
  filteredLogs.value.forEach((log) => {
    if (log.learnerId && !handledIds.has(log.learnerId)) {
      handledIds.add(log.learnerId);
      const st = (log.status || '').toUpperCase();
      const presentCount = (st === 'PRESENT' || st === 'LATE') ? 1 : 0;
      const absentCount = st === 'ABSENT' ? 1 : 0;
      const totalSessions = presentCount + absentCount;
      rows.push({
        learnerId: log.learnerId,
        learnerObj: log.learner || log,
        learnerName: formatLearnerFullName(log.learner || { fullName: log.learnerName }),
        lrn: log.lrn || '',
        level: formatLearnerLevel(log.level),
        learningCenter: log.learningCenter || '—',
        teacherName: log.teacherName || log.teacher || '—',
        gender: getLearnerGender(log.learner || log),
        presentCount,
        absentCount,
        totalSessions,
        rate: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0,
        logs: [log],
      });
    }
  });

  return rows;
});

// Group by Male and Female
const maleLearners = computed(() => {
  return learnerAggregates.value
    .filter((l) => l.gender === 'Male')
    .sort((a, b) => a.learnerName.localeCompare(b.learnerName));
});

const femaleLearners = computed(() => {
  return learnerAggregates.value
    .filter((l) => l.gender === 'Female')
    .sort((a, b) => a.learnerName.localeCompare(b.learnerName));
});

// Empty grid lines matching official DepEd format
const emptyMaleRowsCount = computed(() => {
  if (!reportGenerated.value || learnerAggregates.value.length === 0) return 0;
  return maleLearners.value.length === 0 ? 5 : Math.max(0, 3 - maleLearners.value.length);
});

const emptyFemaleRowsCount = computed(() => {
  if (!reportGenerated.value || learnerAggregates.value.length === 0) return 0;
  return femaleLearners.value.length === 0 ? 5 : Math.max(0, 3 - femaleLearners.value.length);
});

function openDetailsModal(item) {
  selectedLearnerForDetails.value = item;
}

// Open Learner Information modal with full student record
async function openLearnerInfoModal(learner) {
  if (!learner) return;

  viewingLearner.value = {
    ...learner,
    name: formatLearnerFullName(learner),
    fullName: formatLearnerFullName(learner),
    level: learner.level || learner.programLevel,
    learningCenter: learner.learningCenter,
    assignedTeacher: learner.assignedTeacher || learner.teacherName || learner.teacher,
    sex: learner.sex || learner.gender,
    gender: learner.gender || learner.sex,
    status: learner.status || 'Active',
  };
  showLearnerModal.value = true;
  loadingLearnerInfo.value = true;

  try {
    const targetId = learner.id || learner.learnerId;
    if (targetId) {
      const res = await getLearner(targetId);
      const data = res.data || res;
      if (data) {
        viewingLearner.value = {
          ...viewingLearner.value,
          ...data,
          name: formatLearnerFullName(data),
          fullName: formatLearnerFullName(data),
          level: data.level || viewingLearner.value.level,
          learningCenter: data.learningCenter || viewingLearner.value.learningCenter,
          assignedTeacher: data.assignedTeacher || data.teacher || viewingLearner.value.assignedTeacher,
          sex: data.sex || data.gender || viewingLearner.value.sex,
          gender: data.gender || data.sex || viewingLearner.value.gender,
        };
      }
    }
  } catch (err) {
    console.warn('Could not fetch full learner profile from server, using local record:', err);
  } finally {
    loadingLearnerInfo.value = false;
  }
}

function closeLearnerModal() {
  showLearnerModal.value = false;
  viewingLearner.value = null;
}

function printReportDirectly() {
  if (!reportGenerated.value) {
    alert('Please click "Generate Report" before printing.');
    return;
  }
  if (learnerAggregates.value.length === 0) {
    alert('No attendance records to print for the selected filters.');
    return;
  }
  window.print();
}
</script>

<style scoped>
.attendance-summary-view {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding-bottom: 3rem;
}

.text-green {
  color: var(--color-green-text, #15803d) !important;
}

.text-amber {
  color: var(--color-amber-text, #b45309) !important;
}

.text-blue {
  color: var(--color-blue-text, #1d4ed8) !important;
}

/* Stats Cards */
.report-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  align-items: stretch;
  margin-bottom: 1.5rem; /* 24px consistent gap to filter bar */
}

@media (max-width: 1024px) {
  .report-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .report-stats-grid {
    grid-template-columns: 1fr;
  }
}

.report-summary-card {
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.report-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.85rem;
}

.stat-icon-blue {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon-purple {
  background: #faf5ff;
  color: #7c3aed;
}

.stat-icon-green {
  background: #f0fdf4;
  color: #16a34a;
}

.stat-icon-amber {
  background: #fffbeb;
  color: #b45309;
}

.report-card-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary, #64748b);
  margin-bottom: 0.25rem;
}

.report-card-value {
  font-size: 1.625rem;
  font-weight: 800;
  color: var(--color-text, #0f172a);
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.report-card-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted, #94a3b8);
  margin-top: auto;
}

/* Filter Section Layout - Single horizontal row on desktop */
.report-filter-bar {
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1rem 1.25rem; /* 16-20px internal padding */
  margin-bottom: 1.5rem; /* 24px consistent gap to preview table */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  width: 100%;
  box-sizing: border-box;
}

.filter-controls-row {
  display: flex;
  align-items: flex-end;
  gap: 14px; /* 12-16px horizontal spacing */
  width: 100%;
}

.filter-field-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.col-center {
  flex: 1.6 1 180px;
  min-width: 140px;
}

.col-level {
  flex: 1.2 1 150px;
  min-width: 130px;
}

.col-date {
  flex: 0 0 140px;
  width: 140px;
}

.col-reset {
  flex: 0 0 auto;
}

.col-generate {
  flex: 0 0 auto;
}

.filter-btn-col {
  display: flex;
  align-items: flex-end;
}

.filter-select,
.filter-input {
  height: 42px;
  min-height: 42px;
  width: 100%;
  padding: 0 0.85rem;
  font-size: 0.875rem;
  color: #0f172a;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.filter-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 2.25rem;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px 8px;
}

.filter-select:hover,
.filter-input:hover {
  border-color: #94a3b8;
}

.filter-select:focus,
.filter-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  background-color: #ffffff;
}

.generate-report-btn {
  height: 42px;
  min-height: 42px;
  padding: 0 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  background-color: #1d4ed8;
  color: #ffffff;
  border: 1px solid #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 2px rgba(29, 78, 216, 0.2);
}

.generate-report-btn:hover:not(:disabled) {
  background-color: #1e40af;
  border-color: #1e40af;
  box-shadow: 0 2px 4px rgba(29, 78, 216, 0.3);
}

.generate-report-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.filter-error-text {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #dc2626;
  font-size: 0.8125rem;
  font-weight: 500;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #fee2e2;
}

/* Tablet: balanced wrapping when space is constrained */
@media (max-width: 1024px) {
  .filter-controls-row {
    flex-wrap: wrap;
  }
  .col-center,
  .col-level {
    flex: 1 1 calc(50% - 0.5rem);
    min-width: 140px;
  }
  .col-date {
    flex: 1 1 calc(50% - 0.5rem);
    width: auto;
  }
  .col-reset,
  .col-generate {
    flex: 1 1 calc(50% - 0.5rem);
  }
  .btn-clear-filters,
  .generate-report-btn {
    width: 100%;
  }
}

/* Mobile: single stacked column */
@media (max-width: 640px) {
  .col-center,
  .col-level,
  .col-date,
  .col-reset,
  .col-generate {
    flex: 1 1 100%;
    width: 100%;
  }
}

/* Official Report Paper Sheet */
.attendance-report-sheet {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 2rem 2.25rem 2.5rem 2.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  max-width: 100%;
  margin: 0 auto;
  position: relative;
}

.report-official-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
}

.header-logo {
  flex: 0 0 70px;
  display: flex;
  align-items: center;
}

.left-logo-box {
  justify-content: flex-start;
}

.right-logo-box {
  justify-content: flex-end;
}

.als-district-logo {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.als-logo-image {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.header-title-box {
  flex: 1;
  text-align: center;
  padding: 0 1rem;
}

.official-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #000000;
  margin: 0;
  text-transform: none;
  letter-spacing: -0.01em;
  line-height: 1.35;
}

/* Table Container & Borders */
.table-responsive-wrapper,
.attendance-table-container {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.als-report-table,
.summary-attendance-table {
  width: 100%;
  border-collapse: collapse;
  font-family: inherit;
  font-size: 0.8125rem;
  color: #000000;
  border: 1.5px solid #000000;
}

.als-report-table th,
.als-report-table td,
.summary-attendance-table th,
.summary-attendance-table td {
  border: 1px solid #000000;
  padding: 6px 8px;
  vertical-align: middle;
}

.als-report-table thead tr th,
.summary-attendance-table thead tr th,
.summary-attendance-table thead th {
  background-color: #ffffff;
  color: #000000;
  font-weight: 700;
  text-align: center;
  vertical-align: middle;
  line-height: 1.25;
}

.sub-header-label,
.header-name-wrap .sub-title {
  display: block;
  font-size: 0.725rem;
  font-weight: 500;
  color: #333333;
}

/* Male and Female Grouping (Gray Section Headers) */
.gender-section-header td,
.section-divider-row td,
.section-divider-cell {
  background-color: #f3f4f6 !important; /* Gray header */
  color: #000000 !important;
  font-weight: 700 !important;
  font-size: 0.85rem !important;
  padding: 6px 12px !important;
  text-align: left !important;
  border: 1px solid #000000 !important;
}

.blank-row td,
.empty-line-row td {
  height: 28px;
  border: 1px solid #000000;
  background: #ffffff;
  padding: 6px 8px;
}

.data-row td {
  vertical-align: middle;
  background-color: #ffffff;
  padding: 6px 8px;
  border: 1px solid #000000;
}

.data-row:hover {
  background-color: #f8fafc;
}

.cell-no {
  text-align: center;
  width: 42px;
  font-weight: 500;
}

.cell-name {
  text-align: left;
}

.cell-center {
  text-align: center;
}

.cell-level {
  text-align: center;
}

.cell-stat {
  text-align: center;
  font-weight: 400;
  width: 80px;
}

.cell-rate {
  text-align: center;
  width: 120px;
}

.rate-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.15;
}

.rate-percentage {
  font-weight: 700;
  color: #dc2626;
  font-size: 0.8125rem;
}

.rate-sessions {
  font-size: 0.675rem;
  color: #475569;
  line-height: 1.1;
}

.col-actions,
.cell-actions {
  width: 100px;
  min-width: 100px;
  text-align: center;
  vertical-align: middle;
  padding: 4px 6px !important;
}

/* Action Button: View Details */
.btn-view-details {
  background: transparent;
  color: #1d4ed8;
  border: 1px solid #93c5fd;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
}

.btn-view-details:hover {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1e40af;
}

/* Learner Name with Functional Person Icon */
.learner-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.person-icon-btn,
.btn-learner-person-icon {
  background: var(--action-view-bg, #EFF6FF);
  border: 1px solid var(--action-view-border, #DCE7F6);
  padding: 3px;
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--action-view-color, #4169A8);
  cursor: pointer;
  border-radius: 4px;
  line-height: 1;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.person-icon-btn:hover,
.btn-learner-person-icon:hover {
  color: var(--action-view-hover-color, #315488);
  background-color: var(--action-view-hover-bg, #E0EEFE);
  border-color: var(--action-view-hover-border, #B9D3F4);
}

.person-icon-btn:focus-visible,
.btn-learner-person-icon:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8);
  outline-offset: 1px;
}

.learner-name-text {
  font-weight: 600;
  color: #000000;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-card {
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  width: 100%;
  max-width: 650px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
}

.modal-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #64748b);
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #64748b;
  cursor: pointer;
}

.modal-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.modal-mini-stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.modal-mini-stat .label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.modal-mini-stat .val {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
}

/* Learner Information Modal Detail Items */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1.25rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.details-full-width {
  grid-column: span 2;
}

.detail-label {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.detail-value {
  font-size: 0.925rem;
  color: #0f172a;
}

.badge-green {
  background: #dcfce7;
  color: #15803d;
}

.badge-amber {
  background: #fef3c7;
  color: #b45309;
}

.badge-muted {
  background: #f1f5f9;
  color: #64748b;
}

.spinner-blue {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Print Action Button (Below report table) */
.pdf-action-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 0 2rem 0;
}

.btn-print-report {
  height: 48px;
  padding: 0 1.75rem;
  background-color: #ffffff;
  color: #1e293b;
  border: 1.5px solid #cbd5e1;
  border-radius: 24px;
  font-size: 0.95rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-print-report:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-print-report:active {
  background-color: #e2e8f0;
  transform: translateY(1px);
}

.btn-print-report:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #e2e8f0;
}

/* Status Banner & Pills (Standardized with AF2) */
.report-status-banner {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 1.25rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
}

.status-pill.status-blank {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.status-pill.status-empty {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.status-pill.status-ready {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.status-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-badge-dot.warning,
.status-badge-dot.empty {
  background: #f59e0b;
}

.status-badge-dot.success {
  background: #10b981;
}

.status-badge-hint {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: normal;
}

.empty-notice-cell {
  background: #fffbeb !important;
  color: #b45309;
  padding: 1.25rem 1rem !important;
  text-align: center;
}

.empty-notice-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Print Rules: ONLY report content is printed */
@media print {
  .no-print,
  .print-hidden,
  .col-actions,
  .cell-actions,
  .breadcrumb,
  .page-header-row,
  .report-stats-grid,
  .report-filter-bar,
  .btn-view-details,
  .btn-learner-person-icon,
  .person-icon-btn,
  .modal-overlay {
    display: none !important;
  }

  body,
  .page-container {
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .attendance-report-sheet {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    max-width: 100% !important;
  }

  .summary-attendance-table {
    border: 1.5px solid #000000 !important;
  }

  .summary-attendance-table th,
  .summary-attendance-table td {
    border: 1px solid #000000 !important;
  }

  .gender-section-header td,
  .section-divider-row td,
  .section-divider-cell {
    background-color: #e5e7eb !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

@media (max-width: 1024px) {
  .report-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .report-stats-grid {
    grid-template-columns: 1fr;
  }
  .report-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .report-filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-field-col {
    width: 100%;
  }
}
</style>

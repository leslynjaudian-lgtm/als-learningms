<template>
  <div class="page-container module-progress-report-view">
    <!-- Standardized Page Header & Breadcrumb (print-hidden) -->
    <ReportsPageHeader
      title="Summary of Module Use and Learner's Progress"
      description="District-wide monitoring of learner module completion, assessment scores, and mastery."
    />

    <!-- FILTER SECTION (print-hidden) -->
    <div class="report-filter-bar print-hidden">
      <div class="filter-controls-row">
        <!-- 1. Learning Center (flexible width) -->
        <div class="filter-field-col col-center">
          <label class="filter-label">Learning Center</label>
          <select v-model="selectedCenter" class="filter-select">
            <option value="">All Learning Centers</option>
            <option v-for="c in learningCenters" :key="c.id" :value="c.name">
              {{ c.name }}
            </option>
          </select>
        </div>

        <!-- 2. ALS Level (flexible width) -->
        <div class="filter-field-col col-level">
          <label class="filter-label">ALS Level</label>
          <select v-model="selectedLevel" class="filter-select">
            <option value="">All ALS Levels</option>
            <option value="A&E Elementary">A&E Elementary</option>
            <option value="A&E Junior High">A&E Junior High</option>
          </select>
        </div>

        <!-- 3. From Date (smaller width) -->
        <div class="filter-field-col col-date">
          <label class="filter-label">From</label>
          <input
            v-model="fromDate"
            type="date"
            class="filter-input"
            @change="dateError = ''"
          />
        </div>

        <!-- 4. To Date (smaller width) -->
        <div class="filter-field-col col-date">
          <label class="filter-label">To</label>
          <input
            v-model="toDate"
            type="date"
            class="filter-input"
            @change="dateError = ''"
          />
        </div>

        <!-- 5. Reset Filters (White background, border, same height) -->
        <div class="filter-btn-col col-reset">
          <button
            type="button"
            class="filter-reset-btn"
            @click="resetFilters"
            title="Reset Filters"
          >
            Reset Filters
          </button>
        </div>

        <!-- 6. Generate Report (ALS LMS blue button, same height) -->
        <div class="filter-btn-col col-generate">
          <button
            type="button"
            class="generate-report-btn"
            :disabled="loading"
            @click="handleGenerateReport"
          >
            <span v-if="loading" class="btn-spinner"></span>
            <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>{{ loading ? 'Generating...' : 'Generate Report' }}</span>
          </button>
        </div>
      </div>

      <!-- Date Range Validation Message -->
      <div v-if="dateError" class="filter-error-text">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ dateError }}</span>
      </div>
    </div>

    <!-- REPORT PREVIEW SECTION (Always visible; shows Blank Template Preview before generating) -->
    <div class="report-preview-container">
      <!-- Loading State: generating report -->
      <div v-if="loading" class="loading-box print-hidden">
        <div class="btn-spinner" style="width: 22px; height: 22px; border-width: 2.5px; border-color: rgba(37, 99, 235, 0.2); border-top-color: #2563eb;"></div>
        <p>Retrieving module use and progress records...</p>
      </div>

      <!-- Error State: if data retrieval fails -->
      <div v-else-if="errorMessage" class="report-error-card print-hidden">
        <div class="error-msg-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>Error Generating Report</strong>
            <p>{{ errorMessage }}</p>
          </div>
        </div>
        <button type="button" class="btn-retry" @click="handleGenerateReport">Retry</button>
      </div>

      <!-- Printable Report Sheet (Dedicated report container) -->
      <div id="report-content" ref="reportContentRef" class="report-paper-sheet">
        <!-- Status Banner: Distinguish Blank Template vs Generated Report -->
        <div class="report-status-banner print-hidden">
          <div v-if="!reportGenerated" class="status-pill status-blank">
            <span class="status-badge-dot"></span>
            <span class="status-badge-text">Blank Template Preview</span>
            <span class="status-badge-hint">— Select filters above and click Generate Report</span>
          </div>
          <div v-else-if="maleLearners.length === 0 && femaleLearners.length === 0" class="status-pill status-empty">
            <span class="status-badge-dot empty"></span>
            <span class="status-badge-text">Report Generated</span>
            <span class="status-badge-hint">— No records found for the selected filters</span>
          </div>
          <div v-else class="status-pill status-ready">
            <span class="status-badge-dot success"></span>
            <span class="status-badge-text">Report Generated</span>
            <span class="status-badge-hint">— {{ maleLearners.length + femaleLearners.length }} record(s) loaded</span>
          </div>
        </div>

        <!-- 6. REPORT HEADER DESIGN (Follows attached PDF template) -->
        <header class="report-official-header">
          <div class="header-logo left-logo-box">
            <img :src="logoImg" alt="ALS Naawan District Logo" class="als-district-logo" />
          </div>

          <div class="header-title-box">
            <h2 class="official-title">
              Summary of Module Use and Learner's Progress Report
            </h2>
          </div>

          <div class="header-logo right-logo-box">
            <img :src="alsLogoImg" alt="ALS Logo" class="als-logo-image" />
          </div>
        </header>

        <!-- 7. REPORT TABLE -->
        <div class="table-responsive-wrapper">
          <table class="als-report-table">
            <thead>
              <!-- Header Row 1 -->
              <tr>
                <th rowspan="2" class="col-no">No.</th>
                <th rowspan="2" class="col-name">
                  Learner's Name<br />
                  <span class="sub-header-label">(Last Name, First Name, Middle Name)</span>
                </th>
                <th rowspan="2" class="col-center">Learning Center</th>
                <th rowspan="2" class="col-level">ALS Level</th>
                <th colspan="3" class="col-modules-group">Modules</th>
                <th rowspan="2" class="col-progress">Progress<br />(%)</th>
                <th rowspan="2" class="col-actions print-hidden">Actions</th>
              </tr>
              <!-- Header Row 2 -->
              <tr>
                <th class="col-sub col-mastered">Mastered</th>
                <th class="col-sub col-not-mastered">Not Mastered</th>
                <th class="col-sub col-pending">Pending</th>
              </tr>
            </thead>

            <!-- BLANK TEMPLATE PREVIEW BODY (Before Generate Report) -->
            <tbody v-if="!reportGenerated">
              <!-- Male Grouping Header -->
              <tr class="gender-section-header">
                <td colspan="9" class="print-visible-span">Male</td>
              </tr>
              <!-- Blank rows for Male -->
              <tr v-for="bIdx in 5" :key="'blank-male-' + bIdx" class="blank-row">
                <td class="cell-center">&nbsp;</td>
                <td class="cell-name">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center print-hidden">&nbsp;</td>
              </tr>

              <!-- Female Grouping Header -->
              <tr class="gender-section-header">
                <td colspan="9" class="print-visible-span">Female</td>
              </tr>
              <!-- Blank rows for Female -->
              <tr v-for="bIdx in 5" :key="'blank-female-' + bIdx" class="blank-row">
                <td class="cell-center">&nbsp;</td>
                <td class="cell-name">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center print-hidden">&nbsp;</td>
              </tr>
            </tbody>

            <!-- GENERATED REPORT TABLE BODY (After Generate Report) -->
            <tbody v-else>
              <!-- Empty notice row if zero total records -->
              <tr v-if="maleLearners.length === 0 && femaleLearners.length === 0" class="empty-notice-row print-hidden">
                <td colspan="9" class="cell-center empty-notice-cell">
                  <div class="empty-notice-content">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>No records found for the selected filters.</span>
                  </div>
                </td>
              </tr>

              <!-- 11. MALE GROUPING -->
              <tr class="gender-section-header">
                <td colspan="9" class="print-visible-span">Male</td>
              </tr>

              <!-- Male rows -->
              <template v-if="maleLearners.length > 0">
                <tr v-for="(learner, idx) in maleLearners" :key="'male_' + learner.id" class="data-row">
                  <td class="cell-center">{{ idx + 1 }}</td>
                  <td class="cell-name">
                    <span class="learner-name-cell">
                      <button
                        type="button"
                        class="person-icon-btn"
                        @click="openLearnerInfoModal(learner)"
                        title="View"
                        aria-label="View Learner Information"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </button>
                      <span class="learner-name-text">{{ learner.fullName }}</span>
                    </span>
                  </td>
                  <td class="cell-center">{{ learner.learningCenter || '—' }}</td>
                  <td class="cell-center">{{ formatLearnerLevel(learner.programLevel) }}</td>
                  <td class="cell-center font-num">{{ learner.mastered }}</td>
                  <td class="cell-center font-num">{{ learner.notMastered }}</td>
                  <td class="cell-center font-num">{{ learner.pending }}</td>
                  <td class="cell-center cell-progress-red">{{ learner.progress }}%</td>
                  <td class="cell-center print-hidden">
                    <button
                      type="button"
                      class="btn-view-details"
                      @click="openDetailsModal(learner)"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              </template>
              <tr v-else-if="maleLearners.length === 0 && femaleLearners.length > 0" class="empty-group-row">
                <td colspan="9" class="text-muted-center print-visible-span">No male learners found for the selected criteria.</td>
              </tr>

              <!-- 11. FEMALE GROUPING -->
              <tr class="gender-section-header">
                <td colspan="9" class="print-visible-span">Female</td>
              </tr>

              <!-- Female rows -->
              <template v-if="femaleLearners.length > 0">
                <tr v-for="(learner, idx) in femaleLearners" :key="'female_' + learner.id" class="data-row">
                  <td class="cell-center">{{ idx + 1 }}</td>
                  <td class="cell-name">
                    <span class="learner-name-cell">
                      <button
                        type="button"
                        class="person-icon-btn"
                        @click="openLearnerInfoModal(learner)"
                        title="View"
                        aria-label="View Learner Information"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </button>
                      <span class="learner-name-text">{{ learner.fullName }}</span>
                    </span>
                  </td>
                  <td class="cell-center">{{ learner.learningCenter || '—' }}</td>
                  <td class="cell-center">{{ formatLearnerLevel(learner.programLevel) }}</td>
                  <td class="cell-center font-num">{{ learner.mastered }}</td>
                  <td class="cell-center font-num">{{ learner.notMastered }}</td>
                  <td class="cell-center font-num">{{ learner.pending }}</td>
                  <td class="cell-center cell-progress-red">{{ learner.progress }}%</td>
                  <td class="cell-center print-hidden">
                    <button
                      type="button"
                      class="btn-view-details"
                      @click="openDetailsModal(learner)"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              </template>
              <tr v-else-if="femaleLearners.length === 0 && maleLearners.length > 0" class="empty-group-row">
                <td colspan="9" class="text-muted-center print-visible-span">No female learners found for the selected criteria.</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- PRINT ACTION BUTTON (Below report preview, no-print) -->
      <div id="pdf-action-section" class="pdf-action-container no-print print-hidden">
        <button
          type="button"
          class="btn-print-report"
          :disabled="!reportGenerated || (maleLearners.length === 0 && femaleLearners.length === 0)"
          @click="printReportDirectly"
          title="Print Report"
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

    <!-- 9. VIEW DETAILS MODAL -->
    <div
      v-if="showModal"
      class="modal-backdrop print-hidden"
      @click.self="closeDetailsModal"
    >
      <div class="modal-dialog">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-title-group">
            <h3>Learner Module Progress Details</h3>
            <p>{{ selectedLearnerDetails?.learner?.fullName }} &bull; LRN: {{ selectedLearnerDetails?.learner?.lrn || 'N/A' }}</p>
          </div>
          <button type="button" class="btn-close-modal" @click="closeDetailsModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <div v-if="loadingDetails" class="modal-loading-state">
            <div class="spinner-blue"></div>
            <p>Loading learner progress details...</p>
          </div>

          <div v-else-if="selectedLearnerDetails">
            <!-- Three Horizontally Aligned Summary Cards -->
            <div class="summary-cards-grid">
              <!-- Card 1: Recorded -->
              <div class="summary-card card-recorded">
                <div class="card-header-block">
                  <span class="card-category-label">Recorded</span>
                  <div class="card-total-row">
                    <span class="card-total-num font-mono">{{ modalSummary.recorded }}</span>
                    <span class="card-total-unit">{{ modalSummary.recorded === 1 ? 'module' : 'modules' }}</span>
                  </div>
                </div>
                <div class="card-sub-breakdown">
                  <div class="sub-item-row">
                    <span class="sub-item-name">Mastered:</span>
                    <span class="sub-item-count font-mono text-green-bold">{{ modalSummary.mastered }}</span>
                  </div>
                  <div class="sub-item-row">
                    <span class="sub-item-name">Not Mastered:</span>
                    <span class="sub-item-count font-mono text-amber-bold">{{ modalSummary.notMastered }}</span>
                  </div>
                </div>
              </div>

              <!-- Card 2: Pending -->
              <div class="summary-card card-pending">
                <div class="card-header-block">
                  <span class="card-category-label">Pending</span>
                  <div class="card-total-row">
                    <span class="card-total-num font-mono">{{ modalSummary.pending }}</span>
                    <span class="card-total-unit">{{ modalSummary.pending === 1 ? 'module' : 'modules' }}</span>
                  </div>
                </div>
                <div class="card-sub-breakdown">
                  <div class="sub-item-row">
                    <span class="sub-item-name">Not Recorded:</span>
                    <span class="sub-item-count font-mono">{{ modalSummary.notRecorded }}</span>
                  </div>
                  <div class="sub-item-row">
                    <span class="sub-item-name">In Progress:</span>
                    <span class="sub-item-count font-mono text-blue-bold">{{ modalSummary.inProgress }}</span>
                  </div>
                  <div class="sub-item-row">
                    <span class="sub-item-name">Overdue:</span>
                    <span class="sub-item-count font-mono text-red-bold">{{ modalSummary.overdue }}</span>
                  </div>
                </div>
              </div>

              <!-- Card 3: Total Modules & Overall Progress -->
              <div class="summary-card card-totals">
                <div class="card-dual-section">
                  <span class="card-category-label">Total Modules</span>
                  <div class="card-total-row">
                    <span class="card-total-num font-mono">{{ modalSummary.totalModules }}</span>
                    <span class="card-total-unit">{{ modalSummary.totalModules === 1 ? 'module' : 'modules' }}</span>
                  </div>
                </div>
                <div class="card-subtle-divider"></div>
                <div class="card-dual-section">
                  <span class="card-category-label">Overall Progress</span>
                  <div class="card-total-row">
                    <span class="card-total-num font-mono text-primary-bold">{{ modalSummary.progress }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Learner Meta Details -->
            <div class="modal-meta-grid">
              <div><strong>Learning Center:</strong> {{ selectedLearnerDetails.learner?.learningCenter || '—' }}</div>
              <div><strong>ALS Level:</strong> {{ formatLearnerLevel(selectedLearnerDetails.learner?.level) }}</div>
              <div><strong>Assigned Teacher:</strong> {{ selectedLearnerDetails.learner?.assignedTeacher || '—' }}</div>
              <div><strong>Gender:</strong> {{ selectedLearnerDetails.learner?.gender || '—' }}</div>
            </div>

            <!-- Modules Breakdown Table -->
            <h4 class="modules-breakdown-title">Assigned Modules &amp; Assessment Results</h4>
            <div class="modal-table-responsive">
              <table class="modal-detail-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Strand</th>
                    <th>Pre-Test</th>
                    <th>Post-Test</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mod in selectedLearnerDetails.modules" :key="mod.id">
                    <td>
                      <strong>{{ mod.title }}</strong>
                    </td>
                    <td class="text-sm">{{ mod.strand }}</td>
                    <td class="text-sm font-mono">
                      {{ mod.preTest?.score != null ? `${mod.preTest.score} / ${mod.preTest.max} (${mod.preTest.percentage}%)` : 'Not taken' }}
                    </td>
                    <td class="text-sm font-mono">
                      {{ mod.postTest?.score != null ? `${mod.postTest.score} / ${mod.postTest.max} (${mod.postTest.percentage}%)` : 'Not taken' }}
                    </td>
                    <td>
                      <span
                        class="badge"
                        :class="getModuleStatusBadgeClass(mod.status)"
                      >
                        {{ mod.status }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!selectedLearnerDetails.modules || selectedLearnerDetails.modules.length === 0">
                    <td colspan="5" class="text-muted-center">No module records recorded for this learner.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDetailsModal">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- View Learner Information Modal (Reused from Learners module) -->
    <div v-if="showLearnerModal" class="modal-overlay print-hidden" @click.self="closeLearnerModal">
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
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ReportsPageHeader from '../components/ReportsPageHeader.vue';
import { exportReportToPdf } from '../utils/pdfExport.js';
import { getModuleProgressReport, getLearnerModuleProgressDetails } from '../api/reports.js';
import { getLearner } from '../api/learners.js';
import { getLearningCenters } from '../api/learningCenters.js';
import logoImg from '../assets/logo.png';
import alsLogoImg from '../assets/als-logo.png';

const route = useRoute();
const reportContentRef = ref(null);

// 1. Current Filter Selections (Inputs)
const selectedCenter = ref('');
const selectedLevel = ref('');
const fromDate = ref('');
const toDate = ref('');
const dateError = ref('');
const errorMessage = ref('');

// 2. Last Generated Report Filters
const lastGeneratedFilters = ref({
  center: '',
  level: '',
  fromDate: '',
  toDate: '',
});

// 3. Report Generation Status
const loading = ref(false);
const reportGenerated = ref(false);
const downloadingPdf = ref(false);

// 4. Generated Report Data
const learningCenters = ref([]);
const maleLearners = ref([]);
const femaleLearners = ref([]);
const reportMeta = ref({});

let activeRequestId = 0;

// Modal State (View Details)
const showModal = ref(false);
const loadingDetails = ref(false);
const selectedLearnerDetails = ref(null);

// Synchronized Category Counts & Calculations for View Details Modal
const modalSummary = computed(() => {
  const mods = selectedLearnerDetails.value?.modules || [];
  let mastered = 0;
  let notMastered = 0;
  let notRecorded = 0;
  let inProgress = 0;
  let overdue = 0;

  for (const m of mods) {
    const st = String(m.status || '').trim().toLowerCase();
    if (st === 'mastered') {
      mastered++;
    } else if (st === 'not mastered') {
      notMastered++;
    } else if (st === 'overdue') {
      overdue++;
    } else if (st === 'in progress' || st === 'in_progress' || st === 'started') {
      inProgress++;
    } else {
      notRecorded++;
    }
  }

  // Fallback to backend summary counts if modules array is empty but backend provided summary
  const bSummary = selectedLearnerDetails.value?.summary;
  if (mods.length === 0 && bSummary) {
    mastered = Number(bSummary.mastered || 0);
    notMastered = Number(bSummary.notMastered || 0);
    notRecorded = Number(bSummary.notRecorded || 0);
    inProgress = Number(bSummary.inProgress || 0);
    overdue = Number(bSummary.overdue || 0);
  }

  const recorded = mastered + notMastered;
  const pending = notRecorded + inProgress + overdue;
  const totalModules = recorded + pending;
  const progress = totalModules > 0 ? Math.round((recorded / totalModules) * 100) : 0;

  return {
    recorded,
    mastered,
    notMastered,
    pending,
    notRecorded,
    inProgress,
    overdue,
    totalModules,
    progress,
  };
});

function getModuleStatusBadgeClass(status) {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'mastered') return 'badge-green';
  if (s === 'not mastered') return 'badge-amber';
  if (s === 'in progress' || s === 'in_progress' || s === 'started') return 'badge-blue';
  if (s === 'overdue') return 'badge-red';
  return 'badge-gray';
}

// Modal State (Learner Information)
const showLearnerModal = ref(false);
const loadingLearnerInfo = ref(false);
const viewingLearner = ref(null);

function formatLearnerLevel(lvl) {
  if (!lvl) return '—';
  const s = String(lvl).toUpperCase();
  if (s.includes('ELEM')) return 'A&E Elementary';
  if (s.includes('JUN') || s.includes('LOWER_SEC') || s.includes('SEC')) return 'A&E Junior High';
  return String(lvl).trim();
}

onMounted(async () => {
  try {
    const centers = await getLearningCenters();
    learningCenters.value = Array.isArray(centers) ? centers : (Array.isArray(centers?.data) ? centers.data : []);
  } catch (err) {
    console.warn('Could not load learning centers:', err);
  }
  if (route.query.center) {
    selectedCenter.value = String(route.query.center);
    await handleGenerateReport();
  }
});

// Generate Report Action (only user click initiates report generation)
async function handleGenerateReport() {
  dateError.value = '';
  errorMessage.value = '';

  if (fromDate.value && toDate.value && fromDate.value > toDate.value) {
    dateError.value = 'From date cannot be later than To date.';
    return;
  }

  const requestId = ++activeRequestId;
  loading.value = true;
  try {
    const params = {};
    if (selectedCenter.value) params.learningCenter = selectedCenter.value;
    if (selectedLevel.value) params.programLevel = selectedLevel.value;
    if (fromDate.value) params.fromDate = fromDate.value;
    if (toDate.value) params.toDate = toDate.value;

    const data = await getModuleProgressReport(params);

    // Prevent stale API responses from overwriting newer generated reports
    if (requestId !== activeRequestId) return;

    maleLearners.value = data.male || [];
    femaleLearners.value = data.female || [];
    reportMeta.value = data.meta || {};
    lastGeneratedFilters.value = {
      center: selectedCenter.value,
      level: selectedLevel.value,
      fromDate: fromDate.value,
      toDate: toDate.value,
    };
    reportGenerated.value = true;
  } catch (err) {
    if (requestId !== activeRequestId) return;
    console.error('Error generating report:', err);
    errorMessage.value = 'Failed to generate report. Please check server connection or reload.';
  } finally {
    if (requestId === activeRequestId) {
      loading.value = false;
    }
  }
}

// Reset Filters Action: Resets filter inputs, clears generated report data, returns to blank template
function resetFilters() {
  activeRequestId++; // Cancel any in-flight requests
  selectedCenter.value = '';
  selectedLevel.value = '';
  fromDate.value = '';
  toDate.value = '';
  dateError.value = '';
  errorMessage.value = '';
  reportGenerated.value = false;
  maleLearners.value = [];
  femaleLearners.value = [];
  reportMeta.value = {};
  lastGeneratedFilters.value = {
    center: '',
    level: '',
    fromDate: '',
    toDate: '',
  };
}

// Scroll down to Generate PDF button
function scrollToPdfButton() {
  const el = document.getElementById('pdf-action-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

// Generate & Download PDF (Captures only dedicated #report-content container)
async function generateAndDownloadPdf() {
  const element = reportContentRef.value || document.getElementById('report-content');
  if (!element) return;

  downloadingPdf.value = true;
  try {
    await exportReportToPdf(element, {
      filename: `Summary_of_Module_Use_and_Learners_Progress_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      orientation: 'landscape',
      margin: [10, 8, 10, 8],
    });
  } catch (err) {
    console.error('Error downloading PDF with html2pdf:', err);
  } finally {
    downloadingPdf.value = false;
  }
}

// Browser Print (Direct print of dedicated report sheet)
function printReportDirectly() {
  if (!reportGenerated.value || (maleLearners.value.length === 0 && femaleLearners.value.length === 0)) {
    dateError.value = 'Please select filters and click Generate Report before printing.';
    return;
  }
  window.print();
}

// Open learner details modal
async function openDetailsModal(learner) {
  showModal.value = true;
  loadingDetails.value = true;
  selectedLearnerDetails.value = null;
  try {
    const details = await getLearnerModuleProgressDetails(learner.id);
    selectedLearnerDetails.value = details;
  } catch (err) {
    console.error('Error fetching learner details:', err);
    alert('Could not fetch learner module details.');
    showModal.value = false;
  } finally {
    loadingDetails.value = false;
  }
}

function closeDetailsModal() {
  showModal.value = false;
  selectedLearnerDetails.value = null;
}

// Open Learner Information modal with actual data
async function openLearnerInfoModal(learner) {
  if (!learner) return;

  // Initialize with row data so the modal opens immediately with actual learner data
  viewingLearner.value = {
    ...learner,
    name: learner.fullName,
    fullName: learner.fullName,
    level: learner.programLevel,
    learningCenter: learner.learningCenter,
    assignedTeacher: learner.teacherName,
    sex: learner.gender,
    gender: learner.gender,
    status: 'Active',
  };
  showLearnerModal.value = true;
  loadingLearnerInfo.value = true;

  try {
    const res = await getLearner(learner.id);
    const data = res.data || res;
    if (data) {
      viewingLearner.value = {
        ...viewingLearner.value,
        ...data,
        name: data.name || data.fullName || viewingLearner.value.name,
        fullName: data.fullName || data.name || viewingLearner.value.fullName,
        level: data.level || viewingLearner.value.level,
        learningCenter: data.learningCenter || viewingLearner.value.learningCenter,
        assignedTeacher: data.assignedTeacher || data.teacher || viewingLearner.value.assignedTeacher,
        sex: data.sex || data.gender || viewingLearner.value.sex,
        gender: data.gender || data.sex || viewingLearner.value.gender,
      };
    }
  } catch (err) {
    console.warn('Could not fetch full learner profile from server, displaying available row data:', err);
  } finally {
    loadingLearnerInfo.value = false;
  }
}

function closeLearnerModal() {
  showLearnerModal.value = false;
  viewingLearner.value = null;
}
</script>

<style scoped>
/* Page Layout */
.module-progress-report-view {
  padding-bottom: 3rem;
}

/* Filter Section */
.report-filter-bar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.15rem 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: 100%;
  box-sizing: border-box;
}

.filter-controls-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
  width: 100%;
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
  flex: 1.5 1 200px;
  min-width: 160px;
}

.col-level {
  flex: 1.2 1 170px;
  min-width: 140px;
}

.col-date {
  flex: 0 0 145px;
  width: 145px;
}

.col-reset {
  flex: 0 0 auto;
}

.col-generate {
  flex: 0 0 auto;
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

.filter-btn-col {
  display: flex;
  align-items: flex-end;
}

/* Reset Filters: Secondary, white background, border, same 42px height */
.filter-reset-btn {
  height: 42px;
  min-height: 42px;
  padding: 0 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  background-color: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.filter-reset-btn:hover {
  background-color: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.filter-reset-btn:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  outline: none;
}

/* Generate Report Button: ALS LMS Blue, white text, same 42px height */
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

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Initial Prompt State */
.initial-prompt-card {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 2.25rem 1.5rem;
  text-align: center;
  color: #64748b;
  margin-top: 1rem;
}

.prompt-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem auto;
}

.error-circle {
  background: #fef2f2 !important;
  color: #dc2626 !important;
}

.prompt-error-state {
  border-color: #fca5a5 !important;
  background: #fffafa !important;
}

.initial-prompt-card h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.35rem;
}

.initial-prompt-card p {
  font-size: 0.85rem;
  max-width: 480px;
  margin: 0 auto;
}

@media (max-width: 960px) {
  .col-center,
  .col-level {
    flex: 1 1 calc(50% - 0.5rem);
  }
  .col-date {
    flex: 1 1 calc(50% - 0.5rem);
    width: auto;
  }
  .col-reset,
  .col-generate {
    flex: 1 1 auto;
  }
  .filter-reset-btn,
  .generate-report-btn {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .col-center,
  .col-level,
  .col-date {
    flex: 1 1 100%;
  }
}

/* Report Paper Sheet */
.report-paper-sheet {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 2rem 2.25rem 2.5rem 2.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  position: relative;
}

/* 6. Official Header Design */
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

/* 7. Official Table Structure */
.table-responsive-wrapper {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.als-report-table {
  width: 100%;
  border-collapse: collapse;
  font-family: inherit;
  font-size: 0.8125rem;
  color: #000000;
  border: 1.5px solid #000000;
}

.als-report-table th,
.als-report-table td {
  border: 1px solid #000000;
  padding: 6px 8px;
}

.als-report-table thead tr th {
  background-color: #ffffff;
  color: #000000;
  font-weight: 700;
  text-align: center;
  vertical-align: middle;
  line-height: 1.25;
}

.sub-header-label {
  display: block;
  font-size: 0.725rem;
  font-weight: 500;
  color: #333333;
}

/* Column Widths */
.col-no {
  width: 42px;
}

.col-name {
  min-width: 190px;
  text-align: left;
}

.col-center {
  min-width: 120px;
}

.col-level {
  min-width: 110px;
}

.col-modules-group {
  text-align: center;
}

.col-sub {
  font-size: 0.75rem;
  padding: 4px 6px !important;
  width: 80px;
}

.col-progress {
  width: 80px;
  text-align: center;
}

.col-actions {
  width: 100px;
  text-align: center;
}

/* 11. Male and Female Grouping (Gray Section Headers) */
.gender-section-header td {
  background-color: #f3f4f6; /* Gray header */
  color: #000000;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 6px 12px;
  text-align: left;
}

.empty-group-row td {
  padding: 10px;
  text-align: center;
  font-style: italic;
  color: #666666;
}

/* Data Row Cells */
.data-row td {
  vertical-align: middle;
  background-color: #ffffff;
}

.cell-center {
  text-align: center;
}

.cell-name {
  text-align: left;
}

/* 8. Learner Name with Functional Person Icon */
.learner-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.person-icon-btn {
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

.person-icon-btn:hover {
  color: var(--action-view-hover-color, #315488);
  background-color: var(--action-view-hover-bg, #E0EEFE);
  border-color: var(--action-view-hover-border, #B9D3F4);
}

.person-icon-btn:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8);
  outline-offset: 1px;
}

.person-icon {
  display: inline-flex;
  color: #475569;
  flex-shrink: 0;
}

.learner-name-text {
  font-weight: 600;
  color: #000000;
}

.font-num {
  font-family: inherit;
  font-size: 0.85rem;
}

/* 10. Progress Column: Percentage only, RED text, NO progress bar */
.cell-progress-red {
  color: #dc2626 !important; /* RED text */
  font-weight: 700;
  font-size: 0.875rem;
}

/* 9. Action Button: View Details */
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
}

.btn-view-details:hover {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1e40af;
}

/* 12. Scroll Down Indicator */
.scroll-down-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.scroll-down-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: #2563eb; /* Blue circular icon */
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.35rem;
  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.3);
  transition: transform 0.2s, background-color 0.2s;
  animation: bounce 2s infinite;
}

.scroll-down-container:hover .scroll-down-circle {
  background-color: #1d4ed8;
  transform: translateY(2px);
}

.scroll-down-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  letter-spacing: 0.02em;
}

/* 13. Generate PDF Button (Below the report preview) */
.pdf-action-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 0 2rem 0;
}

.btn-generate-pdf {
  height: 48px;
  padding: 0 2.25rem;
  background-color: #1d4ed8; /* Blue ALS LMS button style */
  color: #ffffff;
  border: none;
  border-radius: 24px; /* Rounded corners */
  font-size: 0.95rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(29, 78, 216, 0.35);
  transition: all 0.2s;
}

.btn-generate-pdf:hover:not(:disabled) {
  background-color: #1e40af;
  box-shadow: 0 6px 14px rgba(29, 78, 216, 0.45);
  transform: translateY(-1px);
}

.btn-generate-pdf:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.btn-spinner-white {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Modal Styling */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(3px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-dialog {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title-group h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal-title-group p {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0.2rem 0 0 0;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-modal:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

/* 3 Horizontally Aligned Summary Cards */
.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1.25rem;
  align-items: stretch;
}

.summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.95rem 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 145px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* Card 1: Green Accent for Recorded */
.card-recorded {
  border-top: 3.5px solid #16a34a;
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 42%);
}

.card-recorded .card-category-label {
  color: #15803d;
}

/* Card 2: Blue Accent for Pending */
.card-pending {
  border-top: 3.5px solid #2563eb;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 42%);
}

.card-pending .card-category-label {
  color: #1d4ed8;
}

/* Card 3: Neutral System Accent for Totals & Progress */
.card-totals {
  border-top: 3.5px solid #475569;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 42%);
}

.card-totals .card-category-label {
  color: #475569;
}

.card-header-block {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.card-category-label {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.card-total-row {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.card-total-num {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.card-total-unit {
  font-size: 0.775rem;
  font-weight: 500;
  color: #64748b;
}

.card-sub-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.65rem;
  padding-top: 0.55rem;
  border-top: 1px dashed #e2e8f0;
}

.sub-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  line-height: 1.25;
}

.sub-item-name {
  color: #475569;
  font-weight: 500;
}

.sub-item-count {
  font-weight: 700;
  color: #0f172a;
}

.card-dual-section {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.card-subtle-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.55rem 0;
}

@media (max-width: 768px) {
  .summary-cards-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

.modal-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.8125rem;
  color: #334155;
  margin-bottom: 1.25rem;
}

.modules-breakdown-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
}

.modal-table-responsive {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.modal-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.modal-detail-table th {
  background: #f1f5f9;
  color: #334155;
  font-weight: 600;
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-detail-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.725rem;
  font-weight: 600;
}

.badge-green { background: #dcfce7; color: #15803d; }
.badge-amber { background: #fef3c7; color: #b45309; }
.badge-blue { background: #dbeafe; color: #1d4ed8; }
.badge-red { background: #fee2e2; color: #b91c1c; }
.badge-gray { background: #f1f5f9; color: #475569; }

.text-green-bold { color: #15803d; font-weight: 700; }
.text-amber-bold { color: #b45309; font-weight: 700; }
.text-blue-bold { color: #1d4ed8; font-weight: 700; }
.text-red-bold { color: #dc2626; font-weight: 700; }
.text-primary-bold { color: #2563eb; font-weight: 800; }
.text-xs { font-size: 0.725rem; }
.text-sm { font-size: 0.8125rem; }
.text-muted { color: #64748b; }
.text-muted-center { text-align: center; color: #64748b; padding: 1rem; }

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
}

/* Learner Information Modal (Reused from Learners module) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1.5rem;
}

.modal-header-fixed {
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  margin: 0;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-secondary, #64748b);
  margin: 4px 0 0 0;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  padding: 0;
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body-scrollable {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem 1.5rem;
  padding: 0.5rem 0;
}

.details-full-width {
  grid-column: 1 / -1;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text, #1e293b);
  word-break: break-word;
}

.modal-footer-fixed {
  border-top: 1px solid var(--color-border, #e2e8f0);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-success {
  background: #dcfce7;
  color: #166534;
}

.badge-muted {
  background: #f1f5f9;
  color: #64748b;
}

@media (max-width: 640px) {
  .details-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
  60% { transform: translateY(-2px); }
}

/* Blank Template & Preview Status Pill Styling */
.report-status-banner {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
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

.blank-row td {
  height: 28px;
  border: 1px solid #94a3b8;
  background: #ffffff;
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

.loading-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #475569;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.report-error-card {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: #b91c1c;
  margin-bottom: 0.75rem;
}

.report-error-card .error-msg-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.report-error-card .btn-retry {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #f87171;
  background: #ffffff;
  color: #b91c1c;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.report-error-card .btn-retry:hover {
  background: #fee2e2;
}

/* Print Styles */
@media print {
  .print-hidden {
    display: none !important;
  }

  .report-paper-sheet {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
  }

  .als-report-table {
    border: 1.5px solid #000000 !important;
  }

  .als-report-table th,
  .als-report-table td {
    border: 1px solid #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .gender-section-header td {
    background-color: #e5e7eb !important;
  }

  .cell-progress-red {
    color: #dc2626 !important;
  }
}
</style>

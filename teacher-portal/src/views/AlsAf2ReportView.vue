<template>
  <div class="page-container af2-page">
    <!-- Standardized Page Header & Breadcrumb (print-hidden) -->
    <ReportsPageHeader
      title="ALS Assessment Form 2 Report"
      description="Record of Module Use and Monitoring of Learner's Progress"
      reports-path="/dashboard/reports/af2"
    >
      <template #actions>
        <button
          type="button"
          class="btn-encode-record"
          @click="openAddRecordModal"
          title="Encode new module accomplishment for this learner"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Add Learner Record</span>
        </button>
      </template>
    </ReportsPageHeader>

    <!-- Filter Section (Above the Report) -->
    <div class="filter-card print-hidden">
      <!-- Row 1: Balanced 3-Column Grid (Center, Level, Learner) -->
      <div class="filter-dropdowns-row">
        <!-- 1. Learning Center Dropdown -->
        <div class="filter-field">
          <label class="filter-label">Learning Center <span class="req-star">*</span></label>
          <div class="select-wrapper">
            <select
              v-model="filterCenter"
              class="filter-select"
              @change="handleCenterChange"
            >
              <option value="" disabled>Select Learning Center</option>
              <option
                v-for="center in centerOptions"
                :key="center"
                :value="center"
              >
                {{ center }}
              </option>
            </select>
            <span class="select-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>

        <!-- 2. ALS Level Dropdown (Dependent on Learning Center) -->
        <div class="filter-field">
          <label class="filter-label">ALS Level <span class="req-star">*</span></label>
          <div class="select-wrapper">
            <select
              v-model="filterLevel"
              class="filter-select"
              :disabled="!filterCenter"
              @change="handleLevelChange"
            >
              <option value="" disabled>
                {{ !filterCenter ? 'Select Center first' : (availableLevels.length === 0 ? 'No levels available' : 'Select ALS Level') }}
              </option>
              <option
                v-for="lvl in availableLevels"
                :key="lvl"
                :value="lvl"
              >
                {{ lvl }}
              </option>
            </select>
            <span class="select-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>

        <!-- 3. Learner Name Dropdown (Dependent on Center & Level) -->
        <div class="filter-field">
          <label class="filter-label">Learner Name <span class="req-star">*</span></label>
          <div class="select-wrapper">
            <select
              v-model="selectedLearnerId"
              class="filter-select"
              :disabled="!filterCenter || !filterLevel"
              @change="handleLearnerChange"
            >
              <option value="" disabled>
                {{ !filterCenter || !filterLevel ? 'Select Center & Level first' : (availableLearners.length === 0 ? 'No learners available' : 'Select Learner') }}
              </option>
              <option
                v-for="l in availableLearners"
                :key="l.id"
                :value="l.id"
              >
                {{ l.name }}
              </option>
            </select>
            <span class="select-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>
      </div>

      <!-- Row 2: Date Filters & Action Buttons (Aligned from the Left) -->
      <div class="filter-row-secondary">
        <!-- 4. From Date -->
        <div class="filter-field filter-col-date">
          <label class="filter-label">From Date</label>
          <input
            v-model="filterDateStarted"
            type="date"
            class="filter-date-input"
            placeholder="MM/DD/YYYY"
            @change="dateError = ''; validationError = ''"
          />
        </div>

        <!-- 5. To Date -->
        <div class="filter-field filter-col-date">
          <label class="filter-label">To Date</label>
          <input
            v-model="filterDateFinished"
            type="date"
            class="filter-date-input"
            placeholder="MM/DD/YYYY"
            @change="dateError = ''; validationError = ''"
          />
        </div>

        <div class="filter-actions-group">
          <!-- Reset Filters Button -->
          <button
            type="button"
            class="btn-reset-filter"
            @click="resetFilters"
            title="Reset Filters"
          >
            Reset Filters
          </button>

          <!-- Generate Report Button -->
          <button
            type="button"
            class="btn-generate-report"
            :disabled="loadingReport"
            @click="generateReport"
          >
            <span v-if="loadingReport" class="btn-spinner-white"></span>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>{{ loadingReport ? 'Generating...' : 'Generate Report' }}</span>
          </button>
        </div>
      </div>

      <!-- Validation & Date Range Error Messages -->
      <div v-if="validationError || dateError" class="filter-error-text">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ validationError || dateError }}</span>
      </div>
    </div>

    <!-- Formal Report Container -->
    <div class="report-wrapper">
      <!-- Loading State: initial learners fetch -->
      <div v-if="loadingLearners" class="loading-box print-hidden">
        <div class="spinner"></div>
        <p>Loading learner and report data...</p>
      </div>

      <!-- Loading State: generating report -->
      <div v-else-if="loadingReport" class="loading-box print-hidden">
        <div class="spinner"></div>
        <p>Retrieving Assessment Form 2 records...</p>
      </div>

      <!-- Error State: if data retrieval fails -->
      <div v-else-if="reportError" class="report-error-card print-hidden">
        <div class="error-msg-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>Error Generating Report</strong>
            <p>{{ reportError }}</p>
          </div>
        </div>
        <button type="button" class="btn-retry" @click="generateReport">Retry</button>
      </div>

      <!-- Formal Document Container (Landscape ALS Assessment Form 2 — Monthly & Multi-Page) -->
      <div v-else id="report-content" ref="reportContentRef" class="af2-pages-container">
        <!-- Status Banner: Distinguish Blank Template vs Generated Report (Outside the paper sheet) -->
        <div class="report-status-banner print-hidden">
          <div v-if="!hasGeneratedReport" class="status-pill status-blank">
            <span class="status-badge-dot"></span>
            <span class="status-badge-text">Blank Template Preview</span>
            <span class="status-badge-hint">— Select filters above and click Generate Report</span>
          </div>
          <div v-else-if="displayedRecords.length === 0" class="status-pill status-empty">
            <span class="status-badge-dot empty"></span>
            <span class="status-badge-text">Report Generated</span>
            <span class="status-badge-hint">— No module assessment records found for {{ reportData.learnerName }} in the selected period.</span>
          </div>
          <div v-else class="status-pill status-ready">
            <span class="status-badge-dot success"></span>
            <span class="status-badge-text">Report Generated</span>
            <span class="status-badge-hint">— {{ displayedRecords.length }} record(s) loaded for {{ reportData.learnerName }} ({{ monthlyGroupCount }} monthly report{{ monthlyGroupCount === 1 ? '' : 's' }}, {{ monthlyReportPages.length }} page{{ monthlyReportPages.length === 1 ? '' : 's' }})</span>
          </div>
        </div>

        <!-- Render Each Monthly Report Page / Continuation Page -->
        <div
          v-for="(page, pageIdx) in monthlyReportPages"
          :key="page.pageKey"
          class="af2-page-unit"
          :class="{ 'has-page-break': pageIdx < monthlyReportPages.length - 1 }"
        >
          <!-- Monthly & Continuation Page Indicator (Positioned outside the formal printed sheet) -->
          <div v-if="hasGeneratedReport && page.monthLabel" class="af2-month-page-bar print-hidden">
            <span class="month-bar-title">{{ page.monthLabel }}</span>
            <span class="month-bar-sep">—</span>
            <span class="month-bar-page">Page {{ page.pageNumber }} of {{ page.totalPagesInMonth }}</span>
          </div>

          <!-- Horizontal Scroll Wrapper for Mobile/Small Screens -->
          <div class="af2-paper-scroll-wrapper">
            <!-- Exact A4 Landscape Paper Sheet Matching "ALS Assessment Form 2 (1).pdf" -->
            <div class="af2-report-paper">
              <!-- Top-Right Form Identifier (Arial 8pt Regular) -->
              <div class="af2-top-form-code">ALS Assessment Form 2</div>

              <!-- Main Report Title (Arial 12pt Bold Centered) -->
              <div class="af2-clean-header">
                <h2 class="af2-main-title">RECORD OF MODULE USE AND MONITORING OF LEARNER’S PROGRESS</h2>
              </div>

              <!-- Learner Information Section (Indented 22.8pt / 8.04mm inside table bounds to match x=36pt in PDF) -->
              <div class="af2-info-section">
                <!-- Row 1: Name of Learner & Community Learning Center -->
                <div class="info-row">
                  <div class="info-col info-col-left">
                    <span class="info-label">Name of Learner:</span>
                    <span class="info-underline info-underline-learner">{{ reportData.learnerName || '' }}</span>
                  </div>
                  <div class="info-col info-col-right">
                    <span class="info-label">Community Learning Center:</span>
                    <span class="info-underline info-underline-clc">{{ reportData.learningCenter || '' }}</span>
                  </div>
                </div>

                <!-- Row 2: Level & Name of ALS Teacher -->
                <div class="info-row">
                  <div class="info-col info-col-left level-col">
                    <span class="info-label">Level:</span>
                    <div class="level-checkboxes">
                      <span class="level-box-item">
                        <span class="check-square" :class="{ checked: isLevelChecked('BL') }">
                          <span v-if="isLevelChecked('BL')" class="check-mark">✓</span>
                        </span>
                        <span class="level-text">BL</span>
                      </span>
                      <span class="level-box-item">
                        <span class="check-square" :class="{ checked: isLevelChecked('LE') }">
                          <span v-if="isLevelChecked('LE')" class="check-mark">✓</span>
                        </span>
                        <span class="level-text">LE</span>
                      </span>
                      <span class="level-box-item">
                        <span class="check-square" :class="{ checked: isLevelChecked('AE') }">
                          <span v-if="isLevelChecked('AE')" class="check-mark">✓</span>
                        </span>
                        <span class="level-text">AE</span>
                      </span>
                      <span class="level-box-item">
                        <span class="check-square" :class="{ checked: isLevelChecked('JHS') }">
                          <span v-if="isLevelChecked('JHS')" class="check-mark">✓</span>
                        </span>
                        <span class="level-text">JHS</span>
                      </span>
                    </div>
                  </div>
                  <div class="info-col info-col-right">
                    <span class="info-label">Name of ALS Teacher:</span>
                    <span class="info-underline info-underline-teacher">{{ reportData.teacherName || '' }}</span>
                  </div>
                </div>
              </div>

              <!-- Official Report Table (Exact 814.68pt width & locked column widths) -->
              <div class="table-outer-wrapper">
                <table class="af2-table">
                  <colgroup :key="'colgroup-' + page.pageKey">
                    <col class="col-module" style="width: 179.23pt;" />
                    <col class="col-strand" style="width: 28.51pt;" />
                    <col class="col-date-started" style="width: 48.88pt;" />
                    <col class="col-date-finished" style="width: 48.88pt;" />
                    <col class="col-pretest" style="width: 33.40pt;" />
                    <col class="col-posttest" style="width: 33.40pt;" />
                    <col class="col-activities" style="width: 127.09pt;" />
                    <col class="col-self" style="width: 97.76pt;" />
                    <col class="col-mastered" style="width: 39.51pt;" />
                    <col class="col-not-mastered" style="width: 39.51pt;" />
                    <col class="col-remarks" style="width: 138.51pt;" />
                  </colgroup>
                  <thead :key="'thead-' + page.pageKey">
                    <!-- Table Header Row 1 (Height: 74.78pt) -->
                    <tr class="thead-row-1">
                      <th rowspan="2" class="th-module">
                        <span class="th-en-11">Title of Learning Module</span>
                        <span class="th-tl-10">(Pamagat ng Modyul)</span>
                      </th>
                      <th rowspan="2" class="th-strand">
                        <span class="th-en-65">Learning<br>Strand</span>
                      </th>
                      <th colspan="2" class="th-date">
                        <span class="th-en-11">Date</span>
                        <span class="th-tl-10">(Petsa)</span>
                      </th>
                      <th rowspan="2" class="th-pretest">
                        <span class="th-en-95">Pre-<br>Test<br>Result</span>
                        <span class="th-tl-55">(Resulta ng<br>Panimulang<br>Pagtataya)</span>
                      </th>
                      <th rowspan="2" class="th-posttest">
                        <span class="th-en-95">Post-<br>Test<br>Result</span>
                        <span class="th-tl-55">(Resulta ng<br>Pagtatapos na<br>Pagtataya)</span>
                      </th>
                      <th rowspan="2" class="th-activities">
                        <span class="th-en-11">Other Related<br>Activities<br>Accomplished</span>
                        <span class="th-tl-10">(Iba pang<br>Gawaing<br>Natapos)</span>
                      </th>
                      <th rowspan="2" class="th-self">
                        <span class="th-en-11">Learner’s<br>Self-Assessment of<br>Performance</span>
                        <span class="th-tl-10">(Pagtatasa sa<br>Sarili sa<br>Pagganap)</span>
                      </th>
                      <th colspan="2" class="th-teacher-assessment">
                        <span class="th-en-11">ALS<br>Teacher’s<br>Assessment</span>
                        <span class="th-tl-10">(Pagtatasa ng<br>Guro sa ALS)</span>
                      </th>
                      <th rowspan="2" class="th-remarks">
                        <span class="th-en-11">ALS Teacher’s Remarks</span>
                        <span class="th-tl-10">(Puna ng Guro sa ALS)</span>
                      </th>
                    </tr>

                    <!-- Table Header Row 2 (Subheaders, Height: 25.32pt) -->
                    <tr class="thead-row-2">
                      <th class="th-sub-date th-sub-date-started">
                        <span class="th-en-8">Started</span>
                        <span class="th-tl-6">(Simula)</span>
                      </th>
                      <th class="th-sub-date th-sub-date-finished">
                        <span class="th-en-8">Finished</span>
                        <span class="th-tl-6">(Pagtapos)</span>
                      </th>
                      <th class="th-sub-mastery th-sub-mastered">
                        <span class="th-en-8">Mastered</span>
                        <span class="th-tl-6-bold">(Natuto)</span>
                      </th>
                      <th class="th-sub-mastery th-sub-not-mastered">
                        <span class="th-en-8">Not<br>Mastered</span>
                        <span class="th-tl-6-bold">(Hindi Natuto)</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <!-- 10 Fixed-Height Writing Rows per Page (23.04pt each, matching PDF) -->
                    <tr
                      v-for="(row, rIdx) in page.rows"
                      :key="row.rowKey || rIdx"
                      :class="row.isBlank ? 'blank-row' : 'record-row'"
                    >
                      <td class="cell-left td-module">
                        <div class="cell-single-line">{{ row.moduleTitle }}</div>
                      </td>
                      <td class="cell-center td-strand">
                        <div class="cell-single-line">{{ row.strandCode }}</div>
                      </td>
                      <td class="cell-center td-date td-date-started">
                        <div class="cell-single-line">{{ row.dateStarted }}</div>
                      </td>
                      <td class="cell-center td-date td-date-finished">
                        <div class="cell-single-line">{{ row.dateFinished }}</div>
                      </td>
                      <td class="cell-center td-score td-pretest">
                        <div class="cell-single-line">{{ row.preTest }}</div>
                      </td>
                      <td class="cell-center td-score td-posttest">
                        <div class="cell-single-line">{{ row.postTest }}</div>
                      </td>
                      <td class="cell-left td-activities">
                        <div class="cell-single-line">{{ row.otherActivities }}</div>
                      </td>
                      <td class="cell-left td-self">
                        <div class="cell-single-line">{{ row.selfAssessment }}</div>
                      </td>
                      <td class="cell-center td-check td-mastered">
                        <span v-if="row.isMastered" class="af2-check-mark">✓</span>
                      </td>
                      <td class="cell-center td-check td-not-mastered">
                        <span v-if="row.isNotMastered" class="af2-check-mark">✓</span>
                      </td>
                      <td class="cell-left td-remarks">
                        <div class="cell-single-line">{{ row.remarks }}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Bottom Signatures Section (Exact PDF coordinates & font sizes) -->
              <div class="af2-signatures-section">
                <!-- Learner Signature -->
                <div class="signature-block sig-block-left">
                  <div class="sig-name-slot">
                    <span class="sig-printed-name">{{ reportData.learnerName || '' }}</span>
                  </div>
                  <div class="sig-caption">(Learner’s Signature over Printed Name)</div>
                  <div class="sig-date-row">
                    <span class="sig-date-label">Date:</span>
                    <span class="sig-date-line"></span>
                  </div>
                </div>

                <!-- ALS Teacher Signature -->
                <div class="signature-block sig-block-right">
                  <div class="sig-name-slot">
                    <span class="sig-printed-name">{{ reportData.teacherName || '' }}</span>
                  </div>
                  <div class="sig-caption">(ALS Teacher’s Signature over Printed Name)</div>
                  <div class="sig-date-row">
                    <span class="sig-date-label">Date:</span>
                    <span class="sig-date-line"></span>
                  </div>
                </div>
              </div>

              <!-- Bottom-Right Footer Notation (Arial 8pt Regular: "10/2020") -->
              <div class="af2-bottom-revision">10/2020</div>
            </div>
          </div>
        </div>
      </div>

      <!-- PRINT ACTION BUTTON (Below report preview, no-print) -->
      <div id="pdf-action-section" class="pdf-action-container no-print print-hidden">
        <button
          type="button"
          class="btn-print-report"
          @click="handlePrintReport"
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

    <!-- Quick Modal: Add Learner Record for Selected Learner -->
    <div v-if="showAddModal" class="modal-overlay print-hidden" @click.self="showAddModal = false">
      <div class="modal-box record-modal-box">
        <div class="modal-header">
          <div>
            <h2 class="modal-title-text">Add Learner Record</h2>
            <p class="modal-sub-text">Record module progress and assessment for {{ reportData.learnerName }}</p>
          </div>
          <button type="button" class="modal-close-btn" @click="showAddModal = false">&times;</button>
        </div>

        <form @submit.prevent="saveNewAf2Record" class="record-form">
          <!-- 1. Learner (Fixed/Selected) -->
          <div class="form-group">
            <label class="form-label">Learner Name</label>
            <input
              type="text"
              class="form-input"
              :value="reportData.learnerName"
              disabled
            />
          </div>

          <!-- 2. Module Title -->
          <div class="form-group">
            <label class="form-label">Title of Learning Module <span class="req">*</span></label>
            <input
              v-model="newRecordForm.moduleTitle"
              type="text"
              class="form-input"
              placeholder="e.g., Communication Skills (English) Module 1: Active Listening"
              required
            />
          </div>

          <!-- 3. Learning Strand -->
          <div class="form-group">
            <label class="form-label">Learning Strand <span class="req">*</span></label>
            <select v-model="newRecordForm.strandName" class="form-select custom-select-arrow" required>
              <option value="LS1 Communication Skills (English)">LS1 Communication Skills (English)</option>
              <option value="LS1 Communication Skills (Filipino)">LS1 Communication Skills (Filipino)</option>
              <option value="LS2 Scientific Literacy and Critical Thinking">LS2 Scientific Literacy and Critical Thinking</option>
              <option value="LS3 Mathematical and Problem Solving Skills">LS3 Mathematical and Problem Solving Skills</option>
              <option value="LS4 Life and Career Skills">LS4 Life and Career Skills</option>
              <option value="LS5 Digital Literacy">LS5 Digital Literacy</option>
              <option value="LS6 Understanding the Self and Society">LS6 Understanding the Self and Society</option>
            </select>
          </div>

          <!-- 4. Date Started & Finished -->
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Date Started <span class="req">*</span></label>
              <input
                v-model="newRecordForm.dateStarted"
                type="date"
                class="form-input date-input"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Date Finished <span class="req">*</span></label>
              <input
                v-model="newRecordForm.dateFinished"
                type="date"
                class="form-input date-input"
                required
              />
            </div>
          </div>

          <!-- 5. Pre-Test & Post-Test Scores -->
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Pre-Test Result (Score / Total)</label>
              <div class="score-input-split">
                <input
                  v-model.number="newRecordForm.preTestScore"
                  type="number"
                  min="0"
                  class="form-input score-num-in"
                  placeholder="Score"
                />
                <span class="slash-div">/</span>
                <input
                  v-model.number="newRecordForm.preTestTotal"
                  type="number"
                  min="1"
                  class="form-input score-num-in"
                  placeholder="10"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Post-Test Result (Score / Total)</label>
              <div class="score-input-split">
                <input
                  v-model.number="newRecordForm.postTestScore"
                  type="number"
                  min="0"
                  class="form-input score-num-in"
                  placeholder="Score"
                />
                <span class="slash-div">/</span>
                <input
                  v-model.number="newRecordForm.postTestTotal"
                  type="number"
                  min="1"
                  class="form-input score-num-in"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          <!-- 6. Other Related Activities Accomplished -->
          <div class="form-group">
            <label class="form-label">Other Related Activities Accomplished</label>
            <textarea
              v-model="newRecordForm.otherActivities"
              rows="2"
              class="form-textarea"
              placeholder="e.g., Worksheets, Reading Activity, Performance Task"
            ></textarea>
          </div>

          <!-- 8. ALS Teacher's Assessment (Mastered / Not Mastered) -->
          <div class="form-group">
            <label class="form-label">ALS Teacher’s Assessment <span class="req">*</span></label>
            <div class="assessment-cards-grid">
              <div
                class="assessment-card card-mastered"
                :class="{ 'is-selected': newRecordForm.assessment === 'Mastered' }"
                role="button"
                tabindex="0"
                @click="newRecordForm.assessment = 'Mastered'"
                @keydown.space.prevent="newRecordForm.assessment = 'Mastered'"
                @keydown.enter.prevent="newRecordForm.assessment = 'Mastered'"
              >
                <div class="assessment-radio-circle">
                  <span v-if="newRecordForm.assessment === 'Mastered'" class="radio-dot"></span>
                </div>
                <div class="assessment-card-info">
                  <span class="assessment-card-title">Mastered</span>
                  <span class="assessment-card-desc">Competency achieved (✓ placed in Mastered column)</span>
                </div>
              </div>

              <div
                class="assessment-card card-not-mastered"
                :class="{ 'is-selected': newRecordForm.assessment === 'Not Mastered' }"
                role="button"
                tabindex="0"
                @click="newRecordForm.assessment = 'Not Mastered'"
                @keydown.space.prevent="newRecordForm.assessment = 'Not Mastered'"
                @keydown.enter.prevent="newRecordForm.assessment = 'Not Mastered'"
              >
                <div class="assessment-radio-circle">
                  <span v-if="newRecordForm.assessment === 'Not Mastered'" class="radio-dot"></span>
                </div>
                <div class="assessment-card-info">
                  <span class="assessment-card-title">Not Mastered</span>
                  <span class="assessment-card-desc">Needs intervention (✓ placed in Not Mastered column)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 9. Teacher Remarks -->
          <div class="form-group">
            <label class="form-label">ALS Teacher’s Remarks</label>
            <textarea
              v-model="newRecordForm.remarks"
              rows="2"
              class="form-textarea"
              placeholder="Observations, recommendations, or interventions provided..."
            ></textarea>
          </div>

          <!-- Modal Actions -->
          <div class="modal-footer-actions">
            <button
              type="button"
              class="btn-cancel"
              @click="showAddModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-submit-record"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import ReportsPageHeader from '../components/ReportsPageHeader.vue';
import { exportReportToPdf } from '../utils/pdfExport.js';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { useAf2Records } from '../composables/useAf2Records.js';
import { getAssignedLearners } from '../api/learners.js';
import { getTeacherProfile } from '../api/auth.js';
import { getRecords, createRecord } from '../api/records.js';
import api from '../api/axios.js';

const { currentTeacher, teacherName, teacherId, assignedCenters } = useTeacherSession();
const { getRecordsForLearner, saveRecord, seedDefaultRecordsIfEmpty } = useAf2Records();

const reportContentRef = ref(null);
const generatingPdf = ref(false);

// Assigned learners
const assignedLearnersList = ref([]);
const loadingLearners = ref(false);

// Filter Form State (Strictly Dependent)
const filterCenter = ref('');
const filterLevel = ref('');
const selectedLearnerId = ref('');
const filterDateStarted = ref('');
const filterDateFinished = ref('');
const validationError = ref('');
const dateError = ref('');
const reportError = ref('');
const hasGeneratedReport = ref(false);
const loadingReport = ref(false);

// Filtered report data container
const reportData = reactive({
  learnerId: null,
  learnerName: '',
  lrn: '',
  level: '',
  learningCenter: '',
  teacherName: teacherName.value || '',
  records: [],
});

// Distinct learning centers assigned to current logged-in teacher
const centerOptions = computed(() => {
  const set = new Set();
  if (Array.isArray(assignedCenters.value)) {
    for (const c of assignedCenters.value) {
      if (c && c.name && c.name !== '—') set.add(c.name.trim());
    }
  }
  if (currentTeacher.value?.learningCenter && currentTeacher.value.learningCenter !== '—') {
    set.add(currentTeacher.value.learningCenter.trim());
  }
  for (const l of assignedLearnersList.value) {
    if (l.learningCenter && l.learningCenter !== '—') {
      set.add(l.learningCenter.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
});

// Available ALS Levels for the selected Learning Center and Teacher
const availableLevels = computed(() => {
  if (!filterCenter.value) return [];
  const set = new Set();
  const learnersInCenter = assignedLearnersList.value.filter(
    (l) => l.learningCenter === filterCenter.value
  );
  learnersInCenter.forEach((l) => {
    if (l.level) set.add(normalizeLevel(l.level));
  });

  // If no learners exist yet in that center, fallback to standard levels
  if (set.size === 0) {
    const spec = (currentTeacher.value?.specialization || currentTeacher.value?.programLevel || '').toLowerCase();
    if (spec.includes('elem')) {
      set.add('A&E Elementary');
    } else if (spec.includes('junior') || spec.includes('jhs') || spec.includes('sec')) {
      set.add('A&E Junior High');
    } else {
      set.add('A&E Elementary');
      set.add('A&E Junior High');
    }
  }

  // Use exactly "A&E Elementary" and "A&E Junior High" as level labels
  const allowed = ['A&E Elementary', 'A&E Junior High'];
  return allowed.filter((lvl) => set.has(lvl));
});

// Available Learners assigned to teacher who match BOTH selected Center and Level
const availableLearners = computed(() => {
  if (!filterCenter.value || !filterLevel.value) return [];
  return assignedLearnersList.value
    .filter((l) => {
      const centerMatch = l.learningCenter === filterCenter.value;
      const levelMatch = normalizeLevel(l.level) === normalizeLevel(filterLevel.value);
      return centerMatch && levelMatch;
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
});

// Load assigned learners and learning centers for current logged-in teacher from backend
async function loadLearners() {
  loadingLearners.value = true;
  try {
    const tid = teacherId.value || currentTeacher.value?.id;
    if (tid) {
      try {
        const { data: profile } = await getTeacherProfile(tid);
        if (profile) {
          if (Array.isArray(profile.learningCenters) && profile.learningCenters.length > 0) {
            currentTeacher.value = {
              ...currentTeacher.value,
              learningCenters: profile.learningCenters,
            };
          }
          if (profile.learningCenter && !currentTeacher.value?.learningCenter) {
            currentTeacher.value = {
              ...currentTeacher.value,
              learningCenter: profile.learningCenter,
            };
          }
        }
      } catch (e) {
        // Fallback to existing session
      }
    }

    if (!tid) {
      assignedLearnersList.value = [];
      return;
    }
    const { data } = await getAssignedLearners({ teacherId: tid });
    if (Array.isArray(data) && data.length > 0) {
      assignedLearnersList.value = data.map((l) => ({
        id: l.id,
        name: l.name || (l.lastName && l.firstName ? `${l.lastName}, ${l.firstName}${l.middleName ? ' ' + l.middleName : ''}` : (l.fullName || 'Learner')),
        lrn: l.lrn || '',
        level: normalizeLevel(l.level),
        learningCenter: l.learningCenter || l.learningCenterDetails?.name || '—',
        learningCenterId: l.learningCenterId,
        assignedTeacherId: l.assignedTeacherId,
        assignedTeacher: l.assignedTeacher,
      }));
    } else {
      assignedLearnersList.value = [];
    }
  } catch (err) {
    console.error('Could not fetch assigned learners from API:', err);
    assignedLearnersList.value = [];
  } finally {
    loadingLearners.value = false;
  }
}

function normalizeLevel(lvl) {
  if (!lvl) return 'A&E Elementary';
  const str = String(lvl).toLowerCase();
  if (str.includes('elem') || str === 'ae') return 'A&E Elementary';
  if (str.includes('junior') || str.includes('sec') || str.includes('jhs')) return 'A&E Junior High';
  return 'A&E Elementary';
}

// Dependent Dropdown Change Handlers
function handleCenterChange() {
  filterLevel.value = '';
  selectedLearnerId.value = '';
  validationError.value = '';
  dateError.value = '';
}

function handleLevelChange() {
  selectedLearnerId.value = '';
  validationError.value = '';
  dateError.value = '';
}

function handleLearnerChange() {
  validationError.value = '';
}

function resetFilters() {
  filterCenter.value = '';
  filterLevel.value = '';
  selectedLearnerId.value = '';
  filterDateStarted.value = '';
  filterDateFinished.value = '';
  validationError.value = '';
  dateError.value = '';
  reportError.value = '';
  hasGeneratedReport.value = false;
  loadingReport.value = false;

  reportData.learnerId = null;
  reportData.learnerName = '';
  reportData.lrn = '';
  reportData.level = '';
  reportData.learningCenter = '';
  reportData.teacherName = teacherName.value && teacherName.value !== 'ALS Teacher' ? teacherName.value : (currentTeacher.value?.fullName || '');
  reportData.records = [];
}

// Generate / Refresh formal report with strict validation
async function generateReport() {
  validationError.value = '';
  dateError.value = '';
  reportError.value = '';

  if (!filterCenter.value) {
    validationError.value = 'Please select a Learning Center.';
    return;
  }
  if (!filterLevel.value) {
    validationError.value = 'Please select an ALS Level.';
    return;
  }
  if (!selectedLearnerId.value) {
    validationError.value = 'Please select a Learner Name.';
    return;
  }
  if (filterDateStarted.value && filterDateFinished.value && filterDateStarted.value > filterDateFinished.value) {
    dateError.value = 'From date cannot be later than To date.';
    return;
  }

  const found = assignedLearnersList.value.find((l) => String(l.id) === String(selectedLearnerId.value));
  if (!found) {
    validationError.value = 'Selected learner was not found in your assigned learners.';
    return;
  }

  loadingReport.value = true;
  try {
    reportData.learnerId = found.id;
    reportData.learnerName = found.name;
    reportData.lrn = found.lrn || '';
    reportData.level = filterLevel.value || found.level || 'A&E Elementary';
    reportData.learningCenter = filterCenter.value || found.learningCenter || '';
    reportData.teacherName = teacherName.value && teacherName.value !== 'ALS Teacher' ? teacherName.value : (currentTeacher.value?.fullName || found.assignedTeacher || '');

    // 1. Fetch live learner performance records from backend /api/records
    const tid = teacherId.value || currentTeacher.value?.id;
    const params = {
      teacherId: tid || undefined,
      learnerId: found.id,
      level: reportData.level,
      learningCenter: reportData.learningCenter,
      fromDate: filterDateStarted.value || undefined,
      toDate: filterDateFinished.value || undefined,
    };

    let serverRecords = [];
    try {
      const res = await getRecords(params);
      serverRecords = Array.isArray(res.data) ? res.data : [];
    } catch (apiErr) {
      console.warn('Could not fetch records from /api/records, trying direct lookup:', apiErr);
    }

    // Direct lookup fallback if query with center/level returned empty
    if (serverRecords.length === 0) {
      try {
        const fallbackRes = await getRecords({ learnerId: found.id, teacherId: tid || undefined });
        if (Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
          serverRecords = fallbackRes.data;
        }
      } catch (fbErr) {
        console.warn('Fallback direct lookup error:', fbErr);
      }
    }

    // Secondary fallback: check /api/af2
    if (serverRecords.length === 0) {
      try {
        const af2Res = await api.get('/af2', { params: { learnerId: found.id } });
        if (Array.isArray(af2Res.data) && af2Res.data.length > 0) {
          serverRecords = af2Res.data;
        }
      } catch (af2Err) {
        // ignore
      }
    }

    // If date filters were applied, filter serverRecords inclusively
    if (filterDateStarted.value || filterDateFinished.value) {
      const startRange = (filterDateStarted.value || '').trim();
      const endRange = (filterDateFinished.value || '').trim();
      serverRecords = serverRecords.filter((r) => {
        const finishDate = (r.dateFinished || r.dateCompleted || '').trim().split('T')[0];
        const startDate = (r.dateStarted || '').trim().split('T')[0];
        if (!finishDate && !startDate) return true;
        const matchesFinish = finishDate && (!startRange || finishDate >= startRange) && (!endRange || finishDate <= endRange);
        const matchesStart = startDate && (!startRange || startDate >= startRange) && (!endRange || startDate <= endRange);
        return matchesFinish || matchesStart;
      });
    }

    // 2. Merge any local AF2 records stored in browser (offline fallback / manual entries)
    const existingKeys = new Set(
      serverRecords.map((r) => `${r.learnerId}_${(r.moduleId || r.moduleTitle || '').toString().trim().toLowerCase()}`)
    );

    const localRecs = getRecordsForLearner({
      learnerId: found.id,
      learnerName: found.name,
      level: reportData.level,
      learningCenter: reportData.learningCenter,
      dateStarted: filterDateStarted.value,
      dateFinished: filterDateFinished.value,
    });

    for (const lr of localRecs) {
      const key = `${lr.learnerId}_${(lr.moduleId || lr.moduleTitle || '').toString().trim().toLowerCase()}`;
      if (!existingKeys.has(key)) {
        serverRecords.push(lr);
        existingKeys.add(key);
      }
    }

    reportData.records = serverRecords;
    hasGeneratedReport.value = true;

    const el = document.getElementById('report-content');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    console.error('Error generating AF2 report:', err);
    reportError.value = 'Failed to retrieve assessment records. Please try again.';
  } finally {
    loadingReport.value = false;
  }
}

// Checkbox indicators for BL, LE, AE, JHS
function isLevelChecked(code) {
  const current = (reportData.level || '').toLowerCase();
  if (code === 'AE' && (current.includes('elem') || current === 'ae' || current === 'a&e elementary')) return true;
  if (code === 'JHS' && (current.includes('junior') || current.includes('jhs') || current.includes('sec') || current === 'a&e junior high school')) return true;
  if (code === 'BL' && (current.includes('basic') || current === 'bl')) return true;
  if (code === 'LE' && (current.includes('lower') || current === 'le')) return true;
  return false;
}

// Assessment Logic: Mastered vs Not Mastered
function isMastered(val) {
  if (!val) return false;
  const s = String(val).toLowerCase();
  return s === 'mastered' || s === 'completed';
}

function isNotMastered(val) {
  if (!val) return false;
  const s = String(val).toLowerCase();
  return s === 'not mastered' || s === 'not_mastered';
}

// Displayed records
const displayedRecords = computed(() => {
  return reportData.records || [];
});

// Number of writing rows per official ALS Assessment Form 2 page (matches "ALS Assessment Form 2 (1).pdf")
const ROWS_PER_PAGE = 10;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function createBlankRow(key) {
  return {
    rowKey: key,
    isBlank: true,
    isContinuation: false,
    moduleTitle: '',
    strandCode: '',
    dateStarted: '',
    dateFinished: '',
    preTest: '',
    postTest: '',
    otherActivities: '',
    selfAssessment: '',
    isMastered: false,
    isNotMastered: false,
    remarks: '',
  };
}

/**
 * Splits multi-line or long text into individual single-line segments that fit within
 * a fixed-height table row under the same column without truncating any characters.
 */
function splitTextToLines(rawText, maxCharsPerLine = 24) {
  if (rawText == null) return [];
  const str = String(rawText).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!str || str === '—') return [];

  const rawLines = str.split('\n');
  const result = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxCharsPerLine) {
      result.push(trimmed);
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        if (word.length <= maxCharsPerLine) {
          currentLine = word;
        } else {
          // Break an unbroken long token into chunks so no character is lost or clipped
          let idx = 0;
          while (idx < word.length) {
            const chunk = word.slice(idx, idx + maxCharsPerLine);
            if (chunk.length === maxCharsPerLine && idx + maxCharsPerLine < word.length) {
              result.push(chunk);
            } else {
              currentLine = chunk;
            }
            idx += maxCharsPerLine;
          }
        }
      } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
        currentLine += ' ' + word;
      } else {
        result.push(currentLine);
        if (word.length <= maxCharsPerLine) {
          currentLine = word;
        } else {
          currentLine = '';
          let idx = 0;
          while (idx < word.length) {
            const chunk = word.slice(idx, idx + maxCharsPerLine);
            if (chunk.length === maxCharsPerLine && idx + maxCharsPerLine < word.length) {
              result.push(chunk);
            } else {
              currentLine = chunk;
            }
            idx += maxCharsPerLine;
          }
        }
      }
    }

    if (currentLine) {
      result.push(currentLine);
    }
  }

  return result;
}

/**
 * Expands a single learner module record into 1 primary row + N continuation rows
 * so that long text in Module Title, Other Related Activities, Self-Assessment, or Remarks
 * continues onto consecutive rows in the same column without increasing row height.
 */
function expandRecordToRows(rec, recIdx) {
  const titleLines = splitTextToLines(rec.moduleTitle, 32);
  const activityLines = splitTextToLines(rec.otherActivities, 22);
  const selfLines = splitTextToLines(rec.selfAssessment, 17);
  const remarkLines = splitTextToLines(rec.remarks, 24);

  const totalLines = Math.max(
    1,
    titleLines.length,
    activityLines.length,
    selfLines.length,
    remarkLines.length
  );

  const strandCode = formatStrandDisplay(rec.strandName || formatStrandFromModule(rec.moduleTitle));
  const dateStarted = formatDate(rec.dateStarted);
  const dateFinished = formatDate(rec.dateFinished || rec.dateCompleted);
  const preTest = formatScoreDisplay(rec.preTestScore, rec.preTestTotal);
  const postTest = formatScoreDisplay(rec.postTestScore, rec.postTestTotal);
  const mastered = isMastered(rec.assessment || rec.moduleStatus);
  const notMastered = isNotMastered(rec.assessment || rec.moduleStatus);

  const rows = [];
  for (let i = 0; i < totalLines; i++) {
    if (i === 0) {
      rows.push({
        rowKey: `${rec.id || recIdx}-line-0`,
        isBlank: false,
        isContinuation: false,
        moduleTitle: titleLines[0] || '',
        strandCode,
        dateStarted,
        dateFinished,
        preTest,
        postTest,
        otherActivities: activityLines[0] || '',
        selfAssessment: selfLines[0] || '',
        isMastered: mastered,
        isNotMastered: notMastered,
        remarks: remarkLines[0] || '',
      });
    } else {
      rows.push({
        rowKey: `${rec.id || recIdx}-line-${i}`,
        isBlank: false,
        isContinuation: true,
        moduleTitle: titleLines[i] || '',
        strandCode: '',
        dateStarted: '',
        dateFinished: '',
        preTest: '',
        postTest: '',
        otherActivities: activityLines[i] || '',
        selfAssessment: selfLines[i] || '',
        isMastered: false,
        isNotMastered: false,
        remarks: remarkLines[i] || '',
      });
    }
  }

  return rows;
}

/**
 * Determines the calendar month key (YYYY-MM) and human-readable label (e.g. "October 2026")
 * for a record using its completion/finish date (or start date fallback).
 */
function extractRecordMonthInfo(rec) {
  const rawDate = (rec.dateFinished || rec.dateCompleted || rec.dateStarted || '').toString().trim();
  if (rawDate) {
    const isoMatch = rawDate.match(/^(\d{4})-(\d{2})/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const monthIdx = Number(isoMatch[2]) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return {
          monthKey: `${isoMatch[1]}-${isoMatch[2]}`,
          monthLabel: `${MONTH_NAMES[monthIdx]} ${year}`,
        };
      }
    }
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const monthIdx = parsed.getMonth();
      const mm = String(monthIdx + 1).padStart(2, '0');
      return {
        monthKey: `${year}-${mm}`,
        monthLabel: `${MONTH_NAMES[monthIdx]} ${year}`,
      };
    }
  }
  return {
    monthKey: '9999-99',
    monthLabel: 'General Records',
  };
}

// Groups records by calendar month and paginates each month into 10-row AF2 continuation pages
const monthlyGroups = computed(() => {
  if (!hasGeneratedReport.value || displayedRecords.value.length === 0) {
    return [];
  }

  const map = new Map();
  for (const rec of displayedRecords.value) {
    const { monthKey, monthLabel } = extractRecordMonthInfo(rec);
    if (!map.has(monthKey)) {
      map.set(monthKey, { monthKey, monthLabel, records: [] });
    }
    map.get(monthKey).records.push(rec);
  }

  return Array.from(map.values())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((group) => {
      const sortedRecords = [...group.records].sort((a, b) => {
        const da = (a.dateFinished || a.dateCompleted || a.dateStarted || '').toString();
        const db = (b.dateFinished || b.dateCompleted || b.dateStarted || '').toString();
        return da.localeCompare(db);
      });
      return {
        ...group,
        records: sortedRecords,
      };
    });
});

const monthlyGroupCount = computed(() => monthlyGroups.value.length);

const monthlyReportPages = computed(() => {
  // Blank template preview or empty report: render 1 page with 10 blank writing rows
  if (monthlyGroups.value.length === 0) {
    const blankRows = Array.from({ length: ROWS_PER_PAGE }, (_, i) => createBlankRow(`blank-init-${i}`));
    return [
      {
        pageKey: 'blank-template-page-1',
        monthKey: '',
        monthLabel: '',
        pageNumber: 1,
        totalPagesInMonth: 1,
        rows: blankRows,
      },
    ];
  }

  const pages = [];

  for (const group of monthlyGroups.value) {
    const expandedRows = [];
    group.records.forEach((rec, idx) => {
      expandedRows.push(...expandRecordToRows(rec, `${group.monthKey}-${idx}`));
    });

    const totalPagesInMonth = Math.max(1, Math.ceil(expandedRows.length / ROWS_PER_PAGE));

    for (let p = 0; p < totalPagesInMonth; p++) {
      const slice = expandedRows.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE);
      while (slice.length < ROWS_PER_PAGE) {
        slice.push(createBlankRow(`blank-${group.monthKey}-p${p + 1}-${slice.length}`));
      }

      pages.push({
        pageKey: `${group.monthKey}-page-${p + 1}`,
        monthKey: group.monthKey,
        monthLabel: group.monthLabel,
        pageNumber: p + 1,
        totalPagesInMonth,
        rows: slice,
      });
    }
  }

  return pages;
});

function formatDate(dStr) {
  if (!dStr) return '';
  if (typeof dStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dStr)) {
    const parts = dStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
  }
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return dStr;
  }
}

function formatScoreDisplay(score, total) {
  if (score == null || score === '') return '';
  return total != null && total !== '' ? `${score}/${total}` : `${score}`;
}

function formatStrandFromModule(title) {
  if (!title) return 'LS1';
  const t = title.toLowerCase();
  if (t.includes('communication') || t.includes('english') || t.includes('filipino')) return 'LS1';
  if (t.includes('scientific') || t.includes('science')) return 'LS2';
  if (t.includes('math') || t.includes('problem')) return 'LS3';
  if (t.includes('career') || t.includes('life')) return 'LS4';
  if (t.includes('digital') || t.includes('computer')) return 'LS5';
  if (t.includes('self') || t.includes('society')) return 'LS6';
  return 'LS1';
}

/**
 * Displays ONLY the compact Learning Strand code: LS1, LS2, LS3, LS4, LS5, or LS6.
 */
function formatStrandDisplay(strand) {
  if (!strand) return 'LS1';
  const str = String(strand).trim();
  const codeMatch = str.match(/\b(LS\s*[1-6])\b/i);
  if (codeMatch) {
    return codeMatch[1].replace(/\s+/g, '').toUpperCase();
  }
  const lower = str.toLowerCase();
  if (lower.includes('english') || lower.includes('filipino') || lower.includes('communication')) return 'LS1';
  if (lower.includes('scientific') || lower.includes('science') || lower.includes('critical')) return 'LS2';
  if (lower.includes('math') || lower.includes('problem')) return 'LS3';
  if (lower.includes('career') || lower.includes('life')) return 'LS4';
  if (lower.includes('digital') || lower.includes('computer')) return 'LS5';
  if (lower.includes('self') || lower.includes('society') || lower.includes('personal')) return 'LS6';
  return 'LS1';
}

// Print action (Prints currently displayed AF2 report state)
function handlePrintReport() {
  window.print();
}

// Quick Add Record Modal
const showAddModal = ref(false);
const newRecordForm = reactive({
  moduleTitle: '',
  strandName: 'LS1 Communication Skills (English)',
  dateStarted: new Date().toISOString().split('T')[0],
  dateFinished: new Date().toISOString().split('T')[0],
  preTestScore: null,
  preTestTotal: 10,
  postTestScore: null,
  postTestTotal: 10,
  otherActivities: 'Worksheets, Reading Activity, Performance Task',
  selfAssessment: '',
  assessment: 'Mastered',
  remarks: '',
});

function openAddRecordModal() {
  if (!reportData.learnerId) {
    validationError.value = 'Please select a Learning Center, ALS Level, and Learner Name, and click Generate Report first.';
    return;
  }
  newRecordForm.moduleTitle = '';
  newRecordForm.strandName = 'LS1 Communication Skills (English)';
  newRecordForm.dateStarted = new Date().toISOString().split('T')[0];
  newRecordForm.dateFinished = new Date().toISOString().split('T')[0];
  newRecordForm.preTestScore = null;
  newRecordForm.preTestTotal = 10;
  newRecordForm.postTestScore = null;
  newRecordForm.postTestTotal = 10;
  newRecordForm.otherActivities = 'Worksheets, Reading Activity, Performance Task';
  newRecordForm.selfAssessment = '';
  newRecordForm.assessment = 'Mastered';
  newRecordForm.remarks = '';

  showAddModal.value = true;
}

async function saveNewAf2Record() {
  if (!newRecordForm.moduleTitle.trim()) {
    alert('Please enter the module title.');
    return;
  }
  if (!newRecordForm.dateStarted || !newRecordForm.dateFinished) {
    alert('Please enter both date started and finished.');
    return;
  }

  const payload = {
    learnerId: reportData.learnerId,
    learnerName: reportData.learnerName,
    lrn: reportData.lrn,
    level: reportData.level,
    centerName: reportData.learningCenter,
    learningCenter: reportData.learningCenter,
    moduleTitle: newRecordForm.moduleTitle.trim(),
    strandName: newRecordForm.strandName,
    dateStarted: newRecordForm.dateStarted,
    dateFinished: newRecordForm.dateFinished,
    dateCompleted: newRecordForm.dateFinished,
    preTestScore: newRecordForm.preTestScore != null && newRecordForm.preTestScore !== '' ? Number(newRecordForm.preTestScore) : null,
    preTestTotal: newRecordForm.preTestTotal != null && newRecordForm.preTestTotal !== '' ? Number(newRecordForm.preTestTotal) : null,
    postTestScore: newRecordForm.postTestScore != null && newRecordForm.postTestScore !== '' ? Number(newRecordForm.postTestScore) : null,
    postTestTotal: newRecordForm.postTestTotal != null && newRecordForm.postTestTotal !== '' ? Number(newRecordForm.postTestTotal) : null,
    otherActivities: newRecordForm.otherActivities.trim(),
    selfAssessment: '',
    assessment: newRecordForm.assessment,
    moduleStatus: newRecordForm.assessment,
    remarks: newRecordForm.remarks.trim(),
  };

  try {
    await createRecord(payload);
  } catch (err) {
    console.warn('Could not save record to backend /api/records, saving locally:', err);
  }

  saveRecord(payload);

  showAddModal.value = false;
  await generateReport();
}

onMounted(() => {
  loadLearners();
});

// Watch teacher profile updates
watch(
  [teacherName, () => currentTeacher.value?.fullName],
  ([newVal, newFull]) => {
    const resolved = newVal && newVal !== 'ALS Teacher' ? newVal : (newFull || '');
    if (resolved) {
      reportData.teacherName = resolved;
    }
  }
);

// Watch for teacher ID becoming available asynchronously to load assigned learners
watch(
  () => teacherId.value || currentTeacher.value?.id,
  (newTid) => {
    if (newTid && assignedLearnersList.value.length === 0) {
      loadLearners();
    }
  }
);
</script>

<style scoped>
/* Main Page Layout */
.af2-page {
  padding-bottom: 3rem;
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  margin-bottom: 0.5rem;
}

.breadcrumb-link {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.breadcrumb-link:hover {
  color: #2563eb;
}

.breadcrumb-separator {
  color: #94a3b8;
}

.breadcrumb-current {
  color: #1e293b;
  font-weight: 600;
}

/* Page Header Row */
.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.page-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.btn-encode-record {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.625rem 1.125rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
  transition: all 0.15s ease;
}

.btn-encode-record:hover {
  background: #1d4ed8;
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
  transform: translateY(-1px);
}

/* Filter Card Section */
.filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  width: 100%;
  box-sizing: border-box;
}

/* Row 1: Balanced 3-column grid for Center, Level, Learner starting from the left */
.filter-dropdowns-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.15rem;
  width: 100%;
  box-sizing: border-box;
}

/* Row 2: Date Filters & Action Buttons, starting cleanly from the left */
.filter-row-secondary {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 1.15rem;
  padding-top: 1.15rem;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
}

.filter-col-date {
  flex: 0 0 210px;
  min-width: 170px;
  box-sizing: border-box;
}

.filter-actions-group {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  box-sizing: border-box;
}

.filter-error-text {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #dc2626;
  font-size: 0.8125rem;
  font-weight: 500;
  padding-top: 0.5rem;
  border-top: 1px solid #fee2e2;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.req-star {
  color: #dc2626;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-select,
.filter-date-input {
  width: 100%;
  height: 42px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 0.85rem;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  appearance: none;
}

.filter-select:focus,
.filter-date-input:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.filter-select:disabled {
  background-color: #f1f5f9;
  color: #94a3b8;
  border-color: #e2e8f0;
  cursor: not-allowed;
  opacity: 0.85;
}

.filter-select:disabled ~ .select-chevron {
  color: #cbd5e1;
}

.select-chevron {
  position: absolute;
  right: 0.85rem;
  pointer-events: none;
  color: #64748b;
}

/* Reset Filters Button */
.btn-reset-filter {
  height: 42px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.btn-reset-filter:hover {
  background-color: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Generate Report Button */
.btn-generate-report {
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #1d4ed8;
  color: #ffffff;
  border: 1px solid #1d4ed8;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0 1.35rem;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(29, 78, 216, 0.2);
  transition: all 0.15s ease;
  box-sizing: border-box;
  white-space: nowrap;
}

.btn-generate-report:hover:not(:disabled) {
  background-color: #1e40af;
  border-color: #1e40af;
  box-shadow: 0 4px 6px rgba(29, 78, 216, 0.3);
}

.btn-generate-report:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner-white {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Responsiveness on smaller screens: stack filters vertically */
@media (max-width: 768px) {
  .filter-card {
    padding: 1rem;
  }
  .filter-dropdowns-row {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
  .filter-row-secondary {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;
  }
  .filter-col-date {
    width: 100%;
    max-width: 100%;
    flex: 1 1 100%;
  }
  .filter-actions-group {
    flex-direction: column;
    width: 100%;
    gap: 0.75rem;
  }
  .btn-reset-filter,
  .btn-generate-report {
    width: 100%;
    justify-content: center;
  }
}

/* Loading Box */
.loading-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Report Error Card */
.report-error-card {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: #991b1b;
}

.error-msg-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-msg-box p {
  margin: 0.2rem 0 0;
  font-size: 0.875rem;
  color: #b91c1c;
}

.btn-retry {
  background: #dc2626;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;
}

.btn-retry:hover {
  background: #b91c1c;
}

/* ============================================================ */
/* OFFICIAL FORMAL REPORT DOCUMENT SHEET (Exact DepEd AF2 PDF)  */
/* ============================================================ */
.report-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.af2-pages-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.af2-page-unit {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.report-status-banner {
  margin-bottom: 0.15rem;
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

/* Monthly & Page Indicator Bar (Outside the official paper form) */
.af2-month-page-bar {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  align-self: flex-start;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 700;
}

.month-bar-sep {
  color: #93c5fd;
  font-weight: 400;
}

.month-bar-page {
  font-weight: 600;
  color: #1d4ed8;
}

/* Scroll Wrapper so Desktop & Mobile preserve exact A4 Landscape aspect ratio */
.af2-paper-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.25rem;
}

/* Exact A4 Landscape Paper Dimensions: 297mm × 210mm (841.68pt × 595.44pt) */
.af2-report-paper {
  width: 297mm;
  min-width: 297mm;
  min-height: 210mm;
  margin: 0 auto;
  padding: 7.4mm 4.66mm 4.6mm 4.66mm;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 2px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  font-family: Arial, Helvetica, sans-serif;
  color: #000000;
  position: relative;
}

/* Top-Right Form Code: "ALS Assessment Form 2" (Arial 8pt Regular) */
.af2-top-form-code {
  text-align: right;
  padding-right: 8.25mm;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8pt;
  font-weight: 400;
  line-height: 1.1;
  color: #000000;
  margin-bottom: 2pt;
}

/* Main Report Title: Arial 12pt Bold Centered */
.af2-clean-header {
  text-align: center;
  margin: 0 0 13pt 0;
  padding: 0;
}

.af2-main-title {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12pt;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.15;
  color: #000000;
  margin: 0;
  text-transform: uppercase;
  text-align: center;
}

/* Learner Information Section (Indented 22.8pt / 8.04mm from table edge -> x=36pt on page) */
.af2-info-section {
  padding: 0 8.25mm 0 8.04mm;
  margin-bottom: 10pt;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 9.36pt;
  margin-bottom: 10pt;
  flex-wrap: nowrap;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-col {
  display: flex;
  align-items: flex-end;
  gap: 4pt;
}

.info-col-left {
  width: 51.5%;
  flex: 0 0 51.5%;
}

.info-col-right {
  width: 47.2%;
  flex: 0 0 47.2%;
}

.info-label {
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 700;
  color: #000000;
  white-space: nowrap;
  font-size: 12pt;
  line-height: 1.1;
}

/* Inputted values are NOT bold (Arial Regular) */
.info-underline {
  border-bottom: 0.75pt solid #000000;
  flex: 1;
  padding: 0 4pt 1pt;
  min-height: 14pt;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 400;
  font-size: 11pt;
  line-height: 1.1;
  color: #000000;
  display: inline-flex;
  align-items: flex-end;
  white-space: nowrap;
  overflow: hidden;
}

/* Level Checkboxes: BL, LE, AE, JHS (13.85pt × 13.1pt boxes, Arial 12pt Bold labels) */
.level-col {
  display: flex;
  align-items: center;
  gap: 8pt;
}

.level-checkboxes {
  display: inline-flex;
  align-items: center;
  gap: 13pt;
}

.level-box-item {
  display: inline-flex;
  align-items: center;
  gap: 3pt;
}

.level-text {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12pt;
  font-weight: 700;
  color: #000000;
  line-height: 1;
}

.check-square {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13.85pt;
  height: 13.1pt;
  border: 0.75pt solid #000000;
  background: #ffffff;
  border-radius: 0;
  flex-shrink: 0;
  box-sizing: border-box;
}

.check-mark {
  color: #000000;
  font-size: 10pt;
  font-weight: 700;
  line-height: 1;
}

/* ============================================================ */
/* OFFICIAL REPORT TABLE (Exact 814.68pt / 287.4mm Width)       */
/* ============================================================ */
.table-outer-wrapper {
  width: 814.68pt;
  min-width: 814.68pt;
  max-width: 814.68pt;
  margin: 0;
  box-sizing: border-box;
}

.af2-table {
  width: 814.68pt !important;
  min-width: 814.68pt !important;
  max-width: 814.68pt !important;
  border-collapse: collapse;
  table-layout: fixed !important;
  font-family: Arial, Helvetica, sans-serif;
  border: 0.75pt solid #000000;
  background: #ffffff;
  box-sizing: border-box;
}

/* Exact Column Proportions (Total = 814.68pt = 287.40mm = 100.00%) */
.af2-table col.col-module,
.af2-table th.th-module,
.af2-table td.td-module {
  width: 179.23pt !important;
  min-width: 179.23pt !important;
  max-width: 179.23pt !important;
}

.af2-table col.col-strand,
.af2-table th.th-strand,
.af2-table td.td-strand {
  width: 28.51pt !important;
  min-width: 28.51pt !important;
  max-width: 28.51pt !important;
}

.af2-table th.th-date {
  width: 97.76pt !important;
  min-width: 97.76pt !important;
  max-width: 97.76pt !important;
}

.af2-table col.col-date-started,
.af2-table th.th-sub-date-started,
.af2-table td.td-date-started {
  width: 48.88pt !important;
  min-width: 48.88pt !important;
  max-width: 48.88pt !important;
}

.af2-table col.col-date-finished,
.af2-table th.th-sub-date-finished,
.af2-table td.td-date-finished {
  width: 48.88pt !important;
  min-width: 48.88pt !important;
  max-width: 48.88pt !important;
}

.af2-table col.col-pretest,
.af2-table th.th-pretest,
.af2-table td.td-pretest {
  width: 33.40pt !important;
  min-width: 33.40pt !important;
  max-width: 33.40pt !important;
}

.af2-table col.col-posttest,
.af2-table th.th-posttest,
.af2-table td.td-posttest {
  width: 33.40pt !important;
  min-width: 33.40pt !important;
  max-width: 33.40pt !important;
}

.af2-table col.col-activities,
.af2-table th.th-activities,
.af2-table td.td-activities {
  width: 127.09pt !important;
  min-width: 127.09pt !important;
  max-width: 127.09pt !important;
}

.af2-table col.col-self,
.af2-table th.th-self,
.af2-table td.td-self {
  width: 97.76pt !important;
  min-width: 97.76pt !important;
  max-width: 97.76pt !important;
}

.af2-table th.th-teacher-assessment {
  width: 79.02pt !important;
  min-width: 79.02pt !important;
  max-width: 79.02pt !important;
}

.af2-table col.col-mastered,
.af2-table th.th-sub-mastered,
.af2-table td.td-mastered {
  width: 39.51pt !important;
  min-width: 39.51pt !important;
  max-width: 39.51pt !important;
}

.af2-table col.col-not-mastered,
.af2-table th.th-sub-not-mastered,
.af2-table td.td-not-mastered {
  width: 39.51pt !important;
  min-width: 39.51pt !important;
  max-width: 39.51pt !important;
}

.af2-table col.col-remarks,
.af2-table th.th-remarks,
.af2-table td.td-remarks {
  width: 138.51pt !important;
  min-width: 138.51pt !important;
  max-width: 138.51pt !important;
}

.af2-table th,
.af2-table td {
  border: 0.75pt solid #000000;
  vertical-align: middle;
  color: #000000;
  box-sizing: border-box;
}

/* Table Header Row Heights from PDF (74.78pt and 25.32pt) */
.af2-table thead .thead-row-1 th {
  height: 74.78pt;
  padding: 2pt 1.5pt;
  background: #ffffff;
  text-align: center;
  vertical-align: middle;
}

.af2-table thead .thead-row-1 th.th-strand,
.af2-table thead .thead-row-1 th.th-score {
  padding: 1.5pt 1pt;
}

.af2-table thead .thead-row-2 th {
  height: 25.32pt;
  padding: 1pt 1pt;
  background: #ffffff;
  text-align: center;
  vertical-align: middle;
}

/* Exact Table Header Font Sizes from PDF */
.th-en-11 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  font-weight: 700;
  line-height: 1.12;
  color: #000000;
}

.th-tl-10 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10pt;
  font-weight: 400;
  font-style: italic;
  line-height: 1.12;
  color: #000000;
  margin-top: 1pt;
}

.th-en-10 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10pt;
  font-weight: 700;
  line-height: 1.08;
  color: #000000;
}

.th-en-95 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9.5pt;
  font-weight: 700;
  line-height: 1.06;
  color: #000000;
}

.th-en-8 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8pt;
  font-weight: 700;
  line-height: 1.05;
  color: #000000;
}

.th-en-7 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 7pt;
  font-weight: 700;
  line-height: 1.1;
  color: #000000;
}

.th-en-65 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 6.5pt;
  font-weight: 700;
  line-height: 1.08;
  color: #000000;
}

.th-tl-6 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 6pt;
  font-weight: 400;
  font-style: italic;
  line-height: 1.05;
  color: #000000;
  margin-top: 1pt;
}

.th-tl-55 {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 5.5pt;
  font-weight: 400;
  font-style: italic;
  line-height: 1.05;
  color: #000000;
  margin-top: 1pt;
}

.th-tl-6-bold {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 6pt;
  font-weight: 700;
  font-style: italic;
  line-height: 1.05;
  color: #000000;
  margin-top: 1pt;
}

/* Fixed Writing Row Height: 23.04pt (460 dxa) across all 10 writing rows */
.record-row,
.blank-row {
  height: 23.04pt !important;
  min-height: 23.04pt !important;
  max-height: 23.04pt !important;
}

.af2-table tbody .record-row td,
.af2-table tbody .blank-row td {
  height: 23.04pt !important;
  min-height: 23.04pt !important;
  max-height: 23.04pt !important;
  padding: 0 3pt;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9pt;
  font-weight: 400;
  color: #000000;
  overflow: hidden;
  vertical-align: middle;
}

.af2-table tbody .record-row td.td-strand,
.af2-table tbody .blank-row td.td-strand,
.af2-table tbody .record-row td.td-score,
.af2-table tbody .blank-row td.td-score {
  padding: 0 1pt !important;
  font-size: 9pt;
  text-align: center;
}

.af2-table tbody .record-row td.td-date,
.af2-table tbody .blank-row td.td-date {
  padding: 0 1pt !important;
  font-size: 8.5pt;
  text-align: center;
  white-space: nowrap;
}

.af2-table tbody .record-row td.td-check,
.af2-table tbody .blank-row td.td-check {
  padding: 0 !important;
  text-align: center;
}

.cell-center {
  text-align: center;
}

.cell-left {
  text-align: left;
}

.cell-single-line {
  display: block;
  width: 100%;
  height: 21pt;
  line-height: 21pt;
  white-space: nowrap;
  overflow: hidden;
}

/* Checkmark Style (✓) */
.af2-check-mark {
  font-size: 10pt;
  font-weight: 700;
  color: #000000;
  display: inline-block;
  line-height: 1;
}

/* ============================================================ */
/* BOTTOM SIGNATURES & REVISION SECTION (Exact PDF Coordinates) */
/* ============================================================ */
.af2-signatures-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 16pt;
  padding: 0 42mm 0 30.4mm;
}

.signature-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 233.55pt; /* 82.4mm exact signature line width in PDF */
}

.sig-name-slot {
  width: 100%;
  min-height: 16pt;
  border-bottom: 0.75pt solid #000000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1pt;
}

.sig-printed-name {
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 700;
  font-size: 10pt;
  text-transform: uppercase;
  color: #000000;
  text-align: center;
  line-height: 1.1;
}

.sig-caption {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12pt;
  font-style: italic;
  font-weight: 400;
  color: #000000;
  text-align: center;
  margin-top: 2pt;
  margin-bottom: 11pt;
  white-space: nowrap;
}

.sig-date-row {
  display: flex;
  align-items: flex-end;
  width: 100%;
  gap: 4pt;
}

.sig-date-label {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12pt;
  font-weight: 400;
  color: #000000;
  white-space: nowrap;
  line-height: 1;
}

.sig-date-line {
  flex: 1;
  border-bottom: 0.75pt solid #000000;
  height: 11pt;
}

/* Bottom-Right Revision Footer: "10/2020" (Arial 8pt Regular) */
.af2-bottom-revision {
  text-align: right;
  padding-right: 13.5mm;
  margin-top: 3pt;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8pt;
  font-weight: 400;
  line-height: 1;
  color: #000000;
}

/* Print Action Button (Below the report preview, matching Summary of Module Use and Learner's Progress) */
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

.btn-print-report:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-print-report:active:not(:disabled) {
  background-color: #e2e8f0;
}

.btn-print-report:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Modal: Add Record */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-box {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
  padding: 1.75rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.modal-sub-text {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
}

.record-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
}

.form-label .req {
  color: #dc2626;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.score-input-split {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slash-div {
  color: #64748b;
  font-weight: 600;
}

/* Assessment Cards */
.assessment-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.assessment-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s ease;
}

.assessment-card:hover {
  background: #f1f5f9;
}

.assessment-card.is-selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.assessment-radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;
}

.assessment-card.is-selected .assessment-radio-circle {
  border-color: #2563eb;
}

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
}

.assessment-card-info {
  display: flex;
  flex-direction: column;
}

.assessment-card-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.assessment-card-desc {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.15rem;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-submit-record {
  background: #2563eb;
  border: none;
  color: #ffffff;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

/* ============================================================ */
/* PRINT MEDIA STYLES (@media print)                            */
/* ============================================================ */
@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }

  /* Hide navigation, headers, footers, banners, and buttons */
  .print-hidden,
  .no-print,
  .topbar,
  .sidebar,
  .sidebar-overlay,
  .portal-footer,
  .filter-card,
  .page-header-row,
  .breadcrumb-nav,
  .pdf-action-container,
  .report-actions-bar,
  .report-status-banner,
  .af2-month-page-bar {
    display: none !important;
  }

  body, html {
    background: #ffffff !important;
    color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .main-wrapper,
  .main-content,
  .af2-page,
  .report-wrapper,
  .af2-pages-container {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    gap: 0 !important;
  }

  .af2-page-unit {
    margin: 0 !important;
    padding: 0 !important;
    gap: 0 !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .af2-page-unit.has-page-break {
    page-break-after: always !important;
    break-after: page !important;
  }

  .af2-paper-scroll-wrapper {
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .af2-report-paper {
    border: none !important;
    box-shadow: none !important;
    width: 297mm !important;
    min-width: 297mm !important;
    height: 210mm !important;
    min-height: 210mm !important;
    max-height: 210mm !important;
    padding: 7.4mm 4.66mm 4.6mm 4.66mm !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  .table-outer-wrapper {
    width: 814.68pt !important;
    min-width: 814.68pt !important;
    max-width: 814.68pt !important;
    overflow: visible !important;
    margin: 0 !important;
  }

  .af2-table {
    width: 814.68pt !important;
    min-width: 814.68pt !important;
    max-width: 814.68pt !important;
    table-layout: fixed !important;
    border: 0.75pt solid #000000 !important;
    page-break-inside: avoid !important;
  }

  .af2-table tr {
    page-break-inside: avoid !important;
  }

  .af2-table th,
  .af2-table td {
    border: 0.75pt solid #000000 !important;
    color: #000000 !important;
  }

  .af2-check-mark {
    color: #000000 !important;
    font-weight: 700 !important;
  }

  .check-square {
    border: 0.75pt solid #000000 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .check-mark {
    color: #000000 !important;
    font-size: 10pt !important;
    font-weight: 700 !important;
    line-height: 1 !important;
  }
}
</style>

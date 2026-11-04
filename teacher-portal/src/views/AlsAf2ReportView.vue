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
        <div class="filter-field col-date">
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
        <div class="filter-field col-date">
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

      <!-- Formal White Document Sheet (Landscape ALS Assessment Form 2) -->
      <div v-else id="report-content" ref="reportContentRef" class="af2-report-paper">
        <!-- Status Banner: Distinguish Blank Template vs Generated Report -->
        <div class="report-status-banner print-hidden">
          <div v-if="!hasGeneratedReport" class="status-pill status-blank">
            <span class="status-badge-dot"></span>
            <span class="status-badge-text">Blank Template Preview</span>
            <span class="status-badge-hint">— Select filters above and click Generate Report</span>
          </div>
          <div v-else-if="displayedRecords.length === 0" class="status-pill status-empty">
            <span class="status-badge-dot empty"></span>
            <span class="status-badge-text">Report Generated</span>
            <span class="status-badge-hint">— No records found for {{ reportData.learnerName }}</span>
          </div>
          <div v-else class="status-pill status-ready">
            <span class="status-badge-dot success"></span>
            <span class="status-badge-text">Report Generated</span>
            <span class="status-badge-hint">— {{ displayedRecords.length }} record(s) loaded for {{ reportData.learnerName }}</span>
          </div>
        </div>

        <!-- Generated Report Title Only (Unwanted headers and logos removed per requirements) -->
        <div class="af2-clean-header">
          <h2 class="af2-main-title">RECORD OF MODULE USE AND MONITORING OF LEARNER’S PROGRESS</h2>
        </div>

        <!-- Learner Information Section -->
        <div class="af2-info-section">
          <!-- Row 1: Name of Learner & Community Learning Center -->
          <div class="info-row">
            <div class="info-col info-col-left">
              <span class="info-label">Name of Learner:</span>
              <span class="info-underline">{{ reportData.learnerName || '' }}</span>
            </div>
            <div class="info-col info-col-right">
              <span class="info-label">Community Learning Center:</span>
              <span class="info-underline">{{ reportData.learningCenter || '' }}</span>
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
              <span class="info-underline">{{ reportData.teacherName || '' }}</span>
            </div>
          </div>
        </div>

        <!-- Official Report Table -->
        <div class="table-outer-wrapper">
          <table class="af2-table">
            <thead>
              <!-- Table Header Row 1 -->
              <tr>
                <th rowspan="2" class="th-module">
                  <span class="th-primary">Title of Learning Module</span>
                  <span class="th-tagalog">(Pamagat ng Modyul)</span>
                </th>
                <th rowspan="2" class="th-strand">
                  <span class="th-primary">Learning<br>Strand</span>
                </th>
                <th colspan="2" class="th-date">
                  <span class="th-primary">Date</span>
                  <span class="th-tagalog">(Petsa)</span>
                </th>
                <th rowspan="2" class="th-score">
                  <span class="th-primary">Pre-<br>Test<br>Result</span>
                  <span class="th-tagalog">(Resulta ng<br>Panimulang<br>Pagtataya)</span>
                </th>
                <th rowspan="2" class="th-score">
                  <span class="th-primary">Post-<br>Test<br>Result</span>
                  <span class="th-tagalog">(Resulta ng<br>Pagtatapos na<br>Pagtataya)</span>
                </th>
                <th rowspan="2" class="th-activities">
                  <span class="th-primary">Other Related<br>Activities<br>Accomplished</span>
                  <span class="th-tagalog">(Iba pang<br>Gawaing<br>Natapos)</span>
                </th>
                <th rowspan="2" class="th-self">
                  <span class="th-primary">Learner’s<br>Self-Assessment of<br>Performance</span>
                  <span class="th-tagalog">(Pagtatasa sa<br>Sarili sa<br>Pagganap)</span>
                </th>
                <th colspan="2" class="th-teacher-assessment">
                  <span class="th-primary">ALS<br>Teacher’s<br>Assessment</span>
                  <span class="th-tagalog">(Pagtatasa ng<br>Guro sa ALS)</span>
                </th>
                <th rowspan="2" class="th-remarks">
                  <span class="th-primary">ALS Teacher’s Remarks</span>
                  <span class="th-tagalog">(Puna ng Guro sa ALS)</span>
                </th>
              </tr>

              <!-- Table Header Row 2 (Subheaders) -->
              <tr>
                <th class="th-sub-date">
                  <span class="th-primary">Started</span>
                  <span class="th-tagalog">(Simula)</span>
                </th>
                <th class="th-sub-date">
                  <span class="th-primary">Finished</span>
                  <span class="th-tagalog">(Pagtapos)</span>
                </th>
                <th class="th-sub-mastery">
                  <span class="th-primary">Mastered</span>
                  <span class="th-tagalog">(Natuto)</span>
                </th>
                <th class="th-sub-mastery">
                  <span class="th-primary">Not<br>Mastered</span>
                  <span class="th-tagalog">(Hindi Natuto)</span>
                </th>
              </tr>
            </thead>

            <tbody>
              <!-- Empty state indicator row when report was generated but has no records -->
              <tr v-if="hasGeneratedReport && displayedRecords.length === 0" class="empty-notice-row print-hidden">
                <td colspan="11" class="cell-center empty-notice-cell">
                  <div class="empty-notice-content">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>No module assessment records found for this learner in the selected period.</span>
                  </div>
                </td>
              </tr>

              <!-- Existing Learner Records -->
              <tr
                v-for="(rec, idx) in displayedRecords"
                :key="rec.id || idx"
                class="record-row"
              >
                <td class="cell-left td-module">{{ rec.moduleTitle || '—' }}</td>
                <td class="cell-center td-strand">{{ formatStrandDisplay(rec.strandName || formatStrandFromModule(rec.moduleTitle)) }}</td>
                <td class="cell-center td-date">{{ formatDate(rec.dateStarted) }}</td>
                <td class="cell-center td-date">{{ formatDate(rec.dateFinished) }}</td>
                <td class="cell-center td-score">{{ formatScoreDisplay(rec.preTestScore, rec.preTestTotal) }}</td>
                <td class="cell-center td-score">{{ formatScoreDisplay(rec.postTestScore, rec.postTestTotal) }}</td>
                <td class="cell-left td-activities">
                  <div class="text-wrapped">{{ rec.otherActivities || '—' }}</div>
                </td>
                <td class="cell-left td-self">
                  <div class="text-wrapped">{{ rec.selfAssessment || '' }}</div>
                </td>
                <td class="cell-center td-check">
                  <span v-if="isMastered(rec.assessment || rec.moduleStatus)" class="af2-check-mark">✓</span>
                </td>
                <td class="cell-center td-check">
                  <span v-if="isNotMastered(rec.assessment || rec.moduleStatus)" class="af2-check-mark">✓</span>
                </td>
                <td class="cell-left td-remarks">
                  <div class="text-wrapped">{{ rec.remarks || '—' }}</div>
                </td>
              </tr>

              <!-- Blank rows to match 16-row layout of PDF template -->
              <tr
                v-for="bIdx in blankRowsCount"
                :key="`blank-${bIdx}`"
                class="blank-row"
              >
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td class="cell-center">&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom Signatures Section -->
        <div class="af2-signatures-section">
          <!-- Learner Signature -->
          <div class="signature-block">
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
          <div class="signature-block">
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
      </div>

      <!-- Bottom Action Buttons (Print / Generate PDF) -->
      <div class="report-actions-bar no-print print-hidden">
        <div class="actions-left-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Prints formal DepEd ALS Assessment Form 2 without screen borders or controls.</span>
        </div>

        <div class="actions-buttons-group">
          <button
            type="button"
            class="btn-action-outline"
            :disabled="generatingPdf"
            @click="handlePrintReport"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span>Print Report</span>
          </button>

          <button
            type="button"
            class="btn-action-primary"
            :disabled="generatingPdf"
            @click="handleGeneratePdf"
          >
            <span v-if="generatingPdf" class="btn-spinner-white"></span>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span>{{ generatingPdf ? 'Generating PDF...' : 'Generate PDF' }}</span>
          </button>
        </div>
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

    // Fetch real AF2 records matching learner and active filters (no fake records generated)
    const recs = getRecordsForLearner({
      learnerId: found.id,
      learnerName: found.name,
      level: reportData.level,
      learningCenter: reportData.learningCenter,
      dateStarted: filterDateStarted.value,
      dateFinished: filterDateFinished.value,
    });

    reportData.records = Array.isArray(recs) ? recs : [];
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
  return s === 'mastered';
}

function isNotMastered(val) {
  if (!val) return false;
  const s = String(val).toLowerCase();
  return s === 'not mastered' || s === 'not_mastered';
}

// Displayed records & blank rows calculation
const displayedRecords = computed(() => {
  return reportData.records || [];
});

// Ensure sheet maintains formal paper record layout by filling remaining lines with blank rows (16 rows total matching PDF)
const blankRowsCount = computed(() => {
  const currentCount = displayedRecords.value.length;
  const minRowsTotal = 16;
  if (currentCount < minRowsTotal) {
    return minRowsTotal - currentCount;
  }
  return 2;
});

function formatDate(dStr) {
  if (!dStr) return '—';
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
  if (score == null || score === '') return '—';
  return total ? `${score}/${total}` : `${score}`;
}

function formatStrandFromModule(title) {
  if (!title) return 'LS1 Communication Skills (English)';
  const t = title.toLowerCase();
  if (t.includes('communication') || t.includes('english')) return 'LS1 Communication Skills (English)';
  if (t.includes('filipino')) return 'LS1 Communication Skills (Filipino)';
  if (t.includes('scientific') || t.includes('science')) return 'LS2 Scientific Literacy and Critical Thinking';
  if (t.includes('math') || t.includes('problem')) return 'LS3 Mathematical and Problem Solving Skills';
  if (t.includes('career') || t.includes('life')) return 'LS4 Life and Career Skills';
  if (t.includes('digital') || t.includes('computer')) return 'LS5 Digital Literacy';
  if (t.includes('self') || t.includes('society')) return 'LS6 Understanding the Self and Society';
  return 'LS1 Communication Skills (English)';
}

function formatStrandDisplay(strand) {
  if (!strand) return 'LS1';
  const str = String(strand).trim();
  if (str.length <= 16) return str;
  const lower = str.toLowerCase();
  if (lower.includes('english')) return 'LS1 (English)';
  if (lower.includes('filipino')) return 'LS1 (Filipino)';
  if (lower.includes('scientific') || lower.includes('science')) return 'LS2 (Science)';
  if (lower.includes('math') || lower.includes('problem')) return 'LS3 (Math)';
  if (lower.includes('career') || lower.includes('life')) return 'LS4 (Life & Career)';
  if (lower.includes('digital') || lower.includes('computer')) return 'LS5 (Digital)';
  if (lower.includes('self') || lower.includes('society')) return 'LS6 (Self & Society)';
  return str;
}

// Print & PDF actions
function handlePrintReport() {
  if (!reportData.learnerId) {
    validationError.value = 'Please select a learner and generate the report before printing.';
    return;
  }
  window.print();
}

async function handleGeneratePdf() {
  if (!reportData.learnerId) {
    validationError.value = 'Please select a learner and generate the report before exporting to PDF.';
    return;
  }
  const element = reportContentRef.value || document.getElementById('report-content');
  if (!element) return;

  generatingPdf.value = true;
  try {
    const safeLearnerName = (reportData.learnerName || 'Learner').replace(/[^a-zA-Z0-9_-]/g, '_');
    await exportReportToPdf(element, {
      filename: `ALS_AF2_Report_${safeLearnerName}_${new Date().toISOString().split('T')[0]}.pdf`,
      orientation: 'landscape',
      margin: [8, 6, 8, 6],
    });
  } catch (err) {
    console.error('Error generating AF2 PDF:', err);
  } finally {
    generatingPdf.value = false;
  }
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

function saveNewAf2Record() {
  if (!newRecordForm.moduleTitle.trim()) {
    alert('Please enter the module title.');
    return;
  }
  if (!newRecordForm.dateStarted || !newRecordForm.dateFinished) {
    alert('Please enter both date started and finished.');
    return;
  }

  saveRecord({
    learnerId: reportData.learnerId,
    learnerName: reportData.learnerName,
    lrn: reportData.lrn,
    level: reportData.level,
    centerName: reportData.learningCenter,
    moduleTitle: newRecordForm.moduleTitle.trim(),
    strandName: newRecordForm.strandName,
    dateStarted: newRecordForm.dateStarted,
    dateFinished: newRecordForm.dateFinished,
    preTestScore: newRecordForm.preTestScore,
    preTestTotal: newRecordForm.preTestTotal,
    postTestScore: newRecordForm.postTestScore,
    postTestTotal: newRecordForm.postTestTotal,
    otherActivities: newRecordForm.otherActivities.trim(),
    selfAssessment: '',
    assessment: newRecordForm.assessment,
    remarks: newRecordForm.remarks.trim(),
  });

  showAddModal.value = false;
  generateReport();
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

.col-date {
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
  .col-date {
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
/* OFFICIAL FORMAL REPORT DOCUMENT SHEET (DepEd AF2 Styled)     */
/* ============================================================ */
.report-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.report-status-banner {
  margin-bottom: 0.5rem;
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

.af2-report-paper {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2rem 2.25rem 2.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  color: #000000;
  overflow-x: auto;
}

/* Generated Report Clean Header (No border line underneath per requirement) */
.af2-clean-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.25rem;
}

.af2-main-title {
  font-size: 1.125rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #000000;
  margin: 0;
  text-transform: uppercase;
  text-align: center;
}

/* Learner Information Section */
.af2-info-section {
  margin-bottom: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
  margin-bottom: 0.55rem;
  font-size: 0.8125rem;
  flex-wrap: wrap;
}

.info-col {
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
}

.info-col-left {
  flex: 1.35 1 280px;
}

.info-col-right {
  flex: 1 1 240px;
}

.info-label {
  font-weight: 700;
  color: #000000;
  white-space: nowrap;
  font-size: 0.8125rem;
}

/* Inputted values are NOT bold (font-weight: 400) per requirement */
.info-underline {
  border-bottom: 1px solid #000000;
  flex: 1;
  padding: 0 0.4rem 0.1rem;
  min-height: 1.25rem;
  font-weight: 400;
  font-size: 0.8125rem;
  color: #000000;
  display: flex;
  align-items: flex-end;
}

/* Level Checkboxes: BL, LE, AE, JHS */
.level-col {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.level-checkboxes {
  display: flex;
  align-items: center;
  gap: 1.15rem;
  padding-bottom: 0.1rem;
}

.level-box-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.level-text {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #000000;
}

.check-square {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  border: 1px solid #000000;
  background: #ffffff;
  border-radius: 0;
  flex-shrink: 0;
}

.check-mark {
  color: #000000;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
}

/* ============================================================ */
/* OFFICIAL REPORT TABLE                                        */
/* ============================================================ */
.table-outer-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-top: 0.65rem;
  margin-bottom: 1.75rem;
}

.af2-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.71875rem;
  line-height: 1.25;
  border: 1.5px solid #000000;
  background: #ffffff;
}

.af2-table th,
.af2-table td {
  border: 1px solid #000000;
  padding: 0.35rem 0.35rem;
  vertical-align: middle;
  word-wrap: normal;
  overflow-wrap: break-word;
  color: #000000;
}

/* Column Width Percentages for Balanced Formal Layout */
.th-module, .td-module { width: 20%; }
.th-strand, .td-strand { width: 8%; text-align: center; }
.th-date, .th-sub-date, .td-date { width: 7%; text-align: center; white-space: nowrap; }
.th-score, .td-score { width: 6.5%; text-align: center; white-space: nowrap; }
.th-activities, .td-activities { width: 14%; }
.th-self, .td-self { width: 11%; }
.th-teacher-assessment, .th-sub-mastery, .td-check { width: 5%; text-align: center; }
.th-remarks, .td-remarks { width: 10%; }

/* Table Headers */
.af2-table thead th {
  background: #ffffff;
  color: #000000;
  font-weight: 700;
  text-align: center;
  padding: 0.35rem 0.2rem;
  vertical-align: middle;
}

.th-primary {
  display: block;
  font-size: 0.71875rem;
  line-height: 1.15;
  font-weight: 700;
  color: #000000;
}

.th-tagalog {
  display: block;
  font-size: 0.625rem;
  font-weight: normal;
  font-style: italic;
  color: #000000;
  margin-top: 0.15rem;
  line-height: 1.15;
}

/* Cell Alignment and Text Wrapping */
.cell-center {
  text-align: center;
}

.cell-left {
  text-align: left;
}

.text-wrapped {
  white-space: pre-line;
  word-break: normal;
  overflow-wrap: break-word;
  line-height: 1.25;
}

/* Empty records indicator row */
.empty-notice-row td {
  height: auto !important;
}

.empty-notice-cell {
  background: #f8fafc;
  padding: 1.25rem 1rem !important;
  color: #64748b;
  font-size: 0.8125rem;
  font-style: italic;
  border-bottom: 1px solid #cbd5e1 !important;
}

.empty-notice-content {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

/* Checkmark Style (✓) */
.af2-check-mark {
  font-size: 1rem;
  font-weight: 800;
  color: #000000;
  display: inline-block;
  line-height: 1;
}

/* Rows matching PDF template */
.record-row td,
.blank-row td {
  height: 25px;
}

/* ============================================================ */
/* BOTTOM SIGNATURES SECTION                                    */
/* ============================================================ */
.af2-signatures-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  padding: 0 2rem;
  gap: 2rem;
  flex-wrap: wrap;
}

.signature-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 300px;
  max-width: 100%;
}

@media (max-width: 768px) {
  .af2-report-paper {
    padding: 1.25rem 1rem;
  }
  .af2-signatures-section {
    padding: 0;
    flex-direction: column;
    align-items: center;
  }
  .signature-block {
    width: 100%;
    max-width: 280px;
  }
}

.sig-name-slot {
  width: 100%;
  min-height: 1.35rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 0.15rem;
}

.sig-printed-name {
  font-weight: 700;
  font-size: 0.8125rem;
  text-transform: uppercase;
  color: #000000;
  text-align: center;
}

.sig-caption {
  font-size: 0.75rem;
  font-style: italic;
  color: #000000;
  text-align: center;
  margin-bottom: 1.25rem;
}

.sig-date-row {
  display: flex;
  align-items: flex-end;
  width: 100%;
  gap: 0.35rem;
}

.sig-date-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #000000;
  white-space: nowrap;
}

.sig-date-line {
  flex: 1;
  border-bottom: 1px solid #000000;
  min-height: 1rem;
}

/* Actions Bar (Bottom-Right Action Buttons) */
.report-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.875rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.actions-left-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.8125rem;
}

.actions-buttons-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-action-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1.5px solid #2563eb;
  color: #2563eb;
  padding: 0.55rem 1.15rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action-outline:hover {
  background: #eff6ff;
  transform: translateY(-1px);
}

.btn-action-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  border: 1.5px solid #2563eb;
  color: #ffffff;
  padding: 0.55rem 1.15rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
  transition: all 0.15s ease;
}

.btn-action-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
  transform: translateY(-1px);
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
    size: landscape;
    margin: 10mm 12mm;
  }

  /* Hide navigation, headers, footers, and buttons */
  .print-hidden,
  .topbar,
  .sidebar,
  .sidebar-overlay,
  .portal-footer,
  .filter-card,
  .page-header-row,
  .breadcrumb-nav,
  .report-actions-bar {
    display: none !important;
  }

  body, html {
    background: #ffffff !important;
    color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .main-wrapper {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
  }

  .main-content {
    padding: 0 !important;
    margin: 0 !important;
  }

  .af2-page {
    padding: 0 !important;
    margin: 0 !important;
  }

  .af2-report-paper {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .table-outer-wrapper {
    overflow: visible !important;
    margin: 0.5rem 0 !important;
  }

  .af2-table {
    min-width: 100% !important;
    width: 100% !important;
    border: 1.5px solid #000000 !important;
    page-break-inside: auto;
  }

  .af2-table tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  .af2-table th,
  .af2-table td {
    border: 1px solid #000000 !important;
    color: #000000 !important;
  }

  .af2-check-mark {
    color: #000000 !important;
    font-weight: 900 !important;
  }

  .check-square {
    border: 1px solid #000000 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .check-mark {
    color: #000000 !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    line-height: 1 !important;
  }
}
</style>

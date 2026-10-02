<template>
  <div class="page-container">
    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Records</h1>
        <p>Learner performance records across all your learning centers.</p>
      </div>

      <button
        type="button"
        class="btn-add-record"
        @click="openAddRecordModal"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add Record</span>
      </button>
    </div>

    <!-- Filter Card: Below Records page heading and above Learner Performance Records table -->
    <div class="filter-card">
      <div class="filter-row">
        <!-- 1. Learner Name Dropdown (Assigned to currently logged-in teacher ONLY) -->
        <div class="filter-field">
          <label class="filter-label">Learner Name</label>
          <div class="select-wrapper">
            <select v-model="filterLearnerId" class="filter-select">
              <option value="">All Learners</option>
              <option v-for="l in assignedLearnersList" :key="l.id" :value="l.id">
                {{ l.name }}
              </option>
            </select>
            <span class="select-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </div>
        </div>

        <!-- 2. Program Level Dropdown -->
        <div class="filter-field">
          <label class="filter-label">Program Level</label>
          <div class="select-wrapper">
            <select v-model="filterProgramLevel" class="filter-select">
              <option value="">All Program Levels</option>
              <option value="A&E Elementary">A&E Elementary</option>
              <option value="A&E Junior High">A&E Junior High</option>
            </select>
            <span class="select-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </div>
        </div>

        <!-- 3. Learning Center Dropdown (Assigned to logged-in teacher ONLY) -->
        <div class="filter-field">
          <label class="filter-label">Learning Center</label>
          <div class="select-wrapper">
            <select v-model="filterLearningCenter" class="filter-select">
              <option value="">All Learning Centers</option>
              <option v-for="c in availableLearningCenters" :key="c.name" :value="c.name">
                {{ c.name }}
              </option>
            </select>
            <span class="select-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <!-- Clear Filters button on the right -->
      <div class="filter-actions-bar">
        <button
          type="button"
          class="btn-clear-filters"
          :class="{ 'is-active': isAnyFilterActive }"
          @click="clearFilters"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          <span>Clear Filters</span>
        </button>
      </div>
    </div>

    <!-- Learner Performance Records Table Card -->
    <div class="records-table-card">
      <div class="table-card-top-bar">
        <div>
          <h3 class="records-card-title">Learner Performance Records</h3>
          <span class="sub-text">Assessed scores and completion status for your assigned learners</span>
        </div>

        <div class="records-filter-bar">
          <input
            v-model="recordsSearchQuery"
            type="text"
            placeholder="Search learner, LRN, or module..."
            class="records-search-input"
          />
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Learner Name</th>
              <th>LRN</th>
              <th>Module Title</th>
              <th>Pre-Test Score</th>
              <th>Post-Test Score</th>
              <th>Module Status</th>
              <th>Date Completed</th>
              <th style="text-align: right; width: 140px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rec, idx) in filteredRecords" :key="rec.id">
              <td class="col-num">{{ idx + 1 }}</td>
              <td class="col-learner-name">{{ rec.learnerName }}</td>
              <td class="col-lrn-text">{{ rec.lrn }}</td>
              <td class="col-mod-title">{{ rec.moduleTitle }}</td>
              <!-- NUMBER VALUES: NEVER PERCENTAGES -->
              <td>
                <span class="score-number-val">
                  {{ rec.preTestScore != null ? (rec.preTestTotal ? `${rec.preTestScore}/${rec.preTestTotal}` : `${rec.preTestScore}`) : '—' }}
                </span>
              </td>
              <td>
                <strong class="score-number-val post-val">
                  {{ rec.postTestScore != null ? (rec.postTestTotal ? `${rec.postTestScore}/${rec.postTestTotal}` : `${rec.postTestScore}`) : '—' }}
                </strong>
              </td>
              <td>
                <span class="status-badge-cell" :class="moduleStatusClass(rec.assessment || rec.moduleStatus)">
                  <span class="dot-indicator"></span>
                  <span>{{ rec.assessment || rec.moduleStatus }}</span>
                </span>
              </td>
              <td class="col-date-text">{{ rec.dateFinished || rec.dateCompleted || (rec.dateStarted ? rec.dateStarted : '—') }}</td>
              <td style="text-align: right;">
                <div class="record-actions-wrap">
                  <button
                    type="button"
                    class="record-icon-btn btn-view-act"
                    title="View Record"
                    aria-label="View Record"
                    @click="openViewRecordModal(rec)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="record-icon-btn btn-edit-act"
                    title="Edit Record"
                    aria-label="Edit Record"
                    @click="openEditRecordModal(rec)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="record-icon-btn btn-delete-act"
                    title="Delete Record"
                    aria-label="Delete Record"
                    @click="confirmDeleteRecord(rec)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredRecords.length === 0">
              <td colspan="9" class="no-records-msg">
                <div class="empty-table-state">
                  <span v-if="loading">Loading performance records...</span>
                  <span v-else-if="isAnyFilterActive">No performance records match the selected filter criteria.</span>
                  <span v-else>No learner performance records recorded yet. Records appear when module assessments are completed.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL: VIEW COMPLETE LEARNER RECORD                          -->
    <!-- ============================================================ -->
    <div v-if="viewingRecord" class="modal-overlay" @click.self="viewingRecord = null">
      <div class="modal-box record-details-modal">
        <div class="modal-header">
          <div>
            <h2 class="modal-title-text">Complete Learner Record</h2>
            <p class="modal-sub-text">{{ viewingRecord.learnerName }} &bull; {{ viewingRecord.lrn }}</p>
          </div>
          <button type="button" class="modal-close-btn" @click="viewingRecord = null">&times;</button>
        </div>

        <div class="record-modal-body">
          <!-- Learner Information -->
          <div class="modal-section-card">
            <h4 class="section-h4">Learner Information</h4>
            <div class="info-two-col">
              <div>
                <span class="summary-label">Name</span>
                <strong class="summary-value">{{ viewingRecord.learnerName }}</strong>
              </div>
              <div>
                <span class="summary-label">LRN</span>
                <span class="summary-value">{{ viewingRecord.lrn }}</span>
              </div>
              <div>
                <span class="summary-label">Learning Center</span>
                <span class="summary-value">{{ viewingRecord.centerName || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Module Information -->
          <div class="modal-section-card">
            <h4 class="section-h4">Module Information</h4>
            <div class="info-two-col">
              <div>
                <span class="summary-label">Module Title</span>
                <strong class="summary-value">{{ viewingRecord.moduleTitle }}</strong>
              </div>
              <div>
                <span class="summary-label">Program Level</span>
                <span class="summary-value">{{ viewingRecord.level || 'A&E Elementary' }}</span>
              </div>
              <div>
                <span class="summary-label">Date Started</span>
                <span class="summary-value">{{ viewingRecord.dateStarted || '—' }}</span>
              </div>
              <div>
                <span class="summary-label">Date Finished</span>
                <span class="summary-value">{{ viewingRecord.dateFinished || viewingRecord.dateCompleted || '—' }}</span>
              </div>
              <div>
                <span class="summary-label">Teacher's Assessment</span>
                <span class="status-badge-cell" :class="moduleStatusClass(viewingRecord.assessment || viewingRecord.moduleStatus)">
                  <span class="dot-indicator"></span>
                  <span>{{ viewingRecord.assessment || viewingRecord.moduleStatus }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Assessment Results (NUMBER VALUES: e.g. 8/20, 15/25) -->
          <div class="modal-section-card">
            <h4 class="section-h4">Assessment Results</h4>
            <div class="scores-highlight-grid">
              <div class="score-card-box">
                <span class="score-card-lbl">Pre-Test Score</span>
                <span class="score-card-num pre">
                  {{ viewingRecord.preTestScore != null ? (viewingRecord.preTestTotal ? `${viewingRecord.preTestScore}/${viewingRecord.preTestTotal}` : `${viewingRecord.preTestScore}`) : 'Not taken' }}
                </span>
              </div>
              <div class="score-card-box">
                <span class="score-card-lbl">Post-Test Score</span>
                <span class="score-card-num post">
                  {{ viewingRecord.postTestScore != null ? (viewingRecord.postTestTotal ? `${viewingRecord.postTestScore}/${viewingRecord.postTestTotal}` : `${viewingRecord.postTestScore}`) : 'Not taken' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Other Related Activities Accomplished -->
          <div class="modal-section-card">
            <h4 class="section-h4">Other Related Activities Accomplished</h4>
            <div class="activities-display-card">
              {{ viewingRecord.otherActivities || 'No related activities recorded.' }}
            </div>
          </div>

          <!-- Uploaded Outputs -->
          <div class="modal-section-card">
            <h4 class="section-h4">Uploaded Outputs</h4>
            <div v-if="viewingRecord.uploadedOutputs" class="output-preview-card">
              <div class="output-preview-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="output-preview-meta">
                <span class="output-name">{{ viewingRecord.uploadedOutputs }}</span>
                <span class="output-sub">Learner submitted worksheet output file</span>
              </div>
            </div>
            <div v-else class="empty-output-box">
              <span>No output image or file uploaded.</span>
            </div>
          </div>

          <!-- Teacher Remarks -->
          <div class="modal-section-card">
            <h4 class="section-h4">Teacher Remarks</h4>
            <div class="remarks-display-bubble">
              {{ viewingRecord.remarks || 'No teacher remarks recorded yet.' }}
            </div>
          </div>
        </div>

        <div class="modal-actions-footer">
          <button type="button" class="btn btn-secondary" @click="viewingRecord = null">
            Close
          </button>
          <button type="button" class="btn btn-primary" @click="openEditRecordModal(viewingRecord); viewingRecord = null;">
            Edit Record
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL: EDIT RECORD (Scores, Status, Remarks)                 -->
    <!-- ============================================================ -->
    <div v-if="editingRecord" class="modal-overlay" @click.self="editingRecord = null">
      <div class="modal-box record-edit-modal">
        <div class="modal-header">
          <div>
            <h2 class="modal-title-text">Edit Learner Record</h2>
            <p class="modal-sub-text">{{ editingRecord.learnerName }} &bull; {{ editingRecord.moduleTitle }}</p>
          </div>
          <button type="button" class="modal-close-btn" @click="editingRecord = null">&times;</button>
        </div>

        <form @submit.prevent="saveEditedRecord" class="record-edit-form">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Pre-Test Score</label>
              <div class="score-input-split">
                <input
                  v-model.number="editingRecord.preTestScore"
                  type="number"
                  min="0"
                  :max="editingRecord.preTestTotal || undefined"
                  class="form-input score-num-in"
                  placeholder="Score"
                />
                <span class="slash-div">/</span>
                <input
                  v-model.number="editingRecord.preTestTotal"
                  type="number"
                  min="1"
                  class="form-input score-num-in"
                  placeholder=""
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Post-Test Score</label>
              <div class="score-input-split">
                <input
                  v-model.number="editingRecord.postTestScore"
                  type="number"
                  min="0"
                  :max="editingRecord.postTestTotal || undefined"
                  class="form-input score-num-in"
                  placeholder="Score"
                />
                <span class="slash-div">/</span>
                <input
                  v-model.number="editingRecord.postTestTotal"
                  type="number"
                  min="1"
                  class="form-input score-num-in"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Date Started</label>
              <input
                v-model="editingRecord.dateStarted"
                type="date"
                class="form-input date-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Date Finished</label>
              <input
                v-model="editingRecord.dateFinished"
                type="date"
                class="form-input date-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Other Related Activities Accomplished</label>
            <textarea
              v-model="editingRecord.otherActivities"
              rows="2"
              class="form-textarea"
              placeholder="e.g., worksheets, performance tasks, projects, reading activities, etc."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">ALS Teacher's Assessment <span class="req">*</span></label>
            <div class="assessment-cards-grid">
              <div
                class="assessment-card card-mastered"
                :class="{ 'is-selected': editingRecord.assessment === 'Mastered' || editingRecord.moduleStatus === 'Mastered' }"
                role="button"
                tabindex="0"
                @click="editingRecord.assessment = 'Mastered'; editingRecord.moduleStatus = 'Mastered';"
                @keydown.space.prevent="editingRecord.assessment = 'Mastered'; editingRecord.moduleStatus = 'Mastered';"
                @keydown.enter.prevent="editingRecord.assessment = 'Mastered'; editingRecord.moduleStatus = 'Mastered';"
              >
                <div class="assessment-radio-circle">
                  <span v-if="editingRecord.assessment === 'Mastered' || editingRecord.moduleStatus === 'Mastered'" class="radio-dot"></span>
                </div>
                <div class="assessment-card-info">
                  <span class="assessment-card-title">Mastered</span>
                  <span class="assessment-card-desc">Learner has met the required competencies.</span>
                </div>
              </div>

              <div
                class="assessment-card card-not-mastered"
                :class="{ 'is-selected': editingRecord.assessment === 'Not Mastered' || editingRecord.moduleStatus === 'Not Mastered' }"
                role="button"
                tabindex="0"
                @click="editingRecord.assessment = 'Not Mastered'; editingRecord.moduleStatus = 'Not Mastered';"
                @keydown.space.prevent="editingRecord.assessment = 'Not Mastered'; editingRecord.moduleStatus = 'Not Mastered';"
                @keydown.enter.prevent="editingRecord.assessment = 'Not Mastered'; editingRecord.moduleStatus = 'Not Mastered';"
              >
                <div class="assessment-radio-circle">
                  <span v-if="editingRecord.assessment === 'Not Mastered' || editingRecord.moduleStatus === 'Not Mastered'" class="radio-dot"></span>
                </div>
                <div class="assessment-card-info">
                  <span class="assessment-card-title">Not Mastered</span>
                  <span class="assessment-card-desc">Learner still needs to develop competencies.</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Teacher Remarks</label>
            <textarea
              v-model="editingRecord.remarks"
              rows="3"
              class="form-textarea"
              placeholder="Enter remarks, observations, or recommendations..."
            ></textarea>
          </div>

          <div class="modal-actions-footer">
            <button type="button" class="btn btn-secondary" @click="editingRecord = null">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL: ADD LEARNER RECORD                                    -->
    <!-- ============================================================ -->
    <div v-if="isAddingRecord" class="modal-overlay" @click.self="isAddingRecord = false">
      <div class="modal-box record-edit-modal">
        <div class="modal-header">
          <div>
            <h2 class="modal-title-text">Add Learner Record</h2>
            <p class="modal-sub-text">Record module assessment and learning activities for a learner.</p>
          </div>
          <button type="button" class="modal-close-btn" @click="isAddingRecord = false">&times;</button>
        </div>

        <form @submit.prevent="saveNewRecord" class="record-edit-form">
          <!-- 1. Learner Name (Dropdown) -->
          <div class="form-group">
            <label class="form-label">Learner Name <span class="req">*</span></label>
            <select
              v-model="newRecord.learnerId"
              class="form-select custom-select-arrow"
              required
              @change="onLearnerSelect(newRecord.learnerId)"
            >
              <option value="" disabled selected>Select a learner</option>
              <option v-for="l in assignedLearners" :key="l.id" :value="l.id">
                {{ l.name }}
              </option>
            </select>
          </div>

          <!-- 2. Module Title (Text Input) -->
          <div class="form-group">
            <label class="form-label">Module Title <span class="req">*</span></label>
            <input
              v-model="newRecord.moduleTitle"
              type="text"
              class="form-input"
              placeholder="e.g., Communication Skills Module 1"
              required
            />
          </div>

          <!-- 2b. Learning Strand -->
          <div class="form-group">
            <label class="form-label">Learning Strand</label>
            <select v-model="newRecord.strandName" class="form-select custom-select-arrow">
              <option value="">Select Learning Strand</option>
              <option value="LS1 Communication Skills (English)">LS1 Communication Skills (English)</option>
              <option value="LS1 Communication Skills (Filipino)">LS1 Communication Skills (Filipino)</option>
              <option value="LS2 Scientific Literacy and Critical Thinking">LS2 Scientific Literacy and Critical Thinking</option>
              <option value="LS3 Mathematical and Problem Solving Skills">LS3 Mathematical and Problem Solving Skills</option>
              <option value="LS4 Life and Career Skills">LS4 Life and Career Skills</option>
              <option value="LS5 Digital Literacy">LS5 Digital Literacy</option>
              <option value="LS6 Understanding the Self and Society">LS6 Understanding the Self and Society</option>
            </select>
          </div>

          <!-- 3 & 4. Date Started & Date Finished (2-Column Grid) -->
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Date Started <span class="req">*</span></label>
              <input
                v-model="newRecord.dateStarted"
                type="date"
                class="form-input date-input"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Date Finished <span class="req">*</span></label>
              <input
                v-model="newRecord.dateFinished"
                type="date"
                class="form-input date-input"
                required
              />
            </div>
          </div>

          <!-- 5 & 6. Pre-Test and Post-Test Score (Score / Total Items) -->
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Pre-Test Score</label>
              <div class="score-input-split">
                <input
                  v-model.number="newRecord.preTestScore"
                  type="number"
                  min="0"
                  :max="newRecord.preTestTotal || undefined"
                  class="form-input score-num-in"
                  placeholder="Score"
                />
                <span class="slash-div">/</span>
                <input
                  v-model.number="newRecord.preTestTotal"
                  type="number"
                  min="1"
                  class="form-input score-num-in"
                  placeholder=""
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Post-Test Score</label>
              <div class="score-input-split">
                <input
                  v-model.number="newRecord.postTestScore"
                  type="number"
                  min="0"
                  :max="newRecord.postTestTotal || undefined"
                  class="form-input score-num-in"
                  placeholder="Score"
                />
                <span class="slash-div">/</span>
                <input
                  v-model.number="newRecord.postTestTotal"
                  type="number"
                  min="1"
                  class="form-input score-num-in"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          <!-- 7. Other Related Activities Accomplished -->
          <div class="form-group">
            <label class="form-label">Other Related Activities Accomplished</label>
            <textarea
              v-model="newRecord.otherActivities"
              rows="3"
              class="form-textarea"
              placeholder="e.g., worksheets, performance tasks, projects, reading activities, etc."
            ></textarea>
          </div>

          <!-- 8. ALS Teacher's Assessment -->
          <div class="form-group">
            <label class="form-label">ALS Teacher's Assessment <span class="req">*</span></label>
            <div class="assessment-cards-grid">
              <!-- Mastered Card -->
              <div
                class="assessment-card card-mastered"
                :class="{ 'is-selected': newRecord.assessment === 'Mastered' }"
                role="button"
                tabindex="0"
                @click="newRecord.assessment = 'Mastered'"
                @keydown.space.prevent="newRecord.assessment = 'Mastered'"
                @keydown.enter.prevent="newRecord.assessment = 'Mastered'"
              >
                <div class="assessment-radio-circle">
                  <span v-if="newRecord.assessment === 'Mastered'" class="radio-dot"></span>
                </div>
                <div class="assessment-card-info">
                  <span class="assessment-card-title">Mastered</span>
                  <span class="assessment-card-desc">Learner has met the required competencies.</span>
                </div>
              </div>

              <!-- Not Mastered Card -->
              <div
                class="assessment-card card-not-mastered"
                :class="{ 'is-selected': newRecord.assessment === 'Not Mastered' }"
                role="button"
                tabindex="0"
                @click="newRecord.assessment = 'Not Mastered'"
                @keydown.space.prevent="newRecord.assessment = 'Not Mastered'"
                @keydown.enter.prevent="newRecord.assessment = 'Not Mastered'"
              >
                <div class="assessment-radio-circle">
                  <span v-if="newRecord.assessment === 'Not Mastered'" class="radio-dot"></span>
                </div>
                <div class="assessment-card-info">
                  <span class="assessment-card-title">Not Mastered</span>
                  <span class="assessment-card-desc">Learner still needs to develop competencies.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 9. Teacher Remarks -->
          <div class="form-group">
            <label class="form-label">Teacher Remarks</label>
            <textarea
              v-model="newRecord.remarks"
              rows="3"
              class="form-textarea"
              placeholder="Enter remarks, observations, or recommendations..."
            ></textarea>
          </div>

          <!-- Modal Action Buttons -->
          <div class="modal-actions-footer">
            <button type="button" class="btn btn-secondary" @click="isAddingRecord = false">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
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
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { useClcData } from '../composables/useClcData.js';
import { getAssignedLearners } from '../api/learners.js';
import { getRecords, createRecord, updateRecord, deleteRecord } from '../api/records.js';

const { teacherName, teacherId, assignedCenters } = useTeacherSession();

// Reactive Filter States
const filterLearnerId = ref('');
const filterProgramLevel = ref('');
const filterLearningCenter = ref('');
const recordsSearchQuery = ref('');
const records = ref([]);
const loading = ref(false);

// Aggregate records across all assigned CLCs (for fallback and local sync)
const clcDataInstances = computed(() => {
  const slugs = (assignedCenters.value || []).map((c) => c.slug);
  if (!slugs.includes('_standalone-modules')) {
    slugs.push('_standalone-modules');
  }
  return slugs;
});

function findClcDataForRecord(recordId) {
  for (const slug of clcDataInstances.value) {
    const clcData = useClcData(slug);
    const found = clcData.records.value.find(
      (r) => r.id === recordId || String(r.id) === String(recordId)
    );
    if (found) return clcData;
  }
  const defaultSlug = assignedCenters.value?.[0]?.slug || '_standalone-modules';
  return useClcData(defaultSlug);
}

// Teacher Assigned Learners for Records & Filters (assigned to logged-in teacher only)
const assignedLearnersList = ref([]);
const loadingLearners = ref(false);
const assignedLearners = computed(() => assignedLearnersList.value);

// Available Learning Centers (assigned to logged-in teacher only)
const availableLearningCenters = computed(() => {
  const centers = [];
  const seen = new Set();
  if (Array.isArray(assignedCenters.value)) {
    for (const c of assignedCenters.value) {
      if (c.name && !seen.has(c.name)) {
        seen.add(c.name);
        centers.push({ id: c.id, name: c.name });
      }
    }
  }
  if (Array.isArray(assignedLearnersList.value)) {
    for (const l of assignedLearnersList.value) {
      const cName = l.learningCenter || l.centerName;
      if (cName && !seen.has(cName)) {
        seen.add(cName);
        centers.push({ id: l.learningCenterId || cName, name: cName });
      }
    }
  }
  return centers;
});

const isAnyFilterActive = computed(() => {
  return !!(
    filterLearnerId.value ||
    filterProgramLevel.value ||
    filterLearningCenter.value ||
    recordsSearchQuery.value
  );
});

async function fetchRecords() {
  loading.value = true;
  try {
    const tid = teacherId.value;
    const params = {
      teacherId: tid || undefined,
      learnerId: filterLearnerId.value || undefined,
      programLevel: filterProgramLevel.value || undefined,
      learningCenter: filterLearningCenter.value || undefined,
      search: recordsSearchQuery.value.trim() || undefined,
    };
    const { data } = await getRecords(params);
    if (Array.isArray(data)) {
      records.value = data;
    } else {
      records.value = [];
    }
  } catch (err) {
    console.error('Could not fetch records from backend:', err);
    records.value = [];
  } finally {
    loading.value = false;
  }
}

// Watch filters to update records immediately
watch([filterLearnerId, filterProgramLevel, filterLearningCenter], () => {
  fetchRecords();
});

// Computed filteredRecords for instant reactive search and filtering
const filteredRecords = computed(() => {
  let list = records.value;
  const q = recordsSearchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (r) =>
        r.learnerName?.toLowerCase().includes(q) ||
        r.lrn?.toLowerCase().includes(q) ||
        r.moduleTitle?.toLowerCase().includes(q)
    );
  }
  return list;
});

function clearFilters() {
  filterLearnerId.value = '';
  filterProgramLevel.value = '';
  filterLearningCenter.value = '';
  recordsSearchQuery.value = '';
  fetchRecords();
}

function moduleStatusClass(status) {
  switch (status) {
    case 'Mastered':
      return 'status-mastered';
    case 'In Progress':
      return 'status-in-progress';
    case 'Not Mastered':
      return 'status-not-mastered';
    case 'Not Started':
    default:
      return 'status-not-started';
  }
}

// View & Edit Modals
const viewingRecord = ref(null);
const editingRecord = ref(null);

function openViewRecordModal(record) {
  viewingRecord.value = { ...record };
}

function openEditRecordModal(record) {
  editingRecord.value = {
    ...record,
    strandName: record.strandName || '',
    selfAssessment: record.selfAssessment || '',
    preTestScore: record.preTestScore != null ? record.preTestScore : null,
    preTestTotal: record.preTestTotal != null ? record.preTestTotal : null,
    postTestScore: record.postTestScore != null ? record.postTestScore : null,
    postTestTotal: record.postTestTotal != null ? record.postTestTotal : null,
    dateStarted: record.dateStarted || '',
    dateFinished: record.dateFinished || record.dateCompleted || '',
    otherActivities: record.otherActivities || '',
    assessment: record.assessment || record.moduleStatus || 'Mastered',
  };
}

async function saveEditedRecord() {
  if (!editingRecord.value) return;

  const updatePayload = {
    strandName: editingRecord.value.strandName || '',
    selfAssessment: '',
    preTestScore: editingRecord.value.preTestScore != null && editingRecord.value.preTestScore !== '' ? Number(editingRecord.value.preTestScore) : null,
    preTestTotal: editingRecord.value.preTestTotal != null && editingRecord.value.preTestTotal !== '' ? Number(editingRecord.value.preTestTotal) : null,
    postTestScore: editingRecord.value.postTestScore != null && editingRecord.value.postTestScore !== '' ? Number(editingRecord.value.postTestScore) : null,
    postTestTotal: editingRecord.value.postTestTotal != null && editingRecord.value.postTestTotal !== '' ? Number(editingRecord.value.postTestTotal) : null,
    dateStarted: editingRecord.value.dateStarted || '',
    dateFinished: editingRecord.value.dateFinished || '',
    dateCompleted: editingRecord.value.dateFinished || editingRecord.value.dateCompleted || '',
    otherActivities: editingRecord.value.otherActivities ? editingRecord.value.otherActivities.trim() : '',
    assessment: editingRecord.value.assessment || editingRecord.value.moduleStatus,
    moduleStatus: editingRecord.value.assessment || editingRecord.value.moduleStatus,
    remarks: editingRecord.value.remarks ? editingRecord.value.remarks.trim() : '',
  };

  try {
    await updateRecord(editingRecord.value.id, updatePayload);
  } catch (err) {
    console.warn('API update failed, updating local clcData:', err);
  }

  // Also sync local clcData
  const clcData = findClcDataForRecord(editingRecord.value.id);
  if (clcData) {
    clcData.updateRecord(editingRecord.value.id, updatePayload);
  }

  editingRecord.value = null;
  await fetchRecords();
  alert('Record updated successfully!');
}

async function confirmDeleteRecord(record) {
  if (!record) return;
  const learner = record.learnerName || 'this learner';
  const mod = record.moduleTitle || 'module';
  if (confirm(`Are you sure you want to delete the record for ${learner} (${mod})?`)) {
    try {
      await deleteRecord(record.id);
    } catch (err) {
      console.warn('API delete failed, updating local clcData:', err);
    }
    const clcData = findClcDataForRecord(record.id);
    if (clcData) {
      clcData.deleteRecord(record.id);
    }
    await fetchRecords();
  }
}

async function loadTeacherLearners() {
  loadingLearners.value = true;
  try {
    const tid = teacherId.value;
    if (!tid) {
      assignedLearnersList.value = [];
      return;
    }
    const { data } = await getAssignedLearners({ teacherId: tid });
    if (Array.isArray(data)) {
      assignedLearnersList.value = data.map((l) => ({
        id: l.id,
        name: l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Learner',
        lrn: l.lrn || '',
        level: l.level || 'A&E Elementary',
        learningCenter: l.learningCenter || (l.center ? l.center.name : ''),
        learningCenterId: l.learningCenterId,
      }));
    } else {
      assignedLearnersList.value = [];
    }
  } catch (err) {
    console.error('Could not load assigned learners from API:', err);
    assignedLearnersList.value = [];
  } finally {
    loadingLearners.value = false;
  }
}

onMounted(async () => {
  await loadTeacherLearners();
  await fetchRecords();
});

function onLearnerSelect(learnerId) {
  const learner = assignedLearners.value.find((l) => String(l.id) === String(learnerId));
  if (learner) {
    newRecord.learnerName = learner.name;
    newRecord.lrn = learner.lrn;
    newRecord.level = learner.level;
    newRecord.learningCenter = learner.learningCenter || '';
  } else {
    newRecord.learnerName = '';
    newRecord.lrn = '';
    newRecord.level = '';
    newRecord.learningCenter = '';
  }
}

// Add Record Modal
const isAddingRecord = ref(false);
const newRecord = reactive({
  learnerId: '',
  learnerName: '',
  lrn: '',
  level: '',
  learningCenter: '',
  moduleTitle: '',
  strandName: '',
  dateStarted: '',
  dateFinished: '',
  preTestScore: null,
  preTestTotal: null,
  postTestScore: null,
  postTestTotal: null,
  otherActivities: '',
  selfAssessment: '',
  assessment: '',
  remarks: '',
});

function openAddRecordModal() {
  newRecord.learnerId = '';
  newRecord.learnerName = '';
  newRecord.lrn = '';
  newRecord.level = '';
  newRecord.learningCenter = '';
  newRecord.moduleTitle = '';
  newRecord.strandName = '';
  newRecord.dateStarted = '';
  newRecord.dateFinished = '';
  newRecord.preTestScore = null;
  newRecord.preTestTotal = null;
  newRecord.postTestScore = null;
  newRecord.postTestTotal = null;
  newRecord.otherActivities = '';
  newRecord.selfAssessment = '';
  newRecord.assessment = '';
  newRecord.remarks = '';

  isAddingRecord.value = true;
}

async function saveNewRecord() {
  if (!newRecord.learnerId || !newRecord.learnerName) {
    alert('Please select a learner.');
    return;
  }
  if (!newRecord.moduleTitle.trim()) {
    alert('Please enter a module title.');
    return;
  }
  if (!newRecord.dateStarted) {
    alert('Please select the Date Started.');
    return;
  }
  if (!newRecord.dateFinished) {
    alert('Please select the Date Finished.');
    return;
  }
  if (!newRecord.assessment) {
    alert("Please select the ALS Teacher's Assessment (Mastered or Not Mastered).");
    return;
  }

  const tid = teacherId.value;
  const recordPayload = {
    teacherId: tid,
    learnerId: newRecord.learnerId,
    learnerName: newRecord.learnerName.trim(),
    lrn: newRecord.lrn,
    level: newRecord.level || 'A&E Elementary',
    learningCenter: newRecord.learningCenter || assignedCenters.value?.[0]?.name || '',
    moduleTitle: newRecord.moduleTitle.trim(),
    strandName: newRecord.strandName || '',
    dateStarted: newRecord.dateStarted,
    dateFinished: newRecord.dateFinished,
    preTestScore: newRecord.preTestScore != null && newRecord.preTestScore !== '' ? Number(newRecord.preTestScore) : null,
    preTestTotal: newRecord.preTestTotal != null && newRecord.preTestTotal !== '' ? Number(newRecord.preTestTotal) : null,
    postTestScore: newRecord.postTestScore != null && newRecord.postTestScore !== '' ? Number(newRecord.postTestScore) : null,
    postTestTotal: newRecord.postTestTotal != null && newRecord.postTestTotal !== '' ? Number(newRecord.postTestTotal) : null,
    otherActivities: newRecord.otherActivities.trim(),
    selfAssessment: '',
    assessment: newRecord.assessment,
    moduleStatus: newRecord.assessment,
    dateCompleted: newRecord.dateFinished,
    remarks: newRecord.remarks.trim(),
  };

  try {
    await createRecord(recordPayload);
  } catch (err) {
    console.warn('API create failed, adding to local clcData:', err);
  }

  // Also sync to local clcData
  const defaultSlug = assignedCenters.value?.[0]?.slug || '_standalone-modules';
  const clcData = useClcData(defaultSlug);
  clcData.addRecord(recordPayload);

  isAddingRecord.value = false;
  await fetchRecords();
  alert('Learner record added successfully!');
}
</script>

<style scoped>
/* Filter Card Design */
.filter-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  align-items: flex-end;
}

@media (max-width: 960px) {
  .filter-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
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
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-select {
  width: 100%;
  height: 40px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.5rem 2.25rem 0.5rem 0.85rem;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  appearance: none;
  cursor: pointer;
}

.filter-select:hover {
  background: #ffffff;
  border-color: #94a3b8;
}

.filter-select:focus {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.select-chevron {
  position: absolute;
  right: 0.85rem;
  pointer-events: none;
  color: #64748b;
  display: flex;
  align-items: center;
}

.filter-actions-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.btn-clear-filters {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.45rem 0.95rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-clear-filters:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #94a3b8;
}

.btn-clear-filters.is-active {
  background: #ffffff;
  color: #2563eb;
  border-color: #93c5fd;
}

.btn-clear-filters.is-active:hover {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1d4ed8;
}

.empty-table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: #64748b;
  font-size: 0.9rem;
}

/* Empty State Card */
.empty-state-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 4.5rem 2rem;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.empty-graphic-wrapper {
  margin-bottom: 1.25rem;
}

.empty-state-svg {
  display: block;
}

.empty-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #334155;
  margin: 0 0 0.5rem 0;
}

.empty-desc {
  font-size: 0.9rem;
  color: #64748b;
  max-width: 440px;
  line-height: 1.5;
  margin: 0;
}

/* Records Table Card */
.records-table-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.table-card-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.35rem 1.75rem;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 1rem;
}

.records-card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.sub-text {
  font-size: 0.85rem;
  color: #64748b;
}

.records-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.records-search-input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.5rem 0.85rem;
  font-size: 0.85rem;
  outline: none;
  width: 260px;
}

.records-search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background-color: #f8fafc;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.88rem;
  color: #334155;
  vertical-align: middle;
}

.col-num {
  color: #94a3b8;
  font-weight: 600;
}

.col-learner-name {
  font-weight: 700;
  color: #0f172a;
}

.col-lrn-text {
  font-family: monospace;
  color: #64748b;
}

.col-mod-title {
  font-weight: 600;
  color: #1e293b;
}

.score-number-val {
  font-weight: 700;
  color: #475569;
}

.score-number-val.post-val {
  color: #16a34a;
}

.status-badge-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.dot-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-mastered {
  background-color: #f0fdf4;
  color: #16a34a;
}
.status-mastered .dot-indicator {
  background-color: #22c55e;
}

.status-in-progress {
  background-color: #fffbeb;
  color: #d97706;
}
.status-in-progress .dot-indicator {
  background-color: #f59e0b;
}

.status-not-mastered {
  background-color: #fef2f2;
  color: #dc2626;
}
.status-not-mastered .dot-indicator {
  background-color: #ef4444;
}

.status-not-started {
  background-color: #f1f5f9;
  color: #64748b;
}
.status-not-started .dot-indicator {
  background-color: #94a3b8;
}

.record-actions-wrap {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.4rem;
}

.record-icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.record-icon-btn.btn-view-act {
  color: #2563eb;
}

.record-icon-btn.btn-view-act:hover {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1d4ed8;
}

.record-icon-btn.btn-edit-act {
  color: #475569;
}

.record-icon-btn.btn-edit-act:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.record-icon-btn.btn-delete-act {
  color: #ef4444;
}

.record-icon-btn.btn-delete-act:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}

.no-records-msg {
  text-align: center;
  padding: 2.5rem !important;
  color: #94a3b8;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 999;
  padding: 1.5rem 1rem;
  overflow-y: auto;
}

.modal-box {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  margin: 1.5rem auto 2.5rem;
  position: relative;
}

.record-details-modal,
.record-edit-modal {
  max-width: 620px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal-sub-text {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.record-modal-body,
.record-edit-form {
  padding: 1.25rem 1.75rem;
}

.modal-section-card {
  margin-bottom: 1.35rem;
}

.section-h4 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.info-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  background: #f8fafc;
  padding: 1rem 1.25rem;
  border-radius: 10px;
}

.summary-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.summary-value {
  font-size: 0.92rem;
  color: #0f172a;
}

.scores-highlight-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.score-card-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
}

.score-card-lbl {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.score-card-num {
  font-size: 1.5rem;
  font-weight: 800;
}

.score-card-num.pre {
  color: #475569;
}

.score-card-num.post {
  color: #16a34a;
}

.output-preview-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1.15rem;
}

.output-preview-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.output-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.output-sub {
  font-size: 0.78rem;
  color: #64748b;
}

.empty-output-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 1.25rem;
  text-align: center;
  border-radius: 10px;
  color: #94a3b8;
  font-size: 0.88rem;
}

.remarks-display-bubble {
  background: #eff6ff;
  border-left: 3.5px solid #2563eb;
  padding: 0.85rem 1.15rem;
  border-radius: 0 8px 8px 0;
  font-size: 0.9rem;
  color: #1e3a8a;
  line-height: 1.5;
}

.activities-display-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.85rem 1.15rem;
  font-size: 0.9rem;
  color: #334155;
  white-space: pre-wrap;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 0.95rem;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.score-input-split {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-num-in {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-weight: 600;
}

.slash-div {
  font-size: 1.15rem;
  font-weight: 700;
  color: #94a3b8;
  user-select: none;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.custom-select-arrow {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.85rem center;
  background-size: 1.1rem;
  padding-right: 2.25rem;
  cursor: pointer;
}

.date-input {
  color: #334155;
  cursor: pointer;
}

.assessment-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.assessment-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  border: 1.5px solid transparent;
}

.assessment-card.card-mastered {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
}

.assessment-card.card-mastered:hover {
  border-color: #86efac;
}

.assessment-card.card-mastered.is-selected {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
}

.assessment-card.card-not-mastered {
  background-color: #fef2f2;
  border-color: #fecaca;
}

.assessment-card.card-not-mastered:hover {
  border-color: #fca5a5;
}

.assessment-card.card-not-mastered.is-selected {
  border-color: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
}

.assessment-radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.15s ease;
}

.card-mastered .assessment-radio-circle {
  border: 2px solid #22c55e;
}

.card-not-mastered .assessment-radio-circle {
  border: 2px solid #ef4444;
}

.assessment-radio-circle .radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.card-mastered .assessment-radio-circle .radio-dot {
  background-color: #16a34a;
}

.card-not-mastered .assessment-radio-circle .radio-dot {
  background-color: #dc2626;
}

.assessment-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.assessment-card-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0f172a;
}

.assessment-card-desc {
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.35;
}

.modal-actions-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.75rem 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background: #1d4ed8;
}

/* Records Top Action Bar */
.records-top-action-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1.25rem;
  width: 100%;
}

.btn-add-record {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #2563eb;
  color: #ffffff;
  border: 1px solid #2563eb;
  padding: 0.55rem 1.15rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.18);
  transition: all 0.15s ease-in-out;
  white-space: nowrap;
}

.btn-add-record:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
}

.btn-add-record:active {
  transform: translateY(0);
}

.btn-add-record svg {
  flex-shrink: 0;
}

.req {
  color: #ef4444;
}

@media (max-width: 640px) {
  .records-top-action-bar {
    justify-content: stretch;
    margin-bottom: 1rem;
  }

  .btn-add-record {
    width: 100%;
    justify-content: center;
  }
}
</style>

<template>
  <div class="page-container modules-page">
    <!-- Standardized Page Header -->
    <PageHeader
      title="Modules"
      :breadcrumbs="[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Modules', to: '/dashboard/modules' },
        { label: activeLevel },
      ]"
    >
      <template #description>
        View and manage learning modules for <strong>{{ activeLevel }}</strong>.
      </template>

      <template #actions>
        <button
          v-if="!isCreatingModule"
          type="button"
          class="btn btn-primary btn-upload-module"
          @click="startModuleCreation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Upload Module</span>
        </button>

        <button
          v-else
          type="button"
          class="btn btn-secondary"
          @click="cancelModuleCreation"
        >
          Cancel
        </button>
      </template>
    </PageHeader>

    <!-- VIEW 1: LEARNING FEED (Main Content when not creating) -->
    <div v-if="!isCreatingModule" class="learning-feed-container">
      <!-- Loading State -->
      <div v-if="loading" class="state-container">
        <div class="state-icon-circle">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
          </svg>
        </div>
        <h3 class="state-title">Loading learning modules...</h3>
      </div>

      <!-- Empty State -->
      <div v-else-if="modules.length === 0" class="state-container empty-feed-card">
        <div class="empty-graphic-wrapper">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <h3 class="empty-title">No modules available for {{ activeLevel }} yet.</h3>
        <p class="empty-desc">You haven't uploaded or created any modules for {{ activeLevel }} yet. Click "+ Upload Module" to create your first learning package.</p>
        <button type="button" class="btn btn-primary" style="margin-top: 1.25rem;" @click="startModuleCreation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Upload Module</span>
        </button>
      </div>

      <!-- Learning Feed List -->
      <div v-else class="modules-feed-wrapper">
        <!-- Module Filters: All / Recent / Older (Right-aligned directly below Upload Module button) -->
        <div class="modules-filter-row">
          <div class="modules-filter-tabs">
            <button
              type="button"
              class="module-filter-btn"
              :class="{ active: activeFilter === 'all' }"
              @click="activeFilter = 'all'"
            >
              <span>All</span>
              <span class="tab-count">{{ filterCounts.all }}</span>
            </button>
            <button
              type="button"
              class="module-filter-btn"
              :class="{ active: activeFilter === 'recent' }"
              @click="activeFilter = 'recent'"
            >
              <span>Recent</span>
              <span class="tab-count">{{ filterCounts.recent }}</span>
            </button>
            <button
              type="button"
              class="module-filter-btn"
              :class="{ active: activeFilter === 'older' }"
              @click="activeFilter = 'older'"
            >
              <span>Older</span>
              <span class="tab-count">{{ filterCounts.older }}</span>
            </button>
          </div>
        </div>

        <div class="feed-header-info">
          <span class="feed-count-text">Showing <strong>{{ filteredModules.length }}</strong> published {{ filteredModules.length === 1 ? 'module' : 'modules' }} ({{ activeLevel }})</span>
        </div>

        <!-- Empty Filter State when no modules match the active filter -->
        <div v-if="filteredModules.length === 0" class="state-container empty-feed-card empty-filter-state">
          <div class="empty-graphic-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h3 class="empty-title">
            {{ activeFilter === 'recent' ? 'No recent modules found' : 'No older modules found' }}
          </h3>
          <p class="empty-desc">
            {{ activeFilter === 'recent'
              ? 'There are no modules uploaded within the last 2 days for ' + activeLevel + '.'
              : 'There are no modules uploaded 3 or more days ago for ' + activeLevel + '.' }}
          </p>
          <button type="button" class="btn btn-secondary" style="margin-top: 1rem;" @click="activeFilter = 'all'">
            Show All Modules
          </button>
        </div>

        <div v-else class="learning-feed-list">
          <div
            v-for="item in filteredModules"
            :key="item.id"
            class="feed-card-item is-clickable"
            title="Click this to open the uploaded module."
            @click="openModuleDetails(item.id)"
          >
            <!-- Module Thumbnail (First page of uploaded PDF) -->
            <ModuleThumbnail
              :file-url="item.fileUrl"
              :cover-image-url="item.coverImageUrl"
              :title="item.title"
              :module-id="item.id"
            />

            <!-- Feed Content -->
            <div class="feed-info-content">
              <div class="feed-badge-row">
                <span class="feed-status-badge">
                  <span class="status-dot"></span>
                  {{ item.status || 'Published' }}
                </span>
                <span v-if="item.code" class="feed-code-tag">{{ item.code }}</span>
                <span class="feed-strand-tag">{{ item.strand }}</span>
                <span class="feed-level-pill">{{ item.level }}</span>
              </div>

              <h2 class="feed-card-title">{{ item.title }}</h2>

              <p v-if="item.instructions || item.description" class="feed-card-desc">
                {{ item.instructions || item.description }}
              </p>

              <div class="feed-meta-bottom">
                <span class="feed-author-name">Created by {{ item.teacherName || item.author || teacherName || 'Teacher' }}</span>
                <span class="meta-dot">&bull;</span>
                <span class="feed-date-text">{{ formatDisplayDate(item.createdAt || item.date) }}</span>
                <span v-if="item.learningCenter" class="meta-dot">&bull;</span>
                <span v-if="item.learningCenter" class="feed-clc-text">{{ item.learningCenter }}</span>
                <span v-if="item.dateStarted && item.dateEnded" class="meta-dot">&bull;</span>
                <span v-if="item.dateStarted && item.dateEnded" class="feed-duration-text">
                  Duration: {{ formatDisplayDate(item.dateStarted) }} &ndash; {{ formatDisplayDate(item.dateEnded) }}
                </span>
              </div>
            </div>

            <!-- Feed Card Right Actions / File Info -->
            <div class="feed-card-actions">
              <a
                v-if="item.fileUrl"
                :href="item.fileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-view-material"
                title="View Learning Material"
                @click.stop
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Material</span>
              </a>

              <button
                type="button"
                class="btn-module-chevron"
                title="Open Module Details"
                aria-label="Open Module Details"
                @click.stop="openModuleDetails(item.id)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW 2: CREATE MODULE WIZARD (When + Upload Module is clicked) -->
    <div v-else class="creation-wizard-card">
      <!-- Wizard Stepper Header -->
      <div class="wizard-stepper-header">
        <div
          v-for="(step, idx) in wizardSteps"
          :key="step.key"
          class="wizard-step-node"
          :class="{ active: currentStepIndex === idx, completed: currentStepIndex > idx }"
        >
          <div class="step-badge">{{ idx + 1 }}</div>
          <div class="step-text">
            <span class="step-label">Step {{ idx + 1 }}</span>
            <span class="step-title">{{ step.title }}</span>
          </div>
          <div v-if="idx < wizardSteps.length - 1" class="step-divider"></div>
        </div>
      </div>

      <!-- Wizard Body -->
      <div class="wizard-body-content">
        <!-- STEP 1: MODULE INFORMATION -->
        <div v-if="currentStepIndex === 0" class="step-form-pane">
          <div class="pane-header-info">
            <h3>Step 1: Module Information</h3>
            <p>Define the title, instructions, learning strand, module code, ALS level, learning center, and learner assignments.</p>
          </div>

          <!-- Step 1 Validation Warning Message -->
          <div v-if="step1ErrorMessage" class="form-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ step1ErrorMessage }}</span>
          </div>

          <div class="form-grid-2">
            <!-- ROW 1 — FULL WIDTH: Module Title * -->
            <div class="field-item full-width">
              <label class="field-lbl">Module Title <span class="req">*</span></label>
              <input
                v-model="newModule.title"
                type="text"
                class="field-input-box"
                placeholder="e.g., Communication Skills: Reading Comprehension"
                required
              />
            </div>

            <!-- ROW 2 — FULL WIDTH: Instructions -->
            <div class="field-item full-width">
              <label class="field-lbl">Instructions</label>
              <textarea
                v-model="newModule.instructions"
                rows="3"
                class="field-textarea-box"
                placeholder="Enter instructions or directions for this module..."
              ></textarea>
            </div>

            <!-- ROW 3 — TWO COLUMNS: Learning Strand * | Module Code * -->
            <div class="field-item">
              <label class="field-lbl">Learning Strand <span class="req">*</span></label>
              <select v-model="newModule.strand" class="field-select-box" required>
                <option value="" disabled>Select Learning Strand</option>
                <option v-for="s in internalStrands" :key="s.slug" :value="s.name">
                  {{ s.name }}
                </option>
              </select>
            </div>

            <div class="field-item">
              <label class="field-lbl">Module Code <span class="req">*</span></label>
              <LockedFieldTooltip message="This field cannot be edited.">
                <input
                  type="text"
                  :value="newModule.code"
                  class="field-input-box is-readonly"
                  placeholder="Auto-populated based on Learning Strand"
                  readonly
                  title="This field cannot be edited."
                />
              </LockedFieldTooltip>
            </div>

            <!-- ROW 4 — TWO COLUMNS: ALS Level * | Learning Center * -->
            <div class="field-item">
              <label class="field-lbl">ALS Level <span class="req">*</span></label>
              <div class="locked-level-box">
                <LockedFieldTooltip message="This field cannot be edited.">
                  <input
                    type="text"
                    :value="activeLevel"
                    class="field-input-box is-locked"
                    readonly
                    title="This field cannot be edited."
                  />
                </LockedFieldTooltip>
                <span class="locked-level-badge">Locked to {{ activeLevel }}</span>
              </div>
            </div>

            <div class="field-item">
              <label class="field-lbl">Learning Center <span class="req">*</span></label>
              <select v-model="newModule.learningCenterId" class="field-select-box" required>
                <option value="" disabled>Select Assigned Learning Center</option>
                <option v-for="c in availableLearningCenters" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>

            <!-- ROW 5 — FULL WIDTH: Assign Module To * -->
            <AssignModuleToDropdown
              v-model:is-all-learners="newModule.isAllLearners"
              v-model:selected-learner-ids="newModule.selectedLearnerIds"
              :eligible-learners="eligibleLearners"
              :active-level="activeLevel"
              :center-name="currentSelectedCenterName"
              label-id="assign-module-label"
            />

            <!-- ROW 5 — TWO COLUMNS: Date Started * | Date Ended * -->
            <div class="field-item">
              <label class="field-lbl">Date Started <span class="req">*</span></label>
              <input
                v-model="newModule.dateStarted"
                type="date"
                class="field-input-box"
                required
              />
            </div>

            <div class="field-item">
              <label class="field-lbl">Date Ended <span class="req">*</span></label>
              <input
                v-model="newModule.dateEnded"
                type="date"
                class="field-input-box"
                :min="newModule.dateStarted || undefined"
                required
              />
              <span v-if="dateRangeError" class="field-error-text">
                {{ dateRangeError }}
              </span>
            </div>
          </div>
        </div>

        <!-- STEP 2: PRE-TEST (Assessment) -->
        <div v-else-if="currentStepIndex === 1" class="step-form-pane">
          <div class="pane-header-info">
            <h3>Step 2: Pre-Test (Assessment)</h3>
            <p>Add multiple-choice questions to assess learners' prior knowledge before the module. Click the circle beside the correct answer and provide feedback for both correct and incorrect answers.</p>
          </div>

          <!-- Step 2 Validation Warning Message -->
          <div v-if="step2ErrorMessage" class="form-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ step2ErrorMessage }}</span>
          </div>

          <!-- Pre-Test Questions List -->
          <div class="gf-questions-container">
            <div
              v-for="(q, qIdx) in newModule.preTest"
              :key="q.uid || qIdx"
              :id="`preTest-q-card-${qIdx}`"
              class="gf-question-card"
            >
              <!-- Question Input Row -->
              <div class="gf-question-row">
                <span class="gf-question-number">{{ qIdx + 1 }}.</span>
                <input
                  v-model="q.prompt"
                  type="text"
                  class="gf-question-input"
                  placeholder="Type question here."
                  @input="step2ErrorMessage = ''"
                />
              </div>

              <!-- Vertical Multiple-Choice Options List -->
              <div class="gf-options-list">
                <div
                  v-for="(choice, cIdx) in q.choices"
                  :key="cIdx"
                  class="gf-option-row"
                  :class="{
                    'is-correct-choice': q.correctAnswer === cIdx
                  }"
                >
                  <input
                    type="radio"
                    class="gf-option-radio"
                    :name="`pretest-correct-${q.uid || qIdx}`"
                    :value="cIdx"
                    :checked="q.correctAnswer === cIdx"
                    title="Click circle to select as correct answer"
                    @change="selectCorrectAnswer(q, cIdx, 'preTest')"
                  />
                  <input
                    :id="`option-input-preTest-${q.uid || qIdx}-${cIdx}`"
                    :ref="(el) => setOptionInputRef(`preTest-${q.uid || qIdx}-${cIdx}`, el)"
                    v-model="q.choices[cIdx]"
                    type="text"
                    class="gf-option-input"
                    placeholder="Type option here."
                    @input="step2ErrorMessage = ''"
                  />
                  <span
                    v-if="q.correctAnswer === cIdx"
                    class="gf-correct-tag"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Correct</span>
                  </span>
                  <button
                    type="button"
                    class="gf-remove-option-btn"
                    title="Remove option"
                    aria-label="Remove option"
                    @click="removeOptionFromQuestion(q, cIdx, 'preTest')"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Add Option Control -->
              <div class="gf-add-option-row">
                <span class="gf-radio-deco" aria-hidden="true"></span>
                <button
                  type="button"
                  class="gf-add-option-btn"
                  @click="addOptionToQuestion(q, 'preTest')"
                >
                  Add option
                </button>
              </div>

              <!-- Inline Feedback Section (Correct Answer & Incorrect Answer Feedback) -->
              <div
                v-if="isFeedbackVisible(q)"
                class="gf-inline-feedback-container"
              >
                <div class="gf-inline-feedback-header">
                  <span class="gf-inline-feedback-title">Question Feedback</span>
                  <button
                    type="button"
                    class="gf-feedback-save-btn"
                    title="Save question feedback"
                    @click="saveQuestionFeedback(q)"
                  >
                    Save
                  </button>
                </div>

                <div v-if="q.feedbackError" class="gf-feedback-error-msg" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{{ q.feedbackError }}</span>
                </div>

                <div class="gf-feedback-field">
                  <div class="gf-feedback-field-header">
                    <label class="gf-feedback-label">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="gf-feedback-icon correct">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Correct Answer Feedback</span>
                    </label>
                    <span class="gf-feedback-helper-text">Feedback displayed when the learner selects the correct answer.</span>
                  </div>
                  <textarea
                    v-model="q.correctFeedback"
                    rows="2"
                    class="gf-feedback-input"
                    placeholder="e.g. Great job! That's correct."
                    @input="q.feedbackError = ''"
                  ></textarea>
                </div>

                <div class="gf-feedback-field">
                  <div class="gf-feedback-field-header">
                    <label class="gf-feedback-label">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="gf-feedback-icon incorrect">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      <span>Incorrect Answer Feedback</span>
                    </label>
                    <span class="gf-feedback-helper-text">Feedback displayed when the learner selects an incorrect answer.</span>
                  </div>
                  <textarea
                    v-model="q.incorrectFeedback"
                    rows="2"
                    class="gf-feedback-input"
                    placeholder="e.g. Review page 5 of the module for the correct explanation."
                    @input="q.feedbackError = ''"
                  ></textarea>
                </div>
              </div>

              <!-- Question Card Footer: Add feedback answer & Delete -->
              <div class="gf-card-footer">
                <div class="gf-footer-left">
                  <button
                    type="button"
                    class="gf-add-feedback-btn"
                    :class="{
                      'has-feedback': q.correctFeedback?.trim() || q.incorrectFeedback?.trim(),
                      'is-open': isFeedbackVisible(q)
                    }"
                    @click="toggleQuestionFeedback(q)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Add feedback answer</span>
                  </button>
                  <span
                    v-if="q.feedbackSavedMessage && !isFeedbackVisible(q)"
                    class="gf-feedback-saved-badge"
                    role="status"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{{ q.feedbackSavedMessage }}</span>
                  </span>
                </div>

                <div class="gf-footer-right">
                  <button
                    type="button"
                    class="gf-delete-q-btn"
                    title="Delete question"
                    @click="removeQuestion('preTest', qIdx)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Bar: Total Questions on Left, + Add Question on Right -->
          <div class="gf-questions-bottom-bar">
            <div class="gf-total-questions">
              Total Questions: <strong>{{ newModule.preTest.length }}</strong>
            </div>
            <button
              type="button"
              class="gf-btn-add-question"
              @click="addBlankQuestion('preTest')"
            >
              + Add Question
            </button>
          </div>
        </div>

        <!-- STEP 3: LEARNING MODULE (PDF / DOCX / Image Upload with replace & remove) -->
        <div v-else-if="currentStepIndex === 2" class="step-form-pane">
          <div class="pane-header-info">
            <h3>Step 3: Learning Module Files</h3>
            <p>Upload your instructional material file (PDF, DOCX, or Image). This will be linked to the module record.</p>
          </div>

          <!-- File Upload Dropzone -->
          <div
            class="dropzone-box"
            :class="{ 'has-file': newModule.uploadedFile }"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
              style="display: none;"
              @change="handleFileInputChange"
            />

            <!-- Empty Dropzone State -->
            <div v-if="!newModule.uploadedFile" class="dropzone-empty-state" @click="triggerFileInput">
              <div class="upload-icon-circle">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p class="dropzone-title">Click to select or drag &amp; drop file here</p>
              <p class="dropzone-types">Supported Formats: PDF, DOCX, JPG, JPEG, PNG (up to 50MB)</p>
            </div>

            <!-- Attached File State with Replace and Remove -->
            <div v-else class="file-attached-preview">
              <div class="file-meta-icon" :class="`type-${newModule.fileType.toLowerCase()}`">
                {{ newModule.fileType }}
              </div>
              <div class="file-meta-info">
                <span class="file-meta-name">{{ newModule.fileName }}</span>
                <span class="file-meta-size">{{ newModule.fileSize }} &bull; Ready to publish</span>
              </div>
              <div class="file-meta-actions">
                <button type="button" class="btn-replace-file" @click="triggerFileInput">
                  Replace File
                </button>
                <button type="button" class="btn-remove-file" @click="removeSelectedFile">
                  Remove File
                </button>
              </div>
            </div>
          </div>

          <div class="field-item" style="margin-top: 1.5rem;">
            <label class="field-lbl">Teacher Reading Instructions</label>
            <p class="field-helper-text">
              Provide clear instructions for learners on how to read the module and complete its activities. You may edit or personalize the suggested instructions below.
            </p>
            <textarea
              v-model="newModule.learningNotes"
              rows="3"
              class="field-textarea-box"
              placeholder="Instructions for the learner (e.g., Read Sections 1 through 3 before attempting Post-Test activities)..."
            ></textarea>
          </div>
        </div>

        <!-- STEP 4: POST-TEST -->
        <div v-else-if="currentStepIndex === 3" class="step-form-pane">
          <div class="pane-header-info">
            <div class="pane-header-title-bar">
              <h3>Step 4: Post-Test</h3>
              <button
                type="button"
                class="btn-duplicate-pretest"
                :disabled="!hasValidPreTestQuestions"
                :title="!hasValidPreTestQuestions ? 'No Pre-Test questions available to duplicate.' : 'Duplicate all questions created in Step 2: Pre-Test'"
                @click="handleDuplicateClick"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>Duplicate from Pre-Test</span>
              </button>
            </div>
            <p>Add multiple-choice questions to assess what learners have learned after completing the module. Click the circle beside the correct answer and provide feedback for both correct and incorrect answers.</p>
          </div>

          <!-- Step 4 Validation Warning Message -->
          <div v-if="step4ErrorMessage" class="form-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ step4ErrorMessage }}</span>
          </div>

          <!-- Post-Test Questions List -->
          <div class="gf-questions-container">
            <div
              v-for="(q, qIdx) in newModule.postTest"
              :key="q.uid || qIdx"
              :id="`postTest-q-card-${qIdx}`"
              class="gf-question-card"
            >
              <!-- Question Input Row -->
              <div class="gf-question-row">
                <span class="gf-question-number">{{ qIdx + 1 }}.</span>
                <input
                  v-model="q.prompt"
                  type="text"
                  class="gf-question-input"
                  placeholder="Type question here."
                  @input="step4ErrorMessage = ''"
                />
              </div>

              <!-- Vertical Multiple-Choice Options List -->
              <div class="gf-options-list">
                <div
                  v-for="(choice, cIdx) in q.choices"
                  :key="cIdx"
                  class="gf-option-row"
                  :class="{
                    'is-correct-choice': q.correctAnswer === cIdx
                  }"
                >
                  <input
                    type="radio"
                    class="gf-option-radio"
                    :name="`posttest-correct-${q.uid || qIdx}`"
                    :value="cIdx"
                    :checked="q.correctAnswer === cIdx"
                    title="Click circle to select as correct answer"
                    @change="selectCorrectAnswer(q, cIdx, 'postTest')"
                  />
                  <input
                    :id="`option-input-postTest-${q.uid || qIdx}-${cIdx}`"
                    :ref="(el) => setOptionInputRef(`postTest-${q.uid || qIdx}-${cIdx}`, el)"
                    v-model="q.choices[cIdx]"
                    type="text"
                    class="gf-option-input"
                    placeholder="Type option here."
                    @input="step4ErrorMessage = ''"
                  />
                  <span
                    v-if="q.correctAnswer === cIdx"
                    class="gf-correct-tag"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Correct</span>
                  </span>
                  <button
                    type="button"
                    class="gf-remove-option-btn"
                    title="Remove option"
                    aria-label="Remove option"
                    @click="removeOptionFromQuestion(q, cIdx, 'postTest')"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Add Option Control -->
              <div class="gf-add-option-row">
                <span class="gf-radio-deco" aria-hidden="true"></span>
                <button
                  type="button"
                  class="gf-add-option-btn"
                  @click="addOptionToQuestion(q, 'postTest')"
                >
                  Add option
                </button>
              </div>

              <!-- Inline Feedback Section (Correct Answer & Incorrect Answer Feedback) -->
              <div
                v-if="isFeedbackVisible(q)"
                class="gf-inline-feedback-container"
              >
                <div class="gf-inline-feedback-header">
                  <span class="gf-inline-feedback-title">Question Feedback</span>
                  <button
                    type="button"
                    class="gf-feedback-save-btn"
                    title="Save question feedback"
                    @click="saveQuestionFeedback(q)"
                  >
                    Save
                  </button>
                </div>

                <div v-if="q.feedbackError" class="gf-feedback-error-msg" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{{ q.feedbackError }}</span>
                </div>

                <div class="gf-feedback-field">
                  <div class="gf-feedback-field-header">
                    <label class="gf-feedback-label">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="gf-feedback-icon correct">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Correct Answer Feedback</span>
                    </label>
                    <span class="gf-feedback-helper-text">Feedback displayed when the learner selects the correct answer.</span>
                  </div>
                  <textarea
                    v-model="q.correctFeedback"
                    rows="2"
                    class="gf-feedback-input"
                    placeholder="e.g. Great job! That's correct."
                    @input="q.feedbackError = ''"
                  ></textarea>
                </div>

                <div class="gf-feedback-field">
                  <div class="gf-feedback-field-header">
                    <label class="gf-feedback-label">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="gf-feedback-icon incorrect">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      <span>Incorrect Answer Feedback</span>
                    </label>
                    <span class="gf-feedback-helper-text">Feedback displayed when the learner selects an incorrect answer.</span>
                  </div>
                  <textarea
                    v-model="q.incorrectFeedback"
                    rows="2"
                    class="gf-feedback-input"
                    placeholder="e.g. Review page 5 of the module for the correct explanation."
                    @input="q.feedbackError = ''"
                  ></textarea>
                </div>
              </div>

              <!-- Question Card Footer: Add feedback answer & Delete -->
              <div class="gf-card-footer">
                <div class="gf-footer-left">
                  <button
                    type="button"
                    class="gf-add-feedback-btn"
                    :class="{
                      'has-feedback': q.correctFeedback?.trim() || q.incorrectFeedback?.trim(),
                      'is-open': isFeedbackVisible(q)
                    }"
                    @click="toggleQuestionFeedback(q)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Add feedback answer</span>
                  </button>
                  <span
                    v-if="q.feedbackSavedMessage && !isFeedbackVisible(q)"
                    class="gf-feedback-saved-badge"
                    role="status"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{{ q.feedbackSavedMessage }}</span>
                  </span>
                </div>

                <div class="gf-footer-right">
                  <button
                    type="button"
                    class="gf-delete-q-btn"
                    title="Delete question"
                    @click="removeQuestion('postTest', qIdx)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Bar: Total Questions on Left, + Add Question on Right -->
          <div class="gf-questions-bottom-bar">
            <div class="gf-total-questions">
              Total Questions: <strong>{{ newModule.postTest.length }}</strong>
            </div>
            <button
              type="button"
              class="gf-btn-add-question"
              @click="addBlankQuestion('postTest')"
            >
              + Add Question
            </button>
          </div>
        </div>
      </div>

      <!-- Wizard Navigation Footer -->
      <div class="wizard-footer-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="isSubmitting"
          @click="prevStep"
        >
          {{ currentStepIndex === 0 ? 'Cancel' : '&larr; Back' }}
        </button>

        <div class="wizard-right-btns">
          <button
            v-if="currentStepIndex < wizardSteps.length - 1"
            type="button"
            class="btn btn-primary"
            @click="nextStep"
          >
            Next: {{ wizardSteps[currentStepIndex + 1].title }} &rarr;
          </button>
          <button
            v-else
            type="button"
            class="btn btn-publish-success"
            :disabled="isSubmitting"
            @click="publishCompleteModule"
          >
            <svg v-if="!isSubmitting" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span v-if="isSubmitting">Saving Module...</span>
            <span v-else>Save &amp; Publish Module</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog: Duplicate from Pre-Test -->
    <Teleport to="body">
      <div
        v-if="showDuplicateConfirmModal"
        class="modal-overlay"
        @click.self="showDuplicateConfirmModal = false"
      >
        <div
          class="modal-box duplicate-confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dup-confirm-title"
        >
          <div class="dup-modal-header">
            <div class="dup-modal-icon-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </div>
            <div class="dup-modal-title-group">
              <h3 id="dup-confirm-title" class="dup-modal-title">Duplicate Pre-Test Questions?</h3>
              <p class="dup-modal-desc">
                This will replace your current Post-Test questions with copies of your Pre-Test questions. Any unsaved Post-Test questions will be removed.
              </p>
            </div>
          </div>
          <div class="dup-modal-actions">
            <button
              type="button"
              class="btn-dup-cancel"
              @click="showDuplicateConfirmModal = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-dup-confirm"
              @click="confirmDuplicate"
            >
              Duplicate Questions
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import AssignModuleToDropdown from '../components/AssignModuleToDropdown.vue';
import LockedFieldTooltip from '../components/LockedFieldTooltip.vue';
import ModuleThumbnail from '../components/ModuleThumbnail.vue';
import { getModules, createModule, uploadModuleFile } from '../api/modules.js';
import { getAssignedLearners } from '../api/learners.js';
import { getManilaTodayKey, toDateKey } from '../utils/manilaTime.js';

const props = defineProps({
  defaultLevelSlug: {
    type: String,
    default: '',
  },
  defaultLevel: {
    type: String,
    default: '',
  },
});

const route = useRoute();
const router = useRouter();
const {
  teacherName,
  teacherId,
  currentTeacher,
  assignedCenters,
  assignedProgramLevel,
  setActiveModuleLevel,
  cacheModuleLevel,
} = useTeacherSession();

// Resolve the stable database AlsLevel enum ('ELEMENTARY' or 'JUNIOR') directly from the active route
const activeTargetLevel = computed(() => {
  const path = (route.path || '').toLowerCase();
  const query = (route.query?.level || route.query?.targetLevel || '').toLowerCase();
  const param = (route.params?.levelSlug || '').toLowerCase();

  if (
    path.includes('junior') ||
    path.includes('jhs') ||
    query.includes('junior') ||
    query.includes('jhs') ||
    param.includes('junior')
  ) {
    return 'JUNIOR';
  }
  if (path.includes('elem') || query.includes('elem') || param.includes('elem')) {
    return 'ELEMENTARY';
  }

  // Fallback to teacher assignment
  const spec = (assignedProgramLevel.value || '').toLowerCase();
  if (spec.includes('junior') || spec.includes('jhs')) {
    if (!spec.includes('elem') && !spec.includes('both')) {
      return 'JUNIOR';
    }
  }
  return 'ELEMENTARY';
});

// Official display label for the active ALS Level
const activeLevel = computed(() => {
  return activeTargetLevel.value === 'ELEMENTARY' ? 'A&E Elementary' : 'A&E Junior High';
});

function openModuleDetails(moduleId) {
  if (!moduleId) return;
  const matched = (modules.value || []).find((m) => Number(m.id) === Number(moduleId));
  setActiveModuleLevel(
    matched?.targetLevel || matched?.level || matched?.programLevel || activeTargetLevel.value,
    moduleId
  );
  router.push(`/dashboard/modules/${moduleId}`);
}

// Modules data from database
const modules = ref([]);
const loading = ref(true);
const isSubmitting = ref(false);

// Module Upload Age Filter: 'all' | 'recent' (0–2 days old) | 'older' (3+ days old)
const activeFilter = ref('all');

function getModuleAgeInDays(createdAt, now = new Date()) {
  if (!createdAt) return 999999;
  const todayKey = getManilaTodayKey(now);
  const createdKey = toDateKey(createdAt);
  if (!createdKey || createdKey.length < 10) return 999999;

  const [tY, tM, tD] = todayKey.split('-').map(Number);
  const [cY, cM, cD] = createdKey.split('-').map(Number);

  const todayUtc = Date.UTC(tY, tM - 1, tD);
  const createdUtc = Date.UTC(cY, cM - 1, cD);

  const diffMs = todayUtc - createdUtc;
  const diffDays = Math.floor(diffMs / (24 * 3600 * 1000));
  return Math.max(0, diffDays);
}

const filterCounts = computed(() => {
  const list = modules.value || [];
  let recent = 0;
  let older = 0;
  for (const m of list) {
    const age = getModuleAgeInDays(m.createdAt);
    if (age <= 2) {
      recent++;
    } else {
      older++;
    }
  }
  return {
    all: list.length,
    recent,
    older,
  };
});

const filteredModules = computed(() => {
  const list = modules.value || [];
  if (activeFilter.value === 'recent') {
    return list.filter((m) => getModuleAgeInDays(m.createdAt) <= 2);
  }
  if (activeFilter.value === 'older') {
    return list
      .filter((m) => getModuleAgeInDays(m.createdAt) >= 3)
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
  return list;
});

// Teacher's assigned learners list
const teacherLearners = ref([]);
const learnerDropdownOpen = ref(false);

// Module creation wizard state
const isCreatingModule = ref(false);
const currentStepIndex = ref(0);
const step1ErrorMessage = ref('');
const step2ErrorMessage = ref('');
const step4ErrorMessage = ref('');

let questionUidCounter = 0;

function createBlankQuestion() {
  questionUidCounter += 1;
  return {
    uid: `q-${questionUidCounter}-${Date.now()}`,
    id: null,
    prompt: '',
    choices: [''],
    optionIds: [null],
    correctAnswer: null,
    correctFeedback: '',
    incorrectFeedback: '',
    savedCorrectFeedback: '',
    savedIncorrectFeedback: '',
    showFeedback: false,
    feedbackError: '',
    feedbackSavedMessage: '',
  };
}

function isFeedbackVisible(q) {
  return Boolean(q && q.showFeedback);
}

function toggleQuestionFeedback(q) {
  if (!q) return;
  q.feedbackError = '';
  q.feedbackSavedMessage = '';
  if (!isFeedbackVisible(q)) {
    if (q.savedCorrectFeedback !== undefined && !q.correctFeedback) {
      q.correctFeedback = q.savedCorrectFeedback;
    }
    if (q.savedIncorrectFeedback !== undefined && !q.incorrectFeedback) {
      q.incorrectFeedback = q.savedIncorrectFeedback;
    }
    q.showFeedback = true;
  } else {
    q.showFeedback = true;
  }
}

function saveQuestionFeedback(q) {
  if (!q || typeof q !== 'object') return false;
  q.feedbackError = '';
  q.feedbackSavedMessage = '';

  try {
    const correctTxt = String(q.correctFeedback ?? '').trim();
    const incorrectTxt = String(q.incorrectFeedback ?? '').trim();

    if (!correctTxt && !incorrectTxt) {
      q.feedbackError = 'Please enter Correct Answer Feedback or Incorrect Answer Feedback before saving.';
      q.showFeedback = true;
      return false;
    }

    q.correctFeedback = correctTxt;
    q.incorrectFeedback = incorrectTxt;
    q.savedCorrectFeedback = correctTxt;
    q.savedIncorrectFeedback = incorrectTxt;
    q.showFeedback = false;
    q.feedbackSavedMessage = 'Feedback saved.';

    setTimeout(() => {
      if (q && q.feedbackSavedMessage === 'Feedback saved.') {
        q.feedbackSavedMessage = '';
      }
    }, 4000);

    return true;
  } catch (err) {
    console.error('Failed to save question feedback:', err);
    q.feedbackError = 'Unable to save question feedback. Please try again.';
    q.showFeedback = true;
    return false;
  }
}

const wizardSteps = [
  { key: 'info', title: 'Module Information' },
  { key: 'preTest', title: 'Pre-Test' },
  { key: 'material', title: 'Learning Module' },
  { key: 'postTest', title: 'Post-Test' },
];

// Strands list for the module information dropdown
const internalStrands = [
  { slug: 'communication-skills-eng', name: 'Communication Skills (English)' },
  { slug: 'communication-skills-fil', name: 'Communication Skills (Filipino)' },
  { slug: 'scientific-literacy', name: 'Scientific & Critical Thinking Skills' },
  { slug: 'mathematical-skills', name: 'Mathematical & Problem Solving Skills' },
  { slug: 'life-career-skills', name: 'Life and Career Skills' },
  { slug: 'self-society', name: 'Understanding Self & Society' },
  { slug: 'digital-citizenship', name: 'Digital Citizenship' },
];

const STRAND_TO_CODE_MAP = {
  'Communication Skills (English)': 'LS1',
  'Communication Skills (Filipino)': 'LS1',
  'Scientific & Critical Thinking Skills': 'LS2',
  'Scientific Literacy': 'LS2',
  'Mathematical & Problem Solving Skills': 'LS3',
  'Mathematical and Problem Solving Skills': 'LS3',
  'Life and Career Skills': 'LS4',
  'Life & Career Skills': 'LS4',
  'Understanding Self & Society': 'LS5',
  'Understanding the Self and Society': 'LS5',
  'Digital Citizenship': 'LS6',
};

function resolveModuleCodeFromStrand(strandName) {
  if (!strandName) return '';
  if (STRAND_TO_CODE_MAP[strandName]) {
    return STRAND_TO_CODE_MAP[strandName];
  }
  const sLower = String(strandName).toLowerCase();
  if (sLower.includes('english') || sLower.includes('filipino') || sLower.includes('communication')) return 'LS1';
  if (sLower.includes('scientific') || sLower.includes('science')) return 'LS2';
  if (sLower.includes('mathematical') || sLower.includes('math') || sLower.includes('problem solving')) return 'LS3';
  if (sLower.includes('life') || sLower.includes('career')) return 'LS4';
  if (sLower.includes('self') || sLower.includes('society')) return 'LS5';
  if (sLower.includes('digital') || sLower.includes('citizenship')) return 'LS6';
  return '';
}

const DEFAULT_READING_INSTRUCTIONS = 'Read the module carefully and answer the activities on paper. Keep your written answers because you will upload them after completing the Post-Test.';

const newModule = reactive({
  title: '',
  strand: 'Communication Skills (English)',
  level: 'A&E Elementary',
  learningCenterId: '',
  code: 'LS1',
  dateStarted: '',
  dateEnded: '',
  instructions: '',
  description: '',
  isAllLearners: true,
  selectedLearnerIds: [],
  preTest: [createBlankQuestion()],
  uploadedFile: null,
  fileName: '',
  fileType: 'PDF',
  fileSize: '',
  learningNotes: DEFAULT_READING_INSTRUCTIONS,
  readingInstructions: DEFAULT_READING_INSTRUCTIONS,
  postTest: [createBlankQuestion()],
});

// Watch Learning Strand to automatically update Module Code
watch(
  () => newModule.strand,
  (newStrand) => {
    newModule.code = resolveModuleCodeFromStrand(newStrand);
  },
  { immediate: true }
);

// Available Learning Centers (combined teacher assigned centers and distinct centers from assigned learners)
const availableLearningCenters = computed(() => {
  const map = new Map();
  (assignedCenters.value || []).forEach((c) => {
    if (c.id && c.name && c.name !== '—') {
      map.set(Number(c.id), { id: Number(c.id), name: c.name });
    }
  });
  (teacherLearners.value || []).forEach((l) => {
    if (l.learningCenterId && l.learningCenter && l.learningCenter !== '—') {
      const idNum = Number(l.learningCenterId);
      if (!map.has(idNum)) {
        map.set(idNum, { id: idNum, name: l.learningCenter });
      }
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
});

// Selected learning center display name
const currentSelectedCenterName = computed(() => {
  if (!newModule.learningCenterId) return 'Selected Center';
  const c = availableLearningCenters.value.find((item) => Number(item.id) === Number(newModule.learningCenterId));
  return c ? c.name : 'Selected Center';
});

// Eligible learners filtered by Target ALS Level and selected Learning Center, authorized for the teacher
const eligibleLearners = computed(() => {
  const targetEnum = activeTargetLevel.value; // 'ELEMENTARY' or 'JUNIOR'
  if (!newModule.learningCenterId) return [];
  const selectedCenterId = Number(newModule.learningCenterId);

  return (teacherLearners.value || []).filter((l) => {
    // 1. Must be active
    const isActive = (l.status || 'Active').toLowerCase() === 'active';
    if (!isActive) return false;

    // 2. Level filter
    const lTarget = l.targetLevel || (String(l.level || '').toLowerCase().includes('elem') ? 'ELEMENTARY' : 'JUNIOR');
    if (lTarget !== targetEnum) {
      return false;
    }

    // 3. Learning Center filter
    if (l.learningCenterId) {
      if (Number(l.learningCenterId) !== selectedCenterId) {
        return false;
      }
    } else if (l.learningCenter && currentSelectedCenterName.value !== 'Selected Center') {
      if (l.learningCenter !== currentSelectedCenterName.value) {
        return false;
      }
    }

    return true;
  });
});

// Dropdown & multi-select state for Assign Module To
const isAssignDropdownOpen = ref(false);
const assignSearchQuery = ref('');
const assignDropdownTriggerRef = ref(null);
const assignDropdownMenuRef = ref(null);
const assignDropdownSearchInputRef = ref(null);
const assignDropdownPlacement = ref('down');
const assignDropdownStyle = ref({});

function updateAssignDropdownPosition() {
  if (!assignDropdownTriggerRef.value || !isAssignDropdownOpen.value) return;
  const rect = assignDropdownTriggerRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const spaceBelow = viewportHeight - rect.bottom - 12;
  const spaceAbove = rect.top - 12;

  const preferUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  assignDropdownPlacement.value = preferUp ? 'up' : 'down';

  const width = Math.min(rect.width, viewportWidth - 24);
  const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12));

  if (preferUp) {
    const maxHeight = Math.min(260, Math.max(120, spaceAbove));
    assignDropdownStyle.value = {
      position: 'fixed',
      bottom: `${viewportHeight - rect.top + 4}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 10050,
    };
  } else {
    const maxHeight = Math.min(260, Math.max(120, spaceBelow));
    assignDropdownStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 10050,
    };
  }
}

function openAssignDropdown() {
  if (eligibleLearners.value.length === 0) return;
  isAssignDropdownOpen.value = true;
  assignSearchQuery.value = '';
  nextTick(() => {
    updateAssignDropdownPosition();
    assignDropdownSearchInputRef.value?.focus();
  });
}

function closeAssignDropdown() {
  isAssignDropdownOpen.value = false;
  assignSearchQuery.value = '';
}

function toggleAssignDropdown() {
  if (isAssignDropdownOpen.value) {
    closeAssignDropdown();
  } else {
    openAssignDropdown();
  }
}

function handleGlobalDropdownScroll() {
  if (isAssignDropdownOpen.value) {
    if (!assignDropdownTriggerRef.value) {
      closeAssignDropdown();
      return;
    }
    const rect = assignDropdownTriggerRef.value.getBoundingClientRect();
    if (rect.bottom < 60 || rect.top > window.innerHeight - 60) {
      closeAssignDropdown();
    } else {
      updateAssignDropdownPosition();
    }
  }
}

function handleGlobalDropdownKeydown(e) {
  if (e.key === 'Escape' && isAssignDropdownOpen.value) {
    closeAssignDropdown();
    e.preventDefault();
    e.stopPropagation();
  }
}

// Search filter inside Assign Module To dropdown
const searchedEligibleLearners = computed(() => {
  const query = assignSearchQuery.value.trim().toLowerCase();
  if (!query) return eligibleLearners.value;
  return eligibleLearners.value.filter((l) =>
    (l.name || l.fullName || '').toLowerCase().includes(query)
  );
});

// Display text in the closed Assign Module To dropdown trigger
const assignDropdownDisplayText = computed(() => {
  const total = eligibleLearners.value.length;
  if (total === 0) return 'No learners available';
  if (newModule.isAllLearners) {
    return `All Learners (${total} ${total === 1 ? 'learner' : 'learners'})`;
  }
  const count = (newModule.selectedLearnerIds || []).length;
  if (count === 0) return 'Select learners...';
  return `${count} ${count === 1 ? 'Learner' : 'Learners'} Selected`;
});

const assignDropdownTooltipText = computed(() => {
  const total = eligibleLearners.value.length;
  if (total === 0) return 'No active learners available';
  if (newModule.isAllLearners) return `All Learners (${total} active)`;
  const count = (newModule.selectedLearnerIds || []).length;
  if (count === 0) return 'Select learners...';
  const selectedSet = new Set(newModule.selectedLearnerIds);
  return eligibleLearners.value
    .filter((l) => selectedSet.has(Number(l.id)))
    .map((l) => l.name)
    .join(', ');
});

function selectAllLearners() {
  const allIds = eligibleLearners.value.map((l) => Number(l.id));
  if (newModule.isAllLearners) {
    newModule.isAllLearners = false;
    newModule.selectedLearnerIds = [];
  } else {
    newModule.isAllLearners = true;
    newModule.selectedLearnerIds = [...allIds];
  }
}

function toggleLearner(learnerId) {
  const idNum = Number(learnerId);
  const allIds = eligibleLearners.value.map((l) => Number(l.id));

  if (newModule.isAllLearners) {
    // Was All Learners, now teacher deselects one learner
    newModule.isAllLearners = false;
    newModule.selectedLearnerIds = allIds.filter((id) => id !== idNum);
  } else {
    const idx = newModule.selectedLearnerIds.indexOf(idNum);
    if (idx === -1) {
      newModule.selectedLearnerIds.push(idNum);
    } else {
      newModule.selectedLearnerIds.splice(idx, 1);
    }

    // When every eligible learner is selected, All Learners should automatically become checked
    if (allIds.length > 0 && newModule.selectedLearnerIds.length >= allIds.length) {
      newModule.isAllLearners = true;
      newModule.selectedLearnerIds = [...allIds];
    }
  }
}

function isLearnerSelected(learnerId) {
  if (newModule.isAllLearners) {
    return true;
  }
  return (newModule.selectedLearnerIds || []).includes(Number(learnerId));
}

// Watch level and learning center changes to dynamically update selection
watch(
  () => [newModule.learningCenterId, newModule.level, activeTargetLevel.value],
  () => {
    const validIds = new Set(eligibleLearners.value.map((l) => Number(l.id)));
    if (!newModule.isAllLearners && Array.isArray(newModule.selectedLearnerIds)) {
      newModule.selectedLearnerIds = newModule.selectedLearnerIds.filter((id) => validIds.has(Number(id)));
      if (validIds.size > 0 && newModule.selectedLearnerIds.length === validIds.size) {
        newModule.isAllLearners = true;
      }
    } else if (newModule.isAllLearners) {
      newModule.selectedLearnerIds = Array.from(validIds);
    }
    if (isAssignDropdownOpen.value) {
      updateAssignDropdownPosition();
    }
  }
);

const dateRangeError = computed(() => {
  if (newModule.dateStarted && newModule.dateEnded) {
    if (new Date(newModule.dateEnded) < new Date(newModule.dateStarted)) {
      return 'Date Ended must not be earlier than Date Started.';
    }
  }
  return '';
});

const fileInputRef = ref(null);

function validateStep1() {
  step1ErrorMessage.value = '';
  if (!newModule.title || !newModule.title.trim()) {
    step1ErrorMessage.value = 'Module Title is required.';
    return false;
  }
  if (!newModule.strand) {
    step1ErrorMessage.value = 'Learning Strand is required.';
    return false;
  }
  if (!newModule.level) {
    step1ErrorMessage.value = 'ALS Level is required.';
    return false;
  }
  if (!newModule.learningCenterId) {
    step1ErrorMessage.value = 'Learning Center is required.';
    return false;
  }
  if (!newModule.code) {
    step1ErrorMessage.value = 'No valid Module Code is configured for the selected Learning Strand.';
    return false;
  }
  const expectedCode = resolveModuleCodeFromStrand(newModule.strand);
  if (expectedCode && newModule.code !== expectedCode) {
    step1ErrorMessage.value = `Module Code (${newModule.code}) does not match the selected Learning Strand (${expectedCode}).`;
    return false;
  }

  // Learner Selection Validation
  if (eligibleLearners.value.length === 0) {
    step1ErrorMessage.value = 'No eligible learners found for the selected Learning Center and ALS Level.';
    return false;
  }
  if (!newModule.isAllLearners && (!newModule.selectedLearnerIds || newModule.selectedLearnerIds.length === 0)) {
    step1ErrorMessage.value = 'Please select at least one learner before continuing.';
    return false;
  }

  if (!newModule.dateStarted) {
    step1ErrorMessage.value = 'Date Started is required.';
    return false;
  }
  if (!newModule.dateEnded) {
    step1ErrorMessage.value = 'Date Ended is required.';
    return false;
  }
  if (new Date(newModule.dateEnded) < new Date(newModule.dateStarted)) {
    step1ErrorMessage.value = 'Date Ended must not be earlier than Date Started.';
    return false;
  }
  return true;
}

function validateAssessmentQuestions(questionsArray, label) {
  if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
    return {
      valid: false,
      error: `Please add at least 1 question in ${label} before proceeding.`,
    };
  }

  for (let i = 0; i < questionsArray.length; i++) {
    const q = questionsArray[i] || {};
    const qNum = i + 1;
    const prompt = String(q.prompt || '').trim();
    if (!prompt) {
      return {
        valid: false,
        error: `${label} Question ${qNum}: Please enter the question text.`,
      };
    }

    const choices = Array.isArray(q.choices) ? q.choices : [];
    if (choices.length < 2) {
      return {
        valid: false,
        error: `${label} Question ${qNum}: Please provide at least 2 options.`,
      };
    }

    const seen = new Set();
    for (let j = 0; j < choices.length; j++) {
      const optText = String(choices[j] ?? '').trim();
      if (!optText) {
        return {
          valid: false,
          error: `${label} Question ${qNum}: Option ${j + 1} cannot be empty. Fill it in or remove it with the X button.`,
        };
      }
      const lower = optText.toLowerCase();
      if (seen.has(lower)) {
        return {
          valid: false,
          error: `${label} Question ${qNum}: Duplicate option "${optText}" is not allowed.`,
        };
      }
      seen.add(lower);
    }

    if (
      q.correctAnswer === null ||
      q.correctAnswer === undefined ||
      q.correctAnswer < 0 ||
      q.correctAnswer >= choices.length
    ) {
      return {
        valid: false,
        error: `${label} Question ${qNum}: Please select 1 correct answer by clicking the circle beside the option.`,
      };
    }
  }

  return { valid: true, error: '' };
}

// Fetch modules from database for the currently logged-in teacher and selected ALS Level
async function loadModules() {
  loading.value = true;
  modules.value = []; // Immediately clear previous list to ensure no stale data appears
  try {
    const tid = teacherId.value || currentTeacher.value?.id;
    const targetEnum = activeTargetLevel.value; // 'ELEMENTARY' or 'JUNIOR'
    const params = {
      targetLevel: targetEnum,
      level: targetEnum,
    };
    if (tid) params.teacherId = tid;
    const res = await getModules(params);
    if (Array.isArray(res.data)) {
      // Filter strictly by the actual stored ALS Level (m.targetLevel)
      modules.value = res.data.filter((m) => {
        if (m.id) {
          cacheModuleLevel(m.id, m.targetLevel || m.level || m.programLevel);
        }
        const modTarget = String(m.targetLevel || '').toUpperCase().trim();
        if (modTarget === 'ELEMENTARY' || modTarget === 'JUNIOR') {
          return modTarget === targetEnum;
        }
        const lvl = String(m.level || m.programLevel || '').toUpperCase();
        if (targetEnum === 'ELEMENTARY') {
          return lvl.includes('ELEM');
        } else {
          return lvl.includes('JUN') || lvl.includes('SEC');
        }
      });
    } else {
      modules.value = [];
    }
  } catch (err) {
    console.error('Error fetching modules:', err);
    modules.value = [];
  } finally {
    loading.value = false;
  }
}

// Fetch assigned learners for the currently logged-in teacher
async function loadTeacherLearners() {
  const tid = teacherId.value || currentTeacher.value?.id;
  if (!tid) return;
  try {
    const { data } = await getAssignedLearners({ teacherId: tid });
    teacherLearners.value = (data || []).map((l) => {
      const isElem =
        l.targetLevel === 'ELEMENTARY' ||
        l.rawLevel === 'ELEMENTARY' ||
        l.level === 'ELEMENTARY' ||
        String(l.level || '').toLowerCase().includes('elem');
      return {
        id: Number(l.id),
        name: l.name || l.fullName || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Learner',
        fullName: l.fullName || l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Learner',
        level: isElem ? 'A&E Elementary' : 'A&E Junior High',
        targetLevel: isElem ? 'ELEMENTARY' : 'JUNIOR',
        learningCenterId: l.learningCenterId ? Number(l.learningCenterId) : null,
        learningCenter: l.learningCenter || '',
        assignedTeacherId: l.assignedTeacherId ? Number(l.assignedTeacherId) : null,
        status: l.status || 'Active',
      };
    });
  } catch (err) {
    console.error('Failed to load teacher learners:', err);
    teacherLearners.value = [];
  }
}

function startModuleCreation() {
  resetWizard();
  // Set default center if available
  if (availableLearningCenters.value && availableLearningCenters.value.length > 0) {
    newModule.learningCenterId = availableLearningCenters.value[0].id;
  } else if (assignedCenters.value && assignedCenters.value.length > 0) {
    newModule.learningCenterId = assignedCenters.value[0].id;
  }
  // Automatically lock to the currently active ALS Level
  newModule.level = activeLevel.value;
  newModule.isAllLearners = true;
  newModule.selectedLearnerIds = eligibleLearners.value.map((l) => Number(l.id));
  isCreatingModule.value = true;
  currentStepIndex.value = 0;
  step1ErrorMessage.value = '';
  step2ErrorMessage.value = '';
  step4ErrorMessage.value = '';
}

function cancelModuleCreation() {
  isCreatingModule.value = false;
  isAssignDropdownOpen.value = false;
  step1ErrorMessage.value = '';
  step2ErrorMessage.value = '';
  step4ErrorMessage.value = '';
}

function nextStep() {
  if (currentStepIndex.value === 0) {
    if (!validateStep1()) {
      return;
    }
  } else if (currentStepIndex.value === 1) {
    step2ErrorMessage.value = '';
    const check = validateAssessmentQuestions(newModule.preTest, 'Pre-Test');
    if (!check.valid) {
      step2ErrorMessage.value = check.error;
      return;
    }
  }
  if (currentStepIndex.value < wizardSteps.length - 1) {
    currentStepIndex.value++;
  }
}

function prevStep() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
  } else {
    isCreatingModule.value = false;
    step1ErrorMessage.value = '';
    step2ErrorMessage.value = '';
    step4ErrorMessage.value = '';
  }
}

function addBlankQuestion(targetKey) {
  if (targetKey === 'preTest') step2ErrorMessage.value = '';
  if (targetKey === 'postTest') step4ErrorMessage.value = '';
  const blankQ = createBlankQuestion();
  newModule[targetKey].push(blankQ);
  const newIdx = newModule[targetKey].length - 1;
  nextTick(() => {
    const el = document.getElementById(`${targetKey}-q-card-${newIdx}`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

function removeQuestion(targetKey, index) {
  if (targetKey === 'preTest') step2ErrorMessage.value = '';
  if (targetKey === 'postTest') step4ErrorMessage.value = '';
  newModule[targetKey].splice(index, 1);
}

// Template refs map for autofocusing newly created option inputs
const optionInputRefs = new Map();

function setOptionInputRef(key, el) {
  if (el) {
    optionInputRefs.set(key, el);
  } else {
    optionInputRefs.delete(key);
  }
}

function addOptionToQuestion(q, targetKey) {
  if (targetKey === 'preTest') step2ErrorMessage.value = '';
  if (targetKey === 'postTest') step4ErrorMessage.value = '';
  if (!Array.isArray(q.choices)) {
    q.choices = [];
  }
  const newIdx = q.choices.length;
  q.choices.push('');
  if (Array.isArray(q.optionIds)) {
    q.optionIds.push(null);
  }

  if (!q.uid) {
    questionUidCounter += 1;
    q.uid = `q-${questionUidCounter}-${Date.now()}`;
  }
  const qKey = q.uid;
  const targetId = `option-input-${targetKey}-${qKey}-${newIdx}`;
  const refKey = `${targetKey}-${qKey}-${newIdx}`;

  nextTick(() => {
    const el = optionInputRefs.get(refKey) || document.getElementById(targetId);
    if (el && typeof el.focus === 'function') {
      el.focus();
      if (typeof el.setSelectionRange === 'function') {
        const len = (el.value || '').length;
        el.setSelectionRange(len, len);
      }
    }
  });
}

function removeOptionFromQuestion(q, cIdx, targetKey) {
  if (targetKey === 'preTest') step2ErrorMessage.value = '';
  if (targetKey === 'postTest') step4ErrorMessage.value = '';
  if (!Array.isArray(q.choices)) return;

  // If the deleted option was selected as the correct answer, clear the Answer Key
  if (q.correctAnswer === cIdx) {
    q.correctAnswer = null;
  } else if (q.correctAnswer !== null && q.correctAnswer !== undefined && q.correctAnswer > cIdx) {
    q.correctAnswer -= 1;
  }

  q.choices.splice(cIdx, 1);
  if (Array.isArray(q.optionIds)) {
    q.optionIds.splice(cIdx, 1);
  }
}

function selectCorrectAnswer(q, cIdx, targetKey) {
  if (targetKey === 'preTest') step2ErrorMessage.value = '';
  if (targetKey === 'postTest') step4ErrorMessage.value = '';
  q.correctAnswer = cIdx;
}

// --- DUPLICATE PRE-TEST TO POST-TEST ---
const showDuplicateConfirmModal = ref(false);

function isQuestionEmpty(q) {
  if (!q) return true;
  const hasPrompt = !!(q.prompt && String(q.prompt).trim());
  const hasChoices = Array.isArray(q.choices) && q.choices.some((c) => c && String(c).trim());
  const hasFeedback = !!(q.correctFeedback?.trim() || q.incorrectFeedback?.trim());
  return !hasPrompt && !hasChoices && !hasFeedback;
}

const hasValidPreTestQuestions = computed(() => {
  if (!Array.isArray(newModule.preTest) || newModule.preTest.length === 0) return false;
  return newModule.preTest.some((q) => !isQuestionEmpty(q));
});

function hasExistingPostTestQuestions() {
  if (!Array.isArray(newModule.postTest) || newModule.postTest.length === 0) {
    return false;
  }
  if (newModule.postTest.length > 1) {
    return true;
  }
  return !isQuestionEmpty(newModule.postTest[0]);
}

function duplicatePreTestQuestions() {
  if (!Array.isArray(newModule.preTest)) return;
  const sourceQuestions = newModule.preTest.filter((q) => !isQuestionEmpty(q));
  if (sourceQuestions.length === 0) return;

  const copied = sourceQuestions.map((q) => {
    questionUidCounter += 1;
    const choices = Array.isArray(q.choices) && q.choices.length > 0 ? [...q.choices] : [''];
    const cFb = q.correctFeedback ? String(q.correctFeedback) : '';
    const iFb = q.incorrectFeedback ? String(q.incorrectFeedback) : '';
    return {
      uid: `q-${questionUidCounter}-${Date.now()}`,
      id: null,
      prompt: q.prompt ? String(q.prompt) : '',
      choices: choices,
      optionIds: choices.map(() => null),
      correctAnswer: q.correctAnswer !== null && q.correctAnswer !== undefined ? q.correctAnswer : null,
      correctFeedback: cFb,
      incorrectFeedback: iFb,
      savedCorrectFeedback: cFb,
      savedIncorrectFeedback: iFb,
      showFeedback: false,
      feedbackError: '',
      feedbackSavedMessage: '',
    };
  });

  newModule.postTest = copied;
  step4ErrorMessage.value = '';
}

function handleDuplicateClick() {
  if (!hasValidPreTestQuestions.value) return;
  if (hasExistingPostTestQuestions()) {
    showDuplicateConfirmModal.value = true;
  } else {
    duplicatePreTestQuestions();
  }
}

function confirmDuplicate() {
  duplicatePreTestQuestions();
  showDuplicateConfirmModal.value = false;
}

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function handleFileInputChange(e) {
  const file = e.target.files?.[0];
  if (file) {
    processSelectedFile(file);
  }
}

function handleFileDrop(e) {
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    processSelectedFile(file);
  }
}

function processSelectedFile(file) {
  newModule.uploadedFile = file;
  newModule.fileName = file.name;
  newModule.fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
  if (['PNG', 'JPG', 'JPEG'].includes(ext)) {
    newModule.fileType = 'IMAGE';
  } else if (['DOC', 'DOCX'].includes(ext)) {
    newModule.fileType = 'DOCX';
  } else {
    newModule.fileType = 'PDF';
  }
}

function removeSelectedFile() {
  newModule.uploadedFile = null;
  newModule.fileName = '';
  newModule.fileSize = '';
  newModule.fileType = 'PDF';
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function resetWizard() {
  newModule.title = '';
  newModule.strand = 'Communication Skills (English)';
  newModule.level = activeLevel.value;
  newModule.learningCenterId = '';
  newModule.code = 'LS1';
  newModule.dateStarted = '';
  newModule.dateEnded = '';
  newModule.instructions = '';
  newModule.description = '';
  newModule.isAllLearners = true;
  newModule.selectedLearnerIds = [];
  newModule.preTest = [createBlankQuestion()];
  newModule.postTest = [createBlankQuestion()];
  newModule.uploadedFile = null;
  newModule.fileName = '';
  newModule.fileType = 'PDF';
  newModule.fileSize = '';
  newModule.learningNotes = DEFAULT_READING_INSTRUCTIONS;
  newModule.readingInstructions = DEFAULT_READING_INSTRUCTIONS;
  currentStepIndex.value = 0;
  step1ErrorMessage.value = '';
  step2ErrorMessage.value = '';
  step4ErrorMessage.value = '';
  isAssignDropdownOpen.value = false;
  assignSearchQuery.value = '';
}

async function publishCompleteModule() {
  if (!validateStep1()) {
    currentStepIndex.value = 0;
    return;
  }

  const preCheck = validateAssessmentQuestions(newModule.preTest, 'Pre-Test');
  if (!preCheck.valid) {
    step2ErrorMessage.value = preCheck.error;
    currentStepIndex.value = 1;
    return;
  }

  const postCheck = validateAssessmentQuestions(newModule.postTest, 'Post-Test');
  if (!postCheck.valid) {
    step4ErrorMessage.value = postCheck.error;
    currentStepIndex.value = 3;
    return;
  }

  isSubmitting.value = true;
  try {
    let uploadedFileUrl = null;

    // 1. Upload file if selected
    if (newModule.uploadedFile instanceof File) {
      const formData = new FormData();
      formData.append('file', newModule.uploadedFile);
      const uploadRes = await uploadModuleFile(formData);
      if (uploadRes.data?.fileUrl) {
        uploadedFileUrl = uploadRes.data.fileUrl;
      }
    }

    // 2. Prepare payload to save to database
    const payload = {
      title: newModule.title.trim(),
      code: newModule.code,
      moduleCode: newModule.code,
      dateStarted: newModule.dateStarted,
      dateEnded: newModule.dateEnded,
      instructions: newModule.instructions ? newModule.instructions.trim() : '',
      description: newModule.instructions ? newModule.instructions.trim() : (newModule.description ? newModule.description.trim() : ''),
      strand: newModule.strand,
      level: newModule.level,
      learningCenterId: newModule.learningCenterId || (assignedCenters.value[0] ? assignedCenters.value[0].id : null),
      isAllLearners: newModule.isAllLearners,
      assignedLearnerIds: newModule.isAllLearners ? [] : (newModule.selectedLearnerIds || []).map(Number),
      fileUrl: uploadedFileUrl,
      fileName: newModule.fileName || null,
      learningNotes: newModule.learningNotes ? newModule.learningNotes.trim() : '',
      readingInstructions: newModule.learningNotes ? newModule.learningNotes.trim() : '',
      preTest: newModule.preTest.map((q, idx) => ({
        questionText: q.prompt.trim(),
        options: q.choices.map((c, cIdx) => ({
          optionText: String(c ?? '').trim(),
          isCorrect: q.correctAnswer === cIdx,
        })),
        correctFeedback: q.correctFeedback ? q.correctFeedback.trim() : null,
        incorrectFeedback: q.incorrectFeedback ? q.incorrectFeedback.trim() : null,
        points: 1,
        sortOrder: idx + 1,
      })),
      postTest: newModule.postTest.map((q, idx) => ({
        questionText: q.prompt.trim(),
        options: q.choices.map((c, cIdx) => ({
          optionText: String(c ?? '').trim(),
          isCorrect: q.correctAnswer === cIdx,
        })),
        correctFeedback: q.correctFeedback ? q.correctFeedback.trim() : null,
        incorrectFeedback: q.incorrectFeedback ? q.incorrectFeedback.trim() : null,
        points: 1,
        sortOrder: idx + 1,
      })),
      status: 'PUBLISHED',
    };

    // 3. Save to database via API
    await createModule(payload);

    // 4. Close wizard, refresh learning feed, and alert
    resetWizard();
    isCreatingModule.value = false;
    await loadModules();
    alert('Module published successfully! It is now visible in the Learning Feed.');
  } catch (err) {
    console.error('Error creating module:', err);
    alert(err.response?.data?.error || 'Failed to save module. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
}

function formatDisplayDate(dateVal) {
  if (!dateVal) return 'Recent';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateVal);
  }
}

watch(teacherId, (newId) => {
  if (newId) {
    loadModules();
    loadTeacherLearners();
  }
});

// React immediately whenever route path changes (e.g. from /elementary to /junior-high)
watch(
  () => route.path,
  async (newPath, oldPath) => {
    if (newPath !== oldPath) {
      activeFilter.value = 'all';
      newModule.level = activeLevel.value;
      await loadModules();
      await loadTeacherLearners();
    }
  }
);

watch(
  () => activeTargetLevel.value,
  async (newTarget) => {
    if (newTarget) {
      activeFilter.value = 'all';
      setActiveModuleLevel(newTarget);
      newModule.level = activeLevel.value;
      await loadModules();
      await loadTeacherLearners();
    }
  }
);

onMounted(async () => {
  setActiveModuleLevel(activeTargetLevel.value);
  newModule.level = activeLevel.value;
  window.addEventListener('resize', updateAssignDropdownPosition);
  window.addEventListener('scroll', handleGlobalDropdownScroll, true);
  window.addEventListener('keydown', handleGlobalDropdownKeydown);
  await loadModules();
  await loadTeacherLearners();
  if (route.query.action === 'create') {
    startModuleCreation();
    router.replace({ path: route.path, query: {} });
  }
});

watch(
  () => route.query.action,
  (actionVal) => {
    if (actionVal === 'create') {
      startModuleCreation();
      router.replace({ path: route.path, query: {} });
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateAssignDropdownPosition);
  window.removeEventListener('scroll', handleGlobalDropdownScroll, true);
  window.removeEventListener('keydown', handleGlobalDropdownKeydown);
});
</script>

<style scoped>
.modules-page {
  width: 100%;
  max-width: 100%;
  padding-bottom: 3rem;
  box-sizing: border-box;
}

.page-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.page-title-group h1 {
  font-size: 1.625rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
  margin: 0 0 0.35rem;
}

.page-title-group p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.header-action-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-upload-module {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
}

.btn-upload-module:hover {
  background: #1d4ed8;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}

/* Learning Feed Container */
.learning-feed-container {
  width: 100%;
}

/* Module Upload Age Filter Row (Right-aligned directly below Upload Module button) */
.modules-filter-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: -0.25rem;
  margin-bottom: 1.25rem;
}

.modules-filter-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.module-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.module-filter-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.module-filter-btn.active {
  background: #2563eb;
  color: #ffffff;
}

.module-filter-btn .tab-count {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
}

.module-filter-btn.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.empty-filter-state {
  margin-top: 1rem;
  padding: 3rem 1.5rem;
}

@media (max-width: 640px) {
  .modules-filter-row {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
}

.feed-header-info {
  margin-bottom: 1rem;
}

.feed-count-text {
  font-size: 0.85rem;
  color: #64748b;
}

.feed-count-text strong {
  color: #0f172a;
}

.learning-feed-list {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.feed-card-item {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.5rem 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.35rem;
  transition: all 0.18s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
}

.feed-card-item:hover {
  border-color: #93c5fd;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.08);
}

.feed-card-item.is-clickable {
  cursor: pointer;
}

.feed-card-item.is-clickable:hover {
  border-color: #3b82f6;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
  transform: translateY(-2px);
}

.feed-icon-box {
  width: 52px;
  height: 52px;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed-info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.feed-badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  flex-wrap: wrap;
}

.feed-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #15803d;
  background: #dcfce7;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
}

.feed-strand-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e40af;
  background: #eff6ff;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}

.feed-level-pill {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.feed-card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.35rem 0;
  line-height: 1.35;
}

.feed-card-desc {
  font-size: 0.875rem;
  color: #475569;
  margin: 0 0 0.65rem 0;
  line-height: 1.45;
}

.feed-meta-bottom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #64748b;
  flex-wrap: wrap;
}

.feed-author-name {
  font-weight: 600;
  color: #334155;
}

.meta-dot {
  color: #cbd5e1;
}

.feed-date-text {
  color: #64748b;
}

.feed-clc-text {
  color: #0369a1;
  font-weight: 500;
}

.feed-card-actions {
  flex-shrink: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-view-material {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.5rem 0.85rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  transition: all 0.15s ease;
  height: 36px;
  box-sizing: border-box;
}

.btn-view-material:hover {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1d4ed8;
}

.btn-module-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  box-shadow: none;
  color: #64748b;
  cursor: pointer;
  padding: 0 6px;
  min-width: 28px;
  height: 36px;
  transition: color 0.15s ease;
  box-sizing: border-box;
}

.btn-module-chevron:hover {
  background: transparent;
  color: #2563eb;
}

.btn-module-chevron:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Creation Wizard Card */
.creation-wizard-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.wizard-stepper-header {
  display: flex;
  align-items: center;
  background: #f8fafc;
  padding: 1.25rem 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.wizard-step-node {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.step-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-weight: 700;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.wizard-step-node.active .step-badge {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
}

.wizard-step-node.completed .step-badge {
  background: #16a34a;
  color: #ffffff;
}

.step-text {
  display: flex;
  flex-direction: column;
}

.step-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.04em;
}

.step-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.wizard-step-node.active .step-title {
  color: #0f172a;
  font-weight: 700;
}

.step-divider {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0 1rem;
}

.wizard-step-node.completed .step-divider {
  background: #86efac;
}

.wizard-body-content {
  padding: 2.25rem;
}

.pane-header-info {
  margin-bottom: 1.75rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
}

.pane-header-info h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.35rem 0;
}

.pane-header-info p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.pane-header-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}

.pane-header-title-bar h3 {
  margin: 0;
}

.btn-duplicate-pretest {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  background-color: #ffffff;
  border: 1.5px solid #2563eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  line-height: 1.25;
}

.btn-duplicate-pretest:hover:not(:disabled) {
  background-color: #eff6ff;
  border-color: #1d4ed8;
  color: #1d4ed8;
}

.btn-duplicate-pretest:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #cbd5e1;
  color: #94a3b8;
  background-color: #f8fafc;
}

/* Modal: Duplicate Questions Confirmation */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.duplicate-confirm-modal {
  max-width: 480px;
  width: 90%;
  padding: 1.6rem;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.dup-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.dup-modal-icon-circle {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dup-modal-title-group {
  flex: 1;
}

.dup-modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.45rem 0;
}

.dup-modal-desc {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

.dup-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-dup-cancel {
  padding: 0.55rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.btn-dup-cancel:hover {
  background-color: #e2e8f0;
  color: #1e293b;
}

.btn-dup-confirm {
  padding: 0.55rem 1.15rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.btn-dup-confirm:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.35rem;
}

@media (max-width: 640px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-item.full-width {
  grid-column: 1 / -1;
}

.field-lbl {
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
}

.req {
  color: #ef4444;
}

.field-input-box,
.field-select-box,
.field-textarea-box {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.field-input-box,
.field-select-box {
  height: 42px;
  min-height: 42px;
}

.field-input-box:focus,
.field-select-box:focus,
.field-textarea-box:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.field-input-box.is-locked,
.field-select-box.is-locked {
  background-color: #f8fafc;
  color: #334155;
  cursor: not-allowed;
  font-weight: 600;
  border-color: #cbd5e1;
}

.locked-level-box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.locked-level-badge {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

.form-error-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 1.25rem;
}

.form-error-banner svg {
  flex-shrink: 0;
  color: #dc2626;
}

.field-error-text {
  font-size: 0.75rem;
  color: #ef4444;
  font-weight: 600;
  margin-top: 0.25rem;
}

.feed-code-tag {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0369a1;
  background: #e0f2fe;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}

.feed-duration-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}

/* Simplified Google Forms-Inspired Question Builder */
.gf-questions-container {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  margin-bottom: 1.25rem;
}

.gf-question-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem 1.35rem 1rem 1.35rem;
  box-sizing: border-box;
}

.gf-question-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.gf-question-number {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  min-width: 1.35rem;
  flex-shrink: 0;
}

.gf-question-input {
  flex: 1;
  width: 100%;
  padding: 0.65rem 0.85rem;
  font-size: 0.925rem;
  font-weight: 500;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  box-sizing: border-box;
}

.gf-question-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.gf-question-input:focus {
  background: #ffffff;
  border-color: #64748b;
}

.gf-answer-key-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.85rem;
  margin-bottom: 0.85rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #334155;
  font-weight: 600;
}

.gf-ak-banner-text {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.gf-ak-banner-text svg {
  color: #16a34a;
  flex-shrink: 0;
}

.gf-ak-done-btn {
  padding: 0.35rem 0.85rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

.gf-options-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

.gf-option-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.2rem 0.25rem;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.gf-option-row.is-correct-choice {
  background: #eff6ff;
}

.gf-option-radio {
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
  accent-color: #2563eb;
  flex-shrink: 0;
}

.gf-option-input {
  flex: 1;
  width: 100%;
  padding: 0.55rem 0.75rem;
  font-size: 0.875rem;
  color: #1e293b;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
}

.gf-option-input::placeholder {
  color: #94a3b8;
}

.gf-option-input:focus {
  border-color: #64748b;
}

.gf-option-row.is-correct-choice .gf-option-input {
  border-color: #93c5fd;
  background: #ffffff;
}

.gf-correct-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.725rem;
  font-weight: 700;
  flex-shrink: 0;
  white-space: nowrap;
}

.gf-remove-option-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.gf-remove-option-btn:hover {
  background: #fef2f2;
  color: #dc2626;
}

.gf-add-option-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.15rem 0.25rem 0.65rem 0.25rem;
}

.gf-radio-deco {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  flex-shrink: 0;
  box-sizing: border-box;
}

.gf-add-option-btn {
  padding: 0.3rem 0.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.gf-add-option-btn:hover {
  background: #f1f5f9;
  color: #1d4ed8;
}

/* Inline Feedback Container */
.gf-inline-feedback-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.gf-inline-feedback-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.1rem;
}

.gf-inline-feedback-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.gf-feedback-save-btn {
  padding: 0.28rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  background: #2563eb;
  border: 1px solid #2563eb;
  cursor: pointer;
  border-radius: 6px;
  font-family: inherit;
  line-height: 1.2;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.gf-feedback-save-btn:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.gf-feedback-error-msg {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.65rem;
  border-radius: 6px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.76rem;
  font-weight: 600;
}

.gf-feedback-saved-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: #15803d;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.gf-feedback-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.gf-feedback-field-header {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.gf-feedback-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1e293b;
}

.gf-feedback-icon.correct {
  color: #16a34a;
}

.gf-feedback-icon.incorrect {
  color: #dc2626;
}

.gf-feedback-helper-text {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.35;
}

.gf-feedback-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-family: inherit;
  color: #1e293b;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  resize: vertical;
  min-height: 52px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.gf-feedback-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.gf-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.85rem;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.gf-footer-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.gf-add-feedback-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.75rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.gf-add-feedback-btn:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.gf-add-feedback-btn.has-feedback,
.gf-add-feedback-btn.is-open {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.gf-footer-right {
  display: flex;
  align-items: center;
}

.gf-delete-q-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.7rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #dc2626;
  cursor: pointer;
  font-family: inherit;
}

.gf-delete-q-btn svg {
  color: #dc2626;
}

.gf-delete-q-btn:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.gf-questions-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  flex-wrap: wrap;
}

.gf-btn-add-question {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1.15rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.15s ease;
}

.gf-btn-add-question:hover {
  background: #1d4ed8;
}

.gf-total-questions {
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

.gf-total-questions strong {
  color: #0f172a;
  font-weight: 700;
}

@media (max-width: 640px) {
  .gf-question-card {
    padding: 1rem 0.95rem 0.85rem 0.95rem;
  }

  .gf-question-row {
    align-items: flex-start;
  }

  .gf-question-number {
    padding-top: 0.55rem;
  }

  .gf-card-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .gf-footer-right {
    justify-content: flex-end;
  }

  .gf-questions-bottom-bar {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
}

/* Dropzone Box for File Upload */
.dropzone-box {
  width: 100%;
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  padding: 3rem 2rem;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.dropzone-box:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.dropzone-box.has-file {
  border-style: solid;
  border-color: #93c5fd;
  background: #f0f9ff;
  padding: 1.75rem 2rem;
  cursor: default;
}

.upload-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
}

.dropzone-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.35rem 0;
}

.dropzone-types {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.file-attached-preview {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  text-align: left;
}

.file-meta-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.file-meta-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-meta-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  word-break: break-all;
}

.file-meta-size {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.15rem;
}

.file-meta-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.btn-replace-file {
  padding: 0.45rem 0.85rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-replace-file:hover {
  background: #eff6ff;
  border-color: #2563eb;
}

.btn-remove-file {
  padding: 0.45rem 0.85rem;
  background: #ffffff;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-remove-file:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

/* Wizard Navigation Footer */
.wizard-footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2.25rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.wizard-right-btns {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-publish-success {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #16a34a;
  color: #ffffff;
  border: none;
  padding: 0.65rem 1.35rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(22, 163, 74, 0.2);
}

.btn-publish-success:hover:not(:disabled) {
  background: #15803d;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.btn-publish-success:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Loading & Empty States */
.state-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  box-sizing: border-box;
}

.state-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  margin-bottom: 1rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.state-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.35rem;
}

.empty-graphic-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.35rem;
}

.empty-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  max-width: 440px;
}

/* Read-only Module Code Box */
.field-input-box.is-readonly {
  background-color: #f8fafc;
  color: #1e293b;
  cursor: default;
  font-weight: 600;
  border-color: #cbd5e1;
}

/* Assign Module To Multi-select Dropdown */
.assign-module-dropdown-group {
  position: relative;
}

.custom-dropdown-trigger {
  width: 100%;
  height: 42px;
  min-height: 42px;
  padding: 0 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.custom-dropdown-trigger:hover:not(.is-disabled) {
  border-color: #94a3b8;
}

.custom-dropdown-trigger:focus,
.custom-dropdown-trigger.is-open {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: none;
}

.custom-dropdown-trigger.is-disabled {
  background: #f8fafc;
  cursor: not-allowed;
  opacity: 0.75;
}

.custom-dropdown-trigger.has-error {
  border-color: #ef4444;
}

.custom-dropdown-trigger.has-error:focus,
.custom-dropdown-trigger.has-error.is-open {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

.dropdown-trigger-text {
  font-size: 0.875rem;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 0.5rem;
  line-height: 1.2;
}

.dropdown-chevron {
  color: #64748b;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.dropdown-chevron.is-rotated {
  transform: rotate(180deg);
}

.assign-dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10040;
  background: transparent;
}

.custom-dropdown-menu {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.custom-dropdown-menu.placement-down {
  transform-origin: top center;
  animation: dropdownFadeDown 0.15s ease-out;
}

.custom-dropdown-menu.placement-up {
  transform-origin: bottom center;
  animation: dropdownFadeUp 0.15s ease-out;
}

@keyframes dropdownFadeDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dropdownFadeUp {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.dropdown-search-wrap svg {
  color: #94a3b8;
  flex-shrink: 0;
}

.dropdown-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  color: #0f172a;
  width: 100%;
  font-family: inherit;
  padding: 0;
}

.dropdown-search-clear {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 0.25rem;
}

.dropdown-search-clear:hover {
  color: #475569;
}

.dropdown-options-list {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0.35rem 0;
}

.dropdown-option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  cursor: pointer;
  transition: background 0.12s ease;
  user-select: none;
}

.dropdown-option-item:hover {
  background: #f1f5f9;
}

.dropdown-option-item.is-selected {
  background: #eff6ff;
}

.all-learners-item {
  font-weight: 600;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.custom-checkbox.is-checked {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.option-name {
  font-size: 0.875rem;
  color: #1e293b;
  flex: 1;
  word-break: break-word;
}

.option-badge {
  font-size: 0.75rem;
  color: #64748b;
  background: #e2e8f0;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-weight: 500;
  flex-shrink: 0;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.25rem 0;
}

.dropdown-empty {
  padding: 1.25rem 0.85rem;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.field-helper-text {
  font-size: 0.8rem;
  color: #64748b;
  margin: -0.15rem 0 0.45rem 0;
  line-height: 1.4;
}

.field-helper-warning {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.775rem;
  color: #d97706;
  margin-top: 0.35rem;
}

.field-helper-warning svg {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .feed-card-item {
    padding: 1.15rem 1.25rem;
    gap: 1.15rem;
  }
}

@media (max-width: 580px) {
  .feed-card-item {
    align-items: flex-start;
  }
  .feed-card-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

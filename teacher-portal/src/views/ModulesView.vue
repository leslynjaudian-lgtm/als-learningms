<template>
  <div class="page-container modules-page">
    <!-- Page Header with Upper-Right Action Button -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Modules</h1>
        <p>View and manage learning modules for <strong>{{ activeLevel }}</strong>.</p>
      </div>

      <div class="header-action-group">
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
      </div>
    </div>

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
        <div class="feed-header-info">
          <span class="feed-count-text">Showing <strong>{{ modules.length }}</strong> published {{ modules.length === 1 ? 'module' : 'modules' }} ({{ activeLevel }})</span>
        </div>

        <div class="learning-feed-list">
          <div
            v-for="item in modules"
            :key="item.id"
            class="feed-card-item is-clickable"
            @click="openModuleDetails(item.id)"
          >
            <!-- Module Icon -->
            <div class="feed-icon-box">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>

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
            <p>Define the title, learning strand, target ALS level, assigned learning center, and active schedule.</p>
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

            <!-- ROW 3 — TWO COLUMNS: Target ALS Level * | Learning Strand * -->
            <div class="field-item">
              <label class="field-lbl">Target ALS Level <span class="req">*</span></label>
              <div class="locked-level-box">
                <input
                  type="text"
                  :value="activeLevel"
                  class="field-input-box is-locked"
                  readonly
                  disabled
                />
                <span class="locked-level-badge">Locked to {{ activeLevel }}</span>
              </div>
            </div>

            <div class="field-item">
              <label class="field-lbl">Learning Strand <span class="req">*</span></label>
              <select v-model="newModule.strand" class="field-select-box" required>
                <option value="" disabled>Select Learning Strand</option>
                <option v-for="s in internalStrands" :key="s.slug" :value="s.name">
                  {{ s.name }}
                </option>
              </select>
            </div>

            <!-- ROW 4 — TWO COLUMNS: Learning Center * | Module Code * -->
            <div class="field-item">
              <label class="field-lbl">Learning Center <span class="req">*</span></label>
              <select v-model="newModule.learningCenterId" class="field-select-box" required>
                <option value="" disabled>Select Assigned Learning Center</option>
                <option v-for="c in availableLearningCenters" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>

            <div class="field-item">
              <label class="field-lbl">Module Code <span class="req">*</span></label>
              <input
                type="text"
                :value="newModule.code"
                class="field-input-box is-readonly"
                placeholder="Auto-populated based on Learning Strand"
                readonly
                disabled
              />
            </div>

            <!-- ROW — FULL WIDTH: Learner Assignment Section -->
            <div class="field-item full-width learner-assignment-section">
              <label class="field-lbl">Assign Module To <span class="req">*</span></label>
              
              <div class="assignment-radio-group">
                <!-- Option 1: All Learners -->
                <label class="assignment-radio-card" :class="{ 'is-selected': newModule.isAllLearners }">
                  <input
                    type="radio"
                    name="moduleAssignMode"
                    :value="true"
                    v-model="newModule.isAllLearners"
                    class="custom-radio"
                    @change="onAssignmentModeChange(true)"
                  />
                  <div class="radio-label-group">
                    <span class="radio-title">All Learners</span>
                    <span class="radio-desc">Assign the module to all eligible learners under the selected Learning Center and ALS Level.</span>
                  </div>
                </label>

                <!-- Option 2: Specific Learners -->
                <label class="assignment-radio-card" :class="{ 'is-selected': !newModule.isAllLearners }">
                  <input
                    type="radio"
                    name="moduleAssignMode"
                    :value="false"
                    v-model="newModule.isAllLearners"
                    class="custom-radio"
                    @change="onAssignmentModeChange(false)"
                  />
                  <div class="radio-label-group">
                    <span class="radio-title">Specific Learners</span>
                    <span class="radio-desc">Allow the teacher to select individual learners who will receive the module.</span>
                  </div>
                </label>
              </div>

              <!-- When All Learners is selected -->
              <div v-if="newModule.isAllLearners" class="all-learners-summary-card">
                <div v-if="eligibleLearners.length > 0" class="learners-count-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span><strong>{{ eligibleLearners.length }}</strong> {{ eligibleLearners.length === 1 ? 'learner' : 'learners' }} will receive this module.</span>
                </div>
                <div v-else class="empty-eligible-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>No eligible {{ activeLevel }} learners found for {{ currentSelectedCenterName }}.</span>
                </div>
              </div>

              <!-- When Specific Learners is selected -->
              <div v-else class="specific-learners-section">
                <label class="field-sub-lbl">Select Learners <span class="req">*</span></label>
                
                <div class="specific-learners-container">
                  <!-- Search box -->
                  <div class="learner-search-wrapper">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      v-model="learnerSearchQuery"
                      type="text"
                      class="field-input-box learner-search-input"
                      placeholder="Search learner name..."
                    />
                    <button
                      v-if="learnerSearchQuery"
                      type="button"
                      class="clear-search-btn"
                      @click="learnerSearchQuery = ''"
                      aria-label="Clear search"
                    >
                      &times;
                    </button>
                  </div>

                  <!-- Selected Learners Chips (for quick removal) -->
                  <div v-if="selectedLearnersList.length > 0" class="selected-chips-row">
                    <div
                      v-for="l in selectedLearnersList"
                      :key="l.id"
                      class="selected-learner-chip"
                    >
                      <span class="chip-name">{{ l.name }}</span>
                      <button
                        type="button"
                        class="chip-close-btn"
                        @click="toggleLearner(l.id)"
                        :title="`Remove ${l.name}`"
                      >
                        &times;
                      </button>
                    </div>
                  </div>

                  <!-- Multi-select list -->
                  <div v-if="filteredSpecificLearners.length > 0" class="learners-multi-list">
                    <label
                      v-for="l in filteredSpecificLearners"
                      :key="l.id"
                      class="learner-check-row"
                      :class="{ 'is-checked': newModule.selectedLearnerIds.includes(l.id) }"
                    >
                      <input
                        type="checkbox"
                        class="learner-checkbox"
                        :checked="newModule.selectedLearnerIds.includes(l.id)"
                        @change="toggleLearner(l.id)"
                      />
                      <div class="learner-row-text">
                        <span class="learner-row-name">{{ l.name }}</span>
                        <span class="learner-row-sub">{{ l.level }} &bull; {{ l.learningCenter }}</span>
                      </div>
                    </label>
                  </div>

                  <!-- Empty State -->
                  <div v-else-if="eligibleLearners.length === 0" class="no-learners-box">
                    <span>No eligible {{ activeLevel }} learners found for {{ currentSelectedCenterName }}.</span>
                  </div>
                  <div v-else class="no-learners-box">
                    <span>No learners match "{{ learnerSearchQuery }}".</span>
                  </div>

                  <!-- Selection Count Footer -->
                  <div class="selection-count-footer">
                    <span>{{ newModule.selectedLearnerIds.length }} {{ newModule.selectedLearnerIds.length === 1 ? 'learner' : 'learners' }} selected</span>
                  </div>
                </div>
              </div>
            </div>

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

            <!-- ROW 6 — FULL WIDTH: Activities Related -->
            <div class="field-item full-width">
              <label class="field-lbl">Activities Related</label>
              <textarea
                v-model="newModule.activitiesRelated"
                rows="3"
                class="field-textarea-box"
                placeholder="Describe the activities related to this module..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- STEP 2: PRE-TEST (Assessment) -->
        <div v-else-if="currentStepIndex === 1" class="step-form-pane">
          <div class="pane-header-info">
            <h3>Step 2: Pre-Test (Assessment)</h3>
            <p>Add multiple choice questions to assess learners' prior knowledge before the module.</p>
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

              <!-- Answer Key Selection Banner (when Answer Key is toggled active) -->
              <div v-if="q.answerKeyMode" class="gf-answer-key-banner">
                <div class="gf-ak-banner-text">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  <span>Select the correct option below using the radio button:</span>
                </div>
                <button
                  type="button"
                  class="gf-ak-done-btn"
                  @click="q.answerKeyMode = false"
                >
                  Done
                </button>
              </div>

              <!-- Vertical Multiple-Choice Options List -->
              <div class="gf-options-list">
                <div
                  v-for="(choice, cIdx) in q.choices"
                  :key="cIdx"
                  class="gf-option-row"
                  :class="{
                    'is-correct-choice': q.correctAnswer === cIdx,
                    'is-ak-mode': q.answerKeyMode
                  }"
                >
                  <input
                    type="radio"
                    class="gf-option-radio"
                    :name="`pretest-correct-${q.uid || qIdx}`"
                    :value="cIdx"
                    :checked="q.correctAnswer === cIdx"
                    title="Select as correct answer"
                    @change="selectCorrectAnswer(q, cIdx, 'preTest')"
                  />
                  <input
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

              <!-- Saved Feedback Summary (if feedback has been added) -->
              <div
                v-if="q.correctFeedback?.trim() || q.incorrectFeedback?.trim()"
                class="gf-saved-feedback-box"
              >
                <div v-if="q.incorrectFeedback?.trim()" class="gf-saved-feedback-item is-incorrect">
                  <span class="gf-saved-feedback-label">Feedback for incorrect answers:</span>
                  <span class="gf-saved-feedback-text">{{ q.incorrectFeedback }}</span>
                </div>
                <div v-if="q.correctFeedback?.trim()" class="gf-saved-feedback-item is-correct">
                  <span class="gf-saved-feedback-label">Feedback for correct answers:</span>
                  <span class="gf-saved-feedback-text">{{ q.correctFeedback }}</span>
                </div>
              </div>

              <!-- Question Card Footer: Answer Key, Add feedback answer & Delete -->
              <div class="gf-card-footer">
                <div class="gf-footer-left">
                  <button
                    type="button"
                    class="gf-answer-key-btn"
                    :class="{
                      'is-active': q.answerKeyMode,
                      'has-selected': q.correctAnswer !== null && q.correctAnswer !== undefined && q.choices[q.correctAnswer] !== undefined
                    }"
                    @click="toggleAnswerKeyMode(q)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <span>Answer Key</span>
                  </button>

                  <button
                    type="button"
                    class="gf-add-feedback-btn"
                    :class="{ 'has-feedback': q.correctFeedback?.trim() || q.incorrectFeedback?.trim() }"
                    @click="openFeedbackModal('preTest', qIdx)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Add feedback answer</span>
                  </button>

                  <span
                    v-if="q.correctAnswer !== null && q.correctAnswer !== undefined && q.choices[q.correctAnswer]?.trim()"
                    class="gf-ak-status is-set"
                  >
                    Correct: {{ q.choices[q.correctAnswer] }}
                  </span>
                  <span
                    v-else-if="q.correctAnswer !== null && q.correctAnswer !== undefined && q.choices[q.correctAnswer] !== undefined"
                    class="gf-ak-status is-set"
                  >
                    Option {{ q.correctAnswer + 1 }} selected
                  </span>
                  <span v-else class="gf-ak-status is-empty">
                    Select correct answer
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

          <!-- Bottom Bar: + Add Question & Total Questions -->
          <div class="gf-questions-bottom-bar">
            <button
              type="button"
              class="gf-btn-add-question"
              @click="addBlankQuestion('preTest')"
            >
              + Add Question
            </button>
            <div class="gf-total-questions">
              Total Questions: <strong>{{ newModule.preTest.length }}</strong>
            </div>
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
            <label class="field-lbl">Teacher Facilitator Notes / Reading Instructions</label>
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
            <h3>Step 4: Post-Test</h3>
            <p>Add multiple choice questions to assess what learners have learned after completing the module.</p>
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

              <!-- Answer Key Selection Banner (when Answer Key is toggled active) -->
              <div v-if="q.answerKeyMode" class="gf-answer-key-banner">
                <div class="gf-ak-banner-text">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  <span>Select the correct option below using the radio button:</span>
                </div>
                <button
                  type="button"
                  class="gf-ak-done-btn"
                  @click="q.answerKeyMode = false"
                >
                  Done
                </button>
              </div>

              <!-- Vertical Multiple-Choice Options List -->
              <div class="gf-options-list">
                <div
                  v-for="(choice, cIdx) in q.choices"
                  :key="cIdx"
                  class="gf-option-row"
                  :class="{
                    'is-correct-choice': q.correctAnswer === cIdx,
                    'is-ak-mode': q.answerKeyMode
                  }"
                >
                  <input
                    type="radio"
                    class="gf-option-radio"
                    :name="`posttest-correct-${q.uid || qIdx}`"
                    :value="cIdx"
                    :checked="q.correctAnswer === cIdx"
                    title="Select as correct answer"
                    @change="selectCorrectAnswer(q, cIdx, 'postTest')"
                  />
                  <input
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

              <!-- Saved Feedback Summary (if feedback has been added) -->
              <div
                v-if="q.correctFeedback?.trim() || q.incorrectFeedback?.trim()"
                class="gf-saved-feedback-box"
              >
                <div v-if="q.incorrectFeedback?.trim()" class="gf-saved-feedback-item is-incorrect">
                  <span class="gf-saved-feedback-label">Feedback for incorrect answers:</span>
                  <span class="gf-saved-feedback-text">{{ q.incorrectFeedback }}</span>
                </div>
                <div v-if="q.correctFeedback?.trim()" class="gf-saved-feedback-item is-correct">
                  <span class="gf-saved-feedback-label">Feedback for correct answers:</span>
                  <span class="gf-saved-feedback-text">{{ q.correctFeedback }}</span>
                </div>
              </div>

              <!-- Question Card Footer: Answer Key, Add feedback answer & Delete -->
              <div class="gf-card-footer">
                <div class="gf-footer-left">
                  <button
                    type="button"
                    class="gf-answer-key-btn"
                    :class="{
                      'is-active': q.answerKeyMode,
                      'has-selected': q.correctAnswer !== null && q.correctAnswer !== undefined && q.choices[q.correctAnswer] !== undefined
                    }"
                    @click="toggleAnswerKeyMode(q)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <span>Answer Key</span>
                  </button>

                  <button
                    type="button"
                    class="gf-add-feedback-btn"
                    :class="{ 'has-feedback': q.correctFeedback?.trim() || q.incorrectFeedback?.trim() }"
                    @click="openFeedbackModal('postTest', qIdx)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Add feedback answer</span>
                  </button>

                  <span
                    v-if="q.correctAnswer !== null && q.correctAnswer !== undefined && q.choices[q.correctAnswer]?.trim()"
                    class="gf-ak-status is-set"
                  >
                    Correct: {{ q.choices[q.correctAnswer] }}
                  </span>
                  <span
                    v-else-if="q.correctAnswer !== null && q.correctAnswer !== undefined && q.choices[q.correctAnswer] !== undefined"
                    class="gf-ak-status is-set"
                  >
                    Option {{ q.correctAnswer + 1 }} selected
                  </span>
                  <span v-else class="gf-ak-status is-empty">
                    Select correct answer
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

          <!-- Bottom Bar: + Add Question & Total Questions -->
          <div class="gf-questions-bottom-bar">
            <button
              type="button"
              class="gf-btn-add-question"
              @click="addBlankQuestion('postTest')"
            >
              + Add Question
            </button>
            <div class="gf-total-questions">
              Total Questions: <strong>{{ newModule.postTest.length }}</strong>
            </div>
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

    <!-- ADD FEEDBACK MODAL -->
    <div
      v-if="feedbackModal.open"
      class="gf-feedback-modal-backdrop"
      @click.self="closeFeedbackModal"
    >
      <div class="gf-feedback-modal-card" role="dialog" aria-modal="true" aria-labelledby="gf-feedback-modal-title">
        <!-- Modal Header -->
        <div class="gf-feedback-modal-header">
          <h3 id="gf-feedback-modal-title" class="gf-feedback-modal-title">Add feedback</h3>
          <button
            type="button"
            class="gf-feedback-modal-close"
            title="Close"
            aria-label="Close"
            @click="closeFeedbackModal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Modal Tabs: Incorrect answers | Correct answers -->
        <div class="gf-feedback-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            class="gf-feedback-tab-btn"
            :class="{ 'is-active': feedbackModal.activeTab === 'incorrect' }"
            :aria-selected="feedbackModal.activeTab === 'incorrect'"
            @click="feedbackModal.activeTab = 'incorrect'"
          >
            Incorrect answers
          </button>
          <button
            type="button"
            role="tab"
            class="gf-feedback-tab-btn"
            :class="{ 'is-active': feedbackModal.activeTab === 'correct' }"
            :aria-selected="feedbackModal.activeTab === 'correct'"
            @click="feedbackModal.activeTab = 'correct'"
          >
            Correct answers
          </button>
        </div>

        <!-- Modal Body: Separate Multiline Textarea per Tab -->
        <div class="gf-feedback-modal-body">
          <textarea
            v-if="feedbackModal.activeTab === 'incorrect'"
            v-model="feedbackModal.incorrectFeedback"
            rows="4"
            class="gf-feedback-textarea"
            placeholder="Enter feedback here..."
          ></textarea>
          <textarea
            v-else
            v-model="feedbackModal.correctFeedback"
            rows="4"
            class="gf-feedback-textarea"
            placeholder="Enter feedback here..."
          ></textarea>
        </div>

        <!-- Modal Footer: Cancel & Save -->
        <div class="gf-feedback-modal-footer">
          <button
            type="button"
            class="gf-feedback-cancel-btn"
            @click="closeFeedbackModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="gf-feedback-save-btn"
            @click="saveFeedbackModal"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getModules, createModule, uploadModuleFile } from '../api/modules.js';
import { getAssignedLearners } from '../api/learners.js';

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
const { teacherName, teacherId, currentTeacher, assignedCenters, assignedProgramLevel } = useTeacherSession();

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
  router.push(`/dashboard/modules/${moduleId}`);
}

// Modules data from database
const modules = ref([]);
const loading = ref(true);
const isSubmitting = ref(false);

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
    answerKeyMode: false,
    correctFeedback: '',
    incorrectFeedback: '',
  };
}

// Feedback Modal State
const feedbackModal = reactive({
  open: false,
  targetKey: 'preTest',
  questionIndex: -1,
  activeTab: 'incorrect',
  incorrectFeedback: '',
  correctFeedback: '',
});

function openFeedbackModal(targetKey, qIdx) {
  const list = newModule[targetKey];
  if (!Array.isArray(list) || !list[qIdx]) return;
  const q = list[qIdx];
  feedbackModal.targetKey = targetKey;
  feedbackModal.questionIndex = qIdx;
  feedbackModal.activeTab = 'incorrect';
  feedbackModal.incorrectFeedback = q.incorrectFeedback || '';
  feedbackModal.correctFeedback = q.correctFeedback || '';
  feedbackModal.open = true;
}

function closeFeedbackModal() {
  feedbackModal.open = false;
  feedbackModal.questionIndex = -1;
}

function saveFeedbackModal() {
  const list = newModule[feedbackModal.targetKey];
  if (Array.isArray(list) && list[feedbackModal.questionIndex]) {
    const q = list[feedbackModal.questionIndex];
    q.incorrectFeedback = (feedbackModal.incorrectFeedback || '').trim();
    q.correctFeedback = (feedbackModal.correctFeedback || '').trim();
  }
  closeFeedbackModal();
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

const newModule = reactive({
  title: '',
  strand: 'Communication Skills (English)',
  level: 'A&E Elementary',
  learningCenterId: '',
  code: 'LS1',
  dateStarted: '',
  dateEnded: '',
  instructions: '',
  activitiesRelated: '',
  description: '',
  isAllLearners: true,
  selectedLearnerIds: [],
  preTest: [createBlankQuestion()],
  uploadedFile: null,
  fileName: '',
  fileType: 'PDF',
  fileSize: '',
  learningNotes: '',
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
  const selectedCenterId = newModule.learningCenterId ? Number(newModule.learningCenterId) : null;

  return (teacherLearners.value || []).filter((l) => {
    // 1. Level filter
    const lTarget = l.targetLevel || (String(l.level || '').toLowerCase().includes('elem') ? 'ELEMENTARY' : 'JUNIOR');
    if (lTarget !== targetEnum) {
      return false;
    }

    // 2. Learning Center filter
    if (selectedCenterId && l.learningCenterId) {
      if (Number(l.learningCenterId) !== selectedCenterId) {
        return false;
      }
    }

    return true;
  });
});

const learnerSearchQuery = ref('');

// Filtered learners for Specific Learners search
const filteredSpecificLearners = computed(() => {
  const query = learnerSearchQuery.value.trim().toLowerCase();
  if (!query) return eligibleLearners.value;
  return eligibleLearners.value.filter((l) => {
    const nameMatch = (l.name || l.fullName || '').toLowerCase().includes(query);
    const centerMatch = (l.learningCenter || '').toLowerCase().includes(query);
    return nameMatch || centerMatch;
  });
});

// Selected learners list for chips
const selectedLearnersList = computed(() => {
  const selectedSet = new Set((newModule.selectedLearnerIds || []).map(Number));
  return (teacherLearners.value || []).filter((l) => selectedSet.has(Number(l.id)));
});

function onAssignmentModeChange(isAll) {
  newModule.isAllLearners = isAll;
  if (isAll) {
    newModule.selectedLearnerIds = [];
  }
}

function toggleLearner(learnerId) {
  newModule.isAllLearners = false;
  const numId = Number(learnerId);
  const idx = newModule.selectedLearnerIds.indexOf(numId);
  if (idx === -1) {
    newModule.selectedLearnerIds.push(numId);
  } else {
    newModule.selectedLearnerIds.splice(idx, 1);
  }
}

// Watch level and learning center changes to dynamically update selection (Requirement 6)
watch(
  () => [newModule.learningCenterId, newModule.level, activeTargetLevel.value],
  () => {
    if (!newModule.isAllLearners && Array.isArray(newModule.selectedLearnerIds)) {
      const validIds = new Set(eligibleLearners.value.map((l) => Number(l.id)));
      newModule.selectedLearnerIds = newModule.selectedLearnerIds.filter((id) => validIds.has(Number(id)));
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
    step1ErrorMessage.value = 'Target ALS Level is required.';
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
  if (!newModule.isAllLearners && (!newModule.selectedLearnerIds || newModule.selectedLearnerIds.length === 0)) {
    step1ErrorMessage.value = 'Please select at least one learner when "Specific Learners" is chosen.';
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
        error: `${label} Question ${qNum}: Please select 1 correct answer using the Answer Key or radio button.`,
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
  isCreatingModule.value = true;
  currentStepIndex.value = 0;
  step1ErrorMessage.value = '';
  step2ErrorMessage.value = '';
  step4ErrorMessage.value = '';
}

function cancelModuleCreation() {
  isCreatingModule.value = false;
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

function addOptionToQuestion(q, targetKey) {
  if (targetKey === 'preTest') step2ErrorMessage.value = '';
  if (targetKey === 'postTest') step4ErrorMessage.value = '';
  if (!Array.isArray(q.choices)) {
    q.choices = [];
  }
  q.choices.push('');
  if (Array.isArray(q.optionIds)) {
    q.optionIds.push(null);
  }
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

function toggleAnswerKeyMode(q) {
  q.answerKeyMode = !q.answerKeyMode;
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
  newModule.activitiesRelated = '';
  newModule.description = '';
  newModule.isAllLearners = true;
  newModule.selectedLearnerIds = [];
  newModule.preTest = [createBlankQuestion()];
  newModule.postTest = [createBlankQuestion()];
  newModule.uploadedFile = null;
  newModule.fileName = '';
  newModule.fileType = 'PDF';
  newModule.fileSize = '';
  newModule.learningNotes = '';
  currentStepIndex.value = 0;
  step1ErrorMessage.value = '';
  step2ErrorMessage.value = '';
  step4ErrorMessage.value = '';
  learnerSearchQuery.value = '';
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
      activitiesRelated: newModule.activitiesRelated ? newModule.activitiesRelated.trim() : '',
      description: newModule.instructions ? newModule.instructions.trim() : (newModule.description ? newModule.description.trim() : ''),
      strand: newModule.strand,
      level: newModule.level,
      learningCenterId: newModule.learningCenterId || (assignedCenters.value[0] ? assignedCenters.value[0].id : null),
      isAllLearners: newModule.isAllLearners,
      assignedLearnerIds: newModule.isAllLearners ? [] : (newModule.selectedLearnerIds || []).map(Number),
      fileUrl: uploadedFileUrl,
      fileName: newModule.fileName || null,
      learningNotes: newModule.learningNotes ? newModule.learningNotes.trim() : '',
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
      newModule.level = activeLevel.value;
      await loadModules();
      await loadTeacherLearners();
    }
  }
);

onMounted(async () => {
  newModule.level = activeLevel.value;
  await loadModules();
  await loadTeacherLearners();
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
}

.btn-view-material {
  display: inline-flex;
  align-items: center;
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
}

.btn-view-material:hover {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1d4ed8;
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

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.35rem;
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

.gf-ak-done-btn:hover {
  background: #1d4ed8;
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
  background: #f0fdf4;
}

.gf-option-radio {
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
  accent-color: #16a34a;
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
  border-color: #86efac;
  background: #ffffff;
}

.gf-correct-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
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

.gf-saved-feedback-box {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.65rem 0.85rem;
  margin-bottom: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.gf-saved-feedback-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.gf-saved-feedback-label {
  font-weight: 700;
  color: #334155;
  font-size: 0.75rem;
}

.gf-saved-feedback-item.is-correct .gf-saved-feedback-label {
  color: #15803d;
}

.gf-saved-feedback-item.is-incorrect .gf-saved-feedback-label {
  color: #b91c1c;
}

.gf-saved-feedback-text {
  color: #475569;
  white-space: pre-wrap;
  word-break: break-word;
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

.gf-answer-key-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.85rem;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 7px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  font-family: inherit;
}

.gf-answer-key-btn:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #ffffff;
}

.gf-answer-key-btn.has-selected {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.gf-answer-key-btn.is-active {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #ffffff;
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
}

.gf-add-feedback-btn:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.gf-add-feedback-btn.has-feedback {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.gf-ak-status {
  font-size: 0.775rem;
  font-weight: 600;
}

.gf-ak-status.is-set {
  color: #15803d;
}

.gf-ak-status.is-empty {
  color: #64748b;
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

/* Add Feedback Modal Styles */
.gf-feedback-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1200;
}

.gf-feedback-modal-card {
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  box-sizing: border-box;
}

.gf-feedback-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.35rem 0.85rem 1.35rem;
}

.gf-feedback-modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
}

.gf-feedback-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.gf-feedback-modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.gf-feedback-modal-tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 1.35rem;
  gap: 1.5rem;
}

.gf-feedback-tab-btn {
  padding: 0.65rem 0.15rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  font-family: inherit;
  margin-bottom: -1px;
}

.gf-feedback-tab-btn:hover {
  color: #0f172a;
}

.gf-feedback-tab-btn.is-active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.gf-feedback-modal-body {
  padding: 1.25rem 1.35rem;
}

.gf-feedback-textarea {
  width: 100%;
  min-height: 115px;
  padding: 0.75rem 0.85rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}

.gf-feedback-textarea::placeholder {
  color: #94a3b8;
}

.gf-feedback-textarea:focus {
  background: #ffffff;
  border-color: #2563eb;
}

.gf-feedback-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  padding: 0.85rem 1.35rem 1.15rem 1.35rem;
  border-top: 1px solid #f1f5f9;
}

.gf-feedback-cancel-btn {
  padding: 0.48rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  font-family: inherit;
}

.gf-feedback-cancel-btn:hover {
  background: #f8fafc;
  color: #0f172a;
}

.gf-feedback-save-btn {
  padding: 0.48rem 1.15rem;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 7px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  font-family: inherit;
}

.gf-feedback-save-btn:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
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

/* Learner Assignment Section */
.learner-assignment-section {
  position: relative;
  margin-top: 0.25rem;
}

.assignment-radio-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 0.35rem;
  margin-bottom: 0.75rem;
}

@media (max-width: 640px) {
  .assignment-radio-group {
    grid-template-columns: 1fr;
  }
}

.assignment-radio-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}

.assignment-radio-card:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.assignment-radio-card.is-selected {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.08);
}

.custom-radio {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #2563eb;
  cursor: pointer;
  flex-shrink: 0;
}

.radio-label-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.radio-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
}

.radio-desc {
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.35;
}

/* All Learners Summary Card */
.all-learners-summary-card {
  padding: 0.85rem 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.learners-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e293b;
  font-size: 0.875rem;
}

.learners-count-badge svg {
  color: #2563eb;
  flex-shrink: 0;
}

.empty-eligible-box {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.85rem;
}

/* Specific Learners Section */
.specific-learners-section {
  margin-top: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-sub-lbl {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.specific-learners-container {
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.learner-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.learner-search-input {
  padding-left: 2.25rem !important;
  padding-right: 2rem !important;
  font-size: 0.875rem;
  height: 38px;
  width: 100%;
  background: #ffffff;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: #64748b;
  pointer-events: none;
}

.clear-search-btn {
  position: absolute;
  right: 0.65rem;
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.clear-search-btn:hover {
  color: #475569;
}

.selected-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.15rem 0;
  max-height: 80px;
  overflow-y: auto;
}

.selected-learner-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.chip-close-btn {
  background: transparent;
  border: none;
  color: #3b82f6;
  font-size: 0.95rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.chip-close-btn:hover {
  color: #1d4ed8;
}

.learners-multi-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.35rem;
  background: #ffffff;
}

.learner-check-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s ease;
  user-select: none;
}

.learner-check-row:hover {
  background: #f1f5f9;
}

.learner-check-row.is-checked {
  background: #f8fafc;
}

.learner-checkbox {
  width: 17px;
  height: 17px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  accent-color: #2563eb;
  cursor: pointer;
  flex-shrink: 0;
}

.learner-row-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.learner-row-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.learner-row-sub {
  font-size: 0.75rem;
  color: #64748b;
}

.selection-count-footer {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  padding-top: 0.35rem;
  border-top: 1px solid #f1f5f9;
}

.no-learners-box {
  padding: 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: #64748b;
  font-style: italic;
}
</style>

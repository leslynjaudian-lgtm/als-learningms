<template>
  <div class="page-container modules-page">
    <!-- Page Header with Upper-Right Action Button -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Modules</h1>
        <p>View and manage your learning modules.</p>
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
        <h3 class="empty-title">No Learning Modules Published Yet</h3>
        <p class="empty-desc">You haven't uploaded or created any modules yet. Click "+ Upload Module" to create your first learning package.</p>
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
          <span class="feed-count-text">Showing <strong>{{ modules.length }}</strong> published {{ modules.length === 1 ? 'module' : 'modules' }}</span>
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
              <select v-model="newModule.level" class="field-select-box" required>
                <option value="A&E Elementary">A&amp;E Elementary</option>
                <option value="A&E Junior High">A&amp;E Junior High</option>
              </select>
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
              <select v-model="newModule.code" class="field-select-box" required>
                <option value="" disabled>Select Module Code</option>
                <option value="LS1">LS1</option>
                <option value="LS2">LS2</option>
                <option value="LS3">LS3</option>
                <option value="LS4">LS4</option>
                <option value="LS5">LS5</option>
                <option value="LS6">LS6</option>
              </select>
            </div>

            <!-- ROW — FULL WIDTH: Learners Selection * -->
            <div class="field-item full-width learner-select-field">
              <label class="field-lbl">Learners <span class="req">*</span></label>
              <div class="learner-dropdown-container">
                <div v-if="learnerDropdownOpen" class="dropdown-backdrop" @click="learnerDropdownOpen = false"></div>
                <button
                  type="button"
                  class="field-input-box learner-dropdown-trigger"
                  :class="{ 'dropdown-open': learnerDropdownOpen }"
                  @click="learnerDropdownOpen = !learnerDropdownOpen"
                >
                  <span class="learner-selection-text">{{ learnerSelectionDisplayText }}</span>
                  <svg
                    class="dropdown-chevron"
                    :class="{ 'rotate-180': learnerDropdownOpen }"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <div v-if="learnerDropdownOpen" class="learner-dropdown-menu">
                  <!-- All Learners Option -->
                  <label class="learner-option-item all-learners-option">
                    <input
                      type="checkbox"
                      class="learner-checkbox"
                      :checked="newModule.isAllLearners"
                      @change="toggleAllLearners"
                    />
                    <div class="learner-option-info">
                      <span class="learner-option-name font-bold">All Learners</span>
                      <span class="learner-option-sub">
                        Send to all assigned {{ newModule.level }} learners
                      </span>
                    </div>
                  </label>

                  <div class="dropdown-divider"></div>

                  <!-- Available Learners List -->
                  <div v-if="availableLearners.length > 0" class="learners-list-scroll">
                    <label
                      v-for="l in availableLearners"
                      :key="l.id"
                      class="learner-option-item"
                    >
                      <input
                        type="checkbox"
                        class="learner-checkbox"
                        :checked="newModule.selectedLearnerIds.includes(l.id)"
                        @change="toggleLearner(l.id)"
                      />
                      <div class="learner-option-info">
                        <span class="learner-option-name">{{ l.name }}</span>
                        <span class="learner-option-sub">{{ l.level }} &bull; {{ l.learningCenter }}</span>
                      </div>
                    </label>
                  </div>
                  <div v-else class="no-learners-box">
                    <span>No {{ newModule.level }} learners found for the selected Learning Center.</span>
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

        <!-- STEP 2: PRE-TEST (Diagnostic Multiple Choice) -->
        <div v-else-if="currentStepIndex === 1" class="step-form-pane">
          <div class="pane-header-info">
            <h3>Step 2: Pre-Test (Diagnostic Evaluation)</h3>
            <p>Add multiple choice questions to establish diagnostic baseline knowledge before module instruction.</p>
          </div>

          <!-- Question Builder Box -->
          <div class="question-builder-card">
            <h4>Add Pre-Test Question #{{ newModule.preTest.length + 1 }}</h4>

            <div class="field-item">
              <label class="field-lbl">Question Prompt <span class="req">*</span></label>
              <input
                v-model="currentQuestion.prompt"
                type="text"
                class="field-input-box"
                placeholder="Enter diagnostic question prompt..."
              />
            </div>

            <div class="choices-entry-grid">
              <div
                v-for="(letter, cIdx) in choiceLetters"
                :key="letter"
                class="choice-input-row"
              >
                <span class="choice-letter-badge">{{ letter }}</span>
                <input
                  v-model="currentQuestion.choices[cIdx]"
                  type="text"
                  class="choice-text-field"
                  :placeholder="`Option ${letter} text`"
                />
                <label class="correct-radio-label">
                  <input
                    type="radio"
                    :name="'pre_test_correct'"
                    :value="cIdx"
                    v-model="currentQuestion.correctAnswer"
                  />
                  <span>Correct</span>
                </label>
              </div>
            </div>

            <div class="field-item" style="margin-top: 1rem;">
              <label class="field-lbl">Feedback / Explanation Note (Optional)</label>
              <input
                v-model="currentQuestion.explanation"
                type="text"
                class="field-input-box"
                placeholder="Brief explanation of why the correct option is right..."
              />
            </div>

            <div class="builder-actions-row">
              <button
                type="button"
                class="btn-add-q-to-list"
                @click="addQuestionToModule('preTest')"
              >
                + Add Question to Pre-Test
              </button>
            </div>
          </div>

          <!-- Pre-Test Questions Summary List -->
          <div v-if="newModule.preTest.length > 0" class="questions-added-list">
            <h4>Configured Pre-Test Questions ({{ newModule.preTest.length }} items &bull; Number Score: {{ newModule.preTest.length }}/{{ newModule.preTest.length }})</h4>
            <div
              v-for="(q, qIdx) in newModule.preTest"
              :key="qIdx"
              class="added-question-card"
            >
              <div class="q-card-header">
                <span class="q-card-num">Q{{ qIdx + 1 }}.</span>
                <span class="q-card-prompt">{{ q.prompt }}</span>
                <button
                  type="button"
                  class="btn-remove-q"
                  @click="removeQuestion('preTest', qIdx)"
                  title="Remove question"
                >
                  &times;
                </button>
              </div>
              <div class="q-card-choices">
                <span
                  v-for="(c, cIdx) in q.choices"
                  :key="cIdx"
                  class="choice-preview-pill"
                  :class="{ 'is-correct': q.correctAnswer === cIdx }"
                >
                  {{ choiceLetters[cIdx] }}: {{ c }}
                </span>
              </div>
              <p v-if="q.explanation" class="q-card-explanation">
                <strong>Feedback Note:</strong> {{ q.explanation }}
              </p>
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

        <!-- STEP 4: POST-TEST (Mastery Multiple Choice) -->
        <div v-else-if="currentStepIndex === 3" class="step-form-pane">
          <div class="pane-header-info">
            <h3>Step 4: Post-Test (Mastery Assessment)</h3>
            <p>Add multiple choice questions to evaluate learner mastery after completing the module.</p>
          </div>

          <!-- Post-Test Builder -->
          <div class="question-builder-card">
            <div class="builder-top-row">
              <h4>Add Post-Test Question #{{ newModule.postTest.length + 1 }}</h4>
              <button
                v-if="newModule.preTest.length > 0"
                type="button"
                class="btn-copy-pretest"
                @click="copyQuestionsFromPreTest"
              >
                &darr; Copy Questions from Pre-Test
              </button>
            </div>

            <div class="field-item">
              <label class="field-lbl">Question Prompt <span class="req">*</span></label>
              <input
                v-model="currentQuestion.prompt"
                type="text"
                class="field-input-box"
                placeholder="Enter mastery assessment question prompt..."
              />
            </div>

            <div class="choices-entry-grid">
              <div
                v-for="(letter, cIdx) in choiceLetters"
                :key="letter"
                class="choice-input-row"
              >
                <span class="choice-letter-badge">{{ letter }}</span>
                <input
                  v-model="currentQuestion.choices[cIdx]"
                  type="text"
                  class="choice-text-field"
                  :placeholder="`Option ${letter} text`"
                />
                <label class="correct-radio-label">
                  <input
                    type="radio"
                    :name="'post_test_correct'"
                    :value="cIdx"
                    v-model="currentQuestion.correctAnswer"
                  />
                  <span>Correct</span>
                </label>
              </div>
            </div>

            <div class="field-item" style="margin-top: 1rem;">
              <label class="field-lbl">Feedback / Mastery Note (Optional)</label>
              <input
                v-model="currentQuestion.explanation"
                type="text"
                class="field-input-box"
                placeholder="Competency or concept explanation for learner review..."
              />
            </div>

            <div class="builder-actions-row">
              <button
                type="button"
                class="btn-add-q-to-list"
                @click="addQuestionToModule('postTest')"
              >
                + Add Question to Post-Test
              </button>
            </div>
          </div>

          <!-- Post-Test Questions Summary List -->
          <div v-if="newModule.postTest.length > 0" class="questions-added-list">
            <h4>Configured Post-Test Questions ({{ newModule.postTest.length }} items &bull; Number Score: {{ newModule.postTest.length }}/{{ newModule.postTest.length }})</h4>
            <div
              v-for="(q, qIdx) in newModule.postTest"
              :key="qIdx"
              class="added-question-card"
            >
              <div class="q-card-header">
                <span class="q-card-num">Q{{ qIdx + 1 }}.</span>
                <span class="q-card-prompt">{{ q.prompt }}</span>
                <button
                  type="button"
                  class="btn-remove-q"
                  @click="removeQuestion('postTest', qIdx)"
                  title="Remove question"
                >
                  &times;
                </button>
              </div>
              <div class="q-card-choices">
                <span
                  v-for="(c, cIdx) in q.choices"
                  :key="cIdx"
                  class="choice-preview-pill"
                  :class="{ 'is-correct': q.correctAnswer === cIdx }"
                >
                  {{ choiceLetters[cIdx] }}: {{ c }}
                </span>
              </div>
              <p v-if="q.explanation" class="q-card-explanation">
                <strong>Feedback Note:</strong> {{ q.explanation }}
              </p>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getModules, createModule, uploadModuleFile } from '../api/modules.js';
import { getAssignedLearners } from '../api/learners.js';

const router = useRouter();
const { teacherName, teacherId, currentTeacher, assignedCenters, assignedProgramLevel } = useTeacherSession();

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

const wizardSteps = [
  { key: 'info', title: 'Module Information' },
  { key: 'preTest', title: 'Pre-Test' },
  { key: 'material', title: 'Learning Module' },
  { key: 'postTest', title: 'Post-Test' },
];

const choiceLetters = ['A', 'B', 'C', 'D'];

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
  preTest: [],
  uploadedFile: null,
  fileName: '',
  fileType: 'PDF',
  fileSize: '',
  learningNotes: '',
  postTest: [],
});

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

// Available learners filtered by selected Target ALS Level (and assigned to the logged-in teacher)
const availableLearners = computed(() => {
  if (!newModule.level) return [];
  const targetLevelNorm = newModule.level.toLowerCase().trim();

  return teacherLearners.value.filter((l) => {
    // Target ALS Level check (A&E Elementary vs A&E Junior High)
    const lLevelNorm = (l.level || '').toLowerCase().trim();
    const isLevelMatch =
      (targetLevelNorm.includes('elem') && lLevelNorm.includes('elem')) ||
      ((targetLevelNorm.includes('jun') || targetLevelNorm.includes('sec')) && (lLevelNorm.includes('jun') || lLevelNorm.includes('sec')));
    return isLevelMatch;
  });
});

// Summary text for closed multi-select trigger button
const learnerSelectionDisplayText = computed(() => {
  if (newModule.isAllLearners) {
    return 'All Learners';
  }
  if (!newModule.selectedLearnerIds || newModule.selectedLearnerIds.length === 0) {
    return 'Select recipient learners...';
  }
  const selectedNames = availableLearners.value
    .filter((l) => newModule.selectedLearnerIds.includes(l.id))
    .map((l) => l.name);

  if (selectedNames.length === 0) {
    return `${newModule.selectedLearnerIds.length} learner(s) selected`;
  }
  if (selectedNames.length <= 2) {
    return selectedNames.join(', ');
  }
  return `${selectedNames[0]}, ${selectedNames[1]} (+${selectedNames.length - 2} more)`;
});

function toggleAllLearners() {
  newModule.isAllLearners = true;
  newModule.selectedLearnerIds = [];
}

function toggleLearner(learnerId) {
  newModule.isAllLearners = false;
  const idx = newModule.selectedLearnerIds.indexOf(learnerId);
  if (idx === -1) {
    newModule.selectedLearnerIds.push(learnerId);
  } else {
    newModule.selectedLearnerIds.splice(idx, 1);
  }
  // If user unchecks all individual learners, revert back to All Learners
  if (newModule.selectedLearnerIds.length === 0) {
    newModule.isAllLearners = true;
  }
}

// Watch level changes to dynamically update selection (Requirement 5)
watch(() => newModule.level, () => {
  if (!newModule.isAllLearners) {
    const validIds = new Set(availableLearners.value.map((l) => l.id));
    newModule.selectedLearnerIds = newModule.selectedLearnerIds.filter((id) => validIds.has(id));
    if (newModule.selectedLearnerIds.length === 0) {
      newModule.isAllLearners = true;
    }
  }
});

const dateRangeError = computed(() => {
  if (newModule.dateStarted && newModule.dateEnded) {
    if (new Date(newModule.dateEnded) < new Date(newModule.dateStarted)) {
      return 'Date Ended must not be earlier than Date Started.';
    }
  }
  return '';
});

const currentQuestion = reactive({
  prompt: '',
  choices: ['', '', '', ''],
  correctAnswer: 0,
  explanation: '',
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
    step1ErrorMessage.value = 'Module Code is required.';
    return false;
  }
  const validCodes = ['LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6'];
  if (!validCodes.includes(newModule.code)) {
    step1ErrorMessage.value = 'Module Code must be one of LS1, LS2, LS3, LS4, LS5, or LS6.';
    return false;
  }

  // Learner Selection Validation (Requirement 11)
  if (!newModule.isAllLearners && (!newModule.selectedLearnerIds || newModule.selectedLearnerIds.length === 0)) {
    step1ErrorMessage.value = 'Please select the learners who will receive this module.';
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

// Fetch modules from database for the currently logged-in teacher
async function loadModules() {
  loading.value = true;
  try {
    const tid = teacherId.value;
    const res = await getModules(tid ? { teacherId: tid } : {});
    if (Array.isArray(res.data)) {
      modules.value = res.data;
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
    teacherLearners.value = (data || []).map((l) => ({
      id: l.id,
      name: l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Learner',
      level: l.level === 'ELEMENTARY' ? 'A&E Elementary' : (l.level === 'JUNIOR' || l.level === 'LOWER_SECONDARY' || l.level === 'A&E Junior' || l.level === 'A&E Junior High' ? 'A&E Junior High' : l.level) || 'A&E Elementary',
      learningCenterId: l.learningCenterId,
      learningCenter: l.learningCenter || '',
    }));
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
  if (assignedProgramLevel.value && assignedProgramLevel.value.includes('Junior')) {
    newModule.level = 'A&E Junior High';
  } else {
    newModule.level = 'A&E Elementary';
  }
  isCreatingModule.value = true;
  currentStepIndex.value = 0;
  step1ErrorMessage.value = '';
}

function cancelModuleCreation() {
  isCreatingModule.value = false;
  step1ErrorMessage.value = '';
}

function nextStep() {
  if (currentStepIndex.value === 0) {
    if (!validateStep1()) {
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
  }
}

function addQuestionToModule(targetKey) {
  if (!currentQuestion.prompt.trim()) {
    alert('Please enter a question prompt.');
    return;
  }

  // Ensure choices are filled
  const validChoices = currentQuestion.choices.filter((c) => c && c.trim());
  if (validChoices.length < 2) {
    alert('Please enter at least 2 answer choices.');
    return;
  }

  const newQ = {
    prompt: currentQuestion.prompt.trim(),
    choices: [...currentQuestion.choices],
    correctAnswer: currentQuestion.correctAnswer,
    explanation: currentQuestion.explanation.trim(),
  };

  newModule[targetKey].push(newQ);

  // Reset current question input
  currentQuestion.prompt = '';
  currentQuestion.choices = ['', '', '', ''];
  currentQuestion.correctAnswer = 0;
  currentQuestion.explanation = '';
}

function removeQuestion(targetKey, index) {
  newModule[targetKey].splice(index, 1);
}

function copyQuestionsFromPreTest() {
  newModule.postTest = JSON.parse(JSON.stringify(newModule.preTest));
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
  newModule.level = 'A&E Elementary';
  newModule.learningCenterId = '';
  newModule.code = 'LS1';
  newModule.dateStarted = '';
  newModule.dateEnded = '';
  newModule.instructions = '';
  newModule.activitiesRelated = '';
  newModule.description = '';
  newModule.isAllLearners = true;
  newModule.selectedLearnerIds = [];
  newModule.preTest = [];
  newModule.postTest = [];
  newModule.uploadedFile = null;
  newModule.fileName = '';
  newModule.fileType = 'PDF';
  newModule.fileSize = '';
  newModule.learningNotes = '';
  currentStepIndex.value = 0;
  step1ErrorMessage.value = '';
  learnerDropdownOpen.value = false;
}

async function publishCompleteModule() {
  if (!validateStep1()) {
    currentStepIndex.value = 0;
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
      assignedLearnerIds: newModule.isAllLearners ? [] : newModule.selectedLearnerIds,
      fileUrl: uploadedFileUrl,
      fileName: newModule.fileName || null,
      learningNotes: newModule.learningNotes ? newModule.learningNotes.trim() : '',
      preTest: newModule.preTest.map((q, idx) => ({
        questionText: q.prompt,
        options: q.choices.map((c, cIdx) => ({
          optionText: c,
          isCorrect: q.correctAnswer === cIdx,
        })),
        points: 1,
        sortOrder: idx + 1,
      })),
      postTest: newModule.postTest.map((q, idx) => ({
        questionText: q.prompt,
        options: q.choices.map((c, cIdx) => ({
          optionText: c,
          isCorrect: q.correctAnswer === cIdx,
        })),
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

onMounted(() => {
  loadModules();
  loadTeacherLearners();
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

/* Question Builder Card */
.question-builder-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.builder-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.question-builder-card h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.btn-copy-pretest {
  padding: 0.4rem 0.85rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.775rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-pretest:hover {
  background: #eff6ff;
  border-color: #2563eb;
}

.choices-entry-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.choice-input-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.choice-letter-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.choice-text-field {
  flex: 1;
  padding: 0.6rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  background: #ffffff;
  outline: none;
}

.choice-text-field:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.correct-radio-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.builder-actions-row {
  margin-top: 1.25rem;
  display: flex;
  justify-content: flex-end;
}

.btn-add-q-to-list {
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-add-q-to-list:hover {
  background: #1d4ed8;
}

/* Added Questions List */
.questions-added-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.questions-added-list h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.added-question-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.25rem;
}

.q-card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.q-card-num {
  font-weight: 700;
  color: #2563eb;
}

.q-card-prompt {
  font-weight: 600;
  color: #0f172a;
  flex: 1;
}

.btn-remove-q {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.35rem;
}

.btn-remove-q:hover {
  color: #ef4444;
}

.q-card-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.choice-preview-pill {
  font-size: 0.75rem;
  padding: 0.25rem 0.65rem;
  background: #f1f5f9;
  border-radius: 6px;
  color: #475569;
}

.choice-preview-pill.is-correct {
  background: #dcfce7;
  color: #15803d;
  font-weight: 600;
}

.q-card-explanation {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
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

/* Learner Multi-Select Dropdown */
.learner-select-field {
  position: relative;
}

.learner-dropdown-container {
  position: relative;
  width: 100%;
}

.learner-dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  user-select: none;
  background-color: #ffffff;
}

.learner-dropdown-trigger.dropdown-open {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.learner-selection-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: #0f172a;
  padding-right: 0.5rem;
}

.dropdown-chevron {
  flex-shrink: 0;
  color: #64748b;
  transition: transform 0.2s ease;
  margin-left: auto;
}

.dropdown-chevron.rotate-180 {
  transform: rotate(180deg);
}

.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.learner-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  z-index: 100;
  padding: 0.5rem;
  max-height: 260px;
  display: flex;
  flex-direction: column;
}

.learner-option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}

.learner-option-item:hover {
  background: #f1f5f9;
}

.all-learners-option {
  background: #f8fafc;
}

.all-learners-option:hover {
  background: #eff6ff;
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

.learner-option-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.learner-option-name {
  font-size: 0.875rem;
  color: #0f172a;
}

.learner-option-name.font-bold {
  font-weight: 700;
  color: #1e3a8a;
}

.learner-option-sub {
  font-size: 0.75rem;
  color: #64748b;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.35rem 0;
}

.learners-list-scroll {
  overflow-y: auto;
  max-height: 180px;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.no-learners-box {
  padding: 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: #64748b;
  font-style: italic;
}
</style>

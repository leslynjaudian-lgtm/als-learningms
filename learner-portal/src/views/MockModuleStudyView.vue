<template>
  <div class="mock-study-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state-container">
      <div class="spinner-circle"></div>
      <p class="loading-text">Loading module content...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="error-state-container">
      <div class="error-icon-box">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p class="error-msg">{{ loadError }}</p>
      <button type="button" class="btn-primary retry-btn" @click="fetchModuleData">
        Retry
      </button>
    </div>

    <!-- Main Module Study View -->
    <template v-else>
      <!-- Consistent Back Navigation Bar: Outside and above the main content card -->
      <div class="module-back-bar">
        <router-link v-if="currentStep === 0" to="/modules" class="module-back-btn" @click="handleModulesBackClick($event)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>My Modules</span>
        </router-link>
        <button v-else type="button" class="module-back-btn" @click="goToOverview">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Go Back</span>
        </button>
      </div>

      <!-- Subpage Heading Card (visible only when inside Steps 1, 3, or 4) -->
      <div v-if="currentStep === 1 || currentStep === 3 || currentStep === 4" class="subpage-nav-bar">
        <!-- STEP X & Activity Title & Completed Status -->
        <div class="subpage-heading-group">
          <div class="subpage-meta-row">
            <span class="subpage-step-label">STEP {{ currentStep }}</span>
            <span v-if="isAssessmentResultsView" class="subpage-completed-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Completed</span>
            </span>
          </div>
          <h1 class="subpage-title-text">
            {{ isPreTestResultsView ? 'Pre-Test Results' : isPostTestResultsView ? 'Post-Test Results' : getSubpageTitle(currentStep) }}
          </h1>
          <p
            v-if="(currentStep === 1 && !isPreTestResultsView && preTestQuestions.length > 0) || (currentStep === 3 && !isPostTestResultsView && postTestQuestions.length > 0)"
            class="subpage-instruction-text"
          >
            Read each question carefully. Tap the circle beside your chosen answer, then tap 'Submit Answer' to continue.
          </p>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- STEP 0: MODULE OVERVIEW (Clean Google Classroom Checklist)    -->
      <!-- ============================================================ -->
      <div v-if="currentStep === 0" class="module-details-container">
        <!-- Section 1: Module Overview Card -->
        <div class="module-header-card">
          <div class="header-titles">
            <h1 class="module-main-title">{{ moduleTitle }}</h1>
            <p v-if="moduleInstructions" class="module-instructions-inline">{{ moduleInstructions }}</p>
          </div>

          <div class="overview-divider"></div>

          <div class="header-progress-wrap">
            <div class="header-progress-row">
              <span class="header-progress-label">Your Progress</span>
              <span class="header-progress-percent">{{ computedProgressPercentage }}% Complete</span>
            </div>
            <div class="header-progress-track" role="progressbar" :aria-valuenow="computedProgressPercentage" aria-valuemin="0" aria-valuemax="100">
              <div class="header-progress-fill" :style="{ width: `${computedProgressPercentage}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Section 2: Your Learning Activities -->
        <div class="learning-activities-section">
          <!-- Subtle Light-Blue Information Container -->
          <div class="activities-info-card">
            <div class="activities-info-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <div class="activities-info-content">
              <h2 class="activities-info-title">Your Learning Activities</h2>
              <p class="activities-info-desc">Start by answering the Pre-Test to unlock your learning module. Once completed, you can read and study the lessons, answer the Post-Test, and submit your activities.</p>
            </div>
          </div>

          <div class="activities-checklist">
            <!-- Step 1 Card: Pre-Test -->
            <div
              class="activity-card"
              :class="{
                'is-active-step': currentActiveStep === 1,
                'is-completed': isStepCompleted(1),
                'is-locked': !isStepUnlocked(1)
              }"
            >
              <!-- Top Row: Icon, Title Group, Status -->
              <div class="card-top-row">
                <div
                  class="card-icon-badge"
                  :class="{
                    'badge-completed': isStepCompleted(1),
                    'badge-active': currentActiveStep === 1,
                    'badge-locked': !isStepUnlocked(1)
                  }"
                >
                  <!-- Small green check if completed -->
                  <svg v-if="isStepCompleted(1)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <!-- Lock icon if locked -->
                  <svg v-else-if="!isStepUnlocked(1)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <!-- Step number otherwise -->
                  <span v-else>1</span>
                </div>

                <div class="card-title-group">
                  <span class="card-step-label">Step 1</span>
                  <h3 class="card-activity-title">Pre-Test (Let's See What You Already Know)</h3>
                </div>

                <div class="card-status-col">
                  <span v-if="isStepCompleted(1)" class="card-status-pill status-completed">
                    Completed
                  </span>
                  <span v-else-if="!isStepUnlocked(1)" class="card-status-pill status-locked">
                    Locked
                  </span>
                  <span v-else class="card-status-pill status-ready">
                    Ready
                  </span>
                </div>
              </div>

              <!-- Middle: Short Description -->
              <p class="card-description">Answer a few questions before reading the module.</p>

              <!-- Bottom Row: Assessment Score on Left, Action Button on Right -->
              <div class="card-bottom-row">
                <div class="card-bottom-left">
                  <div v-if="isStepCompleted(1)" class="card-score-pill">
                    <span class="score-label">Score:</span>
                    <strong class="score-val">{{ progress.preTestScore ?? 0 }}/{{ preTestTotal }}</strong>
                  </div>
                </div>

                <div class="card-bottom-right">
                  <button
                    v-if="isStepCompleted(1)"
                    type="button"
                    class="activity-btn btn-primary"
                    @click="goToStep(1)"
                  >
                    <span>View Results</span>
                  </button>
                  <button
                    v-else-if="isStepUnlocked(1)"
                    type="button"
                    class="activity-btn btn-primary"
                    @click="goToStep(1)"
                  >
                    <span>Start Pre-Test</span>
                  </button>
                  <button
                    v-else
                    type="button"
                    class="activity-btn btn-locked"
                    disabled
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>Locked</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Step 2 Card: Read the Module -->
            <div
              class="activity-card"
              :class="{
                'is-active-step': currentActiveStep === 2,
                'is-completed': isStepCompleted(2),
                'is-locked': !isStepUnlocked(2)
              }"
            >
              <!-- Top Row: Icon, Title Group, Status -->
              <div class="card-top-row">
                <div
                  class="card-icon-badge"
                  :class="{
                    'badge-completed': isStepCompleted(2),
                    'badge-active': currentActiveStep === 2,
                    'badge-locked': !isStepUnlocked(2)
                  }"
                >
                  <svg v-if="isStepCompleted(2)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <svg v-else-if="!isStepUnlocked(2)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span v-else>2</span>
                </div>

                <div class="card-title-group">
                  <span class="card-step-label">Step 2</span>
                  <h3 class="card-activity-title">Read the Module</h3>
                </div>

                <div class="card-status-col">
                  <span v-if="!isStepUnlocked(2)" class="card-status-pill status-locked">Locked</span>
                  <span v-else-if="isStepCompleted(2)" class="card-status-pill status-completed">Completed</span>
                  <span v-else-if="progress.readingStarted || (progress.pagesRead && progress.pagesRead.length > 0)" class="card-status-pill status-in-progress">In Progress</span>
                  <span v-else class="card-status-pill status-ready">Ready</span>
                </div>
              </div>

              <!-- Middle: Short Description -->
              <p class="card-description">Read the lessons and learn at your own pace.</p>

              <!-- Bottom Row: Reading Info on Left, Action Button on Right -->
              <div class="card-bottom-row">
                <div class="card-bottom-left">
                  <div v-if="isStepCompleted(2) || progress.readingStarted || (progress.pagesRead && progress.pagesRead.length > 0) || progress.pdfCurrentPage" class="card-reading-progress">
                    <span>Page {{ progress.pdfCurrentPage || 1 }} of {{ progress.pdfTotalPages || 29 }}</span>
                  </div>
                </div>

                <div class="card-bottom-right">
                  <button
                    v-if="isStepCompleted(2)"
                    type="button"
                    class="activity-btn btn-primary"
                    @click="goToStep(2)"
                  >
                    <span>Read Again</span>
                  </button>
                  <button
                    v-else-if="isStepUnlocked(2)"
                    type="button"
                    class="activity-btn btn-primary"
                    @click="goToStep(2)"
                  >
                    <span>{{ progress.readingStarted ? 'Continue Reading' : 'Start Reading' }}</span>
                  </button>
                  <button
                    v-else
                    type="button"
                    class="activity-btn btn-locked"
                    disabled
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>Locked</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Step 3 Card: Post-Test -->
            <div
              class="activity-card"
              :class="{
                'is-active-step': currentActiveStep === 3,
                'is-completed': isStepCompleted(3),
                'is-locked': !isStepUnlocked(3)
              }"
            >
              <!-- Top Row: Icon, Title Group, Status -->
              <div class="card-top-row">
                <div
                  class="card-icon-badge"
                  :class="{
                    'badge-completed': isStepCompleted(3),
                    'badge-active': currentActiveStep === 3,
                    'badge-locked': !isStepUnlocked(3)
                  }"
                >
                  <svg v-if="isStepCompleted(3)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <svg v-else-if="!isStepUnlocked(3)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span v-else>3</span>
                </div>

                <div class="card-title-group">
                  <span class="card-step-label">Step 3</span>
                  <h3 class="card-activity-title">Post-Test (What Have You Learned?)</h3>
                </div>

                <div class="card-status-col">
                  <span v-if="!isStepUnlocked(3)" class="card-status-pill status-locked">Locked</span>
                  <span v-else-if="isStepCompleted(3)" class="card-status-pill status-completed">Completed</span>
                  <span v-else class="card-status-pill status-ready">Ready</span>
                </div>
              </div>

              <!-- Middle: Short Description -->
              <p class="card-description">Answer questions about what you learned.</p>

              <!-- Bottom Row: Assessment Score on Left, Action Button on Right -->
              <div class="card-bottom-row">
                <div class="card-bottom-left">
                  <div v-if="isStepCompleted(3)" class="card-score-pill">
                    <span class="score-label">Score:</span>
                    <strong class="score-val">{{ progress.postTestScore ?? 0 }}/{{ postTestTotal }}</strong>
                  </div>
                </div>

                <div class="card-bottom-right">
                  <button
                    v-if="isStepCompleted(3)"
                    type="button"
                    class="activity-btn btn-primary"
                    @click="goToStep(3)"
                  >
                    <span>View Results</span>
                  </button>
                  <button
                    v-else-if="isStepUnlocked(3)"
                    type="button"
                    class="activity-btn btn-primary"
                    @click="goToStep(3)"
                  >
                    <span>Start Post-Test</span>
                  </button>
                  <button
                    v-else
                    type="button"
                    class="activity-btn btn-locked"
                    disabled
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>Locked</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Step 4 Card: Submit Your Activity -->
            <div
              class="activity-card"
              :class="{
                'is-active-step': currentActiveStep === 4,
                'is-completed': isStepCompleted(4),
                'is-locked': !isStepUnlocked(4)
              }"
            >
              <!-- Top Row: Icon, Title Group, Status -->
              <div class="card-top-row">
                <div
                  class="card-icon-badge"
                  :class="{
                    'badge-completed': isStepCompleted(4),
                    'badge-active': currentActiveStep === 4,
                    'badge-locked': !isStepUnlocked(4)
                  }"
                >
                  <svg v-if="isStepCompleted(4)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <svg v-else-if="!isStepUnlocked(4)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span v-else>4</span>
                </div>

                <div class="card-title-group">
                  <span class="card-step-label">Step 4</span>
                  <h3 class="card-activity-title">Submit Your Activity</h3>
                </div>

                <div class="card-status-col">
                  <span v-if="!isStepUnlocked(4)" class="card-status-pill status-locked">Locked</span>
                  <span v-else-if="isStepCompleted(4)" class="card-status-pill status-completed">Submitted</span>
                  <span v-else class="card-status-pill status-ready">Ready</span>
                </div>
              </div>

              <!-- Middle: Short Description -->
              <p class="card-description">Upload photos of your written answers or a PDF file.</p>

              <!-- Bottom Row: Submissions Info on Left, Action Button on Right -->
              <div class="card-bottom-row">
                <div class="card-bottom-left">
                  <span v-if="isStepCompleted(4) && progress.submittedFilesMeta?.length" class="card-submission-meta">
                    {{ progress.submittedFilesMeta.length }} file{{ progress.submittedFilesMeta.length > 1 ? 's' : '' }} submitted
                  </span>
                </div>

                <div class="card-bottom-right">
                  <button
                    v-if="isStepCompleted(4)"
                    type="button"
                    class="activity-btn btn-primary"
                    @click="goToStep(4)"
                  >
                    <span>View My Submissions</span>
                  </button>
                  <button
                    v-else-if="isStepUnlocked(4)"
                    type="button"
                    class="activity-btn btn-primary"
                    @click="goToStep(4)"
                  >
                    <span>Submit Activity</span>
                  </button>
                  <button
                    v-else
                    type="button"
                    class="activity-btn btn-locked"
                    disabled
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>Locked</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- ============================================================ -->
    <!-- STEP 1: PRE-TEST (Multiple-Choice Questions)                 -->
    <!-- ============================================================ -->
    <div v-else-if="currentStep === 1" class="step-content-card" :class="{ 'results-view-mode': isPreTestResultsView }">
      <!-- No Pre-Test Questions Configured -->
      <div v-if="preTestQuestions.length === 0" class="score-summary-box">
        <div class="score-icon-badge">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        <span class="summary-status-pill">Ready to Study</span>
        <h2 class="summary-title">No Pre-Test Required</h2>
        <p class="summary-desc">
          This module does not require a pre-test. You can proceed directly to read the module.
        </p>

        <button
          type="button"
          class="btn-primary summary-action-btn"
          @click="proceedToModuleReader"
        >
          <span>Proceed to Read Module</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <!-- In Progress: Question by Question -->
      <template v-else-if="!progress.preTestCompleted && !showingPreTestScore">
        <div class="assessment-header">
          <div class="assessment-eyebrow">
            <span class="step-badge">Pre-Test</span>
            <span class="q-counter">Question {{ currentPreQIndex + 1 }} of {{ preTestQuestions.length }}</span>
          </div>

          <!-- Progress bar -->
          <div class="assessment-progress-bar">
            <div
              class="bar-fill"
              :style="{ width: `${((currentPreQIndex + 1) / preTestQuestions.length) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Question Prompt -->
        <div class="question-body">
          <h2 class="question-text">
            {{ currentPreQ.question }}
          </h2>

          <!-- Options -->
          <div class="options-list">
            <button
              v-for="opt in currentPreQ.options"
              :key="opt.id"
              type="button"
              class="option-item"
              :class="{
                selected: isOptionSelectedPre(opt.id),
                correct: isPreSubmitted && opt.id === currentPreQ.correctAnswer,
                incorrect: isPreSubmitted && isOptionSelectedPre(opt.id) && opt.id !== currentPreQ.correctAnswer,
                locked: isPreSubmitted
              }"
              :disabled="isPreSubmitted"
              @click="onSelectPreAnswer(opt.id)"
            >
              <div
                class="opt-choice-indicator opt-letter-circle"
                :class="isCheckboxQuestion(currentPreQ) ? 'is-checkbox' : 'is-radio'"
              >
                <!-- Pre-Test Submitted Feedback States -->
                <template v-if="isPreSubmitted">
                  <svg v-if="opt.id === currentPreQ.correctAnswer" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <svg v-else-if="isOptionSelectedPre(opt.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </template>

                <!-- Checkbox Question: Selected Checkmark -->
                <template v-else-if="isCheckboxQuestion(currentPreQ)">
                  <svg v-if="isOptionSelectedPre(opt.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </template>

                <!-- Radio Question: Blue Filled Center Dot when selected, Empty when unselected -->
                <template v-else>
                  <span v-if="isOptionSelectedPre(opt.id)" class="radio-inner-dot"></span>
                </template>
              </div>
              <span class="opt-text">{{ opt.text }}</span>
            </button>
          </div>
        </div>

        <!-- Feedback Card (after submission) -->
        <div
          v-if="isPreSubmitted"
          class="feedback-card"
          :class="isPreAnswerCorrect ? 'feedback-correct' : 'feedback-incorrect'"
        >
          <div class="feedback-heading">
            <svg v-if="isPreAnswerCorrect" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <strong>{{ isPreAnswerCorrect ? 'Correct!' : 'Incorrect' }}</strong>
          </div>
          <p class="feedback-detail">{{ getQuestionFeedback(currentPreQ, isPreAnswerCorrect) }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="assessment-actions">
          <button
            v-if="!isPreSubmitted"
            type="button"
            class="btn-primary action-btn"
            :disabled="hasNoPreAnswer"
            @click="submitPreAnswer"
          >
            Submit Answer
          </button>
          <button
            v-else
            type="button"
            class="btn-primary action-btn"
            @click="nextPreQuestion"
          >
            <span>{{ currentPreQIndex + 1 < preTestQuestions.length ? 'Next Question' : 'View Pre-Test Results' }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </template>

      <!-- Pre-Test Completed / Score Summary & Review View -->
      <template v-else>
        <AssessmentResultsReview
          test-type="preTest"
          :score="progress.preTestScore ?? 0"
          :total="preTestTotal"
          :percent="preTestPercent"
          :questions="preTestQuestions"
          :answers="progress.preTestAnswers"
          :get-feedback="getQuestionFeedback"
          @proceed="proceedToModuleReader"
        />
      </template>
    </div>

    <!-- ============================================================ -->
    <!-- STEP 2: LEARNING MODULE (PDF Viewer)                         -->
    <!-- ============================================================ -->
    <div v-else-if="currentStep === 2" class="step-reader-wrapper">
      <MockPdfViewer
        :moduleId="effectiveModuleId"
        :pdfUrl="pdfUrl"
        :title="moduleTitle"
        :code="moduleCode"
        :subtitle="moduleStrandCode"
        :downloadFileName="moduleDownloadFileName"
        :instructions="moduleReadingInstructions"
        :initialPage="progress.pdfCurrentPage || 1"
        :initialMode="progress.pdfViewMode || 'long'"
        :initialPagesRead="progress.pagesRead || []"
        @back="onViewerBack"
        @proceed-to-post-test="onViewerProceedToPostTest"
        @update-progress="onViewerProgressUpdate"
      />
    </div>

    <!-- ============================================================ -->
    <!-- STEP 3: POST-TEST (Multiple-Choice Questions)                -->
    <!-- ============================================================ -->
    <div v-else-if="currentStep === 3" class="step-content-card" :class="{ 'results-view-mode': isPostTestResultsView }">
      <!-- No Post-Test Questions Configured -->
      <div v-if="postTestQuestions.length === 0" class="score-summary-box">
        <div class="score-icon-badge post-badge-circle">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>

        <span class="summary-status-pill post-pill">Post-Test Skipped</span>
        <h2 class="summary-title">No Post-Test Required</h2>
        <p class="summary-desc">
          This module does not require a post-test. Continue to submit your activity.
        </p>

        <button
          type="button"
          class="btn-primary summary-action-btn"
          @click="proceedToActivitySubmission"
        >
          <span>Proceed to Submit Activity</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <!-- In Progress: Question by Question -->
      <template v-else-if="!progress.postTestCompleted && !showingPostTestScore">
        <div class="assessment-header">
          <div class="assessment-eyebrow">
            <span class="step-badge post-badge">Post-Test</span>
            <span class="q-counter">Question {{ currentPostQIndex + 1 }} of {{ postTestQuestions.length }}</span>
          </div>

          <!-- Progress bar -->
          <div class="assessment-progress-bar">
            <div
              class="bar-fill post-fill"
              :style="{ width: `${((currentPostQIndex + 1) / postTestQuestions.length) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Question Prompt -->
        <div class="question-body">
          <h2 class="question-text">
            {{ currentPostQ.question }}
          </h2>

          <!-- Options (Do not reveal correct answers or feedback before Post-Test submission) -->
          <div class="options-list">
            <button
              v-for="opt in currentPostQ.options"
              :key="opt.id"
              type="button"
              class="option-item"
              :class="{
                selected: isOptionSelectedPost(opt.id)
              }"
              @click="onSelectPostAnswer(opt.id)"
            >
              <div
                class="opt-choice-indicator opt-letter-circle"
                :class="isCheckboxQuestion(currentPostQ) ? 'is-checkbox' : 'is-radio'"
              >
                <!-- Checkbox Question: Selected Checkmark -->
                <template v-if="isCheckboxQuestion(currentPostQ)">
                  <svg v-if="isOptionSelectedPost(opt.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </template>

                <!-- Radio Question: Blue Filled Center Dot when selected, Empty when unselected -->
                <template v-else>
                  <span v-if="isOptionSelectedPost(opt.id)" class="radio-inner-dot"></span>
                </template>
              </div>
              <span class="opt-text">{{ opt.text }}</span>
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="assessment-actions">
          <button
            type="button"
            class="btn-primary action-btn"
            :disabled="hasNoPostAnswer"
            @click="submitPostAnswer"
          >
            <span>{{ currentPostQIndex + 1 < postTestQuestions.length ? 'Next Question' : 'Submit Post-Test' }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </template>

      <!-- Post-Test Completed / Score Summary & Review View -->
      <template v-else>
        <AssessmentResultsReview
          test-type="postTest"
          :score="progress.postTestScore ?? 0"
          :total="postTestTotal"
          :percent="postTestPercent"
          :questions="postTestQuestions"
          :answers="progress.postTestAnswers"
          :get-feedback="getQuestionFeedback"
          @proceed="proceedToActivitySubmission"
        />
      </template>
    </div>

    <!-- ============================================================ -->
    <!-- STEP 4: SUBMIT YOUR ACTIVITY                                 -->
    <!-- ============================================================ -->
    <div v-else-if="currentStep === 4" class="step-content-card">
      <div class="activity-upload-section">
        <!-- Step Header -->
        <div class="activity-header">
          <span class="step-badge">Step 4</span>
          <h2 class="activity-title">Submit Your Activity</h2>
          <p class="activity-desc">
            Upload photos of your written answers or a PDF file.
          </p>
        </div>

        <!-- Toast Feedback Alert -->
        <transition name="fade">
          <div v-if="toastMessage" class="files-toast-alert" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{{ toastMessage }}</span>
          </div>
        </transition>

        <!-- Finalized Notice if Teacher checked work -->
        <div v-if="isReviewFinalized" class="review-finalized-banner">
          <div class="banner-icon-col">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="banner-text-col">
            <h3 class="banner-title">Review Finalized</h3>
            <p class="banner-subtext">Your teacher has checked your work. You cannot change these files now.</p>
          </div>
        </div>

        <!-- Submission Closed Notice if Deadline Passed (and review not finalized) -->
        <div v-else-if="isSubmissionClosed" class="submission-closed-banner">
          <div class="banner-icon-col">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="banner-text-col">
            <h3 class="banner-title">Submission Closed</h3>
            <p class="banner-subtext">The deadline has passed. You can still view your submitted files, but you can no longer make changes.</p>
          </div>
        </div>

        <!-- Success Message if Submitted & Not Finalized & Not Closed -->
        <div v-else-if="progress.activitySubmitted" class="sent-success-banner">
          <div class="banner-icon-col">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="8 12 11 15 16 9"/>
            </svg>
          </div>
          <div class="banner-text-col">
            <h3 class="sent-title">Activity Submitted!</h3>
            <p class="sent-subtext">Your teacher can now check your work.</p>
          </div>
        </div>

        <!-- File Upload Area (Dropzone) if Not Submitted Yet and Not Closed -->
        <div
          v-if="!progress.activitySubmitted && !isSubmissionClosed"
          class="dropzone-box"
          :class="{ 'is-dragging': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDropFiles"
          @click="triggerFileInput"
        >
          <input
            type="file"
            ref="fileInputRef"
            style="display: none;"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            multiple
            @change="onFilesSelected"
          />

          <div class="dropzone-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>

          <div class="dropzone-main-text">
            <strong>Tap to select files</strong> or take photo
          </div>
          <div class="dropzone-sub-text">
            Supports JPG, JPEG, PNG, and PDF (Up to 15MB each)
          </div>
        </div>

        <!-- Validation Error Message -->
        <div v-if="uploadError" class="upload-error-alert">
          {{ uploadError }}
        </div>

        <!-- Section: Your Uploaded Files -->
        <div v-if="displayFilesList.length > 0" class="selected-files-container">
          <h3 class="files-heading">Your Uploaded Files ({{ displayFilesList.length }})</h3>

          <div class="files-grid">
            <div
              v-for="f in displayFilesList"
              :key="`file-${f.index}-${f.name}`"
              class="file-item-card"
              role="button"
              tabindex="0"
              :aria-label="`View ${f.name}`"
              @click="handleViewFile(f)"
              @keydown.enter="handleViewFile(f)"
              @keydown.space.prevent="handleViewFile(f)"
            >
              <!-- Thumbnail / File Icon -->
              <div class="file-thumb-wrap">
                <img
                  v-if="isImageFile(f) && (f.previewUrl || f.fileUrl)"
                  :src="f.previewUrl || resolveFileUrl(f.fileUrl)"
                  :alt="f.name"
                  class="file-img-preview"
                />
                <div v-else class="file-pdf-thumb">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span class="pdf-tag">PDF</span>
                </div>
              </div>

              <!-- Metadata -->
              <div class="file-details">
                <span class="file-name" :title="f.name">{{ f.name }}</span>
                <span class="file-size">{{ formatFileSize(f.size) }}</span>
              </div>

              <!-- One Three-Dot Menu (NO separate eye icon) -->
              <div class="file-menu-wrap" @click.stop>
                <button
                  type="button"
                  class="three-dot-btn"
                  :aria-expanded="activeMenuFileIndex === f.index"
                  aria-label="File options"
                  @click.stop="toggleFileMenu(f.index)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>

                <div
                  v-if="activeMenuFileIndex === f.index"
                  class="file-dropdown-menu"
                >
                  <button
                    type="button"
                    class="menu-action-item"
                    @click="handleViewFile(f)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span>View File</span>
                  </button>

                  <button
                    v-if="!isReviewFinalized && !isSubmissionClosed"
                    type="button"
                    class="menu-action-item"
                    @click="promptReplaceFile(f.index)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 2v6h-6"/>
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                      <path d="M3 22v-6h6"/>
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                    </svg>
                    <span>Replace File</span>
                  </button>

                  <button
                    v-if="!isReviewFinalized && !isSubmissionClosed"
                    type="button"
                    class="menu-action-item item-danger"
                    @click="promptRemoveFile(f.index)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    <span>Remove File</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hidden Inputs for File Actions -->
        <input
          type="file"
          ref="replaceFileInputRef"
          style="display: none;"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          @change="onReplaceFileSelected"
        />
        <input
          type="file"
          ref="addMoreFileInputRef"
          style="display: none;"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          multiple
          @change="onAddMoreFilesSelected"
        />
        <!-- Action Buttons Area -->
        <div class="activity-actions">
          <!-- When Not Submitted Yet: Initial Submit Button -->
          <div v-if="!progress.activitySubmitted" class="submitted-actions-wrap">
            <div
              v-if="isSubmissionClosed"
              class="submission-closed-indicator"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Submission Closed</span>
            </div>
            <button
              v-else
              type="button"
              class="btn-primary submit-activities-btn"
              :disabled="selectedFiles.length === 0 || isSubmittingActivity"
              @click="handleSubmitActivities"
            >
              <span v-if="isSubmittingActivity">Submitting Activity...</span>
              <span v-else>Submit Activity</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            <!-- Bottom Go Back Button directly below Submit Activity -->
            <button
              type="button"
              class="btn-bottom-go-back"
              @click="goToOverview"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Go Back</span>
            </button>
          </div>

          <!-- When Already Submitted -->
          <div v-else class="submitted-actions-wrap">
            <!-- Add More Files Button (if review not finalized and not closed) -->
            <button
              v-if="!isReviewFinalized && !isSubmissionClosed"
              type="button"
              class="btn-primary add-more-btn"
              :disabled="isUpdatingFiles"
              @click="triggerAddFiles"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Add More Files</span>
            </button>

            <!-- Clear Submission Closed indicator if deadline passed and not finalized -->
            <div
              v-else-if="isSubmissionClosed && !isReviewFinalized"
              class="submission-closed-indicator"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Submission Closed</span>
            </div>

            <!-- Bottom Go Back Button directly below Add More Files / Submission Closed -->
            <button
              type="button"
              class="btn-bottom-go-back"
              @click="goToOverview"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- Confirmation Modal: Remove File -->
    <div v-if="fileToRemove !== null" class="custom-modal-overlay" @click.self="cancelRemoveFile">
      <div class="custom-modal-box" role="dialog" aria-modal="true" aria-labelledby="remove-modal-title">
        <h3 id="remove-modal-title" class="custom-modal-title">Remove this file?</h3>
        <p class="custom-modal-text">Are you sure you want to remove this file?</p>
        <div class="custom-modal-actions">
          <button
            type="button"
            class="modal-btn modal-cancel-btn"
            @click="cancelRemoveFile"
          >
            Cancel
          </button>
          <button
            type="button"
            class="modal-btn modal-danger-btn"
            :disabled="isUpdatingFiles"
            @click="confirmRemoveFile"
          >
            <span v-if="isUpdatingFiles">Removing...</span>
            <span v-else>Remove File</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal: Unsaved Files Before Leaving Module -->
    <div v-if="showUnsavedLeaveModal" class="custom-modal-overlay" @click.self="cancelLeaveModule">
      <div class="custom-modal-box" role="dialog" aria-modal="true" aria-labelledby="unsaved-modal-title">
        <h3 id="unsaved-modal-title" class="custom-modal-title">Discard unsaved files?</h3>
        <p class="custom-modal-text">
          You have selected activity file(s) that have not been submitted yet. Leaving this module will discard these files.
        </p>
        <div class="custom-modal-actions">
          <button
            type="button"
            class="modal-btn modal-cancel-btn"
            @click="cancelLeaveModule"
          >
            Stay
          </button>
          <button
            type="button"
            class="modal-btn modal-danger-btn"
            @click="confirmLeaveModule"
          >
            Discard &amp; Leave
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal: View File -->
    <div v-if="previewingFile" class="custom-modal-overlay" @click.self="closeFilePreview">
      <div class="preview-modal-box" role="dialog" aria-modal="true">
        <div class="preview-modal-header">
          <span class="preview-file-title" :title="previewingFile.name">{{ previewingFile.name }}</span>
          <button
            type="button"
            class="preview-close-btn"
            @click="closeFilePreview"
            aria-label="Close preview"
          >
            &times;
          </button>
        </div>
        <div class="preview-modal-body">
          <img
            v-if="isImageFile(previewingFile)"
            :src="previewingFile.previewUrl || resolveFileUrl(previewingFile.fileUrl)"
            :alt="previewingFile.name"
            class="preview-img-full"
          />
          <div v-else class="preview-doc-box">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p class="preview-doc-name">{{ previewingFile.name }}</p>
            <p class="preview-doc-sub">{{ formatFileSize(previewingFile.size) }}</p>
            <a
              v-if="previewingFile.fileUrl"
              :href="resolveFileUrl(previewingFile.fileUrl)"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-primary open-in-tab-btn"
            >
              Open Document in New Tab
            </a>
          </div>
        </div>
        <div class="preview-modal-footer">
          <button
            type="button"
            class="modal-btn modal-cancel-btn"
            @click="closeFilePreview"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import api from '../api/axios';
import MockPdfViewer from '../components/MockPdfViewer.vue';
import AssessmentResultsReview from '../components/AssessmentResultsReview.vue';
import {
  calculateReadingProgressPercent,
  isReadingStepCompleted,
  calculateOverallModuleProgress
} from '../utils/moduleProgress.js';
import {
  formatStrandCode,
  formatStrandName,
  formatStrandAndCode,
} from '../utils/formatStrand.js';
import {
  MOCK_MODULE,
  PRE_TEST_QUESTIONS,
  POST_TEST_QUESTIONS,
  loadMockProgress,
  saveMockProgress
} from '../data/mockModuleData';

const props = defineProps({
  moduleId: {
    type: [String, Number],
    default: null
  }
});

const route = useRoute();
const router = useRouter();

const effectiveModuleId = computed(() => {
  return props.moduleId || route.params.id;
});

const isMock = computed(() => false);

// Loading & error state
const isLoading = ref(false);
const loadError = ref('');
const moduleData = ref(null);
const realPreTest = ref(null);
const realPostTest = ref(null);
const rawPreQuestions = ref([]);
const rawPostQuestions = ref([]);
const isSubmittingActivity = ref(false);

function getChoiceLetter(idx) {
  return idx >= 0 && idx < 26 ? String.fromCharCode(65 + idx) : String(idx + 1);
}

function normalizeQuestion(q, index) {
  const isCheckbox = q.questionType === 'CHECKBOX' || q.type === 'CHECKBOX' || q.isMultipleSelect === true;
  if (q.options && q.options[0]?.text && q.correctAnswer !== undefined) {
    return {
      id: q.id,
      question: q.question || q.questionText,
      questionType: isCheckbox ? 'CHECKBOX' : (q.questionType || 'MULTIPLE_CHOICE'),
      options: q.options.map((opt, oIdx) => ({
        id: opt.id,
        letter: opt.letter || (typeof opt.id === 'string' && opt.id.length === 1 ? opt.id : getChoiceLetter(oIdx)),
        text: opt.text || opt.optionText,
        rawId: opt.rawId || opt.id,
        isCorrect: opt.isCorrect ?? (opt.id === q.correctAnswer)
      })),
      correctAnswer: q.correctAnswer,
      correctFeedback: q.correctFeedback ? String(q.correctFeedback).trim() : '',
      incorrectFeedback: q.incorrectFeedback ? String(q.incorrectFeedback).trim() : '',
      feedback: q.feedback || q.explanation || (q.options.find((o) => o.isCorrect || o.id === q.correctAnswer)?.text ? `The correct answer is: ${q.options.find((o) => o.isCorrect || o.id === q.correctAnswer)?.text}` : 'Review the module lessons to understand this concept.')
    };
  }

  const opts = Array.isArray(q.options) ? q.options : [];
  const correctOpt = opts.find((o) => o.isCorrect);
  const correctOptId = correctOpt ? correctOpt.id : (opts[0]?.id || 1);

  return {
    id: q.id,
    question: q.questionText || q.prompt || `Question ${index + 1}`,
    questionType: isCheckbox ? 'CHECKBOX' : (q.questionType || 'MULTIPLE_CHOICE'),
    options: opts.map((o, oIdx) => ({
      id: o.id,
      letter: getChoiceLetter(oIdx),
      text: o.optionText || o.text || '',
      rawId: o.id,
      isCorrect: Boolean(o.isCorrect)
    })),
    correctAnswer: correctOptId,
    correctFeedback: q.correctFeedback ? String(q.correctFeedback).trim() : '',
    incorrectFeedback: q.incorrectFeedback ? String(q.incorrectFeedback).trim() : '',
    feedback: q.explanation?.trim() || (correctOpt?.optionText ? `The correct answer is: ${correctOpt.optionText}` : 'Correct answer verified.')
  };
}

function getQuestionFeedback(q, isCorrect) {
  if (!q) return '';
  if (isCorrect && q.correctFeedback && String(q.correctFeedback).trim()) {
    return String(q.correctFeedback).trim();
  }
  if (!isCorrect && q.incorrectFeedback && String(q.incorrectFeedback).trim()) {
    return String(q.incorrectFeedback).trim();
  }
  return q.feedback || '';
}

// Progress State
function getStorageKey() {
  return isMock.value ? 'als_ls2_mock_progress' : `als_module_progress_${effectiveModuleId.value}`;
}

function loadProgress() {
  if (isMock.value) {
    return loadMockProgress();
  }
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      const pagesReadArr = Array.isArray(parsed.pagesRead)
        ? Array.from(new Set(parsed.pagesRead.map(Number).filter(n => n > 0))).sort((a, b) => a - b)
        : [];
      const totalPages = Number(parsed.pdfTotalPages) || 29;
      const isReadingComplete = Boolean(totalPages > 0 && pagesReadArr.length >= totalPages);

      return {
        currentStep: parsed.currentStep !== undefined ? parsed.currentStep : 0,
        highestUnlockedStep: parsed.highestUnlockedStep || 1,
        preTestCompleted: Boolean(parsed.preTestCompleted),
        preTestScore: parsed.preTestScore != null ? Number(parsed.preTestScore) : null,
        preTestAnswers: parsed.preTestAnswers || {},
        readingStarted: Boolean(parsed.readingStarted || pagesReadArr.length > 0),
        readingConfirmed: isReadingComplete,
        pdfCurrentPage: parsed.pdfCurrentPage || 1,
        pdfTotalPages: totalPages,
        pdfViewMode: parsed.pdfViewMode || 'long',
        pagesRead: pagesReadArr,
        completedPages: pagesReadArr.length,
        postTestCompleted: Boolean(parsed.postTestCompleted),
        postTestScore: parsed.postTestScore != null ? Number(parsed.postTestScore) : null,
        postTestAnswers: parsed.postTestAnswers || {},
        activitySubmitted: Boolean(parsed.activitySubmitted),
        submittedFilesMeta: Array.isArray(parsed.submittedFilesMeta) ? parsed.submittedFilesMeta : [],
        completedAt: parsed.completedAt || null
      };
    }
  } catch (e) {
    console.warn('Could not read module progress from storage:', e);
  }
  return {
    currentStep: 0,
    highestUnlockedStep: 1,
    preTestCompleted: false,
    preTestScore: null,
    preTestAnswers: {},
    readingStarted: false,
    readingConfirmed: false,
    pdfCurrentPage: 1,
    pdfTotalPages: 29,
    pdfViewMode: 'long',
    pagesRead: [],
    completedPages: 0,
    postTestCompleted: false,
    postTestScore: null,
    postTestAnswers: {},
    activitySubmitted: false,
    submittedFilesMeta: [],
    completedAt: null
  };
}

function saveProgress(val, notify = true) {
  const p = val || progress.value;
  if (isMock.value) {
    saveMockProgress(p);
  } else {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(p));
    } catch (e) {
      console.warn('Could not save module progress to storage:', e);
    }
  }
  if (notify) {
    try {
      window.dispatchEvent(
        new CustomEvent('als-progress-updated', {
          detail: { moduleId: effectiveModuleId?.value, progress: p }
        })
      );
    } catch (e) {}
  }
}

const progress = ref(loadProgress());
const currentStep = ref(progress.value.currentStep !== undefined ? progress.value.currentStep : 0);

// Overview Progress Computed Values
const readingProgressPercent = computed(() => {
  const total = Number(progress.value.pdfTotalPages) || Number(moduleData.value?._count?.pages) || 29;
  const count = Array.isArray(progress.value.pagesRead)
    ? progress.value.pagesRead.length
    : (Number(progress.value.completedPages) || 0);

  return calculateReadingProgressPercent(count, total);
});

const computedProgressPercentage = computed(() => {
  const total = Number(progress.value.pdfTotalPages) || Number(moduleData.value?._count?.pages) || 29;
  const count = Array.isArray(progress.value.pagesRead)
    ? progress.value.pagesRead.length
    : (Number(progress.value.completedPages) || 0);
  const curPage = Number(progress.value.pdfCurrentPage) || 1;
  const preDone = isStepCompleted(1);
  const postDone = isStepCompleted(3);
  const actDone = isStepCompleted(4);
  const isFullDone = Boolean(progress.value.completedAt && actDone && postDone && preDone);

  return calculateOverallModuleProgress({
    preTestCompleted: preDone,
    currentPage: curPage,
    highestPageReached: count,
    totalPages: total,
    postTestCompleted: postDone,
    activitySubmitted: actDone,
    isLegitimateFullCompletion: isFullDone
  });
});

const currentActiveStep = computed(() => {
  if (!isStepCompleted(1)) return 1;
  if (!isStepCompleted(2)) return 2;
  if (!isStepCompleted(3)) return 3;
  if (!isStepCompleted(4)) return 4;
  return null;
});

function getSubpageTitle(step) {
  if (step === 1) return "Pre-Test (Let's See What You Already Know)";
  if (step === 2) return 'Read the Module';
  if (step === 3) return "Post-Test (What Have You Learned?)";
  if (step === 4) return 'Submit Your Activity';
  return '';
}

const overallStatusLabel = computed(() => {
  if (computedProgressPercentage.value === 100) return 'Completed';
  if (computedProgressPercentage.value > 0) return 'In Progress';
  return 'Not Started';
});

const overallStatusClass = computed(() => {
  if (computedProgressPercentage.value === 100) return 'status-completed';
  if (computedProgressPercentage.value > 0) return 'status-in-progress';
  return 'status-not-started';
});

function goToOverview() {
  currentStep.value = 0;
  progress.value.currentStep = 0;
  saveProgress();
  if (router && effectiveModuleId.value && router.currentRoute?.value?.path !== `/modules/${effectiveModuleId.value}`) {
    router.push(`/modules/${effectiveModuleId.value}`);
  }
}

function goToStep(stepNum) {
  if (!isStepUnlocked(stepNum)) return;
  currentStep.value = stepNum;
  progress.value.currentStep = stepNum;
  if (stepNum === 2) {
    progress.value.readingStarted = true;
  }
  saveProgress();
}

// Step 1: Pre-test state
const currentPreQIndex = ref(0);
const selectedPreAnswer = ref('');
const isPreSubmitted = ref(false);
const showingPreTestScore = ref(false);

// Step 3: Post-test state
const currentPostQIndex = ref(0);
const selectedPostAnswer = ref('');
const isPostSubmitted = ref(false);
const showingPostTestScore = ref(false);

const isPreTestResultsView = computed(() => {
  return currentStep.value === 1 && Boolean(progress.value.preTestCompleted || showingPreTestScore.value);
});

const isPostTestResultsView = computed(() => {
  return currentStep.value === 3 && Boolean(progress.value.postTestCompleted || showingPostTestScore.value);
});

const isAssessmentResultsView = computed(() => {
  return isPreTestResultsView.value || isPostTestResultsView.value;
});

// Step 4: Activity submission & correction state
const fileInputRef = ref(null);
const replaceFileInputRef = ref(null);
const addMoreFileInputRef = ref(null);
const selectedFiles = ref([]);
const isDragging = ref(false);
const uploadError = ref('');
const isReviewingPdfOutside = ref(false);
const submissionRecord = ref(null);
const activeMenuFileIndex = ref(null);
const previewingFile = ref(null);
const fileToRemove = ref(null);
const isUpdatingFiles = ref(false);
const toastMessage = ref('');
const replaceTargetIndex = ref(null);
const deadlinePassedOverride = ref(false);

const isSubmissionClosed = computed(() => {
  if (isMock.value) return false;
  if (deadlinePassedOverride.value) return true;
  if (moduleData.value?.isSubmissionClosed) return true;
  if (submissionRecord.value?.isSubmissionClosed) return true;

  const rawDeadline =
    moduleData.value?.dueDate ||
    moduleData.value?.submissionDeadline ||
    moduleData.value?.dateEnded ||
    submissionRecord.value?.dueDate ||
    submissionRecord.value?.dateEnded;

  if (!rawDeadline) return false;

  try {
    const rawStr = String(rawDeadline).trim();
    const ymd = rawStr.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      // End of day in Asia/Manila (UTC+8) is 23:59:59.999+08:00
      const deadlineDate = new Date(`${ymd}T23:59:59.999+08:00`);
      return Date.now() > deadlineDate.getTime();
    }
    const d = new Date(rawDeadline);
    if (!isNaN(d.getTime())) {
      return Date.now() > d.getTime();
    }
  } catch (err) {
    console.warn('Error evaluating submission deadline:', err);
  }
  return false;
});

function showToast(msg) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = '';
    }
  }, 3500);
}

function handleDocumentClick(e) {
  if (!e.target?.closest || !e.target.closest('.file-menu-wrap')) {
    activeMenuFileIndex.value = null;
  }
}

const showUnsavedLeaveModal = ref(false);
let pendingLeaveCallback = null;

function handleModulesBackClick(event) {
  if (selectedFiles.value && selectedFiles.value.length > 0) {
    if (event) event.preventDefault();
    pendingLeaveCallback = () => {
      router.push('/modules');
    };
    showUnsavedLeaveModal.value = true;
  }
}

function cancelLeaveModule() {
  showUnsavedLeaveModal.value = false;
  pendingLeaveCallback = null;
}

function confirmLeaveModule() {
  for (const f of selectedFiles.value) {
    if (f && f.previewUrl) {
      try {
        URL.revokeObjectURL(f.previewUrl);
      } catch (_) {}
    }
  }
  selectedFiles.value = [];
  showUnsavedLeaveModal.value = false;
  if (pendingLeaveCallback) {
    const cb = pendingLeaveCallback;
    pendingLeaveCallback = null;
    cb();
  }
}

function handleBeforeUnload(e) {
  if (selectedFiles.value && selectedFiles.value.length > 0) {
    e.preventDefault();
    e.returnValue = '';
  }
}

onMounted(() => {
  window.addEventListener('click', handleDocumentClick);
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

onBeforeRouteLeave((to, from, next) => {
  if (selectedFiles.value && selectedFiles.value.length > 0 && !showUnsavedLeaveModal.value) {
    pendingLeaveCallback = () => next();
    showUnsavedLeaveModal.value = true;
    next(false);
  } else {
    next();
  }
});

const isReviewFinalized = computed(() => {
  if (isMock.value) return false;
  const sub = submissionRecord.value;
  if (!sub) return false;
  if (sub.isReviewFinalized) return true;
  const st = String(sub.status || '').toLowerCase().replace(/_/g, ' ').trim();
  if (st === 'graded' || st === 'mastered' || st === 'not mastered' || st === 'completed') {
    return true;
  }
  if (sub.grade != null && String(sub.grade).trim() !== '') {
    return true;
  }
  return false;
});

function resolveFileUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (apiUrl && apiUrl.startsWith('http')) {
    const root = apiUrl.replace(/\/api\/?$/, '');
    return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
}

function isImageFile(f) {
  if (!f) return false;
  const type = String(f.type || f.fileType || f.mimeType || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  const name = String(f.name || f.fileName || f.fileUrl || '').toLowerCase();
  return (
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.gif')
  );
}

const displayFilesList = computed(() => {
  if (progress.value.activitySubmitted && Array.isArray(progress.value.submittedFilesMeta) && progress.value.submittedFilesMeta.length > 0) {
    return progress.value.submittedFilesMeta.map((f, idx) => ({
      index: idx,
      name: f.name || f.fileName || `Activity File ${idx + 1}`,
      size: f.size || f.fileSize || 0,
      type: f.type || f.fileType || f.mimeType || '',
      fileUrl: f.fileUrl || '',
      previewUrl: f.previewUrl || (f.fileUrl ? resolveFileUrl(f.fileUrl) : null),
      isSaved: true
    }));
  }
  return selectedFiles.value.map((f, idx) => ({
    index: idx,
    name: f.name,
    size: f.size,
    type: f.type,
    fileUrl: '',
    previewUrl: f.previewUrl,
    isSaved: false
  }));
});

function toggleFileMenu(idx) {
  activeMenuFileIndex.value = activeMenuFileIndex.value === idx ? null : idx;
}

function handleViewFile(file) {
  activeMenuFileIndex.value = null;
  previewingFile.value = file;
}

function closeFilePreview() {
  previewingFile.value = null;
}

function promptReplaceFile(idx) {
  activeMenuFileIndex.value = null;
  if (isReviewFinalized.value || isSubmissionClosed.value) return;
  replaceTargetIndex.value = idx;
  if (replaceFileInputRef.value) {
    replaceFileInputRef.value.value = '';
    replaceFileInputRef.value.click();
  }
}

function promptRemoveFile(idx) {
  activeMenuFileIndex.value = null;
  if (isReviewFinalized.value || isSubmissionClosed.value) return;
  fileToRemove.value = idx;
}

function cancelRemoveFile() {
  fileToRemove.value = null;
}

const steps = [
  { step: 1, label: "Pre-Test (Let's See What You Already Know)" },
  { step: 2, label: 'Learning Module' },
  { step: 3, label: "Post-Test (What Have You Learned?)" },
  { step: 4, label: 'Submit Your Activity' }
];

// Computed Questions
const preTestQuestions = computed(() => {
  if (isMock.value) return PRE_TEST_QUESTIONS;
  return rawPreQuestions.value.map((q, idx) => normalizeQuestion(q, idx));
});

const postTestQuestions = computed(() => {
  if (isMock.value) return POST_TEST_QUESTIONS;
  return rawPostQuestions.value.map((q, idx) => normalizeQuestion(q, idx));
});

function isCheckboxQuestion(q) {
  if (!q) return false;
  const t = String(q.questionType || q.type || '').toUpperCase();
  return t === 'CHECKBOX' || t === 'MULTIPLE_SELECT' || q.isMultipleSelect === true;
}

function isOptionSelectedPre(optId) {
  if (Array.isArray(selectedPreAnswer.value)) {
    return selectedPreAnswer.value.includes(optId);
  }
  return selectedPreAnswer.value === optId;
}

function isOptionSelectedPost(optId) {
  if (Array.isArray(selectedPostAnswer.value)) {
    return selectedPostAnswer.value.includes(optId);
  }
  return selectedPostAnswer.value === optId;
}

const currentPreQ = computed(() => preTestQuestions.value[currentPreQIndex.value] || preTestQuestions.value[0] || {});

const hasNoPreAnswer = computed(() => {
  if (Array.isArray(selectedPreAnswer.value)) {
    return selectedPreAnswer.value.length === 0;
  }
  return !selectedPreAnswer.value;
});

const isPreAnswerCorrect = computed(() => {
  if (isCheckboxQuestion(currentPreQ.value)) {
    const userAns = Array.isArray(selectedPreAnswer.value) ? [...selectedPreAnswer.value].map(String).sort() : [String(selectedPreAnswer.value)];
    const correctAns = Array.isArray(currentPreQ.value.correctAnswer) ? [...currentPreQ.value.correctAnswer].map(String).sort() : [String(currentPreQ.value.correctAnswer)];
    return userAns.length === correctAns.length && userAns.every((val, i) => val === correctAns[i]);
  }
  return selectedPreAnswer.value === currentPreQ.value.correctAnswer;
});

const currentPostQ = computed(() => postTestQuestions.value[currentPostQIndex.value] || postTestQuestions.value[0] || {});

const hasNoPostAnswer = computed(() => {
  if (Array.isArray(selectedPostAnswer.value)) {
    return selectedPostAnswer.value.length === 0;
  }
  return !selectedPostAnswer.value;
});

const isPostAnswerCorrect = computed(() => {
  if (isCheckboxQuestion(currentPostQ.value)) {
    const userAns = Array.isArray(selectedPostAnswer.value) ? [...selectedPostAnswer.value].map(String).sort() : [String(selectedPostAnswer.value)];
    const correctAns = Array.isArray(currentPostQ.value.correctAnswer) ? [...currentPostQ.value.correctAnswer].map(String).sort() : [String(currentPostQ.value.correctAnswer)];
    return userAns.length === correctAns.length && userAns.every((val, i) => val === correctAns[i]);
  }
  return selectedPostAnswer.value === currentPostQ.value.correctAnswer;
});

// Dynamic Module Metadata
const moduleTitle = computed(() => {
  if (isMock.value) return MOCK_MODULE.title;
  return moduleData.value?.title || 'Learning Module';
});

const moduleCode = computed(() => {
  if (isMock.value) return MOCK_MODULE.code;
  return moduleData.value?.code || moduleData.value?.moduleCode || `MOD-${effectiveModuleId.value}`;
});

const moduleStrandCode = computed(() => {
  if (isMock.value) return formatStrandCode(MOCK_MODULE.strandCode);
  const candidate =
    moduleData.value?.learningArea?.code ||
    (moduleData.value?.code && /^LS/i.test(moduleData.value.code) ? moduleData.value.code : null) ||
    moduleData.value?.strandCode ||
    moduleData.value?.code ||
    'LS';
  return formatStrandCode(candidate);
});

const moduleSubheading = computed(() => {
  if (isMock.value) return formatStrandName(MOCK_MODULE.strand, MOCK_MODULE.strandCode);
  const raw = moduleData.value?.learningArea?.name || moduleData.value?.strand || 'General Curriculum';
  return formatStrandName(raw, moduleData.value?.learningArea?.code || moduleStrandCode.value);
});

const strandAndCodeText = computed(() => {
  const code = moduleStrandCode.value;
  const name = moduleSubheading.value;
  if (code && name && code !== 'LS') {
    return `${code} · ${name}`;
  }
  return name || code || '';
});

const moduleInstructions = computed(() => {
  if (isMock.value) return (MOCK_MODULE.instructions || MOCK_MODULE.description || '').trim();
  const raw = moduleData.value?.instructions || moduleData.value?.description || '';
  return String(raw).trim();
});

const moduleReadingInstructions = computed(() => {
  if (isMock.value) return (MOCK_MODULE.readingInstructions || MOCK_MODULE.learningNotes || '').trim();
  const raw = moduleData.value?.readingInstructions ?? moduleData.value?.learningNotes ?? '';
  return String(raw).trim();
});

const pdfUrl = computed(() => {
  if (isMock.value) return MOCK_MODULE.fileUrl;
  const rawUrl = moduleData.value?.fileUrl;
  if (!rawUrl) return '/modules/animals-love-them-and-care-for-them.pdf';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('/')) {
    return rawUrl;
  }
  return `/${rawUrl}`;
});

const moduleDownloadFileName = computed(() => {
  if (moduleData.value?.downloadFileName) {
    return moduleData.value.downloadFileName;
  }
  const rawTitle = String(moduleTitle.value || 'Learning_Module')
    .trim()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const rawStrand = String(moduleStrandCode.value || '').trim().toUpperCase();
  const lsMatch = rawStrand.match(/^LS\d+/i);
  const cleanStrand = lsMatch
    ? lsMatch[0].toUpperCase()
    : rawStrand.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const baseTitle = rawTitle || 'Learning_Module';
  if (
    cleanStrand &&
    !baseTitle.toUpperCase().endsWith(`_${cleanStrand}`) &&
    baseTitle.toUpperCase() !== cleanStrand
  ) {
    return `${baseTitle}_${cleanStrand}.pdf`;
  }
  return `${baseTitle}.pdf`;
});

const preTestTotal = computed(() => {
  return preTestQuestions.value.length || 10;
});

const postTestTotal = computed(() => {
  return postTestQuestions.value.length || 10;
});

const preTestPercent = computed(() => {
  const tot = preTestTotal.value || 1;
  const sc = progress.value.preTestScore ?? 0;
  return Math.round((sc / tot) * 100);
});

const postTestPercent = computed(() => {
  const tot = postTestTotal.value || 1;
  const sc = progress.value.postTestScore ?? 0;
  return Math.round((sc / tot) * 100);
});

// Score Improvement calculation (Post score - Pre score in percentage points)
const scoreImprovement = computed(() => {
  const preTot = preTestTotal.value || 1;
  const postTot = postTestTotal.value || 1;
  const prePct = Math.round(((progress.value.preTestScore || 0) / preTot) * 100);
  const postPct = Math.round(((progress.value.postTestScore || 0) / postTot) * 100);
  return postPct - prePct;
});

// Step unlock and completion logic
function isStepCompleted(stepNum) {
  if (stepNum === 1) return Boolean(progress.value.preTestCompleted || preTestQuestions.value.length === 0);
  if (stepNum === 2) {
    const total = Number(progress.value.pdfTotalPages) || Number(moduleData.value?._count?.pages) || 29;
    const count = Array.isArray(progress.value.pagesRead)
      ? progress.value.pagesRead.length
      : (Number(progress.value.completedPages) || 0);
    const isFullDone = Boolean(progress.value.completedAt && progress.value.activitySubmitted && progress.value.postTestCompleted);
    const isPostDone = Boolean(progress.value.postTestCompleted);
    return isReadingStepCompleted(count, total, isFullDone, isPostDone);
  }
  if (stepNum === 3) return Boolean(progress.value.postTestCompleted || postTestQuestions.value.length === 0);
  if (stepNum === 4) return Boolean(progress.value.activitySubmitted);
  return false;
}

function isStepUnlocked(stepNum) {
  if (stepNum === 1) return true;
  if (stepNum === 2) return isStepCompleted(1);
  if (stepNum === 3) return isStepCompleted(2) || (progress.value.highestUnlockedStep || 1) >= 3 || Boolean(progress.value.postTestCompleted);
  if (stepNum === 4) return isStepCompleted(3) || (progress.value.highestUnlockedStep || 1) >= 4 || Boolean(progress.value.activitySubmitted);
  return false;
}

function onStepClick(stepNum) {
  if (!isStepUnlocked(stepNum)) return;
  currentStep.value = stepNum;
  progress.value.currentStep = stepNum;
  if (stepNum === 2) {
    progress.value.readingStarted = true;
  }
  saveProgress();
}

// ==========================================
// PRE-TEST LOGIC
// ==========================================
function onSelectPreAnswer(optId) {
  if (isPreSubmitted.value) return;
  if (isCheckboxQuestion(currentPreQ.value)) {
    const list = Array.isArray(selectedPreAnswer.value)
      ? [...selectedPreAnswer.value]
      : (selectedPreAnswer.value ? [selectedPreAnswer.value] : []);
    const idx = list.indexOf(optId);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(optId);
    }
    selectedPreAnswer.value = list;
  } else {
    selectedPreAnswer.value = optId;
  }
}

function submitPreAnswer() {
  if (hasNoPreAnswer.value) return;
  isPreSubmitted.value = true;

  // Record answer locally
  progress.value.preTestAnswers[currentPreQ.value.id] = selectedPreAnswer.value;
  saveProgress();
}

async function nextPreQuestion() {
  if (currentPreQIndex.value + 1 < preTestQuestions.value.length) {
    currentPreQIndex.value += 1;
    isPreSubmitted.value = false;
    selectedPreAnswer.value = progress.value.preTestAnswers[currentPreQ.value.id] || '';
  } else {
    // Finish Pre-test & calculate score locally
    let score = 0;
    preTestQuestions.value.forEach((q) => {
      if (progress.value.preTestAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    progress.value.preTestScore = score;
    progress.value.preTestCompleted = true;
    progress.value.highestUnlockedStep = Math.max(progress.value.highestUnlockedStep || 1, 2);
    saveProgress();
    showingPreTestScore.value = true;

    // Submit attempt to backend if real module
    if (!isMock.value && realPreTest.value?.id) {
      try {
        const res = await api.post(`/modules/${effectiveModuleId.value}/attempt`, {
          assessmentId: realPreTest.value.id,
          answers: progress.value.preTestAnswers
        });
        if (res.data?.score != null) {
          progress.value.preTestScore = res.data.score;
          saveProgress();
        }
      } catch (err) {
        console.warn('Could not sync pre-test attempt to server:', err);
      }
    }
  }
}

function proceedToModuleReader() {
  currentStep.value = 2;
  progress.value.currentStep = 2;
  progress.value.readingStarted = true;
  saveProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!isMock.value) {
    const isCompleted = Boolean(
      (progress.value.postTestCompleted || isStepCompleted(3)) &&
      (progress.value.activitySubmitted || isStepCompleted(4))
    );
    api.post(`/modules/${effectiveModuleId.value}/progress`, {
      status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      completedPages: progress.value.pdfCurrentPage || 1,
      totalPages: Number(progress.value.pdfTotalPages) || 29
    }).catch(() => {});
  }
}

// ==========================================
// PDF VIEWER EVENTS
// ==========================================
let syncTimeout = null;
let isSyncingProgress = false;
let pendingSyncPayload = null;

function syncReadingProgressToBackend() {
  if (isMock.value) return;
  const currentTotal = Number(progress.value.pdfTotalPages) || moduleData.value?._count?.pages || 29;
  const currentPagesRead = progress.value.pagesRead || [];
  const currentCompleted = currentPagesRead.length;
  const curPage = Number(progress.value.pdfCurrentPage) || 1;
  const isDone = Boolean(currentTotal > 0 && currentCompleted >= currentTotal);

  const payload = {
    status: isDone ? 'COMPLETED' : 'IN_PROGRESS',
    completedPages: currentCompleted,
    currentPage: curPage,
    totalPages: currentTotal,
    pagesRead: currentPagesRead,
    viewMode: progress.value.pdfViewMode || 'long'
  };

  if (isSyncingProgress) {
    pendingSyncPayload = payload;
    return;
  }

  isSyncingProgress = true;
  api.post(`/modules/${effectiveModuleId.value}/progress`, payload).then((res) => {
    if (res.data?.pagesRead && Array.isArray(res.data.pagesRead)) {
      const serverPages = Array.from(new Set(res.data.pagesRead.map(Number).filter(n => n > 0))).sort((a, b) => a - b);
      const merged = Array.from(new Set([...(progress.value.pagesRead || []), ...serverPages])).sort((a, b) => a - b);
      progress.value.pagesRead = merged;
      progress.value.completedPages = merged.length;
      progress.value.readingConfirmed = Boolean(currentTotal > 0 && merged.length >= currentTotal);
      saveProgress(progress.value, false);
    }
  }).catch((err) => {
    console.warn('Failed to sync reading progress to backend:', err);
  }).finally(() => {
    isSyncingProgress = false;
    if (pendingSyncPayload) {
      pendingSyncPayload = null;
      syncReadingProgressToBackend();
    }
  });
}

function debounceSyncReadingProgress() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncReadingProgressToBackend();
  }, 400);
}

function onViewerBack(payload) {
  if (payload?.currentPage || payload?.page) {
    progress.value.pdfCurrentPage = payload.currentPage || payload.page;
  }
  if (payload?.mode) {
    progress.value.pdfViewMode = payload.mode;
  }
  if (payload?.totalPages) {
    progress.value.pdfTotalPages = payload.totalPages;
  }
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  saveProgress();
  syncReadingProgressToBackend();
  goToOverview();
}

function onViewerProceedToPostTest() {
  const currentTotal = Number(progress.value.pdfTotalPages) || 29;
  const currentPages = progress.value.pagesRead || [];
  progress.value.readingConfirmed = Boolean(currentTotal > 0 && currentPages.length >= currentTotal);
  progress.value.highestUnlockedStep = Math.max(progress.value.highestUnlockedStep || 1, 3);
  currentStep.value = 3;
  progress.value.currentStep = 3;
  saveProgress();

  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  syncReadingProgressToBackend();
}

function onViewerProgressUpdate(payload) {
  const page = payload?.currentPage || payload?.page;
  if (page) {
    progress.value.pdfCurrentPage = page;
  }
  if (payload?.mode) {
    progress.value.pdfViewMode = payload.mode;
  }
  if (payload?.totalPages) {
    progress.value.pdfTotalPages = payload.totalPages;
  }
  if (Array.isArray(payload?.pagesRead)) {
    const existing = new Set(progress.value.pagesRead || []);
    payload.pagesRead.forEach((p) => {
      const num = Number(p);
      if (num > 0) existing.add(num);
    });
    progress.value.pagesRead = Array.from(existing).sort((a, b) => a - b);
    progress.value.completedPages = progress.value.pagesRead.length;
  }
  if ((progress.value.pagesRead?.length || 0) > 0 || (progress.value.pdfCurrentPage && progress.value.pdfCurrentPage > 0)) {
    progress.value.readingStarted = true;
  }

  const total = Number(progress.value.pdfTotalPages) || 29;
  progress.value.readingConfirmed = Boolean(total > 0 && (progress.value.pagesRead?.length || 0) >= total);

  saveProgress();
  debounceSyncReadingProgress();
}

function reopenPdfViewer() {
  currentStep.value = 2;
}

// ==========================================
// POST-TEST LOGIC
// ==========================================
function onSelectPostAnswer(optId) {
  if (isCheckboxQuestion(currentPostQ.value)) {
    const list = Array.isArray(selectedPostAnswer.value)
      ? [...selectedPostAnswer.value]
      : (selectedPostAnswer.value ? [selectedPostAnswer.value] : []);
    const idx = list.indexOf(optId);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(optId);
    }
    selectedPostAnswer.value = list;
  } else {
    selectedPostAnswer.value = optId;
  }
}

async function submitPostAnswer() {
  if (hasNoPostAnswer.value) return;

  // Record answer locally without revealing correct answer or feedback before Post-Test submission
  progress.value.postTestAnswers[currentPostQ.value.id] = selectedPostAnswer.value;
  saveProgress();
  await nextPostQuestion();
}

async function nextPostQuestion() {
  if (currentPostQIndex.value + 1 < postTestQuestions.value.length) {
    currentPostQIndex.value += 1;
    isPostSubmitted.value = false;
    selectedPostAnswer.value = progress.value.postTestAnswers[currentPostQ.value.id] || '';
  } else {
    // Finish Post-test & calculate score locally
    let score = 0;
    postTestQuestions.value.forEach((q) => {
      if (progress.value.postTestAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    progress.value.postTestScore = score;
    progress.value.postTestCompleted = true;
    progress.value.highestUnlockedStep = Math.max(progress.value.highestUnlockedStep || 1, 4);
    saveProgress();
    showingPostTestScore.value = true;

    // Submit attempt to backend if real module
    if (!isMock.value && realPostTest.value?.id) {
      try {
        const res = await api.post(`/modules/${effectiveModuleId.value}/attempt`, {
          assessmentId: realPostTest.value.id,
          answers: progress.value.postTestAnswers
        });
        if (res.data?.score != null) {
          progress.value.postTestScore = res.data.score;
          saveProgress();
        }
      } catch (err) {
        console.warn('Could not sync post-test attempt to server:', err);
      }
    }
  }
}

function proceedToActivitySubmission() {
  currentStep.value = 4;
  progress.value.currentStep = 4;
  saveProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// STEP 4: ACTIVITY SUBMISSION
// ==========================================
function triggerFileInput() {
  if (isSubmissionClosed.value) return;
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function onFilesSelected(e) {
  if (e.target.files) {
    addFiles(Array.from(e.target.files));
  }
}

function onDropFiles(e) {
  isDragging.value = false;
  if (e.dataTransfer && e.dataTransfer.files) {
    addFiles(Array.from(e.dataTransfer.files));
  }
}

function addFiles(files) {
  uploadError.value = '';
  const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const maxBytes = 15 * 1024 * 1024; // 15MB

  files.forEach((file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      uploadError.value = `Unsupported file "${file.name}". Please upload JPG, PNG, or PDF.`;
      return;
    }
    if (file.size > maxBytes) {
      uploadError.value = `File "${file.name}" exceeds the 15MB size limit.`;
      return;
    }

    let previewUrl = null;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    } else if (file.type === 'application/pdf' || ext === '.pdf') {
      previewUrl = URL.createObjectURL(file);
    }

    selectedFiles.value.push({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl
    });
  });
}

function removeFile(index) {
  const item = selectedFiles.value[index];
  if (item?.previewUrl) {
    URL.revokeObjectURL(item.previewUrl);
  }
  selectedFiles.value.splice(index, 1);
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function handleSubmitActivities() {
  if (isSubmissionClosed.value) return;
  if (isMock.value) {
    submitMockActivities();
  } else {
    submitRealActivities();
  }
}

function submitMockActivities() {
  if (selectedFiles.value.length === 0) {
    uploadError.value = 'Please select at least one activity photo or document.';
    return;
  }

  const meta = selectedFiles.value.map((f) => ({
    name: f.name,
    size: f.size,
    type: f.type,
    uploadedAt: new Date().toISOString()
  }));

  progress.value.activitySubmitted = true;
  progress.value.submittedFilesMeta = meta;
  progress.value.completedAt = new Date().toISOString();
  saveProgress();
  selectedFiles.value = [];
  showToast('Your answers have been sent to your teacher.');
}

async function submitRealActivities() {
  if (selectedFiles.value.length === 0) {
    uploadError.value = 'Please select at least one activity photo or document.';
    return;
  }

  isSubmittingActivity.value = true;
  uploadError.value = '';

  try {
    const uploadedFilesMeta = [];
    const uploadedFilesPayload = [];

    for (const f of selectedFiles.value) {
      let uploadedFileUrl = null;
      let uploadedFileSize = f.size || null;
      let uploadedFileType = f.type || '';
      try {
        const formData = new FormData();
        formData.append('file', f.file);
        const upRes = await api.post('/modules/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedFileUrl = upRes.data?.fileUrl;
        if (upRes.data?.fileSize) uploadedFileSize = upRes.data.fileSize;
        if (upRes.data?.fileType) uploadedFileType = upRes.data.fileType;
      } catch (uploadErr) {
        console.warn('Upload endpoint error, proceeding with submission record:', uploadErr);
      }

      const nowIso = new Date().toISOString();
      uploadedFilesPayload.push({
        fileUrl: uploadedFileUrl || null,
        fileName: f.name,
        fileSize: uploadedFileSize,
        fileType: uploadedFileType,
        submittedAt: nowIso
      });

      uploadedFilesMeta.push({
        name: f.name,
        size: uploadedFileSize || f.size,
        type: uploadedFileType || f.type,
        fileUrl: uploadedFileUrl || null,
        uploadedAt: nowIso
      });
    }

    const firstFile = uploadedFilesPayload[0] || {};
    const subRes = await api.post('/submissions', {
      moduleId: Number(effectiveModuleId.value),
      title: `${moduleTitle.value} - Activity Output`,
      fileUrl: firstFile.fileUrl || null,
      fileName: firstFile.fileName || 'Activity 1.jpg',
      fileSize: firstFile.fileSize || null,
      fileType: firstFile.fileType || '',
      files: uploadedFilesPayload,
      replaceFiles: true,
      content: `Uploaded ${uploadedFilesPayload.length} activity output file(s)`
    });
    submissionRecord.value = subRes.data;

    // Update LearnerProgress to COMPLETED
    await api.post(`/modules/${effectiveModuleId.value}/progress`, {
      status: 'COMPLETED',
      completedPages: 29,
      totalPages: 29
    }).catch(() => {});

    progress.value.activitySubmitted = true;
    progress.value.submittedFilesMeta = uploadedFilesMeta;
    progress.value.completedAt = new Date().toISOString();
    saveProgress();
    selectedFiles.value = [];
    showToast('Your answers have been sent to your teacher.');
  } catch (err) {
    console.error('Failed to submit activities:', err);
    if (err.response?.status === 403 && (err.response?.data?.isDeadlinePassed || /deadline/i.test(err.response?.data?.error || ''))) {
      deadlinePassedOverride.value = true;
    }
    uploadError.value = err.response?.data?.error || 'Failed to submit activities. Please check your connection and try again.';
  } finally {
    isSubmittingActivity.value = false;
  }
}

async function confirmRemoveFile() {
  if (fileToRemove.value === null || isSubmissionClosed.value) return;
  const idx = fileToRemove.value;
  fileToRemove.value = null;
  isUpdatingFiles.value = true;
  uploadError.value = '';

  try {
    if (progress.value.activitySubmitted) {
      const currentList = [...(progress.value.submittedFilesMeta || [])];
      currentList.splice(idx, 1);

      if (!isMock.value) {
        const payloadFiles = currentList.map((f) => ({
          fileName: f.name || f.fileName,
          fileSize: f.size || f.fileSize,
          fileType: f.type || f.fileType,
          fileUrl: f.fileUrl || null,
          submittedAt: f.uploadedAt || f.submittedAt || new Date().toISOString()
        }));

        const res = await api.post('/submissions', {
          moduleId: Number(effectiveModuleId.value),
          title: `${moduleTitle.value} - Activity Output`,
          files: payloadFiles,
          replaceFiles: true,
          action: 'FILE_REMOVED',
          content: `Updated activity outputs (${payloadFiles.length} file(s) remaining)`
        });
        submissionRecord.value = res.data;
      }

      progress.value.submittedFilesMeta = currentList;
      if (currentList.length === 0) {
        progress.value.activitySubmitted = false;
      }
      saveProgress();
      showToast('Your files have been updated.');
    } else {
      removeFile(idx);
    }
  } catch (err) {
    console.error('Failed to remove file:', err);
    if (err.response?.status === 403 && (err.response?.data?.isDeadlinePassed || /deadline/i.test(err.response?.data?.error || ''))) {
      deadlinePassedOverride.value = true;
    }
    uploadError.value = err.response?.data?.error || 'Failed to update files. Please try again.';
  } finally {
    isUpdatingFiles.value = false;
  }
}

async function onReplaceFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file || replaceTargetIndex.value === null) return;
  const targetIdx = replaceTargetIndex.value;
  replaceTargetIndex.value = null;

  const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const maxBytes = 15 * 1024 * 1024;
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!validExtensions.includes(ext)) {
    uploadError.value = `Unsupported file "${file.name}". Please upload JPG, PNG, or PDF.`;
    return;
  }
  if (file.size > maxBytes) {
    uploadError.value = `File "${file.name}" exceeds the 15MB size limit.`;
    return;
  }

  isUpdatingFiles.value = true;
  uploadError.value = '';

  try {
    let previewUrl = null;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    } else if (file.type === 'application/pdf' || ext === '.pdf') {
      previewUrl = URL.createObjectURL(file);
    }

    if (progress.value.activitySubmitted) {
      let uploadedFileUrl = null;
      let uploadedFileSize = file.size;
      let uploadedFileType = file.type;

      if (!isMock.value) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const upRes = await api.post('/modules/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedFileUrl = upRes.data?.fileUrl;
          if (upRes.data?.fileSize) uploadedFileSize = upRes.data.fileSize;
          if (upRes.data?.fileType) uploadedFileType = upRes.data.fileType;
        } catch (upErr) {
          console.warn('Upload endpoint error:', upErr);
        }
      }

      const nowIso = new Date().toISOString();
      const updatedMeta = [...(progress.value.submittedFilesMeta || [])];
      updatedMeta[targetIdx] = {
        name: file.name,
        size: uploadedFileSize,
        type: uploadedFileType,
        fileUrl: uploadedFileUrl || null,
        previewUrl,
        uploadedAt: nowIso
      };

      if (!isMock.value) {
        const payloadFiles = updatedMeta.map((f) => ({
          fileName: f.name || f.fileName,
          fileSize: f.size || f.fileSize,
          fileType: f.type || f.fileType,
          fileUrl: f.fileUrl || null,
          submittedAt: f.uploadedAt || nowIso
        }));

        const res = await api.post('/submissions', {
          moduleId: Number(effectiveModuleId.value),
          title: `${moduleTitle.value} - Activity Output`,
          files: payloadFiles,
          replaceFiles: true,
          action: 'FILE_REPLACED',
          content: `Replaced file "${file.name}"`
        });
        submissionRecord.value = res.data;
      }

      progress.value.submittedFilesMeta = updatedMeta;
      saveProgress();
      showToast('Your files have been updated.');
    } else {
      if (selectedFiles.value[targetIdx]?.previewUrl) {
        URL.revokeObjectURL(selectedFiles.value[targetIdx].previewUrl);
      }
      selectedFiles.value[targetIdx] = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl
      };
    }
  } catch (err) {
    console.error('Failed to replace file:', err);
    if (err.response?.status === 403 && (err.response?.data?.isDeadlinePassed || /deadline/i.test(err.response?.data?.error || ''))) {
      deadlinePassedOverride.value = true;
    }
    uploadError.value = err.response?.data?.error || 'Failed to update files. Please try again.';
  } finally {
    isUpdatingFiles.value = false;
  }
}

function triggerAddFiles() {
  if (isReviewFinalized.value || isSubmissionClosed.value) return;
  if (addMoreFileInputRef.value) {
    addMoreFileInputRef.value.value = '';
    addMoreFileInputRef.value.click();
  }
}

async function onAddMoreFilesSelected(e) {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  if (!progress.value.activitySubmitted) {
    addFiles(files);
    return;
  }

  isUpdatingFiles.value = true;
  uploadError.value = '';

  try {
    const newItems = [];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const maxBytes = 15 * 1024 * 1024;

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(ext) || file.size > maxBytes) continue;

      let previewUrl = null;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      } else if (file.type === 'application/pdf' || ext === '.pdf') {
        previewUrl = URL.createObjectURL(file);
      }

      let uploadedFileUrl = null;
      let uploadedFileSize = file.size;
      let uploadedFileType = file.type;

      if (!isMock.value) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const upRes = await api.post('/modules/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedFileUrl = upRes.data?.fileUrl;
          if (upRes.data?.fileSize) uploadedFileSize = upRes.data.fileSize;
          if (upRes.data?.fileType) uploadedFileType = upRes.data.fileType;
        } catch (upErr) {
          console.warn('Upload endpoint error:', upErr);
        }
      }

      const nowIso = new Date().toISOString();
      newItems.push({
        name: file.name,
        size: uploadedFileSize,
        type: uploadedFileType,
        fileUrl: uploadedFileUrl || null,
        previewUrl,
        uploadedAt: nowIso
      });
    }

    if (newItems.length > 0) {
      const combined = [...(progress.value.submittedFilesMeta || []), ...newItems];

      if (!isMock.value) {
        const payloadFiles = combined.map((f) => ({
          fileName: f.name || f.fileName,
          fileSize: f.size || f.fileSize,
          fileType: f.type || f.fileType,
          fileUrl: f.fileUrl || null,
          submittedAt: f.uploadedAt || new Date().toISOString()
        }));

        const res = await api.post('/submissions', {
          moduleId: Number(effectiveModuleId.value),
          title: `${moduleTitle.value} - Activity Output`,
          files: payloadFiles,
          replaceFiles: true,
          action: 'FILES_ADDED',
          content: `Added ${newItems.length} activity file(s)`
        });
        submissionRecord.value = res.data;
      }

      progress.value.submittedFilesMeta = combined;
      saveProgress();
      showToast('Your files have been updated.');
    }
  } catch (err) {
    console.error('Failed to add files:', err);
    if (err.response?.status === 403 && (err.response?.data?.isDeadlinePassed || /deadline/i.test(err.response?.data?.error || ''))) {
      deadlinePassedOverride.value = true;
    }
    uploadError.value = err.response?.data?.error || 'Failed to update files. Please try again.';
  } finally {
    isUpdatingFiles.value = false;
  }
}

// Fetch Module Data
let isFetchingModule = false;
let fetchAbortController = null;

async function fetchModuleData() {
  if (!effectiveModuleId.value || effectiveModuleId.value === 'ls2-mock-001') {
    router.replace('/modules');
    return;
  }

  // Prevent concurrent duplicate requests
  if (isFetchingModule) {
    return;
  }

  if (fetchAbortController) {
    try {
      fetchAbortController.abort();
    } catch (_) {}
  }
  fetchAbortController = new AbortController();

  isFetchingModule = true;
  isLoading.value = true;
  loadError.value = '';

  try {
    const res = await api.get(`/modules/${effectiveModuleId.value}`, {
      signal: fetchAbortController.signal
    });
    const mod = res.data?.data || res.data;
    moduleData.value = mod;

    // Load initial local progress
    const local = loadProgress();
    progress.value = local;

    // Extract assessments
    const assessments = Array.isArray(mod.assessments) ? mod.assessments : [];
    realPreTest.value = assessments.find((a) => a.type === 'PRE_TEST') || mod.preTest || null;
    realPostTest.value = assessments.find((a) => a.type === 'POST_TEST') || mod.postTest || null;

    rawPreQuestions.value = realPreTest.value?.questions || [];
    rawPostQuestions.value = realPostTest.value?.questions || [];

    // If pre-test has no questions, mark pre-test done & unlock module
    if (rawPreQuestions.value.length === 0) {
      progress.value.preTestCompleted = true;
      progress.value.highestUnlockedStep = Math.max(progress.value.highestUnlockedStep || 1, 2);
    }

    // Restore Pre-Test from backend attempts or mod score
    const preAttempt = realPreTest.value?.attempts?.[0];
    if (preAttempt) {
      progress.value.preTestCompleted = true;
      if (preAttempt.score != null) {
        progress.value.preTestScore = Number(preAttempt.score);
      }
      if (Array.isArray(preAttempt.answers) && preAttempt.answers.length > 0) {
        if (!progress.value.preTestAnswers) progress.value.preTestAnswers = {};
        preAttempt.answers.forEach((ans) => {
          if (ans.questionId && (ans.selectedOptionId || ans.textAnswer)) {
            progress.value.preTestAnswers[ans.questionId] = ans.selectedOptionId || ans.textAnswer;
          }
        });
      }
      progress.value.highestUnlockedStep = Math.max(progress.value.highestUnlockedStep || 1, 2);
    } else if (mod.preTestScore != null) {
      progress.value.preTestScore = Number(mod.preTestScore);
      progress.value.preTestCompleted = true;
      progress.value.highestUnlockedStep = Math.max(progress.value.highestUnlockedStep || 1, 2);
    }

    // Restore Post-Test from backend attempts or mod score
    const postAttempt = realPostTest.value?.attempts?.[0];
    if (postAttempt) {
      progress.value.postTestCompleted = true;
      if (postAttempt.score != null) {
        progress.value.postTestScore = Number(postAttempt.score);
      }
      if (Array.isArray(postAttempt.answers) && postAttempt.answers.length > 0) {
        if (!progress.value.postTestAnswers) progress.value.postTestAnswers = {};
        postAttempt.answers.forEach((ans) => {
          if (ans.questionId && (ans.selectedOptionId || ans.textAnswer)) {
            progress.value.postTestAnswers[ans.questionId] = ans.selectedOptionId || ans.textAnswer;
          }
        });
      }
      progress.value.highestUnlockedStep = Math.max(progress.value.highestUnlockedStep || 1, 4);
    } else if (mod.postTestScore != null) {
      progress.value.postTestScore = Number(mod.postTestScore);
      progress.value.postTestCompleted = true;
      progress.value.highestUnlockedStep = Math.max(progress.value.highestUnlockedStep || 1, 4);
    }

    // Restore Reading Progress from backend learnerProgress or module payload
    const lp = mod.learnerProgress?.[0];
    const serverPagesRead = Array.isArray(mod.pagesRead)
      ? mod.pagesRead
      : (Array.isArray(lp?.pagesRead) ? lp.pagesRead : []);

    const serverTotalPages = Number(mod.totalPages) || Number(lp?.totalPages) || 29;
    if (serverTotalPages > 0) {
      progress.value.pdfTotalPages = serverTotalPages;
    }

    // Restore Current Page & View Mode
    const serverCurrentPage = Number(mod.currentPage) || Number(lp?.currentPage) || 0;
    const localCurrentPage = Number(local.pdfCurrentPage) || 0;
    const restoredCurrentPage = serverCurrentPage > 0
      ? serverCurrentPage
      : (localCurrentPage > 0 ? localCurrentPage : 1);

    progress.value.pdfCurrentPage = Math.max(1, Math.min(restoredCurrentPage, serverTotalPages));
    progress.value.pdfViewMode = mod.viewMode || lp?.viewMode || local.pdfViewMode || 'long';

    if (serverPagesRead.length > 0) {
      // Highest page reached determines reading progress
      const highestServer = Math.max(...serverPagesRead.map(Number).filter((n) => n > 0 && n <= serverTotalPages));
      const localPages = Array.isArray(local.pagesRead) ? local.pagesRead.map(Number).filter(n => n > 0 && n <= serverTotalPages) : [];
      const highestLocal = localPages.length > 0 ? Math.max(...localPages) : 0;
      const highest = Math.min(Math.max(highestServer, highestLocal), serverTotalPages);
      const mergedPages = Array.from({ length: highest }, (_, i) => i + 1);

      progress.value.pagesRead = mergedPages;
      progress.value.completedPages = mergedPages.length;
      progress.value.readingStarted = mergedPages.length > 0;

      // If local cache had higher progress, sync to backend quietly
      if (highest > highestServer) {
        api.post(`/modules/${effectiveModuleId.value}/progress`, {
          status: mergedPages.length >= serverTotalPages ? 'COMPLETED' : 'IN_PROGRESS',
          completedPages: mergedPages.length,
          currentPage: progress.value.pdfCurrentPage || 1,
          viewMode: progress.value.pdfViewMode || 'long',
          totalPages: serverTotalPages,
          pagesRead: mergedPages
        }).catch(() => {});
      }
    } else if (mod.completed || lp?.completedAt) {
      // Legitimate prior completion of whole module
      progress.value.completedPages = serverTotalPages;
      progress.value.pagesRead = Array.from({ length: serverTotalPages }, (_, i) => i + 1);
      progress.value.readingStarted = true;
    } else if (Array.isArray(local.pagesRead) && local.pagesRead.length > 0) {
      const highest = Math.min(Math.max(...local.pagesRead.map(Number).filter(n => n > 0)), serverTotalPages);
      const cleanLocal = Array.from({ length: highest }, (_, i) => i + 1);
      progress.value.pagesRead = cleanLocal;
      progress.value.completedPages = cleanLocal.length;
      progress.value.readingStarted = cleanLocal.length > 0;
      api.post(`/modules/${effectiveModuleId.value}/progress`, {
        status: cleanLocal.length >= serverTotalPages ? 'COMPLETED' : 'IN_PROGRESS',
        completedPages: cleanLocal.length,
        currentPage: progress.value.pdfCurrentPage || 1,
        viewMode: progress.value.pdfViewMode || 'long',
        totalPages: serverTotalPages,
        pagesRead: cleanLocal
      }).catch(() => {});
    } else {
      progress.value.pagesRead = [];
      progress.value.completedPages = 0;
      progress.value.readingStarted = false;
    }

    const isAllPagesRead = Boolean(progress.value.pdfTotalPages > 0 && (progress.value.pagesRead?.length || 0) >= progress.value.pdfTotalPages);
    progress.value.readingConfirmed = Boolean(isAllPagesRead || (mod.completed && progress.value.activitySubmitted));

    if (mod.completed) {
      progress.value.activitySubmitted = true;
      progress.value.highestUnlockedStep = 4;
    }

    // Fetch existing submissions
    try {
      const subRes = await api.get(`/submissions?moduleId=${effectiveModuleId.value}`, {
        signal: fetchAbortController?.signal
      });
      const subs = Array.isArray(subRes.data) ? subRes.data : [];
      if (subs.length > 0) {
        submissionRecord.value = subs[0];
        progress.value.activitySubmitted = true;
        progress.value.highestUnlockedStep = 4;
        const allServerFiles = [];
        subs.forEach((s) => {
          if (Array.isArray(s.files) && s.files.length > 0) {
            s.files.forEach((f) => {
              allServerFiles.push({
                name: f.fileName || f.name || 'Submitted Activity',
                size: f.fileSize || f.size || 0,
                type: f.mimeType || f.fileType || 'image/jpeg',
                fileUrl: f.fileUrl || '',
                uploadedAt: f.submittedAt || s.submittedAt || new Date().toISOString()
              });
            });
          } else {
            allServerFiles.push({
              name: s.fileName || s.title || 'Submitted Activity',
              size: s.fileSize || 0,
              type: s.fileType || 'application/pdf',
              fileUrl: s.fileUrl || '',
              uploadedAt: s.submittedAt || s.createdAt || new Date().toISOString()
            });
          }
        });
        if (allServerFiles.length > 0) {
          progress.value.submittedFilesMeta = allServerFiles;
        }
      }
    } catch (subErr) {
      if (subErr?.name === 'CanceledError' || subErr?.code === 'ERR_CANCELED' || subErr?.__CANCEL__) {
        return;
      }
      console.warn('Could not check submissions:', subErr);
    }

    currentStep.value = progress.value.currentStep !== undefined ? progress.value.currentStep : 0;
    // Save to local storage silently without dispatching external events
    saveProgress(progress.value, false);
  } catch (err) {
    if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || err?.__CANCEL__) {
      return;
    }
    console.error('Failed to load module data:', err);
    loadError.value = 'Unable to load the module. Please try again.';
  } finally {
    isLoading.value = false;
    isFetchingModule = false;
  }
}

watch(
  () => effectiveModuleId.value,
  () => {
    progress.value = loadProgress();
    currentStep.value = progress.value.currentStep || 0;
    fetchModuleData();
  }
);

onMounted(() => {
  fetchModuleData();
});

onUnmounted(() => {
  if (fetchAbortController) {
    try {
      fetchAbortController.abort();
    } catch (_) {}
  }
});
</script>

<style scoped>
.mock-study-page {
  display: flex;
  flex-direction: column;
  min-height: auto;
  padding-bottom: 0.5rem;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
}

/* Loading & Error States */
.loading-state-container,
.error-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  text-align: center;
  gap: 1rem;
}

.spinner-circle {
  width: 44px;
  height: 44px;
  border: 3.5px solid #e2e8f0;
  border-top-color: #165dfc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}

.error-icon-box {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-msg {
  font-size: 0.95rem;
  font-weight: 600;
  color: #dc2626;
  max-width: 380px;
  margin: 0;
}

.retry-btn {
  padding: 0.65rem 1.5rem;
  font-size: 0.9rem;
  border-radius: 8px;
}

/* Consistent Back Navigation (Outside and above the main content card) */
.module-back-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  max-width: 100%;
  margin: 0 0 0.85rem 0;
  box-sizing: border-box;
}

.module-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  color: #2563eb;
  background: none;
  border: none;
  padding: 0.45rem 0.6rem 0.45rem 0;
  cursor: pointer;
  text-decoration: none;
  line-height: 1.4;
  transition: color 0.15s ease, opacity 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.module-back-btn:hover {
  color: #1d4ed8;
}

.module-back-btn:active {
  opacity: 0.75;
}

.module-back-btn svg {
  flex-shrink: 0;
}

/* Subpage Navigation Bar (Steps 1, 3, 4) - Option 1: Card & Stepper Style */
.subpage-nav-bar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.15rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

.subpage-heading-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.subpage-meta-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.subpage-step-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
  text-transform: uppercase;
}

.subpage-completed-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: #15803d;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  line-height: 1.2;
}

.subpage-title-text {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
  margin: 0;
  word-break: break-word;
}

.subpage-instruction-text {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0.25rem 0 0 0;
  text-align: left;
  font-weight: 400;
  word-break: normal;
  overflow-wrap: break-word;
}

/* Card Content */
.step-content-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  margin: 0;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

.step-content-card.results-view-mode {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

/* Assessment Header */
.assessment-header {
  margin-bottom: 1.25rem;
}

.assessment-eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
}

.step-badge {
  font-size: 0.7rem;
  font-weight: 800;
  background: #eff6ff;
  color: #165dfc;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  text-transform: uppercase;
}

.post-badge {
  background: #f0fdf4;
  color: #16a34a;
}

.q-counter {
  font-size: 0.775rem;
  font-weight: 700;
  color: #64748b;
}

.assessment-progress-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #165dfc;
  border-radius: 3px;
  transition: width 0.25s ease;
}

.post-fill {
  background: #16a34a;
}

/* Question Body */
.question-body {
  margin-bottom: 1.25rem;
}

.question-text {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.45;
  margin: 0 0 1.25rem 0;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  min-height: 52px;
  width: 100%;
}

.option-item:hover:not(:disabled) {
  border-color: #94a3b8;
  background: #f1f5f9;
}

.option-item.selected {
  border-color: #165dfc;
  background: #eff6ff;
}

.option-item.correct {
  border-color: #16a34a;
  background: #f0fdf4;
}

.option-item.incorrect {
  border-color: #ef4444;
  background: #fef2f2;
}

.opt-choice-indicator,
.opt-letter-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.opt-choice-indicator.is-checkbox {
  border-radius: 6px;
}

.option-item:hover:not(:disabled) .opt-choice-indicator,
.option-item:hover:not(:disabled) .opt-letter-circle {
  border-color: #94a3b8;
}

.option-item.selected .opt-choice-indicator,
.option-item.selected .opt-letter-circle {
  border-color: #165dfc;
  background: #ffffff;
}

.option-item.selected .opt-choice-indicator.is-checkbox {
  background: #165dfc;
  border-color: #165dfc;
  color: #ffffff;
}

.radio-inner-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #165dfc;
  display: block;
  flex-shrink: 0;
}

.option-item.correct .opt-choice-indicator,
.option-item.correct .opt-letter-circle {
  background: #16a34a;
  border-color: #16a34a;
  color: #ffffff;
}

.option-item.incorrect .opt-choice-indicator,
.option-item.incorrect .opt-letter-circle {
  background: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}

.opt-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  flex: 1;
}

/* Feedback Card */
.feedback-card {
  border-radius: 12px;
  padding: 0.85rem 1rem;
  margin-bottom: 1.25rem;
  animation: fadeIn 0.2s ease;
}

.feedback-correct {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.feedback-incorrect {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.feedback-heading {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
}

.feedback-detail {
  font-size: 0.825rem;
  line-height: 1.45;
  margin: 0;
}

/* Actions */
.assessment-actions {
  display: flex;
  margin-top: 0.5rem;
}

.action-btn {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

/* Score Summary Box */
.score-summary-box {
  text-align: center;
  padding: 1.5rem 0.5rem;
}

.score-icon-badge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.post-badge-circle {
  background: #f0fdf4;
}

.summary-status-pill {
  font-size: 0.725rem;
  font-weight: 800;
  color: #165dfc;
  background: #eff6ff;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.post-pill {
  color: #16a34a;
  background: #f0fdf4;
}

.summary-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.45rem 0;
}

.summary-desc {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.45;
  max-width: 380px;
  margin: 0 auto 1.25rem auto;
}

.score-highlight-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  max-width: 260px;
  margin: 0 auto 1.25rem auto;
}

.score-number-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
}

.score-big {
  font-size: 2.75rem;
  font-weight: 900;
  color: #165dfc;
  line-height: 1;
}

.score-divider {
  font-size: 1.5rem;
  color: #94a3b8;
  font-weight: 700;
}

.score-total {
  font-size: 1.5rem;
  color: #64748b;
  font-weight: 800;
}

.score-percentage-tag {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  margin-top: 0.35rem;
}

.instruction-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  font-size: 0.825rem;
  color: #1e40af;
  line-height: 1.5;
  text-align: left;
  max-width: 440px;
  margin: 0 auto 1.5rem auto;
}

.summary-action-btn {
  width: 100%;
  max-width: 360px;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

/* Post-Test Dynamic Comparison Grid */
.comparison-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
  max-width: 460px;
  margin: 0 auto 1.25rem auto;
}

.comp-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.comp-card.highlight-post {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.comp-card.highlight-delta {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.comp-label {
  font-size: 0.675rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.comp-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.text-green {
  color: #16a34a;
}

.text-blue {
  color: #165dfc;
}

.text-amber {
  color: #d97706;
}

.comp-sub {
  font-size: 0.65rem;
  font-weight: 600;
  color: #64748b;
}

/* Activity Upload Section */
.activity-header {
  margin-bottom: 1.25rem;
}

.activity-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0.45rem 0 0.35rem 0;
}

.activity-desc {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.45;
  margin: 0;
}

.submitted-demo-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 14px;
  padding: 1rem 1.15rem;
  margin-bottom: 1.25rem;
}

.demo-badge-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-bottom: 0.45rem;
}

.demo-success-title {
  font-size: 1rem;
  font-weight: 800;
  color: #15803d;
  margin: 0 0 0.2rem 0;
}

.demo-success-text {
  font-size: 0.85rem;
  color: #166534;
  margin: 0;
}

.demo-disclaimer {
  font-size: 0.775rem;
  color: #15803d;
  line-height: 1.4;
  margin: 0;
  padding-top: 0.45rem;
  border-top: 1px dashed #bbf7d0;
}

/* Activity Upload Section */
.activity-upload-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: 2.5rem;
  box-sizing: border-box;
}

/* Dropzone Box */
.dropzone-box {
  border: 2px dashed #93c5fd;
  background: #f8fafc;
  border-radius: 16px;
  padding: 1.75rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 1.25rem;
}

.dropzone-box:hover,
.dropzone-box.is-dragging {
  background: #eff6ff;
  border-color: #165dfc;
}

.dropzone-icon {
  margin-bottom: 0.65rem;
}

.dropzone-main-text {
  font-size: 0.95rem;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.dropzone-main-text strong {
  color: #165dfc;
}

.dropzone-sub-text {
  font-size: 0.775rem;
  color: #64748b;
}

.upload-error-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}

/* Selected Files */
.selected-files-container {
  margin-bottom: 1.25rem;
}

.files-heading {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  margin: 0 0 0.65rem 0;
}

.files-grid {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.file-item-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.file-item-card:hover {
  border-color: #cbd5e1;
  background-color: #f8fafc;
}

.file-item-card:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.file-thumb-wrap {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  background: #f1f5f9;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-img-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-pdf-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pdf-tag {
  font-size: 0.6rem;
  font-weight: 800;
  color: #dc2626;
  line-height: 1;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.825rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.file-size {
  font-size: 0.725rem;
  color: #64748b;
}

.file-remove-btn {
  background: transparent;
  border: none;
  font-size: 1.35rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 0.35rem;
  line-height: 1;
}

.file-remove-btn:hover {
  color: #ef4444;
}

/* Toast feedback alert */
.files-toast-alert {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #15803d;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.08);
}

/* Sent Success Banner */
.sent-success-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.15rem;
}

.sent-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #166534;
  margin: 0 0 0.15rem 0;
}

.sent-subtext {
  font-size: 0.825rem;
  color: #15803d;
  line-height: 1.35;
  margin: 0;
}

/* Review Finalized Banner */
.review-finalized-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 1rem 1.15rem;
  margin-bottom: 1.25rem;
}

.review-finalized-banner .banner-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 0.25rem 0;
}

.review-finalized-banner .banner-subtext {
  font-size: 0.85rem;
  color: #1e3a8a;
  line-height: 1.45;
  margin: 0;
}

/* Submission Closed Banner */
.submission-closed-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 1rem 1.15rem;
  margin-bottom: 1.25rem;
}

.submission-closed-banner .banner-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #92400e;
  margin: 0 0 0.25rem 0;
}

.submission-closed-banner .banner-subtext {
  font-size: 0.85rem;
  color: #78350f;
  line-height: 1.45;
  margin: 0;
}

.submission-closed-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: not-allowed;
  user-select: none;
}

/* Three Dot Button and Dropdown */
.file-menu-wrap {
  position: relative;
  margin-left: auto;
  flex-shrink: 0;
}

.three-dot-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.three-dot-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.file-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 160px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  z-index: 50;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-action-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  font-size: 0.825rem;
  font-weight: 600;
  color: #334155;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease;
}

.menu-action-item:hover {
  background: #f8fafc;
  color: #0f172a;
}

.menu-action-item.item-danger {
  color: #dc2626;
}

.menu-action-item.item-danger:hover {
  background: #fef2f2;
  color: #b91c1c;
}

/* File Actions Row in Submitted State */
.submitted-actions-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.add-more-btn {
  width: 100%;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  height: 44px;
  padding: 0 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  background: #2563eb;
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.add-more-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.add-more-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-bottom-go-back {
  width: 100%;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 10px;
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #d1d5db;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  line-height: 1.4;
  -webkit-tap-highlight-color: transparent;
}

.btn-bottom-go-back:hover {
  background: #f8fafc;
  border-color: #9ca3af;
  color: #0f172a;
}

.btn-bottom-go-back:active {
  background: #f1f5f9;
  opacity: 0.9;
}

.btn-bottom-go-back svg {
  flex-shrink: 0;
}

.btn-back-modules {
  width: 100%;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  height: 44px;
  padding: 0 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  background: #ffffff;
  color: #1e293b;
  border: 1.5px solid #cbd5e1;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-back-modules:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Modals */
.custom-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.custom-modal-box {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.custom-modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.custom-modal-text {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.5;
  margin: 0 0 1.25rem 0;
}

.custom-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  height: 42px;
  padding: 0 1.15rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.modal-cancel-btn {
  background: #f1f5f9;
  color: #475569;
}

.modal-cancel-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.modal-danger-btn {
  background: #dc2626;
  color: #ffffff;
}

.modal-danger-btn:hover:not(:disabled) {
  background: #b91c1c;
}

/* Preview Modal */
.preview-modal-box {
  background: #ffffff;
  border-radius: 12px;
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  box-sizing: border-box;
}

.preview-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.preview-file-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
}

.preview-modal-body {
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  min-height: 250px;
}

.preview-img-full {
  max-width: 100%;
  max-height: 65vh;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.preview-doc-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;
  gap: 0.5rem;
}

.preview-doc-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
  margin: 0;
}

.preview-doc-sub {
  color: #64748b;
  font-size: 0.825rem;
  margin: 0 0 1rem 0;
}

.preview-modal-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  background: #ffffff;
}

.open-in-tab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.15rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
}

/* Activity Actions */
.submit-activities-btn {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

.completed-nav-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.re-read-btn {
  width: 100%;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1.5px solid #cbd5e1;
  color: #334155;
  background: #ffffff;
  cursor: pointer;
}

.re-read-btn:hover {
  background: #f8fafc;
}

.return-modules-btn {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  text-decoration: none;
}

/* ============================================================ */
/* MODULE DETAILS OVERVIEW (Clean Google Classroom Style)       */
/* ============================================================ */
.module-details-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0 0 0.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Section 1: Module Header / Overview Card */
.module-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.15rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 0;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.module-main-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
  margin: 0;
  word-break: break-word;
}

.module-instructions-inline {
  font-size: 0.875rem;
  font-weight: 400;
  color: #475569;
  line-height: 1.55;
  margin: 0.25rem 0 0;
  white-space: pre-line;
  word-break: break-word;
}

.overview-divider {
  width: 100%;
  height: 1px;
  background-color: #f1f5f9;
  margin: 0.15rem 0;
  border: none;
}

.header-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.header-progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.header-progress-label {
  font-size: 0.825rem;
  font-weight: 600;
  color: #475569;
}

.header-progress-percent {
  font-size: 0.825rem;
  font-weight: 700;
  color: #2563eb;
}

.header-progress-track {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.header-progress-fill {
  height: 100%;
  background: #2563eb;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

/* Section: Teacher's Instructions Card */
.module-instructions-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.15rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 0;
}

.instructions-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.instructions-icon-badge {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.instructions-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.instructions-body {
  width: 100%;
}

.instructions-text {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #334155;
  margin: 0;
  white-space: pre-line;
  word-break: break-word;
  overflow-wrap: break-word;
}

.instructions-empty-text {
  font-size: 0.875rem;
  font-style: italic;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* Section 2: Learning Activities Section */
.learning-activities-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Subtle Light-Blue Information Container for Your Learning Activities */
.activities-info-card {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.04);
}

.activities-info-icon-wrap {
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.activities-info-content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  flex: 1;
  text-align: left;
}

.activities-info-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  padding: 0;
  line-height: 1.3;
  text-align: left;
}

.activities-info-desc {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #475569;
  margin: 0;
  padding: 0;
  text-align: left;
  word-break: break-word;
}

.activities-checklist {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Activity Card */
.activity-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

/* Highlight only the current available step with subtle blue border */
.activity-card.is-active-step {
  border: 2px solid #2563eb;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.08);
}

/* Completed step: light gray border (NO green border or green background!) */
.activity-card.is-completed {
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

/* Locked step: light gray border */
.activity-card.is-locked {
  border: 1px solid #e2e8f0;
  background: #fbfcfd;
}

/* Top Row: Icon, Title Group, Status */
.card-top-row {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  width: 100%;
}

.card-icon-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  flex-shrink: 0;
  background: #f1f5f9;
  color: #64748b;
  margin-top: 1px;
}

.card-icon-badge.badge-active {
  background: #eff6ff;
  color: #2563eb;
}

/* Small green check icon on completed */
.card-icon-badge.badge-completed {
  background: #dcfce7;
  color: #16a34a;
}

.card-icon-badge.badge-locked {
  background: #f1f5f9;
  color: #94a3b8;
}

.card-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1 1 auto;
  margin-right: 0.5rem;
}

.card-step-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1;
}

.card-activity-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
  word-break: normal;
  overflow-wrap: break-word;
}

.card-status-col {
  margin-left: auto;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
}

.card-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  line-height: 1.2;
  white-space: nowrap;
}

.card-status-pill.status-completed {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.card-status-pill.status-locked {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

.card-status-pill.status-in-progress {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.card-status-pill.status-ready {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

/* Middle: Description */
.card-description {
  font-size: 0.825rem;
  color: #64748b;
  line-height: 1.4;
  margin: 0.45rem 0 0.65rem 0;
}

/* Bottom Row */
.card-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.65rem;
}

.card-bottom-left {
  display: flex;
  align-items: center;
  min-height: 28px;
  min-width: 0;
}

.card-score-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.785rem;
  color: #15803d;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  white-space: nowrap;
}

.card-score-pill .score-label {
  font-weight: 600;
  color: #166534;
}

.card-score-pill .score-val {
  font-weight: 800;
  color: #15803d;
}

.card-reading-progress {
  font-size: 0.775rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  white-space: nowrap;
}

.card-submission-meta {
  font-size: 0.775rem;
  font-weight: 600;
  color: #15803d;
}

.card-bottom-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}

/* Standardized Activity Action Buttons */
.activity-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 44px;
  height: 44px;
  padding: 0 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  font-family: inherit;
  box-sizing: border-box;
  text-decoration: none;
}

.activity-btn.btn-primary {
  background: #2563eb;
  color: #ffffff;
  border: 1.5px solid #2563eb;
}

.activity-btn.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.activity-btn.btn-secondary {
  background: #ffffff;
  color: #1e293b;
  border: 1.5px solid #cbd5e1;
}

.activity-btn.btn-secondary:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.activity-btn.btn-locked {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1.5px solid #e2e8f0;
  cursor: not-allowed;
}

.btn-primary {
  background: #165dfc;
  color: #ffffff;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #124ecc;
}

.btn-outline {
  background: #ffffff;
  color: #165dfc;
  border: 1.5px solid #165dfc;
}

.btn-outline:hover:not(:disabled) {
  background: #eff6ff;
}

.btn-disabled {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
  cursor: not-allowed;
}

/* Pre-Test Notice Banner */
.pretest-notice-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  margin-bottom: 1.25rem;
  animation: fadeIn 0.2s ease;
}

.banner-icon-badge {
  background: #dcfce7;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.banner-text-wrap {
  flex: 1;
}

.banner-status-tag {
  font-size: 0.725rem;
  font-weight: 800;
  color: #15803d;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  display: block;
  margin-bottom: 0.25rem;
}

.banner-message {
  font-size: 0.85rem;
  font-weight: 600;
  color: #166534;
  line-height: 1.45;
  margin: 0;
}

.summary-button-group {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-width: 360px;
  margin: 0 auto;
}

.overview-btn {
  width: 100%;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 10px;
  background: #ffffff;
  color: #475569;
  border: 1.5px solid #cbd5e1;
  cursor: pointer;
}

.overview-btn:hover {
  background: #f8fafc;
  color: #1e293b;
}

/* Compact Results Score Card */
.results-score-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
}

.results-score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.results-score-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
}

.results-score-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1d4ed8;
  line-height: 1;
}

.results-score-percent {
  font-size: 0.85rem;
  font-weight: 700;
  color: #2563eb;
}

.results-score-confirm {
  font-size: 0.825rem;
  font-weight: 600;
  color: #15803d;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.results-comp-pills {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding-top: 0.35rem;
  border-top: 1px solid #f1f5f9;
}

.comp-pill {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  background: #f1f5f9;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.comp-pill.pill-gain {
  background: #dcfce7;
  color: #15803d;
}

.comp-pill.pill-loss {
  background: #fef3c7;
  color: #b45309;
}

.results-actions-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.results-primary-btn {
  width: 100%;
  min-height: 44px;
  padding: 0.7rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  box-sizing: border-box;
}

/* Read-Only Review Section */
.readonly-review-section {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  text-align: left;
  padding-bottom: 2.5rem;
}

.review-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  width: 100%;
  box-sizing: border-box;
}

.review-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.review-count {
  font-size: 0.725rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #64748b;
  padding: 0.2rem 0.55rem;
  border-radius: 12px;
  white-space: nowrap;
}

.review-questions-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.review-question-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.review-q-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.q-num-pill {
  font-size: 0.725rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
}

.q-result-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  white-space: nowrap;
}

.q-result-tag.tag-correct {
  background: #dcfce7;
  color: #15803d;
}

.q-result-tag.tag-incorrect {
  background: #fee2e2;
  color: #b91c1c;
}

.review-q-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem 0;
  line-height: 1.45;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.review-options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.review-opt-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
  padding: 0.65rem 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.review-opt-item.chosen-correct {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.review-opt-item.chosen-wrong {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
}

.review-opt-item.is-correct-target {
  background: #f0fdf4;
  border-color: #86efac;
  border-style: dashed;
  color: #166534;
}

.review-opt-label-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin-bottom: 0.15rem;
}

.badge-user-choice {
  font-size: 0.675rem;
  font-weight: 800;
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  line-height: 1.2;
  width: fit-content;
  max-width: 100%;
  white-space: nowrap;
}

.badge-choice-correct {
  background: #dcfce7;
  color: #15803d;
  border-color: #bbf7d0;
}

.badge-choice-wrong {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fecaca;
}

.badge-correct-choice {
  font-size: 0.675rem;
  font-weight: 800;
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  line-height: 1.2;
  width: fit-content;
  max-width: 100%;
  white-space: nowrap;
}

.review-opt-content {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.review-opt-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  box-sizing: border-box;
}

.review-opt-item.chosen-correct .review-opt-circle,
.review-opt-item.is-correct-target .review-opt-circle {
  background: #dcfce7;
  border-color: #16a34a;
}

.review-opt-item.chosen-wrong .review-opt-circle {
  background: #fee2e2;
  border-color: #dc2626;
}

.review-opt-text {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.4;
  box-sizing: border-box;
}

.review-feedback-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #2563eb;
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
  font-size: 0.825rem;
  color: #334155;
  line-height: 1.45;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  margin-top: 0.5rem;
}

/* Fullscreen Reader Wrapper */
.step-reader-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  margin: 0;
  box-sizing: border-box;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .module-back-bar,
  .subpage-nav-bar,
  .step-content-card {
    max-width: 680px;
    margin-left: auto;
    margin-right: auto;
  }

  .module-details-container {
    max-width: 680px;
    margin: 0 auto;
    padding: 0.5rem 0 1rem;
  }

  .module-header-card {
    padding: 1.5rem 1.75rem;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .learning-activities-section {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .activities-info-card {
    padding: 1.15rem 1.35rem;
  }

  .activities-info-title {
    font-size: 1.15rem;
  }

  .activities-info-desc {
    font-size: 0.9rem;
  }

  .activities-checklist {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .activity-card {
    padding: 1.35rem 1.5rem;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .step-content-card {
    padding: 1.75rem 2rem;
  }
}

@media (max-width: 480px) {
  .module-details-container {
    padding: 0 0 0.5rem;
    gap: 0.75rem;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .module-header-card {
    padding: 1rem 1.15rem;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .subpage-nav-bar {
    padding: 1rem 1.15rem;
    width: 100%;
    margin: 0 0 1rem 0;
  }

  .module-main-title,
  .subpage-title-text {
    font-size: 1.15rem;
  }

  .subpage-instruction-text {
    font-size: 0.8125rem;
    line-height: 1.45;
  }

  .learning-activities-section {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .activities-info-card {
    padding: 0.9rem 1rem;
    gap: 0.65rem;
  }

  .activities-info-title {
    font-size: 1rem;
  }

  .activities-info-desc {
    font-size: 0.85rem;
  }

  .activities-checklist {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .activity-card {
    padding: 1rem 1.15rem;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .step-content-card {
    margin: 0;
    width: 100%;
    max-width: 100%;
    padding: 1.15rem 1rem;
    box-sizing: border-box;
  }

  .step-content-card.results-view-mode {
    padding: 0;
  }

  .results-score-card {
    padding: 0.85rem 1rem;
    gap: 0.65rem;
  }

  .review-question-card {
    padding: 0.85rem 0.95rem;
    border-radius: 10px;
  }

  .review-opt-item {
    padding: 0.55rem 0.65rem;
  }

  .review-q-text {
    font-size: 0.9rem;
  }

  .readonly-review-section {
    padding-bottom: 3.5rem;
  }
}

@media (max-width: 360px) {
  .module-details-container {
    gap: 0.65rem;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0 0 0.5rem;
  }

  .module-header-card {
    padding: 0.9rem 1rem;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .learning-activities-section {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .activities-info-card {
    padding: 0.85rem 0.9rem;
    gap: 0.55rem;
  }

  .activities-info-title {
    font-size: 0.95rem;
  }

  .activities-info-desc {
    font-size: 0.825rem;
  }

  .activities-checklist {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .subpage-nav-bar {
    padding: 0.9rem 1rem;
    width: 100%;
    margin: 0 0 0.85rem 0;
  }

  .module-main-title,
  .subpage-title-text {
    font-size: 1.05rem;
  }

  .results-score-card {
    padding: 0.75rem 0.85rem;
  }

  .results-score-badge {
    padding: 0.3rem 0.55rem;
  }

  .results-score-val {
    font-size: 1.15rem;
  }

  .results-score-confirm {
    font-size: 0.775rem;
  }

  .review-question-card {
    padding: 0.75rem 0.85rem;
  }

  .review-opt-item {
    padding: 0.5rem 0.6rem;
  }

  .review-opt-text {
    font-size: 0.825rem;
  }

  .activity-card {
    padding: 0.9rem 1rem;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .card-top-row {
    gap: 0.5rem;
    align-items: flex-start;
  }

  .card-icon-badge {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
    margin-top: 1px;
  }

  .card-title-group {
    margin-right: 0.35rem;
  }

  .card-activity-title {
    font-size: 0.875rem;
    line-height: 1.3;
  }

  .card-status-col {
    margin-top: 1px;
  }

  .card-status-pill {
    font-size: 0.65rem;
    padding: 0.18rem 0.45rem;
    white-space: nowrap;
  }

  .card-description {
    font-size: 0.785rem;
    margin: 0.35rem 0 0.5rem 0;
  }

  .card-bottom-row {
    padding-top: 0.5rem;
  }

  .card-score-pill {
    font-size: 0.725rem;
    padding: 0.18rem 0.45rem;
  }

  .card-reading-progress,
  .card-submission-meta {
    font-size: 0.725rem;
  }

  .activity-btn {
    min-height: 44px;
    height: 44px;
    padding: 0 1rem;
    font-size: 0.85rem;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .activity-title {
    font-size: 0.95rem;
  }

  .activity-upload-section {
    padding-bottom: 4.5rem;
  }
}
</style>

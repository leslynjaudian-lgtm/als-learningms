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
        Retry Loading
      </button>
    </div>

    <!-- Main Module Study View -->
    <template v-else>
      <!-- Top Step Bar (Hidden when PDF is in full-screen reading mode to give maximum mobile viewport) -->
      <div v-if="currentStep !== 2 || isReviewingPdfOutside" class="step-navigation-container">
      <div class="step-nav-header">
        <router-link v-if="currentStep === 0" to="/modules" class="back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>My Modules</span>
        </router-link>
        <button v-else type="button" class="back-link btn-back-nav" @click="goToOverview">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Module Overview</span>
        </button>

        <div class="module-mini-meta">
          <span class="meta-strand-pill">{{ moduleStrandCode }}</span>
          <span class="meta-code">{{ moduleCode }}</span>
        </div>
      </div>

      <div class="module-main-header">
        <h1 class="module-heading">{{ moduleTitle }}</h1>
        <p class="module-subheading">{{ moduleSubheading }}</p>
      </div>

      <!-- 4-Step Horizontal Indicator -->
      <div class="stepper-track" role="navigation" aria-label="Module Steps">
        <div
          v-for="s in steps"
          :key="s.step"
          class="step-item"
          :class="{
            active: currentStep === s.step,
            completed: isStepCompleted(s.step),
            disabled: !isStepUnlocked(s.step)
          }"
          @click="onStepClick(s.step)"
        >
          <div class="step-circle">
            <!-- Checkmark icon if completed -->
            <svg v-if="isStepCompleted(s.step)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <!-- Step number otherwise -->
            <span v-else>{{ s.step }}</span>
          </div>
          <span class="step-name">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- STEP 0: MODULE OVERVIEW (Learning Steps & Progress)          -->
    <!-- ============================================================ -->
    <div v-if="currentStep === 0" class="module-overview-wrapper">
      <div class="overview-header-card">
        <div class="overview-header-top">
          <div class="overview-header-titles">
            <h2 class="overview-main-heading">Learning Steps &amp; Overview</h2>
            <div class="overview-meta-line">
              <span class="overview-strand-tag">{{ moduleStrandCode }}</span>
              <span class="overview-module-code">{{ moduleCode }}</span>
            </div>
          </div>
          <div class="overview-status-pill" :class="overallStatusClass">
            {{ overallStatusLabel }}
          </div>
        </div>

        <!-- Overall Progress Strip -->
        <div class="overview-progress-strip">
          <div class="strip-label-row">
            <span class="strip-title">Overall Completion</span>
            <span class="strip-pct">{{ computedProgressPercentage }}%</span>
          </div>
          <div class="strip-track">
            <div class="strip-fill" :style="{ width: `${computedProgressPercentage}%` }"></div>
          </div>
        </div>
      </div>

      <!-- 4 Learning Steps Cards -->
      <div class="overview-steps-vertical-list">
        <!-- Step 1 Card: Pre-Test -->
        <div
          class="overview-step-box"
          :class="{
            completed: isStepCompleted(1),
            active: !isStepCompleted(1)
          }"
        >
          <div class="step-card-header">
            <div class="step-badge-circle" :class="{ 'circle-done': isStepCompleted(1) }">
              <svg v-if="isStepCompleted(1)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span v-else>1</span>
            </div>
            <div class="step-status-wrap">
              <span class="step-tag-pill">Step 1</span>
              <span v-if="isStepCompleted(1)" class="step-status-pill status-completed">
                Completed &bull; Score: {{ progress.preTestScore ?? 0 }}/{{ preTestTotal }}
              </span>
              <span v-else class="step-status-pill status-ready">Ready to Start</span>
            </div>
          </div>

          <div class="step-card-body">
            <h3 class="step-box-title">Pre-Test (Diagnostic Assessment)</h3>
            <p class="step-box-desc">
              {{ isStepCompleted(1)
                ? 'Your answers have been recorded. You can review your results and feedback anytime.'
                : 'Measure your understanding before starting the lessons. Instant diagnostic feedback is provided.'
              }}
            </p>
          </div>

          <div class="step-card-footer">
            <button
              v-if="isStepCompleted(1)"
              type="button"
              class="btn-outline step-action-btn"
              @click="goToStep(1)"
            >
              <span>View Results</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button
              v-else
              type="button"
              class="btn-primary step-action-btn"
              @click="goToStep(1)"
            >
              <span>Start Pre-Test</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <!-- Step 2 Card: Learning Materials -->
        <div
          class="overview-step-box"
          :class="{
            completed: isStepCompleted(2),
            locked: !isStepUnlocked(2),
            active: isStepUnlocked(2) && !isStepCompleted(2)
          }"
        >
          <div class="step-card-header">
            <div
              class="step-badge-circle"
              :class="{
                'circle-done': isStepCompleted(2),
                'circle-locked': !isStepUnlocked(2)
              }"
            >
              <svg v-if="isStepCompleted(2)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <svg v-else-if="!isStepUnlocked(2)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span v-else>2</span>
            </div>
            <div class="step-status-wrap">
              <span class="step-tag-pill">Step 2</span>
              <span v-if="!isStepUnlocked(2)" class="step-status-pill status-locked">Locked</span>
              <span v-else-if="isStepCompleted(2)" class="step-status-pill status-completed">Completed</span>
              <span v-else-if="progress.readingStarted" class="step-status-pill status-in-progress">
                In Progress &bull; Page {{ progress.pdfCurrentPage || 1 }} of {{ progress.pdfTotalPages || 29 }}
              </span>
              <span v-else class="step-status-pill status-ready">Ready to Read</span>
            </div>
          </div>

          <div class="step-card-body">
            <h3 class="step-box-title">Learning Materials (Module Reader)</h3>
            <p class="step-box-desc">
              Study the module lessons with vertical Long Strip or horizontal Wide Strip mode, full-screen reading, and zoom.
            </p>
          </div>

          <div class="step-card-footer">
            <button
              v-if="isStepUnlocked(2)"
              type="button"
              class="btn-primary step-action-btn"
              @click="goToStep(2)"
            >
              <span>{{ progress.readingStarted ? `Continue Reading (p. ${progress.pdfCurrentPage || 1})` : 'Open Learning Module' }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button
              v-else
              type="button"
              class="btn-disabled step-action-btn"
              disabled
            >
              <span>Complete Pre-Test First</span>
            </button>
          </div>
        </div>

        <!-- Step 3 Card: Post-Test -->
        <div
          class="overview-step-box"
          :class="{
            completed: isStepCompleted(3),
            locked: !isStepUnlocked(3),
            active: isStepUnlocked(3) && !isStepCompleted(3)
          }"
        >
          <div class="step-card-header">
            <div
              class="step-badge-circle"
              :class="{
                'circle-done': isStepCompleted(3),
                'circle-locked': !isStepUnlocked(3)
              }"
            >
              <svg v-if="isStepCompleted(3)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <svg v-else-if="!isStepUnlocked(3)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span v-else>3</span>
            </div>
            <div class="step-status-wrap">
              <span class="step-tag-pill">Step 3</span>
              <span v-if="!isStepUnlocked(3)" class="step-status-pill status-locked">Locked</span>
              <span v-else-if="isStepCompleted(3)" class="step-status-pill status-completed">
                Completed &bull; Score: {{ progress.postTestScore ?? 0 }}/{{ postTestTotal }}
              </span>
              <span v-else class="step-status-pill status-ready">Ready to Take</span>
            </div>
          </div>

          <div class="step-card-body">
            <h3 class="step-box-title">Post-Test (Mastery Assessment)</h3>
            <p class="step-box-desc">
              Evaluate your mastery of the lessons and compare your pre-test and post-test scores.
            </p>
          </div>

          <div class="step-card-footer">
            <button
              v-if="isStepCompleted(3)"
              type="button"
              class="btn-outline step-action-btn"
              @click="goToStep(3)"
            >
              <span>View Results</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button
              v-else-if="isStepUnlocked(3)"
              type="button"
              class="btn-primary step-action-btn"
              @click="goToStep(3)"
            >
              <span>Start Post-Test</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button
              v-else
              type="button"
              class="btn-disabled step-action-btn"
              disabled
            >
              <span>Read Module to Unlock</span>
            </button>
          </div>
        </div>

        <!-- Step 4 Card: Activities & Outputs -->
        <div
          class="overview-step-box"
          :class="{
            completed: isStepCompleted(4),
            locked: !isStepUnlocked(4),
            active: isStepUnlocked(4) && !isStepCompleted(4)
          }"
        >
          <div class="step-card-header">
            <div
              class="step-badge-circle"
              :class="{
                'circle-done': isStepCompleted(4),
                'circle-locked': !isStepUnlocked(4)
              }"
            >
              <svg v-if="isStepCompleted(4)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <svg v-else-if="!isStepUnlocked(4)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span v-else>4</span>
            </div>
            <div class="step-status-wrap">
              <span class="step-tag-pill">Step 4</span>
              <span v-if="!isStepUnlocked(4)" class="step-status-pill status-locked">Locked</span>
              <span v-else-if="isStepCompleted(4)" class="step-status-pill status-completed">Submitted</span>
              <span v-else class="step-status-pill status-ready">Ready to Submit</span>
            </div>
          </div>

          <div class="step-card-body">
            <h3 class="step-box-title">Activity Submission (Handwritten Work)</h3>
            <p class="step-box-desc">
              {{ !isStepUnlocked(4)
                ? 'Locked until you complete the Post-Test. Upload photos or PDF copies of your handwritten activity outputs once unlocked.'
                : 'Upload photos or PDF copies of your handwritten activity outputs for teacher evaluation.'
              }}
            </p>
          </div>

          <div class="step-card-footer">
            <button
              v-if="isStepCompleted(4)"
              type="button"
              class="btn-outline step-action-btn"
              @click="goToStep(4)"
            >
              <span>View Submission</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button
              v-else-if="isStepUnlocked(4)"
              type="button"
              class="btn-primary step-action-btn"
              @click="goToStep(4)"
            >
              <span>Upload Activities</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button
              v-else
              type="button"
              class="btn-disabled step-action-btn"
              disabled
            >
              <span>Complete Post-Test to Unlock</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- STEP 1: PRE-TEST (Multiple-Choice Questions)                 -->
    <!-- ============================================================ -->
    <div v-else-if="currentStep === 1" class="step-content-card">
      <!-- No Pre-Test Questions Configured -->
      <div v-if="preTestQuestions.length === 0" class="score-summary-box">
        <div class="score-icon-badge">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#165dfc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        <span class="summary-status-pill">Ready to Study</span>
        <h2 class="summary-title">No Pre-Test Required</h2>
        <p class="summary-desc">
          This module does not require a diagnostic assessment. You can proceed directly to the learning materials.
        </p>

        <button
          type="button"
          class="btn-primary summary-action-btn"
          @click="proceedToModuleReader"
        >
          <span>Proceed to Learning Module</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <!-- In Progress: Question by Question -->
      <template v-else-if="!progress.preTestCompleted && !showingPreTestScore">
        <div class="assessment-header">
          <div class="assessment-eyebrow">
            <span class="step-badge">Diagnostic Assessment</span>
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
                selected: selectedPreAnswer === opt.id,
                correct: isPreSubmitted && opt.id === currentPreQ.correctAnswer,
                incorrect: isPreSubmitted && selectedPreAnswer === opt.id && opt.id !== currentPreQ.correctAnswer,
                locked: isPreSubmitted
              }"
              :disabled="isPreSubmitted"
              @click="onSelectPreAnswer(opt.id)"
            >
              <div class="opt-letter-circle">
                <span v-if="!isPreSubmitted || (opt.id !== currentPreQ.correctAnswer && selectedPreAnswer !== opt.id)">
                  {{ opt.letter || opt.id }}
                </span>
                <svg v-else-if="opt.id === currentPreQ.correctAnswer" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <svg v-else-if="selectedPreAnswer === opt.id" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
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
          <p class="feedback-detail">{{ currentPreQ.feedback }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="assessment-actions">
          <button
            v-if="!isPreSubmitted"
            type="button"
            class="btn-primary action-btn"
            :disabled="!selectedPreAnswer"
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

      <!-- Pre-Test Completed / Score Summary & Read-Only Review View -->
      <template v-else>
        <!-- Notice Banner: Pre-Test is Completed and Cannot Be Re-taken -->
        <div class="pretest-notice-banner">
          <div class="banner-icon-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="banner-text-wrap">
            <span class="banner-status-tag">Pre-Test Completed</span>
            <p class="banner-message">
              Pre-Test Completed. You have already submitted your answers. You can review your results, but you cannot answer again.
            </p>
          </div>
        </div>

        <div class="score-summary-box">
          <div class="score-highlight-card">
            <div class="score-number-display">
              <span class="score-big">{{ progress.preTestScore ?? 0 }}</span>
              <span class="score-divider">/</span>
              <span class="score-total">{{ preTestTotal }}</span>
            </div>
            <div class="score-percentage-tag">
              {{ Math.round(((progress.preTestScore ?? 0) / preTestTotal) * 100) }}% Score
            </div>
          </div>

          <div class="instruction-box">
            <strong>Diagnostic Results Recorded:</strong> This pre-test assessed your initial understanding. Proceed to study the module lessons or review your answers below.
          </div>

          <div class="summary-button-group">
            <button
              type="button"
              class="btn-primary summary-action-btn"
              @click="proceedToModuleReader"
            >
              <span>{{ progress.readingStarted ? `Continue Reading (p. ${progress.pdfCurrentPage || 1})` : 'Proceed to Learning Module' }}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button
              type="button"
              class="btn-secondary overview-btn"
              @click="goToOverview"
            >
              <span>Back to Module Overview</span>
            </button>
          </div>
        </div>

        <!-- Read-Only Review of Submitted Questions & Answers -->
        <div v-if="preTestQuestions.length > 0" class="readonly-review-section">
          <div class="review-section-header">
            <h3 class="review-title">Review Submitted Answers &amp; Feedback</h3>
            <span class="review-count">{{ preTestQuestions.length }} Questions</span>
          </div>

          <div class="review-questions-list">
            <div
              v-for="(q, qIdx) in preTestQuestions"
              :key="`pre-review-${q.id || qIdx}`"
              class="review-question-card"
            >
              <div class="review-q-header">
                <span class="q-num-pill">Question {{ qIdx + 1 }}</span>
                <span
                  class="q-result-tag"
                  :class="progress.preTestAnswers[q.id] === q.correctAnswer ? 'tag-correct' : 'tag-incorrect'"
                >
                  <svg v-if="progress.preTestAnswers[q.id] === q.correctAnswer" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  <span>{{ progress.preTestAnswers[q.id] === q.correctAnswer ? 'Correct' : 'Incorrect' }}</span>
                </span>
              </div>

              <h4 class="review-q-text">{{ q.question }}</h4>

              <div class="review-options-list">
                <div
                  v-for="opt in q.options"
                  :key="opt.id"
                  class="review-opt-item"
                  :class="{
                    'chosen-correct': progress.preTestAnswers[q.id] === opt.id && opt.id === q.correctAnswer,
                    'chosen-wrong': progress.preTestAnswers[q.id] === opt.id && opt.id !== q.correctAnswer,
                    'is-correct-target': opt.id === q.correctAnswer && progress.preTestAnswers[q.id] !== opt.id
                  }"
                >
                  <div class="review-opt-circle">
                    <span v-if="progress.preTestAnswers[q.id] !== opt.id && opt.id !== q.correctAnswer">
                      {{ opt.letter || opt.id }}
                    </span>
                    <svg v-else-if="opt.id === q.correctAnswer" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <svg v-else-if="progress.preTestAnswers[q.id] === opt.id" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </div>
                  <span class="review-opt-text">{{ opt.text }}</span>
                  <span v-if="progress.preTestAnswers[q.id] === opt.id" class="badge-user-choice">Your Answer</span>
                  <span v-else-if="opt.id === q.correctAnswer" class="badge-correct-choice">Correct Answer</span>
                </div>
              </div>

              <div v-if="q.feedback" class="review-feedback-card">
                <strong>Feedback:</strong> {{ q.feedback }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ============================================================ -->
    <!-- STEP 2: LEARNING MODULE (PDF Viewer)                         -->
    <!-- ============================================================ -->
    <div v-else-if="currentStep === 2" class="step-reader-wrapper">
      <MockPdfViewer
        :pdfUrl="pdfUrl"
        :title="moduleTitle"
        :code="moduleCode"
        :subtitle="moduleStrandCode"
        :initialPage="progress.pdfCurrentPage || 1"
        :initialMode="progress.pdfViewMode || 'long'"
        @back="onViewerBack"
        @proceed-to-post-test="onViewerProceedToPostTest"
        @update-progress="onViewerProgressUpdate"
      />
    </div>

    <!-- ============================================================ -->
    <!-- STEP 3: POST-TEST (Multiple-Choice Questions)                -->
    <!-- ============================================================ -->
    <div v-else-if="currentStep === 3" class="step-content-card">
      <!-- No Post-Test Questions Configured -->
      <div v-if="postTestQuestions.length === 0" class="score-summary-box">
        <div class="score-icon-badge post-badge-circle">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>

        <span class="summary-status-pill post-pill">Mastery Assessment Skipped</span>
        <h2 class="summary-title">No Post-Test Required</h2>
        <p class="summary-desc">
          This module does not require a mastery post-test. Continue to submit your activity outputs.
        </p>

        <button
          type="button"
          class="btn-primary summary-action-btn"
          @click="proceedToActivitySubmission"
        >
          <span>Continue to Activity Submission</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <!-- In Progress: Question by Question -->
      <template v-else-if="!progress.postTestCompleted && !showingPostTestScore">
        <div class="assessment-header">
          <div class="assessment-eyebrow">
            <span class="step-badge post-badge">Mastery Assessment</span>
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

          <!-- Options -->
          <div class="options-list">
            <button
              v-for="opt in currentPostQ.options"
              :key="opt.id"
              type="button"
              class="option-item"
              :class="{
                selected: selectedPostAnswer === opt.id,
                correct: isPostSubmitted && opt.id === currentPostQ.correctAnswer,
                incorrect: isPostSubmitted && selectedPostAnswer === opt.id && opt.id !== currentPostQ.correctAnswer,
                locked: isPostSubmitted
              }"
              :disabled="isPostSubmitted"
              @click="onSelectPostAnswer(opt.id)"
            >
              <div class="opt-letter-circle">
                <span v-if="!isPostSubmitted || (opt.id !== currentPostQ.correctAnswer && selectedPostAnswer !== opt.id)">
                  {{ opt.letter || opt.id }}
                </span>
                <svg v-else-if="opt.id === currentPostQ.correctAnswer" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <svg v-else-if="selectedPostAnswer === opt.id" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <span class="opt-text">{{ opt.text }}</span>
            </button>
          </div>
        </div>

        <!-- Feedback Card -->
        <div
          v-if="isPostSubmitted"
          class="feedback-card"
          :class="isPostAnswerCorrect ? 'feedback-correct' : 'feedback-incorrect'"
        >
          <div class="feedback-heading">
            <svg v-if="isPostAnswerCorrect" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <strong>{{ isPostAnswerCorrect ? 'Correct!' : 'Incorrect' }}</strong>
          </div>
          <p class="feedback-detail">{{ currentPostQ.feedback }}</p>
        </div>

        <!-- Actions -->
        <div class="assessment-actions">
          <button
            v-if="!isPostSubmitted"
            type="button"
            class="btn-primary action-btn"
            :disabled="!selectedPostAnswer"
            @click="submitPostAnswer"
          >
            Submit Answer
          </button>
          <button
            v-else
            type="button"
            class="btn-primary action-btn"
            @click="nextPostQuestion"
          >
            <span>{{ currentPostQIndex + 1 < postTestQuestions.length ? 'Next Question' : 'View Post-Test Results' }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </template>

      <!-- Post-Test Comparison & Mastery Summary View -->
      <template v-else>
        <div class="score-summary-box">
          <div class="score-icon-badge post-badge-circle">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>

          <span class="summary-status-pill post-pill">Post-Test Completed</span>
          <h2 class="summary-title">Learning Mastery Results</h2>
          <p class="summary-desc">
            Compare your understanding before and after studying <em>{{ moduleTitle }}</em>.
          </p>

          <!-- Dynamic Comparison Cards -->
          <div class="comparison-grid">
            <div class="comp-card">
              <span class="comp-label">Pre-Test Score</span>
              <div class="comp-val">{{ progress.preTestScore }} / {{ preTestTotal }}</div>
              <span class="comp-sub">{{ Math.round((progress.preTestScore / preTestTotal) * 100) }}%</span>
            </div>

            <div class="comp-card highlight-post">
              <span class="comp-label">Post-Test Score</span>
              <div class="comp-val text-green">{{ progress.postTestScore }} / {{ postTestTotal }}</div>
              <span class="comp-sub">{{ Math.round((progress.postTestScore / postTestTotal) * 100) }}%</span>
            </div>

            <div class="comp-card highlight-delta">
              <span class="comp-label">Improvement</span>
              <div class="comp-val" :class="scoreImprovement >= 0 ? 'text-blue' : 'text-amber'">
                {{ scoreImprovement >= 0 ? `+${scoreImprovement}` : scoreImprovement }} pts
              </div>
              <span class="comp-sub">percentage points</span>
            </div>
          </div>

          <div class="instruction-box">
            <strong>Next Step:</strong> You are ready for the final step. Take clear photos of your handwritten answers or upload your PDF output for the activities.
          </div>

          <button
            type="button"
            class="btn-primary summary-action-btn"
            @click="proceedToActivitySubmission"
          >
            <span>Continue to Activity Submission</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </template>
    </div>

    <!-- ============================================================ -->
    <!-- STEP 4: HANDWRITTEN ACTIVITY SUBMISSION (Images / PDF)        -->
    <!-- ============================================================ -->
    <div v-else-if="currentStep === 4" class="step-content-card">
      <div class="activity-upload-section">
        <div class="activity-header">
          <span class="step-badge">Final Step</span>
          <h2 class="activity-title">Upload Activity Answers</h2>
          <p class="activity-desc">
            Take clear photos of your answers written on paper, or upload them as a PDF. Make sure your answers are readable.
          </p>
        </div>

        <!-- Success Banner if already submitted -->
        <div v-if="progress.activitySubmitted" class="submitted-demo-banner">
          <div class="demo-badge-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div>
              <h3 class="demo-success-title">{{ isMock ? 'Activities Submitted (Demo)' : 'Activities Submitted' }}</h3>
              <p class="demo-success-text">
                {{ isMock ? 'Your activity answers have been saved for this demonstration.' : 'Your activity output has been uploaded and submitted to your teacher.' }}
              </p>
            </div>
          </div>
          <p class="demo-disclaimer">
            {{ isMock ? 'Note: This is a working mock demonstration for previewing the learner experience. Your activity outputs have been recorded in browser storage and this module is now marked Completed.' : 'Your activities have been recorded. Your teacher can now review and grade your work.' }}
          </p>
        </div>

        <!-- File Upload Area -->
        <div
          v-if="!progress.activitySubmitted"
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
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#165dfc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

        <!-- Selected Files List & Previews -->
        <div v-if="selectedFiles.length > 0" class="selected-files-container">
          <h3 class="files-heading">Selected Files ({{ selectedFiles.length }})</h3>

          <div class="files-grid">
            <div
              v-for="(f, fIdx) in selectedFiles"
              :key="`file-${fIdx}`"
              class="file-item-card"
            >
              <!-- Thumbnail -->
              <div class="file-thumb-wrap">
                <img
                  v-if="f.previewUrl"
                  :src="f.previewUrl"
                  alt="Preview"
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

              <!-- Remove button -->
              <button
                v-if="!progress.activitySubmitted"
                type="button"
                class="file-remove-btn"
                @click="removeFile(fIdx)"
                title="Remove file"
                aria-label="Remove file"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        <!-- Saved Submitted Files if returning to page -->
        <div v-else-if="progress.activitySubmitted && progress.submittedFilesMeta?.length > 0" class="selected-files-container">
          <h3 class="files-heading">Uploaded Files Recorded ({{ progress.submittedFilesMeta.length }})</h3>
          <div class="files-grid">
            <div
              v-for="(f, fIdx) in progress.submittedFilesMeta"
              :key="`saved-${fIdx}`"
              class="file-item-card"
            >
              <div class="file-thumb-wrap">
                <div class="file-pdf-thumb">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#165dfc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
              </div>
              <div class="file-details">
                <span class="file-name">{{ f.name }}</span>
                <span class="file-size">{{ formatFileSize(f.size) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Activities Button -->
        <div class="activity-actions">
          <button
            v-if="!progress.activitySubmitted"
            type="button"
            class="btn-primary submit-activities-btn"
            :disabled="selectedFiles.length === 0 || isSubmittingActivity"
            @click="handleSubmitActivities"
          >
            <span v-if="isSubmittingActivity">Submitting Activities...</span>
            <span v-else>Submit Activities</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <!-- Module Completed Actions -->
          <div v-else class="completed-nav-buttons">
            <button
              type="button"
              class="btn-outline re-read-btn"
              @click="reopenPdfViewer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <span>Reopen Learning Module</span>
            </button>

            <router-link
              to="/modules"
              class="btn-primary return-modules-btn"
            >
              <span>Back to My Modules</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </router-link>
          </div>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api/axios';
import MockPdfViewer from '../components/MockPdfViewer.vue';
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

const choiceLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

function normalizeQuestion(q, index) {
  if (q.options && q.options[0]?.text && q.correctAnswer !== undefined) {
    return {
      id: q.id,
      question: q.question || q.questionText,
      options: q.options.map((opt, oIdx) => ({
        id: opt.id,
        letter: opt.letter || (typeof opt.id === 'string' && opt.id.length === 1 ? opt.id : choiceLetters[oIdx] || String(oIdx + 1)),
        text: opt.text || opt.optionText,
        rawId: opt.rawId || opt.id,
        isCorrect: opt.isCorrect ?? (opt.id === q.correctAnswer)
      })),
      correctAnswer: q.correctAnswer,
      feedback: q.feedback || q.explanation || (q.options.find((o) => o.isCorrect || o.id === q.correctAnswer)?.text ? `The correct answer is: ${q.options.find((o) => o.isCorrect || o.id === q.correctAnswer)?.text}` : 'Review the module lessons to understand this concept.')
    };
  }

  const opts = Array.isArray(q.options) ? q.options : [];
  const correctOpt = opts.find((o) => o.isCorrect);
  const correctOptId = correctOpt ? correctOpt.id : (opts[0]?.id || 1);

  return {
    id: q.id,
    question: q.questionText || q.prompt || `Question ${index + 1}`,
    options: opts.map((o, oIdx) => ({
      id: o.id,
      letter: choiceLetters[oIdx] || String(oIdx + 1),
      text: o.optionText || o.text || '',
      rawId: o.id,
      isCorrect: Boolean(o.isCorrect)
    })),
    correctAnswer: correctOptId,
    feedback: q.explanation?.trim() || (correctOpt?.optionText ? `The correct answer is: ${correctOpt.optionText}` : 'Correct answer verified.')
  };
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
      return {
        currentStep: parsed.currentStep !== undefined ? parsed.currentStep : 0,
        highestUnlockedStep: parsed.highestUnlockedStep || 1,
        preTestCompleted: Boolean(parsed.preTestCompleted),
        preTestScore: parsed.preTestScore != null ? Number(parsed.preTestScore) : null,
        preTestAnswers: parsed.preTestAnswers || {},
        readingStarted: Boolean(parsed.readingStarted),
        readingConfirmed: Boolean(parsed.readingConfirmed),
        pdfCurrentPage: parsed.pdfCurrentPage || 1,
        pdfTotalPages: parsed.pdfTotalPages || 29,
        pdfViewMode: parsed.pdfViewMode || 'long',
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
    postTestCompleted: false,
    postTestScore: null,
    postTestAnswers: {},
    activitySubmitted: false,
    submittedFilesMeta: [],
    completedAt: null
  };
}

function saveProgress(val) {
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
}

const progress = ref(loadProgress());
const currentStep = ref(progress.value.currentStep !== undefined ? progress.value.currentStep : 0);

// Overview Progress Computed Values
const computedProgressPercentage = computed(() => {
  let count = 0;
  if (isStepCompleted(1)) count += 25;
  if (isStepCompleted(2)) count += 25;
  if (isStepCompleted(3)) count += 25;
  if (isStepCompleted(4)) count += 25;
  return count;
});

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

// Step 4: Activity submission state
const fileInputRef = ref(null);
const selectedFiles = ref([]);
const isDragging = ref(false);
const uploadError = ref('');
const isReviewingPdfOutside = ref(false);

const steps = [
  { step: 1, label: 'Pre-Test' },
  { step: 2, label: 'Learning Module' },
  { step: 3, label: 'Post-Test' },
  { step: 4, label: 'Activity Submission' }
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

const currentPreQ = computed(() => preTestQuestions.value[currentPreQIndex.value] || preTestQuestions.value[0] || {});
const isPreAnswerCorrect = computed(() => selectedPreAnswer.value === currentPreQ.value.correctAnswer);

const currentPostQ = computed(() => postTestQuestions.value[currentPostQIndex.value] || postTestQuestions.value[0] || {});
const isPostAnswerCorrect = computed(() => selectedPostAnswer.value === currentPostQ.value.correctAnswer);

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
  if (isMock.value) return MOCK_MODULE.strandCode;
  return moduleData.value?.strandCode || moduleData.value?.learningArea?.code || 'LS';
});

const moduleSubheading = computed(() => {
  if (isMock.value) return MOCK_MODULE.strand;
  return moduleData.value?.strand || moduleData.value?.learningArea?.name || 'General Curriculum';
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

const preTestTotal = computed(() => {
  return preTestQuestions.value.length || 10;
});

const postTestTotal = computed(() => {
  return postTestQuestions.value.length || 10;
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
  if (stepNum === 1) return progress.value.preTestCompleted || preTestQuestions.value.length === 0;
  if (stepNum === 2) return progress.value.readingConfirmed || (progress.value.pdfCurrentPage && progress.value.pdfCurrentPage >= (progress.value.pdfTotalPages || 29));
  if (stepNum === 3) return progress.value.postTestCompleted || postTestQuestions.value.length === 0;
  if (stepNum === 4) return progress.value.activitySubmitted;
  return false;
}

function isStepUnlocked(stepNum) {
  if (stepNum === 1) return true;
  if (stepNum === 2) return progress.value.preTestCompleted || preTestQuestions.value.length === 0;
  if (stepNum === 3) return progress.value.readingStarted || progress.value.readingConfirmed;
  if (stepNum === 4) return progress.value.postTestCompleted || postTestQuestions.value.length === 0;
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
  selectedPreAnswer.value = optId;
}

function submitPreAnswer() {
  if (!selectedPreAnswer.value) return;
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

  if (!isMock.value) {
    api.post(`/modules/${effectiveModuleId.value}/progress`, {
      status: 'IN_PROGRESS',
      completedPages: progress.value.pdfCurrentPage || 1,
      totalPages: 29
    }).catch(() => {});
  }
}

// ==========================================
// PDF VIEWER EVENTS
// ==========================================
function onViewerBack() {
  goToOverview();
}

function onViewerProceedToPostTest() {
  progress.value.readingConfirmed = true;
  progress.value.highestUnlockedStep = Math.max(progress.value.highestUnlockedStep || 1, 3);
  currentStep.value = 3;
  progress.value.currentStep = 3;
  saveProgress();

  if (!isMock.value) {
    api.post(`/modules/${effectiveModuleId.value}/progress`, {
      status: 'IN_PROGRESS',
      completedPages: progress.value.pdfCurrentPage || 1,
      totalPages: progress.value.pdfTotalPages || moduleData.value?._count?.pages || 29
    }).catch(() => {});
  }
}

function onViewerProgressUpdate({ page, mode, totalPages }) {
  progress.value.pdfCurrentPage = page;
  progress.value.pdfViewMode = mode;
  if (totalPages) {
    progress.value.pdfTotalPages = totalPages;
  }
  saveProgress();
}

function reopenPdfViewer() {
  currentStep.value = 2;
}

// ==========================================
// POST-TEST LOGIC
// ==========================================
function onSelectPostAnswer(optId) {
  if (isPostSubmitted.value) return;
  selectedPostAnswer.value = optId;
}

function submitPostAnswer() {
  if (!selectedPostAnswer.value) return;
  isPostSubmitted.value = true;

  // Record answer locally
  progress.value.postTestAnswers[currentPostQ.value.id] = selectedPostAnswer.value;
  saveProgress();
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
}

// ==========================================
// STEP 4: ACTIVITY SUBMISSION
// ==========================================
function triggerFileInput() {
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

    for (const f of selectedFiles.value) {
      let uploadedFileUrl = null;
      try {
        const formData = new FormData();
        formData.append('file', f.file);
        const upRes = await api.post('/modules/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedFileUrl = upRes.data?.fileUrl;
      } catch (uploadErr) {
        console.warn('Upload endpoint error, proceeding with submission record:', uploadErr);
      }

      await api.post('/submissions', {
        moduleId: Number(effectiveModuleId.value),
        title: `${moduleTitle.value} - Activity Output`,
        fileUrl: uploadedFileUrl || null,
        fileName: f.name,
        content: `Uploaded activity output: ${f.name}`
      });

      uploadedFilesMeta.push({
        name: f.name,
        size: f.size,
        type: f.type,
        uploadedAt: new Date().toISOString()
      });
    }

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
  } catch (err) {
    console.error('Failed to submit activities:', err);
    uploadError.value = err.response?.data?.error || 'Failed to submit activities. Please check your connection and try again.';
  } finally {
    isSubmittingActivity.value = false;
  }
}

// Fetch Module Data
async function fetchModuleData() {
  if (!effectiveModuleId.value || effectiveModuleId.value === 'ls2-mock-001') {
    router.replace('/modules');
    return;
  }

  isLoading.value = true;
  loadError.value = '';

  try {
    const res = await api.get(`/modules/${effectiveModuleId.value}`);
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

    // Restore Reading Progress from backend learnerProgress
    const lp = mod.learnerProgress?.[0];
    if (lp) {
      if (lp.completedPages) {
        progress.value.pdfCurrentPage = Math.max(progress.value.pdfCurrentPage || 1, lp.completedPages);
        progress.value.readingStarted = true;
      }
      if (lp.totalPages) {
        progress.value.pdfTotalPages = lp.totalPages;
      }
      if (lp.status === 'COMPLETED') {
        progress.value.readingConfirmed = true;
      }
    }

    if (mod.completed) {
      progress.value.readingConfirmed = true;
      progress.value.activitySubmitted = true;
      progress.value.highestUnlockedStep = 4;
    }

    // Fetch existing submissions
    try {
      const subRes = await api.get(`/submissions?moduleId=${effectiveModuleId.value}`);
      const subs = Array.isArray(subRes.data) ? subRes.data : [];
      if (subs.length > 0) {
        progress.value.activitySubmitted = true;
        progress.value.highestUnlockedStep = 4;
        if (!progress.value.submittedFilesMeta?.length) {
          progress.value.submittedFilesMeta = subs.map((s) => ({
            name: s.fileName || s.title || 'Submitted Activity',
            size: s.fileSize || 0,
            type: s.fileType || 'application/pdf',
            uploadedAt: s.createdAt || new Date().toISOString()
          }));
        }
      }
    } catch (subErr) {
      console.warn('Could not check submissions:', subErr);
    }

    currentStep.value = progress.value.currentStep !== undefined ? progress.value.currentStep : 0;
    saveProgress();
  } catch (err) {
    console.error('Failed to load module data:', err);
    loadError.value = err.response?.data?.error || 'Failed to load module. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => effectiveModuleId.value,
  () => {
    fetchModuleData();
  }
);

onMounted(() => {
  fetchModuleData();
});
</script>

<style scoped>
.mock-study-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
  padding-bottom: calc(84px + env(safe-area-inset-bottom, 16px));
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

/* Step Bar Container */
.step-navigation-container {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  width: 100%;
  box-sizing: border-box;
}

.step-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #165dfc;
  text-decoration: none;
}

.btn-back-nav {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.module-mini-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.meta-strand-pill {
  font-size: 0.65rem;
  font-weight: 800;
  background: #eff6ff;
  color: #165dfc;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
}

.meta-code {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
}

.module-main-header {
  margin-bottom: 0.85rem;
}

.module-heading {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
  margin: 0 0 0.2rem 0;
  word-break: break-word;
}

.module-subheading {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
  word-break: break-word;
}

/* 4-Step Horizontal Indicator */
.stepper-track {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  margin-top: 0.75rem;
  padding: 0;
  gap: 0.25rem;
  width: 100%;
  box-sizing: border-box;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  z-index: 2;
  flex: 1;
  min-width: 0;
  text-align: center;
  transition: all 0.15s ease;
  padding: 0 2px;
  box-sizing: border-box;
}

.step-item.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 2px solid #cbd5e1;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.step-item.active .step-circle {
  background: #165dfc;
  border-color: #165dfc;
  color: #ffffff;
  box-shadow: 0 0 0 3px rgba(22, 93, 252, 0.2);
}

.step-item.completed .step-circle {
  background: #16a34a;
  border-color: #16a34a;
  color: #ffffff;
}

.step-name {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  text-align: center;
  line-height: 1.15;
  word-break: normal;
  overflow-wrap: break-word;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.step-item.active .step-name {
  color: #165dfc;
}

.step-item.completed .step-name {
  color: #15803d;
}

/* Card Content */
.step-content-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  margin: 0 0.85rem;
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

.opt-letter-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  flex-shrink: 0;
}

.option-item.selected .opt-letter-circle {
  background: #165dfc;
  border-color: #165dfc;
  color: #ffffff;
}

.option-item.correct .opt-letter-circle {
  background: #16a34a;
  border-color: #16a34a;
  color: #ffffff;
}

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

/* Module Overview Styles - Mobile-First */
.module-overview-wrapper {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.overview-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.15rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
  width: 100%;
}

.overview-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.overview-header-titles {
  flex: 1;
  min-width: 0;
}

.overview-main-heading {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.35rem 0;
  line-height: 1.3;
  word-break: break-word;
}

.overview-meta-line {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.overview-strand-tag {
  font-size: 0.7rem;
  font-weight: 800;
  background: #eff6ff;
  color: #165dfc;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
}

.overview-module-code {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

.overview-status-pill {
  font-size: 0.725rem;
  font-weight: 800;
  padding: 0.3rem 0.65rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-completed {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.status-in-progress {
  background: #eff6ff;
  color: #165dfc;
  border: 1px solid #bfdbfe;
}

.status-not-started {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.overview-progress-strip {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 0.75rem 0.85rem;
  box-sizing: border-box;
}

.strip-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
}

.strip-title {
  color: #475569;
}

.strip-pct {
  color: #165dfc;
  font-weight: 800;
  font-size: 0.85rem;
}

.strip-track {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.strip-fill {
  height: 100%;
  background: linear-gradient(90deg, #165dfc 0%, #3b82f6 100%);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.overview-steps-vertical-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  box-sizing: border-box;
}

.overview-step-box {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
}

.overview-step-box.active {
  border-color: #165dfc;
  box-shadow: 0 0 0 1px #165dfc, 0 2px 8px rgba(22, 93, 252, 0.08);
}

.overview-step-box.completed {
  border-color: #86efac;
  background: #fcfdfc;
}

.overview-step-box.locked {
  background: #f8fafc;
  border-color: #e2e8f0;
  opacity: 0.85;
}

.step-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
}

.step-badge-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #eff6ff;
  border: 2px solid #165dfc;
  color: #165dfc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.step-badge-circle.circle-done {
  background: #16a34a;
  border-color: #16a34a;
  color: #ffffff;
}

.step-badge-circle.circle-locked {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #94a3b8;
}

.step-status-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  min-width: 0;
  flex: 1;
}

.step-tag-pill {
  font-size: 0.7rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
}

.step-status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  line-height: 1.3;
}

.step-status-pill.status-ready {
  background: #eff6ff;
  color: #165dfc;
  border: 1px solid #bfdbfe;
}

.step-status-pill.status-locked {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

.step-status-pill.status-completed {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.step-status-pill.status-in-progress {
  background: #eff6ff;
  color: #165dfc;
  border: 1px solid #bfdbfe;
}

.step-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
  min-width: 0;
}

.step-box-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.35;
  word-break: break-word;
}

.step-box-desc {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.45;
  margin: 0;
  word-break: break-word;
}

.step-card-footer {
  width: 100%;
  margin-top: 0.25rem;
}

.step-action-btn {
  width: 100%;
  max-width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  box-sizing: border-box;
  cursor: pointer;
  text-decoration: none;
  min-height: 44px;
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

/* Read-Only Review Section */
.readonly-review-section {
  margin-top: 2rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
  text-align: left;
}

.review-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.review-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.review-count {
  font-size: 0.75rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #64748b;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
}

.review-questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.review-question-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.15rem;
}

.review-q-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
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
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
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
  margin: 0 0 0.85rem 0;
  line-height: 1.4;
}

.review-options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}

.review-opt-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  position: relative;
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

.review-opt-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  flex-shrink: 0;
}

.review-opt-text {
  flex: 1;
}

.badge-user-choice {
  font-size: 0.675rem;
  font-weight: 800;
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.chosen-correct .badge-user-choice {
  background: #dcfce7;
  color: #15803d;
}

.badge-correct-choice {
  font-size: 0.675rem;
  font-weight: 800;
  background: #dcfce7;
  color: #15803d;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.review-feedback-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #165dfc;
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.45;
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
  .module-overview-wrapper {
    max-width: 720px;
    margin: 0 auto;
  }

  .overview-header-card {
    padding: 1.5rem;
  }

  .overview-main-heading {
    font-size: 1.35rem;
  }

  .overview-step-box {
    padding: 1.35rem;
  }

  .step-action-btn {
    width: auto;
    align-self: flex-start;
    padding: 0.7rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .step-content-card {
    margin: 0 0.25rem;
    padding: 1rem;
  }

  .overview-header-card {
    padding: 1rem;
  }

  .overview-step-box {
    padding: 1rem;
  }

  .step-name {
    font-size: 0.625rem;
  }

  .step-circle {
    width: 26px;
    height: 26px;
    font-size: 0.7rem;
  }
}

@media (max-width: 360px) {
  .comparison-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .step-name {
    font-size: 0.575rem;
  }

  .overview-main-heading {
    font-size: 1.05rem;
  }
}
</style>

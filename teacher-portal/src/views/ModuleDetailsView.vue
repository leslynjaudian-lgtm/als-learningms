<template>
  <div class="module-details-page">
    <!-- Top Breadcrumb / Back Navigation (Hidden when in Full-Width Review Learner Activity Page) -->
    <div v-if="!showReviewModal || !currentSubmission" class="back-nav-bar">
      <router-link :to="backToModulesRoute" class="btn-back-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Back to Modules</span>
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="details-loading-state">
      <div class="loading-spinner"></div>
      <p>Loading module details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="details-error-state">
      <div class="error-icon-box">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3>Module Not Found</h3>
      <p>{{ errorMessage }}</p>
      <router-link :to="backToModulesRoute" class="btn-primary-back">
        Return to Modules Feed
      </router-link>
    </div>

    <!-- Main Module Details Content -->
    <div v-else-if="moduleData && (!showReviewModal || !currentSubmission)" class="module-main-container">
      <!-- Header Banner Card -->
      <div class="module-hero-card">
        <div class="hero-header-split">
          <div class="hero-header-main">
            <h1 class="hero-module-title">{{ moduleData.title }}</h1>
          </div>

          <!-- Top-Right Actions: Edit & Delete -->
          <div class="hero-header-actions">
            <button
              type="button"
              class="btn-module-action btn-module-edit"
              title="Edit Module Information"
              @click="openEditModal"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit</span>
            </button>
            <button
              type="button"
              class="btn-module-action btn-module-delete"
              title="Delete Module"
              @click="openDeleteModal"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="module-nav-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'details' }"
            @click="activeTab = 'details'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>Details</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'submissions' }"
            @click="activeTab = 'submissions'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <polyline points="17 11 19 13 23 9"/>
            </svg>
            <span>Submissions</span>
            <span class="tab-counter-badge">{{ submissions.length }}</span>
          </button>
        </div>
      </div>

      <!-- TAB 1: DETAILS -->
      <div v-show="activeTab === 'details'" class="tab-pane-content">
        <!-- 1. Overview Card: 5 Horizontal Details + Side-by-Side Instructions & Related Activities -->
        <div class="content-section-card details-overview-card">
          <!-- 5 Horizontal Module Details Row -->
          <div class="module-info-horizontal-row">
            <!-- 1. Module Code -->
            <div class="info-strip-item">
              <div class="info-strip-icon accent-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              </div>
              <div class="info-strip-text">
                <span class="info-strip-label">Module Code</span>
                <span class="info-strip-value code-accent">{{ moduleData.code || resolveModuleCodeFromStrand(moduleData.strand) || '—' }}</span>
              </div>
            </div>

            <!-- 2. Target ALS Level -->
            <div class="info-strip-item">
              <div class="info-strip-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <div class="info-strip-text">
                <span class="info-strip-label">Target ALS Level</span>
                <span class="info-strip-value">{{ formatAlsLevelDisplay(moduleData.level) }}</span>
              </div>
            </div>

            <!-- 3. Learning Strand -->
            <div class="info-strip-item">
              <div class="info-strip-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <div class="info-strip-text">
                <span class="info-strip-label">Learning Strand</span>
                <span class="info-strip-value">{{ moduleData.strand || '—' }}</span>
              </div>
            </div>

            <!-- 4. Learning Center -->
            <div class="info-strip-item">
              <div class="info-strip-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21h18"/>
                  <path d="M5 21V7l7-4 7 4v14"/>
                  <path d="M9 9h1"/>
                  <path d="M14 9h1"/>
                  <path d="M9 13h1"/>
                  <path d="M14 13h1"/>
                  <path d="M10 21v-4a2 2 0 0 1 4 0v4"/>
                </svg>
              </div>
              <div class="info-strip-text">
                <span class="info-strip-label">Learning Center</span>
                <span class="info-strip-value">{{ moduleData.learningCenter || '—' }}</span>
              </div>
            </div>

            <!-- 5. Schedule -->
            <div class="info-strip-item">
              <div class="info-strip-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div class="info-strip-text">
                <span class="info-strip-label">Schedule</span>
                <span class="info-strip-value">{{ formatScheduleRange(moduleData.dateStarted, moduleData.dateEnded) }}</span>
              </div>
            </div>
          </div>

          <!-- Instructions and Related Activities (Full-Width Vertically Arranged) -->
          <div class="instructions-activities-stack">
            <!-- Instructions Panel -->
            <div class="detail-note-panel">
              <div class="detail-note-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <line x1="10" y1="9" x2="8" y2="9"/>
                </svg>
                <h3 class="detail-note-title">Instructions</h3>
              </div>
              <div class="detail-note-body">
                <p v-if="moduleData.instructions || moduleData.description" class="prose-text">
                  {{ moduleData.instructions || moduleData.description }}
                </p>
                <p v-else class="empty-text-hint">No instructions provided for this module.</p>
              </div>
            </div>

            <!-- Related Activities Panel -->
            <div class="detail-note-panel">
              <div class="detail-note-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <h3 class="detail-note-title">Related Activities</h3>
              </div>
              <div class="detail-note-body">
                <p v-if="moduleData.activitiesRelated" class="prose-text">
                  {{ moduleData.activitiesRelated }}
                </p>
                <p v-else class="empty-text-hint">No related activities provided for this module.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Module Content Section -->
        <div class="module-content-section">
          <h2 class="module-content-heading">Module Content</h2>

          <div class="module-resource-list">
            <!-- Resource 1: Learning Module (PDF) -->
            <div class="resource-accordion-wrapper">
              <button
                type="button"
                class="resource-clickable-row"
                :class="{ 'is-expanded': showMaterialSection }"
                :aria-expanded="showMaterialSection"
                @click="showMaterialSection = !showMaterialSection"
              >
                <div class="resource-row-icon pdf-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
                </div>

                <div class="resource-row-content">
                  <span class="resource-row-title">Learning Module (PDF)</span>
                  <span class="resource-row-desc">View the uploaded learning material.</span>
                </div>

                <div class="resource-row-arrow" :class="{ rotated: showMaterialSection }">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </button>

              <!-- Expanded Learning Module Material Content -->
              <div v-show="showMaterialSection" class="resource-expanded-panel">
                <div v-if="moduleData.fileUrl" class="material-file-banner">
                  <div class="file-type-icon-box">
                    <svg v-if="moduleData.fileType === 'IMAGE'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>

                  <div class="file-meta-info">
                    <div class="file-name-row">
                      <span class="file-name-title">{{ moduleData.fileName || 'Learning Module Document' }}</span>
                      <span class="file-ext-pill">{{ moduleData.fileType || 'PDF' }}</span>
                    </div>
                    <span class="file-link-path">{{ moduleData.fileUrl }}</span>
                  </div>

                  <a
                    :href="moduleData.fileUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-open-material-cta"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    <span>View / Open Material</span>
                  </a>
                </div>

                <div v-else class="component-empty-placeholder">
                  <p>No document or digital material file attached to this module.</p>
                </div>
              </div>
            </div>

            <!-- Resource 2: Pre-Test and Post-Test -->
            <div class="resource-accordion-wrapper">
              <button
                type="button"
                class="resource-clickable-row"
                :class="{ 'is-expanded': showAssessmentSection }"
                :aria-expanded="showAssessmentSection"
                @click="showAssessmentSection = !showAssessmentSection"
              >
                <div class="resource-row-icon assessment-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>

                <div class="resource-row-content">
                  <span class="resource-row-title">Pre-Test and Post-Test</span>
                  <span class="resource-row-desc">View assessment questions and answer key.</span>
                </div>

                <div class="resource-row-arrow" :class="{ rotated: showAssessmentSection }">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </button>

              <!-- Expanded Pre-Test and Post-Test Questions & Answer Key -->
              <div v-show="showAssessmentSection" class="resource-expanded-panel assessment-expanded-stack">
                <!-- Pre-Test Section Card -->
                <div class="content-section-card nested-assessment-card">
                  <div class="card-section-header">
                    <div class="header-icon-circle amber">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <path d="M9 15l2 2 4-4"/>
                      </svg>
                    </div>
                    <div class="title-with-badge">
                      <h2 class="section-title">Pre-Test (Assessment)</h2>
                      <span class="badge-count-pill">
                        {{ preTestQuestions.length }} {{ preTestQuestions.length === 1 ? 'Question' : 'Questions' }}
                      </span>
                    </div>
                  </div>

                  <div v-if="preTestQuestions.length > 0" class="questions-deck">
                    <div
                      v-for="(q, qIdx) in preTestQuestions"
                      :key="q.id || qIdx"
                      class="question-review-card"
                    >
                      <div class="q-header-line">
                        <span class="q-index-pill">Question {{ qIdx + 1 }}</span>
                        <span class="q-points-badge">{{ q.points || 1 }} pt</span>
                      </div>

                      <p class="q-prompt-text">{{ q.questionText || q.prompt }}</p>

                      <div class="choices-display-grid">
                        <div
                          v-for="(opt, optIdx) in (q.options || [])"
                          :key="opt.id || optIdx"
                          class="choice-item-pill"
                          :class="{ 'is-correct': opt.isCorrect }"
                        >
                          <span class="choice-alpha-badge">{{ String.fromCharCode(65 + optIdx) }}</span>
                          <span class="choice-label-text">{{ opt.optionText || opt }}</span>
                          <span v-if="opt.isCorrect" class="correct-tag-indicator">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Correct
                          </span>
                        </div>
                      </div>

                      <div v-if="q.incorrectFeedback" class="q-feedback-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span><strong>Feedback (Incorrect answers):</strong> {{ q.incorrectFeedback }}</span>
                      </div>

                      <div v-if="q.correctFeedback" class="q-feedback-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span><strong>Feedback (Correct answers):</strong> {{ q.correctFeedback }}</span>
                      </div>

                      <div v-if="q.explanation" class="q-feedback-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span><strong>Feedback / Explanation:</strong> {{ q.explanation }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-else class="component-empty-placeholder">
                    <p>No Pre-Test diagnostic questions configured for this module.</p>
                  </div>
                </div>

                <!-- Post-Test Section Card -->
                <div class="content-section-card nested-assessment-card">
                  <div class="card-section-header">
                    <div class="header-icon-circle purple">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <div class="title-with-badge">
                      <h2 class="section-title">Post-Test</h2>
                      <span class="badge-count-pill purple">
                        {{ postTestQuestions.length }} {{ postTestQuestions.length === 1 ? 'Question' : 'Questions' }}
                      </span>
                    </div>
                  </div>

                  <div v-if="postTestQuestions.length > 0" class="questions-deck">
                    <div
                      v-for="(q, qIdx) in postTestQuestions"
                      :key="q.id || qIdx"
                      class="question-review-card"
                    >
                      <div class="q-header-line">
                        <span class="q-index-pill purple">Question {{ qIdx + 1 }}</span>
                        <span class="q-points-badge">{{ q.points || 1 }} pt</span>
                      </div>

                      <p class="q-prompt-text">{{ q.questionText || q.prompt }}</p>

                      <div class="choices-display-grid">
                        <div
                          v-for="(opt, optIdx) in (q.options || [])"
                          :key="opt.id || optIdx"
                          class="choice-item-pill"
                          :class="{ 'is-correct': opt.isCorrect }"
                        >
                          <span class="choice-alpha-badge">{{ String.fromCharCode(65 + optIdx) }}</span>
                          <span class="choice-label-text">{{ opt.optionText || opt }}</span>
                          <span v-if="opt.isCorrect" class="correct-tag-indicator">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Correct
                          </span>
                        </div>
                      </div>

                      <div v-if="q.incorrectFeedback" class="q-feedback-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span><strong>Feedback (Incorrect answers):</strong> {{ q.incorrectFeedback }}</span>
                      </div>

                      <div v-if="q.correctFeedback" class="q-feedback-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span><strong>Feedback (Correct answers):</strong> {{ q.correctFeedback }}</span>
                      </div>

                      <div v-if="q.explanation" class="q-feedback-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span><strong>Feedback / Explanation:</strong> {{ q.explanation }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-else class="component-empty-placeholder">
                    <p>No Post-Test mastery questions configured for this module.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: SUBMISSIONS -->
      <div v-show="activeTab === 'submissions'" class="tab-pane-content">
        <div class="content-section-card">
          <!-- Submissions Header & Filters -->
          <div class="submissions-header-controls">
            <div>
              <h2 class="section-title">Learner Activity Submissions</h2>
              <p class="section-subtitle">Review, provide remarks, and grade activity submissions for this module.</p>
            </div>

            <!-- Search and Status Filter Row -->
            <div class="submissions-filter-toolbar">
              <div class="search-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  v-model="submissionSearchQuery"
                  type="text"
                  class="search-text-input"
                  placeholder="Search learner name or LRN..."
                />
              </div>

              <div class="status-filter-pills">
                <button
                  type="button"
                  class="filter-pill-btn"
                  :class="{ active: selectedStatusFilter === 'ALL' }"
                  @click="selectedStatusFilter = 'ALL'"
                >
                  All ({{ submissions.length }})
                </button>
                <button
                  type="button"
                  class="filter-pill-btn"
                  :class="{ active: selectedStatusFilter === 'Submitted' }"
                  @click="selectedStatusFilter = 'Submitted'"
                >
                  Submitted ({{ countByStatus('Submitted') }})
                </button>
                <button
                  type="button"
                  class="filter-pill-btn"
                  :class="{ active: selectedStatusFilter === 'Mastered' }"
                  @click="selectedStatusFilter = 'Mastered'"
                >
                  Mastered ({{ countByStatus('Mastered') }})
                </button>
                <button
                  type="button"
                  class="filter-pill-btn"
                  :class="{ active: selectedStatusFilter === 'Not Mastered' }"
                  @click="selectedStatusFilter = 'Not Mastered'"
                >
                  Not Mastered ({{ countByStatus('Not Mastered') }})
                </button>
              </div>
            </div>
          </div>

          <!-- Submissions Table -->
          <div v-if="filteredSubmissions.length > 0" class="submissions-table-container">
            <table class="submissions-table">
              <thead>
                <tr>
                  <th class="th-learner-name">Learner Name</th>
                  <th class="th-lrn">LRN</th>
                  <th class="th-level">ALS Level</th>
                  <th class="th-activity">Activity</th>
                  <th class="th-date">Submitted Date</th>
                  <th class="th-status">Status</th>
                  <th class="th-remarks">Teacher Remarks</th>
                  <th class="th-action text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sub in filteredSubmissions" :key="sub.id" class="sub-table-row">
                  <td class="td-learner-name table-cell-name">
                    {{ sub.learnerName }}
                  </td>
                  <td class="td-lrn text-muted font-mono">
                    {{ sub.lrn || '—' }}
                  </td>
                  <td class="td-level table-cell-als-level">
                    {{ formatAlsLevelDisplay(sub.programLevel || moduleData.level) }}
                  </td>
                  <td class="td-activity">
                    <div class="activity-cell-wrap">
                      <span class="text-dark">{{ sub.activity || sub.title || moduleData.title }}</span>
                      <span v-if="getSubmissionFilesList(sub).length > 1" class="activity-files-count-badge">
                        {{ getSubmissionFilesList(sub).length }} files
                      </span>
                    </div>
                  </td>
                  <td class="td-date text-muted">
                    {{ formatDisplayDate(sub.submittedAt || sub.dateSubmitted) }}
                  </td>
                  <td class="td-status">
                    <span
                      class="sub-status-badge"
                      :class="getStatusClass(sub.status)"
                    >
                      <span class="sub-dot"></span>
                      {{ formatProgressStatus(sub.status) }}
                    </span>
                  </td>
                  <td class="td-remarks remarks-cell" :title="sub.teacherRemarks || sub.remarks || sub.feedback">
                    <span v-if="sub.teacherRemarks || sub.remarks || sub.feedback" class="remarks-snippet">
                      {{ sub.teacherRemarks || sub.remarks || sub.feedback }}
                    </span>
                    <span v-else class="text-muted-dash">—</span>
                  </td>
                  <td class="td-action text-right">
                    <button
                      type="button"
                      class="btn-review-sub"
                      title="Review Learner Activity"
                      aria-label="Review Output"
                      @click="openReviewModal(sub)"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <span>Review Output</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-else class="submissions-empty-card">
            <div class="empty-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <circle cx="12" cy="14" r="2"/>
              </svg>
            </div>
            <h3>No Submissions Found</h3>
            <p v-if="submissionSearchQuery || selectedStatusFilter !== 'ALL'">
              No learner submissions match your search or status filter.
            </p>
            <p v-else>
              Learners assigned to you have not submitted any completed activities for this module yet.
            </p>
          </div>
        </div>
      </div>

      <!-- Bottom Breadcrumb / Back Navigation -->
      <div class="bottom-back-nav-bar">
        <router-link :to="backToModulesRoute" class="btn-back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Back to Modules</span>
        </router-link>
      </div>
    </div>

    <!-- ================================================================== -->
    <!-- DEDICATED FULL-WIDTH REVIEW LEARNER ACTIVITY PAGE                  -->
    <!-- ================================================================== -->
    <div
      v-else-if="moduleData && showReviewModal && currentSubmission"
      class="review-activity-fullpage"
    >
      <!-- Top Navigation Bar: Back to Submissions + Learner Prev/Next Navigation -->
      <div class="review-top-nav-row">
        <button
          type="button"
          class="btn-back-link"
          @click="closeReviewModal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Back to Submissions</span>
        </button>

        <!-- Previous / Next Learner Navigation -->
        <div v-if="navigableSubmissions.length > 1" class="learner-prev-next-nav">
          <span class="learner-nav-counter">
            Learner {{ currentLearnerNavIndex + 1 }} of {{ navigableSubmissions.length }}
          </span>
          <button
            type="button"
            class="btn-learner-step"
            :disabled="currentLearnerNavIndex <= 0"
            title="Previous Learner"
            @click="navigateReviewLearner(-1)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Previous</span>
          </button>
          <button
            type="button"
            class="btn-learner-step"
            :disabled="currentLearnerNavIndex >= navigableSubmissions.length - 1"
            title="Next Learner"
            @click="navigateReviewLearner(1)"
          >
            <span>Next</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Review Page Header Card (Title + Learner Information) -->
      <div class="review-header-card">
        <div class="review-header-top">
          <div>
            <h1 class="review-page-title">Review Learner Activity</h1>
            <p class="review-page-module-subtitle">{{ moduleData.title }}</p>
          </div>
        </div>

        <div class="review-learner-meta-bar">
          <div class="learner-meta-cell">
            <span class="learner-meta-label">Learner Name</span>
            <span class="learner-meta-value strong">{{ currentSubmission.learnerName }}</span>
          </div>

          <div class="learner-meta-cell">
            <span class="learner-meta-label">LRN</span>
            <span class="learner-meta-value font-mono">{{ currentSubmission.lrn || '—' }}</span>
          </div>

          <div class="learner-meta-cell">
            <span class="learner-meta-label">ALS Level</span>
            <span class="learner-meta-value">{{ formatAlsLevelDisplay(currentSubmission.programLevel || moduleData.level) }}</span>
          </div>

          <div class="learner-meta-cell">
            <span class="learner-meta-label">Submission Status</span>
            <div class="learner-meta-status-wrap">
              <span class="sub-status-badge" :class="getStatusClass(currentSubmission.status)">
                <span class="sub-dot"></span>
                {{ formatProgressStatus(currentSubmission.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Success / Validation Feedback Banner -->
      <div v-if="reviewSuccessMessage" class="review-alert-banner success" role="status">
        <div class="alert-banner-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>{{ reviewSuccessMessage }}</span>
        </div>
        <button type="button" class="alert-close-btn" @click="reviewSuccessMessage = ''" aria-label="Dismiss">
          &times;
        </button>
      </div>

      <div v-if="reviewErrorMessage" class="review-alert-banner error" role="alert">
        <div class="alert-banner-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ reviewErrorMessage }}</span>
        </div>
        <button type="button" class="alert-close-btn" @click="reviewErrorMessage = ''" aria-label="Dismiss">
          &times;
        </button>
      </div>

      <!-- Two-Column Desktop Layout (60% Left / 40% Right) -->
      <div class="review-two-column-layout">
        <!-- LEFT COLUMN (60%): Submitted Activities & File Preview -->
        <div class="review-left-col">
          <div class="review-panel-card submitted-activities-card">
            <div class="submitted-activities-header">
              <div class="submitted-activities-title-group">
                <h2 class="panel-heading">Submitted Activities</h2>
                <span class="files-total-badge">
                  {{ currentSubmissionFiles.length }} {{ currentSubmissionFiles.length === 1 ? 'File' : 'Files' }}
                </span>
              </div>
              <span class="submitted-date-caption">
                Submitted {{ formatDisplayDate(currentSubmission.submittedAt || currentSubmission.dateSubmitted) }}
              </span>
            </div>

            <div v-if="currentSubmissionFiles.length > 0" class="submitted-activities-body">
              <!-- Left Side of Preview Area: Uploaded File List -->
              <div class="submitted-files-list" role="listbox" aria-label="Submitted Activity Files">
                <button
                  v-for="(fileItem, fIdx) in currentSubmissionFiles"
                  :key="fileItem.id || fIdx"
                  type="button"
                  role="option"
                  :aria-selected="selectedFileIndex === fIdx"
                  class="submitted-file-item"
                  :class="{ active: selectedFileIndex === fIdx }"
                  @click="selectSubmissionFile(fIdx)"
                >
                  <div class="file-item-icon" :class="{ 'is-pdf': fileItem.isPdf }">
                    <svg v-if="fileItem.isPdf" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>

                  <div class="file-item-meta">
                    <span class="file-item-name" :title="fileItem.fileName">{{ fileItem.fileName }}</span>
                    <div class="file-item-submeta">
                      <span>{{ fileItem.fileType }}</span>
                      <span class="submeta-dot">&bull;</span>
                      <span>{{ formatSubmissionFileSize(fileItem.fileSize) }}</span>
                    </div>
                  </div>
                </button>
              </div>

              <!-- Right Side: Large File Preview Area -->
              <div ref="previewFullscreenRef" class="file-preview-container">
                <!-- Preview Toolbar -->
                <div class="file-preview-toolbar">
                  <div class="toolbar-file-info">
                    <span class="toolbar-active-filename" :title="selectedSubmissionFile?.fileName">
                      {{ selectedSubmissionFile?.fileName }}
                    </span>

                    <!-- PDF Page Navigation (when selected file is PDF) -->
                    <div v-if="selectedSubmissionFile?.isPdf && pdfPreviewTotalPages > 1" class="pdf-page-nav-group">
                      <button
                        type="button"
                        class="toolbar-btn"
                        :disabled="pdfPreviewPage <= 1"
                        title="Previous Page"
                        aria-label="Previous Page"
                        @click="changePdfPreviewPage(-1)"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="15 18 9 12 15 6"/>
                        </svg>
                      </button>
                      <span class="pdf-page-indicator">
                        Page {{ pdfPreviewPage }} of {{ pdfPreviewTotalPages }}
                      </span>
                      <button
                        type="button"
                        class="toolbar-btn"
                        :disabled="pdfPreviewPage >= pdfPreviewTotalPages"
                        title="Next Page"
                        aria-label="Next Page"
                        @click="changePdfPreviewPage(1)"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Preview Controls: Zoom Out, Zoom In, Fit to Width, Full Screen, Download File -->
                  <div class="toolbar-controls-group">
                    <button
                      type="button"
                      class="toolbar-btn"
                      :disabled="previewZoom <= 0.5"
                      title="Zoom Out"
                      aria-label="Zoom Out"
                      @click="previewZoomOut"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="8" y1="11" x2="14" y2="11"/>
                      </svg>
                    </button>

                    <span class="toolbar-zoom-label">
                      {{ Math.round(previewZoom * 100) }}%
                    </span>

                    <button
                      type="button"
                      class="toolbar-btn"
                      :disabled="previewZoom >= 3"
                      title="Zoom In"
                      aria-label="Zoom In"
                      @click="previewZoomIn"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="11" y1="8" x2="11" y2="14"/>
                        <line x1="8" y1="11" x2="14" y2="11"/>
                      </svg>
                    </button>

                    <button
                      type="button"
                      class="toolbar-btn toolbar-btn-labeled"
                      :class="{ active: isFitToWidth }"
                      title="Fit to Width"
                      aria-label="Fit to Width"
                      @click="previewFitToWidth"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 3 21 3 21 9"/>
                        <polyline points="9 21 3 21 3 15"/>
                        <line x1="21" y1="3" x2="14" y2="10"/>
                        <line x1="3" y1="21" x2="10" y2="14"/>
                      </svg>
                      <span class="btn-ctrl-text">Fit to Width</span>
                    </button>

                    <button
                      type="button"
                      class="toolbar-btn toolbar-btn-labeled"
                      title="Full Screen"
                      aria-label="Full Screen"
                      @click="togglePreviewFullscreen"
                    >
                      <svg v-if="!isPreviewFullscreen" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                      </svg>
                      <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                      </svg>
                      <span class="btn-ctrl-text">{{ isPreviewFullscreen ? 'Exit Full Screen' : 'Full Screen' }}</span>
                    </button>

                    <button
                      type="button"
                      class="toolbar-btn toolbar-btn-labeled"
                      title="Download File"
                      aria-label="Download File"
                      @click="downloadSelectedSubmissionFile"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <span class="btn-ctrl-text">Download</span>
                    </button>
                  </div>
                </div>

                <!-- Large File Preview Viewport -->
                <div ref="previewViewportRef" class="file-preview-viewport">
                  <!-- PDF File Preview -->
                  <template v-if="selectedSubmissionFile?.isPdf">
                    <div v-if="pdfPreviewLoading" class="preview-loading-placeholder">
                      <div class="loading-spinner"></div>
                      <span>Loading PDF preview...</span>
                    </div>
                    <canvas
                      v-show="!pdfPreviewLoading && !pdfPreviewFallback"
                      ref="pdfPreviewCanvasRef"
                      class="preview-pdf-canvas"
                    ></canvas>
                    <iframe
                      v-if="pdfPreviewFallback && selectedSubmissionFile?.fileUrl"
                      :src="resolveSubmissionImageUrl(selectedSubmissionFile.fileUrl)"
                      class="preview-pdf-iframe"
                      :title="selectedSubmissionFile.fileName"
                    ></iframe>
                  </template>

                  <!-- Image File Preview (Never stretched, cropped, or distorted) -->
                  <template v-else-if="selectedSubmissionFile?.fileUrl">
                    <img
                      :src="resolveSubmissionImageUrl(selectedSubmissionFile.fileUrl)"
                      :alt="selectedSubmissionFile.fileName || 'Submitted Activity Image'"
                      class="preview-image-element"
                      :class="{ 'fit-width-mode': isFitToWidth }"
                      :style="imagePreviewDynamicStyle"
                      @load="onPreviewImageLoad"
                    />
                  </template>

                  <div v-else class="no-artifact-hint">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>No previewable file URL available for this submission.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fallback if learner submission has no files -->
            <div v-else class="no-artifact-hint">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>No activity files attached with this submission.</span>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN (40%): Assessment Scores, Evaluation & Teacher Remarks -->
        <div class="review-right-col">
          <div class="review-panel-card evaluation-sidebar-card">
            <!-- 1. Module Assessment Scores -->
            <div class="eval-section-block scores-compact-block">
              <h2 class="panel-heading">Module Assessment Scores</h2>

              <div class="compact-scores-list">
                <div class="compact-score-row">
                  <span class="compact-score-label">Pre-Test Score:</span>
                  <span
                    v-if="learnerScores.preTestScore !== null && learnerScores.preTestScore !== undefined"
                    class="compact-score-value"
                  >
                    {{ learnerScores.preTestScore }} / {{ learnerScores.preTestTotal || 10 }}
                  </span>
                  <span v-else class="compact-score-empty">Not Taken</span>
                </div>

                <div class="compact-score-row">
                  <span class="compact-score-label">Post-Test Score:</span>
                  <span
                    v-if="learnerScores.postTestScore !== null && learnerScores.postTestScore !== undefined"
                    class="compact-score-value"
                  >
                    {{ learnerScores.postTestScore }} / {{ learnerScores.postTestTotal || 10 }}
                  </span>
                  <span v-else class="compact-score-empty">Not Taken</span>
                </div>
              </div>
            </div>

            <div class="eval-divider"></div>

            <!-- 2. Learning Progress Evaluation -->
            <div class="eval-section-block">
              <h2 class="panel-heading">Learning Progress Evaluation</h2>
              <p class="eval-description-text">
                Evaluate whether the learner has demonstrated mastery of the activity competencies.
              </p>

              <div class="eval-field-group">
                <label class="eval-label" for="learning-progress-select">
                  Learning Progress <span class="req">*</span>
                </label>
                <select
                  id="learning-progress-select"
                  v-model="reviewForm.status"
                  class="eval-select-input"
                  required
                >
                  <option value="" disabled>Select Learning Progress</option>
                  <option value="Mastered">Mastered</option>
                  <option value="Not Mastered">Not Mastered</option>
                </select>

                <!-- Dynamic Confirmation / Explanation Message -->
                <div
                  v-if="reviewForm.status === 'Mastered'"
                  class="eval-guidance-callout is-mastered"
                >
                  <div class="guidance-flex">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <div>
                      <strong>Mastered:</strong>
                      <span> The learner has demonstrated mastery of the activity competencies and completed the required output satisfactorily.</span>
                    </div>
                  </div>
                </div>

                <div
                  v-else-if="reviewForm.status === 'Not Mastered'"
                  class="eval-guidance-callout is-not-mastered"
                >
                  <div class="guidance-flex">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div>
                      <strong>Not Mastered:</strong>
                      <span> The learner requires additional guidance, practice, or follow-up support before the activity competencies are mastered.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="eval-divider"></div>

            <!-- 3. Teacher Remarks -->
            <div class="eval-section-block">
              <label class="panel-heading remarks-heading-label" for="teacher-remarks-textarea">
                Teacher Remarks
              </label>
              <textarea
                id="teacher-remarks-textarea"
                v-model="reviewForm.teacherRemarks"
                rows="6"
                class="eval-textarea-input"
                placeholder="Write your feedback, observations, or additional remarks here..."
              ></textarea>
            </div>

            <!-- 4. Save Review Footer Actions -->
            <div class="eval-panel-actions">
              <button
                type="button"
                class="btn-modal-cancel"
                :disabled="isSavingReview"
                @click="closeReviewModal"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn-modal-save"
                :disabled="isSavingReview"
                @click="saveSubmissionReview"
              >
                <span v-if="isSavingReview">Saving Review...</span>
                <span v-else>Save Review</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT MODULE MODAL -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="edit-modal-overlay"
        @click.self="closeEditModal"
        @keydown.esc="closeEditModal"
        tabindex="-1"
      >
        <div class="edit-modal-card" role="dialog" aria-modal="true">
          <!-- Modal Header -->
          <div class="edit-modal-header">
            <div class="edit-modal-header-text">
              <h2 class="edit-modal-title">Edit Module</h2>
              <p class="edit-modal-subtitle">Update module information, assigned schedule, and recipient learners.</p>
            </div>
            <button type="button" class="btn-modal-close" @click="closeEditModal" title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Modal Error Banner -->
          <div v-if="editErrorMessage" class="edit-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ editErrorMessage }}</span>
          </div>

          <!-- Modal Form Body -->
          <div class="edit-modal-body">
            <div class="form-grid-2">
              <!-- ROW 1 — FULL WIDTH: Module Title * -->
              <div class="field-item full-width">
                <label class="field-lbl">Module Title <span class="req">*</span></label>
                <input
                  v-model="editForm.title"
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
                  v-model="editForm.instructions"
                  rows="3"
                  class="field-textarea-box"
                  placeholder="Enter instructions or directions for this module..."
                ></textarea>
              </div>

              <!-- ROW 3 — TWO COLUMNS: Target ALS Level * | Learning Strand * -->
              <div class="field-item">
                <label class="field-lbl">Target ALS Level <span class="req">*</span></label>
                <select v-model="editForm.level" class="field-select-box" required>
                  <option value="A&E Elementary">A&amp;E Elementary</option>
                  <option value="A&E Junior High">A&amp;E Junior High</option>
                </select>
              </div>

              <div class="field-item">
                <label class="field-lbl">Learning Strand <span class="req">*</span></label>
                <select v-model="editForm.strand" class="field-select-box" required>
                  <option value="" disabled>Select Learning Strand</option>
                  <option v-for="s in internalStrands" :key="s.slug" :value="s.name">
                    {{ s.name }}
                  </option>
                </select>
              </div>

              <!-- ROW 4 — TWO COLUMNS: Learning Center * | Module Code * -->
              <div class="field-item">
                <label class="field-lbl">Learning Center <span class="req">*</span></label>
                <select v-model="editForm.learningCenterId" class="field-select-box" required>
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
                  :value="editForm.code"
                  class="field-input-box is-readonly"
                  placeholder="Auto-populated based on Learning Strand"
                  readonly
                  disabled
                />
              </div>

              <!-- ROW 5 — FULL WIDTH: Learner Assignment Section -->
              <div class="field-item full-width learner-assignment-section">
                <label class="field-lbl">Assign Module To <span class="req">*</span></label>
                
                <div class="assignment-radio-group">
                  <!-- Option 1: All Learners -->
                  <label class="assignment-radio-card" :class="{ 'is-selected': editForm.isAllLearners }">
                    <input
                      type="radio"
                      name="editModuleAssignMode"
                      :value="true"
                      v-model="editForm.isAllLearners"
                      class="custom-radio"
                      @change="onEditAssignmentModeChange(true)"
                    />
                    <div class="radio-label-group">
                      <span class="radio-title">All Learners</span>
                      <span class="radio-desc">Assign the module to all eligible learners under the selected Learning Center and ALS Level.</span>
                    </div>
                  </label>

                  <!-- Option 2: Specific Learners -->
                  <label class="assignment-radio-card" :class="{ 'is-selected': !editForm.isAllLearners }">
                    <input
                      type="radio"
                      name="editModuleAssignMode"
                      :value="false"
                      v-model="editForm.isAllLearners"
                      class="custom-radio"
                      @change="onEditAssignmentModeChange(false)"
                    />
                    <div class="radio-label-group">
                      <span class="radio-title">Specific Learners</span>
                      <span class="radio-desc">Allow the teacher to select individual learners who will receive the module.</span>
                    </div>
                  </label>
                </div>

                <!-- When All Learners is selected -->
                <div v-if="editForm.isAllLearners" class="all-learners-summary-card">
                  <div v-if="editEligibleLearners.length > 0" class="learners-count-badge">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span><strong>{{ editEligibleLearners.length }}</strong> {{ editEligibleLearners.length === 1 ? 'learner' : 'learners' }} will receive this module.</span>
                  </div>
                  <div v-else class="empty-eligible-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>No eligible {{ editForm.level }} learners found for the selected Learning Center.</span>
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
                        v-model="editLearnerSearchQuery"
                        type="text"
                        class="field-input-box learner-search-input"
                        placeholder="Search learner name..."
                      />
                      <button
                        v-if="editLearnerSearchQuery"
                        type="button"
                        class="clear-search-btn"
                        @click="editLearnerSearchQuery = ''"
                        aria-label="Clear search"
                      >
                        &times;
                      </button>
                    </div>

                    <!-- Selected Learners Chips -->
                    <div v-if="selectedEditLearnersList.length > 0" class="selected-chips-row">
                      <div
                        v-for="l in selectedEditLearnersList"
                        :key="l.id"
                        class="selected-learner-chip"
                      >
                        <span class="chip-name">{{ l.name }}</span>
                        <button
                          type="button"
                          class="chip-close-btn"
                          @click="toggleEditLearner(l.id)"
                          :title="`Remove ${l.name}`"
                        >
                          &times;
                        </button>
                      </div>
                    </div>

                    <!-- Multi-select list -->
                    <div v-if="filteredEditSpecificLearners.length > 0" class="learners-multi-list">
                      <label
                        v-for="l in filteredEditSpecificLearners"
                        :key="l.id"
                        class="learner-check-row"
                        :class="{ 'is-checked': editForm.selectedLearnerIds.includes(l.id) }"
                      >
                        <input
                          type="checkbox"
                          class="learner-checkbox"
                          :checked="editForm.selectedLearnerIds.includes(l.id)"
                          @change="toggleEditLearner(l.id)"
                        />
                        <div class="learner-row-text">
                          <span class="learner-row-name">{{ l.name }}</span>
                          <span class="learner-row-sub">{{ l.level }} &bull; {{ l.learningCenter }}</span>
                        </div>
                      </label>
                    </div>

                    <!-- Empty State -->
                    <div v-else-if="editEligibleLearners.length === 0" class="no-learners-box">
                      <span>No eligible {{ editForm.level }} learners found for the selected Learning Center.</span>
                    </div>
                    <div v-else class="no-learners-box">
                      <span>No learners match "{{ editLearnerSearchQuery }}".</span>
                    </div>

                    <!-- Selection Count Footer -->
                    <div class="selection-count-footer">
                      <span>{{ editForm.selectedLearnerIds.length }} {{ editForm.selectedLearnerIds.length === 1 ? 'learner' : 'learners' }} selected</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ROW 6 — TWO COLUMNS: Date Started * | Date Ended * -->
              <div class="field-item">
                <label class="field-lbl">Date Started <span class="req">*</span></label>
                <input
                  v-model="editForm.dateStarted"
                  type="date"
                  class="field-input-box"
                  required
                />
              </div>

              <div class="field-item">
                <label class="field-lbl">Date Ended <span class="req">*</span></label>
                <input
                  v-model="editForm.dateEnded"
                  type="date"
                  class="field-input-box"
                  required
                />
              </div>

              <!-- ROW 7 — FULL WIDTH: Activities Related -->
              <div class="field-item full-width">
                <label class="field-lbl">Activities Related</label>
                <textarea
                  v-model="editForm.activitiesRelated"
                  rows="2"
                  class="field-textarea-box"
                  placeholder="Describe the activities related to this module..."
                ></textarea>
              </div>
            </div>

            <!-- EDIT PRE-TEST (Assessment) QUESTIONS -->
            <div class="edit-assessment-block">
              <div class="edit-assessment-header">
                <h3>Pre-Test (Assessment)</h3>
                <p>Add multiple choice questions to assess learners' prior knowledge before the module.</p>
              </div>

              <div class="gf-questions-container">
                <div
                  v-for="(q, qIdx) in editForm.preTest"
                  :key="q.uid || q.id || qIdx"
                  class="gf-question-card"
                >
                  <div class="gf-question-row">
                    <span class="gf-question-number">{{ qIdx + 1 }}.</span>
                    <input
                      v-model="q.prompt"
                      type="text"
                      class="gf-question-input"
                      placeholder="Type question here."
                      @input="editErrorMessage = ''"
                    />
                  </div>

                  <div v-if="q.answerKeyMode" class="gf-answer-key-banner">
                    <div class="gf-ak-banner-text">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      <span>Select the correct option below using the radio button:</span>
                    </div>
                    <button type="button" class="gf-ak-done-btn" @click="q.answerKeyMode = false">
                      Done
                    </button>
                  </div>

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
                        :name="`edit-pretest-correct-${q.uid || q.id || qIdx}`"
                        :value="cIdx"
                        :checked="q.correctAnswer === cIdx"
                        title="Select as correct answer"
                        @change="selectEditCorrectAnswer(q, cIdx)"
                      />
                      <input
                        v-model="q.choices[cIdx]"
                        type="text"
                        class="gf-option-input"
                        placeholder="Type option here."
                        @input="editErrorMessage = ''"
                      />
                      <span v-if="q.correctAnswer === cIdx" class="gf-correct-tag">
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
                        @click="removeEditOption(q, cIdx)"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div class="gf-add-option-row">
                    <span class="gf-radio-deco" aria-hidden="true"></span>
                    <button type="button" class="gf-add-option-btn" @click="addEditOption(q)">
                      Add option
                    </button>
                  </div>

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

                  <div class="gf-card-footer">
                    <div class="gf-footer-left">
                      <button
                        type="button"
                        class="gf-answer-key-btn"
                        :class="{
                          'is-active': q.answerKeyMode,
                          'has-selected': q.correctAnswer !== null && q.correctAnswer !== undefined && q.choices[q.correctAnswer] !== undefined
                        }"
                        @click="q.answerKeyMode = !q.answerKeyMode"
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
                        @click="openEditFeedbackModal('preTest', qIdx)"
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
                        @click="removeEditQuestion('preTest', qIdx)"
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

              <div class="gf-questions-bottom-bar">
                <button
                  type="button"
                  class="gf-btn-add-question"
                  @click="addEditQuestion('preTest')"
                >
                  + Add Question
                </button>
                <div class="gf-total-questions">
                  Total Questions: <strong>{{ editForm.preTest.length }}</strong>
                </div>
              </div>
            </div>

            <!-- EDIT POST-TEST QUESTIONS -->
            <div class="edit-assessment-block">
              <div class="edit-assessment-header">
                <h3>Post-Test</h3>
                <p>Add multiple choice questions to assess what learners have learned after completing the module.</p>
              </div>

              <div class="gf-questions-container">
                <div
                  v-for="(q, qIdx) in editForm.postTest"
                  :key="q.uid || q.id || qIdx"
                  class="gf-question-card"
                >
                  <div class="gf-question-row">
                    <span class="gf-question-number">{{ qIdx + 1 }}.</span>
                    <input
                      v-model="q.prompt"
                      type="text"
                      class="gf-question-input"
                      placeholder="Type question here."
                      @input="editErrorMessage = ''"
                    />
                  </div>

                  <div v-if="q.answerKeyMode" class="gf-answer-key-banner">
                    <div class="gf-ak-banner-text">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      <span>Select the correct option below using the radio button:</span>
                    </div>
                    <button type="button" class="gf-ak-done-btn" @click="q.answerKeyMode = false">
                      Done
                    </button>
                  </div>

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
                        :name="`edit-posttest-correct-${q.uid || q.id || qIdx}`"
                        :value="cIdx"
                        :checked="q.correctAnswer === cIdx"
                        title="Select as correct answer"
                        @change="selectEditCorrectAnswer(q, cIdx)"
                      />
                      <input
                        v-model="q.choices[cIdx]"
                        type="text"
                        class="gf-option-input"
                        placeholder="Type option here."
                        @input="editErrorMessage = ''"
                      />
                      <span v-if="q.correctAnswer === cIdx" class="gf-correct-tag">
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
                        @click="removeEditOption(q, cIdx)"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div class="gf-add-option-row">
                    <span class="gf-radio-deco" aria-hidden="true"></span>
                    <button type="button" class="gf-add-option-btn" @click="addEditOption(q)">
                      Add option
                    </button>
                  </div>

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

                  <div class="gf-card-footer">
                    <div class="gf-footer-left">
                      <button
                        type="button"
                        class="gf-answer-key-btn"
                        :class="{
                          'is-active': q.answerKeyMode,
                          'has-selected': q.correctAnswer !== null && q.correctAnswer !== undefined && q.choices[q.correctAnswer] !== undefined
                        }"
                        @click="q.answerKeyMode = !q.answerKeyMode"
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
                        @click="openEditFeedbackModal('postTest', qIdx)"
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
                        @click="removeEditQuestion('postTest', qIdx)"
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

              <div class="gf-questions-bottom-bar">
                <button
                  type="button"
                  class="gf-btn-add-question"
                  @click="addEditQuestion('postTest')"
                >
                  + Add Question
                </button>
                <div class="gf-total-questions">
                  Total Questions: <strong>{{ editForm.postTest.length }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer Actions -->
          <div class="edit-modal-footer">
            <button
              type="button"
              class="btn-modal-cancel"
              :disabled="isSavingEdit"
              @click="closeEditModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-modal-save"
              :disabled="isSavingEdit"
              @click="saveEditModule"
            >
              <span v-if="isSavingEdit" class="spinner-inline"></span>
              <span>{{ isSavingEdit ? 'Saving Changes...' : 'Save Changes' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ADD FEEDBACK MODAL (INSIDE EDIT MODULE) -->
      <div
        v-if="editFeedbackModal.open"
        class="gf-feedback-modal-backdrop"
        @click.self="closeEditFeedbackModal"
      >
        <div class="gf-feedback-modal-card" role="dialog" aria-modal="true" aria-labelledby="gf-edit-feedback-modal-title">
          <div class="gf-feedback-modal-header">
            <h3 id="gf-edit-feedback-modal-title" class="gf-feedback-modal-title">Add feedback</h3>
            <button
              type="button"
              class="gf-feedback-modal-close"
              title="Close"
              aria-label="Close"
              @click="closeEditFeedbackModal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="gf-feedback-modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              class="gf-feedback-tab-btn"
              :class="{ 'is-active': editFeedbackModal.activeTab === 'incorrect' }"
              :aria-selected="editFeedbackModal.activeTab === 'incorrect'"
              @click="editFeedbackModal.activeTab = 'incorrect'"
            >
              Incorrect answers
            </button>
            <button
              type="button"
              role="tab"
              class="gf-feedback-tab-btn"
              :class="{ 'is-active': editFeedbackModal.activeTab === 'correct' }"
              :aria-selected="editFeedbackModal.activeTab === 'correct'"
              @click="editFeedbackModal.activeTab = 'correct'"
            >
              Correct answers
            </button>
          </div>

          <div class="gf-feedback-modal-body">
            <textarea
              v-if="editFeedbackModal.activeTab === 'incorrect'"
              v-model="editFeedbackModal.incorrectFeedback"
              rows="4"
              class="gf-feedback-textarea"
              placeholder="Enter feedback here..."
            ></textarea>
            <textarea
              v-else
              v-model="editFeedbackModal.correctFeedback"
              rows="4"
              class="gf-feedback-textarea"
              placeholder="Enter feedback here..."
            ></textarea>
          </div>

          <div class="gf-feedback-modal-footer">
            <button
              type="button"
              class="gf-feedback-cancel-btn"
              @click="closeEditFeedbackModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="gf-feedback-save-btn"
              @click="saveEditFeedbackModal"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- DELETE CONFIRMATION MODAL -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      title="Delete Module"
      :item-name="moduleData?.title || 'this module'"
      :loading="isDeletingModule"
      confirm-text="Delete"
      cancel-text="Cancel"
      @cancel="showDeleteModal = false"
      @confirm="confirmDeleteModule"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, shallowRef, markRaw, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as pdfjsLib from 'pdfjs-dist';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { useClcData } from '../composables/useClcData.js';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';
import { getModule, updateModule, deleteModule } from '../api/modules.js';
import { getAssignedLearners } from '../api/learners.js';
import { getLearningCenters } from '../api/learningCenters.js';
import { getSubmissions, updateSubmission, getLearnerAssessmentScores } from '../api/submissions.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const route = useRoute();
const router = useRouter();
const { teacherId, teacherName, assignedCenters } = useTeacherSession();

const loading = ref(true);
const errorMessage = ref('');
const moduleData = ref(null);
const submissions = ref([]);
const activeTab = ref('details');
const showMaterialSection = ref(false);
const showAssessmentSection = ref(false);

// Dynamic back destination according to module's ALS Level
const backToModulesRoute = computed(() => {
  const target = String(moduleData.value?.targetLevel || '').toUpperCase().trim();
  const lvl = String(moduleData.value?.level || moduleData.value?.programLevel || '').toLowerCase().trim();
  if (target === 'JUNIOR' || lvl.includes('junior') || lvl.includes('jhs') || lvl.includes('sec')) {
    return '/dashboard/modules/junior-high';
  }
  return '/dashboard/modules/elementary';
});

// Delete Modal State
const showDeleteModal = ref(false);
const isDeletingModule = ref(false);

function openDeleteModal() {
  showDeleteModal.value = true;
}

async function confirmDeleteModule() {
  if (!moduleData.value?.id) return;
  isDeletingModule.value = true;
  try {
    await deleteModule(moduleData.value.id);
    showDeleteModal.value = false;
    router.push(backToModulesRoute.value);
  } catch (err) {
    console.error('Error deleting module:', err);
    alert(err.response?.data?.error || 'Failed to delete module. Please try again.');
  } finally {
    isDeletingModule.value = false;
  }
}

// Edit Modal State
const showEditModal = ref(false);
const isSavingEdit = ref(false);
const editErrorMessage = ref('');
const editLearnerDropdownOpen = ref(false);
const teacherLearners = ref([]);
const allLearningCenters = ref([]);

const internalStrands = [
  { slug: 'communication-skills-eng', name: 'Communication Skills (English)' },
  { slug: 'communication-skills-fil', name: 'Communication Skills (Filipino)' },
  { slug: 'scientific-literacy', name: 'Scientific & Critical Thinking Skills' },
  { slug: 'mathematical-skills', name: 'Mathematical & Problem Solving Skills' },
  { slug: 'life-career-skills', name: 'Life and Career Skills' },
  { slug: 'self-society', name: 'Understanding Self & Society' },
  { slug: 'digital-citizenship', name: 'Digital Citizenship' },
];

let editQuestionUidCounter = 0;

function createBlankEditQuestion() {
  editQuestionUidCounter += 1;
  return {
    uid: `eq-${editQuestionUidCounter}-${Date.now()}`,
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

function mapExistingQuestionsForEdit(questionsList) {
  if (!Array.isArray(questionsList)) return [];
  return questionsList.map((q) => {
    editQuestionUidCounter += 1;
    const rawOpts = Array.isArray(q.options) ? q.options : [];
    const choices = rawOpts.map((o) => (typeof o === 'string' ? o : String(o.optionText || o.text || '')));
    const optionIds = rawOpts.map((o) => (typeof o === 'object' && o && o.id ? o.id : null));
    let correctAnswer = null;
    rawOpts.forEach((o, idx) => {
      if (o && o.isCorrect === true && correctAnswer === null) {
        correctAnswer = idx;
      }
    });
    return {
      uid: `eq-${editQuestionUidCounter}-${Date.now()}`,
      id: q.id || null,
      prompt: String(q.questionText || q.prompt || ''),
      choices: choices.length > 0 ? choices : [''],
      optionIds: optionIds.length > 0 ? optionIds : [null],
      correctAnswer,
      answerKeyMode: false,
      correctFeedback: q.correctFeedback ? String(q.correctFeedback) : '',
      incorrectFeedback: q.incorrectFeedback ? String(q.incorrectFeedback) : '',
    };
  });
}

const editFeedbackModal = reactive({
  open: false,
  targetKey: 'preTest',
  questionIndex: -1,
  activeTab: 'incorrect',
  incorrectFeedback: '',
  correctFeedback: '',
});

function openEditFeedbackModal(targetKey, qIdx) {
  const list = editForm[targetKey];
  if (!Array.isArray(list) || !list[qIdx]) return;
  const q = list[qIdx];
  editFeedbackModal.targetKey = targetKey;
  editFeedbackModal.questionIndex = qIdx;
  editFeedbackModal.activeTab = 'incorrect';
  editFeedbackModal.incorrectFeedback = q.incorrectFeedback || '';
  editFeedbackModal.correctFeedback = q.correctFeedback || '';
  editFeedbackModal.open = true;
}

function closeEditFeedbackModal() {
  editFeedbackModal.open = false;
  editFeedbackModal.questionIndex = -1;
}

function saveEditFeedbackModal() {
  const list = editForm[editFeedbackModal.targetKey];
  if (Array.isArray(list) && list[editFeedbackModal.questionIndex]) {
    const q = list[editFeedbackModal.questionIndex];
    q.incorrectFeedback = (editFeedbackModal.incorrectFeedback || '').trim();
    q.correctFeedback = (editFeedbackModal.correctFeedback || '').trim();
  }
  closeEditFeedbackModal();
}

const editForm = reactive({
  title: '',
  instructions: '',
  strand: 'Communication Skills (English)',
  level: 'A&E Elementary',
  learningCenterId: '',
  code: 'LS1',
  dateStarted: '',
  dateEnded: '',
  activitiesRelated: '',
  isAllLearners: true,
  selectedLearnerIds: [],
  preTest: [],
  postTest: [],
});

function addEditQuestion(targetKey) {
  editErrorMessage.value = '';
  editForm[targetKey].push(createBlankEditQuestion());
}

function removeEditQuestion(targetKey, idx) {
  editErrorMessage.value = '';
  editForm[targetKey].splice(idx, 1);
}

function addEditOption(q) {
  editErrorMessage.value = '';
  if (!Array.isArray(q.choices)) q.choices = [];
  q.choices.push('');
  if (!Array.isArray(q.optionIds)) q.optionIds = [];
  q.optionIds.push(null);
}

function removeEditOption(q, cIdx) {
  editErrorMessage.value = '';
  if (!Array.isArray(q.choices)) return;
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

function selectEditCorrectAnswer(q, cIdx) {
  editErrorMessage.value = '';
  q.correctAnswer = cIdx;
}

function validateEditAssessmentQuestions(questionsArray, label) {
  if (!Array.isArray(questionsArray)) return { valid: true };
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
  return { valid: true };
}

const availableLearningCenters = computed(() => {
  const map = new Map();
  (assignedCenters.value || []).forEach((c) => {
    if (c.id && c.name && c.name !== '—') {
      map.set(Number(c.id), { id: Number(c.id), name: c.name });
    }
  });
  (allLearningCenters.value || []).forEach((c) => {
    if (c.id && c.name) {
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
  if (sLower.includes('scient') || sLower.includes('science')) return 'LS2';
  if (sLower.includes('mathematical') || sLower.includes('math') || sLower.includes('problem solving')) return 'LS3';
  if (sLower.includes('life') || sLower.includes('career')) return 'LS4';
  if (sLower.includes('self') || sLower.includes('society')) return 'LS5';
  if (sLower.includes('digital') || sLower.includes('citizenship')) return 'LS6';
  return '';
}

// Watch editForm.strand to automatically update editForm.code
watch(
  () => editForm.strand,
  (newStrand) => {
    if (newStrand) {
      editForm.code = resolveModuleCodeFromStrand(newStrand);
    }
  }
);

const editEligibleLearners = computed(() => {
  if (!editForm.level) return [];
  const targetLevelNorm = editForm.level.toLowerCase().trim();
  const selectedCenterId = editForm.learningCenterId ? Number(editForm.learningCenterId) : null;

  return (teacherLearners.value || []).filter((l) => {
    const isElem = l.targetLevel === 'ELEMENTARY' || (l.level || '').toLowerCase().includes('elem');
    const isMatchLevel = targetLevelNorm.includes('elem') ? isElem : !isElem;
    if (!isMatchLevel) return false;

    if (selectedCenterId && l.learningCenterId) {
      if (Number(l.learningCenterId) !== selectedCenterId) return false;
    }
    return true;
  });
});

const editLearnerSearchQuery = ref('');

const filteredEditSpecificLearners = computed(() => {
  const query = editLearnerSearchQuery.value.trim().toLowerCase();
  if (!query) return editEligibleLearners.value;
  return editEligibleLearners.value.filter((l) => {
    const nameMatch = (l.name || l.fullName || '').toLowerCase().includes(query);
    const centerMatch = (l.learningCenter || '').toLowerCase().includes(query);
    return nameMatch || centerMatch;
  });
});

const selectedEditLearnersList = computed(() => {
  const selectedSet = new Set((editForm.selectedLearnerIds || []).map(Number));
  return (teacherLearners.value || []).filter((l) => selectedSet.has(Number(l.id)));
});

function onEditAssignmentModeChange(isAll) {
  editForm.isAllLearners = isAll;
  if (isAll) {
    editForm.selectedLearnerIds = [];
  }
}

function toggleEditLearner(learnerId) {
  editForm.isAllLearners = false;
  const numId = Number(learnerId);
  const idx = editForm.selectedLearnerIds.indexOf(numId);
  if (idx === -1) {
    editForm.selectedLearnerIds.push(numId);
  } else {
    editForm.selectedLearnerIds.splice(idx, 1);
  }
}

watch(
  () => [editForm.learningCenterId, editForm.level],
  () => {
    if (!editForm.isAllLearners && Array.isArray(editForm.selectedLearnerIds)) {
      const validIds = new Set(editEligibleLearners.value.map((l) => Number(l.id)));
      editForm.selectedLearnerIds = editForm.selectedLearnerIds.filter((id) => validIds.has(Number(id)));
    }
  }
);

async function loadEditPrerequisites() {
  const tid = teacherId.value;
  try {
    const [learnersRes, centersRes] = await Promise.allSettled([
      getAssignedLearners(tid ? { teacherId: tid } : {}),
      getLearningCenters(),
    ]);

    if (learnersRes.status === 'fulfilled' && Array.isArray(learnersRes.value.data)) {
      teacherLearners.value = learnersRes.value.data.map((l) => {
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
    }

    if (centersRes.status === 'fulfilled' && Array.isArray(centersRes.value.data)) {
      allLearningCenters.value = centersRes.value.data;
    }
  } catch (err) {
    console.warn('Error loading edit prerequisites:', err);
  }
}

function openEditModal() {
  if (!moduleData.value) return;
  editErrorMessage.value = '';
  editLearnerDropdownOpen.value = false;

  let normLevel = moduleData.value.level || 'A&E Elementary';
  if (normLevel.toLowerCase().includes('elem')) normLevel = 'A&E Elementary';
  else if (normLevel.toLowerCase().includes('jun') || normLevel.toLowerCase().includes('sec')) normLevel = 'A&E Junior High';

  editForm.title = moduleData.value.title || '';
  editForm.instructions = moduleData.value.instructions || moduleData.value.description || '';
  editForm.strand = moduleData.value.strand || 'Communication Skills (English)';
  editForm.level = normLevel;
  editForm.learningCenterId = moduleData.value.learningCenterId || '';
  editForm.code = moduleData.value.code || 'LS1';
  editForm.dateStarted = moduleData.value.dateStarted ? String(moduleData.value.dateStarted).split('T')[0] : '';
  editForm.dateEnded = moduleData.value.dateEnded ? String(moduleData.value.dateEnded).split('T')[0] : '';
  editForm.activitiesRelated = moduleData.value.activitiesRelated || '';
  editForm.isAllLearners = moduleData.value.isAllLearners !== false;
  editForm.selectedLearnerIds = Array.isArray(moduleData.value.assignedLearnerIds)
    ? [...moduleData.value.assignedLearnerIds]
    : [];
  editForm.preTest = mapExistingQuestionsForEdit(preTestQuestions.value);
  editForm.postTest = mapExistingQuestionsForEdit(postTestQuestions.value);

  showEditModal.value = true;
  loadEditPrerequisites();
}

function closeEditModal() {
  showEditModal.value = false;
  editErrorMessage.value = '';
  editLearnerDropdownOpen.value = false;
}

async function saveEditModule() {
  editErrorMessage.value = '';

  if (!editForm.title || !editForm.title.trim()) {
    editErrorMessage.value = 'Module Title is required.';
    return;
  }
  if (!editForm.strand) {
    editErrorMessage.value = 'Learning Strand is required.';
    return;
  }
  if (!editForm.level) {
    editErrorMessage.value = 'Target ALS Level is required.';
    return;
  }
  if (!editForm.learningCenterId) {
    editErrorMessage.value = 'Learning Center is required.';
    return;
  }
  if (!editForm.code) {
    editErrorMessage.value = 'Module Code is required.';
    return;
  }
  if (!editForm.isAllLearners && (!editForm.selectedLearnerIds || editForm.selectedLearnerIds.length === 0)) {
    editErrorMessage.value = 'Please select the learners who will receive this module.';
    return;
  }
  if (!editForm.dateStarted) {
    editErrorMessage.value = 'Date Started is required.';
    return;
  }
  if (!editForm.dateEnded) {
    editErrorMessage.value = 'Date Ended is required.';
    return;
  }
  if (new Date(editForm.dateEnded) < new Date(editForm.dateStarted)) {
    editErrorMessage.value = 'Date Ended must not be earlier than Date Started.';
    return;
  }

  const preCheck = validateEditAssessmentQuestions(editForm.preTest, 'Pre-Test');
  if (!preCheck.valid) {
    editErrorMessage.value = preCheck.error;
    return;
  }

  const postCheck = validateEditAssessmentQuestions(editForm.postTest, 'Post-Test');
  if (!postCheck.valid) {
    editErrorMessage.value = postCheck.error;
    return;
  }

  isSavingEdit.value = true;
  try {
    const payload = {
      title: editForm.title.trim(),
      instructions: editForm.instructions.trim(),
      strand: editForm.strand,
      level: editForm.level,
      learningCenterId: Number(editForm.learningCenterId),
      code: editForm.code,
      dateStarted: editForm.dateStarted,
      dateEnded: editForm.dateEnded,
      activitiesRelated: editForm.activitiesRelated.trim(),
      isAllLearners: editForm.isAllLearners,
      assignedLearnerIds: editForm.isAllLearners ? [] : editForm.selectedLearnerIds,
      preTest: editForm.preTest.map((q, idx) => ({
        id: q.id || undefined,
        questionText: q.prompt.trim(),
        options: q.choices.map((c, cIdx) => ({
          id: Array.isArray(q.optionIds) ? q.optionIds[cIdx] || undefined : undefined,
          optionText: String(c ?? '').trim(),
          isCorrect: q.correctAnswer === cIdx,
        })),
        correctFeedback: q.correctFeedback ? q.correctFeedback.trim() : null,
        incorrectFeedback: q.incorrectFeedback ? q.incorrectFeedback.trim() : null,
        points: 1,
        sortOrder: idx + 1,
      })),
      postTest: editForm.postTest.map((q, idx) => ({
        id: q.id || undefined,
        questionText: q.prompt.trim(),
        options: q.choices.map((c, cIdx) => ({
          id: Array.isArray(q.optionIds) ? q.optionIds[cIdx] || undefined : undefined,
          optionText: String(c ?? '').trim(),
          isCorrect: q.correctAnswer === cIdx,
        })),
        correctFeedback: q.correctFeedback ? q.correctFeedback.trim() : null,
        incorrectFeedback: q.incorrectFeedback ? q.incorrectFeedback.trim() : null,
        points: 1,
        sortOrder: idx + 1,
      })),
    };

    const res = await updateModule(moduleData.value.id, payload);
    if (res.data) {
      moduleData.value = {
        ...moduleData.value,
        ...res.data,
      };
    }
    closeEditModal();
  } catch (err) {
    console.error('Error updating module:', err);
    editErrorMessage.value = err.response?.data?.error || 'Failed to update module. Please try again.';
  } finally {
    isSavingEdit.value = false;
  }
}

const choiceLetters = ['A', 'B', 'C', 'D'];

// Filter & Search
const submissionSearchQuery = ref('');
const selectedStatusFilter = ref('ALL');

// Review Learner Activity Page State
const showReviewModal = ref(false);
const currentSubmission = ref(null);
const isSavingReview = ref(false);
const reviewSuccessMessage = ref('');
const reviewErrorMessage = ref('');

const reviewForm = reactive({
  status: 'Mastered',
  teacherRemarks: '',
});

const learnerScores = ref({
  preTestScore: null,
  preTestTotal: 10,
  postTestScore: null,
  postTestTotal: 10,
  loading: false,
});

// Multi-file & File Preview State
const selectedFileIndex = ref(0);
const previewZoom = ref(1.0);
const isFitToWidth = ref(true);
const isPreviewFullscreen = ref(false);
const previewFullscreenRef = ref(null);
const previewViewportRef = ref(null);
const pdfPreviewCanvasRef = ref(null);
const pdfPreviewLoading = ref(false);
const pdfPreviewFallback = ref(false);
const pdfPreviewPage = ref(1);
const pdfPreviewTotalPages = ref(1);
const pdfPreviewDoc = shallowRef(null);
let activePdfRenderTask = null;

// Cache of probed file sizes (bytes) when fileSize is not in the record yet
const probedFileSizes = reactive({});

// Computed questions arrays
const preTestQuestions = computed(() => {
  if (!moduleData.value) return [];
  if (moduleData.value.preTest?.questions && Array.isArray(moduleData.value.preTest.questions)) {
    return moduleData.value.preTest.questions;
  }
  const pre = (moduleData.value.assessments || []).find((a) => a.type === 'PRE_TEST');
  return pre?.questions || [];
});

const postTestQuestions = computed(() => {
  if (!moduleData.value) return [];
  if (moduleData.value.postTest?.questions && Array.isArray(moduleData.value.postTest.questions)) {
    return moduleData.value.postTest.questions;
  }
  const post = (moduleData.value.assessments || []).find((a) => a.type === 'POST_TEST');
  return post?.questions || [];
});

// Normalize status into canonical buckets: 'Submitted', 'Mastered', 'Not Mastered'
function normalizeSubmissionBucket(status) {
  const s = String(status || '').trim().toLowerCase().replace(/_/g, ' ');
  if (s === 'mastered') return 'mastered';
  if (s === 'not mastered') return 'not mastered';
  return 'submitted';
}

// Filtered Submissions (All / Submitted / Mastered / Not Mastered)
const filteredSubmissions = computed(() => {
  let list = submissions.value || [];

  if (selectedStatusFilter.value !== 'ALL') {
    const target = selectedStatusFilter.value.toLowerCase();
    list = list.filter((s) => normalizeSubmissionBucket(s.status) === target);
  }

  if (submissionSearchQuery.value.trim()) {
    const q = submissionSearchQuery.value.trim().toLowerCase();
    list = list.filter((s) => {
      const name = (s.learnerName || '').toLowerCase();
      const lrn = (s.lrn || '').toLowerCase();
      const act = (s.activity || s.title || '').toLowerCase();
      return name.includes(q) || lrn.includes(q) || act.includes(q);
    });
  }

  return list;
});

function countByStatus(statusName) {
  const target = String(statusName || '').toLowerCase();
  return (submissions.value || []).filter((s) => normalizeSubmissionBucket(s.status) === target).length;
}

function formatProgressStatus(status) {
  const bucket = normalizeSubmissionBucket(status);
  if (bucket === 'mastered') return 'Mastered';
  if (bucket === 'not mastered') return 'Not Mastered';
  return 'Submitted';
}

function getStatusClass(status) {
  const bucket = normalizeSubmissionBucket(status);
  if (bucket === 'mastered') return 'status-mastered';
  if (bucket === 'not mastered') return 'status-not-mastered';
  return 'status-submitted';
}

function isImageFile(url, fileName) {
  const target = String(fileName || url || '').toLowerCase().split('?')[0];
  if (!target) return false;
  return (
    target.endsWith('.jpg') ||
    target.endsWith('.jpeg') ||
    target.endsWith('.png') ||
    target.endsWith('.webp') ||
    target.endsWith('.gif') ||
    String(url || '').startsWith('data:image') ||
    String(url || '').includes('images.unsplash.com')
  );
}

function isPdfFile(url, fileName) {
  const target = String(fileName || url || '').toLowerCase().split('?')[0];
  return target.endsWith('.pdf') || String(url || '').startsWith('data:application/pdf');
}

function getFallbackFileName(url) {
  if (!url) return 'Activity_Output.jpg';
  try {
    const parts = String(url).split('/');
    const last = parts[parts.length - 1];
    return decodeURIComponent(last.split('?')[0]) || 'Activity_Output.jpg';
  } catch {
    return 'Activity_Output.jpg';
  }
}

function resolveSubmissionImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/')) {
    return url;
  }
  return `/uploads/submissions/${url}`;
}

function getFileTypeDisplay(url, fileName) {
  const target = String(fileName || url || '').toLowerCase().split('?')[0];
  if (target.endsWith('.pdf')) return 'PDF Document';
  if (target.endsWith('.png')) return 'PNG Image';
  if (target.endsWith('.jpg') || target.endsWith('.jpeg')) return 'JPG Image';
  if (target.endsWith('.webp')) return 'WEBP Image';
  if (target.endsWith('.gif')) return 'GIF Image';
  return 'Image File';
}

function formatSubmissionFileSize(bytesOrUrl) {
  if (typeof bytesOrUrl === 'number' && bytesOrUrl > 0) {
    if (bytesOrUrl < 1024) return `${bytesOrUrl} B`;
    if (bytesOrUrl < 1024 * 1024) return `${(bytesOrUrl / 1024).toFixed(1)} KB`;
    return `${(bytesOrUrl / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (typeof bytesOrUrl === 'string' && bytesOrUrl.trim()) {
    const num = Number(bytesOrUrl);
    if (!isNaN(num) && num > 0) {
      return formatSubmissionFileSize(num);
    }
    return bytesOrUrl;
  }
  return '—';
}

async function probeFileSizeIfNeeded(fileItem) {
  if (!fileItem || !fileItem.fileUrl) return;
  if (fileItem.fileSize && Number(fileItem.fileSize) > 0) return;
  const resolvedUrl = resolveSubmissionImageUrl(fileItem.fileUrl);
  if (!resolvedUrl) return;
  if (probedFileSizes[resolvedUrl]) {
    fileItem.fileSize = probedFileSizes[resolvedUrl];
    return;
  }
  try {
    const headRes = await fetch(resolvedUrl, { method: 'HEAD' });
    const len = headRes.headers.get('content-length');
    if (len && Number(len) > 0) {
      probedFileSizes[resolvedUrl] = Number(len);
      fileItem.fileSize = Number(len);
      return;
    }
    const getRes = await fetch(resolvedUrl);
    if (getRes.ok) {
      const blob = await getRes.blob();
      if (blob.size > 0) {
        probedFileSizes[resolvedUrl] = blob.size;
        fileItem.fileSize = blob.size;
      }
    }
  } catch {
    // Ignore network probe errors
  }
}

// Extract normalized array of uploaded files for a submission
function getSubmissionFilesList(sub) {
  if (!sub) return [];
  const rawList = [];

  if (Array.isArray(sub.files) && sub.files.length > 0) {
    rawList.push(...sub.files);
  } else {
    // Inspect content JSON if present
    if (sub.content && typeof sub.content === 'string') {
      const trimmed = sub.content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            rawList.push(...parsed);
          } else if (parsed && Array.isArray(parsed.files)) {
            rawList.push(...parsed.files);
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    }

    if (rawList.length === 0 && (sub.fileUrl || sub.fileName)) {
      rawList.push({
        id: sub.id,
        fileName: sub.fileName || getFallbackFileName(sub.fileUrl),
        fileUrl: sub.fileUrl || '',
        fileSize: sub.fileSize || null,
        fileType: sub.fileType || null,
        submittedAt: sub.submittedAt || sub.dateSubmitted,
      });
    }
  }

  return rawList.map((f, idx) => {
    const fUrl = f.fileUrl || f.url || sub.fileUrl || '';
    const fName = f.fileName || f.name || getFallbackFileName(fUrl) || `Activity ${idx + 1}.jpg`;
    const resolvedUrl = resolveSubmissionImageUrl(fUrl);
    const pdfFlag = f.isPdf !== undefined ? Boolean(f.isPdf) : isPdfFile(fUrl, fName);
    const imgFlag = f.isImage !== undefined ? Boolean(f.isImage) : (!pdfFlag && isImageFile(fUrl, fName));
    const sizeVal = f.fileSize || f.size || probedFileSizes[resolvedUrl] || null;
    return {
      id: f.id || `${sub.id || 'sub'}-file-${idx + 1}`,
      fileName: fName,
      fileUrl: fUrl,
      fileSize: sizeVal,
      fileType: f.fileType || getFileTypeDisplay(fUrl, fName),
      isPdf: pdfFlag,
      isImage: imgFlag,
      submittedAt: f.submittedAt || sub.submittedAt || sub.dateSubmitted,
    };
  });
}

const currentSubmissionFiles = computed(() => {
  return getSubmissionFilesList(currentSubmission.value);
});

const selectedSubmissionFile = computed(() => {
  const list = currentSubmissionFiles.value;
  if (!list.length) return null;
  return list[selectedFileIndex.value] || list[0];
});

const imagePreviewDynamicStyle = computed(() => {
  if (isFitToWidth.value && previewZoom.value === 1) {
    return {
      width: '100%',
      maxWidth: '100%',
      height: 'auto',
    };
  }
  return {
    width: `${Math.round(previewZoom.value * 100)}%`,
    maxWidth: 'none',
    height: 'auto',
  };
});

function selectSubmissionFile(idx) {
  if (idx < 0 || idx >= currentSubmissionFiles.value.length) return;
  selectedFileIndex.value = idx;
  previewZoom.value = 1.0;
  isFitToWidth.value = true;
  pdfPreviewPage.value = 1;
  const file = currentSubmissionFiles.value[idx];
  if (file) {
    probeFileSizeIfNeeded(file);
    if (file.isPdf) {
      loadPdfPreviewDocument(file.fileUrl);
    } else {
      cleanupPdfPreviewDoc();
    }
  }
}

function cleanupPdfPreviewDoc() {
  if (activePdfRenderTask) {
    try {
      activePdfRenderTask.cancel();
    } catch {
      // ignore
    }
    activePdfRenderTask = null;
  }
  if (pdfPreviewDoc.value) {
    try {
      pdfPreviewDoc.value.destroy();
    } catch {
      // ignore
    }
    pdfPreviewDoc.value = null;
  }
  pdfPreviewTotalPages.value = 1;
  pdfPreviewPage.value = 1;
  pdfPreviewLoading.value = false;
  pdfPreviewFallback.value = false;
}

async function loadPdfPreviewDocument(rawUrl) {
  cleanupPdfPreviewDoc();
  const url = resolveSubmissionImageUrl(rawUrl);
  if (!url) return;

  pdfPreviewLoading.value = true;
  pdfPreviewFallback.value = false;

  try {
    const loadingTask = pdfjsLib.getDocument({ url });
    const doc = await loadingTask.promise;
    pdfPreviewDoc.value = markRaw(doc);
    pdfPreviewTotalPages.value = doc.numPages || 1;
    pdfPreviewPage.value = 1;
    pdfPreviewLoading.value = false;
    await nextTick();
    await renderCurrentPdfPreviewPage();
  } catch (err) {
    console.warn('PDF.js preview fallback to iframe:', err);
    pdfPreviewLoading.value = false;
    pdfPreviewFallback.value = true;
  }
}

async function renderCurrentPdfPreviewPage() {
  if (!pdfPreviewDoc.value || !pdfPreviewCanvasRef.value) return;
  if (activePdfRenderTask) {
    try {
      activePdfRenderTask.cancel();
    } catch {
      // ignore
    }
    activePdfRenderTask = null;
  }

  try {
    const pageNum = Math.min(Math.max(1, pdfPreviewPage.value), pdfPreviewTotalPages.value);
    const page = await pdfPreviewDoc.value.getPage(pageNum);
    const canvas = pdfPreviewCanvasRef.value;
    if (!canvas) return;

    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const containerWidth = previewViewportRef.value
      ? Math.max(320, previewViewportRef.value.clientWidth - 48)
      : 720;

    const baseScale = containerWidth / unscaledViewport.width;
    const effectiveScale = (isFitToWidth.value ? baseScale : Math.max(baseScale, 1.15)) * previewZoom.value;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({ scale: effectiveScale * dpr });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
    canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
    });
    activePdfRenderTask = renderTask;
    await renderTask.promise;
    activePdfRenderTask = null;
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.warn('Error rendering PDF page:', err);
    }
  }
}

async function changePdfPreviewPage(delta) {
  const next = pdfPreviewPage.value + delta;
  if (next < 1 || next > pdfPreviewTotalPages.value) return;
  pdfPreviewPage.value = next;
  await renderCurrentPdfPreviewPage();
}

function previewZoomIn() {
  isFitToWidth.value = false;
  previewZoom.value = Math.min(3.0, Number((previewZoom.value + 0.25).toFixed(2)));
  if (selectedSubmissionFile.value?.isPdf && !pdfPreviewFallback.value) {
    renderCurrentPdfPreviewPage();
  }
}

function previewZoomOut() {
  isFitToWidth.value = false;
  previewZoom.value = Math.max(0.5, Number((previewZoom.value - 0.25).toFixed(2)));
  if (selectedSubmissionFile.value?.isPdf && !pdfPreviewFallback.value) {
    renderCurrentPdfPreviewPage();
  }
}

function previewFitToWidth() {
  isFitToWidth.value = true;
  previewZoom.value = 1.0;
  if (selectedSubmissionFile.value?.isPdf && !pdfPreviewFallback.value) {
    renderCurrentPdfPreviewPage();
  }
}

function onPreviewImageLoad() {
  // Natural proportions preserved by CSS height: auto and object-fit: contain
}

async function togglePreviewFullscreen() {
  const el = previewFullscreenRef.value;
  if (!el) return;
  try {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
      isPreviewFullscreen.value = true;
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      isPreviewFullscreen.value = false;
    }
  } catch (err) {
    console.warn('Fullscreen toggle failed:', err);
  }
}

function handleFullscreenChange() {
  isPreviewFullscreen.value = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  if (selectedSubmissionFile.value?.isPdf && !pdfPreviewFallback.value) {
    setTimeout(() => renderCurrentPdfPreviewPage(), 120);
  }
}

async function downloadSelectedSubmissionFile() {
  const file = selectedSubmissionFile.value;
  if (!file || !file.fileUrl) return;
  const resolvedUrl = resolveSubmissionImageUrl(file.fileUrl);
  const downloadName = file.fileName || getFallbackFileName(file.fileUrl);

  try {
    const response = await fetch(resolvedUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch {
    const link = document.createElement('a');
    link.href = resolvedUrl;
    link.download = downloadName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Learner Prev / Next Navigation on the Review Page
const navigableSubmissions = computed(() => {
  return filteredSubmissions.value.length > 0 ? filteredSubmissions.value : submissions.value;
});

const currentLearnerNavIndex = computed(() => {
  if (!currentSubmission.value) return -1;
  return navigableSubmissions.value.findIndex(
    (s) =>
      Number(s.id) === Number(currentSubmission.value.id) ||
      (s.learnerId && Number(s.learnerId) === Number(currentSubmission.value.learnerId))
  );
});

function navigateReviewLearner(delta) {
  const idx = currentLearnerNavIndex.value;
  if (idx === -1) return;
  const nextSub = navigableSubmissions.value[idx + delta];
  if (nextSub) {
    openReviewModal(nextSub);
  }
}

function formatDisplayDate(dateVal) {
  if (!dateVal) return '—';
  try {
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const [y, m, d] = dateVal.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
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

function parseDateValue(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    const [y, m, d] = dateVal.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
}

function formatScheduleRange(startVal, endVal) {
  const startDate = parseDateValue(startVal);
  const endDate = parseDateValue(endVal);
  if (startDate && endDate) {
    if (startDate.getFullYear() === endDate.getFullYear()) {
      const startPart = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const endPart = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${startPart} – ${endPart}`;
    }
    return `${formatDisplayDate(startVal)} – ${formatDisplayDate(endVal)}`;
  }
  if (startVal) return formatDisplayDate(startVal);
  if (endVal) return formatDisplayDate(endVal);
  return '—';
}

function formatAlsLevelDisplay(levelVal) {
  if (!levelVal) return 'A&E Elementary';
  const norm = String(levelVal).toLowerCase().trim();
  if (norm.includes('junior') || norm.includes('jhs') || norm.includes('sec')) {
    return 'A&E Junior High';
  }
  if (norm.includes('elem')) {
    return 'A&E Elementary';
  }
  return String(levelVal);
}

// Consolidate duplicate learner rows on frontend as a safety net so one row per learner is always guaranteed
function consolidateLearnerSubmissionsFrontend(rawList) {
  if (!Array.isArray(rawList)) return [];
  const grouped = new Map();

  for (const item of rawList) {
    const key = `${item.moduleId || 'mod'}_${item.learnerId || item.lrn || item.learnerName || item.id}`;
    const itemFiles = getSubmissionFilesList(item);

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...item,
        files: itemFiles,
        fileCount: itemFiles.length,
      });
    } else {
      const existing = grouped.get(key);
      const existingUrls = new Set((existing.files || []).map((f) => f.fileUrl));
      for (const f of itemFiles) {
        if (f.fileUrl && !existingUrls.has(f.fileUrl)) {
          existing.files.push(f);
          existingUrls.add(f.fileUrl);
        }
      }
      existing.fileCount = existing.files.length;
      if (!existing.teacherRemarks && (item.teacherRemarks || item.remarks)) {
        existing.teacherRemarks = item.teacherRemarks || item.remarks;
        existing.remarks = existing.teacherRemarks;
      }
      if (normalizeSubmissionBucket(existing.status) === 'submitted' && normalizeSubmissionBucket(item.status) !== 'submitted') {
        existing.status = item.status;
      }
    }
  }

  return Array.from(grouped.values());
}

// Fetch Module Details
async function fetchModuleDetails() {
  const moduleId = route.params.id || route.params.moduleId;
  if (!moduleId) {
    errorMessage.value = 'No module identifier specified.';
    loading.value = false;
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await getModule(moduleId);
    if (res.data) {
      moduleData.value = res.data;
      await fetchSubmissions(moduleId);

      // If route has a submissionId parameter or tab=submissions query, open accordingly
      if (route.query.tab === 'submissions') {
        activeTab.value = 'submissions';
      }
      const routeSubId = route.params.submissionId;
      if (routeSubId) {
        activeTab.value = 'submissions';
        const targetSub = submissions.value.find(
          (s) => Number(s.id) === Number(routeSubId) || Number(s.learnerId) === Number(routeSubId)
        );
        if (targetSub) {
          await openReviewModal(targetSub, { skipRouteSync: true });
        }
      }
    } else {
      errorMessage.value = `Module #${moduleId} does not exist or has been removed.`;
    }
  } catch (err) {
    console.error('Error loading module:', err);
    errorMessage.value = err.response?.data?.error || `Unable to load module #${moduleId}.`;
  } finally {
    loading.value = false;
  }
}

// Fetch Submissions for this Module
async function fetchSubmissions(moduleId) {
  try {
    const params = { moduleId };
    if (teacherId.value) {
      params.teacherId = teacherId.value;
    }
    const res = await getSubmissions(params);
    if (Array.isArray(res.data)) {
      submissions.value = consolidateLearnerSubmissionsFrontend(res.data);
    } else {
      submissions.value = [];
    }
  } catch (err) {
    console.warn('Could not load submissions:', err);
    submissions.value = [];
  }
}

// Review Learner Activity Page Handlers
async function openReviewModal(submission, options = {}) {
  if (!submission) return;
  reviewSuccessMessage.value = '';
  reviewErrorMessage.value = '';

  currentSubmission.value = submission;
  const bucket = normalizeSubmissionBucket(submission.status);
  if (bucket === 'not mastered') {
    reviewForm.status = 'Not Mastered';
  } else {
    reviewForm.status = 'Mastered';
  }
  reviewForm.teacherRemarks = submission.teacherRemarks || submission.remarks || submission.feedback || '';

  // Initialize multi-file selection and preview state
  selectedFileIndex.value = 0;
  previewZoom.value = 1.0;
  isFitToWidth.value = true;
  pdfPreviewPage.value = 1;

  // Determine default questions total from module data if questions exist
  const preTotal = preTestQuestions.value?.length || 10;
  const postTotal = postTestQuestions.value?.length || 10;

  // Initialize scores from submission if already loaded
  learnerScores.value = {
    preTestScore:
      submission.preTestScore !== undefined && submission.preTestScore !== null
        ? Number(submission.preTestScore)
        : null,
    preTestTotal: submission.preTestTotal || preTotal,
    postTestScore:
      submission.postTestScore !== undefined && submission.postTestScore !== null
        ? Number(submission.postTestScore)
        : null,
    postTestTotal: submission.postTestTotal || postTotal,
    loading: true,
  };

  showReviewModal.value = true;

  // Sync URL to dedicated full-width review page if needed
  const modId = moduleData.value?.id || route.params.id;
  if (!options.skipRouteSync && modId && submission.id) {
    const targetPath = `/dashboard/modules/${modId}/submissions/${submission.id}`;
    if (route.path !== targetPath) {
      router.replace(targetPath).catch(() => {});
    }
  }

  // Probe file sizes for all uploaded files and initialize PDF preview if first file is PDF
  const filesList = getSubmissionFilesList(submission);
  filesList.forEach((f) => probeFileSizeIfNeeded(f));
  if (filesList[0]?.isPdf) {
    loadPdfPreviewDocument(filesList[0].fileUrl);
  } else {
    cleanupPdfPreviewDoc();
  }

  // Cross-check local CLC records (match strictly by learner AND module)
  try {
    const targetLearnerId = submission.learnerId ? Number(submission.learnerId) : null;
    const targetLearnerName = (submission.learnerName || '').trim().toLowerCase();
    const targetModuleId = moduleData.value?.id
      ? Number(moduleData.value.id)
      : submission.moduleId
        ? Number(submission.moduleId)
        : null;
    const targetModuleTitle = (moduleData.value?.title || submission.moduleTitle || '').trim().toLowerCase();

    for (const center of assignedCenters.value || []) {
      const { records } = useClcData(center.slug);
      const matched = (records.value || []).find((r) => {
        const isSameLearner =
          (targetLearnerId && Number(r.learnerId) === targetLearnerId) ||
          (targetLearnerName && (r.learnerName || '').trim().toLowerCase() === targetLearnerName);
        const isSameModule =
          (targetModuleId && Number(r.moduleId) === targetModuleId) ||
          (targetModuleTitle && (r.moduleTitle || '').trim().toLowerCase() === targetModuleTitle);
        return isSameLearner && isSameModule;
      });

      if (matched) {
        if (matched.preTestScore != null && learnerScores.value.preTestScore === null) {
          learnerScores.value.preTestScore = Number(matched.preTestScore);
          if (matched.preTestTotal) learnerScores.value.preTestTotal = Number(matched.preTestTotal);
        }
        if (matched.postTestScore != null && learnerScores.value.postTestScore === null) {
          learnerScores.value.postTestScore = Number(matched.postTestScore);
          if (matched.postTestTotal) learnerScores.value.postTestTotal = Number(matched.postTestTotal);
        }
      }
    }
  } catch (err) {
    console.warn('Could not inspect local CLC records for scores:', err);
  }

  // Fetch real database assessment scores from backend API
  try {
    const moduleId = moduleData.value?.id || submission.moduleId;
    const learnerId = submission.learnerId;
    if (moduleId && learnerId) {
      const res = await getLearnerAssessmentScores(moduleId, learnerId);
      if (res.data) {
        if (res.data.preTestScore !== null && res.data.preTestScore !== undefined) {
          learnerScores.value.preTestScore = Number(res.data.preTestScore);
        }
        if (res.data.preTestTotal) {
          learnerScores.value.preTestTotal = Number(res.data.preTestTotal);
        }
        if (res.data.postTestScore !== null && res.data.postTestScore !== undefined) {
          learnerScores.value.postTestScore = Number(res.data.postTestScore);
        }
        if (res.data.postTestTotal) {
          learnerScores.value.postTestTotal = Number(res.data.postTestTotal);
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch assessment scores from API:', err);
  } finally {
    learnerScores.value.loading = false;
  }
}

function closeReviewModal() {
  cleanupPdfPreviewDoc();
  showReviewModal.value = false;
  currentSubmission.value = null;
  reviewSuccessMessage.value = '';
  reviewErrorMessage.value = '';
  activeTab.value = 'submissions';
  learnerScores.value = {
    preTestScore: null,
    preTestTotal: 10,
    postTestScore: null,
    postTestTotal: 10,
    loading: false,
  };

  const modId = moduleData.value?.id || route.params.id;
  if (modId && route.params.submissionId) {
    router.replace({ path: `/dashboard/modules/${modId}`, query: { tab: 'submissions' } }).catch(() => {});
  }
}

async function saveSubmissionReview() {
  if (!currentSubmission.value) return;

  reviewSuccessMessage.value = '';
  reviewErrorMessage.value = '';

  if (!reviewForm.status || (reviewForm.status !== 'Mastered' && reviewForm.status !== 'Not Mastered')) {
    reviewErrorMessage.value = 'Please select a Learning Progress evaluation (Mastered or Not Mastered).';
    return;
  }

  isSavingReview.value = true;
  try {
    const subId = currentSubmission.value.id;
    const reviewDate = new Date().toISOString();
    const trimmedRemarks = (reviewForm.teacherRemarks || '').trim();
    const preservedFiles = getSubmissionFilesList(currentSubmission.value);

    const payload = {
      status: reviewForm.status, // 'Mastered' or 'Not Mastered'
      teacherRemarks: trimmedRemarks,
      remarks: trimmedRemarks,
      feedback: trimmedRemarks,
      reviewedAt: reviewDate,
      teacherId: teacherId.value,
      teacherName: teacherName.value,
    };

    const res = await updateSubmission(subId, payload);
    const updated = res.data;

    const updatedSubmissionObj = {
      ...currentSubmission.value,
      ...(updated || {}),
      files: updated?.files?.length ? updated.files : preservedFiles,
      fileCount: updated?.files?.length ? updated.files.length : preservedFiles.length,
      status: reviewForm.status,
      teacherRemarks: trimmedRemarks,
      remarks: trimmedRemarks,
      feedback: trimmedRemarks,
      reviewedAt: reviewDate,
      reviewerTeacher: teacherName.value,
    };

    currentSubmission.value = updatedSubmissionObj;

    // Update in local submissions list
    const idx = submissions.value.findIndex(
      (s) =>
        Number(s.id) === Number(subId) ||
        (s.learnerId && Number(s.learnerId) === Number(currentSubmission.value.learnerId))
    );
    if (idx !== -1) {
      submissions.value[idx] = updatedSubmissionObj;
    }

    // Sync to Teacher Records (useClcData & AF2 storage)
    try {
      const centerSlug =
        moduleData.value?.centerSlug ||
        assignedCenters.value[0]?.slug ||
        '_standalone-modules';

      const { records, createRecord, updateRecord } = useClcData(centerSlug);

      const learnerId = currentSubmission.value.learnerId;
      const learnerName = currentSubmission.value.learnerName;
      const modTitle = moduleData.value?.title || currentSubmission.value.activity;

      const existingRecord = (records.value || []).find((r) => {
        const matchLearner =
          (learnerId && Number(r.learnerId) === Number(learnerId)) ||
          (learnerName && r.learnerName?.toLowerCase() === learnerName.toLowerCase());
        const matchModule =
          (r.moduleId && Number(r.moduleId) === Number(moduleData.value?.id)) ||
          (r.moduleTitle && r.moduleTitle.toLowerCase() === modTitle.toLowerCase());
        return matchLearner && matchModule;
      });

      const recordUpdates = {
        learnerId: learnerId ? Number(learnerId) : null,
        learnerName: learnerName || '',
        lrn: currentSubmission.value.lrn || '',
        level: currentSubmission.value.programLevel || moduleData.value?.level || 'A&E Elementary',
        moduleId: moduleData.value?.id ? Number(moduleData.value.id) : null,
        moduleTitle: modTitle,
        strandName: moduleData.value?.strand || '',
        learningCenter: moduleData.value?.learningCenter || '',
        learningCenterId: moduleData.value?.learningCenterId ? Number(moduleData.value.learningCenterId) : null,
        teacherId: teacherId.value ? Number(teacherId.value) : null,
        teacherName: teacherName.value || '',
        assessment: reviewForm.status,
        moduleStatus: reviewForm.status,
        preTestScore:
          learnerScores.value.preTestScore != null
            ? learnerScores.value.preTestScore
            : (existingRecord?.preTestScore ?? null),
        preTestTotal: learnerScores.value.preTestTotal || existingRecord?.preTestTotal || null,
        postTestScore:
          learnerScores.value.postTestScore != null
            ? learnerScores.value.postTestScore
            : (existingRecord?.postTestScore ?? null),
        postTestTotal: learnerScores.value.postTestTotal || existingRecord?.postTestTotal || null,
        dateCompleted: reviewDate.split('T')[0],
        dateFinished: reviewDate.split('T')[0],
        uploadedOutputs:
          preservedFiles.map((f) => f.fileName || f.fileUrl).join(', ') ||
          currentSubmission.value.fileUrl ||
          currentSubmission.value.fileName ||
          '',
        remarks: trimmedRemarks,
      };

      if (existingRecord) {
        updateRecord(existingRecord.id, recordUpdates);
      } else {
        createRecord(recordUpdates);
      }
    } catch (recErr) {
      console.warn('Could not sync to teacher records:', recErr);
    }

    reviewSuccessMessage.value = `Review saved successfully! Learning Progress has been recorded as "${reviewForm.status}".`;
  } catch (err) {
    console.error('Error saving review:', err);
    reviewErrorMessage.value = err.response?.data?.error || 'Failed to save review. Please try again.';
  } finally {
    isSavingReview.value = false;
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  fetchModuleDetails();
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  cleanupPdfPreviewDoc();
});

watch(
  () => route.params.id || route.params.moduleId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchModuleDetails();
    }
  }
);

watch(
  () => route.params.submissionId,
  (newSubId) => {
    if (!newSubId && showReviewModal.value) {
      closeReviewModal();
    } else if (newSubId && submissions.value.length > 0) {
      const targetSub = submissions.value.find(
        (s) => Number(s.id) === Number(newSubId) || Number(s.learnerId) === Number(newSubId)
      );
      if (targetSub && (!currentSubmission.value || Number(currentSubmission.value.id) !== Number(targetSub.id))) {
        openReviewModal(targetSub, { skipRouteSync: true });
      }
    }
  }
);
</script>

<style scoped>
.module-details-page {
  width: 100%;
  max-width: 100%;
  padding-bottom: 3rem;
  box-sizing: border-box;
}

/* Back Nav Bar */
.back-nav-bar {
  margin-bottom: 1.25rem;
}

.bottom-back-nav-bar {
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  box-sizing: border-box;
}

.btn-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  transition: all 0.15s ease;
}

.btn-back-link:hover {
  color: #2563eb;
  border-color: #bfdbfe;
  background: #eff6ff;
}

/* Loading & Error States */
.details-loading-state,
.details-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  text-align: center;
}

.loading-spinner {
  width: 44px;
  height: 44px;
  border: 3.5px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.details-error-state .error-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fef2f2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.details-error-state h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem;
}

.details-error-state p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 1.5rem;
}

.btn-primary-back {
  background: #2563eb;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  text-decoration: none;
}

/* Main Container */
.module-main-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

/* Hero Header Card */
.module-hero-card {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem 2rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.hero-header-split {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.hero-header-main {
  flex: 1;
  min-width: 0;
}

.hero-header-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
  margin-top: 0;
}

.btn-module-action {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1.05rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.btn-module-edit {
  background: var(--action-edit-bg, #FFF7E8);
  border: 1px solid var(--action-edit-border, #F6E6CE);
  color: var(--action-edit-color, #946B32);
}

.btn-module-edit:hover {
  background: var(--action-edit-hover-bg, #FDEFCF);
  border-color: var(--action-edit-hover-border, #EACD9E);
  color: var(--action-edit-hover-color, #7A5422);
}

.btn-module-edit:focus-visible {
  outline: 2px solid var(--action-edit-color, #946B32);
  outline-offset: 1px;
  box-shadow: 0 0 0 3px var(--action-edit-focus-ring, rgba(148, 107, 50, 0.35));
}

.btn-module-delete {
  background: var(--action-delete-bg, #FFF1F1);
  border: 1px solid var(--action-delete-border, #F9D6D8);
  color: var(--action-delete-color, #B65B60);
}

.btn-module-delete:hover {
  background: var(--action-delete-hover-bg, #FDE4E4);
  border-color: var(--action-delete-hover-border, #F2B8BA);
  color: var(--action-delete-hover-color, #994247);
}

.btn-module-delete:focus-visible {
  outline: 2px solid var(--action-delete-color, #B65B60);
  outline-offset: 1px;
  box-shadow: 0 0 0 3px var(--action-delete-focus-ring, rgba(182, 91, 96, 0.35));
}

.badge-cluster {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.badge-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #15803d;
  background: #dcfce7;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
}

.status-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
}

.badge-code-pill {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0369a1;
  background: #e0f2fe;
  padding: 0.2rem 0.65rem;
  border-radius: 6px;
}

.badge-strand-pill {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e40af;
  background: #eff6ff;
  padding: 0.2rem 0.65rem;
  border-radius: 6px;
}

.badge-level-pill {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
}

.badge-clc-pill {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0f766e;
  background: #ccfbf1;
  padding: 0.2rem 0.65rem;
  border-radius: 6px;
}

.hero-module-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  margin: 0;
}

.hero-meta-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #64748b;
  flex-wrap: wrap;
  margin-bottom: 1.75rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.meta-label {
  color: #94a3b8;
}

.meta-value {
  color: #334155;
  font-weight: 600;
}

.meta-divider {
  color: #cbd5e1;
}

/* Nav Tabs */
.module-nav-tabs {
  display: flex;
  gap: 0.75rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.5rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: #2563eb;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-counter-badge {
  font-size: 0.75rem;
  font-weight: 700;
  background: #eff6ff;
  color: #2563eb;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.tab-btn.active .tab-counter-badge {
  background: #2563eb;
  color: #ffffff;
}

/* Content Sections */
.tab-pane-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

.content-section-card {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.75rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.card-section-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.header-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-icon-circle.blue {
  background: #eff6ff;
  color: #2563eb;
}

.header-icon-circle.amber {
  background: #fef3c7;
  color: #d97706;
}

.header-icon-circle.green {
  background: #dcfce7;
  color: #16a34a;
}

.header-icon-circle.purple {
  background: #f3e8ff;
  color: #9333ea;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.2rem;
}

.section-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.badge-count-pill {
  font-size: 0.75rem;
  font-weight: 700;
  color: #b45309;
  background: #fef3c7;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.badge-count-pill.purple {
  color: #7e22ce;
  background: #f3e8ff;
}

/* Overview Card & 5 Horizontal Module Details Row */
.details-overview-card {
  padding: 1.5rem 1.75rem;
}

.module-info-horizontal-row {
  display: grid;
  grid-template-columns: minmax(110px, 0.75fr) minmax(145px, 1fr) minmax(195px, 1.45fr) minmax(140px, 1fr) minmax(165px, 1.15fr);
  align-items: stretch;
  padding-bottom: 1.35rem;
  margin-bottom: 1.35rem;
  border-bottom: 1px solid #f1f5f9;
}

.info-strip-item {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.25rem 1.15rem;
  border-right: 1px solid #e2e8f0;
  min-width: 0;
}

.info-strip-item:first-child {
  padding-left: 0;
}

.info-strip-item:last-child {
  padding-right: 0;
  border-right: none;
}

.info-strip-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.info-strip-icon.accent-blue {
  background: #eff6ff;
  color: #2563eb;
}

.info-strip-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.info-strip-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.2;
}

.info-strip-value {
  font-size: 0.925rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.35;
  word-break: break-word;
}

.info-strip-value.code-accent {
  color: #2563eb;
  font-weight: 700;
}

/* Full-Width Vertical Instructions and Related Activities */
.instructions-activities-stack,
.instructions-activities-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.detail-note-panel {
  background: #fafbfc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.detail-note-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
}

.detail-note-header svg {
  color: #2563eb;
  flex-shrink: 0;
}

.detail-note-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
}

.detail-note-body {
  min-width: 0;
}

/* Module Content Section (Google Classroom-inspired clickable rows) */
.module-content-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.module-content-heading {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  padding-left: 0.15rem;
}

.module-resource-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.resource-accordion-wrapper {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.resource-accordion-wrapper:hover {
  border-color: #cbd5e1;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.04);
}

.resource-clickable-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.35rem;
  background: #ffffff;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
  box-sizing: border-box;
}

.resource-clickable-row:hover {
  background: #f8fafc;
}

.resource-clickable-row.is-expanded {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.resource-row-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.resource-row-icon.pdf-icon {
  background: #eff6ff;
  color: #2563eb;
}

.resource-row-icon.assessment-icon {
  background: #eff6ff;
  color: #2563eb;
}

.resource-row-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.resource-row-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.resource-row-desc {
  font-size: 0.84rem;
  color: #64748b;
  line-height: 1.35;
}

.resource-row-arrow {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  flex-shrink: 0;
  transition: transform 0.2s ease, color 0.15s ease, background-color 0.15s ease;
}

.resource-clickable-row:hover .resource-row-arrow {
  color: #2563eb;
  background: #eff6ff;
}

.resource-row-arrow.rotated {
  transform: rotate(90deg);
  color: #2563eb;
}

.resource-expanded-panel {
  padding: 1.25rem 1.5rem;
  background: #ffffff;
}

.assessment-expanded-stack {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #f8fafc;
}

.nested-assessment-card {
  padding: 1.4rem 1.5rem;
  border-radius: 12px;
}

@media (max-width: 1120px) {
  .module-info-horizontal-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 1rem;
  }

  .info-strip-item {
    padding: 0.35rem 1rem;
  }

  .info-strip-item:nth-child(3) {
    border-right: none;
    padding-right: 0;
  }

  .info-strip-item:nth-child(4) {
    padding-left: 0;
  }
}

@media (max-width: 768px) {
  .details-overview-card {
    padding: 1.25rem;
  }

  .module-info-horizontal-row {
    grid-template-columns: 1fr;
    row-gap: 0;
  }

  .info-strip-item,
  .info-strip-item:first-child,
  .info-strip-item:nth-child(3),
  .info-strip-item:nth-child(4),
  .info-strip-item:last-child {
    padding: 0.7rem 0;
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
  }

  .info-strip-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .info-strip-item:first-child {
    padding-top: 0;
  }

  .instructions-activities-stack,
  .instructions-activities-grid {
    gap: 1rem;
  }

  .resource-clickable-row {
    padding: 0.95rem 1.1rem;
  }

  .resource-expanded-panel {
    padding: 1rem;
  }
}

.prose-text {
  font-size: 0.9rem;
  line-height: 1.55;
  color: #334155;
  margin: 0;
  white-space: pre-wrap;
}

.empty-text-hint {
  font-size: 0.875rem;
  color: #94a3b8;
  font-style: italic;
  margin: 0;
}

/* Questions Deck */
.questions-deck {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.question-review-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
}

.q-header-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.q-index-pill {
  font-size: 0.75rem;
  font-weight: 700;
  color: #b45309;
  background: #fef3c7;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.q-index-pill.purple {
  color: #7e22ce;
  background: #f3e8ff;
}

.q-points-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.q-prompt-text {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.45;
  margin: 0 0 1rem;
}

.choices-display-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .choices-display-grid {
    grid-template-columns: 1fr;
  }
}

.choice-item-pill {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  font-size: 0.875rem;
  color: #334155;
  transition: all 0.15s ease;
}

.choice-item-pill.is-correct {
  border-color: #86efac;
  background: #f0fdf4;
  color: #166534;
  font-weight: 600;
}

.choice-alpha-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.choice-item-pill.is-correct .choice-alpha-badge {
  background: #16a34a;
  color: #ffffff;
}

.choice-label-text {
  flex: 1;
}

.correct-tag-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #15803d;
  background: #dcfce7;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  text-transform: uppercase;
}

.q-feedback-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  font-size: 0.85rem;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  margin-top: 1rem;
}

/* Material File Banner */
.material-file-banner {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
}

.file-type-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-meta-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.file-name-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.file-name-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-ext-pill {
  font-size: 0.7rem;
  font-weight: 700;
  color: #2563eb;
  background: #dbeafe;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.file-link-path {
  font-size: 0.75rem;
  color: #64748b;
  word-break: break-all;
}

.btn-open-material-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.65rem 1.15rem;
  border-radius: 8px;
  text-decoration: none;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.btn-open-material-cta:hover {
  background: #1d4ed8;
}

.component-empty-placeholder {
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
}

/* Submissions Tab */
.submissions-header-controls {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.submissions-filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 0.85rem;
  height: 42px;
  min-height: 42px;
  width: 100%;
  max-width: 360px;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.search-input-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.search-text-input {
  border: none;
  outline: none;
  font-size: 0.85rem;
  width: 100%;
  color: #0f172a;
  background: transparent;
}

.status-filter-pills {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-pill-btn {
  background: #f1f5f9;
  border: 1px solid transparent;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.filter-pill-btn.active {
  background: #2563eb;
  color: #ffffff;
}

/* Submissions Table */
.submissions-table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
}

.submissions-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  text-align: left;
}

.submissions-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.9rem 1.15rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.submissions-table td {
  padding: 1rem 1.15rem;
  font-size: 0.875rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.sub-table-row:last-child td {
  border-bottom: none;
}

.sub-table-row:hover {
  background: #f8fafc;
}

/* Balanced, Responsive Column Widths Across Full Width */
.th-learner-name,
.td-learner-name {
  width: 17%;
  min-width: 160px;
}

.th-lrn,
.td-lrn {
  width: 12%;
  min-width: 120px;
}

.th-level,
.td-level {
  width: 12%;
  min-width: 120px;
}

.th-activity,
.td-activity {
  width: 17%;
  min-width: 160px;
}

.th-date,
.td-date {
  width: 11%;
  min-width: 115px;
  white-space: nowrap;
}

.th-status,
.td-status {
  width: 10%;
  min-width: 105px;
}

.th-remarks,
.td-remarks {
  width: 15%;
  min-width: 160px;
}

.th-action,
.td-action {
  width: 6%;
  min-width: 135px;
  text-align: right;
  white-space: nowrap;
}

.sub-level-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  background: #f1f5f9;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.sub-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
}

.sub-status-badge .sub-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.sub-status-badge.status-mastered {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}
.sub-status-badge.status-mastered .sub-dot {
  background: #22c55e;
}

.sub-status-badge.status-not-mastered {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.sub-status-badge.status-not-mastered .sub-dot {
  background: #ef4444;
}

.sub-status-badge.status-submitted,
.sub-status-badge.status-not-evaluated {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}
.sub-status-badge.status-submitted .sub-dot,
.sub-status-badge.status-not-evaluated .sub-dot {
  background: #3b82f6;
}

.activity-cell-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.activity-files-count-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 0.12rem 0.48rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.remarks-cell {
  max-width: 320px;
}

.remarks-snippet {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.825rem;
  line-height: 1.45;
  color: #475569;
  word-break: break-word;
}

.text-muted-dash {
  color: #cbd5e1;
}

.text-right {
  text-align: right;
}

.font-mono {
  font-family: monospace;
}

.font-medium {
  font-weight: 600;
}

.text-dark {
  color: #0f172a;
}

.text-muted {
  color: #64748b;
}

.btn-review-sub {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--action-view-bg, #EFF6FF);
  border: 1px solid var(--action-view-border, #DCE7F6);
  color: var(--action-view-color, #4169A8);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-review-sub:hover {
  background: var(--action-view-hover-bg, #E0EEFE);
  color: var(--action-view-hover-color, #315488);
  border-color: var(--action-view-hover-border, #B9D3F4);
}

.btn-review-sub:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8);
  outline-offset: 1px;
  box-shadow: 0 0 0 3px var(--action-view-focus-ring, rgba(65, 105, 168, 0.35));
}

/* Submissions Empty Card */
.submissions-empty-card {
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.submissions-empty-card h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.35rem;
}

.submissions-empty-card p {
  font-size: 0.875rem;
  color: #64748b;
  max-width: 420px;
  margin: 0;
}

/* ========================================================================= */
/* FULL-WIDTH REVIEW LEARNER ACTIVITY PAGE                                   */
/* ========================================================================= */
.review-activity-fullpage {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.review-top-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.learner-prev-next-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.learner-nav-counter {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  margin-right: 0.25rem;
}

.btn-learner-step {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.42rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-learner-step:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-learner-step:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Review Page Header Card & Learner Info Bar */
.review-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.35rem 1.75rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.review-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.review-page-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.2rem;
  letter-spacing: -0.01em;
}

.review-page-module-subtitle {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  margin: 0;
}

.review-learner-meta-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.learner-meta-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.learner-meta-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.learner-meta-value {
  font-size: 0.925rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.learner-meta-value.strong {
  font-weight: 700;
  color: #0f172a;
}

.learner-meta-status-wrap {
  display: flex;
  align-items: center;
}

/* Alert Banners (Save Success / Error) */
.review-alert-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
}

.review-alert-banner.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.review-alert-banner.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-banner-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.alert-close-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  color: currentColor;
  opacity: 0.7;
  cursor: pointer;
  padding: 0 0.25rem;
}

.alert-close-btn:hover {
  opacity: 1;
}

/* Desktop Two-Column Layout: Left 60% / Right 40% */
.review-two-column-layout {
  display: grid;
  grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
  gap: 1.25rem;
  align-items: start;
}

.review-left-col,
.review-right-col {
  min-width: 0;
}

.review-panel-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.panel-heading {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

/* Left Column: Submitted Activities Card */
.submitted-activities-card {
  display: flex;
  flex-direction: column;
}

.submitted-activities-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.15rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  flex-wrap: wrap;
}

.submitted-activities-title-group {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.files-total-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 0.18rem 0.6rem;
  border-radius: 9999px;
}

.submitted-date-caption {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
}

/* Submitted Activities Split Body: File List Sidebar + Large Preview Area */
.submitted-activities-body {
  display: grid;
  grid-template-columns: 225px minmax(0, 1fr);
  min-height: 560px;
}

.submitted-files-list {
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 680px;
  overflow-y: auto;
}

.submitted-file-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  text-align: left;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.7rem 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.submitted-file-item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.submitted-file-item.active {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.12);
}

.file-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-item-icon.is-pdf {
  background: #fef2f2;
  color: #dc2626;
}

.submitted-file-item.active .file-item-icon:not(.is-pdf) {
  background: #dbeafe;
  color: #1d4ed8;
}

.file-item-meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.file-item-name {
  font-size: 0.825rem;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.submitted-file-item.active .file-item-name {
  color: #1e40af;
  font-weight: 700;
}

.file-item-submeta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: #64748b;
  flex-wrap: wrap;
}

.submeta-dot {
  color: #94a3b8;
}

/* Large File Preview Container & Toolbar */
.file-preview-container {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f1f5f9;
}

.file-preview-container:fullscreen {
  background: #0f172a;
  height: 100vh;
}

.file-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.toolbar-file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex-wrap: wrap;
}

.toolbar-active-filename {
  font-size: 0.825rem;
  font-weight: 600;
  color: #334155;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pdf-page-nav-group {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.15rem 0.35rem;
}

.pdf-page-indicator {
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  padding: 0 0.3rem;
  white-space: nowrap;
}

.toolbar-controls-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.38rem 0.55rem;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.toolbar-btn.active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.toolbar-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar-zoom-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  min-width: 42px;
  text-align: center;
}

/* File Preview Viewport */
.file-preview-viewport {
  flex: 1;
  min-height: 490px;
  max-height: 640px;
  overflow: auto;
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #f1f5f9;
  box-sizing: border-box;
}

.file-preview-container:fullscreen .file-preview-viewport {
  max-height: calc(100vh - 56px);
  background: #1e293b;
}

.preview-image-element {
  display: block;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
  transition: width 0.15s ease;
}

.preview-pdf-canvas {
  display: block;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
  border: 1px solid #cbd5e1;
}

.preview-pdf-iframe {
  width: 100%;
  min-height: 520px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
}

.preview-loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 360px;
  color: #64748b;
  font-size: 0.875rem;
}

.no-artifact-hint {
  padding: 3rem 1.5rem;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  color: #64748b;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin: 1.25rem;
}

/* ========================================================================= */
/* RIGHT COLUMN (40%): SCORES, EVALUATION & TEACHER REMARKS                  */
/* ========================================================================= */
.evaluation-sidebar-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.eval-section-block {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.eval-divider {
  height: 1px;
  background: #e2e8f0;
  width: 100%;
}

/* 1. Compact Module Assessment Scores */
.compact-scores-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.15rem;
}

.compact-score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
}

.compact-score-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
}

.compact-score-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.compact-score-empty {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
}

/* 2. Learning Progress Evaluation */
.eval-description-text {
  font-size: 0.835rem;
  color: #64748b;
  line-height: 1.45;
  margin: 0;
}

.eval-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 0.15rem;
}

.eval-label {
  font-size: 0.825rem;
  font-weight: 600;
  color: #334155;
}

.eval-label .req {
  color: #ef4444;
}

.eval-select-input,
.eval-textarea-input {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  font-size: 0.875rem;
  font-family: inherit;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.eval-textarea-input {
  min-height: 145px;
  line-height: 1.55;
  resize: vertical;
}

.eval-select-input:focus,
.eval-textarea-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.eval-guidance-callout {
  padding: 0.8rem 1rem;
  border-radius: 9px;
  font-size: 0.825rem;
  line-height: 1.45;
  margin-top: 0.35rem;
  border: 1px solid transparent;
}

.eval-guidance-callout.is-mastered {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.eval-guidance-callout.is-not-mastered {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.guidance-flex {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.guidance-flex svg {
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.remarks-heading-label {
  cursor: pointer;
}

/* 4. Save Review Footer Actions */
.eval-panel-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.btn-modal-cancel {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-modal-cancel:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-modal-save {
  background: #2563eb;
  border: 1px solid transparent;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.65rem 1.4rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-modal-save:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-modal-save:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Responsive Layout for Tablet & Mobile */
@media (max-width: 1120px) {
  .review-two-column-layout {
    grid-template-columns: 1fr;
  }

  .submitted-activities-body {
    grid-template-columns: 200px minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .review-header-card {
    padding: 1.15rem 1.25rem;
  }

  .review-learner-meta-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .submitted-activities-body {
    grid-template-columns: 1fr;
  }

  .submitted-files-list {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    max-height: 220px;
  }

  .btn-ctrl-text {
    display: none;
  }

  .compact-scores-list {
    grid-template-columns: 1fr;
  }

  .eval-panel-actions {
    width: 100%;
  }

  .eval-panel-actions .btn-modal-cancel,
  .eval-panel-actions .btn-modal-save {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .review-learner-meta-bar {
    grid-template-columns: 1fr;
  }
}

/* Edit Modal Styles */
.edit-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1.25rem;
  animation: editOverlayFadeIn 0.18s ease-out;
}

@keyframes editOverlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.edit-modal-card {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 740px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  overflow: hidden;
  animation: editModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes editModalPop {
  0% {
    opacity: 0;
    transform: scale(0.96) translateY(6px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.edit-modal-header {
  padding: 1.5rem 1.75rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.edit-modal-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.edit-modal-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.btn-modal-close {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.edit-error-banner {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
  padding: 0.75rem 1.25rem;
  margin: 1rem 1.75rem 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #991b1b;
  font-size: 0.875rem;
  font-weight: 500;
}

.edit-modal-body {
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  flex: 1;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.15rem;
}

.field-item {
  display: flex;
  flex-direction: column;
}

.field-item.full-width {
  grid-column: span 2;
}

.field-lbl {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

.field-lbl .req {
  color: #dc2626;
  font-weight: 700;
}

.field-input-box,
.field-select-box,
.field-textarea-box {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field-input-box:focus,
.field-select-box:focus,
.field-textarea-box:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.edit-modal-footer {
  padding: 1rem 1.75rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  background: #f8fafc;
}

.spinner-inline {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: editSpin 0.6s linear infinite;
  display: inline-block;
  margin-right: 0.25rem;
}

@keyframes editSpin {
  to { transform: rotate(360deg); }
}

/* Learner Dropdown in Edit Modal */
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
}

.learner-selection-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-chevron {
  color: #64748b;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.dropdown-chevron.rotate-180 {
  transform: rotate(180deg);
}

.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2010;
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
  z-index: 2020;
  padding: 0.5rem 0;
  max-height: 240px;
  display: flex;
  flex-direction: column;
}

.learner-option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.learner-option-item:hover {
  background-color: #f1f5f9;
}

.learner-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  cursor: pointer;
  flex-shrink: 0;
}

.learner-option-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Read-only Module Code Box */
.field-input-box.is-readonly {
  background-color: #f8fafc;
  color: #1e293b;
  cursor: default;
  font-weight: 600;
  border-color: #cbd5e1;
}

/* Learner Assignment Section in Edit Modal */
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
  height: 42px;
  min-height: 42px;
  border-radius: 8px;
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

/* Edit Modal Assessment Blocks & Google Forms-Inspired Question Builder */
.edit-assessment-block {
  margin-top: 1.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.edit-assessment-header {
  margin-bottom: 1rem;
}

.edit-assessment-header h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
}

.edit-assessment-header p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.gf-questions-container {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  margin-bottom: 1.15rem;
}

.gf-question-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.15rem 1.25rem 0.95rem 1.25rem;
  box-sizing: border-box;
}

.gf-question-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.9rem;
}

.gf-question-number {
  font-size: 0.925rem;
  font-weight: 700;
  color: #1e293b;
  min-width: 1.35rem;
  flex-shrink: 0;
}

.gf-question-input {
  flex: 1;
  width: 100%;
  padding: 0.6rem 0.8rem;
  font-size: 0.9rem;
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
  padding: 0.5rem 0.8rem;
  margin-bottom: 0.8rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.8rem;
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
  padding: 0.3rem 0.8rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.785rem;
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
  gap: 0.55rem;
  margin-bottom: 0.7rem;
}

.gf-option-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.18rem 0.25rem;
  border-radius: 8px;
}

.gf-option-row.is-correct-choice {
  background: #f0fdf4;
}

.gf-option-radio {
  width: 17px;
  height: 17px;
  margin: 0;
  cursor: pointer;
  accent-color: #16a34a;
  flex-shrink: 0;
}

.gf-option-input {
  flex: 1;
  width: 100%;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
  color: #1e293b;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  outline: none;
  font-family: inherit;
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
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
  white-space: nowrap;
}

.gf-remove-option-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  flex-shrink: 0;
}

.gf-remove-option-btn:hover {
  background: #fef2f2;
  color: #dc2626;
}

.gf-add-option-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.15rem 0.25rem 0.6rem 0.25rem;
}

.gf-radio-deco {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  flex-shrink: 0;
  box-sizing: border-box;
}

.gf-add-option-btn {
  padding: 0.28rem 0.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 0.825rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  font-family: inherit;
}

.gf-add-option-btn:hover {
  background: #f1f5f9;
  color: #1d4ed8;
}

.gf-saved-feedback-box {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.6rem 0.8rem;
  margin-bottom: 0.7rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.gf-saved-feedback-item {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  font-size: 0.785rem;
  line-height: 1.4;
}

.gf-saved-feedback-label {
  font-weight: 700;
  color: #334155;
  font-size: 0.725rem;
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
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.gf-footer-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.gf-answer-key-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.75rem;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 7px;
  font-size: 0.785rem;
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
  gap: 0.35rem;
  padding: 0.38rem 0.7rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 0.785rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  font-family: inherit;
}

.gf-add-feedback-btn:hover,
.gf-add-feedback-btn.has-feedback {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.gf-ak-status {
  font-size: 0.75rem;
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
  padding: 0.35rem 0.65rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 0.785rem;
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

.gf-feedback-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1400;
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
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  flex-wrap: wrap;
}

.gf-btn-add-question {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.gf-btn-add-question:hover {
  background: #1d4ed8;
}

.gf-total-questions {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 500;
}

.gf-total-questions strong {
  color: #0f172a;
  font-weight: 700;
}

@media (max-width: 640px) {
  .hero-header-split {
    flex-direction: column;
  }
  .hero-header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
  .field-item.full-width {
    grid-column: span 1;
  }
}
</style>

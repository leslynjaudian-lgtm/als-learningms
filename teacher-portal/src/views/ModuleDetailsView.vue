<template>
  <div class="module-details-page">
    <!-- Top Breadcrumb / Back Navigation (Hidden when in Full-Width Review Learner Activity Page) -->
    <div v-if="!showReviewModal || !currentSubmission" class="back-nav-bar">
      <nav class="page-breadcrumbs" aria-label="Breadcrumb">
        <ol class="breadcrumbs-list">
          <li class="breadcrumb-item">
            <router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link>
            <span class="breadcrumb-separator">/</span>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/dashboard/modules" class="breadcrumb-link">Modules</router-link>
            <span class="breadcrumb-separator">/</span>
          </li>
          <li class="breadcrumb-item">
            <router-link :to="backToModulesRoute" class="breadcrumb-link">{{ formatAlsLevelDisplay(moduleData?.level) }}</router-link>
            <span class="breadcrumb-separator">/</span>
          </li>
          <li class="breadcrumb-item">
            <span class="breadcrumb-current">{{ moduleData?.title || 'Details' }}</span>
          </li>
        </ol>
      </nav>

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
            @click="selectModuleTab('details')"
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
            @click="selectModuleTab('submissions')"
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
        <!-- 1. Overview Card: 5 Horizontal Details + Instructions -->
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
                <span class="info-strip-label">Learning Strand Code</span>
                <span class="info-strip-value code-accent">{{ moduleData.code || moduleData.learningArea?.code || '—' }}</span>
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
                <span class="info-strip-value">{{ moduleData.learningArea?.name || moduleData.strand || '—' }}</span>
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

          <!-- Instructions Section -->
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
                <div
                  v-if="sanitizedModuleInstructions"
                  class="prose-text rich-instructions-content"
                  v-html="sanitizedModuleInstructions"
                ></div>
                <p v-else class="empty-text-hint">No instructions provided for this module.</p>
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
                  <span>All</span>
                  <span class="tab-count">{{ submissions.length }}</span>
                </button>
                <button
                  type="button"
                  class="filter-pill-btn"
                  :class="{ active: selectedStatusFilter === 'Recorded' }"
                  @click="selectedStatusFilter = 'Recorded'"
                >
                  <span>Recorded</span>
                  <span class="tab-count">{{ countByStatus('Recorded') }}</span>
                </button>
                <button
                  type="button"
                  class="filter-pill-btn"
                  :class="{ active: selectedStatusFilter === 'Not Recorded' }"
                  @click="selectedStatusFilter = 'Not Recorded'"
                >
                  <span>Not Recorded</span>
                  <span class="tab-count">{{ countByStatus('Not Recorded') }}</span>
                </button>
                <button
                  type="button"
                  class="filter-pill-btn"
                  :class="{ active: selectedStatusFilter === 'In Progress' }"
                  @click="selectedStatusFilter = 'In Progress'"
                >
                  <span>In Progress</span>
                  <span class="tab-count">{{ countByStatus('In Progress') }}</span>
                </button>
                <button
                  type="button"
                  class="filter-pill-btn"
                  :class="{ active: selectedStatusFilter === 'Overdue' }"
                  @click="selectedStatusFilter = 'Overdue'"
                >
                  <span>Overdue</span>
                  <span class="tab-count">{{ countByStatus('Overdue') }}</span>
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
                  <th class="th-date">Submitted Date</th>
                  <th class="th-status">Status</th>
                  <th class="th-action text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sub in filteredSubmissions" :key="sub.id" class="sub-table-row">
                  <td class="td-learner-name table-cell-name">
                    {{ sub.learnerName }}
                  </td>
                  <td class="td-lrn">
                    {{ sub.lrn || '—' }}
                  </td>
                  <td class="td-date">
                    {{ hasSubmissionOutput(sub) ? formatDisplayDate(sub.submittedAt || sub.dateSubmitted) : '—' }}
                  </td>
                  <td class="td-status">
                    <span
                      class="sub-status-badge"
                      :class="getStatusClass(sub.status, sub)"
                    >
                      <span class="sub-dot"></span>
                      {{ formatProgressStatus(sub.status, sub) }}
                    </span>
                  </td>
                  <td class="td-action text-center">
                    <button
                      type="button"
                      class="btn-action-chevron"
                      title="Open"
                      aria-label="Open"
                      @click="openReviewModal(sub)"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
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
      <!-- Top Navigation Bar: Back to Report / Back to Submissions + Learner Prev/Next Navigation -->
      <div class="review-top-nav-row">
        <div class="review-nav-left-btns">
          <router-link
            v-if="reportReturnPath"
            :to="reportReturnPath"
            class="btn-back-link btn-back-report"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            <span>Back to Report</span>
          </router-link>

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
        </div>

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
            <h1 class="review-page-title">
              {{ isProgressViewMode ? 'Learner Module Progress Details' : 'Review Learner Activity' }}
            </h1>
            <p class="review-page-module-subtitle">{{ moduleData.title }}</p>
          </div>
          <div v-if="effectiveSubmissionDeadline" class="review-deadline-pill" :class="{ 'is-overdue': isOverdueSubmissionMode }">
            <span>Deadline: {{ formatDisplayDate(effectiveSubmissionDeadline) }}</span>
          </div>
        </div>

        <div class="review-learner-meta-bar">
          <div class="learner-meta-cell">
            <span class="learner-meta-label">Learner Name</span>
            <span class="learner-meta-value strong">{{ currentSubmission.learnerName }}</span>
          </div>

          <div class="learner-meta-cell">
            <span class="learner-meta-label">LRN</span>
            <span class="learner-meta-value">{{ currentSubmission.lrn || '—' }}</span>
          </div>

          <div class="learner-meta-cell">
            <span class="learner-meta-label">ALS Level</span>
            <span class="learner-meta-value">{{ formatAlsLevelDisplay(currentSubmission.programLevel || moduleData.level) }}</span>
          </div>

          <div v-if="learnerProgressDetails" class="learner-meta-cell">
            <span class="learner-meta-label">Completion</span>
            <span class="learner-meta-value strong">{{ learnerProgressDetails.progressPct ?? 0 }}%</span>
          </div>

          <div class="learner-meta-cell">
            <span class="learner-meta-label">Status</span>
            <div class="learner-meta-status-wrap">
              <span class="sub-status-badge" :class="effectiveReviewStatusClass">
                <span class="sub-dot"></span>
                {{ effectiveReviewStatusLabel }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Completed & Incomplete Activities Breakdown (Progress View / Overdue Details) -->
      <div
        v-if="(isProgressViewMode || isOverdueSubmissionMode || !hasSubmissionOutput(currentSubmission)) && learnerProgressDetails"
        class="review-panel-card activity-progress-breakdown-card"
      >
        <div class="breakdown-header-row">
          <div>
            <h2 class="panel-heading">Completed &amp; Incomplete Activities</h2>
            <p class="breakdown-subtext">
              <template v-if="isOverdueSubmissionMode">
                Submission deadline passed on {{ formatDisplayDate(effectiveSubmissionDeadline) }}. Review completed and missing activities below.
              </template>
              <template v-else>
                Track completed and remaining activities required for this module.
              </template>
            </p>
          </div>
        </div>

        <div class="activity-checklist-grid">
          <!-- 1. Pre-Test -->
          <div class="activity-check-item" :class="{ 'is-done': !learnerProgressDetails.preTest?.required || learnerProgressDetails.preTest?.completed }">
            <div class="check-item-top">
              <span class="check-item-title">1. Pre-Test</span>
              <span
                class="check-pill"
                :class="
                  !learnerProgressDetails.preTest?.required
                    ? 'pill-na'
                    : learnerProgressDetails.preTest?.completed
                      ? 'pill-done'
                      : 'pill-pending'
                "
              >
                {{
                  !learnerProgressDetails.preTest?.required
                    ? 'Not Required'
                    : learnerProgressDetails.preTest?.completed
                      ? 'Completed'
                      : 'Incomplete'
                }}
              </span>
            </div>
            <p class="check-item-detail">
              <template v-if="!learnerProgressDetails.preTest?.required">
                No Pre-Test configured for this module.
              </template>
              <template v-else-if="learnerProgressDetails.preTest?.completed">
                Score: {{ learnerProgressDetails.preTest.score }} / {{ learnerProgressDetails.preTest.max }} ({{ learnerProgressDetails.preTest.percentage }}%)
              </template>
              <template v-else>
                Learner has not taken the Pre-Test yet.
              </template>
            </p>
          </div>

          <!-- 2. Module Reading -->
          <div class="activity-check-item" :class="{ 'is-done': learnerProgressDetails.reading?.completed }">
            <div class="check-item-top">
              <span class="check-item-title">2. Read Module</span>
              <span
                class="check-pill"
                :class="
                  learnerProgressDetails.reading?.completed
                    ? 'pill-done'
                    : learnerProgressDetails.reading?.completedPages > 0
                      ? 'pill-progress'
                      : 'pill-pending'
                "
              >
                {{
                  learnerProgressDetails.reading?.completed
                    ? 'Completed'
                    : learnerProgressDetails.reading?.completedPages > 0
                      ? 'In Progress'
                      : 'Incomplete'
                }}
              </span>
            </div>
            <p class="check-item-detail">
              <template v-if="learnerProgressDetails.reading?.totalPages > 0">
                {{ learnerProgressDetails.reading.completedPages }} of {{ learnerProgressDetails.reading.totalPages }} pages read
              </template>
              <template v-else-if="learnerProgressDetails.reading?.completed">
                Reading completed.
              </template>
              <template v-else>
                No module pages read yet.
              </template>
            </p>
          </div>

          <!-- 3. Post-Test -->
          <div class="activity-check-item" :class="{ 'is-done': !learnerProgressDetails.postTest?.required || learnerProgressDetails.postTest?.completed }">
            <div class="check-item-top">
              <span class="check-item-title">3. Post-Test</span>
              <span
                class="check-pill"
                :class="
                  !learnerProgressDetails.postTest?.required
                    ? 'pill-na'
                    : learnerProgressDetails.postTest?.completed
                      ? 'pill-done'
                      : 'pill-pending'
                "
              >
                {{
                  !learnerProgressDetails.postTest?.required
                    ? 'Not Required'
                    : learnerProgressDetails.postTest?.completed
                      ? 'Completed'
                      : 'Incomplete'
                }}
              </span>
            </div>
            <p class="check-item-detail">
              <template v-if="!learnerProgressDetails.postTest?.required">
                No Post-Test configured for this module.
              </template>
              <template v-else-if="learnerProgressDetails.postTest?.completed">
                Score: {{ learnerProgressDetails.postTest.score }} / {{ learnerProgressDetails.postTest.max }} ({{ learnerProgressDetails.postTest.percentage }}%)
              </template>
              <template v-else>
                Learner has not taken the Post-Test yet.
              </template>
            </p>
          </div>

          <!-- 4. Activity Submission -->
          <div class="activity-check-item" :class="{ 'is-done': learnerProgressDetails.activity?.hasSubmission }">
            <div class="check-item-top">
              <span class="check-item-title">4. Activity Submission</span>
              <span
                class="check-pill"
                :class="
                  learnerProgressDetails.activity?.hasSubmission
                    ? 'pill-done'
                    : isOverdueSubmissionMode
                      ? 'pill-missing'
                      : 'pill-pending'
                "
              >
                {{
                  learnerProgressDetails.activity?.hasSubmission
                    ? 'Submitted'
                    : isOverdueSubmissionMode
                      ? 'Missing'
                      : 'Incomplete'
                }}
              </span>
            </div>
            <p class="check-item-detail">
              <template v-if="learnerProgressDetails.activity?.hasSubmission">
                Submitted {{ formatDisplayDate(learnerProgressDetails.activity.submittedAt) }}
              </template>
              <template v-else-if="effectiveSubmissionDeadline">
                No activity output submitted (Deadline: {{ formatDisplayDate(effectiveSubmissionDeadline) }}).
              </template>
              <template v-else>
                No activity output submitted yet.
              </template>
            </p>
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
                <span
                  v-if="hasSubmissionOutput(currentSubmission)"
                  class="files-total-badge"
                >
                  {{ currentSubmissionFiles.length }} {{ currentSubmissionFiles.length === 1 ? 'File' : 'Files' }}
                </span>
              </div>
              <span
                v-if="hasSubmissionOutput(currentSubmission) && (currentSubmission.submittedAt || currentSubmission.dateSubmitted)"
                class="submitted-date-caption"
              >
                Submitted {{ formatDisplayDate(currentSubmission.submittedAt || currentSubmission.dateSubmitted) }}
              </span>
            </div>

            <div v-if="hasSubmissionOutput(currentSubmission) && currentSubmissionFiles.length > 0" class="submitted-activities-body">
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

            <!-- Fallback if learner submission has no files or no activity submitted -->
            <div v-else class="no-artifact-hint empty-submission-box">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <div class="empty-submission-title">
                {{ hasSubmissionOutput(currentSubmission) ? 'No Activity Files Attached' : 'No Activity Submission Found' }}
              </div>
              <p class="empty-submission-desc">
                <template v-if="hasSubmissionOutput(currentSubmission)">
                  No activity files were attached with this submission.
                </template>
                <template v-else-if="isOverdueSubmissionMode && effectiveSubmissionDeadline">
                  This learner has not submitted any activity output for the {{ formatDisplayDate(effectiveSubmissionDeadline) }} deadline.
                </template>
                <template v-else>
                  This learner has not submitted any activity output for this module yet.
                </template>
              </p>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN (40%): Module Assessment Scores & Action Buttons -->
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

            <!-- Action Buttons -->
            <div class="eval-panel-actions">
              <button
                type="button"
                class="btn-modal-cancel"
                @click="closeReviewModal"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn-modal-save"
                :disabled="!hasSubmissionOutput(currentSubmission)"
                :title="!hasSubmissionOutput(currentSubmission) ? 'Cannot create record: no activity submitted yet' : 'Add to Records'"
                @click="hasSubmissionOutput(currentSubmission) && handleAddOrCheckRecords()"
              >
                <span>Add to Records</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
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
                <InstructionsRichEditor
                  v-model="editForm.instructions"
                  placeholder="Enter instructions or directions for this module..."
                />
              </div>

              <!-- Teacher Reading Instructions -->
              <div class="field-item full-width">
                <label class="field-lbl">Teacher Reading Instructions</label>
                <p class="field-helper-text">
                  Provide clear instructions for learners on how to read the module and complete its activities. You may edit or personalize the suggested instructions below.
                </p>
                <textarea
                  v-model="editForm.readingInstructions"
                  rows="3"
                  class="field-textarea-box"
                  placeholder="Instructions for the learner (e.g., Read Sections 1 through 3 before attempting Post-Test activities)..."
                ></textarea>
              </div>

              <!-- ROW 3 — TWO COLUMNS: Target ALS Level * | Learning Strand * -->
              <div class="field-item">
                <label class="field-lbl">Target ALS Level <span class="req">*</span></label>
                <select v-model="editForm.level" class="field-select-box" required>
                  <option v-for="lvl in assignedLevelOptions" :key="lvl" :value="lvl">
                    {{ lvl }}
                  </option>
                </select>
              </div>

              <div class="field-item">
                <label class="field-lbl">Learning Strand <span class="req">*</span></label>
                <select
                  v-model="editForm.learningAreaId"
                  class="field-select-box"
                  required
                  @change="syncEditLearningStrand"
                >
                  <option value="" disabled>Select Learning Strand</option>
                  <option
                    v-for="area in editableLearningAreas"
                    :key="area.id"
                    :value="area.id"
                    :disabled="area.status === 'Inactive' && Number(area.id) !== Number(moduleData?.learningAreaId)"
                  >
                    {{ area.name }}{{ area.status === 'Inactive' ? ' (Inactive)' : '' }}
                  </option>
                </select>
              </div>

              <!-- ROW 4 — TWO COLUMNS: Learning Center * | Learning Strand Code * -->
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
                <label class="field-lbl">Learning Strand Code <span class="req">*</span></label>
                <LockedFieldTooltip message="This field cannot be edited.">
                  <input
                    type="text"
                    :value="displayedEditLearningStrandCode"
                    class="field-input-box is-readonly"
                    readonly
                    title="This field cannot be edited."
                  />
                </LockedFieldTooltip>
              </div>

              <!-- ROW 5 — FULL WIDTH: Assign Module To * -->
              <AssignModuleToDropdown
                v-model:is-all-learners="editForm.isAllLearners"
                v-model:selected-learner-ids="editForm.selectedLearnerIds"
                :eligible-learners="editEligibleLearners"
                :active-level="editForm.level"
                :center-name="editSelectedCenterName"
                label-id="edit-assign-module-label"
              />

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
            </div>

            <!-- EDIT PRE-TEST (Assessment) QUESTIONS -->
            <div class="edit-assessment-block">
              <div class="edit-assessment-header">
                <h3>Pre-Test (Assessment)</h3>
                <p>Add multiple-choice questions to assess learners' prior knowledge before the module. Click the circle beside the correct answer and provide feedback for both correct and incorrect answers.</p>
              </div>

              <div class="assessment-instructions-block">
                <label class="field-lbl" for="edit-pretest-instructions">Instructions</label>
                <textarea
                  id="edit-pretest-instructions"
                  ref="editPreInstructionsRef"
                  v-model="editForm.preTestInstructions"
                  rows="3"
                  class="field-textarea-box assessment-instructions-textarea"
                  placeholder="Enter instructions for the pre-test..."
                  @input="autoExpandEditAssessmentTextarea"
                ></textarea>
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
                        :name="`edit-pretest-correct-${q.uid || q.id || qIdx}`"
                        :value="cIdx"
                        :checked="q.correctAnswer === cIdx"
                        title="Click circle to select as correct answer"
                        @change="selectEditCorrectAnswer(q, cIdx)"
                      />
                      <input
                        :id="`edit-opt-preTest-${q.uid || q.id || qIdx}-${cIdx}`"
                        :ref="(el) => setEditOptionInputRef(`preTest-${q.uid || q.id || qIdx}-${cIdx}`, el)"
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
                    <button type="button" class="gf-add-option-btn" @click="addEditOption(q, 'preTest')">
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

              <!-- Bottom Bar: Total Questions on Left, + Add Question on Right -->
              <div class="gf-questions-bottom-bar">
                <div class="gf-total-questions">
                  Total Questions: <strong>{{ editForm.preTest.length }}</strong>
                </div>
                <button
                  type="button"
                  class="gf-btn-add-question"
                  @click="addEditQuestion('preTest')"
                >
                  + Add Question
                </button>
              </div>
            </div>

            <!-- EDIT POST-TEST QUESTIONS -->
            <div class="edit-assessment-block">
              <div class="edit-assessment-header">
                <div class="edit-assessment-title-bar">
                  <h3>Post-Test</h3>
                  <button
                    type="button"
                    class="btn-duplicate-pretest"
                    :disabled="!hasValidEditPreTestQuestions"
                    :title="!hasValidEditPreTestQuestions ? 'No Pre-Test questions available to duplicate.' : 'Duplicate all questions created in Pre-Test'"
                    @click="handleEditDuplicateClick"
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

              <div class="assessment-instructions-block">
                <label class="field-lbl" for="edit-posttest-instructions">Instructions</label>
                <textarea
                  id="edit-posttest-instructions"
                  ref="editPostInstructionsRef"
                  v-model="editForm.postTestInstructions"
                  rows="3"
                  class="field-textarea-box assessment-instructions-textarea"
                  placeholder="Enter instructions for the post-test..."
                  @input="autoExpandEditAssessmentTextarea"
                ></textarea>
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
                        :name="`edit-posttest-correct-${q.uid || q.id || qIdx}`"
                        :value="cIdx"
                        :checked="q.correctAnswer === cIdx"
                        title="Click circle to select as correct answer"
                        @change="selectEditCorrectAnswer(q, cIdx)"
                      />
                      <input
                        :id="`edit-opt-postTest-${q.uid || q.id || qIdx}-${cIdx}`"
                        :ref="(el) => setEditOptionInputRef(`postTest-${q.uid || q.id || qIdx}-${cIdx}`, el)"
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
                    <button type="button" class="gf-add-option-btn" @click="addEditOption(q, 'postTest')">
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

              <!-- Bottom Bar: Total Questions on Left, + Add Question on Right -->
              <div class="gf-questions-bottom-bar">
                <div class="gf-total-questions">
                  Total Questions: <strong>{{ editForm.postTest.length }}</strong>
                </div>
                <button
                  type="button"
                  class="gf-btn-add-question"
                  @click="addEditQuestion('postTest')"
                >
                  + Add Question
                </button>
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
    </Teleport>

    <!-- ADD LEARNER RECORD MODAL (Opened from Review Learner Activity -> Add to Records) -->
    <AddLearnerRecordModal
      v-model="showAddRecordModal"
      mode="submission"
      :record="submissionRecordForm"
      :fallback-learner-name="currentSubmission?.learnerName || ''"
      :saving="isSavingSubmissionRecord"
      :error-message="submissionRecordError"
      @close="closeAddToRecordsModal"
      @save="saveSubmissionRecordFromReview"
      @clear-error="submissionRecordError = ''"
    />

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

    <!-- ALREADY RECORDED NOTIFICATION MODAL -->
    <Teleport to="body">
      <div
        v-if="showAlreadyRecordedModal"
        class="already-recorded-overlay"
        @click.self="showAlreadyRecordedModal = false"
        @keydown.esc="showAlreadyRecordedModal = false"
        tabindex="-1"
      >
        <div class="already-recorded-card" role="dialog" aria-modal="true" aria-labelledby="already-recorded-title">
          <div class="already-recorded-icon-badge">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2 id="already-recorded-title" class="already-recorded-title">Already Recorded</h2>
          <p class="already-recorded-message">This learner's activity has already been added to Records.</p>

          <div class="already-recorded-actions">
            <button
              type="button"
              class="btn-already-recorded-ok"
              @click="showAlreadyRecordedModal = false"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirmation Dialog: Duplicate from Pre-Test (Edit Module) -->
    <Teleport to="body">
      <div
        v-if="showEditDuplicateConfirmModal"
        class="modal-overlay"
        @click.self="showEditDuplicateConfirmModal = false"
      >
        <div
          class="modal-box duplicate-confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-dup-confirm-title"
        >
          <div class="dup-modal-header">
            <div class="dup-modal-icon-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </div>
            <div class="dup-modal-title-group">
              <h3 id="edit-dup-confirm-title" class="dup-modal-title">Duplicate Pre-Test Questions?</h3>
              <p class="dup-modal-desc">
                This will replace your current Post-Test questions with copies of your Pre-Test questions. Any unsaved Post-Test questions will be removed.
              </p>
            </div>
          </div>
          <div class="dup-modal-actions">
            <button
              type="button"
              class="btn-dup-cancel"
              @click="showEditDuplicateConfirmModal = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-dup-confirm"
              @click="confirmEditDuplicate"
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
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, shallowRef, markRaw, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as pdfjsLib from 'pdfjs-dist';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import InstructionsRichEditor from '../components/InstructionsRichEditor.vue';
import { sanitizeRichText } from '../utils/sanitizeRichText.js';
import { useClcData } from '../composables/useClcData.js';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';
import AssignModuleToDropdown from '../components/AssignModuleToDropdown.vue';
import LockedFieldTooltip from '../components/LockedFieldTooltip.vue';
import AddLearnerRecordModal from '../components/AddLearnerRecordModal.vue';
import { getModule, updateModule, deleteModule } from '../api/modules.js';
import { getLearningAreas } from '../api/learningAreas.js';
import { getAssignedLearners } from '../api/learners.js';
import { getLearningCenters } from '../api/learningCenters.js';
import { getSubmissions, updateSubmission, getLearnerAssessmentScores, getLearnerModuleProgressBreakdown } from '../api/submissions.js';
import { getRecordContext, createRecord } from '../api/records.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const route = useRoute();
const router = useRouter();
const {
  teacherId,
  teacherName,
  assignedCenters,
  assignedLevelOptions,
  activeModuleLevelSlug,
  getCachedModuleLevelSlug,
  setActiveModuleLevel,
} = useTeacherSession();

const loading = ref(true);
const errorMessage = ref('');
const moduleData = ref(null);
const submissions = ref([]);
const activeTab = ref(route.query.tab === 'submissions' ? 'submissions' : 'details');
const showMaterialSection = ref(false);
const showAssessmentSection = ref(false);
const learnerProgressDetails = ref(null);
const loadingProgressDetails = ref(false);

const reportReturnPath = computed(() => {
  const raw = route.query.returnTo;
  if (!raw || typeof raw !== 'string') return '';
  return raw.startsWith('/dashboard/reports') ? raw : '';
});

const isProgressViewMode = computed(() => route.query.view === 'progress');

const effectiveSubmissionDeadline = computed(() => {
  return (
    learnerProgressDetails.value?.deadlineYmd ||
    currentSubmission.value?.dateEnded ||
    moduleData.value?.dateEnded ||
    null
  );
});

const isOverdueSubmissionMode = computed(() => {
  if (route.query.status === 'overdue') return true;
  if (learnerProgressDetails.value?.status === 'Overdue' || learnerProgressDetails.value?.isOverdue) return true;
  return normalizeSubmissionBucket(currentSubmission.value?.status, currentSubmission.value) === 'overdue';
});

const effectiveReviewStatusLabel = computed(() => {
  if (learnerProgressDetails.value?.status) return learnerProgressDetails.value.status;
  return formatProgressStatus(currentSubmission.value?.status, currentSubmission.value);
});

const effectiveReviewStatusClass = computed(() => {
  const lbl = String(effectiveReviewStatusLabel.value || '').trim().toLowerCase();
  if (lbl === 'mastered' || lbl === 'not mastered' || lbl === 'recorded') return 'status-recorded';
  if (lbl === 'overdue') return 'status-overdue';
  if (lbl === 'in progress') return 'status-in-progress';
  if (lbl === 'not started') return 'status-not-started';
  return getStatusClass(currentSubmission.value?.status, currentSubmission.value);
});

function selectModuleTab(tab) {
  activeTab.value = tab;
  if (moduleData.value) {
    setActiveModuleLevel(
      moduleData.value.targetLevel || moduleData.value.level || moduleData.value.programLevel,
      moduleData.value.id || route.params.id || route.params.moduleId
    );
  }
}

// Dynamic back destination according to module's ALS Level
const backToModulesRoute = computed(() => {
  const target = String(moduleData.value?.targetLevel || '').toUpperCase().trim();
  const lvl = String(moduleData.value?.level || moduleData.value?.programLevel || '').toLowerCase().trim();
  if (target === 'JUNIOR' || lvl.includes('junior') || lvl.includes('jhs') || lvl.includes('sec')) {
    return '/dashboard/modules/junior-high';
  }
  if (target === 'ELEMENTARY' || lvl.includes('elem')) {
    return '/dashboard/modules/elementary';
  }
  const modId = route.params.id || route.params.moduleId;
  const cachedSlug = getCachedModuleLevelSlug(modId) || activeModuleLevelSlug.value;
  if (cachedSlug === 'junior-high') {
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
const allLearningAreas = ref([]);

const editableLearningAreas = computed(() => {
  const currentId = Number(moduleData.value?.learningAreaId || 0);
  const list = Array.isArray(allLearningAreas.value) ? allLearningAreas.value : [];
  const visible = list.filter(
    (a) => String(a.status || 'Active').toLowerCase() === 'active' || Number(a.id) === currentId
  );
  if (
    currentId &&
    moduleData.value?.learningArea &&
    !visible.some((a) => Number(a.id) === currentId)
  ) {
    visible.unshift({
      id: currentId,
      code: moduleData.value.learningArea.code || moduleData.value.code || '',
      name: moduleData.value.learningArea.name || moduleData.value.strand || '',
      status: moduleData.value.learningArea.status || 'Inactive',
    });
  }
  return visible;
});

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
    const cFb = q.correctFeedback ? String(q.correctFeedback) : '';
    const iFb = q.incorrectFeedback ? String(q.incorrectFeedback) : '';
    return {
      uid: `eq-${editQuestionUidCounter}-${Date.now()}`,
      id: q.id || null,
      prompt: String(q.questionText || q.prompt || ''),
      choices: choices.length > 0 ? choices : [''],
      optionIds: optionIds.length > 0 ? optionIds : [null],
      correctAnswer,
      correctFeedback: cFb,
      incorrectFeedback: iFb,
      savedCorrectFeedback: cFb,
      savedIncorrectFeedback: iFb,
      showFeedback: false,
      feedbackError: '',
      feedbackSavedMessage: '',
    };
  });
}

const editPreInstructionsRef = ref(null);
const editPostInstructionsRef = ref(null);

function autoExpandEditTextareaEl(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function autoExpandEditAssessmentTextarea(event) {
  autoExpandEditTextareaEl(event?.target);
}

const editForm = reactive({
  title: '',
  instructions: '',
  readingInstructions: '',
  learningAreaId: '',
  strand: '',
  level: 'A&E Elementary',
  learningCenterId: '',
  code: '',
  dateStarted: '',
  dateEnded: '',
  isAllLearners: true,
  selectedLearnerIds: [],
  preTestInstructions: '',
  postTestInstructions: '',
  preTest: [],
  postTest: [],
});

const sanitizedModuleInstructions = computed(() => {
  return sanitizeRichText(moduleData.value?.instructions || moduleData.value?.description || '');
});

function addEditQuestion(targetKey) {
  editErrorMessage.value = '';
  editForm[targetKey].push(createBlankEditQuestion());
}

function removeEditQuestion(targetKey, idx) {
  editErrorMessage.value = '';
  editForm[targetKey].splice(idx, 1);
}

// Template refs map for autofocusing newly created option inputs in edit modal
const editOptionInputRefs = new Map();

function setEditOptionInputRef(key, el) {
  if (el) {
    editOptionInputRefs.set(key, el);
  } else {
    editOptionInputRefs.delete(key);
  }
}

function addEditOption(q, targetKey = 'edit') {
  editErrorMessage.value = '';
  if (!Array.isArray(q.choices)) q.choices = [];
  const newIdx = q.choices.length;
  q.choices.push('');
  if (!Array.isArray(q.optionIds)) q.optionIds = [];
  q.optionIds.push(null);

  if (!q.uid) {
    editQuestionUidCounter += 1;
    q.uid = `eq-${editQuestionUidCounter}-${Date.now()}`;
  }
  const qKey = q.uid || q.id || 'q';
  const targetId = `edit-opt-${targetKey}-${qKey}-${newIdx}`;
  const refKey = `${targetKey}-${qKey}-${newIdx}`;

  nextTick(() => {
    const el = editOptionInputRefs.get(refKey) || document.getElementById(targetId);
    if (el && typeof el.focus === 'function') {
      el.focus();
      if (typeof el.setSelectionRange === 'function') {
        const len = (el.value || '').length;
        el.setSelectionRange(len, len);
      }
    }
  });
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

// --- DUPLICATE PRE-TEST TO POST-TEST (EDIT MODULE) ---
const showEditDuplicateConfirmModal = ref(false);

function isEditQuestionEmpty(q) {
  if (!q) return true;
  const hasPrompt = !!(q.prompt && String(q.prompt).trim());
  const hasChoices = Array.isArray(q.choices) && q.choices.some((c) => c && String(c).trim());
  const hasFeedback = !!(q.correctFeedback?.trim() || q.incorrectFeedback?.trim());
  return !hasPrompt && !hasChoices && !hasFeedback;
}

const hasValidEditPreTestQuestions = computed(() => {
  if (!Array.isArray(editForm.preTest) || editForm.preTest.length === 0) return false;
  return editForm.preTest.some((q) => !isEditQuestionEmpty(q));
});

function hasExistingEditPostTestQuestions() {
  if (!Array.isArray(editForm.postTest) || editForm.postTest.length === 0) {
    return false;
  }
  if (editForm.postTest.length > 1) {
    return true;
  }
  return !isEditQuestionEmpty(editForm.postTest[0]);
}

function duplicateEditPreTestQuestions() {
  if (!Array.isArray(editForm.preTest)) return;
  const sourceQuestions = editForm.preTest.filter((q) => !isEditQuestionEmpty(q));
  if (sourceQuestions.length === 0) return;

  const copied = sourceQuestions.map((q) => {
    editQuestionUidCounter += 1;
    const choices = Array.isArray(q.choices) && q.choices.length > 0 ? [...q.choices] : [''];
    const cFb = q.correctFeedback ? String(q.correctFeedback) : '';
    const iFb = q.incorrectFeedback ? String(q.incorrectFeedback) : '';
    return {
      uid: `eq-${editQuestionUidCounter}-${Date.now()}`,
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

  editForm.postTest = copied;
  editErrorMessage.value = '';
}

function handleEditDuplicateClick() {
  if (!hasValidEditPreTestQuestions.value) return;
  if (hasExistingEditPostTestQuestions()) {
    showEditDuplicateConfirmModal.value = true;
  } else {
    duplicateEditPreTestQuestions();
  }
}

function confirmEditDuplicate() {
  duplicateEditPreTestQuestions();
  showEditDuplicateConfirmModal.value = false;
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
        error: `${label} Question ${qNum}: Please select 1 correct answer by clicking the circle beside the option.`,
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

const displayedEditLearningStrandCode = computed(() => {
  if (!editForm.learningAreaId) return '';
  if (
    moduleData.value &&
    Number(editForm.learningAreaId) === Number(moduleData.value.learningAreaId) &&
    editForm.code
  ) {
    return String(editForm.code).trim();
  }
  const matched = editableLearningAreas.value.find(
    (a) => Number(a.id) === Number(editForm.learningAreaId)
  );
  if (matched) {
    return String(matched.code || '').trim();
  }
  return String(editForm.code || '').trim();
});

function syncEditLearningStrand() {
  if (!editForm.learningAreaId) {
    editForm.strand = '';
    editForm.code = '';
    return;
  }
  const matched = editableLearningAreas.value.find(
    (a) => Number(a.id) === Number(editForm.learningAreaId)
  );
  if (matched) {
    editForm.strand = matched.name || '';
    editForm.code = String(matched.code || '').trim();
  } else {
    editForm.strand = '';
    editForm.code = '';
  }
}

// Watch editForm.learningAreaId to automatically update Learning Strand Name and Learning Strand Code
watch(
  () => editForm.learningAreaId,
  () => {
    if (isInitializingEditModal.value) return;
    syncEditLearningStrand();
  }
);

const editSelectedCenterName = computed(() => {
  if (!editForm.learningCenterId) return 'Selected Center';
  const c = availableLearningCenters.value.find(
    (item) => Number(item.id) === Number(editForm.learningCenterId)
  );
  return c ? c.name : moduleData.value?.learningCenter || 'Selected Center';
});

const editEligibleLearners = computed(() => {
  if (!editForm.level || !editForm.learningCenterId) return [];
  const targetLevelNorm = editForm.level.toLowerCase().trim();
  const selectedCenterId = Number(editForm.learningCenterId);

  return (teacherLearners.value || []).filter((l) => {
    const isActive = (l.status || 'Active').toLowerCase() === 'active';
    if (!isActive) return false;

    const isElem = l.targetLevel === 'ELEMENTARY' || (l.level || '').toLowerCase().includes('elem');
    const isMatchLevel = targetLevelNorm.includes('elem') ? isElem : !isElem;
    if (!isMatchLevel) return false;

    if (l.learningCenterId) {
      if (Number(l.learningCenterId) !== selectedCenterId) return false;
    } else if (l.learningCenter && editSelectedCenterName.value !== 'Selected Center') {
      if (l.learningCenter !== editSelectedCenterName.value) return false;
    }
    return true;
  });
});

const isInitializingEditModal = ref(false);
const hasUserModifiedEditAssignment = ref(false);

function syncEditModalInitialAssignments() {
  if (!moduleData.value) return;
  const eligibleIds = editEligibleLearners.value.map((l) => Number(l.id));
  const validSet = new Set(eligibleIds);
  const rawAssignedIds = Array.isArray(moduleData.value.assignedLearnerIds)
    ? moduleData.value.assignedLearnerIds.map(Number).filter((n) => !isNaN(n))
    : [];
  const savedIsAll = moduleData.value.isAllLearners !== false && rawAssignedIds.length === 0;

  if (savedIsAll) {
    editForm.isAllLearners = eligibleIds.length > 0;
    editForm.selectedLearnerIds = [...eligibleIds];
  } else {
    const filteredIds =
      validSet.size > 0 ? rawAssignedIds.filter((id) => validSet.has(id)) : rawAssignedIds;
    const uniqueIds = [...new Set(filteredIds)];
    editForm.selectedLearnerIds = uniqueIds;
    editForm.isAllLearners = validSet.size > 0 && uniqueIds.length === validSet.size;
  }
}

watch(
  () => [editForm.isAllLearners, editForm.selectedLearnerIds],
  () => {
    if (!showEditModal.value || isInitializingEditModal.value) return;
    hasUserModifiedEditAssignment.value = true;
  },
  { deep: true }
);

watch(
  () => [editForm.learningCenterId, editForm.level],
  () => {
    if (!showEditModal.value || isInitializingEditModal.value) return;
    hasUserModifiedEditAssignment.value = true;
    const validIds = new Set(editEligibleLearners.value.map((l) => Number(l.id)));
    const currentSelected = Array.isArray(editForm.selectedLearnerIds)
      ? editForm.selectedLearnerIds.map(Number)
      : [];
    const filtered = currentSelected.filter((id) => validIds.has(id));
    editForm.selectedLearnerIds = [...new Set(filtered)];
    editForm.isAllLearners = validIds.size > 0 && editForm.selectedLearnerIds.length === validIds.size;
  }
);

async function loadEditPrerequisites(shouldSyncInitial = false) {
  const tid = teacherId.value;
  try {
    const [learnersRes, centersRes, areasRes] = await Promise.allSettled([
      getAssignedLearners(tid ? { teacherId: tid } : {}),
      getLearningCenters(),
      getLearningAreas({ _t: Date.now() }),
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

    if (areasRes.status === 'fulfilled' && Array.isArray(areasRes.value.data)) {
      allLearningAreas.value = areasRes.value.data.map((a) => ({
        ...a,
        id: Number(a.id),
        code: String(a.code || '').trim(),
        name: String(a.name || '').trim(),
      }));
      if (editForm.learningAreaId && !editForm.code) {
        const matched = allLearningAreas.value.find(
          (a) => Number(a.id) === Number(editForm.learningAreaId)
        );
        if (matched) {
          editForm.code = matched.code || '';
          editForm.strand = matched.name || editForm.strand;
        }
      }
    }

    if (shouldSyncInitial && showEditModal.value && !hasUserModifiedEditAssignment.value) {
      syncEditModalInitialAssignments();
    }
  } catch (err) {
    console.warn('Error loading edit prerequisites:', err);
  }
}

function openEditModal() {
  if (!moduleData.value) return;
  isInitializingEditModal.value = true;
  hasUserModifiedEditAssignment.value = false;
  editErrorMessage.value = '';
  editLearnerDropdownOpen.value = false;

  let normLevel = moduleData.value.level || 'A&E Elementary';
  if (normLevel.toLowerCase().includes('elem')) normLevel = 'A&E Elementary';
  else if (normLevel.toLowerCase().includes('jun') || normLevel.toLowerCase().includes('sec')) normLevel = 'A&E Junior High';

  editForm.title = moduleData.value.title || '';
  editForm.instructions = sanitizeRichText(moduleData.value.instructions || moduleData.value.description || '');
  editForm.readingInstructions = moduleData.value.readingInstructions !== undefined
    ? moduleData.value.readingInstructions
    : (moduleData.value.learningNotes !== undefined ? moduleData.value.learningNotes : '');
  editForm.learningAreaId = moduleData.value.learningAreaId ? Number(moduleData.value.learningAreaId) : '';
  editForm.strand = moduleData.value.learningArea?.name || moduleData.value.strand || '';
  editForm.level = normLevel;
  editForm.learningCenterId = moduleData.value.learningCenterId || '';
  editForm.code = String(moduleData.value.code || moduleData.value.learningArea?.code || '').trim();
  editForm.dateStarted = moduleData.value.dateStarted ? String(moduleData.value.dateStarted).split('T')[0] : '';
  editForm.dateEnded = moduleData.value.dateEnded ? String(moduleData.value.dateEnded).split('T')[0] : '';
  syncEditModalInitialAssignments();
  const preAss = (moduleData.value.assessments || []).find((a) => a.type === 'PRE_TEST') || moduleData.value.preTest || null;
  const postAss = (moduleData.value.assessments || []).find((a) => a.type === 'POST_TEST') || moduleData.value.postTest || null;
  editForm.preTestInstructions =
    moduleData.value.preTestInstructions ?? preAss?.instructions ?? preAss?.description ?? '';
  editForm.postTestInstructions =
    moduleData.value.postTestInstructions ?? postAss?.instructions ?? postAss?.description ?? '';
  editForm.preTest = mapExistingQuestionsForEdit(preTestQuestions.value);
  editForm.postTest = mapExistingQuestionsForEdit(postTestQuestions.value);

  showEditModal.value = true;
  nextTick(() => {
    isInitializingEditModal.value = false;
    autoExpandEditTextareaEl(editPreInstructionsRef.value);
    autoExpandEditTextareaEl(editPostInstructionsRef.value);
  });
  loadEditPrerequisites(true);
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
  if (!editForm.learningAreaId) {
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
    editErrorMessage.value = 'No valid Learning Strand Code is configured for the selected Learning Strand.';
    return;
  }
  if (editEligibleLearners.value.length === 0) {
    editErrorMessage.value = 'No active learners are available in the selected Learning Center and ALS Level.';
    return;
  }
  if (!editForm.isAllLearners && (!editForm.selectedLearnerIds || editForm.selectedLearnerIds.length === 0)) {
    editErrorMessage.value = 'Please select at least one learner under "Assign Module To".';
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
      instructions: sanitizeRichText(editForm.instructions),
      readingInstructions: editForm.readingInstructions != null ? editForm.readingInstructions.trim() : '',
      learningNotes: editForm.readingInstructions != null ? editForm.readingInstructions.trim() : '',
      learningAreaId: Number(editForm.learningAreaId),
      strand: editForm.strand,
      level: editForm.level,
      learningCenterId: Number(editForm.learningCenterId),
      code: editForm.code,
      moduleCode: editForm.code,
      dateStarted: editForm.dateStarted,
      dateEnded: editForm.dateEnded,
      isAllLearners: editForm.isAllLearners,
      assignedLearnerIds: editForm.isAllLearners ? [] : editForm.selectedLearnerIds,
      preTestInstructions: editForm.preTestInstructions != null ? editForm.preTestInstructions.trim() : '',
      postTestInstructions: editForm.postTestInstructions != null ? editForm.postTestInstructions.trim() : '',
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
      setActiveModuleLevel(
        moduleData.value.targetLevel || moduleData.value.level || moduleData.value.programLevel,
        moduleData.value.id
      );
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

function hasSubmissionOutput(sub) {
  if (!sub) return false;
  if (sub.hasSubmitted === false) return false;
  if (String(sub.id || '').startsWith('pending_')) return false;
  const s = String(sub.status || '').trim().toLowerCase();
  if (s === 'in progress' || s === 'overdue') return false;
  return Boolean(
    sub.hasSubmitted === true ||
    sub.submittedAt ||
    sub.dateSubmitted ||
    sub.fileUrl ||
    (Array.isArray(sub.files) && sub.files.length > 0)
  );
}

function isDeadlinePassedFrontend(deadlineVal) {
  if (!deadlineVal) return false;
  const trimmed = String(deadlineVal).trim();
  if (!trimmed) return false;
  let deadlineDate = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    deadlineDate = new Date(`${trimmed}T23:59:59.999+08:00`);
  } else {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const ymd = parsed.toISOString().split('T')[0];
      deadlineDate = new Date(`${ymd}T23:59:59.999+08:00`);
    }
  }
  if (!deadlineDate || isNaN(deadlineDate.getTime())) return false;
  return Date.now() > deadlineDate.getTime();
}

// Normalize status into canonical buckets: 'recorded', 'not recorded', 'in progress', 'overdue'
function normalizeSubmissionBucket(status, item = null) {
  if (item && !hasSubmissionOutput(item)) {
    const raw = String(status ?? item.status ?? '').trim().toLowerCase().replace(/_/g, ' ');
    if (raw === 'overdue') return 'overdue';
    if (raw === 'in progress') return 'in progress';
    const deadlineCandidate = item.dateEnded || moduleData.value?.dateEnded || null;
    return isDeadlinePassedFrontend(deadlineCandidate) ? 'overdue' : 'in progress';
  }

  if (item && item.isRecorded === true) {
    return 'recorded';
  }

  const s = String(status || '').trim().toLowerCase().replace(/_/g, ' ');
  if (s === 'recorded') return 'recorded';
  if (s === 'not recorded' || s === 'submitted' || s === 'not evaluated' || s === 'pending') {
    return 'not recorded';
  }
  if (s === 'in progress') return 'in progress';
  if (s === 'overdue') return 'overdue';
  return 'not recorded';
}

// Filtered Submissions (All / Recorded / Not Recorded / In Progress / Overdue)
const filteredSubmissions = computed(() => {
  let list = submissions.value || [];

  if (selectedStatusFilter.value !== 'ALL') {
    const target = selectedStatusFilter.value.toLowerCase();
    list = list.filter((s) => normalizeSubmissionBucket(s.status, s) === target);
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
  return (submissions.value || []).filter((s) => normalizeSubmissionBucket(s.status, s) === target).length;
}

function formatProgressStatus(status, item = null) {
  const bucket = normalizeSubmissionBucket(status, item);
  if (bucket === 'recorded') return 'Recorded';
  if (bucket === 'in progress') return 'In Progress';
  if (bucket === 'overdue') return 'Overdue';
  return 'Not Recorded';
}

function getStatusClass(status, item = null) {
  const bucket = normalizeSubmissionBucket(status, item);
  if (bucket === 'recorded') return 'status-recorded';
  if (bucket === 'in progress') return 'status-in-progress';
  if (bucket === 'overdue') return 'status-overdue';
  return 'status-not-recorded';
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
  if (!sub || !hasSubmissionOutput(sub)) return [];
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
  if ((filteredSubmissions.value || []).length > 0) return filteredSubmissions.value;
  return submissions.value || [];
});

const currentLearnerNavIndex = computed(() => {
  if (!currentSubmission.value) return -1;
  return navigableSubmissions.value.findIndex(
    (s) =>
      String(s.id) === String(currentSubmission.value.id) ||
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
    const itemHasOutput = hasSubmissionOutput(item);
    const itemFiles = itemHasOutput ? getSubmissionFilesList(item) : [];

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...item,
        hasSubmitted: itemHasOutput,
        files: itemFiles,
        fileCount: itemFiles.length,
      });
    } else {
      const existing = grouped.get(key);
      // If existing was a non-submitted placeholder and item has a submission, replace with the submitted row
      if (!existing.hasSubmitted && itemHasOutput) {
        grouped.set(key, {
          ...item,
          hasSubmitted: true,
          files: itemFiles,
          fileCount: itemFiles.length,
        });
        continue;
      }

      if (itemHasOutput) {
        const existingUrls = new Set((existing.files || []).map((f) => f.fileUrl));
        for (const f of itemFiles) {
          if (f.fileUrl && !existingUrls.has(f.fileUrl)) {
            existing.files.push(f);
            existingUrls.add(f.fileUrl);
          }
        }
        existing.fileCount = existing.files.length;
      }

      if (!existing.teacherRemarks && (item.teacherRemarks || item.remarks)) {
        existing.teacherRemarks = item.teacherRemarks || item.remarks;
        existing.remarks = existing.teacherRemarks;
      }
      if (item.isRecorded) {
        existing.isRecorded = true;
        existing.status = 'Recorded';
        if (item.existingRecordId) existing.existingRecordId = item.existingRecordId;
        if (item.evaluationStatus) existing.evaluationStatus = item.evaluationStatus;
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

  const cachedSlug = getCachedModuleLevelSlug(moduleId);
  if (cachedSlug) {
    setActiveModuleLevel(cachedSlug, moduleId);
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await getModule(moduleId);
    if (res.data) {
      moduleData.value = res.data;
      setActiveModuleLevel(
        res.data.targetLevel || res.data.level || res.data.programLevel,
        res.data.id || moduleId
      );
      await fetchSubmissions(moduleId);

      // If route has a submissionId parameter or tab=submissions query, open accordingly
      if (route.query.tab === 'submissions') {
        activeTab.value = 'submissions';
      }
      const routeSubId = route.params.submissionId;
      const routeLearnerId = route.query.learnerId;
      if (routeSubId) {
        activeTab.value = 'submissions';
        let targetSub = submissions.value.find(
          (s) =>
            String(s.id) === String(routeSubId) ||
            Number(s.id) === Number(routeSubId) ||
            (s.learnerId && (String(s.learnerId) === String(routeSubId) || Number(s.learnerId) === Number(routeSubId))) ||
            (routeLearnerId && s.learnerId && Number(s.learnerId) === Number(routeLearnerId))
        );
        if (!targetSub && routeLearnerId) {
          try {
            const pRes = await getLearnerModuleProgressBreakdown(moduleId, routeLearnerId);
            const pData = pRes?.data;
            if (pData?.learner) {
              targetSub = {
                id: routeSubId || `pending_${moduleId}_${pData.learner.id}`,
                submissionId: pData.activity?.submissionId || null,
                hasSubmitted: Boolean(pData.activity?.hasSubmission),
                isRecorded: Boolean(pData.isRecorded),
                moduleId: Number(moduleId),
                moduleTitle: res.data.title || 'Learning Module',
                dateEnded: pData.deadlineYmd || res.data.dateEnded || null,
                learnerId: pData.learner.id,
                learnerName: pData.learner.fullName,
                lrn: pData.learner.lrn || '—',
                programLevel: pData.learner.level || res.data.level,
                status: pData.status || 'In Progress',
                files: [],
                fileCount: 0,
              };
            }
          } catch (err) {
            console.warn('Could not load fallback learner progress breakdown:', err);
          }
        }
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
    const params = { moduleId, includeEligible: '1' };
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
  if (submission.evaluationStatus === 'Not Mastered') {
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
  const subTargetId = submission.id || submission.learnerId;
  if (!options.skipRouteSync && modId && subTargetId) {
    const targetPath = `/dashboard/modules/${modId}/submissions/${subTargetId}`;
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

  // Fetch real database assessment scores & progress breakdown from backend API
  learnerProgressDetails.value = null;
  loadingProgressDetails.value = true;
  try {
    const moduleId = moduleData.value?.id || submission.moduleId;
    const learnerId = submission.learnerId;
    if (moduleId && learnerId) {
      const [scoresRes, progressRes] = await Promise.all([
        getLearnerAssessmentScores(moduleId, learnerId).catch(() => null),
        getLearnerModuleProgressBreakdown(moduleId, learnerId).catch(() => null),
      ]);
      if (scoresRes?.data) {
        if (scoresRes.data.preTestScore !== null && scoresRes.data.preTestScore !== undefined) {
          learnerScores.value.preTestScore = Number(scoresRes.data.preTestScore);
        }
        if (scoresRes.data.preTestTotal) {
          learnerScores.value.preTestTotal = Number(scoresRes.data.preTestTotal);
        }
        if (scoresRes.data.postTestScore !== null && scoresRes.data.postTestScore !== undefined) {
          learnerScores.value.postTestScore = Number(scoresRes.data.postTestScore);
        }
        if (scoresRes.data.postTestTotal) {
          learnerScores.value.postTestTotal = Number(scoresRes.data.postTestTotal);
        }
      }
      if (progressRes?.data) {
        learnerProgressDetails.value = progressRes.data;
        if (progressRes.data.preTest?.score != null && learnerScores.value.preTestScore === null) {
          learnerScores.value.preTestScore = Number(progressRes.data.preTest.score);
          if (progressRes.data.preTest.max) learnerScores.value.preTestTotal = Number(progressRes.data.preTest.max);
        }
        if (progressRes.data.postTest?.score != null && learnerScores.value.postTestScore === null) {
          learnerScores.value.postTestScore = Number(progressRes.data.postTest.score);
          if (progressRes.data.postTest.max) learnerScores.value.postTestTotal = Number(progressRes.data.postTest.max);
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch assessment scores / progress breakdown from API:', err);
  } finally {
    learnerScores.value.loading = false;
    loadingProgressDetails.value = false;
  }

  // Detect whether this specific submission has already been added to Records via the real database
  try {
    const moduleId = moduleData.value?.id || submission.moduleId;
    const learnerId = submission.learnerId;
    const submissionId = submission.id;
    if (learnerId) {
      const recCtxRes = await getRecordContext({ learnerId, moduleId, submissionId });
      const recCtx = recCtxRes?.data;
      if (recCtx?.isRecorded) {
        submission.isRecorded = true;
        submission.status = 'Recorded';
        if (currentSubmission.value) {
          currentSubmission.value.isRecorded = true;
          currentSubmission.value.status = 'Recorded';
          if (recCtx.existingRecordId) {
            currentSubmission.value.existingRecordId = recCtx.existingRecordId;
          }
          if (recCtx.assessment) {
            currentSubmission.value.evaluationStatus = recCtx.assessment;
            reviewForm.status = recCtx.assessment;
          }
          if (recCtx.remarks) {
            currentSubmission.value.teacherRemarks = recCtx.remarks;
            currentSubmission.value.remarks = recCtx.remarks;
            reviewForm.teacherRemarks = recCtx.remarks;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not verify record status from database in openReviewModal:', err);
  }
}

function closeReviewModal() {
  cleanupPdfPreviewDoc();
  showReviewModal.value = false;
  currentSubmission.value = null;
  learnerProgressDetails.value = null;
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
    const nextQuery = { tab: 'submissions' };
    if (reportReturnPath.value) nextQuery.returnTo = reportReturnPath.value;
    router.replace({ path: `/dashboard/modules/${modId}`, query: nextQuery }).catch(() => {});
  }
}

const showAlreadyRecordedModal = ref(false);
const showAddRecordModal = ref(false);
const isSavingSubmissionRecord = ref(false);
const submissionRecordError = ref('');

async function handleAddOrCheckRecords() {
  if (!currentSubmission.value || !hasSubmissionOutput(currentSubmission.value)) return;

  const isAlreadyRec =
    currentSubmission.value.isRecorded === true ||
    normalizeSubmissionBucket(currentSubmission.value.status, currentSubmission.value) === 'recorded' ||
    String(currentSubmission.value.status || '').trim().toLowerCase() === 'recorded';

  if (isAlreadyRec) {
    showAlreadyRecordedModal.value = true;
    return;
  }

  // Double check with real database before opening the record modal
  try {
    const learnerId = currentSubmission.value.learnerId;
    const moduleId = moduleData.value?.id || currentSubmission.value.moduleId;
    const submissionId = currentSubmission.value.id;

    if (learnerId) {
      const res = await getRecordContext({ learnerId, moduleId, submissionId });
      if (res?.data?.isRecorded) {
        currentSubmission.value.isRecorded = true;
        currentSubmission.value.status = 'Recorded';
        if (res.data.existingRecordId) {
          currentSubmission.value.existingRecordId = res.data.existingRecordId;
        }
        showAlreadyRecordedModal.value = true;
        return;
      }
    }
  } catch (err) {
    console.warn('Could not verify record status in handleAddOrCheckRecords:', err);
  }

  await openAddToRecordsModal();
}

const submissionRecordForm = reactive({
  existingRecordId: null,
  submissionId: null,
  learnerId: '',
  learnerName: '',
  lrn: '',
  level: '',
  learningCenter: '',
  learningCenterId: null,
  moduleId: null,
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

function formatToDateInputString(rawDate) {
  if (!rawDate) return '';
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return str.split('T')[0] || '';
  return parsed.toISOString().split('T')[0];
}

async function openAddToRecordsModal() {
  if (!currentSubmission.value || !hasSubmissionOutput(currentSubmission.value)) return;

  const isAlreadyRec =
    currentSubmission.value.isRecorded === true ||
    normalizeSubmissionBucket(currentSubmission.value.status, currentSubmission.value) === 'recorded' ||
    String(currentSubmission.value.status || '').trim().toLowerCase() === 'recorded';

  if (isAlreadyRec) {
    showAlreadyRecordedModal.value = true;
    return;
  }

  submissionRecordError.value = '';
  const sub = currentSubmission.value;
  const mod = moduleData.value || {};
  const learnerId = sub.learnerId;
  const modId = mod.id || sub.moduleId || route.params.id;
  const subId = sub.id;

  const initialActivities =
    sub.otherActivities !== undefined && sub.otherActivities !== ''
      ? String(sub.otherActivities).trim()
      : mod.activitiesRelated
        ? String(mod.activitiesRelated).replace(/\\n/g, '\n').trim()
        : '';

  const initialAssessment =
    sub.evaluationStatus === 'Mastered' || sub.evaluationStatus === 'Not Mastered'
      ? sub.evaluationStatus
      : sub.status === 'Mastered' || sub.status === 'Not Mastered'
        ? sub.status
        : '';
  const initialRemarks = String(sub.teacherRemarks || sub.remarks || sub.feedback || '').trim();

  submissionRecordForm.existingRecordId = sub.existingRecordId || null;
  submissionRecordForm.submissionId = subId || null;
  submissionRecordForm.learnerId = learnerId || '';
  submissionRecordForm.learnerName = sub.learnerName || '';
  submissionRecordForm.lrn = sub.lrn || '';
  submissionRecordForm.level = formatAlsLevelDisplay(sub.programLevel || mod.level);
  submissionRecordForm.learningCenter =
    sub.learningCenter || mod.learningCenter || assignedCenters.value?.[0]?.name || '';
  submissionRecordForm.learningCenterId =
    sub.learningCenterId || mod.learningCenterId || assignedCenters.value?.[0]?.id || null;
  submissionRecordForm.moduleId = modId ? Number(modId) : null;
  submissionRecordForm.moduleTitle = mod.title || sub.moduleTitle || '';
  submissionRecordForm.strandName =
    mod.strand || mod.learningArea?.name || sub.strandName || '';
  submissionRecordForm.dateStarted = formatToDateInputString(
    sub.dateStarted || mod.dateStarted || ''
  );
  submissionRecordForm.dateFinished = formatToDateInputString(
    sub.dateFinished || sub.submittedAt || sub.dateSubmitted || mod.dateEnded || ''
  );
  submissionRecordForm.preTestScore =
    learnerScores.value.preTestScore != null ? learnerScores.value.preTestScore : null;
  submissionRecordForm.preTestTotal =
    learnerScores.value.preTestTotal != null ? learnerScores.value.preTestTotal : 10;
  submissionRecordForm.postTestScore =
    learnerScores.value.postTestScore != null ? learnerScores.value.postTestScore : null;
  submissionRecordForm.postTestTotal =
    learnerScores.value.postTestTotal != null ? learnerScores.value.postTestTotal : 10;
  submissionRecordForm.otherActivities = initialActivities;
  submissionRecordForm.selfAssessment = '';
  submissionRecordForm.assessment = initialAssessment;
  submissionRecordForm.remarks = initialRemarks;

  showAddRecordModal.value = true;

  if (!learnerId) return;

  try {
    const res = await getRecordContext({ learnerId, moduleId: modId, submissionId: subId });
    const ctx = res.data;
    if (ctx) {
      if (ctx.isRecorded) {
        currentSubmission.value.isRecorded = true;
        currentSubmission.value.status = 'Recorded';
        if (ctx.existingRecordId) {
          currentSubmission.value.existingRecordId = ctx.existingRecordId;
        }
        showAddRecordModal.value = false;
        showAlreadyRecordedModal.value = true;
        return;
      }
      submissionRecordForm.existingRecordId =
        ctx.existingRecordId || submissionRecordForm.existingRecordId || null;
      submissionRecordForm.learnerId = ctx.learnerId || learnerId;
      submissionRecordForm.learnerName = ctx.learnerName || submissionRecordForm.learnerName;
      submissionRecordForm.lrn = ctx.lrn || submissionRecordForm.lrn;
      submissionRecordForm.level = ctx.level || submissionRecordForm.level;
      submissionRecordForm.learningCenter =
        ctx.learningCenter || submissionRecordForm.learningCenter;
      submissionRecordForm.learningCenterId =
        ctx.learningCenterId || submissionRecordForm.learningCenterId;
      submissionRecordForm.moduleId = ctx.moduleId || submissionRecordForm.moduleId;
      submissionRecordForm.moduleTitle = ctx.moduleTitle || submissionRecordForm.moduleTitle;
      submissionRecordForm.strandName = ctx.strandName || submissionRecordForm.strandName;
      submissionRecordForm.dateStarted =
        ctx.dateStarted || submissionRecordForm.dateStarted || '';
      submissionRecordForm.dateFinished =
        ctx.dateFinished || submissionRecordForm.dateFinished || '';
      if (ctx.preTestScore !== undefined && ctx.preTestScore !== null) {
        submissionRecordForm.preTestScore = ctx.preTestScore;
      }
      if (ctx.preTestTotal !== undefined && ctx.preTestTotal !== null) {
        submissionRecordForm.preTestTotal = ctx.preTestTotal;
      }
      if (ctx.postTestScore !== undefined && ctx.postTestScore !== null) {
        submissionRecordForm.postTestScore = ctx.postTestScore;
      }
      if (ctx.postTestTotal !== undefined && ctx.postTestTotal !== null) {
        submissionRecordForm.postTestTotal = ctx.postTestTotal;
      }
      if (ctx.otherActivities !== undefined && ctx.otherActivities !== '') {
        submissionRecordForm.otherActivities = ctx.otherActivities;
      }
      if (ctx.assessment === 'Mastered' || ctx.assessment === 'Not Mastered') {
        submissionRecordForm.assessment = ctx.assessment;
      }
      if (ctx.remarks !== undefined && ctx.remarks !== '') {
        submissionRecordForm.remarks = ctx.remarks;
      }
    }
  } catch (err) {
    console.warn('Could not load record context from API:', err);
  }
}

function closeAddToRecordsModal() {
  showAddRecordModal.value = false;
  submissionRecordError.value = '';
}

async function saveSubmissionRecordFromReview() {
  if (!currentSubmission.value) return;
  if (isSavingSubmissionRecord.value) return;

  const isAlreadyRec =
    currentSubmission.value.isRecorded === true ||
    normalizeSubmissionBucket(currentSubmission.value.status, currentSubmission.value) === 'recorded' ||
    String(currentSubmission.value.status || '').trim().toLowerCase() === 'recorded';

  if (isAlreadyRec) {
    showAddRecordModal.value = false;
    showAlreadyRecordedModal.value = true;
    return;
  }

  if (!submissionRecordForm.learnerId || !submissionRecordForm.learnerName) {
    submissionRecordError.value = 'Learner information is missing.';
    return;
  }

  if (!submissionRecordForm.moduleTitle || !String(submissionRecordForm.moduleTitle).trim()) {
    submissionRecordError.value = 'Module information is missing.';
    return;
  }

  if (
    submissionRecordForm.assessment !== 'Mastered' &&
    submissionRecordForm.assessment !== 'Not Mastered'
  ) {
    submissionRecordError.value =
      "Please select the ALS Teacher's Assessment (Mastered or Not Mastered).";
    return;
  }

  isSavingSubmissionRecord.value = true;
  submissionRecordError.value = '';
  reviewSuccessMessage.value = '';
  reviewErrorMessage.value = '';

  const trimmedActivities = submissionRecordForm.otherActivities
    ? String(submissionRecordForm.otherActivities).trim()
    : '';
  const trimmedRemarks = submissionRecordForm.remarks
    ? String(submissionRecordForm.remarks).trim()
    : '';

  const recordPayload = {
    mode: 'submission',
    submissionId: submissionRecordForm.submissionId || currentSubmission.value.id || null,
    teacherId: teacherId.value,
    learnerId: Number(submissionRecordForm.learnerId),
    learnerName: String(submissionRecordForm.learnerName).trim(),
    lrn: submissionRecordForm.lrn || '',
    level: formatAlsLevelDisplay(submissionRecordForm.level),
    learningCenter:
      submissionRecordForm.learningCenter || assignedCenters.value?.[0]?.name || '',
    learningCenterId: submissionRecordForm.learningCenterId || null,
    moduleId: submissionRecordForm.moduleId || moduleData.value?.id || null,
    moduleTitle: String(submissionRecordForm.moduleTitle).trim(),
    strandName: submissionRecordForm.strandName || '',
    dateStarted: submissionRecordForm.dateStarted || '',
    dateFinished: submissionRecordForm.dateFinished || '',
    preTestScore:
      submissionRecordForm.preTestScore != null && submissionRecordForm.preTestScore !== ''
        ? Number(submissionRecordForm.preTestScore)
        : null,
    preTestTotal:
      submissionRecordForm.preTestTotal != null && submissionRecordForm.preTestTotal !== ''
        ? Number(submissionRecordForm.preTestTotal)
        : null,
    postTestScore:
      submissionRecordForm.postTestScore != null && submissionRecordForm.postTestScore !== ''
        ? Number(submissionRecordForm.postTestScore)
        : null,
    postTestTotal:
      submissionRecordForm.postTestTotal != null && submissionRecordForm.postTestTotal !== ''
        ? Number(submissionRecordForm.postTestTotal)
        : null,
    otherActivities: trimmedActivities,
    selfAssessment: '',
    assessment: submissionRecordForm.assessment,
    moduleStatus: submissionRecordForm.assessment,
    dateCompleted: submissionRecordForm.dateFinished || '',
    remarks: trimmedRemarks,
  };

  let savedRes = null;
  try {
    savedRes = await createRecord(recordPayload);
  } catch (err) {
    console.warn('Failed to save learner record:', err);
    if (err?.response?.status === 409 || err?.response?.data?.alreadyRecorded) {
      isSavingSubmissionRecord.value = false;
      showAddRecordModal.value = false;
      if (currentSubmission.value) {
        currentSubmission.value.isRecorded = true;
        currentSubmission.value.status = 'Recorded';
      }
      showAlreadyRecordedModal.value = true;
      return;
    }
    submissionRecordError.value =
      err?.response?.data?.error ||
      err?.message ||
      'Failed to save learner record. Please try again.';
    isSavingSubmissionRecord.value = false;
    return;
  }

  isSavingSubmissionRecord.value = false;
  const savedRecordId =
    savedRes?.data?.id || submissionRecordForm.existingRecordId || null;
  submissionRecordForm.existingRecordId = savedRecordId;

  // Update currentSubmission and submissions list in place so state stays synchronized
  const updatedSub = {
    ...currentSubmission.value,
    existingRecordId: savedRecordId,
    hasSubmitted: true,
    isRecorded: true,
    status: 'Recorded',
    evaluationStatus: submissionRecordForm.assessment,
    otherActivities: trimmedActivities,
    teacherRemarks: trimmedRemarks,
    remarks: trimmedRemarks,
    feedback: trimmedRemarks,
    reviewedAt: new Date().toISOString(),
  };
  currentSubmission.value = updatedSub;

  const subIdx = submissions.value.findIndex(
    (s) =>
      Number(s.id) === Number(updatedSub.id) ||
      (s.learnerId && Number(s.learnerId) === Number(updatedSub.learnerId))
  );
  if (subIdx !== -1) {
    submissions.value[subIdx] = updatedSub;
  }

  // Sync with local CLC store without creating duplicates
  try {
    const centerSlug =
      moduleData.value?.centerSlug ||
      assignedCenters.value?.[0]?.slug ||
      '_standalone-modules';
    const clcData = useClcData(centerSlug);
    if (savedRecordId) {
      clcData.updateRecord(savedRecordId, recordPayload);
    } else {
      clcData.addRecord(recordPayload);
    }
  } catch (clcErr) {
    console.warn('Could not sync to local clcData:', clcErr);
  }

  showAddRecordModal.value = false;
  reviewSuccessMessage.value = 'Learner record saved successfully.';
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
  loadEditPrerequisites();
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
        (s) =>
          String(s.id) === String(newSubId) ||
          Number(s.id) === Number(newSubId) ||
          (s.learnerId && (String(s.learnerId) === String(newSubId) || Number(s.learnerId) === Number(newSubId)))
      );
      if (
        targetSub &&
        (!currentSubmission.value ||
          (String(currentSubmission.value.id) !== String(targetSub.id) &&
            String(currentSubmission.value.learnerId) !== String(targetSub.learnerId)))
      ) {
        openReviewModal(targetSub, { skipRouteSync: true });
      }
    }
  }
);

watch(
  () => route.query.tab,
  (newTab) => {
    if (route.params.submissionId) return;
    if (newTab === 'submissions') {
      activeTab.value = 'submissions';
    } else {
      activeTab.value = 'details';
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem; /* 24px spacing below breadcrumb */
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
}

.back-nav-bar .page-breadcrumbs {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.back-nav-bar .breadcrumbs-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.875rem; /* 14px */
  line-height: 1.4;
  font-family: inherit;
}

.back-nav-bar .breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
}

.back-nav-bar .breadcrumb-link {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: color 0.15s ease;
}

.back-nav-bar .breadcrumb-link:hover {
  color: #2563eb;
}

.back-nav-bar .breadcrumb-separator {
  color: #cbd5e1;
  user-select: none;
  font-size: 0.875rem;
}

.back-nav-bar .breadcrumb-current {
  color: #0f172a;
  font-weight: 600;
  font-size: 0.875rem;
  word-break: break-word;
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
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  color: #475569;
  text-decoration: none;
  height: 2.375rem; /* 38px standard button height */
  padding: 0 1rem;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  transition: all 0.15s ease;
  white-space: nowrap;
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

/* Full-Width Instructions */
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

.rich-instructions-content {
  white-space: normal;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.rich-instructions-content :deep(p) {
  margin: 0 0 0.5rem;
}

.rich-instructions-content :deep(p:last-child) {
  margin-bottom: 0;
}

.rich-instructions-content :deep(ul) {
  margin: 0.35rem 0 0.5rem;
  padding-left: 1.35rem;
  list-style-type: disc;
}

.rich-instructions-content :deep(ol) {
  margin: 0.35rem 0 0.5rem;
  padding-left: 1.35rem;
  list-style-type: decimal;
}

.rich-instructions-content :deep(li) {
  margin-bottom: 0.2rem;
}

.rich-instructions-content :deep(li p) {
  margin: 0;
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

@media (max-width: 992px) {
  .status-filter-pills {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }
}

.filter-pill-btn {
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
  flex-shrink: 0;
}

.filter-pill-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.filter-pill-btn.active {
  background: #2563eb;
  color: #ffffff;
}

.filter-pill-btn .tab-count {
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

.filter-pill-btn.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
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
  min-width: 720px;
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
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 400;
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
  width: 34%;
  min-width: 180px;
  white-space: nowrap;
}

.td-learner-name {
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600 !important;
  color: #0f172a !important;
}

.th-lrn,
.td-lrn {
  width: 20%;
  min-width: 130px;
  white-space: nowrap;
}

.td-lrn {
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 400;
  color: #334155;
}

.th-date,
.td-date {
  width: 20%;
  min-width: 130px;
  white-space: nowrap;
}

.td-date {
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 400;
  color: #334155;
}

.th-status,
.td-status {
  width: 16%;
  min-width: 130px;
  white-space: nowrap;
}

.th-action,
.td-action {
  width: 10%;
  min-width: 80px;
  text-align: center;
  white-space: nowrap;
}

.td-action {
  text-align: center;
  vertical-align: middle;
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

.sub-status-badge.status-recorded,
.sub-status-badge.status-mastered {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}
.sub-status-badge.status-recorded .sub-dot,
.sub-status-badge.status-mastered .sub-dot {
  background: #22c55e;
}

.sub-status-badge.status-not-recorded {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
}
.sub-status-badge.status-not-recorded .sub-dot {
  background: #f97316;
}

.sub-status-badge.status-in-progress,
.sub-status-badge.status-submitted,
.sub-status-badge.status-not-evaluated {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}
.sub-status-badge.status-in-progress .sub-dot,
.sub-status-badge.status-submitted .sub-dot,
.sub-status-badge.status-not-evaluated .sub-dot {
  background: #3b82f6;
}

.sub-status-badge.status-overdue,
.sub-status-badge.status-not-mastered {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.sub-status-badge.status-overdue .sub-dot,
.sub-status-badge.status-not-mastered .sub-dot {
  background: #ef4444;
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

.text-center {
  text-align: center;
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

.btn-action-chevron {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  box-sizing: border-box;
}

.btn-action-chevron:not(.is-disabled):hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #2563eb;
}

.btn-action-chevron:not(.is-disabled):focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 1px;
}

.btn-action-chevron.is-disabled {
  background: #ffffff;
  border-color: #e2e8f0;
  color: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.65;
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
  font-family: inherit;
  font-size: 0.925rem;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.learner-meta-value.strong {
  font-family: inherit;
  font-size: 0.925rem;
  font-weight: 600;
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
  align-items: stretch;
}

.review-left-col,
.review-right-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
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
/* RIGHT COLUMN (40%): SCORES & ACTION BUTTONS                               */
/* ========================================================================= */
.evaluation-sidebar-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
  flex: 1;
  min-height: 100%;
  box-sizing: border-box;
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

/* 4. Action Buttons Footer */
.eval-panel-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  margin-top: auto;
}

.btn-modal-cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
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

  .evaluation-sidebar-card {
    min-height: auto;
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

.field-helper-text {
  font-size: 0.8rem;
  color: #64748b;
  margin: -0.15rem 0 0.45rem 0;
  line-height: 1.4;
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

.instructions-auto-textarea {
  min-height: 150px;
  resize: none;
  overflow-y: hidden;
  overflow-x: hidden;
  overflow-wrap: break-word;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
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

/* Read-only Learning Strand Code Box */
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

.assessment-instructions-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1.15rem;
}

.assessment-instructions-textarea {
  min-height: 82px;
  line-height: 1.5;
  resize: none;
  overflow-y: hidden;
  overflow-x: hidden;
  overflow-wrap: break-word;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.edit-assessment-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.edit-assessment-title-bar h3 {
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
  background: #eff6ff;
}

.gf-option-radio {
  width: 17px;
  height: 17px;
  margin: 0;
  cursor: pointer;
  accent-color: #2563eb;
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
  border-color: #93c5fd;
  background: #ffffff;
}

.gf-correct-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
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
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.gf-add-feedback-btn:hover,
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

/* Already Recorded Modal */
.already-recorded-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.25rem;
  animation: alreadyRecordedFadeIn 0.18s ease-out;
}

@keyframes alreadyRecordedFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.already-recorded-card {
  background: #ffffff;
  border-radius: 18px;
  width: 100%;
  max-width: 440px;
  padding: 2.25rem 2.25rem 2rem;
  box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.05);
  text-align: center;
  box-sizing: border-box;
  animation: alreadyRecordedPop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes alreadyRecordedPop {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(6px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.already-recorded-icon-badge {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background-color: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
}

.already-recorded-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.65rem;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.already-recorded-message {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.55;
  margin: 0 auto 1.75rem;
  max-width: 360px;
}

.already-recorded-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-already-recorded-ok {
  min-width: 120px;
  padding: 0.65rem 2rem;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  box-sizing: border-box;
}

.btn-already-recorded-ok:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.review-nav-left-btns {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.btn-back-report {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.btn-back-report:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1e40af;
}

.review-deadline-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.review-deadline-pill.is-overdue {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.sub-status-badge.status-not-started {
  background: #f1f5f9;
  color: #475569;
}

.activity-progress-breakdown-card {
  margin-bottom: 1.25rem;
  padding: 1.25rem 1.5rem;
}

.breakdown-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.breakdown-subtext {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.activity-checklist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 0.85rem;
}

.activity-check-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.activity-check-item.is-done {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.check-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.check-item-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0f172a;
}

.check-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.check-pill.pill-done {
  background: #dcfce7;
  color: #15803d;
}

.check-pill.pill-progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.check-pill.pill-pending {
  background: #f1f5f9;
  color: #475569;
}

.check-pill.pill-missing {
  background: #fee2e2;
  color: #b91c1c;
}

.check-pill.pill-na {
  background: #f1f5f9;
  color: #64748b;
}

.check-item-detail {
  margin: 0;
  font-size: 0.79rem;
  color: #475569;
  line-height: 1.4;
}

.empty-submission-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.25rem 1.25rem;
  gap: 0.45rem;
}

.empty-submission-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin-top: 0.25rem;
}

.empty-submission-desc {
  margin: 0;
  font-size: 0.84rem;
  color: #64748b;
  max-width: 380px;
  line-height: 1.45;
}
</style>

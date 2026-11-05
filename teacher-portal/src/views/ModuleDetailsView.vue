<template>
  <div class="module-details-page">
    <!-- Top Breadcrumb / Back Navigation -->
    <div class="back-nav-bar">
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
    <div v-else-if="moduleData" class="module-main-container">
      <!-- Header Banner Card -->
      <div class="module-hero-card">
        <div class="hero-header-split">
          <div class="hero-header-main">
            <div class="badge-cluster">
              <span class="badge-status-pill">
                <span class="status-pulse-dot"></span>
                {{ moduleData.status || 'Published' }}
              </span>
              <span v-if="moduleData.code" class="badge-code-pill">{{ moduleData.code }}</span>
              <span class="badge-strand-pill">{{ moduleData.strand }}</span>
              <span class="badge-level-pill">{{ moduleData.level }}</span>
              <span v-if="moduleData.learningCenter" class="badge-clc-pill">{{ moduleData.learningCenter }}</span>
            </div>

            <h1 class="hero-module-title">{{ moduleData.title }}</h1>

            <div class="hero-meta-row">
              <div class="meta-item">
                <span class="meta-label">Created By:</span>
                <span class="meta-value">{{ moduleData.teacherName || 'ALS Facilitator' }}</span>
              </div>
              <span class="meta-divider">&bull;</span>
              <div class="meta-item">
                <span class="meta-label">Published:</span>
                <span class="meta-value">{{ formatDisplayDate(moduleData.createdAt || moduleData.datePublished) }}</span>
              </div>
              <template v-if="moduleData.dateStarted && moduleData.dateEnded">
                <span class="meta-divider">&bull;</span>
                <div class="meta-item">
                  <span class="meta-label">Schedule:</span>
                  <span class="meta-value">{{ formatDisplayDate(moduleData.dateStarted) }} &ndash; {{ formatDisplayDate(moduleData.dateEnded) }}</span>
                </div>
              </template>
            </div>
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
        <!-- 1. General Module Information -->
        <div class="content-section-card">
          <div class="card-section-header">
            <div class="header-icon-circle blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div>
              <h2 class="section-title">Module Information</h2>
              <p class="section-subtitle">Complete curriculum specification and active deployment schedule.</p>
            </div>
          </div>

          <div class="info-grid-3">
            <div class="info-box-item">
              <span class="info-label">Module Title</span>
              <span class="info-value bold">{{ moduleData.title }}</span>
            </div>

            <div class="info-box-item">
              <span class="info-label">Module Code</span>
              <span class="info-value code-pill-text">{{ moduleData.code || '—' }}</span>
            </div>

            <div class="info-box-item">
              <span class="info-label">Learning Strand</span>
              <span class="info-value">{{ moduleData.strand }}</span>
            </div>

            <div class="info-box-item">
              <span class="info-label">Target ALS Level</span>
              <span class="info-value">{{ moduleData.level }}</span>
            </div>

            <div class="info-box-item">
              <span class="info-label">Learning Center</span>
              <span class="info-value">{{ moduleData.learningCenter || '—' }}</span>
            </div>

            <div class="info-box-item">
              <span class="info-label">Date Started</span>
              <span class="info-value">{{ formatDisplayDate(moduleData.dateStarted) }}</span>
            </div>

            <div class="info-box-item">
              <span class="info-label">Date Ended</span>
              <span class="info-value">{{ formatDisplayDate(moduleData.dateEnded) }}</span>
            </div>

            <div class="info-box-item">
              <span class="info-label">Created By</span>
              <span class="info-value">{{ moduleData.teacherName || 'Teacher' }}</span>
            </div>

            <div class="info-box-item">
              <span class="info-label">Date Published</span>
              <span class="info-value">{{ formatDisplayDate(moduleData.createdAt || moduleData.datePublished) }}</span>
            </div>
          </div>

          <!-- Instructions Block -->
          <div class="text-block-container">
            <span class="block-label">Instructions</span>
            <div class="block-content-box">
              <p v-if="moduleData.instructions || moduleData.description" class="prose-text">
                {{ moduleData.instructions || moduleData.description }}
              </p>
              <p v-else class="empty-text-hint">No instructions specified for this module.</p>
            </div>
          </div>

          <!-- Activities Related Block -->
          <div class="text-block-container">
            <span class="block-label">Activities Related</span>
            <div class="block-content-box">
              <p v-if="moduleData.activitiesRelated" class="prose-text">
                {{ moduleData.activitiesRelated }}
              </p>
              <p v-else class="empty-text-hint">No related activities specified for this module.</p>
            </div>
          </div>
        </div>

        <!-- 2. Pre-Test Section Card -->
        <div class="content-section-card">
          <div class="card-section-header">
            <div class="header-icon-circle amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M9 15l2 2 4-4"/>
              </svg>
            </div>
            <div class="title-with-badge">
              <h2 class="section-title">Pre-Test (Diagnostic Evaluation)</h2>
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
                  <span class="choice-alpha-badge">{{ choiceLetters[optIdx] || optIdx + 1 }}</span>
                  <span class="choice-label-text">{{ opt.optionText || opt }}</span>
                  <span v-if="opt.isCorrect" class="correct-tag-indicator">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Correct
                  </span>
                </div>
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

        <!-- 3. Learning Module Material Card -->
        <div class="content-section-card">
          <div class="card-section-header">
            <div class="header-icon-circle green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div>
              <h2 class="section-title">Learning Module Material</h2>
              <p class="section-subtitle">Core lesson documents and instructional materials uploaded for learners.</p>
            </div>
          </div>

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

        <!-- 4. Post-Test Section Card -->
        <div class="content-section-card">
          <div class="card-section-header">
            <div class="header-icon-circle purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="title-with-badge">
              <h2 class="section-title">Post-Test (Mastery Evaluation)</h2>
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
                  <span class="choice-alpha-badge">{{ choiceLetters[optIdx] || optIdx + 1 }}</span>
                  <span class="choice-label-text">{{ opt.optionText || opt }}</span>
                  <span v-if="opt.isCorrect" class="correct-tag-indicator">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Correct
                  </span>
                </div>
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
                  <td class="td-learner-name font-medium text-dark">
                    {{ sub.learnerName }}
                  </td>
                  <td class="td-lrn text-muted font-mono">
                    {{ sub.lrn || '—' }}
                  </td>
                  <td class="td-level">
                    <span class="sub-level-tag">{{ sub.programLevel || moduleData.level }}</span>
                  </td>
                  <td class="td-activity font-medium">
                    {{ sub.activity || sub.title || moduleData.title }}
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
                      title="View"
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

    <!-- Review Modal Dialog -->
    <div
      v-if="showReviewModal && currentSubmission"
      class="review-modal-overlay"
      @click.self="closeReviewModal"
    >
      <div class="review-modal-card">
        <!-- Modal Header -->
        <div class="modal-card-header">
          <div class="modal-title-wrap">
            <h2>Review Learner Activity</h2>
            <p>Inspect the submitted photo, evaluate learning progress, and provide teacher remarks.</p>
          </div>
          <button
            type="button"
            class="modal-close-btn"
            @click="closeReviewModal"
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Modal Body Content -->
        <div class="modal-card-body">
          <!-- Learner Info Bar -->
          <div class="learner-info-ribbon">
            <div class="ribbon-item">
              <span class="ribbon-lbl">Learner</span>
              <span class="ribbon-val">{{ currentSubmission.learnerName }}</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">LRN</span>
              <span class="ribbon-val font-mono">{{ currentSubmission.lrn || '—' }}</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">Level</span>
              <span class="ribbon-val">{{ currentSubmission.programLevel || moduleData?.level }}</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">Submitted Date</span>
              <span class="ribbon-val">{{ formatDisplayDate(currentSubmission.submittedAt || currentSubmission.dateSubmitted) }}</span>
            </div>
          </div>

          <!-- 3. Module Assessment Scores (Clean Two-Column Card Layout) -->
          <div class="assessment-scores-container">
            <div class="scores-heading-row">
              <span class="scores-section-label">MODULE ASSESSMENT SCORES</span>
            </div>
            <div class="scores-two-column-grid">
              <!-- Pre-Test Score Card -->
              <div class="score-stat-card">
                <div class="score-card-header">
                  <span class="score-card-type">PRE-TEST SCORE</span>
                </div>
                <div class="score-card-body">
                  <span
                    v-if="learnerScores.preTestScore !== null && learnerScores.preTestScore !== undefined"
                    class="score-display font-mono"
                  >
                    [ {{ learnerScores.preTestScore }} / {{ learnerScores.preTestTotal || 10 }} ]
                  </span>
                  <span v-else class="score-not-taken">
                    Not Taken
                  </span>
                </div>
              </div>

              <!-- Post-Test Score Card -->
              <div class="score-stat-card">
                <div class="score-card-header">
                  <span class="score-card-type">POST-TEST SCORE</span>
                </div>
                <div class="score-card-body">
                  <span
                    v-if="learnerScores.postTestScore !== null && learnerScores.postTestScore !== undefined"
                    class="score-display font-mono"
                  >
                    [ {{ learnerScores.postTestScore }} / {{ learnerScores.postTestTotal || 10 }} ]
                  </span>
                  <span v-else class="score-not-taken">
                    Not Taken
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Learner Submitted Photo Output -->
          <div class="submitted-artifact-container">
            <div class="artifact-header-row">
              <span class="artifact-label">LEARNER SUBMITTED OUTPUT</span>
            </div>

            <!-- Photo Preview Frame (Clean white/light container, rounded corners, subtle border) -->
            <div v-if="currentSubmission.fileUrl" class="image-viewer-frame">
              <img
                :src="resolveSubmissionImageUrl(currentSubmission.fileUrl)"
                :alt="currentSubmission.fileName || 'Learner Activity Photo'"
                class="submission-img-preview"
              />
            </div>

            <!-- Fallback if no file uploaded -->
            <div v-else class="no-artifact-hint">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>No activity photo attached with this submission.</span>
            </div>

            <!-- Open in New Tab Action Row -->
            <div v-if="currentSubmission.fileUrl" class="preview-action-row">
              <a
                :href="resolveSubmissionImageUrl(currentSubmission.fileUrl)"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-open-external"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                <span>Open in New Tab</span>
              </a>
            </div>

            <!-- File Information Card -->
            <div class="file-info-container">
              <div class="file-info-heading">File Information</div>
              <div class="file-info-list">
                <div class="file-info-row">
                  <span class="file-info-label">File Name:</span>
                  <span class="file-info-value font-mono">{{ currentSubmission.fileName || getFallbackFileName(currentSubmission.fileUrl) }}</span>
                </div>
                <div class="file-info-row">
                  <span class="file-info-label">File Type:</span>
                  <span class="file-info-value">{{ getFileTypeDisplay(currentSubmission.fileUrl, currentSubmission.fileName) }}</span>
                </div>
                <div class="file-info-row">
                  <span class="file-info-label">Submitted Date:</span>
                  <span class="file-info-value">{{ formatDisplayDate(currentSubmission.submittedAt || currentSubmission.dateSubmitted) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Learning Progress Evaluation Form -->
          <div class="evaluation-form-card">
            <h3 class="eval-form-title">Learning Progress Evaluation</h3>
            <p class="eval-form-subtitle">Evaluate whether the learner has demonstrated mastery of the activity competencies.</p>

            <div class="eval-field-group">
              <label class="eval-label">Learning Progress <span class="req">*</span></label>
              <select v-model="reviewForm.status" class="eval-select-input">
                <option value="Mastered">Mastered</option>
                <option value="Not Mastered">Not Mastered</option>
              </select>

              <!-- ALS-Appropriate Meaning Guidance Box -->
              <div
                class="eval-guidance-callout"
                :class="reviewForm.status === 'Mastered' ? 'is-mastered' : 'is-not-mastered'"
              >
                <div v-if="reviewForm.status === 'Mastered'" class="guidance-flex">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <div>
                    <strong>MASTERED:</strong>
                    <span> The learner demonstrated understanding and completed the activity satisfactorily.</span>
                  </div>
                </div>
                <div v-else class="guidance-flex">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div>
                    <strong>NOT MASTERED:</strong>
                    <span> The learner needs additional guidance, practice, or learning support before the competency can be considered mastered.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="eval-field-group">
              <label class="eval-label">Teacher Remarks</label>
              <textarea
                v-model="reviewForm.teacherRemarks"
                rows="4"
                class="eval-textarea-input"
                placeholder="Enter remarks about the learner's understanding and performance..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Modal Actions Footer -->
        <div class="modal-card-footer">
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
                <select v-model="editForm.code" class="field-select-box" required>
                  <option value="" disabled>Select Module Code</option>
                  <option value="LS1">LS1</option>
                  <option value="LS2">LS2</option>
                  <option value="LS3">LS3</option>
                  <option value="LS4">LS4</option>
                  <option value="LS5">LS5</option>
                  <option value="LS6">LS6</option>
                </select>
              </div>

              <!-- ROW 5 — FULL WIDTH: Learners Selection * -->
              <div class="field-item full-width learner-select-field">
                <label class="field-lbl">Learners <span class="req">*</span></label>
                <div class="learner-dropdown-container">
                  <div v-if="editLearnerDropdownOpen" class="dropdown-backdrop" @click="editLearnerDropdownOpen = false"></div>
                  <button
                    type="button"
                    class="field-input-box learner-dropdown-trigger"
                    :class="{ 'dropdown-open': editLearnerDropdownOpen }"
                    @click="editLearnerDropdownOpen = !editLearnerDropdownOpen"
                  >
                    <span class="learner-selection-text">{{ editLearnerSelectionDisplayText }}</span>
                    <svg
                      class="dropdown-chevron"
                      :class="{ 'rotate-180': editLearnerDropdownOpen }"
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
                  <div v-if="editLearnerDropdownOpen" class="learner-dropdown-menu">
                    <!-- All Learners Option -->
                    <label class="learner-option-item all-learners-option">
                      <input
                        type="checkbox"
                        class="learner-checkbox"
                        :checked="editForm.isAllLearners"
                        @change="toggleEditAllLearners"
                      />
                      <div class="learner-option-info">
                        <span class="learner-option-name font-bold">All Learners</span>
                        <span class="learner-option-sub">
                          Send to all assigned {{ editForm.level }} learners
                        </span>
                      </div>
                    </label>

                    <div class="dropdown-divider"></div>

                    <!-- Available Learners List -->
                    <div v-if="editAvailableLearners.length > 0" class="learners-list-scroll">
                      <label
                        v-for="l in editAvailableLearners"
                        :key="l.id"
                        class="learner-option-item"
                      >
                        <input
                          type="checkbox"
                          class="learner-checkbox"
                          :checked="editForm.selectedLearnerIds.includes(l.id)"
                          @change="toggleEditLearner(l.id)"
                        />
                        <div class="learner-option-info">
                          <span class="learner-option-name">{{ l.name }}</span>
                          <span class="learner-option-sub">{{ l.level }} &bull; {{ l.learningCenter }}</span>
                        </div>
                      </label>
                    </div>

                    <div v-else class="learners-empty-notice">
                      <p>No learners assigned under {{ editForm.level }}.</p>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { useClcData } from '../composables/useClcData.js';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';
import { getModule, updateModule, deleteModule } from '../api/modules.js';
import { getAssignedLearners } from '../api/learners.js';
import { getLearningCenters } from '../api/learningCenters.js';
import { getSubmissions, updateSubmission, getLearnerAssessmentScores } from '../api/submissions.js';

const route = useRoute();
const router = useRouter();
const { teacherId, teacherName, assignedCenters } = useTeacherSession();

const loading = ref(true);
const errorMessage = ref('');
const moduleData = ref(null);
const submissions = ref([]);
const activeTab = ref('details');

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
});

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

const editAvailableLearners = computed(() => {
  if (!editForm.level) return [];
  const targetLevelNorm = editForm.level.toLowerCase().trim();

  return teacherLearners.value.filter((l) => {
    const lLevelNorm = (l.level || '').toLowerCase().trim();
    return (
      (targetLevelNorm.includes('elem') && lLevelNorm.includes('elem')) ||
      ((targetLevelNorm.includes('jun') || targetLevelNorm.includes('sec')) && (lLevelNorm.includes('jun') || lLevelNorm.includes('sec')))
    );
  });
});

const editLearnerSelectionDisplayText = computed(() => {
  if (editForm.isAllLearners) {
    return 'All Learners';
  }
  if (!editForm.selectedLearnerIds || editForm.selectedLearnerIds.length === 0) {
    return 'Select recipient learners...';
  }
  const selectedNames = editAvailableLearners.value
    .filter((l) => editForm.selectedLearnerIds.includes(l.id))
    .map((l) => l.name);

  if (selectedNames.length === 0) {
    return `${editForm.selectedLearnerIds.length} learner(s) selected`;
  }
  if (selectedNames.length <= 2) {
    return selectedNames.join(', ');
  }
  return `${selectedNames[0]}, ${selectedNames[1]} (+${selectedNames.length - 2} more)`;
});

function toggleEditAllLearners() {
  editForm.isAllLearners = true;
  editForm.selectedLearnerIds = [];
}

function toggleEditLearner(learnerId) {
  editForm.isAllLearners = false;
  const idx = editForm.selectedLearnerIds.indexOf(learnerId);
  if (idx === -1) {
    editForm.selectedLearnerIds.push(learnerId);
  } else {
    editForm.selectedLearnerIds.splice(idx, 1);
  }
  if (editForm.selectedLearnerIds.length === 0) {
    editForm.isAllLearners = true;
  }
}

watch(() => editForm.level, () => {
  if (!editForm.isAllLearners) {
    const validIds = new Set(editAvailableLearners.value.map((l) => l.id));
    editForm.selectedLearnerIds = editForm.selectedLearnerIds.filter((id) => validIds.has(id));
    if (editForm.selectedLearnerIds.length === 0) {
      editForm.isAllLearners = true;
    }
  }
});

async function loadEditPrerequisites() {
  const tid = teacherId.value;
  try {
    const [learnersRes, centersRes] = await Promise.allSettled([
      getAssignedLearners(tid ? { teacherId: tid } : {}),
      getLearningCenters(),
    ]);

    if (learnersRes.status === 'fulfilled' && Array.isArray(learnersRes.value.data)) {
      teacherLearners.value = learnersRes.value.data.map((l) => ({
        id: l.id,
        name: l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Learner',
        level: l.level === 'ELEMENTARY' ? 'A&E Elementary' : (l.level === 'JUNIOR' || l.level === 'LOWER_SECONDARY' || l.level === 'A&E Junior' || l.level === 'A&E Junior High' ? 'A&E Junior High' : l.level) || 'A&E Elementary',
        learningCenterId: l.learningCenterId,
        learningCenter: l.learningCenter || '',
      }));
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

// Review Modal State
const showReviewModal = ref(false);
const currentSubmission = ref(null);
const isSavingReview = ref(false);
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

// Filtered Submissions (Mastered / Not Mastered)
const filteredSubmissions = computed(() => {
  let list = submissions.value || [];

  if (selectedStatusFilter.value !== 'ALL') {
    const target = selectedStatusFilter.value.toLowerCase();
    list = list.filter((s) => {
      const st = (s.status || '').toLowerCase().replace(/_/g, ' ');
      return st === target;
    });
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
  const target = statusName.toLowerCase();
  return (submissions.value || []).filter((s) => {
    const st = (s.status || '').toLowerCase().replace(/_/g, ' ');
    return st === target;
  }).length;
}

function formatProgressStatus(status) {
  if (!status) return 'Not Evaluated';
  const s = String(status).toLowerCase().replace(/_/g, ' ');
  if (s === 'mastered') return 'Mastered';
  if (s === 'not mastered') return 'Not Mastered';
  return status;
}

function getStatusClass(status) {
  const s = (status || '').toLowerCase().replace(/_/g, ' ');
  if (s === 'mastered') return 'status-mastered';
  if (s === 'not mastered') return 'status-not-mastered';
  return 'status-not-evaluated';
}

function isImageFile(url, fileName) {
  if (!url) return false;
  const name = (fileName || url).toLowerCase();
  return (
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.gif') ||
    url.startsWith('data:image') ||
    url.includes('images.unsplash.com')
  );
}

function getFallbackFileName(url) {
  if (!url) return 'learner_activity.jpg';
  try {
    const parts = url.split('/');
    const last = parts[parts.length - 1];
    return last.split('?')[0] || 'learner_activity.jpg';
  } catch {
    return 'learner_activity.jpg';
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
  return 'JPEG / PNG Photo';
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
      submissions.value = res.data;
    } else {
      submissions.value = [];
    }
  } catch (err) {
    console.warn('Could not load submissions:', err);
    submissions.value = [];
  }
}

// Review Modal Handlers
async function openReviewModal(submission) {
  currentSubmission.value = submission;
  const currentSt = (submission.status || '').toLowerCase().replace(/_/g, ' ');
  if (currentSt === 'not mastered') {
    reviewForm.status = 'Not Mastered';
  } else {
    reviewForm.status = 'Mastered';
  }
  reviewForm.teacherRemarks = submission.teacherRemarks || submission.remarks || submission.feedback || '';

  // Determine default questions total from module data if questions exist
  const preTotal = preTestQuestions.value?.length || 10;
  const postTotal = postTestQuestions.value?.length || 10;

  // Initialize scores from submission if already loaded
  learnerScores.value = {
    preTestScore: submission.preTestScore !== undefined && submission.preTestScore !== null ? Number(submission.preTestScore) : null,
    preTestTotal: submission.preTestTotal || preTotal,
    postTestScore: submission.postTestScore !== undefined && submission.postTestScore !== null ? Number(submission.postTestScore) : null,
    postTestTotal: submission.postTestTotal || postTotal,
    loading: true,
  };

  showReviewModal.value = true;

  // Cross-check local CLC records (match strictly by learner AND module)
  try {
    const targetLearnerId = submission.learnerId ? Number(submission.learnerId) : null;
    const targetLearnerName = (submission.learnerName || '').trim().toLowerCase();
    const targetModuleId = moduleData.value?.id ? Number(moduleData.value.id) : (submission.moduleId ? Number(submission.moduleId) : null);
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
  showReviewModal.value = false;
  currentSubmission.value = null;
  learnerScores.value = {
    preTestScore: null,
    preTestTotal: 10,
    postTestScore: null,
    postTestTotal: 10,
    loading: false,
  };
}

async function saveSubmissionReview() {
  if (!currentSubmission.value) return;

  isSavingReview.value = true;
  try {
    const subId = currentSubmission.value.id;
    const reviewDate = new Date().toISOString();
    const payload = {
      status: reviewForm.status, // 'Mastered' or 'Not Mastered'
      teacherRemarks: reviewForm.teacherRemarks.trim(),
      remarks: reviewForm.teacherRemarks.trim(),
      feedback: reviewForm.teacherRemarks.trim(),
      reviewedAt: reviewDate,
      teacherId: teacherId.value,
      teacherName: teacherName.value,
    };

    const res = await updateSubmission(subId, payload);
    const updated = res.data;

    // Update in local submissions list
    const idx = submissions.value.findIndex((s) => s.id === subId);
    if (idx !== -1) {
      submissions.value[idx] = {
        ...submissions.value[idx],
        ...(updated || {}),
        status: reviewForm.status,
        teacherRemarks: reviewForm.teacherRemarks.trim(),
        remarks: reviewForm.teacherRemarks.trim(),
        feedback: reviewForm.teacherRemarks.trim(),
        reviewedAt: reviewDate,
        reviewerTeacher: teacherName.value,
      };
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
        preTestScore: learnerScores.value.preTestScore != null ? learnerScores.value.preTestScore : (existingRecord?.preTestScore ?? null),
        preTestTotal: learnerScores.value.preTestTotal || existingRecord?.preTestTotal || null,
        postTestScore: learnerScores.value.postTestScore != null ? learnerScores.value.postTestScore : (existingRecord?.postTestScore ?? null),
        postTestTotal: learnerScores.value.postTestTotal || existingRecord?.postTestTotal || null,
        dateCompleted: reviewDate.split('T')[0],
        dateFinished: reviewDate.split('T')[0],
        uploadedOutputs: currentSubmission.value.fileUrl || currentSubmission.value.fileName || '',
        remarks: reviewForm.teacherRemarks.trim(),
      };

      if (existingRecord) {
        updateRecord(existingRecord.id, recordUpdates);
      } else {
        createRecord(recordUpdates);
      }
    } catch (recErr) {
      console.warn('Could not sync to teacher records:', recErr);
    }

    closeReviewModal();
    alert(`Learning progress saved successfully as "${reviewForm.status}"!`);
  } catch (err) {
    console.error('Error saving review:', err);
    alert(err.response?.data?.error || 'Failed to save review. Please try again.');
  } finally {
    isSavingReview.value = false;
  }
}

onMounted(() => {
  fetchModuleDetails();
});

watch(
  () => route.params.id || route.params.moduleId,
  (newId) => {
    if (newId) {
      fetchModuleDetails();
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
  padding: 1.75rem 2rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.hero-header-split {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
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
  margin-top: 0.15rem;
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
  font-size: 1.625rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  margin: 0 0 0.85rem;
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

/* Info Grid */
.info-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.info-box-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  padding: 0.85rem 1rem;
  border-radius: 10px;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.info-value {
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 500;
}

.info-value.bold {
  font-weight: 700;
  color: #0f172a;
}

.code-pill-text {
  font-weight: 700;
  color: #0369a1;
}

/* Text Block Container */
.text-block-container {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 1rem;
}

.block-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.block-content-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.25rem;
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
  padding: 0.55rem 0.85rem;
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
}
.sub-status-badge.status-mastered .sub-dot {
  background: #22c55e;
}

.sub-status-badge.status-not-mastered {
  background: #fef2f2;
  color: #dc2626;
}
.sub-status-badge.status-not-mastered .sub-dot {
  background: #ef4444;
}

.sub-status-badge.status-not-evaluated {
  background: #f1f5f9;
  color: #64748b;
}
.sub-status-badge.status-not-evaluated .sub-dot {
  background: #94a3b8;
}

.remarks-cell {
  max-width: 320px;
}

.remarks-snippet {
  display: -webkit-box;
  -webkit-line-clamp: 2;
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

/* Review Modal */
.review-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  box-sizing: border-box;
}

.review-modal-card {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  background: #ffffff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem 1.75rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-title-wrap h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.modal-title-wrap p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.modal-close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.modal-card-body {
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.learner-info-ribbon {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

@media (max-width: 600px) {
  .learner-info-ribbon {
    grid-template-columns: 1fr 1fr;
  }
}

.ribbon-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ribbon-lbl {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.ribbon-val {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

/* Module Assessment Scores Section */
.assessment-scores-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.scores-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.scores-section-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e3a8a;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.scores-two-column-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

@media (max-width: 540px) {
  .scores-two-column-grid {
    grid-template-columns: 1fr;
  }
}

.score-stat-card {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.85rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.score-stat-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 2px 6px rgba(30, 58, 138, 0.06);
}

.score-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.score-card-type {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.score-card-body {
  display: flex;
  align-items: center;
}

.score-display {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.02em;
}

.score-not-taken {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
}

.submitted-artifact-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.artifact-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.artifact-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.btn-open-external {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
}

.btn-open-external:hover {
  text-decoration: underline;
}

.image-viewer-frame {
  max-height: 420px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.submission-img-preview {
  max-width: 100%;
  max-height: 388px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f5f9;
  display: block;
}

.preview-action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -0.25rem;
  margin-bottom: 0.15rem;
}

/* File Information Card */
.file-info-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.95rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.file-info-heading {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.file-info-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.file-info-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.file-info-label {
  color: #64748b;
  font-weight: 600;
  min-width: 120px;
}

.file-info-value {
  color: #0f172a;
  font-weight: 600;
}

.eval-form-subtitle {
  font-size: 0.825rem;
  color: #64748b;
  margin: 0.15rem 0 0.85rem;
}

.eval-guidance-callout {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.825rem;
  line-height: 1.45;
  margin-top: 0.5rem;
  border: 1px solid transparent;
}

.eval-guidance-callout.is-mastered {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.eval-guidance-callout.is-not-mastered {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.guidance-flex {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}


.no-artifact-hint {
  padding: 1.5rem;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 0.85rem;
}

/* Evaluation Form */
.evaluation-form-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.eval-form-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.eval-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.eval-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
}

.eval-label .req {
  color: #ef4444;
}

.eval-select-input,
.eval-textarea-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.eval-select-input:focus,
.eval-textarea-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.modal-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.75rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn-modal-cancel {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-modal-cancel:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-modal-save {
  background: #2563eb;
  border: 1px solid transparent;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.6rem 1.35rem;
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

.learner-option-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: #0f172a;
}

.learner-option-name.font-bold {
  font-weight: 700;
  color: #1e40af;
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
  max-height: 160px;
}

.learners-empty-notice {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: #94a3b8;
  font-style: italic;
  margin: 0;
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

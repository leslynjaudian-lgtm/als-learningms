<template>
  <div class="page-container announcement-page">
    <!-- Toast Notification Banner -->
    <transition name="toast-slide">
      <div v-if="toastMessage" class="toast-notification" :class="toastType">
        <svg v-if="toastType === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/dashboard">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Announcements</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row announcement-header">
      <div class="page-title-group">
        <h1>Announcements</h1>
        <p>Create and manage announcements for your learners.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openCreateModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Create Announcement</span>
      </button>
    </div>

    <!-- Filter Section -->
    <div class="filter-card announcement-filters">
      <div class="filter-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-search-input"
          placeholder="Search announcements..."
        />
      </div>

      <div class="filter-dropdown-group announcement-filter-group">
        <!-- Learning Center Dropdown (Assigned Centers Only) -->
        <div class="filter-dropdown-item">
          <label class="filter-label">Learning Center</label>
          <select v-model="selectedCenterFilter" class="filter-select select-center">
            <option value="">All</option>
            <option v-for="center in teacherLearningCenters" :key="center.id" :value="center.name">
              {{ center.name }}
            </option>
          </select>
        </div>

        <!-- Audience Dropdown: All Learners + assigned learner names (scoped to selected Learning Center) -->
        <div class="filter-dropdown-item">
          <label class="filter-label">Audience</label>
          <select v-model="selectedAudienceFilter" class="filter-select select-audience">
            <option value="All Learners">All Learners</option>
            <option v-for="learner in audienceFilterLearners" :key="learner.id" :value="String(learner.id)">
              {{ learner.name }}
            </option>
          </select>
        </div>

        <!-- Status Filter Dropdown -->
        <div class="filter-dropdown-item">
          <label class="filter-label">Status</label>
          <select v-model="selectedStatusFilter" class="filter-select select-status">
            <option value="">All</option>
            <option value="Published">Published</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Announcement Table Card -->
    <div class="table-card announcement-table-card">
      <div class="table-wrapper">
        <table class="data-table announcement-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th class="th-title">TITLE</th>
              <th class="th-message">ANNOUNCEMENT</th>
              <th class="th-audience">AUDIENCE</th>
              <th class="th-date">DATE POSTED</th>
              <th class="th-status">STATUS</th>
              <th class="th-actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody v-if="!loading && filteredAnnouncements.length > 0">
            <tr v-for="(item, idx) in filteredAnnouncements" :key="item.id">
              <td class="col-num">{{ idx + 1 }}</td>
              <td class="col-title" style="font-weight: 600;">
                <span class="title-text">{{ item.title }}</span>
                <span v-if="item.isSystem" class="badge" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 0.7rem; font-weight: 700; margin-left: 0.5rem;">Admin</span>
                <span v-else-if="item.learningCenter" class="center-sub">
                  {{ item.learningCenter }}
                  <span v-if="item.programLevel"> • {{ item.programLevel }}</span>
                </span>
              </td>
              <td class="col-message">
                <span class="message-preview">{{ item.message || item.content }}</span>
              </td>
              <td class="col-audience">
                <span v-if="item.isSystem || item.audience === 'All Teachers'" class="audience-badge">
                  All Teachers
                </span>
                <span v-else-if="item.targetLearnerName || item.audienceRaw === 'INDIVIDUAL_LEARNER' || item.audienceRaw === 'SPECIFIC_LEARNER'" class="audience-specific" :title="item.targetLearnerName || item.audience">
                  {{ item.targetLearnerName || item.audience }}
                </span>
                <span v-else class="audience-all">
                  All Learners
                </span>
              </td>
              <td class="col-date">{{ item.datePosted || item.date }}</td>
              <td class="col-status">
                <span
                  v-if="item.statusRaw === 'DRAFT' || item.status === 'Draft'"
                  class="badge badge-draft"
                >
                  Draft
                </span>
                <span
                  v-else-if="item.statusRaw === 'SCHEDULED' || item.status === 'Scheduled'"
                  class="badge badge-scheduled"
                  :title="item.scheduledDate ? `Scheduled: ${item.scheduledDate} ${item.scheduledTime}` : 'Scheduled'"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Scheduled</span>
                </span>
                <span v-else class="badge badge-success">
                  Published
                </span>
              </td>
              <td class="td-actions">
                <div class="cell-actions announcement-actions">
                  <!-- View Icon -->
                  <button
                    type="button"
                    class="btn-icon btn-icon-view"
                    title="View"
                    aria-label="View Announcement"
                    @click="openViewModal(item)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>

                  <!-- Teacher's own announcement actions -->
                  <template v-if="!item.isSystem">
                    <!-- If Draft: Quick Publish Button -->
                    <button
                      v-if="item.statusRaw === 'DRAFT' || item.status === 'Draft'"
                      type="button"
                      class="btn-icon btn-icon-publish"
                      title="Post Now"
                      aria-label="Post Draft Announcement"
                      @click="quickPublishDraft(item)"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>

                    <!-- Edit / Reschedule Icon -->
                    <button
                      type="button"
                      class="btn-icon btn-icon-edit"
                      :title="(item.statusRaw === 'SCHEDULED' || item.status === 'Scheduled') ? 'Reschedule / Edit' : 'Edit'"
                      aria-label="Edit Announcement"
                      @click="openEditModal(item)"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>

                    <!-- Delete / Cancel Icon -->
                    <button
                      type="button"
                      class="btn-icon btn-icon-danger"
                      :title="(item.statusRaw === 'SCHEDULED' || item.status === 'Scheduled') ? 'Cancel Schedule' : 'Delete'"
                      aria-label="Delete Announcement"
                      @click="openDeleteModal(item)"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="empty-state-box">
        <p>Loading announcements...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredAnnouncements.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <h3>No announcements found</h3>
        <p>Announcements will appear here once they are created.</p>
      </div>
    </div>

    <!-- Modal: Create / Edit Announcement -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-announcement">
        <div class="modal-header">
          <h2>{{ editingAnnouncement ? 'Edit Announcement' : 'Create Announcement' }}</h2>
          <button type="button" class="modal-close" @click="closeModal" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form class="modal-form" @submit.prevent="handleSplitMainClick">
          <div class="modal-body-scrollable" ref="modalBodyRef" @scroll="onModalScroll">
            <!-- Modal General Error Alert -->
            <div v-if="formErrors.general" class="modal-form-alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ formErrors.general }}</span>
            </div>

            <!-- Title * -->
            <div class="form-group">
              <label class="form-label" for="announcement-title">Title <span class="required">*</span></label>
              <input
                id="announcement-title"
                v-model="form.title"
                type="text"
                class="form-input"
                :class="{ 'has-error': formErrors.title }"
                placeholder="e.g. CLC Orientation or Module Reminder"
                @input="clearFieldError('title')"
              />
              <span v-if="formErrors.title" class="form-error">{{ formErrors.title }}</span>
            </div>

            <!-- Announcement * -->
            <div class="form-group">
              <label class="form-label" for="announcement-message">Announcement <span class="required">*</span></label>
              <textarea
                id="announcement-message"
                v-model="form.message"
                class="form-input form-textarea"
                :class="{ 'has-error': formErrors.message }"
                rows="4"
                placeholder="Write your announcement here..."
                @input="clearFieldError('message')"
              ></textarea>
              <span v-if="formErrors.message" class="form-error">{{ formErrors.message }}</span>
            </div>

            <!-- Learning Center * -->
            <div class="form-group">
              <label class="form-label" for="announcement-learning-center">Learning Center <span class="required">*</span></label>
              <select
                id="announcement-learning-center"
                v-model="form.learningCenterId"
                class="form-select-full"
                :class="{ 'has-error': formErrors.learningCenter }"
                @change="onLearningCenterChange"
              >
                <option :value="null" disabled>Select Learning Center</option>
                <option v-for="center in teacherLearningCenters" :key="center.id" :value="center.id">
                  {{ center.name }}
                </option>
              </select>
              <span v-if="formErrors.learningCenter" class="form-error">{{ formErrors.learningCenter }}</span>
            </div>

            <!-- ALS Level * (Assigned levels only, specific choice required) -->
            <div class="form-group">
              <label class="form-label" for="announcement-program-level">ALS Level <span class="required">*</span></label>
              <select
                id="announcement-program-level"
                v-model="form.programLevel"
                class="form-select-full"
                :class="{ 'has-error': formErrors.programLevel }"
                @change="onProgramLevelChange"
              >
                <option value="" disabled>Select ALS Level</option>
                <option v-for="level in teacherAvailableProgramLevels" :key="level" :value="level">
                  {{ level }}
                </option>
              </select>
              <span v-if="formErrors.programLevel" class="form-error">{{ formErrors.programLevel }}</span>
            </div>

            <!-- Audience * (Searchable multi-select dropdown with All Learners & individual learner names) -->
            <div class="form-group audience-dropdown-group">
              <label class="form-label" id="audience-field-label">Audience <span class="required">*</span></label>
              
              <!-- Custom Dropdown Trigger -->
              <div
                ref="audienceTriggerRef"
                class="custom-dropdown-trigger"
                :class="{ 'is-open': isAudienceDropdownOpen, 'is-disabled': filteredLearnersForForm.length === 0, 'has-error': formErrors.audience }"
                tabindex="0"
                role="combobox"
                aria-labelledby="audience-field-label"
                aria-haspopup="listbox"
                :aria-expanded="isAudienceDropdownOpen"
                @click="toggleAudienceDropdown"
                @keydown.enter.prevent="toggleAudienceDropdown"
                @keydown.space.prevent="toggleAudienceDropdown"
                @keydown.down.prevent="openAudienceDropdown"
                @keydown.up.prevent="openAudienceDropdown"
              >
                <span class="dropdown-trigger-text" :title="audienceTooltipText">
                  {{ audienceDisplayText }}
                </span>
                <svg
                  class="dropdown-chevron"
                  :class="{ 'is-rotated': isAudienceDropdownOpen }"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <span v-if="formErrors.audience" class="form-error">{{ formErrors.audience }}</span>

              <!-- Helper warning when no learners available in selected center/level -->
              <div v-if="filteredLearnersForForm.length === 0" class="form-field-helper text-amber">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>No active learners currently match the selected Learning Center and ALS Level.</span>
              </div>
            </div>

            <!-- Schedule Publication Section (shown when in Schedule mode or when editing a scheduled announcement) -->
            <div v-if="currentAction === 'schedule' || form.isScheduled" class="schedule-section-card">
              <div class="schedule-section-header">
                <div class="schedule-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Publication Schedule</span>
                </div>
                <button
                  type="button"
                  class="schedule-section-switch"
                  @click="cancelScheduleMode"
                >
                  Switch to Immediate Post
                </button>
              </div>
              <p class="schedule-section-desc">
                This announcement will remain hidden and will be automatically published and delivered to learners at the specified date and time.
              </p>
              <div class="schedule-inputs-grid">
                <div class="form-group mb-0">
                  <label class="form-label">Schedule Date <span class="required">*</span></label>
                  <input
                    v-model="form.scheduleDate"
                    type="date"
                    class="form-input"
                    :min="minScheduleDate"
                    :class="{ 'has-error': formErrors.scheduleDate }"
                    @input="clearFieldError('scheduleDate')"
                  />
                  <span v-if="formErrors.scheduleDate" class="form-error">{{ formErrors.scheduleDate }}</span>
                </div>
                <div class="form-group mb-0">
                  <label class="form-label">Schedule Time <span class="required">*</span></label>
                  <input
                    v-model="form.scheduleTime"
                    type="time"
                    class="form-input"
                    :class="{ 'has-error': formErrors.scheduleTime }"
                    @input="clearFieldError('scheduleTime')"
                  />
                  <span v-if="formErrors.scheduleTime" class="form-error">{{ formErrors.scheduleTime }}</span>
                </div>
              </div>
              <span v-if="formErrors.schedule" class="form-error schedule-error">{{ formErrors.schedule }}</span>
            </div>

            <!-- Date Posted (Date input) -->
            <div class="form-group">
              <label class="form-label" for="announcement-date-posted">Date Posted</label>
              <input
                id="announcement-date-posted"
                v-model="form.datePosted"
                type="date"
                class="form-input"
              />
            </div>
          </div>

          <!-- Fixed Modal Footer with Cancel and Split Button [ Post | ▼ ] -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="submitting">
              Cancel
            </button>

            <!-- Connected Split Button -->
            <div class="split-btn-group" :class="{ 'is-active': hasManualInput, 'is-open': showSplitMenu }">
              <button
                type="button"
                class="btn-split-main"
                :disabled="submitting"
                @click="handleSplitMainClick"
              >
                <svg v-if="submitting" class="spinner-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6"/>
                  <line x1="12" y1="18" x2="12" y2="22"/>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                  <line x1="2" y1="12" x2="6" y2="12"/>
                  <line x1="18" y1="12" x2="22" y2="12"/>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                  <line x1="19.07" y1="4.93" x2="16.24" y2="7.76"/>
                </svg>
                <span>{{ submitButtonLabel }}</span>
              </button>
              <button
                type="button"
                class="btn-split-toggle"
                :aria-expanded="showSplitMenu"
                :disabled="submitting"
                aria-label="More publishing options"
                @click.stop="toggleSplitMenu"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ 'rotate-180': showSplitMenu }">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              <!-- Floating Dropdown Menu (Opens Upward) -->
              <transition name="menu-fade">
                <div v-if="showSplitMenu" class="split-dropdown-menu" @click.stop>
                  <button
                    type="button"
                    class="split-menu-item"
                    :class="{ active: currentAction === 'post' }"
                    @click="chooseAction('post')"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    <div class="split-menu-text">
                      <span class="split-menu-title">Post</span>
                      <span class="split-menu-desc">Share this announcement now.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    class="split-menu-item"
                    :class="{ active: currentAction === 'schedule' }"
                    @click="chooseAction('schedule')"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <div class="split-menu-text">
                      <span class="split-menu-title">Schedule</span>
                      <span class="split-menu-desc">Choose when to post this announcement.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    class="split-menu-item"
                    :class="{ active: currentAction === 'draft' }"
                    @click="chooseAction('draft')"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <div class="split-menu-text">
                      <span class="split-menu-title">Save Draft</span>
                      <span class="split-menu-desc">Save this announcement for later.</span>
                    </div>
                  </button>
                </div>
              </transition>
            </div>
          </div>
        </form>

        <!-- Teleported Audience Dropdown Menu -->
        <Teleport to="body">
          <div
            v-if="isAudienceDropdownOpen"
            class="audience-dropdown-backdrop"
            @click="closeAudienceDropdown"
          ></div>

          <div
            v-if="isAudienceDropdownOpen"
            ref="dropdownMenuRef"
            class="custom-dropdown-menu"
            :class="[`placement-${dropdownPlacement}`]"
            :style="dropdownStyle"
            @click.stop
          >
            <!-- Search Input Header -->
            <div class="dropdown-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref="dropdownSearchInputRef"
                v-model="learnerSearchQuery"
                type="text"
                class="dropdown-search-input"
                placeholder="Search learners by name..."
                @click.stop
                @keydown.esc.stop="closeAudienceDropdown"
              />
              <button
                v-if="learnerSearchQuery"
                type="button"
                class="dropdown-search-clear"
                @click.stop="learnerSearchQuery = ''"
                aria-label="Clear search"
              >
                ×
              </button>
            </div>

            <!-- Dropdown Options List -->
            <div class="dropdown-options-list">
              <!-- All Learners Option (Always First) -->
              <div
                v-if="!learnerSearchQuery || 'all learners'.includes(learnerSearchQuery.toLowerCase())"
                class="dropdown-option-item all-learners-item"
                :class="{ 'is-selected': isAllLearnersSelected }"
                @click.stop="selectAllLearners"
              >
                <div class="custom-checkbox" :class="{ 'is-checked': isAllLearnersSelected }">
                  <svg v-if="isAllLearnersSelected" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span class="option-name">All Learners</span>
                <span class="option-badge">
                  {{ filteredLearnersForForm.length }} {{ filteredLearnersForForm.length === 1 ? 'learner' : 'learners' }}
                </span>
              </div>

              <div v-if="filteredLearnersForForm.length > 0 && (!learnerSearchQuery || 'all learners'.includes(learnerSearchQuery.toLowerCase()))" class="dropdown-divider"></div>

              <!-- Individual Learner Options (Actual Learner Names) -->
              <div
                v-for="learner in searchedLearnersForForm"
                :key="learner.id"
                class="dropdown-option-item"
                :class="{ 'is-selected': isLearnerSelected(learner.id) }"
                @click.stop="toggleLearnerSelection(learner)"
              >
                <div class="custom-checkbox" :class="{ 'is-checked': isLearnerSelected(learner.id) }">
                  <svg v-if="isLearnerSelected(learner.id)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span class="option-name">{{ learner.name }}</span>
              </div>

              <!-- Empty State inside Dropdown -->
              <div v-if="filteredLearnersForForm.length === 0" class="dropdown-empty">
                No active learners found for selected Learning Center and ALS Level.
              </div>
              <div v-else-if="searchedLearnersForForm.length === 0" class="dropdown-empty">
                No learners match "{{ learnerSearchQuery }}".
              </div>
            </div>
          </div>
        </Teleport>
      </div>
    </div>

    <!-- Modal: View Announcement Details -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal modal-details">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Announcement Details</h2>
            <p class="modal-subtitle">Published Notice Information</p>
          </div>
          <button type="button" class="modal-close" @click="showViewModal = false" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body-scrollable">
          <div class="details-grid">
            <div class="detail-item details-full-width">
              <span class="detail-label">Title</span>
              <span class="detail-value detail-value-highlight">{{ viewingAnnouncement?.title }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Target Audience</span>
              <span class="detail-value">
                {{ viewingAnnouncement?.audience }}
                <strong v-if="viewingAnnouncement?.targetLearnerName" style="color: #1d4ed8; display: block;">
                  {{ viewingAnnouncement?.targetLearnerName }}
                </strong>
              </span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Learning Center</span>
              <span class="detail-value">{{ viewingAnnouncement?.learningCenter || defaultCenterName }}</span>
            </div>

            <div v-if="viewingAnnouncement?.programLevel" class="detail-item">
              <span class="detail-label">ALS Level</span>
              <span class="detail-value">{{ viewingAnnouncement?.programLevel }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Date Posted</span>
              <span class="detail-value">{{ viewingAnnouncement?.datePosted || viewingAnnouncement?.date }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span
                  v-if="viewingAnnouncement?.statusRaw === 'DRAFT' || viewingAnnouncement?.status === 'Draft'"
                  class="badge badge-draft"
                >
                  Draft
                </span>
                <span
                  v-else-if="viewingAnnouncement?.statusRaw === 'SCHEDULED' || viewingAnnouncement?.status === 'Scheduled'"
                  class="badge badge-scheduled"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Scheduled</span>
                </span>
                <span v-else class="badge badge-success">
                  Published
                </span>
              </span>
            </div>

            <div v-if="viewingAnnouncement?.scheduledDate || viewingAnnouncement?.scheduledAt" class="detail-item">
              <span class="detail-label">Scheduled For</span>
              <span class="detail-value text-primary font-bold">
                {{ viewingAnnouncement.scheduledDate }} {{ viewingAnnouncement.scheduledTime }}
              </span>
            </div>

            <div class="detail-item details-full-width">
              <span class="detail-label">Announcement</span>
              <p class="detail-value-content">{{ viewingAnnouncement?.message || viewingAnnouncement?.content }}</p>
            </div>
          </div>
        </div>

        <div class="modal-footer-view">
          <button type="button" class="btn btn-secondary" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Modal: Delete Confirmation -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-delete">
        <div class="modal-header">
          <h2>Delete Announcement</h2>
          <button type="button" class="modal-close" @click="closeDeleteModal" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin: 0 0 1rem; color: #475569; font-size: 0.95rem;">
            Are you sure you want to delete announcement
            <strong>"{{ deletingAnnouncement?.title }}"</strong>? This action cannot be undone.
          </p>
          <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
            <button type="button" class="btn btn-secondary" @click="closeDeleteModal">Cancel</button>
            <button type="button" class="btn btn-danger" :disabled="deleting" @click="confirmDeleteAnnouncement">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getTeacherProfile } from '../api/auth.js';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, publishAnnouncement, scheduleAnnouncement } from '../api/announcements.js';
import { getAssignedLearners } from '../api/learners.js';
import { getLearningCenters } from '../api/learningCenters.js';
import { useNotifications } from '../composables/useNotifications.js';

const route = useRoute();
const router = useRouter();
const { currentTeacher, teacherId, teacherName, assignedCenters } = useTeacherSession();
const { markAsRead } = useNotifications();

const announcements = ref([]);
const loading = ref(false);

const searchQuery = ref('');
// 'All Learners' or a learner id (string) chosen from the Audience filter
const selectedAudienceFilter = ref('All Learners');
const selectedCenterFilter = ref('');
const selectedStatusFilter = ref('');

// Split Button and Action States
const showSplitMenu = ref(false);
const currentAction = ref('post'); // 'post' | 'schedule' | 'draft'

// Toast Notification State
const toastMessage = ref('');
const toastType = ref('success');
let toastTimer = null;

function showToast(msg, type = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
}

// Dynamic Assigned Learning Centers for the currently logged-in teacher
const teacherLearningCenters = ref([]);

const defaultCenterName = computed(() => {
  return teacherLearningCenters.value[0]?.name || 'Community Learning Center';
});

// ALS levels assigned to the currently logged-in teacher (never combined option)
const teacherAvailableProgramLevels = computed(() => {
  const spec = (currentTeacher.value?.programLevel || currentTeacher.value?.specialization || 'Both').toLowerCase();
  if (spec.includes('both')) {
    return ['A&E Elementary', 'A&E Junior High'];
  }
  if (spec.includes('elem')) {
    return ['A&E Elementary'];
  }
  if (spec.includes('jun')) {
    return ['A&E Junior High'];
  }
  return ['A&E Elementary', 'A&E Junior High'];
});

// Dynamic Assigned Learners list for the currently logged-in teacher
const assignedLearnersList = ref([]);

async function loadLearners() {
  try {
    const tid = teacherId.value || currentTeacher.value?.id;
    const { data } = await getAssignedLearners(tid ? { teacherId: tid } : {});
    if (Array.isArray(data)) {
      // Filter strictly for learners assigned to this teacher
      const filtered = data.filter((l) => {
        if (!tid) return true;
        if (l.assignedTeacherId) return Number(l.assignedTeacherId) === Number(tid);
        return true;
      });

      assignedLearnersList.value = filtered.map((l) => ({
        id: l.id,
        name: l.name || l.fullName || 'Learner',
        learningCenterId: l.learningCenterId || null,
        learningCenter: l.learningCenter || '',
        assignedTeacherId: l.assignedTeacherId || null,
        level: l.level || '',
        status: l.status || 'Active',
      }));
    } else {
      assignedLearnersList.value = [];
    }
  } catch (err) {
    console.warn('Could not load assigned learners for announcements:', err);
    assignedLearnersList.value = [];
  }
}

async function loadTeacherLearningCenters() {
  try {
    const tid = teacherId.value || currentTeacher.value?.id;
    const [profileRes, allCentersRes] = await Promise.allSettled([
      tid ? getTeacherProfile(tid) : Promise.resolve(null),
      getLearningCenters(),
    ]);

    const allCenters = allCentersRes.status === 'fulfilled' && Array.isArray(allCentersRes.value.data)
      ? allCentersRes.value.data
      : [];

    let centers = [];
    if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
      const data = profileRes.value.data;
      if (Array.isArray(data.learningCenters) && data.learningCenters.length > 0) {
        centers = [...data.learningCenters];
      } else if (data.learningCenterDetails) {
        centers = [data.learningCenterDetails];
      } else if (data.learningCenterId) {
        const found = allCenters.find((c) => c.id === data.learningCenterId);
        if (found) centers = [found];
      }
    }

    // Fallback to session
    if (centers.length === 0 && currentTeacher.value) {
      if (Array.isArray(currentTeacher.value.learningCenters) && currentTeacher.value.learningCenters.length > 0) {
        centers = [...currentTeacher.value.learningCenters];
      } else if (currentTeacher.value.learningCenterDetails) {
        centers = [currentTeacher.value.learningCenterDetails];
      } else if (currentTeacher.value.learningCenterId) {
        const found = allCenters.find((c) => c.id === currentTeacher.value.learningCenterId);
        if (found) centers = [found];
      } else if (assignedCenters.value && assignedCenters.value.length > 0) {
        centers = [...assignedCenters.value];
      }
    }

    // Include centers from teacher's assigned learners if not present
    for (const lrn of assignedLearnersList.value) {
      if (lrn.learningCenterId && !centers.some((c) => c.id === lrn.learningCenterId)) {
        const matched = allCenters.find((c) => c.id === lrn.learningCenterId);
        if (matched) centers.push(matched);
      }
    }

    // Standardize structure
    const mapped = centers.map((c) => {
      const dbMatch = allCenters.find((ac) => ac.id === c.id || ac.name === c.name);
      return {
        id: c.id || dbMatch?.id || 1,
        name: c.name || dbMatch?.name || 'Learning Center',
      };
    });

    // Remove duplicates
    const unique = [];
    const seen = new Set();
    for (const c of mapped) {
      if (!seen.has(c.id) && !seen.has(c.name)) {
        seen.add(c.id);
        seen.add(c.name);
        unique.push(c);
      }
    }

    teacherLearningCenters.value = unique;
  } catch (err) {
    console.error('Error loading teacher learning centers:', err);
    teacherLearningCenters.value = [];
  }
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForInput(dateVal) {
  if (!dateVal) return getTodayString();
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return getTodayString();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const submitting = ref(false);
const deleting = ref(false);

async function loadAnnouncements() {
  loading.value = true;
  try {
    const tid = teacherId.value || currentTeacher.value?.id;
    const { data } = await getAnnouncements({ portal: 'teacher', teacherId: tid });
    if (Array.isArray(data)) {
      announcements.value = data.map((d) => {
        const isAdminAnnouncement =
          d.creatorRole === 'ADMIN' ||
          d.audienceRaw === 'ALL_TEACHERS' ||
          d.audience === 'All Teachers' ||
          (!d.teacherId && (d.createdBy === 'Administrator' || d.author === 'Administrator'));

        const audienceText = d.targetLearnerName || (d.audienceRaw === 'INDIVIDUAL_LEARNER' || d.audienceRaw === 'SPECIFIC_LEARNER' ? (d.targetLearnerName || 'Individual Learner') : (d.audience || 'All Learners'));

        return {
          id: d.id,
          title: d.title,
          message: d.message || d.content,
          content: d.content || d.message,
          audience: audienceText,
          audienceRaw: d.audienceRaw || d.audience,
          targetLearnerId: d.targetLearnerId || null,
          targetLearnerName: d.targetLearnerName || '',
          learningCenterId: d.learningCenterId || null,
          learningCenter: d.learningCenter || (isAdminAnnouncement ? 'System-wide' : ''),
          programLevel: d.programLevel || '',
          datePosted: d.datePosted || d.date || '',
          date: d.datePosted || d.date || '',
          createdAt: d.createdAt,
          status: d.status || 'Published',
          isSystem: isAdminAnnouncement,
          createdBy: d.createdBy || d.author || (isAdminAnnouncement ? 'Administrator' : teacherName.value),
        };
      });
    } else {
      announcements.value = [];
    }
  } catch (err) {
    console.error('Failed to load announcements from backend:', err);
    announcements.value = [];
  } finally {
    loading.value = false;
  }
}

// Learning Center currently chosen in the filter bar (null = All)
const selectedCenterFilterObj = computed(() => {
  if (!selectedCenterFilter.value) return null;
  return teacherLearningCenters.value.find((c) => c.name === selectedCenterFilter.value) || null;
});

function learnerMatchesCenterFilter(learner) {
  const center = selectedCenterFilterObj.value;
  if (!selectedCenterFilter.value) return true;
  if (center && learner.learningCenterId) {
    return Number(learner.learningCenterId) === Number(center.id);
  }
  return learner.learningCenter === selectedCenterFilter.value;
}

// Audience filter options: learners assigned to the logged-in teacher,
// scoped to the selected Learning Center, sorted alphabetically.
const audienceFilterLearners = computed(() => {
  const tid = teacherId.value || currentTeacher.value?.id;
  return assignedLearnersList.value
    .filter((l) => !tid || Number(l.assignedTeacherId) === Number(tid))
    .filter(learnerMatchesCenterFilter)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
});

// Reset Audience to All Learners if the selected learner is no longer in the list
watch(audienceFilterLearners, (list) => {
  if (selectedAudienceFilter.value === 'All Learners') return;
  if (!list.some((l) => String(l.id) === selectedAudienceFilter.value)) {
    selectedAudienceFilter.value = 'All Learners';
  }
});

function learnerLevelMatches(programLevel, learner) {
  if (!programLevel) return true;
  const lLevel = String(learner.level || '').toUpperCase();
  const pLevel = String(programLevel).toUpperCase();
  if (pLevel.includes('ELEM')) return lLevel.includes('ELEM');
  if (pLevel.includes('JUN')) return lLevel.includes('JUN');
  return true;
}

// Mirrors backend learner visibility: an announcement reaches a learner if it targets
// them directly, or it is an All Learners announcement for their center and ALS level.
function announcementReachesLearner(a, learner) {
  if (a.isSystem) return false;
  if (a.targetLearnerId) {
    return Number(a.targetLearnerId) === Number(learner.id);
  }
  const isAllLearners =
    a.audienceRaw === 'ALL_LEARNERS' || a.audienceRaw === 'LEARNERS' || a.audience === 'All Learners';
  if (!isAllLearners) return false;
  const centerOk = !a.learningCenterId || Number(a.learningCenterId) === Number(learner.learningCenterId);
  return centerOk && learnerLevelMatches(a.programLevel, learner);
}

// Filtered Announcements
const filteredAnnouncements = computed(() => {
  const selectedLearner =
    selectedAudienceFilter.value && selectedAudienceFilter.value !== 'All Learners'
      ? assignedLearnersList.value.find((l) => String(l.id) === selectedAudienceFilter.value) || null
      : null;

  return announcements.value.filter((a) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchesQuery =
      !q ||
      a.title?.toLowerCase().includes(q) ||
      a.message?.toLowerCase().includes(q) ||
      a.targetLearnerName?.toLowerCase().includes(q) ||
      a.audience?.toLowerCase().includes(q);

    // All Learners = no learner-specific narrowing; a specific learner = announcements reaching them
    const matchesAudience = selectedLearner ? announcementReachesLearner(a, selectedLearner) : true;

    const matchesCenter =
      !selectedCenterFilter.value || a.learningCenter === selectedCenterFilter.value;

    let matchesStatus = true;
    if (selectedStatusFilter.value) {
      const target = selectedStatusFilter.value.toUpperCase();
      const current = String(a.statusRaw || a.status || '').toUpperCase();
      matchesStatus = current.includes(target);
    }

    return matchesQuery && matchesAudience && matchesCenter && matchesStatus;
  });
});

// Modal State: Create / Edit
const showModal = ref(false);
const editingAnnouncement = ref(null);

const form = reactive({
  title: '',
  message: '',
  learningCenterId: null,
  learningCenter: '',
  programLevel: '',
  datePosted: '',
  scheduleDate: '',
  scheduleTime: '09:00',
  isScheduled: false,
});

const formErrors = reactive({
  title: '',
  message: '',
  learningCenter: '',
  programLevel: '',
  audience: '',
  scheduleDate: '',
  scheduleTime: '',
  schedule: '',
  general: '',
});

function clearFieldError(field) {
  if (formErrors[field]) formErrors[field] = '';
  if (formErrors.general) formErrors.general = '';
}

function clearErrors() {
  Object.keys(formErrors).forEach((key) => {
    formErrors[key] = '';
  });
}

// Requirement: Button is blue when user has typed at least one non-whitespace character in Title or Message
// Auto-populated fields (Date Posted, default Center, default ALS Level) do not count as user input
const hasManualInput = computed(() => {
  const t = (form.title || '').trim();
  const m = (form.message || '').trim();
  return t.length > 0 || m.length > 0;
});

const minScheduleDate = computed(() => getTodayString());

const submitButtonLabel = computed(() => {
  if (submitting.value) {
    if (currentAction.value === 'draft') return 'Saving Draft...';
    if (currentAction.value === 'schedule') return 'Scheduling...';
    return 'Posting...';
  }
  if (editingAnnouncement.value) {
    if (editingAnnouncement.value.statusRaw === 'DRAFT') {
      if (currentAction.value === 'post') return 'Post';
      if (currentAction.value === 'schedule') return 'Schedule';
      return 'Save Draft';
    }
    if (editingAnnouncement.value.statusRaw === 'SCHEDULED') {
      if (currentAction.value === 'post') return 'Post Now';
      return 'Save Changes';
    }
    return 'Save Changes';
  }
  if (currentAction.value === 'schedule') return 'Schedule';
  if (currentAction.value === 'draft') return 'Save Draft';
  return 'Post';
});

function toggleSplitMenu() {
  showSplitMenu.value = !showSplitMenu.value;
}

function closeSplitMenu() {
  showSplitMenu.value = false;
}

function chooseAction(action) {
  currentAction.value = action;
  showSplitMenu.value = false;
  if (action === 'schedule') {
    if (!form.scheduleDate) form.scheduleDate = getTodayString();
    if (!form.scheduleTime) form.scheduleTime = '09:00';
  }
}

function cancelScheduleMode() {
  currentAction.value = 'post';
  form.isScheduled = false;
  formErrors.schedule = '';
  formErrors.scheduleDate = '';
  formErrors.scheduleTime = '';
}

// Dropdown & multi-select state
const isAudienceDropdownOpen = ref(false);
const learnerSearchQuery = ref('');
const isAllLearnersSelected = ref(true);
const selectedLearnerIds = ref([]);

const audienceTriggerRef = ref(null);
const dropdownMenuRef = ref(null);
const dropdownSearchInputRef = ref(null);
const modalBodyRef = ref(null);
const dropdownPlacement = ref('down');
const dropdownStyle = ref({});

function updateDropdownPosition() {
  if (!audienceTriggerRef.value || !isAudienceDropdownOpen.value) return;
  const rect = audienceTriggerRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Space available above and below trigger
  const spaceBelow = viewportHeight - rect.bottom - 12;
  const spaceAbove = rect.top - 12;

  // Auto-detect direction: if space below is less than 220px and space above is greater, open upward
  const preferUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  dropdownPlacement.value = preferUp ? 'up' : 'down';

  const width = Math.min(rect.width, viewportWidth - 24);
  const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12));

  if (preferUp) {
    const maxHeight = Math.min(260, Math.max(120, spaceAbove));
    dropdownStyle.value = {
      position: 'fixed',
      bottom: `${viewportHeight - rect.top + 4}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 10050,
    };
  } else {
    const maxHeight = Math.min(260, Math.max(120, spaceBelow));
    dropdownStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 10050,
    };
  }
}

function openAudienceDropdown() {
  if (filteredLearnersForForm.value.length === 0) return;
  isAudienceDropdownOpen.value = true;
  learnerSearchQuery.value = '';
  nextTick(() => {
    updateDropdownPosition();
    dropdownSearchInputRef.value?.focus();
  });
}

function closeAudienceDropdown() {
  isAudienceDropdownOpen.value = false;
  learnerSearchQuery.value = '';
}

function toggleAudienceDropdown() {
  if (isAudienceDropdownOpen.value) {
    closeAudienceDropdown();
  } else {
    openAudienceDropdown();
  }
}

function onModalScroll() {
  if (isAudienceDropdownOpen.value) {
    if (!audienceTriggerRef.value) {
      closeAudienceDropdown();
      return;
    }
    const rect = audienceTriggerRef.value.getBoundingClientRect();
    if (rect.bottom < 60 || rect.top > window.innerHeight - 60) {
      closeAudienceDropdown();
    } else {
      updateDropdownPosition();
    }
  }
}

function handleGlobalKeydown(e) {
  if (e.key === 'Escape') {
    if (showSplitMenu.value) {
      closeSplitMenu();
      e.preventDefault();
      e.stopPropagation();
    } else if (isAudienceDropdownOpen.value) {
      closeAudienceDropdown();
      e.preventDefault();
      e.stopPropagation();
    } else if (showModal.value && !submitting.value) {
      closeModal();
      e.preventDefault();
    }
  }
}

// Dynamic learner filtering: ONLY active learners matching current teacher + selected Center + selected ALS Level
const filteredLearnersForForm = computed(() => {
  if (!form.learningCenterId || !form.programLevel) return [];

  return assignedLearnersList.value.filter((l) => {
    // 1. Must be active
    const isActive = (l.status || 'Active').toLowerCase() === 'active';
    if (!isActive) return false;

    // 2. Must match selected learning center
    const matchesCenter = Number(l.learningCenterId) === Number(form.learningCenterId);
    if (!matchesCenter) return false;

    // 3. Must match selected ALS level
    const lLevel = (l.level || '').toUpperCase();
    if (form.programLevel === 'A&E Elementary') {
      return lLevel.includes('ELEM');
    }
    if (form.programLevel === 'A&E Junior High') {
      return lLevel.includes('JUN');
    }
    return false;
  });
});

// Search filter inside Audience dropdown
const searchedLearnersForForm = computed(() => {
  const query = learnerSearchQuery.value.trim().toLowerCase();
  if (!query) return filteredLearnersForForm.value;
  return filteredLearnersForForm.value.filter((l) =>
    l.name.toLowerCase().includes(query)
  );
});

// Display text in the closed Audience dropdown field
const audienceDisplayText = computed(() => {
  if (filteredLearnersForForm.value.length === 0) {
    return 'No learners available';
  }
  if (isAllLearnersSelected.value) {
    const count = filteredLearnersForForm.value.length;
    return `All Learners (${count} ${count === 1 ? 'learner' : 'learners'})`;
  }
  if (selectedLearnerIds.value.length === 0) {
    return 'Select learners...';
  }
  if (selectedLearnerIds.value.length === 1) {
    const selected = filteredLearnersForForm.value.find((l) => l.id === selectedLearnerIds.value[0]);
    return selected ? `${selected.name} (1 learner selected)` : '1 learner selected';
  }
  return `${selectedLearnerIds.value.length} learners selected`;
});

const audienceTooltipText = computed(() => {
  if (filteredLearnersForForm.value.length === 0) return 'No active learners available';
  if (isAllLearnersSelected.value) return `All Learners (${filteredLearnersForForm.value.length} active)`;
  if (selectedLearnerIds.value.length === 0) return 'Select learners...';
  return filteredLearnersForForm.value
    .filter((l) => selectedLearnerIds.value.includes(l.id))
    .map((l) => l.name)
    .join(', ');
});

function selectAllLearners() {
  isAllLearnersSelected.value = true;
  selectedLearnerIds.value = [];
}

function toggleLearnerSelection(learner) {
  isAllLearnersSelected.value = false;
  const idx = selectedLearnerIds.value.indexOf(learner.id);
  if (idx === -1) {
    selectedLearnerIds.value.push(learner.id);
  } else {
    selectedLearnerIds.value.splice(idx, 1);
  }

  // If all available individual learners are selected, switch to All Learners
  if (
    filteredLearnersForForm.value.length > 0 &&
    selectedLearnerIds.value.length === filteredLearnersForForm.value.length
  ) {
    isAllLearnersSelected.value = true;
    selectedLearnerIds.value = [];
  }
}

function isLearnerSelected(learnerId) {
  if (isAllLearnersSelected.value) {
    return false;
  }
  return selectedLearnerIds.value.includes(learnerId);
}

function resetForm() {
  editingAnnouncement.value = null;
  form.title = '';
  form.message = '';
  form.scheduleDate = getTodayString();
  form.scheduleTime = '09:00';
  form.isScheduled = false;
  currentAction.value = 'post';
  showSplitMenu.value = false;
  clearErrors();
  isAllLearnersSelected.value = true;
  selectedLearnerIds.value = [];
  learnerSearchQuery.value = '';
  closeAudienceDropdown();

  const defaultCenter = teacherLearningCenters.value[0];
  form.learningCenterId = defaultCenter ? defaultCenter.id : null;
  form.learningCenter = defaultCenter ? defaultCenter.name : '';

  form.programLevel = teacherAvailableProgramLevels.value[0] || 'A&E Elementary';
  form.datePosted = getTodayString();
  if (modalBodyRef.value) {
    modalBodyRef.value.scrollTop = 0;
  }
}

function openCreateModal() {
  resetForm();
  showModal.value = true;
  nextTick(() => {
    if (modalBodyRef.value) {
      modalBodyRef.value.scrollTop = 0;
    }
  });
}

function openEditModal(item) {
  editingAnnouncement.value = item;
  form.title = item.title || '';
  form.message = item.message || item.content || '';
  closeAudienceDropdown();
  clearErrors();
  showSplitMenu.value = false;

  const matchedCenter = teacherLearningCenters.value.find(
    (c) => Number(c.id) === Number(item.learningCenterId) || c.name === item.learningCenter
  ) || teacherLearningCenters.value[0];

  form.learningCenterId = matchedCenter ? matchedCenter.id : (item.learningCenterId || null);
  form.learningCenter = item.learningCenter || (matchedCenter ? matchedCenter.name : '');
  
  if (item.programLevel && teacherAvailableProgramLevels.value.includes(item.programLevel)) {
    form.programLevel = item.programLevel;
  } else {
    form.programLevel = teacherAvailableProgramLevels.value[0] || 'A&E Elementary';
  }

  if (item.targetLearnerId) {
    isAllLearnersSelected.value = false;
    selectedLearnerIds.value = [item.targetLearnerId];
  } else {
    isAllLearnersSelected.value = true;
    selectedLearnerIds.value = [];
  }

  form.datePosted = formatDateForInput(item.createdAt || item.datePosted || item.date);

  const statusRaw = String(item.statusRaw || item.status || '').toUpperCase();
  if (statusRaw === 'SCHEDULED') {
    currentAction.value = 'schedule';
    form.isScheduled = true;
    if (item.scheduledAt) {
      const sDate = new Date(item.scheduledAt);
      if (!isNaN(sDate.getTime())) {
        form.scheduleDate = formatDateForInput(sDate);
        form.scheduleTime = `${String(sDate.getHours()).padStart(2, '0')}:${String(sDate.getMinutes()).padStart(2, '0')}`;
      }
    } else {
      form.scheduleDate = getTodayString();
      form.scheduleTime = '09:00';
    }
  } else if (statusRaw === 'DRAFT') {
    currentAction.value = 'draft';
    form.isScheduled = false;
    form.scheduleDate = getTodayString();
    form.scheduleTime = '09:00';
  } else {
    currentAction.value = 'post';
    form.isScheduled = false;
    form.scheduleDate = getTodayString();
    form.scheduleTime = '09:00';
  }

  showModal.value = true;
  nextTick(() => {
    if (modalBodyRef.value) {
      modalBodyRef.value.scrollTop = 0;
    }
  });
}

function openScheduleFromList(item) {
  openEditModal(item);
  currentAction.value = 'schedule';
  form.isScheduled = true;
}

function closeModal(force = false) {
  if (submitting.value && !force) return;
  showModal.value = false;
  resetForm();
}

function onProgramLevelChange() {
  clearFieldError('programLevel');
  closeAudienceDropdown();
  if (!isAllLearnersSelected.value) {
    selectedLearnerIds.value = selectedLearnerIds.value.filter((id) =>
      filteredLearnersForForm.value.some((l) => l.id === id)
    );
    if (selectedLearnerIds.value.length === 0) {
      isAllLearnersSelected.value = true;
    }
  }
}

function onLearningCenterChange() {
  clearFieldError('learningCenter');
  const selectedCenter = teacherLearningCenters.value.find(
    (c) => Number(c.id) === Number(form.learningCenterId)
  );
  if (selectedCenter) {
    form.learningCenter = selectedCenter.name;
  }
  closeAudienceDropdown();
  if (!isAllLearnersSelected.value) {
    selectedLearnerIds.value = selectedLearnerIds.value.filter((id) =>
      filteredLearnersForForm.value.some((l) => l.id === id)
    );
    if (selectedLearnerIds.value.length === 0) {
      isAllLearnersSelected.value = true;
    }
  }
}

function handleSplitMainClick() {
  if (currentAction.value === 'draft') {
    saveDraft();
  } else if (currentAction.value === 'schedule') {
    submitSchedule();
  } else {
    submitPost();
  }
}

function validateForm(isDraft = false, isSchedule = false) {
  clearErrors();
  let isValid = true;

  if (isDraft) {
    if (!hasManualInput.value) {
      formErrors.general = 'Please enter at least a title or message to save a draft.';
      formErrors.title = 'Title or message required for draft';
      isValid = false;
    }
    return isValid;
  }

  // Mandatory fields for Post and Schedule
  if (!form.title || !form.title.trim()) {
    formErrors.title = 'Title is required.';
    isValid = false;
  }
  if (!form.message || !form.message.trim()) {
    formErrors.message = 'Announcement is required.';
    isValid = false;
  }
  if (!form.learningCenterId) {
    formErrors.learningCenter = 'Please select a Learning Center.';
    isValid = false;
  }
  if (!form.programLevel) {
    formErrors.programLevel = 'Please select an ALS Level.';
    isValid = false;
  }
  if (filteredLearnersForForm.value.length === 0) {
    formErrors.audience = 'No active learners match the selected Learning Center and ALS Level.';
    isValid = false;
  }
  if (!isAllLearnersSelected.value && selectedLearnerIds.value.length === 0) {
    formErrors.audience = 'Please select at least one recipient learner or choose All Learners.';
    isValid = false;
  }

  if (isSchedule) {
    if (!form.scheduleDate) {
      formErrors.scheduleDate = 'Schedule date is required.';
      isValid = false;
    }
    if (!form.scheduleTime) {
      formErrors.scheduleTime = 'Schedule time is required.';
      isValid = false;
    }
    if (form.scheduleDate && form.scheduleTime) {
      const scheduledDateTime = new Date(`${form.scheduleDate}T${form.scheduleTime}`);
      if (isNaN(scheduledDateTime.getTime()) || scheduledDateTime.getTime() <= Date.now()) {
        formErrors.schedule = 'Scheduled date and time must be in the future.';
        isValid = false;
      }
    }
  }

  if (!isValid) {
    formErrors.general = 'Please correct the highlighted errors before proceeding.';
    if (modalBodyRef.value) {
      modalBodyRef.value.scrollTop = 0;
    }
  }

  return isValid;
}

async function executeSave(statusTarget = 'PUBLISHED') {
  const currentTid = teacherId.value || currentTeacher.value?.id || null;
  const selectedCenter = teacherLearningCenters.value.find(
    (c) => Number(c.id) === Number(form.learningCenterId)
  );
  const centerId = selectedCenter ? selectedCenter.id : form.learningCenterId;
  const isIndividual = !isAllLearnersSelected.value && selectedLearnerIds.value.length > 0;

  const payload = {
    title: form.title.trim() || (statusTarget === 'DRAFT' ? 'Untitled Draft' : ''),
    message: form.message.trim(),
    content: form.message.trim(),
    audience: isIndividual ? 'INDIVIDUAL_LEARNER' : 'ALL_LEARNERS',
    learningCenterId: centerId ? Number(centerId) : null,
    programLevel: form.programLevel || (statusTarget === 'DRAFT' ? teacherAvailableProgramLevels.value[0] : null),
    teacherId: currentTid ? Number(currentTid) : null,
    creatorRole: 'TEACHER',
    datePosted: form.datePosted || getTodayString(),
    date: form.datePosted || getTodayString(),
    createdAt: editingAnnouncement.value?.createdAt || new Date().toISOString(),
    status: statusTarget,
  };

  if (statusTarget === 'SCHEDULED') {
    const sAt = new Date(`${form.scheduleDate}T${form.scheduleTime}`);
    payload.scheduledAt = sAt.toISOString();
  }

  submitting.value = true;
  try {
    if (editingAnnouncement.value) {
      if (isIndividual) {
        payload.targetLearnerId = selectedLearnerIds.value[0];
        const selectedLearner = filteredLearnersForForm.value.find(
          (l) => l.id === selectedLearnerIds.value[0]
        );
        payload.targetLearnerName = selectedLearner ? selectedLearner.name : null;
      } else {
        payload.targetLearnerId = null;
        payload.targetLearnerName = null;
      }

      await updateAnnouncement(editingAnnouncement.value.id, payload);
    } else {
      if (isIndividual) {
        if (selectedLearnerIds.value.length === 1) {
          payload.targetLearnerId = selectedLearnerIds.value[0];
          const selectedLearner = filteredLearnersForForm.value.find(
            (l) => l.id === selectedLearnerIds.value[0]
          );
          payload.targetLearnerName = selectedLearner ? selectedLearner.name : null;
          await createAnnouncement(payload);
        } else {
          payload.targetLearnerIds = selectedLearnerIds.value;
          await createAnnouncement(payload);
        }
      } else {
        payload.targetLearnerId = null;
        payload.targetLearnerName = null;
        await createAnnouncement(payload);
      }
    }

    if (statusTarget === 'DRAFT') {
      showToast('Draft saved successfully.');
    } else if (statusTarget === 'SCHEDULED') {
      showToast('Announcement scheduled successfully.');
    } else {
      showToast('Announcement posted successfully.');
    }

    await loadAnnouncements();
    window.dispatchEvent(new Event('als-notifications-updated'));
    submitting.value = false;
    closeModal(true);
  } catch (err) {
    console.error('Failed to save announcement:', err);
    formErrors.general = err.response?.data?.error || 'Failed to save announcement. Please check all required fields.';
    if (modalBodyRef.value) {
      modalBodyRef.value.scrollTop = 0;
    }
  } finally {
    submitting.value = false;
  }
}

function submitPost() {
  if (!validateForm(false, false)) return;
  executeSave('PUBLISHED');
}

function submitSchedule() {
  if (!validateForm(false, true)) return;
  executeSave('SCHEDULED');
}

function saveDraft() {
  if (!validateForm(true, false)) return;
  executeSave('DRAFT');
}

async function quickPublishDraft(item) {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await publishAnnouncement(item.id);
    showToast('Announcement posted successfully.');
    await loadAnnouncements();
    window.dispatchEvent(new Event('als-notifications-updated'));
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to publish announcement.');
  } finally {
    submitting.value = false;
  }
}

// View Details Modal
const showViewModal = ref(false);
const viewingAnnouncement = ref(null);

function openViewModal(item) {
  viewingAnnouncement.value = item;
  showViewModal.value = true;
  if (item?.id) {
    markAsRead(`announcement:${item.id}`);
  }
}

// Delete Confirmation Modal
const showDeleteModal = ref(false);
const deletingAnnouncement = ref(null);

function openDeleteModal(item) {
  deletingAnnouncement.value = item;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  deletingAnnouncement.value = null;
}

async function confirmDeleteAnnouncement() {
  if (!deletingAnnouncement.value) return;
  const targetId = deletingAnnouncement.value.id;
  deleting.value = true;
  try {
    await deleteAnnouncement(targetId);
    announcements.value = announcements.value.filter((a) => a.id !== targetId);
    closeDeleteModal();
  } catch (err) {
    console.error('Failed to delete announcement:', err);
    alert(err.response?.data?.error || 'Failed to delete announcement.');
  } finally {
    deleting.value = false;
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('resize', updateDropdownPosition);
  window.addEventListener('click', closeSplitMenu);
  await loadLearners();
  await loadTeacherLearningCenters();
  await loadAnnouncements();
  if (route.query.action === 'create') {
    openCreateModal();
    router.replace({ path: route.path, query: {} });
  } else if (route.query.view) {
    const targetId = Number(route.query.view);
    const found = announcements.value.find((a) => Number(a.id) === targetId);
    if (found) {
      openViewModal(found);
    }
    router.replace({ path: route.path, query: {} });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  window.removeEventListener('resize', updateDropdownPosition);
  window.removeEventListener('click', closeSplitMenu);
});
</script>

<style scoped>
/* Unified Container Layout */
.announcement-page {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.85rem;
}

.breadcrumb a {
  color: #2563eb;
  text-decoration: none;
  transition: color 0.15s ease;
}

.breadcrumb a:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

.breadcrumb-current {
  color: #0f172a;
  font-weight: 600;
}

/* Page Header */
.announcement-header,
.page-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
}

.page-title-group h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.02em;
}

.page-title-group p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  height: 42px;
  padding: 0 1.25rem;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1;
  white-space: nowrap;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #ffffff;
  color: #475569;
  border-color: #cbd5e1;
}

.btn-secondary:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Filter Card */
.announcement-filters,
.filter-card {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.filter-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  height: 42px;
  padding: 0 0.85rem;
  flex: 1;
  min-width: 260px;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.filter-search-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  background: #ffffff;
}

.filter-search-wrap svg {
  color: #94a3b8;
  flex-shrink: 0;
}

.filter-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.875rem;
  color: #0f172a;
  width: 100%;
  font-family: inherit;
}

.filter-search-input::placeholder {
  color: #94a3b8;
}

.announcement-filter-group,
.filter-dropdown-group {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.filter-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-dropdown-item label,
.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  line-height: normal;
}

.filter-select {
  height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  padding: 0 2.25rem 0 0.85rem;
  font-size: 0.875rem;
  color: #0f172a;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.select-audience {
  min-width: 220px;
  width: 220px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-center {
  min-width: 220px;
  width: 220px;
}

.filter-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Table Card */
.announcement-table-card,
.table-card {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.announcement-table,
.data-table {
  width: 100%;
  min-width: 860px;
  table-layout: fixed;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.data-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  box-sizing: border-box;
}

.data-table td {
  padding: 0.95rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  vertical-align: middle;
  box-sizing: border-box;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: #f8fafc;
}

/* Specific Columns with unified percentages */
.th-num,
.col-num {
  width: 5%;
  text-align: center;
}

.th-title,
.col-title {
  width: 18%;
}

.title-text {
  color: #0f172a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}

.center-sub {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: normal;
  margin-top: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.th-message,
.col-message {
  width: 30%;
}

.message-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
  color: #475569;
  font-size: 0.85rem;
}

.th-audience,
.col-audience {
  width: 17%;
  white-space: nowrap;
}

.audience-all {
  display: inline-block;
  font-weight: 600;
  color: #0f172a;
}

.audience-specific {
  display: inline-block;
  font-weight: 600;
  color: #2563eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.audience-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.775rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.th-date,
.col-date {
  width: 13%;
  white-space: nowrap;
  color: #64748b;
  font-size: 0.85rem;
}

.th-status,
.col-status {
  width: 10%;
  white-space: nowrap;
}

.th-actions,
.td-actions {
  width: 145px;
  min-width: 145px;
  text-align: right;
  white-space: nowrap;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: capitalize;
}

.badge-success {
  background: #dcfce7;
  color: #15803d;
}

/* Action Icons */
.announcement-actions,
.cell-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid var(--color-border, #cbd5e1);
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  box-sizing: border-box;
}

.btn-icon svg {
  width: 15px;
  height: 15px;
  stroke: currentColor;
  stroke-width: 2;
  flex-shrink: 0;
}

.btn-icon-view {
  background: var(--action-view-bg, #EFF6FF) !important;
  color: var(--action-view-color, #4169A8) !important;
  border: 1px solid var(--action-view-border, #DCE7F6) !important;
}

.btn-icon-view:hover {
  background: var(--action-view-hover-bg, #E0EEFE) !important;
  border-color: var(--action-view-hover-border, #B9D3F4) !important;
  color: var(--action-view-hover-color, #315488) !important;
}

.btn-icon-view:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8) !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 3px var(--action-view-focus-ring, rgba(65, 105, 168, 0.35)) !important;
}

.btn-icon-edit {
  background: var(--action-edit-bg, #FFF7E8) !important;
  color: var(--action-edit-color, #946B32) !important;
  border: 1px solid var(--action-edit-border, #F6E6CE) !important;
}

.btn-icon-edit:hover {
  background: var(--action-edit-hover-bg, #FDEFCF) !important;
  border-color: var(--action-edit-hover-border, #EACD9E) !important;
  color: var(--action-edit-hover-color, #7A5422) !important;
}

.btn-icon-edit:focus-visible {
  outline: 2px solid var(--action-edit-color, #946B32) !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 3px var(--action-edit-focus-ring, rgba(148, 107, 50, 0.35)) !important;
}

.btn-icon-danger {
  background: var(--action-delete-bg, #FFF1F1) !important;
  color: var(--action-delete-color, #B65B60) !important;
  border: 1px solid var(--action-delete-border, #F9D6D8) !important;
}

.btn-icon-danger:hover {
  background: var(--action-delete-hover-bg, #FDE4E4) !important;
  border-color: var(--action-delete-hover-border, #F2B8BA) !important;
  color: var(--action-delete-hover-color, #994247) !important;
}

.btn-icon-danger:focus-visible {
  outline: 2px solid var(--action-delete-color, #B65B60) !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 3px var(--action-delete-focus-ring, rgba(182, 91, 96, 0.35)) !important;
}

/* Custom Multi-select Dropdown */
.audience-dropdown-group {
  position: relative;
}

.custom-dropdown-trigger {
  width: 100%;
  height: 42px;
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

.dropdown-trigger-text {
  font-size: 0.9rem;
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

.audience-dropdown-backdrop {
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

.form-field-helper {
  font-size: 0.78rem;
  margin-top: 0.35rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  line-height: 1.35;
}

.form-field-helper.text-amber {
  color: #b45309;
}

.spinner-inline {
  animation: spin 1s linear infinite;
  display: inline-block;
  vertical-align: middle;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state-box {
  padding: 3.5rem 2rem;
  text-align: center;
  color: #64748b;
}

.empty-state-graphic {
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.empty-state-box h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.empty-state-box p {
  font-size: 0.88rem;
  color: #64748b;
  margin: 0;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  overflow: hidden;
}

.modal {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
  max-height: min(90vh, 740px);
}

.modal-announcement {
  max-width: 560px;
}

.modal-details {
  max-width: 620px;
}

.modal-delete {
  max-width: 440px;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  flex-shrink: 0;
}

.modal-header h2,
.modal-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal-subtitle {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0.2rem 0 0 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.modal-form {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body-scrollable {
  padding: 1.5rem;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.modal-footer {
  flex-shrink: 0;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-footer-view {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* Forms */
.form-group {
  margin-bottom: 1.15rem;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  height: 42px;
  padding: 0.55rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

textarea.form-input,
.form-textarea {
  height: auto;
  min-height: 96px;
  resize: vertical;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-select-full {
  width: 100%;
  height: 42px;
  padding: 0 2rem 0 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  background: #ffffff;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-select-full:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 1.5rem;
}

.details-full-width {
  grid-column: 1 / -1;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.detail-value {
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 500;
}

.detail-value-highlight {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.detail-value-content {
  font-size: 0.92rem;
  color: #334155;
  line-height: 1.55;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin: 0;
  white-space: pre-wrap;
}

@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.75rem;
  }
  
  .modal {
    max-height: calc(100vh - 1.5rem);
    border-radius: 12px;
  }
  
  .modal-header {
    padding: 1rem 1.25rem;
  }
  
  .modal-body-scrollable {
    padding: 1.25rem;
  }
  
  .modal-footer {
    padding: 0.85rem 1.25rem;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Badge Styles */
.badge-scheduled {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.badge-draft {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

/* Action Icons */
.btn-icon-publish {
  color: #16a34a;
}
.btn-icon-publish:hover {
  background: #dcfce7;
  color: #15803d;
}

.btn-icon-schedule {
  color: #2563eb;
}
.btn-icon-schedule:hover {
  background: #dbeafe;
  color: #1d4ed8;
}

/* Split Button */
.split-btn-group {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-split-main {
  height: 42px;
  padding: 0 1.25rem;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #94a3b8;
  color: #ffffff;
  border: 1px solid #94a3b8;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-split-toggle {
  height: 42px;
  padding: 0 0.65rem;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #94a3b8;
  color: #ffffff;
  border: 1px solid #94a3b8;
  border-left: none;
}

.split-btn-group.is-active .btn-split-main {
  background: #2563eb;
  border-color: #2563eb;
  border-right-color: rgba(255, 255, 255, 0.35);
}

.split-btn-group.is-active .btn-split-main:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.split-btn-group.is-active .btn-split-toggle {
  background: #2563eb;
  border-color: #2563eb;
}

.split-btn-group.is-active .btn-split-toggle:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn-split-main:hover:not(:disabled) {
  background: #64748b;
  border-color: #64748b;
}

.btn-split-toggle:hover:not(:disabled) {
  background: #64748b;
  border-color: #64748b;
}

.btn-split-main:disabled,
.btn-split-toggle:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.2s ease;
}

/* Floating Dropdown Menu (Upward) */
.split-dropdown-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  min-width: 260px;
  max-width: calc(100vw - 32px);
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 0.4rem;
  z-index: 10060;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-sizing: border-box;
}

.split-menu-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #1e293b;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.15s ease;
  width: 100%;
}

.split-menu-item:hover {
  background: #f1f5f9;
}

.split-menu-item.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.split-menu-item svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: #64748b;
}

.split-menu-item.active svg {
  color: #2563eb;
}

.split-menu-text {
  display: flex;
  flex-direction: column;
}

.split-menu-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.split-menu-item.active .split-menu-title {
  color: #1d4ed8;
}

.split-menu-desc {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 1px;
  white-space: normal;
  line-height: 1.35;
}

/* Schedule Section Card inside form */
.schedule-section-card {
  background: #f0f7ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 1rem 1.15rem;
  margin-bottom: 1.15rem;
}

.schedule-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}

.schedule-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e40af;
}

.schedule-section-switch {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
}

.schedule-section-switch:hover {
  color: #1d4ed8;
}

.schedule-section-desc {
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 0.85rem;
  line-height: 1.35;
}

.schedule-inputs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.modal-form-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.form-error {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #dc2626;
  margin-top: 0.3rem;
}

.form-input.has-error,
.form-select-full.has-error,
.custom-dropdown-trigger.has-error {
  border-color: #dc2626 !important;
  background-color: #fef2f2 !important;
}

.schedule-error {
  margin-top: 0.6rem;
}

.mb-0 {
  margin-bottom: 0 !important;
}

/* Toast Alert Notification */
.toast-notification {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  z-index: 10099;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
}

.toast-notification.success {
  background: #15803d;
  color: #ffffff;
}

.toast-notification.error {
  background: #dc2626;
  color: #ffffff;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

<template>
  <div class="page-container">
    <!-- Breadcrumb / Back Link -->
    <nav class="breadcrumb">
      <router-link to="/learners" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Back to My Learners</span>
      </router-link>
    </nav>

    <!-- Top Profile Header Card -->
    <div class="profile-header-card">
      <div class="learner-avatar-meta">
        <div class="learner-initials-avatar">
          {{ getInitials(learner.name) }}
        </div>
        <div class="learner-title-block">
          <h2>
            {{ learner.name }}
            <span class="badge badge-success">{{ learner.status }}</span>
          </h2>
          <div class="learner-sub-meta">
            <strong>LRN:</strong> {{ learner.lrn }} &bull; {{ learner.level }} &bull; {{ learner.learningCenter }}
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap;">
        <button class="btn btn-outline" @click="activeTab = 'Reports'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>Generate Report</span>
        </button>
        <button class="btn btn-primary" @click="showRecordAssessmentModal = true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span>Record Assessment</span>
        </button>
      </div>
    </div>

    <!-- 6 Tabs Row -->
    <div class="tab-bar-card">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span v-html="tab.icon"></span>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- ============================================== -->
    <!-- TAB 1: OVERVIEW -->
    <!-- ============================================== -->
    <div v-if="activeTab === 'Overview'" class="tab-content-container">
      <div class="stats-grid-4" style="margin-bottom: 1.25rem;">
        <div class="stat-card-colored">
          <div class="stat-icon-wrapper stat-icon-blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label-title">Modules Assigned</span>
            <span class="stat-number">{{ assignedModules.length }}</span>
            <span class="stat-status-text">{{ completedModulesCount }} completed</span>
          </div>
        </div>

        <div class="stat-card-colored">
          <div class="stat-icon-wrapper stat-icon-green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label-title">ILA Goals</span>
            <span class="stat-number">{{ ilaGoals.length }}</span>
            <span class="stat-status-text">{{ achievedGoalsCount }} achieved</span>
          </div>
        </div>

        <div class="stat-card-colored">
          <div class="stat-icon-wrapper stat-icon-amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label-title">Overall Progress</span>
            <span class="stat-number">85%</span>
            <span class="stat-status-text">On track for portfolio</span>
          </div>
        </div>

        <div class="stat-card-colored">
          <div class="stat-icon-wrapper stat-icon-purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label-title">F2F Attendance</span>
            <span class="stat-number">92%</span>
            <span class="stat-status-text">23 of 25 sessions</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid-2">
        <div class="card-box">
          <h3 class="card-box-header">Learner Information</h3>
          <div class="details-grid-2">
            <div class="detail-item">
              <span class="detail-label">Full Name</span>
              <span class="detail-value">{{ learner.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Learner Reference Number (LRN)</span>
              <span class="detail-value">{{ learner.lrn }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ALS Learning Level</span>
              <span class="detail-value">{{ learner.level }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Community Learning Center</span>
              <span class="detail-value">{{ learner.learningCenter }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Age &amp; Gender</span>
              <span class="detail-value">22 years old &bull; Male</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Assigned Teacher</span>
              <span class="detail-value">Juan Dela Cruz</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Enrollment Status</span>
              <span class="detail-value"><span class="badge badge-success">Active Enrollee</span></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Target Completion</span>
              <span class="detail-value">December 2026</span>
            </div>
          </div>
        </div>

        <div class="card-box">
          <h3 class="card-box-header">Current ILA &amp; Learning Summary</h3>
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            <div class="summary-status-pill">
              <strong>Primary Goal:</strong> Master Communication Skills in English &amp; Filipino to prepare for A&E Certification.
            </div>
            <div class="summary-status-pill">
              <strong>Preferred Learning Modality:</strong> Modular Print with Weekly Face-to-Face Consultations at Poblacion CLC.
            </div>
            <div class="summary-status-pill">
              <strong>Latest Assessment Result:</strong> Module Quiz (18/20 - Excellent) recorded on Sep 15, 2026.
            </div>
            <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
              <button class="btn-outline" style="font-size: 0.8rem;" @click="activeTab = 'ILA'">
                View Full Learning Agreement &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB 2: INDIVIDUAL LEARNING AGREEMENT (ILA) -->
    <!-- ============================================== -->
    <div v-else-if="activeTab === 'ILA'" class="tab-content-container">
      <!-- ILA Header Status Card -->
      <div class="card-box" style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700;">Individual Learning Agreement (DepEd ALS Form)</h3>
              <span class="badge badge-success">Active Agreement</span>
            </div>
            <p style="font-size: 0.825rem; color: var(--color-text-secondary); margin: 0;">
              Formal learning contract negotiated between learner and ALS teacher outlining personalized competencies, learning strategies, and milestones.
            </p>
          </div>
          <button class="btn btn-primary" @click="showAddGoalModal = true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ Add Learning Goal</span>
          </button>
        </div>

        <div class="ila-meta-grid" style="margin-top: 1rem;">
          <div class="ila-meta-item">
            <span class="ila-meta-label">Agreement Period:</span>
            <span class="ila-meta-value">Aug 2026 – Dec 2026</span>
          </div>
          <div class="ila-meta-item">
            <span class="ila-meta-label">Primary Modality:</span>
            <span class="ila-meta-value">Modular Self-Paced + F2F Support</span>
          </div>
          <div class="ila-meta-item">
            <span class="ila-meta-label">Total Goals Set:</span>
            <span class="ila-meta-value">{{ ilaGoals.length }} Competencies</span>
          </div>
          <div class="ila-meta-item">
            <span class="ila-meta-label">Goal Completion:</span>
            <span class="ila-meta-value">{{ achievedGoalsCount }} of {{ ilaGoals.length }} Achieved</span>
          </div>
        </div>
      </div>

      <!-- ILA Learning Goals Table -->
      <div class="table-card" style="margin-bottom: 1.25rem;">
        <div class="card-box-header" style="padding: 1rem 1.25rem 0.5rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700;">Negotiated Learning Goals &amp; Competencies</span>
          <span style="font-size: 0.775rem; color: var(--color-text-muted);">DepEd ALS Curriculum Alignment</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Learning Strand</th>
                <th>Target Competency / Goal</th>
                <th>Learning Strategies</th>
                <th>Target Timeline</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(goal, idx) in ilaGoals" :key="goal.id">
                <td>{{ idx + 1 }}</td>
                <td><strong style="color: #1e293b;">{{ goal.strand }}</strong></td>
                <td style="max-width: 260px;">{{ goal.competency }}</td>
                <td><span class="strategy-badge">{{ goal.strategy }}</span></td>
                <td>{{ goal.timeline }}</td>
                <td>
                  <span
                    class="badge"
                    :class="{
                      'badge-success': goal.status === 'Achieved',
                      'badge-info': goal.status === 'In Progress',
                      'badge-warning': goal.status === 'Needs Review',
                    }"
                  >
                    {{ goal.status }}
                  </span>
                </td>
                <td>
                  <div class="cell-actions" style="justify-content: flex-end;">
                    <button class="btn-outline" style="font-size: 0.725rem; padding: 0.25rem 0.5rem;" @click="editGoal(goal)">
                      Update Status
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Teacher Advice & Recommendations Box -->
      <div class="card-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h3 class="card-box-header" style="margin-bottom: 0;">Teacher Guidance &amp; Agreed Advice</h3>
          <button class="btn-outline" style="font-size: 0.775rem;" @click="showAdviceModal = true">
            + Add Teacher Note
          </button>
        </div>
        <div class="advice-cards-list">
          <div v-for="adv in teacherAdvices" :key="adv.id" class="advice-card">
            <div class="advice-card-head">
              <strong>{{ adv.teacherName }}</strong>
              <span class="advice-date">{{ adv.date }}</span>
            </div>
            <p class="advice-text">{{ adv.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB 3: LEARNING MODULES -->
    <!-- ============================================== -->
    <div v-else-if="activeTab === 'Modules'" class="tab-content-container">
      <div class="card-box" style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700;">Assigned Learning Modules</h3>
            <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0.15rem 0 0;">
              Modules assigned to this learner based on their ILA goals across ALS Learning Strands.
            </p>
          </div>
          <button class="btn btn-primary" @click="showAssignModuleModal = true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Assign Module</span>
          </button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Module Title</th>
                <th>Learning Strand</th>
                <th>Code</th>
                <th>Activities</th>
                <th>Assigned Date</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(mod, idx) in assignedModules" :key="mod.id">
                <td>{{ idx + 1 }}</td>
                <td style="font-weight: 600; color: #1e293b;">{{ mod.title }}</td>
                <td>{{ mod.strand }}</td>
                <td><code>{{ mod.code }}</code></td>
                <td>{{ mod.activitiesCompleted }} / {{ mod.totalActivities }} completed</td>
                <td>{{ mod.assignedDate }}</td>
                <td>
                  <span class="badge" :class="mod.status === 'Completed' ? 'badge-success' : 'badge-info'">
                    {{ mod.status }}
                  </span>
                </td>
                <td>
                  <div class="cell-actions" style="justify-content: flex-end;">
                    <button class="btn-outline" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;" @click="activeTab = 'Progress'">
                      View Progress
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB 4: MODULE PROGRESS & ASSESSMENTS -->
    <!-- ============================================== -->
    <div v-else-if="activeTab === 'Progress'" class="tab-content-container">
      <div class="card-box" style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700;">Module Completion &amp; Assessment Records</h3>
            <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0.15rem 0 0;">
              Record evaluation scores, self-assessments, and face-to-face feedback for each completed module activity.
            </p>
          </div>
          <button class="btn btn-primary" @click="showRecordAssessmentModal = true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span>Record / Update Score</span>
          </button>
        </div>
      </div>

      <!-- Progress Table -->
      <div class="table-card" style="margin-bottom: 1.25rem;">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Module &amp; Activity</th>
                <th>Dates (Start - Finish)</th>
                <th>Activities</th>
                <th>Learner Self-Assessment</th>
                <th>Teacher Score</th>
                <th>Teacher Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(prog, idx) in moduleProgressList" :key="prog.id">
                <td>{{ idx + 1 }}</td>
                <td>
                  <strong style="color: #1e293b; display: block;">{{ prog.moduleTitle }}</strong>
                  <span style="font-size: 0.75rem; color: var(--color-text-muted);">{{ prog.activityName }} ({{ prog.type }})</span>
                </td>
                <td style="font-size: 0.8rem;">{{ prog.dateStarted }} &rarr; {{ prog.dateCompleted }}</td>
                <td>
                  <span class="badge badge-info">{{ prog.activitiesCompleted }}</span>
                </td>
                <td>
                  <span class="self-eval-tag">{{ prog.selfAssessment }}</span>
                </td>
                <td>
                  <strong style="color: var(--color-primary); font-size: 0.95rem;">{{ prog.teacherScore }}</strong>
                </td>
                <td>
                  <span :style="{ color: prog.remarks.includes('Needs') ? '#b45309' : '#15803d', fontSize: '0.825rem' }">
                    {{ prog.remarks }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB 5: ATTENDANCE -->
    <!-- ============================================== -->
    <div v-else-if="activeTab === 'Attendance'" class="tab-content-container">
      <div class="card-box" style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700;">Face-to-Face Session Attendance Log</h3>
            <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0.15rem 0 0;">
              Attendance in community learning center sessions, consultations, and portfolio reviews.
            </p>
          </div>
          <button class="btn btn-primary" @click="showLogAttendanceModal = true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Log Session Attendance</span>
          </button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Session Date</th>
                <th>Session Topic / Agenda</th>
                <th>CLC Venue</th>
                <th>Status</th>
                <th>Teacher Observation / Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(att, idx) in attendanceLogs" :key="idx">
                <td>{{ idx + 1 }}</td>
                <td><strong>{{ att.date }}</strong></td>
                <td>{{ att.topic }}</td>
                <td>{{ att.venue }}</td>
                <td>
                  <span
                    class="badge"
                    :class="{
                      'badge-success': att.status === 'Present',
                      'badge-warning': att.status === 'Late',
                      'badge-danger': att.status === 'Absent',
                      'badge-info': att.status === 'Excused',
                    }"
                  >
                    {{ att.status }}
                  </span>
                </td>
                <td style="font-size: 0.825rem; color: #475569;">{{ att.remarks }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB 6: REPORTS -->
    <!-- ============================================== -->
    <div v-else-if="activeTab === 'Reports'" class="tab-content-container">
      <div class="card-box" style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700;">Learner Progress &amp; ILA Report</h3>
            <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0.15rem 0 0;">
              Generate and print official ALS individual progress report for presentation and portfolio review.
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-outline" @click="handlePrintReport">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Print Official Report</span>
            </button>
            <button class="btn btn-primary" @click="handleDownloadReport">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Printable Report Preview Container -->
      <div class="report-paper-preview">
        <div class="report-deped-header">
          <div class="report-seal-text">
            <strong>DEPARTMENT OF EDUCATION</strong>
            <span>REGION X &bull; DIVISION OF MISAMIS ORIENTAL</span>
            <span>NAAWAN DISTRICT &bull; ALTERNATIVE LEARNING SYSTEM</span>
          </div>
          <div class="report-form-title">
            INDIVIDUAL LEARNER PROGRESS &amp; ILA SUMMARY REPORT
          </div>
        </div>

        <div class="report-learner-meta-table">
          <div class="rep-col"><strong>Learner Name:</strong> {{ learner.name }}</div>
          <div class="rep-col"><strong>LRN:</strong> {{ learner.lrn }}</div>
          <div class="rep-col"><strong>ALS Level:</strong> {{ learner.level }}</div>
          <div class="rep-col"><strong>Learning Center:</strong> {{ learner.learningCenter }}</div>
          <div class="rep-col"><strong>Teacher:</strong> Juan Dela Cruz</div>
          <div class="rep-col"><strong>Report Date:</strong> September 14, 2026</div>
        </div>

        <div class="report-section-heading">1. Individual Learning Agreement (ILA) Status</div>
        <table class="report-mini-table">
          <thead>
            <tr>
              <th>Strand</th>
              <th>Target Competency</th>
              <th>Target Date</th>
              <th>Achievement Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in ilaGoals" :key="g.id">
              <td>{{ g.strand }}</td>
              <td>{{ g.competency }}</td>
              <td>{{ g.timeline }}</td>
              <td><strong>{{ g.status }}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="report-section-heading">2. Module Completion &amp; Assessment Performance</div>
        <table class="report-mini-table">
          <thead>
            <tr>
              <th>Module Title</th>
              <th>Activities Done</th>
              <th>Teacher Score</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in moduleProgressList" :key="p.id">
              <td>{{ p.moduleTitle }}</td>
              <td>{{ p.activitiesCompleted }}</td>
              <td>{{ p.teacherScore }}</td>
              <td>{{ p.remarks }}</td>
            </tr>
          </tbody>
        </table>

        <div class="report-section-heading">3. Attendance &amp; Participation Summary</div>
        <div style="font-size: 0.85rem; padding: 0.5rem 0;">
          <strong>Face-to-Face Session Attendance:</strong> 92% (23 of 25 sessions attended) &bull; <strong>Modality:</strong> Modular Blended &bull; <strong>Overall Rating:</strong> Satisfactory Progress
        </div>

        <div class="report-sign-grid">
          <div class="sign-block">
            <div class="sign-line"></div>
            <span><strong>{{ learner.name }}</strong></span>
            <span>Learner Signature</span>
          </div>
          <div class="sign-block">
            <div class="sign-line"></div>
            <span><strong>Juan Dela Cruz</strong></span>
            <span>ALS Teacher / Implementor</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- MODALS -->
    <!-- ============================================== -->

    <!-- Add / Update ILA Goal Modal -->
    <div v-if="showAddGoalModal" class="modal-overlay" @click.self="showAddGoalModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingGoalId ? 'Update ILA Goal' : 'Add New ILA Learning Goal' }}</h2>
          <button class="modal-close" @click="showAddGoalModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveIlaGoal">
            <div class="form-group">
              <label class="form-label">Learning Strand <span class="required">*</span></label>
              <select v-model="goalForm.strand" class="form-select-full" required>
                <option value="Strand 1: Communication Skills (English/Filipino)">Strand 1: Communication Skills</option>
                <option value="Strand 2: Scientific & Critical Thinking">Strand 2: Scientific &amp; Critical Thinking</option>
                <option value="Strand 3: Mathematical & Problem Solving">Strand 3: Mathematical &amp; Problem Solving</option>
                <option value="Strand 4: Life and Career Skills">Strand 4: Life and Career Skills</option>
                <option value="Strand 5: Understanding Self & Society">Strand 5: Understanding Self &amp; Society</option>
                <option value="Strand 6: Digital Citizenship">Strand 6: Digital Citizenship</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Specific Competency / Goal <span class="required">*</span></label>
              <textarea v-model="goalForm.competency" class="form-input" rows="3" placeholder="e.g. Identify supporting details and write short reflection paragraphs in English" required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Learning Strategy</label>
              <select v-model="goalForm.strategy" class="form-select-full">
                <option value="Self-paced modules + F2F tutoring">Self-paced modules + F2F tutoring</option>
                <option value="Group reading sessions & journal">Group reading sessions &amp; journal</option>
                <option value="Practical hands-on exercises">Practical hands-on exercises</option>
                <option value="Online quiz review & consultation">Online quiz review &amp; consultation</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Target Timeline</label>
              <input v-model="goalForm.timeline" type="text" class="form-input" placeholder="e.g. October 2026" required />
            </div>
            <div class="form-group">
              <label class="form-label">Achievement Status</label>
              <select v-model="goalForm.status" class="form-select-full">
                <option value="In Progress">In Progress</option>
                <option value="Achieved">Achieved</option>
                <option value="Needs Review">Needs Review</option>
              </select>
            </div>
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showAddGoalModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Goal</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Assign Module Modal -->
    <div v-if="showAssignModuleModal" class="modal-overlay" @click.self="showAssignModuleModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Assign Learning Module</h2>
          <button class="modal-close" @click="showAssignModuleModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveAssignedModule">
            <div class="form-group">
              <label class="form-label">Select Learning Module <span class="required">*</span></label>
              <select v-model="assignForm.moduleId" class="form-select-full" required @change="onSelectModuleChange">
                <option value="1">Communication Skills Module 1 (CS-M1)</option>
                <option value="2">Scientific & Critical Thinking Module 1 (SC-M1)</option>
                <option value="3">Mathematical Problem Solving Module 2 (MS-M2)</option>
                <option value="4">Life and Career Skills Module 1 (LC-M1)</option>
                <option value="5">Digital Citizenship Module 1 (DC-M1)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Target Completion Date</label>
              <input v-model="assignForm.targetDate" type="date" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Special Teacher Instructions</label>
              <textarea v-model="assignForm.instructions" class="form-input" rows="2" placeholder="e.g. Complete Self-Assessment 1 before attending next F2F session"></textarea>
            </div>
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showAssignModuleModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Assign Module</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Record Assessment & Remarks Modal -->
    <div v-if="showRecordAssessmentModal" class="modal-overlay" @click.self="showRecordAssessmentModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Record Assessment &amp; Evaluation</h2>
          <button class="modal-close" @click="showRecordAssessmentModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveAssessmentScore">
            <div class="form-group">
              <label class="form-label">Module <span class="required">*</span></label>
              <select v-model="scoreForm.moduleTitle" class="form-select-full" required>
                <option value="Communication Skills Module 1">Communication Skills Module 1</option>
                <option value="Scientific & Critical Thinking Skills Module 1">Scientific & Critical Thinking Skills Module 1</option>
                <option value="Mathematical Problem Solving Module 2">Mathematical Problem Solving Module 2</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Activity Name <span class="required">*</span></label>
              <input v-model="scoreForm.activityName" type="text" class="form-input" placeholder="e.g. Reflection Journal / Post-Test" required />
            </div>
            <div class="form-group">
              <label class="form-label">Evaluation Modality</label>
              <select v-model="scoreForm.type" class="form-select-full">
                <option value="Face-to-Face">Face-to-Face Session Evaluation</option>
                <option value="Online">Online Answer Sheet</option>
                <option value="Portfolio Review">Portfolio / Performance Task</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Teacher Evaluated Score <span class="required">*</span></label>
              <input v-model="scoreForm.score" type="text" class="form-input" placeholder="e.g. 9/10 or 85%" required />
            </div>
            <div class="form-group">
              <label class="form-label">Teacher Feedback &amp; Remarks</label>
              <textarea v-model="scoreForm.remarks" class="form-input" rows="3" placeholder="Provide constructive feedback on learner strengths and areas for improvement"></textarea>
            </div>
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showRecordAssessmentModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Evaluation</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Log Session Attendance Modal -->
    <div v-if="showLogAttendanceModal" class="modal-overlay" @click.self="showLogAttendanceModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Log Face-to-Face Attendance</h2>
          <button class="modal-close" @click="showLogAttendanceModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveAttendanceLog">
            <div class="form-group">
              <label class="form-label">Session Date <span class="required">*</span></label>
              <input v-model="attForm.date" type="text" class="form-input" placeholder="e.g. Sep 14, 2026" required />
            </div>
            <div class="form-group">
              <label class="form-label">Session Topic / Activity <span class="required">*</span></label>
              <input v-model="attForm.topic" type="text" class="form-input" placeholder="e.g. Reading Comprehension F2F Workshop" required />
            </div>
            <div class="form-group">
              <label class="form-label">Attendance Status</label>
              <select v-model="attForm.status" class="form-select-full">
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Teacher Observation / Notes</label>
              <input v-model="attForm.remarks" type="text" class="form-input" placeholder="e.g. Participated actively; arrived on time" />
            </div>
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showLogAttendanceModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Log Attendance</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Add Teacher Advice Modal -->
    <div v-if="showAdviceModal" class="modal-overlay" @click.self="showAdviceModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Add Teacher Advice &amp; Guidance</h2>
          <button class="modal-close" @click="showAdviceModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveTeacherAdvice">
            <div class="form-group">
              <label class="form-label">Teacher Advice / Observation <span class="required">*</span></label>
              <textarea v-model="adviceForm.content" class="form-input" rows="4" placeholder="Enter notes, guidance, and recommendations discussed with the learner during F2F session" required></textarea>
            </div>
            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary" @click="showAdviceModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Advice</button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const tabs = [
  {
    id: 'Overview',
    label: '1. Overview',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  },
  {
    id: 'ILA',
    label: '2. Individual Learning Agreement',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  },
  {
    id: 'Modules',
    label: '3. Learning Modules',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
  },
  {
    id: 'Progress',
    label: '4. Module Progress',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  },
  {
    id: 'Attendance',
    label: '5. Attendance',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  },
  {
    id: 'Reports',
    label: '6. Reports',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  },
];

const activeTab = ref('Overview');

const learner = reactive({
  id: 6,
  name: 'Juan Dela Cruz',
  lrn: '109823481236',
  level: 'A&E Elementary',
  learningCenter: 'Poblacion CLC',
  status: 'Active',
});

function getInitials(name) {
  if (!name) return 'JD';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// -------------------------------------------------------------
// ILA GOALS
// -------------------------------------------------------------
const ilaGoals = ref([
  {
    id: 1,
    strand: 'Strand 1: Communication Skills',
    competency: 'Read and comprehend narrative paragraphs, identifying main idea and supporting details.',
    strategy: 'Self-paced modules + F2F tutoring',
    timeline: 'Sep 30, 2026',
    status: 'Achieved',
  },
  {
    id: 2,
    strand: 'Strand 1: Communication Skills',
    competency: 'Write a cohesive 2-paragraph reflection journal on personal learning goals.',
    strategy: 'Group reading sessions & journal',
    timeline: 'Oct 15, 2026',
    status: 'In Progress',
  },
  {
    id: 3,
    strand: 'Strand 2: Scientific & Critical Thinking',
    competency: 'Explain the scientific method and apply basic observation in daily life activities.',
    strategy: 'Practical hands-on exercises',
    timeline: 'Nov 10, 2026',
    status: 'In Progress',
  },
  {
    id: 4,
    strand: 'Strand 3: Mathematical Problem Solving',
    competency: 'Perform multi-digit arithmetic operations and solve basic real-world budgeting problems.',
    strategy: 'Online quiz review & consultation',
    timeline: 'Nov 30, 2026',
    status: 'Needs Review',
  },
]);

const achievedGoalsCount = computed(() => ilaGoals.value.filter((g) => g.status === 'Achieved').length);

const teacherAdvices = ref([
  {
    id: 1,
    teacherName: 'Juan Dela Cruz (ALS Teacher)',
    date: 'Sep 13, 2026',
    content: 'Learner shows active participation during face-to-face group reading activities. Recommended additional practice worksheets on supporting details before moving to Strand 2.',
  },
  {
    id: 2,
    teacherName: 'Juan Dela Cruz (ALS Teacher)',
    date: 'Sep 05, 2026',
    content: 'Initial ILA conference completed. Learner agreed to dedicate 2 hours per evening to modular reading and attend weekly Tuesday sessions.',
  },
]);

// -------------------------------------------------------------
// ASSIGNED MODULES
// -------------------------------------------------------------
const assignedModules = ref([
  {
    id: 1,
    title: 'Communication Skills Module 1: Effective Reading',
    strand: 'Strand 1: Communication Skills',
    code: 'CS-M1',
    activitiesCompleted: 4,
    totalActivities: 4,
    assignedDate: 'Sep 01, 2026',
    status: 'Completed',
  },
  {
    id: 2,
    title: 'Scientific & Critical Thinking Skills Module 1',
    strand: 'Strand 2: Scientific Literacy',
    code: 'SC-M1',
    activitiesCompleted: 2,
    totalActivities: 4,
    assignedDate: 'Sep 08, 2026',
    status: 'In Progress',
  },
  {
    id: 3,
    title: 'Mathematical Problem Solving Module 2',
    strand: 'Strand 3: Mathematical Literacy',
    code: 'MS-M2',
    activitiesCompleted: 1,
    totalActivities: 4,
    assignedDate: 'Sep 12, 2026',
    status: 'In Progress',
  },
]);

const completedModulesCount = computed(() => assignedModules.value.filter((m) => m.status === 'Completed').length);

// -------------------------------------------------------------
// MODULE PROGRESS & ASSESSMENTS
// -------------------------------------------------------------
const moduleProgressList = ref([
  {
    id: 1,
    moduleTitle: 'Communication Skills Module 1',
    activityName: 'Vocabulary Practice',
    type: 'Online',
    dateStarted: 'Sep 02, 2026',
    dateCompleted: 'Sep 05, 2026',
    activitiesCompleted: 'Activity 1 (5/5)',
    selfAssessment: 'Confident (5/5)',
    teacherScore: '5/5',
    remarks: 'Good master of vocabulary terms.',
  },
  {
    id: 2,
    moduleTitle: 'Communication Skills Module 1',
    activityName: 'Reading Comprehension Post-Test',
    type: 'Online',
    dateStarted: 'Sep 06, 2026',
    dateCompleted: 'Sep 10, 2026',
    activitiesCompleted: 'Activity 2 (10/10)',
    selfAssessment: 'Very Good (9/10)',
    teacherScore: '9/10',
    remarks: 'Very good reading analysis.',
  },
  {
    id: 3,
    moduleTitle: 'Communication Skills Module 1',
    activityName: 'Reflection Journal Output',
    type: 'Face-to-Face',
    dateStarted: 'Sep 11, 2026',
    dateCompleted: 'Sep 13, 2026',
    activitiesCompleted: 'Activity 3 (F2F)',
    selfAssessment: 'Satisfactory',
    teacherScore: '8/10',
    remarks: 'Needs improvement on sentence transitions.',
  },
  {
    id: 4,
    moduleTitle: 'Communication Skills Module 1',
    activityName: 'Module Mastery Quiz',
    type: 'Online',
    dateStarted: 'Sep 14, 2026',
    dateCompleted: 'Sep 15, 2026',
    activitiesCompleted: 'Activity 4 (20/20)',
    selfAssessment: 'Excellent',
    teacherScore: '18/20',
    remarks: 'Excellent overall mastery!',
  },
]);

// -------------------------------------------------------------
// ATTENDANCE LOGS
// -------------------------------------------------------------
const attendanceLogs = ref([
  { date: 'Sep 13, 2026', topic: 'Reading Comprehension F2F Session & Journal Check', venue: 'Poblacion CLC', status: 'Present', remarks: 'On time, active participation' },
  { date: 'Sep 10, 2026', topic: 'Vocabulary Review & Group Reading', venue: 'Poblacion CLC', status: 'Present', remarks: 'Completed assigned worksheet' },
  { date: 'Sep 05, 2026', topic: 'Orientation & ILA Negotiation Session', venue: 'Poblacion CLC', status: 'Present', remarks: 'Agreed on initial schedule' },
  { date: 'Aug 29, 2026', topic: 'Preliminary Diagnostic Assessment', venue: 'Poblacion CLC', status: 'Present', remarks: 'FLT results encoded' },
]);

// -------------------------------------------------------------
// MODALS STATE & HANDLERS
// -------------------------------------------------------------
const showAddGoalModal = ref(false);
const editingGoalId = ref(null);
const goalForm = reactive({
  strand: 'Strand 1: Communication Skills (English/Filipino)',
  competency: '',
  strategy: 'Self-paced modules + F2F tutoring',
  timeline: '',
  status: 'In Progress',
});

function editGoal(goal) {
  editingGoalId.value = goal.id;
  goalForm.strand = goal.strand;
  goalForm.competency = goal.competency;
  goalForm.strategy = goal.strategy;
  goalForm.timeline = goal.timeline;
  goalForm.status = goal.status;
  showAddGoalModal.value = true;
}

function saveIlaGoal() {
  if (editingGoalId.value) {
    const target = ilaGoals.value.find((g) => g.id === editingGoalId.value);
    if (target) {
      target.strand = goalForm.strand;
      target.competency = goalForm.competency;
      target.strategy = goalForm.strategy;
      target.timeline = goalForm.timeline;
      target.status = goalForm.status;
    }
    editingGoalId.value = null;
  } else {
    ilaGoals.value.push({
      id: Date.now(),
      ...goalForm,
    });
  }
  showAddGoalModal.value = false;
  goalForm.competency = '';
  goalForm.timeline = '';
}

const showAssignModuleModal = ref(false);
const assignForm = reactive({
  moduleId: '1',
  targetDate: '',
  instructions: '',
});

function onSelectModuleChange() {}

function saveAssignedModule() {
  const titles = {
    '1': { title: 'Communication Skills Module 1', strand: 'Strand 1: Communication Skills', code: 'CS-M1' },
    '2': { title: 'Scientific & Critical Thinking Module 1', strand: 'Strand 2: Scientific Literacy', code: 'SC-M1' },
    '3': { title: 'Mathematical Problem Solving Module 2', strand: 'Strand 3: Mathematical Literacy', code: 'MS-M2' },
    '4': { title: 'Life and Career Skills Module 1', strand: 'Strand 4: Life & Career Skills', code: 'LC-M1' },
    '5': { title: 'Digital Citizenship Module 1', strand: 'Strand 6: Digital Citizenship', code: 'DC-M1' },
  };
  const selected = titles[assignForm.moduleId] || titles['1'];
  assignedModules.value.push({
    id: Date.now(),
    title: selected.title,
    strand: selected.strand,
    code: selected.code,
    activitiesCompleted: 0,
    totalActivities: 4,
    assignedDate: 'Sep 14, 2026',
    status: 'In Progress',
  });
  alert(`Module "${selected.title}" assigned successfully.`);
  showAssignModuleModal.value = false;
}

const showRecordAssessmentModal = ref(false);
const scoreForm = reactive({
  moduleTitle: 'Communication Skills Module 1',
  activityName: '',
  type: 'Face-to-Face',
  score: '',
  remarks: '',
});

function saveAssessmentScore() {
  moduleProgressList.value.push({
    id: Date.now(),
    moduleTitle: scoreForm.moduleTitle,
    activityName: scoreForm.activityName,
    type: scoreForm.type,
    dateStarted: 'Sep 14, 2026',
    dateCompleted: 'Sep 14, 2026',
    activitiesCompleted: 'Completed',
    selfAssessment: 'Recorded',
    teacherScore: scoreForm.score,
    remarks: scoreForm.remarks || 'Evaluated during session',
  });
  alert(`Assessment score recorded for ${learner.name}.`);
  showRecordAssessmentModal.value = false;
  scoreForm.activityName = '';
  scoreForm.score = '';
  scoreForm.remarks = '';
}

const showLogAttendanceModal = ref(false);
const attForm = reactive({
  date: 'Sep 14, 2026',
  topic: '',
  status: 'Present',
  remarks: '',
});

function saveAttendanceLog() {
  attendanceLogs.value.unshift({
    date: attForm.date,
    topic: attForm.topic,
    venue: learner.learningCenter,
    status: attForm.status,
    remarks: attForm.remarks || 'Recorded',
  });
  alert('Attendance recorded.');
  showLogAttendanceModal.value = false;
  attForm.topic = '';
  attForm.remarks = '';
}

const showAdviceModal = ref(false);
const adviceForm = reactive({
  content: '',
});

function saveTeacherAdvice() {
  teacherAdvices.value.unshift({
    id: Date.now(),
    teacherName: 'Juan Dela Cruz (ALS Teacher)',
    date: 'Sep 14, 2026',
    content: adviceForm.content,
  });
  showAdviceModal.value = false;
  adviceForm.content = '';
}

function handlePrintReport() {
  window.print();
}

function handleDownloadReport() {
  alert(`Downloading Individual Progress Report for ${learner.name} (PDF)...`);
}

onMounted(() => {
  if (route.params.id) {
    learner.id = Number(route.params.id);
  }
});
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.learner-initials-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
}

.summary-status-pill {
  background: #f8fafc;
  border: 1px solid var(--color-border-light);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.825rem;
  color: #334155;
  line-height: 1.4;
}

.ila-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  background: #f8fafc;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
}

.ila-meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.ila-meta-label {
  font-size: 0.725rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.ila-meta-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
}

.strategy-badge {
  display: inline-block;
  font-size: 0.75rem;
  background: #f1f5f9;
  color: #334155;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.advice-cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.advice-card {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.advice-card-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.775rem;
  color: #64748b;
  margin-bottom: 0.4rem;
}

.advice-text {
  font-size: 0.85rem;
  color: #1e293b;
  line-height: 1.45;
  margin: 0;
}

.self-eval-tag {
  font-size: 0.775rem;
  color: #475569;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

/* Report Paper Preview Styling */
.report-paper-preview {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.report-deped-header {
  text-align: center;
  border-bottom: 2px solid #0f172a;
  padding-bottom: 1rem;
  margin-bottom: 1.25rem;
}

.report-seal-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.8rem;
  color: #334155;
}

.report-seal-text strong {
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

.report-form-title {
  margin-top: 0.75rem;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.5px;
}

.report-learner-meta-table {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem 1.5rem;
  background: #f8fafc;
  padding: 0.85rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  font-size: 0.825rem;
}

.report-section-heading {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 0.25rem;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.report-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}

.report-mini-table th,
.report-mini-table td {
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.65rem;
  text-align: left;
}

.report-mini-table th {
  background: #f1f5f9;
  font-weight: 700;
}

.report-sign-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2.5rem;
  padding-top: 1rem;
}

.sign-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  font-size: 0.8rem;
  color: #334155;
}

.sign-line {
  width: 180px;
  height: 1px;
  background: #000000;
  margin-bottom: 0.35rem;
}
</style>

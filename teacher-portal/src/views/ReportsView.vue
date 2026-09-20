<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Reports</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Teacher Reports &amp; Summaries</h1>
        <p>Generate DepEd ALS progress summaries, ILA goal completion reports, and attendance documentation for assigned learners.</p>
      </div>
      <div style="display: flex; gap: 0.65rem;">
        <button class="btn btn-outline" @click="handleExport('CSV')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Export CSV</span>
        </button>
        <button class="btn btn-primary" @click="handleExport('PDF')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>Print / Export PDF</span>
        </button>
      </div>
    </div>

    <!-- Tabs Row -->
    <div class="tab-bar-card">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Tab 1: Learner Progress Summary -->
    <div v-if="activeTab === 'Learner Progress Summary'">
      <div class="table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Learner Name</th>
                <th>LRN</th>
                <th>ALS Level</th>
                <th>Modules Completed</th>
                <th>Avg. Score</th>
                <th>Attendance</th>
                <th>ILA Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in progressReportData" :key="item.id">
                <td>{{ idx + 1 }}</td>
                <td style="font-weight: 600;">
                  <router-link :to="`/learners/${item.id}`" style="color: var(--color-primary);">
                    {{ item.name }}
                  </router-link>
                </td>
                <td>{{ item.lrn }}</td>
                <td>{{ item.level }}</td>
                <td>{{ item.completedModules }} / {{ item.totalModules }}</td>
                <td><strong>{{ item.avgScore }}%</strong></td>
                <td>{{ item.attendance }}%</td>
                <td><span class="badge badge-success">{{ item.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 2: ILA Goal Achievement Report -->
    <div v-else-if="activeTab === 'ILA Goal Achievement'">
      <div class="stats-grid-3" style="margin-bottom: 1.25rem;">
        <div class="stat-card-colored">
          <div class="stat-icon-wrapper stat-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label-title">Total Negotiated Goals</span>
            <span class="stat-number">32</span>
            <span class="stat-status-text">Across 17 assigned learners</span>
          </div>
        </div>

        <div class="stat-card-colored">
          <div class="stat-icon-wrapper stat-icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label-title">Achieved Competencies</span>
            <span class="stat-number">24 (75%)</span>
            <span class="stat-status-text">Successfully completed</span>
          </div>
        </div>

        <div class="stat-card-colored">
          <div class="stat-icon-wrapper stat-icon-amber">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label-title">Goals Under Review</span>
            <span class="stat-number">8</span>
            <span class="stat-status-text">Scheduled for upcoming F2F</span>
          </div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Learner Name</th>
                <th>Primary Target Strand</th>
                <th>Negotiated Competency</th>
                <th>Target Timeline</th>
                <th>Goal Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in ilaReportData" :key="row.id">
                <td>{{ idx + 1 }}</td>
                <td style="font-weight: 600;">
                  <router-link :to="`/learners/${row.learnerId}`" style="color: var(--color-primary);">
                    {{ row.name }}
                  </router-link>
                </td>
                <td>{{ row.strand }}</td>
                <td>{{ row.competency }}</td>
                <td>{{ row.timeline }}</td>
                <td>
                  <span
                    class="badge"
                    :class="{
                      'badge-success': row.status === 'Achieved',
                      'badge-info': row.status === 'In Progress',
                      'badge-warning': row.status === 'Needs Review',
                    }"
                  >
                    {{ row.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 3: Assessment Summary -->
    <div v-else-if="activeTab === 'Assessment Summary'">
      <div class="table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Assessment Title</th>
                <th>Learning Strand</th>
                <th>Evaluation Type</th>
                <th>Total Takers</th>
                <th>Mean Score</th>
                <th>Passing Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in assessmentSummaryData" :key="row.id">
                <td>{{ idx + 1 }}</td>
                <td style="font-weight: 600;">{{ row.title }}</td>
                <td>{{ row.strand }}</td>
                <td><span class="badge" :class="row.type === 'Online' ? 'badge-info' : 'badge-success'">{{ row.type }}</span></td>
                <td>{{ row.takers }} learners</td>
                <td>{{ row.meanScore }} / {{ row.totalItems }}</td>
                <td><strong>{{ row.passingRate }}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 4: Attendance Report -->
    <div v-else-if="activeTab === 'Attendance Report'">
      <div class="table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Month / Period</th>
                <th>Learning Center</th>
                <th>Total Sessions</th>
                <th>Average Attendance</th>
                <th>Excused Absences</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(att, idx) in attendanceSummaryData" :key="idx">
                <td>{{ idx + 1 }}</td>
                <td style="font-weight: 600;">{{ att.period }}</td>
                <td>{{ att.center }}</td>
                <td>{{ att.sessions }} sessions</td>
                <td><strong>{{ att.avgRate }}%</strong></td>
                <td>{{ att.excused }}</td>
                <td><span class="badge badge-success">Good</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const tabs = ['Learner Progress Summary', 'ILA Goal Achievement', 'Assessment Summary', 'Attendance Report'];
const activeTab = ref('Learner Progress Summary');

const progressReportData = ref([
  { id: 1, name: 'Ana Mae B. Dela Cruz', lrn: '109823481231', level: 'A&E Elementary', completedModules: 4, totalModules: 4, avgScore: 94, attendance: 96, status: 'Satisfactory' },
  { id: 2, name: 'John Rey L. Abad', lrn: '109823481232', level: 'A&E Junior', completedModules: 3, totalModules: 4, avgScore: 88, attendance: 92, status: 'Satisfactory' },
  { id: 3, name: 'Maria Fe S. Ignacio', lrn: '109823481233', level: 'A&E Elementary', completedModules: 2, totalModules: 4, avgScore: 82, attendance: 88, status: 'Needs Review' },
  { id: 4, name: 'Carla M. Baylon', lrn: '109823481234', level: 'ALS K-12', completedModules: 4, totalModules: 4, avgScore: 92, attendance: 94, status: 'Satisfactory' },
  { id: 5, name: 'Liza T. Ramon', lrn: '109823481235', level: 'A&E Junior', completedModules: 3, totalModules: 4, avgScore: 85, attendance: 90, status: 'Satisfactory' },
  { id: 6, name: 'Juan Dela Cruz', lrn: '109823481236', level: 'A&E Elementary', completedModules: 3, totalModules: 4, avgScore: 90, attendance: 92, status: 'Satisfactory' },
  { id: 7, name: 'Pedro S. Penduko', lrn: '109823481237', level: 'A&E Junior', completedModules: 1, totalModules: 4, avgScore: 65, attendance: 75, status: 'Needs Review' },
]);

const ilaReportData = ref([
  { id: 1, learnerId: 6, name: 'Juan Dela Cruz', strand: 'Strand 1: Communication', competency: 'Read & comprehend narrative paragraphs with main idea', timeline: 'Sep 30, 2026', status: 'Achieved' },
  { id: 2, learnerId: 6, name: 'Juan Dela Cruz', strand: 'Strand 1: Communication', competency: 'Write 2-paragraph reflection journal output', timeline: 'Oct 15, 2026', status: 'In Progress' },
  { id: 3, learnerId: 1, name: 'Ana Mae B. Dela Cruz', strand: 'Strand 1: Communication', competency: 'Essay composition and oral presentation', timeline: 'Sep 20, 2026', status: 'Achieved' },
  { id: 4, learnerId: 3, name: 'Maria Fe S. Ignacio', strand: 'Strand 2: Scientific Literacy', competency: 'Demonstrate scientific inquiry in daily life', timeline: 'Sep 10, 2026', status: 'Needs Review' },
  { id: 5, learnerId: 2, name: 'John Rey L. Abad', strand: 'Strand 3: Math Skills', competency: 'Solve algebraic word problems and budgeting tasks', timeline: 'Oct 30, 2026', status: 'In Progress' },
]);

const assessmentSummaryData = ref([
  { id: 1, title: 'Vocabulary Practice', strand: 'Strand 1: Communication', type: 'Online', totalItems: 5, takers: 17, meanScore: '4.8', passingRate: 98 },
  { id: 2, title: 'Reading Comprehension Post-Test', strand: 'Strand 1: Communication', type: 'Online', totalItems: 10, takers: 17, meanScore: '9.1', passingRate: 94 },
  { id: 3, title: 'Reflection Journal Output', strand: 'Strand 1: Communication', type: 'Face-to-Face', totalItems: 10, takers: 15, meanScore: '8.4', passingRate: 89 },
  { id: 4, title: 'Module Mastery Quiz', strand: 'Strand 1: Communication', type: 'Online', totalItems: 20, takers: 16, meanScore: '17.8', passingRate: 92 },
]);

const attendanceSummaryData = ref([
  { period: 'September 2026', center: 'Poblacion CLC', sessions: 8, avgRate: 92.4, excused: 3 },
  { period: 'August 2026', center: 'Poblacion CLC', sessions: 10, avgRate: 90.8, excused: 5 },
  { period: 'July 2026', center: 'Poblacion CLC', sessions: 9, avgRate: 94.1, excused: 2 },
]);

function handleExport(format) {
  alert(`Exporting ${activeTab.value} as ${format}...`);
}
</script>

<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/dashboard">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Module Progress</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Learner Module Progress &amp; Monitoring</h1>
        <p>Cohort overview to track completed modules, ongoing work, and identify struggling learners needing F2F intervention.</p>
      </div>
    </div>

    <!-- 4 Progress Summary Metric Chips -->
    <div class="progress-summary-grid">
      <div class="progress-chip">
        <div class="stat-icon-wrapper stat-icon-green" style="width: 40px; height: 40px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <div class="progress-chip-num">{{ onTrackCount }} Learners</div>
          <div class="progress-chip-text">Completed / On Track</div>
        </div>
      </div>

      <div class="progress-chip">
        <div class="stat-icon-wrapper stat-icon-blue" style="width: 40px; height: 40px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div>
          <div class="progress-chip-num">{{ inProgressCount }} Learners</div>
          <div class="progress-chip-text">Actively In Progress</div>
        </div>
      </div>

      <div class="progress-chip">
        <div class="stat-icon-wrapper stat-icon-amber" style="width: 40px; height: 40px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <div class="progress-chip-num">{{ strugglingCount }} Learners</div>
          <div class="progress-chip-text">Struggling / Needs Attention</div>
        </div>
      </div>

      <div class="progress-chip">
        <div class="stat-icon-wrapper stat-icon-purple" style="width: 40px; height: 40px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div>
          <div class="progress-chip-num">91.8%</div>
          <div class="progress-chip-text">F2F Attendance Avg</div>
        </div>
      </div>
    </div>

    <!-- Status Tabs / Category Filter -->
    <div class="tab-bar-card" style="margin-bottom: 1.25rem;">
      <button
        class="tab-btn"
        :class="{ active: selectedCategory === '' }"
        @click="selectedCategory = ''"
      >
        All Learners ({{ learners.length }})
      </button>
      <button
        class="tab-btn"
        :class="{ active: selectedCategory === 'On Track' }"
        @click="selectedCategory = 'On Track'"
      >
        Completed / On Track ({{ onTrackCount }})
      </button>
      <button
        class="tab-btn"
        :class="{ active: selectedCategory === 'In Progress' }"
        @click="selectedCategory = 'In Progress'"
      >
        In Progress ({{ inProgressCount }})
      </button>
      <button
        class="tab-btn"
        :class="{ active: selectedCategory === 'Struggling' }"
        @click="selectedCategory = 'Struggling'"
      >
        Struggling / Needs Attention ({{ strugglingCount }})
      </button>
    </div>

    <!-- Filters Bar Card -->
    <div class="filter-card">
      <div class="filter-dropdown-group" style="flex: 1;">
        <div class="filter-search-wrap" style="max-width: 280px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="filter-search-input"
            placeholder="Search learner name..."
          />
        </div>

        <div class="filter-dropdown-item">
          <label>ALS Level</label>
          <select v-model="selectedLevel" class="filter-select">
            <option value="">All Levels</option>
            <option value="A&E Elementary">A&E Elementary</option>
            <option value="A&E Junior High">A&E Junior High</option>
          </select>
        </div>

        <div class="filter-dropdown-item">
          <label>Learning Center</label>
          <select v-model="selectedCenter" class="filter-select">
            <option value="">All Centers</option>
            <option value="Poblacion CLC">Poblacion CLC</option>
            <option value="Naawan Central LC">Naawan Central LC</option>
            <option value="Mat-i CLC">Mat-i CLC</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Learner Progress Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Learner Name</th>
              <th>Level &amp; Center</th>
              <th>Modules Status</th>
              <th>Online Scores</th>
              <th>F2F Evaluation</th>
              <th>Attendance</th>
              <th>Progress Category</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(l, idx) in filteredLearners" :key="l.id">
              <td>{{ idx + 1 }}</td>
              <td class="table-cell-name">
                <router-link :to="`/dashboard/learners/${l.id}`" style="color: #0f172a; font-weight: 600;">
                  {{ l.name }}
                </router-link>
                <div style="font-size: 0.725rem; color: var(--color-text-muted); font-weight: 400;">LRN: {{ l.lrn }}</div>
              </td>
              <td class="table-cell-als-level" style="font-size: 0.8rem;">
                {{ formatAlsLevel(l.level) }}<br/>
                <span style="color: var(--color-text-muted);">{{ l.learningCenter }}</span>
              </td>
              <td>
                <span class="badge badge-info">{{ l.modulesCompleted }} / {{ l.totalModules }} Done</span>
              </td>
              <td>
                <span style="color: #1d4ed8; font-weight: 400;">{{ l.onlineAvg }}%</span>
              </td>
              <td>
                <span style="color: #15803d; font-weight: 400;">{{ l.f2fAvg }}%</span>
              </td>
              <td>
                <span>{{ l.attendanceRate }}%</span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-success': l.category === 'On Track',
                    'badge-info': l.category === 'In Progress',
                    'badge-warning': l.category === 'Struggling',
                  }"
                >
                  {{ l.categoryLabel }}
                </span>
              </td>
              <td>
                <div class="cell-actions" style="justify-content: flex-end;">
                  <router-link :to="`/dashboard/learners/${l.id}`" class="btn-outline" style="font-size: 0.775rem; padding: 0.25rem 0.6rem;">
                    View Profile
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredLearners.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
        </div>
        <h3>No learners match this filter</h3>
        <p>Try clearing your search query or selecting "All Learners".</p>
      </div>

      <!-- Pagination Footer -->
      <div class="table-pagination-row">
        <div>
          Showing 1 to {{ filteredLearners.length }} of {{ filteredLearners.length }} entries
        </div>
        <div class="pagination-controls">
          <div class="pagination-rows-select">
            <span>Rows per page:</span>
            <select class="filter-select" style="padding: 0.25rem 1.5rem 0.25rem 0.5rem;">
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
          </div>
          <div class="pagination-nav-group">
            <button class="pagination-btn" disabled>&lt; Previous</button>
            <button class="pagination-btn" disabled>Next &gt;</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const selectedLevel = ref('');
const selectedCenter = ref('');
const selectedCategory = ref('');

function formatAlsLevel(val) {
  if (!val) return '—';
  const s = String(val).toUpperCase();
  if (s.includes('ELEM')) return 'A&E Elementary';
  if (s.includes('JUN') || s.includes('LOWER_SEC') || s.includes('SEC')) return 'A&E Junior High';
  return String(val).trim();
}

const learners = ref([
  { id: 1, name: 'Ana Mae B. Dela Cruz', lrn: '109823481231', level: 'A&E Elementary', learningCenter: 'Poblacion CLC', modulesCompleted: 4, totalModules: 4, onlineAvg: 94, f2fAvg: 90, attendanceRate: 96, category: 'On Track', categoryLabel: 'Completed / On Track' },
  { id: 2, name: 'John Rey L. Abad', lrn: '109823481232', level: 'A&E Junior High', learningCenter: 'Poblacion CLC', modulesCompleted: 3, totalModules: 4, onlineAvg: 88, f2fAvg: 85, attendanceRate: 92, category: 'In Progress', categoryLabel: 'In Progress' },
  { id: 3, name: 'Maria Fe S. Ignacio', lrn: '109823481233', level: 'A&E Elementary', learningCenter: 'Naawan Central LC', modulesCompleted: 1, totalModules: 4, onlineAvg: 70, f2fAvg: 68, attendanceRate: 80, category: 'Struggling', categoryLabel: 'Needs Attention' },
  { id: 4, name: 'Carla M. Baylon', lrn: '109823481234', level: 'A&E Junior High', learningCenter: 'Poblacion CLC', modulesCompleted: 4, totalModules: 4, onlineAvg: 92, f2fAvg: 88, attendanceRate: 94, category: 'On Track', categoryLabel: 'Completed / On Track' },
  { id: 5, name: 'Liza T. Ramon', lrn: '109823481235', level: 'A&E Junior High', learningCenter: 'Naawan Central LC', modulesCompleted: 3, totalModules: 4, onlineAvg: 85, f2fAvg: 82, attendanceRate: 90, category: 'In Progress', categoryLabel: 'In Progress' },
  { id: 6, name: 'Juan Dela Cruz', lrn: '109823481236', level: 'A&E Elementary', learningCenter: 'Poblacion CLC', modulesCompleted: 3, totalModules: 4, onlineAvg: 90, f2fAvg: 80, attendanceRate: 92, category: 'In Progress', categoryLabel: 'In Progress' },
  { id: 7, name: 'Pedro S. Penduko', lrn: '109823481237', level: 'A&E Junior High', learningCenter: 'Poblacion CLC', modulesCompleted: 1, totalModules: 4, onlineAvg: 65, f2fAvg: 60, attendanceRate: 75, category: 'Struggling', categoryLabel: 'Needs Attention' },
  { id: 8, name: 'Mark Anthony Perez', lrn: '109823481238', level: 'A&E Junior High', learningCenter: 'Mat-i CLC', modulesCompleted: 4, totalModules: 4, onlineAvg: 95, f2fAvg: 92, attendanceRate: 98, category: 'On Track', categoryLabel: 'Completed / On Track' },
]);

const onTrackCount = computed(() => learners.value.filter((l) => l.category === 'On Track').length);
const inProgressCount = computed(() => learners.value.filter((l) => l.category === 'In Progress').length);
const strugglingCount = computed(() => learners.value.filter((l) => l.category === 'Struggling').length);

const filteredLearners = computed(() => {
  return learners.value.filter((l) => {
    const matchesQuery =
      !searchQuery.value ||
      l.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      l.lrn.includes(searchQuery.value);
    const matchesLevel = !selectedLevel.value || l.level === selectedLevel.value;
    const matchesCenter = !selectedCenter.value || l.learningCenter === selectedCenter.value;
    const matchesCat = !selectedCategory.value || l.category === selectedCategory.value;
    return matchesQuery && matchesLevel && matchesCenter && matchesCat;
  });
});
</script>

<style scoped>
.tab-btn {
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
}
</style>

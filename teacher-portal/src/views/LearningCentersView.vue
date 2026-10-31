<template>
  <div class="learning-centers-page">
    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>My Learning Centers</h1>
        <p>View the learning centers assigned to you.</p>
      </div>
    </div>

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
      <h3 class="state-title">Loading assigned learning centers...</h3>
    </div>

    <!-- Empty State -->
    <div v-else-if="learningCenters.length === 0" class="state-container empty-state-card">
      <div class="empty-graphic-wrapper">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/>
          <path d="M5 21V7l8-4v18"/>
          <path d="M19 21V11l-6-4"/>
          <path d="M9 9h1"/>
          <path d="M9 13h1"/>
          <path d="M9 17h1"/>
        </svg>
      </div>
      <h3 class="empty-title">No Learning Centers Assigned</h3>
      <p class="empty-desc">You currently have no Learning Centers assigned to you.</p>
    </div>

    <!-- Large Spacious Full-Width Table Card -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="learning-centers-table">
          <thead>
            <tr>
              <th class="th-center-name">Center Name</th>
              <th class="th-address">Address</th>
              <th class="th-level">ALS Level</th>
              <th class="th-total">Total Learner</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="center in learningCenters" :key="center.rowKey || center.id || center.slug">
              <!-- 1. Center Name -->
              <td class="td-center-name">
                <span class="center-name-text">{{ center.name }}</span>
              </td>

              <!-- 2. Address -->
              <td class="td-address">
                <span class="address-text">{{ center.address || '—' }}</span>
              </td>

              <!-- 3. ALS Level (Clean Blue Badge/Pill Style) -->
              <td class="td-level">
                <span class="level-pill">{{ center.programLevel }}</span>
              </td>

              <!-- 4. Total Learner -->
              <td class="td-total">
                <span class="total-learner-badge">{{ center.totalLearners }}</span>
              </td>

              <!-- 5. Actions (Far Right Aligned, View Eye Icon Only) -->
              <td class="td-actions">
                <router-link
                  :to="{
                    path: `/dashboard/learning-centers/${center.id || center.slug}`,
                    query: { programLevel: center.programLevel }
                  }"
                  class="btn-view-icon"
                  title="View"
                  :aria-label="`View ${center.name} (${center.programLevel})`"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { getTeacherProfile } from '../api/auth.js';
import { getAssignedLearners } from '../api/learners.js';
import { getLearningCenters } from '../api/learningCenters.js';

const { currentTeacher, teacherId, assignedProgramLevel } = useTeacherSession();

const loading = ref(true);
const assignedLearners = ref([]);
const rawCenters = ref([]);
const teacherProfileData = ref(null);

// Fetch assigned learning centers and learners from database via API
async function loadLearningCentersData() {
  loading.value = true;
  try {
    const tid = teacherId.value || currentTeacher.value?.id;
    const [profileRes, learnersRes, allCentersRes] = await Promise.allSettled([
      tid ? getTeacherProfile(tid) : Promise.resolve(null),
      getAssignedLearners(tid ? { teacherId: tid } : {}),
      getLearningCenters(),
    ]);

    // Teacher profile data for assigned ALS levels
    if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
      teacherProfileData.value = profileRes.value.data;
    }

    // Assigned learners from database
    if (learnersRes.status === 'fulfilled' && Array.isArray(learnersRes.value.data)) {
      assignedLearners.value = learnersRes.value.data;
    } else {
      assignedLearners.value = [];
    }

    // All available learning centers from database for full details lookup
    const allCenters = allCentersRes.status === 'fulfilled' && Array.isArray(allCentersRes.value.data)
      ? allCentersRes.value.data
      : [];

    // Extract centers assigned to this teacher
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

    // Fallback to currentTeacher session if profile call didn't return centers
    if (centers.length === 0 && currentTeacher.value) {
      if (Array.isArray(currentTeacher.value.learningCenters) && currentTeacher.value.learningCenters.length > 0) {
        centers = [...currentTeacher.value.learningCenters];
      } else if (currentTeacher.value.learningCenterDetails) {
        centers = [currentTeacher.value.learningCenterDetails];
      } else if (currentTeacher.value.learningCenterId) {
        const found = allCenters.find((c) => c.id === currentTeacher.value.learningCenterId);
        if (found) centers = [found];
      }
    }

    // If teacher has assigned learners associated with a learning center not yet in centers
    if (assignedLearners.value.length > 0) {
      for (const lrn of assignedLearners.value) {
        if (lrn.learningCenterId && !centers.some((c) => c.id === lrn.learningCenterId)) {
          const matched = allCenters.find((c) => c.id === lrn.learningCenterId) || lrn.learningCenterDetails;
          if (matched) {
            centers.push(matched);
          } else if (lrn.learningCenter && lrn.learningCenter !== '—') {
            centers.push({
              id: lrn.learningCenterId,
              name: lrn.learningCenter,
              locationAddress: 'Naawan, Misamis Oriental',
            });
          }
        }
      }
    }

    // Augment with full details from allCenters if available
    rawCenters.value = centers.map((c) => {
      const dbMatch = allCenters.find((ac) => ac.id === c.id || ac.name === c.name);
      return {
        ...c,
        ...(dbMatch || {}),
        id: c.id || dbMatch?.id,
        name: c.name || dbMatch?.name || 'Learning Center',
        code: c.code || dbMatch?.code || '',
        address:
          dbMatch?.address ||
          dbMatch?.location_address ||
          c.locationAddress ||
          c.location ||
          (dbMatch?.municipality ? `${dbMatch.municipality}, ${dbMatch.province || 'Misamis Oriental'}` : 'Naawan, Misamis Oriental'),
      };
    });
  } catch (err) {
    console.error('Error loading learning centers data:', err);
  } finally {
    loading.value = false;
  }
}

// Resolve assigned ALS levels for this teacher
function getTeacherAssignedLevels() {
  const rawLevel = (
    teacherProfileData.value?.programLevel ||
    teacherProfileData.value?.specialization ||
    currentTeacher.value?.programLevel ||
    currentTeacher.value?.specialization ||
    assignedProgramLevel.value ||
    ''
  ).trim();

  const lower = rawLevel.toLowerCase();

  const hasElem = lower.includes('elem');
  const hasJunior = lower.includes('jun') || lower.includes('sec');
  const hasBoth = lower.includes('both') || lower.includes('all') || rawLevel === '' || (hasElem && hasJunior);

  if (hasBoth) {
    return ['A&E Elementary', 'A&E Junior High'];
  }
  if (hasElem && !hasJunior) {
    return ['A&E Elementary'];
  }
  if (hasJunior && !hasElem) {
    return ['A&E Junior High'];
  }

  return ['A&E Elementary', 'A&E Junior High'];
}

// Compute table rows with dynamic ALS level rows and individual learner counts
const learningCenters = computed(() => {
  const assignedLevels = getTeacherAssignedLevels();
  const rows = [];

  for (const center of rawCenters.value) {
    // Learners assigned to this teacher in this center
    const learnersInCenter = assignedLearners.value.filter((l) => {
      if (center.id && l.learningCenterId) {
        return Number(l.learningCenterId) === Number(center.id);
      }
      if (l.learningCenter && center.name) {
        return l.learningCenter.trim().toLowerCase() === center.name.trim().toLowerCase();
      }
      return false;
    });

    const slug =
      center.slug ||
      (center.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    for (const level of assignedLevels) {
      let totalLearners = 0;
      if (level === 'A&E Elementary') {
        totalLearners = learnersInCenter.filter((l) => {
          const lvl = String(l.level || l.programLevel || '').toLowerCase();
          return lvl.includes('elem');
        }).length;
      } else if (level === 'A&E Junior High') {
        totalLearners = learnersInCenter.filter((l) => {
          const lvl = String(l.level || l.programLevel || '').toLowerCase();
          return lvl.includes('jun') || lvl.includes('sec');
        }).length;
      }

      rows.push({
        id: center.id,
        slug,
        name: center.name,
        code: center.code,
        address: center.address,
        programLevel: level,
        totalLearners,
        rowKey: `${center.id || slug}-${level}`,
      });
    }
  }

  return rows;
});

onMounted(() => {
  loadLearningCentersData();
});
</script>

<style scoped>
/* Full Available Content Width */
.learning-centers-page {
  width: 100%;
  max-width: 100%;
  padding-bottom: 3rem;
  box-sizing: border-box;
}

.page-header-row {
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

/* Large Spacious Table Card Stretching Across Main Content Area */
.table-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.learning-centers-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

/* Header Columns */
.learning-centers-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1.1rem 1.75rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.th-center-name {
  width: 28%;
}

.th-address {
  width: 38%;
}

.th-level {
  width: 18%;
}

.th-total {
  width: 10%;
  text-align: center;
}

.th-actions {
  width: 6%;
  text-align: right;
}

/* Data Rows with Comfortable Height & Padding */
.learning-centers-table td {
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 0.875rem;
  vertical-align: middle;
}

.learning-centers-table tbody tr:last-child td {
  border-bottom: none;
}

.learning-centers-table tbody tr {
  transition: background-color 0.15s ease;
}

.learning-centers-table tbody tr:hover {
  background-color: #f8fafc;
}

/* 1. Center Name */
.td-center-name {
  font-weight: 600;
  color: #0f172a;
}

.center-name-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
}

/* 2. Address */
.td-address {
  color: #475569;
}

.address-text {
  color: #475569;
  font-size: 0.875rem;
  line-height: 1.45;
}

/* 3. ALS Level (Clean Blue Badge / Pill Style) */
.td-level {
  white-space: nowrap;
}

.level-pill {
  display: inline-block;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.775rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  white-space: nowrap;
}

/* 4. Total Learner */
.td-total {
  text-align: center;
  white-space: nowrap;
}

.total-learner-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 0.65rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.9rem;
}

/* 5. Actions (Far Right Aligned) */
.td-actions {
  text-align: right;
  white-space: nowrap;
}

.btn-view-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--action-view-border, #DCE7F6);
  background: var(--action-view-bg, #EFF6FF);
  border-radius: 6px;
  color: var(--action-view-color, #4169A8);
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-view-icon:hover {
  background: var(--action-view-hover-bg, #E0EEFE);
  color: var(--action-view-hover-color, #315488);
  border-color: var(--action-view-hover-border, #B9D3F4);
}

.btn-view-icon:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8);
  outline-offset: 1px;
  box-shadow: 0 0 0 3px var(--action-view-focus-ring, rgba(65, 105, 168, 0.35));
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
  max-width: 420px;
}
</style>

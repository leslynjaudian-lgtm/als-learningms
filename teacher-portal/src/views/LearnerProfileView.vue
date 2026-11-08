<template>
  <div class="page-container learner-profile-page">
    <!-- Standardized Breadcrumbs -->
    <nav class="page-breadcrumbs" aria-label="Breadcrumb">
      <ol class="breadcrumbs-list">
        <li class="breadcrumb-item">
          <router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link>
          <span class="breadcrumb-separator">/</span>
        </li>
        <li class="breadcrumb-item">
          <router-link to="/dashboard/learners" class="breadcrumb-link">My Learners</router-link>
          <span class="breadcrumb-separator">/</span>
        </li>
        <li class="breadcrumb-item">
          <span class="breadcrumb-current">{{ learner.name || 'Learner Profile' }}</span>
        </li>
      </ol>
    </nav>

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
      <h3 class="state-title">Loading learner details...</h3>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="state-container" style="padding: 3rem 1.5rem; text-align: center;">
      <div class="state-icon-circle" style="background: #fee2e2; color: #dc2626; margin: 0 auto 1rem;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3 class="state-title" style="color: #0f172a; margin-bottom: 0.5rem;">Access Denied</h3>
      <p style="color: #64748b; max-width: 420px; margin: 0 auto 1.5rem;">{{ loadError }}</p>
      <router-link to="/dashboard/learners" class="btn btn-secondary">Back to My Learners</router-link>
    </div>

    <template v-else>
      <!-- Profile Header Bar (Record Assessment & Generate Report Removed) -->
      <div class="profile-header-bar">
        <div class="profile-header-left">
          <div class="learner-avatar">
            {{ getInitials(learner.name) }}
          </div>
          <div class="profile-header-info">
            <div class="profile-name-row">
              <h1 class="profile-name">{{ learner.name }}</h1>
              <span
                class="status-badge"
                :class="learner.status === 'Active' ? 'badge-active' : 'badge-inactive'"
              >
                {{ learner.status || 'Active' }}
              </span>
            </div>
            <div class="profile-meta-row">
              <span class="meta-item"><strong>LRN:</strong> {{ learner.lrn || '—' }}</span>
              <span class="meta-separator">&bull;</span>
              <span class="meta-item">{{ learner.programLevel || learner.level || '—' }}</span>
              <span class="meta-separator">&bull;</span>
              <span class="meta-item">{{ learner.learningCenter || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Back Button -->
        <div class="profile-header-actions">
          <router-link to="/dashboard/learners" class="btn btn-back-outline">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to My Learners</span>
          </router-link>
        </div>
      </div>

      <!-- Learner Information Card (All 11 Admin-Side Fields) -->
      <div class="info-card">
        <div class="info-card-header">
          <div class="card-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h2 class="card-title">Learner Information</h2>
        </div>

        <div class="info-card-body">
          <div class="info-grid">
            <!-- 1. Full Name -->
            <div class="info-field">
              <span class="info-label">Full Name</span>
              <span class="info-value info-highlight">{{ learner.name }}</span>
            </div>

            <!-- 2. LRN -->
            <div class="info-field">
              <span class="info-label">LRN</span>
              <span class="info-value info-code">{{ learner.lrn || '—' }}</span>
            </div>

            <!-- 3. ALS Level -->
            <div class="info-field">
              <span class="info-label">ALS Level</span>
              <span class="info-value">{{ learner.programLevel || learner.level || '—' }}</span>
            </div>

            <!-- 4. Learning Center -->
            <div class="info-field">
              <span class="info-label">Learning Center</span>
              <span class="info-value">{{ learner.learningCenter || '—' }}</span>
            </div>

            <!-- 5. Assigned Teacher -->
            <div class="info-field">
              <span class="info-label">Assigned Teacher</span>
              <span class="info-value teacher-val">{{ learner.assignedTeacher || '—' }}</span>
            </div>

            <!-- 6. Status -->
            <div class="info-field">
              <span class="info-label">Status</span>
              <span class="info-value">
                <span class="status-badge" :class="learner.status === 'Active' ? 'badge-active' : 'badge-inactive'">
                  {{ learner.status || 'Active' }}
                </span>
              </span>
            </div>

            <!-- 7. Sex -->
            <div class="info-field">
              <span class="info-label">Sex</span>
              <span class="info-value">{{ learner.sex || '—' }}</span>
            </div>

            <!-- 8. Date of Birth -->
            <div class="info-field">
              <span class="info-label">Date of Birth</span>
              <span class="info-value">{{ learner.dob || '—' }}</span>
            </div>

            <!-- 9. Contact Number -->
            <div class="info-field">
              <span class="info-label">Contact Number</span>
              <span class="info-value">{{ learner.contactNumber || '—' }}</span>
            </div>

            <!-- 10. Address -->
            <div class="info-field info-field-full">
              <span class="info-label">Address</span>
              <span class="info-value">{{ learner.address || '—' }}</span>
            </div>

            <!-- 11. Date Registered -->
            <div class="info-field info-field-full">
              <span class="info-label">Date Registered</span>
              <span class="info-value">{{ learner.dateRegistered || '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getLearner } from '../api/learners.js';
import { useTeacherSession } from '../composables/useTeacherSession.js';

const route = useRoute();
const { teacherName } = useTeacherSession();

const loading = ref(true);

const learner = reactive({
  id: null,
  name: '',
  fullName: '',
  lrn: '',
  level: '',
  programLevel: '',
  learningCenter: '',
  status: 'Active',
  assignedTeacher: '',
  sex: '',
  dob: '',
  contactNumber: '',
  address: '',
  dateRegistered: '',
});

const loadError = ref('');

function getInitials(name) {
  if (!name) return 'L';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(dateVal) {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateVal;
  }
}

async function loadLearnerData() {
  const learnerId = route.params.id;
  if (!learnerId) {
    loading.value = false;
    loadError.value = 'Invalid learner ID.';
    return;
  }

  loading.value = true;
  loadError.value = '';
  try {
    const { data } = await getLearner(learnerId);
    if (data) {
      learner.id = data.id;
      learner.name = data.fullName || data.name || 'Learner';
      learner.fullName = learner.name;
      learner.lrn = data.lrn || '—';
      learner.level = data.level === 'ELEMENTARY' ? 'A&E Elementary' : (data.level === 'JUNIOR' || data.level === 'LOWER_SECONDARY' || data.level === 'A&E Junior' || data.level === 'A&E Junior High' ? 'A&E Junior High' : data.level) || 'A&E Elementary';
      learner.programLevel = learner.level;
      learner.learningCenter = data.learningCenter || (data.learningCenterDetails ? data.learningCenterDetails.name : '—');
      learner.status = data.status || 'Active';
      learner.assignedTeacher = data.assignedTeacher || data.teacher || '—';
      learner.sex = data.sex || data.gender || '—';
      learner.dob = data.dob || (data.birthDate ? data.birthDate.split('T')[0] : '—');
      learner.contactNumber = data.contactNumber || data.contactNo || '—';
      learner.address = data.address || '—';
      learner.dateRegistered = data.dateRegistered || formatDate(data.createdAt) || '—';
    } else {
      loadError.value = 'Learner profile not found.';
    }
  } catch (err) {
    console.error('Could not load learner by ID:', err);
    loadError.value =
      err.response?.status === 403
        ? 'Access denied. This learner is not assigned to your account.'
        : (err.response?.data?.error || 'Learner not found.');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadLearnerData();
});
</script>

<style scoped>
.learner-profile-page {
  padding-bottom: 3.5rem;
}

/* Breadcrumb */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 1.25rem;
}

.breadcrumb-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

.breadcrumb-current {
  color: #0f172a;
  font-weight: 600;
}

/* Loading State */
.state-container {
  padding: 4rem 2rem;
  text-align: center;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.state-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.state-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

/* Profile Header Bar */
.profile-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

.profile-header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: 0;
}

.learner-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #1d4ed8;
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(29, 78, 216, 0.25);
  letter-spacing: 0.5px;
}

.profile-header-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.profile-name {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.profile-meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
  flex-wrap: wrap;
}

.meta-item strong {
  color: #0f172a;
  font-weight: 600;
}

.meta-separator {
  color: #cbd5e1;
  font-size: 0.8rem;
}

.btn-back-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.95rem;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 8px;
  color: #334155;
  font-size: 0.86rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-back-outline:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
}

.badge-active {
  background: #dcfce7;
  color: #15803d;
}

.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
}

/* Clean Learner Information Card */
.info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1.15rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #fafbfc;
}

.card-header-icon {
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.info-card-body {
  padding: 1.75rem 1.75rem 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.6rem 2.5rem;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.info-field-full {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .info-field-full {
    grid-column: span 1;
  }
}

.info-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: #0f172a;
}

.info-highlight {
  font-weight: 700;
  color: #0f172a;
  font-size: 1rem;
}

.info-code {
  font-family: inherit;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.teacher-val {
  color: #1e40af;
  font-weight: 600;
}
</style>

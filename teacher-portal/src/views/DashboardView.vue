<template>
  <div class="page-container">
    <!-- Welcome Banner with Quote -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <h1>Welcome, Juan!</h1>
        <p>ALS Implementor / Teacher — Naawan District Learning Centers</p>
      </div>
      <div class="welcome-quote">
        "Inclusive Education, Stronger Communities, Brighter Futures."
      </div>
    </div>

    <!-- 4 Overview Stat Cards -->
    <div class="stats-grid-4">
      <!-- Assigned Learners -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Assigned Learners</span>
          <span class="stat-number">17</span>
          <span class="stat-status-text">Poblacion &amp; Naawan Central</span>
        </div>
      </div>

      <!-- Active ILAs -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Active ILAs</span>
          <span class="stat-number">15</span>
          <span class="stat-status-text">Agreements on track</span>
        </div>
      </div>

      <!-- Modules In Progress -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Modules in Progress</span>
          <span class="stat-number">28</span>
          <span class="stat-status-text">Across all strands</span>
        </div>
      </div>

      <!-- F2F Attendance Rate -->
      <div class="stat-card-colored">
        <div class="stat-icon-wrapper stat-icon-purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label-title">Avg. Attendance</span>
          <span class="stat-number">92.4%</span>
          <span class="stat-status-text">Face-to-face sessions</span>
        </div>
      </div>
    </div>

    <!-- Quick Access Actions Bar -->
    <div class="card-box" style="margin-bottom: 1.5rem;">
      <h3 class="card-box-header">Quick Access to Frequent Tasks</h3>
      <div class="quick-actions-grid">
        <router-link to="/learners" class="action-btn-card action-blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <span>View Assigned Learners</span>
        </router-link>

        <router-link to="/progress" class="action-btn-card action-amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 02 2h14a2 2 0 0 02-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span>Monitor Module Progress</span>
        </router-link>

        <router-link to="/modules" class="action-btn-card action-green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
          </svg>
          <span>Browse Learning Modules</span>
        </router-link>

        <router-link to="/reports" class="action-btn-card action-purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>Generate Reports</span>
        </router-link>
      </div>
    </div>

    <!-- 2-Column Section: Learners Needing Attention & Upcoming F2F Sessions -->
    <div class="dashboard-grid-2">
      <!-- Learners Needing Attention -->
      <div class="card-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 class="card-box-header" style="margin-bottom: 0;">Learners Needing Attention</h3>
          <span class="badge badge-warning">3 Action Required</span>
        </div>

        <div class="attention-list">
          <div v-for="item in attentionLearners" :key="item.id" class="attention-item">
            <div class="attention-avatar">
              {{ item.initials }}
            </div>
            <div class="attention-info">
              <div class="attention-name">
                <router-link :to="`/learners/${item.id}`" class="attention-link">
                  {{ item.name }}
                </router-link>
                <span class="badge" :class="item.tagClass">{{ item.tag }}</span>
              </div>
              <div class="attention-reason">{{ item.reason }}</div>
              <div class="attention-sub">{{ item.level }} &bull; {{ item.center }}</div>
            </div>
            <router-link :to="`/learners/${item.id}`" class="btn-outline" style="font-size: 0.775rem; padding: 0.25rem 0.6rem; white-space: nowrap;">
              Review ILA
            </router-link>
          </div>
        </div>
      </div>

      <!-- Upcoming Face-to-Face Sessions -->
      <div class="card-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 class="card-box-header" style="margin-bottom: 0;">Upcoming Face-to-Face Sessions</h3>
          <router-link to="/learners" style="font-size: 0.8rem; color: var(--color-primary); font-weight: 500;">View All</router-link>
        </div>

        <div class="sessions-list">
          <div v-for="session in upcomingSessions" :key="session.id" class="session-card-item">
            <div class="session-date-badge">
              <span class="date-day">{{ session.day }}</span>
              <span class="date-month">{{ session.month }}</span>
            </div>
            <div class="session-body">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{{ session.center }} &bull; {{ session.time }}</span>
              </div>
              <div class="session-learners-chip">
                {{ session.learnersCount }} Assigned Learners Expected
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const attentionLearners = ref([
  {
    id: 6,
    initials: 'JD',
    name: 'Juan Dela Cruz',
    level: 'A&E Elementary',
    center: 'Poblacion CLC',
    tag: 'Pending Evaluation',
    tagClass: 'badge-warning',
    reason: 'Module 1 reflection journal ready for face-to-face assessment.',
  },
  {
    id: 3,
    initials: 'MI',
    name: 'Maria Fe S. Ignacio',
    level: 'A&E Elementary',
    center: 'Naawan Central LC',
    tag: 'ILA Milestone Due',
    tagClass: 'badge-info',
    reason: 'Scientific Literacy timeline reached; goal achievement review needed.',
  },
  {
    id: 7,
    initials: 'PP',
    name: 'Pedro S. Penduko',
    level: 'A&E Junior',
    center: 'Poblacion CLC',
    tag: 'Attendance Follow-up',
    tagClass: 'badge-danger',
    reason: 'Missed 2 consecutive F2F sessions; requires home/learning follow-up.',
  },
]);

const upcomingSessions = ref([
  {
    id: 1,
    day: '16',
    month: 'SEP',
    title: 'Communication Skills: Reading Comprehension & Writing F2F Review',
    center: 'Poblacion CLC',
    time: '8:30 AM - 11:30 AM',
    learnersCount: 9,
  },
  {
    id: 2,
    day: '18',
    month: 'SEP',
    title: 'Mathematical Problem Solving & Self-Assessment Consultation',
    center: 'Naawan Central LC',
    time: '1:00 PM - 4:00 PM',
    learnersCount: 8,
  },
  {
    id: 3,
    day: '23',
    month: 'SEP',
    title: 'Individual Learning Agreement (ILA) Mid-Term Progress Review',
    center: 'Poblacion CLC',
    time: '9:00 AM - 12:00 PM',
    learnersCount: 12,
  },
]);
</script>

<style scoped>
.attention-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.attention-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  transition: background var(--transition-fast);
}

.attention-item:hover {
  background: #f1f5f9;
}

.attention-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.attention-info {
  flex: 1;
}

.attention-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.attention-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
}

.attention-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.attention-reason {
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.3;
}

.attention-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.session-card-item {
  display: flex;
  gap: 0.85rem;
  padding: 0.85rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
}

.session-date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 52px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  flex-shrink: 0;
}

.date-day {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1d4ed8;
  line-height: 1;
}

.date-month {
  font-size: 0.65rem;
  font-weight: 700;
  color: #3b82f6;
  text-transform: uppercase;
  margin-top: 2px;
}

.session-body {
  flex: 1;
}

.session-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
}

.session-center {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.775rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.session-learners-chip {
  display: inline-block;
  font-size: 0.725rem;
  font-weight: 600;
  color: #059669;
  background: #ecfdf5;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.35rem;
}
</style>

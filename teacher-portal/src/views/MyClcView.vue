<template>
  <div class="page-container">
    <!-- Page Header -->
    <div class="page-header-row" style="margin-bottom: 1.5rem;">
      <div class="page-title-group">
        <h1>My CLC</h1>
        <p>View the learning center assigned to you.</p>
      </div>
    </div>

    <!-- Assigned CLC Card List (Screen 1) -->
    <div class="clc-cards-list">
      <router-link
        v-for="center in clcList"
        :key="center.id"
        :to="`/clc/${center.slug}`"
        class="clc-main-card"
      >
        <div class="clc-card-left">
          <div class="clc-building-icon-box">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/>
            </svg>
          </div>
          <div class="clc-meta-block">
            <h2>{{ center.name }}</h2>
            <span class="clc-district-text">{{ center.district }}</span>
            <div class="clc-location-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{{ center.location }}</span>
            </div>
          </div>
        </div>

        <div class="clc-card-right">
          <div class="clc-learners-badge">
            <div class="clc-learners-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="clc-learners-info">
              <span class="clc-learners-num">{{ center.learnersCount }}</span>
              <span class="clc-learners-label">Learners</span>
            </div>
          </div>

          <div class="clc-chevron-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const clcList = ref([
  {
    id: 1,
    slug: 'poblacion-clc',
    name: 'Poblacion CLC',
    district: 'Naawan District',
    location: 'Poblacion, Naawan',
    learnersCount: 17,
  },
]);
</script>

<style scoped>
.clc-cards-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 900px;
}

.clc-main-card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.clc-main-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: #cbd5e1;
}

.clc-card-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.clc-building-icon-box {
  width: 58px;
  height: 58px;
  border-radius: 14px;
  background: #eff6ff;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.clc-meta-block h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.clc-district-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  display: block;
  margin-top: 0.15rem;
}

.clc-location-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 0.35rem;
}

.clc-card-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.clc-learners-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.6rem 1rem;
}

.clc-learners-icon {
  color: var(--color-primary);
  display: flex;
  align-items: center;
}

.clc-learners-info {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.clc-learners-num {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.clc-learners-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.clc-chevron-btn {
  color: #94a3b8;
  display: flex;
  align-items: center;
  transition: transform var(--transition-fast), color var(--transition-fast);
}

.clc-main-card:hover .clc-chevron-btn {
  color: var(--color-primary);
  transform: translateX(4px);
}
</style>

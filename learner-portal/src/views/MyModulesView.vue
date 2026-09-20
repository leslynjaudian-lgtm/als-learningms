<template>
  <div class="my-modules-page">
    <h1 class="page-title">My Modules</h1>
    <p class="page-subtitle">Access your learning modules and study at your own pace.</p>

    <!-- Filter Tabs -->
    <div class="filter-tabs-row">
      <button
        type="button"
        class="filter-tab-btn"
        :class="{ active: currentFilter === 'all' }"
        @click="currentFilter = 'all'"
      >
        All
      </button>
      <button
        type="button"
        class="filter-tab-btn"
        :class="{ active: currentFilter === 'in_progress' }"
        @click="currentFilter = 'in_progress'"
      >
        In Progress
      </button>
      <button
        type="button"
        class="filter-tab-btn"
        :class="{ active: currentFilter === 'completed' }"
        @click="currentFilter = 'completed'"
      >
        Completed
      </button>
    </div>

    <!-- Modules List -->
    <div v-if="filteredModules.length > 0" style="display: flex; flex-direction: column; gap: 0.85rem;">
      <router-link
        v-for="mod in filteredModules"
        :key="mod.id"
        :to="`/modules/${mod.id}`"
        class="learner-card"
        style="display: flex; flex-direction: column; gap: 0.75rem; text-decoration: none; cursor: pointer;"
      >
        <div style="display: flex; gap: 0.85rem; align-items: flex-start;">
          <div
            :style="{ background: mod.badgeBg, color: mod.badgeColor }"
            style="width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>

          <div style="flex: 1;">
            <h2 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1.25;">
              {{ mod.title }}
            </h2>
            <div style="font-size: 0.775rem; color: #64748b; margin-top: 2px;">
              {{ mod.strand }}
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">
              {{ mod.lessonsCompleted }}/{{ mod.totalLessons }} lessons
            </div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: flex-end; font-size: 0.75rem; font-weight: 700; color: #165dfc;">
            {{ mod.progress }}%
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: `${mod.progress}%` }"></div>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Empty State -->
    <div v-else class="learner-card" style="padding: 2.5rem 1.5rem; text-align: center;">
      <div style="width: 52px; height: 52px; margin: 0 auto 0.85rem; border-radius: 14px; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
      <h3 style="font-size: 0.95rem; font-weight: 700; color: #334155;">No learning modules found</h3>
      <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">
        Your learning modules will be assigned by your teacher.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const currentFilter = ref('all');

// Zero Fake Data Rule: starts empty
const modules = ref([]);

const filteredModules = computed(() => {
  if (currentFilter.value === 'all') return modules.value;
  if (currentFilter.value === 'completed') return modules.value.filter(m => m.progress === 100);
  if (currentFilter.value === 'in_progress') return modules.value.filter(m => m.progress < 100);
  return modules.value;
});
</script>

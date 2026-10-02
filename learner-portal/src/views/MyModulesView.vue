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
        All ({{ modules.length }})
      </button>
      <button
        type="button"
        class="filter-tab-btn"
        :class="{ active: currentFilter === 'in_progress' }"
        @click="currentFilter = 'in_progress'"
      >
        In Progress ({{ modules.filter(m => !m.completed).length }})
      </button>
      <button
        type="button"
        class="filter-tab-btn"
        :class="{ active: currentFilter === 'completed' }"
        @click="currentFilter = 'completed'"
      >
        Completed ({{ modules.filter(m => m.completed).length }})
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
            style="width: 44px; height: 44px; border-radius: 12px; background: #eff6ff; color: #165dfc; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
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
              {{ mod.learningArea?.name || mod.strand || 'General Strand' }}
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">
              Teacher: {{ mod.teacher?.fullName || 'Assigned Teacher' }}
            </div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: flex-end; font-size: 0.75rem; font-weight: 700; color: #165dfc;">
            {{ mod.progress || 0 }}%
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: `${mod.progress || 0}%` }"></div>
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
      <h3 style="font-size: 0.95rem; font-weight: 700; color: #334155;">No Learning Modules</h3>
      <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">
        There are no learning modules available at this time.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import api from '../api/axios';

const currentFilter = ref('all');
const modules = ref([]);
const loading = ref(false);

async function loadModules() {
  loading.value = true;
  try {
    const res = await api.get('/modules');
    const data = res.data?.data || res.data || [];
    modules.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load modules:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadModules();
});

const filteredModules = computed(() => {
  if (currentFilter.value === 'all') return modules.value;
  if (currentFilter.value === 'completed') return modules.value.filter(m => m.completed);
  if (currentFilter.value === 'in_progress') return modules.value.filter(m => !m.completed);
  return modules.value;
});
</script>

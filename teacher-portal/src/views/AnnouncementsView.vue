<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Announcements</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Announcements</h1>
        <p>View announcements from the admin.</p>
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

    <!-- Announcements Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px;">#</th>
              <th>Title</th>
              <th style="width: 200px;">Date Posted</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in filteredAnnouncements" :key="item.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 600;">{{ item.title }}</td>
              <td>{{ item.datePosted }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredAnnouncements.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <h3>No announcements yet</h3>
        <p>Announcements will appear here once they are posted.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const tabs = ['All', 'For Teachers', 'For Learners'];
const activeTab = ref('All');

const announcements = ref([]);

const filteredAnnouncements = computed(() => {
  return announcements.value.filter((a) => {
    if (activeTab.value === 'For Teachers') return a.audience === 'Teachers Only' || a.audience === 'All Users';
    if (activeTab.value === 'For Learners') return a.audience === 'Learners Only' || a.audience === 'All Users';
    return true;
  });
});
</script>

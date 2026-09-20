<template>
  <div class="announcements-page">
    <h1 class="page-title">Announcements</h1>
    <p class="page-subtitle">Stay updated with the latest news and reminders.</p>

    <!-- Announcements List -->
    <div v-if="announcements.length > 0" style="display: flex; flex-direction: column; gap: 0.85rem;">
      <div
        v-for="item in announcements"
        :key="item.id"
        class="learner-card"
        style="display: flex; gap: 0.85rem; align-items: flex-start; padding: 1.15rem;"
      >
        <div
          :style="{ background: item.iconBg, color: item.iconColor }"
          style="width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        <div style="flex: 1;">
          <h2 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1.25;">
            {{ item.title }}
          </h2>
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-top: 2px;">
            {{ item.date }}
          </div>
          <p style="font-size: 0.825rem; color: #475569; margin-top: 0.35rem; line-height: 1.4;">
            {{ item.content }}
          </p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="learner-card" style="padding: 2.5rem 1.5rem; text-align: center;">
      <div style="width: 52px; height: 52px; margin: 0 auto 0.85rem; border-radius: 14px; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <h3 style="font-size: 0.95rem; font-weight: 700; color: #334155;">No announcements yet</h3>
      <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">
        District updates and learning schedules will be posted here.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Zero Fake Data Rule: starts empty
const announcements = ref([]);
</script>

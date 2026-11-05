<template>
  <div class="announcements-page">
    <h1 class="page-title">Announcements</h1>
    <p class="page-subtitle">Stay updated with the latest news and reminders.</p>

    <!-- Loading State -->
    <div v-if="loading" class="learner-card" style="padding: 2rem; text-align: center; color: #64748b;">
      <p>Loading announcements...</p>
    </div>

    <!-- Announcements List -->
    <div v-else-if="announcements.length > 0" style="display: flex; flex-direction: column; gap: 0.85rem;">
      <div
        v-for="item in announcements"
        :key="item.id"
        class="learner-card"
        style="display: flex; gap: 0.85rem; align-items: flex-start; padding: 1.15rem; cursor: pointer;"
        @click="markAnnouncementRead(item)"
      >
        <div
          :style="{ background: item.iconBg || '#eff6ff', color: item.iconColor || '#165dfc' }"
          style="width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            <h2 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1.25; margin: 0;">
              {{ item.title }}
            </h2>
            <span style="font-size: 0.75rem; font-weight: 700; color: #64748b;">
              {{ item.datePosted || item.date }}
            </span>
          </div>
          <p style="font-size: 0.825rem; color: #475569; margin-top: 0.45rem; line-height: 1.45; white-space: pre-wrap;">
            {{ item.message || item.content }}
          </p>
          <div style="font-size: 0.725rem; color: #94a3b8; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
            <span>From: {{ item.createdBy || item.author || 'Administrator' }}</span>
          </div>
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
      <h3 style="font-size: 0.95rem; font-weight: 700; color: #334155; margin: 0;">No announcements yet</h3>
      <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem; margin-bottom: 0;">
        District updates and learning schedules will be posted here.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios.js';
import { useNotifications } from '../composables/useNotifications.js';

const announcements = ref([]);
const loading = ref(false);
const { markAsRead } = useNotifications();

function markAnnouncementRead(item) {
  if (item?.id) {
    markAsRead(`announcement:${item.id}`);
  }
}

async function loadAnnouncements() {
  loading.value = true;
  try {
    let learnerId = null;
    let learningCenterId = null;
    try {
      const meRes = await api.get('/learners/me');
      if (meRes.data?.data) {
        learnerId = meRes.data.data.id;
        learningCenterId = meRes.data.data.learningCenterId;
      }
    } catch {
      try {
        const rawUser = localStorage.getItem('als_learner_user');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          learnerId = u.profile?.id || u.id;
          learningCenterId = u.profile?.learningCenterId || u.learningCenterId;
        }
      } catch (e) {
        // ignore
      }
    }

    const { data } = await api.get('/announcements', {
      params: {
        portal: 'learner',
        learnerId: learnerId || undefined,
        learningCenterId: learningCenterId || undefined,
      },
    });

    if (Array.isArray(data)) {
      announcements.value = data.map((d, index) => {
        const colors = [
          { iconBg: '#eff6ff', iconColor: '#165dfc' },
          { iconBg: '#f5f3ff', iconColor: '#7c3aed' },
          { iconBg: '#ecfdf5', iconColor: '#059669' },
        ];
        const color = colors[index % colors.length];
        return {
          ...d,
          ...color,
        };
      });
    } else {
      announcements.value = [];
    }
  } catch (err) {
    console.error('Failed to load announcements for learner:', err);
    announcements.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadAnnouncements();
});
</script>

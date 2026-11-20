<template>
  <div class="notifications-page">
    <!-- View 1: Notification Details View (for announcements without external actionUrl) -->
    <div v-if="selectedNotification" class="notification-details-container">
      <button
        type="button"
        class="back-btn"
        @click="closeDetails"
        aria-label="Balik sa Mga Pahibalo"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Balik sa Mga Pahibalo</span>
      </button>

      <div class="learner-card notification-details-card">
        <div class="details-badge-row">
          <span class="details-type-tag" :class="'type-' + getVisualType(selectedNotification)">
            {{ getBadgeLabel(selectedNotification) }}
          </span>
        </div>

        <h1 class="details-title">
          {{ getDisplayTitle(selectedNotification) }}
        </h1>

        <h2 v-if="getAnnouncementTitle(selectedNotification)" class="details-announcement-subtitle">
          {{ getAnnouncementTitle(selectedNotification) }}
        </h2>

        <div class="details-description">
          {{ getDisplayMessage(selectedNotification, true) }}
        </div>

        <div class="details-divider"></div>

        <div class="details-meta-footer">
          <div v-if="getRelevantSender(selectedNotification)" class="meta-row">
            <span class="meta-label">Gikan kang:</span>
            <span class="meta-value">{{ getRelevantSender(selectedNotification) }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Petsa:</span>
            <span class="meta-value">{{ formatFullDate(selectedNotification.createdAt || selectedNotification.datePosted) }}</span>
          </div>
        </div>

        <div
          v-if="hasDestination(selectedNotification)"
          class="details-action-box"
        >
          <router-link :to="selectedNotification.actionUrl" class="details-action-link">
            <span>{{ getActionLabel(selectedNotification) }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </router-link>
        </div>
      </div>
    </div>

    <!-- View 2: Notifications List View -->
    <div v-else class="notifications-list-container">
      <h1 class="page-title">Mga Pahibalo</h1>
      <p class="page-subtitle">
        Dinhi nimo makita ang mga mensahe ug pahibalo gikan sa imong ALS Teacher. Pindota ang pahibalo aron mabasa ang detalye.
      </p>

      <!-- Loading State -->
      <div v-if="loading" class="learner-card notif-loading-card">
        <div class="loading-spinner"></div>
        <p>Nagkarga sa mga pahibalo...</p>
      </div>

      <!-- Notifications List -->
      <div v-else-if="items.length > 0" class="notifications-stack">
        <div
          v-for="item in items"
          :key="item.notificationKey || item.id"
          class="learner-card notif-card-item"
          :class="{ 'is-unread': !item.isRead, 'is-read': item.isRead }"
          @click="openDetails(item)"
          role="button"
          tabindex="0"
          :aria-label="getDisplayTitle(item)"
          @keydown.enter="openDetails(item)"
          @keydown.space.prevent="openDetails(item)"
        >
          <!-- Left Recognizable Icon -->
          <div
            class="notif-icon-wrapper"
            :style="{ background: item.iconBg, color: item.iconColor }"
            aria-hidden="true"
          >
            <!-- Book for module -->
            <svg v-if="item.visualType === 'module'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <!-- Calendar for session / schedule -->
            <svg v-else-if="item.visualType === 'schedule'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <!-- Check-circle for activity submitted / reviewed -->
            <svg v-else-if="item.visualType === 'submission'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <!-- Clock for deadline reminder -->
            <svg v-else-if="item.visualType === 'reminder'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <!-- Bell for announcement -->
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>

          <!-- Middle Content -->
          <div class="notif-content-wrapper">
            <div class="notif-header-line">
              <div class="notif-title-group">
                <span v-if="!item.isRead" class="notif-unread-dot" title="Wala pa mabasa"></span>
                <h2 class="notif-card-title">{{ getDisplayTitle(item) }}</h2>
              </div>
              <span class="notif-card-time">{{ getRelativeTime(item) }}</span>
            </div>

            <div v-if="getAnnouncementTitle(item)" class="notif-announcement-title">
              {{ getAnnouncementTitle(item) }}
            </div>

            <p class="notif-card-preview">
              {{ getDisplayMessage(item, false) }}
            </p>

            <div v-if="getRelevantSender(item) || hasDestination(item)" class="notif-card-footer">
              <span v-if="getRelevantSender(item)" class="notif-card-sender">
                Gikan kang {{ getRelevantSender(item) }}
              </span>
              <span v-if="hasDestination(item)" class="notif-action-pill">
                {{ getActionLabel(item) }} →
              </span>
            </div>
          </div>

          <!-- Right Chevron Icon -->
          <div class="notif-chevron-wrapper" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="learner-card notif-empty-card">
        <div class="empty-icon-circle">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <h3 class="empty-title">Wala pay pahibalo</h3>
        <p class="empty-desc">
          Dinhi makita ang mga bag-ong pahibalo gikan sa imong teacher.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotifications } from '../composables/useNotifications.js';
import {
  getNotificationVisualType as getVisualType,
  getNotificationTypeStyle as getTypeStyle,
  getNotificationBadgeLabel as getBadgeLabel,
  getNotificationDisplayTitle as getDisplayTitle,
  getNotificationAnnouncementTitle as getAnnouncementTitle,
  getNotificationDisplayMessage as getDisplayMessage,
  getNotificationRelevantSender as getRelevantSender,
  hasNotificationDestination as hasDestination,
  getNotificationActionLabel as getActionLabel,
  getNotificationRelativeTime as getRelativeTime,
  formatNotificationFullDate as formatFullDate,
} from '../utils/notificationFormat.js';

const route = useRoute();
const router = useRouter();

const {
  notifications,
  fetchNotifications,
  markAsRead,
} = useNotifications();

const loading = ref(false);
const selectedNotification = ref(null);
const savedScrollY = ref(0);

// Map notifications directly from backend (single source of truth)
const items = computed(() => {
  if (!Array.isArray(notifications.value)) return [];
  return notifications.value.map((n) => {
    const visualType = getVisualType(n);
    const styles = getTypeStyle(visualType);
    return {
      ...n,
      visualType,
      iconBg: styles.iconBg,
      iconColor: styles.iconColor,
    };
  });
});

function openDetails(item) {
  if (!item) return;

  if (!item.isRead) {
    const key = item.notificationKey || `notif:${item.id}`;
    markAsRead(key);
    item.isRead = true;
  }

  // Notifications with a destination navigate directly to the existing page/module/activity
  if (hasDestination(item)) {
    router.push(item.actionUrl);
    return;
  }

  // Announcements open the dedicated details view
  savedScrollY.value = window.scrollY || window.pageYOffset || 0;
  selectedNotification.value = item;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function closeDetails() {
  selectedNotification.value = null;

  if (route.query.id || route.query.key) {
    router.replace({ query: {} }).catch(() => {});
  }

  nextTick(() => {
    window.scrollTo({ top: savedScrollY.value, behavior: 'instant' });
  });
}

// Watch query params to open a notification if linked directly
watch(
  () => [route.query.id, route.query.key, items.value],
  () => {
    const qKey = route.query.key;
    const qId = route.query.id;
    if ((qKey || qId) && items.value.length > 0 && !selectedNotification.value) {
      const match = items.value.find(
        (n) => (qKey && n.notificationKey === qKey) || (qId && String(n.id) === String(qId))
      );
      if (match) {
        openDetails(match);
      }
    }
  },
  { immediate: true }
);

async function loadData() {
  loading.value = true;
  try {
    await fetchNotifications();
  } catch (err) {
    console.error('Failed to load notifications for learner:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.notifications-page {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  padding-bottom: 1.5rem;
}

/* Page Header */
.page-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0b1e36;
  margin: 0 0 0.25rem 0;
  line-height: 1.25;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #475569;
  margin: 0 0 1rem 0;
  line-height: 1.45;
  text-align: left;
}

/* Common Card Base */
.learner-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
}

/* Loading State */
.notif-loading-card {
  padding: 2.25rem 1.25rem;
  text-align: center;
  color: #475569;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 0.95rem;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e2e8f0;
  border-top-color: #165dfc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Notifications List Stack */
.notifications-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

/* Notification Item Card */
.notif-card-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  min-height: 72px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.notif-card-item:hover {
  border-color: #165dfc;
}

.notif-card-item.is-unread {
  background: #f8fbff;
  border-color: #93c5fd;
}

.notif-card-item.is-read {
  background: #ffffff;
  border-color: #e2e8f0;
}

/* Icon Wrapper */
.notif-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Content Wrapper */
.notif-content-wrapper {
  flex: 1;
  min-width: 0;
}

.notif-header-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.notif-title-group {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.notif-unread-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #165dfc;
  flex-shrink: 0;
}

.notif-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0b1e36;
  line-height: 1.3;
  margin: 0;
  word-break: break-word;
}

.is-unread .notif-card-title {
  font-weight: 800;
}

.notif-announcement-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.35;
  margin-top: 0.25rem;
  word-break: break-word;
}

.details-announcement-subtitle {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.35;
  margin: 0 0 0.5rem 0;
  word-break: break-word;
}

.notif-card-time {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.notif-card-preview {
  font-size: 0.9rem;
  color: #334155;
  margin: 0.35rem 0 0 0;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.is-read .notif-card-preview {
  color: #475569;
}

/* Card Footer */
.notif-card-footer {
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.notif-card-sender {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.notif-action-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: #165dfc;
}

/* Chevron */
.notif-chevron-wrapper {
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  flex-shrink: 0;
}

/* Details View */
.notification-details-container {
  width: 100%;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  background: transparent;
  border: none;
  color: #165dfc;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.5rem 0.25rem;
  margin-bottom: 0.75rem;
  touch-action: manipulation;
}

.notification-details-card {
  padding: 1.25rem;
}

.details-badge-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.details-type-tag {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 8px;
}

.details-type-tag.type-announcement,
.details-type-tag.type-module,
.details-type-tag.type-schedule {
  background: #eff6ff;
  color: #165dfc;
}

.details-type-tag.type-reminder {
  background: #fffbeb;
  color: #d97706;
}

.details-type-tag.type-submission {
  background: #f0fdf4;
  color: #16a34a;
}

.details-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0b1e36;
  line-height: 1.3;
  margin: 0 0 0.75rem 0;
  word-break: break-word;
}

.details-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.details-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 1.1rem 0;
}

.details-meta-footer {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #64748b;
  flex-wrap: wrap;
}

.meta-label {
  font-weight: 600;
  color: #64748b;
}

.meta-value {
  font-weight: 700;
  color: #0b1e36;
}

.details-action-box {
  margin-top: 1.25rem;
}

.details-action-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 48px;
  background: #165dfc;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  text-decoration: none;
}

.details-action-link:hover {
  background: #0d4ed8;
}

/* Empty State */
.notif-empty-card {
  padding: 2.5rem 1.25rem;
  text-align: center;
}

.empty-icon-circle {
  width: 52px;
  height: 52px;
  margin: 0 auto 0.85rem;
  border-radius: 14px;
  background: #eff6ff;
  color: #165dfc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0b1e36;
  margin: 0;
}

.empty-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.4rem auto 0;
  max-width: 300px;
  line-height: 1.45;
}
</style>

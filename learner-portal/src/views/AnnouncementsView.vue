<template>
  <div class="notifications-page">
    <!-- View 1: Notification Details View -->
    <div v-if="selectedNotification" class="notification-details-container">
      <button
        type="button"
        class="back-btn"
        @click="closeDetails"
        aria-label="Back to Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back to Notifications</span>
      </button>

      <div class="learner-card notification-details-card">
        <!-- 1. ANNOUNCEMENT Badge -->
        <div class="details-badge-row">
          <span class="details-type-tag" :class="'type-' + (selectedNotification.type || 'ANNOUNCEMENT').toLowerCase()">
            {{ formatType(selectedNotification.type) }}
          </span>
        </div>

        <!-- 2. Title -->
        <h1 class="details-title">
          {{ selectedNotification.title }}
        </h1>

        <!-- 3. Description -->
        <div class="details-description">
          {{ selectedNotification.message || selectedNotification.content }}
        </div>

        <!-- 4. Divider -->
        <div class="details-divider"></div>

        <!-- 5. From & 6. Date Posted -->
        <div class="details-meta-footer">
          <div class="meta-row">
            <span class="meta-label">From:</span>
            <span class="meta-value">{{ selectedNotification.sender || 'ALS Administrator' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Date Posted:</span>
            <span class="meta-value">{{ formatFullDate(selectedNotification.createdAt || selectedNotification.datePosted) }}</span>
          </div>
        </div>

        <!-- Optional action link if module, schedule, or assessment -->
        <div
          v-if="selectedNotification.actionUrl && selectedNotification.actionUrl !== '/notifications' && selectedNotification.actionUrl !== '/announcements'"
          class="details-action-box"
        >
          <router-link :to="selectedNotification.actionUrl" class="details-action-link">
            <span>Open Related {{ formatType(selectedNotification.type) }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </router-link>
        </div>
      </div>
    </div>

    <!-- View 2: Notifications List View -->
    <div v-else class="notifications-list-container">
      <h1 class="page-title">Notifications</h1>
      <p class="page-subtitle">View important updates about your modules, learning activities, and schedules.</p>

      <!-- Loading State -->
      <div v-if="loading" class="learner-card notif-loading-card">
        <div class="loading-spinner"></div>
        <p>Loading notifications...</p>
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
          :aria-label="item.title"
          @keydown.enter="openDetails(item)"
          @keydown.space.prevent="openDetails(item)"
        >
          <!-- Left Icon -->
          <div
            class="notif-icon-wrapper"
            :style="{ background: item.iconBg, color: item.iconColor }"
          >
            <!-- Bell for announcement -->
            <svg v-if="(item.type || 'ANNOUNCEMENT').toUpperCase() === 'ANNOUNCEMENT'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <!-- Book for module -->
            <svg v-else-if="(item.type || '').toUpperCase() === 'MODULE'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <!-- Calendar for schedule -->
            <svg v-else-if="(item.type || '').toUpperCase() === 'SCHEDULE'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <!-- Clock/alert for reminder -->
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>

          <!-- Middle Content -->
          <div class="notif-content-wrapper">
            <div class="notif-header-line">
              <div class="notif-title-group">
                <span v-if="!item.isRead" class="notif-unread-dot" title="Unread notification"></span>
                <h2 class="notif-card-title">{{ item.title }}</h2>
              </div>
              <span class="notif-card-time">{{ getRelativeTime(item) }}</span>
            </div>

            <p class="notif-card-preview">
              {{ item.message || item.content }}
            </p>

            <div class="notif-card-footer">
              <span class="notif-card-sender">From: {{ item.sender || item.createdBy || item.author || 'ALS System' }}</span>
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
        <h3 class="empty-title">No notifications yet</h3>
        <p class="empty-desc">
          Important updates about your modules, learning activities, and schedules will appear here.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotifications } from '../composables/useNotifications.js';

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

// Style mappings for notification types
function getTypeStyle(type) {
  const t = String(type || '').toUpperCase();
  if (t === 'MODULE') {
    return { iconBg: '#ecfdf5', iconColor: '#059669' };
  }
  if (t === 'REMINDER') {
    return { iconBg: '#fffbeb', iconColor: '#d97706' };
  }
  if (t === 'SCHEDULE') {
    return { iconBg: '#f5f3ff', iconColor: '#7c3aed' };
  }
  return { iconBg: '#eff6ff', iconColor: '#165dfc' };
}

function formatType(type) {
  const t = String(type || '').toUpperCase();
  if (t === 'MODULE') return 'Module';
  if (t === 'REMINDER') return 'Reminder';
  if (t === 'SCHEDULE') return 'Schedule';
  return 'Announcement';
}

function formatDateShort(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getRelativeTime(item) {
  if (item?.relativeTime) return item.relativeTime;
  const rawDate = item?.createdAt || item?.datePosted;
  if (!rawDate) return '';
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate);

  const diffMs = Date.now() - d.getTime();
  if (diffMs >= -120 * 1000 && diffMs < 60 * 1000) return 'Just now';
  if (diffMs < -120 * 1000) return formatDateShort(d);

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateShort(d);
}

function formatFullDate(val) {
  if (!val) return 'Recently';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  try {
    const datePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(d);

    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return `${datePart} at ${timePart}`;
  } catch (_e) {
    return d.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

// Map notifications directly from backend (single source of truth)
const items = computed(() => {
  if (!Array.isArray(notifications.value)) return [];
  return notifications.value.map((n) => {
    const styles = getTypeStyle(n.type);
    return {
      ...n,
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

  // Modules and module deadline reminders navigate directly to the module
  if (item.actionUrl && item.actionUrl !== '/notifications' && item.actionUrl !== '/announcements') {
    router.push(item.actionUrl);
    return;
  }

  // Announcements open the dedicated announcement details view
  savedScrollY.value = window.scrollY || window.pageYOffset || 0;
  selectedNotification.value = item;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function closeDetails() {
  selectedNotification.value = null;

  // Clear query if id or key was in URL
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
}

/* Page Header */
.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 0.35rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1.25rem 0;
  line-height: 1.5;
}

/* Common Card Base */
.learner-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
}

/* Loading State */
.notif-loading-card {
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
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
  gap: 0.85rem;
  width: 100%;
}

/* Notification Item Card */
.notif-card-item {
  display: flex;
  align-items: flex-start;
  gap: 0.95rem;
  padding: 1.15rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  user-select: none;
  touch-action: manipulation;
  min-height: 64px;
}

.notif-card-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.05);
}

.notif-card-item:active {
  transform: scale(0.995);
}

/* Unread Card Subtle Styling */
.notif-card-item.is-unread {
  background: #ffffff;
  border-color: #bfdbfe;
  box-shadow: 0 2px 8px rgba(22, 93, 252, 0.06);
}

.notif-card-item.is-read {
  background: #ffffff;
  border-color: #e2e8f0;
  opacity: 0.94;
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
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #165dfc;
  flex-shrink: 0;
}

.notif-card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  margin: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.is-unread .notif-card-title {
  font-weight: 800;
  color: #0b1f3a;
}

.notif-card-time {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

/* Preview Clamped to 2 lines */
.notif-card-preview {
  font-size: 0.825rem;
  color: #475569;
  margin: 0.35rem 0 0 0;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.is-read .notif-card-preview {
  color: #64748b;
}

/* Card Footer */
.notif-card-footer {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.notif-card-sender {
  font-weight: 500;
  color: #64748b;
}

/* Chevron */
.notif-chevron-wrapper {
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  flex-shrink: 0;
  padding-left: 0.25rem;
}

/* Details View */
.notification-details-container {
  width: 100%;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: #165dfc;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.5rem 0.25rem;
  margin-bottom: 0.85rem;
  border-radius: 8px;
  touch-action: manipulation;
  transition: color 0.15s ease, transform 0.15s ease;
}

.back-btn:hover {
  color: #0b4bd8;
  transform: translateX(-2px);
}

.notification-details-card {
  padding: 1.5rem;
}

.details-badge-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.details-type-tag {
  display: inline-block;
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.details-type-tag.type-announcement {
  background: #eff6ff;
  color: #165dfc;
}

.details-type-tag.type-module {
  background: #ecfdf5;
  color: #059669;
}

.details-type-tag.type-reminder {
  background: #fffbeb;
  color: #d97706;
}

.details-type-tag.type-schedule {
  background: #f5f3ff;
  color: #7c3aed;
}

.details-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
  margin: 0 0 0.85rem 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.details-description {
  font-size: 0.95rem;
  line-height: 1.65;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  margin: 0;
}

.details-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 1.25rem 0;
}

.details-meta-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  flex-wrap: wrap;
}

.meta-label {
  font-weight: 500;
  color: #64748b;
}

.meta-value {
  font-weight: 700;
  color: #0f172a;
}

.details-action-box {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px dashed #e2e8f0;
}

.details-action-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #165dfc;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 0.65rem 1.15rem;
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.15s ease;
}

.details-action-link:hover {
  background: #0b4bd8;
}

/* Empty State */
.notif-empty-card {
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-icon-circle {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  border-radius: 16px;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: #334155;
  margin: 0;
}

.empty-desc {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0.4rem auto 0 auto;
  max-width: 320px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .notif-card-item {
    padding: 1rem;
    gap: 0.75rem;
  }
  .notif-icon-wrapper {
    width: 40px;
    height: 40px;
  }
  .notification-details-card {
    padding: 1.15rem;
  }
  .details-title {
    font-size: 1.15rem;
  }
  .details-description {
    font-size: 0.9rem;
    line-height: 1.6;
  }
  .meta-row {
    font-size: 0.85rem;
  }
}
</style>

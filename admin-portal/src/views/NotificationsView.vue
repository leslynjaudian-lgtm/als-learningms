<template>
  <div class="page-container notifications-page">
    <!-- Standardized Page Header -->
    <PageHeader
      title="Notifications"
      description="View important updates, reminders, and activities relevant to you."
      :breadcrumbs="[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Notifications' },
      ]"
    >
      <template #actions>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="btn btn-mark-all"
          @click="handleMarkAllRead"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Mark all as read</span>
        </button>
      </template>
    </PageHeader>

    <!-- Controls Row: Search (Left) & Filter Tabs (Right) -->
    <div class="notif-controls-card">
      <div class="notif-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="notif-search-input"
          placeholder="Search notifications..."
        />
        <button
          v-if="searchQuery"
          type="button"
          class="clear-search-btn"
          @click="searchQuery = ''"
          aria-label="Clear search"
        >
          &times;
        </button>
      </div>

      <div class="notif-tabs">
        <button
          type="button"
          class="notif-tab"
          :class="{ active: currentTab === 'all' }"
          @click="currentTab = 'all'"
        >
          <span>All</span>
          <span class="tab-count">{{ notifications.length }}</span>
        </button>
        <button
          type="button"
          class="notif-tab"
          :class="{ active: currentTab === 'unread' }"
          @click="currentTab = 'unread'"
        >
          <span>Unread</span>
          <span class="tab-count" :class="{ 'tab-unread-active': unreadCount > 0 }">{{ unreadCount }}</span>
        </button>
        <button
          type="button"
          class="notif-tab"
          :class="{ active: currentTab === 'read' }"
          @click="currentTab = 'read'"
        >
          <span>Read</span>
          <span class="tab-count">{{ readCount }}</span>
        </button>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="notif-list-container">
      <!-- Empty State -->
      <div v-if="filteredNotifications.length === 0" class="notif-empty-card">
        <div class="empty-icon-circle">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3 class="empty-title">
          {{ currentTab === 'unread' ? 'No unread notifications' : 'No notifications found' }}
        </h3>
        <p class="empty-desc">
          {{ currentTab === 'unread' ? 'You are all caught up! There are no unread notifications.' : (searchQuery ? 'Try adjusting your search keywords.' : 'You have no notifications at this time.') }}
        </p>
      </div>

      <!-- Notification Cards -->
      <div
        v-for="item in filteredNotifications"
        :key="item.notificationKey"
        class="notif-card"
        :class="{ 'is-unread': !item.isRead, 'is-clickable': !!item.actionUrl }"
        @click="handleCardClick(item)"
      >
        <div class="notif-card-header">
          <div class="notif-card-badges">
            <span class="notif-type-badge" :class="'type-' + (item.type || 'REMINDER').toLowerCase()">
              {{ formatNotifType(item.type) }}
            </span>
            <span v-if="!item.isRead" class="unread-indicator-badge">New</span>
          </div>

          <div class="notif-card-time-group">
            <span class="notif-card-rel-time">{{ item.relativeTime }}</span>
            <span v-if="item.createdAt" class="time-sep">•</span>
            <span v-if="item.createdAt" class="notif-card-full-time">{{ formatFullDate(item.createdAt) }}</span>
          </div>
        </div>

        <div class="notif-card-body">
          <div class="notif-card-title-row">
            <span v-if="!item.isRead" class="card-unread-dot"></span>
            <h4 class="notif-card-title">{{ item.title }}</h4>
          </div>
          <p v-if="item.message" class="notif-card-message">{{ item.message }}</p>
          <div v-if="item.scheduleTime" class="notif-card-schedule-time">
            <span class="sched-label">Schedule:</span>
            <span class="sched-value">{{ item.scheduleTime }}</span>
          </div>
        </div>

        <div class="notif-card-footer">
          <div class="notif-card-sender">
            <span class="sender-label">From:</span>
            <span class="sender-name">{{ item.sender || 'System' }}</span>
          </div>

          <div class="notif-card-actions" @click.stop>
            <button
              v-if="!item.isRead"
              type="button"
              class="btn-card-read"
              @click.stop="handleMarkSingleRead(item)"
            >
              Mark as read
            </button>
            <button
              v-if="item.actionUrl"
              type="button"
              class="btn-card-navigate"
              @click.stop="handleCardClick(item)"
            >
              <span>View Details</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import { useNotifications } from '../composables/useNotifications.js';

const router = useRouter();
const {
  notifications,
  unreadCount,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} = useNotifications();

const currentTab = ref('all');
const searchQuery = ref('');

const readCount = computed(() => {
  return notifications.value.filter((n) => n.isRead).length;
});

const filteredNotifications = computed(() => {
  let list = notifications.value || [];
  if (currentTab.value === 'unread') {
    list = list.filter((n) => !n.isRead);
  } else if (currentTab.value === 'read') {
    list = list.filter((n) => n.isRead);
  }

  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((n) => {
      const title = (n.title || '').toLowerCase();
      const msg = (n.message || '').toLowerCase();
      const sender = (n.sender || '').toLowerCase();
      const type = (n.type || '').toLowerCase();
      return title.includes(q) || msg.includes(q) || sender.includes(q) || type.includes(q);
    });
  }

  return list;
});

function formatNotifType(type) {
  const t = String(type || '').toUpperCase();
  if (t === 'RECORD') return 'Record';
  if (t === 'SCHEDULE') return 'Schedule';
  if (t === 'REMINDER') return 'Reminder';
  if (t === 'ANNOUNCEMENT') return 'Announcement';
  if (t === 'LEARNER') return 'Learner';
  if (t === 'ASSIGNMENT') return 'Assignment';
  if (t === 'CENTER') return 'Center';
  if (t === 'SUBMISSION') return 'Submission';
  if (t === 'MODULE') return 'Module';
  return t ? t.charAt(0) + t.slice(1).toLowerCase() : 'Notification';
}

function formatFullDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

async function handleMarkSingleRead(item) {
  if (!item || item.isRead) return;
  await markAsRead(item.notificationKey);
  window.dispatchEvent(new CustomEvent('als-notifications-updated'));
}

async function handleMarkAllRead() {
  await markAllAsRead();
  window.dispatchEvent(new CustomEvent('als-notifications-updated'));
}

async function handleCardClick(item) {
  if (!item) return;
  if (!item.isRead) {
    await markAsRead(item.notificationKey);
    window.dispatchEvent(new CustomEvent('als-notifications-updated'));
  }
  if (item.actionUrl) {
    router.push(item.actionUrl);
  }
}

onMounted(() => {
  fetchNotifications();
});
</script>

<style scoped>
.notifications-page {
  padding-bottom: 2rem;
}

.btn-mark-all {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-mark-all:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.notif-controls-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.85rem 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.notif-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notif-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.notif-tab:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.notif-tab.active {
  background: #2563eb;
  color: #ffffff;
}

.tab-count {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  color: inherit;
}

.notif-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.tab-unread-active {
  background: #fee2e2;
  color: #dc2626;
}

.notif-tab.active .tab-unread-active {
  background: #fee2e2;
  color: #dc2626;
}

.notif-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 260px;
}

.notif-search-wrap svg {
  position: absolute;
  left: 10px;
  color: #94a3b8;
  pointer-events: none;
}

.notif-search-input {
  width: 100%;
  height: 38px;
  padding: 0 32px 0 34px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.notif-search-input:focus {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
}

.clear-search-btn:hover {
  color: #0f172a;
}

.notif-list-container {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.notif-empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 3.5rem 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.empty-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f0fdf4;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem 0;
}

.empty-desc {
  font-size: 0.88rem;
  color: #64748b;
  margin: 0;
  max-width: 420px;
}

.notif-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.15rem 1.35rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.15s ease;
}

.notif-card.is-clickable {
  cursor: pointer;
}

.notif-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.notif-card.is-unread {
  background: #f0f7ff;
  border-color: #bfdbfe;
}

.notif-card.is-unread:hover {
  background: #e2eeff;
  border-color: #93c5fd;
}

.notif-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.notif-card-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notif-type-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  background: #e2e8f0;
  color: #334155;
  letter-spacing: 0.03em;
}

.notif-type-badge.type-announcement {
  background: #dbeafe;
  color: #1e40af;
}

.notif-type-badge.type-reminder {
  background: #fef3c7;
  color: #92400e;
}

.notif-type-badge.type-schedule {
  background: #dcfce7;
  color: #166534;
}

.notif-type-badge.type-record {
  background: #f3e8ff;
  color: #6b21a8;
}

.notif-type-badge.type-submission {
  background: #e0f2fe;
  color: #0369a1;
}

.notif-type-badge.type-module {
  background: #ecfdf5;
  color: #047857;
}

.notif-type-badge.type-learner {
  background: #e0f2fe;
  color: #0369a1;
}

.notif-type-badge.type-assignment {
  background: #fef3c7;
  color: #92400e;
}

.notif-type-badge.type-center {
  background: #ede9fe;
  color: #5b21b6;
}

.notif-important-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  background: #fee2e2;
  color: #b91c1c;
  letter-spacing: 0.03em;
}

.unread-indicator-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 7px;
  border-radius: 6px;
  background: #2563eb;
  color: #ffffff;
  letter-spacing: 0.03em;
}

.notif-card-time-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #64748b;
}

.time-sep {
  color: #cbd5e1;
}

.notif-card-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.card-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
  flex-shrink: 0;
}

.notif-card-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.35;
}

.notif-card-message {
  font-size: 0.88rem;
  color: #334155;
  margin: 0 0 0.85rem 0;
  line-height: 1.5;
}

.notif-card-schedule-time {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 0.85rem 0;
  line-height: 1.5;
}

.notif-card-schedule-time .sched-label {
  font-weight: 600;
  color: #475569;
  margin-right: 0.25rem;
}

.notif-card-schedule-time .sched-value {
  font-weight: 400;
  color: #64748b;
}

.notif-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.notif-card-sender {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #64748b;
}

.sender-name {
  font-weight: 600;
  color: #334155;
}

.notif-card-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.btn-card-read {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-card-read:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-card-navigate {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-card-navigate:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

@media (max-width: 640px) {
  .notif-controls-card {
    flex-direction: column;
    align-items: stretch;
  }
  .notif-search-wrap {
    min-width: 100%;
  }
}
</style>


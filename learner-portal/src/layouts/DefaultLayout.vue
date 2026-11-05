<template>
  <div class="app-shell">
    <!-- Top Header (Screen 2, 3, 5, 6, 7 standard) -->
    <header class="app-header">
      <div class="header-brand">
        <img src="/logo.png" alt="ALS Seal" class="header-seal-img" />
        <div class="header-titles">
          <span class="header-title-main">ALS LMS</span>
          <span class="header-title-sub">Naawan District</span>
        </div>
      </div>
      <div class="header-actions" ref="notifContainerRef">
        <button
          type="button"
          class="header-icon-btn notification-bell"
          :class="{ 'is-shaking': shouldAnimateBell }"
          title="Notifications"
          aria-label="Notifications"
          :aria-expanded="notifPanelOpen"
          @click.stop="toggleNotifPanel"
        >
          <svg
            :class="['bell-icon', { 'bell-electric-shake': shouldAnimateBell }]"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span v-if="unreadCount > 0" class="header-notif-dot"></span>
        </button>

        <!-- Notification Dropdown Panel -->
        <div v-if="notifPanelOpen" class="notif-dropdown-panel" @click.stop>
          <div class="notif-panel-header">
            <div class="notif-panel-title-wrap">
              <span class="notif-panel-title">Notifications</span>
              <span v-if="unreadCount > 0" class="notif-unread-pill">{{ unreadCount }} new</span>
            </div>
            <div class="notif-panel-actions">
              <button
                v-if="unreadCount > 0"
                type="button"
                class="notif-mark-all-btn"
                @click="handleMarkAllRead"
              >
                Mark all read
              </button>
            </div>
          </div>

          <div class="notif-panel-body">
            <div v-if="notifications.length === 0" class="notif-empty-state">
              No notifications yet.
            </div>
            <div
              v-for="item in notifications"
              :key="item.notificationKey"
              class="notif-item"
              :class="{ 'is-unread': !item.isRead, 'is-important': item.isImportant && !item.isRead }"
              @click="handleNotificationClick(item)"
            >
              <div class="notif-item-top">
                <div class="notif-badges">
                  <span class="notif-type-badge" :class="'type-' + (item.type || 'ANNOUNCEMENT').toLowerCase()">
                    {{ formatNotifType(item.type) }}
                  </span>
                  <span v-if="item.isImportant" class="notif-important-badge">Important</span>
                </div>
                <span class="notif-time">{{ item.relativeTime }}</span>
              </div>
              <div class="notif-item-title-row">
                <span v-if="!item.isRead" class="notif-unread-dot"></span>
                <span class="notif-item-title">{{ item.title }}</span>
              </div>
              <p class="notif-item-message">{{ item.message }}</p>
              <div class="notif-item-footer">
                <span class="notif-sender">{{ item.sender }}</span>
                <button
                  v-if="!item.isRead"
                  type="button"
                  class="notif-item-read-btn"
                  @click.stop="markAsRead(item.notificationKey)"
                >
                  Mark as read
                </button>
              </div>
            </div>
          </div>

          <div class="notif-panel-footer">
            <router-link to="/announcements" class="notif-view-all-link" @click="notifPanelOpen = false">
              View All Announcements &amp; Schedules
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Scrollable Main View -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- Bottom 5-Tab Navigation -->
    <nav class="bottom-nav">
      <router-link to="/home" class="bottom-tab-item" :class="{ active: isCurrentRoute('/home') }" exact>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </router-link>

      <router-link to="/modules" class="bottom-tab-item" :class="{ active: isCurrentRoute('/modules') }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span>Modules</span>
      </router-link>

      <router-link to="/progress" class="bottom-tab-item" :class="{ active: isCurrentRoute('/progress') }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
        <span>Progress</span>
      </router-link>

      <button type="button" class="bottom-tab-item" @click="drawerOpen = true" aria-label="Open More Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="12" cy="5" r="1"/>
          <circle cx="12" cy="19" r="1"/>
        </svg>
        <span>More</span>
      </button>
    </nav>

    <!-- Screen 9: Side Drawer Menu -->
    <div v-if="drawerOpen" class="drawer-backdrop" @click="drawerOpen = false"></div>
    <div v-if="drawerOpen" class="drawer-panel">
      <div>
        <div class="drawer-header">
          <button class="drawer-close-btn" @click="drawerOpen = false" aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <img src="/logo.png" alt="ALS Seal" class="drawer-seal-img" />
          <div class="drawer-brand-title">ALS LMS</div>
          <div class="drawer-brand-district">NAAWAN DISTRICT</div>
        </div>

        <nav class="drawer-nav">
          <router-link to="/home" class="drawer-nav-item" :class="{ active: $route.path === '/home' }" @click="drawerOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </router-link>

          <router-link to="/modules" class="drawer-nav-item" :class="{ active: $route.path.startsWith('/modules') }" @click="drawerOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>My Modules</span>
          </router-link>

          <router-link to="/progress" class="drawer-nav-item" :class="{ active: $route.path.startsWith('/progress') }" @click="drawerOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            <span>My Progress</span>
          </router-link>

          <router-link to="/announcements" class="drawer-nav-item" :class="{ active: $route.path.startsWith('/announcements') }" @click="drawerOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span>Announcements</span>
          </router-link>

          <router-link to="/profile" class="drawer-nav-item" :class="{ active: $route.path.startsWith('/profile') }" @click="drawerOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>My Profile</span>
          </router-link>

          <button type="button" class="drawer-nav-item item-logout" @click="triggerLogout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Signout</span>
          </button>
        </nav>
      </div>

      <div class="drawer-footer-tag">
        <div>LEARN.</div>
        <div>EXPLORE.</div>
        <div>ACHIEVE.</div>
      </div>
    </div>

    <!-- Screen 10: Signout Confirmation Modal -->
    <div v-if="logoutModalOpen" class="modal-overlay" @click.self="logoutModalOpen = false">
      <div class="logout-modal-card">
        <div class="logout-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>
        <h2 class="logout-title">Signout</h2>
        <p class="logout-desc">Are you sure you want to signout?</p>

        <button type="button" class="btn-logout-confirm" @click="confirmLogout">
          Yes, Signout
        </button>
        <button type="button" class="btn-logout-cancel" @click="logoutModalOpen = false">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotifications } from '../composables/useNotifications.js';

const route = useRoute();
const router = useRouter();

const drawerOpen = ref(false);
const logoutModalOpen = ref(false);
const notifPanelOpen = ref(false);
const notifContainerRef = ref(null);

const {
  notifications,
  unreadCount,
  shouldAnimateBell,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  clearNotificationsState,
} = useNotifications();

let pollTimer = null;

function isCurrentRoute(path) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}

function toggleNotifPanel() {
  notifPanelOpen.value = !notifPanelOpen.value;
}

function formatNotifType(type) {
  const t = String(type || 'ANNOUNCEMENT').toUpperCase();
  if (t === 'SCHEDULE') return 'Schedule';
  if (t === 'REMINDER') return 'Reminder';
  return 'Announcement';
}

async function handleNotificationClick(item) {
  if (item && !item.isRead) {
    await markAsRead(item.notificationKey);
  }
  notifPanelOpen.value = false;
  const targetUrl = item?.actionUrl || '/announcements';
  if (route.path !== targetUrl) {
    router.push(targetUrl);
  }
}

async function handleMarkAllRead() {
  await markAllAsRead();
}

function handleDocumentClick(e) {
  if (notifPanelOpen.value && notifContainerRef.value && !notifContainerRef.value.contains(e.target)) {
    notifPanelOpen.value = false;
  }
}

function handleWindowFocus() {
  fetchNotifications();
}

watch(
  () => route.fullPath,
  () => {
    notifPanelOpen.value = false;
    fetchNotifications();
  }
);

onMounted(() => {
  fetchNotifications();
  pollTimer = setInterval(fetchNotifications, 15000);
  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('focus', handleWindowFocus);
  window.addEventListener('als-notifications-updated', handleWindowFocus);
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('focus', handleWindowFocus);
  window.removeEventListener('als-notifications-updated', handleWindowFocus);
});

function triggerLogout() {
  drawerOpen.value = false;
  logoutModalOpen.value = true;
}

function confirmLogout() {
  logoutModalOpen.value = false;
  notifPanelOpen.value = false;
  clearNotificationsState();
  localStorage.removeItem('als_learner_authenticated');
  localStorage.removeItem('als_learner_user');
  localStorage.removeItem('als_learner_token');
  router.push({ name: 'Login' });
}
</script>

<style scoped>
.header-actions {
  position: relative;
}

.bell-icon {
  display: block;
  transform-box: fill-box;
  transform-origin: 50% 15%;
}

.notification-bell.is-shaking svg,
.bell-icon.bell-electric-shake {
  transform-origin: 50% 15%;
  animation: electricBellShake 0.3s ease-in-out infinite;
  will-change: transform;
}

@keyframes electricBellShake {
  0%, 100% {
    transform: rotate(0deg);
  }
  15% {
    transform: rotate(-8deg);
  }
  30% {
    transform: rotate(8deg);
  }
  45% {
    transform: rotate(-7deg);
  }
  60% {
    transform: rotate(7deg);
  }
  75% {
    transform: rotate(-5deg);
  }
  90% {
    transform: rotate(5deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .notification-bell.is-shaking svg,
  .bell-icon.bell-electric-shake {
    animation: none;
  }
}

.notif-dropdown-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(340px, calc(100vw - 24px));
  max-height: 440px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  display: flex;
  flex-direction: column;
  z-index: 1200;
  overflow: hidden;
  color: #1e293b;
}

.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.notif-panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-panel-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.notif-unread-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: #fee2e2;
  color: #dc2626;
}

.notif-mark-all-btn {
  background: transparent;
  border: none;
  color: #1d4ed8;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 4px;
}

.notif-mark-all-btn:hover {
  text-decoration: underline;
}

.notif-panel-body {
  overflow-y: auto;
  max-height: 330px;
  divide-y: 1px solid #f1f5f9;
}

.notif-empty-state {
  padding: 28px 16px;
  text-align: center;
  font-size: 0.84rem;
  color: #64748b;
}

.notif-item {
  padding: 11px 14px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-item.is-unread {
  background: #eff6ff;
}

.notif-item.is-unread:hover {
  background: #dbeafe;
}

.notif-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 4px;
}

.notif-badges {
  display: flex;
  align-items: center;
  gap: 5px;
}

.notif-type-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: #e2e8f0;
  color: #334155;
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

.notif-important-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: #fee2e2;
  color: #b91c1c;
}

.notif-time {
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
}

.notif-item-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.notif-unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2563eb;
  flex-shrink: 0;
}

.notif-item-title {
  font-size: 0.83rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.notif-item-message {
  font-size: 0.76rem;
  color: #475569;
  margin: 0 0 6px 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.notif-sender {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
}

.notif-item-read-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 0.68rem;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
}

.notif-item-read-btn:hover {
  background: #f1f5f9;
}

.notif-panel-footer {
  padding: 9px 14px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  text-align: center;
}

.notif-view-all-link {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1d4ed8;
  text-decoration: none;
}

.notif-view-all-link:hover {
  text-decoration: underline;
}
</style>

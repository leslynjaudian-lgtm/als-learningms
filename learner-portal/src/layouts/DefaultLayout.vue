<template>
  <div class="app-shell">
    <!-- Top Header (Screen 2, 3, 5, 6, 7 standard) -->
    <header class="app-header">
      <div class="header-brand">
        <img src="/logo.png" alt="ALS Naawan District Logo" class="header-seal-img" />
        <div class="header-titles">
          <span class="header-title-main">ALS LMS</span>
          <span class="header-title-sub">Naawan District</span>
        </div>
      </div>
      <div class="header-actions">
        <!-- Notification Bell Wrapper -->
        <div class="notif-wrapper" ref="notifContainerRef">
          <button
            type="button"
            class="header-icon-btn notification-bell"
            :class="{ 'is-shaking': shouldAnimateBell }"
            title="Mga Pahibalo"
            :aria-label="unreadCount > 0 ? `Mga Pahibalo (${unreadCount} wala pa mabasa)` : 'Mga Pahibalo'"
            :aria-expanded="notifPanelOpen"
            @click.stop="toggleNotifPanel"
          >
            <svg
              :class="['bell-icon', { 'bell-ringing': shouldAnimateBell }]"
              width="24"
              height="24"
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
            <span
              v-if="unreadCount > 0"
              class="header-notif-badge"
              :class="{ 'is-wide': unreadCount >= 10 }"
              aria-hidden="true"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <!-- Notification Dropdown Panel -->
          <div v-if="notifPanelOpen" class="notif-dropdown-panel" @click.stop>
            <div class="notif-panel-header">
              <div class="notif-panel-title-wrap">
                <span class="notif-panel-title">Mga Pahibalo</span>
                <span v-if="unreadCount > 0" class="notif-unread-pill">{{ unreadCount }} bag-o</span>
              </div>
              <div class="notif-panel-actions">
                <button
                  v-if="unreadCount > 0"
                  type="button"
                  class="notif-mark-all-btn"
                  @click="handleMarkAllRead"
                >
                  Markahan tanan
                </button>
                <button
                  type="button"
                  class="notif-close-btn"
                  aria-label="Sirado"
                  @click="notifPanelOpen = false"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="notif-panel-body">
              <div v-if="notifications.length === 0" class="notif-empty-state">
                <div class="notif-empty-icon-wrap">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div class="notif-empty-title">Walay Bag-ong Pahibalo</div>
                <p class="notif-empty-desc">Wala kay bag-ong pahibalo karon.</p>
              </div>

              <div
                v-for="item in notifications"
                :key="item.notificationKey"
                class="notif-item"
                :class="{ 'is-unread': !item.isRead }"
                role="button"
                tabindex="0"
                @click="handleNotificationClick(item)"
                @keydown.enter="handleNotificationClick(item)"
              >
                <div
                  class="notif-item-icon"
                  :style="{
                    background: getNotificationTypeStyle(getNotificationVisualType(item)).iconBg,
                    color: getNotificationTypeStyle(getNotificationVisualType(item)).iconColor
                  }"
                  aria-hidden="true"
                >
                  <svg v-if="getNotificationVisualType(item) === 'module'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  <svg v-else-if="getNotificationVisualType(item) === 'schedule'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <svg v-else-if="getNotificationVisualType(item) === 'submission'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <svg v-else-if="getNotificationVisualType(item) === 'reminder'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>

                <div class="notif-item-body">
                  <div class="notif-item-top">
                    <div class="notif-item-title-row">
                      <span v-if="!item.isRead" class="notif-unread-dot"></span>
                      <span class="notif-item-title">{{ getNotificationDisplayTitle(item) }}</span>
                    </div>
                    <span class="notif-time">{{ getNotificationRelativeTime(item) }}</span>
                  </div>
                  <div v-if="getNotificationAnnouncementTitle(item)" class="notif-item-announcement-title">
                    {{ getNotificationAnnouncementTitle(item) }}
                  </div>
                  <p class="notif-item-message">{{ getNotificationDisplayMessage(item) }}</p>
                  <div v-if="getNotificationRelevantSender(item)" class="notif-item-sender">
                    Gikan kang {{ getNotificationRelevantSender(item) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="notif-panel-footer">
              <router-link to="/notifications" class="notif-view-all-link" @click="notifPanelOpen = false">
                Tan-awa ang Tanang Pahibalo
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Scrollable Main View -->
    <main class="app-main" ref="mainContentRef">
      <router-view />
    </main>

    <!-- Bottom 5-Tab Navigation -->
    <nav class="bottom-nav">
      <router-link to="/home" class="bottom-tab-item" :class="{ active: isHomeTabActive }" exact>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </router-link>

      <router-link to="/modules" class="bottom-tab-item" :class="{ active: isModulesTabActive }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span>Module</span>
      </router-link>

      <button
        type="button"
        class="bottom-tab-item"
        :class="{ active: isMoreTabActive }"
        @click="drawerOpen = !drawerOpen"
        aria-label="Ablihi ang Uban nga Menu"
        :aria-expanded="drawerOpen"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="12" cy="5" r="1"/>
          <circle cx="12" cy="19" r="1"/>
        </svg>
        <span>Uban</span>
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
          <div class="drawer-brand-district">Naawan District</div>
        </div>

        <nav class="drawer-nav">
          <router-link to="/home" class="drawer-nav-item" :class="{ active: isHomeRoute }" @click="drawerOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </router-link>

          <router-link to="/modules" class="drawer-nav-item" :class="{ active: isModulesRoute }" @click="drawerOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>Akong Modules</span>
          </router-link>

          <router-link to="/notifications" class="drawer-nav-item" :class="{ active: isNotificationsRoute }" @click="drawerOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span>Mga Pahibalo</span>
          </router-link>

          <router-link to="/profile" class="drawer-nav-item" :class="{ active: isProfileRoute }" @click="drawerOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Akong Profile</span>
          </router-link>

          <router-link to="/help" class="drawer-nav-item" :class="{ active: isHelpRoute }" @click="drawerOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Tabang / Giya</span>
          </router-link>

          <button type="button" class="drawer-nav-item item-logout" @click="triggerLogout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Sign Out</span>
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
        <h2 class="logout-title">Sign Out</h2>
        <p class="logout-desc">Sigurado ka nga gusto ka mag-sign out sa imong account?</p>

        <button type="button" class="btn-logout-confirm" @click="confirmLogout">
          Oo, mag-sign out ko
        </button>
        <button type="button" class="btn-logout-cancel" @click="logoutModalOpen = false">
          Dili, Balik Lang
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotifications } from '../composables/useNotifications.js';
import { clearLearnerSessionStorage } from '../utils/learnerStorage.js';
import {
  getNotificationVisualType,
  getNotificationTypeStyle,
  getNotificationDisplayTitle,
  getNotificationAnnouncementTitle,
  getNotificationDisplayMessage,
  getNotificationRelevantSender,
  getNotificationRelativeTime,
} from '../utils/notificationFormat.js';

const route = useRoute();
const router = useRouter();

const drawerOpen = ref(false);
const logoutModalOpen = ref(false);
const notifPanelOpen = ref(false);
const notifContainerRef = ref(null);
const mainContentRef = ref(null);

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

// Route grouping for Navigation Active States
const isHomeRoute = computed(() => {
  const p = route.path || '';
  const n = route.name || '';
  return p === '/home' || n === 'Dashboard';
});

const isModulesRoute = computed(() => {
  const p = route.path || '';
  const n = route.name || '';
  return p.startsWith('/modules') || n === 'MyModules' || n === 'ModuleDetail';
});

const isNotificationsRoute = computed(() => {
  const p = route.path || '';
  const n = route.name || '';
  return (
    p.startsWith('/notifications') ||
    p.startsWith('/announcements') ||
    n === 'Notifications'
  );
});

const isProfileRoute = computed(() => {
  const p = route.path || '';
  const n = route.name || '';
  return p.startsWith('/profile') || n === 'Profile';
});

const isHelpRoute = computed(() => {
  const p = route.path || '';
  const n = route.name || '';
  return p.startsWith('/help') || n === 'Help';
});

const isMoreRoute = computed(() => {
  return isNotificationsRoute.value || isProfileRoute.value || isHelpRoute.value;
});

// Bottom navigation active states (strictly mutually exclusive: only one item active at a time)
const isMoreTabActive = computed(() => {
  return drawerOpen.value || isMoreRoute.value;
});

const isHomeTabActive = computed(() => {
  if (drawerOpen.value) return false;
  return isHomeRoute.value && !isMoreRoute.value;
});

const isModulesTabActive = computed(() => {
  if (drawerOpen.value) return false;
  return isModulesRoute.value && !isMoreRoute.value;
});

function isCurrentRoute(path) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}

function toggleNotifPanel() {
  notifPanelOpen.value = !notifPanelOpen.value;
}

function formatNotifType(type) {
  const t = String(type || '').toUpperCase();
  if (t === 'MODULE') return 'Module';
  if (t === 'REMINDER') return 'Reminder';
  if (t === 'ANNOUNCEMENT') return 'Announcement';
  if (t === 'SCHEDULE') return 'Schedule';
  return t ? t.charAt(0) + t.slice(1).toLowerCase() : 'Notification';
}

async function handleNotificationClick(item) {
  if (item && !item.isRead) {
    await markAsRead(item.notificationKey);
  }
  notifPanelOpen.value = false;
  let targetUrl = item?.actionUrl;
  if (!targetUrl || targetUrl === '/announcements' || targetUrl === '/notifications') {
    targetUrl = item?.notificationKey
      ? `/notifications?key=${encodeURIComponent(item.notificationKey)}`
      : '/notifications';
  }
  if (route.fullPath !== targetUrl) {
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
    drawerOpen.value = false;
    notifPanelOpen.value = false;
    fetchNotifications();
    if (mainContentRef.value) {
      mainContentRef.value.scrollTop = 0;
    }
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
  clearLearnerSessionStorage();
  router.push({ name: 'Login' });
}
</script>

<style scoped>
/* App Header Sticky & Base Styling */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
}

/* Header Brand & Titles Alignment */
.header-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.header-seal-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  display: block;
}

.header-titles {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
  padding: 0;
}

.header-title-main {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0b1e36;
  line-height: 1.15;
  letter-spacing: -0.01em;
  margin: 0;
  padding: 0;
}

.header-title-sub {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.01em;
  text-transform: none !important;
  line-height: 1.15;
  margin: 0;
  padding: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}

.notif-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: #334155;
  transition: all 0.15s ease;
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
  line-height: 1;
}

.header-icon-btn:hover {
  background: #f1f5f9;
  color: #0b1e36;
}

.header-notif-badge {
  position: absolute;
  top: 1px;
  right: 0px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: #ef4444;
  color: #ffffff;
  border-radius: 9999px;
  border: 1.5px solid #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  pointer-events: none;
}

.header-notif-badge.is-wide {
  padding: 0 5px;
  font-size: 0.6rem;
}

.bell-icon {
  display: block;
  width: 24px;
  height: 24px;
  transform-origin: 50% 15%;
}

.notification-bell.is-shaking .bell-icon,
.bell-icon.bell-ringing {
  transform-origin: 50% 15%;
  animation: headerBellRing 1.5s ease-in-out 1;
  will-change: transform;
}

@keyframes headerBellRing {
  0% {
    transform: rotate(0deg);
  }
  10% {
    transform: rotate(14deg);
  }
  20% {
    transform: rotate(-14deg);
  }
  30% {
    transform: rotate(12deg);
  }
  40% {
    transform: rotate(-12deg);
  }
  52% {
    transform: rotate(8deg);
  }
  64% {
    transform: rotate(-8deg);
  }
  76% {
    transform: rotate(4deg);
  }
  88% {
    transform: rotate(-3deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .notification-bell.is-shaking .bell-icon,
  .bell-icon.bell-ringing {
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

.notif-panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-mark-all-btn {
  background: transparent;
  border: none;
  color: #165dfc;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 6px;
}

.notif-mark-all-btn:hover {
  text-decoration: underline;
}

.notif-close-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  background: transparent;
}

.notif-close-btn:hover {
  background: #e2e8f0;
  color: #0b1e36;
}

.notif-panel-body {
  overflow-y: auto;
  max-height: 340px;
}

.notif-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 16px;
  text-align: center;
}

.notif-empty-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f0fdf4;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.notif-empty-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0b1e36;
  margin-bottom: 4px;
}

.notif-empty-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
  min-height: 60px;
  -webkit-tap-highlight-color: transparent;
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-item.is-unread {
  background: #f8fbff;
}

.notif-item.is-unread:hover {
  background: #eff6ff;
}

.notif-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notif-item-body {
  flex: 1;
  min-width: 0;
}

.notif-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.notif-time {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

.notif-item-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.notif-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #165dfc;
  flex-shrink: 0;
}

.notif-item-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0b1e36;
  line-height: 1.3;
  word-break: break-word;
}

.notif-item.is-unread .notif-item-title {
  font-weight: 800;
}

.notif-item-announcement-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
  margin-top: 2px;
  word-break: break-word;
}

.notif-item-message {
  font-size: 0.82rem;
  color: #334155;
  margin: 2px 0 0 0;
  line-height: 1.4;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-item-sender {
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748b;
  margin-top: 4px;
}

.notif-panel-footer {
  padding: 10px 14px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  text-align: center;
}

.notif-view-all-link {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #165dfc;
  text-decoration: none;
  padding: 4px 8px;
}

.notif-view-all-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .notif-dropdown-panel {
    position: fixed;
    top: 64px;
    left: 8px;
    right: 8px;
    width: auto;
    max-height: calc(100dvh - 144px);
  }
  .notif-panel-body {
    max-height: calc(100dvh - 246px);
  }
}
</style>

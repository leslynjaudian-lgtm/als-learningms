<template>
  <div class="app-layout">
    <!-- Mobile overlay -->
    <div
      class="sidebar-overlay no-print"
      :class="{ visible: sidebarOpen }"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar no-print" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <div class="logo-brand">
          <img src="/logo.png" alt="ALS Naawan District Logo" class="seal-emblem-img" />
          <div class="logo-info">
            <span class="logo-name">ALS LMS</span>
            <span class="logo-district">Naawan District</span>
          </div>
        </div>
        <button class="sidebar-close-btn" @click="sidebarOpen = false" aria-label="Close sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Main Navigation -->
      <nav class="sidebar-nav">
        <!-- 1. Dashboard -->
        <router-link
          to="/dashboard"
          class="nav-link"
          :class="{ active: activeMenu === 'dashboard' }"
          @click="handleNavClick('dashboard')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </span>
          <span class="nav-label">Dashboard</span>
        </router-link>

        <!-- 2. Learning Centers -->
        <router-link
          to="/dashboard/learning-centers"
          class="nav-link"
          :class="{ active: activeMenu === 'learning-centers' }"
          @click="handleNavClick('learning-centers')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
          </span>
          <span class="nav-label">Learning Centers</span>
        </router-link>

        <!-- 3. ALS Teachers -->
        <router-link
          to="/dashboard/teachers"
          class="nav-link"
          :class="{ active: activeMenu === 'teachers' }"
          @click="handleNavClick('teachers')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
          </span>
          <span class="nav-label">Teachers</span>
        </router-link>

        <!-- 4. Learners -->
        <router-link
          to="/dashboard/learners"
          class="nav-link"
          :class="{ active: activeMenu === 'learners' }"
          @click="handleNavClick('learners')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </span>
          <span class="nav-label">Learners</span>
        </router-link>

        <!-- 5. Learning Areas -->
        <router-link
          to="/dashboard/learning-areas"
          class="nav-link"
          :class="{ active: activeMenu === 'learning-areas' }"
          @click="handleNavClick('learning-areas')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
          </span>
          <span class="nav-label">Learning Areas</span>
        </router-link>

        <!-- 6. Schedule -->
        <router-link
          to="/dashboard/schedule"
          class="nav-link"
          :class="{ active: activeMenu === 'schedule' }"
          @click="handleNavClick('schedule')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <span class="nav-label">Schedule</span>
        </router-link>

        <!-- 7. Announcements -->
        <router-link
          to="/dashboard/announcements"
          class="nav-link"
          :class="{ active: activeMenu === 'announcements' }"
          @click="handleNavClick('announcements')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 11 18-5v12L3 14v-3z"/>
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
            </svg>
          </span>
          <span class="nav-label">Announcements</span>
        </router-link>

        <!-- 8. Notifications -->
        <router-link
          to="/dashboard/notifications"
          class="nav-link"
          :class="{ active: activeMenu === 'notifications' }"
          @click="handleNavClick('notifications')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </span>
          <span class="nav-label">Notifications</span>
        </router-link>

        <!-- 7. Reports (Dropdown: ALS AF2 Summary, Attendance Summary, Learning Center Summary) -->
        <div class="nav-dropdown-item">
          <button
            type="button"
            class="nav-link nav-dropdown-btn"
            :class="{ active: activeMenu === 'reports', expanded: expandedMenu === 'reports' }"
            @click="handleParentClick('reports')"
            aria-haspopup="true"
            :aria-expanded="expandedMenu === 'reports'"
          >
            <span class="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
            </span>
            <span class="nav-label">Reports</span>
            <span class="nav-chevron" :class="{ rotated: expandedMenu === 'reports' }">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </button>

          <!-- Reports Submenu -->
          <transition name="dropdown">
            <div v-show="expandedMenu === 'reports'" class="nav-submenu">
              <router-link
                to="/dashboard/reports/module-progress"
                class="nav-sublink"
                :class="{ active: isCurrentRoute('/dashboard/reports/module-progress') }"
                @click="handleSublinkClick('reports')"
              >
                <span class="sublink-dot"></span>
                <span class="sublink-label">Summary of Module Use and Learner's Progress</span>
              </router-link>

              <router-link
                to="/dashboard/reports/attendance-summary"
                class="nav-sublink"
                :class="{ active: isCurrentRoute('/dashboard/reports/attendance-summary') || isCurrentRoute('/dashboard/reports/attendance') }"
                @click="handleSublinkClick('reports')"
              >
                <span class="sublink-dot"></span>
                <span class="sublink-label">Attendance Summary</span>
              </router-link>

              <router-link
                to="/dashboard/reports/learning-center-summary"
                class="nav-sublink"
                :class="{ active: isCurrentRoute('/dashboard/reports/learning-center-summary') }"
                @click="handleSublinkClick('reports')"
              >
                <span class="sublink-dot"></span>
                <span class="sublink-label">Learning Center Summary</span>
              </router-link>
            </div>
          </transition>
        </div>

        <!-- 7. Settings -->
        <router-link
          to="/dashboard/settings"
          class="nav-link"
          :class="{ active: activeMenu === 'settings' }"
          @click="handleNavClick('settings')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </span>
          <span class="nav-label">Settings</span>
        </router-link>
      </nav>

      <!-- Sidebar Bottom Links -->
      <div class="sidebar-footer">
        <a href="#signout" class="nav-link" @click.prevent="handleLogout">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span class="nav-label">Signout</span>
        </a>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-wrapper">
      <!-- Topbar Header -->
      <header class="topbar no-print">
        <div class="topbar-left">
          <button class="mobile-menu-btn" @click="sidebarOpen = true" aria-label="Open menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <GlobalSearchBar />
        </div>

        <div class="topbar-right">
          <div class="notif-wrapper" ref="notifContainerRef">
            <button
              type="button"
              class="notification-btn notification-bell"
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
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span v-if="unreadCount > 0" class="notif-badge"></span>
            </button>

            <!-- Notification Dropdown Panel -->
            <div v-if="notifPanelOpen" class="notif-dropdown-panel" @click.stop>
              <div class="notif-panel-header">
                <div class="notif-panel-title-wrap">
                  <span class="notif-panel-title">Notifications</span>
                  <template v-if="unreadCount > 0">
                    <span class="notif-header-sep">|</span>
                    <span class="notif-unread-pill">{{ unreadCount }} new</span>
                  </template>
                </div>
                <div v-if="unreadCount > 0" class="notif-header-actions">
                  <span class="notif-header-sep">|</span>
                  <button
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
                  <div class="notif-empty-icon-wrap">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div class="notif-empty-title">You're All Caught Up!</div>
                  <p class="notif-empty-desc">You have no new notifications.</p>
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
                      <span class="notif-type-badge" :class="'type-' + (item.type || 'REMINDER').toLowerCase()">
                        {{ formatNotifType(item.type) }}
                      </span>
                    </div>
                    <span class="notif-time">{{ item.relativeTime }}</span>
                  </div>
                  <div class="notif-item-title-row">
                    <span v-if="!item.isRead" class="notif-unread-dot"></span>
                    <span class="notif-item-title">{{ item.title }}</span>
                  </div>
                  <p v-if="item.message" class="notif-item-message">{{ item.message }}</p>
                  <div v-if="item.scheduleTime" class="notif-item-schedule-time">
                    <span class="sched-label">Schedule:</span>
                    <span class="sched-value">{{ item.scheduleTime }}</span>
                  </div>
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
                <router-link to="/dashboard/notifications" class="notif-view-all-link" @click="notifPanelOpen = false">
                  View All Notifications
                </router-link>
              </div>
            </div>
          </div>

          <router-link to="/dashboard/settings" class="user-chip">
            <div class="user-avatar" :class="{ 'has-photo': !!adminPhoto }">
              <img v-if="adminPhoto" :src="adminPhoto" alt="Admin Profile" class="avatar-img" />
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="user-meta">
              <span class="user-name">{{ adminName }}</span>
              <span class="user-role">{{ adminRole }}</span>
            </div>
          </router-link>
        </div>
      </header>

      <!-- View Slot -->
      <main class="main-content">
        <router-view />
      </main>

      <!-- Footer Banner -->
      <footer class="portal-footer no-print">
        <div class="footer-left">
          ALS LMS | Naawan District - Alternative Learning System
        </div>
        <div class="footer-quote">
          "Inclusive Education, Stronger Communities, Brighter Futures."
        </div>
      </footer>
    </div>

    <!-- Signout Confirmation Modal -->
    <SignoutConfirmationModal
      class="no-print"
      :is-open="showSignoutModal"
      @confirm="confirmSignout"
      @cancel="showSignoutModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SignoutConfirmationModal from '../components/SignoutConfirmationModal.vue';
import GlobalSearchBar from '../components/GlobalSearchBar.vue';
import { useAdminSession } from '../composables/useAdminSession.js';
import { useNotifications } from '../composables/useNotifications.js';

const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);
const showSignoutModal = ref(false);
const notifPanelOpen = ref(false);
const notifContainerRef = ref(null);

const { adminPhoto, adminName, adminRole, clearAdminSession, refreshAdminProfile } = useAdminSession();
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

function toggleNotifPanel() {
  notifPanelOpen.value = !notifPanelOpen.value;
}

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

async function handleNotificationClick(item) {
  if (item && !item.isRead) {
    await markAsRead(item.notificationKey);
  }
  notifPanelOpen.value = false;
  const targetUrl = item?.actionUrl || '/dashboard/schedule';
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

onMounted(() => {
  refreshAdminProfile();
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

// Independent states: activeMenu controls which item is blue; expandedMenu controls open submenu
function getMenuFromPath(pathname) {
  if (pathname.startsWith('/dashboard/reports')) return 'reports';
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'dashboard';
  if (pathname.startsWith('/dashboard/learning-centers')) return 'learning-centers';
  if (pathname.startsWith('/dashboard/teachers')) return 'teachers';
  if (pathname.startsWith('/dashboard/learners')) return 'learners';
  if (pathname.startsWith('/dashboard/learning-areas')) return 'learning-areas';
  if (pathname.startsWith('/dashboard/schedule')) return 'schedule';
  if (pathname.startsWith('/dashboard/announcements')) return 'announcements';
  if (pathname.startsWith('/dashboard/notifications')) return 'notifications';
  if (pathname.startsWith('/dashboard/settings')) return 'settings';
  return '';
}

function getExpandedFromPath(pathname) {
  if (pathname.startsWith('/dashboard/reports')) return 'reports';
  return null;
}

const activeMenu = ref(getMenuFromPath(route.path) || 'dashboard');
const expandedMenu = ref(getExpandedFromPath(route.path));

// Non-expandable direct router link click handler
function handleNavClick(menu) {
  activeMenu.value = menu;
  expandedMenu.value = null;
  sidebarOpen.value = false;
}

// Expandable parent menu click handler: updates activeMenu and toggles expandedMenu independently
function handleParentClick(menu) {
  activeMenu.value = menu;
  expandedMenu.value = expandedMenu.value === menu ? null : menu;
}

// Child sublink click handler
function handleSublinkClick(parentMenu) {
  activeMenu.value = parentMenu;
  expandedMenu.value = parentMenu;
  sidebarOpen.value = false;
}

// Route watcher: synchronizes activeMenu and expandedMenu ONLY when route path actually changes
watch(
  () => route.path,
  (newPath) => {
    notifPanelOpen.value = false;
    fetchNotifications();
    const routeMenu = getMenuFromPath(newPath);
    if (routeMenu) {
      activeMenu.value = routeMenu;
    }

    if (newPath.startsWith('/dashboard/reports')) {
      expandedMenu.value = 'reports';
    } else {
      expandedMenu.value = null;
    }
  },
  { immediate: true }
);

function isCurrentRoute(path) {
  if (path === '/dashboard') {
    return route.path === '/dashboard' || route.path === '/dashboard/';
  }
  return route.path.startsWith(path);
}

function handleLogout() {
  sidebarOpen.value = false;
  showSignoutModal.value = true;
}

function confirmSignout() {
  showSignoutModal.value = false;
  notifPanelOpen.value = false;
  clearNotificationsState();
  clearAdminSession();
  router.push({ name: 'Login' });
}
</script>

<style scoped>
.notif-wrapper {
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
  width: min(370px, calc(100vw - 24px));
  max-height: 460px;
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
  padding: 12px 15px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
  flex-shrink: 0;
}

.notif-panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-header-sep {
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 400;
  user-select: none;
}

.notif-header-actions {
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
  max-height: 350px;
  flex-grow: 1;
}

.notif-panel-body::-webkit-scrollbar {
  width: 6px;
}

.notif-panel-body::-webkit-scrollbar-track {
  background: #f8fafc;
}

.notif-panel-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.notif-panel-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.notif-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
}

.notif-empty-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #f0fdf4;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.notif-empty-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.notif-empty-desc {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.notif-item {
  padding: 12px 15px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-item.is-unread {
  background: #f0f7ff;
}

.notif-item.is-unread:hover {
  background: #e2eeff;
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
  word-break: break-word;
  overflow-wrap: break-word;
}

.notif-item-message {
  font-size: 0.76rem;
  color: #475569;
  margin: 0 0 6px 0;
  line-height: 1.35;
  word-break: break-word;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-item-schedule-time {
  font-size: 0.74rem;
  color: #64748b;
  margin-bottom: 6px;
  line-height: 1.35;
}

.notif-item-schedule-time .sched-label {
  font-weight: 600;
  color: #475569;
  margin-right: 3px;
}

.notif-item-schedule-time .sched-value {
  font-weight: 400;
  color: #64748b;
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
  padding: 10px 14px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}

.notif-footer-sep {
  color: #94a3b8;
  font-size: 0.75rem;
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

@media (max-width: 480px) {
  .notif-dropdown-panel {
    position: fixed;
    top: 60px;
    left: 12px;
    right: 12px;
    width: auto;
    max-height: calc(100vh - 120px);
  }
}
.nav-dropdown-item {
  display: flex;
  flex-direction: column;
}

.nav-dropdown-btn {
  width: 100%;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  color: #94a3b8;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.nav-dropdown-btn:hover {
  background: var(--color-sidebar-hover);
  color: #ffffff;
}

/* Neutral expanded styling when expanded but NOT active */
.nav-dropdown-btn.expanded:not(.active) {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
}

.nav-dropdown-btn.expanded:not(.active) .nav-chevron {
  color: #cbd5e1;
}

/* Active bright blue highlight matching other navigation items */
.nav-dropdown-btn.active {
  background: var(--color-sidebar-active) !important;
  color: #ffffff !important;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
}

.nav-dropdown-btn.active:hover {
  background: var(--color-sidebar-active) !important;
  color: #ffffff !important;
}

.nav-dropdown-btn.active .nav-icon,
.nav-dropdown-btn.active .nav-label,
.nav-dropdown-btn.active .nav-chevron {
  color: #ffffff !important;
}

.nav-dropdown-btn .nav-label {
  flex: 1;
}

.nav-chevron {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-base);
  color: #94a3b8;
  margin-left: auto;
  flex-shrink: 0;
}

.nav-dropdown-btn:hover .nav-chevron,
.nav-dropdown-btn.active .nav-chevron {
  color: #ffffff;
}

.nav-chevron.rotated {
  transform: rotate(180deg);
}

.nav-submenu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.35rem 0.5rem 0.35rem 0.85rem;
  margin-top: 0.25rem;
  margin-left: 0.85rem;
  border-left: 2px solid rgba(255, 255, 255, 0.14);
}

.nav-sublink {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.5rem 0.65rem;
  color: #94a3b8;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.35;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.nav-sublink:hover {
  background: var(--color-sidebar-hover);
  color: #ffffff;
}

.nav-sublink.active {
  background: rgba(37, 99, 235, 0.3);
  color: #ffffff;
  font-weight: 600;
}

.sublink-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.7;
  margin-top: 0.325rem;
  flex-shrink: 0;
}

.nav-sublink.active .sublink-dot {
  background: #60a5fa;
  opacity: 1;
  box-shadow: 0 0 6px rgba(96, 165, 250, 0.7);
}

.sublink-label {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  line-height: 1.35;
  word-break: normal;
  flex: 1;
}

/* Accordion expand/collapse transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 300px;
  opacity: 1;
  overflow: hidden;
}

.dropdown-enter-from,
.dropdown-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-4px);
  overflow: hidden;
}
</style>

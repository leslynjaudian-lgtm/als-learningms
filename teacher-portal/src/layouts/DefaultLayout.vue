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
            <span class="logo-badge">Teacher Portal</span>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </span>
          <span class="nav-label">Dashboard</span>
        </router-link>

        <!-- 2. My Learners -->
        <router-link
          to="/dashboard/learners"
          class="nav-link"
          :class="{ active: activeMenu === 'learners' }"
          @click="handleNavClick('learners')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </span>
          <span class="nav-label">My Learners</span>
        </router-link>

        <!-- 3. Learning Centers -->
        <router-link
          to="/dashboard/learning-centers"
          class="nav-link"
          :class="{ active: activeMenu === 'learning-centers' }"
          @click="handleNavClick('learning-centers')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/>
            </svg>
          </span>
          <span class="nav-label">Learning Centers</span>
        </router-link>

        <!-- 4. Modules (Dropdown: A&E Elementary & A&E Junior High based on assigned levels) -->
        <div class="nav-dropdown-item">
          <button
            type="button"
            class="nav-link nav-dropdown-btn"
            :class="{ active: activeMenu === 'modules', expanded: expandedMenu === 'modules' }"
            @click="handleParentClick('modules')"
            aria-haspopup="true"
            :aria-expanded="expandedMenu === 'modules'"
          >
            <span class="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </span>
            <span class="nav-label">Modules</span>
            <span class="nav-chevron" :class="{ rotated: expandedMenu === 'modules' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          <!-- Modules Submenu -->
          <transition name="dropdown">
            <div v-show="expandedMenu === 'modules'" class="nav-submenu">
              <router-link
                v-for="lvl in assignedLevels"
                :key="lvl.slug"
                :to="lvl.path"
                class="nav-sublink"
                :class="{ active: isModuleLevelActive(lvl.slug) }"
                @click="handleSublinkClick('modules')"
              >
                <span class="sublink-dot"></span>
                <span class="sublink-label">{{ lvl.label }}</span>
              </router-link>
            </div>
          </transition>
        </div>

        <!-- 5. Records -->
        <router-link
          to="/dashboard/records"
          class="nav-link"
          :class="{ active: activeMenu === 'records' }"
          @click="handleNavClick('records')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </span>
          <span class="nav-label">Records</span>
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

        <!-- 6. Attendance (Dropdown: Take Attendance & Attendance History) -->
        <div class="nav-dropdown-item">
          <button
            type="button"
            class="nav-link nav-dropdown-btn"
            :class="{ active: activeMenu === 'attendance', expanded: expandedMenu === 'attendance' }"
            @click="handleParentClick('attendance')"
            aria-haspopup="true"
            :aria-expanded="expandedMenu === 'attendance'"
          >
            <span class="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </span>
            <span class="nav-label">Attendance</span>
            <span class="nav-chevron" :class="{ rotated: expandedMenu === 'attendance' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          <!-- Attendance Submenu -->
          <transition name="dropdown">
            <div v-show="expandedMenu === 'attendance'" class="nav-submenu">
              <router-link
                to="/dashboard/attendance"
                class="nav-sublink"
                :class="{ active: isTakeAttendanceActive }"
                @click="handleSublinkClick('attendance')"
              >
                <span class="sublink-dot"></span>
                <span class="sublink-label">Take Attendance</span>
              </router-link>

              <router-link
                to="/dashboard/attendance/history"
                class="nav-sublink"
                :class="{ active: isAttendanceHistoryActive }"
                @click="handleSublinkClick('attendance')"
              >
                <span class="sublink-dot"></span>
                <span class="sublink-label">Attendance History</span>
              </router-link>
            </div>
          </transition>
        </div>

        <!-- 7. Reports (Dropdown: ALS AF2, Module Progress, Attendance Summary) -->
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </span>
            <span class="nav-label">Reports</span>
            <span class="nav-chevron" :class="{ rotated: expandedMenu === 'reports' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          <!-- Reports Submenu -->
          <transition name="dropdown">
            <div v-show="expandedMenu === 'reports'" class="nav-submenu">
              <router-link
                to="/dashboard/reports/af2"
                class="nav-sublink"
                :class="{ active: isAf2Active }"
                @click="handleSublinkClick('reports')"
              >
                <span class="sublink-dot"></span>
                <span class="sublink-label">ALS Assessment Form 2 Report</span>
              </router-link>

              <router-link
                to="/dashboard/reports/module-progress"
                class="nav-sublink"
                :class="{ active: isModuleProgressActive }"
                @click="handleSublinkClick('reports')"
              >
                <span class="sublink-dot"></span>
                <span class="sublink-label">Summary of Module Use and Learner's Progress</span>
              </router-link>

              <router-link
                to="/dashboard/reports/attendance-summary"
                class="nav-sublink"
                :class="{ active: isAttendanceSummaryActive }"
                @click="handleSublinkClick('reports')"
              >
                <span class="sublink-dot"></span>
                <span class="sublink-label">Attendance Summary</span>
              </router-link>
            </div>
          </transition>
        </div>

        <!-- 8. Announcements -->
        <router-link
          to="/dashboard/announcements"
          class="nav-link"
          :class="{ active: activeMenu === 'announcements' }"
          @click="handleNavClick('announcements')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </span>
          <span class="nav-label">Announcements</span>
        </router-link>

        <!-- 7. Settings -->
        <router-link
          to="/dashboard/settings"
          class="nav-link"
          :class="{ active: activeMenu === 'settings' }"
          @click="handleNavClick('settings')"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </span>
          <span class="nav-label">Settings</span>
        </router-link>
      </nav>

      <!-- 7. Signout at the bottom -->
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
          <button class="notification-btn" title="Notifications" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span class="notif-badge"></span>
          </button>

          <router-link to="/dashboard/settings" class="user-chip">
            <div class="user-avatar" :class="{ 'has-photo': !!teacherPhoto }">
              <img
                v-if="teacherPhoto"
                :src="teacherPhoto"
                alt="Teacher Profile"
                class="avatar-img"
              />
              <svg
                v-else
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="user-meta">
              <span class="user-name">{{ teacherName }}</span>
              <span class="user-role">{{ teacherPosition }}</span>
            </div>
          </router-link>
        </div>
      </header>

      <!-- View Slot -->
      <main class="main-content">
        <router-view :key="$route.fullPath" />
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
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import SignoutConfirmationModal from '../components/SignoutConfirmationModal.vue';
import GlobalSearchBar from '../components/GlobalSearchBar.vue';

const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);
const showSignoutModal = ref(false);

const { teacherName, teacherPosition, teacherPhoto, assignedCenters, assignedLevels, clearSession, refreshProfile } = useTeacherSession();

// Independent states: activeMenu controls which item is blue; expandedMenu controls open submenu
function getMenuFromPath(pathname) {
  if (pathname.startsWith('/dashboard/attendance')) return 'attendance';
  if (pathname.startsWith('/dashboard/reports')) return 'reports';
  if (pathname.startsWith('/dashboard/modules') || pathname.startsWith('/teacher/modules')) return 'modules';
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'dashboard';
  if (
    pathname.startsWith('/dashboard/learners') ||
    pathname.startsWith('/dashboard/learner-profile') ||
    pathname.startsWith('/dashboard/my-learners')
  ) {
    return 'learners';
  }
  if (pathname.startsWith('/dashboard/learning-centers') || pathname.startsWith('/dashboard/clc')) {
    return 'learning-centers';
  }
  if (pathname.startsWith('/dashboard/records')) return 'records';
  if (pathname.startsWith('/dashboard/schedule')) return 'schedule';
  if (pathname.startsWith('/dashboard/announcements')) return 'announcements';
  if (pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/profile')) return 'settings';
  return '';
}

function getExpandedFromPath(pathname) {
  if (pathname.startsWith('/dashboard/attendance')) return 'attendance';
  if (pathname.startsWith('/dashboard/reports')) return 'reports';
  if (pathname.startsWith('/dashboard/modules') || pathname.startsWith('/teacher/modules')) return 'modules';
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

const isTakeAttendanceActive = computed(() => {
  return (
    !route.path.startsWith('/dashboard/attendance/history') &&
    (route.path === '/dashboard/attendance' ||
      route.path === '/dashboard/attendance/' ||
      route.path.startsWith('/dashboard/attendance/take'))
  );
});

const isAttendanceHistoryActive = computed(() => {
  return route.path.startsWith('/dashboard/attendance/history');
});

const isAf2Active = computed(() => {
  return route.path.startsWith('/dashboard/reports/af2');
});

const isModuleProgressActive = computed(() => {
  return route.path.startsWith('/dashboard/reports/module-progress');
});

const isAttendanceSummaryActive = computed(() => {
  return (
    route.path.startsWith('/dashboard/reports/attendance-summary') ||
    route.path === '/dashboard/reports/attendance'
  );
});

function isModuleLevelActive(slug) {
  if (!route.path.startsWith('/dashboard/modules') && !route.path.startsWith('/teacher/modules')) {
    return false;
  }
  if (route.path.includes(slug)) return true;
  if (route.params.defaultLevelSlug === slug) return true;
  if (route.query.level === slug) return true;
  if (
    (route.path === '/dashboard/modules' || route.path === '/dashboard/modules/') &&
    assignedLevels.value?.[0]?.slug === slug
  ) {
    return true;
  }
  return false;
}

onMounted(() => {
  refreshProfile();
});

// Route watcher: synchronizes activeMenu and expandedMenu ONLY when route path actually changes
watch(
  () => route.path,
  (newPath) => {
    const routeMenu = getMenuFromPath(newPath);
    if (routeMenu) {
      activeMenu.value = routeMenu;
    }

    if (newPath.startsWith('/dashboard/attendance')) {
      expandedMenu.value = 'attendance';
    } else if (newPath.startsWith('/dashboard/reports')) {
      expandedMenu.value = 'reports';
    } else if (newPath.startsWith('/dashboard/modules') || newPath.startsWith('/teacher/modules')) {
      expandedMenu.value = 'modules';
    } else {
      expandedMenu.value = null;
    }
  },
  { immediate: true }
);

function handleLogout() {
  sidebarOpen.value = false;
  showSignoutModal.value = true;
}

function confirmSignout() {
  showSignoutModal.value = false;
  clearSession();
  router.push({ name: 'Login' });
}
</script>

<style scoped>
.nav-dropdown-item {
  display: flex;
  flex-direction: column;
}

.nav-dropdown-btn {
  width: 100%;
  border: none;
  background: transparent;
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

/* Neutral expanded appearance when submenu is open but route is on another page */
.nav-dropdown-btn.expanded:not(.active) {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
}

.nav-dropdown-btn.expanded:not(.active):hover {
  background: var(--color-sidebar-hover);
  color: #ffffff;
}

.nav-dropdown-btn.expanded:not(.active) .nav-chevron {
  color: #cbd5e1;
}

/* Active bright blue highlight matching other navigation items ONLY when route is active */
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
  background: #64748b;
  flex-shrink: 0;
  margin-top: 0.325rem;
  transition: all var(--transition-fast);
}

.nav-sublink:hover .sublink-dot {
  background: #93c5fd;
}

.nav-sublink.active .sublink-dot {
  background: #60a5fa;
  box-shadow: 0 0 6px #60a5fa;
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

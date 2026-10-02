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
            <span class="logo-badge">Admin Portal</span>
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
          :class="{ active: isCurrentRoute('/dashboard') }"
          @click="sidebarOpen = false"
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
          :class="{ active: isCurrentRoute('/dashboard/learning-centers') }"
          @click="sidebarOpen = false"
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
          :class="{ active: isCurrentRoute('/dashboard/teachers') }"
          @click="sidebarOpen = false"
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
          :class="{ active: isCurrentRoute('/dashboard/learners') }"
          @click="sidebarOpen = false"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </span>
          <span class="nav-label">Learners</span>
        </router-link>

        <!-- 5. Learning Areas -->
        <router-link
          to="/dashboard/learning-areas"
          class="nav-link"
          :class="{ active: isCurrentRoute('/dashboard/learning-areas') }"
          @click="sidebarOpen = false"
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
          :class="{ active: isCurrentRoute('/dashboard/schedule') }"
          @click="sidebarOpen = false"
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
          :class="{ active: isCurrentRoute('/dashboard/announcements') }"
          @click="sidebarOpen = false"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </span>
          <span class="nav-label">Announcements</span>
        </router-link>

        <!-- 7. Reports (Dropdown: ALS AF2 Summary, Attendance Summary, Learning Center Summary) -->
        <div class="nav-dropdown-item">
          <button
            type="button"
            class="nav-link nav-dropdown-btn"
            :class="{ active: isReportsActive, expanded: isReportsOpen }"
            @click="toggleReports"
          >
            <span class="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
            </span>
            <span class="nav-label">Reports</span>
            <span class="nav-chevron" :class="{ rotated: isReportsOpen }">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </button>

          <!-- Reports Submenu -->
          <div v-show="isReportsOpen" class="nav-submenu">
            <router-link
              to="/dashboard/reports/module-progress"
              class="nav-sublink"
              :class="{ active: isCurrentRoute('/dashboard/reports/module-progress') }"
              @click="sidebarOpen = false"
            >
              <span class="sublink-dot"></span>
              <span class="sublink-label">Summary of Module Use and Learner's Progress</span>
            </router-link>

            <router-link
              to="/dashboard/reports/attendance-summary"
              class="nav-sublink"
              :class="{ active: isCurrentRoute('/dashboard/reports/attendance') }"
              @click="sidebarOpen = false"
            >
              <span class="sublink-dot"></span>
              <span class="sublink-label">Attendance Summary</span>
            </router-link>

            <router-link
              to="/dashboard/reports/learning-center-summary"
              class="nav-sublink"
              :class="{ active: isCurrentRoute('/dashboard/reports/learning-center-summary') }"
              @click="sidebarOpen = false"
            >
              <span class="sublink-dot"></span>
              <span class="sublink-label">Learning Center Summary</span>
            </router-link>
          </div>
        </div>

        <!-- 7. Settings -->
        <router-link
          to="/dashboard/settings"
          class="nav-link"
          :class="{ active: isCurrentRoute('/dashboard/settings') }"
          @click="sidebarOpen = false"
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
        </div>

        <div class="topbar-right">
          <button class="notification-btn" title="Notifications" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span class="notif-badge"></span>
          </button>

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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SignoutConfirmationModal from '../components/SignoutConfirmationModal.vue';
import { useAdminSession } from '../composables/useAdminSession.js';

const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);
const showSignoutModal = ref(false);

const { adminPhoto, adminName, adminRole, clearAdminSession, refreshAdminProfile } = useAdminSession();

onMounted(() => {
  refreshAdminProfile();
});

const isReportsOpen = ref(true);

const isReportsActive = computed(() => {
  return route.path.startsWith('/dashboard/reports');
});

function toggleReports() {
  isReportsOpen.value = !isReportsOpen.value;
}

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
  clearAdminSession();
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

.nav-dropdown-btn.active {
  background: var(--color-sidebar-active);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
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
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.75rem;
  color: #94a3b8;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.nav-sublink:hover {
  background: var(--color-sidebar-hover);
  color: #ffffff;
}

.nav-sublink.active {
  background: rgba(37, 99, 235, 0.25);
  color: #93c5fd;
  font-weight: 600;
}

.sublink-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.7;
}

.sublink-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

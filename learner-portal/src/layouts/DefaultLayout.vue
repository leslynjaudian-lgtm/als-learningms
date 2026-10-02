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
      <div class="header-actions">
        <router-link to="/announcements" class="header-icon-btn" title="Announcements" aria-label="Announcements">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="header-notif-dot"></span>
        </router-link>
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
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const drawerOpen = ref(false);
const logoutModalOpen = ref(false);

function isCurrentRoute(path) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}

function triggerLogout() {
  drawerOpen.value = false;
  logoutModalOpen.value = true;
}

function confirmLogout() {
  logoutModalOpen.value = false;
  localStorage.removeItem('als_learner_authenticated');
  localStorage.removeItem('als_learner_user');
  localStorage.removeItem('als_learner_token');
  router.push({ name: 'Login' });
}
</script>

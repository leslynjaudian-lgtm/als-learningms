import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import MyModulesView from '../views/MyModulesView.vue';
import ModuleDetailView from '../views/ModuleDetailView.vue';
import MockModuleStudyView from '../views/MockModuleStudyView.vue';
import AssessmentsView from '../views/AssessmentsView.vue';
import ProgressView from '../views/ProgressView.vue';
import AnnouncementsView from '../views/AnnouncementsView.vue';
import ProfileView from '../views/ProfileView.vue';
import { clearLearnerSessionStorage } from '../utils/learnerStorage.js';

const routes = [
  // Root login — first screen for all unauthenticated users
  {
    path: '/',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Learner Login', guest: true },
  },
  {
    path: '/login',
    redirect: '/',
  },

  // Authenticated Portal Pages under DefaultLayout
  {
    path: '/home',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Home', requiresAuth: true },
      },
      {
        path: '/modules',
        name: 'MyModules',
        component: MyModulesView,
        meta: { title: 'My Modules', requiresAuth: true },
      },
      {
        path: '/modules/ls2-mock-001',
        redirect: '/modules',
      },
      {
        path: '/modules/:id',
        name: 'ModuleDetail',
        component: ModuleDetailView,
        meta: { title: 'Study Module', requiresAuth: true },
      },
      {
        path: '/assessments',
        redirect: '/modules',
      },
      {
        path: '/progress',
        name: 'Progress',
        component: ProgressView,
        meta: { title: 'My Progress', requiresAuth: true },
      },
      {
        path: '/notifications',
        alias: ['/announcements'],
        name: 'Notifications',
        component: AnnouncementsView,
        meta: { title: 'Notifications', requiresAuth: true },
      },
      {
        path: '/profile',
        name: 'Profile',
        component: ProfileView,
        meta: { title: 'My Profile', requiresAuth: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  // Set page title
  document.title = to.meta.title
    ? `${to.meta.title} — ALS LMS Learner`
    : 'ALS LMS — Learner Portal';

  // Direct access to localhost root / login: always show Login View cleanly
  if (to.name === 'Login') {
    clearLearnerSessionStorage();
    return;
  }

  const isAuthenticated = localStorage.getItem('als_learner_authenticated') === 'true';
  const rawUser = localStorage.getItem('als_learner_user');
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch (e) {
    user = null;
  }

  // If the route requires auth and user is not authenticated or not a LEARNER
  if (to.meta.requiresAuth) {
    if (!isAuthenticated || !user || user.role !== 'LEARNER') {
      clearLearnerSessionStorage();
      return { name: 'Login' };
    }
  }
});

export default router;


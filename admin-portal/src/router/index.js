import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import LearnersView from '../views/LearnersView.vue';
import AddLearnerView from '../views/AddLearnerView.vue';
import TeachersView from '../views/TeachersView.vue';
import LearningCentersView from '../views/LearningCentersView.vue';
import LearningAreasView from '../views/LearningAreasView.vue';
import ReportsView from '../views/ReportsView.vue';
import ReportsModuleProgressView from '../views/ReportsModuleProgressView.vue';
import ReportsAf2SummaryView from '../views/ReportsAf2SummaryView.vue';
import ReportsAttendanceSummaryView from '../views/ReportsAttendanceSummaryView.vue';
import ReportsLearningCenterSummaryView from '../views/ReportsLearningCenterSummaryView.vue';
import AnnouncementsView from '../views/AnnouncementsView.vue';
import NotificationsView from '../views/NotificationsView.vue';
import ScheduleView from '../views/ScheduleView.vue';
import SettingsView from '../views/SettingsView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Admin Login', guest: true },
  },
  {
    path: '/login',
    redirect: '/',
  },
  {
    path: '/announcements',
    redirect: '/dashboard/announcements',
  },
  {
    path: '/notifications',
    redirect: '/dashboard/notifications',
  },
  {
    path: '/schedule',
    redirect: '/dashboard/schedule',
  },
  {
    path: '/dashboard',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard', requiresAuth: true },
      },
      {
        path: 'learning-centers',
        name: 'LearningCenters',
        component: LearningCentersView,
        meta: { title: 'Learning Centers', requiresAuth: true },
      },
      {
        path: 'teachers',
        name: 'Teachers',
        component: TeachersView,
        meta: { title: 'ALS Teachers', requiresAuth: true },
      },
      {
        path: 'learners',
        name: 'Learners',
        component: LearnersView,
        meta: { title: 'Learners', requiresAuth: true },
      },
      {
        path: 'learners/add',
        name: 'AddLearner',
        component: AddLearnerView,
        meta: { title: 'Add Learner', requiresAuth: true },
      },
      {
        path: 'learning-areas',
        name: 'LearningAreas',
        component: LearningAreasView,
        meta: { title: 'Learning Areas', requiresAuth: true },
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: ScheduleView,
        meta: { title: 'Schedule', requiresAuth: true },
      },
      {
        path: 'modules',
        redirect: '/dashboard/learning-areas',
      },
      {
        path: 'reports',
        name: 'Reports',
        component: ReportsView,
        meta: { title: 'Reports Hub', requiresAuth: true },
      },
      {
        path: 'reports/module-progress',
        name: 'ReportsModuleProgress',
        component: ReportsModuleProgressView,
        meta: { title: "Summary of Module Use and Learner's Progress", requiresAuth: true },
      },
      {
        path: 'reports/af2-summary',
        name: 'ReportsAf2Summary',
        component: ReportsAf2SummaryView,
        meta: { title: 'ALS AF2 Summary', requiresAuth: true },
      },
      {
        path: 'reports/af2',
        redirect: '/dashboard/reports/af2-summary',
      },
      {
        path: 'reports/attendance-summary',
        name: 'ReportsAttendanceSummary',
        component: ReportsAttendanceSummaryView,
        meta: { title: 'Attendance Summary', requiresAuth: true },
      },
      {
        path: 'reports/attendance',
        redirect: '/dashboard/reports/attendance-summary',
      },
      {
        path: 'reports/learning-center-summary',
        name: 'ReportsLearningCenterSummary',
        component: ReportsLearningCenterSummaryView,
        meta: { title: 'Learning Center Summary', requiresAuth: true },
      },
      {
        path: 'reports/learner-records',
        redirect: '/dashboard/reports/af2-summary',
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsView,
        meta: { title: 'Settings', requiresAuth: true },
      },
      {
        path: 'profile',
        redirect: '/dashboard/settings',
      },
      {
        path: 'system-settings',
        redirect: '/dashboard/settings',
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: AnnouncementsView,
        meta: { title: 'Announcements', requiresAuth: true },
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: NotificationsView,
        meta: { title: 'Notifications', requiresAuth: true },
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
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  // Set page title
  document.title = to.meta.title
    ? `${to.meta.title} | ALS LMS Admin`
    : 'ALS LMS Admin';

  // Direct access to localhost root / login: always show Login View cleanly
  if (to.name === 'Login') {
    localStorage.removeItem('als_admin_authenticated');
    localStorage.removeItem('als_admin_token');
    localStorage.removeItem('als_admin_user');
    return;
  }

  const isAuthenticated = localStorage.getItem('als_admin_authenticated') === 'true';

  if (to.meta.requiresAuth && !isAuthenticated) {
    localStorage.removeItem('als_admin_authenticated');
    localStorage.removeItem('als_admin_token');
    localStorage.removeItem('als_admin_user');
    return { name: 'Login' };
  }
});

export default router;

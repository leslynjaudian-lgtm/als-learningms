import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import LearnersView from '../views/LearnersView.vue';
import AddLearnerView from '../views/AddLearnerView.vue';
import TeachersView from '../views/TeachersView.vue';
import LearningCentersView from '../views/LearningCentersView.vue';
import LearningAreasView from '../views/LearningAreasView.vue';
import ReportsView from '../views/ReportsView.vue';
import ReportsAttendanceView from '../views/ReportsAttendanceView.vue';
import ReportsLearnerRecordsView from '../views/ReportsLearnerRecordsView.vue';
import AnnouncementsView from '../views/AnnouncementsView.vue';
import SystemSettingsView from '../views/SystemSettingsView.vue';
import ProfileView from '../views/ProfileView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Admin Login' },
  },
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard' },
      },
      {
        path: 'learners',
        name: 'Learners',
        component: LearnersView,
        meta: { title: 'Learners' },
      },
      {
        path: 'learners/add',
        name: 'AddLearner',
        component: AddLearnerView,
        meta: { title: 'Add Learner' },
      },
      {
        path: 'teachers',
        name: 'Teachers',
        component: TeachersView,
        meta: { title: 'ALS Teachers' },
      },
      {
        path: 'learning-centers',
        name: 'LearningCenters',
        component: LearningCentersView,
        meta: { title: 'Learning Centers' },
      },
      {
        path: 'learning-areas',
        name: 'LearningAreas',
        component: LearningAreasView,
        meta: { title: 'Learning Areas' },
      },
      {
        path: 'reports',
        name: 'Reports',
        component: ReportsView,
        meta: { title: 'Reports' },
      },
      {
        path: 'reports/attendance',
        name: 'ReportsAttendance',
        component: ReportsAttendanceView,
        meta: { title: 'Attendance Report' },
      },
      {
        path: 'reports/learner-records',
        name: 'ReportsLearnerRecords',
        component: ReportsLearnerRecordsView,
        meta: { title: 'Learner Records' },
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: AnnouncementsView,
        meta: { title: 'Announcements' },
      },
      {
        path: 'system-settings',
        name: 'SystemSettings',
        component: SystemSettingsView,
        meta: { title: 'System Settings' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: ProfileView,
        meta: { title: 'My Profile' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} — ALS LMS Admin`
    : 'ALS LMS — Admin Portal';
});

export default router;

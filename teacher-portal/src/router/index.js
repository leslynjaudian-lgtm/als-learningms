import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import LearningCentersView from '../views/LearningCentersView.vue';
import LearningCenterDetailView from '../views/LearningCenterDetailView.vue';
import ModulesView from '../views/ModulesView.vue';
import ModuleDetailsView from '../views/ModuleDetailsView.vue';
import RecordsView from '../views/RecordsView.vue';
import MyLearnersView from '../views/MyLearnersView.vue';
import LearnerProfileView from '../views/LearnerProfileView.vue';
import AttendanceView from '../views/AttendanceView.vue';
import AttendanceHistoryView from '../views/AttendanceHistoryView.vue';
import AssessmentsView from '../views/AssessmentsView.vue';
import RecordScoreView from '../views/RecordScoreView.vue';
import LearningProgressView from '../views/LearningProgressView.vue';
import ReportsView from '../views/ReportsView.vue';
import AlsAf2ReportView from '../views/AlsAf2ReportView.vue';
import ModuleProgressReportView from '../views/ModuleProgressReportView.vue';
import AttendanceSummaryReportView from '../views/AttendanceSummaryReportView.vue';
import AnnouncementsView from '../views/AnnouncementsView.vue';
import NotificationsView from '../views/NotificationsView.vue';
import ScheduleView from '../views/ScheduleView.vue';
import ProfileView from '../views/ProfileView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Teacher Login', guest: true },
  },
  {
    path: '/login',
    redirect: '/',
  },
  {
    path: '/teacher/modules',
    redirect: '/dashboard/modules',
  },
  {
    path: '/reports',
    redirect: '/dashboard/reports/af2',
  },
  {
    path: '/reports/af2',
    redirect: '/dashboard/reports/af2',
  },
  {
    path: '/reports/module-progress',
    redirect: '/dashboard/reports/module-progress',
  },
  {
    path: '/reports/attendance-summary',
    redirect: '/dashboard/reports/attendance-summary',
  },
  {
    path: '/reports/attendance',
    redirect: '/dashboard/reports/attendance-summary',
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
      // Learning Centers (View-Only assigned centers and details)
      {
        path: 'learning-centers',
        alias: ['clc', 'my-clc'],
        name: 'LearningCenters',
        component: LearningCentersView,
        meta: { title: 'My Learning Centers', requiresAuth: true },
      },
      {
        path: 'learning-centers/:id',
        alias: ['clc/:id'],
        name: 'LearningCenterDetail',
        component: LearningCenterDetailView,
        meta: { title: 'Learning Center Details', requiresAuth: true },
      },

      // Other Portal Views
      {
        path: 'learners',
        alias: ['my-learners'],
        name: 'MyLearners',
        component: MyLearnersView,
        meta: { title: 'My Learners', requiresAuth: true },
      },
      {
        path: 'learners/:id',
        alias: ['learner-profile/:id'],
        name: 'LearnerProfile',
        component: LearnerProfileView,
        meta: { title: 'Learner Profile', requiresAuth: true },
      },
      {
        path: 'learner-profile',
        redirect: (to) => {
          if (to.query?.id) return `/dashboard/learners/${to.query.id}`;
          return '/dashboard/learners';
        },
      },
      {
        path: 'modules',
        name: 'Modules',
        redirect: (to) => {
          try {
            const raw = localStorage.getItem('als_teacher_user');
            if (raw) {
              const teacher = JSON.parse(raw);
              const spec = String(teacher.programLevel || teacher.specialization || 'Both').toLowerCase();
              if (spec.includes('junior') || spec.includes('jhs') || spec.includes('sec')) {
                if (!spec.includes('elem') && !spec.includes('both')) {
                  return { path: '/dashboard/modules/junior-high', query: to.query };
                }
              }
            }
          } catch (e) {}
          return { path: '/dashboard/modules/elementary', query: to.query };
        },
      },
      {
        path: 'modules/elementary',
        name: 'ModulesElementary',
        component: ModulesView,
        props: { defaultLevelSlug: 'elementary', defaultLevel: 'A&E Elementary' },
        meta: { title: 'Modules - A&E Elementary', requiresAuth: true },
        beforeEnter: (to, from, next) => {
          try {
            const raw = localStorage.getItem('als_teacher_user');
            if (raw) {
              const teacher = JSON.parse(raw);
              const spec = String(teacher.programLevel || teacher.specialization || 'Both').toLowerCase();
              const hasElem = spec.includes('elem') || spec.includes('both');
              const hasJhs = spec.includes('junior') || spec.includes('jhs') || spec.includes('sec') || spec.includes('both');
              if (!hasElem && hasJhs) {
                return next('/dashboard/modules/junior-high');
              }
            }
          } catch (e) {}
          next();
        },
      },
      {
        path: 'modules/junior-high',
        name: 'ModulesJuniorHigh',
        component: ModulesView,
        props: { defaultLevelSlug: 'junior-high', defaultLevel: 'A&E Junior High' },
        meta: { title: 'Modules - A&E Junior High', requiresAuth: true },
        beforeEnter: (to, from, next) => {
          try {
            const raw = localStorage.getItem('als_teacher_user');
            if (raw) {
              const teacher = JSON.parse(raw);
              const spec = String(teacher.programLevel || teacher.specialization || 'Both').toLowerCase();
              const hasElem = spec.includes('elem') || spec.includes('both');
              const hasJhs = spec.includes('junior') || spec.includes('jhs') || spec.includes('sec') || spec.includes('both');
              if (!hasJhs && hasElem) {
                return next('/dashboard/modules/elementary');
              }
            }
          } catch (e) {}
          next();
        },
      },
      {
        path: 'modules/:id',
        alias: ['/teacher/modules/:id'],
        name: 'ModuleDetails',
        component: ModuleDetailsView,
        meta: { title: 'Module Details', requiresAuth: true },
      },
      {
        path: 'modules/:id/submissions/:submissionId',
        alias: ['/teacher/modules/:id/submissions/:submissionId'],
        name: 'ReviewLearnerActivity',
        component: ModuleDetailsView,
        meta: { title: 'Review Learner Activity', requiresAuth: true },
      },
      {
        path: 'records/:learnerId?',
        name: 'Records',
        component: RecordsView,
        meta: { title: 'Records', requiresAuth: true },
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: ScheduleView,
        meta: { title: 'Schedule', requiresAuth: true },
      },
      {
        path: 'attendance',
        alias: ['attendance/take'],
        name: 'Attendance',
        component: AttendanceView,
        meta: { title: 'Take Attendance', requiresAuth: true },
      },
      {
        path: 'attendance/history/:learnerId?',
        name: 'AttendanceHistory',
        component: AttendanceHistoryView,
        meta: { title: 'Attendance History', requiresAuth: true },
      },
      {
        path: 'assessments',
        name: 'Assessments',
        component: AssessmentsView,
        meta: { title: 'Assessments', requiresAuth: true },
      },
      {
        path: 'assessments/record',
        alias: ['record-score'],
        name: 'RecordScore',
        component: RecordScoreView,
        meta: { title: 'Record Assessment Score', requiresAuth: true },
      },
      {
        path: 'progress',
        alias: ['performance', 'learning-progress'],
        name: 'LearningProgress',
        component: LearningProgressView,
        meta: { title: 'Learning Progress', requiresAuth: true },
      },
      {
        path: 'reports',
        redirect: '/dashboard/reports/af2',
      },
      {
        path: 'reports/af2',
        alias: ['reports/af2-report', 'reports/af2-summary'],
        name: 'AlsAf2Report',
        component: AlsAf2ReportView,
        meta: { title: 'ALS Assessment Form 2 Report', requiresAuth: true },
      },
      {
        path: 'reports/module-progress',
        name: 'ModuleProgressReport',
        component: ModuleProgressReportView,
        meta: { title: "Summary of Module Use and Learner's Progress", requiresAuth: true },
      },
      {
        path: 'reports/attendance-summary',
        alias: ['reports/attendance'],
        name: 'AttendanceSummaryReport',
        component: AttendanceSummaryReportView,
        meta: { title: 'Attendance Summary Report', requiresAuth: true },
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
      {
        path: 'profile',
        alias: ['settings'],
        name: 'Profile',
        component: ProfileView,
        meta: { title: 'Settings', requiresAuth: true },
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
    ? `${to.meta.title} — ALS LMS Teacher`
    : 'ALS LMS — Teacher Portal';

  // Direct access to localhost root / login: always show Login View cleanly
  if (to.name === 'Login') {
    localStorage.removeItem('als_teacher_authenticated');
    localStorage.removeItem('als_teacher_token');
    localStorage.removeItem('als_teacher_user');
    return;
  }

  const isAuthenticated = localStorage.getItem('als_teacher_authenticated') === 'true';
  let userRole = null;
  try {
    const rawUser = localStorage.getItem('als_teacher_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      userRole = parsed.role || 'TEACHER';
    }
  } catch {
    userRole = null;
  }

  // If the route requires auth: user must be authenticated AND have TEACHER role
  if (to.meta.requiresAuth) {
    if (!isAuthenticated || userRole !== 'TEACHER') {
      localStorage.removeItem('als_teacher_authenticated');
      localStorage.removeItem('als_teacher_token');
      localStorage.removeItem('als_teacher_user');
      return { name: 'Login' };
    }
  }
});

export default router;

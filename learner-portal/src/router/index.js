import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import MyModulesView from '../views/MyModulesView.vue';
import ModuleDetailView from '../views/ModuleDetailView.vue';
import AssessmentsView from '../views/AssessmentsView.vue';
import ProgressView from '../views/ProgressView.vue';
import AnnouncementsView from '../views/AnnouncementsView.vue';
import ProfileView from '../views/ProfileView.vue';

const routes = [
  // First screen: Learner Login Interface on / and /login
  {
    path: '/',
    name: 'RootLogin',
    component: LoginView,
    meta: { title: 'Learner Login' },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Learner Login' },
  },

  // Authenticated Portal Pages under DefaultLayout
  {
    path: '/home',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Home' },
      },
      {
        path: '/modules',
        name: 'MyModules',
        component: MyModulesView,
        meta: { title: 'My Modules' },
      },
      {
        path: '/modules/:id',
        name: 'ModuleDetail',
        component: ModuleDetailView,
        meta: { title: 'Study Module' },
      },
      {
        path: '/assessments',
        name: 'Assessments',
        component: AssessmentsView,
        meta: { title: 'Assessments' },
      },
      {
        path: '/progress',
        name: 'Progress',
        component: ProgressView,
        meta: { title: 'My Progress' },
      },
      {
        path: '/announcements',
        name: 'Announcements',
        component: AnnouncementsView,
        meta: { title: 'Announcements' },
      },
      {
        path: '/profile',
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

router.beforeEach((to, from, next) => {
  document.title = to.meta.title
    ? `${to.meta.title} — ALS LMS Learner`
    : 'ALS LMS — Learner Portal';
  next();
});

export default router;

import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import MyClcView from '../views/MyClcView.vue';
import ClcStrandsView from '../views/ClcStrandsView.vue';
import StrandModulesView from '../views/StrandModulesView.vue';
import StrandUploadModuleView from '../views/StrandUploadModuleView.vue';
import StrandModuleDetailView from '../views/StrandModuleDetailView.vue';
import MyLearnersView from '../views/MyLearnersView.vue';
import LearnerProfileView from '../views/LearnerProfileView.vue';
import ModulesView from '../views/ModulesView.vue';
import UploadModuleView from '../views/UploadModuleView.vue';
import ModuleActivitiesView from '../views/ModuleActivitiesView.vue';
import CreateActivityView from '../views/CreateActivityView.vue';
import AttendanceView from '../views/AttendanceView.vue';
import AssessmentsView from '../views/AssessmentsView.vue';
import RecordScoreView from '../views/RecordScoreView.vue';
import LearningProgressView from '../views/LearningProgressView.vue';
import ReportsView from '../views/ReportsView.vue';
import AnnouncementsView from '../views/AnnouncementsView.vue';
import ProfileView from '../views/ProfileView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Teacher Login' },
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
      // Hierarchical CLC Workflow (Screens 1 to 6)
      {
        path: 'clc',
        alias: ['my-clc'],
        name: 'MyClc',
        component: MyClcView,
        meta: { title: 'My CLC' },
      },
      {
        path: 'clc/:clcId',
        name: 'ClcStrands',
        component: ClcStrandsView,
        meta: { title: 'Learning Strands' },
      },
      {
        path: 'clc/:clcId/strand/:strandId',
        name: 'StrandModules',
        component: StrandModulesView,
        meta: { title: 'Strand Modules' },
      },
      {
        path: 'clc/:clcId/strand/:strandId/upload',
        name: 'StrandUploadModule',
        component: StrandUploadModuleView,
        meta: { title: 'Upload Module' },
      },
      {
        path: 'clc/:clcId/strand/:strandId/module/:moduleId',
        name: 'StrandModuleDetail',
        component: StrandModuleDetailView,
        meta: { title: 'Module Details' },
      },

      // Other Portal Views
      {
        path: 'learners',
        alias: ['my-learners'],
        name: 'MyLearners',
        component: MyLearnersView,
        meta: { title: 'My Learners' },
      },
      {
        path: 'learners/:id',
        alias: ['learner-profile'],
        name: 'LearnerProfile',
        component: LearnerProfileView,
        meta: { title: 'Learner Profile' },
      },
      {
        path: 'modules',
        name: 'Modules',
        component: ModulesView,
        meta: { title: 'Learning Modules' },
      },
      {
        path: 'modules/upload',
        name: 'UploadModule',
        component: UploadModuleView,
        meta: { title: 'Upload Module' },
      },
      {
        path: 'modules/:id/activities',
        alias: ['modules/:id'],
        name: 'ModuleActivities',
        component: ModuleActivitiesView,
        meta: { title: 'Manage Activities' },
      },
      {
        path: 'modules/:id/activities/create',
        name: 'CreateActivity',
        component: CreateActivityView,
        meta: { title: 'Create Activity / Answer Sheet' },
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: AttendanceView,
        meta: { title: 'Attendance' },
      },
      {
        path: 'assessments',
        name: 'Assessments',
        component: AssessmentsView,
        meta: { title: 'Assessments' },
      },
      {
        path: 'assessments/record',
        alias: ['record-score'],
        name: 'RecordScore',
        component: RecordScoreView,
        meta: { title: 'Record Assessment Score' },
      },
      {
        path: 'progress',
        alias: ['performance', 'learning-progress'],
        name: 'LearningProgress',
        component: LearningProgressView,
        meta: { title: 'Learning Progress' },
      },
      {
        path: 'reports',
        name: 'Reports',
        component: ReportsView,
        meta: { title: 'Reports' },
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: AnnouncementsView,
        meta: { title: 'Announcements' },
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
    ? `${to.meta.title} — ALS LMS Teacher`
    : 'ALS LMS — Teacher Portal';
});

export default router;

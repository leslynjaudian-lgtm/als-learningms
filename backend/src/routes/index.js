import { Router } from 'express';
import authRoutes from './auth.js';
import learningCenterRoutes from './learningCenters.js';
import teacherRoutes from './teachers.js';
import learnerRoutes from './learners.js';
import moduleRoutes from './modules.js';
import submissionRoutes from './submissions.js';
import announcementRoutes from './announcements.js';
import attendanceRoutes from './attendance.js';
import af2Routes from './af2.js';
import dashboardRoutes from './dashboard.js';
import scheduleRoutes from './schedules.js';
import recordRoutes from './records.js';
import reportRoutes from './reports.js';
import searchRoutes from './search.js';

const router = Router();

// ---------------------
// Health Check
// ---------------------
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ALS LMS Backend',
  });
});

// ---------------------
// Feature Routes
// ---------------------
router.use('/auth', authRoutes);
router.use('/learning-centers', learningCenterRoutes);
router.use('/teachers', teacherRoutes);
router.use('/learners', learnerRoutes);
router.use('/modules', moduleRoutes);
router.use('/submissions', submissionRoutes);
router.use('/announcements', announcementRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/af2', af2Routes);
router.use('/dashboard', dashboardRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/records', recordRoutes);
router.use('/reports', reportRoutes);
router.use('/search', searchRoutes);

export default router;

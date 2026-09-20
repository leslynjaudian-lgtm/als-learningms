import { Router } from 'express';
import learningCenterRoutes from './learningCenters.js';
import teacherRoutes from './teachers.js';
import learnerRoutes from './learners.js';

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
router.use('/learning-centers', learningCenterRoutes);
router.use('/teachers', teacherRoutes);
router.use('/learners', learnerRoutes);

export default router;

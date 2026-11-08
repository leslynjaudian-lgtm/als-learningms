import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { formatLearnerName } from './learners.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const AF2_FILE = path.join(DATA_DIR, 'af2_records.json');

function readAf2Records() {
  try {
    if (fs.existsSync(AF2_FILE)) {
      const raw = fs.readFileSync(AF2_FILE, 'utf-8');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('Could not read AF2 records file in reports route:', err);
  }
  return [];
}

const router = Router();

/**
 * Format ALS level for official DepEd reports
 */
function formatProgramLevel(level) {
  if (!level) return 'A&E Elementary';
  const norm = String(level).toUpperCase();
  if (norm === 'ELEMENTARY' || norm.includes('ELEM')) {
    return 'A&E Elementary';
  }
  return 'A&E Junior High School';
}

/**
 * GET /api/reports/module-progress
 * Official Summary of Module Use and Learner's Progress Report
 * Role-based:
 *  - ADMIN: all learners across all learning centers, levels, teachers
 *  - TEACHER: strictly assigned learners only
 */
router.get('/module-progress', authenticate, requireRole(['ADMIN', 'TEACHER']), async (req, res, next) => {
  try {
    const {
      learningCenterId,
      learningCenter,
      programLevel,
      level,
      fromDate,
      toDate,
    } = req.query;

    const userRole = req.user.role;
    const teacherId = req.user.profileId;

    // 1. Build base learner query with strict backend role-based access control
    const learnerWhere = {};

    // Role-based scoping: Teacher can ONLY see assigned learners
    if (userRole === 'TEACHER') {
      learnerWhere.assignedTeacherId = teacherId;
    }

    // Filter by Learning Center (ID or Name)
    if (learningCenterId) {
      const parsedCenterId = parseInt(learningCenterId, 10);
      if (!isNaN(parsedCenterId)) {
        learnerWhere.learningCenterId = parsedCenterId;
      }
    } else if (learningCenter && learningCenter !== 'All' && learningCenter !== 'All Learning Centers') {
      const centerObj = await prisma.learningCenter.findFirst({
        where: { name: learningCenter },
      });
      if (centerObj) {
        learnerWhere.learningCenterId = centerObj.id;
      }
    }

    // Filter by ALS Level
    const targetLevel = programLevel || level;
    if (targetLevel && targetLevel !== 'All' && targetLevel !== 'All Program Levels' && targetLevel !== 'All ALS Levels') {
      const norm = targetLevel.toUpperCase();
      if (norm.includes('ELEM')) {
        learnerWhere.level = 'ELEMENTARY';
      } else if (norm.includes('JUNIOR') || norm.includes('HIGH')) {
        learnerWhere.level = 'JUNIOR';
      }
    }

    // Date filtering (Date Registered or Created At)
    if (fromDate || toDate) {
      learnerWhere.createdAt = {};
      if (fromDate) {
        learnerWhere.createdAt.gte = new Date(`${fromDate}T00:00:00.000Z`);
      }
      if (toDate) {
        learnerWhere.createdAt.lte = new Date(`${toDate}T23:59:59.999Z`);
      }
    }

    // 2. Fetch learners matching criteria with their relations
    const learners = await prisma.learner.findMany({
      where: learnerWhere,
      include: {
        learningCenter: { select: { id: true, name: true, code: true } },
        assignedTeacher: { select: { id: true, fullName: true, position: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    // 3. Load authoritative saved performance records
    const allSavedRecords = readAf2Records();

    // 4. Process each learner's module usage and progress calculation from saved records ONLY
    // Do not include unrecorded assignments, progress, or published modules
    const processedLearners = learners.map((learner) => {
      const learnerSavedRecords = allSavedRecords.filter((r) => {
        if (r.learnerId && Number(r.learnerId) === learner.id) return true;
        if (r.lrn && learner.lrn && String(r.lrn).trim() === String(learner.lrn).trim()) return true;
        return false;
      });

      // Filter saved records by date range if specified (using finished date or started date)
      const filteredRecords = learnerSavedRecords.filter((r) => {
        const d = (r.dateFinished || r.dateCompleted || r.dateStarted || '').trim().split('T')[0];
        if (!d) return true;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });

      let masteredCount = 0;
      let notMasteredCount = 0;
      let pendingCount = 0;

      const moduleDetails = [];

      for (const r of filteredRecords) {
        const isMastered = r.assessment === 'Mastered' || r.moduleStatus === 'Mastered';
        const isNotMastered = r.assessment === 'Not Mastered' || r.moduleStatus === 'Not Mastered';
        let status = 'In Progress';
        if (isMastered) {
          status = 'Mastered';
          masteredCount++;
        } else if (isNotMastered) {
          status = 'Not Mastered';
          notMasteredCount++;
        } else {
          status = r.assessment || r.moduleStatus || 'In Progress';
          pendingCount++;
        }

        moduleDetails.push({
          moduleId: r.moduleId || r.id,
          title: r.moduleTitle || 'Learning Module',
          code: r.moduleCode || (r.moduleId ? `MOD-${r.moduleId}` : '—'),
          strand: r.strandName || 'General',
          status,
          preTestScore: r.preTestScore != null && r.preTestScore !== '' ? Number(r.preTestScore) : null,
          postTestScore: r.postTestScore != null && r.postTestScore !== '' ? Number(r.postTestScore) : null,
          completedPages: 0,
          totalPages: 0,
          dateCompleted: r.dateFinished || r.dateCompleted || null,
        });
      }

      const totalModules = filteredRecords.length;
      const progressPct = totalModules > 0 ? Math.round((masteredCount / totalModules) * 100) : 0;

      // Clean gender categorization
      const rawGender = (learner.gender || '').trim().toUpperCase();
      const isFemale = rawGender === 'FEMALE' || rawGender === 'F';
      const genderGroup = isFemale ? 'Female' : 'Male';

      return {
        id: learner.id,
        lrn: learner.lrn || '',
        fullName: formatLearnerName(learner),
        gender: genderGroup,
        learningCenterId: learner.learningCenterId,
        learningCenter: learner.learningCenter?.name || '—',
        programLevel: formatProgramLevel(learner.level),
        rawLevel: learner.level,
        teacherName: learner.assignedTeacher?.fullName || 'ALS Teacher',
        modulesCount: totalModules,
        mastered: masteredCount,
        notMastered: notMasteredCount,
        pending: pendingCount,
        progress: progressPct,
        moduleDetails,
      };
    });

    // 4. Split into Male and Female groupings as requested
    const maleLearners = processedLearners
      .filter((l) => l.gender === 'Male')
      .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const femaleLearners = processedLearners
      .filter((l) => l.gender === 'Female')
      .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const totalLearnersCount = processedLearners.length;
    const totalMasteredSum = processedLearners.reduce((acc, l) => acc + l.mastered, 0);
    const totalNotMasteredSum = processedLearners.reduce((acc, l) => acc + l.notMastered, 0);
    const totalPendingSum = processedLearners.reduce((acc, l) => acc + l.pending, 0);
    const avgProgress =
      totalLearnersCount > 0
        ? Math.round(processedLearners.reduce((acc, l) => acc + l.progress, 0) / totalLearnersCount)
        : 0;

    res.json({
      success: true,
      meta: {
        userRole,
        totalLearners: totalLearnersCount,
        totalMale: maleLearners.length,
        totalFemale: femaleLearners.length,
        totalMastered: totalMasteredSum,
        totalNotMastered: totalNotMasteredSum,
        totalPending: totalPendingSum,
        averageProgress: avgProgress,
        generatedAt: new Date().toISOString(),
      },
      male: maleLearners,
      female: femaleLearners,
      all: processedLearners,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/module-progress/learner/:id
 * Detailed modal data for a single learner
 */
router.get('/module-progress/learner/:id', authenticate, requireRole(['ADMIN', 'TEACHER']), async (req, res, next) => {
  try {
    const learnerId = parseInt(req.params.id, 10);
    if (isNaN(learnerId)) {
      return res.status(400).json({ error: 'Invalid learner ID' });
    }

    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      include: {
        learningCenter: true,
        assignedTeacher: true,
      },
    });

    if (!learner) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    // Role check: Teacher can ONLY view assigned learners
    if (req.user.role === 'TEACHER' && learner.assignedTeacherId !== req.user.profileId) {
      return res.status(403).json({ error: 'Access denied. You can only view details of your assigned learners.' });
    }

    // Load saved records strictly for this learner from authoritative saved AF2 records
    const allSavedRecords = readAf2Records();
    const learnerSaved = allSavedRecords.filter((r) => {
      if (r.learnerId && Number(r.learnerId) === learner.id) return true;
      if (r.lrn && learner.lrn && String(r.lrn).trim() === String(learner.lrn).trim()) return true;
      return false;
    });

    let masteredCount = 0;
    let notMasteredCount = 0;
    let pendingCount = 0;

    const moduleItems = learnerSaved.map((r) => {
      const isMastered = r.assessment === 'Mastered' || r.moduleStatus === 'Mastered';
      const isNotMastered = r.assessment === 'Not Mastered' || r.moduleStatus === 'Not Mastered';

      let status = 'In Progress';
      if (isMastered) {
        status = 'Mastered';
        masteredCount++;
      } else if (isNotMastered) {
        status = 'Not Mastered';
        notMasteredCount++;
      } else {
        status = r.assessment || r.moduleStatus || 'In Progress';
        pendingCount++;
      }

      const preScore = r.preTestScore != null && r.preTestScore !== '' ? Number(r.preTestScore) : null;
      const preMax = r.preTestTotal != null && r.preTestTotal !== '' ? Number(r.preTestTotal) : (preScore != null ? 10 : null);
      const prePct = preScore != null && preMax > 0 ? Math.round((preScore / preMax) * 100) : null;

      const postScore = r.postTestScore != null && r.postTestScore !== '' ? Number(r.postTestScore) : null;
      const postMax = r.postTestTotal != null && r.postTestTotal !== '' ? Number(r.postTestTotal) : (postScore != null ? 10 : null);
      const postPct = postScore != null && postMax > 0 ? Math.round((postScore / postMax) * 100) : null;

      return {
        id: r.id || r.moduleId,
        code: r.moduleCode || (r.moduleId ? `MOD-${r.moduleId}` : '—'),
        title: r.moduleTitle || 'Learning Module',
        strand: r.strandName || 'General',
        status,
        preTest: {
          score: preScore,
          max: preMax,
          percentage: prePct,
        },
        postTest: {
          score: postScore,
          max: postMax,
          percentage: postPct,
          isPassed: isMastered,
        },
        submission: null,
        completedPages: 0,
        totalPages: 0,
        completedAt: r.dateFinished || r.dateCompleted || null,
        dateStarted: r.dateStarted || null,
      };
    });

    const totalModules = learnerSaved.length;
    const progressPct = totalModules > 0 ? Math.round((masteredCount / totalModules) * 100) : 0;

    res.json({
      learner: {
        id: learner.id,
        lrn: learner.lrn || '',
        fullName: formatLearnerName(learner),
        gender: learner.gender || '—',
        level: formatProgramLevel(learner.level),
        rawLevel: learner.level,
        address: learner.address || '—',
        contactNo: learner.contactNo || '—',
        birthDate: learner.birthDate ? learner.birthDate.toISOString().split('T')[0] : null,
        learningCenter: learner.learningCenter?.name || '—',
        learningCenterCode: learner.learningCenter?.code || '',
        assignedTeacher: learner.assignedTeacher?.fullName || '—',
      },
      summary: {
        totalModules,
        mastered: masteredCount,
        notMastered: notMasteredCount,
        pending: pendingCount,
        progress: progressPct,
      },
      modules: moduleItems,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

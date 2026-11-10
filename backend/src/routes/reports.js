import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { formatLearnerName } from './learners.js';
import { buildLearnerModuleProgressSummary } from '../utils/moduleProgressStatus.js';

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
  return 'A&E Junior High';
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
    let {
      learningCenterId,
      learningCenter,
      programLevel,
      level,
      fromDate,
      toDate,
      month,
      schoolYear,
      year,
    } = req.query;

    // Dynamically calculate fromDate and toDate if month or schoolYear is provided and not explicitly set
    if (month && month !== 'all' && month !== 'All Months') {
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      let mIdx = -1;
      const cleanMonth = String(month).trim().toLowerCase();
      const asNum = parseInt(cleanMonth, 10);
      if (!isNaN(asNum) && asNum >= 1 && asNum <= 12) {
        mIdx = asNum - 1;
      } else {
        mIdx = monthNames.indexOf(cleanMonth);
      }

      if (mIdx !== -1) {
        let yr = new Date().getFullYear();
        const syStr = String(schoolYear || '').trim();
        if (syStr && syStr.includes('-')) {
          const [syStart, syEnd] = syStr.split('-').map(Number);
          if (!isNaN(syStart) && !isNaN(syEnd)) {
            yr = mIdx >= 5 ? syStart : syEnd;
          }
        } else if (year) {
          const parsedYr = Number(year);
          if (!isNaN(parsedYr) && parsedYr > 1900) yr = parsedYr;
        } else if (syStr) {
          const parsedYr = Number(syStr);
          if (!isNaN(parsedYr) && parsedYr > 1900) yr = parsedYr;
        }

        const lastDay = new Date(yr, mIdx + 1, 0).getDate();
        const pad = (n) => String(n).padStart(2, '0');
        fromDate = `${yr}-${pad(mIdx + 1)}-01`;
        toDate = `${yr}-${pad(mIdx + 1)}-${pad(lastDay)}`;
      }
    } else if (schoolYear && !fromDate && !toDate) {
      const syStr = String(schoolYear).trim();
      if (syStr && syStr.includes('-')) {
        const [syStart, syEnd] = syStr.split('-').map(Number);
        if (!isNaN(syStart) && !isNaN(syEnd)) {
          fromDate = `${syStart}-06-01`;
          toDate = `${syEnd}-05-31`;
        }
      }
    }

    const userRole = req.user.role;
    const teacherId = req.user.profileId;

    // 1. Build base learner query with strict backend role-based access control
    const learnerWhere = {};

    // Role-based scoping: Teacher can ONLY see assigned learners (or at their CLC if unassigned)
    if (userRole === 'TEACHER') {
      const teacherProfileId = req.user.profileId;
      const teacherUserId = req.user.userId || req.user.id;
      const teacherCenterId = req.user.teacherProfile?.learningCenterId;

      learnerWhere.OR = [
        { assignedTeacherId: teacherProfileId },
      ];
      if (teacherUserId && teacherUserId !== teacherProfileId) {
        learnerWhere.OR.push({ assignedTeacherId: teacherUserId });
      }
      if (teacherCenterId) {
        learnerWhere.OR.push({
          learningCenterId: teacherCenterId,
          assignedTeacherId: null,
        });
      }
    } else if (userRole === 'ADMIN' && req.query.teacherId) {
      const tid = parseInt(req.query.teacherId, 10);
      if (!isNaN(tid)) {
        learnerWhere.assignedTeacherId = tid;
      }
    }

    // Filter by Learning Center (ID or Name)
    const centerParam = learningCenterId || learningCenter;
    if (centerParam && centerParam !== 'All' && centerParam !== 'All Learning Centers' && centerParam !== 'All Assigned Centers') {
      const trimmed = String(centerParam).trim();
      const asNum = parseInt(trimmed, 10);
      if (!isNaN(asNum) && /^\d+$/.test(trimmed)) {
        learnerWhere.learningCenterId = asNum;
      } else {
        const centerObj = await prisma.learningCenter.findFirst({
          where: {
            OR: [
              { name: trimmed },
              { code: trimmed },
            ],
          },
        });
        if (centerObj) {
          learnerWhere.learningCenterId = centerObj.id;
        } else {
          learnerWhere.learningCenter = { name: trimmed };
        }
      }
    }

    // Filter by ALS Level
    const targetLevel = programLevel || level;
    if (targetLevel && targetLevel !== 'All' && targetLevel !== 'All Program Levels' && targetLevel !== 'All ALS Levels') {
      const norm = String(targetLevel).toUpperCase().trim();
      if (norm.includes('ELEM')) {
        learnerWhere.level = 'ELEMENTARY';
      } else if (norm.includes('JUNIOR') || norm.includes('HIGH') || norm.includes('JHS') || norm.includes('SEC')) {
        learnerWhere.level = 'JUNIOR';
      }
    }

    // Role-based ALS Level authorization scoping for teachers
    let teacherSpecialization = null;
    if (userRole === 'TEACHER') {
      teacherSpecialization = req.user.teacherProfile?.specialization || 'Both';
    } else if (userRole === 'ADMIN' && req.query.teacherId) {
      const tid = parseInt(req.query.teacherId, 10);
      if (!isNaN(tid)) {
        const tObj = await prisma.teacher.findFirst({
          where: { OR: [{ id: tid }, { userId: tid }] },
          select: { specialization: true },
        });
        if (tObj) teacherSpecialization = tObj.specialization || 'Both';
      }
    }

    if (teacherSpecialization) {
      const spec = String(teacherSpecialization).toLowerCase().trim();
      const allowsElem = spec.includes('elem') || spec.includes('both');
      const allowsJhs = spec.includes('junior') || spec.includes('jhs') || spec.includes('sec') || spec.includes('both');

      if (!allowsElem && !allowsJhs) {
        return res.json({
          success: true,
          meta: {
            userRole,
            totalLearners: 0,
            totalMale: 0,
            totalFemale: 0,
            totalMastered: 0,
            totalNotMastered: 0,
            totalPending: 0,
            averageProgress: 0,
            generatedAt: new Date().toISOString(),
          },
          male: [],
          female: [],
          all: [],
        });
      }

      if (allowsElem && !allowsJhs) {
        if (learnerWhere.level && learnerWhere.level !== 'ELEMENTARY') {
          return res.json({
            success: true,
            meta: {
              userRole,
              totalLearners: 0,
              totalMale: 0,
              totalFemale: 0,
              totalMastered: 0,
              totalNotMastered: 0,
              totalPending: 0,
              averageProgress: 0,
              generatedAt: new Date().toISOString(),
            },
            male: [],
            female: [],
            all: [],
          });
        }
        learnerWhere.level = 'ELEMENTARY';
      } else if (allowsJhs && !allowsElem) {
        if (learnerWhere.level && learnerWhere.level !== 'JUNIOR') {
          return res.json({
            success: true,
            meta: {
              userRole,
              totalLearners: 0,
              totalMale: 0,
              totalFemale: 0,
              totalMastered: 0,
              totalNotMastered: 0,
              totalPending: 0,
              averageProgress: 0,
              generatedAt: new Date().toISOString(),
            },
            male: [],
            female: [],
            all: [],
          });
        }
        learnerWhere.level = 'JUNIOR';
      }
    }

    // 2. Fetch learners matching criteria with their relations
    // NOTE: Date filtering (fromDate / toDate) applies strictly to learning performance records, NOT to learner enrollment!
    const learners = await prisma.learner.findMany({
      where: learnerWhere,
      include: {
        learningCenter: { select: { id: true, name: true, code: true } },
        assignedTeacher: { select: { id: true, fullName: true, position: true } },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
        { fullName: 'asc' },
      ],
    });

    // 3. Load authoritative saved performance records and database module/progress records
    const allSavedRecords = readAf2Records();
    const learnerIds = learners.map((l) => l.id);

    const moduleWhere = {};
    if (userRole === 'TEACHER') {
      const tIds = [req.user.profileId, req.user.userId, req.user.id].filter((v) => v != null && !isNaN(Number(v))).map(Number);
      if (tIds.length > 0) {
        moduleWhere.teacherId = { in: tIds };
      }
    }

    const [dbModules, allAssignments, allProgress, allSubmissions, allAttempts] = await Promise.all([
      prisma.module.findMany({
        where: moduleWhere,
        include: {
          learningArea: { select: { id: true, name: true, code: true } },
          assessments: {
            select: {
              id: true,
              type: true,
              _count: { select: { questions: true } },
            },
          },
          assignments: { select: { id: true, learnerId: true } },
          _count: { select: { pages: true } },
        },
      }).catch(() => []),
      learnerIds.length > 0
        ? prisma.moduleAssignment.findMany({
            where: {
              learnerId: { in: learnerIds },
              ...(userRole === 'TEACHER' && moduleWhere.teacherId ? { module: moduleWhere } : {}),
            },
            include: {
              module: {
                include: {
                  learningArea: true,
                  assessments: { select: { id: true, type: true, _count: { select: { questions: true } } } },
                  _count: { select: { pages: true } },
                },
              },
            },
          }).catch(() => [])
        : Promise.resolve([]),
      learnerIds.length > 0
        ? prisma.learnerProgress.findMany({
            where: {
              learnerId: { in: learnerIds },
              ...(userRole === 'TEACHER' && moduleWhere.teacherId ? { module: moduleWhere } : {}),
            },
            include: {
              module: {
                include: {
                  learningArea: true,
                  assessments: { select: { id: true, type: true, _count: { select: { questions: true } } } },
                  _count: { select: { pages: true } },
                },
              },
            },
          }).catch(() => [])
        : Promise.resolve([]),
      learnerIds.length > 0
        ? prisma.submission.findMany({
            where: {
              learnerId: { in: learnerIds },
              ...(userRole === 'TEACHER' && moduleWhere.teacherId ? { module: moduleWhere } : {}),
            },
            include: {
              module: {
                include: {
                  learningArea: true,
                  assessments: { select: { id: true, type: true, _count: { select: { questions: true } } } },
                  _count: { select: { pages: true } },
                },
              },
            },
          }).catch(() => [])
        : Promise.resolve([]),
      learnerIds.length > 0
        ? prisma.assessmentAttempt.findMany({
            where: {
              learnerId: { in: learnerIds },
              ...(userRole === 'TEACHER' && moduleWhere.teacherId ? { assessment: { module: moduleWhere } } : {}),
            },
            include: {
              assessment: {
                select: {
                  id: true,
                  moduleId: true,
                  type: true,
                  _count: { select: { questions: true } },
                },
              },
            },
            orderBy: { submittedAt: 'desc' },
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    // 4. Process each learner's module usage and progress using shared classification logic
    // Include all enrolled learners even if they have 0 module records
    const processedLearners = learners.map((learner) => {
      const lAssigns = allAssignments.filter((a) => a.learnerId === learner.id);
      const lProgs = allProgress.filter((p) => p.learnerId === learner.id);
      const lSubs = allSubmissions.filter((s) => s.learnerId === learner.id);
      const lAtts = allAttempts.filter((a) => a.learnerId === learner.id);

      const { modules: moduleItems, summary } = buildLearnerModuleProgressSummary({
        learner,
        af2Records: allSavedRecords,
        dbModules,
        dbAssignments: lAssigns,
        dbProgress: lProgs,
        dbSubmissions: lSubs,
        dbAttempts: lAtts,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });

      const moduleDetails = moduleItems.map((m) => ({
        moduleId: m.moduleId || m.id,
        title: m.title,
        code: m.code,
        strand: m.strand,
        status: m.status,
        preTestScore: m.preTest?.score ?? null,
        postTestScore: m.postTest?.score ?? null,
        completedPages: m.completedPages || 0,
        totalPages: m.totalPages || 0,
        dateCompleted: m.completedAt || null,
      }));

      // Clean gender categorization
      const rawGender = (learner.gender || '').trim().toUpperCase();
      const isFemale = rawGender === 'FEMALE' || rawGender === 'F';
      const genderGroup = isFemale ? 'Female' : 'Male';

      return {
        id: learner.id,
        lrn: learner.lrn || '',
        name: formatLearnerName(learner),
        fullName: formatLearnerName(learner),
        firstName: learner.firstName || '',
        middleName: learner.middleName || '',
        lastName: learner.lastName || '',
        gender: genderGroup,
        sex: learner.gender || genderGroup,
        learningCenterId: learner.learningCenterId,
        learningCenter: learner.learningCenter?.name || '—',
        level: formatProgramLevel(learner.level),
        programLevel: formatProgramLevel(learner.level),
        rawLevel: learner.level,
        assignedTeacherId: learner.assignedTeacherId,
        assignedTeacher: learner.assignedTeacher?.fullName || '—',
        teacher: learner.assignedTeacher?.fullName || '—',
        teacherName: learner.assignedTeacher?.fullName || 'ALS Teacher',
        status: learner.status || 'Active',
        dob: learner.birthDate ? learner.birthDate.toISOString().split('T')[0] : '—',
        contactNumber: learner.contactNo || '—',
        address: learner.address || '—',
        dateRegistered: learner.createdAt ? learner.createdAt.toISOString().split('T')[0] : '—',
        modulesCount: summary.totalModules,
        mastered: summary.mastered,
        notMastered: summary.notMastered,
        pending: summary.pending,
        progress: summary.progress,
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

    // Role check: Teacher can ONLY view assigned learners matching their authorization
    if (req.user.role === 'TEACHER') {
      const currentTeacherId = req.user.profileId;
      const currentUserId = req.user.userId || req.user.id;
      const teacherCenterId = req.user.teacherProfile?.learningCenterId;

      const isAssigned =
        learner.assignedTeacherId === currentTeacherId ||
        learner.assignedTeacherId === currentUserId ||
        (teacherCenterId && learner.learningCenterId === teacherCenterId && !learner.assignedTeacherId);

      if (!isAssigned) {
        return res.status(403).json({ error: 'Access denied. You can only view details of your assigned learners.' });
      }
      const spec = String(req.user.teacherProfile?.specialization || 'Both').toLowerCase().trim();
      const allowsElem = spec.includes('elem') || spec.includes('both');
      const allowsJhs = spec.includes('junior') || spec.includes('jhs') || spec.includes('sec') || spec.includes('both');
      const isElem = learner.level === 'ELEMENTARY' || String(learner.level || '').toUpperCase().includes('ELEM');
      if ((isElem && !allowsElem) || (!isElem && !allowsJhs)) {
        return res.status(403).json({ error: 'Access denied. Learner ALS level is not authorized for your account.' });
      }
    }

    // Load saved records strictly for this learner from authoritative saved AF2 records
    const allSavedRecords = readAf2Records();
    const { fromDate, toDate } = req.query;

    const moduleWhere = {};
    if (req.user.role === 'TEACHER') {
      const tIds = [req.user.profileId, req.user.userId, req.user.id].filter((v) => v != null && !isNaN(Number(v))).map(Number);
      if (tIds.length > 0) {
        moduleWhere.teacherId = { in: tIds };
      }
    }

    const [dbModules, dbAssignments, dbProgress, dbSubmissions, dbAttempts] = await Promise.all([
      prisma.module.findMany({
        where: moduleWhere,
        include: {
          learningArea: { select: { id: true, name: true, code: true } },
          assessments: {
            select: {
              id: true,
              type: true,
              _count: { select: { questions: true } },
            },
          },
          assignments: { select: { id: true, learnerId: true } },
          _count: { select: { pages: true } },
        },
      }).catch(() => []),
      prisma.moduleAssignment.findMany({
        where: {
          learnerId: learner.id,
          ...(req.user.role === 'TEACHER' && moduleWhere.teacherId ? { module: moduleWhere } : {}),
        },
        include: {
          module: {
            include: {
              learningArea: true,
              assessments: { select: { id: true, type: true, _count: { select: { questions: true } } } },
              _count: { select: { pages: true } },
            },
          },
        },
      }).catch(() => []),
      prisma.learnerProgress.findMany({
        where: {
          learnerId: learner.id,
          ...(req.user.role === 'TEACHER' && moduleWhere.teacherId ? { module: moduleWhere } : {}),
        },
        include: {
          module: {
            include: {
              learningArea: true,
              assessments: { select: { id: true, type: true, _count: { select: { questions: true } } } },
              _count: { select: { pages: true } },
            },
          },
        },
      }).catch(() => []),
      prisma.submission.findMany({
        where: {
          learnerId: learner.id,
          ...(req.user.role === 'TEACHER' && moduleWhere.teacherId ? { module: moduleWhere } : {}),
        },
        include: {
          module: {
            include: {
              learningArea: true,
              assessments: { select: { id: true, type: true, _count: { select: { questions: true } } } },
              _count: { select: { pages: true } },
            },
          },
        },
      }).catch(() => []),
      prisma.assessmentAttempt.findMany({
        where: {
          learnerId: learner.id,
          ...(req.user.role === 'TEACHER' && moduleWhere.teacherId ? { assessment: { module: moduleWhere } } : {}),
        },
        include: {
          assessment: {
            select: {
              id: true,
              moduleId: true,
              type: true,
              _count: { select: { questions: true } },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }).catch(() => []),
    ]);

    const { modules: moduleItems, summary } = buildLearnerModuleProgressSummary({
      learner,
      af2Records: allSavedRecords,
      dbModules,
      dbAssignments,
      dbProgress,
      dbSubmissions,
      dbAttempts,
      fromDate: fromDate || null,
      toDate: toDate || null,
    });

    res.json({
      learner: {
        id: learner.id,
        lrn: learner.lrn || '',
        firstName: learner.firstName || '',
        middleName: learner.middleName || '',
        lastName: learner.lastName || '',
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
      summary,
      modules: moduleItems,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

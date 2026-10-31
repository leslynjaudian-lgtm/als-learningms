import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { formatLearnerName } from './learners.js';

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
        assignedModules: {
          include: {
            module: {
              include: {
                learningArea: true,
                assessments: {
                  include: {
                    _count: { select: { questions: true } },
                  },
                },
              },
            },
          },
        },
        progressRecords: {
          include: {
            module: {
              include: {
                learningArea: true,
                assessments: {
                  include: {
                    _count: { select: { questions: true } },
                  },
                },
              },
            },
          },
        },
        attempts: {
          include: {
            assessment: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    // Also fetch all published modules to link any curriculum level modules if needed
    const publishedModules = await prisma.module.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        learningArea: true,
        assessments: {
          include: {
            _count: { select: { questions: true } },
          },
        },
      },
    });

    // 3. Process each learner's module usage and progress calculation
    const processedLearners = learners.map((learner) => {
      // Collect unique modules for this learner
      const moduleMap = new Map();

      // a. Explicitly assigned modules
      if (Array.isArray(learner.assignedModules)) {
        for (const assign of learner.assignedModules) {
          if (assign.module) {
            moduleMap.set(assign.module.id, assign.module);
          }
        }
      }

      // b. Modules with progress records
      if (Array.isArray(learner.progressRecords)) {
        for (const prog of learner.progressRecords) {
          if (prog.module) {
            moduleMap.set(prog.module.id, prog.module);
          }
        }
      }

      // c. If no explicit assignments or progress, check published modules for their target level
      if (moduleMap.size === 0) {
        const levelModules = publishedModules.filter((m) => m.targetLevel === learner.level);
        for (const m of levelModules) {
          moduleMap.set(m.id, m);
        }
      }

      // Map progress and attempts
      const progressByModule = new Map();
      if (Array.isArray(learner.progressRecords)) {
        for (const prog of learner.progressRecords) {
          progressByModule.set(prog.moduleId, prog);
        }
      }

      const attemptsByAssessment = new Map();
      if (Array.isArray(learner.attempts)) {
        for (const att of learner.attempts) {
          // Keep best or most recent attempt
          const existing = attemptsByAssessment.get(att.assessmentId);
          if (!existing || Number(att.score) > Number(existing.score)) {
            attemptsByAssessment.set(att.assessmentId, att);
          }
        }
      }

      let masteredCount = 0;
      let notMasteredCount = 0;
      let pendingCount = 0;

      const moduleDetails = [];

      for (const [modId, mod] of moduleMap.entries()) {
        const prog = progressByModule.get(modId);
        let status = 'Pending';
        let preScore = prog?.preTestScore != null ? Number(prog.preTestScore) : null;
        let postScore = prog?.postTestScore != null ? Number(prog.postTestScore) : null;

        // Check assessments attached to module
        const preAss = mod.assessments?.find((a) => a.type === 'PRE_TEST');
        const postAss = mod.assessments?.find((a) => a.type === 'POST_TEST');

        const preAtt = preAss ? attemptsByAssessment.get(preAss.id) : null;
        const postAtt = postAss ? attemptsByAssessment.get(postAss.id) : null;

        if (preScore == null && preAtt) {
          preScore = Number(preAtt.score);
        }
        if (postScore == null && postAtt) {
          postScore = Number(postAtt.score);
        }

        // Determine mastery
        if (prog?.masteryStatus === 'MASTERED' || prog?.status === 'COMPLETED' || postAtt?.isPassed) {
          status = 'Mastered';
          masteredCount++;
        } else if (prog?.masteryStatus === 'NOT_MASTERED' || (postAtt && !postAtt.isPassed && postAtt.status === 'SUBMITTED')) {
          status = 'Not Mastered';
          notMasteredCount++;
        } else {
          status = 'Pending';
          pendingCount++;
        }

        moduleDetails.push({
          moduleId: mod.id,
          title: mod.title,
          code: mod.code || `MOD-${mod.id}`,
          strand: mod.learningArea?.name || 'General',
          status,
          preTestScore: preScore,
          postTestScore: postScore,
          completedPages: prog?.completedPages || 0,
          totalPages: prog?.totalPages || 0,
          dateCompleted: prog?.completedAt ? prog.completedAt.toISOString().split('T')[0] : null,
        });
      }

      const totalModules = moduleMap.size;
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
        assignedModules: {
          include: {
            module: {
              include: {
                learningArea: true,
                assessments: {
                  include: {
                    _count: { select: { questions: true } },
                  },
                },
              },
            },
          },
        },
        progressRecords: {
          include: {
            module: {
              include: {
                learningArea: true,
                assessments: {
                  include: {
                    _count: { select: { questions: true } },
                  },
                },
              },
            },
          },
        },
        attempts: {
          include: {
            assessment: {
              include: {
                module: true,
              },
            },
          },
          orderBy: { startedAt: 'desc' },
        },
        submissions: {
          include: {
            module: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!learner) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    // Role check: Teacher can ONLY view assigned learners
    if (req.user.role === 'TEACHER' && learner.assignedTeacherId !== req.user.profileId) {
      return res.status(403).json({ error: 'Access denied. You can only view details of your assigned learners.' });
    }

    // Collect all modules
    const moduleMap = new Map();
    if (Array.isArray(learner.assignedModules)) {
      for (const a of learner.assignedModules) {
        if (a.module) moduleMap.set(a.module.id, a.module);
      }
    }
    if (Array.isArray(learner.progressRecords)) {
      for (const p of learner.progressRecords) {
        if (p.module) moduleMap.set(p.module.id, p.module);
      }
    }

    // If none explicitly assigned, fallback to level modules
    if (moduleMap.size === 0) {
      const levelModules = await prisma.module.findMany({
        where: { targetLevel: learner.level, status: 'PUBLISHED' },
        include: {
          learningArea: true,
          assessments: {
            include: {
              _count: { select: { questions: true } },
            },
          },
        },
      });
      for (const m of levelModules) {
        moduleMap.set(m.id, m);
      }
    }

    const progressMap = new Map();
    for (const p of learner.progressRecords || []) {
      progressMap.set(p.moduleId, p);
    }

    const attemptsByAssessment = new Map();
    for (const att of learner.attempts || []) {
      const existing = attemptsByAssessment.get(att.assessmentId);
      if (!existing || Number(att.score) > Number(existing.score)) {
        attemptsByAssessment.set(att.assessmentId, att);
      }
    }

    const submissionByModule = new Map();
    for (const sub of learner.submissions || []) {
      if (!submissionByModule.has(sub.moduleId)) {
        submissionByModule.set(sub.moduleId, sub);
      }
    }

    let masteredCount = 0;
    let notMasteredCount = 0;
    let pendingCount = 0;

    const moduleItems = [];

    for (const [modId, mod] of moduleMap.entries()) {
      const prog = progressMap.get(modId);
      const sub = submissionByModule.get(modId);

      const preAss = mod.assessments?.find((a) => a.type === 'PRE_TEST');
      const postAss = mod.assessments?.find((a) => a.type === 'POST_TEST');

      const preAtt = preAss ? attemptsByAssessment.get(preAss.id) : null;
      const postAtt = postAss ? attemptsByAssessment.get(postAss.id) : null;

      let preScore = prog?.preTestScore != null ? Number(prog.preTestScore) : (preAtt ? Number(preAtt.score) : null);
      let postScore = prog?.postTestScore != null ? Number(prog.postTestScore) : (postAtt ? Number(postAtt.score) : null);

      let status = 'Pending';
      if (prog?.masteryStatus === 'MASTERED' || prog?.status === 'COMPLETED' || postAtt?.isPassed) {
        status = 'Mastered';
        masteredCount++;
      } else if (prog?.masteryStatus === 'NOT_MASTERED' || (postAtt && !postAtt.isPassed && postAtt.status === 'SUBMITTED')) {
        status = 'Not Mastered';
        notMasteredCount++;
      } else {
        status = 'Pending';
        pendingCount++;
      }

      moduleItems.push({
        id: mod.id,
        code: mod.code || `MOD-${mod.id}`,
        title: mod.title,
        strand: mod.learningArea?.name || 'General',
        status,
        preTest: {
          score: preScore,
          max: preAss?._count?.questions || (preAtt ? Number(preAtt.maxScore) : 10),
          percentage: preAtt ? Number(preAtt.percentage) : (preScore != null ? Math.round((preScore / 10) * 100) : null),
        },
        postTest: {
          score: postScore,
          max: postAss?._count?.questions || (postAtt ? Number(postAtt.maxScore) : 10),
          percentage: postAtt ? Number(postAtt.percentage) : (postScore != null ? Math.round((postScore / 10) * 100) : null),
          isPassed: postAtt ? Boolean(postAtt.isPassed) : (postScore != null ? postScore >= 7.5 : false),
        },
        submission: sub ? {
          title: sub.title,
          fileName: sub.fileName,
          fileUrl: sub.fileUrl,
          grade: sub.grade,
          feedback: sub.feedback,
          status: sub.status,
          submittedAt: sub.submittedAt,
        } : null,
        completedPages: prog?.completedPages || 0,
        totalPages: prog?.totalPages || 0,
        completedAt: prog?.completedAt || null,
        dateStarted: prog?.createdAt || null,
      });
    }

    const totalModules = moduleMap.size;
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

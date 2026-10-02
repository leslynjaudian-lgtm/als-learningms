import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const AF2_FILE = path.join(DATA_DIR, 'af2_records.json');

function syncAf2Record(recordData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let records = [];
    if (fs.existsSync(AF2_FILE)) {
      const raw = fs.readFileSync(AF2_FILE, 'utf-8');
      records = raw ? JSON.parse(raw) : [];
    }

    const existingIdx = records.findIndex(
      (r) =>
        (Number(r.learnerId) === Number(recordData.learnerId) ||
         (r.learnerName && r.learnerName.toLowerCase() === (recordData.learnerName || '').toLowerCase())) &&
        (Number(r.moduleId) === Number(recordData.moduleId) ||
         (r.moduleTitle && r.moduleTitle.toLowerCase() === (recordData.moduleTitle || '').toLowerCase()))
    );

    if (existingIdx !== -1) {
      records[existingIdx] = {
        ...records[existingIdx],
        ...recordData,
        updatedAt: new Date().toISOString(),
      };
    } else {
      records.unshift({
        id: `af2_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...recordData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    fs.writeFileSync(AF2_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not sync AF2 record file:', err);
  }
}

const router = Router();

// Helper to format submission record
function formatSubmission(s) {
  let displayLevel = s.learner?.level;
  if (s.learner?.level === 'ELEMENTARY') displayLevel = 'A&E Elementary';
  else if (s.learner?.level === 'JUNIOR') displayLevel = 'A&E Junior';

  return {
    id: s.id,
    moduleId: s.moduleId,
    moduleTitle: s.module?.title || 'Learning Module',
    learnerId: s.learnerId,
    learnerName: s.learner?.fullName || 'Learner',
    lrn: s.learner?.lrn || '—',
    programLevel: displayLevel || '—',
    activity: s.title || s.module?.title || 'Module Activity Output',
    title: s.title || 'Module Activity Output',
    fileUrl: s.fileUrl || '',
    fileName: s.fileName || 'activity_photo.jpg',
    content: s.content || '',
    grade: s.grade ? Number(s.grade) : null,
    feedback: s.feedback || '',
    teacherRemarks: s.feedback || '',
    remarks: s.feedback || '',
    status: s.status || 'Not Evaluated',
    dateSubmitted: s.submittedAt ? s.submittedAt.toISOString().split('T')[0] : '',
    submittedAt: s.submittedAt,
    updatedAt: s.updatedAt,
  };
}

// Helper to retrieve actual Pre-Test and Post-Test scores for a specific learner & module
async function getLearnerAssessmentScores(learnerId, moduleId) {
  let preTestScore = null;
  let preTestTotal = null;
  let postTestScore = null;
  let postTestTotal = null;

  const parsedLearnerId = parseInt(learnerId, 10);
  const parsedModuleId = parseInt(moduleId, 10);

  if (isNaN(parsedLearnerId) || isNaN(parsedModuleId)) {
    return { preTestScore, preTestTotal, postTestScore, postTestTotal };
  }

  // 1. Check assessment attempts in DB for this learner & module
  try {
    const attempts = await prisma.assessmentAttempt.findMany({
      where: {
        learnerId: parsedLearnerId,
        assessment: { moduleId: parsedModuleId },
      },
      include: {
        assessment: {
          select: {
            id: true,
            type: true,
            _count: { select: { questions: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    for (const att of attempts) {
      const type = att.assessment?.type;
      const qCount = att.assessment?._count?.questions;
      const rawScore = att.score != null ? Number(att.score) : null;
      const rawMax = att.maxScore != null && Number(att.maxScore) > 0
        ? Number(att.maxScore)
        : (qCount && qCount > 0 ? qCount : 10);

      if (type === 'PRE_TEST' && preTestScore === null && rawScore !== null) {
        preTestScore = rawScore;
        preTestTotal = rawMax;
      } else if (type === 'POST_TEST' && postTestScore === null && rawScore !== null) {
        postTestScore = rawScore;
        postTestTotal = rawMax;
      }
    }
  } catch (err) {
    console.warn('Error fetching assessment attempts for scores:', err);
  }

  // 2. Check LearnerProgress in DB if either score is still missing
  try {
    const progress = await prisma.learnerProgress.findUnique({
      where: {
        learnerId_moduleId: {
          learnerId: parsedLearnerId,
          moduleId: parsedModuleId,
        },
      },
    });

    if (progress) {
      if (preTestScore === null && progress.preTestScore != null) {
        preTestScore = Number(progress.preTestScore);
      }
      if (postTestScore === null && progress.postTestScore != null) {
        postTestScore = Number(progress.postTestScore);
      }
    }
  } catch (err) {
    console.warn('Error fetching learner progress for scores:', err);
  }

  // 3. Fallback to AF2 records JSON if still missing
  try {
    const af2Records = readAf2Records();
    const af2 = af2Records.find(
      (r) => Number(r.learnerId) === parsedLearnerId && Number(r.moduleId) === parsedModuleId
    );
    if (af2) {
      if (preTestScore === null && af2.preTestScore != null && af2.preTestScore !== '') {
        preTestScore = Number(af2.preTestScore);
        if (af2.preTestTotal != null && af2.preTestTotal !== '') {
          preTestTotal = Number(af2.preTestTotal);
        }
      }
      if (postTestScore === null && af2.postTestScore != null && af2.postTestScore !== '') {
        postTestScore = Number(af2.postTestScore);
        if (af2.postTestTotal != null && af2.postTestTotal !== '') {
          postTestTotal = Number(af2.postTestTotal);
        }
      }
    }
  } catch (err) {
    console.warn('Error reading AF2 records for assessment scores:', err);
  }

  // 4. Default totals based on module questions count if available
  if (preTestTotal === null || postTestTotal === null) {
    try {
      const assessments = await prisma.assessment.findMany({
        where: { moduleId: parsedModuleId },
        include: { _count: { select: { questions: true } } },
      });
      for (const ass of assessments) {
        const count = ass._count?.questions;
        if (count && count > 0) {
          if (ass.type === 'PRE_TEST' && preTestTotal === null) preTestTotal = count;
          if (ass.type === 'POST_TEST' && postTestTotal === null) postTestTotal = count;
        }
      }
    } catch {}
  }

  if (preTestTotal === null) preTestTotal = 10;
  if (postTestTotal === null) postTestTotal = 10;

  return {
    preTestScore,
    preTestTotal,
    postTestScore,
    postTestTotal,
  };
}

// ---------------------
// GET /api/submissions/scores
// Query assessment scores for a specific module and learner
// ---------------------
router.get('/scores', optionalAuth, async (req, res, next) => {
  try {
    const { moduleId, learnerId } = req.query;
    if (!moduleId || !learnerId) {
      return res.status(400).json({ error: 'moduleId and learnerId are required' });
    }
    const scores = await getLearnerAssessmentScores(learnerId, moduleId);
    res.json(scores);
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/submissions
// List submissions with role scoping and assessment scores
// ---------------------
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { moduleId, learnerId, teacherId } = req.query;
    const where = {};

    if (moduleId) {
      const mid = parseInt(moduleId, 10);
      if (!isNaN(mid)) where.moduleId = mid;
    }

    // Role Scoping:
    if (req.user && req.user.role === 'LEARNER') {
      where.learnerId = req.user.profileId;
    } else if (req.user && req.user.role === 'TEACHER') {
      where.module = { teacherId: req.user.profileId };
      where.learner = { assignedTeacherId: req.user.profileId };
      if (learnerId) {
        const lid = parseInt(learnerId, 10);
        if (!isNaN(lid)) where.learnerId = lid;
      }
    } else if (teacherId) {
      const tid = parseInt(teacherId, 10);
      if (!isNaN(tid)) {
        where.module = { teacherId: tid };
        where.learner = { assignedTeacherId: tid };
      }
    } else if (learnerId) {
      const lid = parseInt(learnerId, 10);
      if (!isNaN(lid)) where.learnerId = lid;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        module: { select: { id: true, title: true, teacherId: true } },
        learner: { select: { id: true, fullName: true, lrn: true, level: true, assignedTeacherId: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const enriched = await Promise.all(
      submissions.map(async (s) => {
        const base = formatSubmission(s);
        const scores = await getLearnerAssessmentScores(s.learnerId, s.moduleId);
        return {
          ...base,
          ...scores,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/submissions
// Submit module activity (Learner)
// ---------------------
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { moduleId, title, content, fileUrl, fileName, learnerId: explicitLearnerId } = req.body;

    const parsedModuleId = parseInt(moduleId, 10);
    if (isNaN(parsedModuleId)) {
      return res.status(400).json({ error: 'Valid module ID is required' });
    }

    let targetLearnerId = null;
    if (req.user && req.user.role === 'LEARNER') {
      targetLearnerId = req.user.profileId;
    } else if (explicitLearnerId) {
      targetLearnerId = parseInt(explicitLearnerId, 10);
    } else {
      const first = await prisma.learner.findFirst();
      targetLearnerId = first?.id;
    }

    if (!targetLearnerId) {
      return res.status(400).json({ error: 'Learner ID is required for submission' });
    }

    const sub = await prisma.submission.create({
      data: {
        moduleId: parsedModuleId,
        learnerId: targetLearnerId,
        title: title?.trim() || 'Module Activity Output',
        content: content?.trim() || null,
        fileUrl: fileUrl?.trim() || null,
        fileName: fileName?.trim() || 'activity_output.pdf',
        status: 'SUBMITTED',
      },
      include: {
        module: { select: { id: true, title: true, teacherId: true } },
        learner: { select: { id: true, fullName: true, lrn: true } },
      },
    });

    // Update LearnerProgress to in progress
    await prisma.learnerProgress.upsert({
      where: {
        learnerId_moduleId: {
          learnerId: targetLearnerId,
          moduleId: parsedModuleId,
        },
      },
      create: {
        learnerId: targetLearnerId,
        moduleId: parsedModuleId,
        status: 'IN_PROGRESS',
      },
      update: {
        status: 'IN_PROGRESS',
      },
    });

    res.status(201).json(formatSubmission(sub));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// PUT /api/submissions/:id
// Facilitator reviews submission and sets status / teacher remarks
// ---------------------
async function handleSubmissionReview(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid submission ID' });

    const { grade, feedback, remarks, teacherRemarks, status, reviewedAt, teacherName, teacherId } = req.body;

    const sub = await prisma.submission.findUnique({
      where: { id },
      include: { module: true, learner: true },
    });

    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    if (req.user && req.user.role === 'TEACHER' && sub.module.teacherId !== req.user.profileId) {
      return res.status(403).json({ error: 'You can only review submissions for your own modules' });
    }

    const resolvedFeedback = teacherRemarks !== undefined
      ? teacherRemarks
      : (remarks !== undefined ? remarks : feedback);

    // Normalize learning progress status
    let normalizedStatus = status;
    if (status) {
      const lower = status.toLowerCase().replace(/_/g, ' ');
      if (lower === 'mastered') normalizedStatus = 'Mastered';
      else if (lower === 'not mastered') normalizedStatus = 'Not Mastered';
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        grade: grade !== undefined && grade !== null && grade !== '' ? Number(grade) : undefined,
        feedback: resolvedFeedback !== undefined ? String(resolvedFeedback).trim() : undefined,
        status: normalizedStatus || undefined,
      },
      include: {
        module: { select: { id: true, title: true, teacherId: true, level: true, strand: true, learningCenterId: true } },
        learner: { select: { id: true, fullName: true, lrn: true, level: true, assignedTeacherId: true, learningCenterId: true } },
      },
    });

    // Also update LearnerProgress in database
    if (sub.learnerId && sub.moduleId && normalizedStatus) {
      const isMastered = normalizedStatus === 'Mastered';
      const isNotMastered = normalizedStatus === 'Not Mastered';

      if (isMastered || isNotMastered) {
        const masteryDb = isMastered ? 'MASTERED' : 'NOT_MASTERED';
        const progressDb = isMastered ? 'COMPLETED' : 'IN_PROGRESS';

        await prisma.learnerProgress.upsert({
          where: {
            learnerId_moduleId: {
              learnerId: sub.learnerId,
              moduleId: sub.moduleId,
            },
          },
          update: {
            masteryStatus: masteryDb,
            status: progressDb,
            completedAt: isMastered ? new Date() : undefined,
          },
          create: {
            learnerId: sub.learnerId,
            moduleId: sub.moduleId,
            masteryStatus: masteryDb,
            status: progressDb,
            completedAt: isMastered ? new Date() : null,
          },
        }).catch((err) => console.warn('Could not update learner progress:', err));
      }
    }

    // Sync to AF2 records JSON file
    if (normalizedStatus) {
      syncAf2Record({
        learnerId: sub.learnerId,
        learnerName: sub.learner?.fullName || '',
        lrn: sub.learner?.lrn || '',
        level: sub.learner?.level === 'ELEMENTARY' ? 'A&E Elementary' : (sub.learner?.level === 'JUNIOR' ? 'A&E Junior' : 'A&E Elementary'),
        learningCenterId: sub.learner?.learningCenterId || sub.module?.learningCenterId || null,
        teacherId: teacherId || sub.module?.teacherId || null,
        teacherName: teacherName || '',
        moduleId: sub.moduleId,
        moduleTitle: sub.module?.title || sub.title || 'Learning Module',
        strandName: sub.module?.strand || '',
        assessment: normalizedStatus,
        moduleStatus: normalizedStatus,
        remarks: resolvedFeedback !== undefined ? String(resolvedFeedback).trim() : '',
        dateFinished: (reviewedAt || new Date().toISOString()).split('T')[0],
      });
    }

    res.json(formatSubmission(updated));
  } catch (err) {
    next(err);
  }
}

router.put('/:id', optionalAuth, handleSubmissionReview);
router.put('/:id/grade', optionalAuth, handleSubmissionReview);

export default router;

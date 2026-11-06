import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';
import { handleModuleFileUpload } from '../middleware/uploadMiddleware.js';
import { calculateModuleProgress, syncLearnerModuleProgress } from '../utils/progressCalculator.js';
import { notifyModulePublished } from '../services/notificationService.js';

const router = Router();

// Build a clean, readable filename for downloaded PDF modules (e.g. Science_LS2.pdf)
function buildReadablePdfFilename(m) {
  const rawTitle = String(m?.title || 'Learning_Module')
    .trim()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const rawStrand = String(m?.learningArea?.code || m?.code || '')
    .trim()
    .toUpperCase();
  const lsMatch = rawStrand.match(/^LS\d+/i);
  const cleanStrand = lsMatch
    ? lsMatch[0].toUpperCase()
    : rawStrand.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const baseTitle = rawTitle || 'Learning_Module';
  if (
    cleanStrand &&
    !baseTitle.toUpperCase().endsWith(`_${cleanStrand}`) &&
    baseTitle.toUpperCase() !== cleanStrand
  ) {
    return `${baseTitle}_${cleanStrand}.pdf`;
  }
  return `${baseTitle}.pdf`;
}

// Validate and normalize Pre-Test or Post-Test questions array
function validateAndNormalizeAssessmentQuestions(rawQuestions, label = 'Assessment') {
  if (!Array.isArray(rawQuestions)) {
    return { valid: true, questions: [] };
  }

  const normalizedQuestions = [];
  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i] || {};
    const qNum = i + 1;
    const qText = String(q.questionText ?? q.prompt ?? q.question ?? '').trim();

    if (!qText) {
      return {
        valid: false,
        error: `${label} Question ${qNum}: Please enter a question.`,
      };
    }

    const rawOptions = Array.isArray(q.options)
      ? q.options
      : Array.isArray(q.choices)
      ? q.choices
      : [];

    if (rawOptions.length < 2) {
      return {
        valid: false,
        error: `${label} Question ${qNum}: Please provide at least two answer options.`,
      };
    }

    const normalizedOptions = [];
    const seenOptionTexts = new Set();

    for (let j = 0; j < rawOptions.length; j++) {
      const opt = rawOptions[j];
      const optId = typeof opt === 'object' && opt?.id ? Number(opt.id) : null;
      const optText =
        typeof opt === 'string'
          ? opt.trim()
          : String(opt?.optionText ?? opt?.text ?? '').trim();

      if (!optText) {
        return {
          valid: false,
          error: `${label} Question ${qNum}: Empty answer choices are not allowed.`,
        };
      }

      const lowerText = optText.toLowerCase();
      if (seenOptionTexts.has(lowerText)) {
        return {
          valid: false,
          error: `${label} Question ${qNum}: Duplicate answer choices are not allowed.`,
        };
      }
      seenOptionTexts.add(lowerText);

      const letterAtJ = String.fromCharCode(65 + j);
      const isCorrect =
        typeof opt === 'object' && opt?.isCorrect !== undefined
          ? Boolean(opt.isCorrect)
          : q.correctOptionIndex !== undefined && q.correctOptionIndex !== null
          ? Number(q.correctOptionIndex) === j
          : q.correctAnswer !== undefined && q.correctAnswer !== null
          ? q.correctAnswer === j || String(q.correctAnswer).toUpperCase() === letterAtJ
          : false;

      normalizedOptions.push({
        id: !isNaN(optId) && optId > 0 ? optId : null,
        optionText: optText,
        isCorrect: Boolean(isCorrect),
        sortOrder: j + 1,
      });
    }

    const correctCount = normalizedOptions.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      return {
        valid: false,
        error: `${label} Question ${qNum}: Please select the correct answer in the Answer Key.`,
      };
    }

    const qId = q.id ? Number(q.id) : null;
    const hasCorrectFeedback = q.correctFeedback !== undefined;
    const hasIncorrectFeedback = q.incorrectFeedback !== undefined;
    const hasExplanation = q.explanation !== undefined;
    normalizedQuestions.push({
      id: !isNaN(qId) && qId > 0 ? qId : null,
      questionText: qText,
      explanation: q.explanation ? String(q.explanation).trim() : null,
      correctFeedback:
        q.correctFeedback !== undefined && q.correctFeedback !== null
          ? String(q.correctFeedback).trim() || null
          : null,
      incorrectFeedback:
        q.incorrectFeedback !== undefined && q.incorrectFeedback !== null
          ? String(q.incorrectFeedback).trim() || null
          : null,
      hasCorrectFeedback,
      hasIncorrectFeedback,
      hasExplanation,
      points: 1,
      sortOrder: i + 1,
      options: normalizedOptions,
    });
  }

  return { valid: true, questions: normalizedQuestions };
}

// Synchronize Pre-Test or Post-Test questions for a module without creating duplicate assessments/questions
// and while preserving existing learner attempts and scores.
async function syncModuleAssessment({ moduleId, teacherId, moduleTitle, type, questions }) {
  const existingAssessments = await prisma.assessment.findMany({
    where: { moduleId, type },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
        include: {
          options: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
      _count: { select: { attempts: true } },
    },
    orderBy: { id: 'asc' },
  });

  // Pick the primary assessment (prefer one with attempts if duplicates existed)
  let assessment =
    existingAssessments.find((a) => (a._count?.attempts || 0) > 0) ||
    existingAssessments[0] ||
    null;

  // Clean up any accidental duplicate assessments of the same type that have no attempts
  for (const extra of existingAssessments) {
    if (assessment && extra.id !== assessment.id && (extra._count?.attempts || 0) === 0) {
      await prisma.assessment.delete({ where: { id: extra.id } });
    }
  }

  const assessmentTitle = `${moduleTitle} - ${type === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'}`;
  const assessmentDesc =
    type === 'PRE_TEST'
      ? `Pre-Test (Assessment) for ${moduleTitle}`
      : `Post-Test for ${moduleTitle}`;

  if (!questions || questions.length === 0) {
    if (assessment) {
      const existingQIds = (assessment.questions || []).map((q) => q.id);
      if (existingQIds.length > 0) {
        await prisma.answerOption.deleteMany({ where: { questionId: { in: existingQIds } } });
        await prisma.question.deleteMany({ where: { id: { in: existingQIds } } });
      }
    }
    return;
  }

  if (!assessment) {
    assessment = await prisma.assessment.create({
      data: {
        moduleId,
        teacherId,
        title: assessmentTitle,
        type,
        description: assessmentDesc,
      },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
  } else {
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        title: assessmentTitle,
        description: assessmentDesc,
      },
    });
  }

  const existingQuestions = Array.isArray(assessment.questions) ? assessment.questions : [];
  const existingQMap = new Map(existingQuestions.map((eq) => [eq.id, eq]));
  const keptQuestionIds = new Set();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    let targetExistingQ = null;

    if (q.id && existingQMap.has(q.id) && !keptQuestionIds.has(q.id)) {
      targetExistingQ = existingQMap.get(q.id);
    } else if (!q.id && existingQuestions[i] && !keptQuestionIds.has(existingQuestions[i].id)) {
      // Fallback positional match if editing without explicit question IDs
      const positionalCandidate = existingQuestions[i];
      const isReferencedExplicitlyLater = questions
        .slice(i + 1)
        .some((laterQ) => laterQ.id === positionalCandidate.id);
      if (!isReferencedExplicitlyLater) {
        targetExistingQ = positionalCandidate;
      }
    }

    if (targetExistingQ) {
      keptQuestionIds.add(targetExistingQ.id);
      await prisma.question.update({
        where: { id: targetExistingQ.id },
        data: {
          questionText: q.questionText,
          questionType: 'MULTIPLE_CHOICE',
          points: 1,
          explanation: q.hasExplanation ? q.explanation : (targetExistingQ.explanation ?? null),
          correctFeedback: q.hasCorrectFeedback ? q.correctFeedback : (targetExistingQ.correctFeedback ?? null),
          incorrectFeedback: q.hasIncorrectFeedback ? q.incorrectFeedback : (targetExistingQ.incorrectFeedback ?? null),
          sortOrder: i + 1,
        },
      });

      const existingOpts = Array.isArray(targetExistingQ.options) ? targetExistingQ.options : [];
      const existingOptMap = new Map(existingOpts.map((eo) => [eo.id, eo]));
      const keptOptionIds = new Set();

      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        let targetExistingOpt = null;

        if (opt.id && existingOptMap.has(opt.id) && !keptOptionIds.has(opt.id)) {
          targetExistingOpt = existingOptMap.get(opt.id);
        } else if (!opt.id && existingOpts[j] && !keptOptionIds.has(existingOpts[j].id)) {
          const posOpt = existingOpts[j];
          const isOptReferencedLater = q.options
            .slice(j + 1)
            .some((laterO) => laterO.id === posOpt.id);
          if (!isOptReferencedLater) {
            targetExistingOpt = posOpt;
          }
        }

        if (targetExistingOpt) {
          keptOptionIds.add(targetExistingOpt.id);
          await prisma.answerOption.update({
            where: { id: targetExistingOpt.id },
            data: {
              optionText: opt.optionText,
              isCorrect: Boolean(opt.isCorrect),
              sortOrder: j + 1,
            },
          });
        } else {
          const createdOpt = await prisma.answerOption.create({
            data: {
              questionId: targetExistingQ.id,
              optionText: opt.optionText,
              isCorrect: Boolean(opt.isCorrect),
              sortOrder: j + 1,
            },
          });
          keptOptionIds.add(createdOpt.id);
        }
      }

      const optIdsToRemove = existingOpts
        .filter((eo) => !keptOptionIds.has(eo.id))
        .map((eo) => eo.id);
      if (optIdsToRemove.length > 0) {
        await prisma.answerOption.deleteMany({
          where: { id: { in: optIdsToRemove } },
        });
      }
    } else {
      const createdQ = await prisma.question.create({
        data: {
          assessmentId: assessment.id,
          questionText: q.questionText,
          questionType: 'MULTIPLE_CHOICE',
          points: 1,
          explanation: q.explanation || null,
          correctFeedback: q.correctFeedback || null,
          incorrectFeedback: q.incorrectFeedback || null,
          sortOrder: i + 1,
        },
      });
      keptQuestionIds.add(createdQ.id);

      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await prisma.answerOption.create({
          data: {
            questionId: createdQ.id,
            optionText: opt.optionText,
            isCorrect: Boolean(opt.isCorrect),
            sortOrder: j + 1,
          },
        });
      }
    }
  }

  const questionIdsToRemove = existingQuestions
    .filter((eq) => !keptQuestionIds.has(eq.id))
    .map((eq) => eq.id);
  if (questionIdsToRemove.length > 0) {
    await prisma.answerOption.deleteMany({
      where: { questionId: { in: questionIdsToRemove } },
    });
    await prisma.question.deleteMany({
      where: { id: { in: questionIdsToRemove } },
    });
  }
}
function formatModule(m, reqUser) {
  let displayLevel = m.targetLevel === 'ELEMENTARY' ? 'A&E Elementary' : 'A&E Junior High';
  if (m.targetLevel === 'ELEMENTARY' || m.targetLevel === 'A&E Elementary') {
    displayLevel = 'A&E Elementary';
  } else if (
    m.targetLevel === 'JUNIOR' ||
    m.targetLevel === 'A&E Junior' ||
    m.targetLevel === 'A&E Junior High' ||
    String(m.targetLevel || '').toUpperCase().includes('JUN')
  ) {
    displayLevel = 'A&E Junior High';
  }

  const assignedLearnerIds = Array.isArray(m.assignments)
    ? m.assignments.map((a) => a.learnerId)
    : [];
  const isAllLearners = assignedLearnerIds.length === 0;

  const isAssigned = Array.isArray(m.assignments) && reqUser?.profileId
    ? m.assignments.some((a) => a.learnerId === reqUser.profileId)
    : false;

  const formattedAssessments = Array.isArray(m.assessments)
    ? m.assessments.map((ass) => {
        const sortedQuestions = Array.isArray(ass.questions)
          ? [...ass.questions].sort(
              (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0)
            )
          : [];
        return {
          id: ass.id,
          title: ass.title,
          type: ass.type,
          description: ass.description || '',
          questionsCount: sortedQuestions.length,
          attempts: ass.attempts || [],
          questions: sortedQuestions.map((q) => {
            const sortedOpts = Array.isArray(q.options)
              ? [...q.options].sort(
                  (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0)
                )
              : [];
            const opts = sortedOpts.map((opt) => ({
              id: opt.id,
              optionText: opt.optionText,
              isCorrect: Boolean(opt.isCorrect),
              sortOrder: opt.sortOrder,
            }));
            const correctOpt = opts.find((o) => o.isCorrect);
            return {
              id: q.id,
              prompt: q.questionText,
              questionText: q.questionText,
              questionType: q.questionType,
              points: q.points,
              explanation: q.explanation || '',
              correctFeedback: q.correctFeedback || '',
              incorrectFeedback: q.incorrectFeedback || '',
              sortOrder: q.sortOrder,
              options: opts,
              choices: opts.map((o) => o.optionText),
              correctAnswer: opts.findIndex((o) => o.isCorrect),
              correctAnswerText: correctOpt?.optionText || '',
            };
          }),
        };
      })
    : [];

  const preTest = formattedAssessments.find((a) => a.type === 'PRE_TEST') || null;
  const postTest = formattedAssessments.find((a) => a.type === 'POST_TEST') || null;

  let fileName = '';
  let fileType = '';
  if (m.fileUrl) {
    fileName = m.fileUrl.split('/').pop() || 'Learning Material';
    const ext = fileName.split('.').pop()?.toUpperCase() || '';
    if (['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(ext)) {
      fileType = 'IMAGE';
    } else if (['DOC', 'DOCX'].includes(ext)) {
      fileType = 'DOCX';
    } else {
      fileType = 'PDF';
    }
  }

  let formattedPublishedDate = '';
  if (m.createdAt) {
    try {
      const d = new Date(m.createdAt);
      formattedPublishedDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      formattedPublishedDate = m.createdAt.toISOString().split('T')[0];
    }
  }

  // Learner Progress details if available
  const progressRecord = Array.isArray(m.learnerProgress) && m.learnerProgress.length > 0 ? m.learnerProgress[0] : null;
  const attempts = (m.assessments || []).flatMap((a) => a.attempts || []);
  const submissions = m.submissions || [];
  const progressCalc = calculateModuleProgress({
    module: m,
    learnerProgress: progressRecord,
    attempts,
    submissions,
  });

  const isCompleted = progressCalc.completed;
  const isInProgress = progressCalc.progressStatus === 'IN_PROGRESS';
  const progressPct = progressCalc.progress;

  let extractedModuleNumber = null;
  const numMatch = (m.code || '').match(/\d+$/) || (m.title || '').match(/Module\s*(\d+)/i) || (m.code || '').match(/(?:MOD|M)[-_]?(\d+)/i);
  if (numMatch) {
    extractedModuleNumber = parseInt(numMatch[1] || numMatch[0], 10);
  }

  return {
    id: m.id,
    code: m.code || m.learningArea?.code || 'LS1',
    moduleCode: m.code || m.learningArea?.code || `MOD-${m.id}`,
    moduleNumber: extractedModuleNumber,
    title: m.title,
    description: m.description || '',
    instructions: m.instructions || m.description || '',
    activitiesRelated: m.activitiesRelated || '',
    dateStarted: m.dateStarted ? m.dateStarted.toISOString().split('T')[0] : null,
    dateEnded: m.dateEnded ? m.dateEnded.toISOString().split('T')[0] : null,
    strand: m.learningArea?.name || 'General Curriculum',
    strandCode: m.learningArea?.code || m.code || 'LS1',
    learningAreaId: m.learningAreaId,
    level: displayLevel,
    programLevel: displayLevel,
    targetLevel: m.targetLevel,
    teacherId: m.teacherId,
    teacherName: m.teacher?.fullName || 'ALS Facilitator',
    learningCenterId: m.learningCenterId,
    learningCenter: m.learningCenter?.name || '—',
    fileUrl: m.fileUrl || '',
    fileName,
    fileType,
    downloadFileName: buildReadablePdfFilename(m),
    coverImageUrl: m.coverImageUrl || '',
    status: m.status || 'PUBLISHED',
    pagesCount: m._count?.pages ?? (Array.isArray(m.pages) ? m.pages.length : 0),
    activitiesCount: m._count?.pages ?? (Array.isArray(m.pages) ? m.pages.length : 0),
    assessmentsCount: m._count?.assessments ?? (Array.isArray(m.assessments) ? m.assessments.length : 0),
    assignedCount: m._count?.assignments ?? (Array.isArray(m.assignments) ? m.assignments.length : 0),
    isAssigned,
    isAllLearners,
    assignedLearnerIds,
    pages: m.pages || [],
    assessments: formattedAssessments,
    preTest,
    postTest,
    progress: progressPct,
    completed: isCompleted,
    progressStatus: isCompleted ? 'COMPLETED' : (isInProgress ? 'IN_PROGRESS' : 'NOT_STARTED'),
    preTestScore: progressRecord?.preTestScore != null ? Number(progressRecord.preTestScore) : null,
    postTestScore: progressRecord?.postTestScore != null ? Number(progressRecord.postTestScore) : null,
    masteryStatus: progressRecord?.masteryStatus || 'NOT_EVALUATED',
    createdAt: m.createdAt,
    publishedDate: formattedPublishedDate,
    datePublished: formattedPublishedDate,
    updatedAt: m.updatedAt,
  };
}

// ---------------------
// GET /api/modules
// List modules with strict role scoping
// ---------------------
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { teacherId, learningCenterId, level, targetLevel, target_level, strandId, portal } = req.query;
    const where = {};

    // Normalize requested ALS level directly to Prisma's AlsLevel enum ('ELEMENTARY' or 'JUNIOR')
    const rawLevel = targetLevel || target_level || level;
    let normalizedTargetLevel = null;
    if (rawLevel) {
      const upper = String(rawLevel).toUpperCase().trim();
      if (upper === 'ELEMENTARY' || upper.includes('ELEM')) {
        normalizedTargetLevel = 'ELEMENTARY';
      } else if (upper === 'JUNIOR' || upper.includes('JUN') || upper.includes('JHS') || upper.includes('SEC')) {
        normalizedTargetLevel = 'JUNIOR';
      }
    }

    // 1. Role Enforcement:
    if (req.user && req.user.role === 'LEARNER') {
      let learner = req.user.learnerProfile;
      if (!learner) {
        learner = await prisma.learner.findUnique({
          where: { userId: req.user.id },
          include: { learningCenter: true, assignedTeacher: true },
        });
      }

      if (!learner || !learner.learningCenterId) {
        // Learner has no assigned learning center, so no modules match
        return res.json([]);
      }

      // Condition 1: Module status = PUBLISHED
      where.status = 'PUBLISHED';

      // Condition 2: Module Learning Center matches learner's assigned Learning Center
      where.learningCenterId = learner.learningCenterId;

      // Condition 3: Module Program Level matches learner's Program Level
      where.targetLevel = learner.level;

      // Condition 4: Module Assignments (Applicable to all or specifically assigned to this learner)
      where.AND = [
        {
          OR: [
            { assignments: { none: {} } },
            { assignments: { some: { learnerId: learner.id } } },
          ],
        },
      ];
      where.code = { not: 'LS2-MOCK-001' };
    } else if (portal === 'learner' && !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    } else if (req.user && req.user.role === 'TEACHER') {
      // Teacher sees ONLY modules created by that teacher
      where.teacherId = req.user.profileId;

      // Backend authorization: Validate requested level against teacher's assigned levels
      const teacherSpec = String(req.user.teacherProfile?.specialization || 'Both').toLowerCase();
      const allowsElem = teacherSpec.includes('elem') || teacherSpec.includes('both');
      const allowsJhs = teacherSpec.includes('junior') || teacherSpec.includes('jhs') || teacherSpec.includes('sec') || teacherSpec.includes('both');

      if (normalizedTargetLevel === 'ELEMENTARY' && !allowsElem) {
        return res.status(403).json({ error: 'You are not authorized to view A&E Elementary modules.' });
      }
      if (normalizedTargetLevel === 'JUNIOR' && !allowsJhs) {
        return res.status(403).json({ error: 'You are not authorized to view A&E Junior High modules.' });
      }

      if (normalizedTargetLevel) {
        where.targetLevel = normalizedTargetLevel;
      } else {
        if (allowsElem && !allowsJhs) {
          where.targetLevel = 'ELEMENTARY';
        } else if (allowsJhs && !allowsElem) {
          where.targetLevel = 'JUNIOR';
        }
      }
    } else if (teacherId) {
      const tid = parseInt(teacherId, 10);
      if (!isNaN(tid)) where.teacherId = tid;
      if (normalizedTargetLevel) {
        where.targetLevel = normalizedTargetLevel;
      }
    }

    if (req.user?.role !== 'LEARNER') {
      if (learningCenterId) {
        const cid = parseInt(learningCenterId, 10);
        if (!isNaN(cid)) where.learningCenterId = cid;
      }

      if (normalizedTargetLevel) {
        where.targetLevel = normalizedTargetLevel;
      }
    }

    if (strandId) {
      const sid = parseInt(strandId, 10);
      if (!isNaN(sid)) where.learningAreaId = sid;
    }

    const learnerProfileId = req.user?.role === 'LEARNER' ? req.user.profileId : null;

    const modules = await prisma.module.findMany({
      where,
      include: {
        learningArea: true,
        teacher: { select: { id: true, fullName: true } },
        learningCenter: { select: { id: true, name: true } },
        assignments: true,
        learnerProgress: learnerProfileId ? {
          where: { learnerId: learnerProfileId },
        } : false,
        submissions: learnerProfileId ? {
          where: { learnerId: learnerProfileId },
          select: { id: true, status: true, submittedAt: true },
        } : false,
        assessments: {
          include: {
            questions: { select: { id: true } },
            attempts: learnerProfileId ? {
              where: { learnerId: learnerProfileId, status: 'SUBMITTED' },
            } : false,
          },
        },
        _count: {
          select: { pages: true, assessments: true, assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(modules.map((m) => formatModule(m, req.user)));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/modules/strands
// Get all official learning strands (learning areas)
// ---------------------
router.get('/strands', async (req, res, next) => {
  try {
    const areas = await prisma.learningArea.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(areas);
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/modules/:id
// Get a single module with pages
// ---------------------
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid module ID' });

    const learnerProfileId = req.user?.role === 'LEARNER' ? req.user.profileId : null;

    const mod = await prisma.module.findUnique({
      where: { id },
      include: {
        learningArea: true,
        teacher: { select: { id: true, fullName: true } },
        learningCenter: { select: { id: true, name: true } },
        pages: { orderBy: { pageNumber: 'asc' } },
        assessments: {
          include: {
            questions: {
              orderBy: { sortOrder: 'asc' },
              include: {
                options: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
            attempts: learnerProfileId ? {
              where: { learnerId: learnerProfileId },
              include: {
                answers: true,
              },
              orderBy: { submittedAt: 'desc' },
            } : false,
          },
        },
        assignments: true,
        learnerProgress: learnerProfileId ? {
          where: { learnerId: learnerProfileId },
        } : false,
        submissions: learnerProfileId ? {
          where: { learnerId: learnerProfileId },
          select: { id: true, status: true, submittedAt: true },
        } : false,
        _count: { select: { pages: true, assessments: true, assignments: true } },
      },
    });

    if (!mod) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Role check: If learner, verify module is published, matches learning center and program level, and assignments
    if (req.user && req.user.role === 'LEARNER') {
      let learner = req.user.learnerProfile;
      if (!learner) {
        learner = await prisma.learner.findUnique({
          where: { userId: req.user.id },
          include: { learningCenter: true, assignedTeacher: true },
        });
      }

      const isAssignedOrAll =
        !mod.assignments ||
        mod.assignments.length === 0 ||
        mod.assignments.some((a) => a.learnerId === learner?.id);

      const isAuthorized =
        learner &&
        mod.status === 'PUBLISHED' &&
        learner.learningCenterId &&
        mod.learningCenterId === learner.learningCenterId &&
        mod.targetLevel === learner.level &&
        isAssignedOrAll;

      if (!isAuthorized) {
        return res.status(403).json({ error: 'You are not authorized to view this learning module.' });
      }
    }

    res.json(formatModule(mod, req.user));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/modules/:id/download
// Download the original uploaded PDF module for authorized users
// ---------------------
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid module ID.' });
    }

    const mod = await prisma.module.findUnique({
      where: { id },
      include: {
        learningArea: true,
        assignments: true,
        pages: { orderBy: { pageNumber: 'asc' }, take: 1 },
      },
    });

    if (!mod) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    // Strict Role & Authorization Verification
    if (req.user.role === 'LEARNER') {
      let learner = req.user.learnerProfile;
      if (!learner) {
        learner = await prisma.learner.findUnique({
          where: { userId: req.user.id },
          include: { learningCenter: true, assignedTeacher: true },
        });
      }

      const isAssignedOrAll =
        !mod.assignments ||
        mod.assignments.length === 0 ||
        mod.assignments.some((a) => a.learnerId === learner?.id);

      const isAuthorized =
        Boolean(learner) &&
        mod.status === 'PUBLISHED' &&
        Boolean(learner.learningCenterId) &&
        mod.learningCenterId === learner.learningCenterId &&
        mod.targetLevel === learner.level &&
        isAssignedOrAll;

      if (!isAuthorized) {
        return res.status(403).json({
          error: 'You are not authorized to download this learning module.',
        });
      }
    } else if (req.user.role === 'TEACHER') {
      if (mod.teacherId !== req.user.profileId) {
        return res.status(403).json({
          error: 'You are not authorized to download this learning module.',
        });
      }
    }

    const rawFileUrl = String(mod.fileUrl || mod.pages?.[0]?.mediaUrl || '').trim();
    if (!rawFileUrl) {
      return res.status(404).json({
        error: 'No PDF file is attached to this learning module.',
      });
    }

    const cleanUrlPath = rawFileUrl.split('?')[0].split('#')[0];
    const safeBasename = path.basename(cleanUrlPath);

    if (!safeBasename || !safeBasename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        error: 'The learning material for this module is not a PDF document.',
      });
    }

    const uploadsModulesDir = path.resolve(process.cwd(), 'uploads', 'modules');
    const publicModulesDir = path.resolve(process.cwd(), '..', 'learner-portal', 'public', 'modules');

    const candidateUploadsPath = path.resolve(uploadsModulesDir, safeBasename);
    const candidatePublicPath = path.resolve(publicModulesDir, safeBasename);

    let resolvedFilePath = null;
    if (
      candidateUploadsPath.startsWith(uploadsModulesDir + path.sep) &&
      fs.existsSync(candidateUploadsPath) &&
      fs.statSync(candidateUploadsPath).isFile()
    ) {
      resolvedFilePath = candidateUploadsPath;
    } else if (
      (cleanUrlPath.startsWith('/modules/') || cleanUrlPath.startsWith('modules/')) &&
      candidatePublicPath.startsWith(publicModulesDir + path.sep) &&
      fs.existsSync(candidatePublicPath) &&
      fs.statSync(candidatePublicPath).isFile()
    ) {
      resolvedFilePath = candidatePublicPath;
    }

    if (!resolvedFilePath) {
      return res.status(404).json({
        error: 'The PDF file for this module could not be found on the server.',
      });
    }

    // Verify the file is a valid PDF document (%PDF- header)
    const fd = fs.openSync(resolvedFilePath, 'r');
    const headerBuf = Buffer.alloc(5);
    const bytesRead = fs.readSync(fd, headerBuf, 0, 5, 0);
    fs.closeSync(fd);

    if (bytesRead < 5 || headerBuf.toString('ascii') !== '%PDF-') {
      return res.status(422).json({
        error: 'The stored module file is not a valid PDF document.',
      });
    }

    const stat = fs.statSync(resolvedFilePath);
    const downloadFileName = buildReadablePdfFilename(mod);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${downloadFileName}"; filename*=UTF-8''${encodeURIComponent(downloadFileName)}`
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type');
    res.setHeader('Cache-Control', 'private, no-transform');

    const fileStream = fs.createReadStream(resolvedFilePath);
    fileStream.on('error', (streamErr) => {
      console.error('[Module PDF Download Stream Error]:', streamErr);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download PDF file.' });
      } else {
        res.destroy();
      }
    });
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// ---------------------
// ---------------------
// POST /api/modules/upload
// Upload module learning material (PDF, DOCX, JPG, PNG)
// ---------------------
router.post('/upload', optionalAuth, handleModuleFileUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/modules/${req.file.filename}`;
  res.status(201).json({
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
  });
});

export function getExpectedModuleCodeForStrand(strandName, areaCode) {
  if (areaCode) {
    const m = String(areaCode).match(/^LS\s*(\d+)/i);
    if (m) return `LS${m[1]}`;
  }
  const s = String(strandName || '').toLowerCase();
  if (s.includes('english') || s.includes('filipino') || s.includes('communication')) return 'LS1';
  if (s.includes('scient') || s.includes('science')) return 'LS2';
  if (s.includes('math') || s.includes('problem solving')) return 'LS3';
  if (s.includes('life') || s.includes('career')) return 'LS4';
  if (s.includes('self') || s.includes('society')) return 'LS5';
  if (s.includes('digital') || s.includes('citizenship')) return 'LS6';
  return null;
}

// ---------------------
// POST /api/modules
// Create a new module (Teacher or Admin)
// ---------------------
router.post('/', authenticate, requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const {
      title,
      code,
      moduleCode,
      dateStarted,
      dateEnded,
      description,
      instructions,
      activitiesRelated,
      learningAreaId,
      strand,
      strandName,
      targetLevel,
      level,
      fileUrl,
      fileName,
      coverImageUrl,
      status,
      learningCenterId,
      learningNotes,
      preTest,
      postTest,
      teacherId: explicitTeacherId,
      isAllLearners,
      assignedLearnerIds,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Module title is required' });
    }

    // Resolve Learning Area (Strand)
    let resolvedAreaId = learningAreaId ? parseInt(learningAreaId, 10) : null;
    if (!resolvedAreaId && (strand || strandName)) {
      const strandStr = String(strand || strandName).toLowerCase();
      const areas = await prisma.learningArea.findMany();
      const matched = areas.find((a) =>
        strandStr.includes(a.name.toLowerCase()) ||
        a.name.toLowerCase().includes(strandStr) ||
        (a.code && strandStr.includes(a.code.toLowerCase()))
      );
      if (matched) resolvedAreaId = matched.id;
    }

    if (!resolvedAreaId) {
      const defaultArea = await prisma.learningArea.findFirst();
      resolvedAreaId = defaultArea ? defaultArea.id : null;
      if (!resolvedAreaId) {
        const created = await prisma.learningArea.create({
          data: { code: 'LS1-ENG', name: 'Communication Skills (English)' },
        });
        resolvedAreaId = created.id;
      }
    }

    // Resolve Teacher
    let resolvedTeacherId = null;
    if (req.user && req.user.role === 'TEACHER') {
      resolvedTeacherId = req.user.profileId;
    } else if (explicitTeacherId) {
      resolvedTeacherId = parseInt(explicitTeacherId, 10);
    } else {
      const firstTeacher = await prisma.teacher.findFirst();
      if (firstTeacher) resolvedTeacherId = firstTeacher.id;
    }

    if (!resolvedTeacherId) {
      return res.status(400).json({ error: 'Teacher assignment is required to create a module.' });
    }

    // Resolve Learning Center
    let resolvedCenterId = learningCenterId ? parseInt(learningCenterId, 10) : null;
    if (!resolvedCenterId && resolvedTeacherId) {
      const teacherObj = await prisma.teacher.findUnique({
        where: { id: resolvedTeacherId },
        select: { learningCenterId: true },
      });
      resolvedCenterId = teacherObj?.learningCenterId || null;
    }
    if (!resolvedCenterId) {
      const firstCenter = await prisma.learningCenter.findFirst();
      if (firstCenter) resolvedCenterId = firstCenter.id;
    }

    // Resolve ALS Level
    let alsLevel = 'JUNIOR';
    const lvl = targetLevel || level;
    if (lvl === 'ELEMENTARY' || lvl === 'A&E Elementary') {
      alsLevel = 'ELEMENTARY';
    }

    // Backend authorization: Validate target ALS Level against teacher's assigned levels
    if (req.user && req.user.role === 'TEACHER') {
      const teacherSpec = String(req.user.teacherProfile?.specialization || 'Both').toLowerCase();
      const allowsElem = teacherSpec.includes('elem') || teacherSpec.includes('both');
      const allowsJhs = teacherSpec.includes('junior') || teacherSpec.includes('jhs') || teacherSpec.includes('sec') || teacherSpec.includes('both');

      if (alsLevel === 'ELEMENTARY' && !allowsElem) {
        return res.status(403).json({ error: 'You are not authorized to create or upload modules for A&E Elementary.' });
      }
      if (alsLevel === 'JUNIOR' && !allowsJhs) {
        return res.status(403).json({ error: 'You are not authorized to create or upload modules for A&E Junior High.' });
      }
    }

    // Validate Pre-Test and Post-Test questions before creating the module
    let normalizedPreQuestions = [];
    if (Array.isArray(preTest) && preTest.length > 0) {
      const preCheck = validateAndNormalizeAssessmentQuestions(preTest, 'Pre-Test');
      if (!preCheck.valid) {
        return res.status(400).json({ error: preCheck.error });
      }
      normalizedPreQuestions = preCheck.questions;
    }

    let normalizedPostQuestions = [];
    if (Array.isArray(postTest) && postTest.length > 0) {
      const postCheck = validateAndNormalizeAssessmentQuestions(postTest, 'Post-Test');
      if (!postCheck.valid) {
        return res.status(400).json({ error: postCheck.error });
      }
      normalizedPostQuestions = postCheck.questions;
    }

    // Validate Module Code against Learning Strand
    const areaObj = await prisma.learningArea.findUnique({ where: { id: resolvedAreaId } });
    const expectedModuleCode = getExpectedModuleCodeForStrand(strand || strandName || areaObj?.name, areaObj?.code);
    if (!expectedModuleCode) {
      return res.status(400).json({ error: 'No valid Module Code is configured for the selected Learning Strand.' });
    }
    const finalModuleCode = expectedModuleCode;

    // Create the Module record
    const resolvedInstructions = (instructions || description)?.trim() || null;
    const newModule = await prisma.module.create({
      data: {
        title: title.trim(),
        code: finalModuleCode,
        description: resolvedInstructions,
        instructions: resolvedInstructions,
        activitiesRelated: activitiesRelated?.trim() || null,
        dateStarted: dateStarted ? new Date(dateStarted) : null,
        dateEnded: dateEnded ? new Date(dateEnded) : null,
        learningAreaId: resolvedAreaId,
        teacherId: resolvedTeacherId,
        learningCenterId: resolvedCenterId,
        targetLevel: alsLevel,
        fileUrl: fileUrl?.trim() || null,
        coverImageUrl: coverImageUrl?.trim() || null,
        status: status || 'PUBLISHED',
      },
    });

    // 1. Save Learning Material / Notes (ModulePage)
    if (learningNotes && learningNotes.trim()) {
      await prisma.modulePage.create({
        data: {
          moduleId: newModule.id,
          pageNumber: 1,
          title: `${title.trim()} - Notes`,
          content: learningNotes.trim(),
          mediaUrl: fileUrl?.trim() || null,
        },
      });
    }

    // 2. Save Pre-Test Questions & Options
    if (normalizedPreQuestions.length > 0) {
      await syncModuleAssessment({
        moduleId: newModule.id,
        teacherId: resolvedTeacherId,
        moduleTitle: title.trim(),
        type: 'PRE_TEST',
        questions: normalizedPreQuestions,
      });
    }

    // 3. Save Post-Test Questions & Options
    if (normalizedPostQuestions.length > 0) {
      await syncModuleAssessment({
        moduleId: newModule.id,
        teacherId: resolvedTeacherId,
        moduleTitle: title.trim(),
        type: 'POST_TEST',
        questions: normalizedPostQuestions,
      });
    }

    // 4. Save Learner Assignment Recipients
    const shouldAssignToAll = isAllLearners === true || isAllLearners === 'true';
    if (!shouldAssignToAll && Array.isArray(assignedLearnerIds) && assignedLearnerIds.length > 0) {
      try {
        await prisma.$executeRawUnsafe('UPDATE modules SET assigned_to_all = 0 WHERE id = ?', newModule.id);
      } catch (e) {
        // ignore
      }
      const uniqueLIds = [...new Set(assignedLearnerIds.map((x) => parseInt(x, 10)).filter((x) => !isNaN(x)))];
      for (const lId of uniqueLIds) {
        await prisma.moduleAssignment.create({
          data: {
            moduleId: newModule.id,
            learnerId: lId,
          },
        });
      }
    } else {
      try {
        await prisma.$executeRawUnsafe('UPDATE modules SET assigned_to_all = 1 WHERE id = ?', newModule.id);
      } catch (e) {
        // ignore
      }
    }

    // Fetch full module with all relations to return
    const completeModule = await prisma.module.findUnique({
      where: { id: newModule.id },
      include: {
        learningArea: true,
        teacher: { select: { id: true, fullName: true } },
        learningCenter: { select: { id: true, name: true } },
        pages: true,
        assessments: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        assignments: true,
        _count: { select: { pages: true, assessments: true, assignments: true } },
      },
    });

    if (completeModule.status === 'PUBLISHED') {
      notifyModulePublished(completeModule.id).catch((e) => console.error('[Modules] notifyModulePublished error:', e));
    }

    res.status(201).json(formatModule(completeModule, req.user));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/modules/:id/assign
// Assign module to learners
// ---------------------
router.post('/:id/assign', authenticate, requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.id, 10);
    if (isNaN(moduleId)) return res.status(400).json({ error: 'Invalid module ID' });

    const { learnerId, learnerIds, dueDate } = req.body;
    const targetIds = Array.isArray(learnerIds)
      ? learnerIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id))
      : learnerId
      ? [parseInt(learnerId, 10)]
      : [];

    if (targetIds.length === 0) {
      return res.status(400).json({ error: 'At least one learner ID is required' });
    }

    const assignedRecords = [];
    for (const lid of targetIds) {
      const record = await prisma.moduleAssignment.upsert({
        where: {
          moduleId_learnerId: {
            moduleId,
            learnerId: lid,
          },
        },
        create: {
          moduleId,
          learnerId: lid,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        update: {
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });

      // Also ensure LearnerProgress entry exists
      await prisma.learnerProgress.upsert({
        where: {
          learnerId_moduleId: {
            learnerId: lid,
            moduleId,
          },
        },
        create: {
          learnerId: lid,
          moduleId,
          status: 'IN_PROGRESS',
        },
        update: {},
      });

      assignedRecords.push(record);
    }

    notifyModulePublished(moduleId).catch((e) => console.error('[Modules] notifyModulePublished error:', e));

    res.status(201).json({
      message: `Successfully assigned module to ${assignedRecords.length} learner(s)`,
      assignments: assignedRecords,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// PUT /api/modules/:id
// Update an existing module
// ---------------------
router.put('/:id', authenticate, requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid module ID' });

    const existingMod = await prisma.module.findUnique({
      where: { id },
      include: { assignments: true },
    });
    if (!existingMod) return res.status(404).json({ error: 'Module not found' });

    if (req.user && req.user.role === 'TEACHER' && existingMod.teacherId !== req.user.profileId) {
      return res.status(403).json({ error: 'You can only update your own modules' });
    }

    const {
      title,
      instructions,
      description,
      activitiesRelated,
      strand,
      level,
      learningCenterId,
      code,
      dateStarted,
      dateEnded,
      isAllLearners,
      assignedLearnerIds,
      preTest,
      postTest,
    } = req.body;

    // Validate Pre-Test and Post-Test questions if provided in the update payload
    let normalizedPreQuestions = null;
    if (preTest !== undefined) {
      if (!Array.isArray(preTest)) {
        return res.status(400).json({ error: 'Pre-Test must be an array of questions.' });
      }
      const preCheck = validateAndNormalizeAssessmentQuestions(preTest, 'Pre-Test');
      if (!preCheck.valid) {
        return res.status(400).json({ error: preCheck.error });
      }
      normalizedPreQuestions = preCheck.questions;
    }

    let normalizedPostQuestions = null;
    if (postTest !== undefined) {
      if (!Array.isArray(postTest)) {
        return res.status(400).json({ error: 'Post-Test must be an array of questions.' });
      }
      const postCheck = validateAndNormalizeAssessmentQuestions(postTest, 'Post-Test');
      if (!postCheck.valid) {
        return res.status(400).json({ error: postCheck.error });
      }
      normalizedPostQuestions = postCheck.questions;
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (instructions !== undefined) updateData.instructions = instructions ? instructions.trim() : '';
    if (description !== undefined) updateData.description = description ? description.trim() : '';
    if (activitiesRelated !== undefined) updateData.activitiesRelated = activitiesRelated ? activitiesRelated.trim() : '';
    // Map strand and module code
    if (strand) {
      const strandStr = strand.trim();
      const matchedArea = await prisma.learningArea.findFirst({
        where: {
          OR: [
            { name: { contains: strandStr } },
            { code: { contains: strandStr } },
          ],
        },
      });
      if (matchedArea) {
        updateData.learningAreaId = matchedArea.id;
      }
      const expectedCode = getExpectedModuleCodeForStrand(strandStr, matchedArea?.code);
      if (expectedCode) {
        updateData.code = expectedCode;
      }
    } else if (code !== undefined) {
      updateData.code = code.trim();
    }

    // Map level
    if (level) {
      let targetLevel = 'JUNIOR';
      const lvlUpper = String(level).toUpperCase();
      if (lvlUpper.includes('ELEM')) {
        targetLevel = 'ELEMENTARY';
      }
      updateData.targetLevel = targetLevel;
    }

    // Backend authorization: Validate target ALS Level against teacher's assigned levels
    if (req.user && req.user.role === 'TEACHER') {
      const teacherSpec = String(req.user.teacherProfile?.specialization || 'Both').toLowerCase();
      const allowsElem = teacherSpec.includes('elem') || teacherSpec.includes('both');
      const allowsJhs = teacherSpec.includes('junior') || teacherSpec.includes('jhs') || teacherSpec.includes('sec') || teacherSpec.includes('both');

      const targetLevelCheck = updateData.targetLevel || existingMod.targetLevel;
      if (targetLevelCheck === 'ELEMENTARY' && !allowsElem) {
        return res.status(403).json({ error: 'You are not authorized for A&E Elementary modules.' });
      }
      if (targetLevelCheck === 'JUNIOR' && !allowsJhs) {
        return res.status(403).json({ error: 'You are not authorized for A&E Junior High modules.' });
      }
    }

    // Map learning center
    if (learningCenterId !== undefined) {
      const parsedCenterId = parseInt(learningCenterId, 10);
      updateData.learningCenterId = !isNaN(parsedCenterId) ? parsedCenterId : null;
    }

    // Dates
    if (dateStarted) updateData.dateStarted = new Date(dateStarted);
    if (dateEnded) updateData.dateEnded = new Date(dateEnded);

    // Update module record
    const updatedBaseMod = await prisma.module.update({
      where: { id },
      data: updateData,
    });

    // Update Pre-Test and Post-Test assessments if provided, otherwise preserve existing questions
    if (normalizedPreQuestions !== null) {
      await syncModuleAssessment({
        moduleId: id,
        teacherId: existingMod.teacherId,
        moduleTitle: updatedBaseMod.title || existingMod.title,
        type: 'PRE_TEST',
        questions: normalizedPreQuestions,
      });
    }

    if (normalizedPostQuestions !== null) {
      await syncModuleAssessment({
        moduleId: id,
        teacherId: existingMod.teacherId,
        moduleTitle: updatedBaseMod.title || existingMod.title,
        type: 'POST_TEST',
        questions: normalizedPostQuestions,
      });
    }

    // Update learner assignments if provided
    if (isAllLearners !== undefined) {
      const shouldAssignToAll = isAllLearners === true || isAllLearners === 'true';
      await prisma.moduleAssignment.deleteMany({ where: { moduleId: id } });

      if (!shouldAssignToAll && Array.isArray(assignedLearnerIds) && assignedLearnerIds.length > 0) {
        try {
          await prisma.$executeRawUnsafe('UPDATE modules SET assigned_to_all = 0 WHERE id = ?', id);
        } catch (e) {}

        const uniqueLIds = [...new Set(assignedLearnerIds.map((x) => parseInt(x, 10)).filter((x) => !isNaN(x)))];
        for (const lId of uniqueLIds) {
          await prisma.moduleAssignment.create({
            data: {
              moduleId: id,
              learnerId: lId,
            },
          });
        }
      } else {
        try {
          await prisma.$executeRawUnsafe('UPDATE modules SET assigned_to_all = 1 WHERE id = ?', id);
        } catch (e) {}
      }
    }

    // Return updated module
    const updatedModule = await prisma.module.findUnique({
      where: { id },
      include: {
        learningArea: true,
        teacher: { select: { id: true, fullName: true } },
        learningCenter: { select: { id: true, name: true } },
        pages: true,
        assessments: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        assignments: true,
        _count: { select: { pages: true, assessments: true, assignments: true } },
      },
    });

    if (updatedModule.status === 'PUBLISHED') {
      notifyModulePublished(updatedModule.id).catch((e) => console.error('[Modules] notifyModulePublished error:', e));
    }

    res.json(formatModule(updatedModule, req.user));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// DELETE /api/modules/:id
// Delete a module
// ---------------------
router.delete('/:id', authenticate, requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid module ID' });

    const mod = await prisma.module.findUnique({ where: { id } });
    if (!mod) return res.status(404).json({ error: 'Module not found' });

    if (req.user && req.user.role === 'TEACHER' && mod.teacherId !== req.user.profileId) {
      return res.status(403).json({ error: 'You can only delete your own modules' });
    }

    await prisma.$transaction(async (tx) => {
      // Find assessments
      const assessments = await tx.assessment.findMany({ where: { moduleId: id }, select: { id: true } });
      const assessmentIds = assessments.map((a) => a.id);
      if (assessmentIds.length > 0) {
        const attempts = await tx.assessmentAttempt.findMany({ where: { assessmentId: { in: assessmentIds } }, select: { id: true } });
        const attemptIds = attempts.map((a) => a.id);
        if (attemptIds.length > 0) {
          await tx.learnerAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } });
          await tx.assessmentAttempt.deleteMany({ where: { id: { in: attemptIds } } });
        }
        const questions = await tx.question.findMany({ where: { assessmentId: { in: assessmentIds } }, select: { id: true } });
        const questionIds = questions.map((q) => q.id);
        if (questionIds.length > 0) {
          await tx.answerOption.deleteMany({ where: { questionId: { in: questionIds } } });
          await tx.learnerAnswer.deleteMany({ where: { questionId: { in: questionIds } } });
          await tx.question.deleteMany({ where: { id: { in: questionIds } } });
        }
        await tx.assessment.deleteMany({ where: { id: { in: assessmentIds } } });
      }
      await tx.moduleAssignment.deleteMany({ where: { moduleId: id } });
      await tx.submission.deleteMany({ where: { moduleId: id } });
      await tx.learnerProgress.deleteMany({ where: { moduleId: id } });
      await tx.modulePage.deleteMany({ where: { moduleId: id } });
      await tx.module.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/modules/:id/attempt
// Submit assessment answers (Pre-Test or Post-Test)
// ---------------------
router.post('/:id/attempt', authenticate, requireRole(['LEARNER']), async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.id, 10);
    if (isNaN(moduleId)) return res.status(400).json({ error: 'Invalid module ID' });

    const learnerId = req.user.profileId;
    if (!learnerId) return res.status(400).json({ error: 'Learner profile not found' });

    const { assessmentId, answers } = req.body;
    const parsedAssessmentId = parseInt(assessmentId, 10);
    if (isNaN(parsedAssessmentId)) return res.status(400).json({ error: 'Valid assessment ID is required' });

    const assessment = await prisma.assessment.findUnique({
      where: { id: parsedAssessmentId },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!assessment || assessment.moduleId !== moduleId) {
      return res.status(404).json({ error: 'Assessment not found for this module' });
    }

    // Pre-test is a diagnostic assessment: once submitted, prevent retakes
    if (assessment.type === 'PRE_TEST') {
      const existingAttempt = await prisma.assessmentAttempt.findFirst({
        where: {
          assessmentId: parsedAssessmentId,
          learnerId,
          status: 'SUBMITTED',
        },
        include: {
          answers: true,
        },
        orderBy: { submittedAt: 'desc' },
      });

      if (existingAttempt) {
        return res.status(400).json({
          error: 'Pre-Test Completed. You have already submitted your answers. You can review your results, but you cannot answer again.',
          code: 'PRE_TEST_ALREADY_COMPLETED',
          alreadyCompleted: true,
          attemptId: existingAttempt.id,
          score: Number(existingAttempt.score),
          maxScore: Number(existingAttempt.maxScore),
          percentage: Math.round(Number(existingAttempt.percentage)),
        });
      }
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const answerRecords = [];

    const answerMap = Array.isArray(answers)
      ? new Map(answers.map((a) => [Number(a.questionId), a.selectedOptionId]))
      : new Map(Object.entries(answers || {}).map(([k, v]) => [Number(k), v]));

    for (const q of assessment.questions) {
      totalPoints += q.points || 1;
      const selectedVal = answerMap.get(q.id);
      let chosenOption = null;
      if (selectedVal !== undefined && selectedVal !== null && selectedVal !== '') {
        chosenOption = q.options.find((o) => o.id === Number(selectedVal));
        if (!chosenOption && typeof selectedVal === 'string') {
          chosenOption = q.options.find(
            (o) => o.optionText.trim().toLowerCase() === selectedVal.trim().toLowerCase()
          );
        }
      }
      const isCorrect = Boolean(chosenOption?.isCorrect);
      const scoreAwarded = isCorrect ? (q.points || 1) : 0;
      earnedPoints += scoreAwarded;

      answerRecords.push({
        questionId: q.id,
        selectedOptionId: chosenOption ? chosenOption.id : null,
        isCorrect,
        scoreAwarded,
      });
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passingPct = Number(assessment.passingScorePct) || 75;
    const isPassed = percentage >= passingPct;

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: parsedAssessmentId,
        learnerId,
        score: earnedPoints,
        maxScore: totalPoints,
        percentage,
        isPassed,
        status: 'SUBMITTED',
        startedAt: new Date(),
        submittedAt: new Date(),
        answers: {
          create: answerRecords,
        },
      },
    });

    const progressUpdate = {};
    if (assessment.type === 'PRE_TEST') {
      progressUpdate.preTestScore = earnedPoints;
      progressUpdate.status = 'IN_PROGRESS';
    } else if (assessment.type === 'POST_TEST') {
      progressUpdate.postTestScore = earnedPoints;
      if (isPassed) {
        progressUpdate.masteryStatus = 'MASTERED';
      } else {
        progressUpdate.masteryStatus = 'NOT_MASTERED';
      }
    }

    await prisma.learnerProgress.upsert({
      where: {
        learnerId_moduleId: {
          learnerId,
          moduleId,
        },
      },
      create: {
        learnerId,
        moduleId,
        ...progressUpdate,
      },
      update: progressUpdate,
    });

    const updatedProgress = await syncLearnerModuleProgress(learnerId, moduleId);

    res.json({
      attemptId: attempt.id,
      score: earnedPoints,
      maxScore: totalPoints,
      percentage: Math.round(percentage),
      isPassed,
      assessmentType: assessment.type,
      progress: updatedProgress,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/modules/:id/progress
// Update learner progress for a module
// ---------------------
router.post('/:id/progress', authenticate, requireRole(['LEARNER']), async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.id, 10);
    if (isNaN(moduleId)) return res.status(400).json({ error: 'Invalid module ID' });

    const learnerId = req.user.profileId;
    if (!learnerId) return res.status(400).json({ error: 'Learner profile not found' });

    const { completedPages, totalPages, status } = req.body;
    const updateData = {};
    if (completedPages !== undefined) updateData.completedPages = Number(completedPages);
    if (totalPages !== undefined) updateData.totalPages = Number(totalPages);
    if (status) updateData.status = status;

    const prog = await prisma.learnerProgress.upsert({
      where: {
        learnerId_moduleId: {
          learnerId,
          moduleId,
        },
      },
      create: {
        learnerId,
        moduleId,
        status: status || 'IN_PROGRESS',
        completedPages: completedPages ? Number(completedPages) : 1,
        totalPages: totalPages ? Number(totalPages) : 4,
      },
      update: updateData,
    });

    const synced = await syncLearnerModuleProgress(learnerId, moduleId);

    res.json(synced || prog);
  } catch (err) {
    next(err);
  }
});

export default router;

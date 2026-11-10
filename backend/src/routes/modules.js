import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';
import { handleModuleFileUpload } from '../middleware/uploadMiddleware.js';
import { calculateModuleProgress, syncLearnerModuleProgress } from '../utils/progressCalculator.js';
import { getLearnerPagesRead, saveLearnerPagesRead, setLearnerPagesRead, getLearnerReadingState, saveLearnerReadingState } from '../utils/readingPagesStore.js';
import { notifyModulePublished } from '../services/notificationService.js';
import { parseManilaDeadline, isSubmissionDeadlinePassed } from '../utils/dateUtils.js';
import { logTeacherActivity } from '../utils/teacherActivityLogger.js';
import { formatLearningArea, normalizeLearningAreaStatus } from './learningAreas.js';
import { sanitizeInstructionsHtml } from '../utils/sanitizeInstructions.js';

const router = Router();

// Build a clean, readable filename for downloaded PDF modules (e.g. Science_LS2.pdf)
function buildReadablePdfFilename(m) {
  const rawTitle = String(m?.title || 'Learning_Module')
    .trim()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const rawStrand = String(m?.code || m?.learningArea?.code || '')
    .trim()
    .toUpperCase();
  const cleanStrand = rawStrand.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

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
async function syncModuleAssessment({ moduleId, teacherId, moduleTitle, type, questions, instructions }) {
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
  const hasExplicitInstructions = instructions !== undefined;
  const resolvedInstructions = hasExplicitInstructions
    ? (instructions != null && String(instructions).trim() ? String(instructions).trim() : null)
    : undefined;

  if (!questions || questions.length === 0) {
    if (assessment) {
      if (hasExplicitInstructions) {
        await prisma.assessment.update({
          where: { id: assessment.id },
          data: { title: assessmentTitle, description: resolvedInstructions },
        });
      }
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
        description: resolvedInstructions ?? null,
      },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
  } else {
    const updateData = { title: assessmentTitle };
    if (hasExplicitInstructions) {
      updateData.description = resolvedInstructions;
    }
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: updateData,
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
        const rawDesc = ass.description ? String(ass.description).trim() : '';
        const isLegacyPlaceholder =
          rawDesc === `Pre-Test (Assessment) for ${m.title}` ||
          rawDesc === `Post-Test for ${m.title}`;
        const assessmentInstructions = isLegacyPlaceholder ? '' : rawDesc;
        return {
          id: ass.id,
          title: ass.title,
          type: ass.type,
          description: assessmentInstructions,
          instructions: assessmentInstructions,
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

  // Learner Progress details strictly scoped to the authenticated learner
  const progressRecord = Array.isArray(m.learnerProgress) && m.learnerProgress.length > 0 ? m.learnerProgress[0] : null;
  const learnerId = reqUser?.role === 'LEARNER'
    ? (reqUser.profileId || progressRecord?.learnerId || null)
    : (progressRecord?.learnerId || null);
  const readingState = learnerId ? getLearnerReadingState(learnerId, m.id) : null;
  const storedPages = readingState ? readingState.pagesRead : (learnerId ? getLearnerPagesRead(learnerId, m.id) : []);
  const safeTotalPages = progressRecord?.totalPages || m.pagesCount || (Array.isArray(m.pages) ? m.pages.length : 0) || 29;

  let pagesRead = [];
  let completedPages = 0;

  if (storedPages && storedPages.length > 0) {
    // Highest page reached determines module reading progress history
    const highestPage = Math.max(...storedPages.map(Number).filter((n) => n > 0));
    const safeHighest = Math.min(highestPage, safeTotalPages);
    pagesRead = Array.from({ length: safeHighest }, (_, i) => i + 1);
    completedPages = safeHighest;
  } else if (progressRecord?.completedAt || m.completed) {
    // Legitimate completed module from historical record
    completedPages = safeTotalPages;
    pagesRead = Array.from({ length: completedPages }, (_, i) => i + 1);
  } else if ((progressRecord?.completedPages || 0) > 0) {
    completedPages = Math.min(progressRecord.completedPages, safeTotalPages);
    pagesRead = Array.from({ length: completedPages }, (_, i) => i + 1);
    if (learnerId) {
      saveLearnerPagesRead(learnerId, m.id, pagesRead);
    }
  } else {
    // Incomplete module without stored unique page history:
    // Do NOT generate a synthetic sequence from completedPages or current page.
    pagesRead = [];
    completedPages = 0;
  }

  const hasReadingHistory = pagesRead.length > 0 || completedPages > 0 || (readingState && Array.isArray(readingState.pagesRead) && readingState.pagesRead.length > 0);
  const curPage = readingState?.currentPage || (completedPages > 0 ? completedPages : 1);
  const attempts = (m.assessments || []).flatMap((a) => a.attempts || []);
  const submissions = m.submissions || [];
  const progressCalc = calculateModuleProgress({
    module: m,
    learnerProgress: progressRecord
      ? {
          ...progressRecord,
          completedPages,
          totalPages: safeTotalPages,
          currentPage: curPage,
          pagesRead,
          highestPageReached: readingState?.highestPageReached || completedPages,
          readingStarted: hasReadingHistory,
        }
      : (hasReadingHistory
          ? {
              completedPages,
              totalPages: safeTotalPages,
              currentPage: curPage,
              pagesRead,
              highestPageReached: readingState?.highestPageReached || completedPages,
              readingStarted: true,
            }
          : null),
    attempts,
    submissions,
    currentPage: hasReadingHistory ? curPage : 0,
  });

  const isCompleted = progressCalc.completed;
  const isInProgress = progressCalc.progressStatus === 'IN_PROGRESS';
  const progressPct = progressCalc.progress;

  let extractedModuleNumber = null;
  const numMatch = (m.code || '').match(/\d+$/) || (m.title || '').match(/Module\s*(\d+)/i) || (m.code || '').match(/(?:MOD|M)[-_]?(\d+)/i);
  if (numMatch) {
    extractedModuleNumber = parseInt(numMatch[1] || numMatch[0], 10);
  }

  // Submission deadline evaluation (authoritative Asia/Manila server time)
  const learnerAssignment = Array.isArray(m.assignments) && reqUser?.profileId
    ? m.assignments.find((a) => a.learnerId === reqUser.profileId)
    : null;
  const dueDate = learnerAssignment?.dueDate
    ? learnerAssignment.dueDate.toISOString().split('T')[0]
    : null;
  const dateEndedStr = m.dateEnded ? m.dateEnded.toISOString().split('T')[0] : null;
  const effectiveDeadline = dueDate || dateEndedStr;
  const isSubmissionClosed = Boolean(effectiveDeadline && isSubmissionDeadlinePassed(effectiveDeadline));

  const firstPage = Array.isArray(m.pages) && m.pages.length > 0
    ? (m.pages.find((p) => p.pageNumber === 1) || m.pages[0])
    : null;
  const readingInstructions = firstPage?.content ? firstPage.content.trim() : '';

  const savedCode = m.code ? String(m.code).trim() : '';
  const areaCode = m.learningArea?.code ? String(m.learningArea.code).trim() : '';
  const resolvedCode = savedCode || areaCode || '';

  return {
    id: m.id,
    code: resolvedCode,
    moduleCode: resolvedCode || `MOD-${m.id}`,
    moduleNumber: extractedModuleNumber,
    title: m.title,
    description: sanitizeInstructionsHtml(m.description) || '',
    instructions: sanitizeInstructionsHtml(m.instructions || m.description) || '',
    readingInstructions,
    learningNotes: readingInstructions,
    activitiesRelated: m.activitiesRelated || '',
    dateStarted: m.dateStarted ? m.dateStarted.toISOString().split('T')[0] : null,
    dateEnded: dateEndedStr,
    dueDate,
    submissionDeadline: effectiveDeadline,
    isSubmissionClosed,
    strand: m.learningArea?.name || 'General Curriculum',
    strandCode: resolvedCode,
    learningAreaId: m.learningAreaId,
    learningArea: m.learningArea
      ? {
          id: m.learningArea.id,
          code: String(m.learningArea.code || '').trim(),
          name: String(m.learningArea.name || '').trim(),
          status: normalizeLearningAreaStatus(m.learningArea.status),
        }
      : null,
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
    preTestInstructions: preTest?.instructions || '',
    postTestInstructions: postTest?.instructions || '',
    progress: progressPct,
    completed: isCompleted,
    progressStatus: isCompleted ? 'COMPLETED' : (isInProgress ? 'IN_PROGRESS' : 'NOT_STARTED'),
    preTestScore: progressRecord?.preTestScore != null ? Number(progressRecord.preTestScore) : null,
    postTestScore: progressRecord?.postTestScore != null ? Number(progressRecord.postTestScore) : null,
    masteryStatus: progressRecord?.masteryStatus || 'NOT_EVALUATED',
    currentPage: curPage,
    viewMode: readingState?.viewMode || 'long',
    highestPageReached: readingState?.highestPageReached || completedPages,
    completedPages,
    totalPages: progressRecord?.totalPages || m.pagesCount || (Array.isArray(m.pages) ? m.pages.length : 0) || 0,
    pagesRead,
    readingStarted: hasReadingHistory,
    learnerProgress: m.learnerProgress || [],
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

    let resolvedLearnerProfileId = null;

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
      resolvedLearnerProfileId = learner.id;

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

    const learnerProfileId = req.user?.role === 'LEARNER'
      ? (resolvedLearnerProfileId || req.user.profileId)
      : null;

    const modules = await prisma.module.findMany({
      where,
      include: {
        learningArea: true,
        teacher: { select: { id: true, fullName: true } },
        learningCenter: { select: { id: true, name: true } },
        assignments: true,
        pages: { select: { id: true, pageNumber: true, content: true } },
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

    res.json(
      modules.map((m) =>
        formatModule(
          m,
          learnerProfileId ? { ...req.user, profileId: learnerProfileId } : req.user
        )
      )
    );
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
    const includeInactive = String(req.query.includeInactive || '').toLowerCase() === 'true';
    const areas = await prisma.learningArea.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    const formatted = areas.map(formatLearningArea);
    res.json(includeInactive ? formatted : formatted.filter((a) => a.status === 'Active'));
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

    if (req.query.portal === 'learner' && !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let learner = null;
    let learnerProfileId = null;
    if (req.user?.role === 'LEARNER') {
      learner = req.user.learnerProfile;
      if (!learner) {
        learner = await prisma.learner.findUnique({
          where: { userId: req.user.id },
          include: { learningCenter: true, assignedTeacher: true },
        });
      }
      learnerProfileId = learner?.id || req.user.profileId || null;
      if (!learnerProfileId) {
        return res.status(403).json({ error: 'Learner profile not found.' });
      }
    }

    const mod = await prisma.module.findUnique({
      where: { id },
      include: {
        learningArea: true,
        teacher: { select: { id: true, fullName: true } },
        learningCenter: { select: { id: true, name: true } },
        pages: {
          select: { id: true, pageNumber: true, content: true },
          orderBy: { pageNumber: 'asc' },
        },
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

    // Role check: Teacher can ONLY view modules assigned/owned by that teacher
    if (req.user && req.user.role === 'TEACHER') {
      const allowedTeacherIds = [req.user.profileId, req.user.userId, req.user.id]
        .filter((v) => v != null && !isNaN(Number(v)))
        .map(Number);
      if (!allowedTeacherIds.includes(Number(mod.teacherId))) {
        return res.status(403).json({ error: 'Access denied. You can only view modules assigned to your classes.' });
      }
    }

    // Role check: If learner, verify module is published, matches learning center and program level, and assignments
    if (req.user && req.user.role === 'LEARNER') {
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

    res.json(
      formatModule(
        mod,
        learnerProfileId ? { ...req.user, profileId: learnerProfileId } : req.user
      )
    );
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
        pages: { select: { id: true, pageNumber: true, content: true } },
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

export function getExpectedModuleCodeForStrand(_strandName, areaCode) {
  const trimmed = String(areaCode || '').trim();
  return trimmed || null;
}

// Resolve a LearningArea record strictly by database ID or exact name (never by code alone)
async function resolveLearningAreaRecord({ learningAreaId, strand, strandName }) {
  if (learningAreaId !== undefined && learningAreaId !== null && learningAreaId !== '') {
    const parsedAreaId = parseInt(learningAreaId, 10);
    if (isNaN(parsedAreaId)) {
      return { error: 'Invalid Learning Strand ID.' };
    }
    const area = await prisma.learningArea.findUnique({ where: { id: parsedAreaId } });
    return { area };
  }
  const rawName = String(strand || strandName || '').trim();
  if (rawName) {
    const areas = await prisma.learningArea.findMany();
    const matched = areas.find(
      (a) => String(a.name || '').trim().toLowerCase() === rawName.toLowerCase()
    );
    return { area: matched || null };
  }
  return { area: null };
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
      readingInstructions,
      preTest,
      postTest,
      preTestInstructions,
      postTestInstructions,
      teacherId: explicitTeacherId,
      isAllLearners,
      assignedLearnerIds,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Module title is required' });
    }

    // Resolve Learning Area (Strand) strictly from Admin-registered database records
    const { area: areaObj, error: areaResolveError } = await resolveLearningAreaRecord({
      learningAreaId,
      strand,
      strandName,
    });
    if (areaResolveError) {
      return res.status(400).json({ error: areaResolveError });
    }
    if (!areaObj) {
      return res.status(400).json({ error: 'Please select a valid Learning Strand registered by the Admin.' });
    }
    if (normalizeLearningAreaStatus(areaObj.status) !== 'Active') {
      return res.status(400).json({
        error: `The Learning Strand "${areaObj.name}" is inactive and cannot be selected for new modules.`,
      });
    }
    const officialCode = String(areaObj.code || '').trim();
    if (!officialCode) {
      return res.status(400).json({ error: 'No valid Learning Strand Code is configured for the selected Learning Area.' });
    }
    const submittedCode = String(moduleCode ?? code ?? '').trim();
    if (submittedCode && submittedCode !== officialCode) {
      return res.status(400).json({
        error: `Module Code (${submittedCode}) does not match the registered Learning Strand Code (${officialCode}).`,
      });
    }
    const resolvedAreaId = areaObj.id;

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

    // Official Module Code comes directly from the validated LearningArea record
    const finalModuleCode = officialCode;

    // Create the Module record (sanitize rich-text instructions)
    const resolvedInstructions = sanitizeInstructionsHtml(instructions !== undefined ? instructions : description);
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
    const resolvedReadingInstructions = (readingInstructions !== undefined ? readingInstructions : learningNotes)?.trim() || '';
    if (resolvedReadingInstructions) {
      await prisma.modulePage.create({
        data: {
          moduleId: newModule.id,
          pageNumber: 1,
          title: `${title.trim()} - Notes`,
          content: resolvedReadingInstructions,
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
        instructions: preTestInstructions,
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
        instructions: postTestInstructions,
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
        pages: { select: { id: true, pageNumber: true, content: true } },
        _count: { select: { pages: true, assessments: true, assignments: true } },
      },
    });

    if (completeModule.status === 'PUBLISHED') {
      notifyModulePublished(completeModule.id).catch((e) => console.error('[Modules] notifyModulePublished error:', e));
    }

    if (resolvedTeacherId) {
      logTeacherActivity({
        teacherId: resolvedTeacherId,
        type: 'MODULE_UPLOADED',
        activityTypeLabel: 'Uploaded a Module',
        relatedEntity: completeModule.title,
        description: `Uploaded learning module "${completeModule.title}" (${completeModule.code || 'LS'}) for ${completeModule.targetLevel === 'ELEMENTARY' ? 'A&E Elementary' : 'A&E Junior High'}.`,
        moduleId: completeModule.id,
        linkUrl: `/dashboard/modules/${completeModule.id}`
      });
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
      learningAreaId,
      strand,
      strandName,
      level,
      learningCenterId,
      code,
      moduleCode,
      dateStarted,
      dateEnded,
      isAllLearners,
      assignedLearnerIds,
      preTest,
      postTest,
      preTestInstructions,
      postTestInstructions,
      learningNotes,
      readingInstructions,
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
    if (instructions !== undefined) {
      const sanitizedInst = sanitizeInstructionsHtml(instructions) || '';
      updateData.instructions = sanitizedInst;
      if (description === undefined) {
        updateData.description = sanitizedInst;
      }
    }
    if (description !== undefined) {
      const sanitizedDesc = sanitizeInstructionsHtml(description) || '';
      updateData.description = sanitizedDesc;
      if (instructions === undefined) {
        updateData.instructions = sanitizedDesc;
      }
    }
    if (activitiesRelated !== undefined) updateData.activitiesRelated = activitiesRelated ? activitiesRelated.trim() : '';
    // Validate and map Learning Strand and Module Code strictly from database LearningArea
    const hasAreaInput =
      (learningAreaId !== undefined && learningAreaId !== null && learningAreaId !== '') ||
      Boolean(strand && String(strand).trim()) ||
      Boolean(strandName && String(strandName).trim());
    const submittedCode = String((moduleCode ?? code) ?? '').trim();

    if (hasAreaInput) {
      const { area: targetAreaObj, error: areaResolveError } = await resolveLearningAreaRecord({
        learningAreaId,
        strand,
        strandName,
      });
      if (areaResolveError) {
        return res.status(400).json({ error: areaResolveError });
      }
      if (!targetAreaObj) {
        return res.status(400).json({ error: 'Selected Learning Strand was not found.' });
      }

      const isChangingArea = targetAreaObj.id !== existingMod.learningAreaId;
      if (isChangingArea && normalizeLearningAreaStatus(targetAreaObj.status) !== 'Active') {
        return res.status(400).json({
          error: `The Learning Strand "${targetAreaObj.name}" is inactive and cannot be selected.`,
        });
      }

      const officialAreaCode = String(targetAreaObj.code || '').trim();
      if (!officialAreaCode) {
        return res.status(400).json({ error: 'The selected Learning Strand does not have a registered code.' });
      }

      if (isChangingArea) {
        if (submittedCode && submittedCode !== officialAreaCode) {
          return res.status(400).json({
            error: `Module Code (${submittedCode}) does not match the registered Learning Strand Code (${officialAreaCode}).`,
          });
        }
        updateData.learningAreaId = targetAreaObj.id;
        updateData.code = officialAreaCode;
      } else {
        const existingCode = String(existingMod.code || '').trim();
        if (submittedCode && submittedCode !== officialAreaCode && submittedCode !== existingCode) {
          return res.status(400).json({
            error: `Module Code (${submittedCode}) does not match the Learning Strand Code (${officialAreaCode}).`,
          });
        }
        if (submittedCode) {
          updateData.code = submittedCode;
        }
      }
    } else if (submittedCode) {
      const currentArea = await prisma.learningArea.findUnique({
        where: { id: existingMod.learningAreaId },
      });
      const officialAreaCode = String(currentArea?.code || '').trim();
      const existingCode = String(existingMod.code || '').trim();
      if (submittedCode !== officialAreaCode && submittedCode !== existingCode) {
        return res.status(400).json({
          error: `Module Code (${submittedCode}) does not match the registered Learning Strand Code (${officialAreaCode}).`,
        });
      }
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

    if (isAllLearners !== undefined) {
      const shouldAssignToAll = isAllLearners === true || isAllLearners === 'true';
      if (!shouldAssignToAll) {
        const validIds = Array.isArray(assignedLearnerIds)
          ? [...new Set(assignedLearnerIds.map((x) => parseInt(x, 10)).filter((x) => !isNaN(x)))]
          : [];
        if (validIds.length === 0) {
          return res.status(400).json({ error: 'Please select at least one learner under "Assign Module To".' });
        }
      }
    }

    // Update module record
    const updatedBaseMod = await prisma.module.update({
      where: { id },
      data: updateData,
    });

    // Update Learning Material / Reading Instructions (ModulePage) if provided
    const incomingReadingInstructions = readingInstructions !== undefined ? readingInstructions : learningNotes;
    if (incomingReadingInstructions !== undefined) {
      const trimmedNotes = incomingReadingInstructions ? String(incomingReadingInstructions).trim() : '';
      const existingPage1 = await prisma.modulePage.findFirst({
        where: { moduleId: id, pageNumber: 1 },
      });
      if (existingPage1) {
        await prisma.modulePage.update({
          where: { id: existingPage1.id },
          data: { content: trimmedNotes },
        });
      } else if (trimmedNotes) {
        await prisma.modulePage.create({
          data: {
            moduleId: id,
            pageNumber: 1,
            title: `${(updatedBaseMod.title || existingMod.title).trim()} - Notes`,
            content: trimmedNotes,
            mediaUrl: updatedBaseMod.fileUrl || existingMod.fileUrl || null,
          },
        });
      }
    }

    // Update Pre-Test and Post-Test assessments if provided, otherwise preserve existing questions
    if (normalizedPreQuestions !== null) {
      await syncModuleAssessment({
        moduleId: id,
        teacherId: existingMod.teacherId,
        moduleTitle: updatedBaseMod.title || existingMod.title,
        type: 'PRE_TEST',
        questions: normalizedPreQuestions,
        instructions: preTestInstructions,
      });
    } else if (preTestInstructions !== undefined) {
      const existingPreAss = await prisma.assessment.findFirst({ where: { moduleId: id, type: 'PRE_TEST' } });
      if (existingPreAss) {
        await prisma.assessment.update({
          where: { id: existingPreAss.id },
          data: { description: preTestInstructions != null && String(preTestInstructions).trim() ? String(preTestInstructions).trim() : null },
        });
      }
    }

    if (normalizedPostQuestions !== null) {
      await syncModuleAssessment({
        moduleId: id,
        teacherId: existingMod.teacherId,
        moduleTitle: updatedBaseMod.title || existingMod.title,
        type: 'POST_TEST',
        questions: normalizedPostQuestions,
        instructions: postTestInstructions,
      });
    } else if (postTestInstructions !== undefined) {
      const existingPostAss = await prisma.assessment.findFirst({ where: { moduleId: id, type: 'POST_TEST' } });
      if (existingPostAss) {
        await prisma.assessment.update({
          where: { id: existingPostAss.id },
          data: { description: postTestInstructions != null && String(postTestInstructions).trim() ? String(postTestInstructions).trim() : null },
        });
      }
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
        pages: { select: { id: true, pageNumber: true, content: true } },
        _count: { select: { pages: true, assessments: true, assignments: true } },
      },
    });

    if (updatedModule.status === 'PUBLISHED') {
      notifyModulePublished(updatedModule.id).catch((e) => console.error('[Modules] notifyModulePublished error:', e));
    }

    if (updatedModule.teacherId) {
      logTeacherActivity({
        teacherId: updatedModule.teacherId,
        type: 'MODULE_UPDATED',
        activityTypeLabel: 'Updated a Module',
        relatedEntity: updatedModule.title,
        description: `Updated learning module "${updatedModule.title}".`,
        moduleId: updatedModule.id,
        linkUrl: `/dashboard/modules/${updatedModule.id}`
      });
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

    // Prevent duplicate assessment submissions for both Pre-Test and Post-Test
    if (assessment.type === 'PRE_TEST' || assessment.type === 'POST_TEST') {
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
        const testLabel = assessment.type === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test';
        return res.status(400).json({
          error: `${testLabel} Completed. You have already submitted your answers. You can review your results, but you cannot answer again.`,
          code: assessment.type === 'PRE_TEST' ? 'PRE_TEST_ALREADY_COMPLETED' : 'POST_TEST_ALREADY_COMPLETED',
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

    const { completedPages, currentPage, totalPages, status, pagesRead, viewMode } = req.body;

    const existingProg = await prisma.learnerProgress.findUnique({
      where: {
        learnerId_moduleId: { learnerId, moduleId },
      },
    });

    const safeTotalPages = Number(totalPages) > 0 ? Number(totalPages) : (existingProg?.totalPages || 29);
    const curPage = Number(currentPage) > 0
      ? Number(currentPage)
      : (Number(completedPages) > 0 ? Number(completedPages) : 1);

    const readingState = saveLearnerReadingState(learnerId, moduleId, {
      currentPage: curPage,
      pagesRead: Array.isArray(pagesRead) ? pagesRead : [],
      viewMode: viewMode || 'long',
      totalPages: safeTotalPages,
    });

    const validPagesRead = readingState ? readingState.pagesRead : [];
    let newCompletedPages = Math.min(validPagesRead.length, safeTotalPages);
    if (newCompletedPages === 0 && (existingProg?.completedAt || existingProg?.status === 'COMPLETED')) {
      newCompletedPages = safeTotalPages;
    }

    const updateData = {
      completedPages: newCompletedPages,
      totalPages: safeTotalPages,
    };

    if (newCompletedPages >= safeTotalPages) {
      updateData.status = status || 'IN_PROGRESS';
    } else {
      updateData.status = 'IN_PROGRESS';
    }

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
        completedPages: newCompletedPages,
        totalPages: safeTotalPages,
      },
      update: updateData,
    });

    const synced = await syncLearnerModuleProgress(learnerId, moduleId, { currentPage: curPage });

    res.json({
      ...(synced || prog),
      currentPage: curPage,
      viewMode: readingState?.viewMode || 'long',
      highestPageReached: readingState?.highestPageReached || newCompletedPages,
      pagesRead: validPagesRead,
      completedPages: newCompletedPages,
      totalPages: safeTotalPages,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

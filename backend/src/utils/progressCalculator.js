import prisma from '../config/prisma.js';
import { getLearnerPagesRead, getLearnerReadingState } from './readingPagesStore.js';

/**
 * Authoritative 4-step progress and completion calculator for an assigned module.
 *
 * The 4 required steps in the learning workflow:
 * 1. Pre-Test (25%)
 * 2. Read the Module (25% based on current reading position)
 * 3. Post-Test (25%)
 * 4. Submit Your Activity (25%)
 */
export function calculateModuleProgress({
  module,
  learnerProgress,
  attempts = [],
  submissions = [],
  currentPage,
}) {
  if (!module) {
    return {
      progress: 0,
      completed: false,
      progressStatus: 'NOT_STARTED',
      steps: { preTest: false, reading: false, postTest: false, activity: false },
    };
  }

  // 1. Step 1: Pre-Test
  const assessments = Array.isArray(module.assessments) ? module.assessments : [];
  const preTestAss = assessments.find((a) => a.type === 'PRE_TEST');
  const hasPreTest = Boolean(
    preTestAss &&
    (preTestAss.questionsCount > 0 ||
     preTestAss._count?.questions > 0 ||
     (Array.isArray(preTestAss.questions) && preTestAss.questions.length > 0))
  );

  const preAttempt = attempts.find((att) => {
    const isSubmitted = !att.status || att.status === 'SUBMITTED' || att.submittedAt != null;
    if (!isSubmitted) return false;
    if (preTestAss?.id && att.assessmentId && att.assessmentId === preTestAss.id) return true;
    return att.assessment?.type === 'PRE_TEST';
  });
  const preTestDone = !hasPreTest || Boolean(preAttempt || learnerProgress?.preTestScore != null);

  // 3. Step 3: Post-Test
  const postTestAss = assessments.find((a) => a.type === 'POST_TEST');
  const hasPostTest = Boolean(
    postTestAss &&
    (postTestAss.questionsCount > 0 ||
     postTestAss._count?.questions > 0 ||
     (Array.isArray(postTestAss.questions) && postTestAss.questions.length > 0))
  );

  const postAttempt = attempts.find((att) => {
    const isSubmitted = att.status === 'SUBMITTED' || att.submittedAt != null;
    if (!isSubmitted) return false;
    if (postTestAss?.id && att.assessmentId && att.assessmentId === postTestAss.id) return true;
    return att.assessment?.type === 'POST_TEST';
  });
  const postTestDone = !hasPostTest || Boolean(postAttempt || learnerProgress?.postTestScore != null);

  // 4. Step 4: Activity Submission
  // A submitted activity counts as submitted even if the teacher has not yet reviewed it
  const hasSubmissions = (Array.isArray(submissions) && submissions.length > 0) || Boolean(learnerProgress?.activitySubmitted);
  const activityDone = hasSubmissions;

  // 2. Step 2: Read the Module
  const totalPages =
    learnerProgress?.totalPages ||
    module.pagesCount ||
    (Array.isArray(module.pages) ? module.pages.length : 0) ||
    29;
  const completedPages = learnerProgress?.completedPages || 0;
  const curPage = Number(currentPage) > 0
    ? Number(currentPage)
    : (Number(learnerProgress?.currentPage) > 0
      ? Number(learnerProgress.currentPage)
      : (completedPages > 0 ? completedPages : 0));

  // Step 2 is Completed when all required PDF pages have been viewed,
  // or if post-test is completed, or legitimate historical completion exists
  const isLegitimatePriorCompletion = Boolean(
    learnerProgress?.completedAt &&
    activityDone &&
    postTestDone &&
    preTestDone
  );

  const readingDone = Boolean(
    isLegitimatePriorCompletion ||
    postTestDone ||
    (totalPages > 0 && completedPages >= totalPages)
  );

  let readingProgress = 0;
  if (readingDone) {
    readingProgress = 25;
  } else if (totalPages > 0 && curPage > 0) {
    readingProgress = Math.min(25, (curPage / totalPages) * 25);
  }

  // Priority-based progress calculation:
  // 1. If activity is submitted: 100%
  // 2. If post-test is completed: 75%
  // 3. If pre-test is not completed: 0%
  // 4. Otherwise: Math.round(25 + (currentPage / totalPages) * 25)
  let progressPct = 0;
  if (activityDone || isLegitimatePriorCompletion) {
    progressPct = 100;
  } else if (postTestDone) {
    progressPct = 75;
  } else if (!preTestDone) {
    progressPct = 0;
  } else {
    const safeTotal = Math.max(0, totalPages);
    const safePage = Math.max(0, Math.min(curPage, safeTotal));
    const dynamicReading = safeTotal > 0 ? (safePage / safeTotal) * 25 : 0;
    progressPct = Math.min(100, Math.max(0, Math.round(25 + dynamicReading)));
  }

  const isCompleted = progressPct === 100;

  let progressStatus = 'NOT_STARTED';
  if (isCompleted) {
    progressStatus = 'COMPLETED';
  } else if (
    progressPct > 0 ||
    learnerProgress?.status === 'IN_PROGRESS' ||
    curPage > 0 ||
    completedPages > 0 ||
    learnerProgress?.preTestScore != null ||
    hasSubmissions ||
    preAttempt ||
    postAttempt
  ) {
    progressStatus = 'IN_PROGRESS';
  }

  return {
    progress: progressPct,
    completed: isCompleted,
    progressStatus,
    steps: {
      preTest: preTestDone,
      reading: readingDone,
      postTest: postTestDone,
      activity: activityDone,
    },
    readingProgress: totalPages > 0 ? Math.min(25, (curPage / totalPages) * 25) : 0,
    currentPage: curPage,
    completedPages,
    totalPages,
  };
}

/**
 * Synchronize learner's progress record in MySQL database for a specific module.
 */
export async function syncLearnerModuleProgress(learnerId, moduleId, options = {}) {
  if (!learnerId || !moduleId) return null;

  try {
    const mod = await prisma.module.findUnique({
      where: { id: Number(moduleId) },
      include: {
        assessments: {
          include: {
            questions: { select: { id: true } },
            attempts: {
              where: { learnerId: Number(learnerId), status: 'SUBMITTED' },
            },
          },
        },
        learnerProgress: {
          where: { learnerId: Number(learnerId) },
        },
        submissions: {
          where: { learnerId: Number(learnerId) },
          select: { id: true, status: true, submittedAt: true },
        },
      },
    });

    if (!mod) return null;

    const prog = Array.isArray(mod.learnerProgress) && mod.learnerProgress.length > 0 ? mod.learnerProgress[0] : null;
    const attempts = (mod.assessments || []).flatMap((a) => a.attempts || []);
    const submissions = mod.submissions || [];
    const readingState = getLearnerReadingState(learnerId, moduleId);
    const storedPages = readingState.pagesRead;
    const highestStored = readingState.highestPageReached || (storedPages && storedPages.length > 0
      ? Math.max(...storedPages.map(Number).filter((n) => n > 0))
      : 0);
    const safeCompletedPages = highestStored > 0
      ? highestStored
      : (prog?.completedPages || 0);

    const curPage = options.currentPage || readingState.currentPage || (safeCompletedPages > 0 ? safeCompletedPages : 1);

    const result = calculateModuleProgress({
      module: mod,
      learnerProgress: prog
        ? { ...prog, completedPages: safeCompletedPages, currentPage: curPage }
        : (safeCompletedPages > 0 ? { completedPages: safeCompletedPages, currentPage: curPage } : null),
      attempts,
      submissions,
      currentPage: curPage,
    });

    const totalPages =
      prog?.totalPages ||
      (Array.isArray(mod.pages) ? mod.pages.length : 0) ||
      29;

    const updateData = {
      status: result.progressStatus,
    };

    if (result.completed) {
      updateData.completedAt = prog?.completedAt || new Date();
      updateData.completedPages = Math.max(prog?.completedPages || 0, totalPages);
      updateData.totalPages = totalPages;
    } else {
      updateData.completedPages = safeCompletedPages;
      if (totalPages > 0) {
        updateData.totalPages = totalPages;
      }
      if (result.progressStatus === 'IN_PROGRESS' && prog?.status === 'NOT_STARTED') {
        updateData.status = 'IN_PROGRESS';
      }
    }

    const saved = await prisma.learnerProgress.upsert({
      where: {
        learnerId_moduleId: {
          learnerId: Number(learnerId),
          moduleId: Number(moduleId),
        },
      },
      create: {
        learnerId: Number(learnerId),
        moduleId: Number(moduleId),
        status: result.progressStatus,
        completedPages: result.completed ? totalPages : safeCompletedPages,
        totalPages,
        completedAt: result.completed ? new Date() : null,
      },
      update: updateData,
    });

    return {
      ...saved,
      currentPage: curPage,
      viewMode: readingState.viewMode,
      calculation: result,
    };
  } catch (err) {
    console.error(`Failed to sync progress for learner ${learnerId}, module ${moduleId}:`, err);
    return null;
  }
}


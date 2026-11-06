import prisma from '../config/prisma.js';

/**
 * Authoritative 4-step progress and completion calculator for an assigned module.
 *
 * The 4 required steps in the learning workflow:
 * 1. Pre-Test (25%)
 * 2. Read the Module (25%)
 * 3. Post-Test (25%)
 * 4. Submit Your Activity (25%)
 */
export function calculateModuleProgress({
  module,
  learnerProgress,
  attempts = [],
  submissions = [],
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
    (preTestAss.questionsCount > 0 || (Array.isArray(preTestAss.questions) && preTestAss.questions.length > 0))
  );

  const preAttempt = attempts.find((att) => {
    if (preTestAss && att.assessmentId === preTestAss.id) return true;
    return att.assessment?.type === 'PRE_TEST';
  });
  const preTestDone = !hasPreTest || Boolean(preAttempt || learnerProgress?.preTestScore != null);

  // 3. Step 3: Post-Test
  const postTestAss = assessments.find((a) => a.type === 'POST_TEST');
  const hasPostTest = Boolean(
    postTestAss &&
    (postTestAss.questionsCount > 0 || (Array.isArray(postTestAss.questions) && postTestAss.questions.length > 0))
  );

  const postAttempt = attempts.find((att) => {
    if (postTestAss && att.assessmentId === postTestAss.id) return true;
    return att.assessment?.type === 'POST_TEST';
  });
  const postTestDone = !hasPostTest || Boolean(postAttempt || learnerProgress?.postTestScore != null);

  // 4. Step 4: Activity Submission
  // A submitted activity counts as submitted even if the teacher has not yet reviewed it
  const hasSubmissions = Array.isArray(submissions) && submissions.length > 0;
  const activityDone = hasSubmissions;

  // 2. Step 2: Read the Module
  const totalPages =
    learnerProgress?.totalPages ||
    module.pagesCount ||
    (Array.isArray(module.pages) ? module.pages.length : 0) ||
    29;
  const completedPages = learnerProgress?.completedPages || 0;

  // Reading is completed if pages read >= totalPages, or if learner advanced to/completed post-test or activity
  const readingDone = Boolean(
    learnerProgress?.status === 'COMPLETED' ||
    (totalPages > 0 && completedPages >= totalPages) ||
    postTestDone ||
    activityDone
  );

  const isCompleted = preTestDone && readingDone && postTestDone && activityDone;

  let progressPct = 0;
  if (isCompleted) {
    progressPct = 100;
  } else {
    let p = 0;
    if (preTestDone) p += 25;

    if (readingDone) {
      p += 25;
    } else if (totalPages > 0 && completedPages > 0) {
      p += Math.round((completedPages / totalPages) * 25);
    }

    if (postTestDone) p += 25;
    if (activityDone) p += 25;

    progressPct = Math.min(99, Math.round(p));
  }

  let progressStatus = 'NOT_STARTED';
  if (isCompleted) {
    progressStatus = 'COMPLETED';
  } else if (
    progressPct > 0 ||
    learnerProgress?.status === 'IN_PROGRESS' ||
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
  };
}

/**
 * Synchronize learner's progress record in MySQL database for a specific module.
 */
export async function syncLearnerModuleProgress(learnerId, moduleId) {
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

    const result = calculateModuleProgress({
      module: mod,
      learnerProgress: prog,
      attempts,
      submissions,
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
    } else if (result.progressStatus === 'IN_PROGRESS' && prog?.status === 'NOT_STARTED') {
      updateData.status = 'IN_PROGRESS';
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
        completedPages: result.completed ? totalPages : (prog?.completedPages || 1),
        totalPages,
        completedAt: result.completed ? new Date() : null,
      },
      update: updateData,
    });

    return {
      ...saved,
      calculation: result,
    };
  } catch (err) {
    console.error(`Failed to sync progress for learner ${learnerId}, module ${moduleId}:`, err);
    return null;
  }
}


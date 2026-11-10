import { calculateModuleProgress } from './progressCalculator.js';
import { getLearnerReadingState } from './readingPagesStore.js';
import { isSubmissionDeadlinePassed } from './dateUtils.js';

function toYmd(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function getAssessmentQuestionCount(assessment) {
  if (!assessment) return 0;
  if (assessment._count?.questions != null) return Number(assessment._count.questions);
  if (assessment.questionsCount != null) return Number(assessment.questionsCount);
  if (Array.isArray(assessment.questions)) return assessment.questions.length;
  return 0;
}

function resolveAttemptSummary({
  type,
  module,
  attempts = [],
  learnerProgress = null,
  af2Record = null,
}) {
  const assessments = Array.isArray(module?.assessments) ? module.assessments : [];
  const targetAss = assessments.find((a) => a.type === type) || null;
  const qCount = getAssessmentQuestionCount(targetAss);
  const required = Boolean(targetAss && qCount > 0);

  const submittedAttempt = (attempts || []).find((att) => {
    const isSubmitted = !att.status || att.status === 'SUBMITTED' || att.submittedAt != null;
    if (!isSubmitted) return false;
    if (targetAss?.id && att.assessmentId && att.assessmentId === targetAss.id) return true;
    return att.assessment?.type === type;
  });

  const isPre = type === 'PRE_TEST';
  const af2ScoreRaw = isPre ? af2Record?.preTestScore : af2Record?.postTestScore;
  const af2TotalRaw = isPre ? af2Record?.preTestTotal : af2Record?.postTestTotal;
  const progScoreRaw = isPre ? learnerProgress?.preTestScore : learnerProgress?.postTestScore;

  let score = null;
  let max = null;

  if (submittedAttempt && submittedAttempt.score != null) {
    score = Number(submittedAttempt.score);
    const attMax = submittedAttempt.maxScore != null ? Number(submittedAttempt.maxScore) : 0;
    max = attMax > 0 ? attMax : (qCount > 0 ? qCount : 10);
  } else if (progScoreRaw != null && progScoreRaw !== '') {
    score = Number(progScoreRaw);
    max = qCount > 0 ? qCount : (af2TotalRaw != null && af2TotalRaw !== '' ? Number(af2TotalRaw) : 10);
  } else if (af2ScoreRaw != null && af2ScoreRaw !== '') {
    score = Number(af2ScoreRaw);
    max = af2TotalRaw != null && af2TotalRaw !== '' ? Number(af2TotalRaw) : (qCount > 0 ? qCount : 10);
  }

  const percentage = score != null && max != null && max > 0
    ? Math.round((score / max) * 100)
    : null;
  const completed = score != null;

  return {
    required,
    completed,
    score,
    max,
    percentage,
    submittedAt: submittedAttempt?.submittedAt || null,
  };
}

/**
 * Check whether a Submission record represents a valid, completed activity submission
 * (excluding null, pending_* placeholders, drafts, or empty rows with no files/content).
 */
export function isValidCompletedSubmission(sub) {
  if (!sub) return false;
  if (sub.hasSubmitted === false) return false;
  if (String(sub.id || '').startsWith('pending_')) return false;

  const st = String(sub.status || '').trim().toUpperCase();
  if (st === 'DRAFT' || st === 'PENDING' || st === 'PLACEHOLDER' || st === 'IN_PROGRESS') {
    return false;
  }

  const hasFileUrl = Boolean(sub.fileUrl && String(sub.fileUrl).trim());
  const hasFiles = Array.isArray(sub.files) && sub.files.length > 0;
  let hasContentFilesOrText = false;
  if (sub.content && typeof sub.content === 'string') {
    const trimmed = sub.content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          hasContentFilesOrText = parsed.length > 0;
        } else if (parsed && typeof parsed === 'object') {
          hasContentFilesOrText = Boolean(
            (Array.isArray(parsed.files) && parsed.files.length > 0) ||
            (parsed.text && String(parsed.text).trim()) ||
            (parsed.notes && String(parsed.notes).trim())
          );
        }
      } catch {
        hasContentFilesOrText = Boolean(trimmed);
      }
    } else {
      hasContentFilesOrText = Boolean(trimmed);
    }
  }

  return Boolean(hasFileUrl || hasFiles || hasContentFilesOrText);
}

/**
 * Unified 4-status submission classification for Teacher Portal -> Submissions & Review Learner Activity.
 * Priority:
 *  1. Teacher has completed evaluation in Records ('Mastered' or 'Not Mastered') -> 'Recorded'
 *  2. Valid completed activity submission exists -> 'Not Recorded'
 *  3. Submission deadline has passed -> 'Overdue'
 *  4. Otherwise (no valid submission, deadline not passed) -> 'In Progress'
 */
export function evaluateSubmissionStatus({
  af2Record = null,
  learnerProgress = null,
  submissions = [],
  module = null,
  assignment = null,
  dueDate = null,
}) {
  const af2Eval = String(af2Record?.assessment || af2Record?.moduleStatus || '').trim();
  const isEvaluatedInRecords =
    af2Eval === 'Mastered' ||
    af2Eval === 'Not Mastered' ||
    (!af2Record &&
      (learnerProgress?.masteryStatus === 'MASTERED' ||
        learnerProgress?.masteryStatus === 'NOT_MASTERED'));

  const validSubmissions = (submissions || []).filter(isValidCompletedSubmission);
  const hasSubmission = validSubmissions.length > 0;

  if (isEvaluatedInRecords) {
    return {
      status: 'Recorded',
      isRecorded: true,
      evaluationStatus:
        af2Eval === 'Mastered' || af2Eval === 'Not Mastered'
          ? af2Eval
          : learnerProgress?.masteryStatus === 'MASTERED'
            ? 'Mastered'
            : 'Not Mastered',
      hasSubmission,
      isOverdue: false,
    };
  }

  if (hasSubmission) {
    return {
      status: 'Not Recorded',
      isRecorded: false,
      evaluationStatus: '',
      hasSubmission: true,
      isOverdue: false,
    };
  }

  const rawDueDate = dueDate || assignment?.dueDate || module?.dateEnded || af2Record?.dueDate || null;
  const deadlineYmd = toYmd(rawDueDate);
  const isOverdue = Boolean(deadlineYmd && isSubmissionDeadlinePassed(deadlineYmd));

  return {
    status: isOverdue ? 'Overdue' : 'In Progress',
    isRecorded: false,
    evaluationStatus: '',
    hasSubmission: false,
    isOverdue,
  };
}

/**
 * Evaluate authoritative status and activity breakdown for a single (learner, module) pair.
 */
export function evaluateLearnerModuleStatus({
  learnerId,
  af2Record = null,
  module = null,
  assignment = null,
  learnerProgress = null,
  attempts = [],
  submissions = [],
}) {
  const modId = module?.id || (af2Record?.moduleId ? Number(af2Record.moduleId) : null);

  // 1. Reading pages & progress calculation
  const totalPages =
    learnerProgress?.totalPages ||
    module?.pagesCount ||
    module?._count?.pages ||
    (Array.isArray(module?.pages) ? module.pages.length : 0) ||
    0;

  const readingState = learnerId && modId ? getLearnerReadingState(learnerId, modId) : null;
  let pagesRead = [];
  let completedPages = 0;

  if (readingState && Array.isArray(readingState.pagesRead) && readingState.pagesRead.length > 0) {
    pagesRead = readingState.pagesRead
      .map((n) => Number(n))
      .filter((n) => !isNaN(n) && n >= 1 && (totalPages <= 0 || n <= totalPages));
    completedPages = pagesRead.length;
  } else if (learnerProgress?.completedAt) {
    completedPages = totalPages;
    if (totalPages > 0) {
      pagesRead = Array.from({ length: totalPages }, (_, i) => i + 1);
    }
  } else if ((learnerProgress?.completedPages || 0) > 0) {
    completedPages = totalPages > 0
      ? Math.min(learnerProgress.completedPages, totalPages)
      : learnerProgress.completedPages;
    pagesRead = Array.from({ length: completedPages }, (_, i) => i + 1);
  }

  const hasReadingHistory =
    pagesRead.length > 0 ||
    completedPages > 0 ||
    Boolean(readingState && Array.isArray(readingState.pagesRead) && readingState.pagesRead.length > 0);
  const curPage = readingState?.currentPage || (completedPages > 0 ? completedPages : 1);

  const sortedSubmissions = [...(submissions || [])]
    .filter(isValidCompletedSubmission)
    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  const latestSubmission = sortedSubmissions[0] || null;

  const progressCalc = module
    ? calculateModuleProgress({
        module,
        learnerProgress: learnerProgress
          ? {
              ...learnerProgress,
              completedPages,
              totalPages,
              currentPage: curPage,
              pagesRead,
              highestPageReached: readingState?.highestPageReached || completedPages,
              readingStarted: hasReadingHistory,
            }
          : hasReadingHistory
            ? {
                completedPages,
                totalPages,
                currentPage: curPage,
                pagesRead,
                highestPageReached: readingState?.highestPageReached || completedPages,
                readingStarted: true,
              }
            : null,
        attempts,
        submissions: sortedSubmissions,
        currentPage: hasReadingHistory ? curPage : 0,
      })
    : null;

  // 2. Assessment & activity summaries
  const preTest = resolveAttemptSummary({
    type: 'PRE_TEST',
    module,
    attempts,
    learnerProgress,
    af2Record,
  });
  const postTest = resolveAttemptSummary({
    type: 'POST_TEST',
    module,
    attempts,
    learnerProgress,
    af2Record,
  });

  const hasSubmission = sortedSubmissions.length > 0;
  const activityDone = hasSubmission || Boolean(af2Record?.dateFinished || af2Record?.dateCompleted);
  const preTestDone = preTest.required ? preTest.completed : true;
  const postTestDone = postTest.required ? postTest.completed : true;

  const readingDone = Boolean(
    progressCalc?.steps?.reading ||
    postTest.completed ||
    hasSubmission ||
    (totalPages > 0 && completedPages >= totalPages)
  );

  // 3. Deadline evaluation (Asia/Manila EOD)
  const rawDueDate = assignment?.dueDate || module?.dateEnded || af2Record?.dueDate || null;
  const deadlineYmd = toYmd(rawDueDate);
  const deadlinePassed = Boolean(deadlineYmd && isSubmissionDeadlinePassed(deadlineYmd));

  // 4. Unified status classification
  const af2Eval = String(af2Record?.assessment || af2Record?.moduleStatus || '').trim();
  const isFinalizedMastered =
    af2Eval === 'Mastered' || (!af2Record && learnerProgress?.masteryStatus === 'MASTERED');
  const isFinalizedNotMastered =
    af2Eval === 'Not Mastered' || (!af2Record && learnerProgress?.masteryStatus === 'NOT_MASTERED');

  const isWorkCompleted = Boolean(
    (hasSubmission && preTestDone && postTestDone) ||
    (!module && (af2Record?.dateFinished || af2Record?.dateCompleted))
  );

  const hasStarted = Boolean(
    hasSubmission ||
    hasReadingHistory ||
    preTest.completed ||
    postTest.completed ||
    (Array.isArray(attempts) && attempts.length > 0) ||
    learnerProgress?.status === 'IN_PROGRESS' ||
    learnerProgress?.status === 'COMPLETED' ||
    (learnerProgress?.completedPages || 0) > 0 ||
    af2Record?.dateStarted
  );

  // A module is Overdue only when past its deadline and neither evaluated in Records nor submitted
  const isOverdue = !isFinalizedMastered && !isFinalizedNotMastered && !hasSubmission && deadlinePassed;

  let status = 'Not Recorded';
  if (isFinalizedMastered) {
    status = 'Mastered';
  } else if (isFinalizedNotMastered) {
    status = 'Not Mastered';
  } else if (isOverdue) {
    status = 'Overdue';
  } else if (hasSubmission || isWorkCompleted) {
    status = 'Not Recorded';
  } else if (hasStarted) {
    status = 'In Progress';
  } else {
    status = 'Not Recorded';
  }

  const progressPct = progressCalc
    ? progressCalc.progress
    : (isFinalizedMastered || isFinalizedNotMastered || isWorkCompleted ? 100 : (hasStarted ? 25 : 0));

  return {
    status,
    isMastered: status === 'Mastered',
    isNotMastered: status === 'Not Mastered',
    isRecorded: status === 'Mastered' || status === 'Not Mastered',
    isOverdue,
    deadlineYmd,
    progressPct,
    preTest: {
      score: preTest.score,
      max: preTest.max,
      percentage: preTest.percentage,
      required: preTest.required,
      completed: preTest.completed,
    },
    postTest: {
      score: postTest.score,
      max: postTest.max,
      percentage: postTest.percentage,
      required: postTest.required,
      completed: postTest.completed,
      isPassed: status === 'Mastered',
    },
    reading: {
      completed: readingDone,
      completedPages,
      totalPages,
      currentPage: hasReadingHistory ? curPage : 0,
    },
    activity: {
      completed: activityDone,
      hasSubmission,
      submissionId: latestSubmission?.id || null,
      submittedAt: latestSubmission?.submittedAt || null,
      fileCount: hasSubmission ? sortedSubmissions.length : 0,
    },
    completedPages,
    totalPages,
  };
}

/**
 * Build unified, consistent module items and summary counts for a learner.
 */
export function buildLearnerModuleProgressSummary({
  learner,
  af2Records = [],
  dbModules = [],
  dbAssignments = [],
  dbProgress = [],
  dbSubmissions = [],
  dbAttempts = [],
  fromDate = null,
  toDate = null,
}) {
  const moduleMap = new Map();
  for (const m of dbModules || []) {
    if (m?.id) moduleMap.set(Number(m.id), m);
  }

  const learnerSavedAll = (af2Records || []).filter((r) => {
    const rLid = r.learnerId != null ? Number(r.learnerId) : null;
    if (rLid && rLid === learner.id) return true;
    if (r.lrn && learner.lrn && String(r.lrn).trim() === String(learner.lrn).trim()) return true;
    if (
      !rLid &&
      !r.lrn &&
      r.learnerName &&
      learner.fullName &&
      r.learnerName.trim().toLowerCase() === learner.fullName.trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  });

  const hasDateFilter = Boolean(fromDate || toDate);
  const filteredRecords = [];
  const excludedRecordModuleIds = new Set();
  const excludedRecordTitles = new Set();

  for (const r of learnerSavedAll) {
    const d = (r.dateFinished || r.dateCompleted || r.dateStarted || r.createdAt || '').trim().split('T')[0];
    let inRange = true;
    if (hasDateFilter) {
      if (!d) inRange = false;
      else if (fromDate && d < fromDate) inRange = false;
      else if (toDate && d > toDate) inRange = false;
    }

    if (inRange) {
      filteredRecords.push(r);
    } else {
      if (r.moduleId) excludedRecordModuleIds.add(String(Number(r.moduleId)));
      if (r.moduleTitle) excludedRecordTitles.add(r.moduleTitle.trim().toLowerCase());
    }
  }

  const moduleItemsMap = new Map();
  const seenKeys = new Set();

  function getDbRefsForModule(modIdNum) {
    const assign = (dbAssignments || []).find((a) => Number(a.moduleId) === Number(modIdNum)) || null;
    const prog = (dbProgress || []).find((p) => Number(p.moduleId) === Number(modIdNum)) || null;
    const subs = (dbSubmissions || []).filter((s) => Number(s.moduleId) === Number(modIdNum));
    const atts = (dbAttempts || []).filter((att) => Number(att.assessment?.moduleId) === Number(modIdNum));
    return { assign, prog, subs, atts };
  }

  // 1. Saved AF2 records (merged with DB progress/submission/attempts when moduleId matches)
  for (const r of filteredRecords) {
    const numericModId = r.moduleId && !isNaN(Number(r.moduleId)) ? Number(r.moduleId) : null;
    const matchedMod = numericModId ? moduleMap.get(numericModId) || null : null;
    const { assign, prog, subs, atts } = numericModId
      ? getDbRefsForModule(numericModId)
      : { assign: null, prog: null, subs: [], atts: [] };

    const evalRes = evaluateLearnerModuleStatus({
      learnerId: learner.id,
      af2Record: r,
      module: matchedMod,
      assignment: assign,
      learnerProgress: prog,
      attempts: atts,
      submissions: subs,
    });

    const itemKey = numericModId ? String(numericModId) : String(r.id || `af2_${moduleItemsMap.size + 1}`);
    seenKeys.add(itemKey);
    if (r.moduleTitle) seenKeys.add(r.moduleTitle.trim().toLowerCase());
    if (matchedMod?.title) seenKeys.add(matchedMod.title.trim().toLowerCase());

    const realCode = r.moduleCode || matchedMod?.code || '';
    const defaultSubTarget = evalRes.activity.submissionId || (numericModId ? `pending_${numericModId}_${learner.id}` : null);

    moduleItemsMap.set(itemKey, {
      id: numericModId || itemKey,
      moduleId: numericModId,
      recordId: r.id || null,
      submissionId: defaultSubTarget,
      hasSubmission: evalRes.activity.hasSubmission,
      code: realCode,
      title: r.moduleTitle || matchedMod?.title || 'Learning Module',
      strand: r.strandName || matchedMod?.learningArea?.name || 'General',
      status: evalRes.status,
      dueDate: evalRes.deadlineYmd,
      isOverdue: evalRes.isOverdue,
      progress: evalRes.progressPct,
      preTest: {
        score: evalRes.preTest.score,
        max: evalRes.preTest.max,
        percentage: evalRes.preTest.percentage,
      },
      postTest: {
        score: evalRes.postTest.score,
        max: evalRes.postTest.max,
        percentage: evalRes.postTest.percentage,
        isPassed: evalRes.postTest.isPassed,
      },
      activityBreakdown: {
        preTest: evalRes.preTest,
        reading: evalRes.reading,
        postTest: evalRes.postTest,
        activity: evalRes.activity,
      },
      submission: evalRes.activity.submissionId
        ? { id: evalRes.activity.submissionId, submittedAt: evalRes.activity.submittedAt }
        : null,
      completedPages: evalRes.completedPages,
      totalPages: evalRes.totalPages,
      completedAt: r.dateFinished || r.dateCompleted || prog?.completedAt || null,
      dateStarted: r.dateStarted || prog?.createdAt || null,
    });
  }

  // 2. Build candidate DB modules assigned to this learner (explicit assignments, All-Learners published modules, or modules with progress/submission/attempts)
  const candidateDbModules = new Map();
  for (const assign of dbAssignments || []) {
    if (assign?.module?.id) {
      candidateDbModules.set(Number(assign.module.id), { mod: assign.module, assign });
    }
  }
  if (learner.learningCenterId) {
    for (const mod of dbModules || []) {
      if (!mod?.id) continue;
      if (mod.status !== 'PUBLISHED') continue;
      if (mod.code === 'LS2-MOCK-001') continue;
      if (Number(mod.learningCenterId) !== Number(learner.learningCenterId)) continue;
      if (mod.targetLevel && learner.level && mod.targetLevel !== learner.level) continue;
      const isAllLearners = !Array.isArray(mod.assignments) || mod.assignments.length === 0;
      if (isAllLearners && !candidateDbModules.has(Number(mod.id))) {
        candidateDbModules.set(Number(mod.id), { mod, assign: null });
      }
    }
  }
  for (const prog of dbProgress || []) {
    if (prog?.module?.id && !candidateDbModules.has(Number(prog.module.id))) {
      candidateDbModules.set(Number(prog.module.id), { mod: prog.module, assign: null });
    }
  }
  for (const sub of dbSubmissions || []) {
    const mObj = sub?.module || (sub?.moduleId ? moduleMap.get(Number(sub.moduleId)) : null);
    if (mObj?.id && !candidateDbModules.has(Number(mObj.id))) {
      candidateDbModules.set(Number(mObj.id), { mod: mObj, assign: null });
    }
  }

  for (const [modIdNum, { mod, assign }] of candidateDbModules.entries()) {
    const keyId = String(modIdNum);
    const keyTitle = (mod.title || '').trim().toLowerCase();
    if (seenKeys.has(keyId) || (keyTitle && seenKeys.has(keyTitle))) continue;
    if (excludedRecordModuleIds.has(keyId) || (keyTitle && excludedRecordTitles.has(keyTitle))) continue;

    const { prog, subs, atts } = getDbRefsForModule(modIdNum);

    if (hasDateFilter) {
      const refDate = toYmd(prog?.completedAt || subs[0]?.submittedAt || prog?.createdAt || assign?.assignedAt || mod.dateStarted || mod.createdAt);
      if (!refDate) continue;
      if (fromDate && refDate < fromDate) continue;
      if (toDate && refDate > toDate) continue;
    }

    const evalRes = evaluateLearnerModuleStatus({
      learnerId: learner.id,
      af2Record: null,
      module: mod,
      assignment: assign,
      learnerProgress: prog,
      attempts: atts,
      submissions: subs,
    });

    seenKeys.add(keyId);
    if (keyTitle) seenKeys.add(keyTitle);

    const defaultSubTarget = evalRes.activity.submissionId || `pending_${modIdNum}_${learner.id}`;

    moduleItemsMap.set(keyId, {
      id: mod.id,
      moduleId: mod.id,
      recordId: null,
      submissionId: defaultSubTarget,
      hasSubmission: evalRes.activity.hasSubmission,
      code: mod.code || '',
      title: mod.title || 'Learning Module',
      strand: mod.learningArea?.name || 'General',
      status: evalRes.status,
      dueDate: evalRes.deadlineYmd,
      isOverdue: evalRes.isOverdue,
      progress: evalRes.progressPct,
      preTest: {
        score: evalRes.preTest.score,
        max: evalRes.preTest.max,
        percentage: evalRes.preTest.percentage,
      },
      postTest: {
        score: evalRes.postTest.score,
        max: evalRes.postTest.max,
        percentage: evalRes.postTest.percentage,
        isPassed: evalRes.postTest.isPassed,
      },
      activityBreakdown: {
        preTest: evalRes.preTest,
        reading: evalRes.reading,
        postTest: evalRes.postTest,
        activity: evalRes.activity,
      },
      submission: evalRes.activity.submissionId
        ? { id: evalRes.activity.submissionId, submittedAt: evalRes.activity.submittedAt }
        : null,
      completedPages: evalRes.completedPages,
      totalPages: evalRes.totalPages,
      completedAt: prog?.completedAt || null,
      dateStarted: prog?.createdAt || mod.dateStarted || null,
    });
  }

  const modules = Array.from(moduleItemsMap.values());

  let mastered = 0;
  let notMastered = 0;
  let notRecorded = 0;
  let inProgress = 0;
  let overdue = 0;

  for (const m of modules) {
    if (m.status === 'Mastered') mastered++;
    else if (m.status === 'Not Mastered') notMastered++;
    else if (m.status === 'Overdue') overdue++;
    else if (m.status === 'In Progress') inProgress++;
    else notRecorded++;
  }

  const recorded = mastered + notMastered;
  const pending = notRecorded + inProgress + overdue;
  const totalModules = recorded + pending;
  const progress = totalModules > 0 ? Math.round((recorded / totalModules) * 100) : 0;

  return {
    modules,
    summary: {
      recorded,
      mastered,
      notMastered,
      pending,
      notRecorded,
      inProgress,
      overdue,
      totalModules,
      progress,
    },
  };
}


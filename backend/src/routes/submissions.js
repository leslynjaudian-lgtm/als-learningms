import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';
import { syncLearnerModuleProgress } from '../utils/progressCalculator.js';
import { notifyActivitySubmitted } from '../services/notificationService.js';
import { parseManilaDeadline, isSubmissionDeadlinePassed } from '../utils/dateUtils.js';
import { logTeacherActivity } from '../utils/teacherActivityLogger.js';
import {
  evaluateLearnerModuleStatus,
  evaluateSubmissionStatus,
  isValidCompletedSubmission,
} from '../utils/moduleProgressStatus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.join(__dirname, '../..');
const DATA_DIR = path.join(BACKEND_ROOT, 'data');
const AF2_FILE = path.join(DATA_DIR, 'af2_records.json');

function readAf2Records() {
  try {
    if (fs.existsSync(AF2_FILE)) {
      const raw = fs.readFileSync(AF2_FILE, 'utf-8');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('Could not read AF2 records file:', err);
  }
  return [];
}

function syncAf2Record(recordData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let records = readAf2Records();

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

function inferFileTypeInfo(fileNameOrUrl = '', rawMime = '') {
  const target = String(fileNameOrUrl || '').toLowerCase().split('?')[0];
  const mime = String(rawMime || '').toLowerCase();

  if (target.endsWith('.pdf') || mime === 'application/pdf') {
    return { fileType: 'PDF Document', mimeType: 'application/pdf', ext: 'PDF', isPdf: true, isImage: false };
  }
  if (target.endsWith('.png') || mime === 'image/png') {
    return { fileType: 'PNG Image', mimeType: 'image/png', ext: 'PNG', isPdf: false, isImage: true };
  }
  if (target.endsWith('.webp') || mime === 'image/webp') {
    return { fileType: 'WEBP Image', mimeType: 'image/webp', ext: 'WEBP', isPdf: false, isImage: true };
  }
  if (target.endsWith('.gif') || mime === 'image/gif') {
    return { fileType: 'GIF Image', mimeType: 'image/gif', ext: 'GIF', isPdf: false, isImage: true };
  }
  if (target.endsWith('.jpg') || target.endsWith('.jpeg') || mime === 'image/jpeg') {
    return { fileType: 'JPG Image', mimeType: 'image/jpeg', ext: 'JPG', isPdf: false, isImage: true };
  }
  return { fileType: 'Image / Document', mimeType: rawMime || 'application/octet-stream', ext: 'FILE', isPdf: false, isImage: true };
}

function resolveDiskFilePath(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return null;
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('data:')) {
    return null;
  }
  const cleanRel = fileUrl.replace(/^\/+/, '');
  const candidate1 = path.join(BACKEND_ROOT, cleanRel);
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = path.join(process.cwd(), cleanRel);
  if (fs.existsSync(candidate2)) return candidate2;
  const candidate3 = path.join(BACKEND_ROOT, 'uploads/submissions', cleanRel);
  if (fs.existsSync(candidate3)) return candidate3;
  const candidate4 = path.join(BACKEND_ROOT, 'uploads/modules', cleanRel);
  if (fs.existsSync(candidate4)) return candidate4;
  return null;
}

function enrichFileItem(rawFile, index = 0, fallbackDate = null) {
  const fileUrl = String(rawFile?.fileUrl || rawFile?.url || '').trim();
  const fallbackName = fileUrl
    ? decodeURIComponent(fileUrl.split('/').pop().split('?')[0])
    : `Activity ${index + 1}.jpg`;
  const fileName = String(rawFile?.fileName || rawFile?.name || fallbackName).trim() || fallbackName;
  const typeInfo = inferFileTypeInfo(fileName || fileUrl, rawFile?.fileType || rawFile?.mimeType || rawFile?.type);

  let fileSize = rawFile?.fileSize || rawFile?.size || null;
  if ((!fileSize || Number(fileSize) <= 0) && fileUrl) {
    try {
      const diskPath = resolveDiskFilePath(fileUrl);
      if (diskPath) {
        const stat = fs.statSync(diskPath);
        if (stat && stat.size > 0) {
          fileSize = stat.size;
        }
      }
    } catch {}
  }

  return {
    id: rawFile?.id || `file_${index + 1}`,
    fileName,
    fileUrl,
    fileType: typeInfo.fileType,
    mimeType: typeInfo.mimeType,
    ext: typeInfo.ext,
    isPdf: typeInfo.isPdf,
    isImage: typeInfo.isImage,
    fileSize: fileSize ? Number(fileSize) : null,
    submittedAt: rawFile?.submittedAt || rawFile?.uploadedAt || fallbackDate || null,
  };
}

function extractFilesFromSubmissionRow(s) {
  const extracted = [];
  const seenKeys = new Set();

  function addCandidate(candidate, fallbackDate) {
    const url = String(candidate?.fileUrl || candidate?.url || '').trim();
    const name = String(candidate?.fileName || candidate?.name || '').trim();
    if (!url && !name) return;
    const dedupeKey = url ? url.toLowerCase() : name.toLowerCase();
    if (seenKeys.has(dedupeKey)) return;
    seenKeys.add(dedupeKey);
    extracted.push(enrichFileItem(candidate, extracted.length, fallbackDate));
  }

  // 1. Check if s.content stores structured JSON with files
  if (s.content && typeof s.content === 'string') {
    const trimmed = s.content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.files)
          ? parsed.files
          : [];
        for (const item of list) {
          addCandidate(item, s.submittedAt);
        }
      } catch {}
    }
  }

  // 2. Ensure primary fileUrl / fileName on the row is included
  if (s.fileUrl || s.fileName) {
    addCandidate(
      {
        fileUrl: s.fileUrl || '',
        fileName: s.fileName || '',
        submittedAt: s.submittedAt,
      },
      s.submittedAt
    );
  }

  return extracted;
}

function extractPlainContent(contentVal) {
  if (!contentVal || typeof contentVal !== 'string') return '';
  const trimmed = contentVal.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return String(parsed.text || parsed.notes || '');
      }
      return '';
    } catch {}
  }
  return contentVal;
}

function formatLearnerProgramLevel(rawLevel) {
  if (rawLevel === 'ELEMENTARY' || rawLevel === 'A&E Elementary') {
    return 'A&E Elementary';
  }
  if (
    rawLevel === 'JUNIOR' ||
    rawLevel === 'A&E Junior' ||
    rawLevel === 'A&E Junior High' ||
    String(rawLevel || '').toUpperCase().includes('JUN')
  ) {
    return 'A&E Junior High';
  }
  return rawLevel || 'A&E Elementary';
}

function findSavedRecordForSubmission(
  af2Records,
  { learnerId, moduleId, moduleTitle, submissionIds = [] }
) {
  const lid = Number(learnerId);
  if (!lid || isNaN(lid)) return null;
  const mid = moduleId != null ? Number(moduleId) : null;
  const normTitle = moduleTitle ? String(moduleTitle).trim().toLowerCase() : '';
  const subIdSet = new Set(
    (Array.isArray(submissionIds) ? submissionIds : [submissionIds])
      .map((id) => Number(id))
      .filter((n) => !isNaN(n) && n > 0)
  );

  return (
    (af2Records || []).find((r) => {
      if (Number(r.learnerId) !== lid) return false;
      if (r.submissionId && subIdSet.has(Number(r.submissionId))) return true;
      if (mid && r.moduleId && Number(r.moduleId) === mid) return true;
      if (
        normTitle &&
        r.moduleTitle &&
        String(r.moduleTitle).trim().toLowerCase() === normTitle
      ) {
        return true;
      }
      return false;
    }) || null
  );
}

// Helper to format submission record (supports single row or grouped rows for a learner+module)
function formatSubmission(s, groupedFiles = null, relatedIds = null, af2Records = null) {
  const displayLevel = formatLearnerProgramLevel(s.learner?.level);

  const files = Array.isArray(groupedFiles) && groupedFiles.length > 0
    ? groupedFiles.map((f, idx) => enrichFileItem(f, idx, s.submittedAt))
    : extractFilesFromSubmissionRow(s);

  const primaryFile = files[0] || null;
  const relIds = Array.isArray(relatedIds) && relatedIds.length > 0 ? relatedIds : [s.id];
  const allAf2 = Array.isArray(af2Records) ? af2Records : readAf2Records();
  const savedRecord = findSavedRecordForSubmission(allAf2, {
    learnerId: s.learnerId,
    moduleId: s.moduleId,
    moduleTitle: s.module?.title,
    submissionIds: relIds,
  });

  const af2Eval = String(savedRecord?.assessment || savedRecord?.moduleStatus || '').trim();
  const isEvaluated = af2Eval === 'Mastered' || af2Eval === 'Not Mastered';
  const subStatus = evaluateSubmissionStatus({
    af2Record: savedRecord,
    module: s.module || null,
    submissions: [{ ...s, files }],
  });
  const isRecorded = subStatus.isRecorded && isEvaluated;
  const recordTrackingStatus = isRecorded ? 'Recorded' : 'Not Recorded';
  const evaluationStatus = isEvaluated ? af2Eval : '';
  const savedRemarks = savedRecord?.remarks
    ? String(savedRecord.remarks).trim()
    : s.feedback || '';

  const moduleDateEnded = s.module?.dateEnded ? s.module.dateEnded.toISOString().split('T')[0] : null;
  const isSubmissionClosed = Boolean(moduleDateEnded && isSubmissionDeadlinePassed(moduleDateEnded));

  return {
    id: s.id,
    submissionId: s.id,
    hasSubmitted: true,
    isRecorded,
    existingRecordId: savedRecord?.id || null,
    evaluationStatus,
    otherActivities: savedRecord?.otherActivities || '',
    relatedSubmissionIds: relIds,
    moduleId: s.moduleId,
    moduleTitle: s.module?.title || 'Learning Module',
    dateEnded: moduleDateEnded,
    isSubmissionClosed,
    learnerId: s.learnerId,
    learnerName: s.learner?.fullName || 'Learner',
    lrn: s.learner?.lrn || '—',
    programLevel: displayLevel,
    activity: s.title || s.module?.title || 'Module Activity Output',
    title: s.title || 'Module Activity Output',
    fileUrl: primaryFile?.fileUrl || s.fileUrl || '',
    fileName: primaryFile?.fileName || s.fileName || '',
    fileType: primaryFile?.fileType || '',
    fileSize: primaryFile?.fileSize || null,
    files,
    fileCount: files.length,
    content: extractPlainContent(s.content),
    grade: s.grade ? Number(s.grade) : null,
    feedback: savedRemarks,
    teacherRemarks: savedRemarks,
    remarks: savedRemarks,
    status: recordTrackingStatus,
    isReviewFinalized: isRecorded,
    dateSubmitted: s.submittedAt ? s.submittedAt.toISOString().split('T')[0] : '',
    submittedAt: s.submittedAt,
    updatedAt: s.updatedAt,
  };
}

// Group raw submission rows by (moduleId, learnerId) so each learner has exactly ONE submission per module
// while preserving all uploaded files in chronological upload order.
function groupSubmissionsByLearnerAndModule(rows, af2Records = null) {
  const groups = new Map();
  const resolvedAf2 = Array.isArray(af2Records) ? af2Records : readAf2Records();

  // Sort oldest-first when collecting files so Activity 1, Activity 2, Activity 3 stay in upload order
  const chronological = [...(rows || [])]
    .filter(isValidCompletedSubmission)
    .sort((a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime());

  for (const row of chronological) {
    const key = `${row.moduleId}_${row.learnerId}`;
    const rowFiles = extractFilesFromSubmissionRow(row);

    if (!groups.has(key)) {
      groups.set(key, {
        primaryRow: { ...row },
        files: [...rowFiles],
        seenFileKeys: new Set(
          rowFiles.map((f) => (f.fileUrl ? f.fileUrl.toLowerCase() : f.fileName.toLowerCase()))
        ),
        relatedIds: [row.id],
      });
    } else {
      const grp = groups.get(key);
      grp.relatedIds.push(row.id);

      for (const f of rowFiles) {
        const fKey = f.fileUrl ? f.fileUrl.toLowerCase() : f.fileName.toLowerCase();
        if (!grp.seenFileKeys.has(fKey)) {
          grp.seenFileKeys.add(fKey);
          grp.files.push({
            ...f,
            id: `file_${grp.files.length + 1}`,
          });
        }
      }

      // Keep latest submission timestamp
      if (row.submittedAt && new Date(row.submittedAt) > new Date(grp.primaryRow.submittedAt || 0)) {
        grp.primaryRow.submittedAt = row.submittedAt;
      }
      if (row.updatedAt && new Date(row.updatedAt) > new Date(grp.primaryRow.updatedAt || 0)) {
        grp.primaryRow.updatedAt = row.updatedAt;
      }

      if (row.feedback && String(row.feedback).trim()) {
        grp.primaryRow.feedback = row.feedback;
      }
      if (row.grade != null) {
        grp.primaryRow.grade = row.grade;
      }
    }
  }

  // Return sorted by latest submittedAt descending
  return Array.from(groups.values())
    .sort(
      (a, b) =>
        new Date(b.primaryRow.submittedAt || 0).getTime() -
        new Date(a.primaryRow.submittedAt || 0).getTime()
    )
    .map((grp) => formatSubmission(grp.primaryRow, grp.files, grp.relatedIds, resolvedAf2));
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
// GET /api/submissions/learner-progress
// Authoritative learner-specific module progress & activity checklist for Teacher/Admin
// ---------------------
router.get('/learner-progress', authenticate, requireRole(['ADMIN', 'TEACHER']), async (req, res, next) => {
  try {
    const moduleId = parseInt(req.query.moduleId, 10);
    const learnerId = parseInt(req.query.learnerId, 10);
    if (isNaN(moduleId) || isNaN(learnerId)) {
      return res.status(400).json({ error: 'Valid moduleId and learnerId are required' });
    }

    const [learner, moduleObj] = await Promise.all([
      prisma.learner.findUnique({
        where: { id: learnerId },
        include: { learningCenter: true, assignedTeacher: true },
      }),
      prisma.module.findUnique({
        where: { id: moduleId },
        include: {
          learningArea: true,
          assessments: {
            select: { id: true, type: true, title: true, _count: { select: { questions: true } } },
          },
          _count: { select: { pages: true } },
        },
      }),
    ]);

    if (!learner) return res.status(404).json({ error: 'Learner not found' });
    if (!moduleObj) return res.status(404).json({ error: 'Module not found' });

    if (req.user.role === 'TEACHER') {
      const allowedTeacherIds = [req.user.profileId, req.user.userId, req.user.id]
        .filter((v) => v != null && !isNaN(Number(v)))
        .map(Number);
      const teacherCenterId = req.user.teacherProfile?.learningCenterId;

      const isLearnerAssigned =
        allowedTeacherIds.includes(Number(learner.assignedTeacherId)) ||
        (teacherCenterId && learner.learningCenterId === teacherCenterId && !learner.assignedTeacherId);
      if (!isLearnerAssigned) {
        return res.status(403).json({ error: 'Access denied. Learner is not assigned to you.' });
      }
      if (!allowedTeacherIds.includes(Number(moduleObj.teacherId))) {
        return res.status(403).json({ error: 'Access denied. Module is not owned by you.' });
      }
    }

    const [assignment, learnerProgress, attempts, submissions] = await Promise.all([
      prisma.moduleAssignment.findUnique({
        where: { moduleId_learnerId: { moduleId, learnerId } },
      }).catch(() => null),
      prisma.learnerProgress.findUnique({
        where: { learnerId_moduleId: { learnerId, moduleId } },
      }).catch(() => null),
      prisma.assessmentAttempt.findMany({
        where: { learnerId, assessment: { moduleId } },
        include: { assessment: { select: { id: true, moduleId: true, type: true, _count: { select: { questions: true } } } } },
        orderBy: { submittedAt: 'desc' },
      }).catch(() => []),
      prisma.submission.findMany({
        where: { moduleId, learnerId },
        orderBy: { submittedAt: 'desc' },
      }).catch(() => []),
    ]);

    const af2Records = readAf2Records();
    const af2Record = af2Records.find((r) => {
      const rLid = r.learnerId != null ? Number(r.learnerId) : null;
      const rMid = r.moduleId != null ? Number(r.moduleId) : null;
      if (rLid === learnerId && rMid === moduleId) return true;
      if (rLid === learnerId && !rMid && r.moduleTitle && moduleObj.title && r.moduleTitle.trim().toLowerCase() === moduleObj.title.trim().toLowerCase()) {
        return true;
      }
      return false;
    }) || null;

    const evalRes = evaluateLearnerModuleStatus({
      learnerId,
      af2Record,
      module: moduleObj,
      assignment,
      learnerProgress,
      attempts,
      submissions,
    });

    const subStatusRes = evaluateSubmissionStatus({
      af2Record,
      learnerProgress,
      submissions,
      module: moduleObj,
      assignment,
    });

    res.json({
      learner: {
        id: learner.id,
        fullName: learner.fullName,
        lrn: learner.lrn || '—',
        level: formatLearnerProgramLevel(learner.level),
        learningCenter: learner.learningCenter?.name || '—',
      },
      module: {
        id: moduleObj.id,
        code: moduleObj.code || '',
        title: moduleObj.title,
        strand: moduleObj.learningArea?.name || 'General',
        dateStarted: moduleObj.dateStarted ? moduleObj.dateStarted.toISOString().split('T')[0] : null,
        dateEnded: moduleObj.dateEnded ? moduleObj.dateEnded.toISOString().split('T')[0] : null,
      },
      recordId: af2Record?.id || null,
      submissionStatus: subStatusRes.status,
      submissionIsOverdue: subStatusRes.isOverdue,
      submissionIsRecorded: subStatusRes.isRecorded,
      ...evalRes,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/submissions/scores
// Query assessment scores for a specific module and learner
// ---------------------
router.get('/scores', authenticate, async (req, res, next) => {
  try {
    const { moduleId, learnerId } = req.query;
    const effectiveLearnerId = req.user.role === 'LEARNER' ? req.user.profileId : learnerId;
    if (!moduleId || !effectiveLearnerId) {
      return res.status(400).json({ error: 'moduleId and learnerId are required' });
    }
    const scores = await getLearnerAssessmentScores(effectiveLearnerId, moduleId);
    res.json(scores);
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/submissions
// List submissions with role scoping, multi-file grouping, and assessment scores
// ---------------------
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { moduleId, learnerId, teacherId } = req.query;
    const where = {};

    if (moduleId) {
      const mid = parseInt(moduleId, 10);
      if (!isNaN(mid)) where.moduleId = mid;
    }

    // Role Scoping:
    if (req.user && req.user.role === 'LEARNER') {
      if (!req.user.profileId) return res.json([]);
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
        module: { select: { id: true, title: true, teacherId: true, dateEnded: true } },
        learner: { select: { id: true, fullName: true, lrn: true, level: true, assignedTeacherId: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const af2Records = readAf2Records();
    const grouped = groupSubmissionsByLearnerAndModule(submissions, af2Records);

    // If querying for a specific module in the Teacher/Admin Portal, also include eligible learners without submissions
    // classified by priority: Recorded -> Not Recorded -> Overdue -> In Progress.
    const isTeacherOrAdminRequest =
      Boolean(teacherId) ||
      (req.user && (req.user.role === 'TEACHER' || req.user.role === 'ADMIN')) ||
      req.query.includeEligible === '1';

    const combinedRows = [...grouped];

    if (moduleId && isTeacherOrAdminRequest && !(req.user && req.user.role === 'LEARNER')) {
      const mid = parseInt(moduleId, 10);
      if (!isNaN(mid)) {
        const moduleObj = await prisma.module.findUnique({
          where: { id: mid },
          include: {
            learningArea: true,
            assessments: {
              select: {
                id: true,
                type: true,
                _count: { select: { questions: true } },
              },
            },
            _count: { select: { pages: true } },
            assignments: {
              include: {
                learner: {
                  select: {
                    id: true,
                    fullName: true,
                    lrn: true,
                    level: true,
                    status: true,
                    assignedTeacherId: true,
                    learningCenterId: true,
                  },
                },
              },
            },
          },
        });

        if (moduleObj) {
          if (req.user && req.user.role === 'TEACHER') {
            const allowedTeacherIds = [req.user.profileId, req.user.userId, req.user.id]
              .filter((v) => v != null && !isNaN(Number(v)))
              .map(Number);
            if (!allowedTeacherIds.includes(Number(moduleObj.teacherId))) {
              return res.json([]);
            }
          }

          const submittedLearnerIds = new Set(grouped.map((g) => Number(g.learnerId)));
          const requestedLearnerId = learnerId ? parseInt(learnerId, 10) : null;
          const eligibleCandidates = [];

          if (Array.isArray(moduleObj.assignments) && moduleObj.assignments.length > 0) {
            for (const assign of moduleObj.assignments) {
              if (!assign.learner) continue;
              if (req.user && req.user.role === 'TEACHER') {
                const tCenterId = req.user.teacherProfile?.learningCenterId;
                const isOwnLearner =
                  Number(assign.learner.assignedTeacherId) === Number(req.user.profileId) ||
                  (tCenterId && assign.learner.learningCenterId === tCenterId && !assign.learner.assignedTeacherId);
                if (!isOwnLearner) continue;
              }
              if (requestedLearnerId && !isNaN(requestedLearnerId) && assign.learner.id !== requestedLearnerId) {
                continue;
              }
              eligibleCandidates.push({
                learner: assign.learner,
                assignment: assign,
                dueDate: assign.dueDate || moduleObj.dateEnded || null,
              });
            }
          } else {
            const eligibleLearners = await prisma.learner.findMany({
              where: {
                status: { notIn: ['Inactive', 'INACTIVE', 'Archived', 'ARCHIVED'] },
                ...(moduleObj.teacherId ? { assignedTeacherId: moduleObj.teacherId } : {}),
                ...(moduleObj.learningCenterId ? { learningCenterId: moduleObj.learningCenterId } : {}),
                ...(moduleObj.targetLevel ? { level: moduleObj.targetLevel } : {}),
                ...(requestedLearnerId && !isNaN(requestedLearnerId) ? { id: requestedLearnerId } : {}),
              },
              select: {
                id: true,
                fullName: true,
                lrn: true,
                level: true,
                status: true,
                assignedTeacherId: true,
                learningCenterId: true,
              },
              orderBy: { fullName: 'asc' },
            });

            for (const lrnObj of eligibleLearners) {
              eligibleCandidates.push({
                learner: lrnObj,
                assignment: null,
                dueDate: moduleObj.dateEnded || null,
              });
            }
          }

          const pendingCandidateIds = eligibleCandidates
            .map((c) => c.learner?.id)
            .filter((lid) => lid != null && !submittedLearnerIds.has(Number(lid)));

          const [candidateProgressList, candidateAttemptsList] = pendingCandidateIds.length > 0
            ? await Promise.all([
                prisma.learnerProgress.findMany({
                  where: {
                    moduleId: moduleObj.id,
                    learnerId: { in: pendingCandidateIds },
                  },
                }).catch(() => []),
                prisma.assessmentAttempt.findMany({
                  where: {
                    learnerId: { in: pendingCandidateIds },
                    assessment: { moduleId: moduleObj.id },
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
              ])
            : [[], []];

          const progressByLearner = new Map(
            candidateProgressList.map((p) => [Number(p.learnerId), p])
          );
          const attemptsByLearner = new Map();
          for (const att of candidateAttemptsList) {
            const lid = Number(att.learnerId);
            if (!attemptsByLearner.has(lid)) attemptsByLearner.set(lid, []);
            attemptsByLearner.get(lid).push(att);
          }

          for (const candidate of eligibleCandidates) {
            const lrnObj = candidate.learner;
            if (!lrnObj || submittedLearnerIds.has(Number(lrnObj.id))) continue;
            submittedLearnerIds.add(Number(lrnObj.id));

            const savedRecord = findSavedRecordForSubmission(af2Records, {
              learnerId: lrnObj.id,
              moduleId: moduleObj.id,
              moduleTitle: moduleObj.title,
              submissionIds: [],
            });

            const progObj = progressByLearner.get(Number(lrnObj.id)) || null;
            const subStatusRes = evaluateSubmissionStatus({
              af2Record: savedRecord,
              learnerProgress: progObj,
              submissions: [],
              module: moduleObj,
              assignment: candidate.assignment || null,
              dueDate: candidate.dueDate || moduleObj.dateEnded || null,
            });

            const effectiveDeadline = candidate.dueDate || moduleObj.dateEnded || null;
            const isOverdue = subStatusRes.isOverdue;
            const nonSubmittedStatus = subStatusRes.status;
            const deadlineYmd = effectiveDeadline
              ? new Date(effectiveDeadline).toISOString().split('T')[0]
              : null;

            combinedRows.push({
              id: `pending_${moduleObj.id}_${lrnObj.id}`,
              submissionId: null,
              hasSubmitted: false,
              isRecorded: subStatusRes.isRecorded,
              existingRecordId: savedRecord?.id || null,
              evaluationStatus: subStatusRes.evaluationStatus,
              otherActivities: savedRecord?.otherActivities || '',
              relatedSubmissionIds: [],
              moduleId: moduleObj.id,
              moduleTitle: moduleObj.title || 'Learning Module',
              dateEnded: deadlineYmd,
              isSubmissionClosed: isOverdue,
              learnerId: lrnObj.id,
              learnerName: lrnObj.fullName || 'Learner',
              lrn: lrnObj.lrn || '—',
              programLevel: formatLearnerProgramLevel(lrnObj.level || moduleObj.targetLevel),
              activity: moduleObj.title || 'Module Activity Output',
              title: moduleObj.title || 'Module Activity Output',
              fileUrl: '',
              fileName: '',
              fileType: '',
              fileSize: null,
              files: [],
              fileCount: 0,
              content: '',
              grade: null,
              feedback: savedRecord?.remarks ? String(savedRecord.remarks).trim() : '',
              teacherRemarks: savedRecord?.remarks ? String(savedRecord.remarks).trim() : '',
              remarks: savedRecord?.remarks ? String(savedRecord.remarks).trim() : '',
              status: nonSubmittedStatus,
              isReviewFinalized: subStatusRes.isRecorded,
              dateSubmitted: '',
              submittedAt: null,
              updatedAt: null,
            });
          }
        }
      }
    }

    const enriched = await Promise.all(
      combinedRows.map(async (item) => {
        const scores = await getLearnerAssessmentScores(item.learnerId, item.moduleId);
        return {
          ...item,
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
// GET /api/submissions/:id
// Get a single learner submission with all grouped files and assessment scores
// ---------------------
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid submission ID' });

    const sub = await prisma.submission.findUnique({
      where: { id },
      include: {
        module: { select: { id: true, title: true, teacherId: true, dateEnded: true } },
        learner: { select: { id: true, fullName: true, lrn: true, level: true, assignedTeacherId: true } },
      },
    });

    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    if (req.user && req.user.role === 'TEACHER' && sub.module?.teacherId !== req.user.profileId) {
      return res.status(403).json({ error: 'You are not authorized to view this submission' });
    }

    // Fetch all rows for the same (moduleId, learnerId) in case multiple rows existed
    const allRowsForLearnerModule = await prisma.submission.findMany({
      where: {
        moduleId: sub.moduleId,
        learnerId: sub.learnerId,
      },
      include: {
        module: { select: { id: true, title: true, teacherId: true, dateEnded: true } },
        learner: { select: { id: true, fullName: true, lrn: true, level: true, assignedTeacherId: true } },
      },
      orderBy: { submittedAt: 'asc' },
    });

    const grouped = groupSubmissionsByLearnerAndModule(allRowsForLearnerModule);
    const unified = grouped[0] || formatSubmission(sub);
    const scores = await getLearnerAssessmentScores(sub.learnerId, sub.moduleId);

    res.json({
      ...unified,
      id: sub.id,
      ...scores,
    });
  } catch (err) {
    next(err);
  }
});

function collectUrlsFromSubmissionRows(rows) {
  const urls = new Set();
  for (const row of rows || []) {
    if (row?.fileUrl && String(row.fileUrl).trim()) {
      urls.add(String(row.fileUrl).trim());
    }
    const rowFiles = extractFilesFromSubmissionRow(row);
    for (const f of rowFiles) {
      if (f?.fileUrl && String(f.fileUrl).trim()) {
        urls.add(String(f.fileUrl).trim());
      }
    }
  }
  return Array.from(urls);
}

async function safelyRemoveRetiredSubmissionFiles(candidateUrls = []) {
  const cleanUrls = Array.from(
    new Set(
      (candidateUrls || [])
        .map((u) => String(u || '').trim())
        .filter((u) => u.startsWith('/uploads/'))
    )
  );
  if (cleanUrls.length === 0) return;

  try {
    const remainingSubs = await prisma.submission.findMany({
      select: { fileUrl: true, content: true },
    });
    const stillReferenced = new Set();
    for (const sub of remainingSubs) {
      if (sub.fileUrl) stillReferenced.add(String(sub.fileUrl).trim().toLowerCase());
      const subFiles = extractFilesFromSubmissionRow(sub);
      for (const f of subFiles) {
        if (f?.fileUrl) stillReferenced.add(String(f.fileUrl).trim().toLowerCase());
      }
    }

    const uploadsRoot = path.resolve(BACKEND_ROOT, 'uploads');
    for (const rawUrl of cleanUrls) {
      const cleanRel = rawUrl.split('?')[0].trim();
      if (stillReferenced.has(cleanRel.toLowerCase())) continue;
      const relPath = cleanRel.replace(/^\/uploads\//i, '');
      const fullPath = path.resolve(uploadsRoot, relPath);
      if (!fullPath.startsWith(uploadsRoot + path.sep)) continue;
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          console.warn('[Submissions] Failed to unlink retired file:', fullPath, err.message);
        }
      }
    }
  } catch (err) {
    console.warn('[Submissions] Error cleaning up retired files:', err.message);
  }
}

// ---------------------
// POST /api/submissions
// Submit module activity (Learner) — supports single or multiple files grouped per learner+module
// ---------------------
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      moduleId,
      title,
      content,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      files: incomingFiles,
      replaceFiles,
      learnerId: explicitLearnerId,
    } = req.body;

    const parsedModuleId = parseInt(moduleId, 10);
    if (isNaN(parsedModuleId)) {
      return res.status(400).json({ error: 'Valid module ID is required' });
    }

    let targetLearnerId = null;
    if (req.user && req.user.role === 'LEARNER') {
      targetLearnerId = req.user.profileId;
    } else if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'TEACHER') && explicitLearnerId) {
      targetLearnerId = parseInt(explicitLearnerId, 10);
    } else if (!req.user && explicitLearnerId) {
      return res.status(401).json({ error: 'Authentication required for submission.' });
    }

    if (!targetLearnerId) {
      return res.status(400).json({ error: 'Learner ID is required for submission' });
    }

    // Retrieve module and assignment to evaluate submission deadline
    const moduleRecord = await prisma.module.findUnique({
      where: { id: parsedModuleId },
      select: {
        id: true,
        title: true,
        dateEnded: true,
        assignments: {
          where: { learnerId: targetLearnerId },
          select: { dueDate: true },
        },
      },
    });

    if (!moduleRecord) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Authoritative submission deadline check in Asia/Manila server time
    const rawDeadline = moduleRecord.assignments?.[0]?.dueDate || moduleRecord.dateEnded;
    if (rawDeadline && isSubmissionDeadlinePassed(rawDeadline)) {
      return res.status(403).json({
        error: 'The submission deadline has passed. You can no longer change your files.',
        isDeadlinePassed: true,
        deadline: parseManilaDeadline(rawDeadline)?.toISOString(),
      });
    }

    // Check if submission(s) already exist for this (moduleId, learnerId)
    const existingRows = await prisma.submission.findMany({
      where: {
        moduleId: parsedModuleId,
        learnerId: targetLearnerId,
      },
      orderBy: { submittedAt: 'asc' },
    });

    // Protect already evaluated submissions in Records (AF2 file, LearnerProgress masteryStatus, or Submission status)
    const af2Records = readAf2Records();
    const savedRecord = findSavedRecordForSubmission(af2Records, {
      learnerId: targetLearnerId,
      moduleId: parsedModuleId,
      moduleTitle: moduleRecord.title,
      submissionIds: existingRows.map((r) => r.id),
    });
    const af2Eval = String(savedRecord?.assessment || savedRecord?.moduleStatus || '').trim();
    const progRow = await prisma.learnerProgress.findUnique({
      where: { learnerId_moduleId: { learnerId: targetLearnerId, moduleId: parsedModuleId } },
      select: { masteryStatus: true },
    }).catch(() => null);

    const hasRecordsEvaluation =
      af2Eval === 'Mastered' ||
      af2Eval === 'Not Mastered' ||
      progRow?.masteryStatus === 'MASTERED' ||
      progRow?.masteryStatus === 'NOT_MASTERED' ||
      existingRows.some((row) => {
        const st = String(row.status || '').toLowerCase().replace(/_/g, ' ').trim();
        return st === 'mastered' || st === 'not mastered' || st === 'graded' || row.grade != null;
      });

    if (hasRecordsEvaluation) {
      return res.status(403).json({
        error: 'Your teacher has checked your work in Records. You cannot delete or replace these files now.',
        isFinalized: true,
      });
    }

    const nowIso = new Date().toISOString();
    const newFilesList = [];

    if (Array.isArray(incomingFiles)) {
      incomingFiles.forEach((f, idx) => {
        if (f && (f.fileUrl || f.url || f.fileName || f.name)) {
          newFilesList.push(
            enrichFileItem(
              {
                fileUrl: f.fileUrl || f.url || '',
                fileName: f.fileName || f.name || `Activity ${idx + 1}.jpg`,
                fileSize: f.fileSize || f.size || null,
                fileType: f.fileType || f.type || '',
                submittedAt: f.submittedAt || f.uploadedAt || nowIso,
              },
              idx,
              nowIso
            )
          );
        }
      });
    } else if (fileUrl || fileName) {
      newFilesList.push(
        enrichFileItem(
          {
            fileUrl: fileUrl?.trim() || '',
            fileName: fileName?.trim() || 'activity_output.pdf',
            fileSize: fileSize || null,
            fileType: fileType || '',
            submittedAt: nowIso,
          },
          0,
          nowIso
        )
      );
    }

    let mergedFiles = [];
    const seenKeys = new Set();

    function pushUniqueFile(f) {
      const url = String(f?.fileUrl || '').trim();
      const name = String(f?.fileName || '').trim();
      if (!url && !name) return;
      const key = url ? url.toLowerCase() : name.toLowerCase();
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      mergedFiles.push(enrichFileItem(f, mergedFiles.length, nowIso));
    }

    if (!replaceFiles && existingRows.length > 0) {
      for (const row of existingRows) {
        const rowFiles = extractFilesFromSubmissionRow(row);
        rowFiles.forEach(pushUniqueFile);
      }
    }

    newFilesList.forEach(pushUniqueFile);

    const previousFileUrls = collectUrlsFromSubmissionRows(existingRows);

    // If learner removed all submitted files (`replaceFiles: true` with 0 remaining files),
    // delete the Submission rows so the module is no longer marked as submitted.
    if (replaceFiles && mergedFiles.length === 0) {
      if (existingRows.length > 0) {
        await prisma.submission.deleteMany({
          where: {
            moduleId: parsedModuleId,
            learnerId: targetLearnerId,
          },
        });
      }

      await prisma.learnerProgress.updateMany({
        where: {
          learnerId: targetLearnerId,
          moduleId: parsedModuleId,
        },
        data: {
          completedAt: null,
          status: 'IN_PROGRESS',
        },
      }).catch(() => {});

      await syncLearnerModuleProgress(targetLearnerId, parsedModuleId);
      await safelyRemoveRetiredSubmissionFiles(previousFileUrls);

      return res.json({
        deleted: true,
        hasSubmitted: false,
        isRecorded: false,
        files: [],
        fileCount: 0,
        status: 'In Progress',
        moduleId: parsedModuleId,
        learnerId: targetLearnerId,
      });
    }

    const primaryFile = mergedFiles[0] || newFilesList[0] || null;
    const plainText = extractPlainContent(content);

    let prevHistory = [];
    if (existingRows.length > 0) {
      try {
        const parsed = JSON.parse(existingRows[0].content || '{}');
        if (Array.isArray(parsed?.history)) prevHistory = parsed.history;
      } catch {}
    }

    const actionType = req.body.action || (existingRows.length > 0 ? 'FILES_UPDATED' : 'SUBMITTED');
    const serializedContent = JSON.stringify({
      text: plainText || `Uploaded ${mergedFiles.length} activity file(s)`,
      files: mergedFiles,
      history: [
        ...prevHistory,
        {
          action: actionType,
          fileCount: mergedFiles.length,
          timestamp: nowIso
        }
      ]
    });

    let sub;
    if (existingRows.length > 0) {
      const primaryExisting = existingRows[0];
      sub = await prisma.submission.update({
        where: { id: primaryExisting.id },
        data: {
          title: title?.trim() || primaryExisting.title || 'Module Activity Output',
          fileUrl: primaryFile?.fileUrl || null,
          fileName: primaryFile?.fileName || null,
          content: serializedContent,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
        include: {
          module: { select: { id: true, title: true, teacherId: true, dateEnded: true } },
          learner: { select: { id: true, fullName: true, lrn: true, level: true } },
        },
      });

      // Remove redundant extra rows for the same (moduleId, learnerId) now that all files are merged
      if (existingRows.length > 1) {
        const extraIds = existingRows.slice(1).map((r) => r.id);
        await prisma.submission.deleteMany({
          where: { id: { in: extraIds } },
        }).catch(() => {});
      }

      // Clean up any replaced or removed files on disk no longer referenced
      const activeUrlsLower = new Set(mergedFiles.map((f) => String(f?.fileUrl || '').trim().toLowerCase()).filter(Boolean));
      const retiredUrls = previousFileUrls.filter((u) => !activeUrlsLower.has(u.toLowerCase()));
      if (retiredUrls.length > 0) {
        await safelyRemoveRetiredSubmissionFiles(retiredUrls);
      }
    } else {
      sub = await prisma.submission.create({
        data: {
          moduleId: parsedModuleId,
          learnerId: targetLearnerId,
          title: title?.trim() || 'Module Activity Output',
          content: serializedContent,
          fileUrl: primaryFile?.fileUrl || fileUrl?.trim() || null,
          fileName: primaryFile?.fileName || fileName?.trim() || null,
          status: 'SUBMITTED',
        },
        include: {
          module: { select: { id: true, title: true, teacherId: true, dateEnded: true } },
          learner: { select: { id: true, fullName: true, lrn: true, level: true } },
        },
      });
    }

    // Synchronize learner progress for this module
    await syncLearnerModuleProgress(targetLearnerId, parsedModuleId);

    // Notify the teacher about activity submission
    notifyActivitySubmitted({
      submissionId: sub.id,
      isUpdate: existingRows.length > 0,
    }).catch((e) => console.error('[Submissions] notifyActivitySubmitted error:', e));

    res.status(201).json(formatSubmission(sub, mergedFiles, [sub.id]));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// DELETE /api/submissions/:id
// Delete an unrecorded learner submission completely
// ---------------------
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid submission ID' });

    const sub = await prisma.submission.findUnique({
      where: { id },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            dateEnded: true,
            teacherId: true,
            assignments: {
              select: { learnerId: true, dueDate: true },
            },
          },
        },
      },
    });
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    if (req.user.role === 'LEARNER' && Number(sub.learnerId) !== Number(req.user.profileId)) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own submissions.' });
    }
    if (req.user.role === 'TEACHER' && Number(sub.module?.teacherId) !== Number(req.user.profileId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (req.user.role === 'LEARNER') {
      const assign = sub.module?.assignments?.find((a) => Number(a.learnerId) === Number(sub.learnerId));
      const rawDeadline = assign?.dueDate || sub.module?.dateEnded;
      if (rawDeadline && isSubmissionDeadlinePassed(rawDeadline)) {
        return res.status(403).json({
          error: 'The submission deadline has passed. You can no longer delete this submission.',
          isDeadlinePassed: true,
        });
      }
    }

    const allRows = await prisma.submission.findMany({
      where: { moduleId: sub.moduleId, learnerId: sub.learnerId },
    });

    const af2Records = readAf2Records();
    const savedRecord = findSavedRecordForSubmission(af2Records, {
      learnerId: sub.learnerId,
      moduleId: sub.moduleId,
      moduleTitle: sub.module?.title,
      submissionIds: allRows.map((r) => r.id),
    });
    const af2Eval = String(savedRecord?.assessment || savedRecord?.moduleStatus || '').trim();
    const progRow = await prisma.learnerProgress.findUnique({
      where: { learnerId_moduleId: { learnerId: sub.learnerId, moduleId: sub.moduleId } },
      select: { masteryStatus: true },
    }).catch(() => null);

    if (
      af2Eval === 'Mastered' ||
      af2Eval === 'Not Mastered' ||
      progRow?.masteryStatus === 'MASTERED' ||
      progRow?.masteryStatus === 'NOT_MASTERED'
    ) {
      return res.status(403).json({
        error: 'Cannot delete a submission that has already been evaluated in Records.',
        isFinalized: true,
      });
    }

    const previousUrls = collectUrlsFromSubmissionRows(allRows);

    await prisma.submission.deleteMany({
      where: { moduleId: sub.moduleId, learnerId: sub.learnerId },
    });

    await prisma.learnerProgress.updateMany({
      where: { moduleId: sub.moduleId, learnerId: sub.learnerId },
      data: { completedAt: null, status: 'IN_PROGRESS' },
    }).catch(() => {});

    await syncLearnerModuleProgress(sub.learnerId, sub.moduleId);
    await safelyRemoveRetiredSubmissionFiles(previousUrls);

    res.json({ deleted: true, hasSubmitted: false, files: [], fileCount: 0 });
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
      include: {
        module: {
          select: {
            id: true,
            title: true,
            teacherId: true,
            targetLevel: true,
            learningCenterId: true,
            learningArea: { select: { id: true, name: true, code: true } },
          },
        },
        learner: {
          select: {
            id: true,
            fullName: true,
            lrn: true,
            level: true,
            assignedTeacherId: true,
            learningCenterId: true,
          },
        },
      },
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
      const lower = String(status).toLowerCase().replace(/_/g, ' ').trim();
      if (lower === 'mastered') normalizedStatus = 'Mastered';
      else if (lower === 'not mastered') normalizedStatus = 'Not Mastered';
    }

    // Gather all rows for this (moduleId, learnerId) so we preserve all uploaded files and consolidate if needed
    const allRows = await prisma.submission.findMany({
      where: {
        moduleId: sub.moduleId,
        learnerId: sub.learnerId,
      },
      orderBy: { submittedAt: 'asc' },
    });

    const groupedList = groupSubmissionsByLearnerAndModule(allRows.length > 0 ? allRows : [sub]);
    const allFiles = groupedList[0]?.files || extractFilesFromSubmissionRow(sub);
    const primaryFile = allFiles[0] || null;
    const plainText = extractPlainContent(sub.content);

    const preservedContent = JSON.stringify({
      text: plainText,
      files: allFiles,
    });

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        grade: grade !== undefined && grade !== null && grade !== '' ? Number(grade) : undefined,
        feedback: resolvedFeedback !== undefined ? String(resolvedFeedback).trim() : undefined,
        status: normalizedStatus || undefined,
        fileUrl: primaryFile?.fileUrl || sub.fileUrl || undefined,
        fileName: primaryFile?.fileName || sub.fileName || undefined,
        content: allFiles.length > 0 ? preservedContent : undefined,
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            teacherId: true,
            targetLevel: true,
            learningCenterId: true,
            learningArea: { select: { id: true, name: true, code: true } },
          },
        },
        learner: {
          select: {
            id: true,
            fullName: true,
            lrn: true,
            level: true,
            assignedTeacherId: true,
            learningCenterId: true,
          },
        },
      },
    });

    // Clean up any duplicate rows for the same (moduleId, learnerId) now that files are consolidated on `id`
    if (allRows.length > 1) {
      const extraIds = allRows.map((r) => r.id).filter((rId) => rId !== id);
      if (extraIds.length > 0) {
        await prisma.submission.deleteMany({
          where: { id: { in: extraIds } },
        }).catch(() => {});
      }
    }

    // Also update LearnerProgress in database
    if (sub.learnerId && sub.moduleId && normalizedStatus) {
      const isMastered = normalizedStatus === 'Mastered';
      const isNotMastered = normalizedStatus === 'Not Mastered';

      if (isMastered || isNotMastered) {
        const masteryDb = isMastered ? 'MASTERED' : 'NOT_MASTERED';

        await prisma.learnerProgress.upsert({
          where: {
            learnerId_moduleId: {
              learnerId: sub.learnerId,
              moduleId: sub.moduleId,
            },
          },
          update: {
            masteryStatus: masteryDb,
          },
          create: {
            learnerId: sub.learnerId,
            moduleId: sub.moduleId,
            masteryStatus: masteryDb,
          },
        }).catch((err) => console.warn('Could not update learner progress:', err));

        await syncLearnerModuleProgress(sub.learnerId, sub.moduleId);
      }
    }

    const scores = await getLearnerAssessmentScores(sub.learnerId, sub.moduleId);

    // Sync to AF2 records JSON file
    if (normalizedStatus) {
      syncAf2Record({
        learnerId: sub.learnerId,
        learnerName: sub.learner?.fullName || '',
        lrn: sub.learner?.lrn || '',
        level:
          sub.learner?.level === 'ELEMENTARY'
            ? 'A&E Elementary'
            : sub.learner?.level === 'JUNIOR' || String(sub.learner?.level || '').toUpperCase().includes('JUN')
            ? 'A&E Junior High'
            : 'A&E Elementary',
        learningCenterId: sub.learner?.learningCenterId || sub.module?.learningCenterId || null,
        teacherId: teacherId || sub.module?.teacherId || null,
        teacherName: teacherName || '',
        moduleId: sub.moduleId,
        moduleTitle: sub.module?.title || sub.title || 'Learning Module',
        strandName: sub.module?.learningArea?.name || '',
        preTestScore: scores.preTestScore,
        preTestTotal: scores.preTestTotal,
        postTestScore: scores.postTestScore,
        postTestTotal: scores.postTestTotal,
        assessment: normalizedStatus,
        moduleStatus: normalizedStatus,
        uploadedOutputs: allFiles.map((f) => f.fileName || f.fileUrl).join(', '),
        remarks: resolvedFeedback !== undefined ? String(resolvedFeedback).trim() : '',
        dateFinished: (reviewedAt || new Date().toISOString()).split('T')[0],
      });
    }

    const effectiveReviewTeacherId = teacherId || req.user?.profileId || sub.module?.teacherId || sub.learner?.assignedTeacherId;
    if (effectiveReviewTeacherId) {
      logTeacherActivity({
        teacherId: effectiveReviewTeacherId,
        type: 'SUBMISSION_REVIEWED',
        activityTypeLabel: 'Reviewed a Learner Submission',
        relatedEntity: `${sub.learner?.fullName || 'Learner'} — ${sub.module?.title || sub.title || 'Module'}`,
        description: `Reviewed submission from ${sub.learner?.fullName || 'Learner'} for "${sub.module?.title || sub.title || 'Learning Module'}" (${normalizedStatus || updated.status}).`,
        moduleId: sub.moduleId,
        learnerId: sub.learnerId,
        submissionId: updated.id,
        linkUrl: sub.moduleId ? `/dashboard/modules/${sub.moduleId}?tab=submissions` : '/dashboard/modules'
      });
    }

    res.json({
      ...formatSubmission(updated, allFiles, [updated.id]),
      ...scores,
    });
  } catch (err) {
    next(err);
  }
}

router.put('/:id', optionalAuth, handleSubmissionReview);
router.put('/:id/grade', optionalAuth, handleSubmissionReview);

export default router;

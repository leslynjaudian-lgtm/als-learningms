import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';
import { formatLearnerName } from './learners.js';
import { notifyLearnerRecordCreated } from '../services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const AF2_FILE = path.join(DATA_DIR, 'af2_records.json');

const router = Router();

// Helper to read AF2 records JSON safely
function readAf2Records() {
  try {
    if (!fs.existsSync(AF2_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(AF2_FILE, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading AF2 file in records route:', err);
    return [];
  }
}

// Helper to write AF2 records JSON safely
function writeAf2Records(records) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(AF2_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing AF2 file in records route:', err);
  }
}

/**
 * GET /api/records
 * Retrieve actual performance records for the authenticated teacher's assigned learners.
 * Supports filtering by learnerId, programLevel, and learningCenterId / learningCenter.
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    // 1. Identify teacher ID from auth token or query parameter fallback
    let teacherId = null;
    if (req.user && req.user.role === 'TEACHER') {
      teacherId = req.user.profileId;
    } else if (req.query.teacherId) {
      const parsed = parseInt(req.query.teacherId, 10);
      if (!isNaN(parsed)) teacherId = parsed;
    }

    // If teacherId could not be resolved from session or query, but learnerId was provided,
    // resolve teacherId directly from the learner's assigned teacher.
    if (!teacherId && req.query.learnerId) {
      const lid = parseInt(req.query.learnerId, 10);
      if (!isNaN(lid)) {
        const targetLearner = await prisma.learner.findUnique({
          where: { id: lid },
          select: { assignedTeacherId: true },
        });
        if (targetLearner?.assignedTeacherId) {
          teacherId = targetLearner.assignedTeacherId;
        }
      }
    }

    // If user is ADMIN, allow fetching across teachers or by learnerId
    const isAdmin = req.user && req.user.role === 'ADMIN';
    if (!teacherId && !isAdmin && !req.query.learnerId) {
      // If no teacher or learner can be resolved, return an empty array (do NOT leak other teachers' records)
      return res.json([]);
    }

    const {
      learnerId,
      programLevel,
      level,
      learningCenterId,
      learningCenter,
      search,
      fromDate,
      toDate,
      dateStarted,
      dateFinished,
    } = req.query;

    const targetLearnerId = learnerId ? parseInt(learnerId, 10) : null;

    // 2. Fetch learners assigned to this teacher or target learner
    let assignedLearners = [];
    if (teacherId) {
      assignedLearners = await prisma.learner.findMany({
        where: { assignedTeacherId: teacherId },
        include: {
          learningCenter: { select: { id: true, name: true } },
        },
      });
    } else if (isAdmin) {
      assignedLearners = await prisma.learner.findMany({
        include: {
          learningCenter: { select: { id: true, name: true } },
        },
      });
    }

    // Ensure the specifically requested learner is only included if assigned to this teacher (or if admin)
    if (targetLearnerId && !isNaN(targetLearnerId) && !assignedLearners.some((l) => l.id === targetLearnerId)) {
      const extraLearner = await prisma.learner.findUnique({
        where: { id: targetLearnerId },
        include: {
          learningCenter: { select: { id: true, name: true } },
        },
      });
      if (extraLearner) {
        const isAuthorizedForLearner =
          isAdmin ||
          (!teacherId && (!req.user || req.user.role !== 'TEACHER')) ||
          (teacherId && extraLearner.assignedTeacherId === teacherId);
        if (isAuthorizedForLearner) {
          assignedLearners.push(extraLearner);
        }
      }
    }

    if (!assignedLearners || assignedLearners.length === 0) {
      return res.json([]);
    }

    const assignedLearnerIds = assignedLearners.map((l) => l.id);
    if (targetLearnerId && !isNaN(targetLearnerId) && !assignedLearnerIds.includes(targetLearnerId)) {
      return res.json([]);
    }
    const assignedMap = new Map(assignedLearners.map((l) => [l.id, l]));

    // 3. Fetch any manually or submission-saved AF2 performance records for these assigned learners
    const af2Stored = readAf2Records();
    const af2List = af2Stored.filter((r) => {
      const lid = Number(r.learnerId);
      const tid = Number(r.teacherId);
      return assignedLearnerIds.includes(lid) || (tid && tid === teacherId);
    });

    // 4. Preload module info for any saved records with a moduleId
    const savedModuleIds = [...new Set(af2List.map((r) => Number(r.moduleId)).filter((id) => id && !isNaN(id)))];
    let loadedModulesMap = new Map();
    if (savedModuleIds.length > 0) {
      try {
        const loadedModules = await prisma.module.findMany({
          where: { id: { in: savedModuleIds } },
          include: { learningArea: true },
        });
        loadedModulesMap = new Map(loadedModules.map((m) => [m.id, m]));
      } catch (modErr) {
        console.warn('Could not preload modules for saved records:', modErr);
      }
    }

    // 5. Build records list STRICTLY from authoritative saved performance records
    // Do not synthesize or auto-generate records from unrecorded progress or enrollment
    const records = [];
    const seenRecordKeys = new Set();

    for (const af of af2List) {
      const lid = Number(af.learnerId);
      const recId = String(af.id || '');
      const modKeyId = af.moduleId ? `${lid}_${af.moduleId}` : null;
      const modKeyTitle = af.moduleTitle ? `${lid}_${String(af.moduleTitle).trim().toLowerCase()}` : null;
      const uniqueDedupeKey = recId || modKeyId || modKeyTitle;

      if (uniqueDedupeKey && seenRecordKeys.has(uniqueDedupeKey)) {
        continue;
      }
      if (uniqueDedupeKey) {
        seenRecordKeys.add(uniqueDedupeKey);
      }

      const learner = assignedMap.get(lid);
      if (!learner && !assignedLearnerIds.includes(lid)) continue;

      let displayLevel = af.level;
      if (!displayLevel && learner) {
        displayLevel = learner.level === 'ELEMENTARY' ? 'A&E Elementary' : 'A&E Junior High';
      }
      if (displayLevel === 'JUNIOR') displayLevel = 'A&E Junior High';
      else if (displayLevel === 'ELEMENTARY') displayLevel = 'A&E Elementary';

      const centerName = af.learningCenter || af.centerName || learner?.learningCenter?.name || '';
      const cid = af.learningCenterId || learner?.learningCenterId || null;

      const matchedMod = af.moduleId ? loadedModulesMap.get(Number(af.moduleId)) : null;
      const finalTitle = af.moduleTitle || matchedMod?.title || 'Learning Module';
      const finalStrand = af.strandName || matchedMod?.learningArea?.name || '';

      const finalStatus =
        af.assessment === 'Mastered' || af.assessment === 'Not Mastered'
          ? af.assessment
          : af.moduleStatus === 'Mastered' || af.moduleStatus === 'Not Mastered'
            ? af.moduleStatus
            : 'Mastered';

      records.push({
        id: af.id || `rec_${Date.now()}`,
        source: 'af2',
        teacherId: af.teacherId || learner?.assignedTeacherId || teacherId,
        teacherName: learner?.assignedTeacher?.fullName || 'ALS Teacher',
        learnerId: lid || learner?.id,
        learnerName: af.learnerName || (learner ? formatLearnerName(learner) : ''),
        lrn: af.lrn || learner?.lrn || '',
        level: displayLevel || 'A&E Elementary',
        learningCenterId: cid,
        learningCenter: centerName,
        centerName: centerName,
        moduleId: af.moduleId || null,
        moduleTitle: finalTitle,
        strandName: finalStrand,
        preTestScore: af.preTestScore != null && af.preTestScore !== '' ? Number(af.preTestScore) : null,
        preTestTotal: af.preTestTotal != null && af.preTestTotal !== '' ? Number(af.preTestTotal) : null,
        postTestScore: af.postTestScore != null && af.postTestScore !== '' ? Number(af.postTestScore) : null,
        postTestTotal: af.postTestTotal != null && af.postTestTotal !== '' ? Number(af.postTestTotal) : null,
        assessment: finalStatus,
        moduleStatus: finalStatus,
        dateStarted: af.dateStarted || '',
        dateFinished: af.dateFinished || af.dateCompleted || '',
        dateCompleted: af.dateFinished || af.dateCompleted || '',
        otherActivities: af.otherActivities ? String(af.otherActivities).trim() : '',
        uploadedOutputs: af.uploadedOutputs || '',
        selfAssessment: af.selfAssessment ? String(af.selfAssessment).trim() : '',
        remarks: af.remarks ? String(af.remarks).trim() : '',
        createdAt: af.createdAt || '',
        updatedAt: af.updatedAt || '',
      });
    }

    // 6. Apply Filter Combinations (AND logic)
    let filtered = records;

    // Filter 1: Learner Name / ID
    if (learnerId) {
      const lidNum = parseInt(learnerId, 10);
      if (!isNaN(lidNum)) {
        filtered = filtered.filter((r) => Number(r.learnerId) === lidNum);
      }
    }

    // Filter 2: ALS Level
    const targetLevel = programLevel || level;
    if (targetLevel) {
      const normQuery = targetLevel.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        // If learnerId is specified, the learner's records already strictly belong to them
        if (targetLearnerId) return true;
        const rLvl = (r.level || '').toLowerCase();
        if (!rLvl) return true;
        if (normQuery.includes('elem')) {
          return rLvl.includes('elem');
        }
        if (normQuery.includes('junior') || normQuery.includes('jhs')) {
          return rLvl.includes('junior') || rLvl.includes('jhs');
        }
        return rLvl === normQuery;
      });
    }

    // Filter 3: Learning Center
    if (learningCenterId) {
      const cidNum = parseInt(learningCenterId, 10);
      if (!isNaN(cidNum)) {
        filtered = filtered.filter((r) => {
          if (targetLearnerId) return true;
          return Number(r.learningCenterId) === cidNum;
        });
      }
    } else if (learningCenter) {
      const normCenter = learningCenter.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        if (targetLearnerId) return true;
        const rc = (r.learningCenter || r.centerName || '').trim().toLowerCase();
        return !rc || rc === normCenter || rc.includes(normCenter) || normCenter.includes(rc);
      });
    }

    // Filter 4: Text Search
    if (search) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.learnerName && r.learnerName.toLowerCase().includes(q)) ||
          (r.lrn && r.lrn.toLowerCase().includes(q)) ||
          (r.moduleTitle && r.moduleTitle.toLowerCase().includes(q))
      );
    }

    // Filter 5: Date Range (Inclusive reporting period)
    const startRange = (fromDate || dateStarted || '').trim().split('T')[0];
    const endRange = (toDate || dateFinished || '').trim().split('T')[0];

    if (startRange || endRange) {
      filtered = filtered.filter((r) => {
        const finishDate = (r.dateFinished || r.dateCompleted || '').trim().split('T')[0];
        const startDate = (r.dateStarted || '').trim().split('T')[0];

        // If neither date is present, do not silently exclude manually saved records
        if (!finishDate && !startDate) return true;

        const matchesFinish = finishDate && (!startRange || finishDate >= startRange) && (!endRange || finishDate <= endRange);
        const matchesStart = startDate && (!startRange || startDate >= startRange) && (!endRange || startDate <= endRange);

        return matchesFinish || matchesStart;
      });
    }

    res.json(filtered);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/records/context
 * Retrieve authoritative learner, module, submission, date, and assessment score context
 * for pre-populating the Add/Edit Learner Record modal.
 */
router.get('/context', optionalAuth, async (req, res, next) => {
  try {
    const teacherId = req.user?.role === 'TEACHER' ? req.user.profileId : null;
    const learnerId = req.query.learnerId ? parseInt(String(req.query.learnerId), 10) : null;
    let moduleId = req.query.moduleId ? parseInt(String(req.query.moduleId), 10) : null;
    const submissionId = req.query.submissionId ? parseInt(String(req.query.submissionId), 10) : null;

    if (!learnerId || isNaN(learnerId)) {
      return res.status(400).json({ error: 'learnerId is required' });
    }

    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      include: { learningCenter: true },
    });

    if (!learner) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    if (teacherId && learner.assignedTeacherId !== teacherId) {
      return res.status(403).json({ error: 'Learner is not assigned to you' });
    }

    if ((!moduleId || isNaN(moduleId)) && submissionId && !isNaN(submissionId)) {
      const sub = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: { moduleId: true },
      });
      if (sub?.moduleId) moduleId = sub.moduleId;
    }

    // If moduleId is still not specified, pick the learner's latest submission or progress or assigned module
    if (!moduleId || isNaN(moduleId)) {
      const latestSub = await prisma.submission.findFirst({
        where: { learnerId },
        orderBy: { submittedAt: 'desc' },
        select: { moduleId: true },
      });
      if (latestSub?.moduleId) {
        moduleId = latestSub.moduleId;
      } else {
        const latestProg = await prisma.learnerProgress.findFirst({
          where: { learnerId },
          orderBy: { createdAt: 'desc' },
          select: { moduleId: true },
        });
        if (latestProg?.moduleId) {
          moduleId = latestProg.moduleId;
        } else {
          const latestAssign = await prisma.moduleAssignment.findFirst({
            where: { learnerId },
            orderBy: { assignedAt: 'desc' },
            select: { moduleId: true },
          });
          if (latestAssign?.moduleId) {
            moduleId = latestAssign.moduleId;
          }
        }
      }
    }

    const formattedName = formatLearnerName(learner);
    const levelDisplay = learner.level === 'JUNIOR' ? 'A&E Junior High' : 'A&E Elementary';
    const centerName = learner.learningCenter?.name || '';

    if (!moduleId || isNaN(moduleId)) {
      return res.json({
        existingRecordId: null,
        isEvaluated: false,
        learnerId: learner.id,
        learnerName: formattedName,
        lrn: learner.lrn || '',
        level: levelDisplay,
        learningCenterId: learner.learningCenterId || null,
        learningCenter: centerName,
        moduleId: null,
        moduleTitle: '',
        strandName: '',
        dateStarted: '',
        dateFinished: '',
        preTestScore: null,
        preTestTotal: null,
        postTestScore: null,
        postTestTotal: null,
        uploadedOutputs: '',
        otherActivities: '',
        assessment: '',
        remarks: '',
      });
    }

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        learningArea: true,
        assessments: {
          include: {
            _count: { select: { questions: true } },
            attempts: {
              where: { learnerId, status: 'SUBMITTED' },
              orderBy: { completedAt: 'desc' },
              take: 1,
            },
          },
        },
        submissions: {
          where: { learnerId },
          orderBy: { submittedAt: 'desc' },
        },
        learnerProgress: {
          where: { learnerId },
          take: 1,
        },
      },
    });

    if (!mod) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const prog = mod.learnerProgress?.[0] || null;
    const learnerSubs = mod.submissions || [];
    const latestSub = learnerSubs[0] || null;

    const af2Records = readAf2Records();
    const matchedAf = af2Records.find(
      (r) =>
        Number(r.learnerId) === learner.id &&
        ((submissionId && Number(r.submissionId) === submissionId) ||
          Number(r.moduleId) === mod.id ||
          (r.moduleTitle && mod.title && r.moduleTitle.trim().toLowerCase() === mod.title.trim().toLowerCase()))
    );

    // Also check database submission record status in Prisma
    const dbRecordedSub = await prisma.submission.findFirst({
      where: {
        learnerId: learner.id,
        ...(submissionId ? { id: submissionId } : { moduleId: mod.id }),
        status: 'Recorded',
      },
      select: { id: true, status: true, feedback: true },
    });

    const isAlreadyRecorded = Boolean(matchedAf) || Boolean(dbRecordedSub);

    const preAss = (mod.assessments || []).find((a) => a.type === 'PRE_TEST');
    const postAss = (mod.assessments || []).find((a) => a.type === 'POST_TEST');
    const preAttempt = preAss?.attempts?.[0] || null;
    const postAttempt = postAss?.attempts?.[0] || null;

    const preTotal = preAss?._count?.questions || preAttempt?.maxScore || matchedAf?.preTestTotal || null;
    const postTotal = postAss?._count?.questions || postAttempt?.maxScore || matchedAf?.postTestTotal || null;

    const preScoreVal =
      preAttempt?.score != null
        ? preAttempt.score
        : prog?.preTestScore != null
          ? prog.preTestScore
          : matchedAf?.preTestScore != null
            ? matchedAf.preTestScore
            : null;

    const postScoreVal =
      postAttempt?.score != null
        ? postAttempt.score
        : prog?.postTestScore != null
          ? prog.postTestScore
          : matchedAf?.postTestScore != null
            ? matchedAf.postTestScore
            : null;

    const storedDateStarted =
      matchedAf?.dateStarted ||
      (mod.dateStarted
        ? mod.dateStarted.toISOString().split('T')[0]
        : prog?.createdAt
          ? prog.createdAt.toISOString().split('T')[0]
          : '');

    const storedDateFinished =
      matchedAf?.dateFinished ||
      matchedAf?.dateCompleted ||
      (mod.dateEnded
        ? mod.dateEnded.toISOString().split('T')[0]
        : latestSub?.submittedAt
          ? latestSub.submittedAt.toISOString().split('T')[0]
          : prog?.completedAt
            ? prog.completedAt.toISOString().split('T')[0]
            : '');

    const uploadedFileNames = learnerSubs
      .map((s) => s.fileName || s.fileUrl)
      .filter(Boolean)
      .join(', ');

    const storedOtherActivities =
      matchedAf?.otherActivities !== undefined && matchedAf?.otherActivities !== ''
        ? String(matchedAf.otherActivities).trim()
        : mod.activitiesRelated
          ? String(mod.activitiesRelated).replace(/\\n/g, '\n').trim()
          : '';

    const afEvaluated =
      matchedAf?.assessment === 'Mastered' ||
      matchedAf?.assessment === 'Not Mastered' ||
      matchedAf?.moduleStatus === 'Mastered' ||
      matchedAf?.moduleStatus === 'Not Mastered';

    const storedAssessment = afEvaluated
      ? matchedAf.assessment === 'Mastered' || matchedAf.moduleStatus === 'Mastered'
        ? 'Mastered'
        : 'Not Mastered'
      : '';

    const storedRemarks = matchedAf?.remarks
      ? String(matchedAf.remarks).trim()
      : '';

    res.json({
      existingRecordId: matchedAf?.id || (prog ? `prog_${prog.id}` : null),
      isRecorded: isAlreadyRecorded,
      isEvaluated: Boolean(afEvaluated || isAlreadyRecorded),
      learnerId: learner.id,
      learnerName: formattedName,
      lrn: learner.lrn || '',
      level: levelDisplay,
      learningCenterId: learner.learningCenterId || null,
      learningCenter: centerName,
      moduleId: mod.id,
      moduleTitle: mod.title,
      strandName: mod.learningArea?.name || matchedAf?.strandName || '',
      dateStarted: storedDateStarted,
      dateFinished: storedDateFinished,
      preTestScore: preScoreVal,
      preTestTotal: preTotal,
      postTestScore: postScoreVal,
      postTestTotal: postTotal,
      uploadedOutputs: uploadedFileNames || matchedAf?.uploadedOutputs || '',
      otherActivities: storedOtherActivities,
      assessment: storedAssessment,
      remarks: storedRemarks,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/records
 * Create or update a learner performance record for the authenticated teacher
 */
router.post('/', authenticate, requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const teacherId = req.user.role === 'TEACHER' ? req.user.profileId : parseInt(req.body.teacherId || '0', 10);
    const {
      mode,
      submissionId,
      learnerId,
      learnerName,
      lrn,
      level,
      centerName,
      learningCenter,
      learningCenterId,
      moduleId,
      moduleTitle,
      strandName,
      dateStarted,
      dateFinished,
      preTestScore,
      preTestTotal,
      postTestScore,
      postTestTotal,
      otherActivities,
      assessment,
      moduleStatus,
      remarks,
    } = req.body;

    const isSubmissionMode = mode === 'submission' || Boolean(submissionId);

    if (!learnerId) {
      return res.status(400).json({ error: 'learnerId is required' });
    }

    const rawAssessment = (assessment || moduleStatus || '').trim();
    if (rawAssessment !== 'Mastered' && rawAssessment !== 'Not Mastered') {
      return res.status(400).json({ error: "ALS Teacher's Assessment (Mastered or Not Mastered) is required" });
    }

    // Verify learner is assigned to this teacher
    const parsedLearnerId = parseInt(learnerId, 10);
    const learner = await prisma.learner.findUnique({
      where: { id: parsedLearnerId },
      include: { learningCenter: true },
    });

    if (!learner) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    if (req.user.role === 'TEACHER' && learner.assignedTeacherId !== teacherId) {
      return res.status(403).json({ error: 'Learner is not assigned to you' });
    }

    const authoritativeLearnerName = formatLearnerName(learner);
    const authoritativeLrn = learner.lrn || '';
    const authoritativeLevel = learner.level === 'ELEMENTARY' ? 'A&E Elementary' : 'A&E Junior High';
    const authoritativeCenterName = learner.learningCenter?.name || centerName || learningCenter || '';
    const authoritativeCenterId = learner.learningCenterId || learningCenterId || null;

    let parsedModuleId = moduleId != null && moduleId !== '' ? parseInt(String(moduleId), 10) : null;
    const parsedSubmissionId = submissionId != null && submissionId !== '' ? parseInt(String(submissionId), 10) : null;

    if ((!parsedModuleId || isNaN(parsedModuleId)) && parsedSubmissionId && !isNaN(parsedSubmissionId)) {
      const subRecord = await prisma.submission.findUnique({
        where: { id: parsedSubmissionId },
        select: { moduleId: true },
      });
      if (subRecord?.moduleId) {
        parsedModuleId = subRecord.moduleId;
      }
    }

    let matchedModule = null;
    if (parsedModuleId && !isNaN(parsedModuleId)) {
      matchedModule = await prisma.module.findUnique({
        where: { id: parsedModuleId },
        include: {
          learningArea: true,
          assessments: {
            include: {
              _count: { select: { questions: true } },
              attempts: {
                where: { learnerId: parsedLearnerId, status: 'SUBMITTED' },
                orderBy: { completedAt: 'desc' },
                take: 1,
              },
            },
          },
          submissions: {
            where: { learnerId: parsedLearnerId },
            orderBy: { submittedAt: 'desc' },
          },
          learnerProgress: {
            where: { learnerId: parsedLearnerId },
            take: 1,
          },
        },
      });
    } else if (moduleTitle && moduleTitle.trim()) {
      const candidateModules = await prisma.module.findMany({
        where: {
          ...(teacherId ? { teacherId } : {}),
        },
        include: {
          learningArea: true,
          assessments: {
            include: {
              _count: { select: { questions: true } },
              attempts: {
                where: { learnerId: parsedLearnerId, status: 'SUBMITTED' },
                orderBy: { completedAt: 'desc' },
                take: 1,
              },
            },
          },
          submissions: {
            where: { learnerId: parsedLearnerId },
            orderBy: { submittedAt: 'desc' },
          },
          learnerProgress: {
            where: { learnerId: parsedLearnerId },
            take: 1,
          },
        },
      });
      matchedModule =
        candidateModules.find(
          (m) => m.title && m.title.trim().toLowerCase() === moduleTitle.trim().toLowerCase()
        ) || null;
    }

    const resolvedModuleId = matchedModule ? matchedModule.id : parsedModuleId;
    const af2Records = readAf2Records();

    let finalModuleTitle = moduleTitle ? String(moduleTitle).trim() : '';
    let finalStrandName = strandName ? String(strandName).trim() : '';
    let finalDateStarted = dateStarted || '';
    let finalDateFinished = dateFinished || '';
    let finalPreScore = preTestScore != null && preTestScore !== '' ? Number(preTestScore) : null;
    let finalPreTotal = preTestTotal != null && preTestTotal !== '' ? Number(preTestTotal) : null;
    let finalPostScore = postTestScore != null && postTestScore !== '' ? Number(postTestScore) : null;
    let finalPostTotal = postTestTotal != null && postTestTotal !== '' ? Number(postTestTotal) : null;

    if (isSubmissionMode) {
      if (!matchedModule) {
        return res.status(400).json({ error: 'Valid module submission context is required for submission mode' });
      }
      const prog = matchedModule.learnerProgress?.[0] || null;
      const latestSub = matchedModule.submissions?.[0] || null;
      const existingAf = af2Records.find(
        (r) =>
          Number(r.learnerId) === parsedLearnerId &&
          (Number(r.moduleId) === matchedModule.id ||
            (r.moduleTitle &&
              matchedModule.title &&
              r.moduleTitle.trim().toLowerCase() === matchedModule.title.trim().toLowerCase()))
      );

      const preAss = (matchedModule.assessments || []).find((a) => a.type === 'PRE_TEST');
      const postAss = (matchedModule.assessments || []).find((a) => a.type === 'POST_TEST');
      const preAttempt = preAss?.attempts?.[0] || null;
      const postAttempt = postAss?.attempts?.[0] || null;

      // Enforce authoritative submission-derived fields from the database
      finalModuleTitle = matchedModule.title;
      finalStrandName = matchedModule.learningArea?.name || existingAf?.strandName || '';
      finalDateStarted =
        existingAf?.dateStarted ||
        (matchedModule.dateStarted
          ? matchedModule.dateStarted.toISOString().split('T')[0]
          : prog?.createdAt
            ? prog.createdAt.toISOString().split('T')[0]
            : '');
      finalDateFinished =
        existingAf?.dateFinished ||
        existingAf?.dateCompleted ||
        (matchedModule.dateEnded
          ? matchedModule.dateEnded.toISOString().split('T')[0]
          : latestSub?.submittedAt
            ? latestSub.submittedAt.toISOString().split('T')[0]
            : prog?.completedAt
              ? prog.completedAt.toISOString().split('T')[0]
              : '');

      finalPreTotal = preAss?._count?.questions || preAttempt?.maxScore || existingAf?.preTestTotal || null;
      finalPostTotal = postAss?._count?.questions || postAttempt?.maxScore || existingAf?.postTestTotal || null;
      finalPreScore =
        preAttempt?.score != null
          ? preAttempt.score
          : prog?.preTestScore != null
            ? prog.preTestScore
            : existingAf?.preTestScore != null
              ? Number(existingAf.preTestScore)
              : null;
      finalPostScore =
        postAttempt?.score != null
          ? postAttempt.score
          : prog?.postTestScore != null
            ? prog.postTestScore
            : existingAf?.postTestScore != null
              ? Number(existingAf.postTestScore)
              : null;
    } else {
      // Manual mode validation
      if (!finalModuleTitle) {
        return res.status(400).json({ error: 'moduleTitle is required' });
      }
      if (!finalStrandName) {
        finalStrandName = matchedModule?.learningArea?.name || '';
      }
      if (!finalStrandName) {
        return res.status(400).json({ error: 'Learning Strand is required' });
      }
      if (!finalDateStarted) {
        return res.status(400).json({ error: 'Date Started is required' });
      }
      if (!finalDateFinished) {
        return res.status(400).json({ error: 'Date Finished is required' });
      }
      if (new Date(finalDateFinished) < new Date(finalDateStarted)) {
        return res.status(400).json({ error: 'Date Finished cannot be earlier than Date Started' });
      }

      if (finalPreScore !== null || finalPreTotal !== null) {
        if (
          finalPreScore === null ||
          finalPreTotal === null ||
          isNaN(finalPreScore) ||
          isNaN(finalPreTotal) ||
          finalPreScore < 0 ||
          finalPreTotal < 1 ||
          finalPreScore > finalPreTotal
        ) {
          return res.status(400).json({ error: 'Invalid Pre-Test score or total items' });
        }
      }
      if (finalPostScore !== null || finalPostTotal !== null) {
        if (
          finalPostScore === null ||
          finalPostTotal === null ||
          isNaN(finalPostScore) ||
          isNaN(finalPostTotal) ||
          finalPostScore < 0 ||
          finalPostTotal < 1 ||
          finalPostScore > finalPostTotal
        ) {
          return res.status(400).json({ error: 'Invalid Post-Test score or total items' });
        }
      }
    }

    const finalAssessment = rawAssessment;
    const trimmedRemarks = remarks ? String(remarks).trim() : '';
    const trimmedActivities = otherActivities ? String(otherActivities).trim() : '';

    // 1. Upsert in AF2 records JSON (prevent duplicate records for the same learner and module/submission)
    const existingAfIdx = af2Records.findIndex(
      (r) =>
        Number(r.learnerId) === parsedLearnerId &&
        ((parsedSubmissionId && Number(r.submissionId) === parsedSubmissionId) ||
          (resolvedModuleId && Number(r.moduleId) === resolvedModuleId) ||
          (r.moduleTitle && r.moduleTitle.trim().toLowerCase() === finalModuleTitle.toLowerCase()))
    );

    // 1. Duplicate prevention for submission recording:
    // If this submission has already been added to Records, prevent creating duplicate records or overwriting
    if (isSubmissionMode) {
      let isAlreadyRecorded = false;
      let existingRecord = null;

      if (existingAfIdx !== -1) {
        isAlreadyRecorded = true;
        existingRecord = af2Records[existingAfIdx];
      }

      if (!isAlreadyRecorded) {
        if (parsedSubmissionId) {
          const dbSub = await prisma.submission.findUnique({
            where: { id: parsedSubmissionId },
            select: { id: true, status: true },
          });
          if (dbSub?.status === 'Recorded') {
            isAlreadyRecorded = true;
          }
        }

        if (!isAlreadyRecorded && resolvedModuleId && parsedLearnerId) {
          const dbSub = await prisma.submission.findFirst({
            where: {
              learnerId: parsedLearnerId,
              moduleId: resolvedModuleId,
              status: 'Recorded',
            },
            select: { id: true, status: true },
          });
          if (dbSub) {
            isAlreadyRecorded = true;
          }
        }
      }

      if (isAlreadyRecorded) {
        return res.status(409).json({
          error: "This learner's activity has already been added to Records.",
          alreadyRecorded: true,
          record: existingRecord || null,
        });
      }
    }

    let savedAf2 = null;
    if (existingAfIdx !== -1) {
      const existing = af2Records[existingAfIdx];
      savedAf2 = {
        ...existing,
        mode: isSubmissionMode ? 'submission' : 'manual',
        submissionId: parsedSubmissionId || existing.submissionId || null,
        teacherId: teacherId || existing.teacherId,
        learnerId: parsedLearnerId,
        learnerName: authoritativeLearnerName,
        lrn: authoritativeLrn,
        level: authoritativeLevel,
        learningCenterId: authoritativeCenterId,
        learningCenter: authoritativeCenterName,
        centerName: authoritativeCenterName,
        moduleId: resolvedModuleId || existing.moduleId || null,
        moduleTitle: finalModuleTitle,
        strandName: finalStrandName || existing.strandName || '',
        dateStarted: finalDateStarted !== '' ? finalDateStarted : existing.dateStarted || '',
        dateFinished: finalDateFinished !== '' ? finalDateFinished : existing.dateFinished || '',
        dateCompleted: finalDateFinished !== '' ? finalDateFinished : existing.dateCompleted || '',
        preTestScore: finalPreScore !== null ? finalPreScore : existing.preTestScore ?? null,
        preTestTotal: finalPreTotal !== null ? finalPreTotal : existing.preTestTotal ?? null,
        postTestScore: finalPostScore !== null ? finalPostScore : existing.postTestScore ?? null,
        postTestTotal: finalPostTotal !== null ? finalPostTotal : existing.postTestTotal ?? null,
        otherActivities: trimmedActivities,
        selfAssessment: '',
        assessment: finalAssessment,
        moduleStatus: finalAssessment,
        remarks: trimmedRemarks,
        updatedAt: new Date().toISOString(),
      };
      af2Records[existingAfIdx] = savedAf2;
    } else {
      const newRecordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      savedAf2 = {
        id: newRecordId,
        mode: isSubmissionMode ? 'submission' : 'manual',
        submissionId: parsedSubmissionId || null,
        teacherId,
        learnerId: parsedLearnerId,
        learnerName: authoritativeLearnerName,
        lrn: authoritativeLrn,
        level: authoritativeLevel,
        learningCenterId: authoritativeCenterId,
        learningCenter: authoritativeCenterName,
        centerName: authoritativeCenterName,
        moduleId: resolvedModuleId || null,
        moduleTitle: finalModuleTitle,
        strandName: finalStrandName,
        dateStarted: finalDateStarted,
        dateFinished: finalDateFinished,
        dateCompleted: finalDateFinished,
        preTestScore: finalPreScore,
        preTestTotal: finalPreTotal,
        postTestScore: finalPostScore,
        postTestTotal: finalPostTotal,
        otherActivities: trimmedActivities,
        selfAssessment: '',
        assessment: finalAssessment,
        moduleStatus: finalAssessment,
        remarks: trimmedRemarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      af2Records.unshift(savedAf2);
    }

    writeAf2Records(af2Records);

    // 2. Sync to database LearnerProgress and Submission if matching module exists
    if (resolvedModuleId) {
      try {
        await prisma.learnerProgress.upsert({
          where: {
            learnerId_moduleId: {
              learnerId: parsedLearnerId,
              moduleId: resolvedModuleId,
            },
          },
          create: {
            learnerId: parsedLearnerId,
            moduleId: resolvedModuleId,
            preTestScore: finalPreScore,
            postTestScore: finalPostScore,
            status: finalAssessment === 'Mastered' ? 'COMPLETED' : 'IN_PROGRESS',
            masteryStatus: finalAssessment === 'Mastered' ? 'MASTERED' : 'NOT_MASTERED',
            completedAt: finalDateFinished ? new Date(finalDateFinished) : null,
          },
          update: {
            ...(finalPreScore !== null ? { preTestScore: finalPreScore } : {}),
            ...(finalPostScore !== null ? { postTestScore: finalPostScore } : {}),
            status: finalAssessment === 'Mastered' ? 'COMPLETED' : 'IN_PROGRESS',
            masteryStatus: finalAssessment === 'Mastered' ? 'MASTERED' : 'NOT_MASTERED',
            ...(finalDateFinished ? { completedAt: new Date(finalDateFinished) } : {}),
          },
        });

        await prisma.submission.updateMany({
          where: {
            learnerId: parsedLearnerId,
            moduleId: resolvedModuleId,
          },
          data: {
            status: 'Recorded',
            feedback: trimmedRemarks,
          },
        });
      } catch (dbErr) {
        console.warn('Could not sync progress/submissions to database table:', dbErr);
      }
    }

    // 3. Notify Admin that Teacher added/updated a learner record
    if (req.user?.role === 'TEACHER' || teacherId) {
      notifyLearnerRecordCreated({
        teacherId,
        learnerId: parsedLearnerId,
        moduleTitle: finalModuleTitle,
        recordId: savedAf2.id,
      }).catch((e) => console.error('[Records] notifyLearnerRecordCreated error:', e));
    }

    res.status(201).json(savedAf2);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/records/:id
 * Update an existing performance record
 */
router.put('/:id', authenticate, requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const recordId = req.params.id;
    const teacherId = req.user.role === 'TEACHER' ? req.user.profileId : null;
    const updates = req.body;

    // Update in AF2 records JSON if matched directly by id
    const records = readAf2Records();
    const idx = records.findIndex((r) => String(r.id) === String(recordId));
    if (idx !== -1) {
      if (teacherId && records[idx].learnerId) {
        const targetLearner = await prisma.learner.findUnique({
          where: { id: Number(records[idx].learnerId) },
          select: { assignedTeacherId: true },
        });
        if (targetLearner && targetLearner.assignedTeacherId !== teacherId) {
          return res.status(403).json({ error: 'Learner is not assigned to you' });
        }
      }

      const finalAssessment = updates.assessment || updates.moduleStatus || records[idx].assessment || 'Mastered';
      records[idx] = {
        ...records[idx],
        ...updates,
        assessment: finalAssessment,
        moduleStatus: finalAssessment,
        selfAssessment: '',
        updatedAt: new Date().toISOString(),
      };
      writeAf2Records(records);

      // Also sync to LearnerProgress and Submission if moduleId is present
      const rec = records[idx];
      if (rec.learnerId && rec.moduleId) {
        try {
          await prisma.learnerProgress.upsert({
            where: {
              learnerId_moduleId: {
                learnerId: Number(rec.learnerId),
                moduleId: Number(rec.moduleId),
              },
            },
            create: {
              learnerId: Number(rec.learnerId),
              moduleId: Number(rec.moduleId),
              preTestScore: rec.preTestScore != null && rec.preTestScore !== '' ? Number(rec.preTestScore) : null,
              postTestScore: rec.postTestScore != null && rec.postTestScore !== '' ? Number(rec.postTestScore) : null,
              masteryStatus: finalAssessment === 'Mastered' ? 'MASTERED' : 'NOT_MASTERED',
              status: finalAssessment === 'Mastered' ? 'COMPLETED' : 'IN_PROGRESS',
              completedAt: rec.dateFinished ? new Date(rec.dateFinished) : null,
            },
            update: {
              ...(rec.preTestScore != null && rec.preTestScore !== '' ? { preTestScore: Number(rec.preTestScore) } : {}),
              ...(rec.postTestScore != null && rec.postTestScore !== '' ? { postTestScore: Number(rec.postTestScore) } : {}),
              masteryStatus: finalAssessment === 'Mastered' ? 'MASTERED' : 'NOT_MASTERED',
              status: finalAssessment === 'Mastered' ? 'COMPLETED' : 'IN_PROGRESS',
              ...(rec.dateFinished ? { completedAt: new Date(rec.dateFinished) } : {}),
            },
          });

          await prisma.submission.updateMany({
            where: {
              learnerId: Number(rec.learnerId),
              moduleId: Number(rec.moduleId),
            },
            data: {
              status: finalAssessment,
              feedback: rec.remarks ? String(rec.remarks).trim() : '',
            },
          });
        } catch {
          // Ignore if no matching progress row
        }
      }

      if (req.user?.role === 'TEACHER' || teacherId) {
        notifyLearnerRecordCreated({
          teacherId,
          learnerId: records[idx].learnerId,
          moduleTitle: records[idx].moduleTitle,
          recordId: records[idx].id,
        }).catch((e) => console.error('[Records] notifyLearnerRecordCreated error:', e));
      }

      return res.json(records[idx]);
    }

    // If it's a progress_ record from database
    if (String(recordId).startsWith('prog_')) {
      const pId = parseInt(recordId.replace('prog_', ''), 10);
      if (!isNaN(pId)) {
        const existingProgress = await prisma.learnerProgress.findUnique({
          where: { id: pId },
          include: {
            learner: { include: { learningCenter: true } },
            module: { include: { learningArea: true } },
          },
        });

        if (!existingProgress) {
          return res.status(404).json({ error: 'Record not found' });
        }

        if (teacherId && existingProgress.learner?.assignedTeacherId !== teacherId) {
          return res.status(403).json({ error: 'Learner is not assigned to you' });
        }

        const updateData = {};
        if (updates.preTestScore !== undefined && updates.preTestScore !== null && updates.preTestScore !== '') {
          updateData.preTestScore = Number(updates.preTestScore);
        }
        if (updates.postTestScore !== undefined && updates.postTestScore !== null && updates.postTestScore !== '') {
          updateData.postTestScore = Number(updates.postTestScore);
        }
        if (updates.assessment) {
          updateData.masteryStatus = updates.assessment === 'Mastered' ? 'MASTERED' : 'NOT_MASTERED';
          updateData.status = updates.assessment === 'Mastered' ? 'COMPLETED' : 'IN_PROGRESS';
        }
        if (updates.dateFinished) {
          updateData.completedAt = new Date(updates.dateFinished);
        }

        const updatedProgress = await prisma.learnerProgress.update({
          where: { id: pId },
          data: updateData,
        });

        const finalAssessment =
          updates.assessment ||
          updates.moduleStatus ||
          (updatedProgress.masteryStatus === 'MASTERED' ? 'Mastered' : 'Not Mastered');

        // Also sync submission status & feedback for this learner and module
        try {
          await prisma.submission.updateMany({
            where: {
              learnerId: existingProgress.learnerId,
              moduleId: existingProgress.moduleId,
            },
            data: {
              status: finalAssessment,
              feedback: updates.remarks !== undefined ? String(updates.remarks || '').trim() : undefined,
            },
          });
        } catch {
          // Ignore submission update error
        }

        // Also sync/upsert in af2_records.json so remarks, otherActivities, dateStarted, dateFinished, preTestTotal, postTestTotal persist
        const afIdx = records.findIndex(
          (r) =>
            Number(r.learnerId) === existingProgress.learnerId &&
            (Number(r.moduleId) === existingProgress.moduleId ||
              (r.moduleTitle &&
                existingProgress.module?.title &&
                r.moduleTitle.trim().toLowerCase() === existingProgress.module.title.trim().toLowerCase()))
        );

        if (afIdx !== -1) {
          records[afIdx] = {
            ...records[afIdx],
            ...updates,
            moduleId: existingProgress.moduleId,
            assessment: finalAssessment,
            moduleStatus: finalAssessment,
            selfAssessment: '',
            updatedAt: new Date().toISOString(),
          };
        } else {
          const lrnObj = existingProgress.learner;
          const modObj = existingProgress.module;
          records.unshift({
            id: `af2_prog_${pId}`,
            teacherId: teacherId || lrnObj?.assignedTeacherId || null,
            learnerId: existingProgress.learnerId,
            learnerName: lrnObj ? formatLearnerName(lrnObj) : '',
            lrn: lrnObj?.lrn || '',
            level: lrnObj?.level === 'JUNIOR' ? 'A&E Junior High' : 'A&E Elementary',
            learningCenterId: lrnObj?.learningCenterId || null,
            learningCenter: lrnObj?.learningCenter?.name || '',
            centerName: lrnObj?.learningCenter?.name || '',
            moduleId: existingProgress.moduleId,
            moduleTitle: modObj?.title || 'Learning Module',
            strandName: updates.strandName || modObj?.learningArea?.name || '',
            dateStarted: updates.dateStarted || '',
            dateFinished: updates.dateFinished || '',
            dateCompleted: updates.dateFinished || updates.dateCompleted || '',
            preTestScore: updatedProgress.preTestScore,
            preTestTotal: updates.preTestTotal != null && updates.preTestTotal !== '' ? Number(updates.preTestTotal) : null,
            postTestScore: updatedProgress.postTestScore,
            postTestTotal: updates.postTestTotal != null && updates.postTestTotal !== '' ? Number(updates.postTestTotal) : null,
            otherActivities: updates.otherActivities || '',
            selfAssessment: '',
            assessment: finalAssessment,
            moduleStatus: finalAssessment,
            remarks: updates.remarks || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        writeAf2Records(records);

        if (req.user?.role === 'TEACHER' || teacherId) {
          notifyLearnerRecordCreated({
            teacherId,
            learnerId: existingProgress.learnerId,
            moduleTitle: existingProgress.module?.title || 'Learning Module',
            recordId: recordId,
          }).catch((e) => console.error('[Records] notifyLearnerRecordCreated error:', e));
        }

        return res.json({ id: recordId, ...updatedProgress, ...updates });
      }
    }

    res.status(404).json({ error: 'Record not found' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/records/:id
 * Delete a performance record
 */
router.delete('/:id', authenticate, requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const recordId = req.params.id;
    const teacherId = req.user.role === 'TEACHER' ? req.user.profileId : null;

    // Check AF2 records
    const records = readAf2Records();
    const targetAf = records.find((r) => String(r.id) === String(recordId));
    if (targetAf) {
      if (teacherId && targetAf.learnerId) {
        const targetLearner = await prisma.learner.findUnique({
          where: { id: Number(targetAf.learnerId) },
          select: { assignedTeacherId: true },
        });
        if (targetLearner && targetLearner.assignedTeacherId !== teacherId) {
          return res.status(403).json({ error: 'Learner is not assigned to you' });
        }
      }
      const filtered = records.filter((r) => String(r.id) !== String(recordId));
      writeAf2Records(filtered);

      if (targetAf.learnerId && targetAf.moduleId) {
        await prisma.submission
          .updateMany({
            where: {
              learnerId: Number(targetAf.learnerId),
              moduleId: Number(targetAf.moduleId),
            },
            data: { status: 'SUBMITTED' },
          })
          .catch(() => {});
        await prisma.learnerProgress
          .updateMany({
            where: {
              learnerId: Number(targetAf.learnerId),
              moduleId: Number(targetAf.moduleId),
            },
            data: { masteryStatus: 'NOT_EVALUATED' },
          })
          .catch(() => {});
      }

      return res.status(204).send();
    }

    // Check database progress
    if (String(recordId).startsWith('prog_')) {
      const pId = parseInt(recordId.replace('prog_', ''), 10);
      if (!isNaN(pId)) {
        const existingProgress = await prisma.learnerProgress.findUnique({
          where: { id: pId },
          include: {
            learner: { select: { assignedTeacherId: true } },
            module: { select: { title: true } },
          },
        });
        if (existingProgress && teacherId && existingProgress.learner?.assignedTeacherId !== teacherId) {
          return res.status(403).json({ error: 'Learner is not assigned to you' });
        }

        await prisma.learnerProgress.delete({ where: { id: pId } }).catch(() => {});

        // Also remove any corresponding AF2 record so it does not reappear
        if (existingProgress) {
          const cleaned = records.filter(
            (r) =>
              !(
                Number(r.learnerId) === existingProgress.learnerId &&
                (Number(r.moduleId) === existingProgress.moduleId ||
                  (r.moduleTitle &&
                    existingProgress.module?.title &&
                    r.moduleTitle.trim().toLowerCase() === existingProgress.module.title.trim().toLowerCase()))
              )
          );
          if (cleaned.length !== records.length) {
            writeAf2Records(cleaned);
          }
        }
        return res.status(204).send();
      }
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

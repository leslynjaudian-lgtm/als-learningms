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

    // 3. Fetch actual LearnerProgress records for these assigned learners from the database
    const progressList = await prisma.learnerProgress.findMany({
      where: {
        learnerId: targetLearnerId && !isNaN(targetLearnerId) ? targetLearnerId : { in: assignedLearnerIds },
      },
      include: {
        learner: {
          include: { learningCenter: true },
        },
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
      orderBy: { updatedAt: 'desc' },
    });

    // 4. Fetch any manually recorded AF2 entries for these assigned learners
    const af2Stored = readAf2Records();
    const af2List = af2Stored.filter((r) => {
      const lid = Number(r.learnerId);
      const tid = Number(r.teacherId);
      return assignedLearnerIds.includes(lid) || (tid && tid === teacherId);
    });

    // 5. Combine records without duplicates
    const records = [];
    const seenModuleLearnerKeys = new Set();

    // 5a. Process database LearnerProgress records
    for (const p of progressList) {
      const learner = p.learner || assignedMap.get(p.learnerId);
      const mod = p.module;
      if (!learner || !mod) continue;

      const modKeyId = `${p.learnerId}_${p.moduleId}`;
      const modKeyTitle = `${p.learnerId}_${(mod.title || '').trim().toLowerCase()}`;
      seenModuleLearnerKeys.add(modKeyId);
      seenModuleLearnerKeys.add(modKeyTitle);

      let preTotal = 10;
      let postTotal = 10;
      if (Array.isArray(mod.assessments)) {
        const preAss = mod.assessments.find((a) => a.type === 'PRE_TEST');
        const postAss = mod.assessments.find((a) => a.type === 'POST_TEST');
        if (preAss?._count?.questions) preTotal = preAss._count.questions;
        if (postAss?._count?.questions) postTotal = postAss._count.questions;
      }

      let status = 'In Progress';
      if (p.masteryStatus === 'MASTERED' || p.status === 'COMPLETED') {
        status = 'Mastered';
      } else if (p.masteryStatus === 'NOT_MASTERED') {
        status = 'Not Mastered';
      }

      let displayLevel = 'A&E Elementary';
      if (learner.level === 'JUNIOR' || learner.level === 'A&E Junior High') {
        displayLevel = 'A&E Junior High';
      } else if (learner.level === 'ELEMENTARY' || learner.level === 'A&E Elementary') {
        displayLevel = 'A&E Elementary';
      }

      // Check if there is a matching manual AF2 record to merge teacher's remarks or details
      const matchedAf = af2List.find(
        (af) =>
          Number(af.learnerId) === learner.id &&
          (Number(af.moduleId) === mod.id ||
            (af.moduleTitle &&
              af.moduleTitle.trim().toLowerCase() === mod.title.trim().toLowerCase()))
      );

      let finalRemarks = matchedAf?.remarks ? matchedAf.remarks.trim() : '';
      let finalOtherActivities = matchedAf?.otherActivities
        ? matchedAf.otherActivities.trim()
        : (mod.activitiesRelated ? mod.activitiesRelated.replace(/\\n/g, '\n').trim() : '');
      let finalSelfAssessment = matchedAf?.selfAssessment ? matchedAf.selfAssessment.trim() : '';
      let finalStatus = status;
      if (matchedAf?.assessment && (matchedAf.assessment === 'Mastered' || matchedAf.assessment === 'Not Mastered')) {
        finalStatus = matchedAf.assessment;
      } else if (matchedAf?.moduleStatus) {
        finalStatus = matchedAf.moduleStatus;
      }

      const recDateStarted = matchedAf?.dateStarted || (p.createdAt ? p.createdAt.toISOString().split('T')[0] : (mod.dateStarted ? mod.dateStarted.toISOString().split('T')[0] : ''));
      const recDateCompleted = matchedAf?.dateFinished || matchedAf?.dateCompleted || (p.completedAt ? p.completedAt.toISOString().split('T')[0] : (p.updatedAt ? p.updatedAt.toISOString().split('T')[0] : ''));

      records.push({
        id: `prog_${p.id}`,
        source: 'database',
        progressId: p.id,
        learnerId: learner.id,
        learnerName: formatLearnerName(learner),
        lrn: learner.lrn || '',
        level: displayLevel,
        learningCenterId: learner.learningCenterId,
        learningCenter: learner.learningCenter?.name || '',
        centerName: learner.learningCenter?.name || '',
        moduleId: mod.id,
        moduleTitle: mod.title,
        strandName: mod.learningArea?.name || matchedAf?.strandName || '',
        preTestScore: p.preTestScore != null ? Number(p.preTestScore) : (matchedAf?.preTestScore != null ? Number(matchedAf.preTestScore) : null),
        preTestTotal: matchedAf?.preTestTotal != null && matchedAf?.preTestTotal !== '' ? Number(matchedAf.preTestTotal) : preTotal,
        postTestScore: p.postTestScore != null ? Number(p.postTestScore) : (matchedAf?.postTestScore != null ? Number(matchedAf.postTestScore) : null),
        postTestTotal: matchedAf?.postTestTotal != null && matchedAf?.postTestTotal !== '' ? Number(matchedAf.postTestTotal) : postTotal,
        assessment: finalStatus,
        moduleStatus: finalStatus,
        dateStarted: recDateStarted,
        dateFinished: recDateCompleted,
        dateCompleted: recDateCompleted,
        otherActivities: finalOtherActivities,
        uploadedOutputs: matchedAf?.uploadedOutputs || '',
        selfAssessment: finalSelfAssessment,
        remarks: finalRemarks,
      });
    }

    // 5b. Process any AF2 recorded entries not already covered
    for (const af of af2List) {
      const lid = Number(af.learnerId);
      const modKeyId = af.moduleId ? `${lid}_${af.moduleId}` : null;
      const modKeyTitle = af.moduleTitle ? `${lid}_${af.moduleTitle.trim().toLowerCase()}` : null;
      if ((!modKeyId || !seenModuleLearnerKeys.has(modKeyId)) && (!modKeyTitle || !seenModuleLearnerKeys.has(modKeyTitle))) {
        if (modKeyId) seenModuleLearnerKeys.add(modKeyId);
        if (modKeyTitle) seenModuleLearnerKeys.add(modKeyTitle);
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

        records.push({
          id: af.id || `af2_${Date.now()}`,
          source: 'af2',
          learnerId: lid || learner?.id,
          learnerName: af.learnerName || (learner ? formatLearnerName(learner) : ''),
          lrn: af.lrn || learner?.lrn || '',
          level: displayLevel || 'A&E Elementary',
          learningCenterId: cid,
          learningCenter: centerName,
          centerName: centerName,
          moduleId: af.moduleId || null,
          moduleTitle: af.moduleTitle || 'Learning Module',
          strandName: af.strandName || '',
          preTestScore: af.preTestScore != null && af.preTestScore !== '' ? Number(af.preTestScore) : null,
          preTestTotal: af.preTestTotal != null && af.preTestTotal !== '' ? Number(af.preTestTotal) : 10,
          postTestScore: af.postTestScore != null && af.postTestScore !== '' ? Number(af.postTestScore) : null,
          postTestTotal: af.postTestTotal != null && af.postTestTotal !== '' ? Number(af.postTestTotal) : 10,
          assessment: af.assessment || af.moduleStatus || 'Mastered',
          moduleStatus: af.assessment || af.moduleStatus || 'Mastered',
          dateStarted: af.dateStarted || '',
          dateFinished: af.dateFinished || af.dateCompleted || '',
          dateCompleted: af.dateFinished || af.dateCompleted || '',
          otherActivities: af.otherActivities || '',
          uploadedOutputs: af.uploadedOutputs || '',
          selfAssessment: af.selfAssessment || '',
          remarks: af.remarks || '',
        });
      }
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
 * POST /api/records
 * Create a new learner performance record for the authenticated teacher
 */
router.post('/', authenticate, requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const teacherId = req.user.role === 'TEACHER' ? req.user.profileId : parseInt(req.body.teacherId || '0', 10);
    const {
      learnerId,
      learnerName,
      lrn,
      level,
      centerName,
      learningCenter,
      learningCenterId,
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

    if (!learnerId) {
      return res.status(400).json({ error: 'learnerId is required' });
    }
    if (!moduleTitle || !moduleTitle.trim()) {
      return res.status(400).json({ error: 'moduleTitle is required' });
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

    const cName = centerName || learningCenter || learner.learningCenter?.name || '';
    const cid = learningCenterId || learner.learningCenterId || null;
    const finalAssessment = assessment || moduleStatus || 'Mastered';

    // 1. Save to AF2 records JSON
    const af2Records = readAf2Records();
    const newRecordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAf2 = {
      id: newRecordId,
      teacherId,
      learnerId: parsedLearnerId,
      learnerName: learnerName || learner.fullName,
      lrn: lrn || learner.lrn || '',
      level: level || (learner.level === 'ELEMENTARY' ? 'A&E Elementary' : 'A&E Junior High'),
      learningCenterId: cid,
      learningCenter: cName,
      centerName: cName,
      moduleTitle: moduleTitle.trim(),
      strandName: strandName || '',
      dateStarted: dateStarted || '',
      dateFinished: dateFinished || '',
      dateCompleted: dateFinished || '',
      preTestScore: preTestScore != null && preTestScore !== '' ? Number(preTestScore) : null,
      preTestTotal: preTestTotal != null && preTestTotal !== '' ? Number(preTestTotal) : 10,
      postTestScore: postTestScore != null && postTestScore !== '' ? Number(postTestScore) : null,
      postTestTotal: postTestTotal != null && postTestTotal !== '' ? Number(postTestTotal) : 10,
      otherActivities: otherActivities ? otherActivities.trim() : '',
      selfAssessment: '',
      assessment: finalAssessment,
      moduleStatus: finalAssessment,
      remarks: remarks ? remarks.trim() : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    af2Records.unshift(newAf2);
    writeAf2Records(af2Records);

    // 2. Also sync to database LearnerProgress if matching module exists
    try {
      const matchedModule = await prisma.module.findFirst({
        where: {
          teacherId,
          title: { contains: moduleTitle.trim() },
        },
      });

      if (matchedModule) {
        await prisma.learnerProgress.upsert({
          where: {
            learnerId_moduleId: {
              learnerId: parsedLearnerId,
              moduleId: matchedModule.id,
            },
          },
          create: {
            learnerId: parsedLearnerId,
            moduleId: matchedModule.id,
            preTestScore: preTestScore != null ? Number(preTestScore) : null,
            postTestScore: postTestScore != null ? Number(postTestScore) : null,
            status: finalAssessment === 'Mastered' ? 'COMPLETED' : 'IN_PROGRESS',
            masteryStatus: finalAssessment === 'Mastered' ? 'MASTERED' : 'NOT_MASTERED',
            completedAt: dateFinished ? new Date(dateFinished) : null,
          },
          update: {
            preTestScore: preTestScore != null ? Number(preTestScore) : null,
            postTestScore: postTestScore != null ? Number(postTestScore) : null,
            status: finalAssessment === 'Mastered' ? 'COMPLETED' : 'IN_PROGRESS',
            masteryStatus: finalAssessment === 'Mastered' ? 'MASTERED' : 'NOT_MASTERED',
            completedAt: dateFinished ? new Date(dateFinished) : null,
          },
        });
      }
    } catch (dbErr) {
      console.warn('Could not sync progress to database table:', dbErr);
    }

    // 3. Notify Admin that Teacher added a learner record
    if (req.user?.role === 'TEACHER' || teacherId) {
      notifyLearnerRecordCreated({
        teacherId,
        learnerId: parsedLearnerId,
        moduleTitle: moduleTitle.trim(),
        recordId: newRecordId,
      }).catch((e) => console.error('[Records] notifyLearnerRecordCreated error:', e));
    }

    res.status(201).json(newAf2);
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

      records[idx] = {
        ...records[idx],
        ...updates,
        selfAssessment: '',
        updatedAt: new Date().toISOString(),
      };
      writeAf2Records(records);

      // Also sync to LearnerProgress if moduleId is present
      const rec = records[idx];
      if (rec.learnerId && rec.moduleId) {
        try {
          await prisma.learnerProgress.update({
            where: {
              learnerId_moduleId: {
                learnerId: Number(rec.learnerId),
                moduleId: Number(rec.moduleId),
              },
            },
            data: {
              preTestScore: rec.preTestScore != null && rec.preTestScore !== '' ? Number(rec.preTestScore) : null,
              postTestScore: rec.postTestScore != null && rec.postTestScore !== '' ? Number(rec.postTestScore) : null,
              masteryStatus: rec.assessment === 'Mastered' ? 'MASTERED' : 'NOT_MASTERED',
              status: rec.assessment === 'Mastered' ? 'COMPLETED' : 'IN_PROGRESS',
              completedAt: rec.dateFinished ? new Date(rec.dateFinished) : undefined,
            },
          });
        } catch {
          // Ignore if no matching progress row
        }
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
        if (updates.preTestScore !== undefined) {
          updateData.preTestScore = updates.preTestScore != null && updates.preTestScore !== '' ? Number(updates.preTestScore) : null;
        }
        if (updates.postTestScore !== undefined) {
          updateData.postTestScore = updates.postTestScore != null && updates.postTestScore !== '' ? Number(updates.postTestScore) : null;
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

        // Also sync/upsert in af2_records.json so remarks, otherActivities, dateStarted, dateFinished, preTestTotal, postTestTotal persist
        const afIdx = records.findIndex(
          (r) =>
            Number(r.learnerId) === existingProgress.learnerId &&
            (Number(r.moduleId) === existingProgress.moduleId ||
              (r.moduleTitle &&
                existingProgress.module?.title &&
                r.moduleTitle.trim().toLowerCase() === existingProgress.module.title.trim().toLowerCase()))
        );

        const finalAssessment =
          updates.assessment ||
          updates.moduleStatus ||
          (updatedProgress.masteryStatus === 'MASTERED' ? 'Mastered' : 'Not Mastered');

        if (afIdx !== -1) {
          records[afIdx] = {
            ...records[afIdx],
            ...updates,
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
            preTestTotal: updates.preTestTotal != null && updates.preTestTotal !== '' ? Number(updates.preTestTotal) : 10,
            postTestScore: updatedProgress.postTestScore,
            postTestTotal: updates.postTestTotal != null && updates.postTestTotal !== '' ? Number(updates.postTestTotal) : 10,
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

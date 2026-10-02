import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';
import { formatLearnerName } from './learners.js';

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

    if (!teacherId) {
      // If no teacher can be resolved, return an empty array (do NOT leak other teachers' records)
      return res.json([]);
    }

    const {
      learnerId,
      programLevel,
      level,
      learningCenterId,
      learningCenter,
      search,
    } = req.query;

    // 2. Fetch learners strictly assigned to this teacher
    const assignedLearners = await prisma.learner.findMany({
      where: { assignedTeacherId: teacherId },
      include: {
        learningCenter: { select: { id: true, name: true } },
      },
    });

    if (!assignedLearners || assignedLearners.length === 0) {
      return res.json([]);
    }

    const assignedLearnerIds = assignedLearners.map((l) => l.id);
    const assignedMap = new Map(assignedLearners.map((l) => [l.id, l]));

    // 3. Fetch actual LearnerProgress records for these assigned learners from the database
    const progressList = await prisma.learnerProgress.findMany({
      where: {
        learnerId: { in: assignedLearnerIds },
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

      const key = `${p.learnerId}_${p.moduleId}`;
      seenModuleLearnerKeys.add(key);

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

      const dateCompleted = p.completedAt
        ? p.completedAt.toISOString().split('T')[0]
        : (p.updatedAt ? p.updatedAt.toISOString().split('T')[0] : '');

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
        strandName: mod.learningArea?.name || '',
        preTestScore: p.preTestScore != null ? Number(p.preTestScore) : null,
        preTestTotal: preTotal,
        postTestScore: p.postTestScore != null ? Number(p.postTestScore) : null,
        postTestTotal: postTotal,
        assessment: status,
        moduleStatus: status,
        dateStarted: p.createdAt ? p.createdAt.toISOString().split('T')[0] : '',
        dateFinished: dateCompleted,
        dateCompleted: dateCompleted,
        otherActivities: '',
        remarks: '',
      });
    }

    // 5b. Process any AF2 recorded entries not already covered
    for (const af of af2List) {
      const lid = Number(af.learnerId);
      const key = `${lid}_${af.moduleId || af.moduleTitle}`;
      if (!seenModuleLearnerKeys.has(key)) {
        seenModuleLearnerKeys.add(key);
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
          learnerName: af.learnerName || learner?.fullName || '',
          lrn: af.lrn || learner?.lrn || '',
          level: displayLevel || 'A&E Elementary',
          learningCenterId: cid,
          learningCenter: centerName,
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

    // Filter 2: Program Level
    const targetLevel = programLevel || level;
    if (targetLevel) {
      const normQuery = targetLevel.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        const rLvl = (r.level || '').toLowerCase();
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
        filtered = filtered.filter((r) => Number(r.learningCenterId) === cidNum);
      }
    } else if (learningCenter) {
      const normCenter = learningCenter.trim().toLowerCase();
      filtered = filtered.filter(
        (r) => (r.learningCenter || '').trim().toLowerCase() === normCenter
      );
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

    // Update in AF2 records JSON
    const records = readAf2Records();
    const idx = records.findIndex((r) => String(r.id) === String(recordId));
    if (idx !== -1) {
      records[idx] = {
        ...records[idx],
        ...updates,
        selfAssessment: '',
        updatedAt: new Date().toISOString(),
      };
      writeAf2Records(records);
      return res.json(records[idx]);
    }

    // If it's a progress_ record from database
    if (String(recordId).startsWith('prog_')) {
      const pId = parseInt(recordId.replace('prog_', ''), 10);
      if (!isNaN(pId)) {
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
        return res.json({ id: recordId, ...updatedProgress });
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

    // Check AF2 records
    const records = readAf2Records();
    const filtered = records.filter((r) => String(r.id) !== String(recordId));
    if (filtered.length !== records.length) {
      writeAf2Records(filtered);
      return res.status(204).send();
    }

    // Check database progress
    if (String(recordId).startsWith('prog_')) {
      const pId = parseInt(recordId.replace('prog_', ''), 10);
      if (!isNaN(pId)) {
        await prisma.learnerProgress.delete({ where: { id: pId } }).catch(() => {});
        return res.status(204).send();
      }
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

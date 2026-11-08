import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { formatLearnerName } from './learners.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const AF2_FILE = path.join(DATA_DIR, 'af2_records.json');

const router = Router();

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readAf2Records() {
  try {
    if (!fs.existsSync(AF2_FILE)) {
      fs.writeFileSync(AF2_FILE, JSON.stringify([]), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(AF2_FILE, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading AF2 file:', err);
    return [];
  }
}

function writeAf2Records(records) {
  try {
    fs.writeFileSync(AF2_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing AF2 file:', err);
  }
}

// ---------------------
// GET /api/af2
// List AF2 records with filtering
// ---------------------
router.get('/', async (req, res, next) => {
  try {
    const {
      learningCenterId,
      learningCenter,
      teacherId,
      teacherName,
      level,
      learnerId,
      learnerName,
      strandName,
      fromDate,
      toDate,
    } = req.query;

    // 1. Read manually and submission-recorded AF2 entries from JSON
    const af2Records = readAf2Records();

    // 2. Fetch live DB learner, teacher, center, and module info
    const [learners, teachers, centers] = await Promise.all([
      prisma.learner.findMany({
        include: { learningCenter: true, assignedTeacher: true },
      }).catch(() => []),
      prisma.teacher.findMany({ select: { id: true, fullName: true, learningCenterId: true } }).catch(() => []),
      prisma.learningCenter.findMany({ select: { id: true, name: true } }).catch(() => []),
    ]);

    const learnerMap = new Map(learners.map((l) => [l.id, l]));
    const teacherMap = new Map(teachers.map((t) => [t.id, t.fullName]));
    const centerMap = new Map(centers.map((c) => [c.id, c.name]));

    const combined = [];
    const seenRecordKeys = new Set();

    // Process only authoritative saved AF2 records
    for (const rec of af2Records) {
      const lid = Number(rec.learnerId);
      const recId = String(rec.id || '');
      const modKeyId = rec.moduleId ? `${lid}_${rec.moduleId}` : null;
      const modKeyTitle = rec.moduleTitle ? `${lid}_${String(rec.moduleTitle).trim().toLowerCase()}` : null;
      const uniqueKey = recId || modKeyId || modKeyTitle;

      if (uniqueKey && seenRecordKeys.has(uniqueKey)) {
        continue;
      }
      if (uniqueKey) {
        seenRecordKeys.add(uniqueKey);
      }

      const learner = learnerMap.get(lid);
      let displayLevel = rec.level || (learner?.level === 'ELEMENTARY' ? 'A&E Elementary' : 'A&E Junior High');
      if (displayLevel === 'JUNIOR') displayLevel = 'A&E Junior High';
      else if (displayLevel === 'ELEMENTARY') displayLevel = 'A&E Elementary';

      const finalStatus =
        rec.assessment === 'Mastered' || rec.assessment === 'Not Mastered'
          ? rec.assessment
          : rec.moduleStatus === 'Mastered' || rec.moduleStatus === 'Not Mastered'
            ? rec.moduleStatus
            : 'Mastered';

      combined.push({
        id: rec.id || `rec_${Date.now()}`,
        source: 'af2',
        teacherId: rec.teacherId || learner?.assignedTeacherId || null,
        teacherName: learner?.assignedTeacher?.fullName || teacherMap.get(learner?.assignedTeacherId) || 'ALS Teacher',
        learnerId: lid || learner?.id,
        learnerName: rec.learnerName || (learner ? formatLearnerName(learner) : ''),
        lrn: rec.lrn || learner?.lrn || '',
        level: displayLevel || 'A&E Elementary',
        learningCenterId: rec.learningCenterId || learner?.learningCenterId || null,
        learningCenter: rec.learningCenter || rec.centerName || learner?.learningCenter?.name || centerMap.get(learner?.learningCenterId) || '—',
        centerName: rec.centerName || rec.learningCenter || learner?.learningCenter?.name || centerMap.get(learner?.learningCenterId) || '—',
        moduleId: rec.moduleId || null,
        moduleTitle: rec.moduleTitle || 'Learning Module',
        strandName: rec.strandName || '',
        preTestScore: rec.preTestScore != null && rec.preTestScore !== '' ? Number(rec.preTestScore) : null,
        preTestTotal: rec.preTestTotal != null && rec.preTestTotal !== '' ? Number(rec.preTestTotal) : null,
        postTestScore: rec.postTestScore != null && rec.postTestScore !== '' ? Number(rec.postTestScore) : null,
        postTestTotal: rec.postTestTotal != null && rec.postTestTotal !== '' ? Number(rec.postTestTotal) : null,
        assessment: finalStatus,
        moduleStatus: finalStatus,
        dateStarted: rec.dateStarted || '',
        dateFinished: rec.dateFinished || rec.dateCompleted || '',
        dateCompleted: rec.dateFinished || rec.dateCompleted || '',
        otherActivities: rec.otherActivities ? String(rec.otherActivities).trim() : '',
        uploadedOutputs: rec.uploadedOutputs || '',
        selfAssessment: rec.selfAssessment ? String(rec.selfAssessment).trim() : '',
        remarks: rec.remarks ? String(rec.remarks).trim() : '',
      });
    }

    let records = combined;

    // Apply filters
    if (learningCenterId) {
      const cid = parseInt(learningCenterId, 10);
      const cNameTarget = centerMap.get(cid);
      if (cNameTarget) {
        records = records.filter(
          (r) =>
            r.learningCenterId === cid ||
            (r.learningCenter && r.learningCenter.trim().toLowerCase() === cNameTarget.trim().toLowerCase())
        );
      }
    } else if (learningCenter) {
      const q = learningCenter.trim().toLowerCase();
      records = records.filter(
        (r) => r.learningCenter && r.learningCenter.trim().toLowerCase() === q
      );
    }

    if (teacherId) {
      const tid = parseInt(teacherId, 10);
      const tNameTarget = teacherMap.get(tid);
      if (tNameTarget) {
        records = records.filter(
          (r) =>
            r.teacherId === tid ||
            (r.teacherName && r.teacherName.trim().toLowerCase() === tNameTarget.trim().toLowerCase())
        );
      }
    } else if (teacherName) {
      const q = teacherName.trim().toLowerCase();
      records = records.filter(
        (r) => r.teacherName && r.teacherName.trim().toLowerCase() === q
      );
    }

    if (level) {
      const lvlQuery = level.toLowerCase();
      records = records.filter((r) => {
        if (!r.level) return false;
        const norm = r.level.toLowerCase();
        if (lvlQuery.includes('elem') && norm.includes('elem')) return true;
        if ((lvlQuery.includes('junior') || lvlQuery.includes('jhs')) && (norm.includes('junior') || norm.includes('jhs'))) return true;
        return norm === lvlQuery;
      });
    }

    if (learnerId) {
      const lid = parseInt(learnerId, 10);
      records = records.filter((r) => Number(r.learnerId) === lid);
    } else if (learnerName) {
      const q = learnerName.trim().toLowerCase();
      records = records.filter(
        (r) => r.learnerName && r.learnerName.trim().toLowerCase().includes(q)
      );
    }

    if (strandName) {
      const q = strandName.trim().toLowerCase();
      records = records.filter(
        (r) => r.strandName && r.strandName.trim().toLowerCase().includes(q)
      );
    }

    const startRange = (fromDate || req.query.dateStarted || '').trim().split('T')[0];
    const endRange = (toDate || req.query.dateFinished || '').trim().split('T')[0];

    if (startRange || endRange) {
      records = records.filter((r) => {
        const recordDate = (r.dateFinished || r.dateCompleted || r.dateStarted || '').trim().split('T')[0];
        if (!recordDate) return true;
        if (startRange && recordDate < startRange) return false;
        if (endRange && recordDate > endRange) return false;
        return true;
      });
    }

    res.json(records);
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/af2
// Save or update an AF2 record
// ---------------------
router.post('/', async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload.moduleTitle) {
      return res.status(400).json({ error: 'moduleTitle is required' });
    }

    const records = readAf2Records();
    const id = payload.id || `af2_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newRecord = {
      id,
      learnerId: payload.learnerId ? Number(payload.learnerId) : null,
      learnerName: payload.learnerName || '',
      lrn: payload.lrn || '',
      level: payload.level || 'A&E Elementary',
      learningCenterId: payload.learningCenterId ? Number(payload.learningCenterId) : null,
      learningCenter: payload.learningCenter || payload.centerName || '',
      teacherId: payload.teacherId ? Number(payload.teacherId) : null,
      teacherName: payload.teacherName || '',
      moduleTitle: payload.moduleTitle,
      strandName: payload.strandName || '',
      dateStarted: payload.dateStarted || '',
      dateFinished: payload.dateFinished || '',
      preTestScore: payload.preTestScore != null && payload.preTestScore !== '' ? Number(payload.preTestScore) : null,
      preTestTotal: payload.preTestTotal != null && payload.preTestTotal !== '' ? Number(payload.preTestTotal) : 10,
      postTestScore: payload.postTestScore != null && payload.postTestScore !== '' ? Number(payload.postTestScore) : null,
      postTestTotal: payload.postTestTotal != null && payload.postTestTotal !== '' ? Number(payload.postTestTotal) : 10,
      otherActivities: payload.otherActivities || '',
      selfAssessment: payload.selfAssessment || '',
      assessment: payload.assessment === 'Not Mastered' ? 'Not Mastered' : 'Mastered',
      remarks: payload.remarks || '',
      createdAt: payload.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = records.findIndex((r) => String(r.id) === String(id));
    if (existingIdx !== -1) {
      records[existingIdx] = { ...records[existingIdx], ...newRecord };
    } else {
      records.unshift(newRecord);
    }

    writeAf2Records(records);
    res.status(201).json(newRecord);
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/af2/summary
// Summary counts for Admin AF2 cards
// ---------------------
router.get('/summary', async (req, res, next) => {
  try {
    const records = readAf2Records();

    const distinctLearners = new Set(
      records.map((r) => r.learnerId || r.learnerName).filter(Boolean)
    );

    const totalMastered = records.filter(
      (r) => (r.assessment || '').toLowerCase() === 'mastered'
    ).length;

    const totalNotMastered = records.filter(
      (r) => (r.assessment || '').toLowerCase() === 'not mastered'
    ).length;

    res.json({
      totalLearners: distinctLearners.size,
      totalAf2Records: records.length,
      totalMastered,
      totalNotMastered,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

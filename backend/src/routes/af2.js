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

    let records = readAf2Records();

    // Optionally enrich with live DB learner & teacher & center info if available
    const [learners, teachers, centers] = await Promise.all([
      prisma.learner.findMany({ select: { id: true, fullName: true, firstName: true, middleName: true, lastName: true, lrn: true, level: true, learningCenterId: true, assignedTeacherId: true } }).catch(() => []),
      prisma.teacher.findMany({ select: { id: true, fullName: true, learningCenterId: true } }).catch(() => []),
      prisma.learningCenter.findMany({ select: { id: true, name: true } }).catch(() => []),
    ]);

    const learnerMap = new Map(learners.map((l) => [l.id, l]));
    const teacherMap = new Map(teachers.map((t) => [t.id, t.fullName]));
    const centerMap = new Map(centers.map((c) => [c.id, c.name]));

    records = records.map((rec) => {
      let lName = rec.learnerName;
      let lrn = rec.lrn;
      let lvl = rec.level;
      let cName = rec.learningCenter || rec.centerName;
      let tName = rec.teacherName;

      if (rec.learnerId && learnerMap.has(Number(rec.learnerId))) {
        const dbLearner = learnerMap.get(Number(rec.learnerId));
        lName = formatLearnerName(dbLearner) || dbLearner.fullName;
        if (!lrn) lrn = dbLearner.lrn;
        if (!lvl) {
          lvl = dbLearner.level === 'ELEMENTARY' ? 'A&E Elementary' : 'A&E Junior High School';
        }
        if (!cName && dbLearner.learningCenterId && centerMap.has(dbLearner.learningCenterId)) {
          cName = centerMap.get(dbLearner.learningCenterId);
        }
        if (!tName && dbLearner.assignedTeacherId && teacherMap.has(dbLearner.assignedTeacherId)) {
          tName = teacherMap.get(dbLearner.assignedTeacherId);
        }
      }

      return {
        ...rec,
        learnerName: lName || '—',
        lrn: lrn || '',
        level: lvl || 'A&E Elementary',
        learningCenter: cName || '—',
        centerName: cName || '—',
        teacherName: tName || '—',
      };
    });

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

    if (fromDate) {
      const d = new Date(fromDate);
      records = records.filter((r) => r.dateStarted && new Date(r.dateStarted) >= d);
    }

    if (toDate) {
      const d = new Date(toDate);
      records = records.filter((r) => r.dateFinished && new Date(r.dateFinished) <= d);
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

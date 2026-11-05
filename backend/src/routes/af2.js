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

    // 1. Read manually recorded AF2 entries from JSON
    const af2Records = readAf2Records();

    // 2. Fetch live DB learner, teacher, center, and progress info
    const [learners, teachers, centers, progressList] = await Promise.all([
      prisma.learner.findMany({
        include: { learningCenter: true, assignedTeacher: true },
      }).catch(() => []),
      prisma.teacher.findMany({ select: { id: true, fullName: true, learningCenterId: true } }).catch(() => []),
      prisma.learningCenter.findMany({ select: { id: true, name: true } }).catch(() => []),
      prisma.learnerProgress.findMany({
        include: {
          learner: { include: { learningCenter: true, assignedTeacher: true } },
          module: {
            include: {
              learningArea: true,
              assessments: {
                include: { _count: { select: { questions: true } } },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => []),
    ]);

    const learnerMap = new Map(learners.map((l) => [l.id, l]));
    const teacherMap = new Map(teachers.map((t) => [t.id, t.fullName]));
    const centerMap = new Map(centers.map((c) => [c.id, c.name]));

    const combined = [];
    const seenModuleLearnerKeys = new Set();

    // Process database LearnerProgress records
    for (const p of progressList) {
      const learner = p.learner || learnerMap.get(p.learnerId);
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

      const matchedAf = af2Records.find(
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

      combined.push({
        id: `prog_${p.id}`,
        source: 'database',
        progressId: p.id,
        teacherId: learner.assignedTeacherId || mod.teacherId,
        teacherName: learner.assignedTeacher?.fullName || teacherMap.get(learner.assignedTeacherId) || '—',
        learnerId: learner.id,
        learnerName: formatLearnerName(learner) || learner.fullName,
        lrn: learner.lrn || '',
        level: displayLevel,
        learningCenterId: learner.learningCenterId,
        learningCenter: learner.learningCenter?.name || centerMap.get(learner.learningCenterId) || '—',
        centerName: learner.learningCenter?.name || centerMap.get(learner.learningCenterId) || '—',
        moduleId: mod.id,
        moduleTitle: mod.title,
        strandName: mod.learningArea?.name || '',
        preTestScore: p.preTestScore != null ? Number(p.preTestScore) : (matchedAf?.preTestScore != null ? Number(matchedAf.preTestScore) : null),
        preTestTotal: preTotal,
        postTestScore: p.postTestScore != null ? Number(p.postTestScore) : (matchedAf?.postTestScore != null ? Number(matchedAf.postTestScore) : null),
        postTestTotal: postTotal,
        assessment: finalStatus,
        moduleStatus: finalStatus,
        dateStarted: recDateStarted,
        dateFinished: recDateCompleted,
        dateCompleted: recDateCompleted,
        otherActivities: finalOtherActivities,
        selfAssessment: finalSelfAssessment,
        remarks: finalRemarks,
      });
    }

    // Process manually recorded AF2 entries not already in combined
    for (const rec of af2Records) {
      const lid = Number(rec.learnerId);
      const modKeyId = rec.moduleId ? `${lid}_${rec.moduleId}` : null;
      const modKeyTitle = rec.moduleTitle ? `${lid}_${rec.moduleTitle.trim().toLowerCase()}` : null;

      if ((!modKeyId || !seenModuleLearnerKeys.has(modKeyId)) && (!modKeyTitle || !seenModuleLearnerKeys.has(modKeyTitle))) {
        if (modKeyId) seenModuleLearnerKeys.add(modKeyId);
        if (modKeyTitle) seenModuleLearnerKeys.add(modKeyTitle);

        let lName = rec.learnerName;
        let lrn = rec.lrn;
        let lvl = rec.level;
        let cName = rec.learningCenter || rec.centerName;
        let tName = rec.teacherName;
        let cid = rec.learningCenterId;

        if (lid && learnerMap.has(lid)) {
          const dbLearner = learnerMap.get(lid);
          lName = formatLearnerName(dbLearner) || dbLearner.fullName;
          if (!lrn) lrn = dbLearner.lrn;
          if (!lvl) {
            lvl = dbLearner.level === 'ELEMENTARY' ? 'A&E Elementary' : 'A&E Junior High';
          }
          if (!cName && dbLearner.learningCenterId && centerMap.has(dbLearner.learningCenterId)) {
            cName = centerMap.get(dbLearner.learningCenterId);
          }
          cid = cid || dbLearner.learningCenterId;
          if (!tName && dbLearner.assignedTeacherId && teacherMap.has(dbLearner.assignedTeacherId)) {
            tName = teacherMap.get(dbLearner.assignedTeacherId);
          }
        }

        combined.push({
          ...rec,
          id: rec.id || `af2_${Date.now()}`,
          source: 'af2',
          learnerId: lid,
          learnerName: lName || '—',
          lrn: lrn || '',
          level: lvl || 'A&E Elementary',
          learningCenterId: cid,
          learningCenter: cName || '—',
          centerName: cName || '—',
          teacherName: tName || '—',
          preTestScore: rec.preTestScore != null && rec.preTestScore !== '' ? Number(rec.preTestScore) : null,
          preTestTotal: rec.preTestTotal != null && rec.preTestTotal !== '' ? Number(rec.preTestTotal) : 10,
          postTestScore: rec.postTestScore != null && rec.postTestScore !== '' ? Number(rec.postTestScore) : null,
          postTestTotal: rec.postTestTotal != null && rec.postTestTotal !== '' ? Number(rec.postTestTotal) : 10,
          assessment: rec.assessment || rec.moduleStatus || 'Mastered',
          moduleStatus: rec.assessment || rec.moduleStatus || 'Mastered',
          dateStarted: rec.dateStarted || '',
          dateFinished: rec.dateFinished || rec.dateCompleted || '',
          dateCompleted: rec.dateFinished || rec.dateCompleted || '',
          otherActivities: rec.otherActivities || '',
          selfAssessment: rec.selfAssessment || '',
          remarks: rec.remarks || '',
        });
      }
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

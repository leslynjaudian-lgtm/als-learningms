import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { formatLearnerName } from './learners.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const AF2_FILE = path.join(DATA_DIR, 'af2_records.json');

function readAf2Records() {
  try {
    if (fs.existsSync(AF2_FILE)) {
      const raw = fs.readFileSync(AF2_FILE, 'utf-8');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('Could not read AF2 records file in reports route:', err);
  }
  return [];
}

const router = Router();

/**
 * Format ALS level for official DepEd reports
 */
function formatProgramLevel(level) {
  if (!level) return 'A&E Elementary';
  const norm = String(level).toUpperCase();
  if (norm === 'ELEMENTARY' || norm.includes('ELEM')) {
    return 'A&E Elementary';
  }
  return 'A&E Junior High';
}

/**
 * GET /api/reports/module-progress
 * Official Summary of Module Use and Learner's Progress Report
 * Role-based:
 *  - ADMIN: all learners across all learning centers, levels, teachers
 *  - TEACHER: strictly assigned learners only
 */
router.get('/module-progress', authenticate, requireRole(['ADMIN', 'TEACHER']), async (req, res, next) => {
  try {
    let {
      learningCenterId,
      learningCenter,
      programLevel,
      level,
      fromDate,
      toDate,
      month,
      schoolYear,
      year,
    } = req.query;

    // Dynamically calculate fromDate and toDate if month or schoolYear is provided and not explicitly set
    if (month && month !== 'all' && month !== 'All Months') {
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      let mIdx = -1;
      const cleanMonth = String(month).trim().toLowerCase();
      const asNum = parseInt(cleanMonth, 10);
      if (!isNaN(asNum) && asNum >= 1 && asNum <= 12) {
        mIdx = asNum - 1;
      } else {
        mIdx = monthNames.indexOf(cleanMonth);
      }

      if (mIdx !== -1) {
        let yr = new Date().getFullYear();
        const syStr = String(schoolYear || '').trim();
        if (syStr && syStr.includes('-')) {
          const [syStart, syEnd] = syStr.split('-').map(Number);
          if (!isNaN(syStart) && !isNaN(syEnd)) {
            yr = mIdx >= 5 ? syStart : syEnd;
          }
        } else if (year) {
          const parsedYr = Number(year);
          if (!isNaN(parsedYr) && parsedYr > 1900) yr = parsedYr;
        } else if (syStr) {
          const parsedYr = Number(syStr);
          if (!isNaN(parsedYr) && parsedYr > 1900) yr = parsedYr;
        }

        const lastDay = new Date(yr, mIdx + 1, 0).getDate();
        const pad = (n) => String(n).padStart(2, '0');
        fromDate = `${yr}-${pad(mIdx + 1)}-01`;
        toDate = `${yr}-${pad(mIdx + 1)}-${pad(lastDay)}`;
      }
    } else if (schoolYear && !fromDate && !toDate) {
      const syStr = String(schoolYear).trim();
      if (syStr && syStr.includes('-')) {
        const [syStart, syEnd] = syStr.split('-').map(Number);
        if (!isNaN(syStart) && !isNaN(syEnd)) {
          fromDate = `${syStart}-06-01`;
          toDate = `${syEnd}-05-31`;
        }
      }
    }

    const userRole = req.user.role;
    const teacherId = req.user.profileId;

    // 1. Build base learner query with strict backend role-based access control
    const learnerWhere = {};

    // Role-based scoping: Teacher can ONLY see assigned learners (or at their CLC if unassigned)
    if (userRole === 'TEACHER') {
      const teacherProfileId = req.user.profileId;
      const teacherUserId = req.user.userId || req.user.id;
      const teacherCenterId = req.user.teacherProfile?.learningCenterId;

      learnerWhere.OR = [
        { assignedTeacherId: teacherProfileId },
      ];
      if (teacherUserId && teacherUserId !== teacherProfileId) {
        learnerWhere.OR.push({ assignedTeacherId: teacherUserId });
      }
      if (teacherCenterId) {
        learnerWhere.OR.push({
          learningCenterId: teacherCenterId,
          assignedTeacherId: null,
        });
      }
    } else if (userRole === 'ADMIN' && req.query.teacherId) {
      const tid = parseInt(req.query.teacherId, 10);
      if (!isNaN(tid)) {
        learnerWhere.assignedTeacherId = tid;
      }
    }

    // Filter by Learning Center (ID or Name)
    const centerParam = learningCenterId || learningCenter;
    if (centerParam && centerParam !== 'All' && centerParam !== 'All Learning Centers' && centerParam !== 'All Assigned Centers') {
      const trimmed = String(centerParam).trim();
      const asNum = parseInt(trimmed, 10);
      if (!isNaN(asNum) && /^\d+$/.test(trimmed)) {
        learnerWhere.learningCenterId = asNum;
      } else {
        const centerObj = await prisma.learningCenter.findFirst({
          where: {
            OR: [
              { name: trimmed },
              { code: trimmed },
            ],
          },
        });
        if (centerObj) {
          learnerWhere.learningCenterId = centerObj.id;
        } else {
          learnerWhere.learningCenter = { name: trimmed };
        }
      }
    }

    // Filter by ALS Level
    const targetLevel = programLevel || level;
    if (targetLevel && targetLevel !== 'All' && targetLevel !== 'All Program Levels' && targetLevel !== 'All ALS Levels') {
      const norm = String(targetLevel).toUpperCase().trim();
      if (norm.includes('ELEM')) {
        learnerWhere.level = 'ELEMENTARY';
      } else if (norm.includes('JUNIOR') || norm.includes('HIGH') || norm.includes('JHS') || norm.includes('SEC')) {
        learnerWhere.level = 'JUNIOR';
      }
    }

    // Role-based ALS Level authorization scoping for teachers
    let teacherSpecialization = null;
    if (userRole === 'TEACHER') {
      teacherSpecialization = req.user.teacherProfile?.specialization || 'Both';
    } else if (userRole === 'ADMIN' && req.query.teacherId) {
      const tid = parseInt(req.query.teacherId, 10);
      if (!isNaN(tid)) {
        const tObj = await prisma.teacher.findFirst({
          where: { OR: [{ id: tid }, { userId: tid }] },
          select: { specialization: true },
        });
        if (tObj) teacherSpecialization = tObj.specialization || 'Both';
      }
    }

    if (teacherSpecialization) {
      const spec = String(teacherSpecialization).toLowerCase().trim();
      const allowsElem = spec.includes('elem') || spec.includes('both');
      const allowsJhs = spec.includes('junior') || spec.includes('jhs') || spec.includes('sec') || spec.includes('both');

      if (!allowsElem && !allowsJhs) {
        return res.json({
          success: true,
          meta: {
            userRole,
            totalLearners: 0,
            totalMale: 0,
            totalFemale: 0,
            totalMastered: 0,
            totalNotMastered: 0,
            totalPending: 0,
            averageProgress: 0,
            generatedAt: new Date().toISOString(),
          },
          male: [],
          female: [],
          all: [],
        });
      }

      if (allowsElem && !allowsJhs) {
        if (learnerWhere.level && learnerWhere.level !== 'ELEMENTARY') {
          return res.json({
            success: true,
            meta: {
              userRole,
              totalLearners: 0,
              totalMale: 0,
              totalFemale: 0,
              totalMastered: 0,
              totalNotMastered: 0,
              totalPending: 0,
              averageProgress: 0,
              generatedAt: new Date().toISOString(),
            },
            male: [],
            female: [],
            all: [],
          });
        }
        learnerWhere.level = 'ELEMENTARY';
      } else if (allowsJhs && !allowsElem) {
        if (learnerWhere.level && learnerWhere.level !== 'JUNIOR') {
          return res.json({
            success: true,
            meta: {
              userRole,
              totalLearners: 0,
              totalMale: 0,
              totalFemale: 0,
              totalMastered: 0,
              totalNotMastered: 0,
              totalPending: 0,
              averageProgress: 0,
              generatedAt: new Date().toISOString(),
            },
            male: [],
            female: [],
            all: [],
          });
        }
        learnerWhere.level = 'JUNIOR';
      }
    }

    // 2. Fetch learners matching criteria with their relations
    // NOTE: Date filtering (fromDate / toDate) applies strictly to learning performance records, NOT to learner enrollment!
    const learners = await prisma.learner.findMany({
      where: learnerWhere,
      include: {
        learningCenter: { select: { id: true, name: true, code: true } },
        assignedTeacher: { select: { id: true, fullName: true, position: true } },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
        { fullName: 'asc' },
      ],
    });

    // 3. Load authoritative saved performance records
    const allSavedRecords = readAf2Records();

    // Fetch modules to map real codes when missing from saved records without generating artificial fallbacks
    const dbModules = await prisma.module.findMany({ select: { id: true, code: true } });
    const moduleMap = new Map();
    for (const m of dbModules) {
      if (m.id) moduleMap.set(Number(m.id), m);
    }

    // 4. Process each learner's module usage and progress calculation from saved records ONLY
    // Include all enrolled learners even if they have 0 saved records
    const processedLearners = learners.map((learner) => {
      const learnerSavedRecords = allSavedRecords.filter((r) => {
        const rLid = r.learnerId != null ? Number(r.learnerId) : null;
        if (rLid && rLid === learner.id) return true;
        if (r.lrn && learner.lrn && String(r.lrn).trim() === String(learner.lrn).trim()) return true;
        if (!rLid && !r.lrn && r.learnerName && learner.fullName && r.learnerName.trim().toLowerCase() === learner.fullName.trim().toLowerCase()) return true;
        return false;
      });

      // Filter saved records by date range if specified (using finished date, completed date, started date, or created date)
      const filteredRecords = learnerSavedRecords.filter((r) => {
        const d = (r.dateFinished || r.dateCompleted || r.dateStarted || r.createdAt || '').trim().split('T')[0];
        if (!d) {
          return !fromDate && !toDate;
        }
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });

      let masteredCount = 0;
      let notMasteredCount = 0;
      let pendingCount = 0;

      const moduleDetails = [];

      for (const r of filteredRecords) {
        const isMastered = r.assessment === 'Mastered' || r.moduleStatus === 'Mastered';
        const isNotMastered = r.assessment === 'Not Mastered' || r.moduleStatus === 'Not Mastered';
        let status = 'In Progress';
        if (isMastered) {
          status = 'Mastered';
          masteredCount++;
        } else if (isNotMastered) {
          status = 'Not Mastered';
          notMasteredCount++;
        } else {
          status = r.assessment || r.moduleStatus || 'In Progress';
          pendingCount++;
        }

        const matchedMod = r.moduleId ? moduleMap.get(Number(r.moduleId)) : null;
        const realCode = r.moduleCode || matchedMod?.code || '';

        moduleDetails.push({
          moduleId: r.moduleId || r.id,
          title: r.moduleTitle || 'Learning Module',
          code: realCode,
          strand: r.strandName || 'General',
          status,
          preTestScore: r.preTestScore != null && r.preTestScore !== '' ? Number(r.preTestScore) : null,
          postTestScore: r.postTestScore != null && r.postTestScore !== '' ? Number(r.postTestScore) : null,
          completedPages: 0,
          totalPages: 0,
          dateCompleted: r.dateFinished || r.dateCompleted || null,
        });
      }

      const recordedCount = masteredCount + notMasteredCount;
      const totalModules = filteredRecords.length;
      const progressPct = totalModules > 0 ? Math.round((recordedCount / totalModules) * 100) : 0;

      // Clean gender categorization
      const rawGender = (learner.gender || '').trim().toUpperCase();
      const isFemale = rawGender === 'FEMALE' || rawGender === 'F';
      const genderGroup = isFemale ? 'Female' : 'Male';

      return {
        id: learner.id,
        lrn: learner.lrn || '',
        name: formatLearnerName(learner),
        fullName: formatLearnerName(learner),
        firstName: learner.firstName || '',
        middleName: learner.middleName || '',
        lastName: learner.lastName || '',
        gender: genderGroup,
        sex: learner.gender || genderGroup,
        learningCenterId: learner.learningCenterId,
        learningCenter: learner.learningCenter?.name || '—',
        level: formatProgramLevel(learner.level),
        programLevel: formatProgramLevel(learner.level),
        rawLevel: learner.level,
        assignedTeacherId: learner.assignedTeacherId,
        assignedTeacher: learner.assignedTeacher?.fullName || '—',
        teacher: learner.assignedTeacher?.fullName || '—',
        teacherName: learner.assignedTeacher?.fullName || 'ALS Teacher',
        status: learner.status || 'Active',
        dob: learner.birthDate ? learner.birthDate.toISOString().split('T')[0] : '—',
        contactNumber: learner.contactNo || '—',
        address: learner.address || '—',
        dateRegistered: learner.createdAt ? learner.createdAt.toISOString().split('T')[0] : '—',
        modulesCount: totalModules,
        mastered: masteredCount,
        notMastered: notMasteredCount,
        pending: pendingCount,
        progress: progressPct,
        moduleDetails,
      };
    });

    // 4. Split into Male and Female groupings as requested
    const maleLearners = processedLearners
      .filter((l) => l.gender === 'Male')
      .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const femaleLearners = processedLearners
      .filter((l) => l.gender === 'Female')
      .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const totalLearnersCount = processedLearners.length;
    const totalMasteredSum = processedLearners.reduce((acc, l) => acc + l.mastered, 0);
    const totalNotMasteredSum = processedLearners.reduce((acc, l) => acc + l.notMastered, 0);
    const totalPendingSum = processedLearners.reduce((acc, l) => acc + l.pending, 0);
    const avgProgress =
      totalLearnersCount > 0
        ? Math.round(processedLearners.reduce((acc, l) => acc + l.progress, 0) / totalLearnersCount)
        : 0;

    res.json({
      success: true,
      meta: {
        userRole,
        totalLearners: totalLearnersCount,
        totalMale: maleLearners.length,
        totalFemale: femaleLearners.length,
        totalMastered: totalMasteredSum,
        totalNotMastered: totalNotMasteredSum,
        totalPending: totalPendingSum,
        averageProgress: avgProgress,
        generatedAt: new Date().toISOString(),
      },
      male: maleLearners,
      female: femaleLearners,
      all: processedLearners,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/module-progress/learner/:id
 * Detailed modal data for a single learner
 */
router.get('/module-progress/learner/:id', authenticate, requireRole(['ADMIN', 'TEACHER']), async (req, res, next) => {
  try {
    const learnerId = parseInt(req.params.id, 10);
    if (isNaN(learnerId)) {
      return res.status(400).json({ error: 'Invalid learner ID' });
    }

    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      include: {
        learningCenter: true,
        assignedTeacher: true,
      },
    });

    if (!learner) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    // Role check: Teacher can ONLY view assigned learners matching their authorization
    if (req.user.role === 'TEACHER') {
      const currentTeacherId = req.user.profileId;
      const currentUserId = req.user.userId || req.user.id;
      const teacherCenterId = req.user.teacherProfile?.learningCenterId;

      const isAssigned =
        learner.assignedTeacherId === currentTeacherId ||
        learner.assignedTeacherId === currentUserId ||
        (teacherCenterId && learner.learningCenterId === teacherCenterId && !learner.assignedTeacherId);

      if (!isAssigned) {
        return res.status(403).json({ error: 'Access denied. You can only view details of your assigned learners.' });
      }
      const spec = String(req.user.teacherProfile?.specialization || 'Both').toLowerCase().trim();
      const allowsElem = spec.includes('elem') || spec.includes('both');
      const allowsJhs = spec.includes('junior') || spec.includes('jhs') || spec.includes('sec') || spec.includes('both');
      const isElem = learner.level === 'ELEMENTARY' || String(learner.level || '').toUpperCase().includes('ELEM');
      if ((isElem && !allowsElem) || (!isElem && !allowsJhs)) {
        return res.status(403).json({ error: 'Access denied. Learner ALS level is not authorized for your account.' });
      }
    }

    // Load saved records strictly for this learner from authoritative saved AF2 records
    const allSavedRecords = readAf2Records();

    // Fetch modules to map real codes and titles when missing from saved records without generating artificial fallbacks
    const dbModules = await prisma.module.findMany({
      select: {
        id: true,
        code: true,
        title: true,
        targetLevel: true,
        dateEnded: true,
        learningArea: { select: { name: true } },
      },
    }).catch(() => []);
    const moduleMap = new Map();
    for (const m of dbModules) {
      if (m.id) moduleMap.set(Number(m.id), m);
    }

    const learnerSaved = allSavedRecords.filter((r) => {
      const rLid = r.learnerId != null ? Number(r.learnerId) : null;
      if (rLid && rLid === learner.id) return true;
      if (r.lrn && learner.lrn && String(r.lrn).trim() === String(learner.lrn).trim()) return true;
      if (!rLid && !r.lrn && r.learnerName && learner.fullName && r.learnerName.trim().toLowerCase() === learner.fullName.trim().toLowerCase()) return true;
      return false;
    });

    const { fromDate, toDate } = req.query;
    const filteredRecords = learnerSaved.filter((r) => {
      const d = (r.dateFinished || r.dateCompleted || r.dateStarted || r.createdAt || '').trim().split('T')[0];
      if (!d) return true;
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });

    // Also fetch any explicit module assignments and progress records in database for this learner
    const dbAssignments = await prisma.moduleAssignment.findMany({
      where: { learnerId: learner.id },
      include: {
        module: {
          include: {
            learningArea: true,
          },
        },
      },
    }).catch(() => []);

    const dbProgress = await prisma.learnerProgress.findMany({
      where: { learnerId: learner.id },
      include: {
        module: {
          include: {
            learningArea: true,
          },
        },
      },
    }).catch(() => []);

    const moduleItemsMap = new Map();
    const existingModuleIds = new Set();

    // 1. Process saved AF2 performance records
    for (const r of filteredRecords) {
      const isMastered = r.assessment === 'Mastered' || r.moduleStatus === 'Mastered';
      const isNotMastered = r.assessment === 'Not Mastered' || r.moduleStatus === 'Not Mastered';

      let status = 'Not Recorded';
      if (isMastered) {
        status = 'Mastered';
      } else if (isNotMastered) {
        status = 'Not Mastered';
      } else {
        const hasDueDate = r.dueDate && !isNaN(new Date(r.dueDate).getTime());
        const isOverdue = hasDueDate && new Date(r.dueDate) < new Date();
        const hasStarted = Boolean(r.dateStarted || (r.preTestScore != null && r.preTestScore !== '') || (r.moduleStatus && r.moduleStatus.toLowerCase().includes('progress')));

        if (isOverdue) {
          status = 'Overdue';
        } else if (hasStarted) {
          status = 'In Progress';
        } else {
          status = 'Not Recorded';
        }
      }

      const preScore = r.preTestScore != null && r.preTestScore !== '' ? Number(r.preTestScore) : null;
      const preMax = r.preTestTotal != null && r.preTestTotal !== '' ? Number(r.preTestTotal) : (preScore != null ? 10 : null);
      const prePct = preScore != null && preMax > 0 ? Math.round((preScore / preMax) * 100) : null;

      const postScore = r.postTestScore != null && r.postTestScore !== '' ? Number(r.postTestScore) : null;
      const postMax = r.postTestTotal != null && r.postTestTotal !== '' ? Number(r.postTestTotal) : (postScore != null ? 10 : null);
      const postPct = postScore != null && postMax > 0 ? Math.round((postScore / postMax) * 100) : null;

      const matchedMod = r.moduleId ? moduleMap.get(Number(r.moduleId)) : null;
      const realCode = r.moduleCode || matchedMod?.code || '';
      const mId = r.moduleId ? Number(r.moduleId) : (r.id || `mod_${moduleItemsMap.size + 1}`);

      existingModuleIds.add(String(mId));
      if (r.moduleTitle) existingModuleIds.add(r.moduleTitle.trim().toLowerCase());

      moduleItemsMap.set(String(mId), {
        id: mId,
        code: realCode,
        title: r.moduleTitle || matchedMod?.title || 'Learning Module',
        strand: r.strandName || matchedMod?.learningArea?.name || 'General',
        status,
        preTest: {
          score: preScore,
          max: preMax,
          percentage: prePct,
        },
        postTest: {
          score: postScore,
          max: postMax,
          percentage: postPct,
          isPassed: isMastered,
        },
        submission: null,
        completedPages: 0,
        totalPages: 0,
        completedAt: r.dateFinished || r.dateCompleted || null,
        dateStarted: r.dateStarted || null,
      });
    }

    // 2. Process database assignments if not already in AF2 records
    for (const assign of dbAssignments) {
      const mod = assign.module;
      if (!mod) continue;
      const keyId = String(mod.id);
      const keyTitle = (mod.title || '').trim().toLowerCase();
      if (existingModuleIds.has(keyId) || existingModuleIds.has(keyTitle)) continue;

      const prog = dbProgress.find((p) => p.moduleId === mod.id);
      let status = 'Not Recorded';
      const isMastered = prog?.masteryStatus === 'MASTERED';
      const isNotMastered = prog?.masteryStatus === 'NOT_MASTERED';

      if (isMastered) {
        status = 'Mastered';
      } else if (isNotMastered) {
        status = 'Not Mastered';
      } else {
        const dueDate = assign.dueDate || mod.dateEnded;
        const hasDueDate = dueDate && !isNaN(new Date(dueDate).getTime());
        const isOverdue = hasDueDate && new Date(dueDate) < new Date();
        const hasStarted = Boolean(prog && (prog.status === 'IN_PROGRESS' || prog.completedPages > 0 || prog.preTestScore != null));

        if (isOverdue) {
          status = 'Overdue';
        } else if (hasStarted) {
          status = 'In Progress';
        } else {
          status = 'Not Recorded';
        }
      }

      const preScore = prog?.preTestScore != null ? Number(prog.preTestScore) : null;
      const postScore = prog?.postTestScore != null ? Number(prog.postTestScore) : null;

      existingModuleIds.add(keyId);
      if (keyTitle) existingModuleIds.add(keyTitle);

      moduleItemsMap.set(keyId, {
        id: mod.id,
        code: mod.code || '',
        title: mod.title,
        strand: mod.learningArea?.name || 'General',
        status,
        preTest: {
          score: preScore,
          max: preScore != null ? 10 : null,
          percentage: preScore != null ? Math.round((preScore / 10) * 100) : null,
        },
        postTest: {
          score: postScore,
          max: postScore != null ? 10 : null,
          percentage: postScore != null ? Math.round((postScore / 10) * 100) : null,
          isPassed: isMastered,
        },
        submission: null,
        completedPages: prog?.completedPages || 0,
        totalPages: prog?.totalPages || 0,
        completedAt: prog?.completedAt || null,
        dateStarted: prog?.createdAt || null,
      });
    }

    const moduleItems = Array.from(moduleItemsMap.values());

    let masteredCount = 0;
    let notMasteredCount = 0;
    let notRecordedCount = 0;
    let inProgressCount = 0;
    let overdueCount = 0;

    for (const m of moduleItems) {
      if (m.status === 'Mastered') masteredCount++;
      else if (m.status === 'Not Mastered') notMasteredCount++;
      else if (m.status === 'Overdue') overdueCount++;
      else if (m.status === 'In Progress') inProgressCount++;
      else notRecordedCount++;
    }

    const recordedCount = masteredCount + notMasteredCount;
    const pendingCount = notRecordedCount + inProgressCount + overdueCount;
    const totalModules = recordedCount + pendingCount;
    const progressPct = totalModules > 0 ? Math.round((recordedCount / totalModules) * 100) : 0;

    res.json({
      learner: {
        id: learner.id,
        lrn: learner.lrn || '',
        firstName: learner.firstName || '',
        middleName: learner.middleName || '',
        lastName: learner.lastName || '',
        fullName: formatLearnerName(learner),
        gender: learner.gender || '—',
        level: formatProgramLevel(learner.level),
        rawLevel: learner.level,
        address: learner.address || '—',
        contactNo: learner.contactNo || '—',
        birthDate: learner.birthDate ? learner.birthDate.toISOString().split('T')[0] : null,
        learningCenter: learner.learningCenter?.name || '—',
        learningCenterCode: learner.learningCenter?.code || '',
        assignedTeacher: learner.assignedTeacher?.fullName || '—',
      },
      summary: {
        recorded: recordedCount,
        mastered: masteredCount,
        notMastered: notMasteredCount,
        pending: pendingCount,
        notRecorded: notRecordedCount,
        inProgress: inProgressCount,
        overdue: overdueCount,
        totalModules,
        progress: progressPct,
      },
      modules: moduleItems,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

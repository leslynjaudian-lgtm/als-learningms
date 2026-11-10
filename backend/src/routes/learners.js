import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';
import { calculateModuleProgress } from '../utils/progressCalculator.js';
import { getLearnerPagesRead, getLearnerReadingState } from '../utils/readingPagesStore.js';
import { notifyNewLearnerRegistered, notifyLearnerAssigned } from '../services/notificationService.js';

const router = Router();

// Helper to format learner name as Last Name, First Name Middle Name
export function formatLearnerName(l) {
  if (!l) return '';
  const first = (l.firstName && l.firstName !== 'null' ? l.firstName : '').trim();
  const middle = (l.middleName && l.middleName !== 'null' && l.middleName !== 'undefined' ? l.middleName : '').trim();
  const last = (l.lastName && l.lastName !== 'null' ? l.lastName : '').trim();

  if (last && first) {
    return middle ? `${last}, ${first} ${middle}` : `${last}, ${first}`;
  }

  if (l.fullName) {
    const raw = l.fullName.trim();
    if (raw.includes(',')) {
      return raw;
    }
    const parts = raw.split(/\s+/);
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[1]}, ${parts[0]}`;
    const lastPart = parts[parts.length - 1];
    const rest = parts.slice(0, parts.length - 1).join(' ');
    return `${lastPart}, ${rest}`;
  }
  return '';
}

function safeIsoDate(val) {
  if (!val) return '';
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

// Helper to format learner record for frontend
function formatLearner(l) {
  const isElementary = l.level === 'ELEMENTARY' || l.level === 'A&E Elementary' || String(l.level || '').toUpperCase().includes('ELEM');
  const normalizedTargetLevel = isElementary ? 'ELEMENTARY' : 'JUNIOR';
  let displayLevel = isElementary ? 'A&E Elementary' : 'A&E Junior High';

  let progress = 0;
  if (Array.isArray(l.progressRecords) && l.progressRecords.length > 0) {
    const total = l.progressRecords.reduce((acc, p) => acc + (p.progressPercentage || p.progress || 0), 0);
    progress = Math.round(total / l.progressRecords.length);
  }

  const formattedName = formatLearnerName(l);

  return {
    id: l.id,
    userId: l.userId,
    username: l.user?.username || '',
    firstName: l.firstName && l.firstName !== 'null' && l.firstName !== 'undefined' ? l.firstName.trim() : '',
    middleName: l.middleName && l.middleName !== 'null' && l.middleName !== 'undefined' ? l.middleName.trim() : '',
    lastName: l.lastName && l.lastName !== 'null' && l.lastName !== 'undefined' ? l.lastName.trim() : '',
    name: formattedName,
    fullName: formattedName,
    lrn: l.lrn || '',
    dob: safeIsoDate(l.birthDate),
    sex: l.gender || '',
    gender: l.gender || '',
    contactNumber: l.contactNo || '',
    address: l.address || '',
    level: displayLevel,
    targetLevel: normalizedTargetLevel,
    rawLevel: l.level,
    learningCenterId: l.learningCenterId,
    learningCenter: l.learningCenter?.name || '—',
    learningCenterDetails: l.learningCenter || null,
    assignedTeacherId: l.assignedTeacherId,
    assignedTeacher: l.assignedTeacher?.fullName || '—',
    teacher: l.assignedTeacher?.fullName || '—',
    teacherDetails: l.assignedTeacher || null,
    progress,
    progressRecords: l.progressRecords || [],
    profilePhoto: l.user?.profilePhoto || null,
    status: l.status || 'Active',
    dateRegistered: safeIsoDate(l.dateRegistered || l.createdAt),
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

// ---------------------
// GET /api/learners/me
// Get current authenticated learner profile
// ---------------------
router.get('/me', authenticate, requireRole('LEARNER'), async (req, res, next) => {
  try {
    const learner = await prisma.learner.findUnique({
      where: { id: req.user.profileId },
      include: {
        user: {
          select: { username: true, email: true, status: true, profilePhoto: true },
        },
        learningCenter: true,
        assignedTeacher: true,
      },
    });

    if (!learner) {
      return res.status(404).json({ error: 'Learner profile not found' });
    }

    const formatted = formatLearner(learner);
    res.json({
      success: true,
      data: formatted,
      ...formatted,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/learners/me/progress
// Get current authenticated learner progress metrics and learning strands
// ---------------------
router.get('/me/progress', authenticate, requireRole(['LEARNER', 'ADMIN', 'TEACHER']), async (req, res, next) => {
  try {
    let learnerId = req.user.role === 'LEARNER' ? req.user.profileId : null;
    if (!learnerId && req.query.learnerId) {
      learnerId = parseInt(req.query.learnerId, 10);
    }
    if (!learnerId && req.user.learnerProfile?.id) {
      learnerId = req.user.learnerProfile.id;
    }

    if (!learnerId) {
      return res.status(400).json({ error: 'Learner profile ID not specified or found' });
    }

    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      select: {
        id: true,
        level: true,
        learningCenterId: true,
      },
    });

    if (!learner) {
      return res.status(404).json({ error: 'Learner profile not found' });
    }

    // Retrieve actual registered Learning Areas from the database
    const dbAreas = await prisma.learningArea.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    const fallbackAreas = [
      { id: 1, code: 'LS1', name: 'Communication Skills (English)', status: 'Active' },
      { id: 2, code: 'LS1', name: 'Communication Skills (Filipino)', status: 'Active' },
      { id: 3, code: 'LS2', name: 'Scientific & Critical Thinking Skills', status: 'Active' },
      { id: 4, code: 'LS3', name: 'Mathematical & Problem Solving Skills', status: 'Active' },
      { id: 5, code: 'LS4', name: 'Life & Career Skills', status: 'Active' },
      { id: 6, code: 'LS5', name: 'Understanding Self & Society', status: 'Active' },
      { id: 7, code: 'LS6', name: 'Digital Citizenship', status: 'Active' },
    ];

    const sourceAreas = Array.isArray(dbAreas) && dbAreas.length > 0
      ? dbAreas.filter((a) => String(a.status || 'Active').trim().toLowerCase() !== 'inactive')
      : fallbackAreas;

    const OFFICIAL_STRANDS = sourceAreas.map((area) => {
      const code = String(area.code || '').trim();
      return {
        id: area.id,
        key: String(area.id),
        code,
        name: code ? `${code} · ${area.name}` : area.name,
        rawName: area.name,
        match: (mod) => {
          if (mod.learningAreaId && Number(mod.learningAreaId) === Number(area.id)) return true;
          const lowerName = String(area.name || '').trim().toLowerCase();
          const modAreaName = String(mod.learningArea?.name || '').trim().toLowerCase();
          return Boolean(lowerName && modAreaName && modAreaName === lowerName);
        },
      };
    });

    if (!learner.learningCenterId) {
      return res.json({
        success: true,
        data: {
          overallProgress: 0,
          modulesCompleted: 0,
          totalModules: 0,
          assessmentsTaken: 0,
          totalAssessments: 0,
          strands: OFFICIAL_STRANDS.map((s) => ({
            code: s.code,
            name: s.name,
            progress: 0,
            modulesCompleted: 0,
            totalModules: 0,
          })),
        },
      });
    }

    // Scoped assigned modules for this learner
    const modules = await prisma.module.findMany({
      where: {
        status: 'PUBLISHED',
        learningCenterId: learner.learningCenterId,
        targetLevel: learner.level,
        code: { not: 'LS2-MOCK-001' },
        AND: [
          {
            OR: [
              { assignments: { none: {} } },
              { assignments: { some: { learnerId: learner.id } } },
            ],
          },
        ],
      },
      include: {
        learningArea: true,
        assessments: {
          include: {
            questions: { select: { id: true } },
            attempts: {
              where: {
                learnerId: learner.id,
                status: 'SUBMITTED',
              },
            },
          },
        },
        learnerProgress: {
          where: {
            learnerId: learner.id,
          },
        },
        submissions: {
          where: {
            learnerId: learner.id,
          },
          select: { id: true, status: true, submittedAt: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    let completedModulesCount = 0;
    let totalProgressSum = 0;
    let totalAssessments = 0;
    let assessmentsTaken = 0;

    const strandMap = {};
    for (const s of OFFICIAL_STRANDS) {
      strandMap[s.key] = {
        code: s.code,
        name: s.name,
        modulesCompleted: 0,
        totalModules: 0,
        progressSum: 0,
        progress: 0,
      };
    }

    for (const m of modules) {
      const prog = Array.isArray(m.learnerProgress) && m.learnerProgress.length > 0 ? m.learnerProgress[0] : null;
      const attempts = (m.assessments || []).flatMap((a) => a.attempts || []);
      const submissions = m.submissions || [];
      const readingState = getLearnerReadingState(learner.id, m.id);
      const storedPages = readingState.pagesRead;
      const highestStored = readingState.highestPageReached || (storedPages && storedPages.length > 0 ? Math.max(...storedPages.map(Number).filter((n) => n > 0)) : 0);
      const safeCompletedPages = highestStored > 0 ? highestStored : (prog?.completedPages || 0);
      const curPage = readingState.currentPage || (safeCompletedPages > 0 ? safeCompletedPages : 1);

      const calc = calculateModuleProgress({
        module: m,
        learnerProgress: prog
          ? { ...prog, completedPages: safeCompletedPages, currentPage: curPage }
          : (safeCompletedPages > 0 ? { completedPages: safeCompletedPages, currentPage: curPage } : null),
        attempts,
        submissions,
        currentPage: curPage,
      });

      if (calc.completed) {
        completedModulesCount++;
      }
      totalProgressSum += calc.progress;

      // Assessments count
      if (Array.isArray(m.assessments)) {
        for (const ass of m.assessments) {
          totalAssessments++;
          const hasAttempt = Array.isArray(ass.attempts) && ass.attempts.length > 0;
          const hasScoreInProg =
            (ass.type === 'PRE_TEST' && prog?.preTestScore != null) ||
            (ass.type === 'POST_TEST' && prog?.postTestScore != null);

          if (hasAttempt || hasScoreInProg) {
            assessmentsTaken++;
          }
        }
      }

      // Match strand by Learning Area database ID
      let matchedKey = null;
      for (const s of OFFICIAL_STRANDS) {
        if (s.match(m)) {
          matchedKey = s.key;
          break;
        }
      }

      if (matchedKey && strandMap[matchedKey]) {
        strandMap[matchedKey].totalModules++;
        strandMap[matchedKey].progressSum += calc.progress;
        if (calc.completed) {
          strandMap[matchedKey].modulesCompleted++;
        }
      }
    }

    const strands = OFFICIAL_STRANDS.map((s) => {
      const item = strandMap[s.key];
      const prog = item.totalModules > 0
        ? (item.modulesCompleted === item.totalModules
            ? 100
            : Math.round(item.progressSum / item.totalModules))
        : 0;
      return {
        code: item.code,
        name: item.name,
        modulesCompleted: item.modulesCompleted,
        totalModules: item.totalModules,
        progress: prog,
      };
    });

    const totalModules = modules.length;
    const overallProgress = totalModules > 0
      ? (completedModulesCount === totalModules
          ? 100
          : Math.round(totalProgressSum / totalModules))
      : 0;

    res.json({
      success: true,
      data: {
        overallProgress,
        modulesCompleted: completedModulesCount,
        totalModules,
        assessmentsTaken,
        totalAssessments,
        strands,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/learners
// List learners with strict backend role-scoping
// ---------------------
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { teacherId, learningCenterId, level } = req.query;
    const where = {};
    let teacherSpecialization = null;

    // 1. Role Scoping:
    // If authenticated as TEACHER, enforce that teacher ONLY sees their assigned learners!
    if (req.user && req.user.role === 'TEACHER') {
      const currentTeacherId = req.user.profileId;
      const currentUserId = req.user.userId || req.user.id;
      if (teacherId) {
        const requestedTid = parseInt(teacherId, 10);
        if (!isNaN(requestedTid) && requestedTid !== currentTeacherId && requestedTid !== currentUserId) {
          return res.status(403).json({
            error: 'Access denied. You cannot view learners assigned to another teacher.',
          });
        }
      }
      const teacherProfile = req.user.teacherProfile;
      teacherSpecialization = teacherProfile?.specialization || 'Both';
      const teacherCenterId = teacherProfile?.learningCenterId;

      where.OR = [
        { assignedTeacherId: currentTeacherId },
      ];

      if (teacherCenterId) {
        where.OR.push({
          learningCenterId: teacherCenterId,
          assignedTeacherId: null,
        });
      }
    } else if (req.user && req.user.role === 'LEARNER') {
      where.id = req.user.profileId;
    } else if (teacherId) {
      const tid = parseInt(teacherId, 10);
      if (isNaN(tid)) {
        return res.status(400).json({ error: 'Invalid teacher ID' });
      }
      const resolvedTeacher = await prisma.teacher.findFirst({
        where: {
          OR: [{ id: tid }, { userId: tid }],
        },
        select: { id: true, specialization: true, learningCenterId: true },
      });
      if (!resolvedTeacher) {
        return res.json([]);
      }
      teacherSpecialization = resolvedTeacher.specialization || 'Both';
      where.OR = [{ assignedTeacherId: resolvedTeacher.id }];
      if (resolvedTeacher.learningCenterId) {
        where.OR.push({
          learningCenterId: resolvedTeacher.learningCenterId,
          assignedTeacherId: null,
        });
      }
    } else if (req.query.portal === 'teacher') {
      return res.json([]);
    }

    const centerFilter = learningCenterId || req.query.learningCenter || req.query.learningCenterName;
    if (centerFilter && centerFilter !== 'All' && centerFilter !== 'All Learning Centers') {
      const trimmedCenter = String(centerFilter).trim();
      if (/^\d+$/.test(trimmedCenter)) {
        where.learningCenterId = parseInt(trimmedCenter, 10);
      } else {
        where.learningCenter = { name: trimmedCenter };
      }
    }

    if (level && level !== 'All' && level !== 'All ALS Levels' && level !== 'All Program Levels') {
      const lvlUpper = String(level).toUpperCase();
      if (lvlUpper === 'ELEMENTARY' || lvlUpper === 'A&E ELEMENTARY' || lvlUpper.includes('ELEM')) {
        where.level = 'ELEMENTARY';
      } else if (lvlUpper === 'JUNIOR' || lvlUpper === 'A&E JUNIOR' || lvlUpper === 'A&E JUNIOR HIGH' || lvlUpper.includes('JUN') || lvlUpper.includes('SEC')) {
        where.level = 'JUNIOR';
      }
    }

    // Role-based ALS Level authorization enforcement for teachers
    if (teacherSpecialization) {
      const spec = String(teacherSpecialization).toLowerCase().trim();
      const allowsElem = spec.includes('elem') || spec.includes('both');
      const allowsJhs = spec.includes('junior') || spec.includes('jhs') || spec.includes('sec') || spec.includes('both');

      if (!allowsElem && !allowsJhs) {
        return res.json([]);
      }

      if (allowsElem && !allowsJhs) {
        if (where.level && where.level !== 'ELEMENTARY') {
          return res.json([]);
        }
        where.level = 'ELEMENTARY';
      } else if (allowsJhs && !allowsElem) {
        if (where.level && where.level !== 'JUNIOR') {
          return res.json([]);
        }
        where.level = 'JUNIOR';
      }
    }

    const learners = await prisma.learner.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            email: true,
            status: true,
            profilePhoto: true,
          },
        },
        learningCenter: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignedTeacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
        progressRecords: true,
      },
      orderBy: { fullName: 'asc' },
    });

    res.json(learners.map(formatLearner));
  } catch (err) {
    console.error('Error fetching learners in GET /api/learners:', err);
    res.status(500).json({ error: 'Failed to retrieve learners. Please try again.' });
  }
});

// ---------------------
// GET /api/learners/:id
// Get a single learner
// ---------------------
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid learner ID' });
    }

    const learner = await prisma.learner.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            status: true,
            profilePhoto: true,
          },
        },
        learningCenter: true,
        assignedTeacher: true,
      },
    });

    if (!learner) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    // Role security check: Teacher can only inspect their own learner
    if (req.user && req.user.role === 'TEACHER' && learner.assignedTeacherId !== req.user.profileId) {
      return res.status(403).json({
        error: 'Access denied. You cannot view learners assigned to another teacher.',
      });
    }

    // Learner can only inspect their own record
    if (req.user && req.user.role === 'LEARNER' && learner.id !== req.user.profileId) {
      return res.status(403).json({
        error: 'Access denied. You cannot view other learners.',
      });
    }

    res.json(formatLearner(learner));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/learners
// Register a new learner
// ---------------------
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    let {
      lrn,
      fullName,
      firstName,
      middleName,
      lastName,
      dob,
      sex,
      contactNumber,
      phone,
      address,
      learningCenterId,
      assignedTeacherId,
      level,
      programLevel,
      status,
      dateRegistered,
      username: customUsername,
      password: customPassword,
    } = req.body;

    if (!firstName && fullName) {
      const parts = fullName.trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || parts[0];
    }

    if (!contactNumber && phone) {
      contactNumber = phone;
    }

    if (!level && programLevel) {
      level = programLevel;
    }

    if (!dob) {
      dob = '2005-01-01';
    }

    if (!sex) {
      sex = 'Male';
    }

    // 1. Validate required fields
    if (!firstName?.trim()) {
      return res.status(400).json({ error: 'First name is required' });
    }
    if (!lastName?.trim()) {
      return res.status(400).json({ error: 'Last name is required' });
    }
    if (!learningCenterId) {
      return res.status(400).json({ error: 'Learning center is required' });
    }
    if (!level) {
      return res.status(400).json({ error: 'ALS level is required' });
    }

    // 2. Validate and map Learning Center
    const parsedCenterId = parseInt(learningCenterId, 10);
    if (isNaN(parsedCenterId)) {
      return res.status(400).json({ error: 'Invalid learning center ID' });
    }

    const centerExists = await prisma.learningCenter.findUnique({
      where: { id: parsedCenterId },
    });
    if (!centerExists) {
      return res.status(404).json({ error: 'Selected learning center does not exist' });
    }

    // 3. Validate Assigned Teacher (if provided)
    let parsedTeacherId = null;
    if (assignedTeacherId) {
      parsedTeacherId = parseInt(assignedTeacherId, 10);
      if (!isNaN(parsedTeacherId)) {
        const teacherExists = await prisma.teacher.findUnique({
          where: { id: parsedTeacherId },
        });
        if (!teacherExists) {
          return res.status(404).json({ error: 'Selected assigned teacher does not exist' });
        }
      }
    }

    // 4. Map ALS Level to enum (AlsLevel: ELEMENTARY | JUNIOR)
    let alsLevel = 'JUNIOR';
    const normLevel = (level || '').toLowerCase();
    if (normLevel.includes('elem')) {
      alsLevel = 'ELEMENTARY';
    } else if (normLevel.includes('jun') || normLevel.includes('sec') || normLevel.includes('high')) {
      alsLevel = 'JUNIOR';
    } else {
      alsLevel = 'JUNIOR';
    }

    const cleanFirst = firstName.trim();
    const cleanMiddle = middleName && middleName.trim() ? middleName.trim() : null;
    const cleanLast = lastName.trim();

    // Standardized Official Format: Last Name, First Name Middle Name (e.g. Santos, Gabriel Cruz)
    fullName = cleanMiddle ? `${cleanLast}, ${cleanFirst} ${cleanMiddle}` : `${cleanLast}, ${cleanFirst}`;
    const learnerStatus = status || 'Active';
    const trimmedLrn = lrn && lrn.trim() ? lrn.trim() : null;

    // Check if LRN already exists if provided (LRN identifies an individual learner)
    if (trimmedLrn) {
      const existingLrn = await prisma.learner.findUnique({
        where: { lrn: trimmedLrn },
      });
      if (existingLrn) {
        return res.status(409).json({ error: `LRN "${trimmedLrn}" is already registered to another learner.` });
      }
    }

    // 5. Account credentials - ensure unique username in User table
    // (Names are not unique; multiple learners can share identical names)
    let baseUsername = customUsername && customUsername.trim() ? customUsername.trim() : fullName;
    let finalUsername = baseUsername;
    let counter = 1;
    while (await prisma.user.findFirst({ where: { username: finalUsername } })) {
      counter++;
      if (trimmedLrn) {
        finalUsername = `${baseUsername} (${trimmedLrn})`;
        if (await prisma.user.findFirst({ where: { username: finalUsername } })) {
          finalUsername = `${baseUsername} (${counter})`;
        }
      } else {
        finalUsername = `${baseUsername} (${counter})`;
      }
      finalUsername = finalUsername.slice(0, 100);
    }

    // Use customPassword if provided; otherwise generate a secure random password (learners log in passwordlessly via full name)
    const rawPassword = customPassword && customPassword.trim() ? customPassword.trim() : crypto.randomUUID();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 6. Atomic transaction: create User + Learner
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: finalUsername,
          passwordHash,
          role: 'LEARNER',
          status: (learnerStatus || '').toLowerCase() === 'active' ? 'ACTIVE' : 'INACTIVE',
        },
      });

      const newLearner = await tx.learner.create({
        data: {
          userId: newUser.id,
          lrn: trimmedLrn,
          fullName,
          firstName: cleanFirst,
          middleName: cleanMiddle,
          lastName: cleanLast,
          birthDate: new Date(dob),
          gender: sex,
          address: address?.trim() || null,
          contactNo: contactNumber?.trim() || null,
          level: alsLevel,
          learningCenterId: parsedCenterId,
          assignedTeacherId: parsedTeacherId,
          status: learnerStatus,
          createdAt: dateRegistered ? new Date(dateRegistered) : new Date(),
        },
        include: {
          user: {
            select: {
              username: true,
              status: true,
              profilePhoto: true,
            },
          },
          learningCenter: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          assignedTeacher: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      return newLearner;
    });

    // Notify District Coordinator (Admin) if a teacher registered the learner
    const isTeacher = req.user?.role === 'TEACHER' || req.body?.createdByRole === 'TEACHER';
    if (isTeacher) {
      notifyNewLearnerRegistered({
        learner: result,
        teacherId: req.user?.teacherProfile?.id || parsedTeacherId,
        teacherName: req.user?.teacherProfile?.fullName || req.user?.username,
      }).catch((e) => console.error('[Learners] notifyNewLearnerRegistered error:', e));
    }

    // Notify the assigned teacher if a teacher was assigned to the new learner
    if (parsedTeacherId) {
      notifyLearnerAssigned({
        learnerId: result.id,
        teacherId: parsedTeacherId,
        assignedByName: req.user?.adminProfile?.fullName || 'District Coordinator',
      }).catch((e) => console.error('[Learners] notifyLearnerAssigned error:', e));
    }

    res.status(201).json(formatLearner(result));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A learner with this LRN or username already exists.' });
    }
    next(err);
  }
});

// ---------------------
// PUT /api/learners/:id
// Update a learner (Admin only)
// ---------------------
router.put('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid learner ID' });
    }

    const {
      firstName,
      middleName,
      lastName,
      lrn,
      dob,
      sex,
      contactNumber,
      address,
      learningCenterId,
      assignedTeacherId,
      level,
      status,
    } = req.body;

    const existing = await prisma.learner.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    const updateData = {};

    const newFirst = firstName !== undefined ? firstName.trim() : (existing.firstName || '');
    const newMiddle = middleName !== undefined ? (middleName ? middleName.trim() : null) : (existing.middleName || null);
    const newLast = lastName !== undefined ? lastName.trim() : (existing.lastName || '');

    if (firstName !== undefined) updateData.firstName = newFirst;
    if (middleName !== undefined) updateData.middleName = newMiddle;
    if (lastName !== undefined) updateData.lastName = newLast;

    if (newFirst && newLast) {
      updateData.fullName = newMiddle ? `${newLast}, ${newFirst} ${newMiddle}` : `${newLast}, ${newFirst}`;
    }

    if (lrn !== undefined) {
      const newLrn = lrn ? lrn.trim() : null;
      if (newLrn && newLrn !== existing.lrn) {
        const existingLrn = await prisma.learner.findUnique({
          where: { lrn: newLrn },
        });
        if (existingLrn && existingLrn.id !== id) {
          return res.status(409).json({ error: `LRN "${newLrn}" is already registered to another learner.` });
        }
      }
      updateData.lrn = newLrn;
    }
    if (dob) updateData.birthDate = new Date(dob);
    if (sex) updateData.gender = sex;
    if (contactNumber !== undefined) updateData.contactNo = contactNumber ? contactNumber.trim() : null;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (learningCenterId) updateData.learningCenterId = parseInt(learningCenterId, 10);

    if (assignedTeacherId !== undefined) {
      updateData.assignedTeacherId = assignedTeacherId ? parseInt(assignedTeacherId, 10) : null;
    }

    if (level) {
      if (level === 'ELEMENTARY' || level === 'A&E Elementary') {
        updateData.level = 'ELEMENTARY';
      } else if (level === 'JUNIOR' || level === 'A&E Junior' || level === 'A&E Junior High' || String(level).toUpperCase().includes('JUN')) {
        updateData.level = 'JUNIOR';
      }
    }

    if (status) {
      updateData.status = status;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (existing.userId) {
        const userUpdateData = {};
        if (status) {
          userUpdateData.status = (status || '').toLowerCase() === 'active' ? 'ACTIVE' : 'INACTIVE';
        }
        if (updateData.fullName) {
          let newUsername = updateData.fullName;
          let counter = 1;
          while (await tx.user.findFirst({ where: { username: newUsername, NOT: { id: existing.userId } } })) {
            counter++;
            newUsername = `${updateData.fullName} (${counter})`.slice(0, 100);
          }
          userUpdateData.username = newUsername;
        }
        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: existing.userId },
            data: userUpdateData,
          });
        }
      }

      return tx.learner.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: { username: true, email: true, status: true, profilePhoto: true },
          },
          learningCenter: true,
          assignedTeacher: true,
        },
      });
    });

    // Notify assigned teacher if teacher assignment was changed
    if (
      updateData.assignedTeacherId &&
      updateData.assignedTeacherId !== existing.assignedTeacherId
    ) {
      notifyLearnerAssigned({
        learnerId: id,
        teacherId: updateData.assignedTeacherId,
        assignedByName: req.user?.adminProfile?.fullName || 'District Coordinator',
      }).catch((e) => console.error('[Learners] notifyLearnerAssigned error:', e));
    }

    res.json(formatLearner(updated));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// DELETE /api/learners/:id
// Delete a learner
// ---------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid learner ID' });
    }

    const learner = await prisma.learner.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!learner) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete attempts & answers
      const attempts = await tx.assessmentAttempt.findMany({
        where: { learnerId: id },
        select: { id: true },
      });
      const attemptIds = attempts.map((a) => a.id);
      if (attemptIds.length > 0) {
        await tx.learnerAnswer.deleteMany({
          where: { attemptId: { in: attemptIds } },
        });
        await tx.assessmentAttempt.deleteMany({
          where: { id: { in: attemptIds } },
        });
      }

      // 2. Delete submissions, assignments, progress, attendance
      await tx.submission.deleteMany({ where: { learnerId: id } });
      await tx.moduleAssignment.deleteMany({ where: { learnerId: id } });
      await tx.learnerProgress.deleteMany({ where: { learnerId: id } });
      await tx.attendance.deleteMany({ where: { learnerId: id } });

      // 3. Delete learner profile
      await tx.learner.delete({ where: { id } });

      // 4. Delete user account
      if (learner.userId) {
        await tx.user.delete({ where: { id: learner.userId } });
      }
    });

    res.status(200).json({ success: true, message: 'Learner deleted successfully' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Learner not found' });
    }
    next(err);
  }
});

export default router;

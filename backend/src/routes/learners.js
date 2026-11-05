import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';

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

// Helper to format learner record for frontend
function formatLearner(l) {
  let displayLevel = l.level;
  if (l.level === 'ELEMENTARY' || l.level === 'A&E Elementary') displayLevel = 'A&E Elementary';
  else if (l.level === 'JUNIOR' || l.level === 'LOWER_SECONDARY' || l.level === 'A&E Junior' || l.level === 'A&E Junior High' || String(l.level || '').toUpperCase().includes('JUN')) displayLevel = 'A&E Junior High';
  else displayLevel = l.level;

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
    firstName: l.firstName && l.firstName !== 'null' ? l.firstName : '',
    middleName: l.middleName && l.middleName !== 'null' ? l.middleName : '',
    lastName: l.lastName && l.lastName !== 'null' ? l.lastName : '',
    name: formattedName,
    fullName: formattedName,
    lrn: l.lrn || '',
    dob: l.birthDate ? l.birthDate.toISOString().split('T')[0] : '',
    sex: l.gender || '',
    gender: l.gender || '',
    contactNumber: l.contactNo || '',
    address: l.address || '',
    level: displayLevel,
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
    dateRegistered: l.createdAt ? l.createdAt.toISOString().split('T')[0] : '',
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

    const OFFICIAL_STRANDS = [
      {
        key: 'LS1-ENG',
        code: 'LS1-ENG',
        name: 'LS1 — Communication Skills (English)',
        match: (areaCode, text) => {
          if (areaCode === 'LS1-ENG' || areaCode.includes('ENG')) return true;
          if (text.includes('english') && (text.includes('ls1') || text.includes('communication'))) return true;
          return false;
        },
      },
      {
        key: 'LS1-FIL',
        code: 'LS1-FIL',
        name: 'LS1 — Communication Skills (Filipino)',
        match: (areaCode, text) => {
          if (areaCode === 'LS1-FIL' || areaCode.includes('FIL')) return true;
          if (text.includes('filipino') && (text.includes('ls1') || text.includes('communication'))) return true;
          return false;
        },
      },
      {
        key: 'LS2-SCI',
        code: 'LS2',
        name: 'LS2 — Scientific Literacy and Critical Thinking Skills',
        match: (areaCode, text) => {
          if (areaCode === 'LS2-SCI' || areaCode === 'LS2' || areaCode.startsWith('LS2')) return true;
          if (text.includes('scientific') || text.includes('science')) return true;
          return false;
        },
      },
      {
        key: 'LS3-MATH',
        code: 'LS3',
        name: 'LS3 — Mathematical and Problem Solving Skills',
        match: (areaCode, text) => {
          if (areaCode === 'LS3-MATH' || areaCode === 'LS3' || areaCode.startsWith('LS3')) return true;
          if (text.includes('math') || text.includes('mathematical')) return true;
          return false;
        },
      },
      {
        key: 'LS4-LIFE',
        code: 'LS4',
        name: 'LS4 — Life and Career Skills',
        match: (areaCode, text) => {
          if (areaCode === 'LS4-LIFE' || areaCode === 'LS4' || areaCode.startsWith('LS4')) return true;
          if (text.includes('life and career') || text.includes('life & career')) return true;
          return false;
        },
      },
      {
        key: 'LS5-SOC',
        code: 'LS5',
        name: 'LS5 — Understanding the Self and Society',
        match: (areaCode, text) => {
          if (areaCode === 'LS5-SOC' || areaCode === 'LS5' || areaCode.startsWith('LS5')) return true;
          if (text.includes('self and society') || text.includes('self & society') || text.includes('understanding self')) return true;
          return false;
        },
      },
      {
        key: 'LS6-DIGI',
        code: 'LS6',
        name: 'LS6 — Digital Citizenship',
        match: (areaCode, text) => {
          if (areaCode === 'LS6-DIGI' || areaCode === 'LS6' || areaCode.startsWith('LS6')) return true;
          if (text.includes('digital')) return true;
          return false;
        },
      },
    ];

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
      },
      orderBy: { id: 'asc' },
    });

    let completedModulesCount = 0;
    let totalAssessments = 0;
    let assessmentsTaken = 0;

    const strandMap = {};
    for (const s of OFFICIAL_STRANDS) {
      strandMap[s.key] = {
        code: s.code,
        name: s.name,
        modulesCompleted: 0,
        totalModules: 0,
        progress: 0,
      };
    }

    for (const m of modules) {
      const prog = Array.isArray(m.learnerProgress) && m.learnerProgress.length > 0 ? m.learnerProgress[0] : null;
      const isCompleted =
        prog?.status === 'COMPLETED' ||
        prog?.masteryStatus === 'MASTERED' ||
        (prog?.totalPages > 0 && (prog?.completedPages || 0) >= prog.totalPages && prog?.postTestScore != null);

      if (isCompleted) {
        completedModulesCount++;
      }

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

      // Match strand
      const areaCode = (m.learningArea?.code || m.code || '').toUpperCase().trim();
      const fullText = [
        m.learningArea?.code || '',
        m.learningArea?.name || '',
        m.code || '',
        m.title || '',
        m.description || '',
      ].join(' ').toLowerCase();

      let matchedKey = null;
      for (const s of OFFICIAL_STRANDS) {
        if (s.match(areaCode, fullText)) {
          matchedKey = s.key;
          break;
        }
      }

      // Fallback for generic LS1
      if (!matchedKey && (areaCode === 'LS1' || areaCode.startsWith('LS1'))) {
        matchedKey = 'LS1-ENG';
      }

      if (matchedKey && strandMap[matchedKey]) {
        strandMap[matchedKey].totalModules++;
        if (isCompleted) {
          strandMap[matchedKey].modulesCompleted++;
        }
      }
    }

    const strands = OFFICIAL_STRANDS.map((s) => {
      const item = strandMap[s.key];
      const prog = item.totalModules > 0
        ? Math.round((item.modulesCompleted / item.totalModules) * 100)
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
      ? Math.round((completedModulesCount / totalModules) * 100)
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

    // 1. Role Scoping:
    // If authenticated as TEACHER, enforce that teacher ONLY sees their assigned learners!
    if (req.user && req.user.role === 'TEACHER') {
      if (teacherId && parseInt(teacherId, 10) !== req.user.profileId) {
        return res.status(403).json({
          error: 'Access denied. You cannot view learners assigned to another teacher.',
        });
      }
      where.assignedTeacherId = req.user.profileId;
    } else if (req.user && req.user.role === 'LEARNER') {
      where.id = req.user.profileId;
    } else if (teacherId) {
      const tid = parseInt(teacherId, 10);
      if (!isNaN(tid)) {
        where.assignedTeacherId = tid;
      }
    } else if (req.query.portal === 'teacher') {
      return res.json([]);
    }

    const centerFilter = learningCenterId || req.query.learningCenter || req.query.learningCenterName;
    if (centerFilter) {
      const cid = parseInt(centerFilter, 10);
      if (!isNaN(cid)) {
        where.learningCenterId = cid;
      } else {
        where.learningCenter = { name: String(centerFilter).trim() };
      }
    }

    if (level) {
      const lvlUpper = String(level).toUpperCase();
      if (lvlUpper === 'ELEMENTARY' || lvlUpper === 'A&E ELEMENTARY' || lvlUpper.includes('ELEM')) {
        where.level = 'ELEMENTARY';
      } else if (lvlUpper === 'JUNIOR' || lvlUpper === 'A&E JUNIOR' || lvlUpper === 'A&E JUNIOR HIGH' || lvlUpper.includes('JUN') || lvlUpper.includes('SEC')) {
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
    next(err);
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
// Register a new learner (Admin only)
// ---------------------
router.post('/', async (req, res, next) => {
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

    const rawPassword = customPassword && customPassword.trim() ? customPassword.trim() : (trimmedLrn || fullName);
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
router.put('/:id', async (req, res, next) => {
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

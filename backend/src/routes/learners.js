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
  if (l.level === 'ELEMENTARY') displayLevel = 'A&E Elementary';
  else if (l.level === 'JUNIOR' || l.level === 'LOWER_SECONDARY') displayLevel = 'A&E Junior';
  else if (l.level === 'A&E Elementary' || l.level === 'A&E Junior') displayLevel = l.level;

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

    if (learningCenterId) {
      const cid = parseInt(learningCenterId, 10);
      if (!isNaN(cid)) {
        where.learningCenterId = cid;
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
      return res.status(400).json({ error: 'Program level is required' });
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

    // 4. Map Program Level to enum (AlsLevel: ELEMENTARY | JUNIOR)
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

    // Prevent duplicate learner names
    const existingLearner = await prisma.learner.findFirst({
      where: {
        OR: [
          { fullName: { equals: fullName } },
          {
            AND: [
              { firstName: { equals: cleanFirst } },
              { lastName: { equals: cleanLast } },
            ],
          },
        ],
      },
    });
    if (existingLearner) {
      return res.status(409).json({
        error: `A learner with the name "${fullName}" is already registered. Duplicate learner names are not allowed.`,
      });
    }

    // Check if LRN already exists if provided
    if (trimmedLrn) {
      const existingLrn = await prisma.learner.findUnique({
        where: { lrn: trimmedLrn },
      });
      if (existingLrn) {
        return res.status(409).json({ error: `LRN "${trimmedLrn}" is already registered to another learner.` });
      }
    }

    // 5. Account credentials - exact Full Name is the Login Username!
    const username = fullName;

    // Check username collision in User table
    const existingUser = await prisma.user.findFirst({
      where: { username: { equals: username } },
    });
    if (existingUser) {
      return res.status(409).json({
        error: `A user account with the username "${username}" already exists.`,
      });
    }

    const rawPassword = customPassword && customPassword.trim() ? customPassword.trim() : username;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 6. Atomic transaction: create User + Learner
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
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

    if (lrn !== undefined) updateData.lrn = lrn ? lrn.trim() : null;
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
      } else if (level === 'JUNIOR' || level === 'A&E Junior') {
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
          userUpdateData.username = updateData.fullName;
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

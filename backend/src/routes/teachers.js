import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { signToken } from '../config/jwt.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Helper to format teacher record for frontend
function formatTeacher(t) {
  const primaryCenter = t.learningCenter
    ? {
        id: t.learningCenter.id,
        name: t.learningCenter.name,
        code: t.learningCenter.code || '',
        slug: (t.learningCenter.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        location:
          t.learningCenter.locationAddress ||
          `${t.learningCenter.municipality || 'Naawan'}, ${t.learningCenter.province || 'Misamis Oriental'}`,
      }
    : null;

  const centers = [];
  if (primaryCenter) centers.push(primaryCenter);

  if (Array.isArray(t.assignedLearners)) {
    for (const lrn of t.assignedLearners) {
      if (lrn.learningCenter && !centers.some((c) => c.id === lrn.learningCenter.id)) {
        centers.push({
          id: lrn.learningCenter.id,
          name: lrn.learningCenter.name,
          code: lrn.learningCenter.code || '',
          slug: (lrn.learningCenter.name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          location:
            lrn.learningCenter.locationAddress ||
            `${lrn.learningCenter.municipality || 'Naawan'}, ${lrn.learningCenter.province || 'Misamis Oriental'}`,
        });
      }
    }
  }

  return {
    id: t.id,
    teacherId: t.id,
    userId: t.userId,
    name: t.fullName,
    fullName: t.fullName,
    position: t.position || 'ALS Teacher',
    contactNumber: t.contactNo || '',
    contactNo: t.contactNo || '',
    email: t.user?.email || '',
    username: t.user?.username || '',
    profilePhoto: t.user?.profilePhoto || null,
    learningCenterId: t.learningCenterId,
    learningCenter: t.learningCenter?.name || '—',
    learningCenterDetails: primaryCenter,
    learningCenters: centers,
    programLevel: t.specialization || 'Both',
    specialization: t.specialization || 'Both',
    status: t.status || 'Active',
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

// ---------------------
// POST /api/teachers/login
// Authenticate teacher
// ---------------------
router.post('/login', async (req, res, next) => {
  try {
    const rawId = (
      req.body.username ||
      req.body.teacherId ||
      req.body.teacherID ||
      req.body.userName ||
      req.body.identifier ||
      ''
    ).trim();
    const rawPassword = req.body.password || req.body.passWord || '';

    if (!rawId || !rawPassword) {
      return res.status(400).json({ error: 'Teacher ID/username and password are required' });
    }

    const trimmedIdentifier = rawId.toLowerCase();

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmedIdentifier },
          { email: trimmedIdentifier },
          { teacherProfile: { fullName: rawId } },
          { teacherProfile: { teacherIdNumber: rawId } },
        ],
      },
      include: {
        teacherProfile: {
          include: {
            learningCenter: true,
            assignedLearners: {
              include: {
                learningCenter: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.role !== 'TEACHER' || !user.teacherProfile) {
      return res.status(401).json({ error: 'Invalid teacher ID/username or password' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Your teacher account is inactive. Please contact the ALS administrator.' });
    }

    let isMatch = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!isMatch && rawPassword.trim() !== rawPassword) {
      isMatch = await bcrypt.compare(rawPassword.trim(), user.passwordHash);
    }
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid teacher ID/username or password' });
    }

    const teacherData = {
      ...user.teacherProfile,
      user: {
        username: user.username,
        email: user.email,
        status: user.status,
        profilePhoto: user.profilePhoto || null,
      },
    };

    const formatted = formatTeacher(teacherData);
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      profileId: user.teacherProfile.id,
      name: user.teacherProfile.fullName,
    });

    res.json({
      message: 'Login successful',
      token,
      teacher: formatted,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.teacherProfile.fullName,
        fullName: user.teacherProfile.fullName,
        profilePhoto: user.profilePhoto || null,
        profile: formatted,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/teachers
// List all teachers
// ---------------------
router.get('/', async (_req, res, next) => {
  try {
    const teachers = await prisma.teacher.findMany({
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
            locationAddress: true,
            municipality: true,
            province: true,
          },
        },
        assignedLearners: {
          include: {
            learningCenter: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    res.json(teachers.map(formatTeacher));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/teachers/next-username
// Generate next available teacher username (als-t1001, als-t1002, ...)
// ---------------------
router.get('/next-username', async (_req, res, next) => {
  try {
    const teacherUsers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        username: {
          startsWith: 'als-t',
        },
      },
      select: { username: true },
    });

    let maxNum = 1000;
    for (const u of teacherUsers) {
      const match = u.username.match(/^als-t(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    let nextNum = maxNum + 1;
    let candidate = `als-t${nextNum}`;

    while (await prisma.user.findUnique({ where: { username: candidate } })) {
      nextNum++;
      candidate = `als-t${nextNum}`;
    }

    res.json({ nextUsername: candidate });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/teachers/check-username
// Check if a teacher username is available
// ---------------------
router.get('/check-username', async (req, res, next) => {
  try {
    const { username, excludeTeacherId } = req.query;
    if (!username?.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const trimmed = username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { username: trimmed },
      include: { teacherProfile: true },
    });

    if (!existing) {
      return res.json({ available: true });
    }

    if (excludeTeacherId && existing.teacherProfile?.id === parseInt(excludeTeacherId, 10)) {
      return res.json({ available: true });
    }

    res.json({ available: false });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/teachers/:id
// Get a single teacher (supports lookup by teacher.id or user.id fallback)
// ---------------------
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid teacher ID' });
    }

    const includeConfig = {
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
          locationAddress: true,
          municipality: true,
          province: true,
        },
      },
      assignedLearners: {
        include: {
          learningCenter: true,
        },
      },
    };

    let teacher = await prisma.teacher.findUnique({
      where: { id },
      include: includeConfig,
    });

    if (!teacher) {
      teacher = await prisma.teacher.findUnique({
        where: { userId: id },
        include: includeConfig,
      });
    }

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(formatTeacher(teacher));
  } catch (err) {
    next(err);
  }
});

// Helper to format learner record
function formatLearner(l) {
  let displayLevel = l.level;
  if (l.level === 'ELEMENTARY' || l.level === 'A&E Elementary') displayLevel = 'A&E Elementary';
  else if (l.level === 'JUNIOR' || l.level === 'LOWER_SECONDARY' || l.level === 'A&E Junior' || l.level === 'A&E Junior High' || String(l.level || '').toUpperCase().includes('JUN')) displayLevel = 'A&E Junior High';

  return {
    id: l.id,
    userId: l.userId,
    name: l.fullName,
    fullName: l.fullName,
    lrn: l.lrn || '',
    dob: l.birthDate ? l.birthDate.toISOString().split('T')[0] : '',
    sex: l.gender || '',
    gender: l.gender || '',
    contactNumber: l.contactNo || '',
    address: l.address || '',
    level: displayLevel,
    learningCenterId: l.learningCenterId,
    learningCenter: l.learningCenter?.name || '—',
    assignedTeacherId: l.assignedTeacherId,
    assignedTeacher: l.assignedTeacher?.fullName || '—',
    status: l.status || 'Active',
    dateRegistered: l.createdAt ? l.createdAt.toISOString().split('T')[0] : '',
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

// ---------------------
// GET /api/teachers/:id/learners
// List learners assigned to this teacher
// ---------------------
router.get('/:id/learners', optionalAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid teacher ID' });
    }

    // Role security check: A teacher can ONLY see their own learners! Learners cannot view rosters!
    if (req.user && req.user.role === 'LEARNER') {
      return res.status(403).json({
        error: 'Access denied. Learners cannot view teacher learner rosters.',
      });
    }
    if (req.user && req.user.role === 'TEACHER' && req.user.profileId !== id) {
      return res.status(403).json({
        error: 'Access denied. You cannot view learners assigned to another teacher.',
      });
    }

    const learners = await prisma.learner.findMany({
      where: { assignedTeacherId: id },
      include: {
        learningCenter: {
          select: { id: true, name: true, code: true },
        },
        assignedTeacher: {
          select: { id: true, fullName: true },
        },
        user: {
          select: { username: true, email: true, status: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    res.json(learners.map(formatLearner));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// PUT /api/teachers/:id
// Update a teacher
// ---------------------
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid teacher ID' });
    }

    const {
      firstName,
      lastName,
      contactNumber,
      email,
      learningCenterId,
      status,
      programLevel,
      specialization,
      username,
      password,
    } = req.body;

    const existing = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const updateData = {};
    if (firstName && lastName) {
      updateData.fullName = `${firstName.trim()} ${lastName.trim()}`;
    } else if (firstName || lastName) {
      updateData.fullName = (firstName || lastName).trim();
    }

    if (contactNumber !== undefined) updateData.contactNo = contactNumber?.trim() || null;
    if (learningCenterId) updateData.learningCenterId = parseInt(learningCenterId, 10);
    if (programLevel !== undefined || specialization !== undefined) {
      updateData.specialization = programLevel?.trim() || specialization?.trim() || 'Both';
    }
    if (status) updateData.status = status;

    const { profilePhoto } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const userUpdate = {};
      if (email) userUpdate.email = email.trim().toLowerCase();
      if (status) userUpdate.status = status === 'Active' ? 'ACTIVE' : 'INACTIVE';
      if (username && username.trim()) userUpdate.username = username.trim().toLowerCase();
      if (password && password.trim() && !password.includes('•')) {
        const salt = await bcrypt.genSalt(10);
        userUpdate.passwordHash = await bcrypt.hash(password.trim(), salt);
      }
      if (profilePhoto !== undefined) userUpdate.profilePhoto = profilePhoto || null;

      if (Object.keys(userUpdate).length > 0 && existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userUpdate,
        });
      }

      return tx.teacher.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: { username: true, email: true, status: true, profilePhoto: true },
          },
          learningCenter: true,
          assignedLearners: true,
        },
      });
    });

    res.json(formatTeacher(updated));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/teachers
// Register a new teacher
// ---------------------
router.post('/', async (req, res, next) => {
  try {
    let {
      fullName,
      firstName,
      lastName,
      contactNumber,
      phone,
      email,
      learningCenterId,
      status,
      username,
      password,
      programLevel,
      specialization,
    } = req.body;

    if (!firstName && fullName) {
      const parts = fullName.trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || parts[0];
    }

    if (!contactNumber && phone) {
      contactNumber = phone;
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
    if (!username?.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // 2. Validate email format (if provided)
    const trimmedEmail = email?.trim() ? email.trim().toLowerCase() : null;
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }
    }

    // 3. Validate username (alphanumeric, underscores, hyphens, min 3 chars)
    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }
    if (!/^[a-z0-9_.-]+$/.test(trimmedUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, dots, and underscores' });
    }

    // 4. Default password to username if not explicitly provided
    let finalPassword = (password || '').trim();
    if (!finalPassword) {
      finalPassword = trimmedUsername;
    }

    if (finalPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // 5. Verify Learning Center exists
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

    // Check unique username
    const existingUser = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this username already exists' });
    }

    // Check unique email if provided
    if (trimmedEmail) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (existingEmail) {
        return res.status(409).json({ error: 'A user with this email address already exists' });
      }
    }

    // 6. Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(finalPassword, salt);

    fullName = `${firstName.trim()} ${lastName.trim()}`;
    const teacherStatus = status || 'Active';

    // 7. Atomic transaction: create User + Teacher profile
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: trimmedUsername,
          email: trimmedEmail,
          passwordHash,
          role: 'TEACHER',
          status: teacherStatus === 'Active' ? 'ACTIVE' : 'INACTIVE',
        },
      });

      const newTeacher = await tx.teacher.create({
        data: {
          userId: newUser.id,
          fullName,
          position: 'ALS Teacher',
          contactNo: contactNumber?.trim() || null,
          learningCenterId: parsedCenterId,
          specialization: programLevel?.trim() || specialization?.trim() || 'Both',
          status: teacherStatus,
        },
        include: {
          user: {
            select: {
              username: true,
              email: true,
              status: true,
            },
          },
          learningCenter: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return newTeacher;
    });

    res.status(201).json(formatTeacher(result));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A teacher with these credentials already exists' });
    }
    next(err);
  }
});

// ---------------------
// DELETE /api/teachers/:id
// Delete a teacher
// ---------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid teacher ID' });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Unassign any learners from this teacher
      await tx.learner.updateMany({
        where: { assignedTeacherId: id },
        data: { assignedTeacherId: null },
      });

      // 2. Delete attendance marked by this teacher
      await tx.attendance.deleteMany({
        where: { recordedById: id },
      });

      // 3. Delete assessments created by this teacher & related answers/attempts
      const assessments = await tx.assessment.findMany({
        where: { teacherId: id },
        select: { id: true },
      });
      const assessmentIds = assessments.map((a) => a.id);
      if (assessmentIds.length > 0) {
        const attempts = await tx.assessmentAttempt.findMany({
          where: { assessmentId: { in: assessmentIds } },
          select: { id: true },
        });
        const attemptIds = attempts.map((att) => att.id);
        if (attemptIds.length > 0) {
          await tx.learnerAnswer.deleteMany({
            where: { attemptId: { in: attemptIds } },
          });
        }
        await tx.assessmentAttempt.deleteMany({
          where: { assessmentId: { in: assessmentIds } },
        });
        await tx.answerOption.deleteMany({
          where: { question: { assessmentId: { in: assessmentIds } } },
        });
        await tx.question.deleteMany({
          where: { assessmentId: { in: assessmentIds } },
        });
        await tx.assessment.deleteMany({
          where: { id: { in: assessmentIds } },
        });
      }

      // 4. Delete modules created by this teacher & related items
      const modules = await tx.module.findMany({
        where: { teacherId: id },
        select: { id: true },
      });
      const moduleIds = modules.map((m) => m.id);
      if (moduleIds.length > 0) {
        await tx.submission.deleteMany({
          where: { moduleId: { in: moduleIds } },
        });
        await tx.moduleAssignment.deleteMany({
          where: { moduleId: { in: moduleIds } },
        });
        await tx.learnerProgress.deleteMany({
          where: { moduleId: { in: moduleIds } },
        });
        await tx.modulePage.deleteMany({
          where: { moduleId: { in: moduleIds } },
        });
        await tx.module.deleteMany({
          where: { id: { in: moduleIds } },
        });
      }

      // 5. Delete teacher profile and user account
      await tx.teacher.delete({
        where: { id },
      });

      if (teacher.userId) {
        await tx.user.delete({
          where: { id: teacher.userId },
        });
      }
    });

    res.status(200).json({ success: true, message: 'Teacher deleted successfully' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    next(err);
  }
});

export default router;

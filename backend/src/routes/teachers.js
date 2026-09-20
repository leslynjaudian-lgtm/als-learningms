import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

const router = Router();

// Helper to format teacher record for frontend
function formatTeacher(t) {
  return {
    id: t.id,
    userId: t.userId,
    name: t.fullName,
    fullName: t.fullName,
    position: t.position || 'ALS Teacher',
    contactNumber: t.contactNo || '',
    contactNo: t.contactNo || '',
    email: t.user?.email || '',
    username: t.user?.username || '',
    learningCenterId: t.learningCenterId,
    learningCenter: t.learningCenter?.name || '—',
    status: t.status || 'Active',
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

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
      orderBy: { fullName: 'asc' },
    });

    res.json(teachers.map(formatTeacher));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/teachers/:id
// Get a single teacher
// ---------------------
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid teacher ID' });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
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

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(formatTeacher(teacher));
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
    const {
      firstName,
      lastName,
      contactNumber,
      email,
      learningCenterId,
      status,
      username,
      password,
    } = req.body;

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
    if (!password?.trim()) {
      return res.status(400).json({ error: 'Password is required' });
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

    // 4. Validate password length (min 6 chars)
    if (password.length < 6) {
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
    const passwordHash = await bcrypt.hash(password, salt);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
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

    // Deleting user cascades to teacher
    if (teacher.userId) {
      await prisma.user.delete({
        where: { id: teacher.userId },
      });
    } else {
      await prisma.teacher.delete({
        where: { id },
      });
    }

    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    next(err);
  }
});

export default router;

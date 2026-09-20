import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

const router = Router();

// Helper to format learner record for frontend
function formatLearner(l) {
  let displayLevel = l.level;
  if (l.level === 'ELEMENTARY') displayLevel = 'A&E Elementary';
  else if (l.level === 'LOWER_SECONDARY') displayLevel = 'A&E Junior';

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
    status: l.status || 'Active',
    dateRegistered: l.createdAt ? l.createdAt.toISOString().split('T')[0] : '',
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

// ---------------------
// GET /api/learners
// List all learners
// ---------------------
router.get('/', async (_req, res, next) => {
  try {
    const learners = await prisma.learner.findMany({
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

    res.json(learners.map(formatLearner));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/learners/:id
// Get a single learner
// ---------------------
router.get('/:id', async (req, res, next) => {
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

    if (!learner) {
      return res.status(404).json({ error: 'Learner not found' });
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
router.post('/', async (req, res, next) => {
  try {
    const {
      lrn,
      firstName,
      lastName,
      dob,
      sex,
      contactNumber,
      address,
      learningCenterId,
      level,
      status,
      dateRegistered,
    } = req.body;

    // 1. Validate required fields
    if (!firstName?.trim()) {
      return res.status(400).json({ error: 'First name is required' });
    }
    if (!lastName?.trim()) {
      return res.status(400).json({ error: 'Last name is required' });
    }
    if (!dob) {
      return res.status(400).json({ error: 'Date of birth is required' });
    }
    if (!sex) {
      return res.status(400).json({ error: 'Sex is required' });
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

    // 3. Map Program Level to enum
    let alsLevel = 'LOWER_SECONDARY';
    if (level === 'A&E Elementary' || level === 'ELEMENTARY') {
      alsLevel = 'ELEMENTARY';
    } else if (level === 'A&E Junior' || level === 'LOWER_SECONDARY') {
      alsLevel = 'LOWER_SECONDARY';
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const learnerStatus = status || 'Active';
    const trimmedLrn = lrn && lrn.trim() ? lrn.trim() : null;

    // Check if LRN already exists if provided
    if (trimmedLrn) {
      const existingLrn = await prisma.learner.findUnique({
        where: { lrn: trimmedLrn },
      });
      if (existingLrn) {
        return res.status(409).json({ error: `LRN "${trimmedLrn}" is already registered to another learner.` });
      }
    }

    // 4. Generate unique internal username and password hash (since learners log in via full name)
    const sanitizedFirst = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const sanitizedLast = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestampSuffix = Date.now().toString().slice(-6);
    const username = `learner_${sanitizedFirst}_${sanitizedLast}_${timestampSuffix}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(username, salt);

    // 5. Atomic transaction: create User + Learner
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          passwordHash,
          role: 'LEARNER',
          status: learnerStatus === 'Active' ? 'ACTIVE' : 'INACTIVE',
        },
      });

      const newLearner = await tx.learner.create({
        data: {
          userId: newUser.id,
          lrn: trimmedLrn,
          fullName,
          birthDate: new Date(dob),
          gender: sex,
          address: address?.trim() || null,
          contactNo: contactNumber?.trim() || null,
          level: alsLevel,
          learningCenterId: parsedCenterId,
          status: learnerStatus,
          createdAt: dateRegistered ? new Date(dateRegistered) : new Date(),
        },
        include: {
          user: {
            select: {
              username: true,
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

      return newLearner;
    });

    res.status(201).json(formatLearner(result));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A learner with this LRN already exists.' });
    }
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

    // Deleting user will cascade-delete learner due to onDelete: Cascade
    if (learner.userId) {
      await prisma.user.delete({
        where: { id: learner.userId },
      });
    } else {
      await prisma.learner.delete({
        where: { id },
      });
    }

    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Learner not found' });
    }
    next(err);
  }
});

export default router;

import { Router } from 'express';
import prisma from '../config/prisma.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Helper to format schedule for frontend
function formatSchedule(s) {
  const dateStr =
    s.date instanceof Date
      ? s.date.toISOString().split('T')[0]
      : String(s.date).split('T')[0];

  return {
    id: s.id,
    title: s.title,
    date: dateStr,
    startTime: s.startTime,
    endTime: s.endTime,
    type: s.activityType,
    activityType: s.activityType,
    learningCenterId: s.learningCenterId,
    learningCenter: s.learningCenter?.name || '—',
    learningCenterDetails: s.learningCenter || null,
    teacherId: s.teacherId,
    teacher: s.teacher?.fullName || '—',
    teacherDetails: s.teacher || null,
    description: s.description || '',
    status: s.status || 'Upcoming',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

// ---------------------
// GET /api/schedules
// List schedules with role-scoping (Admin = all, Teacher = assigned only)
// ---------------------
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { teacherId, learningCenterId, activityType, month, search } = req.query;
    const where = {};

    // 1. Role-scoping:
    // Teachers see schedules assigned to their teacher account and general district schedules
    if (req.user && req.user.role === 'TEACHER') {
      if (req.query.ownOnly === 'true') {
        where.teacherId = req.user.profileId;
      } else {
        where.OR = [
          { teacherId: req.user.profileId },
          { teacherId: null },
        ];
      }
      if (learningCenterId) {
        where.learningCenterId = parseInt(learningCenterId, 10);
      }
    } else if (teacherId) {
      const tid = parseInt(teacherId, 10);
      if (!isNaN(tid)) {
        where.teacherId = tid;
      }
    }

    if (learningCenterId && (!req.user || req.user.role !== 'TEACHER')) {
      const cid = parseInt(learningCenterId, 10);
      if (!isNaN(cid)) {
        where.learningCenterId = cid;
      }
    }

    if (activityType) {
      where.activityType = activityType;
    }

    if (month) {
      // month formatted as 'YYYY-MM'
      const [year, mon] = month.split('-').map((n) => parseInt(n, 10));
      if (!isNaN(year) && !isNaN(mon)) {
        const startOfMonth = new Date(Date.UTC(year, mon - 1, 1));
        const endOfMonth = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
        where.date = {
          gte: startOfMonth,
          lte: endOfMonth,
        };
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { activityType: { contains: q } },
        { learningCenter: { name: { contains: q } } },
        { teacher: { fullName: { contains: q } } },
      ];
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        learningCenter: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teacher: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.json(schedules.map(formatSchedule));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/schedules/:id
// Get a single schedule by ID
// ---------------------
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        learningCenter: true,
        teacher: true,
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Role check: Teacher cannot view schedules assigned to another teacher
    if (req.user && req.user.role === 'TEACHER' && schedule.teacherId && schedule.teacherId !== req.user.profileId) {
      return res.status(403).json({ error: 'Access denied. You cannot view schedules assigned to other teachers.' });
    }

    res.json(formatSchedule(schedule));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/schedules
// Create a new schedule (Admin or Teacher)
// ---------------------
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      title,
      activityType,
      date,
      startTime,
      endTime,
      learningCenterId,
      teacherId,
      description,
      status,
    } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    if (!startTime || !String(startTime).trim()) {
      return res.status(400).json({ error: 'Start Time is required' });
    }
    if (!endTime || !String(endTime).trim()) {
      return res.status(400).json({ error: 'End Time is required' });
    }

    // Default title from description or fallback
    const descText = description ? String(description).trim() : '';
    const finalTitle =
      (title && String(title).trim()) ||
      (descText ? descText.split('\n')[0].slice(0, 80) : 'Learning Session');

    // Default activityType if omitted
    const finalActivityType =
      (activityType && String(activityType).trim()) || 'Learning Session';

    // Handle Teacher role vs Admin role
    let finalTeacherId = null;
    if (req.user && req.user.role === 'TEACHER') {
      finalTeacherId = req.user.profileId;
    } else if (teacherId) {
      const parsedTeacherId = parseInt(teacherId, 10);
      if (!isNaN(parsedTeacherId)) {
        finalTeacherId = parsedTeacherId;
      }
    }

    // Handle Learning Center
    let parsedCenterId = learningCenterId ? parseInt(learningCenterId, 10) : null;
    if (!parsedCenterId || isNaN(parsedCenterId)) {
      // If teacher, attempt to look up their assigned learning center
      if (finalTeacherId) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: finalTeacherId },
          include: { learningCenter: true },
        });
        if (teacher?.learningCenterId) {
          parsedCenterId = teacher.learningCenterId;
        }
      }
      // Fallback to first available learning center
      if (!parsedCenterId) {
        const firstCenter = await prisma.learningCenter.findFirst();
        if (firstCenter) {
          parsedCenterId = firstCenter.id;
        }
      }
    }

    if (!parsedCenterId) {
      return res.status(400).json({ error: 'No learning center available to assign schedule to' });
    }

    const newSchedule = await prisma.schedule.create({
      data: {
        title: finalTitle,
        activityType: finalActivityType,
        date: new Date(date),
        startTime: String(startTime).trim(),
        endTime: String(endTime).trim(),
        learningCenterId: parsedCenterId,
        teacherId: finalTeacherId,
        description: descText || null,
        status: status || 'Upcoming',
      },
      include: {
        learningCenter: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teacher: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
          },
        },
      },
    });

    res.status(201).json(formatSchedule(newSchedule));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// PUT /api/schedules/:id
// Update an existing schedule
// ---------------------
router.put('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const {
      title,
      activityType,
      date,
      startTime,
      endTime,
      learningCenterId,
      teacherId,
      description,
      status,
    } = req.body;

    const existing = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Role check: Teacher can only modify own schedule
    if (req.user && req.user.role === 'TEACHER' && existing.teacherId !== req.user.profileId) {
      return res.status(403).json({ error: 'Access denied. You cannot modify another teacher\'s schedule.' });
    }

    const updateData = {};
    if (title !== undefined && String(title).trim()) {
      updateData.title = String(title).trim();
    } else if (description !== undefined && String(description).trim() && !existing.title) {
      updateData.title = String(description).trim().split('\n')[0].slice(0, 80);
    }
    if (activityType !== undefined) updateData.activityType = activityType.trim();
    if (date) updateData.date = new Date(date);
    if (startTime !== undefined) updateData.startTime = startTime.trim();
    if (endTime !== undefined) updateData.endTime = endTime.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (status !== undefined) updateData.status = status;

    if (learningCenterId !== undefined) {
      const parsedCenterId = parseInt(learningCenterId, 10);
      if (isNaN(parsedCenterId)) {
        return res.status(400).json({ error: 'Invalid Learning Center ID' });
      }
      updateData.learningCenterId = parsedCenterId;
    }

    if (teacherId !== undefined) {
      if (teacherId === null || teacherId === '') {
        updateData.teacherId = null;
      } else {
        const parsedTeacherId = parseInt(teacherId, 10);
        if (isNaN(parsedTeacherId)) {
          return res.status(400).json({ error: 'Invalid Teacher ID' });
        }
        updateData.teacherId = parsedTeacherId;
      }
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        learningCenter: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teacher: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
          },
        },
      },
    });

    res.json(formatSchedule(updated));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// DELETE /api/schedules/:id
// Delete a schedule
// ---------------------
router.delete('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const existing = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Role check: Teacher can only delete own schedule
    if (req.user && req.user.role === 'TEACHER' && existing.teacherId !== req.user.profileId) {
      return res.status(403).json({ error: 'Access denied. You cannot delete another teacher\'s schedule.' });
    }

    await prisma.schedule.delete({
      where: { id },
    });

    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;

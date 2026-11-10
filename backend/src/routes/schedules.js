import { Router } from 'express';
import prisma from '../config/prisma.js';
import { optionalAuth, authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  runReminderChecks,
  notifyScheduleCreated,
  notifyScheduleUpdated,
  notifyScheduleCanceled,
} from '../services/notificationService.js';
import { logTeacherActivity } from '../utils/teacherActivityLogger.js';

const router = Router();

// ---------------------
// Date & time helpers
// Schedules are stored as a calendar DATE plus "HH:MM" wall-clock times in
// Philippine Standard Time (Asia/Manila, UTC+08:00).
// ---------------------
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * Converts an incoming date value to a UTC-midnight Date for the @db.Date column.
 * "YYYY-MM-DD" is used as-is (no timezone shift). Full timestamps are converted
 * to the Philippine calendar date first, preventing one-day UTC offsets.
 * Returns null when the value is invalid.
 */
function parseScheduleDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  let y, m, d;
  const plain = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plain) {
    [y, m, d] = [plain[1], plain[2], plain[3]].map((n) => parseInt(n, 10));
  } else {
    const parsed = new Date(str);
    if (isNaN(parsed.getTime())) return null;
    const manila = new Date(parsed.getTime() + MANILA_OFFSET_MS);
    [y, m, d] = [manila.getUTCFullYear(), manila.getUTCMonth() + 1, manila.getUTCDate()];
  }
  const result = new Date(Date.UTC(y, m - 1, d));
  // Reject impossible dates such as 2026-02-31
  if (result.getUTCFullYear() !== y || result.getUTCMonth() !== m - 1 || result.getUTCDate() !== d) {
    return null;
  }
  return result;
}

/** Parses "HH:MM", "HH:MM:SS" or "9:00 AM" into minutes since midnight (or null). */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    if (h < 1 || h > 12) return null;
    if (meridiem === 'AM' && h === 12) h = 0;
    if (meridiem === 'PM' && h !== 12) h += 12;
  }
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Normalizes a time to zero-padded 24-hour "HH:MM" so it sorts and displays consistently. */
/** Normalizes a time to zero-padded 24-hour "HH:MM" so it sorts and displays consistently. */
function normalizeTime(timeStr) {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return null;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/**
 * Validates start and end date/time range.
 * End Date & Time must be later than Start Date & Time.
 */
function validateScheduleDateTimeRange(startDate, startTime, endDate, endTime) {
  if (!startDate) return 'Start Date is required';
  if (!endDate) return 'End Date is required';
  if (!startTime || !String(startTime).trim()) return 'Start Time is required';
  if (!endTime || !String(endTime).trim()) return 'End Time is required';

  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);
  if (startMins === null) return 'Start Time is invalid';
  if (endMins === null) return 'End Time is invalid';

  const startKey = String(startDate).split('T')[0];
  const endKey = String(endDate).split('T')[0];

  if (endKey < startKey) {
    return 'End Date & Time must be later than Start Date & Time.';
  }
  if (endKey === startKey && endMins <= startMins) {
    return 'End Date & Time must be later than Start Date & Time.';
  }
  return null;
}

/** Returns an error message if the start/end times are invalid, otherwise null. */
function validateTimes(startTime, endTime) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null) return 'Start Time is invalid';
  if (end === null) return 'End Time is invalid';
  if (end <= start) return 'End time must be later than the start time';
  return null;
}

/**
 * Calculates schedule status based on current Philippine Standard Time (UTC+08:00):
 * - "Upcoming": Current date & time < schedule's start
 * - "Ongoing": Current date & time is between schedule's start and end
 * - "Completed": Current date & time > schedule's end
 */
function calculateScheduleStatus(startDate, startTime, endDate, endTime, now = new Date()) {
  const startKey = String(startDate).split('T')[0];
  const endKey = String(endDate || startDate).split('T')[0];
  if (!startKey) return 'Upcoming';

  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);
  if (startMins === null) return 'Upcoming';

  const sHour = Math.floor(startMins / 60);
  const sMin = startMins % 60;
  const eHour = endMins !== null ? Math.floor(endMins / 60) : sHour;
  const eMin = endMins !== null ? endMins % 60 : sMin;

  const [sy, sm, sd] = startKey.split('-').map((n) => parseInt(n, 10));
  const [ey, em, ed] = endKey.split('-').map((n) => parseInt(n, 10));

  const startMs = Date.UTC(sy, sm - 1, sd, sHour - 8, sMin, 0);
  const endMs = Date.UTC(ey, em - 1, ed, eHour - 8, eMin, 0);
  const nowMs = now.getTime();

  if (nowMs < startMs) {
    return 'Upcoming';
  }
  if (nowMs > endMs) {
    return 'Completed';
  }
  return 'Ongoing';
}

// Helper to format schedule for frontend
function formatSchedule(s) {
  const dateStr =
    s.date instanceof Date
      ? s.date.toISOString().split('T')[0]
      : String(s.date).split('T')[0];

  const endDateStr = s.endDate
    ? (s.endDate instanceof Date ? s.endDate.toISOString().split('T')[0] : String(s.endDate).split('T')[0])
    : dateStr;

  const computedStatus =
    s.status === 'Cancelled'
      ? 'Cancelled'
      : calculateScheduleStatus(dateStr, s.startTime, endDateStr, s.endTime);

  return {
    id: s.id,
    title: s.title,
    date: dateStr,
    startDate: dateStr,
    endDate: endDateStr,
    startTime: s.startTime,
    endTime: s.endTime,
    type: s.activityType || 'General Schedule',
    activityType: s.activityType || 'General Schedule',
    learningCenterId: s.learningCenterId,
    learningCenter: s.learningCenter?.name || '—',
    learningCenterDetails: s.learningCenter || null,
    teacherId: s.teacherId,
    teacher: s.teacher?.fullName || '—',
    teacherDetails: s.teacher || null,
    description: s.description || '',
    status: computedStatus,
    createdByUserId: s.createdByUserId,
    createdByRole: s.createdByRole,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

// ---------------------
// GET /api/schedules
// List schedules strictly scoped to the authenticated user (Admin sees Admin's own; Teacher sees Teacher's own)
// ---------------------
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { month, search } = req.query;
    const whereConditions = [];

    // Enforce strict separation at the database query level
    if (req.user.role === 'ADMIN') {
      whereConditions.push({
        OR: [
          { createdByUserId: req.user.id },
          {
            AND: [
              { createdByUserId: null },
              { createdByRole: 'ADMIN' },
              { teacherId: null },
            ],
          },
          {
            AND: [
              { createdByUserId: null },
              { teacherId: null },
            ],
          },
        ],
      });
    } else if (req.user.role === 'TEACHER') {
      whereConditions.push({
        OR: [
          {
            AND: [
              { createdByUserId: req.user.id },
              { createdByRole: 'TEACHER' },
            ],
          },
          {
            AND: [
              { teacherId: req.user.profileId },
              { createdByUserId: req.user.id },
            ],
          },
          {
            AND: [
              { teacherId: req.user.profileId },
              { createdByUserId: null },
            ],
          },
        ],
      });
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (month) {
      const [year, mon] = month.split('-').map((n) => parseInt(n, 10));
      if (!isNaN(year) && !isNaN(mon)) {
        const startOfMonth = new Date(Date.UTC(year, mon - 1, 1));
        const endOfMonth = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
        whereConditions.push({
          OR: [
            {
              date: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            {
              endDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            {
              date: { lte: startOfMonth },
              endDate: { gte: endOfMonth },
            },
          ],
        });
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereConditions.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.json(schedules.map(formatSchedule));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/schedules/:id
// Get a single schedule by ID (owner only)
// ---------------------
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Strict ownership verification
    if (req.user.role === 'ADMIN') {
      const isOwner =
        schedule.createdByUserId === req.user.id ||
        (!schedule.createdByUserId && schedule.createdByRole === 'ADMIN' && !schedule.teacherId) ||
        (!schedule.createdByUserId && !schedule.teacherId);
      if (!isOwner || schedule.createdByRole === 'TEACHER' || schedule.teacherId) {
        return res.status(403).json({ error: 'Access denied. You can only view your own schedules.' });
      }
    } else if (req.user.role === 'TEACHER') {
      const isOwner =
        (schedule.createdByUserId === req.user.id && schedule.createdByRole === 'TEACHER') ||
        (schedule.teacherId === req.user.profileId && (!schedule.createdByUserId || schedule.createdByUserId === req.user.id));
      if (!isOwner || schedule.createdByRole === 'ADMIN' || !schedule.teacherId) {
        return res.status(403).json({ error: 'Access denied. You can only view your own schedules.' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(formatSchedule(schedule));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/schedules
// Create a new schedule (Admin or Teacher - strictly scoped to creator)
// ---------------------
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      title,
      description,
      startDate,
      date,
      endDate,
      startTime,
      endTime,
      learningCenterId,
      status,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const startInput = startDate || date;
    const endInput = endDate || startInput;

    if (!startInput) {
      return res.status(400).json({ error: 'Start Date is required' });
    }
    if (!startTime || !String(startTime).trim()) {
      return res.status(400).json({ error: 'Start Time is required' });
    }
    if (!endInput) {
      return res.status(400).json({ error: 'End Date is required' });
    }
    if (!endTime || !String(endTime).trim()) {
      return res.status(400).json({ error: 'End Time is required' });
    }

    const scheduleStartDate = parseScheduleDate(startInput);
    if (!scheduleStartDate) {
      return res.status(400).json({ error: 'Start Date is invalid. Use the YYYY-MM-DD format.' });
    }
    const scheduleEndDate = parseScheduleDate(endInput);
    if (!scheduleEndDate) {
      return res.status(400).json({ error: 'End Date is invalid. Use the YYYY-MM-DD format.' });
    }

    const rangeError = validateScheduleDateTimeRange(
      scheduleStartDate.toISOString().split('T')[0],
      startTime,
      scheduleEndDate.toISOString().split('T')[0],
      endTime
    );
    if (rangeError) {
      return res.status(400).json({ error: rangeError });
    }

    // Determine ownership strictly from authenticated session
    let createdByUserId = req.user.id;
    let createdByRole = req.user.role;
    let teacherId = null;

    if (req.user.role === 'TEACHER') {
      teacherId = req.user.profileId;
    } else if (req.user.role === 'ADMIN') {
      teacherId = null;
    } else {
      return res.status(403).json({ error: 'Only Admins and Teachers can create schedules.' });
    }

    // Default learning center if needed for database integrity
    let parsedCenterId = learningCenterId ? parseInt(learningCenterId, 10) : null;
    if (!parsedCenterId || isNaN(parsedCenterId)) {
      if (req.user.role === 'TEACHER' && req.user.teacherProfile?.learningCenterId) {
        parsedCenterId = req.user.teacherProfile.learningCenterId;
      }
      if (!parsedCenterId) {
        const firstCenter = await prisma.learningCenter.findFirst();
        parsedCenterId = firstCenter ? firstCenter.id : 1;
      }
    }

    const descText = description ? String(description).trim() : null;

    // Auto-calculate initial status based on Manila time
    const computedStatus = calculateScheduleStatus(
      scheduleStartDate.toISOString().split('T')[0],
      startTime,
      scheduleEndDate.toISOString().split('T')[0],
      endTime
    );

    const newSchedule = await prisma.schedule.create({
      data: {
        title: String(title).trim(),
        activityType: 'General Schedule',
        date: scheduleStartDate,
        endDate: scheduleEndDate,
        startTime: normalizeTime(startTime),
        endTime: normalizeTime(endTime),
        learningCenterId: parsedCenterId,
        teacherId,
        createdByUserId,
        createdByRole,
        description: descText,
        status: status || computedStatus,
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

    const isImp =
      req.body.isImportant !== undefined
        ? (req.body.isImportant ? 1 : 0)
        : req.body.is_important !== undefined
          ? (req.body.is_important ? 1 : 0)
          : 0;
    const schedPriority = req.body.priority || 'NORMAL';
    await prisma.$executeRawUnsafe(
      'UPDATE schedules SET is_important = ?, priority = ? WHERE id = ?',
      isImp,
      schedPriority,
      newSchedule.id
    );

    notifyScheduleCreated({
      scheduleId: newSchedule.id,
      creatorRole: req.user?.role,
      creatorUserId: req.user?.id,
    }).catch((e) => console.error('[Schedules] notifyScheduleCreated error:', e));

    if (teacherId && createdByRole === 'TEACHER') {
      const schedDateLabel = scheduleStartDate.toISOString().split('T')[0];
      logTeacherActivity({
        teacherId,
        type: 'SCHEDULE_CREATED',
        activityTypeLabel: 'Created a Schedule',
        relatedEntity: newSchedule.title,
        description: `Scheduled "${newSchedule.title}" on ${schedDateLabel} (${normalizeTime(startTime)} – ${normalizeTime(endTime)}).`,
        linkUrl: '/dashboard/schedule'
      });
    }

    res.status(201).json(formatSchedule(newSchedule));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// PUT /api/schedules/:id
// Update an existing schedule (owner only)
// ---------------------
router.put('/:id', authenticate, async (req, res, next) => {
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

    // Role check & ownership check
    if (req.user.role === 'ADMIN') {
      const isOwner =
        existing.createdByUserId === req.user.id ||
        (!existing.createdByUserId && existing.createdByRole === 'ADMIN' && !existing.teacherId) ||
        (!existing.createdByUserId && !existing.teacherId);
      if (!isOwner || existing.createdByRole === 'TEACHER' || existing.teacherId) {
        return res.status(403).json({ error: 'Access denied. You can only edit your own schedules.' });
      }
    } else if (req.user.role === 'TEACHER') {
      const isOwner =
        (existing.createdByUserId === req.user.id && existing.createdByRole === 'TEACHER') ||
        (existing.teacherId === req.user.profileId && (!existing.createdByUserId || existing.createdByUserId === req.user.id));
      if (!isOwner || existing.createdByRole === 'ADMIN' || !existing.teacherId) {
        return res.status(403).json({ error: 'Access denied. You can only edit your own schedules.' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const {
      title,
      description,
      startDate,
      date,
      endDate,
      startTime,
      endTime,
      status,
    } = req.body;

    const existingStartStr = existing.date instanceof Date ? existing.date.toISOString().split('T')[0] : String(existing.date).split('T')[0];
    const existingEndStr = existing.endDate ? (existing.endDate instanceof Date ? existing.endDate.toISOString().split('T')[0] : String(existing.endDate).split('T')[0]) : existingStartStr;

    const nextStartStr = (startDate || date) ? (startDate || date) : existingStartStr;
    const nextEndStr = endDate ? endDate : ((startDate || date) && !existing.endDate ? (startDate || date) : existingEndStr);
    const nextStart = startTime !== undefined ? startTime : existing.startTime;
    const nextEnd = endTime !== undefined ? endTime : existing.endTime;

    const rangeError = validateScheduleDateTimeRange(nextStartStr, nextStart, nextEndStr, nextEnd);
    if (rangeError) {
      return res.status(400).json({ error: rangeError });
    }

    const updateData = {};
    if (title !== undefined && String(title).trim()) {
      updateData.title = String(title).trim();
    }

    if (startDate || date) {
      const scheduleStartDate = parseScheduleDate(nextStartStr);
      if (!scheduleStartDate) return res.status(400).json({ error: 'Start Date is invalid. Use the YYYY-MM-DD format.' });
      updateData.date = scheduleStartDate;
    }
    if (endDate || startDate || date) {
      const scheduleEndDate = parseScheduleDate(nextEndStr);
      if (!scheduleEndDate) return res.status(400).json({ error: 'End Date is invalid. Use the YYYY-MM-DD format.' });
      updateData.endDate = scheduleEndDate;
    }
    if (startTime !== undefined) updateData.startTime = normalizeTime(startTime);
    if (endTime !== undefined) updateData.endTime = normalizeTime(endTime);
    if (description !== undefined) updateData.description = description ? description.trim() : null;

    // Automatically calculate status if not explicitly overridden
    if (status !== undefined) {
      updateData.status = status;
    } else {
      updateData.status = calculateScheduleStatus(nextStartStr, nextStart, nextEndStr, nextEnd);
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

    const isImp =
      req.body.isImportant !== undefined
        ? (req.body.isImportant ? 1 : 0)
        : req.body.is_important !== undefined
          ? (req.body.is_important ? 1 : 0)
          : (updated.status || 'Upcoming') !== 'Cancelled' ? 1 : 0;
    const schedPriority = req.body.priority || (isImp ? 'IMPORTANT' : 'NORMAL');
    await prisma.$executeRawUnsafe(
      'UPDATE schedules SET is_important = ?, priority = ? WHERE id = ?',
      isImp,
      schedPriority,
      id
    );

    // If schedule date, time, or status was modified (e.g. rescheduled), reset read state so affected users are notified
    if (date !== undefined || startTime !== undefined || endTime !== undefined || status !== undefined) {
      await prisma.$executeRawUnsafe(
        'DELETE FROM notification_reads WHERE notification_key = ?',
        `schedule:${id}`
      );
    }

    notifyScheduleUpdated({
      scheduleId: id,
      updaterRole: req.user?.role,
      updaterUserId: req.user?.id,
    }).catch((e) => console.error('[Schedules] notifyScheduleUpdated error:', e));

    res.json(formatSchedule(updated));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// DELETE /api/schedules/:id
// Delete a schedule (owner only)
// ---------------------
router.delete('/:id', authenticate, async (req, res, next) => {
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

    // Role check & ownership check
    if (req.user.role === 'ADMIN') {
      const isOwner =
        existing.createdByUserId === req.user.id ||
        (!existing.createdByUserId && existing.createdByRole === 'ADMIN' && !existing.teacherId) ||
        (!existing.createdByUserId && !existing.teacherId);
      if (!isOwner || existing.createdByRole === 'TEACHER' || existing.teacherId) {
        return res.status(403).json({ error: 'Access denied. You can only delete your own schedules.' });
      }
    } else if (req.user.role === 'TEACHER') {
      const isOwner =
        (existing.createdByUserId === req.user.id && existing.createdByRole === 'TEACHER') ||
        (existing.teacherId === req.user.profileId && (!existing.createdByUserId || existing.createdByUserId === req.user.id));
      if (!isOwner || existing.createdByRole === 'ADMIN' || !existing.teacherId) {
        return res.status(403).json({ error: 'Access denied. You can only delete your own schedules.' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await prisma.schedule.delete({
      where: { id },
    });

    notifyScheduleCanceled({
      schedule: existing,
      cancelerRole: req.user?.role,
      cancelerUserId: req.user?.id,
    }).catch((e) => console.error('[Schedules] notifyScheduleCanceled error:', e));

    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;

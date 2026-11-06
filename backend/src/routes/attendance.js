import { Router } from 'express';
import prisma from '../config/prisma.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { formatLearnerName } from './learners.js';

const router = Router();

// Helper to format attendance item
function formatAttendance(att) {
  let displayLevel = att.learner?.level || '';
  if (displayLevel === 'ELEMENTARY' || String(displayLevel).toUpperCase().includes('ELEM')) {
    displayLevel = 'A&E Elementary';
  } else if (displayLevel === 'JUNIOR' || String(displayLevel).toUpperCase().includes('JUNIOR') || String(displayLevel).toUpperCase().includes('JHS')) {
    displayLevel = 'A&E Junior High';
  }

  return {
    id: att.id,
    learnerId: att.learnerId,
    learnerName: formatLearnerName(att.learner) || '—',
    firstName: att.learner?.firstName || '',
    middleName: att.learner?.middleName || '',
    lastName: att.learner?.lastName || '',
    gender: att.learner?.gender || 'Male',
    learner: att.learner || null,
    lrn: att.learner?.lrn || '',
    level: displayLevel || 'A&E Elementary',
    learningCenterId: att.learningCenterId,
    learningCenter: att.learningCenter?.name || '—',
    recordedById: att.recordedById,
    teacherName: att.recordedBy?.fullName || '—',
    teacher: att.recordedBy?.fullName || '—',
    sessionDate: att.sessionDate ? att.sessionDate.toISOString().split('T')[0] : '',
    date: att.sessionDate ? att.sessionDate.toISOString().split('T')[0] : '',
    status: att.status, // PRESENT, ABSENT, LATE, EXCUSED
    remarks: att.remarks || '',
    createdAt: att.createdAt,
    updatedAt: att.updatedAt,
  };
}

// ---------------------
// GET /api/attendance
// List attendance records with filtering and teacher data isolation
// ---------------------
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { learningCenterId, teacherId, level, learnerId, fromDate, toDate, status, portal } = req.query;
    const where = {};

    // 1. Strict Teacher Scoping:
    // Teachers may ONLY see attendance they recorded or attendance for their assigned learners
    if (req.user && req.user.role === 'TEACHER') {
      const currentTid = req.user.profileId;
      if (teacherId && parseInt(teacherId, 10) !== currentTid) {
        return res.status(403).json({
          error: 'Access denied. You cannot view attendance records of another teacher.',
        });
      }
      where.OR = [
        { recordedById: currentTid },
        { learner: { assignedTeacherId: currentTid } },
      ];
    } else if (teacherId) {
      const tid = parseInt(teacherId, 10);
      if (!isNaN(tid)) {
        where.OR = [
          { recordedById: tid },
          { learner: { assignedTeacherId: tid } },
        ];
      }
    } else if (portal === 'teacher') {
      // Unauthenticated teacher portal request without teacher ID must not leak all records
      return res.json([]);
    }

    if (learningCenterId) {
      const cid = parseInt(learningCenterId, 10);
      if (!isNaN(cid)) where.learningCenterId = cid;
    }

    if (learnerId) {
      const lid = parseInt(learnerId, 10);
      if (!isNaN(lid)) {
        const effectiveTid =
          req.user && req.user.role === 'TEACHER'
            ? req.user.profileId
            : teacherId
              ? parseInt(teacherId, 10)
              : null;
        if (effectiveTid && !isNaN(effectiveTid)) {
          const targetLearner = await prisma.learner.findUnique({
            where: { id: lid },
            select: { assignedTeacherId: true },
          });
          if (!targetLearner || targetLearner.assignedTeacherId !== effectiveTid) {
            return res.json([]);
          }
        }
        where.learnerId = lid;
      }
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (fromDate || toDate) {
      where.sessionDate = {};
      if (fromDate) {
        where.sessionDate.gte = new Date(fromDate);
      }
      if (toDate) {
        const d = new Date(toDate);
        d.setHours(23, 59, 59, 999);
        where.sessionDate.lte = d;
      }
    }

    if (level) {
      let prismaLevel = level.toUpperCase();
      if (prismaLevel.includes('ELEM')) prismaLevel = 'ELEMENTARY';
      else if (prismaLevel.includes('JUNIOR') || prismaLevel.includes('JHS')) prismaLevel = 'JUNIOR';

      where.learner = {
        ...(where.learner || {}),
        level: prismaLevel,
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        learner: true,
        recordedBy: true,
        learningCenter: true,
      },
      orderBy: [
        { sessionDate: 'desc' },
        { id: 'desc' },
      ],
    });

    res.json(records.map(formatAttendance));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/attendance/batch
// Record attendance session with multiple learners
// ---------------------
router.post('/batch', optionalAuth, async (req, res, next) => {
  try {
    let { learningCenterId, teacherId, sessionDate, records } = req.body;

    // If authenticated as TEACHER, enforce their own teacher ID
    if (req.user && req.user.role === 'TEACHER') {
      teacherId = req.user.profileId;
    }

    if (!sessionDate || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Invalid attendance batch payload. sessionDate and records array required.' });
    }

    const dateObj = new Date(sessionDate);
    const results = [];

    await prisma.$transaction(async (tx) => {
      for (const item of records) {
        if (!item.learnerId) continue;

        let centerId = parseInt(learningCenterId, 10);
        let teacherIdInt = parseInt(teacherId, 10);

        // If not specified directly, look up learner's assigned center and teacher
        if (isNaN(centerId) || isNaN(teacherIdInt)) {
          const learner = await tx.learner.findUnique({
            where: { id: item.learnerId },
          });
          if (learner) {
            if (isNaN(centerId) && learner.learningCenterId) centerId = learner.learningCenterId;
            if (isNaN(teacherIdInt) && learner.assignedTeacherId) teacherIdInt = learner.assignedTeacherId;
          }
        }

        // If teacher is still not found, check authenticated user
        if (isNaN(teacherIdInt) && req.user?.profileId) {
          teacherIdInt = req.user.profileId;
        }

        // If center is still not found, fallback to first available center
        if (isNaN(centerId)) {
          const firstCenter = await tx.learningCenter.findFirst();
          if (firstCenter) centerId = firstCenter.id;
        }

        if (isNaN(centerId) || isNaN(teacherIdInt)) {
          continue;
        }

        let status = (item.status || 'PRESENT').toUpperCase();
        if (!['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(status)) {
          status = 'PRESENT';
        }

        const saved = await tx.attendance.upsert({
          where: {
            learnerId_sessionDate: {
              learnerId: item.learnerId,
              sessionDate: dateObj,
            },
          },
          update: {
            status,
            remarks: item.remarks || (status === 'PRESENT' ? 'Present' : 'Absent'),
            learningCenterId: centerId,
            recordedById: teacherIdInt,
          },
          create: {
            learnerId: item.learnerId,
            learningCenterId: centerId,
            recordedById: teacherIdInt,
            sessionDate: dateObj,
            status,
            remarks: item.remarks || (status === 'PRESENT' ? 'Present' : 'Absent'),
          },
        });

        results.push(saved);
      }
    });

    res.status(201).json({ message: 'Attendance recorded successfully', count: results.length });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/attendance/summary
// Aggregated attendance metrics for Admin Portal
// ---------------------
router.get('/summary', async (req, res, next) => {
  try {
    const { learningCenterId, teacherId, level, fromDate, toDate } = req.query;
    const where = {};

    if (learningCenterId) {
      const cid = parseInt(learningCenterId, 10);
      if (!isNaN(cid)) where.learningCenterId = cid;
    }

    if (teacherId) {
      const tid = parseInt(teacherId, 10);
      if (!isNaN(tid)) where.recordedById = tid;
    }

    if (fromDate || toDate) {
      where.sessionDate = {};
      if (fromDate) where.sessionDate.gte = new Date(fromDate);
      if (toDate) {
        const d = new Date(toDate);
        d.setHours(23, 59, 59, 999);
        where.sessionDate.lte = d;
      }
    }

    if (level) {
      let prismaLevel = level.toUpperCase();
      if (prismaLevel.includes('ELEM')) prismaLevel = 'ELEMENTARY';
      else if (prismaLevel.includes('JUNIOR') || prismaLevel.includes('JHS')) prismaLevel = 'JUNIOR';
      where.learner = { level: prismaLevel };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        learner: true,
        recordedBy: true,
        learningCenter: true,
      },
    });

    const totalRecords = records.length;
    const presentRecords = records.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const absentRecords = records.filter((r) => r.status === 'ABSENT').length;

    // Distinct session dates = number of attendance sessions
    const sessionDates = new Set(
      records.map((r) => r.sessionDate.toISOString().split('T')[0])
    );
    const totalSessions = sessionDates.size;

    // Distinct learners
    const learnerIds = new Set(records.map((r) => r.learnerId));
    const totalLearnersWithAttendance = learnerIds.size;

    const clcAttendanceRate =
      totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    res.json({
      totalAttendanceRecords: totalRecords,
      totalSessions,
      totalLearners: totalLearnersWithAttendance,
      presentRecords,
      absentRecords,
      clcAttendanceRate,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

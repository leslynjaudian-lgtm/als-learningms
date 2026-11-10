import { Router } from 'express';
import prisma from '../config/prisma.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { formatLearnerName } from './learners.js';
import { logTeacherActivity } from '../utils/teacherActivityLogger.js';

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

    // Role-based ALS Level authorization scoping for teachers
    let teacherSpecialization = null;
    if (req.user && req.user.role === 'TEACHER') {
      teacherSpecialization = req.user.teacherProfile?.specialization || 'Both';
    } else if (teacherId) {
      const tid = parseInt(teacherId, 10);
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
        return res.json([]);
      }

      if (allowsElem && !allowsJhs) {
        if (where.learner?.level && where.learner.level !== 'ELEMENTARY') {
          return res.json([]);
        }
        where.learner = {
          ...(where.learner || {}),
          level: 'ELEMENTARY',
        };
      } else if (allowsJhs && !allowsElem) {
        if (where.learner?.level && where.learner.level !== 'JUNIOR') {
          return res.json([]);
        }
        where.learner = {
          ...(where.learner || {}),
          level: 'JUNIOR',
        };
      }
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

    const recordedByTeacherId = results[0]?.recordedById || parseInt(teacherId, 10) || req.user?.profileId;
    if (recordedByTeacherId && results.length > 0) {
      const presentCount = results.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      const sessionDateLabel = dateObj.toISOString().split('T')[0];
      logTeacherActivity({
        teacherId: recordedByTeacherId,
        type: 'ATTENDANCE_RECORDED',
        activityTypeLabel: 'Recorded Attendance',
        relatedEntity: `Session on ${sessionDateLabel} (${results.length} learner${results.length === 1 ? '' : 's'})`,
        description: `Recorded attendance for ${results.length} learner${results.length === 1 ? '' : 's'} on ${sessionDateLabel} (${presentCount} present).`,
        linkUrl: '/dashboard/attendance'
      });
    }

    res.status(201).json({ message: 'Attendance recorded successfully', count: results.length });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/attendance/summary
// Aggregated attendance metrics for Admin Portal & Reports
// ---------------------
router.get('/summary', optionalAuth, async (req, res, next) => {
  try {
    const { learningCenterId, teacherId, level, fromDate, toDate } = req.query;
    const where = {};

    let effectiveTeacherId = teacherId;
    let teacherSpecialization = null;

    if (req.user && req.user.role === 'TEACHER') {
      effectiveTeacherId = req.user.profileId;
      teacherSpecialization = req.user.teacherProfile?.specialization || 'Both';
      where.recordedById = req.user.profileId;
    } else if (teacherId) {
      const tid = parseInt(teacherId, 10);
      if (!isNaN(tid)) {
        where.recordedById = tid;
        const tObj = await prisma.teacher.findFirst({
          where: { OR: [{ id: tid }, { userId: tid }] },
          select: { specialization: true },
        });
        if (tObj) teacherSpecialization = tObj.specialization || 'Both';
      }
    }

    if (learningCenterId) {
      const cid = parseInt(learningCenterId, 10);
      if (!isNaN(cid)) where.learningCenterId = cid;
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

    // Role-based ALS Level authorization scoping for teachers
    if (teacherSpecialization) {
      const spec = String(teacherSpecialization).toLowerCase().trim();
      const allowsElem = spec.includes('elem') || spec.includes('both');
      const allowsJhs = spec.includes('junior') || spec.includes('jhs') || spec.includes('sec') || spec.includes('both');

      if (!allowsElem && !allowsJhs) {
        return res.json({
          totalAttendanceRecords: 0,
          totalSessions: 0,
          totalLearners: 0,
          presentRecords: 0,
          absentRecords: 0,
          clcAttendanceRate: 0,
        });
      }

      if (allowsElem && !allowsJhs) {
        if (where.learner?.level && where.learner.level !== 'ELEMENTARY') {
          return res.json({
            totalAttendanceRecords: 0,
            totalSessions: 0,
            totalLearners: 0,
            presentRecords: 0,
            absentRecords: 0,
            clcAttendanceRate: 0,
          });
        }
        where.learner = { ...(where.learner || {}), level: 'ELEMENTARY' };
      } else if (allowsJhs && !allowsElem) {
        if (where.learner?.level && where.learner.level !== 'JUNIOR') {
          return res.json({
            totalAttendanceRecords: 0,
            totalSessions: 0,
            totalLearners: 0,
            presentRecords: 0,
            absentRecords: 0,
            clcAttendanceRate: 0,
          });
        }
        where.learner = { ...(where.learner || {}), level: 'JUNIOR' };
      }
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

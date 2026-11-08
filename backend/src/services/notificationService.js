import prisma from '../config/prisma.js';
import { calculateModuleProgress } from '../utils/progressCalculator.js';

/**
 * Parse schedule date & time into a Date object representing Asia/Manila (+08:00)
 */
export function parseScheduleDateTime(dateVal, timeStr) {
  if (!dateVal) return null;
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return null;

  let yyyy, mm, dd;
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    [yyyy, mm, dd] = dateVal.slice(0, 10).split('-');
  } else {
    const iso = d.toISOString().slice(0, 10);
    [yyyy, mm, dd] = iso.split('-');
  }

  let hours = 9;
  let minutes = 0;
  if (timeStr) {
    const s = String(timeStr).trim();
    const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (m) {
      hours = parseInt(m[1], 10);
      minutes = parseInt(m[2], 10);
      const ampm = m[4] ? m[4].toUpperCase() : null;
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
  }

  const pad = (n) => String(n).padStart(2, '0');
  const manilaIso = `${yyyy}-${pad(mm)}-${pad(dd)}T${pad(hours)}:${pad(minutes)}:00+08:00`;
  const res = new Date(manilaIso);
  return isNaN(res.getTime()) ? null : res;
}

/**
 * Format a time string into 12-hour AM/PM format (e.g. 9:00 AM)
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const s = String(timeStr).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return s;
  let h = parseInt(m[1], 10);
  const min = m[2];
  let ampm = m[4] ? m[4].toUpperCase() : null;
  if (!ampm) {
    ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
  }
  return `${h}:${min} ${ampm}`;
}

export function formatScheduleDateTimeSpan(date, startTime, endTime) {
  if (!date) return '';
  let datePart = '';
  try {
    const d = new Date(date);
    datePart = d.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    datePart = String(date).slice(0, 10);
  }

  const start12 = formatTime12h(startTime);
  const end12 = endTime ? formatTime12h(endTime) : '';

  if (start12 && end12) {
    return `${datePart}, ${start12} – ${end12}`;
  } else if (start12) {
    return `${datePart}, ${start12}`;
  }
  return datePart;
}

/**
 * Check if a date represents UTC midnight (00:00:00.000Z), typically produced by
 * date-only parsing (e.g. new Date('YYYY-MM-DD')) which causes false hour offsets.
 */
export function isMidnightUtc(dateVal) {
  if (!dateVal) return false;
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return false;
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

/**
 * Format relative time (e.g. 5m ago, 2h ago, Just now)
 * Standardizes time calculation:
 * - < 1 minute (including small negative clock drift): "Just now"
 * - 1–59 minutes: "Xm ago"
 * - 1–23 hours: "Xh ago"
 * - 1–6 days: "Xd ago"
 * - >= 7 days: formatted date in Asia/Manila timezone
 */
export function formatRelativeTime(dateInput, fallbackInput = null) {
  if (!dateInput && !fallbackInput) return '';
  let d = dateInput instanceof Date ? dateInput : (dateInput ? new Date(dateInput) : null);
  if (!d || isNaN(d.getTime())) {
    d = fallbackInput instanceof Date ? fallbackInput : (fallbackInput ? new Date(fallbackInput) : null);
  }
  if (!d || isNaN(d.getTime())) return '';

  // If dateInput is midnight UTC, attempt to use non-midnight fallbackInput (e.g. updatedAt)
  if (isMidnightUtc(d) && fallbackInput) {
    const fb = fallbackInput instanceof Date ? fallbackInput : new Date(fallbackInput);
    if (!isNaN(fb.getTime()) && !isMidnightUtc(fb)) {
      d = fb;
    }
  }

  const now = Date.now();
  const diffMs = now - d.getTime();

  // Handle small clock drift: -120s up to 60s is 'Just now'
  if (diffMs >= -120 * 1000 && diffMs < 60 * 1000) {
    return 'Just now';
  }

  // Future dates beyond small clock drift (e.g. scheduled in future)
  if (diffMs < -120 * 1000) {
    return d.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    // If date was corrupted to midnight UTC on today's calendar date in Manila,
    // prevent showing artificial "7h ago" or "8h ago"
    if (isMidnightUtc(d)) {
      const todayManila = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(now);
      const dManila = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(d);
      if (todayManila === dManila) {
        return 'Just now';
      }
    }
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Parse module End Date to the end of that day in Asia/Manila (+08:00)
 */
export function parseEndOfDayManila(dateVal) {
  if (!dateVal) return null;
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return null;

  let yyyy, mm, dd;
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    [yyyy, mm, dd] = dateVal.slice(0, 10).split('-');
  } else {
    const iso = d.toISOString().slice(0, 10);
    [yyyy, mm, dd] = iso.split('-');
  }

  const pad = (n) => String(n).padStart(2, '0');
  const manilaIso = `${yyyy}-${pad(mm)}-${pad(dd)}T23:59:59+08:00`;
  const res = new Date(manilaIso);
  return isNaN(res.getTime()) ? null : res;
}

/**
 * Create a persistent notification record in MySQL with deduplication.
 */
export async function createNotification({
  notificationKey,
  title,
  message,
  type = 'ANNOUNCEMENT',
  priority = 'NORMAL',
  isImportant = false,
  targetRole,
  targetUserId = null,
  targetTeacherId = null,
  targetLearnerId = null,
  learningCenterId = null,
  programLevel = null,
  sourceType = null,
  sourceId = null,
  linkUrl = null,
  deadlineAt = null,
  createdByRole = null,
  createdByName = null,
  createdAt = new Date(),
}) {
  if (!title || !message || !targetRole || !targetUserId) {
    return null;
  }

  const cleanTitle = title.trim();
  const cleanMessage = message.trim();

  try {
    // 1. Deduplicate by notificationKey
    if (notificationKey) {
      const existing = await prisma.notification.findUnique({
        where: { notificationKey },
      });
      if (existing) {
        if (
          existing.title !== cleanTitle ||
          existing.message !== cleanMessage ||
          (createdByName && existing.createdByName !== createdByName)
        ) {
          return await prisma.notification.update({
            where: { id: existing.id },
            data: {
              title: cleanTitle,
              message: cleanMessage,
              createdByName: createdByName || existing.createdByName,
              isImportant: Boolean(isImportant),
              priority: String(priority).toUpperCase(),
              linkUrl: linkUrl || existing.linkUrl,
            },
          });
        }
        return existing;
      }
    }

    // 2. Deduplicate by (sourceType, sourceId, targetUserId)
    if (sourceType && sourceId && targetUserId) {
      const existingBySource = await prisma.notification.findFirst({
        where: {
          targetUserId: Number(targetUserId),
          sourceType: String(sourceType),
          sourceId: Number(sourceId),
        },
      });
      if (existingBySource) {
        return await prisma.notification.update({
          where: { id: existingBySource.id },
          data: {
            notificationKey: notificationKey || existingBySource.notificationKey,
            title: cleanTitle,
            message: cleanMessage,
            createdByName: createdByName || existingBySource.createdByName,
            isImportant: Boolean(isImportant),
            priority: String(priority).toUpperCase(),
            linkUrl: linkUrl || existingBySource.linkUrl,
          },
        });
      }
    }

    const item = await prisma.notification.create({
      data: {
        notificationKey: notificationKey || null,
        title: cleanTitle,
        message: cleanMessage,
        type: String(type).toUpperCase(),
        priority: String(priority).toUpperCase(),
        isImportant: Boolean(isImportant),
        targetRole,
        targetUserId: Number(targetUserId),
        targetTeacherId: targetTeacherId ? Number(targetTeacherId) : null,
        targetLearnerId: targetLearnerId ? Number(targetLearnerId) : null,
        learningCenterId: learningCenterId ? Number(learningCenterId) : null,
        programLevel: programLevel ? String(programLevel).trim() : null,
        sourceType: sourceType ? String(sourceType).trim() : null,
        sourceId: sourceId ? Number(sourceId) : null,
        linkUrl: linkUrl ? String(linkUrl).trim() : null,
        deadlineAt: deadlineAt || null,
        createdByRole: createdByRole || null,
        createdByName: createdByName || null,
        createdAt: (createdAt && !isMidnightUtc(createdAt)) ? createdAt : new Date(),
      },
    });
    return item;
  } catch (err) {
    if (err.code === 'P2002' && notificationKey) {
      return await prisma.notification.findUnique({ where: { notificationKey } }).catch(() => null);
    }
    console.error('[NotificationService] createNotification failed:', err.message);
    return null;
  }
}

/**
 * EVENT 1: Learner Activity Submission
 * Notifies the teacher managing the module. Group multiple files into 1 notification per submission.
 */
export async function notifyActivitySubmitted({ submissionId, isUpdate = false }) {
  if (!submissionId) return;

  try {
    const sub = await prisma.submission.findUnique({
      where: { id: Number(submissionId) },
      include: {
        module: {
          include: {
            teacher: {
              include: { user: true },
            },
          },
        },
        learner: {
          select: { id: true, fullName: true, lrn: true },
        },
      },
    });

    if (!sub || !sub.module || !sub.module.teacher?.user) return;

    const teacher = sub.module.teacher;
    const learner = sub.learner;
    const mod = sub.module;

    const notifKey = isUpdate
      ? `submission_update:${sub.id}:${Math.floor(Date.now() / 60000)}`
      : `submission:${sub.id}`;

    const title = isUpdate ? 'Activity Submission Updated' : 'New Activity Submission';
    const message = isUpdate
      ? `${learner.fullName} updated their activity submission for ${mod.title}.`
      : `${learner.fullName} submitted an activity for ${mod.title}.`;

    await createNotification({
      notificationKey: notifKey,
      title,
      message,
      type: 'SUBMISSION',
      priority: 'NORMAL',
      isImportant: false,
      targetRole: 'TEACHER',
      targetUserId: teacher.user.id,
      targetTeacherId: teacher.id,
      targetLearnerId: learner.id,
      learningCenterId: mod.learningCenterId,
      sourceType: 'submission',
      sourceId: sub.id,
      linkUrl: `/dashboard/modules/${mod.id}?tab=submissions`,
      createdByName: learner.fullName,
      createdByRole: 'LEARNER',
    });

    // If all assigned learners have now submitted, clean up any pending missing submissions notification
    try {
      let assignedLearnerIds = [];
      const assignments = await prisma.moduleAssignment.findMany({
        where: { moduleId: mod.id },
        select: { learnerId: true },
      });
      if (assignments.length > 0) {
        assignedLearnerIds = assignments.map((a) => a.learnerId);
      } else if (teacher.id) {
        const candidates = await prisma.learner.findMany({
          where: { assignedTeacherId: teacher.id, level: mod.targetLevel, status: 'Active' },
          select: { id: true },
        });
        assignedLearnerIds = candidates.map((c) => c.id);
      }
      if (assignedLearnerIds.length > 0) {
        const submitted = await prisma.submission.findMany({
          where: { moduleId: mod.id, learnerId: { in: assignedLearnerIds } },
          select: { learnerId: true },
        });
        const unsubmittedCount = assignedLearnerIds.filter((id) => !submitted.some((s) => s.learnerId === id)).length;
        if (unsubmittedCount === 0) {
          await prisma.notification.deleteMany({
            where: {
              sourceType: 'missing_submissions',
              sourceId: mod.id,
            },
          });
        }
      }
    } catch (_checkErr) {
      // non-fatal
    }
  } catch (err) {
    console.error('[NotificationService] notifyActivitySubmitted error:', err);
  }
}

/**
 * EVENT 2: Teacher Added a Learner Record
 * Notifies the Admin portal when a teacher records learner performance with actual learner and module names.
 */
export async function notifyLearnerRecordCreated({ teacherId, learnerId, moduleTitle, recordId }) {
  try {
    let teacherName = 'ALS Teacher';
    if (teacherId) {
      const t = await prisma.teacher.findUnique({
        where: { id: Number(teacherId) },
        select: { fullName: true },
      });
      if (t?.fullName) teacherName = t.fullName;
    }

    let learnerName = 'a learner';
    if (learnerId) {
      const l = await prisma.learner.findUnique({
        where: { id: Number(learnerId) },
        select: { fullName: true },
      });
      if (l?.fullName) learnerName = l.fullName;
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    const modSuffix = moduleTitle ? ` for ${moduleTitle}` : '';

    for (const admin of admins) {
      const notifKey = `record_added:${recordId || Date.now()}:admin:${admin.id}`;
      await createNotification({
        notificationKey: notifKey,
        title: 'New Learner Record',
        message: `${teacherName} added a performance record for ${learnerName}${modSuffix}.`,
        type: 'RECORD',
        priority: 'NORMAL',
        isImportant: false,
        targetRole: 'ADMIN',
        targetUserId: admin.id,
        sourceType: 'record',
        sourceId: recordId ? Number(recordId) : null,
        linkUrl: '/dashboard/reports/learner-records',
        createdByName: teacherName,
        createdByRole: 'TEACHER',
      });
    }
  } catch (err) {
    console.error('[NotificationService] notifyLearnerRecordCreated error:', err);
  }
}

/**
 * EVENT 2B: New Learner Registered
 * When a teacher registers a learner, notify District Coordinator (Admin).
 */
export async function notifyNewLearnerRegistered({ learner, teacherId, teacherName }) {
  if (!learner) return;

  try {
    let resolvedTeacherName = teacherName;
    if (!resolvedTeacherName && teacherId) {
      const t = await prisma.teacher.findUnique({
        where: { id: Number(teacherId) },
        select: { fullName: true },
      });
      resolvedTeacherName = t?.fullName;
    }
    if (!resolvedTeacherName) resolvedTeacherName = 'An ALS Teacher';

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    const lrnSuffix = learner.lrn ? ` (${learner.lrn})` : '';

    for (const admin of admins) {
      const notifKey = `learner_registered:${learner.id}:admin:${admin.id}`;
      await createNotification({
        notificationKey: notifKey,
        title: 'New Learner Registered',
        message: `${resolvedTeacherName} registered a new learner: ${learner.fullName}${lrnSuffix}.`,
        type: 'LEARNER',
        priority: 'NORMAL',
        isImportant: false,
        targetRole: 'ADMIN',
        targetUserId: admin.id,
        sourceType: 'learner',
        sourceId: learner.id,
        linkUrl: '/dashboard/learners',
        createdByName: resolvedTeacherName,
        createdByRole: 'TEACHER',
      });
    }
  } catch (err) {
    console.error('[NotificationService] notifyNewLearnerRegistered error:', err);
  }
}

/**
 * EVENT 2C: New Learner Assignment
 * When Admin assigns a learner to a teacher.
 */
export async function notifyLearnerAssigned({ learnerId, teacherId, assignedByName = 'District Coordinator' }) {
  if (!learnerId || !teacherId) return;

  try {
    const learner = await prisma.learner.findUnique({
      where: { id: Number(learnerId) },
      select: { id: true, fullName: true, lrn: true },
    });
    const teacher = await prisma.teacher.findUnique({
      where: { id: Number(teacherId) },
      include: { user: true },
    });

    if (!learner || !teacher?.user) return;

    const notifKey = `learner_assigned:${learner.id}:${teacher.id}`;
    await createNotification({
      notificationKey: notifKey,
      title: 'New Learner Assigned',
      message: `${learner.fullName} has been assigned to you.`,
      type: 'ASSIGNMENT',
      priority: 'NORMAL',
      isImportant: false,
      targetRole: 'TEACHER',
      targetUserId: teacher.user.id,
      targetTeacherId: teacher.id,
      targetLearnerId: learner.id,
      sourceType: 'learner_assignment',
      sourceId: learner.id,
      linkUrl: `/dashboard/learners/${learner.id}`,
      createdByName: assignedByName || 'District Coordinator',
      createdByRole: 'ADMIN',
    });
  } catch (err) {
    console.error('[NotificationService] notifyLearnerAssigned error:', err);
  }
}

/**
 * EVENT 2D: Schedule Created
 * Informs involved teacher (if created by Admin) or Admin (if created by Teacher).
 */
export async function notifyScheduleCreated({ scheduleId, creatorRole, creatorUserId }) {
  if (!scheduleId) return;

  try {
    const s = await prisma.schedule.findUnique({
      where: { id: Number(scheduleId) },
      include: {
        learningCenter: { select: { id: true, name: true } },
        teacher: { include: { user: true } },
      },
    });

    if (!s) return;

    const centerName = s.learningCenter?.name || 'Assigned Learning Center';
    const time12h = formatTime12h(s.startTime);
    const dateStr = s.date instanceof Date
      ? s.date.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })
      : String(s.date).slice(0, 10);

    // If created by Admin and assigned to a teacher -> notify teacher
    if (creatorRole === 'ADMIN' && s.teacher?.user) {
      await createNotification({
        notificationKey: `schedule_assigned:${s.id}:teacher:${s.teacher.user.id}`,
        title: (s.title || 'Schedule').trim(),
        message: s.description ? s.description.trim() : '',
        type: 'SCHEDULE',
        priority: 'NORMAL',
        isImportant: Boolean(s.isImportant),
        targetRole: 'TEACHER',
        targetUserId: s.teacher.user.id,
        targetTeacherId: s.teacher.id,
        learningCenterId: s.learningCenterId,
        sourceType: 'schedule',
        sourceId: s.id,
        linkUrl: `/dashboard/schedule?id=${s.id}`,
        createdByName: 'District Coordinator',
        createdByRole: 'ADMIN',
      });
    }

    // If created by Teacher -> only notify Admin if Admin is explicitly the creator or involved in district session
    if (creatorRole === 'TEACHER' && s.createdByRole === 'ADMIN') {
      const teacherName = s.teacher?.fullName || 'An ALS Teacher';
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', status: 'ACTIVE' },
        select: { id: true },
      });
      for (const admin of admins) {
        await createNotification({
          notificationKey: `schedule_created:${s.id}:admin:${admin.id}`,
          title: (s.title || 'Schedule').trim(),
          message: s.description ? s.description.trim() : '',
          type: 'SCHEDULE',
          priority: 'NORMAL',
          isImportant: Boolean(s.isImportant),
          targetRole: 'ADMIN',
          targetUserId: admin.id,
          learningCenterId: s.learningCenterId,
          sourceType: 'schedule',
          sourceId: s.id,
          linkUrl: `/dashboard/schedule?id=${s.id}`,
          createdByName: teacherName,
          createdByRole: 'TEACHER',
        });
      }
    }
  } catch (err) {
    console.error('[NotificationService] notifyScheduleCreated error:', err);
  }
}

/**
 * EVENT 2E: Schedule Updated
 * Updates existing linked notifications and cleans up old reminders.
 */
export async function notifyScheduleUpdated({ scheduleId, updaterRole, updaterUserId }) {
  if (!scheduleId) return;

  try {
    const s = await prisma.schedule.findUnique({
      where: { id: Number(scheduleId) },
      include: {
        learningCenter: { select: { id: true, name: true } },
        teacher: { include: { user: true } },
      },
    });

    if (!s) return;

    // Invalidate/delete old schedule reminders for this schedule
    await prisma.notification.deleteMany({
      where: {
        sourceType: 'schedule',
        sourceId: s.id,
        notificationKey: { contains: 'schedule_reminder_' },
      },
    }).catch(() => {});

    // Update all existing notifications for this schedule to reflect current title & message
    await prisma.notification.updateMany({
      where: {
        sourceType: 'schedule',
        sourceId: s.id,
      },
      data: {
        title: (s.title || 'Schedule').trim(),
        message: s.description ? s.description.trim() : '',
        isImportant: Boolean(s.isImportant || s.priority === 'IMPORTANT'),
        priority: s.priority || 'NORMAL',
        linkUrl: `/dashboard/schedule?id=${s.id}`,
        updatedAt: new Date(),
      },
    }).catch(() => {});

    // If schedule was marked Cancelled, delete its notifications
    if (s.status === 'Cancelled') {
      await prisma.notification.deleteMany({
        where: {
          sourceType: 'schedule',
          sourceId: s.id,
        },
      }).catch(() => {});
      return;
    }

    // If updated by Admin and assigned to a teacher -> notify teacher
    if (updaterRole === 'ADMIN' && s.teacher?.user) {
      await createNotification({
        notificationKey: `schedule_updated:${s.id}:teacher:${s.teacher.user.id}:${Date.now()}`,
        title: (s.title || 'Schedule').trim(),
        message: s.description ? s.description.trim() : '',
        type: 'SCHEDULE',
        priority: 'IMPORTANT',
        isImportant: true,
        targetRole: 'TEACHER',
        targetUserId: s.teacher.user.id,
        targetTeacherId: s.teacher.id,
        learningCenterId: s.learningCenterId,
        sourceType: 'schedule',
        sourceId: s.id,
        linkUrl: `/dashboard/schedule?id=${s.id}`,
        createdByName: 'District Coordinator',
        createdByRole: 'ADMIN',
      });
    }
  } catch (err) {
    console.error('[NotificationService] notifyScheduleUpdated error:', err);
  }
}

/**
 * EVENT 2F: Schedule Canceled or Deleted
 * Cleans up existing reminders and notifications for the deleted schedule.
 */
export async function notifyScheduleCanceled({ schedule, cancelerRole, cancelerUserId }) {
  if (!schedule) return;

  try {
    // Delete all existing schedule notifications for this schedule
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { sourceType: 'schedule', sourceId: schedule.id },
          { notificationKey: { contains: `:${schedule.id}:` } },
        ],
      },
    }).catch(() => {});

    await prisma.notificationRead.deleteMany({
      where: {
        notificationKey: { contains: `:${schedule.id}:` },
      },
    }).catch(() => {});
  } catch (err) {
    console.error('[NotificationService] notifyScheduleCanceled error:', err);
  }
}

/**
 * EVENT 2G: Learning Center Updated
 * Notifies District Coordinator (Admin) when learning center details are modified.
 */
export async function notifyLearningCenterUpdated({ centerId, updaterName, updaterRole }) {
  if (!centerId) return;

  try {
    const center = await prisma.learningCenter.findUnique({
      where: { id: Number(centerId) },
      select: { id: true, name: true },
    });

    if (!center) return;

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    const updaterSuffix = updaterName ? ` by ${updaterName}` : '';

    for (const admin of admins) {
      const notifKey = `center_updated:${center.id}:${Math.floor(Date.now() / 60000)}:admin:${admin.id}`;
      await createNotification({
        notificationKey: notifKey,
        title: 'Learning Center Updated',
        message: `Details for ${center.name} have been updated${updaterSuffix}.`,
        type: 'CENTER',
        priority: 'NORMAL',
        isImportant: false,
        targetRole: 'ADMIN',
        targetUserId: admin.id,
        learningCenterId: center.id,
        sourceType: 'center',
        sourceId: center.id,
        linkUrl: '/dashboard/learning-centers',
        createdByName: updaterName || 'ALS User',
        createdByRole: updaterRole || 'ADMIN',
      });
    }
  } catch (err) {
    console.error('[NotificationService] notifyLearningCenterUpdated error:', err);
  }
}

/**
 * EVENT 3: Announcement Published
 * Delivers recipient-specific notifications based on audience:
 * - Admin announcement -> eligible Teachers and/or Learners (never Admin themselves!)
 * - Teacher announcement -> intended Learners (never Admin, never other Teachers!)
 */
export async function notifyAnnouncementPublished(announcementId) {
  if (!announcementId) return;

  try {
    const ann = await prisma.announcement.findUnique({
      where: { id: Number(announcementId) },
      include: {
        author: {
          include: {
            adminProfile: true,
            teacherProfile: true,
          },
        },
      },
    });

    if (!ann || ann.status !== 'PUBLISHED') return;
    // If scheduled for a future date, do not publish notification yet
    if (ann.scheduledAt && new Date(ann.scheduledAt) > new Date()) return;

    const isAuthorAdmin = ann.creatorRole === 'ADMIN' || ann.author?.role === 'ADMIN';
    const isAuthorTeacher = ann.creatorRole === 'TEACHER' || ann.author?.role === 'TEACHER' || ann.teacherId != null;

    const annTitle = (ann.title || 'Announcement').trim();
    const annMessage = (ann.content || '').trim();

    // 1. Admin Announcement:
    if (isAuthorAdmin) {
      const audience = String(ann.audience || '').toUpperCase();
      const includesTeachers = ['ALL_TEACHERS', 'TEACHERS', 'ALL'].includes(audience);
      const includesLearners = ['ALL_LEARNERS', 'LEARNERS', 'ALL', 'SPECIFIC_LEARNER', 'INDIVIDUAL_LEARNER'].includes(audience);

      // A. Deliver to Teachers
      if (includesTeachers) {
        const teacherWhere = { status: 'Active' };
        if (ann.learningCenterId) {
          teacherWhere.learningCenterId = ann.learningCenterId;
        }

        const teachers = await prisma.teacher.findMany({
          where: teacherWhere,
          select: { id: true, userId: true },
        });

        const adminSender = ann.author?.adminProfile?.fullName || 'District Coordinator';
        for (const t of teachers) {
          if (!t.userId) continue;
          await createNotification({
            notificationKey: `announcement:${ann.id}:user:${t.userId}`,
            title: annTitle,
            message: annMessage,
            type: 'ANNOUNCEMENT',
            priority: ann.priority || 'NORMAL',
            isImportant: Boolean(ann.isImportant || ann.isPinned),
            targetRole: 'TEACHER',
            targetUserId: t.userId,
            targetTeacherId: t.id,
            learningCenterId: ann.learningCenterId,
            sourceType: 'announcement',
            sourceId: ann.id,
            linkUrl: `/dashboard/announcements?id=${ann.id}`,
            createdByName: adminSender,
            createdByRole: 'ADMIN',
            createdAt: new Date(),
          });
        }
      }

      // B. Deliver to Learners
      if (includesLearners) {
        const learnerWhere = { status: 'Active' };
        if (ann.targetLearnerId) {
          learnerWhere.id = ann.targetLearnerId;
        } else {
          if (ann.learningCenterId) {
            learnerWhere.learningCenterId = ann.learningCenterId;
          }
          if (ann.programLevel) {
            const pUpper = String(ann.programLevel).toUpperCase();
            if (pUpper.includes('ELEM')) learnerWhere.level = 'ELEMENTARY';
            else if (pUpper.includes('JUN')) learnerWhere.level = 'JUNIOR';
          }
        }

        const learners = await prisma.learner.findMany({
          where: learnerWhere,
          select: { id: true, userId: true },
        });

        const adminSender = ann.author?.adminProfile?.fullName || 'District Coordinator';
        for (const l of learners) {
          if (!l.userId) continue;
          await createNotification({
            notificationKey: `announcement:${ann.id}:user:${l.userId}`,
            title: annTitle,
            message: annMessage,
            type: 'ANNOUNCEMENT',
            priority: ann.priority || 'NORMAL',
            isImportant: Boolean(ann.isImportant || ann.isPinned),
            targetRole: 'LEARNER',
            targetUserId: l.userId,
            targetLearnerId: l.id,
            learningCenterId: ann.learningCenterId,
            sourceType: 'announcement',
            sourceId: ann.id,
            linkUrl: '/notifications',
            createdByName: adminSender,
            createdByRole: 'ADMIN',
            createdAt: new Date(),
          });
        }
      }
    }

    // 2. Teacher Announcement (to assigned learners only):
    else if (isAuthorTeacher && ann.teacherId) {
      const learnerWhere = {
        assignedTeacherId: ann.teacherId,
        status: 'Active',
      };

      if (ann.targetLearnerId) {
        learnerWhere.id = ann.targetLearnerId;
      } else {
        if (ann.learningCenterId) {
          learnerWhere.learningCenterId = ann.learningCenterId;
        }
        if (ann.programLevel) {
          const pUpper = String(ann.programLevel).toUpperCase();
          if (pUpper.includes('ELEM')) learnerWhere.level = 'ELEMENTARY';
          else if (pUpper.includes('JUN')) learnerWhere.level = 'JUNIOR';
        }
      }

      const learners = await prisma.learner.findMany({
        where: learnerWhere,
        select: { id: true, userId: true },
      });

      let teacherSender = ann.author?.teacherProfile?.fullName;
      if (!teacherSender && ann.teacherId) {
        const t = await prisma.teacher.findUnique({
          where: { id: ann.teacherId },
          select: { fullName: true },
        });
        teacherSender = t?.fullName;
      }
      if (!teacherSender) teacherSender = 'Assigned Teacher';

      for (const l of learners) {
        if (!l.userId) continue;
        await createNotification({
          notificationKey: `announcement:${ann.id}:user:${l.userId}`,
          title: annTitle,
          message: annMessage,
          type: 'ANNOUNCEMENT',
          priority: ann.priority || 'NORMAL',
          isImportant: Boolean(ann.isImportant || ann.isPinned),
          targetRole: 'LEARNER',
          targetUserId: l.userId,
          targetLearnerId: l.id,
          learningCenterId: ann.learningCenterId,
          sourceType: 'announcement',
          sourceId: ann.id,
          linkUrl: '/notifications',
          createdByName: teacherSender,
          createdByRole: 'TEACHER',
          createdAt: new Date(),
        });
      }
    }
  } catch (err) {
    console.error('[NotificationService] notifyAnnouncementPublished error:', err);
  }
}

/**
 * Updates existing linked notifications when an announcement is updated
 */
export async function notifyAnnouncementUpdated(announcementId) {
  if (!announcementId) return;
  try {
    const ann = await prisma.announcement.findUnique({
      where: { id: Number(announcementId) },
      include: {
        author: {
          include: { adminProfile: true, teacherProfile: true },
        },
      },
    });

    if (!ann || ann.status !== 'PUBLISHED') {
      await prisma.notification.deleteMany({
        where: {
          sourceType: 'announcement',
          sourceId: Number(announcementId),
        },
      }).catch(() => {});
      return;
    }

    const sender =
      ann.creatorRole === 'TEACHER'
        ? (ann.author?.teacherProfile?.fullName || 'Assigned Teacher')
        : (ann.author?.adminProfile?.fullName || 'District Coordinator');

    await prisma.notification.updateMany({
      where: {
        sourceType: 'announcement',
        sourceId: ann.id,
      },
      data: {
        title: (ann.title || 'Announcement').trim(),
        message: (ann.content || '').trim(),
        isImportant: Boolean(ann.isImportant || ann.isPinned),
        priority: ann.priority || 'NORMAL',
        createdByName: sender,
        deadlineAt: ann.deadlineAt || null,
        linkUrl: `/dashboard/announcements?id=${ann.id}`,
        updatedAt: new Date(),
      },
    }).catch(() => {});
  } catch (err) {
    console.error('[NotificationService] notifyAnnouncementUpdated error:', err);
  }
}

/**
 * Removes all linked notifications and reads when an announcement is deleted
 */
export async function notifyAnnouncementDeleted(announcementId) {
  if (!announcementId) return;
  try {
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { sourceType: 'announcement', sourceId: Number(announcementId) },
          { notificationKey: { contains: `announcement:${announcementId}:` } },
        ],
      },
    }).catch(() => {});

    await prisma.notificationRead.deleteMany({
      where: {
        notificationKey: { contains: `announcement:${announcementId}` },
      },
    }).catch(() => {});
  } catch (err) {
    console.error('[NotificationService] notifyAnnouncementDeleted error:', err);
  }
}

/**
 * EVENT 4: New Module Available
 * When an assigned teacher publishes a module, notify the eligible learners.
 */
export async function notifyModulePublished(moduleId) {
  if (!moduleId) return;

  try {
    const mod = await prisma.module.findUnique({
      where: { id: Number(moduleId) },
      include: {
        teacher: true,
        assignments: { select: { learnerId: true } },
      },
    });

    if (!mod || mod.status !== 'PUBLISHED' || !mod.teacherId) return;

    // Determine target learners
    let targetLearnerIds = [];
    if (mod.assignments && mod.assignments.length > 0) {
      targetLearnerIds = mod.assignments.map((a) => a.learnerId);
    } else {
      const learnerWhere = {
        assignedTeacherId: mod.teacherId,
        level: mod.targetLevel,
        status: 'Active',
      };
      if (mod.learningCenterId) {
        learnerWhere.learningCenterId = mod.learningCenterId;
      }
      const candidates = await prisma.learner.findMany({
        where: learnerWhere,
        select: { id: true },
      });
      targetLearnerIds = candidates.map((c) => c.id);
    }

    if (targetLearnerIds.length === 0) return;

    const learners = await prisma.learner.findMany({
      where: { id: { in: targetLearnerIds } },
      select: { id: true, userId: true },
    });

    const teacherName = mod.teacher?.fullName || 'Assigned Teacher';

    for (const l of learners) {
      if (!l.userId) continue;
      await createNotification({
        notificationKey: `module_published:${mod.id}:user:${l.userId}`,
        title: 'New Learning Module Available',
        message: `Your teacher, ${teacherName}, added a new learning module: ${mod.title}.`,
        type: 'MODULE',
        priority: 'NORMAL',
        isImportant: false,
        targetRole: 'LEARNER',
        targetUserId: l.userId,
        targetLearnerId: l.id,
        learningCenterId: mod.learningCenterId,
        sourceType: 'module',
        sourceId: mod.id,
        linkUrl: `/modules/${mod.id}`,
        createdByName: teacherName,
        createdByRole: 'TEACHER',
        createdAt: new Date(),
      });
    }
  } catch (err) {
    console.error('[NotificationService] notifyModulePublished error:', err);
  }
}

/**
 * CHECK 1: Schedule Reminders (Admin & Teacher)
 * Generates 1-day and 1-hour reminders before upcoming learning sessions.
 */
export async function checkScheduleReminders() {
  const now = new Date();
  const pastCutoff = new Date(now.getTime() - 24 * 3600 * 1000);
  const futureHorizon = new Date(now.getTime() + 48 * 3600 * 1000);

  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        date: { gte: pastCutoff, lte: futureHorizon },
        status: { not: 'Cancelled' },
      },
      include: {
        learningCenter: { select: { id: true, name: true } },
        teacher: { select: { id: true, userId: true, fullName: true } },
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    for (const s of schedules) {
      const schedStart = parseScheduleDateTime(s.date, s.startTime);
      if (!schedStart) continue;

      const diffMs = schedStart.getTime() - now.getTime();
      const diffHours = diffMs / (3600 * 1000);

      const centerName = s.learningCenter?.name || 'Assigned Learning Center';
      const time12h = formatTime12h(s.startTime);
      const adminInvolved = (s.createdByRole === 'ADMIN' && !s.teacherId) || (!s.teacherId && !s.createdByUserId);
      const schedTitle = (s.title || 'Schedule').trim();
      const schedMessage = s.description ? s.description.trim() : '';

      // --- 1 DAY BEFORE (within 24 hours and > 1 hour remaining) ---
      if (diffHours <= 24 && diffHours > 1) {
        // A. For Admin (only if Admin is involved: created by Admin or district coordination session)
        if (adminInvolved) {
          for (const admin of admins) {
            if (s.createdByUserId && s.createdByUserId !== admin.id) continue;
            const key = `schedule_reminder_1d:${s.id}:admin:${admin.id}`;
            await createNotification({
              notificationKey: key,
              title: schedTitle,
              message: schedMessage,
              type: 'SCHEDULE',
              priority: 'IMPORTANT',
              isImportant: true,
              targetRole: 'ADMIN',
              targetUserId: admin.id,
              learningCenterId: s.learningCenterId,
              sourceType: 'schedule',
              sourceId: s.id,
              linkUrl: `/dashboard/schedule?id=${s.id}`,
              deadlineAt: schedStart,
            });
          }
        }

        // B. For Teacher (if assigned)
        if (s.teacher?.userId) {
          const key = `schedule_reminder_1d:${s.id}:teacher:${s.teacher.userId}`;
          await createNotification({
            notificationKey: key,
            title: schedTitle,
            message: schedMessage,
            type: 'SCHEDULE',
            priority: 'IMPORTANT',
            isImportant: true,
            targetRole: 'TEACHER',
            targetUserId: s.teacher.userId,
            targetTeacherId: s.teacher.id,
            learningCenterId: s.learningCenterId,
            sourceType: 'schedule',
            sourceId: s.id,
            linkUrl: `/dashboard/schedule?id=${s.id}`,
            deadlineAt: schedStart,
          });
        }
      }

      // --- 1 HOUR BEFORE (within 1 hour and > 0 minutes remaining) ---
      if (diffHours <= 1 && diffHours > 0) {
        // A. For Admin (only if Admin is directly involved)
        if (adminInvolved) {
          for (const admin of admins) {
            if (s.createdByUserId && s.createdByUserId !== admin.id) continue;
            const key = `schedule_reminder_1h:${s.id}:admin:${admin.id}`;
            await createNotification({
              notificationKey: key,
              title: schedTitle,
              message: schedMessage,
              type: 'SCHEDULE',
              priority: 'IMPORTANT',
              isImportant: true,
              targetRole: 'ADMIN',
              targetUserId: admin.id,
              learningCenterId: s.learningCenterId,
              sourceType: 'schedule',
              sourceId: s.id,
              linkUrl: `/dashboard/schedule?id=${s.id}`,
              deadlineAt: schedStart,
            });
          }
        }

        // B. For Teacher (if assigned)
        if (s.teacher?.userId) {
          const key = `schedule_reminder_1h:${s.id}:teacher:${s.teacher.userId}`;
          await createNotification({
            notificationKey: key,
            title: schedTitle,
            message: schedMessage,
            type: 'SCHEDULE',
            priority: 'IMPORTANT',
            isImportant: true,
            targetRole: 'TEACHER',
            targetUserId: s.teacher.userId,
            targetTeacherId: s.teacher.id,
            learningCenterId: s.learningCenterId,
            sourceType: 'schedule',
            sourceId: s.id,
            linkUrl: `/dashboard/schedule?id=${s.id}`,
            deadlineAt: schedStart,
          });
        }
      }
    }
  } catch (err) {
    console.error('[NotificationService] checkScheduleReminders error:', err);
  }
}

/**
 * CHECK 2: Module End Date Reminders (Teacher & Learner)
 * - Teacher: Notifies when module ends in 2 days and assigned learners have unsubmitted activities.
 * - Learner: Notifies 2 days before and on the End Date if learner still has incomplete activities.
 */
export async function checkModuleDeadlineReminders() {
  const now = new Date();
  const pastCutoff = new Date(now.getTime() - 24 * 3600 * 1000);
  const futureHorizon = new Date(now.getTime() + 96 * 3600 * 1000);

  try {
    const modules = await prisma.module.findMany({
      where: {
        status: 'PUBLISHED',
        dateEnded: { gte: pastCutoff, lte: futureHorizon },
      },
      include: {
        teacher: { select: { id: true, userId: true } },
        assignments: { select: { learnerId: true } },
        assessments: {
          include: {
            questions: { select: { id: true } },
            attempts: { where: { status: 'SUBMITTED' } },
          },
        },
        learnerProgress: true,
        submissions: { select: { id: true, learnerId: true, status: true } },
      },
    });

    for (const m of modules) {
      if (!m.dateEnded) continue;
      const deadline = parseEndOfDayManila(m.dateEnded);
      if (!deadline) continue;

      const diffMs = deadline.getTime() - now.getTime();
      const diffHours = diffMs / (3600 * 1000);

      // Resolve assigned learners
      let learnerIds = [];
      if (m.assignments && m.assignments.length > 0) {
        learnerIds = m.assignments.map((a) => a.learnerId);
      } else if (m.teacherId) {
        const candidates = await prisma.learner.findMany({
          where: {
            assignedTeacherId: m.teacherId,
            level: m.targetLevel,
            status: 'Active',
            ...(m.learningCenterId ? { learningCenterId: m.learningCenterId } : {}),
          },
          select: { id: true },
        });
        learnerIds = candidates.map((c) => c.id);
      }

      if (learnerIds.length === 0) continue;

      const learners = await prisma.learner.findMany({
        where: { id: { in: learnerIds } },
        select: { id: true, userId: true, fullName: true },
      });

      // Filter unsubmitted learners
      const unsubmittedLearners = learners.filter((l) => {
        return !m.submissions.some((s) => s.learnerId === l.id);
      });

      // --- TEACHER MISSING SUBMISSION REMINDER (2 Days Before) ---
      if (unsubmittedLearners.length === 0) {
        // If all learners have submitted, stop and clean up any pending reminder
        await prisma.notification.deleteMany({
          where: {
            sourceType: 'missing_submissions',
            sourceId: m.id,
          },
        }).catch(() => {});
      } else if (diffHours <= 48 && diffHours > 0 && m.teacher?.userId && unsubmittedLearners.length > 0) {
        const key = `missing_submissions_2d:${m.id}:${m.teacher.id}`;
        await createNotification({
          notificationKey: key,
          title: 'Activity Due Soon',
          message: `${unsubmittedLearners.length} ${unsubmittedLearners.length === 1 ? 'learner has' : 'learners have'} not submitted their activities for ${m.title}. The module ends in 2 days.`,
          type: 'REMINDER',
          priority: 'IMPORTANT',
          isImportant: true,
          targetRole: 'TEACHER',
          targetUserId: m.teacher.userId,
          targetTeacherId: m.teacher.id,
          learningCenterId: m.learningCenterId,
          sourceType: 'missing_submissions',
          sourceId: m.id,
          linkUrl: `/dashboard/modules/${m.id}?tab=submissions`,
          deadlineAt: deadline,
        });
      }

      // --- LEARNER REMINDERS (Only if learner has NOT completed all 4 activities!) ---
      for (const learner of learners) {
        if (!learner.userId) continue;

        // Check real progress:
        const lp = m.learnerProgress.find((p) => p.learnerId === learner.id);
        const learnerAttempts = m.assessments.flatMap((a) => (a.attempts || []).filter((att) => att.learnerId === learner.id));
        const learnerSubs = m.submissions.filter((s) => s.learnerId === learner.id);

        const progressResult = calculateModuleProgress({
          module: m,
          learnerProgress: lp,
          attempts: learnerAttempts,
          submissions: learnerSubs,
        });

        // If learner has completely finished module workflow, stop and delete future deadline reminders
        if (progressResult.completed) {
          await prisma.notification.deleteMany({
            where: {
              sourceType: 'module_deadline',
              sourceId: m.id,
              targetUserId: learner.userId,
            },
          }).catch(() => {});
          continue;
        }

        const formattedDeadline = deadline.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        // 3 Days Before (between 48h and 72h)
        if (diffHours <= 72 && diffHours > 48) {
          const key = `module_deadline_3d:${m.id}:user:${learner.userId}`;
          await createNotification({
            notificationKey: key,
            title: 'Module Deadline Reminder',
            message: `Your learning module, ${m.title}, is due on ${formattedDeadline}. Please complete your remaining activities.`,
            type: 'REMINDER',
            priority: 'IMPORTANT',
            isImportant: true,
            targetRole: 'LEARNER',
            targetUserId: learner.userId,
            targetLearnerId: learner.id,
            learningCenterId: m.learningCenterId,
            sourceType: 'module_deadline',
            sourceId: m.id,
            linkUrl: `/modules/${m.id}`,
            deadlineAt: deadline,
          });
        }

        // 1 Day Before (between 12h and 24h)
        if (diffHours <= 24 && diffHours > 12) {
          const key = `module_deadline_1d:${m.id}:user:${learner.userId}`;
          await createNotification({
            notificationKey: key,
            title: 'Module Deadline Reminder',
            message: `Your learning module, ${m.title}, is due tomorrow (${formattedDeadline}). Please complete your remaining activities.`,
            type: 'REMINDER',
            priority: 'IMPORTANT',
            isImportant: true,
            targetRole: 'LEARNER',
            targetUserId: learner.userId,
            targetLearnerId: learner.id,
            learningCenterId: m.learningCenterId,
            sourceType: 'module_deadline',
            sourceId: m.id,
            linkUrl: `/modules/${m.id}`,
            deadlineAt: deadline,
          });
        }

        // On End Date (between 0h and 12h)
        if (diffHours <= 12 && diffHours > 0) {
          const key = `module_deadline_0d:${m.id}:user:${learner.userId}`;
          await createNotification({
            notificationKey: key,
            title: 'Module Deadline Reminder',
            message: `Your learning module, ${m.title}, is due today (${formattedDeadline}). Please complete your remaining activities.`,
            type: 'REMINDER',
            priority: 'IMPORTANT',
            isImportant: true,
            targetRole: 'LEARNER',
            targetUserId: learner.userId,
            targetLearnerId: learner.id,
            learningCenterId: m.learningCenterId,
            sourceType: 'module_deadline',
            sourceId: m.id,
            linkUrl: `/modules/${m.id}`,
            deadlineAt: deadline,
          });
        }
      }
    }
  } catch (err) {
    console.error('[NotificationService] checkModuleDeadlineReminders error:', err);
  }
}

/**
 * Backfill existing events on system startup (announcements, modules, submissions, schedules)
 * Idempotent: checks unique notificationKey before inserting.
 */
export async function backfillExistingNotifications() {
  try {
    // 1. Backfill published announcements
    const publishedAnnouncements = await prisma.announcement.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true },
      take: 20,
    });
    for (const a of publishedAnnouncements) {
      await notifyAnnouncementPublished(a.id);
    }

    // 2. Backfill published modules
    const publishedModules = await prisma.module.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true },
      take: 20,
    });
    for (const m of publishedModules) {
      await notifyModulePublished(m.id);
    }

    // 3. Backfill submissions
    const recentSubmissions = await prisma.submission.findMany({
      select: { id: true },
      take: 30,
      orderBy: { submittedAt: 'desc' },
    });
    for (const s of recentSubmissions) {
      await notifyActivitySubmitted({ submissionId: s.id, isUpdate: false });
    }

    // 4. Run reminder checks
    await checkScheduleReminders();
    await checkModuleDeadlineReminders();
  } catch (err) {
    console.error('[NotificationService] backfillExistingNotifications error:', err);
  }
}

let lastCheckTime = 0;
/**
 * Run reminder checks (throttled to at most once every 15 seconds)
 */
export async function runReminderChecks(force = false) {
  const now = Date.now();
  if (!force && now - lastCheckTime < 15000) {
    return;
  }
  lastCheckTime = now;
  await checkScheduleReminders();
  await checkModuleDeadlineReminders();
}

/**
 * Automatically publish scheduled announcements whose scheduled_at has arrived
 */
export async function publishDueScheduledAnnouncements() {
  try {
    const dueAnnouncements = await prisma.$queryRawUnsafe(`
      SELECT id, scheduled_at 
      FROM announcements 
      WHERE status = 'SCHEDULED' 
        AND scheduled_at IS NOT NULL 
        AND scheduled_at <= NOW()
    `);

    if (!dueAnnouncements || dueAnnouncements.length === 0) return;

    for (const ann of dueAnnouncements) {
      const affected = await prisma.$executeRawUnsafe(
        `UPDATE announcements 
         SET status = 'PUBLISHED', updated_at = NOW() 
         WHERE id = ? AND status = 'SCHEDULED'`,
        ann.id
      );

      if (affected > 0) {
        console.log(`[Announcements] Scheduled announcement #${ann.id} published.`);
        notifyAnnouncementPublished(ann.id).catch((err) =>
          console.error(`[Announcements] Notification error for #${ann.id}:`, err)
        );
      }
    }
  } catch (err) {
    if (!String(err?.message || '').includes('Unknown column')) {
      console.error('[Announcements] publishDueScheduledAnnouncements error:', err);
    }
  }
}

let cleanupCompleted = false;
let cleanupRunningPromise = null;

/**
 * One-time startup cleanup to resolve duplicate notifications,
 * populate actual announcement titles/content, and remove invalid or orphaned records.
 * Idempotent: executes only once per server startup.
 */
export async function cleanupLegacyNotificationDuplicates() {
  if (cleanupCompleted) return;
  if (cleanupRunningPromise) return cleanupRunningPromise;

  cleanupRunningPromise = (async () => {
    try {
      // 1. Remove generic placeholder notifications without a real source
      await prisma.notification.deleteMany({
        where: {
          sourceId: null,
          OR: [
            { title: 'New Announcement' },
            { title: 'Message from Your Teacher' },
            { message: { contains: 'The District Coordinator posted a new announcement' } },
            { message: { contains: 'Your teacher posted a new announcement' } },
          ],
        },
      });

      // 2. Deduplicate records with the same (sourceType, sourceId, targetUserId)
      const duplicates = await prisma.$queryRawUnsafe(`
        SELECT source_type, source_id, target_user_id, COUNT(*) as cnt, MIN(id) as keep_id
        FROM notifications
        WHERE source_type IS NOT NULL AND source_id IS NOT NULL AND target_user_id IS NOT NULL
        GROUP BY source_type, source_id, target_user_id
        HAVING cnt > 1
      `);

      if (Array.isArray(duplicates)) {
        for (const d of duplicates) {
          const keepId = Number(d.keep_id);
          const sourceId = Number(d.source_id);
          const targetUserId = Number(d.target_user_id);
          const sourceType = String(d.source_type);

          await prisma.notification.deleteMany({
            where: {
              sourceType,
              sourceId,
              targetUserId,
              id: { not: keepId },
            },
          });
        }
      }

      // 3. Clean up and synchronize schedule notifications
      const scheduleNotifs = await prisma.notification.findMany({
        where: {
          OR: [
            { sourceType: 'schedule' },
            { type: 'SCHEDULE' },
            { notificationKey: { contains: 'schedule_' } },
          ],
        },
      });

      for (const notif of scheduleNotifs) {
        let schedId = notif.sourceId ? Number(notif.sourceId) : null;
        if (!schedId && notif.notificationKey) {
          const m = notif.notificationKey.match(/schedule_[^:]+:(\d+):/);
          if (m) schedId = Number(m[1]);
        }

        if (!schedId) {
          await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
          continue;
        }

        const sched = await prisma.schedule.findUnique({
          where: { id: schedId },
          include: {
            learningCenter: true,
            teacher: true,
          },
        });

        if (!sched || sched.status === 'Cancelled') {
          await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
          continue;
        }

        // Check audience relevance
        if (notif.targetRole === 'ADMIN') {
          const isAdminRelevant =
            (sched.createdByRole === 'ADMIN' && !sched.teacherId) ||
            (!sched.teacherId && !sched.createdByUserId) ||
            (sched.createdByUserId === notif.targetUserId && sched.createdByRole === 'ADMIN');
          if (!isAdminRelevant) {
            // Delete invalid admin notifications for teacher-specific schedules (e.g. notification #91)
            await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
            continue;
          }
        } else if (notif.targetRole === 'TEACHER') {
          const isTeacherRelevant =
            sched.teacherId === notif.targetTeacherId ||
            sched.createdByUserId === notif.targetUserId;
          if (!isTeacherRelevant) {
            await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
            continue;
          }
        }

        // Sync to actual schedule details
        const schedTitle = (sched.title || 'Schedule').trim();
        const schedMessage = sched.description ? sched.description.trim() : '';
        const sender = sched.teacher?.fullName || (sched.createdByRole === 'ADMIN' ? 'District Coordinator' : 'System');

        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            title: schedTitle,
            message: schedMessage,
            createdByName: sender,
            sourceType: 'schedule',
            sourceId: sched.id,
            type: 'SCHEDULE',
            linkUrl: `/dashboard/schedule?id=${sched.id}`,
            updatedAt: new Date(),
          },
        }).catch(() => {});
      }

      // 4. Clean up orphaned announcement notifications and sync
      const announcementNotifs = await prisma.notification.findMany({
        where: {
          OR: [
            { sourceType: 'announcement' },
            { notificationKey: { contains: 'announcement:' } },
          ],
        },
      });

      for (const notif of announcementNotifs) {
        let annId = notif.sourceId ? Number(notif.sourceId) : null;
        if (!annId && notif.notificationKey) {
          const m = notif.notificationKey.match(/announcement:(\d+):/);
          if (m) annId = Number(m[1]);
        }

        if (!annId) {
          await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
          continue;
        }

        const ann = await prisma.announcement.findUnique({
          where: { id: annId },
          include: {
            author: {
              include: { adminProfile: true, teacherProfile: true },
            },
          },
        });

        if (!ann || ann.status !== 'PUBLISHED') {
          await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
          continue;
        }

        let sender = ann.author?.adminProfile?.fullName || 'District Coordinator';
        if (ann.creatorRole === 'TEACHER') {
          let teacherName = ann.author?.teacherProfile?.fullName;
          if (!teacherName && ann.teacherId) {
            const t = await prisma.teacher.findUnique({
              where: { id: ann.teacherId },
              select: { fullName: true },
            });
            teacherName = t?.fullName;
          }
          sender = teacherName || 'Assigned Teacher';
        }

        const targetUrl = notif.targetRole === 'LEARNER' ? '/notifications' : `/dashboard/announcements?id=${ann.id}`;

        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            title: (ann.title || 'Announcement').trim(),
            message: (ann.content || '').trim(),
            createdByName: sender,
            sourceType: 'announcement',
            sourceId: ann.id,
            type: 'ANNOUNCEMENT',
            isImportant: Boolean(ann.isImportant || ann.isPinned),
            linkUrl: targetUrl,
            updatedAt: new Date(),
          },
        }).catch(() => {});
      }

      // 5. Clean up orphaned module and submission notifications
      const moduleNotifs = await prisma.notification.findMany({
        where: { sourceType: 'module' },
      });
      for (const notif of moduleNotifs) {
        if (!notif.sourceId) {
          await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
          continue;
        }
        const m = await prisma.module.findUnique({ where: { id: Number(notif.sourceId) } });
        if (!m || m.status === 'ARCHIVED') {
          await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
        }
      }

      const submissionNotifs = await prisma.notification.findMany({
        where: { sourceType: 'submission' },
      });
      for (const notif of submissionNotifs) {
        if (!notif.sourceId) {
          await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
          continue;
        }
        const s = await prisma.submission.findUnique({ where: { id: Number(notif.sourceId) } });
        if (!s) {
          await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
        }
      }

      // 6. Delete ANY remaining notification records that still have legacy placeholder titles or messages
      await prisma.notification.deleteMany({
        where: {
          OR: [
            { title: 'New Announcement' },
            { title: 'Message from Your Teacher' },
            { message: { contains: 'The District Coordinator posted a new announcement' } },
            { message: { contains: 'Your teacher posted a new announcement' } },
          ],
        },
      });

      cleanupCompleted = true;
    } catch (err) {
      console.error('[NotificationCleanup] cleanupLegacyNotificationDuplicates error:', err.message);
    } finally {
      cleanupRunningPromise = null;
    }
  })();

  return cleanupRunningPromise;
}

/**
 * Start background timer running reminder checks every 60 seconds
 * and scheduled announcement checks every 15 seconds
 */
export function startNotificationScheduler() {
  cleanupLegacyNotificationDuplicates().catch(() => {});
  publishDueScheduledAnnouncements().catch(() => {});
  runReminderChecks(true).catch(() => {});
  setInterval(() => {
    publishDueScheduledAnnouncements().catch(() => {});
  }, 15 * 1000);
  setInterval(() => {
    runReminderChecks(true).catch(() => {});
  }, 60 * 1000);
}

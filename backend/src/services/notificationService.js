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

/**
 * Format relative time (e.g. 5m ago, 2h ago, Just now)
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 60 * 1000 && diffMs >= -30 * 1000) return 'Just now';
  if (diffMs < 0) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
        createdAt: createdAt || new Date(),
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
  } catch (err) {
    console.error('[NotificationService] notifyActivitySubmitted error:', err);
  }
}

/**
 * EVENT 2: Teacher Added a Learner Record
 * Notifies the Admin portal when a teacher records learner performance.
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

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    for (const admin of admins) {
      const notifKey = `record_added:${recordId || Date.now()}:admin:${admin.id}`;
      await createNotification({
        notificationKey: notifKey,
        title: 'New Learner Record',
        message: `${teacherName} added a performance record for a learner.`,
        type: 'RECORD',
        priority: 'NORMAL',
        isImportant: false,
        targetRole: 'ADMIN',
        targetUserId: admin.id,
        sourceType: 'record',
        sourceId: null,
        linkUrl: '/dashboard/reports/module-progress',
        createdByName: teacherName,
        createdByRole: 'TEACHER',
      });
    }
  } catch (err) {
    console.error('[NotificationService] notifyLearnerRecordCreated error:', err);
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
            linkUrl: '/dashboard/announcements',
            createdByName: adminSender,
            createdByRole: 'ADMIN',
            createdAt: ann.createdAt,
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
            createdAt: ann.createdAt,
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
          createdAt: ann.createdAt,
        });
      }
    }
  } catch (err) {
    console.error('[NotificationService] notifyAnnouncementPublished error:', err);
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
        createdAt: mod.createdAt,
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

      // --- 1 DAY BEFORE (within 24 hours and > 1 hour remaining) ---
      if (diffHours <= 24 && diffHours > 1) {
        // A. For Admin
        for (const admin of admins) {
          const key = `schedule_reminder_1d:${s.id}:admin:${admin.id}`;
          await createNotification({
            notificationKey: key,
            title: 'Upcoming Schedule',
            message: `Your scheduled learning session at ${centerName} starts tomorrow at ${time12h}.`,
            type: 'SCHEDULE',
            priority: 'IMPORTANT',
            isImportant: true,
            targetRole: 'ADMIN',
            targetUserId: admin.id,
            learningCenterId: s.learningCenterId,
            sourceType: 'schedule',
            sourceId: s.id,
            linkUrl: '/dashboard/schedule',
            deadlineAt: schedStart,
          });
        }

        // B. For Teacher (if assigned)
        if (s.teacher?.userId) {
          const key = `schedule_reminder_1d:${s.id}:teacher:${s.teacher.userId}`;
          await createNotification({
            notificationKey: key,
            title: 'Upcoming Schedule',
            message: `You have a learning session tomorrow at ${time12h} at ${centerName}.`,
            type: 'SCHEDULE',
            priority: 'IMPORTANT',
            isImportant: true,
            targetRole: 'TEACHER',
            targetUserId: s.teacher.userId,
            targetTeacherId: s.teacher.id,
            learningCenterId: s.learningCenterId,
            sourceType: 'schedule',
            sourceId: s.id,
            linkUrl: '/dashboard/schedule',
            deadlineAt: schedStart,
          });
        }
      }

      // --- 1 HOUR BEFORE (within 1 hour and > 0 minutes remaining) ---
      if (diffHours <= 1 && diffHours > 0) {
        // A. For Admin
        for (const admin of admins) {
          const key = `schedule_reminder_1h:${s.id}:admin:${admin.id}`;
          await createNotification({
            notificationKey: key,
            title: 'Upcoming Schedule',
            message: `Your scheduled learning session at ${centerName} starts in 1 hour at ${time12h}.`,
            type: 'SCHEDULE',
            priority: 'IMPORTANT',
            isImportant: true,
            targetRole: 'ADMIN',
            targetUserId: admin.id,
            learningCenterId: s.learningCenterId,
            sourceType: 'schedule',
            sourceId: s.id,
            linkUrl: '/dashboard/schedule',
            deadlineAt: schedStart,
          });
        }

        // B. For Teacher (if assigned)
        if (s.teacher?.userId) {
          const key = `schedule_reminder_1h:${s.id}:teacher:${s.teacher.userId}`;
          await createNotification({
            notificationKey: key,
            title: 'Upcoming Schedule',
            message: `You have a learning session starting in 1 hour at ${time12h} at ${centerName}.`,
            type: 'SCHEDULE',
            priority: 'IMPORTANT',
            isImportant: true,
            targetRole: 'TEACHER',
            targetUserId: s.teacher.userId,
            targetTeacherId: s.teacher.id,
            learningCenterId: s.learningCenterId,
            sourceType: 'schedule',
            sourceId: s.id,
            linkUrl: '/dashboard/schedule',
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
      if (diffHours <= 48 && diffHours > 0 && m.teacher?.userId && unsubmittedLearners.length > 0) {
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

      // 3. For any announcement notifications that have legacy generic title/message, upgrade from announcements table
      const legacyNotifs = await prisma.notification.findMany({
        where: {
          sourceType: 'announcement',
          sourceId: { not: null },
          OR: [
            { title: 'New Announcement' },
            { title: 'Message from Your Teacher' },
            { message: { contains: 'The District Coordinator posted a new announcement' } },
            { message: { contains: 'Your teacher posted a new announcement' } },
          ],
        },
      });

      for (const notif of legacyNotifs) {
        if (!notif.sourceId) continue;
        const ann = await prisma.announcement.findUnique({
          where: { id: Number(notif.sourceId) },
          include: {
            author: {
              include: { adminProfile: true, teacherProfile: true },
            },
          },
        });

        if (ann && ann.status === 'PUBLISHED') {
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

          await prisma.notification.update({
            where: { id: notif.id },
            data: {
              title: ann.title.trim(),
              message: ann.content.trim(),
              createdByName: sender,
              createdAt: ann.createdAt,
              linkUrl: '/notifications',
            },
          });
        } else if (!ann || ann.status !== 'PUBLISHED') {
          // Orphaned draft/deleted announcement notification: clean it up
          await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
        }
      }

      // 4. Delete ANY remaining notification records that still have legacy placeholder titles or messages
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

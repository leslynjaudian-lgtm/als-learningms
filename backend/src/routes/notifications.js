import { Router } from 'express';
import prisma from '../config/prisma.js';
import { verifyToken } from '../config/jwt.js';

const router = Router();

function normalizeProgramLevel(val) {
  if (!val) return null;
  const s = String(val).trim().toUpperCase();
  if (s.includes('ELEM')) return 'A&E Elementary';
  if (s.includes('JUN')) return 'A&E Junior High';
  return String(val).trim();
}

async function resolveUserContext(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded?.userId) {
          const user = await prisma.user.findUnique({
            where: { id: Number(decoded.userId) },
            include: {
              adminProfile: true,
              teacherProfile: {
                include: {
                  learningCenter: true,
                  assignedLearners: true,
                },
              },
              learnerProfile: {
                include: {
                  learningCenter: true,
                  assignedTeacher: true,
                },
              },
            },
          });
          if (user) return user;
        }
      } catch (_err) {
        // Fallback to query/body resolution below
      }
    }
  }

  const rawUserId = req.query?.userId ?? req.body?.userId;
  const rawLearnerId = req.query?.learnerId ?? req.body?.learnerId;
  const rawTeacherId = req.query?.teacherId ?? req.body?.teacherId;
  const rawRole = String(req.query?.role ?? req.body?.role ?? '').trim().toUpperCase();

  if (rawUserId && !isNaN(Number(rawUserId))) {
    const user = await prisma.user.findUnique({
      where: { id: Number(rawUserId) },
      include: {
        adminProfile: true,
        teacherProfile: {
          include: {
            learningCenter: true,
            assignedLearners: true,
          },
        },
        learnerProfile: {
          include: {
            learningCenter: true,
            assignedTeacher: true,
          },
        },
      },
    });
    if (user) return user;
  }

  if (rawLearnerId && !isNaN(Number(rawLearnerId))) {
    const learner = await prisma.learner.findUnique({
      where: { id: Number(rawLearnerId) },
      include: { learningCenter: true, assignedTeacher: true, user: true },
    });
    if (learner?.user) {
      return {
        ...learner.user,
        learnerProfile: learner,
      };
    }
  }

  if (rawTeacherId && !isNaN(Number(rawTeacherId))) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: Number(rawTeacherId) },
      include: { learningCenter: true, assignedLearners: true, user: true },
    });
    if (teacher?.user) {
      return {
        ...teacher.user,
        teacherProfile: teacher,
      };
    }
  }

  if (rawRole === 'ADMIN') {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { adminProfile: true },
    });
    if (adminUser) return adminUser;
  }

  return null;
}

async function getRecentWindowHours(overrideHours) {
  if (overrideHours !== undefined && !isNaN(Number(overrideHours)) && Number(overrideHours) > 0) {
    return Number(overrideHours);
  }
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT \`value\` FROM system_settings WHERE \`key\` = 'recent_notification_window_hours' LIMIT 1`
    );
    if (rows && rows.length > 0) {
      const parsed = Number(rows[0].value);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (_err) {
    // ignore
  }
  return 24;
}

function parseScheduleDateTime(dateVal, timeStr) {
  if (!dateVal) return null;
  const baseDate = dateVal instanceof Date ? new Date(dateVal) : new Date(dateVal);
  if (isNaN(baseDate.getTime())) return null;
  const yyyy = baseDate.getUTCFullYear();
  const mm = String(baseDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(baseDate.getUTCDate()).padStart(2, '0');

  let hours = 9;
  let minutes = 0;
  if (timeStr) {
    const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const ampm = match[3] ? match[3].toUpperCase() : null;
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
  }
  return new Date(`${yyyy}-${mm}-${dd}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+08:00`);
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function buildUserNotifications(user, options = {}) {
  const now = new Date();
  const recentWindowHours = await getRecentWindowHours(options.windowHours);
  const recentCutoffMs = now.getTime() - recentWindowHours * 3600 * 1000;
  const activeDeadlineHorizonMs = now.getTime() + 48 * 3600 * 1000;

  const userId = Number(user.id);
  const role = String(user.role || '').toUpperCase();

  // Load read keys for this user
  const readRows = await prisma.$queryRawUnsafe(
    `SELECT notification_key, read_at FROM notification_reads WHERE user_id = ?`,
    userId
  );
  const readMap = new Map();
  for (const r of readRows || []) {
    readMap.set(String(r.notification_key), r.read_at);
  }

  const rawItems = [];

  // =========================================================
  // 1. LEARNER PORTAL NOTIFICATIONS
  // =========================================================
  if (role === 'LEARNER') {
    let learner = user.learnerProfile;
    if (!learner) {
      learner = await prisma.learner.findFirst({
        where: { userId },
        include: { learningCenter: true, assignedTeacher: true },
      });
    }

    if (learner) {
      const learnerId = Number(learner.id);
      const teacherId = learner.assignedTeacherId ? Number(learner.assignedTeacherId) : null;
      const centerId = learner.learningCenterId ? Number(learner.learningCenterId) : null;
      const learnerLevelStr = String(learner.level || '').toUpperCase();
      const levelPattern = learnerLevelStr.includes('ELEM') ? '%Elem%' : '%Jun%';
      const normLearnerLevel = learnerLevelStr.includes('ELEM') ? 'A&E Elementary' : 'A&E Junior High';

      // 1A. Relevant Published Announcements
      let annSql = `
        SELECT 
          a.id, a.title, a.content, a.audience, a.status, a.is_pinned,
          a.is_important, a.priority, a.category, a.deadline_at,
          a.author_id, a.creator_role, a.teacher_id, a.learning_center_id, a.program_level, a.target_learner_id,
          a.created_at, a.updated_at,
          tp.full_name as teacher_name,
          ap.full_name as admin_name,
          lc.name as learning_center_name
        FROM announcements a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN teachers tp ON (tp.id = a.teacher_id OR (tp.user_id = u.id AND a.teacher_id IS NULL))
        LEFT JOIN admins ap ON ap.user_id = u.id
        LEFT JOIN learning_centers lc ON lc.id = a.learning_center_id
        WHERE a.status = 'PUBLISHED'
          AND (
            (
              (a.creator_role = 'ADMIN' OR (a.creator_role IS NULL AND (u.role = 'ADMIN' OR a.teacher_id IS NULL)))
              AND a.audience IN ('ALL_LEARNERS', 'LEARNERS', 'ALL')
              AND a.target_learner_id IS NULL
              AND (a.learning_center_id IS NULL OR a.learning_center_id = ?)
              AND (a.program_level IS NULL OR a.program_level LIKE ?)
            )
            OR
            (
              a.audience IN ('INDIVIDUAL_LEARNER', 'SPECIFIC_LEARNER')
              AND a.target_learner_id = ?
              AND (a.teacher_id IS NULL OR a.teacher_id = ?)
            )
      `;
      const annParams = [centerId || 0, levelPattern, learnerId, teacherId || 0];

      if (teacherId) {
        annSql += `
            OR
            (
              (a.creator_role = 'TEACHER' OR a.teacher_id IS NOT NULL)
              AND a.audience IN ('ALL_LEARNERS', 'LEARNERS', 'ALL')
              AND a.target_learner_id IS NULL
              AND a.teacher_id = ?
              AND (a.learning_center_id IS NULL OR a.learning_center_id = ?)
              AND (a.program_level IS NULL OR a.program_level LIKE ?)
            )
        `;
        annParams.push(teacherId, centerId || 0, levelPattern);
      }
      annSql += `) ORDER BY a.created_at DESC LIMIT 40`;

      const annRows = await prisma.$queryRawUnsafe(annSql, ...annParams);
      for (const a of annRows || []) {
        const isImp = Boolean(
          a.is_important ||
          a.is_pinned ||
          ['IMPORTANT', 'HIGH', 'URGENT'].includes(String(a.priority || '').toUpperCase())
        );
        const type = ['ANNOUNCEMENT', 'REMINDER', 'SCHEDULE'].includes(String(a.category || '').toUpperCase())
          ? String(a.category).toUpperCase()
          : 'ANNOUNCEMENT';
        const authorLabel = a.creator_role === 'TEACHER' || a.teacher_id
          ? (a.teacher_name || 'Assigned ALS Teacher')
          : (a.admin_name || 'District Administrator');

        rawItems.push({
          notificationKey: `announcement:${a.id}`,
          sourceType: 'announcement',
          sourceId: a.id,
          type,
          title: a.title,
          message: a.content,
          sender: authorLabel,
          isImportant: isImp,
          priority: a.priority || (isImp ? 'IMPORTANT' : 'NORMAL'),
          learningCenterId: a.learning_center_id,
          programLevel: a.program_level ? normalizeProgramLevel(a.program_level) : normLearnerLevel,
          actionUrl: '/announcements',
          deadlineAt: a.deadline_at || null,
          createdAt: a.updated_at || a.created_at,
        });
      }

      // 1B. Relevant Schedules for Learner's Center & Assigned Teacher
      if (centerId) {
        const schedRows = await prisma.$queryRawUnsafe(
          `SELECT s.id, s.title, s.activity_type, s.date, s.start_time, s.end_time,
                  s.learning_center_id, s.teacher_id, s.description, s.status,
                  s.is_important, s.priority, s.created_at, s.updated_at,
                  lc.name as learning_center_name, t.full_name as teacher_name
           FROM schedules s
           LEFT JOIN learning_centers lc ON lc.id = s.learning_center_id
           LEFT JOIN teachers t ON t.id = s.teacher_id
           WHERE s.learning_center_id = ?
             AND (s.teacher_id IS NULL OR s.teacher_id = ?)
             AND (s.status IS NULL OR s.status != 'Cancelled')
           ORDER BY s.date DESC, s.updated_at DESC
           LIMIT 25`,
          centerId,
          teacherId || 0
        );

        for (const s of schedRows || []) {
          const schedDateTime = parseScheduleDateTime(s.date, s.start_time);
          const dateLabel = s.date instanceof Date
            ? s.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : String(s.date).split('T')[0];
          const isImp = Boolean(
            s.is_important ||
            ['IMPORTANT', 'HIGH', 'URGENT'].includes(String(s.priority || '').toUpperCase())
          );

          rawItems.push({
            notificationKey: `schedule:${s.id}`,
            sourceType: 'schedule',
            sourceId: s.id,
            type: 'SCHEDULE',
            title: `${s.status === 'Rescheduled' ? 'Rescheduled: ' : ''}${s.title}`,
            message: `${s.activity_type || 'Learning Session'} on ${dateLabel} (${s.start_time} - ${s.end_time})${s.learning_center_name ? ' at ' + s.learning_center_name : ''}.`,
            sender: s.teacher_name || 'ALS Schedule',
            isImportant: isImp,
            priority: s.priority || (isImp ? 'IMPORTANT' : 'NORMAL'),
            learningCenterId: s.learning_center_id,
            programLevel: normLearnerLevel,
            actionUrl: '/announcements',
            deadlineAt: schedDateTime,
            createdAt: s.updated_at || s.created_at,
          });
        }
      }

      // 1C. Upcoming Module Deadline Reminders (Incomplete Assigned Modules with Deadlines)
      const modRows = await prisma.$queryRawUnsafe(
        `SELECT m.id, m.title, m.date_ended, m.created_at, m.learning_center_id, m.target_level,
                ma.due_date as assignment_due_date,
                lp.status as progress_status
         FROM modules m
         LEFT JOIN module_assignments ma ON ma.module_id = m.id AND ma.learner_id = ?
         LEFT JOIN learner_progress lp ON lp.module_id = m.id AND lp.learner_id = ?
         WHERE m.status = 'PUBLISHED'
           AND (m.date_ended IS NOT NULL OR ma.due_date IS NOT NULL)
           AND (lp.status IS NULL OR lp.status NOT IN ('COMPLETED', 'MASTERED'))
           AND (
             ma.learner_id = ?
             OR (
               (m.learning_center_id IS NULL OR m.learning_center_id = ?)
               AND (m.teacher_id IS NULL OR m.teacher_id = ?)
               AND (m.target_level = 'BOTH' OR m.target_level LIKE ?)
             )
           )
         ORDER BY COALESCE(ma.due_date, m.date_ended) ASC
         LIMIT 15`,
        learnerId,
        learnerId,
        learnerId,
        centerId || 0,
        teacherId || 0,
        learnerLevelStr.includes('ELEM') ? '%ELEM%' : '%JUN%'
      );

      for (const m of modRows || []) {
        const dueRaw = m.assignment_due_date || m.date_ended;
        if (!dueRaw) continue;
        const dueDate = new Date(dueRaw);
        if (isNaN(dueDate.getTime())) continue;
        // Include if due date is within the next 72 hours and not expired more than 24h ago
        const diffMs = dueDate.getTime() - now.getTime();
        if (diffMs >= -24 * 3600 * 1000 && diffMs <= 72 * 3600 * 1000) {
          const dueFormatted = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          rawItems.push({
            notificationKey: `module_deadline:${m.id}`,
            sourceType: 'module_deadline',
            sourceId: m.id,
            type: 'REMINDER',
            title: `Module Deadline Reminder: ${m.title}`,
            message: `Please complete "${m.title}" before the deadline on ${dueFormatted}.`,
            sender: 'ALS Module Reminder',
            isImportant: true,
            priority: 'IMPORTANT',
            learningCenterId: m.learning_center_id || centerId,
            programLevel: normLearnerLevel,
            actionUrl: `/modules/${m.id}`,
            deadlineAt: dueDate,
            createdAt: m.created_at,
          });
        }
      }

      // 1D. Direct Custom Notifications for this Learner
      const customRows = await prisma.$queryRawUnsafe(
        `SELECT * FROM notifications
         WHERE target_role = 'LEARNER'
           AND (target_user_id IS NULL OR target_user_id = ?)
           AND (target_learner_id IS NULL OR target_learner_id = ?)
           AND (target_teacher_id IS NULL OR target_teacher_id = ?)
           AND (learning_center_id IS NULL OR learning_center_id = ?)
           AND (program_level IS NULL OR program_level LIKE ?)
         ORDER BY created_at DESC
         LIMIT 30`,
        userId,
        learnerId,
        teacherId || 0,
        centerId || 0,
        levelPattern
      );

      for (const c of customRows || []) {
        const isImp = Boolean(
          c.is_important ||
          ['IMPORTANT', 'HIGH', 'URGENT'].includes(String(c.priority || '').toUpperCase())
        );
        rawItems.push({
          notificationKey: `custom:${c.id}`,
          sourceType: 'custom',
          sourceId: c.id,
          type: String(c.type || 'ANNOUNCEMENT').toUpperCase(),
          title: c.title,
          message: c.message,
          sender: c.created_by_name || (c.created_by_role === 'TEACHER' ? 'Assigned ALS Teacher' : 'ALS System'),
          isImportant: isImp,
          priority: c.priority || (isImp ? 'IMPORTANT' : 'NORMAL'),
          learningCenterId: c.learning_center_id,
          programLevel: c.program_level ? normalizeProgramLevel(c.program_level) : normLearnerLevel,
          actionUrl: c.link_url || '/announcements',
          deadlineAt: c.deadline_at || null,
          createdAt: c.updated_at || c.created_at,
        });
      }
    }
  }

  // =========================================================
  // 2. TEACHER PORTAL NOTIFICATIONS
  // =========================================================
  else if (role === 'TEACHER') {
    let teacher = user.teacherProfile;
    if (!teacher) {
      teacher = await prisma.teacher.findFirst({
        where: { userId },
        include: { learningCenter: true, assignedLearners: true },
      });
    }

    const teacherId = teacher?.id ? Number(teacher.id) : null;
    const assignedCenterIds = new Set();
    if (teacher?.learningCenterId) assignedCenterIds.add(Number(teacher.learningCenterId));
    if (Array.isArray(teacher?.assignedLearners)) {
      for (const l of teacher.assignedLearners) {
        if (l.learningCenterId) assignedCenterIds.add(Number(l.learningCenterId));
      }
    }
    const centerIdsArr = Array.from(assignedCenterIds);

    // 2A. Admin Announcements for Teachers ONLY (NEVER include teacher's own learner announcements!)
    const adminAnnRows = await prisma.$queryRawUnsafe(
      `SELECT a.id, a.title, a.content, a.audience, a.status, a.is_pinned,
              a.is_important, a.priority, a.category, a.deadline_at,
              a.author_id, a.creator_role, a.teacher_id, a.learning_center_id,
              a.created_at, a.updated_at, ap.full_name as admin_name
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       LEFT JOIN admins ap ON ap.user_id = u.id
       WHERE a.status = 'PUBLISHED'
         AND (a.creator_role = 'ADMIN' OR (a.creator_role IS NULL AND u.role = 'ADMIN'))
         AND a.teacher_id IS NULL
         AND a.audience IN ('ALL_TEACHERS', 'TEACHERS', 'ALL')
       ORDER BY a.created_at DESC
       LIMIT 35`
    );

    for (const a of adminAnnRows || []) {
      if (a.learning_center_id && centerIdsArr.length > 0 && !assignedCenterIds.has(Number(a.learning_center_id))) {
        continue;
      }
      const isImp = Boolean(
        a.is_important ||
        a.is_pinned ||
        ['IMPORTANT', 'HIGH', 'URGENT'].includes(String(a.priority || '').toUpperCase())
      );
      const type = ['ANNOUNCEMENT', 'REMINDER', 'SCHEDULE'].includes(String(a.category || '').toUpperCase())
        ? String(a.category).toUpperCase()
        : 'ANNOUNCEMENT';

      rawItems.push({
        notificationKey: `announcement:${a.id}`,
        sourceType: 'announcement',
        sourceId: a.id,
        type,
        title: a.title,
        message: a.content,
        sender: a.admin_name || 'District Administrator',
        isImportant: isImp,
        priority: a.priority || (isImp ? 'IMPORTANT' : 'NORMAL'),
        learningCenterId: a.learning_center_id,
        programLevel: null,
        actionUrl: '/dashboard/announcements',
        deadlineAt: a.deadline_at || null,
        createdAt: a.updated_at || a.created_at,
      });
    }

    // 2B. Schedules Assigned to Teacher (or District-Wide Schedules at Teacher's Center)
    if (teacherId) {
      const schedRows = await prisma.$queryRawUnsafe(
        `SELECT s.id, s.title, s.activity_type, s.date, s.start_time, s.end_time,
                s.learning_center_id, s.teacher_id, s.description, s.status,
                s.is_important, s.priority, s.created_at, s.updated_at,
                lc.name as learning_center_name
         FROM schedules s
         LEFT JOIN learning_centers lc ON lc.id = s.learning_center_id
         WHERE (s.teacher_id = ? OR s.teacher_id IS NULL)
           AND (s.status IS NULL OR s.status != 'Cancelled')
         ORDER BY s.date DESC, s.updated_at DESC
         LIMIT 25`,
        teacherId
      );

      for (const s of schedRows || []) {
        if (!s.teacher_id && s.learning_center_id && centerIdsArr.length > 0 && !assignedCenterIds.has(Number(s.learning_center_id))) {
          continue;
        }
        const schedDateTime = parseScheduleDateTime(s.date, s.start_time);
        const dateLabel = s.date instanceof Date
          ? s.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : String(s.date).split('T')[0];
        const isImp = Boolean(
          s.is_important ||
          ['IMPORTANT', 'HIGH', 'URGENT'].includes(String(s.priority || '').toUpperCase())
        );

        rawItems.push({
          notificationKey: `schedule:${s.id}`,
          sourceType: 'schedule',
          sourceId: s.id,
          type: 'SCHEDULE',
          title: `${s.status === 'Rescheduled' ? 'Rescheduled: ' : ''}${s.title}`,
          message: `${s.activity_type || 'Teaching Session'} on ${dateLabel} (${s.start_time} - ${s.end_time})${s.learning_center_name ? ' at ' + s.learning_center_name : ''}.`,
          sender: 'ALS Schedule',
          isImportant: isImp,
          priority: s.priority || (isImp ? 'IMPORTANT' : 'NORMAL'),
          learningCenterId: s.learning_center_id,
          programLevel: null,
          actionUrl: '/dashboard/schedule',
          deadlineAt: schedDateTime,
          createdAt: s.updated_at || s.created_at,
        });
      }
    }

    // 2C. Direct Custom Notifications for Teacher (Urgent Learner Reminders / Required Admin Actions)
    const customRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM notifications
       WHERE target_role = 'TEACHER'
         AND (target_user_id IS NULL OR target_user_id = ?)
         AND (target_teacher_id IS NULL OR target_teacher_id = ?)
       ORDER BY created_at DESC
       LIMIT 30`,
      userId,
      teacherId || 0
    );

    for (const c of customRows || []) {
      if (c.learning_center_id && centerIdsArr.length > 0 && !assignedCenterIds.has(Number(c.learning_center_id))) {
        continue;
      }
      const isImp = Boolean(
        c.is_important ||
        ['IMPORTANT', 'HIGH', 'URGENT'].includes(String(c.priority || '').toUpperCase())
      );
      rawItems.push({
        notificationKey: `custom:${c.id}`,
        sourceType: 'custom',
        sourceId: c.id,
        type: String(c.type || 'REMINDER').toUpperCase(),
        title: c.title,
        message: c.message,
        sender: c.created_by_name || 'District Administration',
        isImportant: isImp,
        priority: c.priority || (isImp ? 'IMPORTANT' : 'NORMAL'),
        learningCenterId: c.learning_center_id,
        programLevel: c.program_level,
        actionUrl: c.link_url || '/dashboard/announcements',
        deadlineAt: c.deadline_at || null,
        createdAt: c.updated_at || c.created_at,
      });
    }
  }

  // =========================================================
  // 3. ADMIN PORTAL NOTIFICATIONS
  // =========================================================
  else if (role === 'ADMIN') {
    // 3A. Direct Custom Notifications for Admin
    const customRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM notifications
       WHERE target_role = 'ADMIN'
         AND (target_user_id IS NULL OR target_user_id = ?)
       ORDER BY created_at DESC
       LIMIT 30`,
      userId
    );

    for (const c of customRows || []) {
      const isImp = Boolean(
        c.is_important ||
        ['IMPORTANT', 'HIGH', 'URGENT'].includes(String(c.priority || '').toUpperCase())
      );
      rawItems.push({
        notificationKey: `custom:${c.id}`,
        sourceType: 'custom',
        sourceId: c.id,
        type: String(c.type || 'REMINDER').toUpperCase(),
        title: c.title,
        message: c.message,
        sender: c.created_by_name || 'System Alert',
        isImportant: isImp,
        priority: c.priority || (isImp ? 'IMPORTANT' : 'NORMAL'),
        learningCenterId: c.learning_center_id,
        programLevel: c.program_level,
        actionUrl: c.link_url || '/dashboard/schedule',
        deadlineAt: c.deadline_at || null,
        createdAt: c.updated_at || c.created_at,
      });
    }

    // 3B. Administrative Schedules
    const schedRows = await prisma.$queryRawUnsafe(
      `SELECT s.id, s.title, s.activity_type, s.date, s.start_time, s.end_time,
              s.learning_center_id, s.teacher_id, s.description, s.status,
              s.is_important, s.priority, s.created_at, s.updated_at,
              lc.name as learning_center_name, t.full_name as teacher_name
       FROM schedules s
       LEFT JOIN learning_centers lc ON lc.id = s.learning_center_id
       LEFT JOIN teachers t ON t.id = s.teacher_id
       WHERE (s.status IS NULL OR s.status != 'Cancelled')
       ORDER BY s.date DESC, s.updated_at DESC
       LIMIT 20`
    );

    for (const s of schedRows || []) {
      const schedDateTime = parseScheduleDateTime(s.date, s.start_time);
      const dateLabel = s.date instanceof Date
        ? s.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : String(s.date).split('T')[0];
      const isImp = Boolean(
        s.is_important ||
        ['IMPORTANT', 'HIGH', 'URGENT'].includes(String(s.priority || '').toUpperCase())
      );

      rawItems.push({
        notificationKey: `schedule:${s.id}`,
        sourceType: 'schedule',
        sourceId: s.id,
        type: 'SCHEDULE',
        title: `${s.status === 'Rescheduled' ? 'Rescheduled: ' : ''}${s.title}`,
        message: `${s.activity_type || 'District Schedule'} on ${dateLabel} (${s.start_time} - ${s.end_time})${s.learning_center_name ? ' • ' + s.learning_center_name : ''}.`,
        sender: s.teacher_name || 'District Schedule',
        isImportant: isImp,
        priority: s.priority || (isImp ? 'IMPORTANT' : 'NORMAL'),
        learningCenterId: s.learning_center_id,
        programLevel: null,
        actionUrl: '/dashboard/schedule',
        deadlineAt: schedDateTime,
        createdAt: s.updated_at || s.created_at,
      });
    }

    // 3C. Important Admin Announcements / Reminders
    const adminAnnRows = await prisma.$queryRawUnsafe(
      `SELECT a.id, a.title, a.content, a.audience, a.status, a.is_pinned,
              a.is_important, a.priority, a.category, a.deadline_at,
              a.created_at, a.updated_at, ap.full_name as admin_name
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       LEFT JOIN admins ap ON ap.user_id = u.id
       WHERE a.status = 'PUBLISHED'
         AND (a.creator_role = 'ADMIN' OR (a.creator_role IS NULL AND u.role = 'ADMIN'))
         AND a.teacher_id IS NULL
       ORDER BY a.created_at DESC
       LIMIT 20`
    );

    for (const a of adminAnnRows || []) {
      const isImp = Boolean(
        a.is_important ||
        a.is_pinned ||
        ['IMPORTANT', 'HIGH', 'URGENT'].includes(String(a.priority || '').toUpperCase())
      );
      const type = ['ANNOUNCEMENT', 'REMINDER', 'SCHEDULE'].includes(String(a.category || '').toUpperCase())
        ? String(a.category).toUpperCase()
        : 'ANNOUNCEMENT';

      rawItems.push({
        notificationKey: `announcement:${a.id}`,
        sourceType: 'announcement',
        sourceId: a.id,
        type,
        title: a.title,
        message: a.content,
        sender: a.admin_name || 'District Administration',
        isImportant: isImp,
        priority: a.priority || (isImp ? 'IMPORTANT' : 'NORMAL'),
        learningCenterId: a.learning_center_id,
        programLevel: null,
        actionUrl: '/dashboard/announcements',
        deadlineAt: a.deadline_at || null,
        createdAt: a.updated_at || a.created_at,
      });
    }
  }

  // Deduplicate by notificationKey and compute eligibility flags
  const seenKeys = new Set();
  const notifications = [];

  for (const item of rawItems) {
    if (seenKeys.has(item.notificationKey)) continue;
    seenKeys.add(item.notificationKey);

    const isRead = readMap.has(item.notificationKey);
    const readAt = readMap.get(item.notificationKey) || null;

    const createdDate = item.createdAt ? new Date(item.createdAt) : null;
    const createdMs = createdDate && !isNaN(createdDate.getTime()) ? createdDate.getTime() : 0;
    const isRecent = createdMs >= recentCutoffMs;

    const deadlineDate = item.deadlineAt ? new Date(item.deadlineAt) : null;
    const deadlineMs = deadlineDate && !isNaN(deadlineDate.getTime()) ? deadlineDate.getTime() : null;
    const isExpiredDeadline = deadlineMs !== null && deadlineMs < now.getTime() - 2 * 3600 * 1000;
    const hasActiveDeadline =
      deadlineMs !== null &&
      !isExpiredDeadline &&
      deadlineMs <= activeDeadlineHorizonMs;

    const isValidType = ['ANNOUNCEMENT', 'REMINDER', 'SCHEDULE'].includes(item.type);

    // If a schedule or reminder has an already-expired deadline, it is no longer timely unless it was just updated/created and has no past deadline
    const isTimely = isExpiredDeadline ? false : (isRecent || hasActiveDeadline);

    const isEligibleForAnimation = Boolean(
      !isRead &&
      isValidType &&
      item.isImportant &&
      isTimely
    );

    notifications.push({
      ...item,
      isRead,
      readAt,
      isRecent,
      hasActiveDeadline,
      isExpiredDeadline,
      isEligibleForAnimation,
      relativeTime: formatRelativeTime(item.createdAt),
    });
  }

  // Sort: eligible unread first, then other unread, then by createdAt descending
  notifications.sort((a, b) => {
    if (a.isEligibleForAnimation !== b.isEligibleForAnimation) {
      return a.isEligibleForAnimation ? -1 : 1;
    }
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tB - tA;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const eligibleUnreadCount = notifications.filter((n) => n.isEligibleForAnimation).length;
  const shouldAnimateBell = eligibleUnreadCount > 0;

  return {
    userId,
    role,
    recentWindowHours,
    unreadCount,
    eligibleUnreadCount,
    shouldAnimateBell,
    notifications,
  };
}

// ---------------------
// GET /api/notifications
// Retrieve notifications and bell animation state for the logged-in user
// ---------------------
router.get('/', async (req, res, next) => {
  try {
    const user = await resolveUserContext(req);
    if (!user) {
      return res.json({
        userId: null,
        role: null,
        recentWindowHours: 24,
        unreadCount: 0,
        eligibleUnreadCount: 0,
        shouldAnimateBell: false,
        notifications: [],
      });
    }

    const result = await buildUserNotifications(user, {
      windowHours: req.query.windowHours,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/notifications/read
// Mark one or more specific notifications as read for the logged-in user
// ---------------------
router.post('/read', async (req, res, next) => {
  try {
    const user = await resolveUserContext(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to mark notifications as read' });
    }

    const { notificationKey, notificationKeys, sourceType, sourceId } = req.body || {};
    const keysToMark = [];

    if (notificationKey) {
      keysToMark.push(String(notificationKey));
    }
    if (Array.isArray(notificationKeys)) {
      for (const k of notificationKeys) {
        if (k) keysToMark.push(String(k));
      }
    }
    if (sourceType && sourceId !== undefined) {
      keysToMark.push(`${sourceType}:${sourceId}`);
    }

    if (keysToMark.length === 0) {
      return res.status(400).json({ error: 'notificationKey or notificationKeys is required' });
    }

    for (const key of keysToMark) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO notification_reads (user_id, notification_key, read_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE read_at = VALUES(read_at)`,
        Number(user.id),
        key
      );
    }

    const updatedState = await buildUserNotifications(user, {
      windowHours: req.query?.windowHours ?? req.body?.windowHours,
    });
    res.json({
      success: true,
      markedKeys: keysToMark,
      ...updatedState,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/notifications/read-all
// Mark all current notifications for the logged-in user as read
// ---------------------
router.post('/read-all', async (req, res, next) => {
  try {
    const user = await resolveUserContext(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to mark all notifications as read' });
    }

    const currentState = await buildUserNotifications(user, {
      windowHours: req.query?.windowHours ?? req.body?.windowHours,
    });

    const unreadKeys = currentState.notifications
      .filter((n) => !n.isRead)
      .map((n) => n.notificationKey);

    for (const key of unreadKeys) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO notification_reads (user_id, notification_key, read_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE read_at = VALUES(read_at)`,
        Number(user.id),
        key
      );
    }

    const updatedState = await buildUserNotifications(user, {
      windowHours: req.query?.windowHours ?? req.body?.windowHours,
    });
    res.json({
      success: true,
      markedCount: unreadKeys.length,
      ...updatedState,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/notifications
// Create a direct notification/reminder/schedule alert
// ---------------------
router.post('/', async (req, res, next) => {
  try {
    const authUser = await resolveUserContext(req);
    const {
      title,
      message,
      type = 'REMINDER',
      priority = 'IMPORTANT',
      isImportant = true,
      targetRole = 'LEARNER',
      targetUserId = null,
      targetLearnerId = null,
      targetTeacherId = null,
      learningCenterId = null,
      programLevel = null,
      referenceType = null,
      referenceId = null,
      actionUrl = null,
      deadlineAt = null,
      createdAt = null,
    } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const normType = ['ANNOUNCEMENT', 'REMINDER', 'SCHEDULE'].includes(String(type).toUpperCase())
      ? String(type).toUpperCase()
      : 'REMINDER';
    const isImp = Boolean(isImportant) ? 1 : 0;
    const normPriority = String(priority || (isImp ? 'IMPORTANT' : 'NORMAL')).toUpperCase();
    const normRole = String(targetRole || 'LEARNER').toUpperCase();
    const normLevel = programLevel ? normalizeProgramLevel(programLevel) : null;
    const parsedDeadline = deadlineAt ? new Date(deadlineAt) : null;
    const validDeadline = parsedDeadline && !isNaN(parsedDeadline.getTime()) ? parsedDeadline : null;
    const parsedCreated = createdAt ? new Date(createdAt) : new Date();
    const validCreated = !isNaN(parsedCreated.getTime()) ? parsedCreated : new Date();

    await prisma.$executeRawUnsafe(
      `INSERT INTO notifications
        (title, message, type, priority, is_important, target_role, target_user_id, target_learner_id, target_teacher_id,
         learning_center_id, program_level, created_by_role, created_by_name, source_type, source_id, link_url, deadline_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      String(title).trim(),
      String(message).trim(),
      normType,
      normPriority,
      isImp,
      normRole,
      targetUserId ? Number(targetUserId) : null,
      targetLearnerId ? Number(targetLearnerId) : null,
      targetTeacherId ? Number(targetTeacherId) : null,
      learningCenterId ? Number(learningCenterId) : null,
      normLevel,
      authUser?.role || null,
      authUser?.teacherProfile?.fullName || authUser?.adminProfile?.fullName || null,
      referenceType,
      referenceId ? Number(referenceId) : null,
      actionUrl,
      validDeadline,
      validCreated,
      validCreated
    );

    const [inserted] = await prisma.$queryRawUnsafe(
      `SELECT * FROM notifications ORDER BY id DESC LIMIT 1`
    );

    res.status(201).json(inserted);
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from 'express';
import prisma from '../config/prisma.js';
import { verifyToken } from '../config/jwt.js';
import {
  runReminderChecks,
  createNotification,
  formatRelativeTime,
} from '../services/notificationService.js';

const router = Router();

export async function resolveUserContext(req) {
  // 1. Bearer Token Verification
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
              teacherProfile: true,
              learnerProfile: true,
            },
          });
          if (user) return user;
        }
      } catch (_err) {
        // Fallback to query/body context
      }
    }
  }

  // 2. Already attached by authMiddleware
  if (req.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      include: {
        adminProfile: true,
        teacherProfile: true,
        learnerProfile: true,
      },
    });
    if (user) return user;
  }

  // 3. Fallback for client requests providing user identity (with strict existence validation)
  const rawUserId = req.query?.userId ?? req.body?.userId;
  const rawLearnerId = req.query?.learnerId ?? req.body?.learnerId;
  const rawTeacherId = req.query?.teacherId ?? req.body?.teacherId;
  const rawRole = String(req.query?.role ?? req.body?.role ?? '').trim().toUpperCase();

  if (rawUserId && !isNaN(Number(rawUserId))) {
    const user = await prisma.user.findUnique({
      where: { id: Number(rawUserId) },
      include: {
        adminProfile: true,
        teacherProfile: true,
        learnerProfile: true,
      },
    });
    if (user && (!rawRole || user.role === rawRole)) return user;
  }

  if (rawTeacherId && !isNaN(Number(rawTeacherId))) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: Number(rawTeacherId) },
      include: { user: true },
    });
    if (teacher?.user) {
      return {
        ...teacher.user,
        teacherProfile: teacher,
      };
    }
  }

  if (rawLearnerId && !isNaN(Number(rawLearnerId))) {
    const learner = await prisma.learner.findUnique({
      where: { id: Number(rawLearnerId) },
      include: { user: true },
    });
    if (learner?.user) {
      return {
        ...learner.user,
        learnerProfile: learner,
      };
    }
  }

  if (rawRole === 'ADMIN') {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      include: { adminProfile: true },
    });
    if (adminUser) return adminUser;
  }

  return null;
}

/**
 * Build recipient-specific notifications for the authenticated user
 */
export async function buildUserNotifications(user) {
  const userId = Number(user.id);
  const role = user.role;

  // 1. Ensure scheduled reminders are updated
  await runReminderChecks();

  // 2. Fetch read statuses for this recipient
  const reads = await prisma.notificationRead.findMany({
    where: { userId },
    select: { notificationKey: true, readAt: true },
  });
  const readMap = new Map(reads.map((r) => [r.notificationKey, r.readAt]));

  // 3. Query role-based and recipient-specific notifications from MySQL
  const notifications = await prisma.notification.findMany({
    where: {
      targetUserId: userId,
      targetRole: role,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const formatted = notifications.map((n) => {
    const key = n.notificationKey || `notif:${n.id}`;
    const isRead = readMap.has(key);
    return {
      id: n.id,
      notificationKey: key,
      title: n.title,
      message: n.message,
      type: n.type || 'ANNOUNCEMENT',
      priority: n.priority || 'NORMAL',
      isImportant: Boolean(n.isImportant),
      sender: n.createdByName || (role === 'LEARNER' ? 'ALS System' : 'System'),
      actionUrl: n.linkUrl || (role === 'LEARNER' ? '/announcements' : '/dashboard/announcements'),
      deadlineAt: n.deadlineAt,
      isRead,
      readAt: readMap.get(key) || null,
      relativeTime: formatRelativeTime(n.createdAt),
      createdAt: n.createdAt,
    };
  });

  const unreadCount = formatted.filter((n) => !n.isRead).length;
  const shouldAnimateBell = unreadCount > 0 && formatted.some((n) => !n.isRead && n.isImportant);

  return {
    userId,
    role,
    unreadCount,
    eligibleUnreadCount: unreadCount,
    shouldAnimateBell,
    notifications: formatted,
  };
}

// ---------------------
// GET /api/notifications
// Retrieve recipient-scoped notifications
// ---------------------
router.get('/', async (req, res, next) => {
  try {
    const user = await resolveUserContext(req);
    if (!user) {
      return res.json({
        userId: null,
        role: null,
        unreadCount: 0,
        eligibleUnreadCount: 0,
        shouldAnimateBell: false,
        notifications: [],
      });
    }

    const result = await buildUserNotifications(user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/notifications/read
// Mark specific notification(s) as read for the logged-in recipient
// ---------------------
router.post('/read', async (req, res, next) => {
  try {
    const user = await resolveUserContext(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { notificationKey, notificationKeys } = req.body || {};
    const keysToMark = [];

    if (notificationKey) keysToMark.push(String(notificationKey));
    if (Array.isArray(notificationKeys)) {
      for (const k of notificationKeys) {
        if (k) keysToMark.push(String(k));
      }
    }

    if (keysToMark.length === 0) {
      return res.status(400).json({ error: 'notificationKey is required' });
    }

    for (const key of keysToMark) {
      await prisma.notificationRead.upsert({
        where: {
          userId_notificationKey: {
            userId: Number(user.id),
            notificationKey: key,
          },
        },
        create: {
          userId: Number(user.id),
          notificationKey: key,
          readAt: new Date(),
        },
        update: {
          readAt: new Date(),
        },
      });
    }

    const updated = await buildUserNotifications(user);
    res.json({
      success: true,
      markedKeys: keysToMark,
      ...updated,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/notifications/read-all
// Mark all notifications as read for the logged-in recipient
// ---------------------
router.post('/read-all', async (req, res, next) => {
  try {
    const user = await resolveUserContext(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const currentState = await buildUserNotifications(user);
    const unreadKeys = currentState.notifications
      .filter((n) => !n.isRead)
      .map((n) => n.notificationKey);

    for (const key of unreadKeys) {
      await prisma.notificationRead.upsert({
        where: {
          userId_notificationKey: {
            userId: Number(user.id),
            notificationKey: key,
          },
        },
        create: {
          userId: Number(user.id),
          notificationKey: key,
          readAt: new Date(),
        },
        update: {
          readAt: new Date(),
        },
      });
    }

    const updated = await buildUserNotifications(user);
    res.json({
      success: true,
      markedCount: unreadKeys.length,
      ...updated,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/notifications
// Create a custom notification
// ---------------------
router.post('/', async (req, res, next) => {
  try {
    const authUser = await resolveUserContext(req);
    const {
      title,
      message,
      type = 'REMINDER',
      priority = 'NORMAL',
      isImportant = false,
      targetRole = 'LEARNER',
      targetUserId = null,
      targetLearnerId = null,
      targetTeacherId = null,
      learningCenterId = null,
      programLevel = null,
      actionUrl = null,
      deadlineAt = null,
      notificationKey = null,
    } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const created = await createNotification({
      notificationKey: notificationKey || `custom:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`,
      title,
      message,
      type,
      priority,
      isImportant,
      targetRole,
      targetUserId,
      targetTeacherId,
      targetLearnerId,
      learningCenterId,
      programLevel,
      linkUrl: actionUrl,
      deadlineAt,
      createdByRole: authUser?.role || null,
      createdByName: authUser?.teacherProfile?.fullName || authUser?.adminProfile?.fullName || null,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

export default router;

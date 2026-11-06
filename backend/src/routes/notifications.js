import { Router } from 'express';
import prisma from '../config/prisma.js';
import { verifyToken } from '../config/jwt.js';
import {
  runReminderChecks,
  createNotification,
  formatRelativeTime,
  cleanupLegacyNotificationDuplicates,
} from '../services/notificationService.js';

const router = Router();

export async function resolveUserContext(req) {
  // 1. Bearer Token Verification (Enforced when Authorization header is sent)
  const authHeader = req.headers?.authorization;
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
          if (user && user.status === 'ACTIVE') return user;
        }
      } catch (_err) {
        // Token was provided but invalid/expired -> strictly reject, do not fall back to query spoofing
        return null;
      }
    }
    return null;
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

    // Fallback: if caller passed learner profile ID in userId parameter
    if (!rawLearnerId && rawRole === 'LEARNER') {
      const learner = await prisma.learner.findUnique({
        where: { id: Number(rawUserId) },
        include: { user: true },
      });
      if (learner?.user) {
        return {
          ...learner.user,
          learnerProfile: learner,
        };
      }
    }
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
 * Build recipient-specific notifications for the authenticated user (Read-Only query)
 */
export async function buildUserNotifications(user) {
  const userId = Number(user.id);
  const role = user.role;

  // 1. Fetch read statuses for this recipient
  const reads = await prisma.notificationRead.findMany({
    where: { userId },
    select: { notificationKey: true, readAt: true },
  });
  const readMap = new Map(reads.map((r) => [r.notificationKey, r.readAt]));

  // 2. Query role-based and recipient-specific notifications from MySQL
  const rawNotifications = await prisma.notification.findMany({
    where: {
      targetUserId: userId,
      targetRole: role,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // 3. Deduplicate and filter out stale legacy placeholder records
  const seenSources = new Set();
  const seenKeys = new Set();
  const uniqueNotifications = [];

  for (const n of rawNotifications) {
    if (!n.title || !n.message) continue;

    // Filter out old fake placeholder records that have no source announcement
    const isLegacyPlaceholder =
      (n.title === 'New Announcement' && n.message.includes('The District Coordinator posted a new announcement')) ||
      (n.title === 'Message from Your Teacher' && n.message.includes('Your teacher posted a new announcement'));
    if (isLegacyPlaceholder && !n.sourceId) {
      continue;
    }

    // Deduplicate by source event (e.g. announcement:5, module:2)
    if (n.sourceType && n.sourceId) {
      const srcKey = `${n.sourceType}:${n.sourceId}`;
      if (seenSources.has(srcKey)) continue;
      seenSources.add(srcKey);
    }

    // Deduplicate by notificationKey
    if (n.notificationKey) {
      if (seenKeys.has(n.notificationKey)) continue;
      seenKeys.add(n.notificationKey);
    }

    uniqueNotifications.push(n);
  }

  // 4. Batch fetch real announcement metadata for announcement notifications
  const announcementIds = uniqueNotifications
    .filter((n) => n.sourceType === 'announcement' && n.sourceId)
    .map((n) => Number(n.sourceId));

  const announcementMap = new Map();
  if (announcementIds.length > 0) {
    try {
      const anns = await prisma.announcement.findMany({
        where: { id: { in: announcementIds } },
        include: {
          author: {
            include: { adminProfile: true, teacherProfile: true },
          },
        },
      });
      for (const a of anns) {
        announcementMap.set(a.id, a);
      }
    } catch (_err) {
      // ignore
    }
  }

  // 5. Format notification records with actual metadata
  const formatted = [];
  const now = new Date();

  for (const n of uniqueNotifications) {
    let title = n.title;
    let message = n.message;
    let sender = n.createdByName;
    let createdAt = n.createdAt;
    let isImportant = Boolean(n.isImportant);

    if (n.sourceType === 'announcement' && n.sourceId && announcementMap.has(Number(n.sourceId))) {
      const ann = announcementMap.get(Number(n.sourceId));
      // Never show draft announcements or future scheduled announcements
      if (ann.status !== 'PUBLISHED') continue;
      if (ann.scheduledAt && new Date(ann.scheduledAt) > now) continue;

      title = ann.title ? ann.title.trim() : title;
      message = ann.content ? ann.content.trim() : message;
      createdAt = ann.createdAt || createdAt;
      isImportant = Boolean(ann.isImportant || ann.isPinned);
      sender =
        ann.creatorRole === 'TEACHER'
          ? (ann.author?.teacherProfile?.fullName || 'Assigned Teacher')
          : (ann.author?.adminProfile?.fullName || 'District Coordinator');
    }

    // Never return generic placeholder notifications
    if (
      title === 'New Announcement' ||
      title === 'Message from Your Teacher' ||
      message.includes('The District Coordinator posted a new announcement') ||
      message.includes('Your teacher posted a new announcement')
    ) {
      continue;
    }

    const key = n.notificationKey || `notif:${n.id}`;
    const isRead = readMap.has(key);

    formatted.push({
      id: n.id,
      notificationKey: key,
      title,
      message,
      type: n.type || 'ANNOUNCEMENT',
      priority: n.priority || 'NORMAL',
      isImportant,
      sender: sender || (role === 'LEARNER' ? 'ALS System' : 'System'),
      actionUrl: n.linkUrl || (role === 'LEARNER' ? '/notifications' : '/dashboard/announcements'),
      deadlineAt: n.deadlineAt,
      isRead,
      readAt: readMap.get(key) || null,
      relativeTime: formatRelativeTime(createdAt),
      createdAt,
    });
  }

  // 6. For learners, include any published announcements matching their audience not yet in notifications
  if (role === 'LEARNER') {
    try {
      const learner = await prisma.learner.findFirst({
        where: { userId },
        select: { id: true, learningCenterId: true, assignedTeacherId: true, level: true },
      });

      if (learner) {
        const publishedAnnouncements = await prisma.announcement.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              // Admin announcement for all learners
              {
                creatorRole: 'ADMIN',
                audience: 'ALL_LEARNERS',
                targetLearnerId: null,
                OR: [
                  { learningCenterId: null },
                  { learningCenterId: learner.learningCenterId },
                ],
              },
              // Individual learner announcement targeted to this learner
              {
                audience: 'INDIVIDUAL_LEARNER',
                targetLearnerId: learner.id,
              },
              // Teacher announcement for assigned learners
              ...(learner.assignedTeacherId
                ? [
                    {
                      creatorRole: 'TEACHER',
                      teacherId: learner.assignedTeacherId,
                      audience: 'ALL_LEARNERS',
                      targetLearnerId: null,
                      OR: [
                        { learningCenterId: null },
                        { learningCenterId: learner.learningCenterId },
                      ],
                    },
                  ]
                : []),
            ],
          },
          include: {
            author: {
              include: { adminProfile: true, teacherProfile: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

        for (const ann of publishedAnnouncements) {
          if (ann.scheduledAt && new Date(ann.scheduledAt) > now) continue;
          const srcKey = `announcement:${ann.id}`;
          if (!seenSources.has(srcKey)) {
            seenSources.add(srcKey);
            const key = `announcement:${ann.id}:user:${userId}`;
            const isRead = readMap.has(key);
            const sender =
              ann.creatorRole === 'TEACHER'
                ? (ann.author?.teacherProfile?.fullName || 'Assigned Teacher')
                : (ann.author?.adminProfile?.fullName || 'District Coordinator');

            formatted.push({
              id: ann.id,
              notificationKey: key,
              title: (ann.title || 'Announcement').trim(),
              message: (ann.content || '').trim(),
              type: 'ANNOUNCEMENT',
              priority: ann.priority || 'NORMAL',
              isImportant: Boolean(ann.isImportant || ann.isPinned),
              sender,
              actionUrl: '/notifications',
              deadlineAt: ann.deadlineAt || null,
              isRead,
              readAt: readMap.get(key) || null,
              relativeTime: formatRelativeTime(ann.createdAt),
              createdAt: ann.createdAt,
            });
          }
        }
      }
    } catch (_err) {
      // ignore
    }
  }

  // 7. Sort by createdAt desc
  formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
let hasRunStartupCleanup = false;

router.get('/', async (req, res, next) => {
  try {
    if (!hasRunStartupCleanup) {
      hasRunStartupCleanup = true;
      cleanupLegacyNotificationDuplicates().catch((err) =>
        console.error('[NotificationCleanup] background cleanup error:', err)
      );
    }

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

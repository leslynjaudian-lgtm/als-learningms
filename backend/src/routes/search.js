import { Router } from 'express';
import prisma from '../config/prisma.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * Normalize raw ALS level string/enum to canonical key ('ELEMENTARY' | 'JUNIOR')
 */
function normalizeLevelKey(level) {
  const norm = String(level || '').trim().toUpperCase();
  if (norm === 'ELEMENTARY' || norm.includes('ELEM')) {
    return 'ELEMENTARY';
  }
  return 'JUNIOR';
}

/**
 * Format ALS level strictly to the two allowed names:
 * - A&E Elementary
 * - A&E Junior High
 */
function formatAlsLevelName(level) {
  return normalizeLevelKey(level) === 'ELEMENTARY' ? 'A&E Elementary' : 'A&E Junior High';
}

/**
 * Format Date or ISO string to readable date (e.g., "Oct 29, 2026")
 */
function formatDateDisplay(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Case-insensitive substring helper
 */
function matchesText(value, queryLower) {
  if (!value) return false;
  return String(value).toLowerCase().includes(queryLower);
}

/**
 * Standard DepEd ALS Learning Strands fallback when LearningArea table has not been seeded yet
 */
const DEFAULT_LEARNING_AREAS = [
  {
    id: 1,
    code: 'LS1',
    name: 'Communication Skills (English)',
    description: 'Developing English communication skills for daily life and work.',
  },
  {
    id: 2,
    code: 'LS1',
    name: 'Communication Skills (Filipino)',
    description: 'Developing Filipino communication skills for daily life and work.',
  },
  {
    id: 3,
    code: 'LS2',
    name: 'Scientific & Critical Thinking Skills',
    description: 'Building scientific literacy and critical thinking abilities.',
  },
  {
    id: 4,
    code: 'LS3',
    name: 'Mathematical & Problem Solving Skills',
    description: 'Developing mathematical concepts and problem-solving skills.',
  },
  {
    id: 5,
    code: 'LS4',
    name: 'Life & Career Skills',
    description: 'Enhancing employability and livelihood capabilities.',
  },
  {
    id: 6,
    code: 'LS5',
    name: 'Understanding Self & Society',
    description: 'Understanding Philippine history, government, and civic responsibilities.',
  },
  {
    id: 7,
    code: 'LS6',
    name: 'Digital Citizenship',
    description: 'Developing digital literacy and responsible use of technology.',
  },
];

// -------------------------------------------------------------
// GET /api/search/admin?q=<query>
// Global search across authorized Admin Portal modules:
// - Learners
// - Teachers
// - Community Learning Centers
// - Learning Areas
// - Announcements
// - Schedules
// -------------------------------------------------------------
router.get('/admin', optionalAuth, async (req, res, next) => {
  try {
    if (req.user && req.user.role && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied. Admin search is restricted to authorized administrators.',
      });
    }

    const rawQuery = String(req.query.q || '').trim();
    if (rawQuery.length < 2) {
      return res.json({
        query: rawQuery,
        totalCount: 0,
        categories: [],
        results: [],
      });
    }

    const qLower = rawQuery.toLowerCase();

    const [
      learnersRaw,
      teachersRaw,
      centersRaw,
      learningAreasRaw,
      announcementsRaw,
      schedulesRaw,
    ] = await Promise.all([
      prisma.learner
        .findMany({
          include: {
            learningCenter: { select: { id: true, name: true } },
            assignedTeacher: { select: { id: true, fullName: true } },
          },
          orderBy: { fullName: 'asc' },
        })
        .catch(() => []),
      prisma.teacher
        .findMany({
          include: {
            learningCenter: { select: { id: true, name: true } },
          },
          orderBy: { fullName: 'asc' },
        })
        .catch(() => []),
      prisma.learningCenter
        .findMany({
          orderBy: { name: 'asc' },
        })
        .catch(() => []),
      prisma.learningArea
        .findMany({
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        })
        .catch(() => []),
      prisma.announcement
        .findMany({
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []),
      prisma.schedule
        .findMany({
          include: {
            learningCenter: { select: { id: true, name: true } },
            teacher: { select: { id: true, fullName: true } },
          },
          orderBy: { date: 'desc' },
        })
        .catch(() => []),
    ]);

    // 1. Learners (up to 5)
    const matchedLearners = learnersRaw
      .filter((l) => {
        const levelFormatted = formatAlsLevelName(l.level);
        return (
          matchesText(l.fullName, qLower) ||
          matchesText(l.firstName, qLower) ||
          matchesText(l.lastName, qLower) ||
          matchesText(l.lrn, qLower) ||
          matchesText(levelFormatted, qLower) ||
          matchesText(l.learningCenter?.name, qLower)
        );
      })
      .slice(0, 5)
      .map((l) => {
        const levelLabel = formatAlsLevelName(l.level);
        const centerLabel = l.learningCenter?.name ? ` • ${l.learningCenter.name}` : '';
        return {
          id: l.id,
          title: l.fullName,
          category: 'Learners',
          type: 'learner',
          subtitle: `${levelLabel}${centerLabel}`,
          route: `/dashboard/learners?view=${l.id}&search=${encodeURIComponent(l.fullName)}`,
        };
      });

    // 2. Teachers (up to 5)
    const matchedTeachers = teachersRaw
      .filter((t) => {
        return (
          matchesText(t.fullName, qLower) ||
          matchesText(t.teacherIdNumber, qLower) ||
          matchesText(t.position || 'ALS Teacher', qLower) ||
          matchesText(t.specialization, qLower) ||
          matchesText(t.learningCenter?.name, qLower)
        );
      })
      .slice(0, 5)
      .map((t) => {
        const posLabel = t.position || 'ALS Teacher';
        const centerLabel = t.learningCenter?.name ? ` • ${t.learningCenter.name}` : '';
        return {
          id: t.id,
          title: t.fullName,
          category: 'Teachers',
          type: 'teacher',
          subtitle: `${posLabel}${centerLabel}`,
          route: `/dashboard/teachers?view=${t.id}&search=${encodeURIComponent(t.fullName)}`,
        };
      });

    // 3. Community Learning Centers (up to 5)
    const matchedCenters = centersRaw
      .filter((c) => {
        return (
          matchesText(c.name, qLower) ||
          matchesText(c.code, qLower) ||
          matchesText(c.locationAddress, qLower) ||
          matchesText(c.barangay, qLower) ||
          matchesText(c.municipality, qLower)
        );
      })
      .slice(0, 5)
      .map((c) => {
        const addressSubtitle =
          c.locationAddress ||
          (c.barangay ? `Brgy. ${c.barangay}, ${c.municipality || 'Naawan'}` : 'Naawan District');
        return {
          id: c.id,
          title: c.name,
          category: 'Community Learning Centers',
          type: 'learning_center',
          subtitle: addressSubtitle,
          route: `/dashboard/learning-centers?view=${c.id}`,
        };
      });

    // 4. Learning Areas (up to 5)
    const combinedLearningAreas =
      Array.isArray(learningAreasRaw) && learningAreasRaw.length > 0
        ? learningAreasRaw
        : DEFAULT_LEARNING_AREAS;

    const matchedLearningAreas = combinedLearningAreas
      .filter((la) => {
        return (
          matchesText(la.name, qLower) ||
          matchesText(la.code, qLower) ||
          matchesText(la.description, qLower)
        );
      })
      .slice(0, 5)
      .map((la) => ({
        id: la.id,
        title: la.name,
        category: 'Learning Areas',
        type: 'learning_area',
        subtitle: `${la.code || 'ALS Strand'}${la.description ? ' • ' + la.description : ''}`,
        route: `/dashboard/learning-areas?search=${encodeURIComponent(la.name)}`,
      }));

    // 5. Announcements (up to 5)
    const centerMap = new Map(centersRaw.map((c) => [c.id, c.name]));
    const matchedAnnouncements = announcementsRaw
      .filter((a) => {
        const cName = a.learningCenterId ? centerMap.get(a.learningCenterId) : '';
        return (
          matchesText(a.title, qLower) ||
          matchesText(a.content, qLower) ||
          matchesText(cName, qLower)
        );
      })
      .slice(0, 5)
      .map((a) => {
        const cName = a.learningCenterId ? centerMap.get(a.learningCenterId) : null;
        return {
          id: a.id,
          title: a.title,
          category: 'Announcements',
          type: 'announcement',
          subtitle: `Published ${formatDateDisplay(a.createdAt)}${cName ? ' • ' + cName : ''}`,
          route: `/dashboard/announcements?view=${a.id}`,
        };
      });

    // 6. Schedules (up to 5)
    const matchedSchedules = schedulesRaw
      .filter((s) => {
        return (
          matchesText(s.title, qLower) ||
          matchesText(s.activityType, qLower) ||
          matchesText(s.description, qLower) ||
          matchesText(s.learningCenter?.name, qLower) ||
          matchesText(s.teacher?.fullName, qLower)
        );
      })
      .slice(0, 5)
      .map((s) => {
        const dateLabel = formatDateDisplay(s.date);
        const centerLabel = s.learningCenter?.name ? ` • ${s.learningCenter.name}` : '';
        return {
          id: s.id,
          title: s.title,
          category: 'Schedules',
          type: 'schedule',
          subtitle: `${dateLabel}${centerLabel}`,
          route: `/dashboard/schedule?view=${s.id}&search=${encodeURIComponent(s.title)}`,
        };
      });

    const categories = [
      { category: 'Learners', type: 'learner', items: matchedLearners },
      { category: 'Teachers', type: 'teacher', items: matchedTeachers },
      { category: 'Community Learning Centers', type: 'learning_center', items: matchedCenters },
      { category: 'Learning Areas', type: 'learning_area', items: matchedLearningAreas },
      { category: 'Announcements', type: 'announcement', items: matchedAnnouncements },
      { category: 'Schedules', type: 'schedule', items: matchedSchedules },
    ].filter((group) => group.items.length > 0);

    const flatResults = categories.flatMap((group) => group.items);

    res.json({
      query: rawQuery,
      totalCount: flatResults.length,
      categories,
      results: flatResults,
    });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// GET /api/search/teacher?q=<query>&teacherId=<id>
// Strictly teacher-scoped Global Search for the Teacher Portal.
// Only searches records assigned to or accessible by the logged-in teacher:
// - My Learners
// - Modules
// - Learning Centers
// - Schedules
// - Announcements
// - Learner Records
// -------------------------------------------------------------
router.get('/teacher', optionalAuth, async (req, res, next) => {
  try {
    const { teacherId: queryTeacherId = '' } = req.query;

    // 1. Strict Teacher Authentication & Data Isolation
    let resolvedTeacherId = null;

    if (req.user) {
      if (req.user.role === 'TEACHER') {
        const parsedQueryTid = queryTeacherId ? parseInt(String(queryTeacherId), 10) : null;
        if (parsedQueryTid && !isNaN(parsedQueryTid) && parsedQueryTid !== req.user.profileId) {
          return res.status(403).json({
            error: 'Access denied. You cannot search records belonging to another teacher.',
          });
        }
        resolvedTeacherId = req.user.profileId;
      } else if (req.user.role === 'ADMIN' && queryTeacherId) {
        const parsedQueryTid = parseInt(String(queryTeacherId), 10);
        if (!isNaN(parsedQueryTid)) {
          resolvedTeacherId = parsedQueryTid;
        }
      } else {
        return res.status(403).json({
          error: 'Access denied. This search endpoint is restricted to ALS Teachers.',
        });
      }
    } else if (queryTeacherId) {
      const parsedQueryTid = parseInt(String(queryTeacherId), 10);
      if (!isNaN(parsedQueryTid)) {
        resolvedTeacherId = parsedQueryTid;
      }
    }

    if (!resolvedTeacherId) {
      return res.status(401).json({
        error: 'Teacher authentication required. Please sign in.',
      });
    }

    const rawQuery = String(req.query.q || '').trim();
    if (rawQuery.length < 2) {
      return res.json({
        query: rawQuery,
        totalCount: 0,
        categories: [],
        results: [],
      });
    }

    const qLower = rawQuery.toLowerCase();

    // 2. Query strictly teacher-scoped records in parallel
    const [
      teacherProfile,
      assignedLearnersRaw,
      teacherModulesRaw,
      teacherSchedulesRaw,
      teacherAnnouncementsRaw,
      learnerProgressRaw,
    ] = await Promise.all([
      prisma.teacher
        .findUnique({
          where: { id: resolvedTeacherId },
          include: {
            learningCenter: true,
          },
        })
        .catch(() => null),
      prisma.learner
        .findMany({
          where: { assignedTeacherId: resolvedTeacherId },
          include: {
            learningCenter: true,
          },
          orderBy: { fullName: 'asc' },
        })
        .catch(() => []),
      prisma.module
        .findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { teacherId: resolvedTeacherId },
              { assignments: { some: { learner: { assignedTeacherId: resolvedTeacherId } } } },
              { learnerProgress: { some: { learner: { assignedTeacherId: resolvedTeacherId } } } },
            ],
          },
          include: {
            learningArea: { select: { id: true, name: true, code: true } },
          },
          orderBy: { title: 'asc' },
        })
        .catch(() => []),
      prisma.schedule
        .findMany({
          where: { teacherId: resolvedTeacherId },
          include: {
            learningCenter: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
        })
        .catch(() => []),
      prisma.announcement
        .findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              {
                creatorRole: 'ADMIN',
                audience: { in: ['ALL_TEACHERS', 'TEACHERS', 'ALL'] },
              },
              {
                teacherId: resolvedTeacherId,
              },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []),
      prisma.learnerProgress
        .findMany({
          where: {
            learner: { assignedTeacherId: resolvedTeacherId },
          },
          include: {
            learner: { select: { id: true, fullName: true, level: true, assignedTeacherId: true } },
            module: { select: { id: true, title: true, code: true, targetLevel: true } },
          },
          orderBy: { updatedAt: 'desc' },
        })
        .catch(() => []),
    ]);

    if (!teacherProfile) {
      return res.status(404).json({ error: 'Teacher profile not found.' });
    }

    // Build authorized learning centers strictly for this teacher
    const authorizedCentersMap = new Map();
    if (teacherProfile.learningCenter && teacherProfile.learningCenter.id) {
      authorizedCentersMap.set(teacherProfile.learningCenter.id, teacherProfile.learningCenter);
    }
    for (const l of assignedLearnersRaw) {
      if (l.assignedTeacherId === resolvedTeacherId && l.learningCenter && l.learningCenter.id) {
        if (!authorizedCentersMap.has(l.learningCenter.id)) {
          authorizedCentersMap.set(l.learningCenter.id, l.learningCenter);
        }
      }
    }
    const authorizedCenters = Array.from(authorizedCentersMap.values());

    // 1. My Learners (strictly assignedTeacherId === resolvedTeacherId, up to 5)
    const matchedLearners = assignedLearnersRaw
      .filter((l) => l.assignedTeacherId === resolvedTeacherId)
      .filter((l) => {
        const levelFormatted = formatAlsLevelName(l.level);
        return (
          matchesText(l.fullName, qLower) ||
          matchesText(l.firstName, qLower) ||
          matchesText(l.lastName, qLower) ||
          matchesText(l.lrn, qLower) ||
          matchesText(levelFormatted, qLower) ||
          matchesText(l.learningCenter?.name, qLower)
        );
      })
      .slice(0, 5)
      .map((l) => {
        const levelLabel = formatAlsLevelName(l.level);
        const centerLabel = l.learningCenter?.name ? ` • ${l.learningCenter.name}` : '';
        return {
          id: l.id,
          title: l.fullName,
          category: 'My Learners',
          type: 'learner',
          subtitle: `${levelLabel}${centerLabel}`,
          route: `/dashboard/learners/${l.id}`,
        };
      });

    // 2. Modules (up to 5)
    const matchedModules = teacherModulesRaw
      .filter((m) => {
        const levelFormatted = formatAlsLevelName(m.targetLevel);
        return (
          matchesText(m.title, qLower) ||
          matchesText(m.code, qLower) ||
          matchesText(m.description, qLower) ||
          matchesText(levelFormatted, qLower) ||
          matchesText(m.learningArea?.name, qLower)
        );
      })
      .slice(0, 5)
      .map((m) => {
        const levelLabel = formatAlsLevelName(m.targetLevel);
        const areaLabel = m.learningArea?.name ? ` • ${m.learningArea.name}` : '';
        return {
          id: m.id,
          title: m.title,
          category: 'Modules',
          type: 'module',
          subtitle: `${levelLabel}${areaLabel}`,
          route: `/dashboard/modules/${m.id}`,
        };
      });

    // 3. Learning Centers (strictly teacher's authorized centers, up to 5)
    const matchedCenters = authorizedCenters
      .filter((c) => {
        return (
          matchesText(c.name, qLower) ||
          matchesText(c.code, qLower) ||
          matchesText(c.locationAddress, qLower) ||
          matchesText(c.barangay, qLower) ||
          matchesText(c.municipality, qLower)
        );
      })
      .slice(0, 5)
      .map((c) => {
        const addressSubtitle =
          c.locationAddress ||
          (c.barangay ? `Brgy. ${c.barangay}, ${c.municipality || 'Naawan'}` : 'Assigned CLC');
        return {
          id: c.id,
          title: c.name,
          category: 'Learning Centers',
          type: 'learning_center',
          subtitle: addressSubtitle,
          route: `/dashboard/learning-centers/${c.id}`,
        };
      });

    // 4. Schedules (strictly teacher's schedules, up to 5)
    const matchedSchedules = teacherSchedulesRaw
      .filter((s) => s.teacherId === resolvedTeacherId)
      .filter((s) => {
        return (
          matchesText(s.title, qLower) ||
          matchesText(s.activityType, qLower) ||
          matchesText(s.description, qLower) ||
          matchesText(s.learningCenter?.name, qLower)
        );
      })
      .slice(0, 5)
      .map((s) => {
        const dateLabel = formatDateDisplay(s.date);
        const centerLabel = s.learningCenter?.name ? ` • ${s.learningCenter.name}` : '';
        return {
          id: s.id,
          title: s.title,
          category: 'Schedules',
          type: 'schedule',
          subtitle: `${dateLabel}${centerLabel}`,
          route: `/dashboard/schedule?view=${s.id}&search=${encodeURIComponent(s.title)}`,
        };
      });

    // 5. Announcements (Admin announcements for teachers + teacher's own announcements, up to 5)
    const matchedAnnouncements = teacherAnnouncementsRaw
      .filter((a) => {
        return matchesText(a.title, qLower) || matchesText(a.content, qLower);
      })
      .slice(0, 5)
      .map((a) => {
        const sourceLabel = a.teacherId === resolvedTeacherId ? 'My Announcement' : 'From Admin';
        return {
          id: a.id,
          title: a.title,
          category: 'Announcements',
          type: 'announcement',
          subtitle: `${sourceLabel} • ${formatDateDisplay(a.createdAt)}`,
          route: `/dashboard/announcements?view=${a.id}`,
        };
      });

    // 6. Learner Records / Progress (strictly teacher's assigned learners, up to 5)
    const matchedRecords = learnerProgressRaw
      .filter((p) => p.learner && p.learner.assignedTeacherId === resolvedTeacherId && p.module)
      .filter((p) => {
        const statusText =
          p.status === 'COMPLETED'
            ? 'Completed'
            : p.status === 'IN_PROGRESS'
            ? 'In Progress'
            : 'Not Started';
        return (
          matchesText(p.learner.fullName, qLower) ||
          matchesText(p.module.title, qLower) ||
          matchesText(p.module.code, qLower) ||
          matchesText(statusText, qLower)
        );
      })
      .slice(0, 5)
      .map((p) => {
        const statusText =
          p.status === 'COMPLETED'
            ? 'Completed'
            : p.status === 'IN_PROGRESS'
            ? 'In Progress'
            : 'Not Started';
        return {
          id: p.id,
          title: `${p.learner.fullName} — ${p.module.title}`,
          category: 'Learner Records',
          type: 'record',
          subtitle: `${formatAlsLevelName(p.learner.level)} • ${statusText}`,
          route: `/dashboard/learners/${p.learner.id}`,
        };
      });

    const categories = [
      { category: 'My Learners', type: 'learner', items: matchedLearners },
      { category: 'Modules', type: 'module', items: matchedModules },
      { category: 'Learning Centers', type: 'learning_center', items: matchedCenters },
      { category: 'Schedules', type: 'schedule', items: matchedSchedules },
      { category: 'Announcements', type: 'announcement', items: matchedAnnouncements },
      { category: 'Learner Records', type: 'record', items: matchedRecords },
    ].filter((group) => group.items.length > 0);

    const flatResults = categories.flatMap((group) => group.items);

    res.json({
      query: rawQuery,
      totalCount: flatResults.length,
      categories,
      results: flatResults,
    });
  } catch (err) {
    next(err);
  }
});

export default router;


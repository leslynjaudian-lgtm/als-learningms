import { Router } from 'express';
import prisma from '../config/prisma.js';
import { verifyToken } from '../config/jwt.js';

const router = Router();

function formatAudience(raw) {
  if (raw === 'ALL_TEACHERS' || raw === 'TEACHERS') return 'All Teachers';
  if (raw === 'ALL_LEARNERS' || raw === 'LEARNERS') return 'All Learners';
  if (raw === 'INDIVIDUAL_LEARNER' || raw === 'SPECIFIC_LEARNER' || raw === 'SPECIFIC' || raw === 'INDIVIDUAL') return 'Individual Learner';
  return 'All Learners';
}

function normalizeAudienceInput(val, targetLearnerId) {
  if (targetLearnerId) return 'INDIVIDUAL_LEARNER';
  if (!val) return 'ALL_LEARNERS';
  const s = String(val).trim().toUpperCase();
  if (s.includes('TEACHER')) {
    return 'ALL_TEACHERS';
  }
  if (s.includes('INDIVIDUAL') || s.includes('SPECIFIC')) {
    return 'INDIVIDUAL_LEARNER';
  }
  if (s.includes('LEARNER')) {
    return 'ALL_LEARNERS';
  }
  return 'ALL_LEARNERS';
}

function normalizeProgramLevel(val) {
  if (!val) return null;
  const s = String(val).trim().toUpperCase();
  if (s.includes('ELEM')) return 'A&E Elementary';
  if (s.includes('JUN')) return 'A&E Junior High';
  return String(val).trim();
}

function normalizeStatusInput(val) {
  if (!val) return 'PUBLISHED';
  const s = String(val).trim().toUpperCase();
  if (s === 'DRAFT') return 'DRAFT';
  return 'PUBLISHED';
}

function inferAnnouncementMeta(input = {}, fallback = {}) {
  const titleText = String(input.title ?? fallback.title ?? '').trim();
  const bodyText = String(input.content ?? input.message ?? fallback.content ?? '').trim();
  const combined = `${titleText} ${bodyText}`;

  const rawPriority = input.priority !== undefined ? String(input.priority || '').trim().toUpperCase() : null;
  const explicitImportant =
    input.isImportant !== undefined
      ? Boolean(input.isImportant)
      : input.is_important !== undefined
        ? Boolean(input.is_important)
        : null;
  const pinnedFlag =
    input.isPinned !== undefined
      ? Boolean(input.isPinned)
      : input.is_pinned !== undefined
        ? Boolean(input.is_pinned)
        : Boolean(fallback.is_pinned);

  const rawDeadline = input.deadlineAt ?? input.deadline_at ?? fallback.deadline_at ?? null;
  const parsedDeadline = rawDeadline ? new Date(rawDeadline) : null;
  const validDeadline = parsedDeadline && !isNaN(parsedDeadline.getTime()) ? parsedDeadline : null;

  let isImportant = true;
  if (explicitImportant !== null) {
    isImportant = explicitImportant;
  } else if (rawPriority) {
    isImportant = ['IMPORTANT', 'HIGH', 'URGENT'].includes(rawPriority);
  } else if (pinnedFlag || validDeadline) {
    isImportant = true;
  } else if (/\b(ordinary|optional|general info|reading tip|fun fact|fyi|casual|non-important|not important)\b/i.test(combined)) {
    isImportant = false;
  } else if (/\b(important|urgent|reminder|deadline|required|mandatory|reschedule|rescheduled|cancelled|postponed|assessment|exam|orientation|submission|tapusin|paalala|mahalaga|action required)\b/i.test(combined)) {
    isImportant = true;
  } else if (fallback.is_important !== undefined) {
    isImportant = Boolean(fallback.is_important);
  } else {
    isImportant = true;
  }

  let priority = 'NORMAL';
  if (rawPriority && ['NORMAL', 'IMPORTANT', 'HIGH', 'URGENT'].includes(rawPriority)) {
    priority = rawPriority;
    if (priority === 'NORMAL' && explicitImportant === true) {
      priority = 'IMPORTANT';
    }
  } else {
    priority = isImportant ? 'IMPORTANT' : 'NORMAL';
  }

  const rawCategory = String(input.category ?? fallback.category ?? '').trim().toUpperCase();
  let category = 'ANNOUNCEMENT';
  if (['ANNOUNCEMENT', 'REMINDER', 'SCHEDULE'].includes(rawCategory)) {
    category = rawCategory;
  } else if (/\b(schedule|session|reschedule|rescheduled|class|meeting|orientation)\b/i.test(combined)) {
    category = 'SCHEDULE';
  } else if (validDeadline || /\b(reminder|deadline|due|tapusin|paalala|submit|submission)\b/i.test(combined)) {
    category = 'REMINDER';
  }

  return {
    isPinned: pinnedFlag ? 1 : 0,
    isImportant: isImportant ? 1 : 0,
    priority,
    category,
    deadlineAt: validDeadline,
  };
}

function formatAnnouncement(a) {
  const isTeacher = a.creator_role === 'TEACHER' || a.role === 'TEACHER' || a.teacher_id != null || !!a.teacher_name;
  const authorName = isTeacher
    ? (a.teacher_name || 'ALS Teacher')
    : (a.admin_name || 'Administrator');

  const dateObj = new Date(a.created_at || a.createdAt);
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const audienceLabel = a.target_learner_name
    ? a.target_learner_name
    : formatAudience(a.audience);

  const statusLabel = (a.status === 'DRAFT' || a.status === 'Draft') ? 'Draft' : 'Published';
  const isImportant = Boolean(
    a.is_important ||
    a.is_pinned ||
    ['IMPORTANT', 'HIGH', 'URGENT'].includes(String(a.priority || '').toUpperCase())
  );
  const priority = a.priority || (isImportant ? 'IMPORTANT' : 'NORMAL');
  const category = a.category || 'ANNOUNCEMENT';

  return {
    id: a.id,
    title: a.title,
    message: a.content,
    content: a.content,
    audience: audienceLabel,
    audienceRaw: a.audience,
    status: statusLabel,
    statusRaw: a.status,
    isPinned: Boolean(a.is_pinned),
    isImportant,
    priority,
    category,
    deadlineAt: a.deadline_at || null,
    priorityLabel: a.is_pinned ? 'Pinned' : (isImportant ? 'Important' : null),
    createdBy: authorName,
    author: authorName,
    creatorRole: a.creator_role || (isTeacher ? 'TEACHER' : 'ADMIN'),
    source: isTeacher ? 'My Announcement' : 'From Admin',
    authorId: a.author_id,
    teacherId: a.teacher_id,
    teacherName: a.teacher_name || null,
    learningCenterId: a.learning_center_id,
    learningCenter: a.learning_center_name || (a.learning_center_id ? `CLC #${a.learning_center_id}` : null),
    programLevel: a.program_level ? normalizeProgramLevel(a.program_level) : null,
    targetLearnerId: a.target_learner_id,
    targetLearnerName: a.target_learner_name || null,
    datePosted: dateFormatted,
    date: dateFormatted,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

// Helper to extract authenticated user from token
async function resolveAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) return null;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        adminProfile: true,
        teacherProfile: {
          include: {
            learningCenter: true,
            assignedLearners: {
              include: { learningCenter: true },
            },
          },
        },
        learnerProfile: {
          include: { learningCenter: true, assignedTeacher: true },
        },
      },
    });
    return user;
  } catch (err) {
    return null;
  }
}

// ---------------------
// GET /api/announcements
// List announcements with audience, status, and portal filtering
// ---------------------
router.get('/', async (req, res, next) => {
  try {
    const authUser = await resolveAuthUser(req);
    const { portal, role, audience, status, learnerId, learningCenterId, teacherId } = req.query;

    const baseSql = `
      SELECT 
        a.id, a.title, a.content, a.audience, a.status, a.is_pinned,
        a.is_important, a.priority, a.category, a.deadline_at,
        a.author_id, a.creator_role, a.teacher_id, a.learning_center_id, a.program_level, a.target_learner_id,
        a.created_at, a.updated_at,
        u.username, u.role,
        tp.full_name as teacher_name,
        ap.full_name as admin_name,
        lc.name as learning_center_name,
        tgt_l.full_name as target_learner_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN teachers tp ON (tp.id = a.teacher_id OR (tp.user_id = u.id AND a.teacher_id IS NULL))
      LEFT JOIN admins ap ON ap.user_id = u.id
      LEFT JOIN learning_centers lc ON lc.id = a.learning_center_id
      LEFT JOIN learners tgt_l ON tgt_l.id = a.target_learner_id
    `;

    const effectiveRole = (authUser?.role || role || '').toUpperCase();
    const effectivePortal = (portal || '').toLowerCase();

    // ----------------------------------------------------
    // 1. LEARNER PORTAL FILTERING
    // ----------------------------------------------------
    if (effectivePortal === 'learner' || effectiveRole === 'LEARNER') {
      let currentLearner = null;
      const lid = learnerId ? parseInt(learnerId, 10) : null;
      if (lid && !isNaN(lid)) {
        currentLearner = await prisma.learner.findUnique({
          where: { id: lid },
          include: { learningCenter: true, assignedTeacher: true },
        });
      }
      if (!currentLearner && authUser?.learnerProfile) {
        currentLearner = authUser.learnerProfile;
      }
      if (!currentLearner && authUser?.role === 'LEARNER') {
        currentLearner = await prisma.learner.findFirst({
          where: { userId: authUser.id },
          include: { learningCenter: true, assignedTeacher: true },
        });
      }

      let sql = baseSql + ` WHERE a.status = 'PUBLISHED' `;
      const params = [];

      if (currentLearner) {
        const learnerDbId = currentLearner.id;
        const teacherDbId = currentLearner.assignedTeacherId;
        const centerDbId = currentLearner.learningCenterId;
        const learnerLevel = (currentLearner.level || '').toUpperCase();
        const levelPattern = learnerLevel.includes('ELEM') ? '%Elem%' : '%Jun%';

        sql += `
          AND (
            -- 1. Admin created for all learners (district-wide or learner's center)
            (
              (a.creator_role = 'ADMIN' OR (a.creator_role IS NULL AND (u.role = 'ADMIN' OR a.teacher_id IS NULL)))
              AND a.audience IN ('ALL_LEARNERS', 'LEARNERS', 'ALL')
              AND a.target_learner_id IS NULL
              AND (a.learning_center_id IS NULL OR a.learning_center_id = ?)
            )
            OR
            -- 2. Assigned Teacher created for Individual Learner targeting this learner
            (
              a.audience IN ('INDIVIDUAL_LEARNER', 'SPECIFIC_LEARNER')
              AND a.target_learner_id = ?
              AND (a.teacher_id IS NULL OR a.teacher_id = ?)
            )
        `;
        params.push(centerDbId || 0, learnerDbId, teacherDbId || 0);

        if (teacherDbId) {
          sql += `
            OR
            -- 3. Teacher created for All Learners assigned to this teacher matching learning center and ALS level
            (
              (a.creator_role = 'TEACHER' OR a.teacher_id IS NOT NULL)
              AND a.audience IN ('ALL_LEARNERS', 'LEARNERS', 'ALL')
              AND a.target_learner_id IS NULL
              AND a.teacher_id = ?
              AND (a.learning_center_id IS NULL OR a.learning_center_id = ?)
              AND (a.program_level IS NULL OR a.program_level LIKE ?)
            )
          `;
          params.push(teacherDbId, centerDbId || 0, levelPattern);
        }

        sql += ` ) `;
      } else {
        // Fallback: district-wide Admin announcements for all learners
        sql += `
          AND (a.creator_role = 'ADMIN' OR (a.creator_role IS NULL AND (u.role = 'ADMIN' OR a.teacher_id IS NULL)))
          AND a.audience IN ('ALL_LEARNERS', 'LEARNERS', 'ALL')
          AND a.target_learner_id IS NULL
          AND a.learning_center_id IS NULL
        `;
      }

      sql += ` ORDER BY a.created_at DESC`;
      const rows = await prisma.$queryRawUnsafe(sql, ...params);
      return res.json(rows.map(formatAnnouncement));
    }

    // ----------------------------------------------------
    // 2. TEACHER PORTAL FILTERING
    // ----------------------------------------------------
    if (effectivePortal === 'teacher' || effectiveRole === 'TEACHER') {
      const currentTeacher = authUser?.teacherProfile || null;
      if (authUser?.role === 'TEACHER' && currentTeacher?.id && teacherId) {
        const parsedQueryTid = parseInt(String(teacherId), 10);
        if (!isNaN(parsedQueryTid) && parsedQueryTid !== currentTeacher.id) {
          return res.status(403).json({
            error: 'Access denied. You cannot view announcements belonging to another teacher.',
          });
        }
      }
      let tid = currentTeacher?.id || (teacherId ? parseInt(teacherId, 10) : null);
      if (!tid && authUser?.id) {
        const foundTeacher = await prisma.teacher.findFirst({ where: { userId: authUser.id } });
        if (foundTeacher) tid = foundTeacher.id;
      }
      const tuid = authUser?.id || null;

      let sql = baseSql + ` WHERE a.status = 'PUBLISHED' `;
      const params = [];

      if (tid) {
        sql += `
          AND (
            -- 1. Admin announcements intended for All Teachers
            (
              (a.creator_role = 'ADMIN' OR (a.creator_role IS NULL AND (u.role = 'ADMIN' OR a.teacher_id IS NULL)))
              AND a.audience IN ('ALL_TEACHERS', 'TEACHERS', 'ALL')
            )
            OR
            -- 2. The logged-in teacher's own announcements
            (
              a.teacher_id = ?
              ${tuid ? 'OR (a.creator_role = \'TEACHER\' AND a.author_id = ?)' : ''}
            )
          )
        `;
        params.push(tid);
        if (tuid) params.push(tuid);
      } else {
        sql += `
          AND (a.creator_role = 'ADMIN' OR (a.creator_role IS NULL AND (u.role = 'ADMIN' OR a.teacher_id IS NULL)))
          AND a.audience IN ('ALL_TEACHERS', 'TEACHERS', 'ALL')
        `;
      }

      sql += ` ORDER BY a.created_at DESC`;
      const rows = await prisma.$queryRawUnsafe(sql, ...params);
      return res.json(rows.map(formatAnnouncement));
    }

    // ----------------------------------------------------
    // 3. ADMIN PORTAL FILTERING (Admin sees ONLY Admin announcements)
    // ----------------------------------------------------
    let sql = baseSql + ` WHERE (a.creator_role = 'ADMIN' OR (a.creator_role IS NULL AND (u.role = 'ADMIN' OR a.teacher_id IS NULL))) `;
    const params = [];

    if (audience) {
      const normAudience = normalizeAudienceInput(audience);
      sql += ` AND a.audience = ?`;
      params.push(normAudience);
    }
    if (status) {
      const normStatus = normalizeStatusInput(status);
      sql += ` AND a.status = ?`;
      params.push(normStatus);
    }
    if (learningCenterId) {
      const cid = parseInt(learningCenterId, 10);
      if (!isNaN(cid)) {
        sql += ` AND a.learning_center_id = ?`;
        params.push(cid);
      }
    }

    sql += ` ORDER BY a.created_at DESC`;
    const rows = await prisma.$queryRawUnsafe(sql, ...params);
    res.json(rows.map(formatAnnouncement));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/announcements/:id
// Get single announcement by ID
// ---------------------
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid announcement ID' });
    }

    const rows = await prisma.$queryRawUnsafe(`
      SELECT 
        a.id, a.title, a.content, a.audience, a.status, a.is_pinned,
        a.is_important, a.priority, a.category, a.deadline_at,
        a.author_id, a.creator_role, a.teacher_id, a.learning_center_id, a.program_level, a.target_learner_id,
        a.created_at, a.updated_at,
        u.username, u.role,
        tp.full_name as teacher_name,
        ap.full_name as admin_name,
        lc.name as learning_center_name,
        tgt_l.full_name as target_learner_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN teachers tp ON (tp.id = a.teacher_id OR (tp.user_id = u.id AND a.teacher_id IS NULL))
      LEFT JOIN admins ap ON ap.user_id = u.id
      LEFT JOIN learning_centers lc ON lc.id = a.learning_center_id
      LEFT JOIN learners tgt_l ON tgt_l.id = a.target_learner_id
      WHERE a.id = ?
      LIMIT 1
    `, id);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(formatAnnouncement(rows[0]));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/announcements
// Create announcement (Admin or Teacher)
// ---------------------
router.post('/', async (req, res, next) => {
  try {
    const authUser = await resolveAuthUser(req);
    const {
      title,
      content,
      message,
      audience,
      status,
      learningCenterId,
      learning_center_id,
      programLevel,
      program_level,
      targetLearnerId,
      target_learner_id,
      targetLearnerIds,
      target_learner_ids,
      teacherId,
      teacher_id,
      creatorRole,
      creator_role,
      datePosted,
      date,
      createdAt,
    } = req.body;

    const bodyContent = (content || message || '').trim();

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!bodyContent) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Determine creator role
    let resolvedRole = (creatorRole || creator_role || authUser?.role || '').toUpperCase();
    let resolvedTeacherId = teacherId || teacher_id
      ? parseInt(teacherId || teacher_id, 10)
      : (authUser?.teacherProfile?.id || null);

    if (!resolvedRole) {
      if (resolvedTeacherId) {
        resolvedRole = 'TEACHER';
      } else if (authUser?.role === 'ADMIN') {
        resolvedRole = 'ADMIN';
      } else {
        resolvedRole = 'ADMIN';
      }
    }

    // Resolve author user ID
    let authorUserId = authUser?.id || null;
    if (!authorUserId && resolvedTeacherId) {
      const t = await prisma.teacher.findUnique({
        where: { id: resolvedTeacherId },
        select: { userId: true },
      });
      if (t?.userId) authorUserId = t.userId;
    }
    if (!authorUserId) {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const fallbackUser = adminUser || (await prisma.user.findFirst());
      if (!fallbackUser) {
        return res.status(400).json({ error: 'No user found in system to author announcement' });
      }
      authorUserId = fallbackUser.id;
    }

    // ==========================================
    // TEACHER ANNOUNCEMENT VALIDATIONS
    // ==========================================
    if (resolvedRole === 'TEACHER') {
      // 1. Audience verification (Learner-only)
      const rawAudienceStr = String(audience || '').trim().toUpperCase();
      if (rawAudienceStr.includes('TEACHER') || rawAudienceStr.includes('ADMIN')) {
        return res.status(400).json({ error: 'Teacher announcements are learner-facing only.' });
      }

      // 2. Resolve teacher record with assignments
      if (!resolvedTeacherId && authorUserId) {
        const foundTeacher = await prisma.teacher.findFirst({
          where: { userId: authorUserId },
        });
        if (foundTeacher) resolvedTeacherId = foundTeacher.id;
      }

      if (!resolvedTeacherId) {
        return res.status(400).json({ error: 'Teacher profile not found for this user.' });
      }

      const teacher = await prisma.teacher.findUnique({
        where: { id: resolvedTeacherId },
        include: {
          learningCenter: true,
          assignedLearners: {
            include: { learningCenter: true },
          },
        },
      });

      if (!teacher) {
        return res.status(400).json({ error: 'Teacher not found in system.' });
      }

      // 3. Learning Center validation
      const centerId = learningCenterId || learning_center_id
        ? parseInt(learningCenterId || learning_center_id, 10)
        : null;

      if (!centerId) {
        return res.status(400).json({ error: 'Learning Center is required.' });
      }

      // Verify teacher is assigned to this Learning Center
      const isAssignedCenter =
        (teacher.learningCenterId && Number(teacher.learningCenterId) === centerId) ||
        (Array.isArray(teacher.assignedLearners) && teacher.assignedLearners.some((l) => Number(l.learningCenterId) === centerId));

      if (!isAssignedCenter) {
        return res.status(400).json({ error: 'Teacher is not assigned to the selected Learning Center.' });
      }

      // 4. ALS Level validation
      const normProgramLevel = normalizeProgramLevel(programLevel || program_level);
      if (!normProgramLevel || (normProgramLevel !== 'A&E Elementary' && normProgramLevel !== 'A&E Junior High')) {
        return res.status(400).json({ error: 'ALS Level is required (must be A&E Elementary or A&E Junior High).' });
      }

      // Verify teacher is assigned to this ALS Level
      const teacherSpec = teacher.specialization || 'Both';
      const teacherSpecLower = teacherSpec.toLowerCase();
      if (teacherSpecLower.includes('both')) {
        // Teacher handles both, valid
      } else if (teacherSpecLower.includes('elem')) {
        if (normProgramLevel !== 'A&E Elementary') {
          return res.status(400).json({ error: 'Teacher is not assigned to A&E Junior High.' });
        }
      } else if (teacherSpecLower.includes('jun')) {
        if (normProgramLevel !== 'A&E Junior High') {
          return res.status(400).json({ error: 'Teacher is not assigned to A&E Elementary.' });
        }
      }

      // 5. Audience: All Learners vs Individual Learner(s)
      const rawTargetLearnerIds = targetLearnerIds || target_learner_ids;
      let resolvedTargetLearnerIds = [];
      if (Array.isArray(rawTargetLearnerIds) && rawTargetLearnerIds.length > 0) {
        resolvedTargetLearnerIds = rawTargetLearnerIds
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id));
      } else if (targetLearnerId || target_learner_id) {
        const parsed = parseInt(targetLearnerId || target_learner_id, 10);
        if (!isNaN(parsed)) resolvedTargetLearnerIds = [parsed];
      }

      const isIndividual =
        resolvedTargetLearnerIds.length > 0 ||
        rawAudienceStr.includes('INDIVIDUAL') ||
        rawAudienceStr.includes('SPECIFIC');

      const dbAudience = isIndividual ? 'INDIVIDUAL_LEARNER' : 'ALL_LEARNERS';

      if (isIndividual) {
        if (resolvedTargetLearnerIds.length === 0) {
          return res.status(400).json({ error: 'Please select an individual learner.' });
        }

        // Validate each learner
        for (const tid of resolvedTargetLearnerIds) {
          const learner = await prisma.learner.findUnique({
            where: { id: tid },
            include: { learningCenter: true },
          });

          // Condition 1: Learner exists
          if (!learner) {
            return res.status(400).json({ error: `Selected learner (ID: ${tid}) does not exist.` });
          }

          // Condition 2: Learner is active
          if ((learner.status || 'Active').toLowerCase() !== 'active') {
            return res.status(400).json({ error: `Selected learner (${learner.fullName}) is not active.` });
          }

          // Condition 3: Learner is assigned to the logged-in teacher
          if (Number(learner.assignedTeacherId) !== Number(teacher.id)) {
            return res.status(400).json({ error: `Selected learner (${learner.fullName}) is not assigned to this teacher.` });
          }

          // Condition 4: Learner belongs to selected Learning Center
          if (Number(learner.learningCenterId) !== Number(centerId)) {
            return res.status(400).json({ error: `Selected learner (${learner.fullName}) does not belong to the selected Learning Center.` });
          }

          // Condition 5: Learner belongs to selected ALS Level
          const learnerLevelStr = (learner.level || '').toUpperCase();
          if (normProgramLevel === 'A&E Elementary' && !learnerLevelStr.includes('ELEM')) {
            return res.status(400).json({ error: `Selected learner (${learner.fullName}) does not belong to A&E Elementary.` });
          }
          if (normProgramLevel === 'A&E Junior High' && !learnerLevelStr.includes('JUN')) {
            return res.status(400).json({ error: `Selected learner (${learner.fullName}) does not belong to A&E Junior High.` });
          }
        }
      }

      // Format date
      const rawDate = datePosted || date || createdAt;
      const postDate = rawDate ? new Date(rawDate) : null;
      const validDate = postDate && !isNaN(postDate.getTime()) ? postDate : null;
      const meta = inferAnnouncementMeta(req.body);
      const dbStatus = normalizeStatusInput(status);

      const targetIdsToInsert = isIndividual ? resolvedTargetLearnerIds : [null];
      for (const targetId of targetIdsToInsert) {
        if (validDate) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO announcements 
              (title, content, audience, status, is_pinned, is_important, priority, category, deadline_at, author_id, creator_role, teacher_id, learning_center_id, program_level, target_learner_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TEACHER', ?, ?, ?, ?, ?, NOW())`,
            title.trim(),
            bodyContent,
            dbAudience,
            dbStatus,
            meta.isPinned,
            meta.isImportant,
            meta.priority,
            meta.category,
            meta.deadlineAt,
            authorUserId,
            resolvedTeacherId,
            centerId,
            normProgramLevel,
            targetId,
            validDate
          );
        } else {
          await prisma.$executeRawUnsafe(
            `INSERT INTO announcements 
              (title, content, audience, status, is_pinned, is_important, priority, category, deadline_at, author_id, creator_role, teacher_id, learning_center_id, program_level, target_learner_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TEACHER', ?, ?, ?, ?, NOW(), NOW())`,
            title.trim(),
            bodyContent,
            dbAudience,
            dbStatus,
            meta.isPinned,
            meta.isImportant,
            meta.priority,
            meta.category,
            meta.deadlineAt,
            authorUserId,
            resolvedTeacherId,
            centerId,
            normProgramLevel,
            targetId
          );
        }
      }

      const [inserted] = await prisma.$queryRawUnsafe(`
        SELECT 
          a.id, a.title, a.content, a.audience, a.status, a.is_pinned,
          a.is_important, a.priority, a.category, a.deadline_at,
          a.author_id, a.creator_role, a.teacher_id, a.learning_center_id, a.program_level, a.target_learner_id,
          a.created_at, a.updated_at,
          u.username, u.role,
          tp.full_name as teacher_name,
          ap.full_name as admin_name,
          lc.name as learning_center_name,
          tgt_l.full_name as target_learner_name
        FROM announcements a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN teachers tp ON (tp.id = a.teacher_id OR (tp.user_id = u.id AND a.teacher_id IS NULL))
        LEFT JOIN admins ap ON ap.user_id = u.id
        LEFT JOIN learning_centers lc ON lc.id = a.learning_center_id
        LEFT JOIN learners tgt_l ON tgt_l.id = a.target_learner_id
        ORDER BY a.id DESC
        LIMIT 1
      `);

      return res.status(201).json(formatAnnouncement(inserted));
    }

    // ==========================================
    // ADMIN ANNOUNCEMENT VALIDATIONS
    // ==========================================
    const normAdminAudience = String(audience || '').toUpperCase().includes('TEACHER')
      ? 'ALL_TEACHERS'
      : 'ALL_LEARNERS';

    const centerId = learningCenterId || learning_center_id
      ? parseInt(learningCenterId || learning_center_id, 10)
      : null;

    const rawDate = datePosted || date || createdAt;
    const postDate = rawDate ? new Date(rawDate) : null;
    const validDate = postDate && !isNaN(postDate.getTime()) ? postDate : null;
    const meta = inferAnnouncementMeta(req.body);
    const dbStatus = normalizeStatusInput(status);

    if (validDate) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO announcements 
          (title, content, audience, status, is_pinned, is_important, priority, category, deadline_at, author_id, creator_role, teacher_id, learning_center_id, program_level, target_learner_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ADMIN', NULL, ?, NULL, NULL, ?, NOW())`,
        title.trim(),
        bodyContent,
        normAdminAudience,
        dbStatus,
        meta.isPinned,
        meta.isImportant,
        meta.priority,
        meta.category,
        meta.deadlineAt,
        authorUserId,
        centerId || null,
        validDate
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO announcements 
          (title, content, audience, status, is_pinned, is_important, priority, category, deadline_at, author_id, creator_role, teacher_id, learning_center_id, program_level, target_learner_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ADMIN', NULL, ?, NULL, NULL, NOW(), NOW())`,
        title.trim(),
        bodyContent,
        normAdminAudience,
        dbStatus,
        meta.isPinned,
        meta.isImportant,
        meta.priority,
        meta.category,
        meta.deadlineAt,
        authorUserId,
        centerId || null
      );
    }

    const [inserted] = await prisma.$queryRawUnsafe(`
      SELECT 
        a.id, a.title, a.content, a.audience, a.status, a.is_pinned,
        a.is_important, a.priority, a.category, a.deadline_at,
        a.author_id, a.creator_role, a.teacher_id, a.learning_center_id, a.program_level, a.target_learner_id,
        a.created_at, a.updated_at,
        u.username, u.role,
        tp.full_name as teacher_name,
        ap.full_name as admin_name,
        lc.name as learning_center_name,
        tgt_l.full_name as target_learner_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN teachers tp ON (tp.id = a.teacher_id OR (tp.user_id = u.id AND a.teacher_id IS NULL))
      LEFT JOIN admins ap ON ap.user_id = u.id
      LEFT JOIN learning_centers lc ON lc.id = a.learning_center_id
      LEFT JOIN learners tgt_l ON tgt_l.id = a.target_learner_id
      ORDER BY a.id DESC
      LIMIT 1
    `);

    res.status(201).json(formatAnnouncement(inserted));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// PUT /api/announcements/:id
// Update announcement
// ---------------------
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid announcement ID' });
    }

    const [existing] = await prisma.$queryRawUnsafe(
      'SELECT id, title, content, audience, status, is_pinned, is_important, priority, category, deadline_at, creator_role, learning_center_id, program_level, target_learner_id, teacher_id FROM announcements WHERE id = ?',
      id
    );

    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const {
      title,
      content,
      message,
      audience,
      status,
      learningCenterId,
      learning_center_id,
      programLevel,
      program_level,
      targetLearnerId,
      target_learner_id,
      teacherId,
      teacher_id,
      datePosted,
      date,
      createdAt,
    } = req.body;

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const bodyContent = content !== undefined || message !== undefined
      ? (content || message || '').trim()
      : existing.content;

    const newTargetLearnerId = targetLearnerId !== undefined || target_learner_id !== undefined
      ? (targetLearnerId || target_learner_id ? parseInt(targetLearnerId || target_learner_id, 10) : null)
      : existing.target_learner_id;

    const newCenterId = learningCenterId !== undefined || learning_center_id !== undefined
      ? (learningCenterId || learning_center_id ? parseInt(learningCenterId || learning_center_id, 10) : null)
      : existing.learning_center_id;

    const newTeacherId = teacherId !== undefined || teacher_id !== undefined
      ? (teacherId || teacher_id ? parseInt(teacherId || teacher_id, 10) : null)
      : existing.teacher_id;

    const newProgramLevel = programLevel !== undefined || program_level !== undefined
      ? normalizeProgramLevel(programLevel || program_level)
      : existing.program_level;

    const newAudience = audience !== undefined
      ? normalizeAudienceInput(audience, newTargetLearnerId)
      : existing.audience;

    const newStatus = status !== undefined
      ? normalizeStatusInput(status)
      : existing.status;

    const rawDate = datePosted || date || createdAt;
    const postDate = rawDate ? new Date(rawDate) : null;
    const validDate = postDate && !isNaN(postDate.getTime()) ? postDate : null;
    const meta = inferAnnouncementMeta({ ...req.body, title: newTitle, content: bodyContent }, existing);

    if (validDate) {
      await prisma.$executeRawUnsafe(
        `UPDATE announcements 
         SET title = ?, content = ?, audience = ?, status = ?, 
             is_pinned = ?, is_important = ?, priority = ?, category = ?, deadline_at = ?,
             learning_center_id = ?, program_level = ?, target_learner_id = ?, teacher_id = ?,
             created_at = ?, updated_at = NOW()
         WHERE id = ?`,
        newTitle,
        bodyContent,
        newAudience,
        newStatus,
        meta.isPinned,
        meta.isImportant,
        meta.priority,
        meta.category,
        meta.deadlineAt,
        newCenterId,
        newProgramLevel,
        newTargetLearnerId,
        newTeacherId,
        validDate,
        id
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE announcements 
         SET title = ?, content = ?, audience = ?, status = ?,
             is_pinned = ?, is_important = ?, priority = ?, category = ?, deadline_at = ?,
             learning_center_id = ?, program_level = ?, target_learner_id = ?, teacher_id = ?,
             updated_at = NOW()
         WHERE id = ?`,
        newTitle,
        bodyContent,
        newAudience,
        newStatus,
        meta.isPinned,
        meta.isImportant,
        meta.priority,
        meta.category,
        meta.deadlineAt,
        newCenterId,
        newProgramLevel,
        newTargetLearnerId,
        newTeacherId,
        id
      );
    }

    await prisma.$executeRawUnsafe(
      'DELETE FROM notification_reads WHERE notification_key = ?',
      `announcement:${id}`
    );

    const [updated] = await prisma.$queryRawUnsafe(`
      SELECT 
        a.id, a.title, a.content, a.audience, a.status, a.is_pinned,
        a.is_important, a.priority, a.category, a.deadline_at,
        a.author_id, a.creator_role, a.teacher_id, a.learning_center_id, a.program_level, a.target_learner_id,
        a.created_at, a.updated_at,
        u.username, u.role,
        tp.full_name as teacher_name,
        ap.full_name as admin_name,
        lc.name as learning_center_name,
        tgt_l.full_name as target_learner_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN teachers tp ON (tp.id = a.teacher_id OR (tp.user_id = u.id AND a.teacher_id IS NULL))
      LEFT JOIN admins ap ON ap.user_id = u.id
      LEFT JOIN learning_centers lc ON lc.id = a.learning_center_id
      LEFT JOIN learners tgt_l ON tgt_l.id = a.target_learner_id
      WHERE a.id = ?
    `, id);

    res.json(formatAnnouncement(updated));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// DELETE /api/announcements/:id
// Delete announcement
// ---------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid announcement ID' });
    }

    const [existing] = await prisma.$queryRawUnsafe(
      'SELECT id FROM announcements WHERE id = ?',
      id
    );

    if (!existing) {
      // Idempotent DELETE: Record is already removed from DB
      return res.status(200).json({ success: true, message: 'Announcement deleted or already removed', id });
    }

    await prisma.$executeRawUnsafe('DELETE FROM announcements WHERE id = ?', id);

    res.status(200).json({ success: true, message: 'Announcement deleted successfully', id });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ error: err.message || 'Failed to delete announcement' });
  }
});

export default router;

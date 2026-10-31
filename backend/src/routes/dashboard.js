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
 * Determine DepEd School Year (e.g., "2026-2027") from a Date object.
 * DepEd School Year starts in June (month index 5) and ends in May (month index 4).
 */
function getSchoolYearForDate(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan ... 5 = Jun ... 11 = Dec
  if (month >= 5) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Normalize learner sex/gender string into 'Male' or 'Female'
 */
function normalizeSex(gender) {
  const raw = String(gender || '').trim().toUpperCase();
  if (raw === 'FEMALE' || raw === 'F') {
    return 'Female';
  }
  return 'Male';
}

/**
 * Return local YYYY-MM-DD date string for comparing upcoming schedules
 */
function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Normalize Date or string to YYYY-MM-DD key
 */
function toDateKey(dateInput) {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Format 24-hour time string ("08:00" or "13:30") into 12-hour format ("8:00 AM")
 */
function formatTime12h(time24) {
  if (!time24 || typeof time24 !== 'string') return '';
  const parts = time24.trim().split(':');
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return time24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${suffix}`;
}

/**
 * Format start and end time range ("8:00 AM – 12:00 PM")
 */
function formatTimeRange(startTime, endTime) {
  const start = formatTime12h(startTime);
  const end = formatTime12h(endTime);
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  return 'Time TBD';
}

/**
 * Format a YYYY-MM-DD or Date into "Oct 30, 2026"
 */
function formatDateDisplay(dateInput) {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [y, m, d] = dateInput.trim().split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    if (!isNaN(localDate.getTime())) {
      return localDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
  const dt = new Date(dateInput);
  if (isNaN(dt.getTime())) return String(dateInput);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a Date/timestamp into "Oct 29, 2026 • 10:15 AM"
 */
function formatDateTimeDisplay(dateInput) {
  if (!dateInput) return '';
  const dt = new Date(dateInput);
  if (isNaN(dt.getTime())) return String(dateInput);
  const datePart = dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = dt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} • ${timePart}`;
}

/**
 * Resolve ALS level label for a schedule strictly using 'A&E Elementary' and 'A&E Junior High'
 */
function resolveScheduleAlsLevel(schedule) {
  const combinedText = `${schedule?.title || ''} ${schedule?.description || ''}`.toUpperCase();
  const hasElem = combinedText.includes('ELEM');
  const hasJhs = combinedText.includes('JUNIOR') || combinedText.includes('JHS');
  if (hasElem && !hasJhs) return 'A&E Elementary';
  if (hasJhs && !hasElem) return 'A&E Junior High';

  const teacherSpec = String(schedule?.teacher?.specialization || '').trim();
  if (teacherSpec && !teacherSpec.toLowerCase().includes('both')) {
    return formatAlsLevelName(teacherSpec);
  }
  return 'A&E Elementary / A&E Junior High';
}

// -------------------------------------------------------------
// GET /api/dashboard/admin
// Comprehensive administrative dashboard metrics for Naawan District
// Supports filters: schoolYear, level, learningCenterId
// -------------------------------------------------------------
router.get('/admin', async (req, res, next) => {
  try {
    const {
      schoolYear = '',
      level = '',
      learningCenterId = '',
    } = req.query;

    // 1. Fetch live database records in parallel
    const [
      allLearningCenters,
      allTeachers,
      allLearnersRaw,
      allModules,
      allAttendanceRecords,
      announcements,
      allSchedules,
    ] = await Promise.all([
      prisma.learningCenter.findMany({
        include: {
          teachers: {
            select: { id: true, fullName: true, position: true },
          },
          learners: {
            select: { id: true, fullName: true, level: true },
          },
          attendanceLogs: {
            select: { id: true, status: true, sessionDate: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.teacher.findMany({
        select: {
          id: true,
          fullName: true,
          position: true,
          learningCenterId: true,
          createdAt: true,
          updatedAt: true,
          learningCenter: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.learner.findMany({
        include: {
          learningCenter: { select: { id: true, name: true } },
          assignedModules: {
            select: { id: true, moduleId: true, assignedAt: true, dueDate: true },
          },
          progressRecords: {
            select: {
              id: true,
              moduleId: true,
              status: true,
              completedPages: true,
              totalPages: true,
              preTestScore: true,
              postTestScore: true,
              masteryStatus: true,
              completedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          attempts: {
            select: {
              id: true,
              assessmentId: true,
              score: true,
              maxScore: true,
              percentage: true,
              isPassed: true,
              status: true,
              startedAt: true,
              submittedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.module.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          teacher: { select: { id: true, fullName: true } },
          learningCenter: { select: { id: true, name: true } },
          assignments: { select: { learnerId: true, dueDate: true } },
          assessments: { select: { id: true, type: true } },
        },
      }),
      prisma.attendance.findMany({
        include: {
          learner: { select: { id: true, fullName: true, level: true, learningCenterId: true } },
          learningCenter: { select: { id: true, name: true } },
          recordedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { sessionDate: 'desc' },
      }),
      prisma.announcement
        .findMany({
          where: { status: 'PUBLISHED' },
          orderBy: [{ createdAt: 'desc' }],
          take: 25,
          include: {
            author: {
              select: {
                username: true,
                role: true,
                adminProfile: { select: { fullName: true } },
                teacherProfile: { select: { fullName: true } },
              },
            },
          },
        })
        .catch((err) => {
          console.error('Admin dashboard announcements query warning:', err.message);
          return [];
        }),
      prisma.schedule
        .findMany({
          include: {
            learningCenter: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, fullName: true, specialization: true } },
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        })
        .catch((err) => {
          console.error('Admin dashboard schedules query warning:', err.message);
          return [];
        }),
    ]);

    // 2. Deduplicate learners by unique ID to prevent duplicate counts
    const uniqueLearnersMap = new Map();
    for (const l of allLearnersRaw) {
      if (l && l.id && !uniqueLearnersMap.has(l.id)) {
        uniqueLearnersMap.set(l.id, l);
      }
    }
    const allLearners = Array.from(uniqueLearnersMap.values());

    // 3. Collect available School Years from actual records + current/previous school year
    const schoolYearSet = new Set();
    const currentSy = getSchoolYearForDate(new Date());
    if (currentSy) {
      schoolYearSet.add(currentSy);
      const startYr = parseInt(currentSy.split('-')[0], 10);
      if (!isNaN(startYr)) {
        schoolYearSet.add(`${startYr - 1}-${startYr}`);
      }
    }

    for (const l of allLearners) {
      const sy = getSchoolYearForDate(l.dateRegistered || l.createdAt);
      if (sy) schoolYearSet.add(sy);
      for (const p of l.progressRecords || []) {
        const psy = getSchoolYearForDate(p.completedAt || p.updatedAt || p.createdAt);
        if (psy) schoolYearSet.add(psy);
      }
    }
    for (const att of allAttendanceRecords) {
      const sy = getSchoolYearForDate(att.sessionDate || att.createdAt);
      if (sy) schoolYearSet.add(sy);
    }
    for (const m of allModules) {
      const sy = getSchoolYearForDate(m.dateStarted || m.createdAt);
      if (sy) schoolYearSet.add(sy);
    }

    const availableSchoolYears = Array.from(schoolYearSet).sort((a, b) => b.localeCompare(a));

    // 4. Parse incoming filters
    const trimmedSy = String(schoolYear || '').trim();
    const trimmedLevel = String(level || '').trim();
    const trimmedCenter = String(learningCenterId || '').trim();

    let parsedCenterId = null;
    if (trimmedCenter && trimmedCenter !== 'ALL') {
      const numId = parseInt(trimmedCenter, 10);
      if (!isNaN(numId)) {
        parsedCenterId = numId;
      } else {
        const matchedCenter = allLearningCenters.find(
          (c) => c.name.toLowerCase() === trimmedCenter.toLowerCase()
        );
        if (matchedCenter) parsedCenterId = matchedCenter.id;
      }
    }

    let parsedLevelKey = null;
    if (trimmedLevel && trimmedLevel !== 'ALL') {
      const upper = trimmedLevel.toUpperCase();
      if (upper.includes('ELEM')) {
        parsedLevelKey = 'ELEMENTARY';
      } else if (upper.includes('JUN') || upper.includes('HIGH')) {
        parsedLevelKey = 'JUNIOR';
      }
    }

    // Build sets of learner IDs that have attendance or module progress in the selected school year
    const learnersActiveInSy = new Set();
    if (trimmedSy) {
      for (const att of allAttendanceRecords) {
        if (getSchoolYearForDate(att.sessionDate || att.createdAt) === trimmedSy && att.learnerId) {
          learnersActiveInSy.add(att.learnerId);
        }
      }
      for (const l of allLearners) {
        for (const p of l.progressRecords || []) {
          if (getSchoolYearForDate(p.completedAt || p.updatedAt || p.createdAt) === trimmedSy) {
            learnersActiveInSy.add(l.id);
          }
        }
      }
    }

    // 5. Filter Learning Centers, Teachers, Learners, and Attendance Records
    const learningCenters = parsedCenterId
      ? allLearningCenters.filter((c) => c.id === parsedCenterId)
      : allLearningCenters;

    const teachers = allTeachers.filter((t) => {
      if (parsedCenterId && t.learningCenterId !== parsedCenterId) return false;
      return true;
    });

    const learners = allLearners.filter((l) => {
      if (parsedCenterId && l.learningCenterId !== parsedCenterId) return false;
      if (parsedLevelKey && normalizeLevelKey(l.level) !== parsedLevelKey) return false;
      if (trimmedSy) {
        const regSy = getSchoolYearForDate(l.dateRegistered || l.createdAt);
        if (regSy !== trimmedSy && !learnersActiveInSy.has(l.id)) {
          return false;
        }
      }
      return true;
    });

    const filteredLearnerIds = new Set(learners.map((l) => l.id));

    const attendanceRecords = allAttendanceRecords.filter((rec) => {
      if (parsedCenterId) {
        const recCenterId = rec.learningCenterId || rec.learner?.learningCenterId;
        if (recCenterId !== parsedCenterId) return false;
      }
      if (parsedLevelKey) {
        const recLevel = normalizeLevelKey(rec.learner?.level);
        if (recLevel !== parsedLevelKey) return false;
      }
      if (trimmedSy) {
        const attSy = getSchoolYearForDate(rec.sessionDate || rec.createdAt);
        if (attSy !== trimmedSy) return false;
      }
      // If learner still exists, ensure it's in scope when learner filters apply
      if (rec.learnerId && uniqueLearnersMap.has(rec.learnerId) && !filteredLearnerIds.has(rec.learnerId)) {
        return false;
      }
      return true;
    });

    // ==========================================
    // SECTION 1: SUMMARY CARDS
    // ==========================================
    const totalLearningCenters = learningCenters.length;
    const totalTeachers = teachers.length;
    const totalLearners = learners.length;

    const totalAttendanceCount = attendanceRecords.length;
    const totalPresentCount = attendanceRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;

    const averageAttendanceRate =
      totalAttendanceCount > 0
        ? Math.round((totalPresentCount / totalAttendanceCount) * 100)
        : 0;

    // ==========================================
    // SECTION 2 (LEFT): LEARNERS BY ALS LEVEL
    // ==========================================
    let elementaryCount = 0;
    let juniorCount = 0;

    // ==========================================
    // SECTION 2 (RIGHT): SEX DISTRIBUTION BY ALS LEVEL
    // ==========================================
    let elemMale = 0;
    let elemFemale = 0;
    let jhsMale = 0;
    let jhsFemale = 0;

    for (const l of learners) {
      const lvlKey = normalizeLevelKey(l.level);
      const sex = normalizeSex(l.gender);
      if (lvlKey === 'ELEMENTARY') {
        elementaryCount++;
        if (sex === 'Female') elemFemale++;
        else elemMale++;
      } else {
        juniorCount++;
        if (sex === 'Female') jhsFemale++;
        else jhsMale++;
      }
    }

    const elementaryPct = totalLearners > 0 ? Math.round((elementaryCount / totalLearners) * 100) : 0;
    const juniorPct = totalLearners > 0 ? Math.round((juniorCount / totalLearners) * 100) : 0;

    const learnerDistribution = {
      total: totalLearners,
      elementary: elementaryCount,
      junior: juniorCount,
      juniorHigh: juniorCount,
      elementaryPct,
      juniorPct,
      juniorHighPct: juniorPct,
      bars: [
        {
          key: 'elementary',
          label: 'A&E Elementary',
          count: elementaryCount,
          percentage: elementaryPct,
        },
        {
          key: 'juniorHigh',
          label: 'A&E Junior High',
          count: juniorCount,
          percentage: juniorPct,
        },
      ],
    };

    const sexDistributionByLevel = {
      totalLearners,
      totalMale: elemMale + jhsMale,
      totalFemale: elemFemale + jhsFemale,
      elementary: {
        label: 'A&E Elementary',
        male: elemMale,
        female: elemFemale,
        total: elemMale + elemFemale,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        male: jhsMale,
        female: jhsFemale,
        total: jhsMale + jhsFemale,
      },
      groups: [
        {
          key: 'elementary',
          label: 'A&E Elementary',
          male: elemMale,
          female: elemFemale,
          total: elemMale + elemFemale,
        },
        {
          key: 'juniorHigh',
          label: 'A&E Junior High',
          male: jhsMale,
          female: jhsFemale,
          total: jhsMale + jhsFemale,
        },
      ],
    };

    // ==========================================
    // SECTION 3 (LEFT): MODULE COMPLETION BY ALS LEVEL
    // & SECTION 3 (RIGHT): LEARNER PROGRESS BY ALS LEVEL
    // ==========================================
    // Map modules by ID for fast lookup
    const moduleById = new Map(allModules.map((m) => [m.id, m]));

    const moduleStats = {
      ELEMENTARY: {
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        learnersCount: 0,
        learnerProgressSum: 0,
        assignedModulesCount: 0,
        completedModulesCount: 0,
        inProgressModulesCount: 0,
        notStartedModulesCount: 0,
      },
      JUNIOR: {
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        learnersCount: 0,
        learnerProgressSum: 0,
        assignedModulesCount: 0,
        completedModulesCount: 0,
        inProgressModulesCount: 0,
        notStartedModulesCount: 0,
      },
    };

    for (const learner of learners) {
      const lvlKey = normalizeLevelKey(learner.level);
      const bucket = moduleStats[lvlKey];
      bucket.learnersCount++;

      // Determine all modules assigned/applicable to this learner (deduplicated by moduleId)
      const assignedModuleIds = new Set();

      // 1. Explicit module assignments
      if (Array.isArray(learner.assignedModules)) {
        for (const assign of learner.assignedModules) {
          if (assign.moduleId) {
            assignedModuleIds.add(assign.moduleId);
          }
        }
      }

      // 2. Existing learner progress records
      const progressByModule = new Map();
      if (Array.isArray(learner.progressRecords)) {
        for (const prog of learner.progressRecords) {
          if (trimmedSy) {
            const progSy = getSchoolYearForDate(prog.completedAt || prog.updatedAt || prog.createdAt);
            if (progSy && progSy !== trimmedSy) continue;
          }
          if (prog.moduleId) {
            assignedModuleIds.add(prog.moduleId);
            progressByModule.set(prog.moduleId, prog);
          }
        }
      }

      // 3. Published modules targeting the learner's ALS level and Learning Center
      for (const mod of allModules) {
        if (normalizeLevelKey(mod.targetLevel) !== lvlKey) continue;
        if (mod.learningCenterId && learner.learningCenterId && mod.learningCenterId !== learner.learningCenterId) {
          continue;
        }
        if (trimmedSy) {
          const modSy = getSchoolYearForDate(mod.dateStarted || mod.createdAt);
          if (modSy && modSy !== trimmedSy && !progressByModule.has(mod.id)) {
            continue;
          }
        }
        const modAssignments = Array.isArray(mod.assignments) ? mod.assignments : [];
        const isAssignedToAll = modAssignments.length === 0;
        const isExplicitlyAssigned = modAssignments.some((a) => a.learnerId === learner.id);
        if (isAssignedToAll || isExplicitlyAssigned) {
          assignedModuleIds.add(mod.id);
        }
      }

      // Map learner's assessment attempts by assessmentId
      const attemptsByAssessment = new Map();
      if (Array.isArray(learner.attempts)) {
        for (const att of learner.attempts) {
          const prev = attemptsByAssessment.get(att.assessmentId);
          if (!prev || Number(att.score) > Number(prev.score) || att.isPassed) {
            attemptsByAssessment.set(att.assessmentId, att);
          }
        }
      }

      let learnerModProgressSum = 0;
      let learnerCompletedMods = 0;
      let learnerInProgressMods = 0;
      let learnerNotStartedMods = 0;
      const learnerModCount = assignedModuleIds.size;

      for (const modId of assignedModuleIds) {
        const prog = progressByModule.get(modId);
        const mod = moduleById.get(modId);

        const preAss = mod?.assessments?.find((a) => a.type === 'PRE_TEST');
        const postAss = mod?.assessments?.find((a) => a.type === 'POST_TEST');
        const preAtt = preAss ? attemptsByAssessment.get(preAss.id) : null;
        const postAtt = postAss ? attemptsByAssessment.get(postAss.id) : null;

        const isCompleted =
          prog?.status === 'COMPLETED' ||
          prog?.masteryStatus === 'MASTERED' ||
          Boolean(postAtt?.isPassed);

        const isInProgress =
          !isCompleted &&
          (prog?.status === 'IN_PROGRESS' ||
            prog?.masteryStatus === 'NOT_MASTERED' ||
            prog?.preTestScore != null ||
            prog?.postTestScore != null ||
            (prog?.completedPages || 0) > 0 ||
            Boolean(preAtt) ||
            Boolean(postAtt));

        bucket.assignedModulesCount++;
        if (isCompleted) {
          learnerCompletedMods++;
          bucket.completedModulesCount++;
        } else if (isInProgress) {
          learnerInProgressMods++;
          bucket.inProgressModulesCount++;
        } else {
          learnerNotStartedMods++;
          bucket.notStartedModulesCount++;
        }

        // Calculate module percentage for this learner-module record
        let modPct = 0;
        if (isCompleted) {
          modPct = 100;
        } else if (isInProgress) {
          if (prog && prog.totalPages > 0 && prog.completedPages > 0) {
            modPct = Math.min(99, Math.max(10, Math.round((prog.completedPages / prog.totalPages) * 100)));
          } else {
            modPct = 50;
          }
        }
        learnerModProgressSum += modPct;
      }

      // Classify learner strictly once into Completed, In Progress, or Not Started
      if (learnerModCount > 0 && learnerCompletedMods === learnerModCount) {
        bucket.completed++;
      } else if (learnerCompletedMods > 0 || learnerInProgressMods > 0) {
        bucket.inProgress++;
      } else {
        bucket.notStarted++;
      }

      const learnerAvgProgress = learnerModCount > 0 ? learnerModProgressSum / learnerModCount : 0;
      bucket.learnerProgressSum += learnerAvgProgress;
    }

    const moduleCompletionByLevel = {
      unit: 'Learners',
      totalLearners,
      totalCompleted: moduleStats.ELEMENTARY.completed + moduleStats.JUNIOR.completed,
      totalInProgress: moduleStats.ELEMENTARY.inProgress + moduleStats.JUNIOR.inProgress,
      totalNotStarted: moduleStats.ELEMENTARY.notStarted + moduleStats.JUNIOR.notStarted,
      elementary: {
        label: 'A&E Elementary',
        completed: moduleStats.ELEMENTARY.completed,
        inProgress: moduleStats.ELEMENTARY.inProgress,
        notStarted: moduleStats.ELEMENTARY.notStarted,
        total: moduleStats.ELEMENTARY.learnersCount,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        completed: moduleStats.JUNIOR.completed,
        inProgress: moduleStats.JUNIOR.inProgress,
        notStarted: moduleStats.JUNIOR.notStarted,
        total: moduleStats.JUNIOR.learnersCount,
      },
      groups: [
        {
          key: 'elementary',
          label: 'A&E Elementary',
          completed: moduleStats.ELEMENTARY.completed,
          inProgress: moduleStats.ELEMENTARY.inProgress,
          notStarted: moduleStats.ELEMENTARY.notStarted,
          total: moduleStats.ELEMENTARY.learnersCount,
        },
        {
          key: 'juniorHigh',
          label: 'A&E Junior High',
          completed: moduleStats.JUNIOR.completed,
          inProgress: moduleStats.JUNIOR.inProgress,
          notStarted: moduleStats.JUNIOR.notStarted,
          total: moduleStats.JUNIOR.learnersCount,
        },
      ],
    };

    const elemAvgProgress =
      moduleStats.ELEMENTARY.learnersCount > 0
        ? Math.round(moduleStats.ELEMENTARY.learnerProgressSum / moduleStats.ELEMENTARY.learnersCount)
        : 0;

    const jhsAvgProgress =
      moduleStats.JUNIOR.learnersCount > 0
        ? Math.round(moduleStats.JUNIOR.learnerProgressSum / moduleStats.JUNIOR.learnersCount)
        : 0;

    const learnerProgressByLevel = {
      hasData: totalLearners > 0,
      elementary: {
        label: 'A&E Elementary',
        averageProgress: elemAvgProgress,
        learnersCount: moduleStats.ELEMENTARY.learnersCount,
        completedLearnersCount: moduleStats.ELEMENTARY.completed,
        inProgressLearnersCount: moduleStats.ELEMENTARY.inProgress,
        notStartedLearnersCount: moduleStats.ELEMENTARY.notStarted,
        assignedModulesCount: moduleStats.ELEMENTARY.assignedModulesCount,
        completedModulesCount: moduleStats.ELEMENTARY.completedModulesCount,
        inProgressModulesCount: moduleStats.ELEMENTARY.inProgressModulesCount,
        notStartedModulesCount: moduleStats.ELEMENTARY.notStartedModulesCount,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        averageProgress: jhsAvgProgress,
        learnersCount: moduleStats.JUNIOR.learnersCount,
        completedLearnersCount: moduleStats.JUNIOR.completed,
        inProgressLearnersCount: moduleStats.JUNIOR.inProgress,
        notStartedLearnersCount: moduleStats.JUNIOR.notStarted,
        assignedModulesCount: moduleStats.JUNIOR.assignedModulesCount,
        completedModulesCount: moduleStats.JUNIOR.completedModulesCount,
        inProgressModulesCount: moduleStats.JUNIOR.inProgressModulesCount,
        notStartedModulesCount: moduleStats.JUNIOR.notStartedModulesCount,
      },
      levels: [
        {
          key: 'elementary',
          label: 'A&E Elementary',
          subtitle: 'Average Learner Progress',
          percentage: elemAvgProgress,
          learnersCount: moduleStats.ELEMENTARY.learnersCount,
          completedLearnersCount: moduleStats.ELEMENTARY.completed,
          inProgressLearnersCount: moduleStats.ELEMENTARY.inProgress,
          notStartedLearnersCount: moduleStats.ELEMENTARY.notStarted,
          assignedModulesCount: moduleStats.ELEMENTARY.assignedModulesCount,
        },
        {
          key: 'juniorHigh',
          label: 'A&E Junior High',
          subtitle: 'Average Learner Progress',
          percentage: jhsAvgProgress,
          learnersCount: moduleStats.JUNIOR.learnersCount,
          completedLearnersCount: moduleStats.JUNIOR.completed,
          inProgressLearnersCount: moduleStats.JUNIOR.inProgress,
          notStartedLearnersCount: moduleStats.JUNIOR.notStarted,
          assignedModulesCount: moduleStats.JUNIOR.assignedModulesCount,
        },
      ],
    };

    // ==========================================
    // SECTION 4: MONTHLY ATTENDANCE TREND (BY ALS LEVEL)
    // ==========================================
    const monthBuckets = new Map();

    function ensureMonthBucket(year, monthIndex) {
      const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      if (!monthBuckets.has(key)) {
        const dateObj = new Date(year, monthIndex, 1);
        const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthBuckets.set(key, {
          key,
          label: monthLabel,
          timestamp: dateObj.getTime(),
          present: 0,
          absent: 0,
          total: 0,
          sessionDates: new Set(),
          elemPresent: 0,
          elemAbsent: 0,
          elemTotal: 0,
          elemSessions: new Set(),
          jhsPresent: 0,
          jhsAbsent: 0,
          jhsTotal: 0,
          jhsSessions: new Set(),
        });
      }
      return monthBuckets.get(key);
    }

    for (const rec of attendanceRecords) {
      const d = rec.sessionDate ? new Date(rec.sessionDate) : new Date(rec.createdAt);
      if (isNaN(d.getTime())) continue;
      const bucket = ensureMonthBucket(d.getFullYear(), d.getMonth());
      const dateStr = d.toISOString().split('T')[0];
      const isPresent = rec.status === 'PRESENT' || rec.status === 'LATE';
      const isAbsent = rec.status === 'ABSENT';
      const lvlKey = normalizeLevelKey(rec.learner?.level);

      bucket.total++;
      bucket.sessionDates.add(dateStr);
      if (isPresent) bucket.present++;
      else if (isAbsent) bucket.absent++;

      if (lvlKey === 'ELEMENTARY') {
        bucket.elemTotal++;
        bucket.elemSessions.add(dateStr);
        if (isPresent) bucket.elemPresent++;
        else if (isAbsent) bucket.elemAbsent++;
      } else {
        bucket.jhsTotal++;
        bucket.jhsSessions.add(dateStr);
        if (isPresent) bucket.jhsPresent++;
        else if (isAbsent) bucket.jhsAbsent++;
      }
    }

    // Fill intermediate months in the active timeline window so months without sessions are handled cleanly
    if (monthBuckets.size > 0) {
      const sortedExisting = Array.from(monthBuckets.values()).sort((a, b) => a.timestamp - b.timestamp);
      const latestDate = new Date(sortedExisting[sortedExisting.length - 1].timestamp);
      let earliestDate = new Date(sortedExisting[0].timestamp);

      // Ensure at least a 5-month window up to latest session (e.g. Jun–Oct) so the line chart has a clear multi-month axis
      const minWindowStart = new Date(latestDate.getFullYear(), latestDate.getMonth() - 4, 1);
      if (earliestDate > minWindowStart) {
        earliestDate = minWindowStart;
      }

      const cursor = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
      while (cursor <= latestDate) {
        ensureMonthBucket(cursor.getFullYear(), cursor.getMonth());
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    const monthlyAttendance = Array.from(monthBuckets.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((b) => {
        const elemHasRecords = b.elemTotal > 0;
        const jhsHasRecords = b.jhsTotal > 0;
        const elemRate = elemHasRecords ? Math.round((b.elemPresent / b.elemTotal) * 100) : 0;
        const jhsRate = jhsHasRecords ? Math.round((b.jhsPresent / b.jhsTotal) * 100) : 0;

        return {
          month: b.label,
          key: b.key,
          hasRecords: b.total > 0,
          sessionsCount: b.sessionDates.size,
          presentRecords: b.present,
          absentRecords: b.absent,
          totalRecords: b.total,
          attendancePercentage: b.total > 0 ? Math.round((b.present / b.total) * 100) : 0,
          elementary: {
            label: 'A&E Elementary',
            hasRecords: elemHasRecords,
            sessionsCount: b.elemSessions.size,
            presentRecords: b.elemPresent,
            absentRecords: b.elemAbsent,
            totalRecords: b.elemTotal,
            attendancePercentage: elemRate,
          },
          juniorHigh: {
            label: 'A&E Junior High',
            hasRecords: jhsHasRecords,
            sessionsCount: b.jhsSessions.size,
            presentRecords: b.jhsPresent,
            absentRecords: b.jhsAbsent,
            totalRecords: b.jhsTotal,
            attendancePercentage: jhsRate,
          },
        };
      });

    const elemAttRecords = attendanceRecords.filter(
      (r) => normalizeLevelKey(r.learner?.level) === 'ELEMENTARY'
    );
    const elemAttPresent = elemAttRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const elemOverallRate =
      elemAttRecords.length > 0 ? Math.round((elemAttPresent / elemAttRecords.length) * 100) : 0;

    const jhsAttRecords = attendanceRecords.filter(
      (r) => normalizeLevelKey(r.learner?.level) === 'JUNIOR'
    );
    const jhsAttPresent = jhsAttRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const jhsOverallRate =
      jhsAttRecords.length > 0 ? Math.round((jhsAttPresent / jhsAttRecords.length) * 100) : 0;

    const distinctSessionsTotal = new Set(
      attendanceRecords
        .map((r) => (r.sessionDate ? new Date(r.sessionDate).toISOString().split('T')[0] : null))
        .filter(Boolean)
    ).size;

    const attendanceTrend = {
      hasData: attendanceRecords.length > 0,
      totalRecords: totalAttendanceCount,
      totalSessions: distinctSessionsTotal,
      presentRecords: totalPresentCount,
      absentRecords: attendanceRecords.filter((r) => r.status === 'ABSENT').length,
      averageRate: averageAttendanceRate,
      elementaryRate: elemOverallRate,
      elementaryHasRecords: elemAttRecords.length > 0,
      juniorHighRate: jhsOverallRate,
      juniorHighHasRecords: jhsAttRecords.length > 0,
      monthly: monthlyAttendance,
    };

    // ==========================================
    // COMMUNITY LEARNING CENTER OVERVIEW
    // ==========================================
    const clcOverview = learningCenters.map((clc) => {
      const assignedTeachers = clc.teachers.map((t) => t.fullName).filter(Boolean);
      const uniqueCenterLearners = new Set((clc.learners || []).map((l) => l.id).filter(Boolean));
      const clcTotalLearners = uniqueCenterLearners.size;
      const clcAttendanceRecords = clc.attendanceLogs || [];
      const clcTotalAtt = clcAttendanceRecords.length;
      const clcPresent = clcAttendanceRecords.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const clcRate = clcTotalAtt > 0 ? Math.round((clcPresent / clcTotalAtt) * 100) : null;

      return {
        id: clc.id,
        name: clc.name,
        code: clc.code || '',
        assignedTeachers: assignedTeachers.length > 0 ? assignedTeachers.join(', ') : 'Unassigned',
        totalLearners: clcTotalLearners,
        attendanceRate: clcRate !== null ? `${clcRate}%` : (clcTotalAtt === 0 ? 'No attendance' : '0%'),
        attendanceRateNum: clcRate,
        hasAttendance: clcTotalAtt > 0,
        status: clc.status ? (clc.status.charAt(0).toUpperCase() + clc.status.slice(1)) : 'Active',
      };
    });

    // ==========================================
    // LATEST ANNOUNCEMENTS (Admin-created only, top 3)
    // ==========================================
    const centerByIdMap = new Map(allLearningCenters.map((c) => [c.id, c]));

    const adminCreatedAnnouncements = (Array.isArray(announcements) ? announcements : [])
      .filter((a) => {
        const cRole = String(a.creatorRole || a.author?.role || 'ADMIN').toUpperCase();
        return cRole === 'ADMIN';
      })
      .slice(0, 3)
      .map((a) => {
        const authorName =
          a.author?.adminProfile?.fullName ||
          a.author?.username ||
          'ALS District Coordinator';

        let recipientLabel = 'All Teachers & Learners';
        if (a.audience === 'ALL_TEACHERS' || a.audience === 'TEACHERS') {
          recipientLabel = 'All Teachers';
        } else if (a.audience === 'ALL_LEARNERS' || a.audience === 'LEARNERS') {
          recipientLabel = 'All Learners';
        } else if (a.audience === 'SPECIFIC_LEARNER' || a.audience === 'INDIVIDUAL_LEARNER') {
          const targetLearnerObj = a.targetLearnerId ? uniqueLearnersMap.get(a.targetLearnerId) : null;
          recipientLabel = targetLearnerObj?.fullName
            ? `Learner: ${targetLearnerObj.fullName}`
            : 'Specific Learner';
        }
        const matchedCenter = a.learningCenterId ? centerByIdMap.get(a.learningCenterId) : null;
        if (matchedCenter?.name) {
          recipientLabel += ` • ${matchedCenter.name}`;
        }
        if (a.programLevel) {
          recipientLabel += ` • ${formatAlsLevelName(a.programLevel)}`;
        }

        return {
          id: a.id,
          title: a.title,
          content: a.content,
          description: a.content,
          audience: recipientLabel,
          recipients: recipientLabel,
          priorityLabel: a.isPinned ? 'Pinned' : null,
          isPinned: Boolean(a.isPinned),
          author: authorName,
          creatorRole: 'ADMIN',
          learningCenterId: a.learningCenterId || null,
          learningCenter: matchedCenter?.name || null,
          publicationDate: formatDateDisplay(a.createdAt),
          datePosted: formatDateDisplay(a.createdAt),
          createdAt: a.createdAt,
        };
      });

    // ==========================================
    // UPCOMING SCHEDULE (Next 3 upcoming across authorized CLCs)
    // ==========================================
    const todayStr = getTodayDateString();
    const upcomingSchedules = (Array.isArray(allSchedules) ? allSchedules : [])
      .filter((s) => {
        const dateKey = toDateKey(s.date);
        if (!dateKey || dateKey < todayStr) return false;
        const st = String(s.status || 'Scheduled').toLowerCase();
        if (st === 'completed' || st === 'cancelled') return false;
        if (parsedCenterId && s.learningCenterId && s.learningCenterId !== parsedCenterId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dCmp = toDateKey(a.date).localeCompare(toDateKey(b.date));
        if (dCmp !== 0) return dCmp;
        return String(a.startTime || '').localeCompare(String(b.startTime || ''));
      })
      .slice(0, 3)
      .map((s) => ({
        id: s.id,
        title: s.title,
        activityType: s.activityType || 'Learning Session',
        date: toDateKey(s.date) || s.date,
        formattedDate: formatDateDisplay(s.date),
        startTime: s.startTime || '',
        endTime: s.endTime || '',
        formattedTime: formatTimeRange(s.startTime, s.endTime),
        learningCenter: s.learningCenter?.name || 'District-Wide / All CLCs',
        learningCenterId: s.learningCenterId || null,
        alsLevel: resolveScheduleAlsLevel(s),
        teacherName: s.teacher?.fullName || null,
        status: s.status || 'Scheduled',
      }));

    // ==========================================
    // NEEDS ATTENTION (Actual DB monitoring indicators)
    // ==========================================
    const nowTime = Date.now();
    const thirtyDaysAgoTime = nowTime - 30 * 24 * 60 * 60 * 1000;

    // 1. Learners with low attendance (< 75% across recorded sessions)
    const attByLearner = new Map();
    for (const rec of attendanceRecords) {
      if (!rec.learnerId) continue;
      if (!attByLearner.has(rec.learnerId)) {
        attByLearner.set(rec.learnerId, { present: 0, total: 0 });
      }
      const st = attByLearner.get(rec.learnerId);
      st.total++;
      if (rec.status === 'PRESENT' || rec.status === 'LATE') {
        st.present++;
      }
    }

    const lowAttendanceLearners = [];
    for (const l of learners) {
      const st = attByLearner.get(l.id);
      if (st && st.total > 0) {
        const rate = Math.round((st.present / st.total) * 100);
        if (rate < 75) {
          lowAttendanceLearners.push({
            id: l.id,
            fullName: l.fullName,
            level: formatAlsLevelName(l.level),
            learningCenter: l.learningCenter?.name || 'Unassigned',
            attendanceRate: rate,
          });
        }
      }
    }

    // 2. Learners with delayed module progress (only when backed by actual DB dueDate/dateEnded or NOT_MASTERED)
    const delayedProgressLearners = [];
    for (const l of learners) {
      const progMap = new Map((l.progressRecords || []).map((p) => [p.moduleId, p]));
      let isDelayed = false;

      // Check explicit module assignment dueDate
      for (const assign of l.assignedModules || []) {
        const prog = progMap.get(assign.moduleId);
        const isDone = prog?.status === 'COMPLETED' || prog?.masteryStatus === 'MASTERED';
        if (!isDone && assign.dueDate) {
          const dueTime = new Date(assign.dueDate).getTime();
          if (!isNaN(dueTime) && dueTime < nowTime) {
            isDelayed = true;
            break;
          }
        }
      }

      // Check module dateEnded or NOT_MASTERED status on progressRecords
      if (!isDelayed) {
        for (const prog of l.progressRecords || []) {
          const isDone = prog.status === 'COMPLETED' || prog.masteryStatus === 'MASTERED';
          if (prog.masteryStatus === 'NOT_MASTERED') {
            isDelayed = true;
            break;
          }
          const mod = moduleById.get(prog.moduleId);
          if (!isDone && mod?.dateEnded) {
            const endTime = new Date(mod.dateEnded).getTime();
            if (!isNaN(endTime) && endTime < nowTime) {
              isDelayed = true;
              break;
            }
          }
        }
      }

      if (isDelayed) {
        delayedProgressLearners.push({
          id: l.id,
          fullName: l.fullName,
          level: formatAlsLevelName(l.level),
          learningCenter: l.learningCenter?.name || 'Unassigned',
        });
      }
    }

    // 3. Community Learning Centers with no recent learning activity (in the last 30 days)
    const inactiveCenters = [];
    for (const clc of learningCenters) {
      const hasRecentAttendance = (clc.attendanceLogs || []).some((att) => {
        const t = att.sessionDate ? new Date(att.sessionDate).getTime() : 0;
        return t >= thirtyDaysAgoTime;
      });

      const hasRecentModule = allModules.some((mod) => {
        if (mod.learningCenterId !== clc.id) return false;
        const t = mod.createdAt ? new Date(mod.createdAt).getTime() : 0;
        return t >= thirtyDaysAgoTime;
      });

      const centerLearners = allLearners.filter((l) => l.learningCenterId === clc.id);
      const hasRecentProgress = centerLearners.some((l) =>
        (l.progressRecords || []).some((p) => {
          const t = new Date(p.updatedAt || p.completedAt || p.createdAt || 0).getTime();
          return t >= thirtyDaysAgoTime;
        })
      );

      if (!hasRecentAttendance && !hasRecentModule && !hasRecentProgress) {
        inactiveCenters.push({
          id: clc.id,
          name: clc.name,
          code: clc.code || '',
        });
      }
    }

    const totalAttentionIssues =
      lowAttendanceLearners.length + delayedProgressLearners.length + inactiveCenters.length;

    const needsAttention = {
      hasIssues: totalAttentionIssues > 0,
      totalIssues: totalAttentionIssues,
      lowAttendanceCount: lowAttendanceLearners.length,
      delayedProgressCount: delayedProgressLearners.length,
      inactiveCentersCount: inactiveCenters.length,
      items: [
        {
          key: 'lowAttendance',
          label: 'Learners with low attendance',
          description: 'Attendance rate below 75% in recorded ALS learning sessions',
          count: lowAttendanceLearners.length,
          route: '/dashboard/learners',
          records: lowAttendanceLearners.slice(0, 5),
        },
        {
          key: 'delayedProgress',
          label: 'Learners with delayed module progress',
          description: 'Learners with past-due assigned modules or unmastered module assessments',
          count: delayedProgressLearners.length,
          route: '/dashboard/reports/module-progress',
          records: delayedProgressLearners.slice(0, 5),
        },
        {
          key: 'inactiveCenters',
          label: 'Community Learning Centers with no recent learning activity',
          description: 'Learning centers with no recorded attendance or module updates in the last 30 days',
          count: inactiveCenters.length,
          route: '/dashboard/learning-centers',
          records: inactiveCenters.slice(0, 5),
        },
      ],
    };

    // ==========================================
    // RECENT ACTIVITIES (Latest 5 District Activities, Without AF2)
    // ==========================================
    const activities = [];

    learners.slice(0, 5).forEach((l) => {
      const ts = l.createdAt ? new Date(l.createdAt).getTime() : 0;
      const entityName = l.learningCenter?.name
        ? `${l.learningCenter.name} • ${formatAlsLevelName(l.level)}`
        : formatAlsLevelName(l.level);
      activities.push({
        id: `lrn_${l.id}`,
        type: 'learner',
        description: `New learner enrolled: ${l.fullName}`,
        entity: entityName,
        dateTime: formatDateTimeDisplay(l.createdAt),
        title: `New learner enrolled: ${l.fullName}`,
        subtitle: entityName,
        timestamp: ts,
        dateFormatted: l.createdAt ? new Date(l.createdAt).toISOString() : '',
      });
    });

    teachers.slice(0, 5).forEach((t) => {
      const ts = t.createdAt ? new Date(t.createdAt).getTime() : 0;
      const entityName = t.learningCenter?.name
        ? `${t.learningCenter.name} (${t.position || 'ALS Teacher'})`
        : t.position || 'ALS Teacher';
      activities.push({
        id: `tch_${t.id}`,
        type: 'teacher',
        description: `Teacher account created: ${t.fullName}`,
        entity: entityName,
        dateTime: formatDateTimeDisplay(t.createdAt),
        title: `Teacher account created: ${t.fullName}`,
        subtitle: entityName,
        timestamp: ts,
        dateFormatted: t.createdAt ? new Date(t.createdAt).toISOString() : '',
      });
    });

    allModules.slice(0, 5).forEach((mod) => {
      const ts = mod.createdAt ? new Date(mod.createdAt).getTime() : 0;
      const entityName = `${mod.teacher?.fullName || 'ALS Teacher'} • ${formatAlsLevelName(mod.targetLevel)}`;
      activities.push({
        id: `mod_${mod.id}`,
        type: 'module',
        description: `Module uploaded: ${mod.title}`,
        entity: entityName,
        dateTime: formatDateTimeDisplay(mod.createdAt),
        title: `Module uploaded: ${mod.title}`,
        subtitle: entityName,
        timestamp: ts,
        dateFormatted: mod.createdAt ? new Date(mod.createdAt).toISOString() : '',
      });
    });

    const recentAttMap = new Map();
    attendanceRecords.slice(0, 20).forEach((att) => {
      const dateKey = att.sessionDate ? new Date(att.sessionDate).toISOString().split('T')[0] : '';
      const centerName = att.learningCenter?.name || 'Community Learning Center';
      const mapKey = `${centerName}_${dateKey}`;
      if (!recentAttMap.has(mapKey)) {
        const ts = att.createdAt
          ? new Date(att.createdAt).getTime()
          : att.sessionDate
          ? new Date(att.sessionDate).getTime()
          : 0;
        const entityName = `${centerName} • Marked by ${att.recordedBy?.fullName || 'ALS Teacher'}`;
        recentAttMap.set(mapKey, {
          id: `att_${att.id}`,
          type: 'attendance',
          description: `Attendance recorded for session (${formatDateDisplay(dateKey || att.sessionDate)})`,
          entity: entityName,
          dateTime: formatDateTimeDisplay(att.createdAt || att.sessionDate),
          title: `Attendance recorded at ${centerName}`,
          subtitle: entityName,
          timestamp: ts,
          dateFormatted: (att.createdAt || att.sessionDate)
            ? new Date(att.createdAt || att.sessionDate).toISOString()
            : '',
        });
      }
    });
    activities.push(...Array.from(recentAttMap.values()).slice(0, 5));

    learningCenters.slice(0, 5).forEach((clc) => {
      const refDate = clc.updatedAt || clc.createdAt;
      if (!refDate) return;
      const ts = new Date(refDate).getTime();
      const entityName = clc.barangay ? `Brgy. ${clc.barangay}, ${clc.municipality || 'Naawan'}` : 'Naawan District';
      activities.push({
        id: `clc_${clc.id}`,
        type: 'learning_center',
        description: `Learning Center active: ${clc.name}`,
        entity: entityName,
        dateTime: formatDateTimeDisplay(refDate),
        title: `Learning Center active: ${clc.name}`,
        subtitle: entityName,
        timestamp: ts,
        dateFormatted: new Date(refDate).toISOString(),
      });
    });

    activities.sort((a, b) => b.timestamp - a.timestamp);
    const recentActivities = activities.slice(0, 5);

    res.json({
      filterOptions: {
        schoolYears: availableSchoolYears,
        levels: ['A&E Elementary', 'A&E Junior High'],
        learningCenters: allLearningCenters.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code || '',
        })),
      },
      activeFilters: {
        schoolYear: trimmedSy || '',
        level: parsedLevelKey ? formatAlsLevelName(parsedLevelKey) : '',
        learningCenterId: parsedCenterId || '',
      },
      summary: {
        totalLearningCenters,
        totalTeachers,
        totalLearners,
        averageAttendanceRate,
        totalAttendanceRecords: totalAttendanceCount,
      },
      latestAnnouncements: adminCreatedAnnouncements,
      announcements: adminCreatedAnnouncements,
      upcomingSchedules,
      learnerDistribution,
      learnersByLevel: learnerDistribution,
      sexDistributionByLevel,
      moduleCompletionByLevel,
      learnerProgressByLevel,
      attendanceTrend,
      needsAttention,
      clcOverview,
      recentActivities,
    });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// GET /api/dashboard/teacher
// Strictly teacher-scoped dashboard metrics for the logged-in ALS Teacher
// Supports filters: schoolYear, level, learningCenterId
// -------------------------------------------------------------
router.get('/teacher', optionalAuth, async (req, res, next) => {
  try {
    const {
      teacherId: queryTeacherId = '',
      schoolYear = '',
      level = '',
      learningCenterId = '',
    } = req.query;

    // 1. Strict Teacher Authentication & Data Isolation
    let resolvedTeacherId = null;

    if (req.user) {
      if (req.user.role === 'TEACHER') {
        const parsedQueryTid = queryTeacherId ? parseInt(String(queryTeacherId), 10) : null;
        if (parsedQueryTid && !isNaN(parsedQueryTid) && parsedQueryTid !== req.user.profileId) {
          return res.status(403).json({
            error: 'Access denied. You cannot access dashboard statistics of another teacher.',
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
          error: 'Access denied. This dashboard endpoint is restricted to ALS Teachers.',
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

    // 2. Verify teacher exists and fetch teacher profile + teacher-scoped data in parallel
    const [
      teacherProfile,
      assignedLearnersRaw,
      teacherModulesRaw,
      teacherAttendanceRaw,
      teacherAnnouncementsRaw,
      teacherSchedulesRaw,
      teacherSubmissionsRaw,
    ] = await Promise.all([
      prisma.teacher.findUnique({
        where: { id: resolvedTeacherId },
        include: {
          learningCenter: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.learner.findMany({
        where: { assignedTeacherId: resolvedTeacherId },
        include: {
          learningCenter: { select: { id: true, name: true, code: true } },
          assignedModules: {
            select: { id: true, moduleId: true, assignedAt: true, dueDate: true },
          },
          progressRecords: {
            select: {
              id: true,
              moduleId: true,
              status: true,
              completedPages: true,
              totalPages: true,
              preTestScore: true,
              postTestScore: true,
              masteryStatus: true,
              completedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          attempts: {
            select: {
              id: true,
              assessmentId: true,
              score: true,
              maxScore: true,
              percentage: true,
              isPassed: true,
              status: true,
              startedAt: true,
              submittedAt: true,
              assessment: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  module: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.module.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { teacherId: resolvedTeacherId },
            { assignments: { some: { learner: { assignedTeacherId: resolvedTeacherId } } } },
            { learnerProgress: { some: { learner: { assignedTeacherId: resolvedTeacherId } } } },
          ],
        },
        include: {
          assignments: { select: { learnerId: true, dueDate: true } },
          assessments: { select: { id: true, type: true } },
        },
      }),
      prisma.attendance.findMany({
        where: {
          learner: { assignedTeacherId: resolvedTeacherId },
        },
        include: {
          learner: {
            select: {
              id: true,
              fullName: true,
              level: true,
              learningCenterId: true,
              assignedTeacherId: true,
            },
          },
          learningCenter: { select: { id: true, name: true, code: true } },
          recordedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { sessionDate: 'desc' },
      }),
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
          include: {
            author: {
              select: {
                username: true,
                role: true,
                adminProfile: { select: { fullName: true } },
                teacherProfile: { select: { fullName: true } },
              },
            },
          },
          orderBy: [{ createdAt: 'desc' }],
          take: 15,
        })
        .catch((err) => {
          console.error('Teacher dashboard announcements query warning:', err.message);
          return [];
        }),
      prisma.schedule
        .findMany({
          where: {
            teacherId: resolvedTeacherId,
          },
          include: {
            learningCenter: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, fullName: true, specialization: true } },
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        })
        .catch((err) => {
          console.error('Teacher dashboard schedules query warning:', err.message);
          return [];
        }),
      prisma.submission
        .findMany({
          where: {
            learner: { assignedTeacherId: resolvedTeacherId },
          },
          include: {
            learner: { select: { id: true, fullName: true, level: true, learningCenterId: true } },
            module: { select: { id: true, title: true } },
          },
          orderBy: { submittedAt: 'desc' },
          take: 15,
        })
        .catch((err) => {
          console.error('Teacher dashboard submissions query warning:', err.message);
          return [];
        }),
    ]);

    if (!teacherProfile) {
      return res.status(404).json({ error: 'Teacher profile not found.' });
    }

    // 3. Deduplicate assigned learners by unique ID
    const uniqueLearnersMap = new Map();
    for (const l of assignedLearnersRaw) {
      if (l && l.id && l.assignedTeacherId === resolvedTeacherId && !uniqueLearnersMap.has(l.id)) {
        uniqueLearnersMap.set(l.id, l);
      }
    }
    const allAssignedLearners = Array.from(uniqueLearnersMap.values());

    // 4. Build authorized Community Learning Centers strictly for this teacher
    const authorizedCentersMap = new Map();
    if (teacherProfile.learningCenter && teacherProfile.learningCenter.id) {
      authorizedCentersMap.set(teacherProfile.learningCenter.id, {
        id: teacherProfile.learningCenter.id,
        name: teacherProfile.learningCenter.name,
        code: teacherProfile.learningCenter.code || '',
      });
    }
    for (const l of allAssignedLearners) {
      if (l.learningCenter && l.learningCenter.id && !authorizedCentersMap.has(l.learningCenter.id)) {
        authorizedCentersMap.set(l.learningCenter.id, {
          id: l.learningCenter.id,
          name: l.learningCenter.name,
          code: l.learningCenter.code || '',
        });
      }
    }
    const authorizedCenters = Array.from(authorizedCentersMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const authorizedCenterIds = new Set(authorizedCenters.map((c) => c.id));

    // 5. Collect available School Years from teacher's records + current/previous school year
    const schoolYearSet = new Set();
    const currentSy = getSchoolYearForDate(new Date());
    if (currentSy) {
      schoolYearSet.add(currentSy);
      const startYr = parseInt(currentSy.split('-')[0], 10);
      if (!isNaN(startYr)) {
        schoolYearSet.add(`${startYr - 1}-${startYr}`);
      }
    }

    for (const l of allAssignedLearners) {
      const sy = getSchoolYearForDate(l.dateRegistered || l.createdAt);
      if (sy) schoolYearSet.add(sy);
      for (const p of l.progressRecords || []) {
        const psy = getSchoolYearForDate(p.completedAt || p.updatedAt || p.createdAt);
        if (psy) schoolYearSet.add(psy);
      }
    }
    for (const att of teacherAttendanceRaw) {
      const sy = getSchoolYearForDate(att.sessionDate || att.createdAt);
      if (sy) schoolYearSet.add(sy);
    }
    for (const m of teacherModulesRaw) {
      const sy = getSchoolYearForDate(m.dateStarted || m.createdAt);
      if (sy) schoolYearSet.add(sy);
    }

    const availableSchoolYears = Array.from(schoolYearSet).sort((a, b) => b.localeCompare(a));

    // 6. Parse and validate incoming filters
    const trimmedSy = String(schoolYear || '').trim();
    const trimmedLevel = String(level || '').trim();
    const trimmedCenter = String(learningCenterId || '').trim();

    let parsedCenterId = null;
    if (trimmedCenter && trimmedCenter !== 'ALL') {
      const numId = parseInt(trimmedCenter, 10);
      if (!isNaN(numId)) {
        parsedCenterId = numId;
      } else {
        const matchedCenter = authorizedCenters.find(
          (c) => c.name.toLowerCase() === trimmedCenter.toLowerCase()
        );
        if (matchedCenter) parsedCenterId = matchedCenter.id;
      }

      if (parsedCenterId && !authorizedCenterIds.has(parsedCenterId)) {
        return res.status(403).json({
          error: 'Access denied. You are not authorized to access this Community Learning Center.',
        });
      }
    }

    let parsedLevelKey = null;
    if (trimmedLevel && trimmedLevel !== 'ALL') {
      const upper = trimmedLevel.toUpperCase();
      if (upper.includes('ELEM')) {
        parsedLevelKey = 'ELEMENTARY';
      } else if (upper.includes('JUN') || upper.includes('HIGH')) {
        parsedLevelKey = 'JUNIOR';
      }
    }

    // Build sets of assigned learner IDs active in the selected school year
    const learnersActiveInSy = new Set();
    if (trimmedSy) {
      for (const att of teacherAttendanceRaw) {
        if (getSchoolYearForDate(att.sessionDate || att.createdAt) === trimmedSy && att.learnerId) {
          learnersActiveInSy.add(att.learnerId);
        }
      }
      for (const l of allAssignedLearners) {
        for (const p of l.progressRecords || []) {
          if (getSchoolYearForDate(p.completedAt || p.updatedAt || p.createdAt) === trimmedSy) {
            learnersActiveInSy.add(l.id);
          }
        }
      }
    }

    // 7. Filter assigned learners and attendance records
    const learners = allAssignedLearners.filter((l) => {
      if (parsedCenterId && l.learningCenterId !== parsedCenterId) return false;
      if (parsedLevelKey && normalizeLevelKey(l.level) !== parsedLevelKey) return false;
      if (trimmedSy) {
        const regSy = getSchoolYearForDate(l.dateRegistered || l.createdAt);
        if (regSy !== trimmedSy && !learnersActiveInSy.has(l.id)) {
          return false;
        }
      }
      return true;
    });

    const filteredLearnerIds = new Set(learners.map((l) => l.id));

    const attendanceRecords = teacherAttendanceRaw.filter((rec) => {
      if (!rec.learnerId || !filteredLearnerIds.has(rec.learnerId)) {
        return false;
      }
      if (parsedCenterId) {
        const recCenterId = rec.learningCenterId || rec.learner?.learningCenterId;
        if (recCenterId !== parsedCenterId) return false;
      }
      if (parsedLevelKey) {
        const recLevel = normalizeLevelKey(rec.learner?.level);
        if (recLevel !== parsedLevelKey) return false;
      }
      if (trimmedSy) {
        const attSy = getSchoolYearForDate(rec.sessionDate || rec.createdAt);
        if (attSy !== trimmedSy) return false;
      }
      return true;
    });

    // ==========================================
    // SECTION 1: SUMMARY CARDS & GRAPH 1 + GRAPH 2
    // ==========================================
    const totalLearners = learners.length;
    let elementaryCount = 0;
    let juniorCount = 0;

    let elemMale = 0;
    let elemFemale = 0;
    let jhsMale = 0;
    let jhsFemale = 0;

    for (const l of learners) {
      const lvlKey = normalizeLevelKey(l.level);
      const sex = normalizeSex(l.gender);
      if (lvlKey === 'ELEMENTARY') {
        elementaryCount++;
        if (sex === 'Female') elemFemale++;
        else elemMale++;
      } else {
        juniorCount++;
        if (sex === 'Female') jhsFemale++;
        else jhsMale++;
      }
    }

    const totalAttendanceCount = attendanceRecords.length;
    const totalPresentCount = attendanceRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;

    const averageAttendanceRate =
      totalAttendanceCount > 0
        ? Math.round((totalPresentCount / totalAttendanceCount) * 100)
        : 0;

    const elementaryPct = totalLearners > 0 ? Math.round((elementaryCount / totalLearners) * 100) : 0;
    const juniorPct = totalLearners > 0 ? Math.round((juniorCount / totalLearners) * 100) : 0;

    const learnersByLevel = {
      total: totalLearners,
      elementary: elementaryCount,
      junior: juniorCount,
      juniorHigh: juniorCount,
      elementaryPct,
      juniorPct,
      juniorHighPct: juniorPct,
      bars: [
        {
          key: 'elementary',
          label: 'A&E Elementary',
          count: elementaryCount,
          percentage: elementaryPct,
        },
        {
          key: 'juniorHigh',
          label: 'A&E Junior High',
          count: juniorCount,
          percentage: juniorPct,
        },
      ],
    };

    const sexDistributionByLevel = {
      totalLearners,
      totalMale: elemMale + jhsMale,
      totalFemale: elemFemale + jhsFemale,
      elementary: {
        label: 'A&E Elementary',
        male: elemMale,
        female: elemFemale,
        total: elemMale + elemFemale,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        male: jhsMale,
        female: jhsFemale,
        total: jhsMale + jhsFemale,
      },
      groups: [
        {
          key: 'elementary',
          label: 'A&E Elementary',
          male: elemMale,
          female: elemFemale,
          total: elemMale + elemFemale,
        },
        {
          key: 'juniorHigh',
          label: 'A&E Junior High',
          male: jhsMale,
          female: jhsFemale,
          total: jhsMale + jhsFemale,
        },
      ],
    };

    // ==========================================
    // SECTION 3 (LEFT): MODULE COMPLETION BY ALS LEVEL
    // & SECTION 3 (RIGHT): LEARNER PROGRESS BY ALS LEVEL
    // ==========================================
    const moduleById = new Map(teacherModulesRaw.map((m) => [m.id, m]));

    const moduleStats = {
      ELEMENTARY: {
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        learnersCount: 0,
        learnerProgressSum: 0,
        assignedModulesCount: 0,
        completedModulesCount: 0,
        inProgressModulesCount: 0,
        notStartedModulesCount: 0,
      },
      JUNIOR: {
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        learnersCount: 0,
        learnerProgressSum: 0,
        assignedModulesCount: 0,
        completedModulesCount: 0,
        inProgressModulesCount: 0,
        notStartedModulesCount: 0,
      },
    };

    for (const learner of learners) {
      const lvlKey = normalizeLevelKey(learner.level);
      const bucket = moduleStats[lvlKey];
      bucket.learnersCount++;

      // Determine all teacher-scoped modules assigned/applicable to this learner (deduplicated by moduleId)
      const assignedModuleIds = new Set();

      // 1. Explicit module assignments
      if (Array.isArray(learner.assignedModules)) {
        for (const assign of learner.assignedModules) {
          if (assign.moduleId && moduleById.has(assign.moduleId)) {
            assignedModuleIds.add(assign.moduleId);
          }
        }
      }

      // 2. Existing learner progress records
      const progressByModule = new Map();
      if (Array.isArray(learner.progressRecords)) {
        for (const prog of learner.progressRecords) {
          if (trimmedSy) {
            const progSy = getSchoolYearForDate(prog.completedAt || prog.updatedAt || prog.createdAt);
            if (progSy && progSy !== trimmedSy) continue;
          }
          if (prog.moduleId) {
            assignedModuleIds.add(prog.moduleId);
            progressByModule.set(prog.moduleId, prog);
          }
        }
      }

      // 3. Published modules created by this teacher targeting the learner's ALS level and Learning Center
      for (const mod of teacherModulesRaw) {
        if (mod.teacherId && mod.teacherId !== resolvedTeacherId) continue;
        if (normalizeLevelKey(mod.targetLevel) !== lvlKey) continue;
        if (mod.learningCenterId && learner.learningCenterId && mod.learningCenterId !== learner.learningCenterId) {
          continue;
        }
        if (trimmedSy) {
          const modSy = getSchoolYearForDate(mod.dateStarted || mod.createdAt);
          if (modSy && modSy !== trimmedSy && !progressByModule.has(mod.id)) {
            continue;
          }
        }
        const modAssignments = Array.isArray(mod.assignments) ? mod.assignments : [];
        const isAssignedToAll = modAssignments.length === 0;
        const isExplicitlyAssigned = modAssignments.some((a) => a.learnerId === learner.id);
        if (isAssignedToAll || isExplicitlyAssigned) {
          assignedModuleIds.add(mod.id);
        }
      }

      // Map learner's assessment attempts by assessmentId
      const attemptsByAssessment = new Map();
      if (Array.isArray(learner.attempts)) {
        for (const att of learner.attempts) {
          const prev = attemptsByAssessment.get(att.assessmentId);
          if (!prev || Number(att.score) > Number(prev.score) || att.isPassed) {
            attemptsByAssessment.set(att.assessmentId, att);
          }
        }
      }

      let learnerModProgressSum = 0;
      let learnerCompletedMods = 0;
      let learnerInProgressMods = 0;
      let learnerNotStartedMods = 0;
      const learnerModCount = assignedModuleIds.size;

      for (const modId of assignedModuleIds) {
        const prog = progressByModule.get(modId);
        const mod = moduleById.get(modId);

        const preAss = mod?.assessments?.find((a) => a.type === 'PRE_TEST');
        const postAss = mod?.assessments?.find((a) => a.type === 'POST_TEST');
        const preAtt = preAss ? attemptsByAssessment.get(preAss.id) : null;
        const postAtt = postAss ? attemptsByAssessment.get(postAss.id) : null;

        const isCompleted =
          prog?.status === 'COMPLETED' ||
          prog?.masteryStatus === 'MASTERED' ||
          Boolean(postAtt?.isPassed);

        const isInProgress =
          !isCompleted &&
          (prog?.status === 'IN_PROGRESS' ||
            prog?.masteryStatus === 'NOT_MASTERED' ||
            prog?.preTestScore != null ||
            prog?.postTestScore != null ||
            (prog?.completedPages || 0) > 0 ||
            Boolean(preAtt) ||
            Boolean(postAtt));

        bucket.assignedModulesCount++;
        if (isCompleted) {
          learnerCompletedMods++;
          bucket.completedModulesCount++;
        } else if (isInProgress) {
          learnerInProgressMods++;
          bucket.inProgressModulesCount++;
        } else {
          learnerNotStartedMods++;
          bucket.notStartedModulesCount++;
        }

        let modPct = 0;
        if (isCompleted) {
          modPct = 100;
        } else if (isInProgress) {
          if (prog && prog.totalPages > 0 && prog.completedPages > 0) {
            modPct = Math.min(99, Math.max(10, Math.round((prog.completedPages / prog.totalPages) * 100)));
          } else {
            modPct = 50;
          }
        }
        learnerModProgressSum += modPct;
      }

      // Classify learner strictly once into Completed, In Progress, or Not Started
      if (learnerModCount > 0 && learnerCompletedMods === learnerModCount) {
        bucket.completed++;
      } else if (learnerCompletedMods > 0 || learnerInProgressMods > 0) {
        bucket.inProgress++;
      } else {
        bucket.notStarted++;
      }

      const learnerAvgProgress = learnerModCount > 0 ? learnerModProgressSum / learnerModCount : 0;
      bucket.learnerProgressSum += learnerAvgProgress;
    }

    const moduleCompletionByLevel = {
      unit: 'Learners',
      totalLearners,
      totalCompleted: moduleStats.ELEMENTARY.completed + moduleStats.JUNIOR.completed,
      totalInProgress: moduleStats.ELEMENTARY.inProgress + moduleStats.JUNIOR.inProgress,
      totalNotStarted: moduleStats.ELEMENTARY.notStarted + moduleStats.JUNIOR.notStarted,
      elementary: {
        label: 'A&E Elementary',
        completed: moduleStats.ELEMENTARY.completed,
        inProgress: moduleStats.ELEMENTARY.inProgress,
        notStarted: moduleStats.ELEMENTARY.notStarted,
        total: moduleStats.ELEMENTARY.learnersCount,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        completed: moduleStats.JUNIOR.completed,
        inProgress: moduleStats.JUNIOR.inProgress,
        notStarted: moduleStats.JUNIOR.notStarted,
        total: moduleStats.JUNIOR.learnersCount,
      },
      groups: [
        {
          key: 'elementary',
          label: 'A&E Elementary',
          completed: moduleStats.ELEMENTARY.completed,
          inProgress: moduleStats.ELEMENTARY.inProgress,
          notStarted: moduleStats.ELEMENTARY.notStarted,
          total: moduleStats.ELEMENTARY.learnersCount,
        },
        {
          key: 'juniorHigh',
          label: 'A&E Junior High',
          completed: moduleStats.JUNIOR.completed,
          inProgress: moduleStats.JUNIOR.inProgress,
          notStarted: moduleStats.JUNIOR.notStarted,
          total: moduleStats.JUNIOR.learnersCount,
        },
      ],
    };

    const elemAvgProgress =
      moduleStats.ELEMENTARY.learnersCount > 0
        ? Math.round(moduleStats.ELEMENTARY.learnerProgressSum / moduleStats.ELEMENTARY.learnersCount)
        : 0;

    const jhsAvgProgress =
      moduleStats.JUNIOR.learnersCount > 0
        ? Math.round(moduleStats.JUNIOR.learnerProgressSum / moduleStats.JUNIOR.learnersCount)
        : 0;

    const learnerProgressByLevel = {
      hasData: totalLearners > 0,
      elementary: {
        label: 'A&E Elementary',
        averageProgress: elemAvgProgress,
        learnersCount: moduleStats.ELEMENTARY.learnersCount,
        completedLearnersCount: moduleStats.ELEMENTARY.completed,
        inProgressLearnersCount: moduleStats.ELEMENTARY.inProgress,
        notStartedLearnersCount: moduleStats.ELEMENTARY.notStarted,
        assignedModulesCount: moduleStats.ELEMENTARY.assignedModulesCount,
        completedModulesCount: moduleStats.ELEMENTARY.completedModulesCount,
        inProgressModulesCount: moduleStats.ELEMENTARY.inProgressModulesCount,
        notStartedModulesCount: moduleStats.ELEMENTARY.notStartedModulesCount,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        averageProgress: jhsAvgProgress,
        learnersCount: moduleStats.JUNIOR.learnersCount,
        completedLearnersCount: moduleStats.JUNIOR.completed,
        inProgressLearnersCount: moduleStats.JUNIOR.inProgress,
        notStartedLearnersCount: moduleStats.JUNIOR.notStarted,
        assignedModulesCount: moduleStats.JUNIOR.assignedModulesCount,
        completedModulesCount: moduleStats.JUNIOR.completedModulesCount,
        inProgressModulesCount: moduleStats.JUNIOR.inProgressModulesCount,
        notStartedModulesCount: moduleStats.JUNIOR.notStartedModulesCount,
      },
      levels: [
        {
          key: 'elementary',
          label: 'A&E Elementary',
          subtitle: 'Average Learner Progress',
          percentage: elemAvgProgress,
          learnersCount: moduleStats.ELEMENTARY.learnersCount,
          completedLearnersCount: moduleStats.ELEMENTARY.completed,
          inProgressLearnersCount: moduleStats.ELEMENTARY.inProgress,
          notStartedLearnersCount: moduleStats.ELEMENTARY.notStarted,
          assignedModulesCount: moduleStats.ELEMENTARY.assignedModulesCount,
        },
        {
          key: 'juniorHigh',
          label: 'A&E Junior High',
          subtitle: 'Average Learner Progress',
          percentage: jhsAvgProgress,
          learnersCount: moduleStats.JUNIOR.learnersCount,
          completedLearnersCount: moduleStats.JUNIOR.completed,
          inProgressLearnersCount: moduleStats.JUNIOR.inProgress,
          notStartedLearnersCount: moduleStats.JUNIOR.notStarted,
          assignedModulesCount: moduleStats.JUNIOR.assignedModulesCount,
        },
      ],
    };

    // ==========================================
    // SECTION 4: MONTHLY ATTENDANCE TREND (BY ALS LEVEL)
    // ==========================================
    const monthBuckets = new Map();

    function ensureMonthBucket(year, monthIndex) {
      const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      if (!monthBuckets.has(key)) {
        const dateObj = new Date(year, monthIndex, 1);
        const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthBuckets.set(key, {
          key,
          label: monthLabel,
          timestamp: dateObj.getTime(),
          present: 0,
          absent: 0,
          total: 0,
          sessionDates: new Set(),
          elemPresent: 0,
          elemAbsent: 0,
          elemTotal: 0,
          elemSessions: new Set(),
          jhsPresent: 0,
          jhsAbsent: 0,
          jhsTotal: 0,
          jhsSessions: new Set(),
        });
      }
      return monthBuckets.get(key);
    }

    for (const rec of attendanceRecords) {
      const d = rec.sessionDate ? new Date(rec.sessionDate) : new Date(rec.createdAt);
      if (isNaN(d.getTime())) continue;
      const bucket = ensureMonthBucket(d.getFullYear(), d.getMonth());
      const dateStr = d.toISOString().split('T')[0];
      const isPresent = rec.status === 'PRESENT' || rec.status === 'LATE';
      const isAbsent = rec.status === 'ABSENT';
      const lvlKey = normalizeLevelKey(rec.learner?.level);

      bucket.total++;
      bucket.sessionDates.add(dateStr);
      if (isPresent) bucket.present++;
      else if (isAbsent) bucket.absent++;

      if (lvlKey === 'ELEMENTARY') {
        bucket.elemTotal++;
        bucket.elemSessions.add(dateStr);
        if (isPresent) bucket.elemPresent++;
        else if (isAbsent) bucket.elemAbsent++;
      } else {
        bucket.jhsTotal++;
        bucket.jhsSessions.add(dateStr);
        if (isPresent) bucket.jhsPresent++;
        else if (isAbsent) bucket.jhsAbsent++;
      }
    }

    // Fill intermediate months in the active timeline window so months without sessions are handled cleanly
    if (monthBuckets.size > 0) {
      const sortedExisting = Array.from(monthBuckets.values()).sort((a, b) => a.timestamp - b.timestamp);
      const latestDate = new Date(sortedExisting[sortedExisting.length - 1].timestamp);
      let earliestDate = new Date(sortedExisting[0].timestamp);

      const minWindowStart = new Date(latestDate.getFullYear(), latestDate.getMonth() - 4, 1);
      if (earliestDate > minWindowStart) {
        earliestDate = minWindowStart;
      }

      const cursor = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
      while (cursor <= latestDate) {
        ensureMonthBucket(cursor.getFullYear(), cursor.getMonth());
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    const monthlyAttendance = Array.from(monthBuckets.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((b) => {
        const elemHasRecords = b.elemTotal > 0;
        const jhsHasRecords = b.jhsTotal > 0;
        const elemRate = elemHasRecords ? Math.round((b.elemPresent / b.elemTotal) * 100) : 0;
        const jhsRate = jhsHasRecords ? Math.round((b.jhsPresent / b.jhsTotal) * 100) : 0;

        return {
          month: b.label,
          key: b.key,
          hasRecords: b.total > 0,
          sessionsCount: b.sessionDates.size,
          presentRecords: b.present,
          absentRecords: b.absent,
          totalRecords: b.total,
          attendancePercentage: b.total > 0 ? Math.round((b.present / b.total) * 100) : 0,
          elementary: {
            label: 'A&E Elementary',
            hasRecords: elemHasRecords,
            sessionsCount: b.elemSessions.size,
            presentRecords: b.elemPresent,
            absentRecords: b.elemAbsent,
            totalRecords: b.elemTotal,
            attendancePercentage: elemRate,
          },
          juniorHigh: {
            label: 'A&E Junior High',
            hasRecords: jhsHasRecords,
            sessionsCount: b.jhsSessions.size,
            presentRecords: b.jhsPresent,
            absentRecords: b.jhsAbsent,
            totalRecords: b.jhsTotal,
            attendancePercentage: jhsRate,
          },
        };
      });

    const elemAttRecords = attendanceRecords.filter(
      (r) => normalizeLevelKey(r.learner?.level) === 'ELEMENTARY'
    );
    const elemAttPresent = elemAttRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const elemOverallRate =
      elemAttRecords.length > 0 ? Math.round((elemAttPresent / elemAttRecords.length) * 100) : 0;

    const jhsAttRecords = attendanceRecords.filter(
      (r) => normalizeLevelKey(r.learner?.level) === 'JUNIOR'
    );
    const jhsAttPresent = jhsAttRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const jhsOverallRate =
      jhsAttRecords.length > 0 ? Math.round((jhsAttPresent / jhsAttRecords.length) * 100) : 0;

    const distinctSessionsTotal = new Set(
      attendanceRecords
        .map((r) => (r.sessionDate ? new Date(r.sessionDate).toISOString().split('T')[0] : null))
        .filter(Boolean)
    ).size;

    const attendanceTrend = {
      hasData: attendanceRecords.length > 0,
      totalRecords: totalAttendanceCount,
      totalSessions: distinctSessionsTotal,
      presentRecords: totalPresentCount,
      absentRecords: attendanceRecords.filter((r) => r.status === 'ABSENT').length,
      averageRate: averageAttendanceRate,
      elementaryRate: elemOverallRate,
      elementaryHasRecords: elemAttRecords.length > 0,
      juniorHighRate: jhsOverallRate,
      juniorHighHasRecords: jhsAttRecords.length > 0,
      monthly: monthlyAttendance,
    };

    // Format handled ALS level display strictly with allowed level names
    const rawSpec = String(teacherProfile.specialization || 'Both').trim();
    let handledLevelsDisplay = 'A&E Elementary / A&E Junior High';
    if (rawSpec && !rawSpec.toLowerCase().includes('both')) {
      handledLevelsDisplay = formatAlsLevelName(rawSpec);
    }

    // ==========================================
    // TEACHER ANNOUNCEMENTS (Latest 3 relevant: From Admin + My Announcement)
    // ==========================================
    const teacherAnnouncements = (Array.isArray(teacherAnnouncementsRaw) ? teacherAnnouncementsRaw : [])
      .filter((a) => {
        const isMyOwn = a.teacherId === resolvedTeacherId || a.creatorRole === 'TEACHER';
        if (isMyOwn) {
          return a.teacherId === resolvedTeacherId;
        }
        // Admin announcement intended for teachers
        if (a.learningCenterId && authorizedCenterIds.size > 0 && !authorizedCenterIds.has(a.learningCenterId)) {
          return false;
        }
        return true;
      })
      .slice(0, 3)
      .map((a) => {
        const isMyAnnouncement = a.teacherId === resolvedTeacherId || a.creatorRole === 'TEACHER';
        const matchedCenter = a.learningCenterId ? authorizedCentersMap.get(a.learningCenterId) : null;
        const matchedTargetLearner = a.targetLearnerId ? uniqueLearnersMap.get(a.targetLearnerId) : null;

        let recipientLabel = 'All Teachers';
        if (isMyAnnouncement) {
          if (
            (a.audience === 'SPECIFIC_LEARNER' || a.audience === 'INDIVIDUAL_LEARNER') &&
            matchedTargetLearner?.fullName
          ) {
            recipientLabel = `Learner: ${matchedTargetLearner.fullName}`;
          } else {
            recipientLabel = 'My Assigned Learners';
          }
          if (a.programLevel) {
            recipientLabel += ` • ${formatAlsLevelName(a.programLevel)}`;
          }
        } else if (matchedCenter?.name) {
          recipientLabel += ` • ${matchedCenter.name}`;
        }

        return {
          id: a.id,
          title: a.title,
          content: a.content,
          description: a.content,
          publicationDate: formatDateDisplay(a.createdAt),
          datePosted: formatDateDisplay(a.createdAt),
          source: isMyAnnouncement ? 'My Announcement' : 'From Admin',
          priorityLabel: a.isPinned ? 'Pinned' : null,
          isPinned: Boolean(a.isPinned),
          recipients: recipientLabel,
          learningCenterId: a.learningCenterId || null,
          learningCenter: matchedCenter?.name || null,
          targetLearnerId: a.targetLearnerId || null,
          targetLearnerName: matchedTargetLearner?.fullName || null,
          creatorRole: isMyAnnouncement ? 'TEACHER' : 'ADMIN',
          createdAt: a.createdAt,
        };
      });

    // ==========================================
    // TEACHER UPCOMING SCHEDULE (Next 3 assigned sessions/activities)
    // ==========================================
    const todayStr = getTodayDateString();
    const upcomingSchedules = (Array.isArray(teacherSchedulesRaw) ? teacherSchedulesRaw : [])
      .filter((s) => {
        const dateKey = toDateKey(s.date);
        if (!dateKey || dateKey < todayStr) return false;
        const st = String(s.status || 'Scheduled').toLowerCase();
        if (st === 'completed' || st === 'cancelled') return false;
        if (parsedCenterId && s.learningCenterId && s.learningCenterId !== parsedCenterId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dCmp = toDateKey(a.date).localeCompare(toDateKey(b.date));
        if (dCmp !== 0) return dCmp;
        return String(a.startTime || '').localeCompare(String(b.startTime || ''));
      })
      .slice(0, 3)
      .map((s) => ({
        id: s.id,
        title: s.title,
        activityType: s.activityType || 'Learning Session',
        date: toDateKey(s.date) || s.date,
        formattedDate: formatDateDisplay(s.date),
        startTime: s.startTime || '',
        endTime: s.endTime || '',
        formattedTime: formatTimeRange(s.startTime, s.endTime),
        learningCenter:
          s.learningCenter?.name ||
          teacherProfile.learningCenter?.name ||
          'Assigned Learning Center',
        learningCenterId: s.learningCenterId || teacherProfile.learningCenterId || null,
        alsLevel: resolveScheduleAlsLevel(s),
        status: s.status || 'Scheduled',
      }));

    // ==========================================
    // LEARNERS NEEDING ATTENTION (Strictly assigned learners)
    // ==========================================
    const nowTime = Date.now();
    const thirtyDaysAgoTime = nowTime - 30 * 24 * 60 * 60 * 1000;

    // Map attendance per assigned learner
    const attByLearner = new Map();
    for (const rec of attendanceRecords) {
      if (!rec.learnerId) continue;
      if (!attByLearner.has(rec.learnerId)) {
        attByLearner.set(rec.learnerId, { present: 0, total: 0, latestTime: 0 });
      }
      const st = attByLearner.get(rec.learnerId);
      st.total++;
      if (rec.status === 'PRESENT' || rec.status === 'LATE') {
        st.present++;
      }
      const recTime = rec.sessionDate
        ? new Date(rec.sessionDate).getTime()
        : rec.createdAt
        ? new Date(rec.createdAt).getTime()
        : 0;
      if (recTime > st.latestTime) st.latestTime = recTime;
    }

    // Map latest submission per assigned learner
    const latestSubByLearner = new Map();
    for (const sub of teacherSubmissionsRaw) {
      if (!sub.learnerId) continue;
      const t = sub.submittedAt ? new Date(sub.submittedAt).getTime() : 0;
      const prev = latestSubByLearner.get(sub.learnerId) || 0;
      if (t > prev) latestSubByLearner.set(sub.learnerId, t);
    }

    const lowAttendanceLearners = [];
    const delayedProgressLearners = [];
    const noRecentActivityLearners = [];
    const affectedLearnerIds = new Set();

    for (const l of learners) {
      const attSt = attByLearner.get(l.id);
      if (attSt && attSt.total > 0) {
        const rate = Math.round((attSt.present / attSt.total) * 100);
        if (rate < 75) {
          lowAttendanceLearners.push({
            id: l.id,
            fullName: l.fullName,
            level: formatAlsLevelName(l.level),
            attendanceRate: rate,
          });
          affectedLearnerIds.add(l.id);
        }
      }

      // Check delayed module progress only when supported by actual DB dueDate/dateEnded or NOT_MASTERED
      const progMap = new Map((l.progressRecords || []).map((p) => [p.moduleId, p]));
      let isDelayed = false;

      for (const assign of l.assignedModules || []) {
        const prog = progMap.get(assign.moduleId);
        const isDone = prog?.status === 'COMPLETED' || prog?.masteryStatus === 'MASTERED';
        if (!isDone && assign.dueDate) {
          const dueTime = new Date(assign.dueDate).getTime();
          if (!isNaN(dueTime) && dueTime < nowTime) {
            isDelayed = true;
            break;
          }
        }
      }

      if (!isDelayed) {
        for (const prog of l.progressRecords || []) {
          const isDone = prog.status === 'COMPLETED' || prog.masteryStatus === 'MASTERED';
          if (prog.masteryStatus === 'NOT_MASTERED') {
            isDelayed = true;
            break;
          }
          const mod = moduleById.get(prog.moduleId);
          if (!isDone && mod?.dateEnded) {
            const endTime = new Date(mod.dateEnded).getTime();
            if (!isNaN(endTime) && endTime < nowTime) {
              isDelayed = true;
              break;
            }
          }
        }
      }

      if (isDelayed) {
        delayedProgressLearners.push({
          id: l.id,
          fullName: l.fullName,
          level: formatAlsLevelName(l.level),
        });
        affectedLearnerIds.add(l.id);
      }

      // Check recent learning activity in the last 30 days
      const hasRecentAtt = Boolean(attSt && attSt.latestTime >= thirtyDaysAgoTime);
      const hasRecentProg = (l.progressRecords || []).some((p) => {
        const t = new Date(p.updatedAt || p.completedAt || p.createdAt || 0).getTime();
        return t >= thirtyDaysAgoTime;
      });
      const hasRecentAttmp = (l.attempts || []).some((att) => {
        const t = new Date(att.submittedAt || att.startedAt || 0).getTime();
        return t >= thirtyDaysAgoTime;
      });
      const hasRecentSub = (latestSubByLearner.get(l.id) || 0) >= thirtyDaysAgoTime;

      if (!hasRecentAtt && !hasRecentProg && !hasRecentAttmp && !hasRecentSub) {
        noRecentActivityLearners.push({
          id: l.id,
          fullName: l.fullName,
          level: formatAlsLevelName(l.level),
        });
        affectedLearnerIds.add(l.id);
      }
    }

    const totalTeacherIssues =
      lowAttendanceLearners.length +
      delayedProgressLearners.length +
      noRecentActivityLearners.length;

    const learnersNeedingAttention = {
      hasIssues: totalTeacherIssues > 0,
      totalIssues: totalTeacherIssues,
      totalAffectedLearners: affectedLearnerIds.size,
      lowAttendanceCount: lowAttendanceLearners.length,
      delayedProgressCount: delayedProgressLearners.length,
      noRecentActivityCount: noRecentActivityLearners.length,
      items: [
        {
          key: 'lowAttendance',
          label: 'Learners with low attendance',
          description: 'Assigned learners with attendance rate below 75%',
          count: lowAttendanceLearners.length,
          route: '/dashboard/learners',
          learners: lowAttendanceLearners.slice(0, 5),
        },
        {
          key: 'delayedProgress',
          label: 'Learners with delayed module progress',
          description: 'Assigned learners with past-due modules or unmastered assessments',
          count: delayedProgressLearners.length,
          route: '/dashboard/learners',
          learners: delayedProgressLearners.slice(0, 5),
        },
        {
          key: 'noRecentActivity',
          label: 'Learners with no recent learning activity',
          description: 'Assigned learners with no attendance, progress, or submissions in the last 30 days',
          count: noRecentActivityLearners.length,
          route: '/dashboard/learners',
          learners: noRecentActivityLearners.slice(0, 5),
        },
      ],
    };

    // ==========================================
    // RECENT LEARNER ACTIVITIES (Up to 5 recent activities from assigned learners)
    // ==========================================
    const learnerActivityEvents = [];

    for (const l of learners) {
      const alsLevelLabel = formatAlsLevelName(l.level);

      // 1. Module completion & module progress updates
      for (const prog of l.progressRecords || []) {
        const mod = moduleById.get(prog.moduleId);
        const modTitle = mod?.title || `Module #${prog.moduleId}`;
        const isDone = prog.status === 'COMPLETED' || prog.masteryStatus === 'MASTERED';
        const refDate = prog.completedAt || prog.updatedAt || prog.createdAt;
        if (!refDate) continue;
        const ts = new Date(refDate).getTime();

        if (isDone) {
          learnerActivityEvents.push({
            id: `prog_done_${prog.id}`,
            type: 'module_completed',
            learnerId: l.id,
            learnerName: l.fullName,
            description: `Completed module: ${modTitle}`,
            alsLevel: alsLevelLabel,
            dateTime: formatDateTimeDisplay(refDate),
            timestamp: ts,
          });
        } else if (prog.status === 'IN_PROGRESS' || (prog.completedPages || 0) > 0) {
          const pagesInfo =
            prog.totalPages > 0 ? ` (${prog.completedPages || 0}/${prog.totalPages} pages)` : '';
          learnerActivityEvents.push({
            id: `prog_upd_${prog.id}`,
            type: 'progress_updated',
            learnerId: l.id,
            learnerName: l.fullName,
            description: `Module progress updated: ${modTitle}${pagesInfo}`,
            alsLevel: alsLevelLabel,
            dateTime: formatDateTimeDisplay(refDate),
            timestamp: ts,
          });
        }
      }

      // 2. Assessment attempts submitted
      for (const att of l.attempts || []) {
        const refDate = att.submittedAt || att.startedAt;
        if (!refDate) continue;
        const ts = new Date(refDate).getTime();
        const assTitle =
          att.assessment?.title ||
          (att.assessment?.type === 'POST_TEST' ? 'Post-Test' : 'Pre-Test');
        const modTitle = att.assessment?.module?.title
          ? ` (${att.assessment.module.title})`
          : '';
        learnerActivityEvents.push({
          id: `attmp_${att.id}`,
          type: 'assessment_submitted',
          learnerId: l.id,
          learnerName: l.fullName,
          description: `Submitted assessment: ${assTitle}${modTitle}`,
          alsLevel: alsLevelLabel,
          dateTime: formatDateTimeDisplay(refDate),
          timestamp: ts,
        });
      }
    }

    // 3. Learner activity submissions
    for (const sub of teacherSubmissionsRaw) {
      if (!sub.learnerId || !filteredLearnerIds.has(sub.learnerId)) continue;
      const refDate = sub.submittedAt || sub.updatedAt;
      if (!refDate) continue;
      const ts = new Date(refDate).getTime();
      const modTitle = sub.module?.title ? ` in ${sub.module.title}` : '';
      learnerActivityEvents.push({
        id: `sub_${sub.id}`,
        type: 'activity_submitted',
        learnerId: sub.learnerId,
        learnerName: sub.learner?.fullName || 'Assigned Learner',
        description: `Submitted activity: ${sub.title}${modTitle}`,
        alsLevel: formatAlsLevelName(sub.learner?.level),
        dateTime: formatDateTimeDisplay(refDate),
        timestamp: ts,
      });
    }

    // 4. Attendance recorded for assigned learners
    for (const rec of attendanceRecords.slice(0, 15)) {
      const refDate = rec.createdAt || rec.sessionDate;
      if (!refDate) continue;
      const ts = new Date(refDate).getTime();
      const statusText =
        rec.status === 'PRESENT' ? 'Present' : rec.status === 'LATE' ? 'Late' : 'Absent';
      const sessionDay = formatDateDisplay(rec.sessionDate || refDate);
      learnerActivityEvents.push({
        id: `att_lrn_${rec.id}`,
        type: 'attendance_recorded',
        learnerId: rec.learnerId,
        learnerName: rec.learner?.fullName || 'Assigned Learner',
        description: `Attendance recorded (${statusText}) for ${sessionDay} session`,
        alsLevel: formatAlsLevelName(rec.learner?.level),
        dateTime: formatDateTimeDisplay(refDate),
        timestamp: ts,
      });
    }

    learnerActivityEvents.sort((a, b) => b.timestamp - a.timestamp);
    const recentLearnerActivities = learnerActivityEvents.slice(0, 5);

    res.json({
      teacher: {
        id: teacherProfile.id,
        fullName: teacherProfile.fullName,
        position: teacherProfile.position || 'ALS Teacher',
        specialization: teacherProfile.specialization || 'Both',
        handledLevels: handledLevelsDisplay,
        assignedCenters: authorizedCenters,
      },
      filterOptions: {
        schoolYears: availableSchoolYears,
        levels: ['A&E Elementary', 'A&E Junior High'],
        learningCenters: authorizedCenters,
        hasMultipleCenters: authorizedCenters.length > 1,
      },
      activeFilters: {
        schoolYear: trimmedSy || '',
        level: parsedLevelKey ? formatAlsLevelName(parsedLevelKey) : '',
        learningCenterId: parsedCenterId || '',
      },
      summary: {
        totalLearners,
        elementaryLearners: elementaryCount,
        juniorHighLearners: juniorCount,
        averageAttendanceRate,
        totalAttendanceRecords: totalAttendanceCount,
        presentAttendanceRecords: totalPresentCount,
        totalSessions: distinctSessionsTotal,
      },
      announcements: teacherAnnouncements,
      upcomingSchedules,
      learnerDistribution: learnersByLevel,
      learnersByLevel,
      sexDistributionByLevel,
      moduleCompletionByLevel,
      learnerProgressByLevel,
      attendanceTrend,
      learnersNeedingAttention,
      recentLearnerActivities,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

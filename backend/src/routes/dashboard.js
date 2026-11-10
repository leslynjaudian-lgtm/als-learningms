import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { readTeacherActivities } from '../utils/teacherActivityLogger.js';

const router = Router();
const AF2_FILE = path.resolve(process.cwd(), 'data', 'af2_records.json');

function readAf2RecordsSafe() {
  try {
    if (fs.existsSync(AF2_FILE)) {
      const raw = fs.readFileSync(AF2_FILE, 'utf8');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('[dashboard] Failed to read AF2 records:', err.message);
  }
  return [];
}

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
      allSubmissions,
    ] = await Promise.all([
      prisma.learningCenter
        .findMany({
          include: {
            teachers: {
              select: { id: true, fullName: true, position: true, specialization: true },
            },
            learners: {
              select: { id: true, fullName: true, level: true, status: true },
            },
            attendanceLogs: {
              select: { id: true, status: true, sessionDate: true, createdAt: true },
            },
          },
          orderBy: { name: 'asc' },
        })
        .catch((err) => {
          console.error('[Admin Dashboard Query Error] prisma.learningCenter.findMany:', err.message);
          throw err;
        }),
      prisma.teacher
        .findMany({
          select: {
            id: true,
            fullName: true,
            position: true,
            specialization: true,
            learningCenterId: true,
            createdAt: true,
            updatedAt: true,
            learningCenter: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
        .catch((err) => {
          console.error('[Admin Dashboard Query Error] prisma.teacher.findMany:', err.message);
          throw err;
        }),
      prisma.learner
        .findMany({
          include: {
            learningCenter: { select: { id: true, name: true } },
            assignedTeacher: { select: { id: true, fullName: true } },
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
        })
        .catch((err) => {
          console.error('[Admin Dashboard Query Error] prisma.learner.findMany:', err.message);
          throw err;
        }),
      prisma.module
        .findMany({
          where: { status: 'PUBLISHED' },
          include: {
            teacher: { select: { id: true, fullName: true } },
            learningCenter: { select: { id: true, name: true } },
            learningArea: { select: { id: true, code: true, name: true } },
            assignments: { select: { learnerId: true, dueDate: true } },
            assessments: { select: { id: true, type: true } },
          },
        })
        .catch((err) => {
          console.error('[Admin Dashboard Query Error] prisma.module.findMany:', err.message);
          throw err;
        }),
      prisma.attendance
        .findMany({
          include: {
            learner: { select: { id: true, fullName: true, lrn: true, level: true, learningCenterId: true } },
            learningCenter: { select: { id: true, name: true } },
            recordedBy: { select: { id: true, fullName: true } },
          },
          orderBy: { sessionDate: 'desc' },
        })
        .catch((err) => {
          console.error('[Admin Dashboard Query Error] prisma.attendance.findMany:', err.message);
          throw err;
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
      prisma.submission
        .findMany({
          include: {
            learner: {
              select: {
                id: true,
                fullName: true,
                level: true,
                learningCenterId: true,
                learningCenter: { select: { id: true, name: true } },
              },
            },
            module: {
              select: {
                id: true,
                code: true,
                title: true,
                targetLevel: true,
                status: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        })
        .catch((err) => {
          console.error('Admin dashboard submissions query warning:', err.message);
          return [];
        }),
    ]);

    const af2RecordsAll = readAf2RecordsSafe();
    const teacherActivityLogs = readTeacherActivities();

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
    // Follows the 5 system module status categories:
    // - Recorded: Mastered, Not Mastered
    // - Pending: Not Recorded, In Progress, Overdue
    // ==========================================
    const moduleById = new Map(allModules.map((m) => [Number(m.id), m]));
    const nowTime = Date.now();
    const thirtyDaysAgoTime = nowTime - 30 * 24 * 60 * 60 * 1000;

    // Group learner submissions by learnerId -> moduleId
    const submissionsByLearnerMod = new Map();
    for (const sub of Array.isArray(allSubmissions) ? allSubmissions : []) {
      if (!sub.learnerId || !sub.moduleId) continue;
      const key = `${sub.learnerId}_${sub.moduleId}`;
      if (!submissionsByLearnerMod.has(key)) {
        submissionsByLearnerMod.set(key, []);
      }
      submissionsByLearnerMod.get(key).push(sub);
    }

    const moduleStats = {
      ELEMENTARY: {
        mastered: 0,
        notMastered: 0,
        recorded: 0,
        notRecorded: 0,
        inProgress: 0,
        overdue: 0,
        pending: 0,
        totalModules: 0,
        learnersCount: 0,
        learnersWithModulesCount: 0,
        learnerProgressSum: 0,
        completedLearnersCount: 0,
        inProgressLearnersCount: 0,
        notStartedLearnersCount: 0,
      },
      JUNIOR: {
        mastered: 0,
        notMastered: 0,
        recorded: 0,
        notRecorded: 0,
        inProgress: 0,
        overdue: 0,
        pending: 0,
        totalModules: 0,
        learnersCount: 0,
        learnersWithModulesCount: 0,
        learnerProgressSum: 0,
        completedLearnersCount: 0,
        inProgressLearnersCount: 0,
        notStartedLearnersCount: 0,
      },
    };

    // Store per-learner module summary for Learning Centers Needing Attention & modal details
    const learnerModuleSummaryMap = new Map();

    for (const learner of learners) {
      const lvlKey = normalizeLevelKey(learner.level);
      const bucket = moduleStats[lvlKey];
      bucket.learnersCount++;

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

      // Map learner's progress records by moduleId
      const progressByModule = new Map();
      if (Array.isArray(learner.progressRecords)) {
        for (const prog of learner.progressRecords) {
          if (!prog.moduleId) continue;
          if (trimmedSy) {
            const progSy = getSchoolYearForDate(prog.completedAt || prog.updatedAt || prog.createdAt);
            if (progSy && progSy !== trimmedSy) continue;
          }
          progressByModule.set(Number(prog.moduleId), prog);
        }
      }

      // Map explicit module assignments by moduleId
      const assignmentByModule = new Map();
      if (Array.isArray(learner.assignedModules)) {
        for (const assign of learner.assignedModules) {
          if (!assign.moduleId) continue;
          if (trimmedSy) {
            const assignSy = getSchoolYearForDate(assign.assignedAt);
            if (assignSy && assignSy !== trimmedSy && !progressByModule.has(Number(assign.moduleId))) {
              continue;
            }
          }
          assignmentByModule.set(Number(assign.moduleId), assign);
        }
      }

      // Deduplicated map of modules for this learner (never count the same module twice)
      const learnerModulesMap = new Map();
      const seenModuleKeys = new Set();

      // 1. Saved AF2 records for this learner
      const learnerAf2Records = af2RecordsAll.filter((r) => {
        const rLid = r.learnerId != null ? Number(r.learnerId) : null;
        if (rLid && rLid === learner.id) return true;
        if (r.lrn && learner.lrn && String(r.lrn).trim() === String(learner.lrn).trim()) return true;
        if (
          !rLid &&
          !r.lrn &&
          r.learnerName &&
          learner.fullName &&
          r.learnerName.trim().toLowerCase() === learner.fullName.trim().toLowerCase()
        ) {
          return true;
        }
        return false;
      });

      for (const r of learnerAf2Records) {
        if (trimmedSy) {
          const rDate = r.dateFinished || r.dateCompleted || r.dateStarted || r.createdAt;
          const rSy = getSchoolYearForDate(rDate);
          if (rSy && rSy !== trimmedSy) continue;
        }

        const modIdNum = r.moduleId != null ? Number(r.moduleId) : null;
        const matchedMod = modIdNum ? moduleById.get(modIdNum) : null;
        const titleStr = String(r.moduleTitle || matchedMod?.title || 'Learning Module').trim();
        const normTitle = titleStr.toLowerCase();
        const idKey = modIdNum ? `id_${modIdNum}` : `af2_${r.id || normTitle}`;

        if (seenModuleKeys.has(idKey) || (normTitle && seenModuleKeys.has(`title_${normTitle}`))) {
          continue;
        }
        seenModuleKeys.add(idKey);
        if (normTitle) seenModuleKeys.add(`title_${normTitle}`);

        const isMastered = r.assessment === 'Mastered' || r.moduleStatus === 'Mastered';
        const isNotMastered = r.assessment === 'Not Mastered' || r.moduleStatus === 'Not Mastered';

        const assignObj = modIdNum ? assignmentByModule.get(modIdNum) : null;
        const progObj = modIdNum ? progressByModule.get(modIdNum) : null;
        const dueRaw = r.dueDate || assignObj?.dueDate || matchedMod?.dateEnded || null;
        const dueMs = dueRaw ? new Date(dueRaw).getTime() : null;
        const isOverdue = !isMastered && !isNotMastered && Boolean(dueMs && !isNaN(dueMs) && dueMs < nowTime);

        const hasStarted = Boolean(
          r.dateStarted ||
            (r.preTestScore != null && r.preTestScore !== '') ||
            (r.moduleStatus && String(r.moduleStatus).toLowerCase().includes('progress')) ||
            (progObj &&
              (progObj.status === 'IN_PROGRESS' ||
                (progObj.completedPages || 0) > 0 ||
                progObj.preTestScore != null))
        );

        let status = 'Not Recorded';
        if (isMastered) {
          status = 'Mastered';
        } else if (isNotMastered) {
          status = 'Not Mastered';
        } else if (isOverdue) {
          status = 'Overdue';
        } else if (hasStarted) {
          status = 'In Progress';
        } else {
          status = 'Not Recorded';
        }

        learnerModulesMap.set(idKey, {
          moduleId: modIdNum || r.id,
          code: r.moduleCode || matchedMod?.code || matchedMod?.learningArea?.code || '',
          title: titleStr,
          strand: r.strandName || matchedMod?.learningArea?.name || 'General',
          status,
          category: status === 'Mastered' || status === 'Not Mastered' ? 'Recorded' : 'Pending',
          dueDate: dueRaw ? formatDateDisplay(dueRaw) : null,
          isOverdue: status === 'Overdue',
          isDelayed: status === 'Overdue' || status === 'Not Mastered',
          delayReason:
            status === 'Overdue'
              ? `Overdue${dueRaw ? ` (Due ${formatDateDisplay(dueRaw)})` : ''}`
              : status === 'Not Mastered'
              ? 'Not Mastered'
              : null,
          updatedAt: r.dateFinished || r.dateCompleted || r.updatedAt || r.createdAt || null,
        });
      }

      // 2. Explicit module assignments and learner progress records in database (if not already in AF2 records)
      const candidateModIds = new Set([
        ...assignmentByModule.keys(),
        ...progressByModule.keys(),
      ]);

      for (const sub of Array.isArray(allSubmissions) ? allSubmissions : []) {
        if (sub.learnerId === learner.id && sub.moduleId) {
          candidateModIds.add(Number(sub.moduleId));
        }
      }

      for (const modId of candidateModIds) {
        const mod = moduleById.get(Number(modId));
        const assignObj = assignmentByModule.get(Number(modId));
        const progObj = progressByModule.get(Number(modId));
        const titleStr = String(mod?.title || `Module #${modId}`).trim();
        const normTitle = titleStr.toLowerCase();
        const idKey = `id_${modId}`;

        if (seenModuleKeys.has(idKey) || (normTitle && seenModuleKeys.has(`title_${normTitle}`))) {
          continue;
        }
        seenModuleKeys.add(idKey);
        if (normTitle) seenModuleKeys.add(`title_${normTitle}`);

        const preAss = mod?.assessments?.find((a) => a.type === 'PRE_TEST');
        const postAss = mod?.assessments?.find((a) => a.type === 'POST_TEST');
        const preAtt = preAss ? attemptsByAssessment.get(preAss.id) : null;
        const postAtt = postAss ? attemptsByAssessment.get(postAss.id) : null;
        const learnerSubs = submissionsByLearnerMod.get(`${learner.id}_${modId}`) || [];

        const isMastered =
          progObj?.masteryStatus === 'MASTERED' ||
          progObj?.status === 'COMPLETED' ||
          Boolean(postAtt?.isPassed);
        const isNotMastered = !isMastered && progObj?.masteryStatus === 'NOT_MASTERED';

        const dueRaw = assignObj?.dueDate || mod?.dateEnded || null;
        const dueMs = dueRaw ? new Date(dueRaw).getTime() : null;
        const isOverdue = !isMastered && !isNotMastered && Boolean(dueMs && !isNaN(dueMs) && dueMs < nowTime);

        const hasStarted =
          !isMastered &&
          !isNotMastered &&
          Boolean(
            progObj?.status === 'IN_PROGRESS' ||
              (progObj?.completedPages || 0) > 0 ||
              progObj?.preTestScore != null ||
              progObj?.postTestScore != null ||
              preAtt ||
              postAtt ||
              learnerSubs.length > 0
          );

        let status = 'Not Recorded';
        if (isMastered) {
          status = 'Mastered';
        } else if (isNotMastered) {
          status = 'Not Mastered';
        } else if (isOverdue) {
          status = 'Overdue';
        } else if (hasStarted) {
          status = 'In Progress';
        } else {
          status = 'Not Recorded';
        }

        learnerModulesMap.set(idKey, {
          moduleId: modId,
          code: mod?.code || mod?.learningArea?.code || '',
          title: titleStr,
          strand: mod?.learningArea?.name || 'General',
          status,
          category: status === 'Mastered' || status === 'Not Mastered' ? 'Recorded' : 'Pending',
          dueDate: dueRaw ? formatDateDisplay(dueRaw) : null,
          isOverdue: status === 'Overdue',
          isDelayed: status === 'Overdue' || status === 'Not Mastered',
          delayReason:
            status === 'Overdue'
              ? `Overdue${dueRaw ? ` (Due ${formatDateDisplay(dueRaw)})` : ''}`
              : status === 'Not Mastered'
              ? 'Not Mastered'
              : null,
          updatedAt: progObj?.updatedAt || progObj?.completedAt || progObj?.createdAt || assignObj?.assignedAt || null,
        });
      }

      const learnerModules = Array.from(learnerModulesMap.values());
      let lMastered = 0;
      let lNotMastered = 0;
      let lNotRecorded = 0;
      let lInProgress = 0;
      let lOverdue = 0;

      for (const m of learnerModules) {
        if (m.status === 'Mastered') {
          lMastered++;
          bucket.mastered++;
        } else if (m.status === 'Not Mastered') {
          lNotMastered++;
          bucket.notMastered++;
        } else if (m.status === 'Overdue') {
          lOverdue++;
          bucket.overdue++;
        } else if (m.status === 'In Progress') {
          lInProgress++;
          bucket.inProgress++;
        } else {
          lNotRecorded++;
          bucket.notRecorded++;
        }
      }

      const lRecorded = lMastered + lNotMastered;
      const lPending = lNotRecorded + lInProgress + lOverdue;
      const lTotal = lRecorded + lPending;

      bucket.recorded += lRecorded;
      bucket.pending += lPending;
      bucket.totalModules += lTotal;

      // Progress calculation consistent with Summary of Module Use and Learner's Progress:
      // Overall Progress = (Recorded / Total Modules) * 100
      const learnerProgressPct = lTotal > 0 ? Math.round((lRecorded / lTotal) * 100) : 0;
      bucket.learnerProgressSum += learnerProgressPct;
      if (lTotal > 0) {
        bucket.learnersWithModulesCount++;
      }

      if (lTotal > 0 && lRecorded === lTotal) {
        bucket.completedLearnersCount++;
      } else if (lRecorded > 0 || lInProgress > 0 || lOverdue > 0) {
        bucket.inProgressLearnersCount++;
      } else {
        bucket.notStartedLearnersCount++;
      }

      learnerModuleSummaryMap.set(learner.id, {
        learnerId: learner.id,
        fullName: learner.fullName,
        lrn: learner.lrn || '',
        level: formatAlsLevelName(learner.level),
        learningCenterId: learner.learningCenterId,
        learningCenter: learner.learningCenter?.name || 'Unassigned',
        mastered: lMastered,
        notMastered: lNotMastered,
        recorded: lRecorded,
        notRecorded: lNotRecorded,
        inProgress: lInProgress,
        overdue: lOverdue,
        pending: lPending,
        totalModules: lTotal,
        progressPct: learnerProgressPct,
        modules: learnerModules,
      });
    }

    const totalModulesAll = moduleStats.ELEMENTARY.totalModules + moduleStats.JUNIOR.totalModules;
    const totalRecordedAll = moduleStats.ELEMENTARY.recorded + moduleStats.JUNIOR.recorded;
    const totalMasteredAll = moduleStats.ELEMENTARY.mastered + moduleStats.JUNIOR.mastered;
    const totalNotMasteredAll = moduleStats.ELEMENTARY.notMastered + moduleStats.JUNIOR.notMastered;
    const totalPendingAll = moduleStats.ELEMENTARY.pending + moduleStats.JUNIOR.pending;
    const totalNotRecordedAll = moduleStats.ELEMENTARY.notRecorded + moduleStats.JUNIOR.notRecorded;
    const totalInProgressAll = moduleStats.ELEMENTARY.inProgress + moduleStats.JUNIOR.inProgress;
    const totalOverdueAll = moduleStats.ELEMENTARY.overdue + moduleStats.JUNIOR.overdue;

    const moduleCompletionByLevel = {
      unit: 'Modules',
      totalLearners,
      totalModules: totalModulesAll,
      totalRecorded: totalRecordedAll,
      totalMastered: totalMasteredAll,
      totalNotMastered: totalNotMasteredAll,
      totalPending: totalPendingAll,
      totalNotRecorded: totalNotRecordedAll,
      totalInProgress: totalInProgressAll,
      totalOverdue: totalOverdueAll,
      // Legacy aliases for backward compatibility
      totalCompleted: totalMasteredAll,
      totalNotStarted: totalNotRecordedAll,
      elementary: {
        label: 'A&E Elementary',
        learnersCount: moduleStats.ELEMENTARY.learnersCount,
        recorded: moduleStats.ELEMENTARY.recorded,
        mastered: moduleStats.ELEMENTARY.mastered,
        notMastered: moduleStats.ELEMENTARY.notMastered,
        pending: moduleStats.ELEMENTARY.pending,
        notRecorded: moduleStats.ELEMENTARY.notRecorded,
        inProgress: moduleStats.ELEMENTARY.inProgress,
        overdue: moduleStats.ELEMENTARY.overdue,
        totalModules: moduleStats.ELEMENTARY.totalModules,
        completed: moduleStats.ELEMENTARY.mastered,
        notStarted: moduleStats.ELEMENTARY.notRecorded,
        total: moduleStats.ELEMENTARY.totalModules,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        learnersCount: moduleStats.JUNIOR.learnersCount,
        recorded: moduleStats.JUNIOR.recorded,
        mastered: moduleStats.JUNIOR.mastered,
        notMastered: moduleStats.JUNIOR.notMastered,
        pending: moduleStats.JUNIOR.pending,
        notRecorded: moduleStats.JUNIOR.notRecorded,
        inProgress: moduleStats.JUNIOR.inProgress,
        overdue: moduleStats.JUNIOR.overdue,
        totalModules: moduleStats.JUNIOR.totalModules,
        completed: moduleStats.JUNIOR.mastered,
        notStarted: moduleStats.JUNIOR.notRecorded,
        total: moduleStats.JUNIOR.totalModules,
      },
      groups: [
        {
          key: 'elementary',
          label: 'A&E Elementary',
          learnersCount: moduleStats.ELEMENTARY.learnersCount,
          recorded: moduleStats.ELEMENTARY.recorded,
          mastered: moduleStats.ELEMENTARY.mastered,
          notMastered: moduleStats.ELEMENTARY.notMastered,
          pending: moduleStats.ELEMENTARY.pending,
          notRecorded: moduleStats.ELEMENTARY.notRecorded,
          inProgress: moduleStats.ELEMENTARY.inProgress,
          overdue: moduleStats.ELEMENTARY.overdue,
          totalModules: moduleStats.ELEMENTARY.totalModules,
          completed: moduleStats.ELEMENTARY.mastered,
          notStarted: moduleStats.ELEMENTARY.notRecorded,
          total: moduleStats.ELEMENTARY.totalModules,
        },
        {
          key: 'juniorHigh',
          label: 'A&E Junior High',
          learnersCount: moduleStats.JUNIOR.learnersCount,
          recorded: moduleStats.JUNIOR.recorded,
          mastered: moduleStats.JUNIOR.mastered,
          notMastered: moduleStats.JUNIOR.notMastered,
          pending: moduleStats.JUNIOR.pending,
          notRecorded: moduleStats.JUNIOR.notRecorded,
          inProgress: moduleStats.JUNIOR.inProgress,
          overdue: moduleStats.JUNIOR.overdue,
          totalModules: moduleStats.JUNIOR.totalModules,
          completed: moduleStats.JUNIOR.mastered,
          notStarted: moduleStats.JUNIOR.notRecorded,
          total: moduleStats.JUNIOR.totalModules,
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
        completedLearnersCount: moduleStats.ELEMENTARY.completedLearnersCount,
        inProgressLearnersCount: moduleStats.ELEMENTARY.inProgressLearnersCount,
        notStartedLearnersCount: moduleStats.ELEMENTARY.notStartedLearnersCount,
        assignedModulesCount: moduleStats.ELEMENTARY.totalModules,
        totalModulesCount: moduleStats.ELEMENTARY.totalModules,
        recordedModulesCount: moduleStats.ELEMENTARY.recorded,
        masteredModulesCount: moduleStats.ELEMENTARY.mastered,
        notMasteredModulesCount: moduleStats.ELEMENTARY.notMastered,
        pendingModulesCount: moduleStats.ELEMENTARY.pending,
        notRecordedModulesCount: moduleStats.ELEMENTARY.notRecorded,
        inProgressModulesCount: moduleStats.ELEMENTARY.inProgress,
        overdueModulesCount: moduleStats.ELEMENTARY.overdue,
        completedModulesCount: moduleStats.ELEMENTARY.mastered,
        notStartedModulesCount: moduleStats.ELEMENTARY.notRecorded,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        averageProgress: jhsAvgProgress,
        learnersCount: moduleStats.JUNIOR.learnersCount,
        completedLearnersCount: moduleStats.JUNIOR.completedLearnersCount,
        inProgressLearnersCount: moduleStats.JUNIOR.inProgressLearnersCount,
        notStartedLearnersCount: moduleStats.JUNIOR.notStartedLearnersCount,
        assignedModulesCount: moduleStats.JUNIOR.totalModules,
        totalModulesCount: moduleStats.JUNIOR.totalModules,
        recordedModulesCount: moduleStats.JUNIOR.recorded,
        masteredModulesCount: moduleStats.JUNIOR.mastered,
        notMasteredModulesCount: moduleStats.JUNIOR.notMastered,
        pendingModulesCount: moduleStats.JUNIOR.pending,
        notRecordedModulesCount: moduleStats.JUNIOR.notRecorded,
        inProgressModulesCount: moduleStats.JUNIOR.inProgress,
        overdueModulesCount: moduleStats.JUNIOR.overdue,
        completedModulesCount: moduleStats.JUNIOR.mastered,
        notStartedModulesCount: moduleStats.JUNIOR.notRecorded,
      },
      levels: [
        {
          key: 'elementary',
          label: 'A&E Elementary',
          subtitle: 'Average Learner Module Progress',
          percentage: elemAvgProgress,
          learnersCount: moduleStats.ELEMENTARY.learnersCount,
          completedLearnersCount: moduleStats.ELEMENTARY.completedLearnersCount,
          inProgressLearnersCount: moduleStats.ELEMENTARY.inProgressLearnersCount,
          notStartedLearnersCount: moduleStats.ELEMENTARY.notStartedLearnersCount,
          assignedModulesCount: moduleStats.ELEMENTARY.totalModules,
          totalModulesCount: moduleStats.ELEMENTARY.totalModules,
          recordedModulesCount: moduleStats.ELEMENTARY.recorded,
          masteredModulesCount: moduleStats.ELEMENTARY.mastered,
          notMasteredModulesCount: moduleStats.ELEMENTARY.notMastered,
          pendingModulesCount: moduleStats.ELEMENTARY.pending,
          notRecordedModulesCount: moduleStats.ELEMENTARY.notRecorded,
          inProgressModulesCount: moduleStats.ELEMENTARY.inProgress,
          overdueModulesCount: moduleStats.ELEMENTARY.overdue,
        },
        {
          key: 'juniorHigh',
          label: 'A&E Junior High',
          subtitle: 'Average Learner Module Progress',
          percentage: jhsAvgProgress,
          learnersCount: moduleStats.JUNIOR.learnersCount,
          completedLearnersCount: moduleStats.JUNIOR.completedLearnersCount,
          inProgressLearnersCount: moduleStats.JUNIOR.inProgressLearnersCount,
          notStartedLearnersCount: moduleStats.JUNIOR.notStartedLearnersCount,
          assignedModulesCount: moduleStats.JUNIOR.totalModules,
          totalModulesCount: moduleStats.JUNIOR.totalModules,
          recordedModulesCount: moduleStats.JUNIOR.recorded,
          masteredModulesCount: moduleStats.JUNIOR.mastered,
          notMasteredModulesCount: moduleStats.JUNIOR.notMastered,
          pendingModulesCount: moduleStats.JUNIOR.pending,
          notRecordedModulesCount: moduleStats.JUNIOR.notRecorded,
          inProgressModulesCount: moduleStats.JUNIOR.inProgress,
          overdueModulesCount: moduleStats.JUNIOR.overdue,
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
        const elemRate = elemHasRecords ? Math.round((b.elemPresent / b.elemTotal) * 100) : null;
        const jhsRate = jhsHasRecords ? Math.round((b.jhsPresent / b.jhsTotal) * 100) : null;

        return {
          month: b.label,
          key: b.key,
          hasRecords: b.total > 0,
          sessionsCount: b.sessionDates.size,
          presentRecords: b.present,
          absentRecords: b.absent,
          totalRecords: b.total,
          attendancePercentage: b.total > 0 ? Math.round((b.present / b.total) * 100) : null,
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
    // LEARNING CENTERS NEEDING ATTENTION (ROW 7)
    // Three monitoring categories side by side:
    // 1. Low Attendance (< 75% when sufficient attendance data exists)
    // 2. Delayed Module Progress (Overdue or Not Mastered module assignments)
    // 3. No Recent Learning Activity (No recorded activity in the last 30 days)
    // ==========================================
    const attByLearner = new Map();
    for (const rec of attendanceRecords) {
      if (!rec.learnerId) continue;
      if (!attByLearner.has(rec.learnerId)) {
        attByLearner.set(rec.learnerId, { present: 0, absent: 0, total: 0 });
      }
      const st = attByLearner.get(rec.learnerId);
      st.total++;
      if (rec.status === 'PRESENT' || rec.status === 'LATE') {
        st.present++;
      } else if (rec.status === 'ABSENT') {
        st.absent++;
      }
    }

    const lowAttendanceCenters = [];
    const delayedProgressCenters = [];
    const noRecentActivityCenters = [];
    const centersDetails = [];

    for (const clc of learningCenters) {
      const centerLearners = learners.filter((l) => l.learningCenterId === clc.id);
      const centerTeachers = clc.teachers.map((t) => t.fullName).filter(Boolean);
      const centerAttRecords = attendanceRecords.filter(
        (r) => (r.learningCenterId || r.learner?.learningCenterId) === clc.id
      );

      // 1. Center Attendance Evaluation (distinguish "Insufficient Data" vs "Low Attendance")
      const centerTotalAtt = centerAttRecords.length;
      const centerPresentAtt = centerAttRecords.filter(
        (r) => r.status === 'PRESENT' || r.status === 'LATE'
      ).length;
      const centerAbsentAtt = centerAttRecords.filter((r) => r.status === 'ABSENT').length;
      const centerSessionDates = new Set(
        centerAttRecords
          .map((r) => (r.sessionDate ? toDateKey(r.sessionDate) : null))
          .filter(Boolean)
      );

      const hasSufficientAttendanceData = centerTotalAtt > 0;
      const centerAttendanceRate = hasSufficientAttendanceData
        ? Math.round((centerPresentAtt / centerTotalAtt) * 100)
        : null;

      const centerLowAttLearners = [];
      const centerAllLearnerAttendance = [];
      for (const l of centerLearners) {
        const st = attByLearner.get(l.id);
        const lRate = st && st.total > 0 ? Math.round((st.present / st.total) * 100) : null;
        const lEntry = {
          id: l.id,
          fullName: l.fullName,
          lrn: l.lrn || '',
          level: formatAlsLevelName(l.level),
          presentCount: st?.present || 0,
          absentCount: st?.absent || 0,
          totalSessions: st?.total || 0,
          attendanceRate: lRate,
          hasRecords: Boolean(st && st.total > 0),
        };
        centerAllLearnerAttendance.push(lEntry);
        if (st && st.total > 0 && lRate < 75) {
          centerLowAttLearners.push(lEntry);
        }
      }

      // Only flag for Low Attendance when attendance records exist AND center rate < 75% (or learners have < 75%)
      if (
        hasSufficientAttendanceData &&
        (centerAttendanceRate < 75 || centerLowAttLearners.length > 0)
      ) {
        lowAttendanceCenters.push({
          id: clc.id,
          name: clc.name,
          code: clc.code || '',
          barangay: clc.barangay || '',
          municipality: clc.municipality || 'Naawan',
          assignedTeachers: centerTeachers.length > 0 ? centerTeachers.join(', ') : 'Unassigned',
          attendanceRate: centerAttendanceRate,
          attendanceStatus: 'Low Attendance',
          affectedLearnersCount:
            centerLowAttLearners.length > 0 ? centerLowAttLearners.length : centerLearners.length,
          totalLearnersCount: centerLearners.length,
          totalSessions: centerSessionDates.size,
          presentRecords: centerPresentAtt,
          absentRecords: centerAbsentAtt,
          totalRecords: centerTotalAtt,
          affectedLearners: centerLowAttLearners,
        });
      }

      // 2. Center Delayed Module Progress Evaluation
      const centerDelayedLearners = [];
      let centerOverdueModulesCount = 0;
      let centerStrictOverdueCount = 0;
      let centerNotMasteredCount = 0;
      const centerLearnerModuleSummaries = [];

      for (const l of centerLearners) {
        const summary = learnerModuleSummaryMap.get(l.id);
        if (!summary) continue;
        centerLearnerModuleSummaries.push(summary);

        const delayedMods = (summary.modules || []).filter((m) => m.isDelayed);
        if (delayedMods.length > 0) {
          centerOverdueModulesCount += delayedMods.length;
          centerStrictOverdueCount += summary.overdue || 0;
          centerNotMasteredCount += summary.notMastered || 0;
          centerDelayedLearners.push({
            id: l.id,
            fullName: l.fullName,
            lrn: l.lrn || '',
            level: summary.level,
            overdueCount: summary.overdue || 0,
            notMasteredCount: summary.notMastered || 0,
            delayedCount: delayedMods.length,
            totalModules: summary.totalModules || 0,
            progressPct: summary.progressPct || 0,
            delayedModules: delayedMods,
          });
        }
      }

      if (centerDelayedLearners.length > 0 && centerOverdueModulesCount > 0) {
        delayedProgressCenters.push({
          id: clc.id,
          name: clc.name,
          code: clc.code || '',
          barangay: clc.barangay || '',
          municipality: clc.municipality || 'Naawan',
          assignedTeachers: centerTeachers.length > 0 ? centerTeachers.join(', ') : 'Unassigned',
          affectedLearnersCount: centerDelayedLearners.length,
          overdueModulesCount: centerOverdueModulesCount,
          strictOverdueCount: centerStrictOverdueCount,
          notMasteredCount: centerNotMasteredCount,
          totalLearnersCount: centerLearners.length,
          affectedLearners: centerDelayedLearners,
        });
      }

      // 3. Center Recent Learning Activity Evaluation (within last 30 days)
      let latestActivityTs = 0;
      let latestActivityLabel = 'No recorded learning activity';
      const centerActivityEvents = [];

      for (const att of clc.attendanceLogs || []) {
        const ts = att.sessionDate ? new Date(att.sessionDate).getTime() : 0;
        if (!isNaN(ts) && ts > 0) {
          if (ts > latestActivityTs) {
            latestActivityTs = ts;
            latestActivityLabel = `Attendance session (${formatDateDisplay(att.sessionDate)})`;
          }
          centerActivityEvents.push({
            type: 'Attendance Session',
            description: `Attendance recorded (${att.status})`,
            date: formatDateDisplay(att.sessionDate),
            timestamp: ts,
          });
        }
      }

      for (const mod of allModules) {
        if (mod.learningCenterId !== clc.id) continue;
        const ts = mod.createdAt ? new Date(mod.createdAt).getTime() : 0;
        if (!isNaN(ts) && ts > 0) {
          if (ts > latestActivityTs) {
            latestActivityTs = ts;
            latestActivityLabel = `Module published: ${mod.title} (${formatDateDisplay(mod.createdAt)})`;
          }
          centerActivityEvents.push({
            type: 'Module Published',
            description: mod.title,
            date: formatDateDisplay(mod.createdAt),
            timestamp: ts,
          });
        }
      }

      for (const l of centerLearners) {
        for (const p of l.progressRecords || []) {
          const rawDt = p.updatedAt || p.completedAt || p.createdAt;
          const ts = rawDt ? new Date(rawDt).getTime() : 0;
          if (!isNaN(ts) && ts > 0) {
            if (ts > latestActivityTs) {
              latestActivityTs = ts;
              latestActivityLabel = `Module progress by ${l.fullName} (${formatDateDisplay(rawDt)})`;
            }
            centerActivityEvents.push({
              type: 'Module Progress',
              description: `${l.fullName} updated module progress`,
              date: formatDateDisplay(rawDt),
              timestamp: ts,
            });
          }
        }
        for (const att of l.attempts || []) {
          const rawDt = att.submittedAt || att.startedAt;
          const ts = rawDt ? new Date(rawDt).getTime() : 0;
          if (!isNaN(ts) && ts > 0) {
            if (ts > latestActivityTs) {
              latestActivityTs = ts;
              latestActivityLabel = `Assessment attempt by ${l.fullName} (${formatDateDisplay(rawDt)})`;
            }
            centerActivityEvents.push({
              type: 'Assessment Attempt',
              description: `${l.fullName} submitted assessment`,
              date: formatDateDisplay(rawDt),
              timestamp: ts,
            });
          }
        }
      }

      for (const sub of Array.isArray(allSubmissions) ? allSubmissions : []) {
        if (sub.learner?.learningCenterId !== clc.id) continue;
        const rawDt = sub.submittedAt || sub.updatedAt;
        const ts = rawDt ? new Date(rawDt).getTime() : 0;
        if (!isNaN(ts) && ts > 0) {
          if (ts > latestActivityTs) {
            latestActivityTs = ts;
            latestActivityLabel = `Activity submitted by ${sub.learner?.fullName || 'Learner'} (${formatDateDisplay(rawDt)})`;
          }
          centerActivityEvents.push({
            type: 'Activity Submission',
            description: `${sub.learner?.fullName || 'Learner'} submitted "${sub.title || sub.module?.title || 'Activity'}"`,
            date: formatDateDisplay(rawDt),
            timestamp: ts,
          });
        }
      }

      for (const r of af2RecordsAll) {
        if (
          String(r.learningCenter || '').trim().toLowerCase() !==
          String(clc.name || '').trim().toLowerCase()
        ) {
          continue;
        }
        const rawDt = r.updatedAt || r.createdAt || r.dateFinished || r.dateStarted;
        const ts = rawDt ? new Date(rawDt).getTime() : 0;
        if (!isNaN(ts) && ts > 0) {
          if (ts > latestActivityTs) {
            latestActivityTs = ts;
            latestActivityLabel = `Module assessment recorded for ${r.learnerName || 'Learner'} (${formatDateDisplay(rawDt)})`;
          }
          centerActivityEvents.push({
            type: 'Assessment Recorded',
            description: `${r.moduleTitle || 'Module'} (${r.assessment || 'Recorded'}) — ${r.learnerName || 'Learner'}`,
            date: formatDateDisplay(rawDt),
            timestamp: ts,
          });
        }
      }

      centerActivityEvents.sort((a, b) => b.timestamp - a.timestamp);

      const hasRecentLearningActivity = latestActivityTs >= thirtyDaysAgoTime;
      if (!hasRecentLearningActivity) {
        noRecentActivityCenters.push({
          id: clc.id,
          name: clc.name,
          code: clc.code || '',
          barangay: clc.barangay || '',
          municipality: clc.municipality || 'Naawan',
          assignedTeachers: centerTeachers.length > 0 ? centerTeachers.join(', ') : 'Unassigned',
          lastActivityDate:
            latestActivityTs > 0 ? formatDateDisplay(new Date(latestActivityTs)) : 'No recorded activity',
          lastActivityLabel: latestActivityLabel,
          hasPriorActivity: latestActivityTs > 0,
          affectedLearnersCount: centerLearners.length,
          totalLearnersCount: centerLearners.length,
          recentEvents: centerActivityEvents.slice(0, 5),
        });
      }

      centersDetails.push({
        id: clc.id,
        name: clc.name,
        code: clc.code || '',
        barangay: clc.barangay || '',
        municipality: clc.municipality || 'Naawan',
        address:
          clc.locationAddress ||
          clc.address ||
          (clc.barangay ? `Brgy. ${clc.barangay}, ${clc.municipality || 'Naawan'}` : 'Naawan, Misamis Oriental'),
        status: clc.status || 'Active',
        assignedTeachers: centerTeachers.length > 0 ? centerTeachers.join(', ') : 'Unassigned',
        teachersList: clc.teachers || [],
        totalLearnersCount: centerLearners.length,
        hasSufficientAttendanceData,
        attendanceStatus: !hasSufficientAttendanceData
          ? 'Insufficient Data'
          : centerAttendanceRate < 75
          ? 'Low Attendance'
          : 'Normal',
        attendanceRate: centerAttendanceRate,
        totalSessions: centerSessionDates.size,
        presentRecords: centerPresentAtt,
        absentRecords: centerAbsentAtt,
        totalAttendanceRecords: centerTotalAtt,
        lowAttendanceLearners: centerLowAttLearners,
        allLearnerAttendance: centerAllLearnerAttendance,
        delayedLearnersCount: centerDelayedLearners.length,
        overdueModulesCount: centerOverdueModulesCount,
        strictOverdueCount: centerStrictOverdueCount,
        notMasteredCount: centerNotMasteredCount,
        delayedLearners: centerDelayedLearners,
        learnerModuleSummaries: centerLearnerModuleSummaries,
        hasRecentLearningActivity,
        lastActivityDate:
          latestActivityTs > 0 ? formatDateDisplay(new Date(latestActivityTs)) : 'No recorded activity',
        lastActivityLabel: latestActivityLabel,
        recentEvents: centerActivityEvents.slice(0, 8),
      });
    }

    const totalCentersNeedingAttention =
      lowAttendanceCenters.length + delayedProgressCenters.length + noRecentActivityCenters.length;

    const learningCentersNeedingAttention = {
      hasIssues: totalCentersNeedingAttention > 0,
      totalIssues: totalCentersNeedingAttention,
      lowAttendanceCount: lowAttendanceCenters.length,
      delayedProgressCount: delayedProgressCenters.length,
      noRecentActivityCount: noRecentActivityCenters.length,
      lowAttendanceCenters,
      delayedProgressCenters,
      noRecentActivityCenters,
      centersDetails,
      categories: [
        {
          key: 'lowAttendance',
          title: 'Low Attendance',
          subtitle: 'Learning Centers with attendance rates below 75%',
          count: lowAttendanceCenters.length,
          buttonLabel: 'View Attendance',
          centers: lowAttendanceCenters,
        },
        {
          key: 'delayedProgress',
          title: 'Delayed Module Progress',
          subtitle: 'Learning Centers with overdue or unmastered module assignments',
          count: delayedProgressCenters.length,
          buttonLabel: 'View Module Progress',
          centers: delayedProgressCenters,
        },
        {
          key: 'noRecentActivity',
          title: 'No Recent Learning Activity',
          subtitle: 'Learning Centers with no recorded learning activity in the last 30 days',
          count: noRecentActivityCenters.length,
          buttonLabel: 'View Details',
          centers: noRecentActivityCenters,
        },
      ],
    };

    const needsAttention = {
      hasIssues: totalCentersNeedingAttention > 0,
      totalIssues: totalCentersNeedingAttention,
      lowAttendanceCount: lowAttendanceCenters.length,
      delayedProgressCount: delayedProgressCenters.length,
      inactiveCentersCount: noRecentActivityCenters.length,
      noRecentActivityCount: noRecentActivityCenters.length,
      lowAttendanceCenters,
      delayedProgressCenters,
      noRecentActivityCenters,
      centersDetails,
      items: learningCentersNeedingAttention.categories,
    };

    // ==========================================
    // RECENT SYSTEM ACTIVITIES (ROW 8)
    // Latest 5 real activities from Admins, ALS Teachers, and Learners across the district
    // ==========================================
    const activities = [];

    // 1. Learner registered
    for (const l of learners.slice(0, 8)) {
      const rawDt = l.createdAt || l.dateRegistered;
      const ts = rawDt ? new Date(rawDt).getTime() : 0;
      if (!ts || isNaN(ts)) continue;
      const contextParts = [
        l.learningCenter?.name || null,
        formatAlsLevelName(l.level),
      ].filter(Boolean);
      activities.push({
        id: `lrn_${l.id}`,
        type: 'learner',
        userName: l.fullName,
        userRole: 'Learner',
        description: `Registered as an ALS learner in ${formatAlsLevelName(l.level)}`,
        learningCenter: l.learningCenter?.name || null,
        alsLevel: formatAlsLevelName(l.level),
        entity: contextParts.join(' • '),
        dateTime: formatDateTimeDisplay(rawDt),
        timestamp: ts,
      });
    }

    // 2. Teacher assigned to a Learning Center
    for (const t of teachers.slice(0, 8)) {
      const rawDt = t.updatedAt || t.createdAt;
      const ts = rawDt ? new Date(rawDt).getTime() : 0;
      if (!ts || isNaN(ts)) continue;
      const centerName = t.learningCenter?.name || 'Naawan District';
      activities.push({
        id: `tch_${t.id}`,
        type: 'teacher',
        userName: t.fullName,
        userRole: 'ALS Teacher',
        description: t.learningCenter?.name
          ? `Assigned as ${t.position || 'ALS Teacher'} at ${t.learningCenter.name}`
          : `Registered as ${t.position || 'ALS Teacher'}`,
        learningCenter: centerName,
        alsLevel: t.specialization ? formatAlsLevelName(t.specialization) : null,
        entity: centerName,
        dateTime: formatDateTimeDisplay(rawDt),
        timestamp: ts,
      });
    }

    // 3. Module uploaded or published
    for (const mod of allModules.slice(0, 8)) {
      if (parsedCenterId && mod.learningCenterId && mod.learningCenterId !== parsedCenterId) continue;
      if (parsedLevelKey && normalizeLevelKey(mod.targetLevel) !== parsedLevelKey) continue;
      const rawDt = mod.createdAt || mod.updatedAt;
      const ts = rawDt ? new Date(rawDt).getTime() : 0;
      if (!ts || isNaN(ts)) continue;
      const levelLabel = formatAlsLevelName(mod.targetLevel);
      const centerLabel = mod.learningCenter?.name || null;
      activities.push({
        id: `mod_${mod.id}`,
        type: 'module',
        userName: mod.teacher?.fullName || 'ALS Teacher',
        userRole: 'ALS Teacher',
        description: `Published learning module "${mod.title}"`,
        learningCenter: centerLabel,
        alsLevel: levelLabel,
        entity: [centerLabel, levelLabel].filter(Boolean).join(' • '),
        dateTime: formatDateTimeDisplay(rawDt),
        timestamp: ts,
      });
    }

    // 4. Learner submitted an activity
    for (const sub of (Array.isArray(allSubmissions) ? allSubmissions : []).slice(0, 10)) {
      if (sub.learnerId && !filteredLearnerIds.has(sub.learnerId)) continue;
      const rawDt = sub.submittedAt || sub.updatedAt;
      const ts = rawDt ? new Date(rawDt).getTime() : 0;
      if (!ts || isNaN(ts)) continue;
      const levelLabel = sub.learner?.level ? formatAlsLevelName(sub.learner.level) : null;
      const centerLabel = sub.learner?.learningCenter?.name || null;
      const modTitle = sub.module?.title || sub.title || 'Learning Activity';
      activities.push({
        id: `sub_${sub.id}`,
        type: 'submission',
        userName: sub.learner?.fullName || 'ALS Learner',
        userRole: 'Learner',
        description: `Submitted activity for "${modTitle}"`,
        learningCenter: centerLabel,
        alsLevel: levelLabel,
        entity: [centerLabel, levelLabel].filter(Boolean).join(' • '),
        dateTime: formatDateTimeDisplay(rawDt),
        timestamp: ts,
      });
    }

    // 5. Learner completed a module
    for (const l of learners) {
      for (const prog of l.progressRecords || []) {
        if (prog.status !== 'COMPLETED' && prog.masteryStatus !== 'MASTERED') continue;
        const rawDt = prog.completedAt || prog.updatedAt;
        const ts = rawDt ? new Date(rawDt).getTime() : 0;
        if (!ts || isNaN(ts)) continue;
        const mod = moduleById.get(Number(prog.moduleId));
        const levelLabel = formatAlsLevelName(l.level);
        const centerLabel = l.learningCenter?.name || null;
        activities.push({
          id: `prog_${prog.id}`,
          type: 'module_completion',
          userName: l.fullName,
          userRole: 'Learner',
          description: `Completed module "${mod?.title || `Module #${prog.moduleId}`}"`,
          learningCenter: centerLabel,
          alsLevel: levelLabel,
          entity: [centerLabel, levelLabel].filter(Boolean).join(' • '),
          dateTime: formatDateTimeDisplay(rawDt),
          timestamp: ts,
        });
      }
    }

    // 6. Teacher saved a learner assessment / AF2 record
    for (const rec of af2RecordsAll.slice(0, 10)) {
      if (parsedCenterId) {
        const targetClc = allLearningCenters.find((c) => c.id === parsedCenterId);
        if (
          targetClc &&
          String(rec.learningCenter || '').trim().toLowerCase() !==
            String(targetClc.name || '').trim().toLowerCase()
        ) {
          continue;
        }
      }
      if (parsedLevelKey && normalizeLevelKey(rec.alsLevel) !== parsedLevelKey) continue;
      const rawDt = rec.updatedAt || rec.createdAt;
      const ts = rawDt ? new Date(rawDt).getTime() : 0;
      if (!ts || isNaN(ts)) continue;
      const matchedLearner = rec.learnerId ? uniqueLearnersMap.get(Number(rec.learnerId)) : null;
      const teacherName =
        rec.teacherName ||
        matchedLearner?.assignedTeacher?.fullName ||
        allTeachers.find((t) => t.learningCenter?.name === rec.learningCenter)?.fullName ||
        'ALS Teacher';
      const levelLabel = formatAlsLevelName(rec.alsLevel || matchedLearner?.level);
      const centerLabel = rec.learningCenter || matchedLearner?.learningCenter?.name || null;
      activities.push({
        id: `af2_${rec.id || ts}`,
        type: 'assessment',
        userName: teacherName,
        userRole: 'ALS Teacher',
        description: `Recorded "${rec.assessment || rec.moduleStatus || 'Mastered'}" assessment for ${rec.learnerName || 'Learner'} in "${rec.moduleTitle || 'Module'}"`,
        learningCenter: centerLabel,
        alsLevel: levelLabel,
        entity: [centerLabel, levelLabel].filter(Boolean).join(' • '),
        dateTime: formatDateTimeDisplay(rawDt),
        timestamp: ts,
      });
    }

    // 7. Teacher recorded attendance
    const recentAttMap = new Map();
    for (const att of attendanceRecords.slice(0, 30)) {
      const dateKey = att.sessionDate ? toDateKey(att.sessionDate) : '';
      const centerName = att.learningCenter?.name || 'Community Learning Center';
      const mapKey = `${centerName}_${dateKey}`;
      if (!recentAttMap.has(mapKey)) {
        const rawDt = att.createdAt || att.sessionDate;
        const ts = rawDt ? new Date(rawDt).getTime() : 0;
        if (!ts || isNaN(ts)) continue;
        const levelLabel = att.learner?.level ? formatAlsLevelName(att.learner.level) : null;
        recentAttMap.set(mapKey, {
          id: `att_${att.id}`,
          type: 'attendance',
          userName: att.recordedBy?.fullName || 'ALS Teacher',
          userRole: 'ALS Teacher',
          description: `Recorded attendance session (${formatDateDisplay(dateKey || att.sessionDate)})`,
          learningCenter: centerName,
          alsLevel: levelLabel,
          entity: [centerName, levelLabel].filter(Boolean).join(' • '),
          dateTime: formatDateTimeDisplay(rawDt),
          timestamp: ts,
        });
      }
    }
    activities.push(...Array.from(recentAttMap.values()).slice(0, 6));

    // 8. Announcement published
    for (const ann of (Array.isArray(announcements) ? announcements : []).slice(0, 6)) {
      if (parsedCenterId && ann.learningCenterId && ann.learningCenterId !== parsedCenterId) continue;
      const rawDt = ann.createdAt;
      const ts = rawDt ? new Date(rawDt).getTime() : 0;
      if (!ts || isNaN(ts)) continue;
      const isTeacherRole = String(ann.creatorRole || ann.author?.role || '').toUpperCase() === 'TEACHER';
      const authorName = isTeacherRole
        ? ann.author?.teacherProfile?.fullName || ann.author?.username || 'ALS Teacher'
        : ann.author?.adminProfile?.fullName || ann.author?.username || 'ALS District Coordinator';
      const matchedCenter = ann.learningCenterId ? centerByIdMap.get(ann.learningCenterId) : null;
      const centerLabel = matchedCenter?.name || 'All Learning Centers';
      const levelLabel = ann.programLevel ? formatAlsLevelName(ann.programLevel) : null;
      activities.push({
        id: `ann_${ann.id}`,
        type: 'announcement',
        userName: authorName,
        userRole: isTeacherRole ? 'ALS Teacher' : 'Admin',
        description: `Published announcement "${ann.title}"`,
        learningCenter: centerLabel,
        alsLevel: levelLabel,
        entity: [centerLabel, levelLabel].filter(Boolean).join(' • '),
        dateTime: formatDateTimeDisplay(rawDt),
        timestamp: ts,
      });
    }

    // 9. Teacher activity logs (supplement with explicit teacher portal actions)
    for (const log of (Array.isArray(teacherActivityLogs) ? teacherActivityLogs : []).slice(0, 8)) {
      if (parsedCenterId && log.learningCenterId && Number(log.learningCenterId) !== parsedCenterId) continue;
      const rawDt = log.createdAt;
      const ts = rawDt ? new Date(rawDt).getTime() : 0;
      if (!ts || isNaN(ts)) continue;
      const teacherObj = allTeachers.find((t) => t.id === Number(log.teacherId));
      const centerLabel = log.learningCenter || teacherObj?.learningCenter?.name || null;
      const levelLabel = log.alsLevel ? formatAlsLevelName(log.alsLevel) : null;
      activities.push({
        id: `tlog_${log.id}`,
        type: log.type || 'teacher',
        userName: teacherObj?.fullName || 'ALS Teacher',
        userRole: 'ALS Teacher',
        description: log.description || 'Updated learning records',
        learningCenter: centerLabel,
        alsLevel: levelLabel,
        entity: [centerLabel, levelLabel].filter(Boolean).join(' • '),
        dateTime: formatDateTimeDisplay(rawDt),
        timestamp: ts,
      });
    }

    // Sort descending by timestamp and deduplicate near-identical entries
    activities.sort((a, b) => b.timestamp - a.timestamp);
    const seenLearnerSignatures = new Set();
    const seenStaffSignatures = new Set();
    const recentLearnerActivities = [];
    const recentStaffActivities = [];
    for (const act of activities) {
      const sig = `${act.userRole}_${act.userName}_${act.description}`;
      const isLearner = String(act.userRole || '').toUpperCase().includes('LEARNER');
      if (isLearner) {
        if (!seenLearnerSignatures.has(sig) && recentLearnerActivities.length < 5) {
          seenLearnerSignatures.add(sig);
          recentLearnerActivities.push(act);
        }
      } else {
        if (!seenStaffSignatures.has(sig) && recentStaffActivities.length < 5) {
          seenStaffSignatures.add(sig);
          recentStaffActivities.push(act);
        }
      }
    }
    const recentActivities = [...recentLearnerActivities, ...recentStaffActivities]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

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
      learningCentersNeedingAttention,
      needsAttention,
      clcOverview,
      recentActivities,
      recentLearnerActivities,
      recentStaffActivities,
      recentTeacherActivities: recentStaffActivities,
    });
  } catch (err) {
    console.error('[Admin Dashboard API Error] GET /api/dashboard/admin:', err.stack || err.message || err);
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
          user: { select: { status: true } },
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
                  module: { select: { id: true, title: true, status: true } },
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
          learningArea: { select: { id: true, name: true, code: true } },
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
          take: 25,
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
            learner: {
              select: {
                id: true,
                fullName: true,
                lrn: true,
                level: true,
                status: true,
                learningCenterId: true,
                assignedTeacherId: true,
                learningCenter: { select: { id: true, name: true } },
              },
            },
            module: {
              select: {
                id: true,
                title: true,
                code: true,
                status: true,
                targetLevel: true,
                teacherId: true,
                learningArea: { select: { name: true, code: true } },
              },
            },
            files: true,
          },
          orderBy: { submittedAt: 'desc' },
          take: 150,
        })
        .catch((err) => {
          console.error('Teacher dashboard submissions query warning:', err.message);
          return [];
        }),
    ]);

    if (!teacherProfile) {
      return res.status(404).json({ error: 'Teacher profile not found.' });
    }

    // 2b. Compute teacher's authorized ALS level specialization
    const rawSpec = String(teacherProfile.specialization || 'Both').trim();
    const specNorm = rawSpec.toLowerCase();
    const allowsElem = specNorm.includes('elem') || specNorm.includes('both');
    const allowsJhs =
      specNorm.includes('junior') ||
      specNorm.includes('jhs') ||
      specNorm.includes('sec') ||
      specNorm.includes('both');

    const authorizedLevels = [];
    if (allowsElem) authorizedLevels.push('A&E Elementary');
    if (allowsJhs) authorizedLevels.push('A&E Junior High');

    // 3. Deduplicate assigned learners by unique ID and exclude archived/inactive learner records
    const uniqueLearnersMap = new Map();
    for (const l of assignedLearnersRaw) {
      if (!l || !l.id || l.assignedTeacherId !== resolvedTeacherId) continue;
      const learnerStatusUpper = String(l.status || 'Active').trim().toUpperCase();
      const userStatusUpper = String(l.user?.status || 'ACTIVE').trim().toUpperCase();
      if (['ARCHIVED', 'INACTIVE', 'DELETED'].includes(learnerStatusUpper)) continue;
      if (['INACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(userStatusUpper)) continue;
      if (!uniqueLearnersMap.has(l.id)) {
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

    // Determine active school year for attendance trend (current school year or latest active school year in current calendar year)
    const currentCalendarYear = new Date().getFullYear();
    const hasCurrentSyAttendance = teacherAttendanceRaw.some(
      (r) => getSchoolYearForDate(r.sessionDate || r.createdAt) === currentSy
    );

    // 7. Filter assigned learners and attendance records
    const learners = allAssignedLearners.filter((l) => {
      const lvlKey = normalizeLevelKey(l.level);
      if (lvlKey === 'ELEMENTARY' && !allowsElem) return false;
      if (lvlKey === 'JUNIOR' && !allowsJhs) return false;
      if (parsedCenterId && l.learningCenterId !== parsedCenterId) return false;
      if (parsedLevelKey && lvlKey !== parsedLevelKey) return false;
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
      const lvlKey = normalizeLevelKey(rec.learner?.level);
      if (lvlKey === 'ELEMENTARY' && !allowsElem) return false;
      if (lvlKey === 'JUNIOR' && !allowsJhs) return false;
      if (parsedCenterId) {
        const recCenterId = rec.learningCenterId || rec.learner?.learningCenterId;
        if (recCenterId !== parsedCenterId) return false;
      }
      if (parsedLevelKey) {
        if (lvlKey !== parsedLevelKey) return false;
      }
      const recDate = rec.sessionDate || rec.createdAt;
      const attSy = getSchoolYearForDate(recDate);
      if (trimmedSy) {
        if (attSy !== trimmedSy) return false;
      } else if (currentSy) {
        // Scope to current school year (or current calendar year if DepEd SY spans across calendar year)
        const recYear = recDate ? new Date(recDate).getFullYear() : null;
        if (hasCurrentSyAttendance) {
          if (attSy !== currentSy && recYear !== currentCalendarYear) return false;
        } else if (recYear && recYear < currentCalendarYear - 1) {
          return false;
        }
      }
      return true;
    });

    // ==========================================
    // SECTION 1: SUMMARY CARDS & SEX DISTRIBUTION
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

    // Calculate Pending Submissions (grouped by moduleId + learnerId, respecting AF2 records and non-archived modules)
    const moduleById = new Map(
      teacherModulesRaw
        .filter((m) => String(m.status || 'PUBLISHED').toUpperCase() !== 'ARCHIVED')
        .map((m) => [m.id, m])
    );

    const af2RecordsAll = readAf2RecordsSafe();
    const activeSubmissions = (Array.isArray(teacherSubmissionsRaw) ? teacherSubmissionsRaw : []).filter((sub) => {
      if (!sub.learnerId || !filteredLearnerIds.has(sub.learnerId)) return false;
      if (sub.module && String(sub.module.status || 'PUBLISHED').toUpperCase() === 'ARCHIVED') return false;
      if (sub.moduleId && !moduleById.has(sub.moduleId)) return false;
      if (trimmedSy) {
        const subSy = getSchoolYearForDate(sub.submittedAt || sub.updatedAt);
        if (subSy && subSy !== trimmedSy) return false;
      }
      return true;
    });

    const submissionGroups = new Map();
    for (const sub of activeSubmissions) {
      const groupKey = sub.moduleId ? `${sub.moduleId}_${sub.learnerId}` : `sub_${sub.id}`;
      if (!submissionGroups.has(groupKey)) {
        submissionGroups.set(groupKey, []);
      }
      submissionGroups.get(groupKey).push(sub);
    }

    let pendingSubmissionsCount = 0;
    let reviewedSubmissionsCount = 0;
    let firstPendingModuleId = null;
    let firstAnySubModuleId = null;

    for (const [, rows] of submissionGroups.entries()) {
      const primary = rows[0];
      if (!firstAnySubModuleId && primary.moduleId) {
        firstAnySubModuleId = primary.moduleId;
      }
      const isAf2Recorded = af2RecordsAll.some(
        (r) =>
          Number(r.learnerId) === Number(primary.learnerId) &&
          Number(r.moduleId) === Number(primary.moduleId)
      );
      const isRowReviewed = rows.some((r) => {
        const st = String(r.status || '').trim().toUpperCase();
        return (
          ['RECORDED', 'MASTERED', 'NOT MASTERED', 'NOT_MASTERED', 'REVIEWED', 'GRADED', 'COMPLETED'].includes(st) ||
          r.grade != null
        );
      });

      if (isAf2Recorded || isRowReviewed) {
        reviewedSubmissionsCount++;
      } else {
        pendingSubmissionsCount++;
        if (!firstPendingModuleId && primary.moduleId) {
          firstPendingModuleId = primary.moduleId;
        }
      }
    }

    const firstTeacherModuleId =
      teacherModulesRaw.find((m) => m.teacherId === resolvedTeacherId)?.id ||
      teacherModulesRaw[0]?.id ||
      null;
    const reviewTargetModuleId = firstPendingModuleId || firstAnySubModuleId || firstTeacherModuleId;
    const reviewSubmissionsRoute = reviewTargetModuleId
      ? `/dashboard/modules/${reviewTargetModuleId}?tab=submissions`
      : '/dashboard/modules';

    let elementaryPct = 0;
    let juniorPct = 0;
    if (allowsElem && allowsJhs) {
      elementaryPct = totalLearners > 0 ? Math.round((elementaryCount / totalLearners) * 100) : 0;
      juniorPct = totalLearners > 0 ? Math.round((juniorCount / totalLearners) * 100) : 0;
    } else if (allowsElem) {
      elementaryPct = totalLearners > 0 ? 100 : 0;
      juniorPct = 0;
    } else if (allowsJhs) {
      elementaryPct = 0;
      juniorPct = totalLearners > 0 ? 100 : 0;
    }

    const learnersByLevelBars = [];
    if (allowsElem && (!parsedLevelKey || parsedLevelKey === 'ELEMENTARY')) {
      learnersByLevelBars.push({
        key: 'elementary',
        label: 'A&E Elementary',
        count: elementaryCount,
        percentage: elementaryPct,
      });
    }
    if (allowsJhs && (!parsedLevelKey || parsedLevelKey === 'JUNIOR')) {
      learnersByLevelBars.push({
        key: 'juniorHigh',
        label: 'A&E Junior High',
        count: juniorCount,
        percentage: juniorPct,
      });
    }

    const learnersByLevel = {
      total: totalLearners,
      elementary: allowsElem ? elementaryCount : 0,
      junior: allowsJhs ? juniorCount : 0,
      juniorHigh: allowsJhs ? juniorCount : 0,
      elementaryPct,
      juniorPct,
      juniorHighPct: juniorPct,
      bars: learnersByLevelBars,
    };

    const sexDistributionGroups = [];
    if (allowsElem && (!parsedLevelKey || parsedLevelKey === 'ELEMENTARY')) {
      sexDistributionGroups.push({
        key: 'elementary',
        label: 'A&E Elementary',
        male: elemMale,
        female: elemFemale,
        total: elemMale + elemFemale,
      });
    }
    if (allowsJhs && (!parsedLevelKey || parsedLevelKey === 'JUNIOR')) {
      sexDistributionGroups.push({
        key: 'juniorHigh',
        label: 'A&E Junior High',
        male: jhsMale,
        female: jhsFemale,
        total: jhsMale + jhsFemale,
      });
    }

    const sexDistributionByLevel = {
      totalLearners,
      totalMale: (allowsElem ? elemMale : 0) + (allowsJhs ? jhsMale : 0),
      totalFemale: (allowsElem ? elemFemale : 0) + (allowsJhs ? jhsFemale : 0),
      elementary: {
        label: 'A&E Elementary',
        male: allowsElem ? elemMale : 0,
        female: allowsElem ? elemFemale : 0,
        total: allowsElem ? elemMale + elemFemale : 0,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        male: allowsJhs ? jhsMale : 0,
        female: allowsJhs ? jhsFemale : 0,
        total: allowsJhs ? jhsMale + jhsFemale : 0,
      },
      groups: sexDistributionGroups,
    };

    // ==========================================
    // SECTION 4: MODULE COMPLETION BY ALS LEVEL
    // & LEARNER PROGRESS BY ALS LEVEL
    // ==========================================
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

    // Store per-learner module summary for modal inspection
    const learnerModuleSummaryMap = new Map();

    for (const learner of learners) {
      const lvlKey = normalizeLevelKey(learner.level);
      const bucket = moduleStats[lvlKey];
      bucket.learnersCount++;

      // Determine all teacher-scoped active (non-archived) modules assigned/applicable to this learner
      const assignedModuleIds = new Set();
      const explicitDueByMod = new Map();

      // 1. Explicit module assignments
      if (Array.isArray(learner.assignedModules)) {
        for (const assign of learner.assignedModules) {
          if (assign.moduleId && moduleById.has(assign.moduleId)) {
            assignedModuleIds.add(assign.moduleId);
            if (assign.dueDate) explicitDueByMod.set(assign.moduleId, assign.dueDate);
          }
        }
      }

      // 2. Existing learner progress records (only for active non-archived modules)
      const progressByModule = new Map();
      if (Array.isArray(learner.progressRecords)) {
        for (const prog of learner.progressRecords) {
          if (!prog.moduleId || !moduleById.has(prog.moduleId)) continue;
          if (trimmedSy) {
            const progSy = getSchoolYearForDate(prog.completedAt || prog.updatedAt || prog.createdAt);
            if (progSy && progSy !== trimmedSy) continue;
          }
          assignedModuleIds.add(prog.moduleId);
          progressByModule.set(prog.moduleId, prog);
        }
      }

      // 3. Published modules created by this teacher targeting the learner's ALS level and Learning Center
      for (const mod of teacherModulesRaw) {
        if (!moduleById.has(mod.id)) continue;
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
      const detailedModulesList = [];
      const nowMs = Date.now();

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

        const dueRaw = explicitDueByMod.get(modId) || mod?.dateEnded || null;
        const dueMs = dueRaw ? new Date(dueRaw).getTime() : null;
        const isPastDue = !isCompleted && dueMs && !isNaN(dueMs) && dueMs < nowMs;
        const isNotMastered = prog?.masteryStatus === 'NOT_MASTERED';

        detailedModulesList.push({
          moduleId: modId,
          title: mod?.title || `Module #${modId}`,
          code: mod?.code || mod?.learningArea?.code || 'LS',
          strandName: mod?.learningArea?.name || 'Learning Strand',
          statusLabel: isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started',
          masteryStatus:
            prog?.masteryStatus === 'MASTERED'
              ? 'Mastered'
              : prog?.masteryStatus === 'NOT_MASTERED'
              ? 'Not Mastered'
              : isCompleted
              ? 'Mastered'
              : 'In Progress',
          progressPct: modPct,
          preTestScore: prog?.preTestScore ?? preAtt?.score ?? null,
          preTestMax: preAtt?.maxScore ?? null,
          postTestScore: prog?.postTestScore ?? postAtt?.score ?? null,
          postTestMax: postAtt?.maxScore ?? null,
          dueDate: dueRaw ? formatDateDisplay(dueRaw) : null,
          isDelayed: Boolean(isPastDue || isNotMastered),
          delayReason: isNotMastered
            ? 'Unmastered assessment'
            : isPastDue
            ? `Past due (${formatDateDisplay(dueRaw)})`
            : null,
          updatedAt: prog?.updatedAt
            ? formatDateDisplay(prog.updatedAt)
            : prog?.completedAt
            ? formatDateDisplay(prog.completedAt)
            : null,
        });
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

      learnerModuleSummaryMap.set(learner.id, {
        assignedCount: learnerModCount,
        completedCount: learnerCompletedMods,
        inProgressCount: learnerInProgressMods,
        notStartedCount: learnerNotStartedMods,
        averageProgress: Math.round(learnerAvgProgress),
        modules: detailedModulesList,
      });
    }

    const moduleCompletionByLevel = {
      unit: 'Learners',
      totalLearners,
      totalCompleted:
        (allowsElem ? moduleStats.ELEMENTARY.completed : 0) +
        (allowsJhs ? moduleStats.JUNIOR.completed : 0),
      totalInProgress:
        (allowsElem ? moduleStats.ELEMENTARY.inProgress : 0) +
        (allowsJhs ? moduleStats.JUNIOR.inProgress : 0),
      totalNotStarted:
        (allowsElem ? moduleStats.ELEMENTARY.notStarted : 0) +
        (allowsJhs ? moduleStats.JUNIOR.notStarted : 0),
      elementary: {
        label: 'A&E Elementary',
        completed: allowsElem ? moduleStats.ELEMENTARY.completed : 0,
        inProgress: allowsElem ? moduleStats.ELEMENTARY.inProgress : 0,
        notStarted: allowsElem ? moduleStats.ELEMENTARY.notStarted : 0,
        total: allowsElem ? moduleStats.ELEMENTARY.learnersCount : 0,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        completed: allowsJhs ? moduleStats.JUNIOR.completed : 0,
        inProgress: allowsJhs ? moduleStats.JUNIOR.inProgress : 0,
        notStarted: allowsJhs ? moduleStats.JUNIOR.notStarted : 0,
        total: allowsJhs ? moduleStats.JUNIOR.learnersCount : 0,
      },
      groups: [
        ...(allowsElem && (!parsedLevelKey || parsedLevelKey === 'ELEMENTARY')
          ? [
            {
              key: 'elementary',
              label: 'A&E Elementary',
              completed: moduleStats.ELEMENTARY.completed,
              inProgress: moduleStats.ELEMENTARY.inProgress,
              notStarted: moduleStats.ELEMENTARY.notStarted,
              total: moduleStats.ELEMENTARY.learnersCount,
            },
          ]
          : []),
        ...(allowsJhs && (!parsedLevelKey || parsedLevelKey === 'JUNIOR')
          ? [
            {
              key: 'juniorHigh',
              label: 'A&E Junior High',
              completed: moduleStats.JUNIOR.completed,
              inProgress: moduleStats.JUNIOR.inProgress,
              notStarted: moduleStats.JUNIOR.notStarted,
              total: moduleStats.JUNIOR.learnersCount,
            },
          ]
          : []),
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
        averageProgress: allowsElem ? elemAvgProgress : 0,
        learnersCount: allowsElem ? moduleStats.ELEMENTARY.learnersCount : 0,
        completedLearnersCount: allowsElem ? moduleStats.ELEMENTARY.completed : 0,
        inProgressLearnersCount: allowsElem ? moduleStats.ELEMENTARY.inProgress : 0,
        notStartedLearnersCount: allowsElem ? moduleStats.ELEMENTARY.notStarted : 0,
        assignedModulesCount: allowsElem ? moduleStats.ELEMENTARY.assignedModulesCount : 0,
        completedModulesCount: allowsElem ? moduleStats.ELEMENTARY.completedModulesCount : 0,
        inProgressModulesCount: allowsElem ? moduleStats.ELEMENTARY.inProgressModulesCount : 0,
        notStartedModulesCount: allowsElem ? moduleStats.ELEMENTARY.notStartedModulesCount : 0,
      },
      juniorHigh: {
        label: 'A&E Junior High',
        averageProgress: allowsJhs ? jhsAvgProgress : 0,
        learnersCount: allowsJhs ? moduleStats.JUNIOR.learnersCount : 0,
        completedLearnersCount: allowsJhs ? moduleStats.JUNIOR.completed : 0,
        inProgressLearnersCount: allowsJhs ? moduleStats.JUNIOR.inProgress : 0,
        notStartedLearnersCount: allowsJhs ? moduleStats.JUNIOR.notStarted : 0,
        assignedModulesCount: allowsJhs ? moduleStats.JUNIOR.assignedModulesCount : 0,
        completedModulesCount: allowsJhs ? moduleStats.JUNIOR.completedModulesCount : 0,
        inProgressModulesCount: allowsJhs ? moduleStats.JUNIOR.inProgressModulesCount : 0,
        notStartedModulesCount: allowsJhs ? moduleStats.JUNIOR.notStartedModulesCount : 0,
      },
      levels: [
        ...(allowsElem && (!parsedLevelKey || parsedLevelKey === 'ELEMENTARY')
          ? [
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
          ]
          : []),
        ...(allowsJhs && (!parsedLevelKey || parsedLevelKey === 'JUNIOR')
          ? [
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
          ]
          : []),
      ],
    };

    // ==========================================
    // SECTION 5: MONTHLY ATTENDANCE TREND (BY ALS LEVEL)
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
        const hasAnyRecords = b.total > 0;
        const elemHasRecords = allowsElem && b.elemTotal > 0;
        const jhsHasRecords = allowsJhs && b.jhsTotal > 0;
        const overallRate = hasAnyRecords ? Math.round((b.present / b.total) * 100) : null;
        const elemRate = elemHasRecords ? Math.round((b.elemPresent / b.elemTotal) * 100) : null;
        const jhsRate = jhsHasRecords ? Math.round((b.jhsPresent / b.jhsTotal) * 100) : null;

        return {
          month: b.label,
          key: b.key,
          hasRecords: hasAnyRecords,
          sessionsCount: b.sessionDates.size,
          statusLabel: hasAnyRecords
            ? `${b.sessionDates.size} session${b.sessionDates.size === 1 ? '' : 's'}`
            : 'No sessions',
          presentRecords: b.present,
          absentRecords: b.absent,
          totalRecords: b.total,
          attendancePercentage: overallRate,
          elementary: {
            label: 'A&E Elementary',
            hasRecords: elemHasRecords,
            sessionsCount: allowsElem ? b.elemSessions.size : 0,
            statusLabel: elemHasRecords
              ? `${b.elemSessions.size} session${b.elemSessions.size === 1 ? '' : 's'}`
              : 'No sessions',
            presentRecords: allowsElem ? b.elemPresent : 0,
            absentRecords: allowsElem ? b.elemAbsent : 0,
            totalRecords: allowsElem ? b.elemTotal : 0,
            attendancePercentage: elemRate,
          },
          juniorHigh: {
            label: 'A&E Junior High',
            hasRecords: jhsHasRecords,
            sessionsCount: allowsJhs ? b.jhsSessions.size : 0,
            statusLabel: jhsHasRecords
              ? `${b.jhsSessions.size} session${b.jhsSessions.size === 1 ? '' : 's'}`
              : 'No sessions',
            presentRecords: allowsJhs ? b.jhsPresent : 0,
            absentRecords: allowsJhs ? b.jhsAbsent : 0,
            totalRecords: allowsJhs ? b.jhsTotal : 0,
            attendancePercentage: jhsRate,
          },
        };
      });

    const elemAttRecords = allowsElem
      ? attendanceRecords.filter((r) => normalizeLevelKey(r.learner?.level) === 'ELEMENTARY')
      : [];
    const elemAttPresent = elemAttRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const elemOverallRate =
      elemAttRecords.length > 0 ? Math.round((elemAttPresent / elemAttRecords.length) * 100) : null;

    const jhsAttRecords = allowsJhs
      ? attendanceRecords.filter((r) => normalizeLevelKey(r.learner?.level) === 'JUNIOR')
      : [];
    const jhsAttPresent = jhsAttRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const jhsOverallRate =
      jhsAttRecords.length > 0 ? Math.round((jhsAttPresent / jhsAttRecords.length) * 100) : null;

    const distinctSessionsTotal = new Set(
      attendanceRecords
        .map((r) => (r.sessionDate ? new Date(r.sessionDate).toISOString().split('T')[0] : null))
        .filter(Boolean)
    ).size;

    const attendanceTrend = {
      hasData: attendanceRecords.length > 0,
      schoolYear: trimmedSy || currentSy || '',
      totalRecords: totalAttendanceCount,
      totalSessions: distinctSessionsTotal,
      presentRecords: totalPresentCount,
      absentRecords: attendanceRecords.filter((r) => r.status === 'ABSENT').length,
      averageRate: averageAttendanceRate,
      elementaryRate: allowsElem ? (elemOverallRate ?? 0) : 0,
      elementaryHasRecords: allowsElem && elemAttRecords.length > 0,
      juniorHighRate: allowsJhs ? (jhsOverallRate ?? 0) : 0,
      juniorHighHasRecords: allowsJhs && jhsAttRecords.length > 0,
      monthly: monthlyAttendance,
    };

    // Format handled ALS level display strictly with allowed level names
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
    // LEARNERS NEEDING ATTENTION & LEARNER MODAL DETAILS
    // ==========================================
    const nowTime = Date.now();
    const thirtyDaysAgoTime = nowTime - 30 * 24 * 60 * 60 * 1000;

    // Map attendance per assigned learner
    const attByLearner = new Map();
    for (const rec of attendanceRecords) {
      if (!rec.learnerId) continue;
      if (!attByLearner.has(rec.learnerId)) {
        attByLearner.set(rec.learnerId, {
          present: 0,
          late: 0,
          absent: 0,
          excused: 0,
          total: 0,
          latestTime: 0,
          records: [],
        });
      }
      const st = attByLearner.get(rec.learnerId);
      st.total++;
      if (rec.status === 'PRESENT') st.present++;
      else if (rec.status === 'LATE') {
        st.present++;
        st.late++;
      } else if (rec.status === 'ABSENT') st.absent++;
      else if (rec.status === 'EXCUSED') st.excused++;

      const recTime = rec.sessionDate
        ? new Date(rec.sessionDate).getTime()
        : rec.createdAt
          ? new Date(rec.createdAt).getTime()
          : 0;
      if (recTime > st.latestTime) st.latestTime = recTime;

      if (st.records.length < 10) {
        st.records.push({
          id: rec.id,
          date: formatDateDisplay(rec.sessionDate || rec.createdAt),
          rawDate: toDateKey(rec.sessionDate || rec.createdAt),
          status:
            rec.status === 'PRESENT'
              ? 'Present'
              : rec.status === 'LATE'
              ? 'Late'
              : rec.status === 'EXCUSED'
              ? 'Excused'
              : 'Absent',
          remarks: rec.remarks || '—',
          learningCenter:
            rec.learningCenter?.name ||
            rec.learner?.learningCenter?.name ||
            teacherProfile.learningCenter?.name ||
            '—',
        });
      }
    }

    // Map submissions per assigned learner
    const subsByLearner = new Map();
    const latestSubByLearner = new Map();
    for (const sub of activeSubmissions) {
      if (!sub.learnerId) continue;
      if (!subsByLearner.has(sub.learnerId)) {
        subsByLearner.set(sub.learnerId, []);
      }
      subsByLearner.get(sub.learnerId).push(sub);
      const t = sub.submittedAt ? new Date(sub.submittedAt).getTime() : 0;
      const prev = latestSubByLearner.get(sub.learnerId) || 0;
      if (t > prev) latestSubByLearner.set(sub.learnerId, t);
    }

    const lowAttendanceLearners = [];
    const delayedProgressLearners = [];
    const noRecentActivityLearners = [];
    const affectedLearnerIds = new Set();
    const learnerDetailsById = new Map();

    for (const l of learners) {
      const alsLevelLabel = formatAlsLevelName(l.level);
      const learningCenterName =
        l.learningCenter?.name ||
        teacherProfile.learningCenter?.name ||
        'Assigned Learning Center';
      const attSt = attByLearner.get(l.id);
      const modSummary = learnerModuleSummaryMap.get(l.id) || {
        assignedCount: 0,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 0,
        averageProgress: 0,
        modules: [],
      };
      const learnerSubs = subsByLearner.get(l.id) || [];

      // Collect recent events for this learner
      const learnerEvents = [];
      let latestActivityTs = attSt?.latestTime || 0;

      for (const prog of l.progressRecords || []) {
        if (!prog.moduleId || !moduleById.has(prog.moduleId)) continue;
        const mod = moduleById.get(prog.moduleId);
        const refDate = prog.completedAt || prog.updatedAt || prog.createdAt;
        if (!refDate) continue;
        const ts = new Date(refDate).getTime();
        if (ts > latestActivityTs) latestActivityTs = ts;
        const isDone = prog.status === 'COMPLETED' || prog.masteryStatus === 'MASTERED';
        learnerEvents.push({
          id: `lprog_${prog.id}`,
          activityType: isDone ? 'Completed Module' : 'Updated Module Progress',
          moduleTitle: mod?.title || `Module #${prog.moduleId}`,
          statusLabel: isDone
            ? 'Mastered'
            : prog.totalPages > 0
            ? `${prog.completedPages || 0}/${prog.totalPages} pages`
            : 'In Progress',
          dateTime: formatDateTimeDisplay(refDate),
          timestamp: ts,
          description: isDone
            ? `Completed module "${mod?.title || 'Module'}"`
            : `Updated progress in "${mod?.title || 'Module'}"`,
        });
      }

      for (const att of l.attempts || []) {
        if (att.assessment?.module?.status === 'ARCHIVED') continue;
        const refDate = att.submittedAt || att.startedAt;
        if (!refDate) continue;
        const ts = new Date(refDate).getTime();
        if (ts > latestActivityTs) latestActivityTs = ts;
        const isPost = att.assessment?.type === 'POST_TEST';
        learnerEvents.push({
          id: `lattmp_${att.id}`,
          activityType: isPost ? 'Submitted Post-Test' : 'Submitted Pre-Test',
          moduleTitle: att.assessment?.module?.title || att.assessment?.title || 'Assessment',
          statusLabel:
            att.score != null && att.maxScore != null
              ? `Score: ${att.score}/${att.maxScore}`
              : att.isPassed
              ? 'Passed'
              : 'Submitted',
          dateTime: formatDateTimeDisplay(refDate),
          timestamp: ts,
          description: `${isPost ? 'Submitted Post-Test' : 'Submitted Pre-Test'} for "${
            att.assessment?.module?.title || att.assessment?.title || 'Module'
          }"`,
        });
      }

      for (const sub of learnerSubs) {
        const refDate = sub.submittedAt || sub.updatedAt;
        if (!refDate) continue;
        const ts = new Date(refDate).getTime();
        if (ts > latestActivityTs) latestActivityTs = ts;
        const hasFiles = (Array.isArray(sub.files) && sub.files.length > 0) || Boolean(sub.fileUrl);
        learnerEvents.push({
          id: `lsub_${sub.id}`,
          activityType: hasFiles ? 'Uploaded Activity Output' : 'Submitted Learning Activity',
          moduleTitle: sub.module?.title || sub.title || 'Learning Activity',
          statusLabel:
            sub.status === 'SUBMITTED' ? 'Pending Review' : sub.status || 'Submitted',
          dateTime: formatDateTimeDisplay(refDate),
          timestamp: ts,
          description: `${hasFiles ? 'Uploaded activity output' : 'Submitted learning activity'} "${
            sub.title || 'Activity'
          }"`,
        });
      }

      learnerEvents.sort((a, b) => b.timestamp - a.timestamp);

      const attRate =
        attSt && attSt.total > 0 ? Math.round((attSt.present / attSt.total) * 100) : null;
      const attendanceDetails = {
        attendanceRate: attRate,
        presentCount: attSt ? attSt.present : 0,
        lateCount: attSt ? attSt.late : 0,
        absentCount: attSt ? attSt.absent : 0,
        excusedCount: attSt ? attSt.excused : 0,
        totalSessions: attSt ? attSt.total : 0,
        recentSessions: attSt ? attSt.records : [],
      };

      const activityDetails = {
        lastActivityDate:
          latestActivityTs > 0
            ? formatDateTimeDisplay(new Date(latestActivityTs))
            : 'No recorded activity yet',
        daysSinceLastActivity:
          latestActivityTs > 0
            ? Math.max(0, Math.floor((nowTime - latestActivityTs) / (24 * 60 * 60 * 1000)))
            : null,
        totalSubmissions: learnerSubs.length,
        totalAssessmentsTaken: Array.isArray(l.attempts) ? l.attempts.length : 0,
        totalSessionsAttended: attSt ? attSt.present : 0,
        recentEvents: learnerEvents.slice(0, 8),
      };

      const fullLearnerDetail = {
        id: l.id,
        fullName: l.fullName,
        lrn: l.lrn || '—',
        level: alsLevelLabel,
        learningCenter: learningCenterName,
        attendanceRate: attRate,
        attendanceDetails,
        moduleDetails: modSummary,
        activityDetails,
      };
      learnerDetailsById.set(l.id, fullLearnerDetail);

      // 1. Low Attendance check (< 75%)
      if (attSt && attSt.total > 0 && attRate !== null && attRate < 75) {
        lowAttendanceLearners.push({
          ...fullLearnerDetail,
          indicator: `${attRate}% Attendance (${attSt.present}/${attSt.total} sessions)`,
          actionLabel: 'View Attendance',
          actionType: 'attendance',
        });
        affectedLearnerIds.add(l.id);
      }

      // 2. Delayed Module Progress check
      const delayedMods = modSummary.modules.filter((m) => m.isDelayed);
      let isDelayed = delayedMods.length > 0;
      let delayedReasonText = '';

      if (isDelayed) {
        const unmasteredCount = delayedMods.filter((m) => m.masteryStatus === 'Not Mastered').length;
        const pastDueCount = delayedMods.length - unmasteredCount;
        if (unmasteredCount > 0 && pastDueCount > 0) {
          delayedReasonText = `${pastDueCount} overdue, ${unmasteredCount} unmastered`;
        } else if (unmasteredCount > 0) {
          delayedReasonText = `${unmasteredCount} unmastered module${unmasteredCount > 1 ? 's' : ''}`;
        } else {
          delayedReasonText = `${delayedMods.length} overdue module${delayedMods.length > 1 ? 's' : ''}`;
        }
      }

      if (isDelayed) {
        delayedProgressLearners.push({
          ...fullLearnerDetail,
          indicator: delayedReasonText || `${modSummary.averageProgress}% Module Progress`,
          actionLabel: 'View Module',
          actionType: 'module',
        });
        affectedLearnerIds.add(l.id);
      }

      // 3. No Recent Learning Activity in the last 30 days
      const hasRecentAtt = Boolean(attSt && attSt.latestTime >= thirtyDaysAgoTime);
      const hasRecentProg = (l.progressRecords || []).some((p) => {
        if (!p.moduleId || !moduleById.has(p.moduleId)) return false;
        const t = new Date(p.updatedAt || p.completedAt || p.createdAt || 0).getTime();
        return t >= thirtyDaysAgoTime;
      });
      const hasRecentAttmp = (l.attempts || []).some((att) => {
        const t = new Date(att.submittedAt || att.startedAt || 0).getTime();
        return t >= thirtyDaysAgoTime;
      });
      const hasRecentSub = (latestSubByLearner.get(l.id) || 0) >= thirtyDaysAgoTime;

      if (!hasRecentAtt && !hasRecentProg && !hasRecentAttmp && !hasRecentSub) {
        const inactiveIndicator =
          activityDetails.daysSinceLastActivity != null
            ? `Inactive for ${activityDetails.daysSinceLastActivity} days`
            : 'No recent activity (30+ days)';
        noRecentActivityLearners.push({
          ...fullLearnerDetail,
          indicator: inactiveIndicator,
          actionLabel: 'View Details',
          actionType: 'activity',
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
          label: 'Low Attendance',
          description: 'Learners with attendance rates below 75%.',
          actionLabel: 'View Attendance',
          actionType: 'attendance',
          count: lowAttendanceLearners.length,
          route: '/dashboard/learners',
          learners: lowAttendanceLearners,
        },
        {
          key: 'delayedProgress',
          label: 'Delayed Module Progress',
          description: 'Learners with overdue modules or delayed progress.',
          actionLabel: 'View Module',
          actionType: 'module',
          count: delayedProgressLearners.length,
          route: '/dashboard/learners',
          learners: delayedProgressLearners,
        },
        {
          key: 'noRecentActivity',
          label: 'No Recent Learning Activity',
          description: 'Learners with no recorded learning activity in the last 30 days.',
          actionLabel: 'View Details',
          actionType: 'activity',
          count: noRecentActivityLearners.length,
          route: '/dashboard/learners',
          learners: noRecentActivityLearners,
        },
      ],
    };

    // ==========================================
    // SECTION 6A: RECENT LEARNER ACTIVITIES (Top 5 newest first)
    // ==========================================
    const learnerActivityEvents = [];

    for (const l of learners) {
      const alsLevelLabel = formatAlsLevelName(l.level);
      const learningCenterName =
        l.learningCenter?.name ||
        teacherProfile.learningCenter?.name ||
        'Assigned Learning Center';
      const learnerDetail = learnerDetailsById.get(l.id) || null;

      // 1. Module completion & module progress updates
      for (const prog of l.progressRecords || []) {
        if (!prog.moduleId || !moduleById.has(prog.moduleId)) continue;
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
            activityType: 'Completed Module',
            learnerId: l.id,
            learnerName: l.fullName,
            lrn: l.lrn || '—',
            learningCenter: learningCenterName,
            moduleId: prog.moduleId,
            moduleTitle: modTitle,
            status: prog.masteryStatus === 'MASTERED' ? 'Mastered' : 'Completed',
            description: `Completed module: ${modTitle}`,
            alsLevel: alsLevelLabel,
            dateTime: formatDateTimeDisplay(refDate),
            timestamp: ts,
            actionType: 'module',
            targetRoute: `/dashboard/modules/${prog.moduleId}`,
            learnerDetail,
          });
        } else if (prog.status === 'IN_PROGRESS' || (prog.completedPages || 0) > 0) {
          const pagesInfo =
            prog.totalPages > 0 ? `${prog.completedPages || 0}/${prog.totalPages} pages` : 'In Progress';
          learnerActivityEvents.push({
            id: `prog_upd_${prog.id}`,
            type: 'progress_updated',
            activityType: 'Updated Module Progress',
            learnerId: l.id,
            learnerName: l.fullName,
            lrn: l.lrn || '—',
            learningCenter: learningCenterName,
            moduleId: prog.moduleId,
            moduleTitle: modTitle,
            status: pagesInfo,
            description: `Module progress updated: ${modTitle} (${pagesInfo})`,
            alsLevel: alsLevelLabel,
            dateTime: formatDateTimeDisplay(refDate),
            timestamp: ts,
            actionType: 'module',
            targetRoute: `/dashboard/modules/${prog.moduleId}`,
            learnerDetail,
          });
        }
      }

      // 2. Assessment attempts submitted (Pre-Test / Post-Test)
      for (const att of l.attempts || []) {
        if (att.assessment?.module?.status === 'ARCHIVED') continue;
        const refDate = att.submittedAt || att.startedAt;
        if (!refDate) continue;
        const ts = new Date(refDate).getTime();
        const isPost = att.assessment?.type === 'POST_TEST';
        const activityTypeLabel = isPost ? 'Submitted Post-Test' : 'Submitted Pre-Test';
        const modId = att.assessment?.module?.id || null;
        const modTitle = att.assessment?.module?.title || att.assessment?.title || 'Assessment';
        const statusText =
          att.score != null && att.maxScore != null
            ? `Score: ${att.score}/${att.maxScore}`
            : att.isPassed
            ? 'Passed'
            : 'Completed';

        learnerActivityEvents.push({
          id: `attmp_${att.id}`,
          type: 'assessment_submitted',
          activityType: activityTypeLabel,
          learnerId: l.id,
          learnerName: l.fullName,
          lrn: l.lrn || '—',
          learningCenter: learningCenterName,
          moduleId: modId,
          moduleTitle: modTitle,
          status: statusText,
          description: `${activityTypeLabel} in ${modTitle}`,
          alsLevel: alsLevelLabel,
          dateTime: formatDateTimeDisplay(refDate),
          timestamp: ts,
          actionType: 'module',
          targetRoute: modId ? `/dashboard/modules/${modId}?tab=submissions` : '/dashboard/modules',
          learnerDetail,
        });
      }
    }

    // 3. Learner activity submissions / uploaded outputs
    for (const sub of activeSubmissions) {
      if (!sub.learnerId || !filteredLearnerIds.has(sub.learnerId)) continue;
      const refDate = sub.submittedAt || sub.updatedAt;
      if (!refDate) continue;
      const ts = new Date(refDate).getTime();
      const hasFiles = (Array.isArray(sub.files) && sub.files.length > 0) || Boolean(sub.fileUrl);
      const activityTypeLabel = hasFiles ? 'Uploaded Activity Output' : 'Submitted Learning Activity';
      const modTitle = sub.module?.title || sub.title || 'Learning Activity';
      const isAf2Recorded = af2RecordsAll.some(
        (r) => Number(r.learnerId) === Number(sub.learnerId) && Number(r.moduleId) === Number(sub.moduleId)
      );
      const statusText = isAf2Recorded
        ? 'Recorded'
        : sub.status === 'SUBMITTED'
        ? 'Pending Review'
        : sub.status || 'Submitted';
      const learnerDetail = learnerDetailsById.get(sub.learnerId) || null;

      learnerActivityEvents.push({
        id: `sub_${sub.id}`,
        type: 'activity_submitted',
        activityType: activityTypeLabel,
        learnerId: sub.learnerId,
        learnerName: sub.learner?.fullName || 'Assigned Learner',
        lrn: sub.learner?.lrn || '—',
        learningCenter:
          sub.learner?.learningCenter?.name ||
          teacherProfile.learningCenter?.name ||
          'Assigned Learning Center',
        moduleId: sub.moduleId || null,
        moduleTitle: modTitle,
        submissionId: sub.id,
        status: statusText,
        description: `${activityTypeLabel}: ${sub.title || modTitle}`,
        alsLevel: formatAlsLevelName(sub.learner?.level),
        dateTime: formatDateTimeDisplay(refDate),
        timestamp: ts,
        actionType: 'submission',
        targetRoute: sub.moduleId
          ? `/dashboard/modules/${sub.moduleId}?tab=submissions`
          : '/dashboard/modules',
        submissionDetails: {
          submissionId: sub.id,
          moduleId: sub.moduleId || null,
          moduleTitle: modTitle,
          activityTitle: sub.title || 'Learning Activity',
          content: sub.content || '',
          status: statusText,
          feedback: sub.feedback || '',
          filesCount: Array.isArray(sub.files) ? sub.files.length : sub.fileUrl ? 1 : 0,
          fileNames: Array.isArray(sub.files)
            ? sub.files.map((f) => f.fileName || f.fileUrl).filter(Boolean)
            : sub.fileUrl
            ? [sub.fileUrl]
            : [],
          submittedAt: formatDateTimeDisplay(refDate),
        },
        learnerDetail,
      });
    }

    learnerActivityEvents.sort((a, b) => b.timestamp - a.timestamp);
    const recentLearnerActivities = learnerActivityEvents.slice(0, 5);

    // ==========================================
    // SECTION 6B: RECENT TEACHER ACTIVITIES (Top 5 newest first from real DB & activity log)
    // ==========================================
    const teacherActivityCandidates = [];

    // 1. Saved entries from lightweight teacher activity log
    const loggedTeacherActions = readTeacherActivities(resolvedTeacherId);
    for (const entry of loggedTeacherActions) {
      const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : 0;
      if (!ts || isNaN(ts)) continue;
      teacherActivityCandidates.push({
        id: entry.id || `tlog_${ts}`,
        type: entry.type || 'ACTION',
        activityType: entry.activityTypeLabel || 'Teacher Action',
        relatedEntity: entry.relatedEntity || '',
        description: entry.description || entry.activityTypeLabel || 'Performed action',
        dateTime: formatDateTimeDisplay(entry.timestamp),
        timestamp: ts,
        linkUrl: entry.linkUrl || '',
        moduleId: entry.moduleId ? Number(entry.moduleId) : null,
        learnerId: entry.learnerId ? Number(entry.learnerId) : null,
      });
    }

    // 2. Uploaded Modules by this teacher
    for (const mod of teacherModulesRaw) {
      if (mod.teacherId !== resolvedTeacherId) continue;
      const refDate = mod.createdAt || mod.dateStarted;
      if (!refDate) continue;
      const ts = new Date(refDate).getTime();
      if (!ts || isNaN(ts)) continue;
      teacherActivityCandidates.push({
        id: `tmod_${mod.id}`,
        type: 'MODULE_UPLOADED',
        activityType: 'Uploaded a Module',
        relatedEntity: mod.title,
        description: `Uploaded "${mod.title}" (${mod.code || 'LS'}) for ${formatAlsLevelName(mod.targetLevel)}`,
        dateTime: formatDateTimeDisplay(refDate),
        timestamp: ts,
        linkUrl: `/dashboard/modules/${mod.id}`,
        moduleId: mod.id,
        learnerId: null,
      });
    }

    // 3. Reviewed Learner Submissions by this teacher
    for (const sub of activeSubmissions) {
      const stUpper = String(sub.status || '').trim().toUpperCase();
      const isReviewed =
        Boolean(sub.reviewedAt) ||
        ['MASTERED', 'NOT MASTERED', 'NOT_MASTERED', 'RECORDED', 'REVIEWED', 'GRADED'].includes(stUpper);
      if (!isReviewed) continue;
      const refDate = sub.reviewedAt || sub.updatedAt || sub.submittedAt;
      if (!refDate) continue;
      const ts = new Date(refDate).getTime();
      if (!ts || isNaN(ts)) continue;
      teacherActivityCandidates.push({
        id: `trev_${sub.id}`,
        type: 'SUBMISSION_REVIEWED',
        activityType: 'Reviewed a Learner Submission',
        relatedEntity: `${sub.learner?.fullName || 'Learner'}${sub.module?.title ? ` • ${sub.module.title}` : ''}`,
        description: `Reviewed submission from ${sub.learner?.fullName || 'Learner'} (${sub.status || 'Reviewed'})`,
        dateTime: formatDateTimeDisplay(refDate),
        timestamp: ts,
        linkUrl: sub.moduleId ? `/dashboard/modules/${sub.moduleId}?tab=submissions` : '/dashboard/modules',
        moduleId: sub.moduleId || null,
        learnerId: sub.learnerId || null,
      });
    }

    // 4. Added or Updated Learner Records (AF2 records belonging to this teacher)
    for (const rec of af2RecordsAll) {
      const belongsToTeacher =
        Number(rec.teacherId) === Number(resolvedTeacherId) ||
        (rec.learnerId && filteredLearnerIds.has(Number(rec.learnerId)));
      if (!belongsToTeacher) continue;
      const refDate = rec.updatedAt || rec.createdAt || rec.dateFinished;
      if (!refDate) continue;
      const ts = new Date(refDate).getTime();
      if (!ts || isNaN(ts)) continue;
      teacherActivityCandidates.push({
        id: `taf2_${rec.id || `${rec.learnerId}_${rec.moduleId}`}`,
        type: 'RECORD_ADDED',
        activityType: 'Added or Updated a Learner Record',
        relatedEntity: `${rec.learnerName || 'Learner'}${rec.moduleTitle ? ` • ${rec.moduleTitle}` : ''}`,
        description: `Saved AF2 record for ${rec.learnerName || 'Learner'} (${rec.assessment || rec.moduleStatus || 'Recorded'})`,
        dateTime: formatDateTimeDisplay(refDate),
        timestamp: ts,
        linkUrl: '/dashboard/records',
        moduleId: rec.moduleId ? Number(rec.moduleId) : null,
        learnerId: rec.learnerId ? Number(rec.learnerId) : null,
      });
    }

    // 5. Recorded Attendance sessions by this teacher (grouped by sessionDate)
    const attendanceSessionsByDate = new Map();
    for (const att of attendanceRecords) {
      if (att.recordedById && att.recordedById !== resolvedTeacherId) continue;
      const sessionKey = toDateKey(att.sessionDate || att.createdAt);
      if (!sessionKey) continue;
      if (!attendanceSessionsByDate.has(sessionKey)) {
        attendanceSessionsByDate.set(sessionKey, {
          sessionKey,
          count: 0,
          present: 0,
          learningCenter:
            att.learningCenter?.name ||
            teacherProfile.learningCenter?.name ||
            'Assigned Learning Center',
          latestTs: 0,
          latestRef: null,
        });
      }
      const grp = attendanceSessionsByDate.get(sessionKey);
      grp.count++;
      if (att.status === 'PRESENT' || att.status === 'LATE') grp.present++;
      const ref = att.createdAt || att.sessionDate;
      const ts = ref ? new Date(ref).getTime() : 0;
      if (ts > grp.latestTs) {
        grp.latestTs = ts;
        grp.latestRef = ref;
      }
    }

    for (const [sessionKey, grp] of attendanceSessionsByDate.entries()) {
      if (!grp.latestTs) continue;
      teacherActivityCandidates.push({
        id: `tatt_${sessionKey}`,
        type: 'ATTENDANCE_RECORDED',
        activityType: 'Recorded Attendance',
        relatedEntity: `${grp.learningCenter} (${grp.count} learner${grp.count === 1 ? '' : 's'})`,
        description: `Recorded attendance for ${grp.count} learner${grp.count === 1 ? '' : 's'} on ${formatDateDisplay(sessionKey)} (${grp.present} present)`,
        dateTime: formatDateTimeDisplay(grp.latestRef),
        timestamp: grp.latestTs,
        linkUrl: '/dashboard/attendance',
        moduleId: null,
        learnerId: null,
      });
    }

    // 6. Created Announcements by this teacher
    for (const a of Array.isArray(teacherAnnouncementsRaw) ? teacherAnnouncementsRaw : []) {
      const isMyAnnouncement = a.teacherId === resolvedTeacherId || a.creatorRole === 'TEACHER';
      if (!isMyAnnouncement || a.teacherId !== resolvedTeacherId) continue;
      if (!a.createdAt) continue;
      const ts = new Date(a.createdAt).getTime();
      if (!ts || isNaN(ts)) continue;
      teacherActivityCandidates.push({
        id: `tann_${a.id}`,
        type: 'ANNOUNCEMENT_CREATED',
        activityType: 'Created an Announcement',
        relatedEntity: a.title,
        description: `Published announcement "${a.title}"${a.programLevel ? ` for ${formatAlsLevelName(a.programLevel)}` : ''}`,
        dateTime: formatDateTimeDisplay(a.createdAt),
        timestamp: ts,
        linkUrl: '/dashboard/announcements',
        moduleId: null,
        learnerId: a.targetLearnerId || null,
      });
    }

    // 7. Created Schedules by this teacher
    for (const s of Array.isArray(teacherSchedulesRaw) ? teacherSchedulesRaw : []) {
      if (s.teacherId !== resolvedTeacherId) continue;
      if (s.createdByRole && String(s.createdByRole).toUpperCase() === 'ADMIN') continue;
      const refDate = s.createdAt || s.date;
      if (!refDate) continue;
      const ts = new Date(refDate).getTime();
      if (!ts || isNaN(ts)) continue;
      teacherActivityCandidates.push({
        id: `tsched_${s.id}`,
        type: 'SCHEDULE_CREATED',
        activityType: 'Created a Schedule',
        relatedEntity: s.title,
        description: `Scheduled "${s.title}" on ${formatDateDisplay(s.date)} (${formatTimeRange(s.startTime, s.endTime)})`,
        dateTime: formatDateTimeDisplay(refDate),
        timestamp: ts,
        linkUrl: '/dashboard/schedule',
        moduleId: null,
        learnerId: null,
      });
    }

    // Sort newest first and deduplicate near-identical events logged via both JSON log and DB table
    teacherActivityCandidates.sort((a, b) => b.timestamp - a.timestamp);
    const deduplicatedTeacherActivities = [];
    for (const item of teacherActivityCandidates) {
      const isDuplicate = deduplicatedTeacherActivities.some(
        (existing) =>
          existing.activityType === item.activityType &&
          (existing.relatedEntity === item.relatedEntity ||
            (existing.moduleId && existing.moduleId === item.moduleId && existing.learnerId === item.learnerId)) &&
          Math.abs(existing.timestamp - item.timestamp) < 120000
      );
      if (!isDuplicate) {
        deduplicatedTeacherActivities.push(item);
      }
      if (deduplicatedTeacherActivities.length >= 5) break;
    }
    const recentTeacherActivities = deduplicatedTeacherActivities.slice(0, 5);

    res.json({
      teacher: {
        id: teacherProfile.id,
        fullName: teacherProfile.fullName,
        position: teacherProfile.position || 'ALS Teacher',
        specialization: teacherProfile.specialization || 'Both',
        assignedLevels: authorizedLevels,
        handledLevels: handledLevelsDisplay,
        assignedCenters: authorizedCenters,
      },
      filterOptions: {
        schoolYears: availableSchoolYears,
        levels: authorizedLevels,
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
        elementaryLearners: allowsElem ? elementaryCount : 0,
        juniorHighLearners: allowsJhs ? juniorCount : 0,
        averageAttendanceRate,
        totalAttendanceRecords: totalAttendanceCount,
        presentAttendanceRecords: totalPresentCount,
        totalSessions: distinctSessionsTotal,
        pendingSubmissions: pendingSubmissionsCount,
        reviewedSubmissions: reviewedSubmissionsCount,
        totalSubmissions: submissionGroups.size,
        reviewSubmissionsRoute,
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
      recentTeacherActivities,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

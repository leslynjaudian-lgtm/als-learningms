import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const AF2_FILE = path.join(DATA_DIR, 'af2_records.json');

const router = Router();

// Helper to read AF2 records safely
function getAf2Records() {
  try {
    if (!fs.existsSync(AF2_FILE)) return [];
    const raw = fs.readFileSync(AF2_FILE, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading AF2 file in dashboard:', err);
    return [];
  }
}

// -------------------------------------------------------------
// GET /api/dashboard/admin
// Comprehensive administrative dashboard metrics for Naawan District
// -------------------------------------------------------------
router.get('/admin', async (_req, res, next) => {
  try {
    // 1. Fetch live database records in parallel
    const [
      learningCenters,
      teachers,
      learners,
      attendanceRecords,
      announcements,
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
          createdAt: true,
          learningCenter: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.learner.findMany({
        select: {
          id: true,
          fullName: true,
          lrn: true,
          level: true,
          learningCenterId: true,
          learningCenter: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.attendance.findMany({
        include: {
          learner: { select: { id: true, fullName: true, level: true } },
          learningCenter: { select: { id: true, name: true } },
          recordedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { sessionDate: 'desc' },
      }),
      prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
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
      }),
    ]);

    // 2. Read AF2 records
    const af2Records = getAf2Records();

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

    // Average Attendance Rate strictly from Attendance Records
    const averageAttendanceRate =
      totalAttendanceCount > 0
        ? Math.round((totalPresentCount / totalAttendanceCount) * 100)
        : 0;

    // ==========================================
    // SECTION 2: LEARNER DISTRIBUTION
    // ==========================================
    // A&E Elementary and A&E Junior High School only (no BL)
    let elementaryCount = 0;
    let juniorCount = 0;

    learners.forEach((l) => {
      const lvl = (l.level || '').toUpperCase();
      if (lvl === 'ELEMENTARY' || lvl.includes('ELEM')) {
        elementaryCount++;
      } else {
        // Default / Junior High School
        juniorCount++;
      }
    });

    const learnerDistribution = {
      total: totalLearners,
      elementary: elementaryCount,
      junior: juniorCount,
      elementaryPct: totalLearners > 0 ? Math.round((elementaryCount / totalLearners) * 100) : 0,
      juniorPct: totalLearners > 0 ? Math.round((juniorCount / totalLearners) * 100) : 0,
    };

    // ==========================================
    // SECTION 3: COMMUNITY LEARNING CENTER OVERVIEW
    // ==========================================
    const clcOverview = learningCenters.map((clc) => {
      const assignedTeachers = clc.teachers.map((t) => t.fullName).filter(Boolean);
      const clcTotalLearners = clc.learners.length;
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
    // SECTION 4: ATTENDANCE OVERVIEW (Monthly Trend)
    // ==========================================
    // Group attendance records by Year-Month (e.g. "2026-09")
    const monthBuckets = new Map();

    attendanceRecords.forEach((rec) => {
      const d = rec.sessionDate ? new Date(rec.sessionDate) : new Date(rec.createdAt);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!monthBuckets.has(key)) {
        monthBuckets.set(key, {
          key,
          label: monthLabel,
          timestamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
          present: 0,
          absent: 0,
          total: 0,
        });
      }

      const bucket = monthBuckets.get(key);
      bucket.total++;
      if (rec.status === 'PRESENT' || rec.status === 'LATE') {
        bucket.present++;
      } else if (rec.status === 'ABSENT') {
        bucket.absent++;
      }
    });

    // Sort chronologically
    const monthlyAttendance = Array.from(monthBuckets.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((b) => ({
        month: b.label,
        key: b.key,
        presentRecords: b.present,
        absentRecords: b.absent,
        totalRecords: b.total,
        attendancePercentage: b.total > 0 ? Math.round((b.present / b.total) * 100) : 0,
      }));

    const attendanceTrend = {
      hasData: attendanceRecords.length > 0,
      totalRecords: totalAttendanceCount,
      presentRecords: totalPresentCount,
      absentRecords: attendanceRecords.filter((r) => r.status === 'ABSENT').length,
      averageRate: averageAttendanceRate,
      monthly: monthlyAttendance,
    };

    // ==========================================
    // SECTION 5: ALS AF2 PROGRESS OVERVIEW
    // ==========================================
    const totalAf2 = af2Records.length;
    const masteredCount = af2Records.filter(
      (r) => (r.assessment || '').toLowerCase() === 'mastered'
    ).length;
    const notMasteredCount = af2Records.filter(
      (r) => (r.assessment || '').toLowerCase() === 'not mastered'
    ).length;

    const af2Overview = {
      hasData: totalAf2 > 0,
      totalRecords: totalAf2,
      mastered: masteredCount,
      notMastered: notMasteredCount,
      masteredPct: totalAf2 > 0 ? Math.round((masteredCount / totalAf2) * 100) : 0,
      notMasteredPct: totalAf2 > 0 ? Math.round((notMasteredCount / totalAf2) * 100) : 0,
    };

    // ==========================================
    // SECTION 6: RECENT ACTIVITIES
    // ==========================================
    const activities = [];

    // Latest registered learners
    learners.slice(0, 5).forEach((l) => {
      activities.push({
        id: `lrn_${l.id}`,
        type: 'learner',
        title: `New learner registered: ${l.fullName}`,
        subtitle: l.learningCenter?.name ? `Assigned to ${l.learningCenter.name}` : 'Registered in District',
        timestamp: l.createdAt ? new Date(l.createdAt).getTime() : Date.now(),
        dateFormatted: l.createdAt ? new Date(l.createdAt).toISOString() : '',
      });
    });

    // Latest registered teachers
    teachers.slice(0, 5).forEach((t) => {
      activities.push({
        id: `tch_${t.id}`,
        type: 'teacher',
        title: `New teacher registered: ${t.fullName}`,
        subtitle: t.learningCenter?.name ? `Station: ${t.learningCenter.name}` : 'ALS Teacher',
        timestamp: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
        dateFormatted: t.createdAt ? new Date(t.createdAt).toISOString() : '',
      });
    });

    // Latest attendance records
    // Group recent attendance by center & date to avoid spamming 50 identical records
    const recentAttMap = new Map();
    attendanceRecords.slice(0, 20).forEach((att) => {
      const dateKey = att.sessionDate ? new Date(att.sessionDate).toISOString().split('T')[0] : '';
      const centerName = att.learningCenter?.name || 'Community Learning Center';
      const mapKey = `${centerName}_${dateKey}`;
      if (!recentAttMap.has(mapKey)) {
        recentAttMap.set(mapKey, {
          id: `att_${att.id}`,
          type: 'attendance',
          title: `Attendance recorded at ${centerName}`,
          subtitle: `Session date: ${dateKey || 'Recent'} • Marked by ${att.recordedBy?.fullName || 'Teacher'}`,
          timestamp: att.createdAt ? new Date(att.createdAt).getTime() : Date.now(),
          dateFormatted: att.createdAt ? new Date(att.createdAt).toISOString() : '',
        });
      }
    });
    activities.push(...Array.from(recentAttMap.values()).slice(0, 5));

    // Latest AF2 updates
    af2Records.slice(0, 5).forEach((rec) => {
      const dt = rec.updatedAt || rec.createdAt || new Date().toISOString();
      activities.push({
        id: `af2_${rec.id}`,
        type: 'af2',
        title: `AF2 update for ${rec.learnerName || 'Learner'}`,
        subtitle: `Module: ${rec.moduleTitle || 'ALS Module'} (${rec.assessment || 'In Progress'})`,
        timestamp: new Date(dt).getTime(),
        dateFormatted: dt,
      });
    });

    // Latest announcements
    announcements.slice(0, 5).forEach((ann) => {
      activities.push({
        id: `ann_${ann.id}`,
        type: 'announcement',
        title: `Announcement posted: ${ann.title}`,
        subtitle: `Audience: ${ann.audience || 'All'}`,
        timestamp: ann.createdAt ? new Date(ann.createdAt).getTime() : Date.now(),
        dateFormatted: ann.createdAt ? new Date(ann.createdAt).toISOString() : '',
      });
    });

    // Sort all activities descending by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);
    const recentActivities = activities.slice(0, 8);

    // ==========================================
    // SECTION 7: ANNOUNCEMENTS
    // ==========================================
    const recentAnnouncements = announcements.map((a) => {
      const authorName =
        a.author?.adminProfile?.fullName ||
        a.author?.teacherProfile?.fullName ||
        a.author?.username ||
        'Admin';

      const dateObj = new Date(a.createdAt);
      return {
        id: a.id,
        title: a.title,
        content: a.content,
        audience: (a.audience === 'ALL_TEACHERS' || a.audience === 'TEACHERS')
          ? 'All Teachers'
          : ((a.audience === 'ALL_LEARNERS' || a.audience === 'LEARNERS')
            ? 'All Learners'
            : (a.audience === 'SPECIFIC_LEARNER' ? 'Specific Learner' : 'All Users')),
        author: authorName,
        datePosted: dateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        createdAt: a.createdAt,
      };
    });

    res.json({
      summary: {
        totalLearningCenters,
        totalTeachers,
        totalLearners,
        averageAttendanceRate,
        totalAttendanceRecords: totalAttendanceCount,
      },
      learnerDistribution,
      clcOverview,
      attendanceTrend,
      af2Overview,
      recentActivities,
      announcements: recentAnnouncements,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

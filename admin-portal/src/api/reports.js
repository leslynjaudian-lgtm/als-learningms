import api from './axios.js';

/**
 * Fetch AF2 module records
 */
export async function getAf2Records(params = {}) {
  try {
    const res = await api.get('/af2', { params });
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    console.warn('Could not load AF2 records from API:', err);
  }

  // Fallback to localStorage if any entered on this browser
  try {
    const raw = localStorage.getItem('als_af2_records_global');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch {}

  return [];
}

/**
 * Fetch AF2 summary stats for summary cards
 */
export async function getAf2SummaryStats(params = {}) {
  try {
    const res = await api.get('/af2/summary', { params });
    if (res.data) return res.data;
  } catch (err) {
    console.warn('Could not load AF2 summary from API:', err);
  }
  return {
    totalLearners: 0,
    totalAf2Records: 0,
    totalMastered: 0,
    totalNotMastered: 0,
  };
}

/**
 * Fetch attendance records
 */
export async function getAttendanceRecords(params = {}) {
  try {
    const res = await api.get('/attendance', { params });
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    console.warn('Could not load attendance from API:', err);
  }

  // Fallback to localStorage if any recorded in this browser session
  try {
    const raw = localStorage.getItem('als_attendance_sessions');
    if (raw) {
      const sessions = JSON.parse(raw);
      if (Array.isArray(sessions) && sessions.length > 0) {
        const flat = [];
        sessions.forEach((sess) => {
          if (Array.isArray(sess.learners)) {
            sess.learners.forEach((l, idx) => {
              flat.push({
                id: `${sess.id}_${l.id || idx}`,
                learnerId: l.id,
                learnerName: l.name,
                lrn: l.lrn || '',
                level: l.level || sess.programLevel || 'A&E Elementary',
                learningCenter: l.learningCenter || sess.learningCenter || '—',
                teacherName: sess.teacherName || 'ALS Teacher',
                sessionDate: sess.date,
                date: sess.date,
                status: (l.status || 'PRESENT').toUpperCase(),
                remarks: l.remarks || '',
              });
            });
          }
        });
        return flat;
      }
    }
  } catch {}

  return [];
}

/**
 * Fetch attendance summary metrics
 */
export async function getAttendanceSummary(params = {}) {
  try {
    const res = await api.get('/attendance/summary', { params });
    if (res.data) return res.data;
  } catch (err) {
    console.warn('Could not load attendance summary from API:', err);
  }

  return {
    totalAttendanceRecords: 0,
    totalSessions: 0,
    totalLearners: 0,
    presentRecords: 0,
    absentRecords: 0,
    clcAttendanceRate: 0,
  };
}

/**
 * Fetch Module Use and Learner's Progress Report
 */
export async function getModuleProgressReport(params = {}) {
  try {
    const res = await api.get('/reports/module-progress', { params });
    if (res.data) return res.data;
  } catch (err) {
    console.error('Could not load module progress report from API:', err);
    throw err;
  }
  return {
    meta: {},
    male: [],
    female: [],
    all: [],
  };
}

/**
 * Fetch individual learner module progress details for modal
 */
export async function getLearnerModuleProgressDetails(learnerId, params = {}) {
  try {
    const res = await api.get(`/reports/module-progress/learner/${learnerId}`, { params });
    return res.data;
  } catch (err) {
    console.error('Could not load learner module progress details:', err);
    throw err;
  }
}

import api from './axios.js';

/**
 * Perform a strictly teacher-scoped global search across authorized Teacher Portal modules:
 * My Learners, Modules, Learning Centers, Schedules, Announcements, and Learner Records.
 *
 * @param {string} query - Search query string (min 2 characters)
 * @param {number|string} [teacherId] - Logged-in teacher profile ID
 */
export async function searchTeacherGlobal(query, teacherId) {
  const params = { q: String(query || '').trim() };
  if (teacherId) {
    params.teacherId = teacherId;
  }
  const res = await api.get('/search/teacher', { params });
  return res.data;
}


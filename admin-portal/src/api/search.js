import api from './axios.js';

/**
 * Perform a global search across authorized Admin Portal modules:
 * Learners, Teachers, Community Learning Centers, Learning Areas, Announcements, and Schedules.
 *
 * @param {string} query - Search query string (min 2 characters)
 */
export async function searchAdminGlobal(query) {
  const res = await api.get('/search/admin', {
    params: { q: String(query || '').trim() },
  });
  return res.data;
}


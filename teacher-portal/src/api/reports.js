import api from './axios.js';

/**
 * Fetch Module Use and Learner's Progress Report (Scoped to logged-in teacher)
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

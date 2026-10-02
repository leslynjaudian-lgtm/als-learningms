import api from './axios.js';

/**
 * Get assigned learners for the current teacher.
 * Supports query params: { teacherId, learningCenterId, level }
 * @param {Object} params
 */
export function getAssignedLearners(params = {}) {
  return api.get('/learners', { params });
}

/**
 * Get a single learner by ID.
 * @param {number|string} id
 */
export function getLearner(id) {
  return api.get(`/learners/${id}`);
}

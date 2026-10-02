import api from './axios.js';

/**
 * Get all learners.
 */
export function getLearners(params = {}) {
  return api.get('/learners', { params });
}

/**
 * Get a single learner by ID.
 */
export function getLearner(id) {
  return api.get(`/learners/${id}`);
}

/**
 * Register a new learner.
 */
export function registerLearner(data) {
  return api.post('/learners', data);
}

/**
 * Update an existing learner.
 */
export function updateLearner(id, data) {
  return api.put(`/learners/${id}`, data);
}

/**
 * Delete a learner.
 */
export function deleteLearner(id) {
  return api.delete(`/learners/${id}`);
}

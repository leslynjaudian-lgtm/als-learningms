import api from './axios.js';

/**
 * Get all learners.
 */
export function getLearners() {
  return api.get('/learners');
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
 * Delete a learner.
 */
export function deleteLearner(id) {
  return api.delete(`/learners/${id}`);
}

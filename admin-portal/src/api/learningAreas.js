import api from './axios.js';

/**
 * Get all learning areas (optional params: { status: 'active' }).
 */
export function getLearningAreas(params = {}) {
  return api.get('/learning-areas', { params });
}

/**
 * Get a single learning area by database ID.
 */
export function getLearningArea(id) {
  return api.get(`/learning-areas/${id}`);
}

/**
 * Create a new learning area.
 */
export function createLearningArea(data) {
  return api.post('/learning-areas', data);
}

/**
 * Update an existing learning area by database ID.
 */
export function updateLearningArea(id, data) {
  return api.put(`/learning-areas/${id}`, data);
}

/**
 * Delete a learning area by database ID.
 */
export function deleteLearningArea(id) {
  return api.delete(`/learning-areas/${id}`);
}


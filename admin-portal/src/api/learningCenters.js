import api from './axios.js';

/**
 * Get all learning centers.
 */
export function getLearningCenters() {
  return api.get('/learning-centers');
}

/**
 * Get total count of learning centers.
 */
export function getLearningCentersCount() {
  return api.get('/learning-centers/count');
}

/**
 * Get a single learning center by ID.
 */
export function getLearningCenter(id) {
  return api.get(`/learning-centers/${id}`);
}

/**
 * Create a new learning center.
 */
export function createLearningCenter(data) {
  return api.post('/learning-centers', data);
}

/**
 * Update an existing learning center.
 */
export function updateLearningCenter(id, data) {
  return api.put(`/learning-centers/${id}`, data);
}

/**
 * Delete a learning center.
 */
export function deleteLearningCenter(id) {
  return api.delete(`/learning-centers/${id}`);
}

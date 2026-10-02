import api from './axios.js';

/**
 * Get a single learning center by ID.
 * @param {number|string} id
 */
export function getLearningCenter(id) {
  return api.get(`/learning-centers/${id}`);
}

/**
 * Get all learning centers.
 */
export function getLearningCenters() {
  return api.get('/learning-centers');
}

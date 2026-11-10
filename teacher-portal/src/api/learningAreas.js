import api from './axios.js';

/**
 * Fetch learning areas registered by Admin.
 * Pass { status: 'active' } to retrieve only active learning areas.
 */
export function getLearningAreas(params = {}) {
  return api.get('/learning-areas', { params });
}

/**
 * Fetch a single learning area by database ID.
 */
export function getLearningArea(id) {
  return api.get(`/learning-areas/${id}`);
}


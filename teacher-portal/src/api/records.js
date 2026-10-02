import api from './axios.js';

/**
 * Fetch performance records for the authenticated teacher's assigned learners.
 * Supports params: { teacherId, learnerId, programLevel, learningCenterId, learningCenter, search }
 * @param {Object} params
 */
export function getRecords(params = {}) {
  return api.get('/records', { params });
}

/**
 * Create a new learner performance record.
 * @param {Object} data
 */
export function createRecord(data) {
  return api.post('/records', data);
}

/**
 * Update an existing performance record.
 * @param {string|number} id
 * @param {Object} data
 */
export function updateRecord(id, data) {
  return api.put(`/records/${id}`, data);
}

/**
 * Delete a performance record.
 * @param {string|number} id
 */
export function deleteRecord(id) {
  return api.delete(`/records/${id}`);
}

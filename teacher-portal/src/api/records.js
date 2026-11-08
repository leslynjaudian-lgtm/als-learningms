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
 * Fetch authoritative learner + module + submission + score context for Add/Edit Learner Record modal.
 * Supports both object params ({ learnerId, moduleId, submissionId }) and positional arguments (learnerId, moduleId, submissionId).
 * @param {Object|number|string} paramsOrLearnerId
 * @param {number|string|null} [moduleId]
 * @param {number|string|null} [submissionId]
 */
export function getRecordContext(paramsOrLearnerId = {}, moduleId = null, submissionId = null) {
  let params = {};
  if (typeof paramsOrLearnerId === 'object' && paramsOrLearnerId !== null) {
    params = paramsOrLearnerId;
  } else {
    params = {
      learnerId: paramsOrLearnerId,
      ...(moduleId ? { moduleId } : {}),
      ...(submissionId ? { submissionId } : {}),
    };
  }
  return api.get('/records/context', { params });
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

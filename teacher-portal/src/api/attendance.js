import api from './axios.js';

/**
 * Get attendance records.
 * Supports query params: { learningCenterId, teacherId, level, learnerId, fromDate, toDate, status }
 * @param {Object} params
 */
export function getAttendanceRecords(params = {}) {
  return api.get('/attendance', { params });
}

/**
 * Record attendance batch.
 * @param {Object} payload { learningCenterId, teacherId, sessionDate, records }
 */
export function recordAttendanceBatch(payload) {
  return api.post('/attendance/batch', payload);
}

/**
 * Get attendance summary metrics.
 * @param {Object} params
 */
export function getAttendanceSummary(params = {}) {
  return api.get('/attendance/summary', { params });
}

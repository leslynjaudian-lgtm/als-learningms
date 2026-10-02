import api from './axios.js';

/**
 * Get schedules assigned to the logged-in teacher (or scoped).
 */
export function getSchedules(params = {}) {
  return api.get('/schedules', { params });
}

/**
 * Get a single schedule by ID.
 */
export function getSchedule(id) {
  return api.get(`/schedules/${id}`);
}

/**
 * Create a new schedule.
 */
export function createSchedule(data) {
  return api.post('/schedules', data);
}

/**
 * Update an existing schedule.
 */
export function updateSchedule(id, data) {
  return api.put(`/schedules/${id}`, data);
}

/**
 * Delete a schedule.
 */
export function deleteSchedule(id) {
  return api.delete(`/schedules/${id}`);
}

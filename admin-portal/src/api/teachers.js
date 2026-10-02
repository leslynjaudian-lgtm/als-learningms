import api from './axios.js';

/**
 * Get all teachers.
 */
export function getTeachers() {
  return api.get('/teachers');
}

/**
 * Get a single teacher by ID.
 */
export function getTeacher(id) {
  return api.get(`/teachers/${id}`);
}

/**
 * Register a new teacher.
 */
export function registerTeacher(data) {
  return api.post('/teachers', data);
}

/**
 * Update an existing teacher.
 */
export function updateTeacher(id, data) {
  return api.put(`/teachers/${id}`, data);
}

/**
 * Delete a teacher.
 */
export function deleteTeacher(id) {
  return api.delete(`/teachers/${id}`);
}

/**
 * Get next auto-incrementing teacher username (e.g. als-t1001)
 */
export function getNextTeacherUsername() {
  return api.get('/teachers/next-username');
}

/**
 * Check if a teacher username is available
 */
export function checkTeacherUsername(username, excludeTeacherId) {
  return api.get('/teachers/check-username', {
    params: { username, excludeTeacherId },
  });
}


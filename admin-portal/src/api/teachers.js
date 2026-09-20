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
 * Delete a teacher.
 */
export function deleteTeacher(id) {
  return api.delete(`/teachers/${id}`);
}

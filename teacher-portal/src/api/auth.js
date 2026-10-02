import api from './axios.js';

/**
 * Log in a teacher using their credentials created from Admin Portal.
 * @param {Object} credentials - { username, password }
 */
export function loginTeacher(credentials) {
  const id = (credentials.username || credentials.teacherId || credentials.teacherID || '').trim();
  return api.post('/auth/login', {
    ...credentials,
    username: id,
    teacherId: id,
    role: 'TEACHER',
  });
}

/**
 * Fetch a teacher's full profile including assigned Learning Centers.
 * @param {number|string} id
 */
export function getTeacherProfile(id) {
  return api.get(`/teachers/${id}`);
}

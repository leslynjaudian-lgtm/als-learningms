import api from './axios.js';

/**
 * Fetch strictly teacher-scoped dashboard metrics for the logged-in ALS Teacher.
 * Supports optional filters: { teacherId, schoolYear, level, learningCenterId }
 */
export async function getTeacherDashboardData(params = {}) {
  const cleanParams = {};
  if (params.teacherId) cleanParams.teacherId = params.teacherId;
  if (params.schoolYear) cleanParams.schoolYear = params.schoolYear;
  if (params.level) cleanParams.level = params.level;
  if (params.learningCenterId) cleanParams.learningCenterId = params.learningCenterId;

  const res = await api.get('/dashboard/teacher', { params: cleanParams });
  return res.data;
}


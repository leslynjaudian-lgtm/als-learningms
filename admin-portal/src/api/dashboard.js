import api from './axios.js';

/**
 * Fetch comprehensive administrative dashboard metrics for Naawan District.
 * Supports optional filters: { schoolYear, level, learningCenterId }
 */
export async function getAdminDashboardData(params = {}) {
  const cleanParams = {};
  if (params.schoolYear) cleanParams.schoolYear = params.schoolYear;
  if (params.level) cleanParams.level = params.level;
  if (params.learningCenterId) cleanParams.learningCenterId = params.learningCenterId;

  const res = await api.get('/dashboard/admin', { params: cleanParams });
  return res.data;
}

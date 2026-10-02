import api from './axios.js';

/**
 * Fetch comprehensive administrative dashboard metrics for Naawan District.
 */
export async function getAdminDashboardData() {
  const res = await api.get('/dashboard/admin');
  return res.data;
}

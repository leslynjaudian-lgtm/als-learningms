import api from './axios.js';

/**
 * Get all announcements.
 */
export function getAnnouncements(params) {
  return api.get('/announcements', { params });
}

/**
 * Create a new announcement.
 */
export function createAnnouncement(data) {
  return api.post('/announcements', data);
}

/**
 * Update an announcement.
 */
export function updateAnnouncement(id, data) {
  return api.put(`/announcements/${id}`, data);
}

/**
 * Delete an announcement.
 */
export function deleteAnnouncement(id) {
  return api.delete(`/announcements/${id}`);
}

export function publishAnnouncement(id) {
  return api.post(`/announcements/${id}/publish`);
}

export function scheduleAnnouncement(id, data) {
  return api.post(`/announcements/${id}/schedule`, data);
}

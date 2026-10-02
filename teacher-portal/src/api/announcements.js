import api from './axios.js';

export function getAnnouncements(params) {
  return api.get('/announcements', { params });
}

export function createAnnouncement(data) {
  return api.post('/announcements', data);
}

export function updateAnnouncement(id, data) {
  return api.put(`/announcements/${id}`, data);
}

export function deleteAnnouncement(id) {
  return api.delete(`/announcements/${id}`);
}

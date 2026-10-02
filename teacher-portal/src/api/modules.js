import api from './axios.js';

/**
 * Fetch modules list with optional filters.
 * @param {Object} params - { teacherId, learningCenterId, level, strandId }
 */
export function getModules(params = {}) {
  return api.get('/modules', { params });
}

/**
 * Fetch a single module by ID.
 * @param {number|string} id
 */
export function getModule(id) {
  return api.get(`/modules/${id}`);
}

/**
 * Upload a module file (PDF, DOCX, JPG, JPEG, PNG).
 * @param {FormData} formData
 */
export function uploadModuleFile(formData) {
  return api.post('/modules/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Create a new module with Pre-Test, Post-Test, and Learning Material.
 * @param {Object} data
 */
export function createModule(data) {
  return api.post('/modules', data);
}

/**
 * Update an existing module.
 * @param {number|string} id
 * @param {Object} data
 */
export function updateModule(id, data) {
  return api.put(`/modules/${id}`, data);
}

/**
 * Delete a module.
 * @param {number|string} id
 */
export function deleteModule(id) {
  return api.delete(`/modules/${id}`);
}


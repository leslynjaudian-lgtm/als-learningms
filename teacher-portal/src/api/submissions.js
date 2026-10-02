import api from './axios.js';

/**
 * Fetch submissions list with optional filters.
 * @param {Object} params - { moduleId, learnerId, teacherId }
 */
export function getSubmissions(params = {}) {
  return api.get('/submissions', { params });
}

/**
 * Update/review a submission.
 * @param {number|string} id
 * @param {Object} data - { teacherRemarks, status, grade }
 */
export function updateSubmission(id, data) {
  return api.put(`/submissions/${id}`, data);
}

/**
 * Fetch actual module assessment scores for a specific learner & module.
 * @param {number|string} moduleId
 * @param {number|string} learnerId
 */
export function getLearnerAssessmentScores(moduleId, learnerId) {
  return api.get('/submissions/scores', { params: { moduleId, learnerId } });
}


const LEGACY_PROGRESS_KEY_PATTERN = /^als_module_progress_\d+$/;

/**
 * Resolve the currently authenticated learner's profile ID from session storage.
 * Returns null if unauthenticated or not a LEARNER account.
 * @returns {string|null}
 */
export function getAuthenticatedLearnerId() {
  try {
    if (localStorage.getItem('als_learner_authenticated') !== 'true') {
      return null;
    }
    const raw = localStorage.getItem('als_learner_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u || u.role !== 'LEARNER') return null;
    const id = u.learnerId ?? u.profile?.id ?? u.id;
    if (id === undefined || id === null || id === '') return null;
    return String(id);
  } catch {
    return null;
  }
}

/**
 * Build a strictly learner- and module-scoped localStorage key.
 * Returns null when no authenticated learner is signed in.
 * @param {string|number} moduleId
 * @param {boolean} [isMock=false]
 * @returns {string|null}
 */
export function getModuleProgressStorageKey(moduleId, isMock = false) {
  const learnerId = getAuthenticatedLearnerId();
  if (!learnerId || moduleId === undefined || moduleId === null || moduleId === '') {
    return null;
  }
  if (isMock) {
    return `als_mock_progress_${learnerId}_LS2-MOCK-001`;
  }
  return `moduleProgress_${learnerId}_${String(moduleId)}`;
}

/**
 * Purge legacy global/unscoped module progress keys that could leak data between accounts.
 */
export function clearLegacySharedModuleProgressKeys() {
  try {
    localStorage.removeItem('als_ls2_mock_progress');
    localStorage.removeItem('als_mock_progress_guest_LS2-MOCK-001');
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (LEGACY_PROGRESS_KEY_PATTERN.test(k)) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore storage access issues
  }
}

/**
 * Clear current learner session credentials, caches, and notify listeners to reset in-memory state.
 */
export function clearLearnerSessionStorage() {
  try {
    localStorage.removeItem('als_learner_authenticated');
    localStorage.removeItem('als_learner_user');
    localStorage.removeItem('als_learner_token');
    clearLegacySharedModuleProgressKeys();
  } catch {
    // ignore
  }
  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new CustomEvent('als-learner-session-changed'));
  } catch {
    // ignore
  }
}


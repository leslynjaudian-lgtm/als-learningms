import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/reading_pages.json');

let cache = null;

function loadStore() {
  if (cache) return cache;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      cache = JSON.parse(raw) || {};
    } else {
      cache = {};
    }
  } catch (err) {
    console.warn('Could not read reading_pages.json, initializing empty store:', err);
    cache = {};
  }
  return cache;
}

function persistStore() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(cache || {}, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist reading_pages.json:', err);
  }
}

/**
 * Retrieve learner reading state (currentPage, pagesRead, highestPageReached, viewMode)
 * @param {number|string} learnerId
 * @param {number|string} moduleId
 * @returns {{ currentPage: number, pagesRead: number[], highestPageReached: number, viewMode: string }}
 */
export function getLearnerReadingState(learnerId, moduleId) {
  if (!learnerId || !moduleId) {
    return { currentPage: 1, pagesRead: [], highestPageReached: 0, viewMode: 'long' };
  }
  const store = loadStore();
  const key = `${learnerId}_${moduleId}`;
  const data = store[key];
  if (!data) {
    return { currentPage: 1, pagesRead: [], highestPageReached: 0, viewMode: 'long' };
  }
  if (Array.isArray(data)) {
    const valid = Array.from(new Set(data.map(Number).filter((n) => n > 0))).sort((a, b) => a - b);
    const highest = valid.length > 0 ? Math.max(...valid) : 0;
    return {
      currentPage: valid.length > 0 ? valid[valid.length - 1] : 1,
      pagesRead: valid,
      highestPageReached: highest,
      viewMode: 'long',
    };
  }
  const pages = Array.isArray(data.pagesRead || data.pages)
    ? Array.from(new Set((data.pagesRead || data.pages).map(Number).filter((n) => n > 0))).sort((a, b) => a - b)
    : [];
  const highest = pages.length > 0 ? Math.max(...pages) : 0;
  return {
    currentPage: Number(data.currentPage) > 0 ? Number(data.currentPage) : (pages.length > 0 ? pages[pages.length - 1] : 1),
    pagesRead: pages,
    highestPageReached: Math.max(highest, Number(data.highestPageReached) || 0),
    viewMode: data.viewMode || 'long',
  };
}

/**
 * Save learner reading state including current page and read history.
 * @param {number|string} learnerId
 * @param {number|string} moduleId
 * @param {Object} state
 * @returns {Object} updated reading state
 */
export function saveLearnerReadingState(learnerId, moduleId, { currentPage, pagesRead, viewMode, totalPages }) {
  if (!learnerId || !moduleId) return null;
  const store = loadStore();
  const key = `${learnerId}_${moduleId}`;
  const prev = getLearnerReadingState(learnerId, moduleId);

  const incomingPages = Array.isArray(pagesRead) ? pagesRead.map(Number).filter((n) => n > 0) : [];
  const mergedPages = Array.from(new Set([...prev.pagesRead, ...incomingPages])).sort((a, b) => a - b);
  const curPage = Number(currentPage) > 0 ? Number(currentPage) : prev.currentPage;
  const highest = Math.max(prev.highestPageReached, curPage, ...mergedPages);

  const state = {
    currentPage: curPage,
    pagesRead: mergedPages,
    highestPageReached: highest,
    viewMode: viewMode || prev.viewMode || 'long',
  };
  store[key] = state;
  persistStore();
  return state;
}

/**
 * Retrieve unique pages read by learner for a module.
 * @param {number|string} learnerId
 * @param {number|string} moduleId
 * @returns {number[]} sorted unique array of page numbers
 */
export function getLearnerPagesRead(learnerId, moduleId) {
  return getLearnerReadingState(learnerId, moduleId).pagesRead;
}

/**
 * Save and merge unique pages read by learner for a module.
 * @param {number|string} learnerId
 * @param {number|string} moduleId
 * @param {number[]} newPages
 * @returns {number[]} merged sorted unique array of page numbers
 */
export function saveLearnerPagesRead(learnerId, moduleId, newPages) {
  const state = saveLearnerReadingState(learnerId, moduleId, {
    pagesRead: newPages,
  });
  return state ? state.pagesRead : [];
}

/**
 * Set and overwrite verified unique pages read by learner for a module.
 * @param {number|string} learnerId
 * @param {number|string} moduleId
 * @param {number[]} pages
 * @returns {number[]} sorted unique array of page numbers
 */
export function setLearnerPagesRead(learnerId, moduleId, pages) {
  if (!learnerId || !moduleId) return [];
  const store = loadStore();
  const key = `${learnerId}_${moduleId}`;
  const prev = getLearnerReadingState(learnerId, moduleId);
  const valid = Array.isArray(pages)
    ? Array.from(new Set(pages.map(Number).filter((n) => n > 0))).sort((a, b) => a - b)
    : [];
  const highest = valid.length > 0 ? Math.max(...valid) : 0;
  store[key] = {
    ...prev,
    pagesRead: valid,
    highestPageReached: Math.max(prev.highestPageReached, highest),
  };
  persistStore();
  return valid;
}


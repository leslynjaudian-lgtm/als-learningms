/**
 * Authoritative 4-step module progress calculation shared across:
 * - Learner Home (DashboardView.vue)
 * - My Modules (MyModulesView.vue)
 * - Module Details (MockModuleStudyView.vue)
 * - Learner Progress (ProgressView.vue)
 *
 * Each step contributes up to 25%:
 * 1. Pre-Test: 25%
 * 2. Read the Module: 25% distributed proportionally across unique PDF pages reached
 * 3. Post-Test: 25%
 * 4. Submit Your Activity: 25%
 *
 * Priority Rules:
 * - If Step 4 is submitted: 100%
 * - If Step 3 (Post-Test) is completed/submitted: at least 75%
 * - If Step 1 (Pre-Test) is not completed: 0%
 * - Otherwise (reading in progress): Math.round(25 + (highestPageReached / totalPages) * 25)
 */

/**
 * Calculates reading progress percentage (0 - 25) based on unique pages read.
 * @param {number} pagesReadCount
 * @param {number} totalPages
 * @returns {number} floating-point percentage in range [0, 25]
 */
export function calculateReadingProgressPercent(pagesReadCount, totalPages) {
  const total = Number(totalPages) || 0;
  const count = Number(pagesReadCount) || 0;
  if (total <= 0) return 0;
  if (count >= total) return 25;
  if (count <= 0) return 0;
  return Math.min(25, (count / total) * 25);
}

/**
 * Checks whether Step 2 (Read the Module) is completed.
 * Completed when all required PDF pages have been viewed, when post-test is completed,
 * or if legitimate historical completion exists.
 * @param {number} pagesReadCount
 * @param {number} totalPages
 * @param {boolean} isLegitimateFullCompletion
 * @param {boolean} postTestCompleted
 * @returns {boolean}
 */
export function isReadingStepCompleted(
  pagesReadCount,
  totalPages,
  isLegitimateFullCompletion = false,
  postTestCompleted = false
) {
  if (isLegitimateFullCompletion || postTestCompleted) return true;
  const total = Number(totalPages) || 0;
  const count = Number(pagesReadCount) || 0;
  return Boolean(total > 0 && count >= total);
}

/**
 * Calculates overall module progress percentage (0 - 100).
 * Dynamic reading progress before Post-Test based on current reading page;
 * locked to >= 75% once Post-Test is submitted; and 100% once Step 4 activity is submitted.
 *
 * @param {Object} params
 * @param {boolean} [params.preTestCompleted]
 * @param {boolean} [params.preTestDone]
 * @param {number} [params.currentPage]
 * @param {number} [params.highestPageReached]
 * @param {number} [params.pagesReadCount]
 * @param {number} [params.totalPages=29]
 * @param {boolean} [params.postTestCompleted]
 * @param {boolean} [params.postTestDone]
 * @param {boolean} [params.activitySubmitted]
 * @param {boolean} [params.activityDone]
 * @param {boolean} [params.isLegitimateFullCompletion]
 * @returns {number} whole-number percentage [0, 100]
 */
export function calculateOverallModuleProgress({
  preTestCompleted,
  preTestDone = false,
  currentPage,
  highestPageReached,
  pagesReadCount = 0,
  totalPages = 29,
  postTestCompleted,
  postTestDone = false,
  activitySubmitted,
  activityDone = false,
  isLegitimateFullCompletion = false
} = {}) {
  const isActSubmitted = Boolean(activitySubmitted ?? activityDone);
  const isPostCompleted = Boolean(postTestCompleted ?? postTestDone);
  const isPreCompleted = Boolean(preTestCompleted ?? preTestDone);

  if (isLegitimateFullCompletion || isActSubmitted) {
    return 100;
  }

  if (isPostCompleted) {
    return 75;
  }

  if (!isPreCompleted) {
    return 0;
  }

  const safeTotal = Math.max(0, Number(totalPages) || 29);

  // If currentPage is provided (> 0), use it as the current reading position.
  // Otherwise fall back to highestPageReached or pagesReadCount.
  const pageNum = (currentPage !== undefined && currentPage !== null && Number(currentPage) > 0)
    ? Number(currentPage)
    : Math.max(Number(highestPageReached) || 0, Number(pagesReadCount) || 0);

  const safePage = Math.max(0, Math.min(pageNum, safeTotal));
  const readingProgress = safeTotal > 0 ? (safePage / safeTotal) * 25 : 0;

  return Math.min(100, Math.max(0, Math.round(25 + readingProgress)));
}

/**
 * Alias matching the exact signature requested:
 * calculateModuleProgress({ preTestCompleted, postTestCompleted, activitySubmitted, highestPageReached, totalPages })
 */
export function calculateModuleProgress(params) {
  return calculateOverallModuleProgress(params);
}



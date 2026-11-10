<template>
  <div class="my-modules-page">
    <!-- Page Title & Subtitle -->
    <div class="modules-header">
      <h1 class="page-title">My Modules</h1>
      <p class="page-subtitle">Access your learning modules and study at your own pace.</p>
    </div>

    <!-- Horizontally Scrollable Learning Strand Filters -->
    <div class="strand-filters-section" role="region" aria-label="Learning Strand Filters">
      <div
        ref="scrollContainerRef"
        class="strand-filters-scroll-wrapper"
        @scroll="updateScrollPosition"
      >
        <div class="strand-filters-track">
          <button
            v-for="filter in availableFilters"
            :key="filter.key"
            type="button"
            class="strand-filter-pill"
            :class="{ active: currentStrand === filter.key }"
            @click="selectStrand(filter.key, $event)"
            :aria-label="filter.fullName"
          >
            <!-- Green check-circle icon for Completed filter -->
            <svg
              v-if="filter.isCompleted"
              class="filter-check-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span class="pill-label">{{ filter.shortLabel }}</span>
            <span class="pill-badge">{{ getModuleCount(filter.key) }}</span>
          </button>
        </div>
      </div>

      <!-- Thin Horizontal Scrollbar directly underneath the filter buttons -->
      <div
        v-if="canScroll"
        class="horizontal-scrollbar-track"
        @click="handleTrackClick"
        role="scrollbar"
        aria-orientation="horizontal"
        :aria-valuenow="Math.round(scrollProgressRatio * 100)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="horizontal-scrollbar-thumb"
          :style="{
            width: `${thumbWidthPercent}%`,
            left: `${thumbLeftPercent}%`
          }"
          @mousedown.prevent="startThumbDrag"
          @touchstart.prevent="startThumbTouch"
        ></div>
      </div>
    </div>

    <!-- Active Learning Strand Full Name Banner -->
    <div class="active-strand-banner">
      <div class="strand-banner-text">
        <span class="strand-banner-eyebrow">
          {{ currentStrand === 'all' || currentStrand === 'completed' ? 'Category' : 'Learning Strand' }}
        </span>
        <h2 class="strand-banner-title">{{ currentStrandFullName }}</h2>
      </div>
      <div class="strand-banner-count-badge">
        {{ filteredModules.length }} {{ filteredModules.length === 1 ? 'module' : 'modules' }}
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="learner-card loading-card-box">
      <div class="loading-spinner-circle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
          <line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
        </svg>
      </div>
      <p class="loading-text">Loading modules...</p>
    </div>

    <!-- Global Empty State: No modules available at all -->
    <div v-else-if="allModules.length === 0" class="learner-card empty-card-box">
      <div class="empty-icon-circle">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
      <h3 class="empty-title">No Learning Modules</h3>
      <p class="empty-desc">
        There are no learning modules available at this time.
      </p>
    </div>

    <!-- Strand Empty State: Specific learning strand or completed has no modules -->
    <div v-else-if="filteredModules.length === 0" class="learner-card empty-card-box strand-empty-box">
      <div class="empty-icon-circle strand-empty-circle">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
      </div>
      <h3 class="empty-title">
        {{ currentStrand === 'completed' ? 'No completed modules yet' : 'No modules available for this learning strand yet.' }}
      </h3>
      <p class="empty-desc">
        <template v-if="currentStrand === 'completed'">
          You have not finished any learning modules yet. Complete your modules to see them here.
        </template>
        <template v-else>
          There are currently no published modules for <strong>{{ currentStrandFullName }}</strong>. You can explore other learning strands above.
        </template>
      </p>
      <button type="button" class="btn-all-strands-action" @click="selectStrand('all')">
        View All Modules ({{ allCount }})
      </button>
    </div>

    <!-- Vertical Simple Module Card List (Mobile-First Reference Layout) -->
    <div v-else class="modules-vertical-list">
      <router-link
        v-for="mod in filteredModules"
        :key="mod.id"
        :to="`/modules/${mod.id}`"
        class="module-card-item"
      >
        <!-- Left Section: Icon + Text Details -->
        <div class="card-left-section">
          <!-- Module Thumbnail (First page of uploaded PDF) -->
          <ModuleThumbnail
            :file-url="mod.fileUrl"
            :cover-image-url="mod.coverImageUrl"
            :title="mod.title"
            :module-id="mod.id"
          />

          <!-- Title, Instructions, Strand, Code & Status -->
          <div class="card-content-wrap">
            <div class="card-upper-info">
              <h3 class="card-module-title">{{ mod.title }}</h3>
              <p v-if="getModuleInstructions(mod)" class="card-module-instructions">
                {{ getModuleInstructions(mod) }}
              </p>
            </div>

            <div class="card-bottom-info">
              <div class="card-module-strand">{{ getModuleStrandName(mod) }}</div>

              <div class="card-pills-row">
                <span v-if="getModuleBadgeCode(mod)" class="pill-code-badge">
                  {{ getModuleBadgeCode(mod) }}
                </span>
                <span class="pill-status-badge" :class="getStatusClass(mod)">
                  {{ getProgressStatusLabel(mod) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right-Facing Arrow -->
        <div class="card-arrow-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import api from '../api/axios';
import ModuleThumbnail from '../components/ModuleThumbnail.vue';
import {
  formatStrandCode,
  formatStrandName,
  formatStrandAndCode,
} from '../utils/formatStrand.js';
import { stripRichTextToPlain } from '../utils/sanitizeRichText.js';

const currentStrand = ref('all');
const rawModules = ref([]);
const rawStrands = ref([]);
const loading = ref(false);

const scrollContainerRef = ref(null);
const canScroll = ref(true);
const scrollProgressRatio = ref(0);
const thumbWidthPercent = ref(35);

// All published and assigned teacher modules (excluding any demo/mock entries)
const allModules = computed(() => {
  const list = Array.isArray(rawModules.value) ? rawModules.value : [];
  return list.filter(
    (m) =>
      m &&
      typeof m === 'object' &&
      m.code !== 'LS2-MOCK-001' &&
      m.id !== 'ls2-mock-001' &&
      (!m.status || String(m.status).toUpperCase() === 'PUBLISHED')
  );
});

// Build filter pills dynamically from Admin-registered Learning Areas (+ any strand present on assigned modules)
const availableFilters = computed(() => {
  const areaMap = new Map();

  if (Array.isArray(rawStrands.value)) {
    for (const area of rawStrands.value) {
      if (!area || !area.id) continue;
      areaMap.set(Number(area.id), {
        id: Number(area.id),
        code: formatStrandCode(area.code),
        name: formatStrandName(area.name, area.code),
      });
    }
  }

  // Ensure modules whose Learning Area became inactive still have a filter entry if assigned to the learner
  for (const mod of allModules.value) {
    const areaId = Number(mod.learningAreaId || mod.learningArea?.id || 0);
    if (areaId && !areaMap.has(areaId)) {
      areaMap.set(areaId, {
        id: areaId,
        code: formatStrandCode(mod.learningArea?.code || mod.strandCode || mod.code || ''),
        name: formatStrandName(mod.learningArea?.name || mod.strand || 'General Strand'),
      });
    }
  }

  const areas = Array.from(areaMap.values());
  const codeCounts = new Map();
  for (const a of areas) {
    const key = String(a.code || '').trim().toUpperCase();
    codeCounts.set(key, (codeCounts.get(key) || 0) + 1);
  }

  const dynamicStrandFilters = areas.map((a) => {
    const codeKey = String(a.code || '').trim().toUpperCase();
    const sharesCode = (codeCounts.get(codeKey) || 0) > 1;
    let shortLabel = a.code || a.name;
    if (sharesCode && a.code) {
      const parenMatch = a.name.match(/\(([^)]+)\)\s*$/);
      shortLabel = parenMatch ? `${a.code} ${parenMatch[1]}` : `${a.code} · ${a.name}`;
    }

    return {
      key: `area-${a.id}`,
      learningAreaId: a.id,
      code: a.code,
      shortLabel,
      fullName: formatStrandAndCode(a.code, a.name) || a.name,
    };
  });

  return [
    {
      key: 'all',
      code: 'ALL',
      shortLabel: 'All',
      fullName: 'All Modules',
    },
    {
      key: 'completed',
      code: 'COMPLETED',
      shortLabel: 'Completed',
      fullName: 'Completed Modules',
      isCompleted: true,
    },
    ...dynamicStrandFilters,
  ];
});

// Total count
const allCount = computed(() => (Array.isArray(allModules.value) ? allModules.value.length : 0));

// Helper to safely access a filter item by key from availableFilters
function getFilterByKey(key) {
  if (!key) return null;
  return availableFilters.value.find((s) => s && s.key === key) || null;
}

// Full name of selected filter
const currentStrandFullName = computed(() => {
  const filter = getFilterByKey(currentStrand.value);
  return filter ? filter.fullName : 'All Modules';
});

// Module card strand helpers
function getModuleStrandName(mod) {
  if (!mod || typeof mod !== 'object') return 'General Strand';
  const raw = mod.learningArea?.name || mod.strand || 'General Strand';
  return formatStrandName(raw, mod.learningArea?.code || mod.strandCode || mod.code);
}

function getModuleInstructions(mod) {
  if (!mod || typeof mod !== 'object') return '';
  const raw = mod.instructions || mod.description || '';
  return stripRichTextToPlain(raw);
}

function getModuleBadgeCode(mod) {
  if (!mod || typeof mod !== 'object') return '';
  const raw = mod.code || mod.strandCode || mod.learningArea?.code || '';
  return formatStrandCode(raw);
}

// Check if a module is completed by the learner
function isModuleCompleted(mod) {
  if (!mod || typeof mod !== 'object') return false;
  const pct = Number(mod.progress ?? 0);
  const hasSavedCompletedRecord = Array.isArray(mod.learnerProgress) &&
    mod.learnerProgress.some((lp) => lp && (lp.status === 'COMPLETED' || Boolean(lp.completedAt)));
  return Boolean(
    mod.completed === true ||
    mod.progressStatus === 'COMPLETED' ||
    Boolean(mod.completedAt) ||
    hasSavedCompletedRecord ||
    pct >= 100
  );
}

function isModuleInProgress(mod) {
  if (!mod || isModuleCompleted(mod)) return false;
  const pct = Number(mod.progress ?? 0);
  if (pct > 0) return true;

  const hasReadingActivity = Boolean(
    (mod.completedPages != null && Number(mod.completedPages) > 0) ||
    (Array.isArray(mod.pagesRead) && mod.pagesRead.length > 0) ||
    (Number(mod.highestPageReached) > 0 && Array.isArray(mod.pagesRead) && mod.pagesRead.length > 0) ||
    mod.readingStarted === true
  );

  const hasAssessmentActivity = Boolean(
    mod.preTestScore != null ||
    mod.postTestScore != null ||
    mod.hasPreTestAttempt === true ||
    (Array.isArray(mod.assessments) && mod.assessments.some((a) => Array.isArray(a.attempts) && a.attempts.length > 0))
  );

  const hasSubmissionActivity = Boolean(
    (Array.isArray(mod.submissions) && mod.submissions.length > 0) ||
    mod.activitySubmitted === true
  );

  return hasReadingActivity || hasAssessmentActivity || hasSubmissionActivity;
}

// Strand matching function using Learning Area database ID
function matchesStrand(mod, strandKey) {
  if (!mod || typeof mod !== 'object') return false;
  if (!strandKey || strandKey === 'all') return true;
  if (strandKey === 'completed') return isModuleCompleted(mod);
  const filter = getFilterByKey(strandKey);
  if (!filter || !filter.learningAreaId) return false;
  const modAreaId = Number(mod.learningAreaId || mod.learningArea?.id || 0);
  return modAreaId === Number(filter.learningAreaId);
}

// Module count for filter pill badge
function getModuleCount(strandKey) {
  const mods = Array.isArray(allModules.value) ? allModules.value : [];
  if (!strandKey || strandKey === 'all') {
    return mods.length;
  }
  if (strandKey === 'completed') {
    return mods.filter(isModuleCompleted).length;
  }
  return mods.filter((m) => matchesStrand(m, strandKey)).length;
}

// Filtered modules list
const filteredModules = computed(() => {
  const list = Array.isArray(allModules.value) ? allModules.value : [];
  if (currentStrand.value === 'all') {
    return list;
  }
  if (currentStrand.value === 'completed') {
    return list.filter(isModuleCompleted);
  }
  return list.filter((m) => matchesStrand(m, currentStrand.value));
});

function selectStrand(key, event) {
  currentStrand.value = key;
  if (event?.currentTarget?.scrollIntoView) {
    event.currentTarget.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
  }
}

// Progress status label: Not Started, In Progress, Completed
function getProgressStatusLabel(mod) {
  if (isModuleCompleted(mod)) {
    return 'Completed';
  }
  if (isModuleInProgress(mod)) {
    return 'In Progress';
  }
  return 'Not Started';
}

function getStatusClass(mod) {
  const status = getProgressStatusLabel(mod);
  if (status === 'Completed') return 'status-completed';
  if (status === 'In Progress') return 'status-in-progress';
  return 'status-not-started';
}

// Scrollbar calculations
function updateScrollMetrics() {
  const el = scrollContainerRef.value;
  if (!el) return;
  const clientW = el.clientWidth;
  const scrollW = el.scrollWidth;
  const maxScroll = scrollW - clientW;

  if (maxScroll > 2) {
    canScroll.value = true;
    const ratio = clientW / scrollW;
    thumbWidthPercent.value = Math.max(18, Math.min(65, ratio * 100));
    scrollProgressRatio.value = Math.max(0, Math.min(1, el.scrollLeft / maxScroll));
  } else {
    canScroll.value = false;
    scrollProgressRatio.value = 0;
  }
}

function updateScrollPosition() {
  const el = scrollContainerRef.value;
  if (!el) return;
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll > 0) {
    scrollProgressRatio.value = Math.max(0, Math.min(1, el.scrollLeft / maxScroll));
  }
}

const thumbLeftPercent = computed(() => {
  return scrollProgressRatio.value * (100 - thumbWidthPercent.value);
});

function handleTrackClick(e) {
  const el = scrollContainerRef.value;
  if (!el) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll > 0) {
    el.scrollTo({
      left: ratio * maxScroll,
      behavior: 'smooth',
    });
  }
}

let isDragging = false;
let startX = 0;
let startScrollLeft = 0;

function startThumbDrag(e) {
  isDragging = true;
  startX = e.clientX;
  startScrollLeft = scrollContainerRef.value?.scrollLeft || 0;
  window.addEventListener('mousemove', onThumbDrag);
  window.addEventListener('mouseup', stopThumbDrag);
}

function onThumbDrag(e) {
  if (!isDragging || !scrollContainerRef.value) return;
  const deltaX = e.clientX - startX;
  const clientW = scrollContainerRef.value.clientWidth;
  const scrollW = scrollContainerRef.value.scrollWidth;
  const maxScroll = scrollW - clientW;
  if (maxScroll <= 0) return;

  const scrollRatio = scrollW / clientW;
  scrollContainerRef.value.scrollLeft = startScrollLeft + deltaX * scrollRatio;
}

function stopThumbDrag() {
  isDragging = false;
  window.removeEventListener('mousemove', onThumbDrag);
  window.removeEventListener('mouseup', stopThumbDrag);
}

function startThumbTouch(e) {
  if (!e.touches[0]) return;
  isDragging = true;
  startX = e.touches[0].clientX;
  startScrollLeft = scrollContainerRef.value?.scrollLeft || 0;
  window.addEventListener('touchmove', onThumbTouchMove, { passive: false });
  window.addEventListener('touchend', stopThumbTouch);
}

function onThumbTouchMove(e) {
  if (!isDragging || !scrollContainerRef.value || !e.touches[0]) return;
  const deltaX = e.touches[0].clientX - startX;
  const clientW = scrollContainerRef.value.clientWidth;
  const scrollW = scrollContainerRef.value.scrollWidth;
  const maxScroll = scrollW - clientW;
  if (maxScroll <= 0) return;

  const scrollRatio = scrollW / clientW;
  scrollContainerRef.value.scrollLeft = startScrollLeft + deltaX * scrollRatio;
  e.preventDefault();
}

function stopThumbTouch() {
  isDragging = false;
  window.removeEventListener('touchmove', onThumbTouchMove);
  window.removeEventListener('touchend', stopThumbTouch);
}

function handleWheel(e) {
  const el = scrollContainerRef.value;
  if (!el) return;
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  }
}

// Load backend modules and registered learning strands
async function loadModules() {
  loading.value = true;
  try {
    const [modRes, strandRes] = await Promise.allSettled([
      api.get('/modules'),
      api.get('/modules/strands'),
    ]);

    if (modRes.status === 'fulfilled') {
      const data = modRes.value.data?.data || modRes.value.data || [];
      rawModules.value = Array.isArray(data) ? data : [];
    } else {
      rawModules.value = [];
    }

    if (strandRes.status === 'fulfilled') {
      const strandList = Array.isArray(strandRes.value.data) ? strandRes.value.data : [];
      rawStrands.value = strandList;
    } else {
      rawStrands.value = [];
    }
  } catch (err) {
    console.error('Failed to load backend modules:', err);
    rawModules.value = [];
  } finally {
    loading.value = false;
    nextTick(updateScrollMetrics);
  }
}

function resetModulesState() {
  rawModules.value = [];
}

onMounted(() => {
  loadModules();
  window.addEventListener('als-progress-updated', loadModules);
  window.addEventListener('als-learner-session-changed', resetModulesState);
  window.addEventListener('focus', loadModules);
  window.addEventListener('resize', updateScrollMetrics);

  const el = scrollContainerRef.value;
  if (el) {
    el.addEventListener('wheel', handleWheel, { passive: false });
  }
  nextTick(() => {
    setTimeout(updateScrollMetrics, 100);
  });
});

onUnmounted(() => {
  window.removeEventListener('als-progress-updated', loadModules);
  window.removeEventListener('als-learner-session-changed', resetModulesState);
  window.removeEventListener('focus', loadModules);
  window.removeEventListener('resize', updateScrollMetrics);
  stopThumbDrag();
  stopThumbTouch();

  const el = scrollContainerRef.value;
  if (el) {
    el.removeEventListener('wheel', handleWheel);
  }
});
</script>

<style scoped>
.my-modules-page {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding-bottom: 2rem;
}

.modules-header {
  margin-bottom: 0.15rem;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.015em;
  margin: 0;
  line-height: 1.25;
}

.page-subtitle {
  font-size: 0.825rem;
  color: #64748b;
  margin: 4px 0 0 0;
  line-height: 1.4;
}

/* Horizontally Scrollable Learning Strand Filters */
.strand-filters-section {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.strand-filters-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px 1px 4px 1px;
  margin: 0;
}

.strand-filters-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.strand-filters-track {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: max-content;
}

.strand-filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.95rem;
  min-height: 38px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  color: #334155;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.strand-filter-pill:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.strand-filter-pill.active {
  background: #165dfc;
  border-color: #165dfc;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(22, 93, 252, 0.25);
}

.filter-check-icon {
  color: #16a34a;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.strand-filter-pill.active .filter-check-icon {
  color: #86efac;
}

.pill-label {
  line-height: 1;
}

.pill-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  font-size: 0.725rem;
  font-weight: 700;
  border-radius: 9999px;
  background: #f1f5f9;
  color: #475569;
  line-height: 1;
  transition: all 0.15s ease;
}

.strand-filter-pill.active .pill-badge {
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
}

/* Thin Horizontal Scrollbar */
.horizontal-scrollbar-track {
  position: relative;
  width: 100%;
  height: 3.5px;
  background: #e2e8f0;
  border-radius: 9999px;
  margin-top: 6px;
  cursor: pointer;
  overflow: hidden;
  touch-action: none;
}

.horizontal-scrollbar-thumb {
  position: absolute;
  top: 0;
  height: 100%;
  background: #165dfc;
  border-radius: 9999px;
  cursor: grab;
  will-change: left;
  transition: background-color 0.15s ease;
}

.horizontal-scrollbar-thumb:hover,
.horizontal-scrollbar-thumb:active {
  background: #0d47a1;
}

.horizontal-scrollbar-track:hover {
  background: #cbd5e1;
}

/* Active Strand Banner */
.active-strand-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.strand-banner-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.strand-banner-eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  color: #165dfc;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.strand-banner-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.35;
  word-break: break-word;
  overflow-wrap: break-word;
}

.strand-banner-count-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
}

/* Empty & Loading States */
.learner-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.loading-card-box,
.empty-card-box {
  text-align: center;
  padding: 2.5rem 1.5rem;
}

.loading-spinner-circle {
  display: flex;
  justify-content: center;
  color: #165dfc;
  margin-bottom: 0.75rem;
}

.loading-text {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.empty-icon-circle {
  width: 52px;
  height: 52px;
  margin: 0 auto 0.85rem auto;
  border-radius: 14px;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.strand-empty-circle {
  background: #eff6ff;
  color: #165dfc;
}

.empty-title {
  font-size: 1rem;
  font-weight: 800;
  color: #334155;
  margin: 0 0 0.4rem 0;
}

.empty-desc {
  font-size: 0.825rem;
  color: #94a3b8;
  line-height: 1.45;
  max-width: 380px;
  margin: 0 auto;
}

.btn-all-strands-action {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1.15rem;
  background: #165dfc;
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 700;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-all-strands-action:hover {
  background: #1d4ed8;
}

/* Vertical Module Card List (Mobile-First Reference Layout) */
.modules-vertical-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.module-card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.95rem 1.15rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  -webkit-tap-highlight-color: transparent;
}

.module-card-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.card-left-section {
  display: flex;
  align-items: stretch;
  gap: 0.85rem;
  min-width: 0;
  flex: 1;
}

.card-icon-bubble {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  color: #165dfc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.card-content-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  min-height: 110px;
}

.card-upper-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.card-module-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
}

.card-module-instructions {
  font-size: 0.8125rem;
  font-weight: 400;
  color: #475569;
  line-height: 1.45;
  margin: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
}

.card-bottom-info {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  padding-top: 0.35rem;
}

.card-module-strand {
  font-size: 0.775rem;
  font-weight: 600;
  color: #64748b;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-pills-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.pill-code-badge {
  font-size: 0.675rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  background: #f1f5f9;
  color: #475569;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
}

.pill-status-badge {
  font-size: 0.675rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
}

.pill-demo-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.12rem 0.45rem;
  background: #fef3c7;
  color: #b45309;
  border-radius: 6px;
  border: 1px solid #fde68a;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Status colors */
.status-not-started {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.status-in-progress {
  background: #eff6ff;
  color: #165dfc;
  border: 1px solid #bfdbfe;
}

.status-completed {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.card-arrow-wrap {
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.15s ease, color 0.15s ease;
}

.module-card-item:hover .card-arrow-wrap {
  color: #165dfc;
  transform: translateX(2px);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .card-content-wrap {
    min-height: 94px;
  }
  .card-module-title {
    font-size: 0.9rem;
  }
  .card-module-instructions {
    font-size: 0.775rem;
    line-height: 1.35;
  }
  .card-module-strand {
    font-size: 0.75rem;
  }
}
</style>

<template>
  <div
    class="mock-pdf-viewer"
    :class="{
      'controls-hidden': !controlsVisible,
      'is-fullscreen': isFullscreen,
      'is-zoomed': zoomScale > 1.05
    }"
    ref="viewerContainerRef"
  >
    <!-- 1. Top Header: Back button, module tag, title, fullscreen icon -->
    <transition name="slide-top">
      <div v-show="controlsVisible" class="viewer-top-bar" @click.stop>
        <div class="top-bar-left">
          <button
            type="button"
            class="nav-icon-btn"
            @click="$emit('back')"
            aria-label="Back to My Modules"
            title="Back to My Modules"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="viewer-title-wrap">
            <div class="title-meta-line">
              <span class="viewer-module-tag">{{ code || 'MODULE' }}</span>
              <span v-if="subtitle" class="viewer-lesson-indicator">
                {{ subtitle }}
              </span>
              <span v-else-if="code === 'LS2-MOCK-001'" class="viewer-lesson-indicator">
                {{ currentPage <= 8 ? 'Lesson 1: What Will We Do Without You?' : 'Lesson 2: If Animals Protested' }}
              </span>
              <span v-else class="viewer-lesson-indicator">
                {{ totalPages ? `${totalPages} Pages` : '' }}
              </span>
            </div>
            <h1 class="viewer-module-title">{{ title }}</h1>
          </div>
        </div>

        <div class="top-bar-right">
          <!-- Fullscreen Toggle Button -->
          <button
            type="button"
            class="nav-icon-btn"
            @click="toggleFullscreen"
            :aria-label="isFullscreen ? 'Exit Full Screen' : 'Full Screen'"
            :title="isFullscreen ? 'Exit Full Screen' : 'Full Screen'"
          >
            <svg v-if="!isFullscreen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- 2. Reading Mode Controls & Zoom Bar (Directly below module title) -->
    <transition name="slide-top-sub">
      <div v-show="controlsVisible" class="viewer-controls-bar" @click.stop>
        <!-- Mode Toggle: Long Strip | Wide Strip -->
        <div class="view-mode-toggle" role="tablist" aria-label="Reading Mode">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: viewMode === 'long' }"
            @click="switchViewMode('long')"
            role="tab"
            :aria-selected="viewMode === 'long'"
          >
            <!-- Vertical Scroll Directional Icon -->
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="3" width="14" height="18" rx="2"/>
              <line x1="12" y1="7" x2="12" y2="17"/>
              <polyline points="9 10 12 7 15 10"/>
              <polyline points="9 14 12 17 15 14"/>
            </svg>
            <span>Long Strip</span>
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: viewMode === 'wide' }"
            @click="switchViewMode('wide')"
            role="tab"
            :aria-selected="viewMode === 'wide'"
          >
            <!-- Horizontal Swipe Directional Icon -->
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <line x1="7" y1="12" x2="17" y2="12"/>
              <polyline points="10 9 7 12 10 15"/>
              <polyline points="14 9 17 12 14 15"/>
            </svg>
            <span>Wide Strip</span>
          </button>
        </div>

        <!-- Center Page Badge Indicator -->
        <div class="page-badge-pill">
          Page <strong>{{ currentPage }}</strong> of {{ totalPages || 29 }}
        </div>

        <!-- Zoom Controls: − 100% + -->
        <div class="zoom-controls">
          <button
            type="button"
            class="zoom-btn"
            @click="zoomOut"
            :disabled="zoomScale <= 0.65"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <span class="zoom-level-text" @click="resetZoom" title="Tap to reset zoom to 100%">
            {{ Math.round(zoomScale * 100) }}%
          </span>
          <button
            type="button"
            class="zoom-btn"
            @click="zoomIn"
            :disabled="zoomScale >= 2.5"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- First-Use Instruction Hint (Floats discreetly, dismissed on first interaction) -->
    <transition name="fade">
      <div v-if="showTapHint" class="tap-hint-pill" @click="dismissTapHint">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
        <span class="hint-text">Tap the screen to show or hide reading controls.</span>
        <button type="button" class="hint-close-btn" aria-label="Dismiss">&times;</button>
      </div>
    </transition>

    <!-- Pre-Reading Instruction Alert Banner (When visible) -->
    <div v-if="showInstructionBanner && controlsVisible" class="reading-instruction-banner" @click.stop>
      <div class="instruction-content">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="instruction-icon">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span class="instruction-text">
          Read the module carefully and answer the activities on paper. Keep your written answers because you will upload them after completing the Post-Test.
        </span>
      </div>
      <button
        type="button"
        class="instruction-dismiss-btn"
        @click="showInstructionBanner = false"
        aria-label="Dismiss banner"
      >
        &times;
      </button>
    </div>

    <!-- 3. MAIN PDF VIEWING BODY (Expands to 100% Screen When Controls Hidden) -->
    <div
      class="viewer-body"
      ref="bodyRef"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
    >
      <!-- Loading State -->
      <div v-if="loading" class="pdf-loading-state">
        <div class="spinner-circle"></div>
        <p class="loading-label">Loading PDF module pages...</p>
        <span class="loading-sub">Animals: Love Them and Care for Them</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="pdf-error-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p class="error-msg">{{ error }}</p>
        <button type="button" class="btn-primary retry-btn" @click="loadPdfDocument">
          Retry Loading Module
        </button>
      </div>

      <!-- MODE 1: LONG STRIP (Vertical Continuous Reading) -->
      <div
        v-show="!loading && !error && viewMode === 'long'"
        class="long-strip-container"
        ref="longStripContainerRef"
        @scroll.passive="onLongStripScroll"
      >
        <div
          v-for="pageNum in totalPages"
          :key="`long-page-${pageNum}`"
          :id="`long-page-slot-${pageNum}`"
          class="long-page-slot"
          :data-page="pageNum"
        >
          <div
            class="long-canvas-box"
            :style="{
              transform: zoomScale !== 1.0 ? `scale(${zoomScale})` : 'none',
              transformOrigin: 'top center'
            }"
          >
            <canvas :ref="el => setLongCanvasRef(el, pageNum)" class="pdf-canvas"></canvas>
            <div :ref="el => setLongTextRef(el, pageNum)" class="textLayer"></div>
          </div>
          <!-- Discreet Page Divider Tag -->
          <div class="page-divider-tag">
            <span>Page {{ pageNum }} of {{ totalPages }}</span>
          </div>
        </div>
      </div>

      <!-- MODE 2: WIDE STRIP (Horizontal Single Page Reading) -->
      <div
        v-show="!loading && !error && viewMode === 'wide'"
        class="wide-strip-container"
      >
        <!-- Previous Page Arrow (Accessible on mobile tap) -->
        <transition name="fade">
          <button
            v-show="controlsVisible && currentPage > 1"
            type="button"
            class="wide-nav-arrow wide-nav-prev"
            @click.stop="goToPage(currentPage - 1)"
            aria-label="Previous Page"
            title="Previous Page"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </transition>

        <!-- Current Single Page Box (Fits full height & width) -->
        <div class="wide-active-page-stage" ref="wideStageRef">
          <div
            class="wide-canvas-box"
            :style="{
              transform: zoomScale !== 1.0 ? `scale(${zoomScale})` : 'none',
              transformOrigin: 'center center'
            }"
          >
            <canvas ref="wideCanvasRef" class="pdf-canvas"></canvas>
            <div ref="wideTextRef" class="textLayer"></div>
          </div>
        </div>

        <!-- Next Page Arrow (Accessible on mobile tap) -->
        <transition name="fade">
          <button
            v-show="controlsVisible && currentPage < totalPages"
            type="button"
            class="wide-nav-arrow wide-nav-next"
            @click.stop="goToPage(currentPage + 1)"
            aria-label="Next Page"
            title="Next Page"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </transition>
      </div>

      <!-- Subtle Floating Page Indicator in Immersive Mode (Minimal, non-distracting) -->
      <transition name="fade">
        <div v-if="!controlsVisible && !loading && !error" class="immersive-page-pill" @click.stop="toggleControls">
          {{ currentPage }} / {{ totalPages }}
        </div>
      </transition>
    </div>

    <!-- 4. Wide Strip Horizontal Thumbnail Navigator (Collapsible) -->
    <transition name="slide-bottom-sub">
      <div v-show="controlsVisible && !loading && !error && viewMode === 'wide'" class="wide-thumbnail-dock" @click.stop>
        <div class="thumbnail-dock-header">
          <button
            type="button"
            class="dock-toggle-btn"
            @click="thumbnailsOpen = !thumbnailsOpen"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>{{ thumbnailsOpen ? 'Hide Page Strip' : 'Page Thumbnails (29)' }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline v-if="thumbnailsOpen" points="6 9 12 15 18 9"></polyline>
              <polyline v-else points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
          <span class="dock-hint">Swipe page or tap any thumbnail</span>
        </div>

        <div v-show="thumbnailsOpen" class="thumbnail-strip-track" ref="thumbnailTrackRef">
          <div
            v-for="p in totalPages"
            :key="`thumb-${p}`"
            :id="`thumb-item-${p}`"
            class="thumb-item"
            :class="{ active: currentPage === p }"
            @click="goToPage(p)"
          >
            <div class="thumb-mini-box">
              <span class="thumb-number">{{ p }}</span>
            </div>
            <span class="thumb-label">p. {{ p }}</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 5. Bottom Action Dock: "Continue to Post-Test" -->
    <transition name="slide-bottom">
      <div v-show="controlsVisible" class="viewer-bottom-bar" @click.stop>
        <div class="bottom-bar-left">
          <span class="lesson-tag">
            {{ currentPage <= 8 ? 'Lesson 1: What Will We Do Without You?' : 'Lesson 2: If Animals Protested' }}
          </span>
        </div>

        <div class="bottom-bar-right">
          <button
            type="button"
            class="btn-primary proceed-btn"
            @click="openConfirmationModal"
          >
            <span>Continue to Post-Test</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- 6. Confirmation Modal Before Proceeding to Post-Test -->
    <div v-if="showConfirmModal" class="confirm-modal-backdrop" @click="showConfirmModal = false">
      <div class="confirm-modal-box" @click.stop>
        <div class="confirm-icon-circle">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#165dfc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h3 class="confirm-title">Ready for Post-Test?</h3>
        <p class="confirm-message">
          Have you finished reading the module and answering the activities on paper?
        </p>
        <div class="confirm-actions">
          <button
            type="button"
            class="btn-secondary modal-btn"
            @click="showConfirmModal = false"
          >
            Continue Reading
          </button>
          <button
            type="button"
            class="btn-primary modal-btn"
            @click="confirmProceedToPostTest"
          >
            Yes, Proceed to Post-Test
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';

// Static worker in public/ directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const props = defineProps({
  pdfUrl: {
    type: String,
    default: '/modules/animals-love-them-and-care-for-them.pdf'
  },
  title: {
    type: String,
    default: 'Animals: Love Them and Care for Them'
  },
  code: {
    type: String,
    default: 'LS2-MOCK-001'
  },
  subtitle: {
    type: String,
    default: ''
  },
  initialPage: {
    type: Number,
    default: 1
  },
  initialMode: {
    type: String,
    default: 'long' // 'long' or 'wide'
  }
});

const emit = defineEmits(['back', 'proceed-to-post-test', 'update-progress']);

// Element Refs
const viewerContainerRef = ref(null);
const bodyRef = ref(null);
const longStripContainerRef = ref(null);
const wideStageRef = ref(null);
const thumbnailTrackRef = ref(null);
const wideCanvasRef = ref(null);
const wideTextRef = ref(null);

// Viewer State
const loading = ref(true);
const error = ref(null);
const pdfDoc = ref(null);
const totalPages = ref(29);
const currentPage = ref(props.initialPage || 1);
const viewMode = ref(props.initialMode || 'long');
const zoomScale = ref(1.0);
const isFullscreen = ref(false);

// Controls Visibility State (Immersive full-screen toggle)
const controlsVisible = ref(true);
const showInstructionBanner = ref(true);
const thumbnailsOpen = ref(true);
const showConfirmModal = ref(false);

// First-use tap hint state
const showTapHint = ref(false);
try {
  showTapHint.value = !localStorage.getItem('als_pdf_tap_hint_dismissed');
} catch (e) {
  showTapHint.value = true;
}

function dismissTapHint() {
  showTapHint.value = false;
  try {
    localStorage.setItem('als_pdf_tap_hint_dismissed', 'true');
  } catch (e) {}
}

function toggleControls() {
  controlsVisible.value = !controlsVisible.value;
  if (showTapHint.value) {
    dismissTapHint();
  }
}

// Canvas & Page Render Tracking
const longCanvasRefs = new Map();
const longTextRefs = new Map();
const renderedPages = new Set();
let intersectionObserver = null;
let resizeObserver = null;

function setLongCanvasRef(el, pageNum) {
  if (el) longCanvasRefs.set(pageNum, el);
  else longCanvasRefs.delete(pageNum);
}

function setLongTextRef(el, pageNum) {
  if (el) longTextRefs.set(pageNum, el);
  else longTextRefs.delete(pageNum);
}

// ============================================================
// TOUCH GESTURE HANDLING: TAP vs SWIPE vs PINCH
// ============================================================
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchMoved = false;
let isPinching = false;
let initialPinchDistance = 0;
let initialPinchScale = 1.0;

function handleTouchStart(e) {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    touchMoved = false;
    isPinching = false;
  } else if (e.touches.length === 2) {
    // Pinch to zoom started
    isPinching = true;
    touchMoved = true;
    initialPinchDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    initialPinchScale = zoomScale.value;
  }
}

function handleTouchMove(e) {
  if (isPinching && e.touches.length === 2) {
    const currentDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    if (initialPinchDistance > 0) {
      const factor = currentDist / initialPinchDistance;
      const newScale = Math.min(2.5, Math.max(0.7, Math.round(initialPinchScale * factor * 100) / 100));
      zoomScale.value = newScale;
    }
  } else if (e.touches.length === 1) {
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dx > 10 || dy > 10) {
      touchMoved = true;
    }
  }
}

function handleTouchEnd(e) {
  if (isPinching) {
    if (e.touches.length === 0) isPinching = false;
    return;
  }

  const elapsed = Date.now() - touchStartTime;

  // Clean tap detection: touch moved less than 10px and took under 350ms
  if (!touchMoved && elapsed < 350) {
    toggleControls();
    return;
  }

  // Wide Strip horizontal swipe when not zoomed in
  if (viewMode.value === 'wide' && zoomScale.value <= 1.05 && e.changedTouches?.length === 1) {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    // Horizontal swipe threshold
    if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0 && currentPage.value < totalPages.value) {
        goToPage(currentPage.value + 1);
      } else if (deltaX > 0 && currentPage.value > 1) {
        goToPage(currentPage.value - 1);
      }
    }
  }
}

// Mouse support for desktop testing
let mouseDownX = 0;
let mouseDownY = 0;
let mouseDownTime = 0;

function handleMouseDown(e) {
  mouseDownX = e.clientX;
  mouseDownY = e.clientY;
  mouseDownTime = Date.now();
}

function handleMouseUp(e) {
  // Only trigger if left click, didn't drag, and wasn't on a button/interactive element
  if (e.button === 0 && Math.hypot(e.clientX - mouseDownX, e.clientY - mouseDownY) < 6) {
    const elapsed = Date.now() - mouseDownTime;
    if (elapsed < 350) {
      if (!e.target.closest('button, input, a, .viewer-controls-bar, .viewer-top-bar, .viewer-bottom-bar, .wide-thumbnail-dock')) {
        toggleControls();
      }
    }
  }
}

// ============================================================
// ZOOM CONTROLS
// ============================================================
function zoomIn() {
  if (zoomScale.value < 2.5) {
    zoomScale.value = Math.min(2.5, Math.round((zoomScale.value + 0.15) * 100) / 100);
  }
}

function zoomOut() {
  if (zoomScale.value > 0.65) {
    zoomScale.value = Math.max(0.65, Math.round((zoomScale.value - 0.15) * 100) / 100);
  }
}

function resetZoom() {
  zoomScale.value = 1.0;
}

// Fullscreen Browser API
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    const el = viewerContainerRef.value || document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
      isFullscreen.value = true;
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
      isFullscreen.value = false;
    }
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

// ============================================================
// PDF LOADING & RENDERING
// ============================================================
async function loadPdfDocument() {
  loading.value = true;
  error.value = null;
  renderedPages.clear();

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: props.pdfUrl,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true
    });

    const doc = await loadingTask.promise;
    pdfDoc.value = doc;
    totalPages.value = doc.numPages;

    loading.value = false;
    await nextTick();

    if (viewMode.value === 'long') {
      initLongStripObserver();
      renderLongPage(currentPage.value);
      if (currentPage.value > 1) renderLongPage(currentPage.value - 1);
      if (currentPage.value < totalPages.value) renderLongPage(currentPage.value + 1);
      scrollToLongPage(currentPage.value);
    } else {
      renderWidePage(currentPage.value);
    }

    initResizeObserver();
  } catch (err) {
    console.error('Failed to load PDF module:', err);
    loading.value = false;
    error.value = 'Failed to load PDF module. Please check your connection or tap Retry.';
  }
}

// Render a single page onto given canvas
async function renderPageToCanvas(pageNumber, canvas, textContainer = null, targetScale = 1.5) {
  if (!pdfDoc.value || !canvas) return;

  try {
    const page = await pdfDoc.value.getPage(pageNumber);
    const viewport = page.getViewport({ scale: targetScale });
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    if (textContainer) {
      textContainer.innerHTML = '';
      textContainer.style.width = `${viewport.width}px`;
      textContainer.style.height = `${viewport.height}px`;
      const textContent = await page.getTextContent();
      pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textContainer,
        viewport: viewport,
        textDivs: []
      });
    }
  } catch (err) {
    console.error(`Error rendering page ${pageNumber}:`, err);
  }
}

// Long Strip Rendering: Maximizes mobile width
async function renderLongPage(pageNumber) {
  if (renderedPages.has(pageNumber)) return;
  const canvas = longCanvasRefs.get(pageNumber);
  const textContainer = longTextRefs.get(pageNumber);
  if (!canvas) return;

  renderedPages.add(pageNumber);

  // Full available container width
  const containerW = longStripContainerRef.value?.clientWidth || window.innerWidth;
  // Fit edge-to-edge on mobile with zero or minimal margins
  const availW = Math.max(280, containerW);
  const scale = (availW / 595.28) * 1.5; // standard A4 pt width is ~595.28
  await renderPageToCanvas(pageNumber, canvas, textContainer, Math.max(1.2, scale));
}

function initLongStripObserver() {
  if (intersectionObserver) intersectionObserver.disconnect();

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const pageNum = parseInt(entry.target.getAttribute('data-page'), 10);
        if (entry.isIntersecting) {
          renderLongPage(pageNum);
          if (pageNum > 1) renderLongPage(pageNum - 1);
          if (pageNum < totalPages.value) renderLongPage(pageNum + 1);

          // Update active page
          if (entry.intersectionRatio >= 0.35) {
            currentPage.value = pageNum;
            emit('update-progress', { page: pageNum, mode: viewMode.value });
          }
        }
      });
    },
    {
      root: longStripContainerRef.value,
      rootMargin: '300px 0px 300px 0px',
      threshold: [0.1, 0.4, 0.7]
    }
  );

  for (let i = 1; i <= totalPages.value; i++) {
    const el = document.getElementById(`long-page-slot-${i}`);
    if (el) intersectionObserver.observe(el);
  }
}

function onLongStripScroll() {
  // Handled smoothly by IntersectionObserver
}

function scrollToLongPage(pageNumber) {
  nextTick(() => {
    const el = document.getElementById(`long-page-slot-${pageNumber}`);
    if (el && longStripContainerRef.value) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// Wide Strip Rendering: Fits within both width and height without cropping
async function renderWidePage(pageNumber) {
  if (!wideCanvasRef.value) return;

  const stageW = bodyRef.value?.clientWidth || window.innerWidth;
  const stageH = bodyRef.value?.clientHeight || window.innerHeight;

  // Fit page proportionally inside stage
  const scaleW = (stageW - 8) / 595.28;
  const scaleH = (stageH - 8) / 841.89;
  const fitScale = Math.min(scaleW, scaleH);
  const scale = Math.max(0.6, fitScale) * 1.5;

  await renderPageToCanvas(pageNumber, wideCanvasRef.value, wideTextRef.value, scale);

  // Auto-scroll thumbnail strip
  nextTick(() => {
    const thumbEl = document.getElementById(`thumb-item-${pageNumber}`);
    if (thumbEl && thumbnailTrackRef.value) {
      thumbEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
}

// ResizeObserver for Orientation changes & Controls Toggling
function initResizeObserver() {
  if (resizeObserver) resizeObserver.disconnect();
  if (!bodyRef.value) return;

  resizeObserver = new ResizeObserver(() => {
    if (viewMode.value === 'wide' && !loading.value && pdfDoc.value) {
      renderWidePage(currentPage.value);
    }
  });
  resizeObserver.observe(bodyRef.value);
}

// Page Navigation
function goToPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > totalPages.value) return;
  currentPage.value = pageNumber;
  emit('update-progress', { page: pageNumber, mode: viewMode.value });

  if (viewMode.value === 'wide') {
    renderWidePage(pageNumber);
  } else {
    scrollToLongPage(pageNumber);
  }
}

// Mode Switching (Preserves current page)
async function switchViewMode(newMode) {
  if (viewMode.value === newMode) return;
  viewMode.value = newMode;
  emit('update-progress', { page: currentPage.value, mode: newMode });

  await nextTick();
  if (newMode === 'wide') {
    if (intersectionObserver) intersectionObserver.disconnect();
    renderWidePage(currentPage.value);
  } else {
    initLongStripObserver();
    renderLongPage(currentPage.value);
    scrollToLongPage(currentPage.value);
  }
}

// Confirmation Modal & Navigation to Post-Test
function openConfirmationModal() {
  showConfirmModal.value = true;
}

function confirmProceedToPostTest() {
  showConfirmModal.value = false;
  emit('proceed-to-post-test');
}

// Lifecycle
watch(
  () => props.pdfUrl,
  (newUrl) => {
    if (newUrl) {
      loadPdfDocument();
    }
  }
);

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange);
  window.addEventListener('orientationchange', onOrientationChange);
  loadPdfDocument();
});

function onOrientationChange() {
  setTimeout(() => {
    if (viewMode.value === 'wide') {
      renderWidePage(currentPage.value);
    } else {
      renderedPages.clear();
      renderLongPage(currentPage.value);
    }
  }, 200);
}

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  window.removeEventListener('orientationchange', onOrientationChange);
  if (intersectionObserver) intersectionObserver.disconnect();
  if (resizeObserver) resizeObserver.disconnect();
});

watch(() => props.pdfUrl, () => {
  loadPdfDocument();
});

// Watch controls visibility: when controls hide or show, refresh wide strip scale
watch(controlsVisible, async () => {
  await nextTick();
  if (viewMode.value === 'wide' && !loading.value) {
    renderWidePage(currentPage.value);
  }
});
</script>

<style scoped>
/* Full-Screen Immersive Fixed Container */
.mock-pdf-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: #0b0f19;
  color: #f8fafc;
  overflow: hidden;
  user-select: none;
  -webkit-font-smoothing: antialiased;
}

/* 1. Top Header */
.viewer-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(0.5rem, env(safe-area-inset-top)) 0.85rem 0.5rem 0.85rem;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(51, 65, 85, 0.7);
  flex-shrink: 0;
  z-index: 30;
  gap: 0.75rem;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex: 1;
}

.nav-icon-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
  color: #f8fafc;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.nav-icon-btn:hover {
  background: #334155;
  border-color: #64748b;
}

.viewer-title-wrap {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title-meta-line {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.viewer-module-tag {
  font-size: 0.65rem;
  font-weight: 800;
  background: #165dfc;
  color: #ffffff;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  display: inline-block;
  line-height: 1.2;
}

.viewer-lesson-indicator {
  font-size: 0.675rem;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.viewer-module-title {
  font-size: 0.875rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 2. Reading Mode Controls Bar (Directly below title) */
.viewer-controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.45rem 0.85rem;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(51, 65, 85, 0.7);
  flex-shrink: 0;
  gap: 0.5rem;
  z-index: 25;
}

.view-mode-toggle {
  display: inline-flex;
  background: #0f172a;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid #334155;
}

.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  min-height: 40px;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.mode-btn.active {
  background: #165dfc;
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(22, 93, 252, 0.45);
}

.page-badge-pill {
  font-size: 0.75rem;
  font-weight: 600;
  color: #cbd5e1;
  background: #0f172a;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #334155;
  white-space: nowrap;
}

.page-badge-pill strong {
  color: #38bdf8;
  font-weight: 800;
}

.zoom-controls {
  display: inline-flex;
  align-items: center;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 2px 4px;
  gap: 4px;
}

.zoom-btn {
  background: transparent;
  border: none;
  color: #cbd5e1;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.zoom-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.zoom-btn:hover:not(:disabled) {
  background: #334155;
}

.zoom-level-text {
  font-size: 0.725rem;
  font-weight: 700;
  color: #94a3b8;
  min-width: 40px;
  text-align: center;
  cursor: pointer;
}

/* First-Use Floating Tap Instruction */
.tap-hint-pill {
  position: absolute;
  top: 96px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid #38bdf8;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  color: #ffffff;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 50;
  cursor: pointer;
  white-space: nowrap;
}

.hint-text {
  color: #e2e8f0;
}

.hint-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}

/* Pre-Reading Instruction Banner */
.reading-instruction-banner {
  background: #1e3a8a;
  border-bottom: 1px solid #2563eb;
  padding: 0.45rem 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  flex-shrink: 0;
  z-index: 20;
}

.instruction-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.instruction-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #dbeafe;
  line-height: 1.35;
}

.instruction-dismiss-btn {
  background: transparent;
  border: none;
  color: #93c5fd;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
}

/* 3. Main Viewer Body (Expands to 100% viewport) */
.viewer-body {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: #0b0f19;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Loading & Error States */
.pdf-loading-state,
.pdf-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
}

.spinner-circle {
  width: 42px;
  height: 42px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #165dfc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

.loading-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.35rem 0;
}

.loading-sub {
  font-size: 0.8rem;
  color: #94a3b8;
}

.error-msg {
  font-size: 0.875rem;
  color: #fca5a5;
  margin: 0.75rem 0 1rem 0;
  max-width: 340px;
}

.retry-btn {
  padding: 0.55rem 1.25rem;
  font-size: 0.85rem;
}

/* MODE 1: Long Strip (Vertical Continuous Scroll) */
.long-strip-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px; /* Minimized gap between pages */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.long-page-slot {
  width: 100%;
  max-width: 768px; /* Clean mobile & tablet width */
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.long-canvas-box {
  width: 100%;
  display: flex;
  justify-content: center;
  background: #ffffff;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease;
}

.pdf-canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

.page-divider-tag {
  width: 100%;
  text-align: center;
  padding: 4px 0 8px 0;
  font-size: 0.675rem;
  color: #475569;
  font-weight: 700;
}

/* MODE 2: Wide Strip (Horizontal Single Page) */
.wide-strip-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  touch-action: pan-y;
  user-select: none;
  overflow: hidden;
}

.wide-active-page-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 4px;
}

.wide-canvas-box {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  transition: transform 0.15s ease;
}

.wide-nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  backdrop-filter: blur(6px);
  transition: all 0.15s ease;
}

.wide-nav-arrow:hover {
  background: #165dfc;
}

.wide-nav-prev {
  left: 0.65rem;
}

.wide-nav-next {
  right: 0.65rem;
}

/* Subtle Immersive Page Pill (Shown when controls are hidden) */
.immersive-page-pill {
  position: absolute;
  bottom: max(1rem, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  pointer-events: auto;
  cursor: pointer;
  z-index: 35;
}

/* 4. Wide Strip Thumbnail Dock */
.wide-thumbnail-dock {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(51, 65, 85, 0.7);
  padding: 0.45rem 0.75rem;
  flex-shrink: 0;
  z-index: 25;
}

.thumbnail-dock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.dock-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 2px 4px;
}

.dock-hint {
  font-size: 0.675rem;
  color: #64748b;
}

.thumbnail-strip-track {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem 0;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.thumb-item {
  flex: 0 0 46px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.thumb-mini-box {
  width: 44px;
  height: 58px;
  background: #0f172a;
  border: 1px solid #475569;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-item.active .thumb-mini-box {
  border-color: #165dfc;
  background: #1e3a8a;
  box-shadow: 0 0 0 2px #165dfc;
}

.thumb-number {
  font-size: 0.75rem;
  font-weight: 800;
  color: #e2e8f0;
}

.thumb-item.active .thumb-number {
  color: #ffffff;
}

.thumb-label {
  font-size: 0.65rem;
  color: #94a3b8;
}

.thumb-item.active .thumb-label {
  color: #38bdf8;
  font-weight: 700;
}

/* 5. Bottom Action Dock */
.viewer-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem max(0.65rem, env(safe-area-inset-bottom)) 0.85rem;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(51, 65, 85, 0.7);
  flex-shrink: 0;
  gap: 0.75rem;
  z-index: 30;
}

.lesson-tag {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
  display: inline-block;
}

.proceed-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.15rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 10px;
  background: #165dfc;
  color: #ffffff;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(22, 93, 252, 0.35);
}

.proceed-btn:hover {
  background: #1d4ed8;
}

/* Confirmation Modal */
.confirm-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  z-index: 10000;
  animation: fadeIn 0.15s ease;
}

.confirm-modal-box {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
  color: #0f172a;
}

.confirm-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.85rem;
}

.confirm-title {
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  color: #0f172a;
}

.confirm-message {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.5;
  margin: 0 0 1.25rem 0;
}

.confirm-actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.modal-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
}

.btn-secondary {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

/* Smooth Transitions for Controls Show / Hide */
.slide-top-enter-active,
.slide-top-leave-active,
.slide-top-sub-enter-active,
.slide-top-sub-leave-active,
.slide-bottom-enter-active,
.slide-bottom-leave-active,
.slide-bottom-sub-enter-active,
.slide-bottom-sub-leave-active {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease;
}

.slide-top-enter-from,
.slide-top-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-top-sub-enter-from,
.slide-top-sub-leave-to {
  transform: translateY(-80%);
  opacity: 0;
}

.slide-bottom-enter-from,
.slide-bottom-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-bottom-sub-enter-from,
.slide-bottom-sub-leave-to {
  transform: translateY(80%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Mobile Responsiveness */
@media (max-width: 480px) {
  .lesson-tag {
    display: none;
  }
  .proceed-btn {
    width: 100%;
    justify-content: center;
  }
  .viewer-controls-bar {
    padding: 0.4rem 0.5rem;
  }
  .mode-btn {
    padding: 0.4rem 0.65rem;
    font-size: 0.75rem;
  }
  .page-badge-pill {
    padding: 0.3rem 0.5rem;
    font-size: 0.7rem;
  }
}
</style>

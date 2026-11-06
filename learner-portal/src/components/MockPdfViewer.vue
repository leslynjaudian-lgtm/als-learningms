<template>
  <div
    class="mock-pdf-viewer"
    :class="{
      'controls-hidden': !controlsVisible,
      'is-fullscreen': isFullscreen,
      'is-zoomed': zoomScale > 1.05,
      'has-post-test-dock': controlsVisible && isPostTestButtonVisible,
      'has-thumbnail-dock': controlsVisible && thumbnailsOpen && !loading && !error && viewMode === 'wide'
    }"
    ref="viewerContainerRef"
  >
    <!-- 1. MAIN PDF VIEWING BODY (Permanent full-viewport foundation, never reflows or jumps) -->
    <div
      class="viewer-body"
      :class="{ 'wide-mode': viewMode === 'wide' }"
      ref="bodyRef"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerCancel"
    >
      <!-- Loading State -->
      <div v-if="loading" class="pdf-loading-state">
        <div class="spinner-circle"></div>
        <p class="loading-label">Loading PDF module pages...</p>
        <span class="loading-sub">{{ title || 'Animals: Love Them and Care for Them' }}</span>
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

        <!-- End of Long Strip Sentinel (Guarantees bottom of last page is detectable & fully reachable) -->
        <div id="long-strip-end-sentinel" class="long-strip-end-sentinel"></div>
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
            @pointerdown.stop
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
              transform: zoomScale !== 1.0 || panX !== 0 || panY !== 0 ? `translate(${panX}px, ${panY}px) scale(${zoomScale})` : 'none',
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
            @pointerdown.stop
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

      <!-- Subtle Floating Page Indicator & Accessible Post-Test Button in Immersive Mode -->
      <transition name="fade">
        <div v-if="!controlsVisible && !loading && !error" class="immersive-bottom-wrap">
          <button
            v-if="isPostTestButtonVisible"
            type="button"
            class="immersive-post-test-btn"
            @pointerdown.stop
            @click.stop="openConfirmationModal"
          >
            <span>Continue to Post-Test</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <div
            class="immersive-page-pill"
            @pointerdown.stop
            @click.stop="toggleControls"
          >
            {{ currentPage }} / {{ totalPages }}
          </div>
        </div>
      </transition>
    </div>

    <!-- 2. TOP CONTROLS OVERLAY (Overlay above PDF, GPU transform/opacity transitions) -->
    <div class="viewer-top-overlay" :class="{ 'overlay-hidden': !controlsVisible }">
      <!-- Top Header: Back button, module tag, title, fullscreen icon -->
      <div class="viewer-top-bar" @click.stop>
        <div class="top-bar-left">
          <button
            type="button"
            class="nav-icon-btn"
            @click="$emit('back')"
            aria-label="Back to Module Overview"
            title="Back to Module Overview"
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
              <span v-else class="viewer-lesson-indicator">
                {{ totalPages ? `${totalPages} Pages` : '' }}
              </span>
            </div>
            <h1 class="viewer-module-title">{{ title }}</h1>
          </div>
        </div>

        <div class="top-bar-right">
          <!-- Download PDF Button -->
          <button
            type="button"
            class="download-pdf-btn"
            :disabled="isDownloading || loading || !!error"
            @click.stop="handleDownloadPdf"
            aria-label="Download PDF"
            title="Download PDF"
          >
            <svg
              v-if="!isDownloading"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="download-pdf-icon"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span v-else class="download-btn-spinner" aria-hidden="true"></span>
            <span class="download-pdf-label">{{ isDownloading ? 'Downloading...' : 'Download PDF' }}</span>
          </button>

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

      <!-- Reading Mode Controls & Zoom Bar (Directly below module title) -->
      <div class="viewer-controls-bar" @click.stop>
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
            <span class="mode-label-full">Long Strip</span>
            <span class="mode-label-short">Long</span>
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
            <span class="mode-label-full">Wide Strip</span>
            <span class="mode-label-short">Wide</span>
          </button>
        </div>

        <!-- Center Page Badge Indicator -->
        <div class="page-badge-pill">
          <span class="page-badge-full">Page <strong>{{ currentPage }}</strong> of {{ totalPages || 29 }}</span>
          <span class="page-badge-short"><strong>{{ currentPage }}</strong> / {{ totalPages || 29 }}</span>
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

      <!-- Download Error Alert Banner (When download fails) -->
      <div v-if="downloadError" class="download-error-banner" role="alert" @click.stop>
        <div class="download-error-content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="instruction-icon">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span class="download-error-text">{{ downloadError }}</span>
        </div>
        <button
          type="button"
          class="download-error-dismiss-btn"
          @click="downloadError = ''"
          aria-label="Dismiss error"
        >
          &times;
        </button>
      </div>

      <!-- Pre-Reading Instruction Alert Banner (When visible) -->
      <div v-if="showInstructionBanner" class="reading-instruction-banner" @click.stop>
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
    </div>

    <!-- 3. First-Use Instruction Hint (Floats discreetly, dismissed on first interaction) -->
    <transition name="fade">
      <div v-if="showTapHint" class="tap-hint-pill" @click="dismissTapHint">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
        <span class="hint-text">Tap the screen to show or hide reading controls.</span>
        <button type="button" class="hint-close-btn" aria-label="Dismiss">&times;</button>
      </div>
    </transition>

    <!-- 4. BOTTOM CONTROLS OVERLAY (Overlay above PDF, GPU transform/opacity transitions) -->
    <div class="viewer-bottom-overlay" :class="{ 'overlay-hidden': !controlsVisible }">
      <!-- Horizontal Thumbnail Navigator (Collapsible - Wide Strip Mode Only) -->
      <div v-if="!loading && !error && viewMode === 'wide'" class="wide-thumbnail-dock" @click.stop>
        <div class="thumbnail-dock-header">
          <button
            type="button"
            class="dock-toggle-btn"
            @click="toggleThumbnails"
            aria-label="Toggle Page Strip"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>{{ thumbnailsOpen ? 'Hide Page Strip' : 'Show Page Strip' }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline v-if="thumbnailsOpen" points="6 9 12 15 18 9"></polyline>
              <polyline v-else points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
          <span class="dock-hint">Tap any page thumbnail to navigate</span>
        </div>

        <div
          v-show="thumbnailsOpen"
          class="thumbnail-strip-track"
          ref="thumbnailTrackRef"
          @pointerdown="onThumbTrackPointerDown"
          @pointerup="onThumbTrackPointerUp"
          @pointercancel="onThumbTrackPointerUp"
        >
          <div
            v-for="p in totalPages"
            :key="`thumb-${p}`"
            :id="`thumb-item-${p}`"
            class="thumb-item"
            :class="{ active: currentPage === p }"
            :data-thumb-page="p"
            @click="onThumbnailClick(p)"
            role="button"
            tabindex="0"
            :aria-label="`Page ${p}`"
            :aria-current="currentPage === p ? 'page' : undefined"
            @keydown.enter="onThumbnailClick(p)"
            @keydown.space.prevent="onThumbnailClick(p)"
          >
            <div class="thumb-preview-wrap">
              <canvas
                :ref="el => setThumbCanvasRef(el, p)"
                class="thumb-canvas"
                :style="{ display: thumbStatus[p] === 'ready' ? 'block' : 'none' }"
              ></canvas>
              <div
                v-if="thumbStatus[p] !== 'ready'"
                class="thumb-placeholder"
                :class="{ 'thumb-error': thumbStatus[p] === 'error' }"
              >
                <div v-if="thumbStatus[p] === 'loading'" class="thumb-spinner"></div>
                <span v-else-if="thumbStatus[p] === 'error'" class="thumb-err-tag" title="Failed to load preview">!</span>
                <span v-else class="thumb-page-num">{{ p }}</span>
              </div>
            </div>
            <span class="thumb-label">p. {{ p }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom Action Dock: "Continue to Post-Test" -->
      <div v-if="isPostTestButtonVisible" class="viewer-bottom-bar" @click.stop>
        <div class="bottom-bar-left">
          <span class="lesson-tag">
            {{ subtitle || title }}
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
    </div>

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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, markRaw, watch } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import api from '../api/axios';

// Static worker in public/ directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const props = defineProps({
  moduleId: {
    type: [String, Number],
    default: null
  },
  pdfUrl: {
    type: String,
    default: '/modules/animals-love-them-and-care-for-them.pdf'
  },
  title: {
    type: String,
    default: 'Learning Module'
  },
  code: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  downloadFileName: {
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
const pdfDoc = shallowRef(null);
const totalPages = ref(29);
const currentPage = ref(props.initialPage || 1);
const viewMode = ref(props.initialMode || 'long');
const zoomScale = ref(1.0);
const isFullscreen = ref(false);
const isDownloading = ref(false);
const downloadError = ref('');
let downloadErrorTimer = null;

// Long Strip Bottom Detection State
const isLongStripAtBottom = ref(false);

// Conditional Post-Test Button Visibility
// Wide Strip: Visible only when learner navigates to the final page (Page totalPages of totalPages)
// Long Strip: Visible only when learner reaches the bottom of the final PDF page
const isPostTestButtonVisible = computed(() => {
  if (loading.value || error.value || totalPages.value <= 0) {
    return false;
  }
  if (viewMode.value === 'wide') {
    return currentPage.value === totalPages.value;
  } else if (viewMode.value === 'long') {
    return isLongStripAtBottom.value;
  }
  return false;
});

// Controls Visibility State (Immersive full-screen toggle)
const controlsVisible = ref(true);
const showInstructionBanner = ref(true);
// On mobile, thumbnail dock is collapsed by default per user requirement
const isMobileViewport = ref(typeof window !== 'undefined' && window.innerWidth < 768);
const thumbnailsOpen = ref(!isMobileViewport.value);
const showConfirmModal = ref(false);

// Thumbnail Strip State & Pipeline
const thumbCanvasRefs = new Map();
const renderedThumbs = new Set();
const renderingThumbs = new Set();
const thumbQueue = [];
const activeThumbRenderTasks = new Map();
const thumbStatus = ref({});
const MAX_CONCURRENT_THUMBS = 2;
let runningThumbRenders = 0;
let thumbIntersectionObserver = null;
let scrollThumbRafId = null;
let isUserInteractingWithThumbTrack = false;
let userThumbInteractionTimer = null;

function setThumbCanvasRef(el, pageNum) {
  if (el) {
    thumbCanvasRefs.set(pageNum, el);
    if (pdfDoc.value && !renderedThumbs.has(pageNum) && !renderingThumbs.has(pageNum)) {
      if (thumbQueue.includes(pageNum)) {
        processThumbQueue();
      }
    }
  } else {
    thumbCanvasRefs.delete(pageNum);
  }
}

function onThumbTrackPointerDown() {
  isUserInteractingWithThumbTrack = true;
  if (userThumbInteractionTimer) clearTimeout(userThumbInteractionTimer);
}

function onThumbTrackPointerUp() {
  if (userThumbInteractionTimer) clearTimeout(userThumbInteractionTimer);
  userThumbInteractionTimer = setTimeout(() => {
    isUserInteractingWithThumbTrack = false;
  }, 800);
}

function onThumbnailClick(pageNumber) {
  if (pageNumber < 1 || pageNumber > totalPages.value) return;
  goToPage(pageNumber);
  scrollThumbnailIntoView(pageNumber);
  if (thumbStatus.value[pageNumber] === 'error') {
    queueThumbRender(pageNumber);
  }
}

function toggleThumbnails() {
  thumbnailsOpen.value = !thumbnailsOpen.value;
  if (thumbnailsOpen.value) {
    nextTick(() => {
      initThumbnailObserver();
      scrollThumbnailIntoView(currentPage.value);
      queueThumbRender(currentPage.value);
      if (currentPage.value > 1) queueThumbRender(currentPage.value - 1);
      if (currentPage.value < totalPages.value) queueThumbRender(currentPage.value + 1);
      if (viewMode.value === 'wide') {
        renderWidePage(currentPage.value);
      }
    });
  } else {
    if (viewMode.value === 'wide') {
      nextTick(() => {
        renderWidePage(currentPage.value);
      });
    }
  }
}

function scrollThumbnailIntoView(pageNumber) {
  if (viewMode.value !== 'wide' || !thumbnailsOpen.value || !thumbnailTrackRef.value) return;
  if (isUserInteractingWithThumbTrack) return;

  if (scrollThumbRafId) cancelAnimationFrame(scrollThumbRafId);
  scrollThumbRafId = requestAnimationFrame(() => {
    scrollThumbRafId = null;
    const track = thumbnailTrackRef.value;
    const thumbEl = document.getElementById(`thumb-item-${pageNumber}`);
    if (!track || !thumbEl) return;

    const trackRect = track.getBoundingClientRect();
    const thumbRect = thumbEl.getBoundingClientRect();

    const thumbLeft = thumbRect.left - trackRect.left + track.scrollLeft;
    const targetScrollLeft = thumbLeft - (trackRect.width / 2) + (thumbRect.width / 2);

    track.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth'
    });
  });
}

function initThumbnailObserver() {
  if (thumbIntersectionObserver) {
    thumbIntersectionObserver.disconnect();
    thumbIntersectionObserver = null;
  }
  if (!thumbnailTrackRef.value) return;

  thumbIntersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.getAttribute('data-thumb-page'), 10);
          if (pageNum && !renderedThumbs.has(pageNum)) {
            queueThumbRender(pageNum);
            if (pageNum + 1 <= totalPages.value && !renderedThumbs.has(pageNum + 1)) {
              queueThumbRender(pageNum + 1);
            }
            if (pageNum - 1 >= 1 && !renderedThumbs.has(pageNum - 1)) {
              queueThumbRender(pageNum - 1);
            }
          }
        }
      });
    },
    {
      root: thumbnailTrackRef.value,
      rootMargin: '0px 240px 0px 240px',
      threshold: 0.05
    }
  );

  nextTick(() => {
    for (let p = 1; p <= totalPages.value; p++) {
      const el = document.getElementById(`thumb-item-${p}`);
      if (el && thumbIntersectionObserver) {
        thumbIntersectionObserver.observe(el);
      }
    }
  });
}

function queueThumbRender(pageNum) {
  if (!pdfDoc.value || pageNum < 1 || pageNum > totalPages.value) return;
  if (renderedThumbs.has(pageNum) || renderingThumbs.has(pageNum)) return;

  if (!thumbQueue.includes(pageNum)) {
    if (Math.abs(pageNum - currentPage.value) <= 1) {
      thumbQueue.unshift(pageNum);
    } else {
      thumbQueue.push(pageNum);
    }
  }
  processThumbQueue();
}

async function processThumbQueue() {
  if (!pdfDoc.value) return;
  if (runningThumbRenders >= MAX_CONCURRENT_THUMBS) return;
  if (thumbQueue.length === 0) return;

  const pageNum = thumbQueue.shift();
  if (renderedThumbs.has(pageNum) || renderingThumbs.has(pageNum)) {
    processThumbQueue();
    return;
  }

  const canvas = thumbCanvasRefs.get(pageNum);
  if (!canvas) {
    if (thumbnailsOpen.value) {
      setTimeout(() => {
        if (!renderedThumbs.has(pageNum) && !renderingThumbs.has(pageNum) && !thumbQueue.includes(pageNum)) {
          thumbQueue.push(pageNum);
          processThumbQueue();
        }
      }, 50);
    }
    processThumbQueue();
    return;
  }

  runningThumbRenders++;
  renderingThumbs.add(pageNum);

  try {
    await renderThumbnailPage(pageNum);
  } finally {
    renderingThumbs.delete(pageNum);
    runningThumbRenders--;
    processThumbQueue();
  }
}

async function renderThumbnailPage(pageNum) {
  if (!pdfDoc.value) return;
  const canvas = thumbCanvasRefs.get(pageNum);
  if (!canvas) return;

  thumbStatus.value[pageNum] = 'loading';

  let page = null;
  try {
    page = await pdfDoc.value.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
    const maxW = isMobile ? 48 : 62;
    const maxH = isMobile ? 64 : 82;

    const scaleW = maxW / unscaledViewport.width;
    const scaleH = maxH / unscaledViewport.height;
    const fitScale = Math.min(scaleW, scaleH);
    const scale = Math.max(0.08, fitScale);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const renderViewport = page.getViewport({ scale: scale * dpr });
    const displayViewport = page.getViewport({ scale: scale });

    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);
    canvas.style.width = `${Math.floor(displayViewport.width)}px`;
    canvas.style.height = `${Math.floor(displayViewport.height)}px`;

    const ctx = canvas.getContext('2d');
    const renderTask = page.render({
      canvasContext: ctx,
      viewport: renderViewport
    });
    activeThumbRenderTasks.set(pageNum, renderTask);

    await renderTask.promise;

    renderedThumbs.add(pageNum);
    thumbStatus.value[pageNum] = 'ready';
  } catch (err) {
    if (err?.name === 'RenderingCancelledException') {
      return;
    }
    console.warn(`[MockPdfViewer] Thumbnail render error on page ${pageNum}:`, err);
    thumbStatus.value[pageNum] = 'error';
  } finally {
    activeThumbRenderTasks.delete(pageNum);
    if (page) {
      try {
        page.cleanup();
      } catch (e) {}
    }
  }
}

function cancelAllThumbnailRenders() {
  thumbQueue.length = 0;
  for (const [, task] of activeThumbRenderTasks.entries()) {
    try {
      task.cancel();
    } catch (e) {}
  }
  activeThumbRenderTasks.clear();
  renderingThumbs.clear();
  runningThumbRenders = 0;
}

// 2D Pan Offset for Zoomed View
const panX = ref(0);
const panY = ref(0);

function resetPan() {
  panX.value = 0;
  panY.value = 0;
}

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

let lastToggleTime = 0;
function toggleControls() {
  const now = Date.now();
  if (now - lastToggleTime < 350) {
    return;
  }
  lastToggleTime = now;

  // Capture current reading anchor in Long Strip mode as a safeguard
  const savedScrollTop = viewMode.value === 'long' && longStripContainerRef.value
    ? longStripContainerRef.value.scrollTop
    : null;

  controlsVisible.value = !controlsVisible.value;

  if (showTapHint.value) {
    dismissTapHint();
  }

  // Restore exact scroll position if browser attempted any layout shift
  if (savedScrollTop !== null && longStripContainerRef.value) {
    nextTick(() => {
      if (longStripContainerRef.value && Math.abs(longStripContainerRef.value.scrollTop - savedScrollTop) > 1) {
        longStripContainerRef.value.scrollTop = savedScrollTop;
      }
    });
  }
}

// Canvas & Page Render Tracking
const longCanvasRefs = new Map();
const longTextRefs = new Map();
const renderedPages = new Set();
const renderingPages = new Set();
const activeRenderTasks = new WeakMap();
let currentLoadingTask = null;
let intersectionObserver = null;
let resizeObserver = null;
let resizeTimer = null;
let lastBodyWidth = 0;
let lastBodyHeight = 0;
let orientationTimer = null;

function setLongCanvasRef(el, pageNum) {
  if (el) longCanvasRefs.set(pageNum, el);
  else longCanvasRefs.delete(pageNum);
}

function setLongTextRef(el, pageNum) {
  if (el) longTextRefs.set(pageNum, el);
  else longTextRefs.delete(pageNum);
}

// ============================================================
// UNIFIED POINTER GESTURE HANDLING: TAP vs SWIPE vs PINCH & PAN
// Works identically across Touch (Android Chrome, iOS Safari) and Desktop Mouse
// ============================================================
const activePointers = new Map();
let pointerStartX = 0;
let pointerStartY = 0;
let pointerStartTime = 0;
let pointerStartScrollTop = 0;
let pointerMoved = false;
let isMultiTouch = false;
let isPinching = false;
let initialPinchDistance = 0;
let initialPinchScale = 1.0;
let lastPinchEndTime = 0;
let lastPointerPanX = 0;
let lastPointerPanY = 0;

function isInteractiveElement(target) {
  if (!target || !(target instanceof Element)) return false;
  return Boolean(
    target.closest('button, a, input, select, .wide-nav-arrow, .tap-hint-pill, .immersive-post-test-btn, .immersive-page-pill, .wide-thumbnail-dock, .viewer-controls-bar, .viewer-top-bar, .viewer-bottom-bar, .reading-instruction-banner, .viewer-top-overlay, .viewer-bottom-overlay')
  );
}

function handlePointerDown(e) {
  if (isInteractiveElement(e.target)) {
    return;
  }

  // Record active pointer
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size === 1) {
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    lastPointerPanX = e.clientX;
    lastPointerPanY = e.clientY;
    pointerStartTime = Date.now();
    pointerMoved = false;
    isMultiTouch = false;
    isPinching = false;

    if (viewMode.value === 'long' && longStripContainerRef.value) {
      pointerStartScrollTop = longStripContainerRef.value.scrollTop;
    }
  } else if (activePointers.size === 2) {
    // 2 fingers active: initiate pinch zoom
    isMultiTouch = true;
    isPinching = true;
    pointerMoved = true;
    const pts = Array.from(activePointers.values());
    initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    initialPinchScale = zoomScale.value;
  } else {
    // 3+ fingers: definitely not a tap
    isMultiTouch = true;
    pointerMoved = true;
  }
}

function handlePointerMove(e) {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (isPinching && activePointers.size === 2) {
    const pts = Array.from(activePointers.values());
    const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    if (initialPinchDistance > 0) {
      const factor = currentDist / initialPinchDistance;
      const newScale = Math.min(2.5, Math.max(0.65, Math.round(initialPinchScale * factor * 100) / 100));
      zoomScale.value = newScale;
      if (newScale <= 1.05) {
        resetPan();
      }
    }
    if (e.cancelable) {
      e.preventDefault();
    }
  } else if (activePointers.size === 1 && !isMultiTouch) {
    const currentX = e.clientX;
    const currentY = e.clientY;
    const dist = Math.hypot(currentX - pointerStartX, currentY - pointerStartY);

    // Dynamic threshold: 14px for touch/pen (accommodates finger contact shift), 8px for mouse
    const moveThreshold = e.pointerType === 'mouse' ? 8 : 14;
    if (dist > moveThreshold) {
      pointerMoved = true;
    }

    // In Long Strip, verify if container scroll offset moved
    if (viewMode.value === 'long' && longStripContainerRef.value) {
      if (Math.abs(longStripContainerRef.value.scrollTop - pointerStartScrollTop) > 6) {
        pointerMoved = true;
      }
    }

    // 1-finger panning support when zoomed in Wide Strip
    if (viewMode.value === 'wide' && zoomScale.value > 1.05) {
      const dx = currentX - lastPointerPanX;
      const dy = currentY - lastPointerPanY;
      lastPointerPanX = currentX;
      lastPointerPanY = currentY;

      const maxPanX = Math.max(60, (zoomScale.value - 1) * (window.innerWidth * 0.7));
      const maxPanY = Math.max(60, (zoomScale.value - 1) * (window.innerHeight * 0.7));

      panX.value = Math.max(-maxPanX, Math.min(maxPanX, panX.value + dx));
      panY.value = Math.max(-maxPanY, Math.min(maxPanY, panY.value + dy));

      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }
}

function handlePointerUp(e) {
  const hadPointer = activePointers.has(e.pointerId);
  activePointers.delete(e.pointerId);

  if (isPinching) {
    if (activePointers.size === 0) {
      isPinching = false;
      lastPinchEndTime = Date.now();
    }
    return;
  }

  // Prevent tap detection immediately after a pinch gesture
  if (Date.now() - lastPinchEndTime < 400) {
    return;
  }

  // If multi-touch was active or target is interactive, do not trigger tap
  if (isMultiTouch || isInteractiveElement(e.target)) {
    return;
  }

  if (!hadPointer) return;

  const elapsed = Date.now() - pointerStartTime;

  // In Long Strip, check if the container scrolled during the pointer
  if (viewMode.value === 'long' && longStripContainerRef.value) {
    if (Math.abs(longStripContainerRef.value.scrollTop - pointerStartScrollTop) > 6) {
      pointerMoved = true;
    }
  }

  const dist = Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY);
  const maxTapDist = e.pointerType === 'mouse' ? 8 : 14;

  // 1. Clean tap detection: moved within tap threshold and released under 450ms
  if (!pointerMoved && dist < maxTapDist && elapsed < 450) {
    toggleControls();
    return;
  }

  // 2. Wide Strip horizontal swipe when not zoomed in
  if (viewMode.value === 'wide' && zoomScale.value <= 1.05 && activePointers.size === 0) {
    const deltaX = e.clientX - pointerStartX;
    const deltaY = e.clientY - pointerStartY;

    // Horizontal swipe threshold: > 40px and predominantly horizontal
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && elapsed < 650) {
      if (deltaX < 0 && currentPage.value < totalPages.value) {
        goToPage(currentPage.value + 1);
      } else if (deltaX > 0 && currentPage.value > 1) {
        goToPage(currentPage.value - 1);
      }
    }
  }
}

function handlePointerCancel(e) {
  activePointers.delete(e.pointerId);
  if (activePointers.size === 0) {
    isPinching = false;
  }
  // When browser cancels the pointer (e.g. native scroll in Long Strip), treat as moved
  pointerMoved = true;
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
  resetPan();
}

// Fullscreen Browser API with vendor prefix support & graceful fallback
function toggleFullscreen() {
  const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (!isCurrentlyFullscreen) {
    const el = viewerContainerRef.value || document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        isFullscreen.value = !isFullscreen.value;
      });
      isFullscreen.value = true;
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
      isFullscreen.value = true;
    } else {
      isFullscreen.value = !isFullscreen.value;
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
    isFullscreen.value = false;
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement);
}

// ============================================================
// DOWNLOAD PDF MODULE (Original Teacher-Uploaded PDF)
// ============================================================
function getReadableDownloadFilename() {
  if (props.downloadFileName && props.downloadFileName.toLowerCase().endsWith('.pdf')) {
    return props.downloadFileName;
  }

  const rawTitle = String(props.title || 'Learning_Module')
    .trim()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const rawStrand = String(props.subtitle || props.code || '')
    .trim()
    .toUpperCase();
  const lsMatch = rawStrand.match(/^LS\d+/i);
  const cleanStrand = lsMatch
    ? lsMatch[0].toUpperCase()
    : rawStrand.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const baseTitle = rawTitle || 'Learning_Module';
  if (
    cleanStrand &&
    !baseTitle.toUpperCase().endsWith(`_${cleanStrand}`) &&
    baseTitle.toUpperCase() !== cleanStrand
  ) {
    return `${baseTitle}_${cleanStrand}.pdf`;
  }
  return `${baseTitle}.pdf`;
}

function extractFilenameFromHeaders(headers) {
  const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;\s]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const quotedMatch = disposition.match(/filename="([^"]+)"/i);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1];
  }

  const plainMatch = disposition.match(/filename=([^;\s]+)/i);
  if (plainMatch && plainMatch[1]) {
    return plainMatch[1].replace(/^["']|["']$/g, '');
  }

  return null;
}

function showDownloadErrorMsg(message) {
  downloadError.value = message;
  if (downloadErrorTimer) {
    clearTimeout(downloadErrorTimer);
  }
  downloadErrorTimer = setTimeout(() => {
    downloadError.value = '';
  }, 7000);
}

async function handleDownloadPdf() {
  if (isDownloading.value) return;

  isDownloading.value = true;
  downloadError.value = '';

  try {
    let pdfBlob = null;
    let resolvedFileName = getReadableDownloadFilename();

    if (props.moduleId) {
      const response = await api.get(`/modules/${props.moduleId}/download`, {
        responseType: 'blob',
        timeout: 60000
      });

      const contentType = String(response.headers?.['content-type'] || response.data?.type || '').toLowerCase();
      if (contentType.includes('application/json')) {
        const text = await response.data.text();
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch {}
        throw new Error(parsed?.error || 'Unable to download PDF module.');
      }

      const headerFileName = extractFilenameFromHeaders(response.headers);
      if (headerFileName) {
        resolvedFileName = headerFileName;
      }

      pdfBlob = new Blob([response.data], { type: 'application/pdf' });
    } else if (props.pdfUrl) {
      const res = await fetch(props.pdfUrl, { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to download PDF file.');
      }
      const rawBlob = await res.blob();
      pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
    } else {
      throw new Error('No PDF file is available for this module.');
    }

    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error('The downloaded PDF file is empty or unavailable.');
    }

    if (window.navigator && typeof window.navigator.msSaveOrOpenBlob === 'function') {
      window.navigator.msSaveOrOpenBlob(pdfBlob, resolvedFileName);
    } else {
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', resolvedFileName);
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 15000);
    }
  } catch (err) {
    let errorMessage = 'Failed to download PDF module. Please check your connection and try again.';

    if (err?.response?.data instanceof Blob) {
      try {
        const errText = await err.response.data.text();
        const errJson = JSON.parse(errText);
        if (errJson?.error) {
          errorMessage = errJson.error;
        }
      } catch {}
    } else if (err?.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (err?.message && !err.message.startsWith('Request failed')) {
      errorMessage = err.message;
    }

    showDownloadErrorMsg(errorMessage);
  } finally {
    isDownloading.value = false;
  }
}

// ============================================================
// PDF LOADING & RENDERING
// ============================================================
async function loadPdfDocument() {
  if (!props.pdfUrl) return;

  loading.value = true;
  error.value = null;
  renderedPages.clear();
  renderingPages.clear();

  // Cancel prior thumbnail rendering and clear state
  cancelAllThumbnailRenders();
  renderedThumbs.clear();
  thumbStatus.value = {};
  thumbCanvasRefs.clear();
  if (thumbIntersectionObserver) {
    thumbIntersectionObserver.disconnect();
    thumbIntersectionObserver = null;
  }

  // Cancel prior loading task if still running
  if (currentLoadingTask) {
    try {
      currentLoadingTask.destroy();
    } catch (e) {}
    currentLoadingTask = null;
  }

  // Destroy prior PDF document to free resources
  if (pdfDoc.value) {
    try {
      pdfDoc.value.destroy();
    } catch (e) {}
    pdfDoc.value = null;
  }

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: props.pdfUrl,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true
    });
    currentLoadingTask = loadingTask;

    const doc = await loadingTask.promise;
    currentLoadingTask = null;

    // Use markRaw to ensure PDFDocumentProxy is never wrapped in a Vue reactive proxy
    pdfDoc.value = markRaw(doc);
    totalPages.value = doc.numPages;

    if (currentPage.value > totalPages.value) {
      currentPage.value = 1;
    }

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

    if (viewMode.value === 'wide' && thumbnailsOpen.value) {
      nextTick(() => {
        initThumbnailObserver();
        scrollThumbnailIntoView(currentPage.value);
        queueThumbRender(currentPage.value);
        if (currentPage.value > 1) queueThumbRender(currentPage.value - 1);
        if (currentPage.value < totalPages.value) queueThumbRender(currentPage.value + 1);
        queueThumbRender(1);
        queueThumbRender(2);
      });
    }
  } catch (err) {
    if (err?.name === 'RenderingCancelledException') return;
    console.error('Failed to load PDF module:', err);
    loading.value = false;
    error.value = 'Failed to load PDF module. Please check your connection or tap Retry.';
  }
}

// Render a single page onto given canvas with proper DPR and task cancellation
async function renderPageToCanvas(pageNumber, canvas, textContainer = null, targetScale = 1.0, existingPage = null) {
  if (!pdfDoc.value || !canvas) return;

  // Cancel any prior in-progress render task for this canvas to avoid collisions
  if (activeRenderTasks.has(canvas)) {
    const activeTask = activeRenderTasks.get(canvas);
    try {
      activeTask.cancel();
    } catch (e) {}
    activeRenderTasks.delete(canvas);
  }

  let page = existingPage;
  try {
    if (!page) {
      page = await pdfDoc.value.getPage(pageNumber);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const renderViewport = page.getViewport({ scale: targetScale * dpr });
    const displayViewport = page.getViewport({ scale: targetScale });
    const ctx = canvas.getContext('2d');

    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);
    canvas.style.width = `${Math.floor(displayViewport.width)}px`;
    canvas.style.height = `${Math.floor(displayViewport.height)}px`;

    const renderContext = {
      canvasContext: ctx,
      viewport: renderViewport
    };

    const renderTask = page.render(renderContext);
    activeRenderTasks.set(canvas, renderTask);

    await renderTask.promise;

    if (textContainer) {
      try {
        textContainer.innerHTML = '';
        textContainer.style.width = `${Math.floor(displayViewport.width)}px`;
        textContainer.style.height = `${Math.floor(displayViewport.height)}px`;
        const textContent = await page.getTextContent();
        const textLayerTask = pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textContainer,
          viewport: displayViewport,
          textDivs: []
        });
        if (textLayerTask?.promise) {
          await textLayerTask.promise;
        }
      } catch (textErr) {
        // Text layer failure is non-fatal
      }
    }
  } catch (err) {
    if (err?.name === 'RenderingCancelledException') {
      // Normal cancellation when superseded
      return;
    }
    console.error(`Error rendering page ${pageNumber}:`, err);
  } finally {
    if (activeRenderTasks.get(canvas)?.promise) {
      activeRenderTasks.delete(canvas);
    }
    if (page) {
      try {
        page.cleanup();
      } catch (e) {}
    }
  }
}

// Long Strip Rendering: Maximizes mobile width while preserving aspect ratio
async function renderLongPage(pageNumber, force = false) {
  if (pageNumber < 1 || pageNumber > totalPages.value) return;
  if (!force && (renderedPages.has(pageNumber) || renderingPages.has(pageNumber))) {
    return;
  }
  const canvas = longCanvasRefs.get(pageNumber);
  const textContainer = longTextRefs.get(pageNumber);
  if (!canvas || !pdfDoc.value) return;

  renderingPages.add(pageNumber);

  try {
    const page = await pdfDoc.value.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    const containerW = longStripContainerRef.value?.clientWidth || window.innerWidth;
    // Fit edge-to-edge on mobile with minimal padding; cap at 768px on wider desktop viewports
    const targetDisplayWidth = Math.min(Math.max(240, containerW - 8), 768);
    const scale = targetDisplayWidth / unscaledViewport.width;

    await renderPageToCanvas(pageNumber, canvas, textContainer, scale, page);
    renderedPages.add(pageNumber);
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.error(`Error rendering long page ${pageNumber}:`, err);
    }
  } finally {
    renderingPages.delete(pageNumber);
    if (pageNumber === totalPages.value) {
      nextTick(() => checkLongStripBottom());
    }
  }
}

function initLongStripObserver() {
  if (intersectionObserver) intersectionObserver.disconnect();
  if (!longStripContainerRef.value) return;

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const pageNum = parseInt(entry.target.getAttribute('data-page'), 10);
        if (entry.isIntersecting) {
          renderLongPage(pageNum);
          if (pageNum > 1) renderLongPage(pageNum - 1);
          if (pageNum < totalPages.value) renderLongPage(pageNum + 1);

          // Update active page when substantially visible
          if (entry.intersectionRatio >= 0.35) {
            currentPage.value = pageNum;
            emit('update-progress', { page: pageNum, mode: viewMode.value, totalPages: totalPages.value });
          }
        }
      });
    },
    {
      root: longStripContainerRef.value,
      rootMargin: '300px 0px 300px 0px',
      threshold: [0.1, 0.35, 0.7]
    }
  );

  for (let i = 1; i <= totalPages.value; i++) {
    const el = document.getElementById(`long-page-slot-${i}`);
    if (el) intersectionObserver.observe(el);
  }
}

let scrollRafId = null;

function checkLongStripBottom() {
  if (viewMode.value !== 'long' || !longStripContainerRef.value || totalPages.value <= 0) {
    isLongStripAtBottom.value = false;
    return;
  }
  const container = longStripContainerRef.value;
  const containerHeight = container.clientHeight;
  const scrollHeight = container.scrollHeight;
  const scrollTop = container.scrollTop;

  // Single page or content fits without scrolling
  if (scrollHeight <= containerHeight + 20) {
    isLongStripAtBottom.value = true;
    return;
  }

  const scrollBottom = scrollHeight - (scrollTop + containerHeight);
  const sentinel = document.getElementById('long-strip-end-sentinel');
  const lastSlot = document.getElementById(`long-page-slot-${totalPages.value}`);

  let atBottom = false;

  if (sentinel) {
    const containerRect = container.getBoundingClientRect();
    const sentinelRect = sentinel.getBoundingClientRect();
    // Sentinel top has scrolled into view within 48px tolerance
    const sentinelInView = sentinelRect.top <= containerRect.bottom + 48;
    atBottom = sentinelInView || scrollBottom <= 48;
  } else if (lastSlot) {
    const containerRect = container.getBoundingClientRect();
    const slotRect = lastSlot.getBoundingClientRect();
    const lastPageBottomInView = (slotRect.bottom - containerRect.bottom) <= 48;
    const lastPageTopInView = slotRect.top < containerRect.bottom;
    atBottom = (lastPageTopInView && lastPageBottomInView) || scrollBottom <= 48;
  } else {
    atBottom = scrollBottom <= 48;
  }

  // Safety safeguard: do not show if active page is clearly before the last page
  if (atBottom && currentPage.value < totalPages.value - 1) {
    atBottom = false;
  }

  isLongStripAtBottom.value = atBottom;
}

function onLongStripScroll() {
  if (scrollRafId) return;
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = null;
    checkLongStripBottom();
  });
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
  if (pageNumber < 1 || pageNumber > totalPages.value) return;
  if (!wideCanvasRef.value || !pdfDoc.value) return;

  try {
    const page = await pdfDoc.value.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    const stageW = wideStageRef.value?.clientWidth || bodyRef.value?.clientWidth || window.innerWidth;
    const stageH = wideStageRef.value?.clientHeight || (bodyRef.value ? bodyRef.value.clientHeight - 192 : window.innerHeight - 192);

    // Available viewing area inside stage with comfortable breathing margin
    const availableW = Math.max(240, stageW - 8);
    const availableH = Math.max(240, stageH - 8);

    const scaleW = availableW / unscaledViewport.width;
    const scaleH = availableH / unscaledViewport.height;
    const fitScale = Math.min(scaleW, scaleH);
    const scale = Math.max(0.35, fitScale);

    await renderPageToCanvas(pageNumber, wideCanvasRef.value, wideTextRef.value, scale, page);

    // Auto-scroll thumbnail strip
    scrollThumbnailIntoView(pageNumber);
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.error(`Error rendering wide page ${pageNumber}:`, err);
    }
  }
}

// Debounced ResizeObserver for orientation and layout resizing
function initResizeObserver() {
  if (resizeObserver) resizeObserver.disconnect();
  if (!bodyRef.value) return;

  lastBodyWidth = bodyRef.value.clientWidth;
  lastBodyHeight = bodyRef.value.clientHeight;

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const cr = entry.contentRect;
      if (!cr) continue;
      const w = Math.round(cr.width);
      const h = Math.round(cr.height);

      // In Long Strip, page rendering scales to fit container width, so height changes must NEVER trigger rerenders.
      // In Wide Strip, page scales to viewport, but height shifts < 80px (e.g. mobile Chrome address bar sliding) must NOT trigger rerenders.
      const widthChanged = Math.abs(w - lastBodyWidth) >= 8;
      const heightChangedSignificantly = Math.abs(h - lastBodyHeight) >= 120; // genuine orientation change or desktop window resize

      if (viewMode.value === 'long' && !widthChanged) {
        continue;
      }
      if (viewMode.value === 'wide' && !widthChanged && !heightChangedSignificantly) {
        continue;
      }

      lastBodyWidth = w;
      lastBodyHeight = h;

      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (loading.value || !pdfDoc.value) return;

        if (viewMode.value === 'wide') {
          renderWidePage(currentPage.value);
        } else if (viewMode.value === 'long') {
          renderLongPage(currentPage.value, true);
          if (currentPage.value > 1) renderLongPage(currentPage.value - 1, true);
          if (currentPage.value < totalPages.value) renderLongPage(currentPage.value + 1, true);
          // Preserve reading anchor on orientation change
          scrollToLongPage(currentPage.value);
        }
      }, 150);
    }
  });

  resizeObserver.observe(bodyRef.value);
}

// Page Navigation
function goToPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > totalPages.value) return;
  resetPan();
  currentPage.value = pageNumber;
  emit('update-progress', { page: pageNumber, mode: viewMode.value, totalPages: totalPages.value });

  if (viewMode.value === 'wide') {
    renderWidePage(pageNumber);
  } else {
    renderLongPage(pageNumber);
    scrollToLongPage(pageNumber);
  }
  scrollThumbnailIntoView(pageNumber);
}

// Mode Switching (Preserves current page)
async function switchViewMode(newMode) {
  if (viewMode.value === newMode) return;
  resetPan();
  viewMode.value = newMode;
  emit('update-progress', { page: currentPage.value, mode: newMode, totalPages: totalPages.value });

  await nextTick();
  if (newMode === 'wide') {
    if (intersectionObserver) intersectionObserver.disconnect();
    renderWidePage(currentPage.value);
    if (thumbnailsOpen.value) {
      nextTick(() => {
        initThumbnailObserver();
        scrollThumbnailIntoView(currentPage.value);
        queueThumbRender(currentPage.value);
        if (currentPage.value > 1) queueThumbRender(currentPage.value - 1);
        if (currentPage.value < totalPages.value) queueThumbRender(currentPage.value + 1);
      });
    }
  } else {
    if (thumbIntersectionObserver) {
      thumbIntersectionObserver.disconnect();
      thumbIntersectionObserver = null;
    }
    isLongStripAtBottom.value = false;
    initLongStripObserver();
    renderLongPage(currentPage.value);
    if (currentPage.value > 1) renderLongPage(currentPage.value - 1);
    if (currentPage.value < totalPages.value) renderLongPage(currentPage.value + 1);
    scrollToLongPage(currentPage.value);
    nextTick(() => checkLongStripBottom());
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
  (newUrl, oldUrl) => {
    if (newUrl && newUrl !== oldUrl) {
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
  if (orientationTimer) clearTimeout(orientationTimer);
  orientationTimer = setTimeout(() => {
    if (loading.value || !pdfDoc.value) return;
    if (viewMode.value === 'wide') {
      renderWidePage(currentPage.value);
    } else {
      renderedPages.clear();
      renderLongPage(currentPage.value, true);
      if (currentPage.value > 1) renderLongPage(currentPage.value - 1, true);
      if (currentPage.value < totalPages.value) renderLongPage(currentPage.value + 1, true);
    }
  }, 200);
}

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  window.removeEventListener('orientationchange', onOrientationChange);
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }
  if (orientationTimer) {
    clearTimeout(orientationTimer);
    orientationTimer = null;
  }
  if (downloadErrorTimer) {
    clearTimeout(downloadErrorTimer);
    downloadErrorTimer = null;
  }
  if (currentLoadingTask) {
    try {
      currentLoadingTask.destroy();
    } catch (e) {}
    currentLoadingTask = null;
  }
  if (pdfDoc.value) {
    try {
      pdfDoc.value.destroy();
    } catch (e) {}
    pdfDoc.value = null;
  }
  if (scrollRafId) {
    cancelAnimationFrame(scrollRafId);
    scrollRafId = null;
  }
  if (scrollThumbRafId) {
    cancelAnimationFrame(scrollThumbRafId);
    scrollThumbRafId = null;
  }
  if (userThumbInteractionTimer) {
    clearTimeout(userThumbInteractionTimer);
    userThumbInteractionTimer = null;
  }
  cancelAllThumbnailRenders();
  if (thumbIntersectionObserver) {
    thumbIntersectionObserver.disconnect();
    thumbIntersectionObserver = null;
  }
  renderedThumbs.clear();
  renderingThumbs.clear();
  thumbCanvasRefs.clear();
  renderedPages.clear();
  renderingPages.clear();
  longCanvasRefs.clear();
  longTextRefs.clear();
});

// Watch current page to update active thumbnail and follow page position
watch(
  () => currentPage.value,
  (newPage) => {
    if (viewMode.value === 'wide') {
      scrollThumbnailIntoView(newPage);
      queueThumbRender(newPage);
      if (newPage > 1) queueThumbRender(newPage - 1);
      if (newPage < totalPages.value) queueThumbRender(newPage + 1);
    }
  }
);

// Watch thumbnailsOpen to initialize observer and scroll to current page when opened (Wide Strip mode only)
watch(
  () => thumbnailsOpen.value,
  (open) => {
    if (open && viewMode.value === 'wide') {
      nextTick(() => {
        initThumbnailObserver();
        scrollThumbnailIntoView(currentPage.value);
        queueThumbRender(currentPage.value);
      });
    }
  }
);

// Controls visibility toggles without rerendering the PDF canvas to prevent flickering and race conditions

watch(
  () => [viewMode.value, currentPage.value],
  ([newMode]) => {
    if (newMode === 'long') {
      nextTick(() => checkLongStripBottom());
    }
  }
);

watch(
  () => zoomScale.value,
  () => {
    if (viewMode.value === 'long') {
      nextTick(() => checkLongStripBottom());
    }
  }
);
</script>

<style scoped>
/* Full-Screen Immersive Fixed Container */
.mock-pdf-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 100vw;
  height: 100%;
  z-index: 1000;
  background: #0b0f19;
  color: #f8fafc;
  overflow: hidden;
  user-select: none;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

/* Overlays (GPU transform and opacity transitions; zero layout reflow on PDF) */
.viewer-top-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  pointer-events: none;
  transform: translateY(0);
  opacity: 1;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.viewer-top-overlay > * {
  pointer-events: auto;
}

.viewer-top-overlay.overlay-hidden,
.viewer-top-overlay.overlay-hidden > * {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none !important;
}

.viewer-bottom-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  pointer-events: none;
  transform: translateY(0);
  opacity: 1;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.viewer-bottom-overlay > * {
  pointer-events: auto;
}

.viewer-bottom-overlay.overlay-hidden,
.viewer-bottom-overlay.overlay-hidden > * {
  transform: translateY(100%);
  opacity: 0;
  pointer-events: none !important;
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
  gap: 0.65rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex: 1;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.download-pdf-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
  color: #f8fafc;
  height: 44px;
  min-height: 44px;
  padding: 0 0.85rem;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
  box-sizing: border-box;
  white-space: nowrap;
}

.download-pdf-btn:hover:not(:disabled) {
  background: #334155;
  border-color: #64748b;
}

.download-pdf-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.download-pdf-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.download-pdf-icon {
  flex-shrink: 0;
}

.download-pdf-label {
  display: inline;
  line-height: 1;
}

.download-btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(248, 250, 252, 0.25);
  border-top-color: #f8fafc;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  flex-shrink: 0;
}

.nav-icon-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
  color: #f8fafc;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
  box-sizing: border-box;
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
  padding: 0.45rem 0.75rem;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(51, 65, 85, 0.7);
  flex-shrink: 0;
  gap: 0.35rem;
  z-index: 25;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.view-mode-toggle {
  display: inline-flex;
  background: #0f172a;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid #334155;
  flex-shrink: 0;
}

.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  min-height: 44px;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  box-sizing: border-box;
}

.mode-btn.active {
  background: #165dfc;
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(22, 93, 252, 0.45);
}

.mode-label-short {
  display: none;
}

.mode-label-full {
  display: inline;
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
  flex-shrink: 0;
}

.page-badge-pill strong {
  color: #38bdf8;
  font-weight: 800;
}

.page-badge-short {
  display: none;
}

.page-badge-full {
  display: inline;
}

.zoom-controls {
  display: inline-flex;
  align-items: center;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 2px 4px;
  gap: 3px;
  flex-shrink: 0;
}

.zoom-btn {
  background: transparent;
  border: none;
  color: #cbd5e1;
  width: 34px;
  height: 34px;
  min-width: 34px;
  min-height: 34px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  box-sizing: border-box;
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
  min-width: 38px;
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

/* Download Error Banner */
.download-error-banner {
  background: rgba(127, 29, 29, 0.95);
  border-bottom: 1px solid #ef4444;
  padding: 0.45rem 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  flex-shrink: 0;
  z-index: 22;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.download-error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.download-error-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #fee2e2;
  line-height: 1.35;
}

.download-error-dismiss-btn {
  background: transparent;
  border: none;
  color: #fca5a5;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
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
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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

/* 3. Main Viewer Body (Permanent full-viewport base) */
.viewer-body {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0b0f19;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  touch-action: pan-y;
  z-index: 10;
}

.viewer-body.wide-mode {
  touch-action: none;
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
  max-width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overflow-anchor: none;
  padding-top: max(108px, calc(env(safe-area-inset-top) + 100px));
  padding-bottom: max(96px, calc(env(safe-area-inset-bottom) + 88px));
  padding-left: 0;
  padding-right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  box-sizing: border-box;
}

.is-zoomed .long-strip-container {
  overflow-x: auto;
  touch-action: pan-x pan-y;
}

.long-page-slot {
  width: 100%;
  max-width: 768px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-sizing: border-box;
}

.long-canvas-box {
  width: 100%;
  max-width: 100%;
  min-height: 280px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease;
  box-sizing: border-box;
}

.textLayer {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  opacity: 0;
  line-height: 1;
  pointer-events: none;
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

.long-strip-end-sentinel {
  width: 100%;
  height: 72px;
  flex-shrink: 0;
  pointer-events: none;
}

/* MODE 2: Wide Strip (Horizontal Single Page) */
.wide-strip-container {
  width: 100%;
  max-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  touch-action: none;
  user-select: none;
  overflow: hidden;
  box-sizing: border-box;
  padding-top: max(104px, calc(env(safe-area-inset-top) + 96px));
  padding-bottom: max(88px, calc(env(safe-area-inset-bottom) + 80px));
}

.wide-active-page-stage {
  width: 100%;
  max-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 4px;
  box-sizing: border-box;
}

.wide-canvas-box {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  transition: transform 0.08s ease-out;
  touch-action: none;
  box-sizing: border-box;
}

.wide-nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
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
  box-sizing: border-box;
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

/* Subtle Immersive Bottom Wrap & Page Pill (Shown when controls are hidden) */
.immersive-bottom-wrap {
  position: absolute;
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 35;
  pointer-events: auto;
  max-width: 90vw;
}

.immersive-post-test-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.25rem;
  min-height: 44px;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 9999px;
  background: #165dfc;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(22, 93, 252, 0.35);
  cursor: pointer;
  white-space: nowrap;
  animation: fadeIn 0.2s ease;
}

.immersive-post-test-btn:active {
  background: #1d4ed8;
  transform: scale(0.98);
}

.immersive-page-pill {
  position: relative;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(6px);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  pointer-events: auto;
  cursor: pointer;
  white-space: nowrap;
}

/* 4. Wide Strip Thumbnail Dock */
.wide-thumbnail-dock {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(51, 65, 85, 0.7);
  padding: 0.45rem 0.75rem max(0.45rem, env(safe-area-inset-bottom)) 0.75rem;
  flex-shrink: 0;
  z-index: 25;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  transition: padding-bottom 0.2s ease;
}

.has-post-test-dock .wide-thumbnail-dock {
  padding-bottom: 0.35rem;
}

.has-thumbnail-dock .wide-strip-container {
  padding-bottom: max(148px, calc(env(safe-area-inset-bottom) + 140px));
}

.has-thumbnail-dock.has-post-test-dock .wide-strip-container {
  padding-bottom: max(205px, calc(env(safe-area-inset-bottom) + 195px));
}

.has-post-test-dock:not(.has-thumbnail-dock) .wide-strip-container {
  padding-bottom: max(140px, calc(env(safe-area-inset-bottom) + 130px));
}

.has-post-test-dock .long-strip-container {
  padding-bottom: max(130px, calc(env(safe-area-inset-bottom) + 120px));
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
  padding: 4px 6px;
  min-height: 36px;
}

.dock-hint {
  font-size: 0.675rem;
  color: #64748b;
}

.thumbnail-strip-track {
  display: flex;
  gap: 0.65rem;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0.25rem 0.5rem 0.45rem 0.5rem;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #475569 transparent;
}

.thumbnail-strip-track::-webkit-scrollbar {
  height: 4px;
}

.thumbnail-strip-track::-webkit-scrollbar-track {
  background: transparent;
}

.thumbnail-strip-track::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

.thumb-item {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: transform 0.12s ease;
  user-select: none;
  -webkit-user-select: none;
  padding: 2px 2px;
  outline: none;
}

.thumb-item:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
  border-radius: 6px;
}

.thumb-item:active {
  transform: scale(0.97);
}

.thumb-preview-wrap {
  width: 62px;
  height: 82px;
  background: #ffffff;
  border: 1.5px solid #475569;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.thumb-item:hover:not(.active) .thumb-preview-wrap {
  border-color: #94a3b8;
}

.thumb-item.active .thumb-preview-wrap {
  border-color: #165dfc !important;
  box-shadow: 0 0 0 2px #165dfc, 0 2px 6px rgba(22, 93, 252, 0.4);
}

.thumb-canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  background: #ffffff;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  color: #94a3b8;
}

.thumb-page-num {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
}

.thumb-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #165dfc;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.thumb-err-tag {
  font-size: 0.85rem;
  font-weight: 800;
  color: #ef4444;
}

.thumb-label {
  font-size: 0.675rem;
  font-weight: 600;
  color: #94a3b8;
  line-height: 1.2;
  transition: color 0.15s ease;
}

.thumb-item.active .thumb-label {
  color: #38bdf8 !important;
  font-weight: 800;
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
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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
  min-height: 44px;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 10px;
  background: #165dfc;
  color: #ffffff;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(22, 93, 252, 0.35);
  box-sizing: border-box;
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
  box-sizing: border-box;
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
  box-sizing: border-box;
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
  min-height: 44px;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  box-sizing: border-box;
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

/* Mobile Responsiveness & Multi-Breakpoint Polish */
@media (max-width: 600px) {
  .download-pdf-label {
    display: none;
  }
  .download-pdf-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
  }
  .wide-nav-arrow {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    background: rgba(15, 23, 42, 0.7);
  }
  .wide-nav-prev {
    left: 0.35rem;
  }
  .wide-nav-next {
    right: 0.35rem;
  }
  .thumb-preview-wrap {
    width: 48px;
    height: 64px;
  }
  .thumb-label {
    font-size: 0.625rem;
  }
  .thumbnail-strip-track {
    gap: 0.45rem;
    padding: 0.2rem 0.35rem 0.35rem 0.35rem;
  }
}

@media (max-width: 480px) {
  .lesson-tag {
    display: none;
  }
  .proceed-btn {
    width: 100%;
    justify-content: center;
    min-height: 44px;
  }
  .viewer-top-bar {
    padding: max(0.4rem, env(safe-area-inset-top)) 0.5rem 0.4rem 0.5rem;
  }
  .top-bar-right {
    gap: 0.35rem;
  }
  .download-pdf-btn,
  .nav-icon-btn {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    padding: 0;
  }
  .viewer-controls-bar {
    padding: 0.35rem 0.45rem;
    gap: 0.25rem;
  }
  .mode-btn {
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
    min-height: 40px;
  }
  .mode-label-full {
    display: none;
  }
  .mode-label-short {
    display: inline;
  }
  .page-badge-pill {
    padding: 0.25rem 0.4rem;
    font-size: 0.7rem;
  }
  .page-badge-full {
    display: none;
  }
  .page-badge-short {
    display: inline;
  }
  .zoom-controls {
    padding: 1px 2px;
    gap: 2px;
  }
  .zoom-btn {
    width: 30px;
    height: 30px;
    min-width: 30px;
    min-height: 30px;
  }
  .zoom-level-text {
    min-width: 34px;
    font-size: 0.7rem;
  }
  .tap-hint-pill {
    max-width: 90vw;
    font-size: 0.7rem;
    padding: 0.35rem 0.65rem;
    white-space: normal;
  }
}

@media (max-width: 360px) {
  .viewer-controls-bar {
    padding: 0.3rem 0.35rem;
    gap: 0.2rem;
  }
  .mode-btn {
    padding: 0.3rem 0.4rem;
    gap: 0.25rem;
    font-size: 0.7rem;
  }
  .page-badge-pill {
    padding: 0.2rem 0.3rem;
    font-size: 0.65rem;
  }
  .zoom-btn {
    width: 26px;
    height: 26px;
    min-width: 26px;
    min-height: 26px;
  }
  .zoom-level-text {
    min-width: 28px;
    font-size: 0.65rem;
  }
}
</style>

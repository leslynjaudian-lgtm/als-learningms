<template>
  <div class="module-thumb-box" :title="title || 'Module Preview'">
    <!-- Real Thumbnail Preview -->
    <img
      v-if="thumbnailUrl"
      :src="thumbnailUrl"
      :alt="title || 'Module thumbnail'"
      class="module-thumb-img"
      @error="handleImageError"
    />

    <!-- Placeholder (Loading or Fallback) -->
    <div v-else class="module-thumb-placeholder" :class="{ 'is-loading': isLoading }">
      <div v-if="isLoading" class="thumb-shimmer"></div>
      <svg
        class="thumb-doc-icon"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      <span class="thumb-doc-label">PDF</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure PDF.js worker is properly configured once
if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }
}

const props = defineProps({
  fileUrl: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  coverImageUrl: {
    type: String,
    default: '',
  },
  moduleId: {
    type: [String, Number],
    default: '',
  },
});

const thumbnailUrl = ref('');
const isLoading = ref(false);
const hasError = ref(false);

// Global shared caches to prevent repeated PDF rendering
const memoryCache = window.__als_pdf_thumbnail_cache || (window.__als_pdf_thumbnail_cache = new Map());

// Concurrency queue to keep rendering fast and prevent memory spikes
let activeRenders = window.__als_active_pdf_renders || 0;
const renderQueue = window.__als_pdf_render_queue || (window.__als_pdf_render_queue = []);

function queueRender(renderFn) {
  return new Promise((resolve, reject) => {
    renderQueue.push({ renderFn, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (activeRenders >= 2 || renderQueue.length === 0) return;
  activeRenders++;
  window.__als_active_pdf_renders = activeRenders;

  const { renderFn, resolve, reject } = renderQueue.shift();
  try {
    const result = await renderFn();
    resolve(result);
  } catch (err) {
    reject(err);
  } finally {
    activeRenders--;
    window.__als_active_pdf_renders = activeRenders;
    processQueue();
  }
}

function resolvePdfUrl(rawUrl) {
  if (!rawUrl) return '';
  const url = String(rawUrl).trim();
  // If url contains /uploads/, use relative path so it routes through proxy without CORS issues
  if (url.includes('/uploads/')) {
    const idx = url.indexOf('/uploads/');
    return url.slice(idx);
  }
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  if (url.startsWith('/')) {
    return url;
  }
  return `/uploads/modules/${url}`;
}

function isImageFile(url) {
  if (!url) return false;
  const clean = String(url).toLowerCase().split('?')[0].split('#')[0];
  return (
    clean.endsWith('.png') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.startsWith('data:image/')
  );
}

function getCacheKey(url) {
  if (!url) return '';
  return `als_thumb_${props.moduleId || ''}_${url}`;
}

function getCachedThumb(key) {
  if (!key) return null;
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      memoryCache.set(key, stored);
      return stored;
    }
  } catch {
    // ignore sessionStorage errors
  }
  return null;
}

function storeCachedThumb(key, dataUrl) {
  if (!key || !dataUrl) return;
  memoryCache.set(key, dataUrl);
  try {
    sessionStorage.setItem(key, dataUrl);
  } catch {
    // ignore quota errors
  }
}

let isUnmounted = false;

async function renderFirstPageToDataUrl(pdfUrl) {
  return queueRender(async () => {
    let loadingTask = null;
    let pdfDoc = null;
    let page = null;

    try {
      loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: '/cmaps/',
        cMapPacked: true,
        stopAtErrors: false,
      });

      pdfDoc = await loadingTask.promise;
      if (isUnmounted) return null;

      // Extract page 1 only
      page = await pdfDoc.getPage(1);
      if (isUnmounted) return null;

      const unscaledViewport = page.getViewport({ scale: 1 });
      // Render at ~220px width for crisp sharpness on high-DPI (retina) screens
      const targetWidth = 220;
      const scale = targetWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
      });

      await renderTask.promise;
      if (isUnmounted) return null;

      return canvas.toDataURL('image/jpeg', 0.85);
    } finally {
      try {
        if (page) page.cleanup();
      } catch {}
      try {
        if (pdfDoc) pdfDoc.destroy();
      } catch {}
    }
  });
}

async function loadThumbnail() {
  hasError.value = false;

  // 1. If explicit cover image is provided, use it directly
  if (props.coverImageUrl && props.coverImageUrl.trim()) {
    thumbnailUrl.value = resolvePdfUrl(props.coverImageUrl);
    return;
  }

  const rawUrl = props.fileUrl;
  if (!rawUrl || !rawUrl.trim()) {
    thumbnailUrl.value = '';
    return;
  }

  const resolvedUrl = resolvePdfUrl(rawUrl);

  // 2. If uploaded material is an image, preview directly
  if (isImageFile(resolvedUrl)) {
    thumbnailUrl.value = resolvedUrl;
    return;
  }

  // 3. Check memory & sessionStorage cache
  const cacheKey = getCacheKey(resolvedUrl);
  const cached = getCachedThumb(cacheKey);
  if (cached) {
    thumbnailUrl.value = cached;
    return;
  }

  // 4. Generate first page thumbnail using PDF.js
  isLoading.value = true;
  try {
    const dataUrl = await renderFirstPageToDataUrl(resolvedUrl);
    if (!isUnmounted && dataUrl) {
      thumbnailUrl.value = dataUrl;
      storeCachedThumb(cacheKey, dataUrl);
    }
  } catch (err) {
    if (!isUnmounted) {
      console.warn('Could not generate PDF thumbnail for module:', props.title || rawUrl, err);
      hasError.value = true;
      thumbnailUrl.value = '';
    }
  } finally {
    if (!isUnmounted) {
      isLoading.value = false;
    }
  }
}

function handleImageError() {
  thumbnailUrl.value = '';
  hasError.value = true;
}

watch(
  () => [props.fileUrl, props.coverImageUrl],
  () => {
    loadThumbnail();
  }
);

onMounted(() => {
  isUnmounted = false;
  loadThumbnail();
});

onBeforeUnmount(() => {
  isUnmounted = true;
});
</script>

<style scoped>
.module-thumb-box {
  width: 80px;
  height: 110px;
  min-width: 80px;
  max-width: 80px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
  position: relative;
  box-sizing: border-box;
}

.module-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  background: #ffffff;
}

.module-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #94a3b8;
  position: relative;
  overflow: hidden;
  gap: 0.35rem;
}

.thumb-doc-icon {
  width: 30px;
  height: 30px;
  color: #64748b;
  flex-shrink: 0;
}

.thumb-doc-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1;
}

@media (max-width: 480px) {
  .module-thumb-box {
    width: 68px;
    height: 94px;
    min-width: 68px;
    max-width: 68px;
  }
}

.thumb-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.65) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: thumbShimmer 1.4s infinite;
}

@keyframes thumbShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>

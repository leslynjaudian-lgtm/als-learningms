<template>
  <div ref="searchContainerRef" class="global-search-wrapper" :class="{ 'mobile-expanded': mobileOpen }">
    <!-- Mobile Search Trigger Button (visible only on small screens when not expanded) -->
    <button
      type="button"
      class="mobile-search-trigger"
      aria-label="Open global search"
      title="Search learners, modules, and more..."
      @click="openMobileSearch"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </button>

    <!-- Search Input Box -->
    <div class="global-search-box" :class="{ focused: isFocused, 'has-dropdown': showDropdown }">
      <!-- Left Search Icon -->
      <span class="search-icon-left" aria-hidden="true">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>

      <input
        ref="searchInputRef"
        v-model="searchQuery"
        type="text"
        class="global-search-input"
        placeholder="Search learners, modules, and more..."
        aria-label="Global search"
        aria-autocomplete="list"
        :aria-expanded="showDropdown ? 'true' : 'false'"
        autocomplete="off"
        @focus="handleFocus"
        @input="handleInput"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.prevent="handleEnterKey"
        @keydown.esc.prevent="closeSearch"
      />

      <!-- Loading Spinner -->
      <span v-if="isLoading" class="search-spinner" aria-label="Searching"></span>

      <!-- Clear Button when text is entered -->
      <button
        v-if="searchQuery.length > 0"
        type="button"
        class="search-clear-btn"
        aria-label="Clear search query"
        title="Clear search"
        @click="clearQuery"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <!-- Mobile Close Overlay Button -->
      <button
        v-if="mobileOpen"
        type="button"
        class="mobile-search-close"
        aria-label="Close search"
        @click="closeMobileSearch"
      >
        Cancel
      </button>
    </div>

    <!-- Search Suggestions Dropdown -->
    <transition name="search-dropdown-fade">
      <div
        v-if="showDropdown"
        class="search-dropdown"
        role="listbox"
        aria-label="Search suggestions"
      >
        <!-- Loading State -->
        <div v-if="isLoading && categories.length === 0" class="search-state-box">
          <span class="search-spinner-inline"></span>
          <span>Searching your assigned ALS records...</span>
        </div>

        <!-- Categorized Results -->
        <div v-else-if="categories.length > 0" class="search-results-scroll">
          <div
            v-for="group in categories"
            :key="group.category"
            class="search-category-group"
          >
            <div class="search-category-header">
              <span class="category-title">{{ group.category }}</span>
              <span class="category-count">{{ group.items.length }}</span>
            </div>

            <ul class="search-category-list">
              <li
                v-for="item in group.items"
                :key="`${item.type}-${item.id}`"
                role="option"
                :aria-selected="isItemHighlighted(item)"
                class="search-result-item"
                :class="{ highlighted: isItemHighlighted(item) }"
                @mouseenter="setHighlightedItem(item)"
                @mousedown.prevent="selectResult(item)"
              >
                <!-- Relevant Category Icon -->
                <div class="result-icon-badge" :class="`icon-${item.type}`">
                  <!-- Learner Icon -->
                  <svg v-if="item.type === 'learner'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>

                  <!-- Module Icon -->
                  <svg v-else-if="item.type === 'module'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>

                  <!-- Learning Center Icon -->
                  <svg v-else-if="item.type === 'learning_center'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21h18" />
                    <path d="M5 21V7l8-4v18" />
                    <path d="M19 21V11l-6-4" />
                  </svg>

                  <!-- Announcement Icon -->
                  <svg v-else-if="item.type === 'announcement'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>

                  <!-- Schedule Icon -->
                  <svg v-else-if="item.type === 'schedule'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>

                  <!-- Learner Record / Progress Icon -->
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>

                <!-- Main Info -->
                <div class="result-content">
                  <div class="result-top-row">
                    <span class="result-title">{{ item.title }}</span>
                    <span class="result-category-tag">{{ item.category }}</span>
                  </div>
                  <div class="result-subtitle">
                    {{ item.title }} — {{ item.subtitle }}
                  </div>
                </div>

                <!-- Right Arrow -->
                <span class="result-arrow" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="hasSearched && !isLoading" class="search-empty-state">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p class="empty-state-text">No matching results found.</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { searchTeacherGlobal } from '../api/search.js';
import { useTeacherSession } from '../composables/useTeacherSession.js';

const router = useRouter();
const { teacherId } = useTeacherSession();

const searchContainerRef = ref(null);
const searchInputRef = ref(null);

const searchQuery = ref('');
const isFocused = ref(false);
const isLoading = ref(false);
const hasSearched = ref(false);
const mobileOpen = ref(false);

const categories = ref([]);
const flatResults = ref([]);
const highlightedIndex = ref(-1);

let debounceTimer = null;
let latestRequestId = 0;

const showDropdown = computed(() => {
  const trimmed = searchQuery.value.trim();
  return isFocused.value && trimmed.length >= 2 && (isLoading.value || hasSearched.value);
});

function handleFocus() {
  isFocused.value = true;
  const trimmed = searchQuery.value.trim();
  if (trimmed.length >= 2 && !hasSearched.value && !isLoading.value) {
    triggerDebouncedSearch(trimmed);
  }
}

function handleInput() {
  isFocused.value = true;
  const trimmed = searchQuery.value.trim();

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (trimmed.length < 2) {
    isLoading.value = false;
    hasSearched.value = false;
    categories.value = [];
    flatResults.value = [];
    highlightedIndex.value = -1;
    return;
  }

  triggerDebouncedSearch(trimmed);
}

function triggerDebouncedSearch(trimmedQuery) {
  isLoading.value = true;
  debounceTimer = setTimeout(async () => {
    const reqId = ++latestRequestId;
    try {
      const data = await searchTeacherGlobal(trimmedQuery, teacherId.value);
      if (reqId !== latestRequestId) return;

      categories.value = Array.isArray(data?.categories) ? data.categories : [];
      flatResults.value = Array.isArray(data?.results) ? data.results : [];
      hasSearched.value = true;
      highlightedIndex.value = flatResults.value.length > 0 ? 0 : -1;
    } catch (err) {
      if (reqId !== latestRequestId) return;
      console.error('Teacher global search error:', err);
      categories.value = [];
      flatResults.value = [];
      hasSearched.value = true;
      highlightedIndex.value = -1;
    } finally {
      if (reqId === latestRequestId) {
        isLoading.value = false;
      }
    }
  }, 300);
}

function clearQuery() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  latestRequestId++;
  searchQuery.value = '';
  isLoading.value = false;
  hasSearched.value = false;
  categories.value = [];
  flatResults.value = [];
  highlightedIndex.value = -1;
  nextTick(() => {
    searchInputRef.value?.focus();
  });
}

function closeSearch() {
  isFocused.value = false;
  highlightedIndex.value = -1;
}

function openMobileSearch() {
  mobileOpen.value = true;
  isFocused.value = true;
  nextTick(() => {
    searchInputRef.value?.focus();
  });
}

function closeMobileSearch() {
  mobileOpen.value = false;
  closeSearch();
}

function isItemHighlighted(item) {
  if (highlightedIndex.value < 0 || highlightedIndex.value >= flatResults.value.length) {
    return false;
  }
  const current = flatResults.value[highlightedIndex.value];
  return current && current.type === item.type && current.id === item.id;
}

function setHighlightedItem(item) {
  const idx = flatResults.value.findIndex(
    (r) => r.type === item.type && r.id === item.id
  );
  if (idx !== -1) {
    highlightedIndex.value = idx;
  }
}

function moveHighlight(step) {
  if (!showDropdown.value || flatResults.value.length === 0) return;
  const total = flatResults.value.length;
  if (highlightedIndex.value === -1) {
    highlightedIndex.value = 0;
  } else {
    highlightedIndex.value = (highlightedIndex.value + step + total) % total;
  }
}

function handleEnterKey() {
  if (flatResults.value.length === 0) return;
  const target =
    highlightedIndex.value >= 0 && highlightedIndex.value < flatResults.value.length
      ? flatResults.value[highlightedIndex.value]
      : flatResults.value[0];
  if (target) {
    selectResult(target);
  }
}

function selectResult(item) {
  if (!item || !item.route) return;
  isFocused.value = false;
  mobileOpen.value = false;
  router.push(item.route);
}

function handleClickOutside(event) {
  if (searchContainerRef.value && !searchContainerRef.value.contains(event.target)) {
    isFocused.value = false;
    mobileOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
});
</script>

<style scoped>
.global-search-wrapper {
  position: relative;
  flex: 1;
  max-width: 440px;
  min-width: 220px;
}

.mobile-search-trigger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid transparent;
  background: #f1f5f9;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mobile-search-trigger:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.global-search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 0.65rem 0 2.35rem;
  transition: all 0.18s ease;
}

.global-search-box:hover {
  border-color: #94a3b8;
  background: #ffffff;
}

.global-search-box.focused {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.search-icon-left {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.global-search-box.focused .search-icon-left {
  color: #2563eb;
}

.global-search-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
}

.global-search-input::placeholder {
  color: #64748b;
}

.search-clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #e2e8f0;
  color: #475569;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 0.35rem;
  transition: background 0.15s ease, color 0.15s ease;
}

.search-clear-btn:hover {
  background: #cbd5e1;
  color: #0f172a;
}

.search-spinner,
.search-spinner-inline {
  width: 15px;
  height: 15px;
  border: 2px solid #cbd5e1;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: globalSearchSpin 0.65s linear infinite;
  flex-shrink: 0;
  margin-left: 0.35rem;
}

@keyframes globalSearchSpin {
  to {
    transform: rotate(360deg);
  }
}

.mobile-search-close {
  display: none;
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-left: 0.5rem;
  padding: 0.25rem 0.4rem;
  cursor: pointer;
  white-space: nowrap;
}

/* Suggestions Dropdown */
.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  min-width: 360px;
  max-width: 520px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 14px 30px -6px rgba(15, 23, 42, 0.16), 0 4px 10px -3px rgba(15, 23, 42, 0.08);
  z-index: 120;
  overflow: hidden;
}

.search-results-scroll {
  max-height: 420px;
  overflow-y: auto;
  padding: 0.4rem 0;
}

.search-category-group + .search-category-group {
  border-top: 1px solid #f1f5f9;
  margin-top: 0.25rem;
  padding-top: 0.25rem;
}

.search-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.9rem 0.25rem;
}

.category-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.category-count {
  font-size: 0.68rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 0.05rem 0.45rem;
  border-radius: 9999px;
}

.search-category-list {
  list-style: none;
  margin: 0;
  padding: 0 0.4rem;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s ease;
}

.search-result-item:hover,
.search-result-item.highlighted {
  background: #eff6ff;
}

.result-icon-badge {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #eff6ff;
  color: #1d4ed8;
}

.result-icon-badge.icon-learner {
  background: #eff6ff;
  color: #1d4ed8;
}

.result-icon-badge.icon-module {
  background: #faf5ff;
  color: #7e22ce;
}

.result-icon-badge.icon-learning_center {
  background: #fffbeb;
  color: #b45309;
}

.result-icon-badge.icon-announcement {
  background: #fef2f2;
  color: #dc2626;
}

.result-icon-badge.icon-schedule {
  background: #ecfeff;
  color: #0e7490;
}

.result-icon-badge.icon-record {
  background: #f0fdf4;
  color: #15803d;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.result-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-category-tag {
  font-size: 0.675rem;
  font-weight: 600;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.result-subtitle {
  font-size: 0.76rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.result-arrow {
  color: #94a3b8;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.search-result-item.highlighted .result-arrow {
  color: #2563eb;
}

.search-state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.35rem 1rem;
  font-size: 0.85rem;
  color: #64748b;
}

.search-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.5rem 1rem;
  color: #64748b;
  text-align: center;
}

.empty-state-text {
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  margin: 0;
}

.search-dropdown-fade-enter-active,
.search-dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.search-dropdown-fade-enter-from,
.search-dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Responsive behavior on smaller screens */
@media (max-width: 768px) {
  .global-search-wrapper {
    min-width: auto;
    max-width: none;
    flex: 0 0 auto;
  }

  .mobile-search-trigger {
    display: inline-flex;
  }

  .global-search-box {
    display: none;
  }

  .global-search-wrapper.mobile-expanded {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--header-height, 64px);
    background: #ffffff;
    z-index: 150;
    padding: 0 0.85rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
  }

  .global-search-wrapper.mobile-expanded .mobile-search-trigger {
    display: none;
  }

  .global-search-wrapper.mobile-expanded .global-search-box {
    display: flex;
    width: 100%;
  }

  .global-search-wrapper.mobile-expanded .mobile-search-close {
    display: inline-block;
  }

  .global-search-wrapper.mobile-expanded .search-dropdown {
    position: fixed;
    top: var(--header-height, 64px);
    left: 0.5rem;
    right: 0.5rem;
    width: auto;
    min-width: 0;
    max-width: none;
  }
}
</style>


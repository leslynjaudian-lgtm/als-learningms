<template>
  <div class="my-modules-page">
    <!-- Page Title & Subtitle -->
    <div class="modules-header">
      <h1 class="page-title">My Modules</h1>
      <p class="page-subtitle">Access your learning modules and study at your own pace.</p>
    </div>

    <!-- Horizontally Scrollable Learning Strand Filters -->
    <div class="strand-filters-scroll-wrapper" role="region" aria-label="Learning Strand Filters">
      <div class="strand-filters-track">
        <button
          v-for="strand in availableStrands"
          :key="strand.key"
          type="button"
          class="strand-filter-pill"
          :class="{ active: currentStrand === strand.key }"
          @click="selectStrand(strand.key)"
          :aria-label="strand.fullName"
        >
          <span class="pill-label">{{ strand.shortLabel }}</span>
          <span class="pill-badge">{{ getModuleCount(strand.key) }}</span>
        </button>
      </div>
    </div>

    <!-- Active Learning Strand Full Name Banner -->
    <div class="active-strand-banner">
      <div class="strand-banner-text">
        <span class="strand-banner-eyebrow">
          {{ currentStrand === 'all' ? 'Category' : 'Learning Strand' }}
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

    <!-- Strand Empty State: Specific learning strand has no modules -->
    <div v-else-if="filteredModules.length === 0" class="learner-card empty-card-box strand-empty-box">
      <div class="empty-icon-circle strand-empty-circle">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
      </div>
      <h3 class="empty-title">No modules available for this learning strand yet.</h3>
      <p class="empty-desc">
        There are currently no published modules for <strong>{{ currentStrandFullName }}</strong>. You can explore other learning strands above.
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
          <!-- Small Module Icon -->
          <div class="card-icon-bubble">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>

          <!-- Title, Strand, Code & Status -->
          <div class="card-content-wrap">
            <h3 class="card-module-title">{{ mod.title }}</h3>
            <div class="card-module-strand">{{ mod.strand || mod.learningArea?.name || 'General Strand' }}</div>

            <div class="card-pills-row">
              <span v-if="mod.code || mod.strandCode" class="pill-code-badge">
                {{ mod.code || mod.strandCode }}
              </span>
              <span class="pill-status-badge" :class="getStatusClass(mod)">
                {{ getProgressStatusLabel(mod) }}
              </span>
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
import { computed, onMounted, ref } from 'vue';
import api from '../api/axios';

// 8 Learning Strand Categories
const LEARNING_STRANDS = [
  {
    key: 'all',
    code: 'ALL',
    shortLabel: 'All',
    fullName: 'All Modules',
  },
  {
    key: 'LS1-ENG',
    code: 'LS1-ENG',
    shortLabel: 'LS1 English',
    fullName: 'LS 1 – Communication Skills (English)',
    aliases: ['ls1-eng', 'english', 'communication skills (english)', 'ls1 english', 'ls 1 english'],
  },
  {
    key: 'LS1-FIL',
    code: 'LS1-FIL',
    shortLabel: 'LS1 Filipino',
    fullName: 'LS 1 – Communication Skills (Filipino)',
    aliases: ['ls1-fil', 'filipino', 'communication skills (filipino)', 'ls1 filipino', 'ls 1 filipino'],
  },
  {
    key: 'LS2-SCI',
    code: 'LS2-SCI',
    shortLabel: 'LS2',
    fullName: 'LS 2 – Scientific Literacy and Critical Thinking Skills',
    aliases: [
      'ls2-sci',
      'ls2',
      'scientific',
      'science',
      'scientific literacy and critical thinking skills',
      'scientific & critical thinking skills',
      'scientific and critical thinking skills',
      'scientific literacy and critical thinking',
    ],
  },
  {
    key: 'LS3-MATH',
    code: 'LS3-MATH',
    shortLabel: 'LS3',
    fullName: 'LS 3 – Mathematical & Problem Solving Skills',
    aliases: [
      'ls3-math',
      'ls3',
      'math',
      'mathematical',
      'mathematical & problem solving skills',
      'mathematical and problem solving skills',
      'mathematical and problem solving',
    ],
  },
  {
    key: 'LS4-LIFE',
    code: 'LS4-LIFE',
    shortLabel: 'LS4',
    fullName: 'LS 4 – Life & Career Skills',
    aliases: [
      'ls4-life',
      'ls4',
      'life and career skills',
      'life & career skills',
      'life and career',
    ],
  },
  {
    key: 'LS5-SOC',
    code: 'LS5-SOC',
    shortLabel: 'LS5',
    fullName: 'LS 5 – Understanding Self & Society',
    aliases: [
      'ls5-soc',
      'ls5',
      'society',
      'understanding self & society',
      'understanding self and society',
      'understanding the self and society',
    ],
  },
  {
    key: 'LS6-DIGI',
    code: 'LS6-DIGI',
    shortLabel: 'LS6',
    fullName: 'LS 6 – Digital Citizenship',
    aliases: [
      'ls6-digi',
      'ls6',
      'digital citizenship',
      'digital literacy',
      'digital citizenship & literacy',
    ],
  },
];

const currentStrand = ref('all');
const rawModules = ref([]);
const loading = ref(false);

// Always display all 8 categories
const availableStrands = computed(() => LEARNING_STRANDS);

// All published and assigned teacher modules (excluding any demo/mock entries)
const allModules = computed(() => {
  return rawModules.value.filter(
    (m) => m && m.code !== 'LS2-MOCK-001' && m.id !== 'ls2-mock-001'
  );
});

// Total count
const allCount = computed(() => allModules.value.length);

// Full name of selected strand
const currentStrandFullName = computed(() => {
  const strand = LEARNING_STRANDS.find((s) => s.key === currentStrand.value);
  return strand ? strand.fullName : 'All Modules';
});

// Strand matching function
function matchesStrand(mod, strandKey) {
  if (strandKey === 'all') return true;

  const targetStrand = LEARNING_STRANDS.find((s) => s.key === strandKey);
  if (!targetStrand) return false;

  const areaCode = (mod.learningArea?.code || mod.strandCode || mod.code || '').toUpperCase().trim();
  const fullText = `${mod.strand || ''} ${mod.learningArea?.name || ''} ${mod.title || ''} ${areaCode}`.toLowerCase();

  if (strandKey === 'LS1-ENG') {
    if (areaCode === 'LS1-ENG' || areaCode.includes('ENG')) return true;
    if (fullText.includes('english') && (fullText.includes('ls1') || fullText.includes('ls 1') || fullText.includes('communication'))) return true;
    if (fullText.includes('communication skills (english)')) return true;
    return false;
  }

  if (strandKey === 'LS1-FIL') {
    if (areaCode === 'LS1-FIL' || areaCode.includes('FIL')) return true;
    if (fullText.includes('filipino') && (fullText.includes('ls1') || fullText.includes('ls 1') || fullText.includes('communication'))) return true;
    if (fullText.includes('communication skills (filipino)')) return true;
    return false;
  }

  if (areaCode === targetStrand.code.toUpperCase()) return true;
  const shortCodePrefix = targetStrand.code.split('-')[0];
  if (shortCodePrefix && (areaCode === shortCodePrefix || areaCode.startsWith(`${shortCodePrefix}-`))) {
    return true;
  }

  return targetStrand.aliases.some((alias) => fullText.includes(alias));
}

// Module count for strand badge
function getModuleCount(strandKey) {
  if (strandKey === 'all') {
    return allModules.value.length;
  }
  return allModules.value.filter((m) => matchesStrand(m, strandKey)).length;
}

// Filtered modules list
const filteredModules = computed(() => {
  if (currentStrand.value === 'all') {
    return allModules.value;
  }
  return allModules.value.filter((m) => matchesStrand(m, currentStrand.value));
});

function selectStrand(key) {
  currentStrand.value = key;
}

// Progress status label: Not Started, In Progress, Completed
function getProgressStatusLabel(mod) {
  if (mod.completed || mod.progressStatus === 'COMPLETED' || (mod.progress || 0) >= 100) {
    return 'Completed';
  }
  if ((mod.progress || 0) > 0 || mod.progressStatus === 'IN_PROGRESS') {
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

// Load backend modules
async function loadModules() {
  loading.value = true;
  try {
    const res = await api.get('/modules');
    const data = res.data?.data || res.data || [];
    rawModules.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load backend modules:', err);
    rawModules.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadModules();
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
.strand-filters-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px 1px 6px 1px;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  align-items: flex-start;
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
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.card-module-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
  margin: 0;
  white-space: normal;
  word-break: break-word;
}

.card-module-strand {
  font-size: 0.775rem;
  font-weight: 600;
  color: #475569;
  line-height: 1.25;
}

.card-pills-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.2rem;
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
  .card-module-title {
    font-size: 0.9rem;
  }
  .card-module-strand {
    font-size: 0.75rem;
  }
}
</style>

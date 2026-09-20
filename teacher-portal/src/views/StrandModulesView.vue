<template>
  <div class="page-container">
    <!-- Breadcrumb / Back link -->
    <nav class="breadcrumb">
      <router-link :to="`/clc/${clcSlug}`" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Back to Poblacion CLC</span>
      </router-link>
    </nav>

    <!-- Strand Banner Card (Screen 3 & 5) -->
    <div class="strand-banner-card">
      <div class="strand-banner-left">
        <div class="strand-icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="strand-banner-info">
          <h1 class="strand-banner-title">{{ currentStrand.name }}</h1>
          <span class="strand-tag">Learning Strand</span>
          <p class="strand-desc-text">
            {{ currentStrand.description }}
          </p>
        </div>
      </div>

      <!-- Decorative Books Graphic -->
      <div class="strand-banner-right-art">
        <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <path d="M2 15.5A2.5 2.5 0 0 1 4.5 13H18"/>
          <path d="M4.5 6H18v14H4.5A2.5 2.5 0 0 1 2 17.5v-9A2.5 2.5 0 0 1 4.5 6z"/>
        </svg>
      </div>
    </div>

    <!-- Tabs & Upload Action Row -->
    <div class="tab-row-with-action" style="margin-bottom: 1.25rem;">
      <div class="tab-group-inline">
        <button
          v-for="tab in tabs"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <router-link
        :to="`/clc/${clcSlug}/strand/${strandSlug}/upload`"
        class="btn btn-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>+ Upload Module</span>
      </router-link>
    </div>

    <!-- Tab 1: Modules Table (Screen 3 & 5) -->
    <div v-if="activeTab === 'Modules'" class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Module Title</th>
              <th>Date Uploaded</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mod, idx) in modules" :key="mod.id">
              <td>{{ idx + 1 }}</td>
              <td style="font-weight: 600;">
                <router-link
                  :to="`/clc/${clcSlug}/strand/${strandSlug}/module/${mod.id}`"
                  class="table-module-title-link"
                >
                  {{ mod.title }}
                </router-link>
              </td>
              <td>{{ mod.dateUploaded }}</td>
              <td>
                <span
                  class="badge"
                  :class="mod.status === 'Published' ? 'badge-success' : 'badge-amber-tag'"
                >
                  {{ mod.status }}
                </span>
              </td>
              <td>
                <div class="cell-actions" style="justify-content: flex-end;">
                  <router-link
                    :to="`/clc/${clcSlug}/strand/${strandSlug}/module/${mod.id}`"
                    class="btn-icon"
                    title="View Module"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </router-link>
                  <button class="btn-icon" title="More Options" @click="toggleMenu(mod.id)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="modules.length === 0" class="empty-state-box">
        <div class="empty-state-graphic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <h3>No modules uploaded yet</h3>
        <p>Click "+ Upload Module" to add learning modules for this strand.</p>
      </div>
    </div>

    <!-- Tab 2: Strand Description -->
    <div v-else-if="activeTab === 'Description'" class="card-box">
      <h3 class="card-box-header">Curriculum &amp; Strand Overview</h3>
      <p style="font-size: 0.9rem; color: #334155; line-height: 1.6; margin-bottom: 1rem;">
        {{ currentStrand.description }}
      </p>
      <div class="details-grid-2" style="padding: 0; box-shadow: none; border: none;">
        <div class="detail-item">
          <span class="detail-label">Competencies Covered</span>
          <span class="detail-value">Reading Comprehension, Writing, Active Listening, Oral Discourse</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Target Levels</span>
          <span class="detail-value">Basic Literacy, A&amp;E Elementary, A&amp;E Junior High School</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const clcSlug = route.params.clcId || 'poblacion-clc';
const strandSlug = route.params.strandId || 'communication-skills';

const tabs = ['Modules', 'Description'];
const activeTab = ref('Modules');

const strandInfoMap = {
  'communication-skills': {
    name: 'Communication Skills',
    description: "Develops the learners' ability to read, write, speak, listen, and communicate effectively in English and Filipino.",
  },
  'mathematical-skills': {
    name: 'Mathematical and Problem Solving Skills',
    description: 'Enhances numerical, mathematical, and logical problem-solving abilities applied to real-life situations.',
  },
  'scientific-literacy': {
    name: 'Scientific Literacy and Critical Thinking',
    description: 'Applies scientific thinking and principles to understand natural processes, health, and the environment.',
  },
  'life-career-skills': {
    name: 'Life and Career Skills',
    description: 'Focuses on essential livelihood, employment, entrepreneurship, and productivity skills for adult life.',
  },
  'digital-literacy': {
    name: 'Digital Literacy',
    description: 'Covers digital citizenship, basic computer applications, internet safety, and technology tools.',
  },
  'self-society': {
    name: 'Understanding the Self and the Society',
    description: 'Promotes self-awareness, social responsibility, history, community engagement, and civic duties.',
  },
};

const currentStrand = computed(() => {
  return strandInfoMap[strandSlug] || strandInfoMap['communication-skills'];
});

// Matching Screen 3 & 5 rows exactly
const modules = ref([
  { id: 1, title: 'Communication Skills Module 1', dateUploaded: 'Aug 12, 2026', status: 'Published' },
  { id: 2, title: 'Communication Skills Module 2', dateUploaded: 'Aug 25, 2026', status: 'Published' },
  { id: 3, title: 'Communication Skills Module 3', dateUploaded: 'Sep 5, 2026', status: 'Draft' },
  { id: 4, title: 'Communication Skills Module 4', dateUploaded: 'Sep 13, 2026', status: 'Published' },
]);

function toggleMenu(id) {
  // menu action
}
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.strand-banner-card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-xs);
  position: relative;
  overflow: hidden;
}

.strand-banner-left {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  max-width: 680px;
}

.strand-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.strand-banner-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.strand-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-top: 0.2rem;
  margin-bottom: 0.4rem;
}

.strand-desc-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.strand-banner-right-art {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}

.table-module-title-link {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.table-module-title-link:hover {
  color: var(--color-primary);
}

.badge-amber-tag {
  background: #fef3c7;
  color: #b45309;
}
</style>

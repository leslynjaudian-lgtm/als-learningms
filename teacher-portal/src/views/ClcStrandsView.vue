<template>
  <div class="page-container">
    <!-- Breadcrumb / Back link -->
    <nav class="breadcrumb">
      <router-link to="/clc" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Back to My CLC</span>
      </router-link>
    </nav>

    <!-- Top CLC Header Card (Screen 2) -->
    <div class="clc-banner-header">
      <div class="banner-left">
        <div class="building-icon-badge">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/>
          </svg>
        </div>
        <div>
          <h1 class="clc-main-title">Poblacion CLC</h1>
          <p class="clc-district-subtitle">Naawan District</p>
        </div>
      </div>

      <div class="clc-learners-pill">
        <div class="learners-pill-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="learners-pill-data">
          <span class="learners-num">17</span>
          <span class="learners-lbl">Learners</span>
        </div>
      </div>
    </div>

    <!-- Section Header -->
    <div class="section-title-wrap">
      <h2>Learning Strands</h2>
      <p>Select a learning strand to manage modules.</p>
    </div>

    <!-- 6 Learning Strands Grid (Screen 2) -->
    <div class="strands-grid-3">
      <router-link
        v-for="strand in strands"
        :key="strand.slug"
        :to="`/clc/${clcSlug}/strand/${strand.slug}`"
        class="strand-card"
        :class="`strand-card-${strand.color}`"
      >
        <div class="strand-card-icon-wrap" :class="`icon-wrap-${strand.color}`">
          <span v-html="strand.icon"></span>
        </div>

        <div class="strand-card-body">
          <h3 class="strand-title">{{ strand.name }}</h3>
        </div>

        <div class="strand-chevron" :class="`chevron-${strand.color}`">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const clcSlug = route.params.clcId || 'poblacion-clc';

const strands = ref([
  {
    slug: 'communication-skills',
    name: 'Communication Skills',
    color: 'red',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  },
  {
    slug: 'mathematical-skills',
    name: 'Mathematical and Problem Solving Skills',
    color: 'blue',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>',
  },
  {
    slug: 'scientific-literacy',
    name: 'Scientific Literacy and Critical Thinking',
    color: 'green',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>',
  },
  {
    slug: 'life-career-skills',
    name: 'Life and Career Skills',
    color: 'amber',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  },
  {
    slug: 'digital-literacy',
    name: 'Digital Literacy',
    color: 'purple',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  },
  {
    slug: 'self-society',
    name: 'Understanding the Self and the Society',
    color: 'teal',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  },
]);
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

.clc-banner-header {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-xs);
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.building-icon-badge {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #eff6ff;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.clc-main-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.clc-district-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-top: 0.15rem;
}

.clc-learners-pill {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.6rem 1rem;
}

.learners-pill-icon {
  color: var(--color-primary);
  display: flex;
  align-items: center;
}

.learners-pill-data {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.learners-num {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.learners-lbl {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.section-title-wrap {
  margin-bottom: 1.25rem;
}

.section-title-wrap h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text);
}

.section-title-wrap p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-top: 0.15rem;
}

/* 3-Column Strands Grid matching Screen 2 */
.strands-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.strand-card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.35rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
  cursor: pointer;
  min-height: 90px;
}

.strand-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: #cbd5e1;
}

.strand-card-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-wrap-red { background: #fee2e2; color: #ef4444; }
.icon-wrap-blue { background: #eff6ff; color: #2563eb; }
.icon-wrap-green { background: #dcfce7; color: #16a34a; }
.icon-wrap-amber { background: #fef3c7; color: #d97706; }
.icon-wrap-purple { background: #f3e8ff; color: #9333ea; }
.icon-wrap-teal { background: #ccfbf1; color: #0d9488; }

.strand-card-body {
  flex: 1;
}

.strand-title {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
}

.strand-card-red .strand-title { color: #dc2626; }
.strand-card-blue .strand-title { color: #1d4ed8; }
.strand-card-green .strand-title { color: #15803d; }
.strand-card-amber .strand-title { color: #b45309; }
.strand-card-purple .strand-title { color: #7e22ce; }
.strand-card-teal .strand-title { color: #0f766e; }

.strand-chevron {
  display: flex;
  align-items: center;
  transition: transform var(--transition-fast);
}

.chevron-red { color: #f87171; }
.chevron-blue { color: #60a5fa; }
.chevron-green { color: #4ade80; }
.chevron-amber { color: #fbbf24; }
.chevron-purple { color: #c084fc; }
.chevron-teal { color: #2dd4bf; }

.strand-card:hover .strand-chevron {
  transform: translateX(3px);
}

@media (max-width: 1024px) {
  .strands-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .strands-grid-3 {
    grid-template-columns: 1fr;
  }
}
</style>

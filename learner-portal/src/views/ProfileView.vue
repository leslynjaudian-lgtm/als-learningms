<template>
  <div class="profile-page">
    <!-- Header with Back Link -->
    <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 1.5rem;">
      <button type="button" @click="$router.back()" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: #ffffff; border: 1px solid var(--color-border); color: #0f172a;" aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      </button>
      <h1 class="page-title" style="margin-bottom: 0;">My Profile</h1>
    </div>

    <!-- Avatar Banner Card -->
    <div class="learner-card" style="display: flex; flex-direction: column; align-items: center; padding: 1.75rem 1.25rem; margin-bottom: 1.25rem;">
      <div style="width: 80px; height: 80px; border-radius: 50%; background: #dbeafe; color: #165dfc; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 800; margin-bottom: 0.75rem;">
        {{ initials }}
      </div>
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; line-height: 1.2;">
        {{ user.name || 'Learner' }}
      </h2>
      <div style="font-size: 0.85rem; font-weight: 600; color: #64748b; margin-top: 0.25rem;">
        {{ user.role || 'ALS Learner' }}
      </div>
    </div>

    <!-- Info Field Rows Card -->
    <div class="learner-card" style="padding: 0.5rem 1rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 0; border-bottom: 1px solid #f1f5f9;">
        <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #64748b; font-weight: 600;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Name</span>
        </div>
        <div style="font-size: 0.875rem; font-weight: 700; color: #0f172a;">
          {{ user.name || '—' }}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 0; border-bottom: 1px solid #f1f5f9;">
        <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #64748b; font-weight: 600;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Learning Center</span>
        </div>
        <div style="font-size: 0.875rem; font-weight: 700; color: #0f172a;">
          {{ user.learningCenter || 'Naawan District' }}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 0; border-bottom: 1px solid #f1f5f9;">
        <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #64748b; font-weight: 600;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
            <rect x="9" y="9" width="6" height="6"/>
            <line x1="9" y1="1" x2="9" y2="4"/>
            <line x1="15" y1="1" x2="15" y2="4"/>
          </svg>
          <span>Program</span>
        </div>
        <div style="font-size: 0.875rem; font-weight: 700; color: #0f172a;">
          {{ user.program || '—' }}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 0; border-bottom: 1px solid #f1f5f9;">
        <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #64748b; font-weight: 600;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>Learning Strand</span>
        </div>
        <div style="font-size: 0.875rem; font-weight: 700; color: #0f172a;">
          {{ user.strand || '—' }}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 0;">
        <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #64748b; font-weight: 600;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Status</span>
        </div>
        <span style="font-size: 0.75rem; font-weight: 700; background: #dcfce7; color: #15803d; padding: 0.2rem 0.65rem; border-radius: 20px;">
          {{ user.status || 'Active' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const stored = localStorage.getItem('als_learner_user');
const user = ref(stored ? JSON.parse(stored) : {});

const initials = computed(() => {
  if (!user.value.name) return 'L';
  return user.value.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
});
</script>

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
      <!-- Circular Avatar Container -->
      <div
        style="width: 88px; height: 88px; border-radius: 50%; background: #dbeafe; color: #165dfc; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 800; overflow: hidden; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(22, 93, 252, 0.12); margin-bottom: 0.65rem;"
      >
        <img
          v-if="displayedPhoto"
          :src="displayedPhoto"
          alt="Learner Profile Photo"
          style="width: 100%; height: 100%; object-fit: cover; display: block;"
        />
        <span v-else>{{ initials }}</span>
      </div>

      <!-- Hidden file input using Vue template ref -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        style="display: none;"
        @change="handlePhotoChange"
      />

      <!-- Photo Action Button: Add Photo / Change Photo -->
      <button
        type="button"
        @click="triggerFileInput"
        :disabled="uploading"
        style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.9rem; border-radius: 9999px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; margin-bottom: 0.85rem;"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>{{ uploading ? 'Uploading...' : (hasPhoto ? 'Change Photo' : 'Add Photo') }}</span>
      </button>

      <!-- Feedback message -->
      <div
        v-if="feedbackMessage"
        :style="{
          fontSize: '0.78rem',
          fontWeight: '600',
          marginBottom: '0.65rem',
          color: feedbackType === 'error' ? '#ef4444' : '#15803d',
          textAlign: 'center'
        }"
      >
        {{ feedbackMessage }}
      </div>

      <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; line-height: 1.2; text-align: center;">
        {{ user.name || 'Learner' }}
      </h2>
      <div style="font-size: 0.82rem; font-weight: 700; color: #64748b; margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em;">
        {{ user.role || 'LEARNER' }}
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
          <span>Full Name</span>
        </div>
        <div style="font-size: 0.875rem; font-weight: 700; color: #0f172a;">
          {{ user.name || '—' }}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 0; border-bottom: 1px solid #f1f5f9;">
        <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #64748b; font-weight: 600;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span>LRN</span>
        </div>
        <div style="font-size: 0.875rem; font-weight: 700; color: #0f172a;">
          {{ user.lrn || '—' }}
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
          {{ user.learningCenter || 'None Assigned' }}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 0; border-bottom: 1px solid #f1f5f9;">
        <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #64748b; font-weight: 600;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Assigned Teacher</span>
        </div>
        <div style="font-size: 0.875rem; font-weight: 700; color: #0f172a;">
          {{ user.teacher || 'None Assigned' }}
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
          <span>Program Level</span>
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
import { computed, onMounted, ref } from 'vue';
import api from '../api/axios';

const stored = localStorage.getItem('als_learner_user');
const user = ref(stored ? JSON.parse(stored) : {});

const savedPhoto = ref(user.value.profilePhoto || user.value.user?.profilePhoto || '');
const previewPhoto = ref('');
const fileInputRef = ref(null);
const uploading = ref(false);
const feedbackMessage = ref('');
const feedbackType = ref('success');

const initials = computed(() => {
  if (!user.value.name) return 'L';
  return user.value.name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
});

const hasPhoto = computed(() => {
  return !!(previewPhoto.value || savedPhoto.value);
});

const displayedPhoto = computed(() => {
  if (previewPhoto.value) return previewPhoto.value;
  return savedPhoto.value || '';
});

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

async function handlePhotoChange(event) {
  const file = event.target?.files?.[0];
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    feedbackMessage.value = 'Please select a valid JPG, JPEG, or PNG image.';
    feedbackType.value = 'error';
    if (fileInputRef.value) fileInputRef.value.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    feedbackMessage.value = 'Image size exceeds 5MB limit. Please choose a smaller photo.';
    feedbackType.value = 'error';
    if (fileInputRef.value) fileInputRef.value.value = '';
    return;
  }

  // Immediate preview for instant visual feedback
  const objectUrl = URL.createObjectURL(file);
  previewPhoto.value = objectUrl;
  uploading.value = true;
  feedbackMessage.value = '';

  try {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    const res = await api.put('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const photoUrl =
      res.data?.profilePhoto ||
      res.data?.user?.profilePhoto ||
      res.data?.learner?.profilePhoto ||
      res.data?.profile?.profilePhoto ||
      '';

    if (photoUrl) {
      savedPhoto.value = photoUrl;
      previewPhoto.value = '';
      user.value.profilePhoto = photoUrl;
    } else {
      savedPhoto.value = previewPhoto.value;
      user.value.profilePhoto = previewPhoto.value;
    }

    // Persist to localStorage session
    const currentStored = localStorage.getItem('als_learner_user');
    const parsed = currentStored ? JSON.parse(currentStored) : {};
    const updated = {
      ...parsed,
      ...user.value,
      profilePhoto: savedPhoto.value,
    };
    localStorage.setItem('als_learner_user', JSON.stringify(updated));

    feedbackMessage.value = 'Photo updated successfully!';
    feedbackType.value = 'success';
    setTimeout(() => {
      if (feedbackMessage.value === 'Photo updated successfully!') {
        feedbackMessage.value = '';
      }
    }, 4000);
  } catch (err) {
    console.error('Failed to upload photo:', err);
    previewPhoto.value = '';
    feedbackMessage.value =
      err.response?.data?.error || 'Failed to upload photo. Please try again.';
    feedbackType.value = 'error';
  } finally {
    uploading.value = false;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
}

onMounted(async () => {
  try {
    const res = await api.get('/learners/me');
    if (res.data) {
      const d = res.data.data || res.data;
      const photo = d.profilePhoto || d.user?.profilePhoto || user.value.profilePhoto || '';
      if (photo) {
        savedPhoto.value = photo;
      }
      user.value = {
        ...user.value,
        name: d.fullName || d.user?.fullName || user.value.name,
        lrn: d.lrn || user.value.lrn,
        learningCenter: d.learningCenter?.name || d.learningCenter || user.value.learningCenter,
        teacher: d.teacher?.fullName || d.teacher || d.teacher?.user?.fullName || d.assignedTeacher || user.value.teacher,
        program: d.level || d.programLevel || user.value.program,
        strand: d.learningArea?.name || d.strand || user.value.strand,
        status: d.user?.status || d.status || user.value.status,
        profilePhoto: photo,
      };
      localStorage.setItem('als_learner_user', JSON.stringify(user.value));
    }
  } catch (e) {
    console.error('Failed to load profile:', e);
  }
});
</script>

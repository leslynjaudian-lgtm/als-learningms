<template>
  <div class="page-container settings-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/dashboard">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Settings</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Settings</h1>
        <p>Manage your profile and account settings.</p>
      </div>
    </div>

    <!-- Section Navigation Tabs -->
    <div class="tab-bar-card">
      <div class="tab-group-inline">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeSection === 'profile' }"
          @click="activeSection = 'profile'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: -2px;">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          My Profile
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeSection === 'account' }"
          @click="activeSection = 'account'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: -2px;">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Account Settings
        </button>
      </div>
    </div>

    <!-- Feedback message -->
    <div v-if="feedbackMessage" class="feedback-banner" :class="feedbackType">
      {{ feedbackMessage }}
    </div>

    <!-- Section 1: My Profile -->
    <div v-show="activeSection === 'profile'" class="settings-section">
      <div class="profile-grid-2">
        <!-- Left: Avatar Card -->
        <div class="profile-avatar-card">
          <div class="big-avatar-circle" :class="{ 'has-photo': !!displayedPhoto }">
            <img
              v-if="displayedPhoto"
              :src="displayedPhoto"
              alt="Teacher Profile Photo"
              class="big-avatar-photo"
            />
            <svg
              v-else
              width="68"
              height="68"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
            style="display: none;"
            @change="onPhotoSelected"
          />

          <div class="avatar-btn-stack">
            <button
              type="button"
              class="btn btn-primary"
              style="font-size: 0.825rem; padding: 0.45rem 1rem;"
              @click="triggerPhotoUpload"
            >
              {{ displayedPhoto ? 'Change Photo' : 'Upload Photo' }}
            </button>
            <button
              v-if="displayedPhoto"
              type="button"
              class="btn-remove-photo"
              @click="removePhoto"
            >
              Remove Photo
            </button>
          </div>
          <p class="avatar-file-hint">JPG, PNG or GIF. Max size 2MB.</p>
        </div>

        <!-- Right: Info & Edit Form Card -->
        <div class="form-card" style="max-width: none;">
          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label class="form-label">Name <span class="required">*</span></label>
              <input v-model="profile.name" type="text" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">Role</label>
              <input v-model="profile.role" type="text" class="form-input" readonly style="background: #f8fafc; color: var(--color-text-secondary);" />
            </div>

            <div class="form-group">
              <label class="form-label">Assigned Learning Center(s)</label>
              <input :value="assignedCenterDisplay" type="text" class="form-input" readonly style="background: #f8fafc; color: var(--color-text-secondary);" />
            </div>

            <div class="form-group">
              <label class="form-label">Assigned Program Level</label>
              <input :value="assignedProgramLevel" type="text" class="form-input" readonly style="background: #f8fafc; color: var(--color-text-secondary);" />
            </div>

            <div class="form-group">
              <label class="form-label">Email <span class="required">*</span></label>
              <input v-model="profile.email" type="email" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <input v-model="profile.contact" type="text" class="form-input" />
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary" :disabled="savingProfile">
                {{ savingProfile ? 'Saving...' : 'Update Profile' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Section 2: Account Settings -->
    <div v-show="activeSection === 'account'" class="settings-section">
      <div class="settings-card" style="max-width: 640px;">
        <div class="card-header-clean">
          <h2 class="card-title">Account Settings</h2>
          <p class="card-subtitle">Keep your account secure by updating your credentials.</p>
        </div>

        <div class="subsection-divider">
          <h3 class="subsection-title">Change Password</h3>
          <p class="subsection-desc">Ensure your new password contains at least 6 characters.</p>
        </div>

        <form @submit.prevent="updatePassword">
          <!-- Current Password -->
          <div class="form-group">
            <label class="form-label">Current Password <span class="required">*</span></label>
            <div class="password-input-wrap">
              <input
                v-model="passwordForm.currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                class="password-toggle-btn"
                @click="showCurrentPassword = !showCurrentPassword"
                :title="showCurrentPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="!showCurrentPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- New Password -->
          <div class="form-group">
            <label class="form-label">New Password <span class="required">*</span></label>
            <div class="password-input-wrap">
              <input
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                class="password-toggle-btn"
                @click="showNewPassword = !showNewPassword"
                :title="showNewPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="!showNewPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirm New Password -->
          <div class="form-group">
            <label class="form-label">Confirm New Password <span class="required">*</span></label>
            <div class="password-input-wrap">
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                class="password-toggle-btn"
                @click="showConfirmPassword = !showConfirmPassword"
                :title="showConfirmPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="!showConfirmPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-actions-row" style="margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" :disabled="savingPassword">
              <svg v-if="savingPassword" class="spinner-inline" viewBox="0 0 24 24"></svg>
              <span>{{ savingPassword ? 'Updating...' : 'Update Password' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue';
import api from '../api/axios.js';
import { useTeacherSession } from '../composables/useTeacherSession.js';

const {
  currentTeacher,
  teacherName,
  teacherPosition,
  teacherPhoto,
  assignedCenters,
  assignedProgramLevel,
  updateTeacherProfile,
  refreshProfile,
} = useTeacherSession();

const activeSection = ref('profile');

const fileInputRef = ref(null);
const savingProfile = ref(false);
const feedbackMessage = ref('');
const feedbackType = ref('success');

function showFeedback(msg, type = 'success') {
  feedbackMessage.value = msg;
  feedbackType.value = type;
  setTimeout(() => {
    feedbackMessage.value = '';
  }, 3500);
}

// --- Account Settings (Change Password) State ---
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const savingPassword = ref(false);

async function updatePassword() {
  if (!passwordForm.currentPassword) {
    showFeedback('Please enter your current password.', 'error');
    return;
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    showFeedback('New password must be at least 6 characters long.', 'error');
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showFeedback('New passwords do not match. Please re-check.', 'error');
    return;
  }

  savingPassword.value = true;
  try {
    await api.post('/auth/change-password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    });
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    showFeedback('Password updated successfully.');
  } catch (err) {
    showFeedback(
      err.response?.data?.error || 'Unable to update password. Please check your current password.',
      'error'
    );
  } finally {
    savingPassword.value = false;
  }
}

const profile = reactive({
  name: '',
  role: '',
  email: '',
  contact: '',
  username: '',
});

const savedProfilePhoto = ref(teacherPhoto.value || '');
const selectedPhoto = ref(null);
const previewPhoto = ref('');
const photoRemoved = ref(false);

const displayedPhoto = computed(() => {
  if (previewPhoto.value) return previewPhoto.value;
  if (photoRemoved.value) return '';
  return savedProfilePhoto.value;
});

const assignedCenterDisplay = computed(() => {
  if (assignedCenters.value && assignedCenters.value.length > 0) {
    return assignedCenters.value.map((c) => c.name).join(', ');
  }
  return currentTeacher.value?.learningCenter || '—';
});

function syncProfile() {
  if (currentTeacher.value) {
    profile.name = currentTeacher.value.fullName || currentTeacher.value.name || '';
    profile.role = currentTeacher.value.position || 'ALS Teacher';
    profile.email = currentTeacher.value.email || '';
    profile.contact = currentTeacher.value.contactNumber || currentTeacher.value.contactNo || '';
    profile.username = currentTeacher.value.username || '';
    savedProfilePhoto.value = teacherPhoto.value || '';
  }
}

watch([currentTeacher, teacherPhoto], () => {
  if (!savingProfile.value) {
    syncProfile();
  }
});

function triggerPhotoUpload() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function onPhotoSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  // 1. Validate file type (JPG, PNG, GIF)
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const validExtensions = /\.(jpg|jpeg|png|gif)$/i;
  if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
    showFeedback('Please upload a JPG, PNG, or GIF image.', 'error');
    if (fileInputRef.value) fileInputRef.value.value = '';
    return;
  }

  // 2. Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showFeedback('Profile photo must be 2MB or smaller.', 'error');
    if (fileInputRef.value) fileInputRef.value.value = '';
    return;
  }

  // 3. Set local preview ONLY — do NOT update global auth state, header, or backend
  selectedPhoto.value = file;
  photoRemoved.value = false;
  previewPhoto.value = URL.createObjectURL(file);
  showFeedback('Photo selected. Click Update Profile to save changes.');
}

function removePhoto() {
  selectedPhoto.value = null;
  previewPhoto.value = '';
  photoRemoved.value = true;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  showFeedback('Photo removed. Click Update Profile to save changes.');
}

async function updateProfile() {
  if (!profile.name.trim() || !profile.email.trim()) {
    showFeedback('Full Name and Email are required.', 'error');
    return;
  }

  savingProfile.value = true;
  try {
    let res;
    if (selectedPhoto.value) {
      // Use multipart/form-data for file upload
      const formData = new FormData();
      formData.append('fullName', profile.name.trim());
      formData.append('email', profile.email.trim());
      formData.append('contactNo', (profile.contact || '').trim());
      formData.append('profilePhoto', selectedPhoto.value);

      res = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      const payload = {
        fullName: profile.name.trim(),
        email: profile.email.trim(),
        contactNo: (profile.contact || '').trim(),
      };
      if (photoRemoved.value) {
        payload.removePhoto = true;
        payload.profilePhoto = '';
      }
      res = await api.put('/auth/profile', payload);
    }

    if (res.data?.user || res.data?.teacher) {
      const updatedTeacher = res.data.teacher || res.data.user;
      savedProfilePhoto.value = updatedTeacher.profilePhoto || res.data.user?.profilePhoto || '';
      selectedPhoto.value = null;
      previewPhoto.value = '';
      photoRemoved.value = false;
      updateTeacherProfile(updatedTeacher);
    }
    showFeedback('Teacher profile updated successfully.');
  } catch (err) {
    console.error('Update profile error:', err);
    showFeedback(
      err.response?.data?.error || 'Unable to update profile photo. Please try again.',
      'error'
    );
  } finally {
    savingProfile.value = false;
  }
}

onMounted(() => {
  syncProfile();
  refreshProfile();
});
</script>

<style scoped>
.big-avatar-circle {
  position: relative;
  overflow: hidden;
}

.big-avatar-circle.has-photo {
  background: transparent;
}

.big-avatar-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.avatar-btn-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.btn-remove-photo {
  font-size: 0.8rem;
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  text-decoration: underline;
  padding: 0.2rem 0.5rem;
}

.btn-remove-photo:hover {
  color: #dc2626;
}

.avatar-file-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.75rem;
  text-align: center;
}

.feedback-banner {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.feedback-banner.success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.feedback-banner.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

/* Tab Bar Navigation (matching Admin Settings) */
.tab-bar-card {
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--color-border, #e2e8f0);
  margin-bottom: 1.5rem;
  overflow: visible;
  background: transparent;
  padding: 0;
  border-radius: 0;
  border-top: none;
  border-left: none;
  border-right: none;
}

.tab-group-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: visible;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.65rem 1.15rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary, #64748b);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  border-radius: 0;
}

.tab-btn:hover {
  color: var(--color-primary, #1e40af);
}

.tab-btn.active {
  color: var(--color-primary, #1e40af);
  font-weight: 600;
  border-bottom-color: var(--color-primary, #1e40af);
}

.settings-section {
  animation: fadeInSection 0.2s ease-out;
}

@keyframes fadeInSection {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Settings Card & Account Settings */
.settings-card {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-xl, 12px);
  padding: 1.75rem 2rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.card-header-clean {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light, #f1f5f9);
}

.card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
}

.card-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-secondary, #64748b);
  margin-top: 0.25rem;
}

.subsection-divider {
  margin: 0.5rem 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px dashed var(--color-border-light, #f1f5f9);
}

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
}

.subsection-desc {
  font-size: 0.825rem;
  color: var(--color-text-muted, #94a3b8);
  margin-top: 0.15rem;
}

/* Password Inputs */
.password-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrap .form-input {
  padding-right: 2.5rem;
}

.password-toggle-btn {
  position: absolute;
  right: 0.65rem;
  background: none;
  border: none;
  color: var(--color-text-muted, #94a3b8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
}

.password-toggle-btn:hover {
  color: var(--color-text, #0f172a);
}

.spinner-inline {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  margin-right: 0.35rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

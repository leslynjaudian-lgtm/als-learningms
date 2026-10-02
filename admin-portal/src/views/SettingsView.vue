<template>
  <div class="page-container settings-page">
    <!-- Toast notifications -->
    <div class="toast-container" v-if="toasts.length > 0">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="[`toast-${toast.type}`, { 'toast-exit': toast.exiting }]"
      >
        {{ toast.message }}
      </div>
    </div>

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

    <!-- Section 1: My Profile -->
    <div v-show="activeSection === 'profile'" class="settings-section">
      <div class="profile-layout-grid">
        <!-- Left: Profile Photo Card -->
        <div class="profile-avatar-card">
          <div class="avatar-preview-wrap">
            <img
              v-if="displayedPhoto"
              :src="displayedPhoto"
              alt="Admin Profile Photo"
              class="avatar-photo-img"
            />
            <div v-else class="big-avatar-circle">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>

          <h3 class="avatar-name">{{ profile.name }}</h3>
          <span class="avatar-role-badge">{{ profile.role }}</span>

          <div class="avatar-actions">
            <input
              ref="fileInputRef"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
              style="display: none;"
              @change="onPhotoSelected"
            />
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              @click="triggerPhotoUpload"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>{{ displayedPhoto ? 'Change Photo' : 'Upload Photo' }}</span>
            </button>
            <button
              v-if="displayedPhoto"
              type="button"
              class="btn-text-danger"
              @click="removePhoto"
            >
              Remove
            </button>
          </div>
          <p class="avatar-help-text">JPG, PNG or GIF. Max size 2MB.</p>
        </div>

        <!-- Right: Profile Details Form -->
        <div class="settings-card">
          <div class="card-header-clean">
            <h2 class="card-title">My Profile</h2>
            <p class="card-subtitle">Personal details and official contact information.</p>
          </div>

          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label class="form-label">Full Name <span class="required">*</span></label>
              <input
                v-model="profile.name"
                type="text"
                class="form-input"
                placeholder="Admin"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Role</label>
              <input
                v-model="profile.role"
                type="text"
                class="form-input input-readonly"
                readonly
              />
              <span class="field-hint">Role assignment is governed by system administrative policies.</span>
            </div>

            <div class="form-group">
              <label class="form-label">Email <span class="required">*</span></label>
              <input
                v-model="profile.email"
                type="email"
                class="form-input"
                placeholder="admin@email.com"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Contact Number <span class="optional-tag">(Optional)</span></label>
              <input
                v-model="profile.contact"
                type="text"
                class="form-input"
                placeholder="e.g. 0912 345 6789"
              />
            </div>

            <div class="form-actions-row">
              <button type="submit" class="btn btn-primary" :disabled="savingProfile">
                <svg v-if="savingProfile" class="spinner-inline" viewBox="0 0 24 24"></svg>
                <span>{{ savingProfile ? 'Saving...' : 'Update Profile' }}</span>
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-actions-row">
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
import { ref, reactive, computed, watch, onMounted } from 'vue';
import api from '../api/axios.js';
import { useAdminSession } from '../composables/useAdminSession.js';

const activeSection = ref('profile');

// --- Toast Feedback ---
const toasts = ref([]);
function showToast(message, type = 'success') {
  const id = Date.now() + Math.random();
  const toastObj = { id, message, type, exiting: false };
  toasts.value.push(toastObj);
  setTimeout(() => {
    toastObj.exiting = true;
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 250);
  }, 3200);
}

// --- My Profile State ---

const {
  currentAdmin,
  adminPhoto,
  adminName,
  adminRole,
  updateAdminProfile,
  refreshAdminProfile,
} = useAdminSession();

const profile = reactive({
  name: 'Admin',
  role: 'ALS Coordinator',
  email: 'admin@email.com',
  contact: '',
});

const savedProfilePhoto = ref(adminPhoto.value || '');
const selectedPhoto = ref(null);
const previewPhoto = ref('');
const photoRemoved = ref(false);

const displayedPhoto = computed(() => {
  if (previewPhoto.value) return previewPhoto.value;
  if (photoRemoved.value) return '';
  return savedProfilePhoto.value;
});

const savingProfile = ref(false);
const fileInputRef = ref(null);

function loadProfile() {
  profile.name = adminName.value;
  profile.role = adminRole.value;
  profile.email = currentAdmin.value?.email || currentAdmin.value?.profile?.email || 'admin@email.com';
  profile.contact = currentAdmin.value?.contactNo || currentAdmin.value?.profile?.contactNo || '';
  savedProfilePhoto.value = adminPhoto.value || '';
}

watch([currentAdmin, adminPhoto, adminName, adminRole], () => {
  if (!savingProfile.value) {
    loadProfile();
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

  // 1. Validate file type (JPG, JPEG, PNG, GIF)
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const validExtensions = /\.(jpg|jpeg|png|gif)$/i;
  if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
    showToast('Please upload a JPG, PNG, or GIF image.', 'error');
    if (fileInputRef.value) fileInputRef.value.value = '';
    return;
  }

  // 2. Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showToast('Profile photo must be 2MB or smaller.', 'error');
    if (fileInputRef.value) fileInputRef.value.value = '';
    return;
  }

  // 3. Set local preview ONLY — do NOT update global auth state, header, or backend
  selectedPhoto.value = file;
  photoRemoved.value = false;
  previewPhoto.value = URL.createObjectURL(file);
  showToast('Photo selected. Click Update Profile to save changes.');
}

function removePhoto() {
  selectedPhoto.value = null;
  previewPhoto.value = '';
  photoRemoved.value = true;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  showToast('Photo removed. Click Update Profile to save changes.');
}

async function updateProfile() {
  if (!profile.name.trim() || !profile.email.trim()) {
    showToast('Full Name and Email are required.', 'error');
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
      formData.append('contactNo', profile.contact.trim());
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
        contactNo: profile.contact.trim(),
      };
      if (photoRemoved.value) {
        payload.removePhoto = true;
        payload.profilePhoto = '';
      }
      res = await api.put('/auth/profile', payload);
    }

    if (res.data?.user) {
      savedProfilePhoto.value = res.data.user.profilePhoto || res.data.user.profile?.profilePhoto || '';
      selectedPhoto.value = null;
      previewPhoto.value = '';
      photoRemoved.value = false;
      updateAdminProfile(res.data.user);
    }
    showToast('Profile updated successfully.');
  } catch (err) {
    console.error('Update profile error:', err);
    showToast(
      err.response?.data?.error || 'Unable to update profile photo. Please try again.',
      'error'
    );
  } finally {
    savingProfile.value = false;
  }
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
    showToast('Please enter your current password.', 'error');
    return;
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    showToast('New password must be at least 6 characters long.', 'error');
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showToast('New passwords do not match. Please re-check.', 'error');
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
    showToast('Password updated successfully.');
  } catch (err) {
    showToast(
      err.response?.data?.error || 'Unable to update password. Please check your current password.',
      'error'
    );
  } finally {
    savingPassword.value = false;
  }
}

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
/* Tab Bar Navigation */
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
  background: none;
}

.tab-btn.active {
  color: var(--color-primary, #1e40af);
  font-weight: 600;
  border-bottom-color: var(--color-primary, #1e40af);
  background: none;
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

.profile-layout-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.75rem;
  align-items: start;
}

@media (max-width: 860px) {
  .profile-layout-grid {
    grid-template-columns: 1fr;
  }
}

/* Avatar Card */
.profile-avatar-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: var(--shadow-xs);
}

.avatar-preview-wrap {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1.15rem;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
}

.avatar-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.big-avatar-circle {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  color: #ffffff;
}

.avatar-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.avatar-role-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-50, #eff6ff);
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-full);
  margin-bottom: 1.25rem;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.btn-sm {
  padding: 0.45rem 1rem;
  font-size: 0.825rem;
}

.btn-text-danger {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
}

.btn-text-danger:hover {
  text-decoration: underline;
}

.avatar-help-text {
  font-size: 0.725rem;
  color: var(--color-text-muted);
  margin-top: 0.85rem;
}

/* Settings Form Card */
.settings-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.75rem 2rem;
  box-shadow: var(--shadow-xs);
}

.card-header-clean {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text);
}

.card-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.subsection-divider {
  margin: 0.5rem 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px dashed var(--color-border-light);
}

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.subsection-desc {
  font-size: 0.825rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}

.input-readonly {
  background: #f8fafc !important;
  color: var(--color-text-secondary) !important;
  cursor: not-allowed;
}

.field-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.35rem;
}

.optional-tag {
  font-weight: 400;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

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
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
}

.password-toggle-btn:hover {
  color: var(--color-text);
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

/* Toast styling */
.toast-container {
  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  z-index: 2500;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  animation: toastSlideIn 0.25s ease-out;
  pointer-events: auto;
}

.toast-success {
  background: #065f46;
  color: #ffffff;
}

.toast-error {
  background: #dc2626;
  color: #ffffff;
}

.toast-exit {
  animation: toastSlideOut 0.25s ease-in forwards;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toastSlideOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}
</style>

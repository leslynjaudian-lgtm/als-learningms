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

    <!-- Standardized Page Header -->
    <PageHeader
      title="Settings"
      description="Manage your profile and account settings."
      :breadcrumbs="[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Settings' },
      ]"
    />

    <!-- Section Navigation Tabs -->
    <div class="tab-bar-card">
      <div class="tab-group-inline">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeSection === 'profile' }"
          @click="switchSection('profile')"
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
          @click="switchSection('account')"
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
              <LockedFieldTooltip message="This field cannot be edited.">
                <input
                  :value="profile.role"
                  type="text"
                  class="form-input input-readonly"
                  readonly
                  title="This field cannot be edited."
                />
              </LockedFieldTooltip>
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
      <div class="settings-card account-settings-card">
        <div class="card-header-clean">
          <h2 class="card-title">Account Settings</h2>
          <p class="card-subtitle">Keep your account secure by updating your credentials.</p>
        </div>

        <div class="subsection-divider">
          <h3 class="subsection-title">Change Password</h3>
        </div>

        <div v-if="passwordSuccessMessage" class="password-alert password-alert-success" role="status">
          {{ passwordSuccessMessage }}
        </div>
        <div v-if="passwordErrors.general" class="password-alert password-alert-error" role="alert">
          {{ passwordErrors.general }}
        </div>

        <form class="account-password-form" novalidate @submit.prevent="updatePassword">
          <!-- Current Password -->
          <PasswordInputField
            ref="currentPwdRef"
            v-model="passwordForm.currentPassword"
            input-id="admin-current-password"
            label="Current Password"
            placeholder="Enter current password"
            autocomplete="current-password"
            :required="true"
            :error="displayedCurrentPasswordError"
            :reset-key="activeSection"
            @input="onCurrentPasswordInput"
            @blur="passwordTouched.currentPassword = true"
          />

          <!-- New Password -->
          <PasswordInputField
            ref="newPwdRef"
            v-model="passwordForm.newPassword"
            input-id="admin-new-password"
            label="New Password"
            placeholder="Enter new password"
            autocomplete="new-password"
            :maxlength="128"
            :required="true"
            helper-text="Use at least 12 characters for a stronger password."
            :error="displayedNewPasswordError"
            :is-valid="isNewPasswordValid"
            :reset-key="activeSection"
            @input="onNewPasswordInput"
            @blur="passwordTouched.newPassword = true"
          />

          <!-- Confirm New Password -->
          <PasswordInputField
            ref="confirmPwdRef"
            v-model="passwordForm.confirmPassword"
            input-id="admin-confirm-password"
            label="Confirm New Password"
            placeholder="Confirm new password"
            autocomplete="new-password"
            :maxlength="128"
            :required="true"
            :error="displayedConfirmPasswordError"
            :is-valid="isConfirmPasswordValid"
            :reset-key="activeSection"
            @input="onConfirmPasswordInput"
            @blur="passwordTouched.confirmPassword = true"
          />

          <div class="form-actions-row">
            <button type="submit" class="btn btn-primary btn-update-password" :disabled="savingPassword">
              <span v-if="savingPassword" class="spinner-inline" aria-hidden="true"></span>
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
import PageHeader from '../components/PageHeader.vue';
import api from '../api/axios.js';
import { useAdminSession } from '../composables/useAdminSession.js';
import PasswordInputField from '../components/PasswordInputField.vue';
import LockedFieldTooltip from '../components/LockedFieldTooltip.vue';

const activeSection = ref('profile');

function resetAllPasswordVisibility() {
  currentPwdRef.value?.resetVisibility();
  newPwdRef.value?.resetVisibility();
  confirmPwdRef.value?.resetVisibility();
}

function switchSection(section) {
  resetAllPasswordVisibility();
  activeSection.value = section;
  if (typeof window !== 'undefined' && window.scrollY > 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

watch(activeSection, () => {
  resetAllPasswordVisibility();
});

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
const currentPwdRef = ref(null);
const newPwdRef = ref(null);
const confirmPwdRef = ref(null);

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const passwordTouched = reactive({
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
});

const passwordErrors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  general: '',
});

const passwordSuccessMessage = ref('');
const savingPassword = ref(false);

const COMMON_WEAK_PASSWORDS = new Set([
  '123456789012',
  '1234567890123',
  '12345678901234',
  'password1234',
  'password12345',
  'password123456',
  'qwerty123456',
  'qwertyuiop12',
  'admin1234567',
  'admin12345678',
  'welcome12345',
  'letmein12345',
  'iloveyou1234',
  'changeme1234',
  'alspassword1',
  'naawandistrict',
]);

function isCommonOrTrivialPassword(pwd) {
  const lower = pwd.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lower)) return true;
  if (/^(.)\1+$/.test(pwd)) return true;
  if ('01234567890123456789'.includes(pwd) || '98765432109876543210'.includes(pwd)) return true;
  return false;
}

const liveNewPasswordError = computed(() => {
  const pwd = passwordForm.newPassword;
  if (!pwd) {
    return passwordTouched.newPassword ? 'Please enter a new password.' : '';
  }
  if (pwd.length < 12) {
    return 'New password must be at least 12 characters long.';
  }
  if (pwd.length > 128) {
    return 'New password must not exceed 128 characters.';
  }
  if (isCommonOrTrivialPassword(pwd)) {
    return 'This password is too common or easily guessed. Please use a stronger password or passphrase.';
  }
  return '';
});

const liveConfirmPasswordError = computed(() => {
  const confirm = passwordForm.confirmPassword;
  if (!confirm) {
    return passwordTouched.confirmPassword ? 'Please confirm your new password.' : '';
  }
  if (passwordForm.newPassword !== confirm) {
    return 'Passwords do not match.';
  }
  return '';
});

const displayedCurrentPasswordError = computed(() => {
  if (passwordErrors.currentPassword) return passwordErrors.currentPassword;
  if (passwordTouched.currentPassword && !passwordForm.currentPassword) {
    return 'Please enter your current password.';
  }
  return '';
});

const displayedNewPasswordError = computed(() => {
  return passwordErrors.newPassword || liveNewPasswordError.value;
});

const displayedConfirmPasswordError = computed(() => {
  return passwordErrors.confirmPassword || liveConfirmPasswordError.value;
});

const isNewPasswordValid = computed(() => {
  return (
    passwordForm.newPassword.length >= 12 &&
    !displayedNewPasswordError.value
  );
});

const isConfirmPasswordValid = computed(() => {
  return (
    passwordForm.confirmPassword.length > 0 &&
    passwordForm.confirmPassword === passwordForm.newPassword &&
    isNewPasswordValid.value &&
    !displayedConfirmPasswordError.value
  );
});

function onCurrentPasswordInput() {
  passwordErrors.currentPassword = '';
  passwordErrors.general = '';
  passwordSuccessMessage.value = '';
}

function onNewPasswordInput() {
  passwordErrors.newPassword = '';
  passwordErrors.general = '';
  passwordSuccessMessage.value = '';
}

function onConfirmPasswordInput() {
  passwordErrors.confirmPassword = '';
  passwordErrors.general = '';
  passwordSuccessMessage.value = '';
}

function resetPasswordErrors() {
  passwordErrors.currentPassword = '';
  passwordErrors.newPassword = '';
  passwordErrors.confirmPassword = '';
  passwordErrors.general = '';
  passwordTouched.currentPassword = false;
  passwordTouched.newPassword = false;
  passwordTouched.confirmPassword = false;
}

async function updatePassword() {
  if (savingPassword.value) return;

  passwordErrors.currentPassword = '';
  passwordErrors.newPassword = '';
  passwordErrors.confirmPassword = '';
  passwordErrors.general = '';
  passwordSuccessMessage.value = '';

  passwordTouched.currentPassword = true;
  passwordTouched.newPassword = true;
  passwordTouched.confirmPassword = true;

  let hasValidationError = false;

  if (!passwordForm.currentPassword) {
    passwordErrors.currentPassword = 'Please enter your current password.';
    hasValidationError = true;
  }

  if (!passwordForm.newPassword) {
    passwordErrors.newPassword = 'Please enter a new password.';
    hasValidationError = true;
  } else if (passwordForm.newPassword.length < 12) {
    passwordErrors.newPassword = 'New password must be at least 12 characters long.';
    hasValidationError = true;
  } else if (passwordForm.newPassword.length > 128) {
    passwordErrors.newPassword = 'New password must not exceed 128 characters.';
    hasValidationError = true;
  } else if (
    passwordForm.currentPassword &&
    passwordForm.newPassword === passwordForm.currentPassword
  ) {
    passwordErrors.newPassword = 'New password cannot be the same as your current password.';
    hasValidationError = true;
  } else if (isCommonOrTrivialPassword(passwordForm.newPassword)) {
    passwordErrors.newPassword =
      'This password is too common or easily guessed. Please use a stronger password or passphrase.';
    hasValidationError = true;
  }

  if (!passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = 'Please confirm your new password.';
    hasValidationError = true;
  } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = 'Passwords do not match.';
    hasValidationError = true;
  }

  if (hasValidationError) {
    if (passwordErrors.currentPassword) {
      currentPwdRef.value?.focus();
    } else if (passwordErrors.newPassword) {
      newPwdRef.value?.focus();
    } else if (passwordErrors.confirmPassword) {
      confirmPwdRef.value?.focus();
    }
    const firstMsg =
      passwordErrors.currentPassword ||
      passwordErrors.newPassword ||
      passwordErrors.confirmPassword;
    if (firstMsg) showToast(firstMsg, 'error');
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
    resetAllPasswordVisibility();
    resetPasswordErrors();

    passwordSuccessMessage.value = 'Password updated successfully.';
    showToast('Password updated successfully.');
  } catch (err) {
    const backendError =
      err.response?.data?.error ||
      'Unable to update password due to a network or server error. Please try again.';
    const backendField = err.response?.data?.field;

    if (backendField === 'currentPassword' || /current password/i.test(backendError)) {
      passwordErrors.currentPassword = backendError;
      currentPwdRef.value?.focus();
    } else if (backendField === 'newPassword') {
      passwordErrors.newPassword = backendError;
      newPwdRef.value?.focus();
    } else if (backendField === 'confirmPassword' || /match/i.test(backendError)) {
      passwordErrors.confirmPassword = backendError;
      confirmPwdRef.value?.focus();
    } else {
      passwordErrors.general = backendError;
    }

    showToast(backendError, 'error');
  } finally {
    savingPassword.value = false;
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  resetAllPasswordVisibility();
  loadProfile();
});
</script>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 100%;
  position: relative;
  z-index: 1;
  scroll-margin-top: calc(var(--header-height, 64px) + 1rem);
}

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

.account-settings-card {
  max-width: 640px;
  width: 100%;
}

.password-alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 1.25rem;
}

.password-alert-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.password-alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.form-actions-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border-light, #f1f5f9);
}

.btn-update-password {
  min-height: 40px;
  padding: 0.6rem 1.35rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: var(--radius-md, 8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

.btn-update-password:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .settings-card {
    padding: 1.25rem 1.15rem;
  }

  .form-actions-row {
    justify-content: stretch;
  }

  .btn-update-password {
    width: 100%;
  }
}

.spinner-inline {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  flex-shrink: 0;
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

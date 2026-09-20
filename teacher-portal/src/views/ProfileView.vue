<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Profile</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>My Profile</h1>
        <p>View and update your account information.</p>
      </div>
    </div>

    <!-- Profile 2-Column Grid -->
    <div class="profile-grid-2">
      <!-- Left: Avatar Card -->
      <div class="profile-avatar-card">
        <div class="big-avatar-circle">
          <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <button class="btn btn-primary" style="font-size: 0.825rem; padding: 0.45rem 1rem;" @click="changePhoto">
          Change Photo
        </button>
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
            <label class="form-label">Email <span class="required">*</span></label>
            <input v-model="profile.email" type="email" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Contact Number</label>
            <input v-model="profile.contact" type="text" class="form-input" />
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary">
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const profile = reactive({
  name: 'Juan Dela Cruz',
  role: 'ALS Teacher',
  email: 'juan.delacruz@naawan-als.gov.ph',
  contact: '0912 345 6789',
});

function changePhoto() {
  alert('Photo upload dialog placeholder');
}

function updateProfile() {
  alert('Teacher profile updated successfully.');
}
</script>

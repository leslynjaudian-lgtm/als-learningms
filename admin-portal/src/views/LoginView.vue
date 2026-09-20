<template>
  <div class="login-container">
    <!-- Left Hero Brand Panel -->
    <div class="login-hero">
      <div class="login-hero-dots"></div>
      <div class="login-hero-wave"></div>

      <!-- Center Branding & Quote -->
      <div class="login-hero-content">
        <img src="/logo.png" alt="ALS Naawan District Logo" class="login-seal-img" />
        <h1 class="login-hero-title">ALS LMS</h1>
        <h2 class="login-hero-district">Naawan District</h2>
        <div class="login-hero-divider"></div>

        <p class="login-hero-quote">
          “Lifelong Learning for a Brighter<br />Tomorrow.”
        </p>
      </div>
    </div>

    <!-- Right Login Form Area -->
    <div class="login-form-area">
      <div class="login-card">
        <form @submit.prevent="handleLogin" class="admin-login-form">
          <!-- Admin ID / Username Input -->
          <div class="form-group-item">
            <label class="field-label-text">Admin ID / Username</label>
            <div class="input-icon-group">
              <span class="input-icon-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                v-model="form.username"
                type="text"
                class="input-with-icon"
                placeholder="Enter your admin ID"
                required
                autocomplete="username"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="form-group-item">
            <label class="field-label-text">Password</label>
            <div class="input-icon-group">
              <span class="input-icon-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="input-with-icon"
                placeholder="Enter your password"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                class="input-icon-right"
                @click="showPassword = !showPassword"
                title="Toggle password visibility"
                aria-label="Toggle password visibility"
              >
                <svg v-if="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Primary Submit Button -->
          <button type="submit" class="btn-login" :disabled="submitting">
            <span>{{ submitting ? 'Signing In…' : 'Sign In' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showPassword = ref(false);
const submitting = ref(false);

const form = reactive({
  username: '',
  password: '',
});

async function handleLogin() {
  submitting.value = true;
  try {
    localStorage.setItem('als_admin_authenticated', 'true');
    localStorage.setItem('als_admin_user', JSON.stringify({
      username: form.username || 'admin',
      name: 'Admin User',
      role: 'ALS Coordinator',
    }));
    // Navigate to admin dashboard
    router.push('/');
  } finally {
    submitting.value = false;
  }
}
</script>

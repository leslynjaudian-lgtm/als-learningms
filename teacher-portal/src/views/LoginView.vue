<template>
  <div class="teacher-login-page">
    <!-- Background Layered Concentric Circle Arcs -->
    <div class="login-bg-circles" aria-hidden="true">
      <!-- Left side concentric rings -->
      <div class="circle-layer circle-left-1"></div>
      <div class="circle-layer circle-left-2"></div>
      <div class="circle-layer circle-left-3"></div>

      <!-- Right side concentric rings -->
      <div class="circle-layer circle-right-1"></div>
      <div class="circle-layer circle-right-2"></div>
      <div class="circle-layer circle-right-3"></div>
    </div>

    <!-- Centered Compact Login Card -->
    <div class="teacher-login-card-box">
      <!-- Seal Logo -->
      <div class="login-seal-wrap">
        <img src="/logo.png" alt="ALS Official Seal" class="login-seal-img" />
      </div>

      <!-- Login Title -->
      <h1 class="login-heading">Teacher Login</h1>

      <!-- Login Form -->
      <form class="login-form-content" @submit.prevent="handleLogin">
        <!-- Teacher ID -->
        <div class="form-group-item">
          <label for="teacherId" class="field-label">Teacher ID</label>
          <div class="field-wrapper">
            <span class="field-icon-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              id="teacherId"
              v-model="form.teacherId"
              type="text"
              class="field-input"
              placeholder="Enter your Teacher ID"
              required
              autocomplete="username"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="form-group-item">
          <label for="password" class="field-label">Password</label>
          <div class="field-wrapper">
            <span class="field-icon-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              placeholder="Enter your password"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              class="field-toggle-eye"
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

        <!-- Error Banner -->
        <div v-if="loginError" class="login-error-message">
          {{ loginError }}
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn-signin-primary" :disabled="submitting">
          <span>{{ submitting ? 'Signing In…' : 'Sign In' }}</span>
        </button>

        <!-- Forgot Password Link -->
        <div class="forgot-pwd-row">
          <a href="#forgot" class="link-forgot" @click.prevent="handleForgotPassword">
            Forgot Password?
          </a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { loginTeacher } from '../api/auth.js';
import { useTeacherSession } from '../composables/useTeacherSession.js';

const router = useRouter();
const { setSession, clearSession } = useTeacherSession();
const showPassword = ref(false);
const submitting = ref(false);
const loginError = ref('');

onMounted(() => {
  clearSession();
});

const form = reactive({
  teacherId: '',
  password: '',
});

function handleForgotPassword() {
  alert('Please contact the ALS District Coordinator or Administrator to reset your Teacher credentials.');
}

async function handleLogin() {
  loginError.value = '';
  submitting.value = true;
  try {
    const { data } = await loginTeacher({
      username: form.teacherId.trim(),
      teacherId: form.teacherId.trim(),
      password: form.password,
    });
    if (data) {
      const teacherProfile = data.teacher || data.user?.profile || data.user;
      if (teacherProfile) {
        setSession(teacherProfile, data.token);
        router.push({ name: 'Dashboard' });
      }
    }
  } catch (err) {
    loginError.value =
      err.response?.data?.error ||
      'Failed to sign in. Please verify your Teacher credentials or make sure the backend server is running.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.8125rem;
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  text-align: center;
  margin-top: 0.25rem;
}
</style>

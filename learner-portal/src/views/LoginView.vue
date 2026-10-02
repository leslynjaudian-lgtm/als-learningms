<template>
  <div class="learner-login-container">
    <!-- Concentric Background Blue Rings -->
    <div class="login-bg-circles" aria-hidden="true">
      <div class="circle-layer circle-top-left-1"></div>
      <div class="circle-layer circle-top-left-2"></div>
      <div class="circle-layer circle-top-left-3"></div>
      <div class="circle-layer circle-bottom-right-1"></div>
      <div class="circle-layer circle-bottom-right-2"></div>
      <div class="circle-layer circle-bottom-right-3"></div>
    </div>

    <!-- Centered Login Card -->
    <div class="learner-login-card">
      <!-- Seal Logo & Title -->
      <div class="learner-seal-wrap">
        <img src="/logo.png" alt="ALS Seal" class="learner-seal-img" />
      </div>
      <h1 class="learner-brand-title">ALS LMS</h1>
      <div class="learner-brand-bar"></div>

      <h2 class="learner-login-heading">Learner Login</h2>

      <!-- Form -->
      <form class="learner-login-form" @submit.prevent="handleLogin">
        <div class="form-field-group">
          <label for="fullName" class="field-label-text">Full Name</label>
          <div class="field-input-box">
            <span class="field-left-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              id="fullName"
              v-model="name"
              type="text"
              class="field-text-input"
              placeholder="Enter your full name"
              required
              autocomplete="name"
            />
          </div>
        </div>

        <!-- Error Banner -->
        <div v-if="loginError" class="login-error-banner" style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 0.8125rem; padding: 0.6rem 0.85rem; border-radius: 8px; margin-bottom: 1rem; text-align: center;">
          {{ loginError }}
        </div>

        <button type="submit" class="btn-learner-signin" :disabled="submitting">
          <span>{{ submitting ? 'Signing In…' : 'Sign In &rarr;' }}</span>
        </button>

        <!-- Info Guidance Callout -->
        <div class="learner-info-callout">
          <div class="info-callout-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="info-callout-text">
            Use your registered name, username, or LRN to sign in.
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axios.js';

const router = useRouter();
const name = ref('');
const submitting = ref(false);
const loginError = ref('');

onMounted(() => {
  localStorage.removeItem('als_learner_authenticated');
  localStorage.removeItem('als_learner_user');
  localStorage.removeItem('als_learner_token');
});

async function handleLogin() {
  const entered = name.value.trim();
  if (!entered) {
    loginError.value = 'Please enter your registered name or username.';
    return;
  }
  loginError.value = '';
  submitting.value = true;
  try {
    const res = await api.post('/auth/login', {
      username: entered,
      role: 'LEARNER',
    });

    if (res.data?.token) {
      const u = res.data.user;
      localStorage.setItem('als_learner_token', res.data.token);
      localStorage.setItem('als_learner_authenticated', 'true');
      localStorage.setItem('als_learner_user', JSON.stringify({
        ...u,
        role: 'LEARNER',
        name: u.name,
        fullName: u.name,
        program: u.profile?.level || 'A&E Junior',
        learningCenter: u.profile?.learningCenter || '—',
        learningCenterId: u.profile?.learningCenterId || null,
        teacher: u.profile?.teacher || '—',
        assignedTeacher: u.profile?.teacher || '—',
        lrn: u.profile?.lrn || '',
        id: u.profile?.id || u.id,
        profilePhoto: u.profilePhoto || u.profile?.profilePhoto || null,
      }));
      router.push('/home');
    }
  } catch (err) {
    if (err.response?.data?.error) {
      loginError.value = err.response.data.error;
    } else if (err.message === 'Network Error' || !err.response) {
      loginError.value = 'Cannot connect to backend server. Please verify backend is running on http://localhost:3000.';
    } else {
      loginError.value = 'Account not found. Please verify your registered name or LRN.';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

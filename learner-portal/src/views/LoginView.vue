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

      <!-- STEP 1: Full Name Input (Default Flow) -->
      <form v-if="step === 'name'" class="learner-login-form" @submit.prevent="handleLogin">
        <!-- Full Name -->
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
              v-model="fullName"
              type="text"
              class="field-text-input"
              placeholder="Enter your full name"
              required
              autocomplete="name"
            />
          </div>
        </div>

        <!-- Error Banner -->
        <div v-if="loginError" class="login-error-banner" style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 0.8125rem; padding: 0.6rem 0.85rem; border-radius: 8px; margin-bottom: 0.5rem; text-align: center;">
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
            Use your Registered First Name and Last Name to sign in
          </div>
        </div>
      </form>

      <!-- STEP 2: LRN Verification (For Duplicate Names Only) -->
      <form v-else class="learner-login-form" @submit.prevent="handleLrnVerification">
        <!-- Duplicate Notice Box -->
        <div class="learner-duplicate-notice" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 0.75rem 0.95rem; display: flex; align-items: flex-start; gap: 0.65rem; text-align: left;">
          <div style="color: #1d4ed8; margin-top: 1px; flex-shrink: 0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div style="font-size: 0.825rem; color: #1e40af; font-weight: 600; line-height: 1.4;">
            Multiple learners have the same registered name. Please enter your LRN to identify your account.
          </div>
        </div>

        <!-- LRN Input -->
        <div class="form-field-group">
          <label for="lrn" class="field-label-text">Learner Reference Number (LRN)</label>
          <div class="field-input-box">
            <span class="field-left-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <line x1="7" y1="8" x2="17" y2="8"/>
                <line x1="7" y1="12" x2="13" y2="12"/>
                <line x1="7" y1="16" x2="10" y2="16"/>
              </svg>
            </span>
            <input
              id="lrn"
              v-model="lrn"
              type="text"
              class="field-text-input"
              placeholder="Enter your LRN"
              required
              autocomplete="off"
            />
          </div>
        </div>

        <!-- Error Banner -->
        <div v-if="loginError" class="login-error-banner" style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 0.8125rem; padding: 0.6rem 0.85rem; border-radius: 8px; margin-bottom: 0.5rem; text-align: center;">
          {{ loginError }}
        </div>

        <!-- Actions -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.25rem;">
          <button type="submit" class="btn-learner-signin" :disabled="submitting">
            <span>{{ submitting ? 'Verifying…' : 'Continue &rarr;' }}</span>
          </button>
          <button type="button" class="btn-learner-back" @click="goBackToName" :disabled="submitting">
            Back
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axios.js';
import { clearLegacySharedModuleProgressKeys, clearLearnerSessionStorage } from '../utils/learnerStorage.js';

const router = useRouter();
const step = ref('name'); // 'name' | 'lrn'
const fullName = ref('');
const lrn = ref('');
const submitting = ref(false);
const loginError = ref('');

onMounted(() => {
  clearLearnerSessionStorage();
});

function goBackToName() {
  step.value = 'name';
  lrn.value = '';
  loginError.value = '';
}

function processSuccessfulAuth(data) {
  if (data?.token) {
    clearLegacySharedModuleProgressKeys();
    try {
      sessionStorage.clear();
    } catch {}
    const u = data.user;
    localStorage.setItem('als_learner_token', data.token);
    localStorage.setItem('als_learner_authenticated', 'true');
    localStorage.setItem('als_learner_user', JSON.stringify({
      ...u,
      userId: u.id,
      learnerId: u.profile?.id || u.id,
      role: 'LEARNER',
      name: u.profile?.fullName || u.fullName || u.name,
      fullName: u.profile?.fullName || u.fullName || u.name,
      program: u.profile?.level || 'A&E Junior High',
      learningCenter: u.profile?.learningCenter || 'None Assigned',
      learningCenterId: u.profile?.learningCenterId || null,
      teacher: u.profile?.teacher || u.profile?.assignedTeacher || 'None Assigned',
      assignedTeacher: u.profile?.assignedTeacher || u.profile?.teacher || 'None Assigned',
      lrn: u.profile?.lrn || '',
      id: u.profile?.id || u.id,
      profilePhoto: u.profilePhoto || u.profile?.profilePhoto || null,
    }));
    try {
      window.dispatchEvent(new CustomEvent('als-learner-session-changed'));
    } catch {}
    router.push('/home');
  }
}

async function handleLogin() {
  const cleanName = fullName.value.trim();

  if (!cleanName) {
    loginError.value = 'Please enter your full name.';
    return;
  }

  loginError.value = '';
  submitting.value = true;

  try {
    const res = await api.post('/auth/login', {
      fullName: cleanName,
      role: 'LEARNER',
    });

    if (res.data?.requiresLrn) {
      step.value = 'lrn';
      lrn.value = '';
      loginError.value = '';
      return;
    }

    processSuccessfulAuth(res.data);
  } catch (err) {
    if (err.response?.data?.requiresLrn) {
      step.value = 'lrn';
      lrn.value = '';
      loginError.value = '';
    } else if (err.response?.data?.error) {
      loginError.value = err.response.data.error;
    } else if (err.message === 'Network Error' || !err.response) {
      loginError.value = 'Cannot connect to backend server. Please verify backend is running on http://localhost:3000.';
    } else {
      loginError.value = 'Unable to find your learner account. Please enter your complete registered First Name and Last Name.';
    }
  } finally {
    submitting.value = false;
  }
}

async function handleLrnVerification() {
  const cleanName = fullName.value.trim();
  const cleanLrn = lrn.value.trim();

  if (!cleanLrn) {
    loginError.value = 'Please enter your LRN to identify your account.';
    return;
  }

  loginError.value = '';
  submitting.value = true;

  try {
    const res = await api.post('/auth/login', {
      fullName: cleanName,
      lrn: cleanLrn,
      role: 'LEARNER',
    });

    processSuccessfulAuth(res.data);
  } catch (err) {
    if (err.response?.data?.error) {
      loginError.value = err.response.data.error;
    } else if (err.message === 'Network Error' || !err.response) {
      loginError.value = 'Cannot connect to backend server. Please verify backend is running on http://localhost:3000.';
    } else {
      loginError.value = 'Unable to verify your learner information. Please check your details or contact your ALS teacher.';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.btn-learner-back {
  width: 100%;
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-learner-back:hover:not(:disabled) {
  background: #f8fafc;
  color: #334155;
  border-color: #cbd5e1;
}

.btn-learner-back:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

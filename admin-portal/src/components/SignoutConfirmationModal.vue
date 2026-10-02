<template>
  <div v-if="isOpen" class="signout-modal-overlay" @click.self="$emit('cancel')">
    <div class="signout-modal-card">
      <div class="signout-icon-wrap">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </div>

      <h2 class="signout-title">{{ title }}</h2>
      <p class="signout-desc">{{ message }}</p>

      <button type="button" class="btn-signout-confirm" @click="$emit('confirm')">
        Yes, Signout
      </button>
      <button type="button" class="btn-signout-cancel" @click="$emit('cancel')">
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Signout',
  },
  message: {
    type: String,
    default: 'Are you sure you want to signout?',
  },
});

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.signout-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.signout-modal-card {
  width: 100%;
  max-width: 320px;
  background: #ffffff;
  border-radius: 20px;
  padding: 2rem 1.75rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
  }
}

.signout-icon-wrap {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.signout-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.35rem 0;
}

.signout-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
}

.btn-signout-confirm {
  width: 100%;
  padding: 0.8rem 1rem;
  background: #ef4444;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  margin-bottom: 0.65rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
  font-family: inherit;
}

.btn-signout-confirm:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
}

.btn-signout-cancel {
  width: 100%;
  padding: 0.65rem 1rem;
  background: transparent;
  border: none;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
  font-family: inherit;
}

.btn-signout-cancel:hover {
  color: #0f172a;
}
</style>

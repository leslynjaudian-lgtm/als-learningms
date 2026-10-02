<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="delete-modal-overlay"
      @click.self="onCancel"
      @keydown.esc="onCancel"
      tabindex="-1"
    >
      <div class="delete-modal-card" role="dialog" aria-modal="true">
        <!-- Trash Icon Badge -->
        <div class="delete-icon-badge">
          <svg
            class="delete-badge-svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="12" y1="11" x2="12" y2="17" />
          </svg>
        </div>

        <!-- Title -->
        <h2 class="delete-modal-title">{{ title }}</h2>

        <!-- Message -->
        <p class="delete-modal-message">
          <template v-if="message">{{ message }}</template>
          <template v-else>
            Are you sure you want to delete
            <strong class="delete-item-highlight">{{ itemName }}</strong>?
            This action cannot be undone.
          </template>
        </p>

        <!-- Action Buttons -->
        <div class="delete-modal-actions">
          <button
            type="button"
            class="btn-delete-cancel"
            :disabled="loading"
            @click="onCancel"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="btn-delete-confirm"
            :disabled="loading"
            @click="onConfirm"
          >
            <svg
              v-if="!loading"
              class="btn-trash-svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="12" y1="11" x2="12" y2="17" />
            </svg>
            <span v-if="loading" class="spinner-delete-inline"></span>
            <span>{{ loading ? 'Deleting…' : confirmText }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Delete Item',
  },
  itemName: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  confirmText: {
    type: String,
    default: 'Delete',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
});

const emit = defineEmits(['confirm', 'cancel', 'close']);

function onCancel() {
  emit('cancel');
  emit('close');
}

function onConfirm() {
  emit('confirm');
}
</script>

<style scoped>
.delete-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1.25rem;
  animation: deleteOverlayFadeIn 0.18s ease-out;
}

@keyframes deleteOverlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.delete-modal-card {
  background: #ffffff;
  border-radius: 18px;
  width: 100%;
  max-width: 480px;
  padding: 2.25rem 2.5rem 2.25rem;
  box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.05);
  text-align: center;
  box-sizing: border-box;
  animation: deleteModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes deleteModalPop {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(6px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.delete-icon-badge {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background-color: #fee2e2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.35rem;
}

.delete-badge-svg {
  color: #dc2626;
}

.delete-modal-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.delete-modal-message {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.55;
  margin: 0 auto 1.85rem;
  max-width: 380px;
}

.delete-item-highlight {
  font-weight: 700;
  color: #1e293b;
}

.delete-modal-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
}

.btn-delete-cancel {
  min-width: 105px;
  padding: 0.65rem 1.65rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #0f172a;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  box-sizing: border-box;
}

.btn-delete-cancel:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.btn-delete-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete-confirm {
  min-width: 105px;
  padding: 0.65rem 1.65rem;
  background: #dc2626;
  border: 1px solid #dc2626;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  box-sizing: border-box;
}

.btn-delete-confirm:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}

.btn-delete-confirm:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-trash-svg {
  color: #ffffff;
  flex-shrink: 0;
}

.spinner-delete-inline {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: deleteSpin 0.6s linear infinite;
  display: inline-block;
  margin-right: 0.25rem;
}

@keyframes deleteSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 540px) {
  .delete-modal-card {
    padding: 1.75rem 1.5rem;
    border-radius: 14px;
  }
  .delete-modal-actions {
    flex-direction: column-reverse;
    width: 100%;
    gap: 0.5rem;
  }
  .btn-delete-cancel,
  .btn-delete-confirm {
    width: 100%;
  }
}
</style>

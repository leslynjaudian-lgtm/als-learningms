<template>
  <div class="translate-control-wrap">
    <button
      type="button"
      class="translate-bisaya-btn"
      :class="{ 'is-active': active, 'is-loading': loading }"
      :disabled="loading"
      @click.stop="$emit('toggle')"
    >
      <svg
        class="translate-lang-icon"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m5 8 6 6" />
        <path d="m4 14 6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
        <path d="m22 22-5-10-5 10" />
        <path d="M14 18h6" />
      </svg>
      <span>{{ buttonLabel }}</span>
    </button>

    <p v-if="error" class="translate-error-msg" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
});

defineEmits(['toggle']);

const buttonLabel = computed(() => {
  if (props.loading) return 'Translating...';
  if (props.active) return 'Show Original';
  return 'Translate to Bisaya';
});
</script>

<style scoped>
.translate-control-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.translate-bisaya-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 36px;
  padding: 0.35rem 0.75rem;
  background: #ffffff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  color: #165dfc;
  font-size: 0.825rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.translate-bisaya-btn:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #165dfc;
}

.translate-bisaya-btn.is-active {
  background: #eff6ff;
  border-color: #165dfc;
  color: #0b1e36;
}

.translate-bisaya-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.translate-lang-icon {
  flex-shrink: 0;
}

.translate-error-msg {
  font-size: 0.8rem;
  font-weight: 600;
  color: #dc2626;
  margin: 0;
}
</style>

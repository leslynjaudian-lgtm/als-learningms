<template>
  <div
    ref="wrapperRef"
    class="locked-field-wrapper has-lock-icon"
    :title="message || 'This field cannot be edited.'"
    @keydown="handleKeydown"
    @paste.prevent
    @cut.prevent
    @drop.prevent
    @beforeinput.prevent
  >
    <slot />
    <span
      v-if="showIcon"
      class="locked-field-icon"
      aria-hidden="true"
      :title="message || 'This field cannot be edited.'"
      @click.stop
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </span>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  message: {
    type: String,
    default: 'This field cannot be edited.',
  },
  showIcon: {
    type: Boolean,
    default: true,
  },
});

const wrapperRef = ref(null);

function syncChildTitleAndState() {
  if (!wrapperRef.value) return;
  const childInputs = wrapperRef.value.querySelectorAll('input, select, textarea');
  childInputs.forEach((el) => {
    el.setAttribute('title', props.message || 'This field cannot be edited.');
    el.setAttribute('readonly', 'readonly');
  });
}

onMounted(() => {
  syncChildTitleAndState();
});

watch(
  () => props.message,
  () => {
    syncChildTitleAndState();
  }
);

function handleKeydown(e) {
  // Allow navigation keys: Tab, Escape, arrow keys, Home, End
  if (['Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
    return;
  }
  // Allow copy shortcut (Ctrl+C / Cmd+C) and select-all (Ctrl+A / Cmd+A)
  if ((e.ctrlKey || e.metaKey) && ['c', 'C', 'a', 'A'].includes(e.key)) {
    return;
  }
  // Prevent any typing, modifying, backspace, delete, etc.
  e.preventDefault();
}
</script>

<style scoped>
.locked-field-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.locked-field-wrapper :deep(input),
.locked-field-wrapper :deep(select),
.locked-field-wrapper :deep(textarea) {
  cursor: default;
}

.locked-field-wrapper.has-lock-icon :deep(input),
.locked-field-wrapper.has-lock-icon :deep(select),
.locked-field-wrapper.has-lock-icon :deep(textarea) {
  padding-right: 2.25rem !important;
}

.locked-field-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: default;
  z-index: 2;
  user-select: none;
}
</style>

<template>
  <button
    type="button"
    class="btn-clear-filters"
    :disabled="disabled"
    :aria-label="ariaLabel || 'Clear Filters'"
    title="Clear Filters"
    @click="$emit('click', $event)"
  >
    <svg
      class="clear-filters-icon"
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
    <span>Clear Filters</span>
  </button>
</template>

<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
    default: ''
  }
});

defineEmits(['click']);
</script>

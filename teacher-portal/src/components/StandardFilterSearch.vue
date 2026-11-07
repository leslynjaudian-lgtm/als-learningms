<template>
  <div class="filter-search-wrap" :class="{ 'has-value': !!modelValue }">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input
      :id="id"
      type="text"
      class="filter-search-input"
      :placeholder="placeholder || 'Search...'"
      :value="modelValue"
      :aria-label="ariaLabel || placeholder || 'Search'"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <button
      v-if="modelValue && clearable"
      type="button"
      class="search-clear-btn"
      title="Clear search"
      aria-label="Clear search"
      @click="$emit('update:modelValue', '')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search...' },
  id: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  clearable: { type: Boolean, default: true },
});
defineEmits(['update:modelValue']);
</script>


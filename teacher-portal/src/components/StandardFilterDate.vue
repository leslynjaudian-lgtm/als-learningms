<template>
  <div class="filter-dropdown-item filter-date-item">
    <label v-if="label" :for="id" class="filter-label">{{ label }}</label>
    <input
      :id="id"
      type="date"
      class="filter-date-input"
      :value="modelValue"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
      @change="$emit('change', $event.target.value)"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  id: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
});
defineEmits(['update:modelValue', 'change']);
</script>


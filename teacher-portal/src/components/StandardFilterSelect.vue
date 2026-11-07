<template>
  <div class="filter-dropdown-item">
    <label v-if="label" :for="id" class="filter-label">{{ label }}</label>
    <select
      :id="id"
      class="filter-select"
      :value="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <slot>
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="typeof opt === 'object' && opt !== null ? opt.value : opt"
          :value="typeof opt === 'object' && opt !== null ? opt.value : opt"
        >
          {{ typeof opt === 'object' && opt !== null ? opt.label : opt }}
        </option>
      </slot>
    </select>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  id: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
});
defineEmits(['update:modelValue']);
</script>


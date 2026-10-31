<template>
  <div class="password-field-group">
    <label v-if="label" class="password-field-label" :for="resolvedInputId">
      {{ label }} <span v-if="required" class="required">*</span>
    </label>

    <div class="password-input-wrap">
      <input
        :id="resolvedInputId"
        ref="inputRef"
        :value="modelValue"
        :type="isVisible ? 'text' : 'password'"
        class="password-field-input"
        :class="{
          'input-error': !!error,
          'input-valid': !error && isValid,
        }"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="describedByIds"
        spellcheck="false"
        autocapitalize="off"
        autocorrect="off"
        @focus="onFocus"
        @input="onInput"
        @blur="onBlur"
      />

      <button
        type="button"
        class="password-toggle-btn"
        :disabled="disabled"
        :title="isVisible ? 'Hide password' : 'Show password'"
        :aria-label="isVisible ? 'Hide password' : 'Show password'"
        :aria-pressed="isVisible ? 'true' : 'false'"
        @click.stop.prevent="toggleVisibility"
      >
        <svg
          class="password-toggle-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <!-- Current visibility state icon: EYE when visible, EYE-OFF when hidden -->
          <path :d="isVisible ? EYE_SVG_PATH : EYE_OFF_SVG_PATH" />
        </svg>
      </button>
    </div>

    <!-- Helper Text (kept visible near the field, e.g. 12-character minimum requirement) -->
    <span
      v-if="helperText"
      :id="`${resolvedInputId}-hint`"
      class="password-field-hint"
    >
      {{ helperText }}
    </span>

    <!-- Inline Error Message -->
    <p
      v-if="error"
      :id="`${resolvedInputId}-error`"
      class="password-field-error"
      role="alert"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{{ error }}</span>
    </p>

    <!-- Inline Success Feedback -->
    <p
      v-else-if="successText"
      :id="`${resolvedInputId}-success`"
      class="password-field-success"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>{{ successText }}</span>
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

// Single-path SVG definitions so only ONE <svg> and ONE <path> ever exist in the DOM per field.
// State representation:
// Regular Eye icon (represents VISIBLE state: isVisible === true):
const EYE_SVG_PATH =
  'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z';
// Eye-off icon (represents HIDDEN state: isVisible === false):
const EYE_OFF_SVG_PATH =
  'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  inputId: {
    type: String,
    default: '',
  },
  fieldId: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  autocomplete: {
    type: String,
    default: 'off',
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  maxlength: {
    type: [Number, String],
    default: 128,
  },
  error: {
    type: String,
    default: '',
  },
  helperText: {
    type: String,
    default: '',
  },
  successText: {
    type: String,
    default: '',
  },
  isValid: {
    type: Boolean,
    default: false,
  },
  resetKey: {
    type: [String, Number, Boolean],
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'blur', 'input']);

const isVisible = ref(false);
const inputRef = ref(null);

const resolvedInputId = computed(() => {
  return props.inputId || props.fieldId || 'password-field';
});

function syncInputTypeWithVisibility() {
  if (!inputRef.value) return;
  const expectedType = isVisible.value ? 'text' : 'password';
  if (inputRef.value.type !== expectedType) {
    inputRef.value.type = expectedType;
  }
}

// Automatically reset visibility to hidden whenever the password value is cleared
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      isVisible.value = false;
    }
    syncInputTypeWithVisibility();
  }
);

// Reset visibility to hidden whenever the parent tab/section changes
watch(
  () => props.resetKey,
  () => {
    resetVisibility();
  }
);

const describedByIds = computed(() => {
  const ids = [];
  if (props.helperText) ids.push(`${resolvedInputId.value}-hint`);
  if (props.error) ids.push(`${resolvedInputId.value}-error`);
  else if (props.successText) ids.push(`${resolvedInputId.value}-success`);
  return ids.length > 0 ? ids.join(' ') : undefined;
});

function toggleVisibility(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (props.disabled) return;
  isVisible.value = !isVisible.value;
  syncInputTypeWithVisibility();
}

function resetVisibility() {
  isVisible.value = false;
  syncInputTypeWithVisibility();
}

function focus() {
  inputRef.value?.focus();
}

function onFocus() {
  // Never allow focus or browser autofill to reveal a hidden password
  syncInputTypeWithVisibility();
}

function onInput(event) {
  // Typing must never change isVisible; enforce input type matches current visibility state
  syncInputTypeWithVisibility();
  const value = event?.target ? event.target.value : '';
  emit('update:modelValue', value);
  emit('input', value);
}

function onBlur(event) {
  emit('blur', event);
}

onMounted(() => {
  resetVisibility();
});

defineExpose({
  resetVisibility,
  focus,
});
</script>

<style scoped>
.password-field-group {
  margin-bottom: 1.25rem;
}

.password-field-label {
  display: block;
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin-bottom: 0.4rem;
}

.password-field-label .required {
  color: #ef4444;
}

.password-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.password-field-input {
  width: 100%;
  height: 42px;
  padding: 0.55rem 2.85rem 0.55rem 0.85rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--color-text, #0f172a);
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

/* Hide browser-native password reveal and clear controls (each in a standalone rule so no browser drops the selector list) */
.password-field-input::-ms-reveal {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.password-field-input::-ms-clear {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.password-field-input::-webkit-credentials-auto-fill-button {
  visibility: hidden !important;
  display: none !important;
  pointer-events: none !important;
}

.password-field-input::-webkit-contacts-auto-fill-button {
  visibility: hidden !important;
  display: none !important;
  pointer-events: none !important;
}

.password-field-input:focus {
  outline: none;
  border-color: var(--color-primary, #1d4ed8);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.password-field-input.input-error {
  border-color: #dc2626;
  background-color: #fffafa;
}

.password-field-input.input-error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.14);
}

.password-field-input.input-valid {
  border-color: #10b981;
}

.password-field-input.input-valid:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.14);
}

.password-toggle-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 6px;
  z-index: 2;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.password-toggle-icon {
  display: block;
  pointer-events: none;
  flex-shrink: 0;
}

.password-toggle-btn:hover:not(:disabled) {
  color: #0f172a;
  background-color: #f1f5f9;
}

.password-toggle-btn:focus-visible {
  outline: 2px solid var(--color-primary, #1d4ed8);
  outline-offset: 1px;
  color: #0f172a;
}

.password-toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-field-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
  margin-top: 0.35rem;
  line-height: 1.4;
}

.password-field-error {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: #dc2626;
  margin: 0.35rem 0 0;
  line-height: 1.35;
}

.password-field-error svg {
  flex-shrink: 0;
}

.password-field-success {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: #059669;
  margin: 0.35rem 0 0;
  line-height: 1.35;
}

.password-field-success svg {
  flex-shrink: 0;
}
</style>

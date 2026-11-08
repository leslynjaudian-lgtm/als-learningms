<template>
  <div class="field-item full-width assign-module-dropdown-group">
    <label class="field-lbl" :id="labelId">Assign Module To <span class="req">*</span></label>

    <!-- Custom Dropdown Trigger -->
    <div
      ref="assignDropdownTriggerRef"
      class="custom-dropdown-trigger"
      :class="{
        'is-open': isAssignDropdownOpen,
        'is-disabled': eligibleLearners.length === 0,
        'has-error': !isAllLearners && (!selectedLearnerIds || selectedLearnerIds.length === 0)
      }"
      tabindex="0"
      role="combobox"
      :aria-labelledby="labelId"
      aria-haspopup="listbox"
      :aria-expanded="isAssignDropdownOpen"
      @click="toggleAssignDropdown"
      @keydown.enter.prevent="toggleAssignDropdown"
      @keydown.space.prevent="toggleAssignDropdown"
      @keydown.down.prevent="openAssignDropdown"
      @keydown.up.prevent="openAssignDropdown"
    >
      <span class="dropdown-trigger-text" :title="assignDropdownTooltipText">
        {{ assignDropdownDisplayText }}
      </span>
      <svg
        class="dropdown-chevron"
        :class="{ 'is-rotated': isAssignDropdownOpen }"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>

    <!-- Helper warning when no learners available in selected center/level -->
    <div v-if="eligibleLearners.length === 0" class="field-helper-warning">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>No eligible {{ activeLevel }} learners found for {{ centerName || 'the selected Learning Center' }}.</span>
    </div>

    <!-- Teleport for Assign Module To Dropdown Menu -->
    <Teleport to="body">
      <div
        v-if="isAssignDropdownOpen"
        class="assign-dropdown-backdrop"
        @click="closeAssignDropdown"
      ></div>

      <div
        v-if="isAssignDropdownOpen"
        ref="assignDropdownMenuRef"
        class="custom-dropdown-menu"
        :class="[`placement-${assignDropdownPlacement}`]"
        :style="assignDropdownStyle"
        @click.stop
      >
        <!-- Search Input Header -->
        <div class="dropdown-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref="assignDropdownSearchInputRef"
            v-model="assignSearchQuery"
            type="text"
            class="dropdown-search-input"
            placeholder="Search learners by name..."
            @click.stop
            @keydown.esc.stop="closeAssignDropdown"
          />
          <button
            v-if="assignSearchQuery"
            type="button"
            class="dropdown-search-clear"
            @click.stop="assignSearchQuery = ''"
            aria-label="Clear search"
          >
            &times;
          </button>
        </div>

        <!-- Dropdown Options List -->
        <div class="dropdown-options-list">
          <!-- All Learners Option (Always First) -->
          <div
            v-if="!assignSearchQuery || 'all learners'.includes(assignSearchQuery.toLowerCase())"
            class="dropdown-option-item all-learners-item"
            :class="{ 'is-selected': isAllLearners }"
            @click.stop="selectAllLearners"
          >
            <div class="custom-checkbox" :class="{ 'is-checked': isAllLearners }">
              <svg v-if="isAllLearners" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span class="option-name">All Learners</span>
            <span class="option-badge">
              {{ eligibleLearners.length }} {{ eligibleLearners.length === 1 ? 'learner' : 'learners' }}
            </span>
          </div>

          <div
            v-if="eligibleLearners.length > 0 && (!assignSearchQuery || 'all learners'.includes(assignSearchQuery.toLowerCase()))"
            class="dropdown-divider"
          ></div>

          <!-- Individual Learner Options -->
          <div
            v-for="learner in searchedEligibleLearners"
            :key="learner.id"
            class="dropdown-option-item"
            :class="{ 'is-selected': isLearnerSelected(learner.id) }"
            @click.stop="toggleLearner(learner.id)"
          >
            <div class="custom-checkbox" :class="{ 'is-checked': isLearnerSelected(learner.id) }">
              <svg v-if="isLearnerSelected(learner.id)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span class="option-name">{{ learner.name || learner.fullName }}</span>
          </div>

          <!-- Empty State inside Dropdown -->
          <div v-if="eligibleLearners.length === 0" class="dropdown-empty">
            No active learners found for selected Learning Center and ALS Level.
          </div>
          <div v-else-if="searchedEligibleLearners.length === 0" class="dropdown-empty">
            No learners match "{{ assignSearchQuery }}".
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  eligibleLearners: {
    type: Array,
    default: () => [],
  },
  isAllLearners: {
    type: Boolean,
    default: true,
  },
  selectedLearnerIds: {
    type: Array,
    default: () => [],
  },
  activeLevel: {
    type: String,
    default: 'A&E Elementary',
  },
  centerName: {
    type: String,
    default: 'Selected Center',
  },
  labelId: {
    type: String,
    default: 'assign-module-label',
  },
});

const emit = defineEmits(['update:isAllLearners', 'update:selectedLearnerIds']);

const isAssignDropdownOpen = ref(false);
const assignSearchQuery = ref('');
const assignDropdownTriggerRef = ref(null);
const assignDropdownMenuRef = ref(null);
const assignDropdownSearchInputRef = ref(null);
const assignDropdownPlacement = ref('down');
const assignDropdownStyle = ref({});

function updateAssignDropdownPosition() {
  if (!assignDropdownTriggerRef.value || !isAssignDropdownOpen.value) return;
  const rect = assignDropdownTriggerRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const spaceBelow = viewportHeight - rect.bottom - 12;
  const spaceAbove = rect.top - 12;

  const preferUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  assignDropdownPlacement.value = preferUp ? 'up' : 'down';

  const width = Math.min(rect.width, viewportWidth - 24);
  const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12));

  if (preferUp) {
    const maxHeight = Math.min(260, Math.max(120, spaceAbove));
    assignDropdownStyle.value = {
      position: 'fixed',
      bottom: `${viewportHeight - rect.top + 4}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 10050,
    };
  } else {
    const maxHeight = Math.min(260, Math.max(120, spaceBelow));
    assignDropdownStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 10050,
    };
  }
}

function openAssignDropdown() {
  if (props.eligibleLearners.length === 0) return;
  isAssignDropdownOpen.value = true;
  assignSearchQuery.value = '';
  nextTick(() => {
    updateAssignDropdownPosition();
    assignDropdownSearchInputRef.value?.focus();
  });
}

function closeAssignDropdown() {
  isAssignDropdownOpen.value = false;
  assignSearchQuery.value = '';
}

function toggleAssignDropdown() {
  if (isAssignDropdownOpen.value) {
    closeAssignDropdown();
  } else {
    openAssignDropdown();
  }
}

function handleGlobalDropdownScroll(e) {
  if (isAssignDropdownOpen.value) {
    if (assignDropdownMenuRef.value && e?.target && assignDropdownMenuRef.value.contains(e.target)) {
      return;
    }
    if (!assignDropdownTriggerRef.value) {
      closeAssignDropdown();
      return;
    }
    const rect = assignDropdownTriggerRef.value.getBoundingClientRect();
    if (rect.bottom < 60 || rect.top > window.innerHeight - 60) {
      closeAssignDropdown();
    } else {
      updateAssignDropdownPosition();
    }
  }
}

function handleGlobalDropdownKeydown(e) {
  if (e.key === 'Escape' && isAssignDropdownOpen.value) {
    closeAssignDropdown();
    e.preventDefault();
    e.stopPropagation();
  }
}

// Search filter inside Assign Module To dropdown
const searchedEligibleLearners = computed(() => {
  const query = assignSearchQuery.value.trim().toLowerCase();
  if (!query) return props.eligibleLearners;
  return props.eligibleLearners.filter((l) =>
    (l.name || l.fullName || '').toLowerCase().includes(query)
  );
});

// Display text in the closed Assign Module To dropdown trigger
const assignDropdownDisplayText = computed(() => {
  const total = props.eligibleLearners.length;
  if (total === 0) return 'No learners available';
  if (props.isAllLearners) {
    return `All Learners (${total} ${total === 1 ? 'learner' : 'learners'})`;
  }
  const count = (props.selectedLearnerIds || []).length;
  if (count === 0) return 'Select learners...';
  return `${count} ${count === 1 ? 'Learner' : 'Learners'} Selected`;
});

const assignDropdownTooltipText = computed(() => {
  const total = props.eligibleLearners.length;
  if (total === 0) return 'No active learners available';
  if (props.isAllLearners) return `All Learners (${total} active)`;
  const count = (props.selectedLearnerIds || []).length;
  if (count === 0) return 'Select learners...';
  const selectedSet = new Set((props.selectedLearnerIds || []).map(Number));
  return props.eligibleLearners
    .filter((l) => selectedSet.has(Number(l.id)))
    .map((l) => l.name || l.fullName)
    .join(', ');
});

function selectAllLearners() {
  const allIds = props.eligibleLearners.map((l) => Number(l.id));
  if (props.isAllLearners) {
    emit('update:isAllLearners', false);
    emit('update:selectedLearnerIds', []);
  } else {
    emit('update:isAllLearners', true);
    emit('update:selectedLearnerIds', [...allIds]);
  }
}

function toggleLearner(learnerId) {
  const idNum = Number(learnerId);
  const allIds = props.eligibleLearners.map((l) => Number(l.id));

  if (props.isAllLearners) {
    // Was All Learners, now teacher deselects one learner
    const nextIds = allIds.filter((id) => id !== idNum);
    emit('update:isAllLearners', false);
    emit('update:selectedLearnerIds', nextIds);
  } else {
    const currentIds = Array.isArray(props.selectedLearnerIds)
      ? props.selectedLearnerIds.map(Number)
      : [];
    const idx = currentIds.indexOf(idNum);
    let nextIds;
    if (idx === -1) {
      nextIds = [...currentIds, idNum];
    } else {
      nextIds = currentIds.filter((id) => id !== idNum);
    }

    // When every eligible learner is selected, All Learners automatically becomes checked
    if (allIds.length > 0 && nextIds.length >= allIds.length) {
      emit('update:isAllLearners', true);
      emit('update:selectedLearnerIds', [...allIds]);
    } else {
      emit('update:isAllLearners', false);
      emit('update:selectedLearnerIds', nextIds);
    }
  }
}

function isLearnerSelected(learnerId) {
  if (props.isAllLearners) {
    return true;
  }
  return (props.selectedLearnerIds || []).map(Number).includes(Number(learnerId));
}

watch(
  () => props.eligibleLearners.length,
  (newLen) => {
    if (newLen === 0 && isAssignDropdownOpen.value) {
      closeAssignDropdown();
    } else if (isAssignDropdownOpen.value) {
      updateAssignDropdownPosition();
    }
  }
);

onMounted(() => {
  window.addEventListener('resize', updateAssignDropdownPosition);
  window.addEventListener('scroll', handleGlobalDropdownScroll, true);
  window.addEventListener('keydown', handleGlobalDropdownKeydown, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateAssignDropdownPosition);
  window.removeEventListener('scroll', handleGlobalDropdownScroll, true);
  window.removeEventListener('keydown', handleGlobalDropdownKeydown, true);
});

defineExpose({
  closeAssignDropdown,
});
</script>

<style scoped>
.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-item.full-width {
  grid-column: 1 / -1;
}

.field-lbl {
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
}

.req {
  color: #ef4444;
}

.assign-module-dropdown-group {
  position: relative;
}

.custom-dropdown-trigger {
  width: 100%;
  height: 42px;
  min-height: 42px;
  padding: 0 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.custom-dropdown-trigger:hover:not(.is-disabled) {
  border-color: #94a3b8;
}

.custom-dropdown-trigger:focus,
.custom-dropdown-trigger.is-open {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: none;
}

.custom-dropdown-trigger.is-disabled {
  background: #f8fafc;
  cursor: not-allowed;
  opacity: 0.75;
}

.custom-dropdown-trigger.has-error {
  border-color: #ef4444;
}

.custom-dropdown-trigger.has-error:focus,
.custom-dropdown-trigger.has-error.is-open {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

.dropdown-trigger-text {
  font-size: 0.875rem;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 0.5rem;
  line-height: 1.2;
}

.dropdown-chevron {
  color: #64748b;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.dropdown-chevron.is-rotated {
  transform: rotate(180deg);
}

.assign-dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10040;
  background: transparent;
}

.custom-dropdown-menu {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.custom-dropdown-menu.placement-down {
  transform-origin: top center;
  animation: dropdownFadeDown 0.15s ease-out;
}

.custom-dropdown-menu.placement-up {
  transform-origin: bottom center;
  animation: dropdownFadeUp 0.15s ease-out;
}

@keyframes dropdownFadeDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dropdownFadeUp {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.dropdown-search-wrap svg {
  color: #94a3b8;
  flex-shrink: 0;
}

.dropdown-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  color: #0f172a;
  width: 100%;
  font-family: inherit;
  padding: 0;
}

.dropdown-search-clear {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 0.25rem;
}

.dropdown-search-clear:hover {
  color: #475569;
}

.dropdown-options-list {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0.35rem 0;
}

.dropdown-option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  cursor: pointer;
  transition: background 0.12s ease;
  user-select: none;
}

.dropdown-option-item:hover {
  background: #f1f5f9;
}

.dropdown-option-item.is-selected {
  background: #eff6ff;
}

.all-learners-item {
  font-weight: 600;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.custom-checkbox.is-checked {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.option-name {
  font-size: 0.875rem;
  color: #1e293b;
  flex: 1;
  word-break: break-word;
}

.option-badge {
  font-size: 0.75rem;
  color: #64748b;
  background: #e2e8f0;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-weight: 500;
  flex-shrink: 0;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.25rem 0;
}

.dropdown-empty {
  padding: 1.25rem 0.85rem;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.field-helper-warning {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.775rem;
  color: #d97706;
  margin-top: 0.35rem;
}

.field-helper-warning svg {
  flex-shrink: 0;
}
</style>


<template>
  <header class="portal-page-header no-print print-hidden">
    <!-- Breadcrumbs Navigation -->
    <nav v-if="breadcrumbs && breadcrumbs.length > 0" class="page-breadcrumbs" aria-label="Breadcrumb">
      <ol class="breadcrumbs-list">
        <li
          v-for="(item, index) in breadcrumbs"
          :key="index"
          class="breadcrumb-item"
        >
          <!-- Clickable Parent Link -->
          <router-link
            v-if="item.to && index < breadcrumbs.length - 1"
            :to="item.to"
            class="breadcrumb-link"
          >
            {{ item.label }}
          </router-link>

          <!-- Inactive Non-clickable Intermediate Label -->
          <span
            v-else-if="index < breadcrumbs.length - 1"
            class="breadcrumb-inactive"
          >
            {{ item.label }}
          </span>

          <!-- Current Active Page -->
          <span
            v-else
            class="breadcrumb-current"
            aria-current="page"
          >
            {{ item.label }}
          </span>

          <!-- Separator between items -->
          <span
            v-if="index < breadcrumbs.length - 1"
            class="breadcrumb-separator"
            aria-hidden="true"
          >
            /
          </span>
        </li>
      </ol>
    </nav>

    <!-- Page Header Row: Title, Description, and Actions -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="description || $slots.description" class="page-description">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>

      <!-- Action Buttons Slot -->
      <div v-if="$slots.actions" class="page-header-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.portal-page-header {
  width: 100%;
  margin-bottom: 1.5rem; /* 24px spacing from header to main content */
  box-sizing: border-box;
}

/* Breadcrumbs Navigation */
.page-breadcrumbs {
  margin-bottom: 1rem; /* 16px spacing between breadcrumb and title */
}

.breadcrumbs-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.875rem; /* 14px */
  line-height: 1.4;
  font-family: inherit;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-link {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast, 0.15s ease);
}

.breadcrumb-link:hover {
  color: #2563eb;
}

.breadcrumb-inactive {
  color: #64748b;
  font-weight: 500;
}

.breadcrumb-separator {
  color: #cbd5e1;
  user-select: none;
  font-size: 0.875rem;
}

.breadcrumb-current {
  color: #0f172a;
  font-weight: 600;
}

/* Header Content Row */
.page-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
  width: 100%;
  margin-bottom: 0;
}

.page-title-group {
  flex: 1;
  min-width: 260px;
}

.page-title {
  font-size: 1.75rem; /* 28px */
  font-weight: 700;
  color: #0f172a;
  line-height: 1.25;
  margin: 0;
  letter-spacing: -0.02em;
  font-family: inherit;
}

.page-description {
  color: #64748b;
  font-size: 0.875rem; /* 14px */
  font-weight: 400;
  margin: 0.375rem 0 0 0; /* 6px spacing between title and description */
  line-height: 1.5;
  max-width: 820px;
  font-family: inherit;
}

/* Action Buttons Group */
.page-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

/* Universal Action Button Sizing & Polish */
.page-header-actions :deep(button),
.page-header-actions :deep(.btn),
.page-header-actions :deep(a.btn),
.page-header-actions :deep(.btn-primary),
.page-header-actions :deep(.btn-secondary),
.page-header-actions :deep(.btn-refresh) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2.375rem; /* 38px */
  padding: 0 1rem;
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  font-family: inherit;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  box-sizing: border-box;
  transition: all var(--transition-fast, 0.15s ease);
}

@media (max-width: 768px) {
  .page-header-row {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .page-header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>


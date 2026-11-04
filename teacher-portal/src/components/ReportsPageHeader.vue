<template>
  <header class="reports-page-header no-print print-hidden">
    <!-- Breadcrumb Navigation -->
    <nav class="reports-breadcrumb" aria-label="Breadcrumb">
      <router-link :to="dashboardPath" class="breadcrumb-link">Dashboard</router-link>
      <span class="breadcrumb-separator" aria-hidden="true">/</span>
      <router-link :to="reportsPath" class="breadcrumb-link">Reports</router-link>
      <span class="breadcrumb-separator" aria-hidden="true">/</span>
      <span class="breadcrumb-current">{{ breadcrumbTitle || title }}</span>
    </nav>

    <!-- Page Title, Description & Actions -->
    <div class="reports-header-row">
      <div class="reports-title-group">
        <h1 class="reports-title">{{ title }}</h1>
        <p v-if="description" class="reports-description">{{ description }}</p>
      </div>

      <div v-if="$slots.actions" class="reports-actions-group">
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
  breadcrumbTitle: {
    type: String,
    default: '',
  },
  dashboardPath: {
    type: String,
    default: '/dashboard',
  },
  reportsPath: {
    type: String,
    default: '/dashboard/reports',
  },
});
</script>

<style scoped>
.reports-page-header {
  margin-bottom: 1.5rem; /* 24px spacing from header to report content */
  width: 100%;
}

/* Breadcrumb Navigation */
.reports-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8125rem; /* 13px */
  color: #64748b;
  margin-bottom: 1rem; /* 16px between breadcrumb and title */
  line-height: 1.4;
}

.breadcrumb-link {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast, 0.15s ease);
}

.breadcrumb-link:hover {
  color: var(--color-primary, #2563eb);
}

.breadcrumb-separator {
  color: #cbd5e1;
  user-select: none;
  display: inline-flex;
  align-items: center;
}

.breadcrumb-current {
  color: var(--color-text, #0f172a);
  font-weight: 600;
}

/* Header Row */
.reports-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.reports-title-group {
  flex: 1;
  min-width: 260px;
}

.reports-title {
  font-size: 1.5rem; /* 24px */
  font-weight: 700;
  color: var(--color-text, #0f172a);
  line-height: 1.2;
  margin: 0;
  letter-spacing: -0.015em;
}

.reports-description {
  color: var(--color-text-secondary, #64748b);
  font-size: 0.875rem; /* 14px */
  margin: 0.45rem 0 0 0; /* 7px between title and description */
  line-height: 1.5;
  max-width: 820px;
}

/* Action Buttons Group */
.reports-actions-group {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* 12px gap between action buttons */
  flex-wrap: wrap;
}

/* Button common alignment & sizing */
.reports-actions-group :deep(button),
.reports-actions-group :deep(.btn),
.reports-actions-group :deep(a.btn),
.reports-actions-group :deep(.btn-refresh),
.reports-actions-group :deep(.btn-encode-record) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2.375rem; /* 38px */
  padding: 0 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  text-decoration: none;
  box-sizing: border-box;
  transition: all var(--transition-fast, 0.15s ease);
  white-space: nowrap;
}

@media (max-width: 768px) {
  .reports-page-header {
    margin-bottom: 1.25rem;
  }

  .reports-header-row {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .reports-title {
    font-size: 1.35rem;
  }

  .reports-actions-group {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .reports-breadcrumb {
    font-size: 0.75rem;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }

  .reports-title {
    font-size: 1.25rem;
  }

  .reports-actions-group {
    flex-direction: column;
    align-items: stretch;
  }

  .reports-actions-group :deep(button),
  .reports-actions-group :deep(.btn),
  .reports-actions-group :deep(a.btn),
  .reports-actions-group :deep(.btn-refresh),
  .reports-actions-group :deep(.btn-encode-record) {
    width: 100%;
    justify-content: center;
  }
}
</style>


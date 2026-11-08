<template>
  <PageHeader
    :title="title"
    :description="description"
    :breadcrumbs="computedBreadcrumbs"
  >
    <template v-if="$slots.actions" #actions>
      <slot name="actions"></slot>
    </template>
  </PageHeader>
</template>

<script setup>
import { computed } from 'vue';
import PageHeader from './PageHeader.vue';

const props = defineProps({
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

const computedBreadcrumbs = computed(() => [
  { label: 'Dashboard', to: props.dashboardPath },
  { label: 'Reports', to: props.reportsPath },
  { label: props.breadcrumbTitle || props.title },
]);
</script>

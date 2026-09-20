<template>
  <div class="page-container">
    <div class="loading-state" style="padding: 3rem; text-align: center;">
      <div class="spinner spinner-lg"></div>
      <p style="margin-top: 1rem; color: #64748b;">Opening Register Learner modal…</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  router.replace('/learners?add=1');
});
</script>

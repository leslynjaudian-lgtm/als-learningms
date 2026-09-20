<template>
  <div class="module-detail-page">
    <!-- Header with title & progress -->
    <div style="margin-bottom: 1.25rem;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h1 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; line-height: 1.2;">
          Communication Skills<br />
          <span style="font-size: 0.9rem; font-weight: 600; color: #64748b;">(English)</span>
        </h1>
        <div style="font-size: 0.85rem; font-weight: 800; color: #165dfc;">
          60%
        </div>
      </div>
      <div class="progress-bar-track" style="margin-top: 0.5rem; height: 7px;">
        <div class="progress-bar-fill" style="width: 60%;"></div>
      </div>
    </div>

    <!-- Stepper Lesson List -->
    <div class="learner-card" style="margin-bottom: 1.25rem; padding: 0.85rem 1rem;">
      <div style="display: flex; flex-direction: column; gap: 0.65rem;">
        <div
          v-for="(item, idx) in lessons"
          :key="idx"
          @click="activeLesson = idx"
          style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; cursor: pointer; padding: 0.35rem 0.5rem; border-radius: 8px; transition: background 0.15s;"
          :style="{
            background: activeLesson === idx ? '#eff6ff' : 'transparent',
            fontWeight: activeLesson === idx ? '700' : '500',
            color: activeLesson === idx ? '#165dfc' : item.completed ? '#16a34a' : '#64748b'
          }"
        >
          <!-- Status icon -->
          <span v-if="item.completed" style="color: #16a34a; display: flex; align-items: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
          <span v-else-if="activeLesson === idx" style="width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; color: #165dfc;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </span>
          <span v-else style="width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; color: #94a3b8;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
            </svg>
          </span>

          <span>{{ item.title }}</span>
        </div>
      </div>
    </div>

    <!-- Active Lesson Content Card -->
    <div class="learner-card" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem;">
      <h2 style="font-size: 1.05rem; font-weight: 800; color: #0f172a;">
        {{ lessons[activeLesson]?.title || 'Lesson 1: Types of Texts' }}
      </h2>
      <p style="font-size: 0.85rem; color: #475569; line-height: 1.5;">
        In this lesson, you will learn about the different types of texts, their structural characteristics, and their specific communicative purposes in daily life.
      </p>

      <!-- Book graphic card -->
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 14px; padding: 2rem 1.5rem; display: flex; align-items: center; justify-content: center; color: #1e40af;">
        <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          <line x1="6" y1="8" x2="8" y2="8"/>
          <line x1="6" y1="12" x2="8" y2="12"/>
          <line x1="16" y1="8" x2="18" y2="8"/>
          <line x1="16" y1="12" x2="18" y2="12"/>
        </svg>
      </div>

      <!-- Navigation buttons -->
      <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
        <button
          type="button"
          class="btn-outline"
          style="flex: 1;"
          :disabled="activeLesson === 0"
          @click="if (activeLesson > 0) activeLesson--;"
        >
          &lt; Previous
        </button>
        <button
          type="button"
          class="btn-primary"
          style="flex: 1;"
          :disabled="activeLesson >= lessons.length - 1"
          @click="if (activeLesson < lessons.length - 1) activeLesson++;"
        >
          Next &gt;
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const activeLesson = ref(1);

const lessons = [
  { title: 'Introduction', completed: true },
  { title: 'Lesson 1: Types of Texts', completed: false },
  { title: 'Lesson 2: Main Idea', completed: false },
  { title: 'Lesson 3: Supporting Details', completed: false },
  { title: 'Lesson 4: Summarizing', completed: false },
  { title: 'Assessment', completed: false },
];
</script>

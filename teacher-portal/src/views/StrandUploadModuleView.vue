<template>
  <div class="page-container">
    <!-- Breadcrumb / Back link -->
    <nav class="breadcrumb">
      <router-link :to="`/clc/${clcSlug}/strand/${strandSlug}`" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Back to {{ strandName }}</span>
      </router-link>
    </nav>

    <!-- Page Header (Screen 4) -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Upload Module</h1>
        <p>Upload a learning module for the {{ strandName }} strand.</p>
      </div>
    </div>

    <!-- Upload Form Card (Screen 4) -->
    <div class="form-card" style="max-width: 820px;">
      <form @submit.prevent="handleUpload">
        <!-- 2 Column Row: Module Title & Learning Area / Strand -->
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Module Title <span class="required">*</span></label>
            <input
              v-model="form.title"
              type="text"
              class="form-input"
              placeholder="e.g. Communication Skills Module 4"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Learning Area / Strand</label>
            <input
              type="text"
              class="form-input disabled-input"
              :value="strandName"
              disabled
            />
          </div>
        </div>

        <!-- Description (Optional) -->
        <div class="form-group">
          <label class="form-label">Description (Optional)</label>
          <textarea
            v-model="form.description"
            class="form-textarea"
            rows="3"
            placeholder="e.g. This module covers reading and understanding different text types."
          ></textarea>
        </div>

        <!-- Upload Module File (PDF) -->
        <div class="form-group">
          <label class="form-label">Upload Module File (PDF) <span class="required">*</span></label>
          
          <div v-if="!selectedFile" class="file-dropzone" @click="triggerFileInput">
            <input
              ref="fileInputRef"
              type="file"
              accept=".pdf"
              style="display: none;"
              @change="onFileSelected"
            />
            <div class="dropzone-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div class="dropzone-text">
              <span class="dropzone-primary-text">Click to upload or drag and drop</span>
              <span class="dropzone-sub-text">PDF document up to 25MB</span>
            </div>
          </div>

          <!-- Uploaded File Preview Box matching Screen 4 -->
          <div v-else class="uploaded-file-card">
            <div class="pdf-icon-badge">
              <span class="pdf-tag">PDF</span>
            </div>
            <div class="file-meta">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ selectedFile.size }}</span>
            </div>
            <button type="button" class="btn-remove-file" @click="selectedFile = null" title="Remove file">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Auto-assignment Notice Card -->
        <div class="clc-notice-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div>
            <strong>Automated CLC Access:</strong> This module will be published to <strong>Poblacion CLC</strong> and will automatically be accessible to all 17 registered learners.
          </div>
        </div>

        <!-- Action Buttons matching Screen 4 -->
        <div class="form-footer-actions">
          <router-link :to="`/clc/${clcSlug}/strand/${strandSlug}`" class="btn btn-secondary">
            Cancel
          </router-link>
          <button type="submit" class="btn btn-primary" :disabled="isUploading">
            <span>{{ isUploading ? 'Uploading...' : 'Upload Module' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const clcSlug = route.params.clcId || 'poblacion-clc';
const strandSlug = route.params.strandId || 'communication-skills';

const fileInputRef = ref(null);
const isUploading = ref(false);

const strandNamesMap = {
  'communication-skills': 'Communication Skills',
  'mathematical-skills': 'Mathematical and Problem Solving Skills',
  'scientific-literacy': 'Scientific Literacy and Critical Thinking',
  'life-career-skills': 'Life and Career Skills',
  'digital-literacy': 'Digital Literacy',
  'self-society': 'Understanding the Self and the Society',
};

const strandName = computed(() => strandNamesMap[strandSlug] || 'Communication Skills');

const form = reactive({
  title: 'Communication Skills Module 4',
  description: 'This module covers reading and understanding different text types.',
});

// Matching Screen 4 default file
const selectedFile = ref({
  name: 'Communication_Skills_Module4.pdf',
  size: '5.2 MB',
});

function triggerFileInput() {
  fileInputRef.value?.click();
}

function onFileSelected(event) {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    };
  }
}

function handleUpload() {
  if (!form.title) {
    alert('Please enter a module title.');
    return;
  }
  isUploading.value = true;
  setTimeout(() => {
    isUploading.value = false;
    alert(`Module "${form.title}" uploaded successfully to ${strandName.value} for Poblacion CLC!`);
    router.push(`/clc/${clcSlug}/strand/${strandSlug}/module/4`);
  }, 400);
}
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.disabled-input {
  background: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
  border-color: var(--color-border);
}

.form-textarea {
  width: 100%;
  padding: 0.65rem 0.85rem;
  font-size: 0.875rem;
  color: var(--color-text);
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: none;
  font-family: inherit;
  transition: all var(--transition-fast);
}

.form-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.file-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-lg);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  transition: all var(--transition-fast);
}

.file-dropzone:hover {
  border-color: var(--color-primary);
  background: #eff6ff;
}

.uploaded-file-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.pdf-icon-badge {
  width: 42px;
  height: 48px;
  background: #ef4444;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);
}

.file-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
}

.file-size {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}

.btn-remove-file {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.35rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.btn-remove-file:hover {
  color: #ef4444;
  background: #fee2e2;
}

.clc-notice-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-md);
  font-size: 0.825rem;
  color: #1e40af;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.85rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}
</style>

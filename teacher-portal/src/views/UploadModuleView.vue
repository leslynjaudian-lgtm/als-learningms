<template>
  <div class="page-container">
    <!-- Breadcrumb / Back link -->
    <nav class="breadcrumb">
      <router-link to="/modules" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Back to Modules</span>
      </router-link>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Upload Module</h1>
        <p>Upload a learning module and assign it to your CLC.</p>
      </div>
    </div>

    <!-- Upload Form Card -->
    <div class="form-card" style="max-width: 780px;">
      <form @submit.prevent="handleUpload">
        <!-- Module Title -->
        <div class="form-group">
          <label class="form-label">Module Title <span class="required">*</span></label>
          <input
            v-model="form.title"
            type="text"
            class="form-input"
            placeholder="e.g. Communication Skills Module 1"
            required
          />
        </div>

        <!-- Learning Area -->
        <div class="form-group">
          <label class="form-label">Learning Area <span class="required">*</span></label>
          <select v-model="form.learningArea" class="form-select-full" required>
            <option value="Communication Skills">Communication Skills</option>
            <option value="Scientific & Critical Thinking Skills">Scientific & Critical Thinking Skills</option>
            <option value="Mathematical & Problem Solving Skills">Mathematical & Problem Solving Skills</option>
            <option value="Life and Career Skills">Life and Career Skills</option>
            <option value="Understanding Self & Society">Understanding Self & Society</option>
            <option value="Digital Citizenship">Digital Citizenship</option>
          </select>
        </div>

        <!-- Assign to Learning Center -->
        <div class="form-group">
          <label class="form-label">Assign to Learning Center <span class="required">*</span></label>
          <select v-model="form.learningCenter" class="form-select-full" required>
            <option value="Poblacion CLC">Poblacion CLC</option>
            <option value="Naawan Central LC">Naawan Central LC</option>
            <option value="Mat-i CLC">Mat-i CLC</option>
          </select>
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

          <!-- Uploaded File Preview Item -->
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

        <!-- Create Activities Checkbox -->
        <div class="form-group checkbox-group">
          <label class="custom-checkbox">
            <input v-model="form.createActivities" type="checkbox" />
            <span class="checkmark"></span>
            <div class="checkbox-text">
              <strong>Create activities/answer sheet for this module</strong>
              <p>You can add activities after uploading.</p>
            </div>
          </label>
        </div>

        <!-- Form Actions -->
        <div class="form-footer-actions">
          <router-link to="/modules" class="btn btn-secondary">Cancel</router-link>
          <button type="submit" class="btn btn-primary" :disabled="isUploading">
            <svg v-if="isUploading" class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/>
            </svg>
            <span>{{ isUploading ? 'Uploading...' : 'Upload Module' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const fileInputRef = ref(null);
const isUploading = ref(false);

const form = reactive({
  title: 'Communication Skills Module 1',
  learningArea: 'Communication Skills',
  learningCenter: 'Poblacion CLC',
  createActivities: true,
});

const selectedFile = ref({
  name: 'Communication_Skills_Module_1.pdf',
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
    alert(`Module "${form.title}" uploaded and assigned to ${form.learningCenter} successfully!`);
    if (form.createActivities) {
      router.push('/modules/1/activities');
    } else {
      router.push('/modules');
    }
  }, 600);
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

.dropzone-icon {
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.dropzone-primary-text {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.dropzone-sub-text {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.2rem;
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

.checkbox-group {
  margin-top: 1.25rem;
  margin-bottom: 1.5rem;
}

.custom-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.custom-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  margin-top: 2px;
  cursor: pointer;
}

.checkbox-text strong {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.2;
}

.checkbox-text p {
  font-size: 0.775rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}

.form-footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.85rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

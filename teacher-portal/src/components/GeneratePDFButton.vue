<template>
  <div class="pdf-action-controls no-print print-hidden">
    <!-- Generate PDF Button -->
    <button
      type="button"
      class="btn-generate-pdf"
      :disabled="disabled || isGenerating"
      @click="handleGeneratePdf"
    >
      <span v-if="isGenerating" class="btn-spinner-white"></span>
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      <span>{{ isGenerating ? 'Generating PDF...' : buttonText }}</span>
    </button>

    <!-- Print Report Button (Optional/Secondary) -->
    <button
      v-if="showPrintButton"
      type="button"
      class="btn-print-report"
      :disabled="disabled || isGenerating"
      @click="handlePrintReport"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"/>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      <span>Print Report</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { exportReportToPdf } from '../utils/pdfExport.js';

const props = defineProps({
  targetRef: {
    type: Object,
    default: null,
  },
  targetId: {
    type: String,
    default: 'report-content',
  },
  filename: {
    type: String,
    default: 'ALS_Report.pdf',
  },
  orientation: {
    type: String,
    default: 'landscape', // 'landscape' | 'portrait'
  },
  buttonText: {
    type: String,
    default: 'Generate PDF',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  showPrintButton: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['pdf-started', 'pdf-completed', 'pdf-error']);

const isGenerating = ref(false);

async function handleGeneratePdf() {
  const target = props.targetRef || props.targetId;
  isGenerating.value = true;
  emit('pdf-started');

  try {
    await exportReportToPdf(target, {
      filename: props.filename,
      orientation: props.orientation,
    });
    emit('pdf-completed');
  } catch (err) {
    emit('pdf-error', err);
  } finally {
    isGenerating.value = false;
  }
}

function handlePrintReport() {
  window.print();
}
</script>

<style scoped>
.pdf-action-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1.75rem 0 2rem;
}

.btn-generate-pdf {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0.75rem 1.75rem;
  background-color: #2563eb;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.btn-generate-pdf:hover:not(:disabled) {
  background-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.45);
}

.btn-generate-pdf:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-print-report {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0.75rem 1.5rem;
  background-color: #ffffff;
  color: #1e293b;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-print-report:hover:not(:disabled) {
  background-color: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-spinner-white {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

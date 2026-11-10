<template>
  <div class="clc-page-container">
    <!-- Breadcrumb Navigation -->
    <nav class="breadcrumb-nav">
      <router-link to="/dashboard/clc" class="breadcrumb-link">Learning Centers</router-link>
      <span class="breadcrumb-sep">&gt;</span>
      <span class="breadcrumb-current">{{ clcName }}</span>
    </nav>

    <!-- Clean Full-Width CLC Header (No images, No background photos, No quote banners) -->
    <div class="clc-clean-header-card">
      <div class="clc-header-left">
        <div class="clc-icon-badge">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/>
            <path d="M5 21V7l8-4v18"/>
            <path d="M19 21V11l-6-4"/>
            <path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/>
          </svg>
        </div>
        <div class="clc-header-details">
          <h1 class="clc-title">{{ clcName }}</h1>
          <p class="clc-subtitle">{{ clcLevelSubtitle }}</p>
          <div class="clc-location-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{{ clcLocation }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Tabs Navigation: Strictly [ Learning Feed ] [ Upload ] [ Records ] -->
    <div class="clc-tabs-navigation">
      <button
        v-for="tab in clcTabs"
        :key="tab.id"
        type="button"
        class="clc-tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 1: LEARNING FEED (Module-Related Updates Only)            -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'feed'" class="tab-content-area">
      <!-- Feed Empty State (Strictly matching attached reference) -->
      <div v-if="modules.length === 0" class="empty-state-card">
        <div class="empty-graphic-wrapper">
          <svg width="84" height="84" viewBox="0 0 100 100" fill="none" class="empty-state-svg">
            <!-- Decorative Accent Rays -->
            <path d="M49 14V8" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M20 25L14 20" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M78 25L84 20" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M16 52H10" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M88 52H82" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>

            <!-- Document / Sheet Body -->
            <rect x="26" y="20" width="48" height="60" rx="9" fill="#f8fafc" stroke="#93c5fd" stroke-width="2.5"/>
            <!-- Text Lines on Sheet -->
            <line x1="36" y1="36" x2="64" y2="36" stroke="#bfdbfe" stroke-width="3" stroke-linecap="round"/>
            <line x1="36" y1="46" x2="58" y2="46" stroke="#bfdbfe" stroke-width="3" stroke-linecap="round"/>
            <line x1="36" y1="56" x2="50" y2="56" stroke="#bfdbfe" stroke-width="3" stroke-linecap="round"/>

            <!-- Bottom Right Plus Badge -->
            <circle cx="68" cy="70" r="14" fill="#2563eb" stroke="#ffffff" stroke-width="2.5"/>
            <path d="M68 64V76" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M62 70H74" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>

        <h3 class="empty-title">No data yet</h3>
        <p class="empty-desc">Module updates will appear here once they are created through the Upload section.</p>
      </div>

      <!-- Feed List When Modules Exist -->
      <div v-else class="learning-feed-list">
        <div
          v-for="item in modules"
          :key="item.id"
          class="feed-card-item"
          @click="openModuleView(item)"
        >
          <!-- Module Icon Column -->
          <div class="feed-icon-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>

          <!-- Feed Content -->
          <div class="feed-info-content">
            <div class="feed-badge-row">
              <span class="feed-status-badge">📚 New Module Available</span>
            </div>
            <h2 class="feed-card-title">{{ item.title }}</h2>
            <div class="feed-level-tag">{{ item.level }}</div>

            <div class="feed-meta-bottom">
              <span class="feed-author-name">Created by {{ item.author || 'Maria Santos' }}</span>
              <span class="meta-dot">&bull;</span>
              <span class="feed-date-text">{{ item.date }}</span>
            </div>
          </div>

          <!-- Redirect Arrow -->
          <div class="feed-card-arrow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 2: UPLOAD (Kept 100% UNCHANGED - 4-Step Module Wizard)     -->
    <!-- ============================================================ -->
    <div v-else-if="activeTab === 'upload'" class="tab-content-area">
      <!-- Default Landing View: Single "Create Module" -->
      <div v-if="!isCreatingModule" class="upload-landing-card">
        <div class="upload-landing-graphic">
          <div class="upload-icon-ring">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
        </div>

        <div class="upload-landing-info">
          <h2>Create &amp; Publish Learning Package</h2>
          <p>
            Create a structured instructional unit with a diagnostic Pre-Test, primary Learning Module materials (PDF, DOCX, or Image), and a mastery Post-Test.
          </p>
          <div class="upload-pipeline-preview">
            <div class="pipeline-pill">1. Module Information</div>
            <span class="pipeline-arrow">&rarr;</span>
            <div class="pipeline-pill">2. Pre-Test</div>
            <span class="pipeline-arrow">&rarr;</span>
            <div class="pipeline-pill">3. Learning Module</div>
            <span class="pipeline-arrow">&rarr;</span>
            <div class="pipeline-pill">4. Post-Test</div>
          </div>
        </div>

        <button type="button" class="btn-create-module-primary" @click="startModuleCreation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Create Module</span>
        </button>
      </div>

      <!-- Creation Wizard: 4 Sequential Steps -->
      <div v-else class="creation-wizard-card">
        <!-- Wizard Stepper Header -->
        <div class="wizard-stepper-header">
          <div
            v-for="(step, idx) in wizardSteps"
            :key="step.key"
            class="wizard-step-node"
            :class="{ active: currentStepIndex === idx, completed: currentStepIndex > idx }"
          >
            <div class="step-badge">{{ idx + 1 }}</div>
            <div class="step-text">
              <span class="step-label">Step {{ idx + 1 }}</span>
              <span class="step-title">{{ step.title }}</span>
            </div>
            <div v-if="idx < wizardSteps.length - 1" class="step-divider"></div>
          </div>
        </div>

        <!-- Wizard Body -->
        <div class="wizard-body-content">
          <!-- STEP 1: MODULE INFORMATION -->
          <div v-if="currentStepIndex === 0" class="step-form-pane">
            <div class="pane-header-info">
              <h3>Step 1: Module Information</h3>
              <p>Define the title, learning strand (stored internally), ALS level, and objectives for this module.</p>
            </div>

            <div class="form-grid-2">
              <div class="field-item">
                <label class="field-lbl">Module Title <span class="req">*</span></label>
                <input
                  v-model="newModule.title"
                  type="text"
                  class="field-input-box"
                  placeholder="e.g., Communication Skills Module 1"
                  required
                />
              </div>

              <div class="field-item">
                <label class="field-lbl">Learning Strand <span class="req">*</span></label>
                <select v-model="newModule.strand" class="field-select-box" required>
                  <option value="" disabled>Select Learning Strand</option>
                  <option v-for="s in internalStrands" :key="s.slug" :value="s.name">
                    {{ s.name }}
                  </option>
                </select>
              </div>

              <div class="field-item">
                <label class="field-lbl">Target ALS Level <span class="req">*</span></label>
                <select v-model="newModule.level" class="field-select-box" required>
                  <option v-for="lvl in assignedLevelOptions" :key="lvl" :value="lvl">
                    {{ lvl }}
                  </option>
                </select>
              </div>

              <div class="field-item">
                <label class="field-lbl">Module Code</label>
                <input
                  v-model="newModule.code"
                  type="text"
                  class="field-input-box"
                  placeholder="e.g., LS1-M01"
                />
              </div>

              <div class="field-item full-width">
                <label class="field-lbl">Description &amp; Competencies</label>
                <textarea
                  v-model="newModule.description"
                  rows="3"
                  class="field-textarea-box"
                  placeholder="Briefly state the focus competencies and learning outcomes covered in this module..."
                ></textarea>
              </div>
            </div>
          </div>

          <!-- STEP 2: PRE-TEST (Diagnostic Assessment) -->
          <div v-else-if="currentStepIndex === 1" class="step-form-pane">
            <div class="pane-header-info">
              <h3>Step 2: Pre-Test (Diagnostic Assessment)</h3>
              <p>Add multiple choice questions with choices, correct answers, and immediate feedback explanations.</p>
            </div>

            <!-- Question Builder Box -->
            <div class="question-builder-card">
              <h4>Add Pre-Test Question #{{ newModule.preTest.length + 1 }}</h4>
              <div class="field-item">
                <label class="field-lbl">Question Prompt <span class="req">*</span></label>
                <input
                  v-model="currentQuestion.prompt"
                  type="text"
                  class="field-input-box"
                  placeholder="e.g. Which of the following describes effective active listening?"
                />
              </div>

              <div class="choices-builder-grid">
                <div
                  v-for="(choice, cIdx) in currentQuestion.choices"
                  :key="cIdx"
                  class="choice-input-row"
                >
                  <label class="radio-choice-label">
                    <input
                      type="radio"
                      :name="'correct-choice-pre'"
                      :value="cIdx"
                      v-model="currentQuestion.correctAnswer"
                    />
                    <span class="choice-tag">{{ choiceLetters[cIdx] }}</span>
                  </label>
                  <input
                    v-model="currentQuestion.choices[cIdx]"
                    type="text"
                    class="field-input-box choice-input"
                    :placeholder="`Option ${choiceLetters[cIdx]} text`"
                  />
                </div>
              </div>

              <div class="field-item">
                <label class="field-lbl">Explanation for Immediate Feedback</label>
                <input
                  v-model="currentQuestion.explanation"
                  type="text"
                  class="field-input-box"
                  placeholder="Explain why this answer is correct to support learner review..."
                />
              </div>

              <div class="builder-action-row">
                <button
                  type="button"
                  class="btn-outline-action"
                  @click="addQuestionToModule('preTest')"
                >
                  + Add Question to Pre-Test
                </button>
              </div>
            </div>

            <!-- Pre-Test Questions Summary List -->
            <div v-if="newModule.preTest.length > 0" class="questions-added-list">
              <h4>Configured Pre-Test Questions ({{ newModule.preTest.length }})</h4>
              <div
                v-for="(q, qIdx) in newModule.preTest"
                :key="qIdx"
                class="added-question-card"
              >
                <div class="q-card-header">
                  <span class="q-card-num">Q{{ qIdx + 1 }}.</span>
                  <span class="q-card-prompt">{{ q.prompt }}</span>
                  <button
                    type="button"
                    class="btn-remove-q"
                    @click="removeQuestion('preTest', qIdx)"
                    title="Remove question"
                  >
                    &times;
                  </button>
                </div>
                <div class="q-card-choices">
                  <span
                    v-for="(c, cIdx) in q.choices"
                    :key="cIdx"
                    class="choice-preview-pill"
                    :class="{ 'is-correct': q.correctAnswer === cIdx }"
                  >
                    {{ choiceLetters[cIdx] }}: {{ c }}
                  </span>
                </div>
                <p v-if="q.explanation" class="q-card-explanation">
                  <strong>Feedback Note:</strong> {{ q.explanation }}
                </p>
              </div>
            </div>
          </div>

          <!-- STEP 3: LEARNING MODULE (PDF / DOCX / Image Upload) -->
          <div v-else-if="currentStepIndex === 2" class="step-form-pane">
            <div class="pane-header-info">
              <h3>Step 3: Learning Module Files</h3>
              <p>Upload your instructional material file (PDF, DOCX, or high-resolution Image package).</p>
            </div>

            <div
              class="dropzone-box"
              :class="{ 'has-file': newModule.uploadedFile }"
              @dragover.prevent
              @drop.prevent="handleFileDrop"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                style="display: none;"
                @change="handleFileInputChange"
              />

              <div v-if="!newModule.uploadedFile" class="dropzone-empty-state" @click="triggerFileInput">
                <div class="upload-icon-circle">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p class="dropzone-title">Click to upload or drag &amp; drop file here</p>
                <p class="dropzone-types">Supported Formats: PDF, DOCX, or Image (PNG, JPG) up to 25MB</p>
              </div>

              <div v-else class="file-attached-preview">
                <div class="file-meta-icon" :class="`type-${newModule.fileType.toLowerCase()}`">
                  {{ newModule.fileType }}
                </div>
                <div class="file-meta-info">
                  <span class="file-meta-name">{{ newModule.fileName }}</span>
                  <span class="file-meta-size">{{ newModule.fileSize }} &bull; Ready to publish</span>
                </div>
                <button type="button" class="btn-replace-file" @click="triggerFileInput">
                  Replace File
                </button>
              </div>
            </div>

            <div class="field-item" style="margin-top: 1.5rem;">
              <label class="field-lbl">Teacher Reading Instructions</label>
              <p class="field-helper-text">
                Provide clear instructions for learners on how to read the module and complete its activities. You may edit or personalize the suggested instructions below.
              </p>
              <textarea
                v-model="newModule.learningNotes"
                rows="3"
                class="field-textarea-box"
                placeholder="Instructions for the learner (e.g., Read Sections 1 through 3 before attempting Post-Test activities)..."
              ></textarea>
            </div>
          </div>

          <!-- STEP 4: POST-TEST (Mastery Evaluation) -->
          <div v-else-if="currentStepIndex === 3" class="step-form-pane">
            <div class="pane-header-info">
              <h3>Step 4: Post-Test (Mastery Assessment)</h3>
              <p>Add multiple choice questions to evaluate learner mastery after completing the module.</p>
            </div>

            <!-- Post-Test Builder -->
            <div class="question-builder-card">
              <div class="builder-top-row">
                <h4>Add Post-Test Question #{{ newModule.postTest.length + 1 }}</h4>
                <button
                  v-if="newModule.preTest.length > 0"
                  type="button"
                  class="btn-copy-pretest"
                  @click="copyQuestionsFromPreTest"
                >
                  &darr; Copy Questions from Pre-Test
                </button>
              </div>

              <div class="field-item">
                <label class="field-lbl">Question Prompt <span class="req">*</span></label>
                <input
                  v-model="currentQuestion.prompt"
                  type="text"
                  class="field-input-box"
                  placeholder="e.g. In which situation is an official written memo preferred?"
                />
              </div>

              <div class="choices-builder-grid">
                <div
                  v-for="(choice, cIdx) in currentQuestion.choices"
                  :key="cIdx"
                  class="choice-input-row"
                >
                  <label class="radio-choice-label">
                    <input
                      type="radio"
                      :name="'correct-choice-post'"
                      :value="cIdx"
                      v-model="currentQuestion.correctAnswer"
                    />
                    <span class="choice-tag">{{ choiceLetters[cIdx] }}</span>
                  </label>
                  <input
                    v-model="currentQuestion.choices[cIdx]"
                    type="text"
                    class="field-input-box choice-input"
                    :placeholder="`Option ${choiceLetters[cIdx]} text`"
                  />
                </div>
              </div>

              <div class="field-item">
                <label class="field-lbl">Explanation for Immediate Feedback</label>
                <input
                  v-model="currentQuestion.explanation"
                  type="text"
                  class="field-input-box"
                  placeholder="Provide pedagogical rationale and answer key justification..."
                />
              </div>

              <div class="builder-action-row">
                <button
                  type="button"
                  class="btn-outline-action"
                  @click="addQuestionToModule('postTest')"
                >
                  + Add Question to Post-Test
                </button>
              </div>
            </div>

            <!-- Post-Test Questions Summary List -->
            <div v-if="newModule.postTest.length > 0" class="questions-added-list">
              <h4>Configured Post-Test Questions ({{ newModule.postTest.length }})</h4>
              <div
                v-for="(q, qIdx) in newModule.postTest"
                :key="qIdx"
                class="added-question-card"
              >
                <div class="q-card-header">
                  <span class="q-card-num">Q{{ qIdx + 1 }}.</span>
                  <span class="q-card-prompt">{{ q.prompt }}</span>
                  <button
                    type="button"
                    class="btn-remove-q"
                    @click="removeQuestion('postTest', qIdx)"
                    title="Remove question"
                  >
                    &times;
                  </button>
                </div>
                <div class="q-card-choices">
                  <span
                    v-for="(c, cIdx) in q.choices"
                    :key="cIdx"
                    class="choice-preview-pill"
                    :class="{ 'is-correct': q.correctAnswer === cIdx }"
                  >
                    {{ choiceLetters[cIdx] }}: {{ c }}
                  </span>
                </div>
                <p v-if="q.explanation" class="q-card-explanation">
                  <strong>Feedback Note:</strong> {{ q.explanation }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Wizard Navigation Footer -->
        <div class="wizard-footer-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="prevStep"
          >
            {{ currentStepIndex === 0 ? 'Cancel' : '&larr; Back' }}
          </button>

          <div class="wizard-right-btns">
            <button
              v-if="currentStepIndex < wizardSteps.length - 1"
              type="button"
              class="btn btn-primary"
              @click="nextStep"
            >
              Next: {{ wizardSteps[currentStepIndex + 1].title }} &rarr;
            </button>
            <button
              v-else
              type="button"
              class="btn btn-publish-success"
              @click="publishCompleteModule"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Save &amp; Publish Module</span>
            </button>
          </div>
        </div>
      </div>
    </div>



  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeacherSession } from '../composables/useTeacherSession.js';
import { useClcData } from '../composables/useClcData.js';

const route = useRoute();
const router = useRouter();
const { assignedCenters, teacherName, assignedProgramLevel, assignedLevelOptions } = useTeacherSession();

watch(assignedLevelOptions, (newOpts) => {
  if (!newModule.level || !newOpts.includes(newModule.level)) {
    newModule.level = newOpts[0] || '';
  }
}, { immediate: true });

// Selected Learning Center resolution
const selectedCenterObj = computed(() => {
  const slugParam = route.params.clcId;
  if (!slugParam) return assignedCenters.value[0] || null;

  return (
    assignedCenters.value.find(
      (c) =>
        c.slug === slugParam ||
        String(c.id) === slugParam ||
        (c.name &&
          c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(slugParam.toLowerCase()))
    ) ||
    assignedCenters.value[0] ||
    null
  );
});

const clcSlug = computed(() => selectedCenterObj.value?.slug || route.params.clcId || 'poblacion-clc');
const clcName = computed(() => selectedCenterObj.value?.name || 'Poblacion CLC');
const clcLocation = computed(
  () => selectedCenterObj.value?.location || 'Poblacion, Naawan, Misamis Oriental'
);

const clcLevelSubtitle = computed(() => {
  const level = assignedProgramLevel.value;
  if (level === 'A&E Elementary') return 'A&E Elementary';
  if (level === 'A&E Junior' || level === 'A&E Junior High') return 'A&E Junior High';
  return 'A&E Elementary and A&E Junior High';
});

// 2 tabs: Learning Feed, Upload (Records moved to standalone sidebar page)
const activeTab = ref('feed');
const clcTabs = [
  { id: 'feed', label: 'Learning Feed' },
  { id: 'upload', label: 'Upload' },
];

function switchTab(tabId) {
  activeTab.value = tabId;
}

// Reactive CLC Data composable (stores modules per CLC)
const { modules, publishModule } = useClcData(clcSlug);

// ============================================================
// TAB 1: LEARNING FEED BEHAVIOR
// ============================================================
function openModuleView(item) {
  router.push(`/dashboard/clc/${clcSlug.value}/module/${item.id}`);
}

// ============================================================
// TAB 2: UPLOAD & MODULE CREATION FLOW (100% UNCHANGED)
// Steps: 1: Module Information, 2: Pre-Test, 3: Learning Module, 4: Post-Test
// ============================================================
const isCreatingModule = ref(false);
const currentStepIndex = ref(0);

const wizardSteps = [
  { key: 'info', title: 'Module Information' },
  { key: 'preTest', title: 'Pre-Test' },
  { key: 'material', title: 'Learning Module' },
  { key: 'postTest', title: 'Post-Test' },
];

const choiceLetters = ['A', 'B', 'C', 'D'];

// Internal Strands list for the module information dropdown (stored internally only)
const internalStrands = [
  { slug: 'communication-skills', name: '1. Communication Skills (English)' },
  { slug: 'scientific-literacy', name: '2. Scientific Literacy and Critical Thinking' },
  { slug: 'mathematical-skills', name: '3. Mathematical and Problem Solving Skills' },
  { slug: 'life-career-skills', name: '4. Life and Career Skills' },
  { slug: 'digital-literacy', name: '5. Digital Literacy' },
  { slug: 'self-society', name: '6. Understanding the Self and the Society' },
  { slug: 'entrepreneurship', name: '7. Entrepreneurship' },
];

const DEFAULT_READING_INSTRUCTIONS = 'Read the module carefully and answer the activities on paper. Keep your written answers because you will upload them after completing the Post-Test.';

const newModule = reactive({
  title: '',
  strand: '1. Communication Skills (English)',
  level: 'A&E Elementary',
  code: '',
  description: '',
  preTest: [
    {
      prompt: 'Which of the following describes effective active listening?',
      choices: [
        'Interrupting to give suggestions immediately',
        'Paying full attention and confirming understanding',
        'Looking away while the speaker talks',
        'Preparing an argument while listening',
      ],
      correctAnswer: 1,
      explanation: 'Active listening requires full engagement with the speaker and seeking clarification before responding.',
    },
  ],
  uploadedFile: null,
  fileName: 'LS1_Oral_Communication_Module.pdf',
  fileType: 'PDF',
  fileSize: '3.4 MB',
  learningNotes: DEFAULT_READING_INSTRUCTIONS,
  postTest: [
    {
      prompt: 'In a workplace setting, what is the most appropriate way to resolve a misunderstanding?',
      choices: [
        'Ignore the issue and wait for it to clear up',
        'Request a respectful, private dialogue to clarify intentions',
        'Send an angry message on group chat',
        'Report immediately without talking first',
      ],
      correctAnswer: 1,
      explanation: 'Constructive dialogue in private preserves relationships and addresses core misunderstandings directly.',
    },
  ],
});

const currentQuestion = reactive({
  prompt: '',
  choices: ['', '', '', ''],
  correctAnswer: 0,
  explanation: '',
});

const fileInputRef = ref(null);

function startModuleCreation() {
  isCreatingModule.value = true;
  currentStepIndex.value = 0;
}

function nextStep() {
  if (currentStepIndex.value < wizardSteps.length - 1) {
    currentStepIndex.value++;
  }
}

function prevStep() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
  } else {
    isCreatingModule.value = false;
  }
}

function addQuestionToModule(targetKey) {
  if (!currentQuestion.prompt.trim()) {
    alert('Please enter a question prompt.');
    return;
  }

  const newQ = {
    prompt: currentQuestion.prompt.trim(),
    choices: [...currentQuestion.choices],
    correctAnswer: currentQuestion.correctAnswer,
    explanation: currentQuestion.explanation.trim(),
  };

  newModule[targetKey].push(newQ);

  // Reset current question
  currentQuestion.prompt = '';
  currentQuestion.choices = ['', '', '', ''];
  currentQuestion.correctAnswer = 0;
  currentQuestion.explanation = '';
}

function removeQuestion(targetKey, index) {
  newModule[targetKey].splice(index, 1);
}

function copyQuestionsFromPreTest() {
  newModule.postTest = JSON.parse(JSON.stringify(newModule.preTest));
}

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function handleFileInputChange(e) {
  const file = e.target.files?.[0];
  if (file) {
    processSelectedFile(file);
  }
}

function handleFileDrop(e) {
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    processSelectedFile(file);
  }
}

function processSelectedFile(file) {
  newModule.uploadedFile = file;
  newModule.fileName = file.name;
  newModule.fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
  if (['PNG', 'JPG', 'JPEG'].includes(ext)) {
    newModule.fileType = 'IMAGE';
  } else if (['DOC', 'DOCX'].includes(ext)) {
    newModule.fileType = 'DOCX';
  } else {
    newModule.fileType = 'PDF';
  }
}

function publishCompleteModule() {
  if (!newModule.title.trim()) {
    alert('Please enter a module title.');
    currentStepIndex.value = 0;
    return;
  }

  // Publish to reactive CLC modules store (automatically creates feed item)
  publishModule({
    title: newModule.title.trim(),
    strand: newModule.strand,
    level: newModule.level,
    code: newModule.code,
    description: newModule.description,
    preTest: [...newModule.preTest],
    postTest: [...newModule.postTest],
    uploadedFile: newModule.uploadedFile,
    fileName: newModule.fileName,
    fileType: newModule.fileType,
    fileSize: newModule.fileSize,
    learningNotes: newModule.learningNotes,
    author: teacherName.value || 'Maria Santos',
  });

  isCreatingModule.value = false;
  activeTab.value = 'feed';
  alert('Module published successfully! It is now visible in the Learning Feed.');
}
</script>

<style scoped>
/* Full-Width Workspace Layout */
.clc-page-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0 0 3rem;
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 1.25rem;
}

.breadcrumb-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-sep {
  color: #94a3b8;
}

.breadcrumb-current {
  color: #1e293b;
  font-weight: 600;
}

/* ============================================================ */
/* CLC Header: Clean Wide Card, Full Width, Left Aligned        */
/* No images, No background photos, No quotes                   */
/* ============================================================ */
.clc-clean-header-card {
  width: 100%;
  background: #f0f7ff;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  margin-bottom: 1.75rem;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.04);
}

.clc-header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.clc-icon-badge {
  width: 64px;
  height: 64px;
  background: #ffffff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
  border: 1px solid #dbeafe;
  flex-shrink: 0;
}

.clc-header-details {
  display: flex;
  flex-direction: column;
}

.clc-title {
  font-size: 1.55rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
  margin: 0;
  letter-spacing: -0.02em;
}

.clc-subtitle {
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
  margin: 0.3rem 0 0.35rem 0;
}

.clc-location-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #64748b;
}

/* ============================================================ */
/* Navigation Tabs: [ Learning Feed ] [ Upload ] [ Records ]    */
/* ============================================================ */
.clc-tabs-navigation {
  display: flex;
  align-items: center;
  gap: 2rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1.75rem;
  padding-left: 0.25rem;
}

.clc-tab-btn {
  background: transparent;
  border: none;
  padding: 0.75rem 0.5rem 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  position: relative;
  transition: color 0.15s ease;
}

.clc-tab-btn:hover {
  color: #1e293b;
}

.clc-tab-btn.active {
  color: #2563eb;
  font-weight: 700;
}

.clc-tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: #2563eb;
  border-radius: 3px 3px 0 0;
}

/* ============================================================ */
/* Tab Content Container                                        */
/* ============================================================ */
.tab-content-area {
  width: 100%;
}

/* Empty State Card (Strictly Matching Visual Reference) */
.empty-state-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 4.5rem 2rem;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.empty-graphic-wrapper {
  margin-bottom: 1.25rem;
}

.empty-state-svg {
  display: block;
}

.empty-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #334155;
  margin: 0 0 0.5rem 0;
}

.empty-desc {
  font-size: 0.9rem;
  color: #64748b;
  max-width: 440px;
  line-height: 1.5;
  margin: 0;
}

/* ============================================================ */
/* TAB 1: LEARNING FEED LIST                                    */
/* Format:                                                      */
/* 📚 New Module Available                                      */
/* Communication Skills Module 1                                */
/* A&E Elementary                                               */
/* Created by Maria Santos                                      */
/* September 20, 2026                                           */
/* ============================================================ */
.learning-feed-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feed-card-item {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.35rem 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.feed-card-item:hover {
  border-color: #93c5fd;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.08);
}

.feed-icon-box {
  width: 50px;
  height: 50px;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed-info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.feed-badge-row {
  margin-bottom: 0.35rem;
}

.feed-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #1d4ed8;
  background: #eff6ff;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}

.feed-card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
}

.feed-level-tag {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
}

.feed-meta-bottom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: #64748b;
}

.feed-author-name {
  font-weight: 500;
  color: #334155;
}

.meta-dot {
  color: #cbd5e1;
}

.feed-date-text {
  color: #64748b;
}

.feed-card-arrow {
  color: #94a3b8;
  transition: transform 0.15s ease, color 0.15s ease;
}

.feed-card-item:hover .feed-card-arrow {
  color: #2563eb;
  transform: translateX(4px);
}

/* ============================================================ */
/* TAB 2: UPLOAD (Kept 100% UNCHANGED)                          */
/* ============================================================ */
.upload-landing-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 3.5rem 2.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.upload-landing-graphic {
  margin-bottom: 1.5rem;
}

.upload-icon-ring {
  width: 76px;
  height: 76px;
  background: #eff6ff;
  border: 2px dashed #93c5fd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
}

.upload-landing-info h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.65rem 0;
}

.upload-landing-info p {
  color: #64748b;
  max-width: 580px;
  margin: 0 auto 1.75rem;
  font-size: 0.95rem;
  line-height: 1.55;
}

.upload-pipeline-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.pipeline-pill {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 0.45rem 0.85rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
}

.pipeline-arrow {
  color: #94a3b8;
  font-weight: bold;
}

.btn-create-module-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.85rem 1.75rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.btn-create-module-primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

/* Wizard */
.creation-wizard-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.wizard-stepper-header {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.75rem;
  overflow-x: auto;
}

.wizard-step-node {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 170px;
  opacity: 0.55;
  transition: opacity 0.2s;
}

.wizard-step-node.active,
.wizard-step-node.completed {
  opacity: 1;
}

.step-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #cbd5e1;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.wizard-step-node.active .step-badge {
  background: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
}

.wizard-step-node.completed .step-badge {
  background: #16a34a;
}

.step-text {
  display: flex;
  flex-direction: column;
}

.step-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  font-weight: 700;
  color: #64748b;
}

.step-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f172a;
}

.step-divider {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0 0.85rem;
}

.wizard-body-content {
  padding: 2rem;
}

.pane-header-info {
  margin-bottom: 1.75rem;
}

.pane-header-info h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.pane-header-info p {
  color: #64748b;
  font-size: 0.88rem;
  margin: 0;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.field-item {
  display: flex;
  flex-direction: column;
}

.field-item.full-width {
  grid-column: 1 / -1;
}

.field-lbl {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

.field-helper-text {
  font-size: 0.8rem;
  color: #64748b;
  margin: -0.15rem 0 0.45rem 0;
  line-height: 1.4;
}

.req {
  color: #ef4444;
}

.field-input-box,
.field-select-box,
.field-textarea-box {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  font-size: 0.9rem;
  outline: none;
  background: #ffffff;
  transition: border-color 0.15s ease;
}

.field-input-box:focus,
.field-select-box:focus,
.field-textarea-box:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* Question Builder */
.question-builder-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.75rem;
}

.builder-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-builder-card h4,
.builder-top-row h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.btn-copy-pretest {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
}

.btn-copy-pretest:hover {
  background: #eff6ff;
  border-color: #2563eb;
}

.choices-builder-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  margin: 1rem 0;
}

.choice-input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.radio-choice-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}

.choice-tag {
  font-weight: 700;
  color: #475569;
  font-size: 0.88rem;
}

.choice-input {
  flex: 1;
}

.builder-action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.25rem;
}

.btn-outline-action {
  background: #ffffff;
  border: 1px solid #2563eb;
  color: #2563eb;
  padding: 0.55rem 1.15rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-outline-action:hover {
  background: #eff6ff;
}

.questions-added-list h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.85rem;
}

.added-question-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 0.85rem;
}

.q-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.q-card-num {
  font-weight: 700;
  color: #2563eb;
}

.q-card-prompt {
  font-weight: 600;
  color: #0f172a;
  flex: 1;
}

.btn-remove-q {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 1.4rem;
  cursor: pointer;
}

.q-card-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.choice-preview-pill {
  background: #f1f5f9;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  font-size: 0.82rem;
  color: #475569;
}

.choice-preview-pill.is-correct {
  background: #dcfce7;
  color: #15803d;
  font-weight: 700;
}

.q-card-explanation {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

/* Dropzone */
.dropzone-box {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  padding: 2.5rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.dropzone-box:hover,
.dropzone-box.has-file {
  border-color: #2563eb;
  background: #eff6ff;
}

.upload-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #ffffff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}

.dropzone-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.35rem 0;
}

.dropzone-types {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.file-attached-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  max-width: 540px;
  margin: 0 auto;
}

.file-meta-icon {
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.82rem;
  background: #eff6ff;
  color: #2563eb;
}

.file-meta-info {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
}

.file-meta-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9rem;
}

.file-meta-size {
  font-size: 0.78rem;
  color: #64748b;
}

.btn-replace-file {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.wizard-footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.wizard-right-btns {
  display: flex;
  gap: 0.75rem;
}

.btn-publish-success {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #16a34a;
  color: #ffffff;
  border: none;
  padding: 0.65rem 1.35rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.btn-publish-success:hover {
  background: #15803d;
}

/* ============================================================ */
/* TAB 3: RECORDS TABLE                                         */
/* ============================================================ */
.records-table-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.table-card-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.35rem 1.75rem;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 1rem;
}

.records-card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.sub-text {
  font-size: 0.85rem;
  color: #64748b;
}

.records-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.records-search-input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.5rem 0.85rem;
  font-size: 0.85rem;
  outline: none;
  width: 260px;
}

.records-search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background-color: #f8fafc;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.88rem;
  color: #334155;
  vertical-align: middle;
}

.col-num {
  color: #94a3b8;
  font-weight: 600;
}

.col-learner-name {
  font-weight: 700;
  color: #0f172a;
}

.col-lrn-text {
  font-family: monospace;
  color: #64748b;
}

.col-mod-title {
  font-weight: 600;
  color: #1e293b;
}

.score-number-val {
  font-weight: 700;
  color: #475569;
}

.score-number-val.post-val {
  color: #16a34a;
}

.status-badge-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.dot-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-mastered {
  background-color: #f0fdf4;
  color: #16a34a;
}
.status-mastered .dot-indicator {
  background-color: #22c55e;
}

.status-in-progress {
  background-color: #fffbeb;
  color: #d97706;
}
.status-in-progress .dot-indicator {
  background-color: #f59e0b;
}

.status-not-mastered {
  background-color: #fef2f2;
  color: #dc2626;
}
.status-not-mastered .dot-indicator {
  background-color: #ef4444;
}

.status-not-started {
  background-color: #f1f5f9;
  color: #64748b;
}
.status-not-started .dot-indicator {
  background-color: #94a3b8;
}

.record-actions-wrap {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.4rem;
}

.record-icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.record-icon-btn.btn-view-act {
  background: var(--action-view-bg, #EFF6FF) !important;
  color: var(--action-view-color, #4169A8) !important;
  border: 1px solid var(--action-view-border, #DCE7F6) !important;
}

.record-icon-btn.btn-view-act:hover {
  background: var(--action-view-hover-bg, #E0EEFE) !important;
  border-color: var(--action-view-hover-border, #B9D3F4) !important;
  color: var(--action-view-hover-color, #315488) !important;
}

.record-icon-btn.btn-view-act:focus-visible {
  outline: 2px solid var(--action-view-color, #4169A8) !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 3px var(--action-view-focus-ring, rgba(65, 105, 168, 0.35)) !important;
}

.record-icon-btn.btn-edit-act {
  background: var(--action-edit-bg, #FFF7E8) !important;
  color: var(--action-edit-color, #946B32) !important;
  border: 1px solid var(--action-edit-border, #F6E6CE) !important;
}

.record-icon-btn.btn-edit-act:hover {
  background: var(--action-edit-hover-bg, #FDEFCF) !important;
  border-color: var(--action-edit-hover-border, #EACD9E) !important;
  color: var(--action-edit-hover-color, #7A5422) !important;
}

.record-icon-btn.btn-edit-act:focus-visible {
  outline: 2px solid var(--action-edit-color, #946B32) !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 3px var(--action-edit-focus-ring, rgba(148, 107, 50, 0.35)) !important;
}

.record-icon-btn.btn-delete-act {
  background: var(--action-delete-bg, #FFF1F1) !important;
  color: var(--action-delete-color, #B65B60) !important;
  border: 1px solid var(--action-delete-border, #F9D6D8) !important;
}

.record-icon-btn.btn-delete-act:hover {
  background: var(--action-delete-hover-bg, #FDE4E4) !important;
  border-color: var(--action-delete-hover-border, #F2B8BA) !important;
  color: var(--action-delete-hover-color, #994247) !important;
}

.record-icon-btn.btn-delete-act:focus-visible {
  outline: 2px solid var(--action-delete-color, #B65B60) !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 3px var(--action-delete-focus-ring, rgba(182, 91, 96, 0.35)) !important;
}

.no-records-msg {
  text-align: center;
  padding: 2.5rem !important;
  color: #94a3b8;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 999;
  padding: 1.5rem 1rem;
  overflow-y: auto;
}

.modal-box {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  margin: 1.5rem auto 2.5rem;
  position: relative;
}

.record-details-modal,
.record-edit-modal {
  max-width: 620px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal-sub-text {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.record-modal-body,
.record-edit-form {
  padding: 1.25rem 1.75rem;
}

.modal-section-card {
  margin-bottom: 1.35rem;
}

.section-h4 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.info-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  background: #f8fafc;
  padding: 1rem 1.25rem;
  border-radius: 10px;
}

.summary-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.summary-value {
  font-size: 0.92rem;
  color: #0f172a;
}

.scores-highlight-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.score-card-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
}

.score-card-lbl {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.score-card-num {
  font-size: 1.5rem;
  font-weight: 800;
}

.score-card-num.pre {
  color: #475569;
}

.score-card-num.post {
  color: #16a34a;
}

.output-preview-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1.15rem;
}

.output-preview-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.output-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.output-sub {
  font-size: 0.78rem;
  color: #64748b;
}

.empty-output-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 1.25rem;
  text-align: center;
  border-radius: 10px;
  color: #94a3b8;
  font-size: 0.88rem;
}

.remarks-display-bubble {
  background: #eff6ff;
  border-left: 3.5px solid #2563eb;
  padding: 0.85rem 1.15rem;
  border-radius: 0 8px 8px 0;
  font-size: 0.9rem;
  color: #1e3a8a;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 0.95rem;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

.score-input-split {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-num-in {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-weight: 600;
}

.slash-div {
  font-size: 1.15rem;
  font-weight: 700;
  color: #94a3b8;
  user-select: none;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.custom-select-arrow {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.85rem center;
  background-size: 1.1rem;
  padding-right: 2.25rem;
  cursor: pointer;
}

.date-input {
  color: #334155;
  cursor: pointer;
}

.assessment-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.assessment-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  border: 1.5px solid transparent;
}

.assessment-card.card-mastered {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
}

.assessment-card.card-mastered:hover {
  border-color: #86efac;
}

.assessment-card.card-mastered.is-selected {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
}

.assessment-card.card-not-mastered {
  background-color: #fef2f2;
  border-color: #fecaca;
}

.assessment-card.card-not-mastered:hover {
  border-color: #fca5a5;
}

.assessment-card.card-not-mastered.is-selected {
  border-color: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
}

.assessment-radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.15s ease;
}

.card-mastered .assessment-radio-circle {
  border: 2px solid #22c55e;
}

.card-not-mastered .assessment-radio-circle {
  border: 2px solid #ef4444;
}

.assessment-radio-circle .radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.card-mastered .assessment-radio-circle .radio-dot {
  background-color: #16a34a;
}

.card-not-mastered .assessment-radio-circle .radio-dot {
  background-color: #dc2626;
}

.assessment-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.assessment-card-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0f172a;
}

.assessment-card-desc {
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.35;
}

.activities-display-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.85rem 1.15rem;
  font-size: 0.9rem;
  color: #334155;
  white-space: pre-wrap;
  line-height: 1.5;
}

.modal-actions-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.75rem 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background: #1d4ed8;
}

/* ============================================================ */
/* TAB 3: RECORDS TOP ACTION BAR                                */
/* ============================================================ */
.records-top-action-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1.25rem;
  width: 100%;
}

.btn-add-record {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #2563eb;
  color: #ffffff;
  border: 1px solid #2563eb;
  padding: 0.55rem 1.15rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.18);
  transition: all 0.15s ease-in-out;
  white-space: nowrap;
}

.btn-add-record:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
}

.btn-add-record:active {
  transform: translateY(0);
}

.btn-add-record svg {
  flex-shrink: 0;
}

.req {
  color: #ef4444;
}

@media (max-width: 640px) {
  .records-top-action-bar {
    justify-content: stretch;
    margin-bottom: 1rem;
  }

  .btn-add-record {
    width: 100%;
    justify-content: center;
  }
}
</style>

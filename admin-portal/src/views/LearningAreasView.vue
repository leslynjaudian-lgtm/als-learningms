<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Learning Areas</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>Learning Areas</h1>
        <p>Manage ALS learning strands and subject areas.</p>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Learning Strand</th>
              <th>Description</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(area, idx) in areas" :key="area.name">
              <td>{{ idx + 1 }}</td>
              <td><span class="badge badge-primary">{{ area.code }}</span></td>
              <td style="font-weight: 600;">{{ area.name }}</td>
              <td>{{ area.description }}</td>
              <td>
                <span class="badge badge-success">Active</span>
              </td>
              <td class="td-actions">
                <div class="cell-actions">
                  <button class="btn-icon btn-icon-danger" title="Delete Learning Area" @click="openDeleteModal(area)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      title="Delete Learning Area"
      :item-name="deletingArea?.name || ''"
      :loading="deleting"
      @confirm="confirmDeleteArea"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';

const showDeleteModal = ref(false);
const deletingArea = ref(null);
const deleting = ref(false);

function openDeleteModal(area) {
  deletingArea.value = area;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  if (deleting.value) return;
  showDeleteModal.value = false;
  deletingArea.value = null;
}

function confirmDeleteArea() {
  if (!deletingArea.value) return;
  deleting.value = true;
  areas.value = areas.value.filter((a) => a.name !== deletingArea.value.name);
  showDeleteModal.value = false;
  deletingArea.value = null;
  deleting.value = false;
}

const areas = ref([
  {
    code: 'LS 1',
    name: 'Communication Skills (English)',
    description: 'Developing English communication skills for daily life and work.',
  },
  {
    code: 'LS 1',
    name: 'Communication Skills (Filipino)',
    description: 'Developing Filipino communication skills for daily life and work.',
  },
  {
    code: 'LS 2',
    name: 'Scientific & Critical Thinking Skills',
    description: 'Building scientific literacy and critical thinking abilities.',
  },
  {
    code: 'LS 3',
    name: 'Mathematical & Problem Solving Skills',
    description: 'Developing mathematical concepts and problem-solving skills.',
  },
  {
    code: 'LS 4',
    name: 'Life & Career Skills',
    description: 'Enhancing employability and livelihood capabilities.',
  },
  {
    code: 'LS 5',
    name: 'Understanding Self & Society',
    description: 'Understanding Philippine history, government, and civic responsibilities.',
  },
  {
    code: 'LS 6',
    name: 'Digital Citizenship',
    description: 'Developing digital literacy and responsible use of technology.',
  },
]);
</script>

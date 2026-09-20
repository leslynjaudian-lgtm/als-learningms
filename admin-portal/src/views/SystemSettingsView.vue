<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">System Settings</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header-row">
      <div class="page-title-group">
        <h1>System Settings</h1>
        <p>Configure general settings for the ALS LMS.</p>
      </div>
    </div>

    <!-- Settings Sections -->
    <div class="settings-grid">
      <!-- General Settings -->
      <div class="card-box">
        <h3 class="card-box-header">General Information</h3>
        <div class="settings-form">
          <div class="form-group">
            <label class="form-label">System Name</label>
            <input
              v-model="settings.systemName"
              type="text"
              class="form-input"
              placeholder="ALS Learning Management System"
            />
          </div>
          <div class="form-group">
            <label class="form-label">District</label>
            <input
              v-model="settings.district"
              type="text"
              class="form-input"
              placeholder="Naawan District"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Division</label>
            <input
              v-model="settings.division"
              type="text"
              class="form-input"
              placeholder="Division of Misamis Oriental"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Region</label>
            <input
              v-model="settings.region"
              type="text"
              class="form-input"
              placeholder="Region X - Northern Mindanao"
            />
          </div>
        </div>
      </div>

      <!-- Academic Period -->
      <div class="card-box">
        <h3 class="card-box-header">Academic Period</h3>
        <div class="settings-form">
          <div class="form-group">
            <label class="form-label">Current School Year</label>
            <input
              v-model="settings.schoolYear"
              type="text"
              class="form-input"
              placeholder="2026-2027"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Program Cycle</label>
            <select v-model="settings.programCycle" class="form-select-full">
              <option value="" disabled>Select cycle</option>
              <option value="1st Cycle">1st Cycle</option>
              <option value="2nd Cycle">2nd Cycle</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Action -->
    <div class="settings-action-bar">
      <button class="btn btn-primary" @click="saveSettings">
        Save Settings
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const settings = reactive({
  systemName: 'ALS Learning Management System',
  district: 'Naawan District',
  division: 'Division of Misamis Oriental',
  region: 'Region X - Northern Mindanao',
  schoolYear: '',
  programCycle: '',
});

function saveSettings() {
  alert('Settings saved successfully.');
}
</script>

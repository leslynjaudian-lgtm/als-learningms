<template>
  <div class="help-page">
    <div class="help-header">
      <button type="button" class="help-back-btn" @click="$router.back()" aria-label="Balik">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      </button>
      <div>
        <h1 class="help-title">Tabang / Giya</h1>
        <p class="help-subtitle">Unsaon paggamit sa ALS LMS Learner Portal</p>
      </div>
    </div>

    <div class="help-steps-list">
      <div class="help-card">
        <div class="help-step-num">1</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Pilia ang Module</h2>
          <p class="help-step-desc">
            Adto sa <strong>Akong mga Module</strong> o pindota ang <strong>Padayon sa Module</strong> sa Home.
            Pindota ang <strong>Sugdi</strong> kung bag-o pa, o <strong>Padayon</strong> kung nasugdan na.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">2</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Tubaga ang Pre-Test</h2>
          <p class="help-step-desc">
            Sa dili pa mobasa sa module, tubaga una ang <strong>Pre-Test</strong> aron maablihan ang sunod nga lakang.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">3</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Basaha ang Learning Module</h2>
          <p class="help-step-desc">
            Basaha ang PDF sa module. Mahimo nimong gamiton ang <strong>Long Strip</strong> o <strong>Wide Strip</strong> nga paagi sa pagbasa.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">4</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Post-Test ug Activity</h2>
          <p class="help-step-desc">
            Human sa pagbasa, tubaga ang <strong>Post-Test</strong> ug i-submit ang imong <strong>Activity</strong>.
          </p>
        </div>
      </div>

      <div class="help-card help-card-teacher">
        <div class="help-teacher-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="help-step-body">
          <h2 class="help-step-title">Nagkinahanglan pa ug tabang?</h2>
          <p class="help-step-desc">
            Kontaka o pangutana sa imong <strong>ALS Teacher</strong> sa inyong Community Learning Center (CLC).
          </p>
        </div>
      </div>
    </div>

    <router-link to="/modules" class="help-primary-btn">
      Tan-awa ang Akong mga Module
    </router-link>
  </div>
</template>

<style scoped>
.help-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1.5rem;
}

.help-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.help-back-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0b1e36;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.help-back-btn:hover {
  background: #f8fafc;
}

.help-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0b1e36;
  line-height: 1.2;
  margin: 0;
}

.help-subtitle {
  font-size: 0.9rem;
  color: #475569;
  margin: 0.2rem 0 0;
}

.help-steps-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.help-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem;
}

.help-card-teacher {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.help-step-num {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #165dfc;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.help-teacher-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #dbeafe;
  color: #165dfc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.help-step-body {
  flex: 1;
  min-width: 0;
}

.help-step-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0b1e36;
  margin: 0 0 0.25rem;
  line-height: 1.3;
}

.help-step-desc {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.45;
  margin: 0;
}

.help-primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 50px;
  padding: 0.85rem 1.25rem;
  background: #165dfc;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 14px;
  text-align: center;
  margin-top: 0.25rem;
}

.help-primary-btn:hover {
  background: #0d4ed8;
}
</style>

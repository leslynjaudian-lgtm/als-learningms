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
            Sa dili pa nimo basahon ang module, tubaga una ang <strong>Pre-Test</strong>.
            Basaha ang matag pangutana ug pilia ang imong tubag.
            Human nimo matubag ang tanan, pindota ang button aron mahuman ang <strong>Pre-Test</strong>.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">3</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Basaha ang Module</h2>
          <p class="help-step-desc">
            Basaha ang PDF sa module.
            Gamita ang <strong>I-scroll Pababa</strong> aron mag-scroll pataas ug paubos, o <strong>I-swipe Pakilid</strong> aron mag-swipe pakilid.
            Pindota ang screen aron matago o makita ang mga button.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">4</div>
        <div class="help-step-body">
          <h2 class="help-step-title">I-download ang Module</h2>
          <p class="help-step-desc">
            Kung gusto nimo basahon ang module bisan walay internet, pindota ang <strong>I-download ang Module</strong> button.
            Kinahanglan og internet sa pag-download, ug hulata nga mahuman kini.
            Ablihi ang na-download nga PDF sa imong cellphone gamit ang PDF reader aron mabasa nimo bisan walay data.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">5</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Tubaga ang Post-Test</h2>
          <p class="help-step-desc">
            Human nimo mabasa ang module, pindota ang <strong>Padayon sa Post-Test</strong>.
            Basaha ang matag pangutana ug pilia ang imong tubag.
            Siguroha nga nahuman nimo ang tanan.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">6</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Ipasa ang Activity</h2>
          <p class="help-step-desc">
            Kung naa kay activity nga ipasa, pindota ang kahon sa pag-upload aron mopili og file o mokuha og litrato, dayon pindota ang <strong>Ipasa ang Activity</strong>.
            Siguroha nga klaro ug sakto ang imong gipili sa dili pa nimo ipasa.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">7</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Tan-awa ang Gipasa</h2>
          <p class="help-step-desc">
            Aron makita ang imong gipasa nga activity, adto sa imong submission.
            Pindota ang litrato o PDF file nga imong gipasa aron makita nimo kini.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">8</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Ilisi o Tangtanga ang File</h2>
          <p class="help-step-desc">
            Kung sayop ang imong napili nga file, pwede nimo kini tangtangon pinaagi sa pagpindot sa <strong>X</strong> sa kilid niini, kung gitugotan pa sa system.
            Human niini, pwede ka mopili ug <strong>Dugang og File</strong>.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">9</div>
        <div class="help-step-body">
          <h2 class="help-step-title help-step-title-with-icon">
            <span>Bantayi ang Deadline</span>
            <svg class="help-deadline-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </h2>
          <p class="help-step-desc">
            Tan-awa kanunay ang <strong>Deadline</strong> sa imong activity.
            Kung molapas na sa <strong>Deadline</strong>, dili na ka maka-<strong>Upload</strong>, makapang-<strong>Ilis</strong>, o makapang-<strong>Tangtang</strong> sa imong gipasa nga file, gawas na lang kung gihatagan ka og extension sa imong teacher.
            Ang mga file nga napasa na pwede gihapon nimo tan-awon.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">10</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Tan-awa ang Mga Pahibalo</h2>
          <p class="help-step-desc">
            Kung gusto nimo makita ang mga bag-ong pahibalo, pindota ang <strong>bell icon</strong> sa taas o ang <strong>Mga Pahibalo</strong> sa Home.
            Dinhi nimo makita ang mga importanteng anunsyo ug pahibalo bahin sa imong pagtuon gikan sa imong ALS Teacher o Admin.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">11</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Tan-awa ang Akong Profile</h2>
          <p class="help-step-desc">
            Kung gusto nimo makita ang imong impormasyon, pindota ang <strong>Akong Profile</strong> sa Home o sa <strong>Uban</strong> nga menu.
            Dinhi nimo makita ang imong ngalan, LRN, Learning Center, ug ALS Teacher, ug pwede ka mag-<strong>Ibutang og Litrato</strong>.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">12</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Gamita ang Uban</h2>
          <p class="help-step-desc">
            Kung gusto nimo makita ang ubang opsyon, pindota ang <strong>Uban</strong> sa ubos sa screen.
            Dinhi nimo makita ang <strong>Home</strong>, <strong>Akong Modules</strong>, <strong>Mga Pahibalo</strong>, <strong>Akong Profile</strong>, <strong>Tabang / Giya</strong>, ug <strong>Sign Out</strong>.
          </p>
        </div>
      </div>

      <div class="help-card">
        <div class="help-step-num">13</div>
        <div class="help-step-body">
          <h2 class="help-step-title">Pag-sign Out</h2>
          <p class="help-step-desc">
            Kung nahuman na ka sa paggamit sa ALS LMS, pindota ang <strong>Uban</strong> sa ubos sa screen.
            Pangitaa ug pindota ang <strong>Sign Out</strong> aron makagawas sa imong account.
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
            Kung naa kay pangutana o naglisod ka sa paggamit sa ALS LMS, pangayo ug tabang sa imong <strong>ALS Teacher</strong>.
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
  padding-bottom: 2.5rem;
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

.help-step-title-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.help-deadline-icon {
  color: #d97706;
  flex-shrink: 0;
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

import { ref, computed } from 'vue';

// In-memory cache keyed by CLC slug
const clcModulesMap = ref({});
const clcRecordsMap = ref({});

function getStorageKey(clcSlug, type) {
  return `als_clc_${type}_${clcSlug || 'poblacion-clc'}`;
}

function loadFromStorage(clcSlug, type, defaultValue) {
  try {
    const raw = localStorage.getItem(getStorageKey(clcSlug, type));
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(clcSlug, type, data) {
  try {
    localStorage.setItem(getStorageKey(clcSlug, type), JSON.stringify(data));
  } catch (err) {
    console.warn(`Could not save ${type} to localStorage:`, err);
  }
}

export function useClcData(clcSlugRef) {
  const currentSlug = computed(() => {
    if (typeof clcSlugRef === 'string') return clcSlugRef;
    return clcSlugRef?.value || 'poblacion-clc';
  });

  // Ensure arrays exist for this CLC
  function initClcData() {
    const slug = currentSlug.value;
    if (!clcModulesMap.value[slug]) {
      // Modules start empty unless user already created some in localStorage
      clcModulesMap.value[slug] = loadFromStorage(slug, 'modules', []);
    }
    if (!clcRecordsMap.value[slug]) {
      // Records start with strictly NO DATA unless previously recorded
      clcRecordsMap.value[slug] = loadFromStorage(slug, 'records', []);
    }
  }

  initClcData();

  const modules = computed({
    get: () => {
      const slug = currentSlug.value;
      if (!clcModulesMap.value[slug]) {
        clcModulesMap.value[slug] = loadFromStorage(slug, 'modules', []);
      }
      return clcModulesMap.value[slug];
    },
    set: (val) => {
      const slug = currentSlug.value;
      clcModulesMap.value[slug] = val;
      saveToStorage(slug, 'modules', val);
    },
  });

  const records = computed({
    get: () => {
      const slug = currentSlug.value;
      if (!clcRecordsMap.value[slug]) {
        clcRecordsMap.value[slug] = loadFromStorage(slug, 'records', []);
      }
      return clcRecordsMap.value[slug];
    },
    set: (val) => {
      const slug = currentSlug.value;
      clcRecordsMap.value[slug] = val;
      saveToStorage(slug, 'records', val);
    },
  });

  function publishModule(modulePayload) {
    const slug = currentSlug.value;
    const newId = Date.now();

    const formattedToday = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const newModule = {
      id: newId,
      title: modulePayload.title?.trim() || 'Untitled Module',
      description: modulePayload.description || '',
      strand: modulePayload.strand || '1. Communication Skills (English)',
      level: modulePayload.level || 'A&E Elementary',
      code: modulePayload.code || '',
      author: modulePayload.author || 'Maria Santos',
      date: formattedToday,
      preTest: modulePayload.preTest || [],
      postTest: modulePayload.postTest || [],
      uploadedFile: modulePayload.uploadedFile || null,
      fileName: modulePayload.fileName || 'Learning_Module.pdf',
      fileType: modulePayload.fileType || 'PDF',
      fileSize: modulePayload.fileSize || '3.4 MB',
      learningNotes: modulePayload.learningNotes || '',
      statusUpdate: 'New Module Available',
    };

    const currentList = [...modules.value];
    currentList.unshift(newModule);
    modules.value = currentList;

    return newModule;
  }

  function getModuleById(moduleId) {
    const idNum = Number(moduleId);
    return modules.value.find((m) => m.id === idNum || String(m.id) === String(moduleId)) || null;
  }

  function addRecord(recordPayload) {
    const current = [...records.value];
    const newRec = {
      id: recordPayload.id || Date.now(),
      learnerId: recordPayload.learnerId || null,
      learnerName: recordPayload.learnerName || 'Learner',
      lrn: recordPayload.lrn || '',
      centerName: recordPayload.centerName || 'Poblacion CLC',
      moduleTitle: recordPayload.moduleTitle || 'Module 1',
      strandName: recordPayload.strandName || '',
      level: recordPayload.level || 'A&E Elementary',
      dateStarted: recordPayload.dateStarted || '',
      dateFinished: recordPayload.dateFinished || '',
      preTestScore: recordPayload.preTestScore != null && recordPayload.preTestScore !== '' ? Number(recordPayload.preTestScore) : null,
      preTestTotal: recordPayload.preTestTotal != null && recordPayload.preTestTotal !== '' ? Number(recordPayload.preTestTotal) : null,
      postTestScore: recordPayload.postTestScore != null && recordPayload.postTestScore !== '' ? Number(recordPayload.postTestScore) : null,
      postTestTotal: recordPayload.postTestTotal != null && recordPayload.postTestTotal !== '' ? Number(recordPayload.postTestTotal) : null,
      otherActivities: recordPayload.otherActivities || '',
      selfAssessment: recordPayload.selfAssessment || '',
      assessment: recordPayload.assessment || recordPayload.moduleStatus || '',
      moduleStatus: recordPayload.assessment || recordPayload.moduleStatus || 'In Progress',
      dateCompleted: recordPayload.dateFinished || recordPayload.dateCompleted || '',
      uploadedOutputs: recordPayload.uploadedOutputs || recordPayload.uploadedOutput || '',
      remarks: recordPayload.remarks || '',
    };
    current.unshift(newRec);
    records.value = current;

    // Also sync to global AF2 records
    try {
      const globalKey = 'als_af2_records_global';
      const rawGlobal = localStorage.getItem(globalKey);
      const globalList = rawGlobal ? JSON.parse(rawGlobal) : [];
      const gIdx = globalList.findIndex((r) => r.id === newRec.id);
      if (gIdx !== -1) {
        globalList[gIdx] = { ...globalList[gIdx], ...newRec };
      } else {
        globalList.unshift(newRec);
      }
      localStorage.setItem(globalKey, JSON.stringify(globalList));
    } catch (e) {
      console.warn('Could not sync record to global AF2 store:', e);
    }

    return newRec;
  }

  function updateRecord(recordId, updates) {
    const current = [...records.value];
    const idx = current.findIndex((r) => r.id === recordId || String(r.id) === String(recordId));
    if (idx !== -1) {
      current[idx] = {
        ...current[idx],
        ...updates,
      };
      records.value = current;

      // Sync update to global AF2 store
      try {
        const globalKey = 'als_af2_records_global';
        const rawGlobal = localStorage.getItem(globalKey);
        if (rawGlobal) {
          const globalList = JSON.parse(rawGlobal);
          const gIdx = globalList.findIndex((r) => r.id === recordId || String(r.id) === String(recordId));
          if (gIdx !== -1) {
            globalList[gIdx] = { ...globalList[gIdx], ...updates };
            localStorage.setItem(globalKey, JSON.stringify(globalList));
          }
        }
      } catch (e) {
        console.warn('Could not sync update to global AF2 store:', e);
      }

      return current[idx];
    }
    return null;
  }

  function deleteRecord(recordId) {
    const current = [...records.value];
    records.value = current.filter((r) => r.id !== recordId && String(r.id) !== String(recordId));

    // Sync delete to global AF2 store
    try {
      const globalKey = 'als_af2_records_global';
      const rawGlobal = localStorage.getItem(globalKey);
      if (rawGlobal) {
        const globalList = JSON.parse(rawGlobal).filter((r) => r.id !== recordId && String(r.id) !== String(recordId));
        localStorage.setItem(globalKey, JSON.stringify(globalList));
      }
    } catch (e) {
      console.warn('Could not sync delete to global AF2 store:', e);
    }
  }

  // Format score as "X/Y" number values (never percentage)
  function formatScore(score, total) {
    if (score == null || score === '') return '—';
    return total ? `${score}/${total}` : `${score}`;
  }

  return {
    modules,
    records,
    publishModule,
    getModuleById,
    addRecord,
    updateRecord,
    deleteRecord,
    formatScore,
  };
}

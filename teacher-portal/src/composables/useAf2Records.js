import { ref, computed } from 'vue';

// Shared in-memory list of AF2 records
const globalAf2Records = ref([]);

const AF2_STORAGE_KEY = 'als_af2_records_global';

function loadGlobalRecords() {
  try {
    const raw = localStorage.getItem(AF2_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGlobalRecords(records) {
  try {
    localStorage.setItem(AF2_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Could not save global AF2 records:', err);
  }
}

// Scrape and aggregate any existing records stored across CLCs
function aggregateAllClcRecords() {
  const aggregated = [];
  const seenIds = new Set();

  // 1. Load from dedicated global key
  const storedGlobal = loadGlobalRecords();
  for (const r of storedGlobal) {
    if (r && r.id && !seenIds.has(r.id)) {
      seenIds.add(r.id);
      aggregated.push(r);
    }
  }

  // 2. Scan localStorage for any als_clc_records_*
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('als_clc_records_')) {
        const val = localStorage.getItem(key);
        if (val) {
          const list = JSON.parse(val);
          if (Array.isArray(list)) {
            for (const item of list) {
              if (item && item.id && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                aggregated.push(item);
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not aggregate CLC records:', e);
  }

  return aggregated;
}

export function useAf2Records() {
  // Initialize
  if (globalAf2Records.value.length === 0) {
    globalAf2Records.value = aggregateAllClcRecords();
  }

  // Also fetch backend records if available
  fetchBackendRecords();

  async function fetchBackendRecords() {
    try {
      const res = await fetch('http://localhost:3000/api/af2');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const current = [...globalAf2Records.value];
          const existingIds = new Set(current.map((r) => String(r.id)));
          let changed = false;
          for (const item of data) {
            if (item && item.id && !existingIds.has(String(item.id))) {
              existingIds.add(String(item.id));
              current.push(item);
              changed = true;
            }
          }
          if (changed) {
            globalAf2Records.value = current;
            saveGlobalRecords(current);
          }
        }
      }
    } catch {
      // offline / ignore
    }
  }

  function reloadRecords() {
    globalAf2Records.value = aggregateAllClcRecords();
    fetchBackendRecords();
  }

  function getRecordsForLearner(params = {}) {
    const { learnerId, learnerName, level, learningCenter, dateStarted, dateFinished } = params;

    return globalAf2Records.value.filter((rec) => {
      // 1. Learner match
      if (learnerId != null && rec.learnerId != null) {
        if (String(rec.learnerId) !== String(learnerId)) {
          return false;
        }
      } else if (learnerName && rec.learnerName) {
        if (rec.learnerName.trim().toLowerCase() !== learnerName.trim().toLowerCase()) {
          return false;
        }
      }

      // 2. Level match (optional filter)
      if (level && rec.level) {
        const normFilter = level.toLowerCase();
        const normRec = rec.level.toLowerCase();
        if (normFilter.includes('elem') && !normRec.includes('elem')) return false;
        if ((normFilter.includes('junior') || normFilter.includes('jhs')) && (!normRec.includes('junior') && !normRec.includes('jhs'))) return false;
      }

      // 3. Learning Center match (optional filter)
      if (learningCenter && rec.centerName) {
        if (rec.centerName.trim().toLowerCase() !== learningCenter.trim().toLowerCase()) {
          return false;
        }
      }

      // 4. Date range filter (inclusive reporting period)
      const startRange = (dateStarted || '').trim().split('T')[0];
      const endRange = (dateFinished || '').trim().split('T')[0];
      const recDate = (rec.dateFinished || rec.dateCompleted || rec.dateStarted || '').trim().split('T')[0];

      if (recDate) {
        if (startRange && recDate < startRange) return false;
        if (endRange && recDate > endRange) return false;
      }

      return true;
    });
  }

  function saveRecord(recordPayload) {
    const newRec = {
      id: recordPayload.id || Date.now(),
      learnerId: recordPayload.learnerId || null,
      learnerName: recordPayload.learnerName || '',
      lrn: recordPayload.lrn || '',
      level: recordPayload.level || 'A&E Elementary',
      centerName: recordPayload.centerName || recordPayload.learningCenter || '',
      moduleTitle: recordPayload.moduleTitle || '',
      strandName: recordPayload.strandName || '',
      dateStarted: recordPayload.dateStarted || '',
      dateFinished: recordPayload.dateFinished || '',
      preTestScore: recordPayload.preTestScore != null && recordPayload.preTestScore !== '' ? Number(recordPayload.preTestScore) : null,
      preTestTotal: recordPayload.preTestTotal != null && recordPayload.preTestTotal !== '' ? Number(recordPayload.preTestTotal) : null,
      postTestScore: recordPayload.postTestScore != null && recordPayload.postTestScore !== '' ? Number(recordPayload.postTestScore) : null,
      postTestTotal: recordPayload.postTestTotal != null && recordPayload.postTestTotal !== '' ? Number(recordPayload.postTestTotal) : null,
      otherActivities: recordPayload.otherActivities || '',
      selfAssessment: recordPayload.selfAssessment || '',
      assessment: recordPayload.assessment || 'Mastered', // 'Mastered' | 'Not Mastered'
      remarks: recordPayload.remarks || '',
      createdAt: recordPayload.createdAt || new Date().toISOString(),
    };

    // Update global list
    const current = [...globalAf2Records.value];
    const existingIdx = current.findIndex((r) => r.id === newRec.id);
    if (existingIdx !== -1) {
      current[existingIdx] = { ...current[existingIdx], ...newRec };
    } else {
      current.unshift(newRec);
    }
    globalAf2Records.value = current;
    saveGlobalRecords(current);

    // Also sync to CLC store if centerName / slug exists
    if (newRec.centerName) {
      const slug = newRec.centerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const clcKey = `als_clc_records_${slug}`;
      try {
        const rawClc = localStorage.getItem(clcKey);
        const clcList = rawClc ? JSON.parse(rawClc) : [];
        const clcIdx = clcList.findIndex((r) => r.id === newRec.id);
        if (clcIdx !== -1) {
          clcList[clcIdx] = { ...clcList[clcIdx], ...newRec };
        } else {
          clcList.unshift(newRec);
        }
        localStorage.setItem(clcKey, JSON.stringify(clcList));
      } catch (err) {
        console.warn('Could not sync to CLC store:', err);
      }
    }

    // Sync to backend API if available
    try {
      fetch('http://localhost:3000/api/af2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec),
      }).catch((err) => console.warn('Could not sync AF2 to backend:', err));
    } catch {
      // Ignore network errors
    }

    return newRec;
  }

  function deleteRecord(recordId) {
    globalAf2Records.value = globalAf2Records.value.filter((r) => r.id !== recordId);
    saveGlobalRecords(globalAf2Records.value);
  }

  function seedDefaultRecordsIfEmpty() {
    // No-op: mock data disabled per system data rules
  }

  return {
    globalAf2Records,
    reloadRecords,
    getRecordsForLearner,
    saveRecord,
    deleteRecord,
    seedDefaultRecordsIfEmpty,
  };
}

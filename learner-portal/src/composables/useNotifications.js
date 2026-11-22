import { ref } from 'vue';
import api from '../api/axios.js';

const notifications = ref([]);
const unreadCount = ref(0);
const eligibleUnreadCount = ref(0);
const shouldAnimateBell = ref(false);
const loading = ref(false);

let bellAnimationTimer = null;
let bellAnimationFrame = null;
const BELL_ANIMATION_DURATION_MS = 1500;

function getStoredLearnerParams() {
  try {
    const raw = localStorage.getItem('als_learner_user');
    if (!raw) return { role: 'LEARNER' };
    const parsed = JSON.parse(raw);
    return {
      role: 'LEARNER',
      userId: parsed.userId || parsed.id || undefined,
      learnerId: parsed.learnerId || parsed.profileId || parsed.learnerProfile?.id || (parsed.role === 'LEARNER' ? parsed.id : undefined),
    };
  } catch (_err) {
    return { role: 'LEARNER' };
  }
}

function getSeenKeysStorageKey(dataUserId) {
  const params = getStoredLearnerParams();
  const uid = dataUserId || params.userId || params.learnerId;
  return uid ? `als_learner_seen_notif_keys_${uid}` : null;
}

function loadSeenKeys(storageKey) {
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : null;
  } catch {
    return null;
  }
}

function saveSeenKeys(storageKey, keysSet) {
  if (!storageKey || !keysSet) return;
  try {
    // Keep at most the latest 200 keys to prevent unbounded storage growth
    const arr = Array.from(keysSet).slice(-200);
    localStorage.setItem(storageKey, JSON.stringify(arr));
  } catch {
    // ignore storage quota errors
  }
}

function triggerShortBellAnimation() {
  if (bellAnimationTimer) {
    clearTimeout(bellAnimationTimer);
    bellAnimationTimer = null;
  }
  if (bellAnimationFrame) {
    cancelAnimationFrame(bellAnimationFrame);
    bellAnimationFrame = null;
  }
  // Briefly reset to false so CSS keyframe animation restarts cleanly if already active
  shouldAnimateBell.value = false;
  bellAnimationFrame = requestAnimationFrame(() => {
    bellAnimationFrame = null;
    shouldAnimateBell.value = true;
    bellAnimationTimer = setTimeout(() => {
      shouldAnimateBell.value = false;
      bellAnimationTimer = null;
    }, BELL_ANIMATION_DURATION_MS);
  });
}

function stopBellAnimation() {
  if (bellAnimationFrame) {
    cancelAnimationFrame(bellAnimationFrame);
    bellAnimationFrame = null;
  }
  if (bellAnimationTimer) {
    clearTimeout(bellAnimationTimer);
    bellAnimationTimer = null;
  }
  shouldAnimateBell.value = false;
}

function applyPayload(data, { detectNew = false } = {}) {
  const list = Array.isArray(data?.notifications) ? data.notifications : [];
  notifications.value = list;
  unreadCount.value = Number(data?.unreadCount ?? list.filter((n) => !n.isRead).length);
  eligibleUnreadCount.value = Number(data?.eligibleUnreadCount ?? unreadCount.value);

  if (!detectNew) {
    return;
  }

  const storageKey = getSeenKeysStorageKey(data?.userId);
  if (!storageKey) return;

  const existingSeen = loadSeenKeys(storageKey);
  const currentKeys = list
    .map((n) => n?.notificationKey)
    .filter(Boolean)
    .map(String);

  if (!existingSeen) {
    // First time seeing notifications for this learner: seed baseline without ringing on initial load/refresh
    saveSeenKeys(storageKey, new Set(currentKeys));
    return;
  }

  const hasNewUnread = list.some(
    (n) => n && !n.isRead && n.notificationKey && !existingSeen.has(String(n.notificationKey))
  );

  let updated = false;
  for (const k of currentKeys) {
    if (!existingSeen.has(k)) {
      existingSeen.add(k);
      updated = true;
    }
  }
  if (updated) {
    saveSeenKeys(storageKey, existingSeen);
  }

  if (hasNewUnread) {
    triggerShortBellAnimation();
  }
}

export function useNotifications() {
  async function fetchNotifications() {
    const token = localStorage.getItem('als_learner_token');
    const isAuth = localStorage.getItem('als_learner_authenticated');
    if (!token && !isAuth) {
      clearNotificationsState();
      return;
    }

    loading.value = true;
    try {
      const params = getStoredLearnerParams();
      const { data } = await api.get('/notifications', { params });
      applyPayload(data, { detectNew: true });
    } catch (_err) {
      // Keep existing state on transient network failure
    } finally {
      loading.value = false;
    }
  }

  async function markAsRead(notificationKey) {
    if (!notificationKey) return;
    // Optimistically update local state immediately so bell animation stops right away
    const target = notifications.value.find((n) => n.notificationKey === notificationKey);
    if (target && !target.isRead) {
      target.isRead = true;
      target.isEligibleForAnimation = false;
      unreadCount.value = notifications.value.filter((n) => !n.isRead).length;
      eligibleUnreadCount.value = notifications.value.filter((n) => n.isEligibleForAnimation).length;
      if (unreadCount.value === 0) {
        stopBellAnimation();
      }
    }

    try {
      const params = getStoredLearnerParams();
      const { data } = await api.post('/notifications/read', {
        ...params,
        notificationKey,
      });
      applyPayload(data);
    } catch (_err) {
      // Fallback: re-sync
      await fetchNotifications();
    }
  }

  async function markAllAsRead() {
    // Optimistically update local state immediately
    for (const item of notifications.value) {
      item.isRead = true;
      item.isEligibleForAnimation = false;
    }
    unreadCount.value = 0;
    eligibleUnreadCount.value = 0;
    stopBellAnimation();

    try {
      const params = getStoredLearnerParams();
      const { data } = await api.post('/notifications/read-all', params);
      applyPayload(data);
    } catch (_err) {
      await fetchNotifications();
    }
  }

  function clearNotificationsState() {
    notifications.value = [];
    unreadCount.value = 0;
    eligibleUnreadCount.value = 0;
    stopBellAnimation();
  }

  return {
    notifications,
    unreadCount,
    eligibleUnreadCount,
    shouldAnimateBell,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotificationsState,
  };
}


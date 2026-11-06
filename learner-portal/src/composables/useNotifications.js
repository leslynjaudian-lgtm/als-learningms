import { ref } from 'vue';
import api from '../api/axios.js';

const notifications = ref([]);
const unreadCount = ref(0);
const eligibleUnreadCount = ref(0);
const shouldAnimateBell = ref(false);
const loading = ref(false);

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

function applyPayload(data) {
  notifications.value = Array.isArray(data?.notifications) ? data.notifications : [];
  unreadCount.value = Number(data?.unreadCount || 0);
  eligibleUnreadCount.value = Number(data?.eligibleUnreadCount || 0);
  shouldAnimateBell.value = Boolean(data?.shouldAnimateBell);
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
      applyPayload(data);
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
      shouldAnimateBell.value = eligibleUnreadCount.value > 0;
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
    shouldAnimateBell.value = false;

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
    shouldAnimateBell.value = false;
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


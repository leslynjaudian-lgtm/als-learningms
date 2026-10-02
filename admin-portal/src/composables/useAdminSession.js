import { ref, computed } from 'vue';
import api from '../api/axios.js';

function loadStoredAdmin() {
  try {
    const raw = localStorage.getItem('als_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Module-level reactive singleton state (single source of truth)
const currentAdmin = ref(loadStoredAdmin());

export function useAdminSession() {
  const isAuthenticated = computed(() => {
    return localStorage.getItem('als_admin_authenticated') === 'true' && !!currentAdmin.value;
  });

  const adminPhoto = computed(() => {
    return currentAdmin.value?.profilePhoto || currentAdmin.value?.profile?.profilePhoto || '';
  });

  const adminName = computed(() => {
    return (
      currentAdmin.value?.fullName ||
      currentAdmin.value?.name ||
      currentAdmin.value?.profile?.fullName ||
      'Admin'
    );
  });

  const adminRole = computed(() => {
    return (
      currentAdmin.value?.profile?.position ||
      currentAdmin.value?.position ||
      currentAdmin.value?.role ||
      'ALS Coordinator'
    );
  });

  const adminEmail = computed(() => {
    return currentAdmin.value?.email || currentAdmin.value?.profile?.email || 'admin@email.com';
  });

  const adminContact = computed(() => {
    return currentAdmin.value?.contactNo || currentAdmin.value?.profile?.contactNo || '';
  });

  function setAdminSession(adminData, token) {
    currentAdmin.value = adminData;
    localStorage.setItem('als_admin_authenticated', 'true');
    localStorage.setItem('als_admin_user', JSON.stringify(adminData));
    if (token) {
      localStorage.setItem('als_admin_token', token);
    }
  }

  function updateAdminProfile(updatedData) {
    if (!currentAdmin.value) {
      currentAdmin.value = updatedData;
    } else {
      const photo =
        updatedData.profilePhoto !== undefined
          ? updatedData.profilePhoto
          : updatedData.profile?.profilePhoto !== undefined
          ? updatedData.profile.profilePhoto
          : currentAdmin.value.profilePhoto;

      currentAdmin.value = {
        ...currentAdmin.value,
        ...updatedData,
        profilePhoto: photo,
        profile: {
          ...(currentAdmin.value.profile || {}),
          ...(updatedData.profile || {}),
          profilePhoto: photo,
        },
      };
    }
    localStorage.setItem('als_admin_user', JSON.stringify(currentAdmin.value));
  }

  function clearAdminSession() {
    currentAdmin.value = null;
    localStorage.removeItem('als_admin_authenticated');
    localStorage.removeItem('als_admin_user');
    localStorage.removeItem('als_admin_token');
  }

  async function refreshAdminProfile() {
    const token = localStorage.getItem('als_admin_token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        updateAdminProfile(res.data.user);
      }
    } catch (err) {
      console.warn('Failed to refresh admin profile from backend:', err);
    }
  }

  return {
    currentAdmin,
    isAuthenticated,
    adminPhoto,
    adminName,
    adminRole,
    adminEmail,
    adminContact,
    setAdminSession,
    updateAdminProfile,
    clearAdminSession,
    refreshAdminProfile,
  };
}

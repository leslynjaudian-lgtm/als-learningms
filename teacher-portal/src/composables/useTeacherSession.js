import { ref, computed } from 'vue';
import { getTeacherProfile } from '../api/auth.js';

const currentTeacher = ref(loadStoredTeacher());

function loadStoredTeacher() {
  try {
    const raw = localStorage.getItem('als_teacher_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useTeacherSession() {
  const isAuthenticated = computed(() => {
    return localStorage.getItem('als_teacher_authenticated') === 'true' && !!currentTeacher.value;
  });

  const teacherName = computed(() => {
    return currentTeacher.value?.fullName || currentTeacher.value?.name || 'ALS Teacher';
  });

  const teacherFirstName = computed(() => {
    const full = teacherName.value;
    return full.split(' ')[0] || full;
  });

  const teacherPosition = computed(() => {
    return currentTeacher.value?.position || 'ALS Teacher';
  });

  const teacherPhoto = computed(() => {
    return (
      currentTeacher.value?.profilePhoto ||
      currentTeacher.value?.user?.profilePhoto ||
      currentTeacher.value?.photo ||
      ''
    );
  });

  const teacherId = computed(() => {
    return currentTeacher.value?.teacherId || currentTeacher.value?.profile?.id || currentTeacher.value?.id || null;
  });

  const userId = computed(() => {
    return currentTeacher.value?.userId || currentTeacher.value?.user?.id || null;
  });

  const assignedProgramLevel = computed(() => {
    return currentTeacher.value?.programLevel || currentTeacher.value?.specialization || 'Both';
  });

  // Dynamically format assigned ALS levels for Modules dropdown & navigation
  const assignedLevels = computed(() => {
    const raw = String(assignedProgramLevel.value || 'Both').toLowerCase().trim();
    const hasElem = raw.includes('elem') || raw.includes('both');
    const hasJhs = raw.includes('junior') || raw.includes('jhs') || raw.includes('sec') || raw.includes('both');
    const levels = [];

    if (hasElem) {
      levels.push({
        label: 'A&E Elementary',
        slug: 'elementary',
        levelKey: 'ELEMENTARY',
        name: 'A&E Elementary',
        path: '/dashboard/modules/elementary',
      });
    }

    if (hasJhs) {
      levels.push({
        label: 'A&E Junior High',
        slug: 'junior-high',
        levelKey: 'JUNIOR',
        name: 'A&E Junior High',
        path: '/dashboard/modules/junior-high',
      });
    }

    if (levels.length === 0) {
      return [
        { label: 'A&E Elementary', slug: 'elementary', levelKey: 'ELEMENTARY', name: 'A&E Elementary', path: '/dashboard/modules/elementary' },
        { label: 'A&E Junior High', slug: 'junior-high', levelKey: 'JUNIOR', name: 'A&E Junior High', path: '/dashboard/modules/junior-high' },
      ];
    }

    return levels;
  });

  // Dynamically format assigned learning centers list for sidebar & navigation
  const assignedCenters = computed(() => {
    if (!currentTeacher.value) return [];

    const centers = [];

    // Check learningCenters array first
    if (Array.isArray(currentTeacher.value.learningCenters) && currentTeacher.value.learningCenters.length > 0) {
      for (const c of currentTeacher.value.learningCenters) {
        const slug = c.slug || (c.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        centers.push({
          id: c.id,
          name: c.name,
          code: c.code || '',
          slug,
          location: c.location || 'Naawan, Misamis Oriental',
          path: `/dashboard/learning-centers/${c.id || slug}`,
        });
      }
    } else if (currentTeacher.value.learningCenter && typeof currentTeacher.value.learningCenter === 'string' && currentTeacher.value.learningCenter !== '—') {
      const name = currentTeacher.value.learningCenter;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const id = currentTeacher.value.learningCenterId;
      centers.push({
        id,
        name,
        code: '',
        slug,
        location: 'Naawan, Misamis Oriental',
        path: `/dashboard/learning-centers/${id || slug}`,
      });
    }

    return centers;
  });

  function setSession(teacherData, token) {
    const normalized = { ...teacherData, role: 'TEACHER' };
    if (teacherData.profile && teacherData.profile.id && teacherData.userId === undefined) {
      normalized.id = teacherData.profile.id;
      normalized.teacherId = teacherData.profile.id;
      normalized.userId = teacherData.id;
    } else {
      normalized.teacherId = teacherData.teacherId || teacherData.id;
      if (teacherData.userId) {
        normalized.userId = teacherData.userId;
      } else if (teacherData.user?.id) {
        normalized.userId = teacherData.user.id;
      }
    }
    if (!normalized.profilePhoto && normalized.user?.profilePhoto) {
      normalized.profilePhoto = normalized.user.profilePhoto;
    }
    currentTeacher.value = normalized;
    localStorage.setItem('als_teacher_authenticated', 'true');
    localStorage.setItem('als_teacher_user', JSON.stringify(normalized));
    if (token) {
      localStorage.setItem('als_teacher_token', token);
    }
  }

  function updateTeacherProfile(updatedData) {
    if (!currentTeacher.value) return;
    const existing = currentTeacher.value;
    const photo =
      updatedData.profilePhoto !== undefined
        ? updatedData.profilePhoto
        : updatedData.user?.profilePhoto !== undefined
        ? updatedData.user.profilePhoto
        : updatedData.teacher?.profilePhoto !== undefined
        ? updatedData.teacher.profilePhoto
        : existing.profilePhoto;

    const resolvedTeacherId =
      updatedData.teacherId ||
      updatedData.profile?.id ||
      existing.teacherId ||
      existing.id;
    const resolvedUserId =
      updatedData.userId ||
      updatedData.user?.id ||
      existing.userId;

    const newTeacher = {
      ...existing,
      ...updatedData,
      id: resolvedTeacherId,
      teacherId: resolvedTeacherId,
      userId: resolvedUserId,
      profilePhoto: photo,
      fullName: updatedData.fullName || updatedData.name || existing.fullName || existing.name,
      name: updatedData.fullName || updatedData.name || existing.fullName || existing.name,
      email: updatedData.email || existing.email,
      contactNo: updatedData.contactNo !== undefined ? updatedData.contactNo : existing.contactNo,
      contactNumber: updatedData.contactNo !== undefined ? updatedData.contactNo : existing.contactNumber,
    };
    if (newTeacher.user) {
      newTeacher.user = {
        ...newTeacher.user,
        profilePhoto: photo,
        email: newTeacher.email,
      };
    }
    currentTeacher.value = newTeacher;
    localStorage.setItem('als_teacher_user', JSON.stringify(newTeacher));
  }

  function clearSession() {
    currentTeacher.value = null;
    localStorage.removeItem('als_teacher_authenticated');
    localStorage.removeItem('als_teacher_user');
    localStorage.removeItem('als_teacher_token');
  }

  async function refreshProfile() {
    const idToFetch = teacherId.value || currentTeacher.value?.id;
    if (!idToFetch) return;
    try {
      const { data } = await getTeacherProfile(idToFetch);
      if (data) {
        setSession({
          ...currentTeacher.value,
          ...data,
          profilePhoto: data.profilePhoto || data.user?.profilePhoto || currentTeacher.value?.profilePhoto || null,
        });
      }
    } catch (err) {
      console.warn('Could not refresh teacher profile:', err);
    }
  }

  return {
    currentTeacher,
    isAuthenticated,
    teacherName,
    teacherFirstName,
    teacherPosition,
    teacherPhoto,
    teacherId,
    userId,
    assignedProgramLevel,
    assignedLevels,
    assignedCenters,
    setSession,
    clearSession,
    updateTeacherProfile,
    refreshProfile,
  };
}

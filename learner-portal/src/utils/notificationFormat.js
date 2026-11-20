/**
 * Shared learner-friendly Bisaya (Cebuano) notification presentation helpers
 * used by both the Header Notification Dropdown (DefaultLayout.vue) and
 * the Notifications Page (AnnouncementsView.vue).
 */

export function getNotificationVisualType(item) {
  const t = String(item?.type || '').toUpperCase();
  const st = String(item?.sourceType || '').toLowerCase();
  const title = String(item?.title || '').toLowerCase();

  if (
    t === 'SUBMISSION' ||
    st === 'submission' ||
    title.includes('activity submitted') ||
    title.includes('activity reviewed')
  ) {
    return 'submission';
  }
  if (t === 'MODULE' || st === 'module') {
    return 'module';
  }
  if (t === 'SCHEDULE' || st === 'schedule') {
    return 'schedule';
  }
  if (
    t === 'REMINDER' ||
    st === 'module_deadline' ||
    st === 'missing_submissions' ||
    title.includes('deadline')
  ) {
    return 'reminder';
  }
  return 'announcement';
}

export function getNotificationTypeStyle(visualType) {
  if (visualType === 'module') {
    return { iconBg: '#eff6ff', iconColor: '#165dfc' };
  }
  if (visualType === 'reminder') {
    return { iconBg: '#fffbeb', iconColor: '#d97706' };
  }
  if (visualType === 'schedule') {
    return { iconBg: '#eff6ff', iconColor: '#1d4ed8' };
  }
  if (visualType === 'submission') {
    return { iconBg: '#f0fdf4', iconColor: '#16a34a' };
  }
  return { iconBg: '#eff6ff', iconColor: '#165dfc' };
}

export function getNotificationBadgeLabel(item) {
  const vt = getNotificationVisualType(item);
  if (vt === 'module') return 'Module';
  if (vt === 'schedule') return 'Adunay ALS Session';
  if (vt === 'reminder') return 'Pahinumdom';
  if (vt === 'submission') return 'Activity';
  return 'Pahibalo';
}

export function getNotificationDisplayTitle(item) {
  if (!item) return 'Anunsyo';
  const rawTitle = String(item.title || '').trim();
  const lower = rawTitle.toLowerCase();
  const t = String(item.type || '').toUpperCase();
  const st = String(item.sourceType || '').toLowerCase();

  if (lower === 'new learning module available' || (t === 'MODULE' && st === 'module')) {
    return 'Bag-ong Module';
  }
  if (
    lower === 'module deadline reminder' ||
    lower === 'activity due soon' ||
    t === 'REMINDER' ||
    st === 'module_deadline'
  ) {
    return 'Duol na ang Deadline';
  }
  if (lower.includes('activity reviewed') || (st === 'submission' && lower.includes('review'))) {
    return 'Gitan-aw na sa Teacher';
  }
  if (lower.includes('activity submitted') || t === 'SUBMISSION' || st === 'submission') {
    return 'Naipasa na ang Activity';
  }
  if (t === 'SCHEDULE' || st === 'schedule') {
    return rawTitle && lower !== 'session' && lower !== 'schedule'
      ? `Adunay ALS Session: ${rawTitle}`
      : 'Adunay ALS Session';
  }
  return 'Anunsyo';
}

export function getNotificationAnnouncementTitle(item) {
  if (!item || getNotificationVisualType(item) !== 'announcement') return '';
  const rawTitle = String(item.title || '').trim();
  if (!rawTitle || rawTitle.toLowerCase() === 'anunsyo') return '';
  return rawTitle;
}

export function getNotificationDisplayMessage(item) {
  if (!item) return '';
  const raw = String(item.message || item.content || '').trim();
  const lower = raw.toLowerCase();
  const titleLower = String(item.title || '').toLowerCase();
  const t = String(item.type || '').toUpperCase();
  const st = String(item.sourceType || '').toLowerCase();

  // New Learning Module Available
  if (titleLower === 'new learning module available' || (t === 'MODULE' && st === 'module')) {
    const modMatch = raw.match(/added a new learning module:\s*(.+?)\.?$/i);
    if (modMatch && modMatch[1]) {
      return `Adunay bag-ong module nga pwede na nimong tun-an: ${modMatch[1].trim()}.`;
    }
    return 'Adunay bag-ong module nga pwede na nimong tun-an.';
  }

  // Module Deadline Reminder / Activity Due Soon
  if (
    titleLower === 'module deadline reminder' ||
    titleLower === 'activity due soon' ||
    t === 'REMINDER' ||
    st === 'module_deadline'
  ) {
    const dueToday = raw.match(/learning module,\s*(.+?),\s*is due today\s*\(([^)]+)\)/i);
    if (dueToday) {
      return `Karong adlawa (${dueToday[2]}) ang deadline sa module nga ${dueToday[1].trim()}.`;
    }
    const dueTomorrow = raw.match(/learning module,\s*(.+?),\s*is due tomorrow\s*\(([^)]+)\)/i);
    if (dueTomorrow) {
      return `Ugma (${dueTomorrow[2]}) ang deadline sa module nga ${dueTomorrow[1].trim()}.`;
    }
    const dueOn = raw.match(/learning module,\s*(.+?),\s*is due on\s*([^.]+)\./i);
    if (dueOn) {
      return `Duol na ang deadline sa module nga ${dueOn[1].trim()} sa ${dueOn[2].trim()}.`;
    }
    return 'Duol na ang adlaw sa pagpasa sa imong activity.';
  }

  // Activity Reviewed / Submitted
  if (
    titleLower.includes('activity reviewed') ||
    (st === 'submission' && (lower.includes('reviewed') || lower.includes('graded')))
  ) {
    return 'Gitan-aw na sa imong teacher ang imong activity.';
  }
  if (titleLower.includes('activity submitted') || t === 'SUBMISSION' || st === 'submission') {
    return 'Nadawat na ang imong gipasa nga activity.';
  }

  // Schedule / Session
  if (t === 'SCHEDULE' || st === 'schedule') {
    if (!raw) return 'Adunay nakatakda nga ALS session.';
    return raw;
  }

  return raw;
}

export function getNotificationRelevantSender(item) {
  if (!item) return '';
  const sender = String(item.sender || item.createdBy || item.author || '').trim();
  if (!sender) return '';
  const lower = sender.toLowerCase();
  if (lower === 'als system' || lower === 'system' || lower === 'assigned teacher') {
    return '';
  }
  return sender;
}

export function hasNotificationDestination(item) {
  const url = item?.actionUrl;
  return Boolean(url && url !== '/notifications' && url !== '/announcements');
}

export function getNotificationActionLabel(item) {
  const url = String(item?.actionUrl || '').toLowerCase();
  const st = String(item?.sourceType || '').toLowerCase();
  const t = String(item?.type || '').toUpperCase();
  const titleLower = String(item?.title || '').toLowerCase();

  if (
    st === 'submission' ||
    t === 'SUBMISSION' ||
    url.includes('activity') ||
    url.includes('submission') ||
    titleLower.includes('activity')
  ) {
    return 'Tan-awa ang Activity';
  }
  if (
    url.includes('/modules') ||
    t === 'MODULE' ||
    st === 'module' ||
    st === 'module_deadline'
  ) {
    return 'Ablihi ang Module';
  }
  return 'Ablihi';
}

export function formatNotificationDateShort(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getNotificationRelativeTime(item) {
  const rawDate = item?.createdAt || item?.datePosted;
  if (!rawDate) return item?.relativeTime || '';
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return item?.relativeTime || String(rawDate);

  const diffMs = Date.now() - d.getTime();
  if (diffMs >= -120 * 1000 && diffMs < 60 * 1000) return 'Karon lang';
  if (diffMs < -120 * 1000) return formatNotificationDateShort(d);

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return formatNotificationDateShort(d);
}

export function formatNotificationFullDate(val) {
  if (!val) return 'Bag-o lang';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  try {
    const datePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(d);

    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return `${datePart}, ${timePart}`;
  } catch (_e) {
    return d.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

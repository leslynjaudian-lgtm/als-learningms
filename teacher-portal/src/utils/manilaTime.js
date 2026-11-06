/**
 * Date & time helpers for schedules.
 *
 * All schedule dates are calendar dates ("YYYY-MM-DD") and times are wall-clock
 * times ("HH:MM") in Philippine Standard Time (Asia/Manila, UTC+08:00).
 * These helpers never rely on the browser's local timezone, so a device set to
 * a different timezone (or UTC) still shows the correct Philippine date.
 */

export const MANILA_TZ = 'Asia/Manila';

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

const pad2 = (n) => String(n).padStart(2, '0');

/** Returns { year, month (1-12), day, hour, minute } for the given instant in Manila time. */
export function getManilaParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  return {
    year: parseInt(parts.year, 10),
    month: parseInt(parts.month, 10),
    day: parseInt(parts.day, 10),
    hour: parseInt(parts.hour, 10) % 24,
    minute: parseInt(parts.minute, 10),
  };
}

/** Today's date in Manila as "YYYY-MM-DD". */
export function getManilaTodayKey(date = new Date()) {
  const { year, month, day } = getManilaParts(date);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Current month in Manila as "YYYY-MM". */
export function getManilaMonthKey(date = new Date()) {
  const { year, month } = getManilaParts(date);
  return `${year}-${pad2(month)}`;
}

/**
 * Normalizes any API date value to a "YYYY-MM-DD" calendar date.
 * Plain date strings are kept as-is (no UTC shifting). Full timestamps are
 * converted to the Manila calendar date.
 */
export function toDateKey(value) {
  if (!value) return '';
  const str = String(value).trim();
  const plain = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plain) return str;
  // "YYYY-MM-DDT00:00:00.000Z" from a DATE column = that calendar date
  const midnightUtc = str.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(\.0+)?Z$/);
  if (midnightUtc) return midnightUtc[1];
  const d = new Date(str);
  if (isNaN(d.getTime())) return str.slice(0, 10);
  return getManilaTodayKey(d);
}

/** Builds a "YYYY-MM" key from a year and 0-indexed month. */
export function monthKeyFrom(year, monthIndex) {
  return `${year}-${pad2(monthIndex + 1)}`;
}

/** "YYYY-MM" -> "November 2026" */
export function formatMonthLabel(monthKey) {
  const [y, m] = String(monthKey).split('-').map((n) => parseInt(n, 10));
  if (!y || !m) return monthKey;
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

/** Shifts a "YYYY-MM" key by `delta` months. */
export function shiftMonthKey(monthKey, delta) {
  const [y, m] = String(monthKey).split('-').map((n) => parseInt(n, 10));
  const total = y * 12 + (m - 1) + delta;
  return monthKeyFrom(Math.floor(total / 12), ((total % 12) + 12) % 12);
}

/**
 * Parses a time string ("HH:MM", "HH:MM:SS", "9:00 AM", "9:00PM") into
 * minutes since midnight. Returns null if it cannot be parsed.
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    if (h < 1 || h > 12) return null;
    if (meridiem === 'AM' && h === 12) h = 0;
    if (meridiem === 'PM' && h !== 12) h += 12;
  }
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** Normalizes a time string to "HH:MM" (24-hour) for <input type="time">. */
export function toTimeInputValue(timeStr) {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return '';
  return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
}

/** "13:30" -> "1:30 PM" */
export function formatTime12h(timeStr) {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr || '';
  let h = Math.floor(mins / 60);
  const m = pad2(mins % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/** "2026-11-06" -> "Nov 6, 2026" (no timezone conversion). */
export function formatDisplayDate(dateValue) {
  const key = toDateKey(dateValue);
  if (!key) return '';
  const [y, m, d] = key.split('-');
  const monthName = MONTHS_SHORT[parseInt(m, 10) - 1] || m;
  return `${monthName} ${parseInt(d, 10)}, ${y}`;
}

/** Formats a timestamp (e.g. createdAt) as a Manila calendar date: "Nov 6, 2026". */
export function formatTimestampDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return formatDisplayDate(getManilaTodayKey(d));
}

/** Sort comparator: by start date, then start time. */
export function compareSchedules(a, b) {
  const da = toDateKey(a.startDate || a.date);
  const db = toDateKey(b.startDate || b.date);
  if (da !== db) return da < db ? -1 : 1;
  return (parseTimeToMinutes(a.startTime) ?? 0) - (parseTimeToMinutes(b.startTime) ?? 0);
}

/**
 * Calculates default Start Date, Start Time, End Date, and End Time in Philippine Time.
 * Start Date = current Manila date.
 * Start Time = current Manila time (HH:MM).
 * End Time = 1 hour after Start Time.
 * End Date = Start Date, or next day if adding 1 hour crosses midnight.
 */
export function getDefaultScheduleDateTimes(baseDate = new Date()) {
  const parts = getManilaParts(baseDate);
  const startDate = `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
  const startTime = `${pad2(parts.hour)}:${pad2(parts.minute)}`;

  const startTotalMins = parts.hour * 60 + parts.minute;
  const endTotalMins = startTotalMins + 60;
  const endHour = Math.floor(endTotalMins / 60) % 24;
  const endMin = endTotalMins % 60;
  const endTime = `${pad2(endHour)}:${pad2(endMin)}`;

  let endDate = startDate;
  if (endTotalMins >= 24 * 60) {
    const nextDay = new Date(baseDate.getTime() + 24 * 3600 * 1000);
    const nextParts = getManilaParts(nextDay);
    endDate = `${nextParts.year}-${pad2(nextParts.month)}-${pad2(nextParts.day)}`;
  }

  return {
    startDate,
    startTime,
    endDate,
    endTime,
  };
}

/**
 * Calculates default End Date & Time given a Start Date and Start Time (+1h).
 */
export function calculateDefaultEndTime(startDate, startTime) {
  if (!startDate) return { endDate: '', endTime: '' };
  const mins = parseTimeToMinutes(startTime);
  if (mins === null) {
    return { endDate: startDate, endTime: '10:00' };
  }
  const endTotalMins = mins + 60;
  const endHour = Math.floor(endTotalMins / 60) % 24;
  const endMin = endTotalMins % 60;
  const endTime = `${pad2(endHour)}:${pad2(endMin)}`;

  let endDate = startDate;
  if (endTotalMins >= 24 * 60) {
    const [y, m, d] = startDate.split('-').map((n) => parseInt(n, 10));
    const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
    endDate = `${nextDate.getUTCFullYear()}-${pad2(nextDate.getUTCMonth() + 1)}-${pad2(nextDate.getUTCDate())}`;
  }

  return { endDate, endTime };
}

/**
 * Validates date & time range for both same-day and multi-day schedules.
 * Returns an error message string, or '' when valid.
 */
export function validateScheduleDateTimeRange(startDate, startTime, endDate, endTime) {
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return 'Please select a valid Start Date.';
  }
  if (!startTime) {
    return 'Please select a Start Time.';
  }
  if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return 'Please select a valid End Date.';
  }
  if (!endTime) {
    return 'Please select an End Time.';
  }

  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);
  if (startMins === null) return 'Start Time is invalid.';
  if (endMins === null) return 'End Time is invalid.';

  if (endDate < startDate) {
    return 'End Date & Time must be later than Start Date & Time.';
  }
  if (endDate === startDate && endMins <= startMins) {
    return 'End Date & Time must be later than Start Date & Time.';
  }
  return '';
}

/** Legacy alias for single-day checks */
export function validateScheduleTimes(date, startTime, endTime) {
  return validateScheduleDateTimeRange(date, startTime, date, endTime);
}

/**
 * Formats a schedule date range for display.
 * Same-day: "Nov 6, 2026"
 * Multi-day: "Nov 6, 2026 – Nov 8, 2026"
 */
export function formatScheduleDisplayDate(startDateValue, endDateValue) {
  const startKey = toDateKey(startDateValue);
  const endKey = toDateKey(endDateValue) || startKey;
  if (!startKey) return '';
  if (!endKey || startKey === endKey) {
    return formatDisplayDate(startKey);
  }
  return `${formatDisplayDate(startKey)} – ${formatDisplayDate(endKey)}`;
}

/**
 * Calculates schedule status based on current Philippine Standard Time:
 * - "Upcoming": Current date & time < schedule's start
 * - "Ongoing": Current date & time is between schedule's start and end
 * - "Completed": Current date & time > schedule's end
 */
export function calculateScheduleStatus(startDate, startTime, endDate, endTime, now = new Date()) {
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate) || startKey;
  if (!startKey) return 'Upcoming';

  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);
  if (startMins === null) return 'Upcoming';

  const sHour = Math.floor(startMins / 60);
  const sMin = startMins % 60;
  const eHour = endMins !== null ? Math.floor(endMins / 60) : sHour;
  const eMin = endMins !== null ? endMins % 60 : sMin;

  const [sy, sm, sd] = startKey.split('-').map((n) => parseInt(n, 10));
  const [ey, em, ed] = endKey.split('-').map((n) => parseInt(n, 10));

  // Manila timestamp for start and end (UTC+08:00)
  const startMs = Date.UTC(sy, sm - 1, sd, sHour - 8, sMin, 0);
  const endMs = Date.UTC(ey, em - 1, ed, eHour - 8, eMin, 0);
  const nowMs = now.getTime();

  if (nowMs < startMs) {
    return 'Upcoming';
  }
  if (nowMs > endMs) {
    return 'Completed';
  }
  return 'Ongoing';
}

/**
 * Formats a date & time pair for display, e.g. "Nov 6, 2026, 9:00 AM".
 */
export function formatDateTimeDisplay(dateValue, timeValue) {
  const dateStr = formatDisplayDate(dateValue);
  const timeStr = formatTime12h(timeValue);
  if (!dateStr && !timeStr) return '—';
  if (!dateStr) return timeStr;
  if (!timeStr) return dateStr;
  return `${dateStr}, ${timeStr}`;
}



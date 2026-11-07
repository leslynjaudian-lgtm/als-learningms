/**
 * Date and deadline utilities for ALS LMS.
 * Server time validation follows Asia/Manila (UTC+8).
 */

export function parseManilaDeadline(deadlineInput) {
  if (!deadlineInput) return null;

  if (typeof deadlineInput === 'string') {
    const trimmed = deadlineInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return new Date(`${trimmed}T23:59:59.999+08:00`);
    }
  }

  const d = new Date(deadlineInput);
  if (isNaN(d.getTime())) return null;

  // Prisma @db.Date representation in JavaScript defaults to midnight UTC
  if (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  ) {
    const ymd = d.toISOString().split('T')[0];
    return new Date(`${ymd}T23:59:59.999+08:00`);
  }

  return d;
}

export function isSubmissionDeadlinePassed(deadlineInput, referenceDate = new Date()) {
  const deadline = parseManilaDeadline(deadlineInput);
  if (!deadline) return false;
  return referenceDate.getTime() > deadline.getTime();
}


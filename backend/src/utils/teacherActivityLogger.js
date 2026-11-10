import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOG_FILE = path.join(DATA_DIR, 'teacher_activity_logs.json');
const MAX_LOGS = 500;

function ensureLogFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '[]', 'utf8');
    }
  } catch (err) {
    console.error('[teacherActivityLogger] Failed to initialize log file:', err.message);
  }
}

export function readTeacherActivities(teacherId = null) {
  try {
    ensureLogFile();
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalizedTeacherId = String(teacherId || '').trim();
    if (!normalizedTeacherId) return parsed;
    return parsed.filter((entry) => String(entry?.teacherId || '').trim() === normalizedTeacherId);
  } catch (err) {
    console.error('[teacherActivityLogger] Failed to read activity logs:', err.message);
    return [];
  }
}

export function logTeacherActivity({
  teacherId,
  type = 'ACTION',
  activityTypeLabel = 'Teacher Action',
  relatedEntity = '',
  description = '',
  moduleId = null,
  learnerId = null,
  submissionId = null,
  linkUrl = '',
  timestamp = new Date().toISOString()
} = {}) {
  try {
    const normalizedTeacherId = String(teacherId || '').trim();
    if (!normalizedTeacherId) return null;

    ensureLogFile();
    const existing = readTeacherActivities();
    const entry = {
      id: `tlog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      teacherId: normalizedTeacherId,
      type: String(type || 'ACTION').trim(),
      activityTypeLabel: String(activityTypeLabel || 'Teacher Action').trim(),
      relatedEntity: String(relatedEntity || '').trim(),
      description: String(description || '').trim(),
      moduleId: moduleId ? String(moduleId) : null,
      learnerId: learnerId ? String(learnerId) : null,
      submissionId: submissionId ? String(submissionId) : null,
      linkUrl: String(linkUrl || '').trim(),
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
    };

    const next = [entry, ...existing].slice(0, MAX_LOGS);
    fs.writeFileSync(LOG_FILE, JSON.stringify(next, null, 2), 'utf8');
    return entry;
  } catch (err) {
    console.error('[teacherActivityLogger] Failed to write activity log:', err.message);
    return null;
  }
}


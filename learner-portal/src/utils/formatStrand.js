/**
 * ALS LMS — Learning Strand Formatting Utilities
 *
 * Uses the Admin-registered Learning Area code and name from the database
 * without overriding or hardcoding strand labels.
 */

const LEGACY_CODE_MAP = {
  'LS1-ENG': 'LS1',
  'LS1-FIL': 'LS1',
  'LS2-SCI': 'LS2',
  'LS3-MATH': 'LS3',
  'LS4-LIFE': 'LS4',
  'LS5-SOC': 'LS5',
  'LS6-DIGI': 'LS6',
};

/**
 * Returns the Learning Strand code as registered by the Admin,
 * normalizing only legacy suffixed seed codes (e.g. "LS1-ENG" -> "LS1").
 */
export function formatStrandCode(rawCode) {
  if (!rawCode) return '';
  const codeStr = String(rawCode).trim();
  const upper = codeStr.toUpperCase();
  if (LEGACY_CODE_MAP[upper]) {
    return LEGACY_CODE_MAP[upper];
  }
  return codeStr;
}

/**
 * Returns the Learning Strand name as registered in the database,
 * stripping only any legacy leading code prefix (e.g. "LS2 — Name").
 */
export function formatStrandName(rawName, _rawCode = '') {
  if (!rawName) return '';
  const name = String(rawName).trim();
  return name.replace(/^LS\s*\d+\s*[-—–:·]\s*/i, '').trim();
}

/**
 * Formats Learning Strand into standard format:
 * "Learning Strand Code · Learning Strand Name"
 */
export function formatStrandAndCode(rawCode, rawName) {
  if (typeof rawCode === 'object' && rawCode !== null) {
    const obj = rawCode;
    rawName = obj.name || obj.strand || obj.learningArea?.name;
    rawCode = obj.code || obj.strandCode || obj.learningArea?.code;
  }

  const code = formatStrandCode(rawCode);
  const name = formatStrandName(rawName, rawCode);

  if (code && name) {
    return `${code} · ${name}`;
  }
  return code || name || '';
}

/**
 * Standardizes a combined or legacy strand string.
 */
export function formatStrandDisplay(input) {
  if (!input) return '';
  if (typeof input === 'object') {
    return formatStrandAndCode(input);
  }

  const str = String(input).trim();
  const match = str.match(/^(LS\s*\d+)\s*[-—–·:]\s*(.+)$/i);
  if (match) {
    return formatStrandAndCode(match[1], match[2]);
  }

  return formatStrandName(str);
}

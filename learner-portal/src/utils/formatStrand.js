/**
 * ALS LMS — Standard Learning Strand Formatting Utilities
 *
 * Rules:
 * - Format: Learning Strand Code · Learning Strand Name
 * - Centered dot (·) with one space before and after
 * - Code first, Name second
 * - No spaces inside code (e.g. "LS2", NOT "LS 2")
 * - No suffixes appended (e.g. "LS2", NOT "LS2-SCI")
 * - Codes:
 *   - LS1-ENG -> LS1
 *   - LS1-FIL -> LS1
 *   - LS2-SCI -> LS2
 *   - LS3-MATH -> LS3
 *   - LS4-LIFE -> LS4
 *   - LS5-SOC -> LS5
 *   - LS6-DIGI -> LS6
 * - Names from Database:
 *   - LS1-ENG: "Communication Skills (English)"
 *   - LS1-FIL: "Communication Skills (Filipino)"
 *   - LS2-SCI: "Scientific & Critical Thinking Skills"
 *   - LS3-MATH: "Mathematical & Problem Solving Skills"
 *   - LS4-LIFE: "Life and Career Skills"
 *   - LS5-SOC: "Understanding Self & Society"
 *   - LS6-DIGI: "Digital Citizenship"
 */

// Canonical registered names from DepEd ALS Database
export const REGISTERED_STRAND_NAMES = {
  'LS1-ENG': 'Communication Skills (English)',
  'LS1-FIL': 'Communication Skills (Filipino)',
  'LS2-SCI': 'Scientific & Critical Thinking Skills',
  'LS3-MATH': 'Mathematical & Problem Solving Skills',
  'LS4-LIFE': 'Life and Career Skills',
  'LS5-SOC': 'Understanding Self & Society',
  'LS6-DIGI': 'Digital Citizenship',
};

/**
 * Returns the clean Learning Strand code without suffixes or internal spaces:
 * Examples:
 * - "LS1-ENG" -> "LS1"
 * - "LS 2" -> "LS2"
 * - "LS2-SCI" -> "LS2"
 * - "LS3-MATH" -> "LS3"
 */
export function formatStrandCode(rawCode) {
  if (!rawCode) return '';
  const codeStr = String(rawCode).trim();
  // Strip any internal spaces: e.g. "LS 2" -> "LS2"
  const noSpace = codeStr.replace(/\s+/g, '');
  // Match standard ALS strand prefix: LS1, LS2, LS3, LS4, LS5, LS6
  const match = noSpace.match(/^LS\d+/i);
  if (match) {
    return match[0].toUpperCase();
  }
  // Strip any trailing hyphenated suffix (e.g. "-SCI")
  return noSpace.replace(/-[A-Za-z0-9]+$/, '').toUpperCase();
}

/**
 * Returns the registered Learning Strand name from database or cleans legacy strings.
 * Examples:
 * - "LS2 — Scientific Literacy and Critical Thinking Skills" -> "Scientific & Critical Thinking Skills"
 * - "LS 1 – Communication Skills (English)" -> "Communication Skills (English)"
 * - "Scientific & Critical Thinking Skills" -> "Scientific & Critical Thinking Skills"
 */
export function formatStrandName(rawName, rawCode = '') {
  if (!rawName) return '';
  let name = String(rawName).trim();

  // Strip leading code/dash prefixes: e.g. "LS1 — ", "LS 2 – ", "LS2: "
  name = name.replace(/^LS\s*\d+\s*[-—–:·]\s*/i, '').trim();

  const codeUpper = String(rawCode || '').toUpperCase().trim();

  // Map known legacy variations to actual registered database names
  const lower = name.toLowerCase();
  if (lower.includes('scientific') && (lower.includes('thinking') || lower.includes('literacy'))) {
    return 'Scientific & Critical Thinking Skills';
  }
  if (lower.includes('understanding') && lower.includes('society')) {
    return 'Understanding Self & Society';
  }
  if (lower.includes('mathematical') && lower.includes('solving')) {
    return 'Mathematical & Problem Solving Skills';
  }
  if (lower.includes('life') && lower.includes('career')) {
    return 'Life and Career Skills';
  }
  if (lower.includes('digital') && lower.includes('citizenship')) {
    return 'Digital Citizenship';
  }
  if (lower.includes('communication') && lower.includes('english')) {
    return 'Communication Skills (English)';
  }
  if (lower.includes('communication') && lower.includes('filipino')) {
    return 'Communication Skills (Filipino)';
  }

  // If code is specifically LS1-ENG / LS1-FIL but name is just "Communication Skills"
  if (codeUpper === 'LS1-ENG' && !name.includes('(English)')) {
    return 'Communication Skills (English)';
  }
  if (codeUpper === 'LS1-FIL' && !name.includes('(Filipino)')) {
    return 'Communication Skills (Filipino)';
  }

  return name;
}

/**
 * Formats Learning Strand into standard format:
 * "Learning Strand Code · Learning Strand Name"
 *
 * Examples:
 * - "LS1 · Communication Skills (English)"
 * - "LS1 · Communication Skills (Filipino)"
 * - "LS2 · Scientific & Critical Thinking Skills"
 * - "LS3 · Mathematical & Problem Solving Skills"
 * - "LS4 · Life and Career Skills"
 * - "LS5 · Understanding Self & Society"
 * - "LS6 · Digital Citizenship"
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
 * Standardizes a combined or legacy strand string (e.g., from an API or header):
 * - "LS2 — Scientific Literacy and Critical Thinking Skills" -> "LS2 · Scientific & Critical Thinking Skills"
 * - "LS 1 – Communication Skills (English)" -> "LS1 · Communication Skills (English)"
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

  if (/^LS\s*\d+$/i.test(str)) {
    return formatStrandCode(str);
  }

  return formatStrandName(str);
}


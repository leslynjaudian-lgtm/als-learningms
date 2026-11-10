import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li'];

const PURIFY_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR: [],
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function hasFormattingMarkup(str) {
  return /<\s*\/?\s*(p|br|strong|b|em|i|u|ul|ol|li|div|span)\b/i.test(str);
}

/**
 * Convert legacy plain-text instructions into safe paragraph HTML if needed,
 * then sanitize with DOMPurify using a strict allowlist.
 */
export function sanitizeRichText(raw) {
  if (raw === undefined || raw === null) return '';
  const str = String(raw).trim();
  if (!str) return '';

  let htmlInput = str;
  if (!hasFormattingMarkup(str)) {
    const lines = str.split(/\r?\n/);
    htmlInput = lines
      .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p><br></p>'))
      .join('');
  }

  const cleaned = DOMPurify.sanitize(htmlInput, PURIFY_CONFIG).trim();
  const textCheck = stripRichTextToPlain(cleaned);
  return textCheck ? cleaned : '';
}

/**
 * Strip rich-text HTML down to clean plain text for compact card previews.
 */
export function stripRichTextToPlain(raw) {
  if (raw === undefined || raw === null) return '';
  const str = String(raw).trim();
  if (!str) return '';

  const spaced = str
    .replace(/<\s*\/(p|li|div)\s*>/gi, ' ')
    .replace(/<\s*br\s*\/?\s*>/gi, ' ');
  const plain = DOMPurify.sanitize(spaced, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return plain
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}


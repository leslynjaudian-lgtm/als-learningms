import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li'];

const SANITIZE_OPTIONS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {},
  allowedSchemes: [],
  disallowedTagsMode: 'discard',
};

/**
 * Check whether an HTML string from the rich-text editor has any actual text content.
 */
export function hasRichTextContent(html) {
  if (!html) return false;
  const textOnly = sanitizeHtml(String(html), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return textOnly.length > 0;
}

/**
 * Sanitize module instructions HTML using a strict allowlist
 * (Bold, Italic, Underline, Bulleted List, Numbered List, Paragraphs, Line Breaks).
 * Returns null if the resulting content is empty, or a safe HTML/text string.
 */
export function sanitizeInstructionsHtml(raw) {
  if (raw === undefined || raw === null) return null;
  const str = String(raw).trim();
  if (!str) return null;

  const cleaned = sanitizeHtml(str, SANITIZE_OPTIONS).trim();
  if (!hasRichTextContent(cleaned)) {
    return null;
  }
  return cleaned;
}


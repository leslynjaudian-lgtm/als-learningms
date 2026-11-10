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

  // Add spacing before block-closing tags so list items/paragraphs don't concatenate without spaces
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

function extractNodePreviewText(node) {
  if (!node) return '';
  if (node.nodeType === 3) {
    return (node.textContent || '').replace(/[ \t\r\n]+/g, ' ');
  }
  if (node.nodeType !== 1) return '';

  const tag = node.tagName.toLowerCase();
  if (tag === 'br') {
    return '\n';
  }

  if (tag === 'ul' || tag === 'ol') {
    const items = [];
    let index = 0;
    for (const child of node.childNodes) {
      if (child.nodeType === 1 && child.tagName.toLowerCase() === 'li') {
        index += 1;
        const inner = extractChildrenPreviewText(child)
          .replace(/[ \t]+/g, ' ')
          .replace(/\n+/g, ' ')
          .trim();
        if (inner) {
          const prefix = tag === 'ol' ? `${index}. ` : '• ';
          items.push(`${prefix}${inner}`);
        }
      }
    }
    return items.length > 0 ? `\n${items.join('\n')}\n` : '';
  }

  if (tag === 'p' || tag === 'div' || tag === 'li') {
    const inner = extractChildrenPreviewText(node)
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .trim();
    return inner ? `\n${inner}\n` : '';
  }

  return extractChildrenPreviewText(node);
}

function extractChildrenPreviewText(parent) {
  let out = '';
  for (const child of parent.childNodes) {
    out += extractNodePreviewText(child);
  }
  return out;
}

/**
 * Format rich-text or plain-text instructions into a clean, safe multi-line plain-text
 * preview preserving paragraph breaks, line breaks, bullet lists, and numbered lists.
 */
export function formatRichTextPreview(raw) {
  if (raw === undefined || raw === null) return '';
  const str = String(raw).trim();
  if (!str) return '';

  if (!hasFormattingMarkup(str)) {
    return str
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .join('\n');
  }

  const sanitized = DOMPurify.sanitize(str, PURIFY_CONFIG).trim();
  if (!sanitized) return '';

  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(sanitized, 'text/html');
    const rawPreview = extractChildrenPreviewText(doc.body);
    const normalized = rawPreview
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .join('\n');
    if (normalized) return normalized;
  }

  return stripRichTextToPlain(sanitized);
}


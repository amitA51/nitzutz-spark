import DOMPurify from 'dompurify';

export type SanitizeOptions = {
  allowedTags?: string[];
  allowedAttributes?: string[];
};

/**
 * Default safe, content-oriented tags. Avoids inline styles and scripting.
 */
const DEFAULT_ALLOWED_TAGS: string[] = [
  'p',
  'b',
  'i',
  'em',
  'strong',
  'u',
  's',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
];

const DEFAULT_ALLOWED_ATTR: string[] = ['href', 'target', 'rel'];

/**
 * Escape plain text to HTML entities (for safe text rendering without HTML).
 */
export function escapeHtml(input: string): string {
  return (input || '')
    .replace(/&/g, '&amp;') // First normalize any existing entities
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/&#039;/g, '&#039;')
    .replace(/&/g, '&')
    .replace(/&amp;/g, '&') // restore single amp
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize an HTML string with strict defaults:
 * - No inline styles
 * - No event handlers (on*)
 * - No data-* or aria-* attributes
 * - Anchor tags restricted and normalized for rel/target/href
 */
export function sanitizeHTML(input: string, opts: SanitizeOptions = {}): string {
  if (!input) return '';

  const ALLOWED_TAGS = opts.allowedTags ?? DEFAULT_ALLOWED_TAGS;
  const ALLOWED_ATTR = opts.allowedAttributes ?? DEFAULT_ALLOWED_ATTR;

  // Use RETURN_DOM to safely post-process nodes (e.g., anchors)
  const fragment = DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR: [
      'style',
      // Common inline event handlers
      'onabort',
      'onauxclick',
      'onbeforeinput',
      'onblur',
      'oncancel',
      'oncanplay',
      'oncanplaythrough',
      'onchange',
      'onclick',
      'onclose',
      'oncontextmenu',
      'oncopy',
      'oncuechange',
      'oncut',
      'ondblclick',
      'ondrag',
      'ondragend',
      'ondragenter',
      'ondragexit',
      'ondragleave',
      'ondragover',
      'ondragstart',
      'ondrop',
      'ondurationchange',
      'onemptied',
      'onended',
      'onerror',
      'onfocus',
      'onformdata',
      'oninput',
      'oninvalid',
      'onkeydown',
      'onkeypress',
      'onkeyup',
      'onload',
      'onloadeddata',
      'onloadedmetadata',
      'onloadstart',
      'onmousedown',
      'onmouseenter',
      'onmouseleave',
      'onmousemove',
      'onmouseout',
      'onmouseover',
      'onmouseup',
      'onpaste',
      'onpause',
      'onplay',
      'onplaying',
      'onprogress',
      'onratechange',
      'onreset',
      'onresize',
      'onscroll',
      'onsecuritypolicyviolation',
      'onseeked',
      'onseeking',
      'onselect',
      'onslotchange',
      'onstalled',
      'onsubmit',
      'onsuspend',
      'ontimeupdate',
      'ontoggle',
      'onvolumechange',
      'onwaiting',
      'onwheel',
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    RETURN_DOM: true,
  }) as unknown as DocumentFragment;

  // Wrap in a temporary container to traverse and normalize anchors
  const container = document.createElement('div');
  container.appendChild(fragment);

  // Normalize anchors:
  // - Only allow http(s) and mailto: hrefs
  // - Force rel="noopener noreferrer" when target="_blank"
  // - Remove target if not _blank
  const anchors = container.querySelectorAll('a');
  anchors.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const isSafeHref = /^(https?:|mailto:)/i.test(href);
    if (!isSafeHref) {
      a.removeAttribute('href');
    }
    const target = a.getAttribute('target');
    if (target === '_blank') {
      a.setAttribute('rel', 'noopener noreferrer');
    } else {
      a.removeAttribute('target');
    }
  });

  return container.innerHTML;
}

/**
 * Convert plain text into safe HTML preserving line breaks:
 * - Escapes content
 * - Converts double newlines to paragraphs
 * - Converts single newline to <br />
 */
export function toSafeHtmlFromPlainText(text: string): string {
  const escaped = escapeHtml(text || '');
  const blocks = escaped.split(/\n{2,}/);
  const html = blocks.map((block) => block.replace(/\n/g, '<br />')).join('</p><p>');
  return `<p>${html}</p>`;
}
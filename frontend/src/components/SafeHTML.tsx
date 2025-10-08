import React, { useMemo } from 'react';
import type { ElementType } from 'react';
import { sanitizeHTML, toSafeHtmlFromPlainText, type SanitizeOptions } from '../utils/sanitizeHTML';

type SafeHTMLProps = {
  /**
   * Raw HTML string to sanitize and render
   */
  html?: string;
  /**
   * Plain text to render (will be escaped and line breaks preserved)
   */
  text?: string;
  /**
   * Optional wrapper element, default: 'div'
   */
  as?: ElementType;
  className?: string;
  options?: SanitizeOptions;
  'data-testid'?: string;
  'aria-label'?: string;
};

/**
 * SafeHTML - centralized, safe HTML renderer.
 * - If 'text' is provided, it will be escaped and line breaks preserved.
 * - Else, 'html' will be sanitized with strict defaults.
 * - Renders via dangerouslySetInnerHTML ONLY here (lint rule will allow this component).
 */
const SafeHTML: React.FC<SafeHTMLProps> = ({
  html,
  text,
  as: Tag = 'div',
  className,
  options,
  'data-testid': testId,
  'aria-label': ariaLabel,
}) => {
  const safe = useMemo(() => {
    if (typeof text === 'string' && text.length > 0) {
      return toSafeHtmlFromPlainText(text);
    }
    if (typeof html === 'string') {
      return sanitizeHTML(html, options);
    }
    return '';
  }, [html, text, options]);

  return React.createElement(Tag, {
    className,
    'data-testid': testId,
    'aria-label': ariaLabel,
    dangerouslySetInnerHTML: { __html: safe },
  });
};

export default SafeHTML;
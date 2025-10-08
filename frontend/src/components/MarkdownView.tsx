import React, { useMemo } from 'react';
import type { ElementType } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import SafeHTML from './SafeHTML';
import type { SanitizeOptions } from '../utils/sanitizeHTML';

type MarkdownViewProps = {
  markdown: string;
  className?: string;
  as?: ElementType;
  sanitizeOptions?: SanitizeOptions;
  'data-testid'?: string;
  'aria-label'?: string;
};

/**
 * MarkdownView
 * - Compiles markdown to HTML (remark & rehype)
 * - Sanitizes via SafeHTML (DOMPurify) before rendering
 * - Falls back to text rendering if compilation fails
 */
const MarkdownView: React.FC<MarkdownViewProps> = ({
  markdown,
  className,
  as,
  sanitizeOptions,
  ...rest
}) => {
  const { compiledHtml, compileOk } = useMemo(() => {
    try {
      const file = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(markdown || '');
      return { compiledHtml: String(file.value), compileOk: true };
    } catch (_e) {
      return { compiledHtml: '', compileOk: false };
    }
  }, [markdown]);

  if (!compileOk) {
    // Fallback: render as plain text safely (preserve line breaks)
    return (
      <SafeHTML
        text={markdown || ''}
        className={className}
        as={as}
        options={sanitizeOptions}
        {...rest}
      />
    );
  }

  return (
    <SafeHTML
      html={compiledHtml}
      className={className}
      as={as}
      options={sanitizeOptions}
      {...rest}
    />
  );
};

export default MarkdownView;
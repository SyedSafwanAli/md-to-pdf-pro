/**
 * Preview.jsx — Right panel: live Markdown preview.
 *
 * Uses react-markdown with:
 *   - remark-gfm       → GitHub Flavoured Markdown (tables, task lists, etc.)
 *   - rehype-highlight → syntax-highlighted code blocks (client-side)
 *   - rehype-raw       → allows passthrough of raw HTML inside Markdown
 *
 * The rendered output uses the .prose-preview utility classes defined in
 * index.css for consistent, print-friendly typography.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

// highlight.js CSS — GitHub theme, loaded once here
import 'highlight.js/styles/github-dark.css';

const EMPTY_PLACEHOLDER = `# Preview

Start typing in the editor on the left to see your rendered Markdown here.

Your **formatted document** will appear in real time.`;

// ── Component ─────────────────────────────────────────────────────────────

export default function Preview({ markdown }) {
  const content = markdown.trim() || EMPTY_PLACEHOLDER;
  const isEmpty = !markdown.trim();

  return (
    <div className="panel flex-1 min-h-0 animate-fade-in">
      {/* Panel header */}
      <div className="panel-header">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Live Preview
        </span>
        <span className="
          text-[10px] font-medium px-2 py-0.5 rounded-full
          bg-emerald-100 text-emerald-700
          dark:bg-emerald-900/30 dark:text-emerald-400
        ">
          Real-time
        </span>
      </div>

      {/* Scrollable preview area */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0">
        <article className={`prose-preview ${isEmpty ? 'opacity-40' : ''} transition-opacity`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              // Ensure external links open in a new tab safely
              a({ node, ...props }) {
                const isExternal = props.href && props.href.startsWith('http');
                return (
                  <a
                    {...props}
                    {...(isExternal
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  />
                );
              },
              // Wrap tables in a scrollable container so they don't overflow
              table({ node, ...props }) {
                return (
                  <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <table {...props} />
                  </div>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}

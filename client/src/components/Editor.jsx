/**
 * Editor.jsx — Left panel: Markdown input area.
 *
 * Features:
 *   - Plain <textarea> for the Markdown source (no heavy editor library needed)
 *   - Drag & drop .md file upload via react-dropzone
 *   - Live character counter
 *   - Page size selector (A4 / Letter)
 *   - Optional header / footer text inputs
 *   - Download PDF button
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// ── Inline SVG icons ──────────────────────────────────────────────────────

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4-4 4M12 8v8" />
    </svg>
  );
}

function DownloadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4-4 4M12 8v8" transform="rotate(180 12 12)" />
      <path strokeLinecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
      <path strokeLinecap="round" d="M12 3v9m0 0l-3-3m3 3l3-3" />
    </svg>
  );
}

function SpinnerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

const MAX_CHARS = 1_000_000;

export default function Editor({
  markdown,
  onMarkdownChange,
  pageSize,
  onPageSizeChange,
  headerText,
  onHeaderChange,
  footerText,
  onFooterChange,
  onDownload,
  loading,
  error,
}) {
  // ── Drag & drop file upload ─────────────────────────────────────────────
  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        onMarkdownChange(text.slice(0, MAX_CHARS));
      };
      reader.readAsText(file);
    },
    [onMarkdownChange]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'text/markdown': ['.md', '.markdown'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    noClick: true,   // We control click manually (textarea shouldn't open file dialog)
    noKeyboard: true,
  });

  const charCount = markdown.length;
  const nearLimit = charCount > MAX_CHARS * 0.9;

  return (
    <div className="panel flex-1 min-h-0 animate-fade-in">
      {/* ── Panel header ─────────────────────────────────────────────────── */}
      <div className="panel-header gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Markdown Input
          </span>
          {/* Character counter */}
          <span className={`
            text-xs font-mono px-1.5 py-0.5 rounded
            ${nearLimit
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
              : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            }
          `}>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>

        {/* Upload button */}
        <button onClick={open} className="btn-ghost text-xs gap-1.5 h-7 px-3">
          <UploadIcon className="w-3.5 h-3.5" />
          Upload .md
        </button>

        {/* Hidden dropzone input */}
        <input {...getInputProps()} />
      </div>

      {/* ── Drag-and-drop overlay wrapper ────────────────────────────────── */}
      <div
        {...getRootProps()}
        className={`
          relative flex-1 flex flex-col min-h-0
          ${isDragActive ? 'ring-2 ring-brand-500 ring-inset bg-brand-50 dark:bg-brand-950/20' : ''}
          transition-colors
        `}
      >
        {isDragActive && (
          <div className="
            absolute inset-0 z-10 flex flex-col items-center justify-center gap-3
            bg-brand-50/90 dark:bg-brand-950/60 backdrop-blur-sm
            pointer-events-none
          ">
            <UploadIcon className="w-10 h-10 text-brand-500" />
            <p className="font-semibold text-brand-700 dark:text-brand-300">
              Drop your .md file here
            </p>
          </div>
        )}

        {/* ── Textarea ──────────────────────────────────────────────────── */}
        <textarea
          value={markdown}
          onChange={(e) => onMarkdownChange(e.target.value.slice(0, MAX_CHARS))}
          placeholder={`# Your Markdown here\n\nStart typing or drag & drop a .md file…\n\n## Features\n- Syntax highlighted code blocks\n- Tables, blockquotes, lists\n- Custom header & footer\n- A4 or Letter page size`}
          spellCheck={false}
          className="
            flex-1 resize-none p-4
            font-mono text-sm leading-relaxed
            text-gray-800 dark:text-gray-100
            bg-transparent
            placeholder-gray-300 dark:placeholder-gray-600
            focus:outline-none
            min-h-0
          "
          style={{ minHeight: '200px' }}
        />
      </div>

      {/* ── Options section ──────────────────────────────────────────────── */}
      <div className="
        border-t border-gray-100 dark:border-gray-800
        px-4 py-3 space-y-3
        bg-gray-50/50 dark:bg-gray-800/30
      ">
        {/* Page size + header/footer row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Page size */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Page Size
            </label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(e.target.value)}
              className="select text-sm"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
            </select>
          </div>

          {/* Header text */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Header Text <span className="text-gray-300">(optional)</span>
            </label>
            <input
              type="text"
              value={headerText}
              onChange={(e) => onHeaderChange(e.target.value.slice(0, 200))}
              placeholder="e.g. Confidential — Acme Corp"
              maxLength={200}
              className="input text-sm"
            />
          </div>

          {/* Footer text */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Footer Text <span className="text-gray-300">(optional)</span>
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => onFooterChange(e.target.value.slice(0, 200))}
              placeholder="e.g. © 2025 My Company"
              maxLength={200}
              className="input text-sm"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="
            flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm
            bg-rose-50 dark:bg-rose-900/20
            border border-rose-200 dark:border-rose-800
            text-rose-700 dark:text-rose-400
            animate-fade-in
          ">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v5a1 1 0 102 0V5zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Download button */}
        <button
          onClick={onDownload}
          disabled={loading || !markdown.trim()}
          className="btn-primary w-full py-3"
        >
          {loading
            ? <><SpinnerIcon className="w-4 h-4 animate-spin" /> Generating PDF…</>
            : <><DownloadIcon className="w-4 h-4" /> Download PDF</>
          }
        </button>
      </div>
    </div>
  );
}

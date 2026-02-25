/**
 * App.jsx — Root component.
 *
 * State lives here and is passed down to the Editor and Preview panels.
 * This keeps the children pure and easy to test/replace.
 *
 * Layout:
 *   <Header />
 *   <main>
 *     <Editor />   (left, ~50%)
 *     <Preview />  (right, ~50%)
 *   </main>
 *   <Loader />     (full-screen overlay, shown only during conversion)
 */

import { useState, useCallback } from 'react';
import Header from './components/Header';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Loader from './components/Loader';
import { convertMarkdownToPdf, downloadBlob } from './api';

// ── Default sample document so the app looks great on first open ──────────
const SAMPLE_MARKDOWN = `# Welcome to MarkPDF Pro

Convert your **Markdown** documents into beautifully styled PDFs in seconds.

## Features

- ✅ Live preview with syntax highlighting
- ✅ Drag & drop .md file upload
- ✅ A4 & Letter page sizes
- ✅ Custom header and footer text
- ✅ Dark mode support

## Code Example

\`\`\`javascript
// Example: async PDF generation
async function generateReport(data) {
  const markdown = buildMarkdown(data);
  const pdf = await convertToPdf(markdown, {
    pageSize: 'A4',
    footerText: '© 2025 My Company',
  });
  return pdf;
}
\`\`\`

## Table Example

| Feature        | Free  | Pro   |
|----------------|-------|-------|
| Page sizes     | A4    | All   |
| Custom headers | ✗     | ✅    |
| Batch convert  | ✗     | ✅    |

> **Tip:** Use the options below the editor to set a custom header and footer
> that will appear on every page of your PDF.

---

*Start editing this document or drag & drop your own .md file!*
`;

// ── Component ─────────────────────────────────────────────────────────────

export default function App() {
  // Editor state
  const [markdown, setMarkdown]     = useState(SAMPLE_MARKDOWN);
  const [pageSize, setPageSize]     = useState('A4');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');

  // Async operation state
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── PDF download handler ────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!markdown.trim()) return;

    setError('');
    setLoading(true);

    try {
      const blob = await convertMarkdownToPdf({
        markdown,
        pageSize,
        headerText,
        footerText,
      });

      downloadBlob(blob, `document-${Date.now()}.pdf`);
    } catch (err) {
      // Extract the most useful error message available
      let msg = 'Something went wrong. Please try again.';

      if (err.response) {
        // Server returned a structured JSON error
        const data = err.response.data;
        if (data instanceof Blob) {
          // Axios returned a Blob even for errors when responseType='blob'
          try {
            const text = await data.text();
            const json = JSON.parse(text);
            msg = json.message || json.error || msg;
          } catch {
            msg = `Server error: ${err.response.status}`;
          }
        } else {
          msg = data?.message || data?.error || msg;
        }
      } else if (err.code === 'ECONNABORTED') {
        msg = 'Request timed out. Your document may be too large.';
      } else if (!navigator.onLine) {
        msg = 'You appear to be offline. Check your connection and try again.';
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [markdown, pageSize, headerText, footerText]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Navigation bar */}
      <Header />

      {/* Main two-column workspace */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-screen-2xl mx-auto w-full">
        {/* Left panel — Editor */}
        <div className="flex flex-col flex-1 min-h-0" style={{ minHeight: '60vh' }}>
          <Editor
            markdown={markdown}
            onMarkdownChange={setMarkdown}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            headerText={headerText}
            onHeaderChange={setHeaderText}
            footerText={footerText}
            onFooterChange={setFooterText}
            onDownload={handleDownload}
            loading={loading}
            error={error}
          />
        </div>

        {/* Right panel — Live Preview */}
        <div className="flex flex-col flex-1 min-h-0" style={{ minHeight: '60vh' }}>
          <Preview markdown={markdown} />
        </div>
      </main>

      {/* Footer bar */}
      <footer className="
        text-center text-xs text-gray-400 dark:text-gray-600
        pb-4 pt-1 select-none
      ">
        MarkPDF Pro — Built with React, Vite, Tailwind CSS &amp; Puppeteer
      </footer>

      {/* Full-screen loading overlay */}
      {loading && <Loader />}
    </div>
  );
}

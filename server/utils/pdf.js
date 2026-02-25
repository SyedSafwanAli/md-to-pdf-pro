/**
 * utils/pdf.js — Core PDF generation logic.
 *
 * Responsibilities:
 *   1. Convert Markdown → styled HTML using `marked` + `marked-highlight` + highlight.js
 *   2. Wrap HTML in a full-page template with professional typography and print styles
 *   3. Use a shared Puppeteer browser to render the page and produce a PDF buffer
 */

'use strict';

const { marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const hljs = require('highlight.js');

// ---------------------------------------------------------------------------
// Configure marked with syntax highlighting
// ---------------------------------------------------------------------------
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

marked.setOptions({
  gfm: true,        // GitHub-flavoured Markdown
  breaks: true,     // Convert \n to <br>
});

// ---------------------------------------------------------------------------
// Page size dimensions (in mm, matching Puppeteer's format strings)
// ---------------------------------------------------------------------------
const PAGE_FORMATS = {
  A4: 'A4',
  Letter: 'Letter',
};

// ---------------------------------------------------------------------------
// buildHtml — produces the full HTML document for Puppeteer to render
// ---------------------------------------------------------------------------
function buildHtml(markdownContent) {
  const body = marked.parse(markdownContent);

  // highlight.js GitHub-dark theme — inlined to keep the server self-contained
  const hljsCss = `
    .hljs{color:#c9d1d9;background:#161b22}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,
    .hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#ff7b72}
    .hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#d2a8ff}
    .hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-variable,
    .hljs-selector-attr,.hljs-selector-class,.hljs-selector-id{color:#79c0ff}
    .hljs-regexp,.hljs-string,.hljs-meta .hljs-string{color:#a5d6ff}
    .hljs-built_in,.hljs-symbol{color:#ffa657}
    .hljs-comment,.hljs-code,.hljs-formula{color:#8b949e}
    .hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo{color:#7ee787}
    .hljs-subst{color:#c9d1d9}.hljs-section{color:#1f6feb;font-weight:700}
    .hljs-bullet{color:#f2cc60}.hljs-emphasis{color:#c9d1d9;font-style:italic}
    .hljs-strong{color:#c9d1d9;font-weight:700}.hljs-addition{color:#aff5b4;background-color:#033a16}
    .hljs-deletion{color:#ffdcd7;background-color:#67060c}
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Document</title>
  <style>
    /* ── Reset & base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.75;
      color: #1a1a1a;
      background: #ffffff;
      padding: 0 48px;
    }

    /* ── Typography ── */
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Arial', 'Helvetica Neue', sans-serif;
      font-weight: 700;
      color: #111827;
      margin-top: 1.6em;
      margin-bottom: 0.5em;
      line-height: 1.3;
    }
    h1 { font-size: 2em;   border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.2em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1.1em; }
    h5, h6 { font-size: 1em; color: #374151; }

    p { margin: 0.8em 0; }

    /* ── Links ── */
    a { color: #2563eb; text-decoration: underline; }

    /* ── Lists ── */
    ul, ol { margin: 0.8em 0 0.8em 2em; }
    li { margin: 0.3em 0; }
    li > ul, li > ol { margin-top: 0.2em; }

    /* ── Blockquote ── */
    blockquote {
      border-left: 4px solid #6366f1;
      margin: 1em 0;
      padding: 0.5em 1em;
      background: #f5f3ff;
      color: #374151;
      border-radius: 0 4px 4px 0;
    }

    /* ── Inline code ── */
    code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.875em;
      background: #f3f4f6;
      color: #dc2626;
      padding: 0.15em 0.4em;
      border-radius: 4px;
    }

    /* ── Code block ── */
    pre {
      margin: 1em 0;
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    pre code {
      display: block;
      padding: 1em 1.2em;
      background: #161b22;
      color: #c9d1d9;
      font-size: 0.85em;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      font-size: 0.95em;
      page-break-inside: avoid;
    }
    th {
      background: #1e40af;
      color: #ffffff;
      font-family: 'Arial', sans-serif;
      font-weight: 600;
      text-align: left;
      padding: 0.6em 0.9em;
    }
    td {
      padding: 0.5em 0.9em;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) td { background: #f9fafb; }

    /* ── Images ── */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 0.5em 0;
    }

    /* ── Horizontal rule ── */
    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 2em 0;
    }

    /* ── Task list ── */
    input[type="checkbox"] { margin-right: 0.5em; }

    /* ── Print media — remove shadows, reset backgrounds ── */
    @media print {
      body { padding: 0; }
      pre { box-shadow: none; }
      a { color: #1d4ed8; }
      h1, h2 { page-break-after: avoid; }
    }

    /* ── Highlight.js theme ── */
    ${hljsCss}
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// generatePdf — main exported function
//
// @param {object} browser     — shared Puppeteer browser from app.locals
// @param {string} markdown    — raw Markdown string
// @param {object} options     — { pageSize, headerText, footerText }
// @returns {Buffer}           — PDF binary buffer
// ---------------------------------------------------------------------------
async function generatePdf(browser, markdown, options = {}) {
  const {
    pageSize = 'A4',
    headerText = '',
    footerText = '',
  } = options;

  const format = PAGE_FORMATS[pageSize] || 'A4';
  const html = buildHtml(markdown);

  // Use a fresh page per request to avoid state bleed between concurrent calls
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: Number(process.env.PDF_TIMEOUT_MS) || 30_000,
    });

    // Puppeteer header/footer templates use a limited set of inline styles;
    // the <span class="..."> tokens are replaced by Puppeteer at render time.
    const headerTemplate = headerText
      ? `<div style="font-size:9px;font-family:Arial,sans-serif;color:#6b7280;
                     width:100%;padding:4px 48px;border-bottom:1px solid #e5e7eb;
                     box-sizing:border-box;">
           ${escapeHtml(headerText)}
         </div>`
      : '<div></div>';

    const footerTemplate = `
      <div style="font-size:9px;font-family:Arial,sans-serif;color:#6b7280;
                  width:100%;padding:4px 48px;border-top:1px solid #e5e7eb;
                  display:flex;justify-content:space-between;box-sizing:border-box;">
        <span>${footerText ? escapeHtml(footerText) : ''}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`;

    // Puppeteer v22+ returns Uint8Array instead of Buffer.
    // Buffer.from() ensures Express serialises the binary correctly.
    const result = await page.pdf({
      format,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: headerText ? '60px' : '48px',
        bottom: '60px',
        left: '0',
        right: '0',
      },
    });

    return Buffer.from(result);
  } finally {
    // Always close the page to free memory
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Tiny HTML-escape helper (used for header/footer text only)
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { generatePdf };

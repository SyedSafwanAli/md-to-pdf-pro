/**
 * routes/convert.js — POST /api/convert
 *
 * Validates the incoming request, delegates PDF generation to utils/pdf.js,
 * and streams the resulting buffer back as an attachment download.
 */

'use strict';

const express = require('express');
const { generatePdf } = require('../utils/pdf');

const router = express.Router();

// Allowed page size values
const VALID_PAGE_SIZES = new Set(['A4', 'Letter']);

// ---------------------------------------------------------------------------
// POST /api/convert
// ---------------------------------------------------------------------------
router.post('/convert', async (req, res, next) => {
  try {
    const { markdown, pageSize = 'A4', headerText = '', footerText = '' } = req.body;

    // ── Input validation ──────────────────────────────────────────────────
    if (typeof markdown !== 'string' || markdown.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: '`markdown` is required and must be a non-empty string.',
      });
    }

    if (!VALID_PAGE_SIZES.has(pageSize)) {
      return res.status(400).json({
        error: 'Validation error',
        message: `\`pageSize\` must be one of: ${[...VALID_PAGE_SIZES].join(', ')}.`,
      });
    }

    if (typeof headerText !== 'string' || headerText.length > 200) {
      return res.status(400).json({
        error: 'Validation error',
        message: '`headerText` must be a string of 200 characters or fewer.',
      });
    }

    if (typeof footerText !== 'string' || footerText.length > 200) {
      return res.status(400).json({
        error: 'Validation error',
        message: '`footerText` must be a string of 200 characters or fewer.',
      });
    }

    // ── PDF generation ────────────────────────────────────────────────────
    const browser = req.app.locals.browser;

    if (!browser) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'PDF engine is not ready. Please try again shortly.',
      });
    }

    const pdfBuffer = await generatePdf(browser, markdown.trim(), {
      pageSize,
      headerText: headerText.trim(),
      footerText: footerText.trim(),
    });

    // ── Send PDF as downloadable attachment ───────────────────────────────
    const filename = `document-${Date.now()}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      // Prevent caching of user-specific PDFs
      'Cache-Control': 'no-store',
    });

    return res.send(pdfBuffer);
  } catch (err) {
    // Delegate to global error handler
    next(err);
  }
});

module.exports = router;

/**
 * middleware/errorHandler.js — Global error-handling middleware.
 *
 * Must be registered LAST in the Express middleware chain (after all routes).
 * Normalises errors into a consistent JSON shape and avoids leaking stack
 * traces in production.
 */

'use strict';

const isDev = process.env.NODE_ENV !== 'production';

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // CORS errors (thrown as plain Error from our CORS config)
  if (err.message && err.message.startsWith('CORS policy:')) {
    return res.status(403).json({ error: 'Forbidden', message: err.message });
  }

  // Express body-parser size limit exceeded
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Request body exceeds the 10 MB limit.',
    });
  }

  // Puppeteer / PDF generation timeouts
  if (err.message && err.message.includes('timeout')) {
    return res.status(504).json({
      error: 'Gateway timeout',
      message: 'PDF generation timed out. Try a smaller document.',
    });
  }

  // Default 500
  const statusCode = err.statusCode || err.status || 500;
  const message = isDev ? err.message : 'An unexpected error occurred. Please try again.';

  return res.status(statusCode).json({
    error: 'Internal server error',
    message,
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;

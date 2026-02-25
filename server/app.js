/**
 * app.js — Entry point for the Markdown-to-PDF API server.
 *
 * Architecture:
 *   - Express handles HTTP routing and middleware stack
 *   - A single shared Puppeteer browser instance is created at startup
 *     and injected into req.app.locals so every route handler can reuse it
 *     without paying the ~200 ms browser-launch overhead per request.
 *   - Graceful shutdown ensures the browser is closed before the process exits.
 */

'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const puppeteer = require('puppeteer');

const convertRouter = require('./routes/convert');
const errorHandler = require('./middleware/errorHandler');

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
app.use(helmet());

// ---------------------------------------------------------------------------
// CORS — allow configured origins (comma-separated in .env)
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server requests (no Origin header) in dev
      if (!origin && isDev) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS policy: origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// ---------------------------------------------------------------------------
// Request logging
// ---------------------------------------------------------------------------
app.use(morgan(isDev ? 'dev' : 'combined'));

// ---------------------------------------------------------------------------
// Body parsing — 10 MB limit to handle large Markdown docs
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// Rate limiting — configurable via .env (default: 50 req / 15 min per IP)
// ---------------------------------------------------------------------------
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});

app.use('/api/', limiter);

// ---------------------------------------------------------------------------
// Health check (no auth / rate-limit required)
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api', convertRouter);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Global error handler (must be last middleware)
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server — launch Puppeteer first, then listen
// ---------------------------------------------------------------------------
async function start() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    // Share the browser instance with all route handlers
    app.locals.browser = browser;

    const server = app.listen(PORT, () => {
      console.log(`[server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });

    // -----------------------------------------------------------------------
    // Graceful shutdown — close browser and HTTP server cleanly
    // -----------------------------------------------------------------------
    const shutdown = async (signal) => {
      console.log(`[server] ${signal} received — shutting down gracefully`);
      server.close(async () => {
        await browser.close();
        console.log('[server] Closed. Goodbye.');
        process.exit(0);
      });

      // Force exit after 10 s if something hangs
      setTimeout(() => {
        console.error('[server] Forced exit after timeout');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();

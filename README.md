# MarkPDF Pro — Markdown to PDF SaaS

A production-ready full-stack web application that converts Markdown documents into beautifully styled PDFs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js, Puppeteer, Marked, Highlight.js |
| **Frontend** | React 18, Vite, Tailwind CSS, Axios, React Markdown |
| **Security** | Helmet, CORS, express-rate-limit |
| **Dev** | Nodemon, ESLint |
| **Deploy** | Docker (server) |

---

## Project Structure

```
md-to-pdf-pro/
├── server/
│   ├── app.js                   # Express entry point, Puppeteer lifecycle
│   ├── routes/
│   │   └── convert.js           # POST /api/convert — validation & response
│   ├── utils/
│   │   └── pdf.js               # Markdown→HTML→PDF pipeline
│   ├── middleware/
│   │   └── errorHandler.js      # Global error normaliser
│   ├── .env                     # Environment variables (never commit!)
│   ├── package.json
│   └── Dockerfile
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # Nav bar with dark-mode toggle
│   │   │   ├── Editor.jsx       # Markdown textarea + dropzone + options
│   │   │   ├── Preview.jsx      # Live react-markdown preview
│   │   │   └── Loader.jsx       # Full-screen conversion spinner
│   │   ├── App.jsx              # Root: state + download handler
│   │   ├── main.jsx             # React entry + dark-mode bootstrap
│   │   ├── api.js               # Axios instance + convertMarkdownToPdf()
│   │   └── index.css            # Tailwind directives + custom utilities
│   ├── index.html
│   ├── vite.config.js           # Vite + /api proxy → backend
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- Google Chrome / Chromium is downloaded automatically by Puppeteer on `npm install`

---

## Local Development Setup

### 1 — Clone / enter the project

```bash
cd "Md to PDF"
```

### 2 — Install & start the backend

```bash
cd server
npm install        # also downloads Puppeteer's Chromium (~170 MB, one-time)
npm run dev        # starts on http://localhost:5000 with hot-reload
```

The server reads `server/.env`. The defaults work out of the box.

### 3 — Install & start the frontend

Open a **second terminal**:

```bash
cd client
npm install
npm run dev        # starts on http://localhost:5173
```

Vite automatically proxies `/api/*` requests to `http://localhost:5000`.

### 4 — Open the app

Navigate to **http://localhost:5173** in your browser.

---

## API Reference

### `POST /api/convert`

Converts a Markdown string to a PDF and returns it as a binary download.

**Request body** (`application/json`, max 10 MB):

```json
{
  "markdown":   "# Hello World\n\nSome **bold** text.",
  "pageSize":   "A4",
  "headerText": "Confidential — Acme Corp",
  "footerText": "© 2025 My Company"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `markdown` | string | ✅ | Raw Markdown content |
| `pageSize` | `"A4"` \| `"Letter"` | ✅ | PDF page format |
| `headerText` | string | ✗ | Max 200 chars, shown in page header |
| `footerText` | string | ✗ | Max 200 chars, shown left of page numbers |

**Response:** `Content-Type: application/pdf` binary buffer.

### `GET /health`

Returns `{ "status": "ok", "timestamp": "…" }` — useful for load-balancer probes.

---

## Environment Variables (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port |
| `NODE_ENV` | `development` | `production` hides stack traces |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate-limit window (15 min) |
| `RATE_LIMIT_MAX` | `50` | Max requests per window per IP |
| `PDF_TIMEOUT_MS` | `30000` | Puppeteer page timeout (ms) |

---

## Docker (backend only)

```bash
cd server

# Build
docker build -t md-to-pdf-server .

# Run
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  md-to-pdf-server
```

---

## Production Build (frontend)

```bash
cd client
npm run build     # outputs static files to client/dist/
npm run preview   # local preview of the production build
```

Deploy the `client/dist/` folder to any static host (Netlify, Vercel, S3 + CloudFront, etc.) and point `VITE_API_BASE_URL` at your deployed backend URL.

```bash
# Example: Vite production build with a remote API
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

---

## Security Notes

- Helmet sets strict HTTP security headers automatically.
- Rate limiting (50 req / 15 min per IP) prevents abuse.
- Request bodies are capped at 10 MB server-side.
- Header/footer inputs are HTML-escaped before being injected into the PDF template.
- The Docker image runs as a non-root user (`pptruser`).
- Never commit `server/.env` with secrets — add it to `.gitignore`.

---

## License

MIT — free to use, modify, and deploy.

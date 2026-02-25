/**
 * api.js — Axios instance and typed API helper functions.
 *
 * Using Vite's dev-server proxy (/api → http://localhost:5000) in development
 * means we never need to hard-code the backend URL in this file.
 * In production, set VITE_API_BASE_URL to your deployed API origin.
 */

import axios from 'axios';

// Base URL: empty string → same origin (works with Vite proxy and prod CDN)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000, // 60 s — PDF generation can take a while for large docs
});

/**
 * convertMarkdownToPdf
 *
 * @param {object} payload
 * @param {string}  payload.markdown   - Raw Markdown content
 * @param {string}  payload.pageSize   - "A4" | "Letter"
 * @param {string=} payload.headerText - Optional header line
 * @param {string=} payload.footerText - Optional footer line
 * @returns {Promise<Blob>} PDF blob
 */
export async function convertMarkdownToPdf({ markdown, pageSize, headerText, footerText }) {
  const response = await api.post(
    '/api/convert',
    { markdown, pageSize, headerText, footerText },
    { responseType: 'blob' }  // Tell Axios to return binary data as a Blob
  );
  return response.data;
}

/**
 * downloadBlob — creates a temporary <a> element to trigger a file download.
 *
 * @param {Blob}   blob     - The PDF blob
 * @param {string} filename - Suggested file name
 */
export function downloadBlob(blob, filename = 'document.pdf') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  // Clean up the object URL immediately after click
  link.addEventListener('click', () => {
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  });
}

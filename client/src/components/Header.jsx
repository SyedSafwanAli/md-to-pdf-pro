/**
 * Header.jsx — Top navigation bar.
 *
 * Displays the brand logo, a tagline, and a dark-mode toggle button.
 * The toggle writes the preference to localStorage so it persists across
 * page reloads (the preference is read in main.jsx before React renders).
 */

import { useState, useEffect, useCallback } from 'react';

// ── Icons (inlined SVGs to avoid an icon-library dependency) ──────────────

function SunIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function FileTextIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export default function Header() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  }, []);

  return (
    <header className="
      sticky top-0 z-40 w-full
      bg-white/80 dark:bg-gray-900/80
      backdrop-blur-md
      border-b border-gray-100 dark:border-gray-800
      shadow-sm
    ">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="
            flex items-center justify-center w-8 h-8 rounded-lg
            bg-brand-600 text-white shadow-sm
          ">
            <FileTextIcon className="w-4 h-4" />
          </span>
          <div className="leading-none">
            <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              MarkPDF
            </span>
            <span className="
              ml-1 text-[10px] font-semibold uppercase tracking-widest
              text-brand-600 dark:text-brand-400
            ">
              Pro
            </span>
          </div>
        </div>

        {/* Centre tagline — hidden on mobile */}
        <p className="hidden md:block text-sm text-gray-400 dark:text-gray-500 select-none">
          Markdown → Beautiful PDF in seconds
        </p>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="
            btn-ghost w-9 h-9 p-0 rounded-lg
            text-gray-500 dark:text-gray-400
          "
        >
          {dark
            ? <SunIcon  className="w-5 h-5" />
            : <MoonIcon className="w-5 h-5" />
          }
        </button>
      </div>
    </header>
  );
}

/**
 * Loader.jsx — Full-screen conversion overlay.
 *
 * Shown while the backend is generating the PDF. Uses an animated spinner
 * and a pulsing status message to reassure the user that work is in progress.
 */

export default function Loader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Generating PDF…"
      className="
        fixed inset-0 z-50 flex flex-col items-center justify-center gap-5
        bg-gray-950/70 backdrop-blur-sm animate-fade-in
      "
    >
      {/* Spinner rings */}
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <span className="
          absolute inset-0 rounded-full border-4
          border-brand-200/30 dark:border-brand-900/40
        " />
        {/* Spinning arc */}
        <span className="
          absolute inset-0 rounded-full border-4 border-transparent
          border-t-brand-500 animate-spin
        " />
        {/* Inner glow dot */}
        <span className="
          absolute inset-4 rounded-full
          bg-brand-500/20 animate-pulse
        " />
      </div>

      {/* Status text */}
      <div className="text-center space-y-1">
        <p className="text-white font-semibold text-lg tracking-tight">
          Generating your PDF…
        </p>
        <p className="text-gray-400 text-sm">
          This may take a few seconds for large documents.
        </p>
      </div>
    </div>
  );
}

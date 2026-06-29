'use client';

/**
 * Floating Telegram button — fixed bottom-right.
 * Matches the back-to-top button in project pages: same bottom offset
 * (bottom-11 = 2.75rem), slightly larger (h-16 w-16), right-11 from edge.
 * Hover: accent-green glow. Click: opens t.me/aepov_2kzz.
 */
export default function TelegramFloat() {
  return (
    <a
      href="https://t.me/aepov_2kzz"
      target="_blank"
      rel="noreferrer"
      aria-label="Telegram"
      data-cursor="hover"
      className="group fixed bottom-11 right-11 z-[60] flex h-16 w-16 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--background)]/90 shadow-[0_6px_24px_rgba(0,0,0,0.45)] backdrop-blur transition-all duration-300 hover:border-[var(--accent)] hover:bg-[var(--accent)]/[0.12] hover:shadow-[0_0_28px_var(--accent-glow)]"
    >
      {/* Telegram SVG icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[var(--foreground)]/65 transition-colors duration-300 group-hover:text-[var(--accent)]"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38Z"
          fill="currentColor"
        />
      </svg>
    </a>
  );
}

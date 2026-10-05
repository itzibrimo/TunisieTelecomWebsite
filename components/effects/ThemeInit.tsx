"use client";

/**
 * ThemeInit — Prevents flash of unstyled content (FOUC) for dark mode.
 *
 * IMPORTANT: This component renders a blocking inline script via
 * dangerouslySetInnerHTML so it executes BEFORE React hydration.
 * The old useEffect-based approach ran AFTER hydration, causing:
 *   1. A flash of light mode before dark mode was applied
 *   2. Hydration mismatch (server=light, client=dark)
 *
 * next-themes handles its own FOUC prevention, but this script
 * ensures the class is set synchronously on the very first paint
 * for the HTML element, matching what next-themes will resolve to.
 */
export default function ThemeInit() {
  // Inline script that runs synchronously during HTML parsing,
  // before React hydrates. This prevents the flash.
  const script = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!theme || theme === 'system') theme = prefersDark ? 'dark' : 'light';
    document.documentElement.classList.add(theme);
    if (theme === 'dark') document.documentElement.classList.remove('light');
    else document.documentElement.classList.remove('dark');
  } catch(e) {}
})();
`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}

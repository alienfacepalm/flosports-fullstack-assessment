/**
 * Formats an ISO date string for event display.
 *
 * The output adjusts based on viewport width so we can
 * show as much detail as the UI reasonably allows on each breakpoint.
 *
 * Examples (US locale, Pacific time):
 * - Extra-wide (≥ 1280px):     "(Wed) Feb 21, 2026, 4:15 AM PST"
 * - Desktop (≥ 768px):         "(Wed) Feb 21, 2026, 4:15 AM PST"
 * - Tablet-ish (≥ 480px):      "Feb 21, 2026, 4:15 AM"
 * - Very small phones (< 480): "Feb 21, 4:15 AM"
 */
export function formatEventStartTime(iso: string): string {
  const date = new Date(iso);

  const width =
    typeof window !== 'undefined' && typeof window.innerWidth === 'number'
      ? window.innerWidth
      : 1024;

  let options: Intl.DateTimeFormatOptions;

  if (width >= 1280 || width >= 768) {
    // Extra wide / desktop: full date + time + timezone, prefixed with weekday in parens.
    options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    };
  } else if (width >= 480) {
    // Tablet-ish: keep full date + time, drop explicit timezone to save space.
    options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
  } else {
    // Very small screens: omit the year but keep date + time.
    options = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
  }

  const base = date.toLocaleString('en-US', options);

  if (width >= 768) {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `(${weekday}) ${base}`;
  }

  return base;
}


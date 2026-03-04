/**
 * Formats an ISO date string for event display.
 *
 * The output adjusts based on viewport width so we can
 * show as much detail as the UI reasonably allows on each breakpoint.
 *
 * Examples (US locale, Pacific time):
 * - Extra-wide (≥ 1280px):     "Wednesday, Feb 21, 2026, 4:15 AM PST"
 * - Desktop (≥ 768px):         "Wed, Feb 21, 2026, 4:15 AM PST"
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

  if (width >= 768) {
    // Extra wide / desktop: we'll format date and time separately to restore standard commas.
    options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
    // Build "Feb 21 2026, 4:15 AM PST" (no comma between day and year).
    const dateParts = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).formatToParts(date);

    const month = dateParts.find((p) => p.type === 'month')?.value ?? '';
    const day = dateParts.find((p) => p.type === 'day')?.value ?? '';
    const year = dateParts.find((p) => p.type === 'year')?.value ?? '';

    const dateSegment = `${month} ${day}, ${year}`;
    const timeSegment = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);

    if (width >= 1280) {
      const weekdayLong = date.toLocaleDateString('en-US', { weekday: 'long' });
      return `${weekdayLong}, ${dateSegment}, ${timeSegment}`;
    }

    const weekdayShort = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${weekdayShort}, ${dateSegment}, ${timeSegment}`;
  }

  return base;
}


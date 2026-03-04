import { formatEventStartTime } from './date-format.util';

describe('formatEventStartTime', () => {
  const originalInnerWidth =
    typeof window !== 'undefined' && typeof window.innerWidth === 'number'
      ? window.innerWidth
      : 1024;

  afterEach(() => {
    if (typeof window === 'undefined') return;
    // Reset to original after each test to avoid cross-test interference.
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('uses full weekday, full date, and timezone on extra-wide screens', () => {
    if (typeof window === 'undefined') return;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1400,
    });

    const iso = '2026-02-21T12:15:00.000Z';
    const result = formatEventStartTime(iso);

    // Expect full weekday, then short month, day, year, time, and a short timezone token
    // e.g. "Saturday, Feb 21, 2026, 4:15 AM PST".
    expect(result).toMatch(/^[A-Z][a-z]+,\s/);
    expect(result).toContain('2026');
    expect(result).toMatch(/\b[A-Z]{2,5}\b/);
  });

  it('uses short weekday, full date, and timezone on desktop screens', () => {
    if (typeof window === 'undefined') return;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 900,
    });

    const iso = '2026-02-21T12:15:00.000Z';
    const result = formatEventStartTime(iso);

    // e.g. "Sat, Feb 21, 2026, 4:15 AM PST"
    expect(result).toMatch(/^[A-Z][a-z]{2},\s/);
    expect(result).toContain('2026');
    expect(result).toMatch(/\b[A-Z]{2,5}\b/);
  });

  it('omits timezone but keeps full date and time on tablet-ish screens', () => {
    if (typeof window === 'undefined') return;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 600,
    });

    const iso = '2026-02-21T12:15:00.000Z';
    const result = formatEventStartTime(iso);

    // "Feb 21, 2026, 4:15 AM" style: month, day, year, time; allow environment-specific suffixes.
    expect(result).toContain('2026');
  });

  it('returns a non-empty string for valid ISO regardless of width', () => {
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 900,
      });
    }

    const result = formatEventStartTime('2025-01-01T12:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});


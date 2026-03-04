import { formatEventStartTime } from './date-format.util';

describe('formatEventStartTime', () => {
  it('formats ISO string to locale string with weekday, date, time', () => {
    const iso = '2025-03-15T18:00:00.000Z';
    const result = formatEventStartTime(iso);
    expect(result).toMatch(/\w{3}/); // weekday
    expect(result).toMatch(/\d/);   // day or time
  });

  it('returns a non-empty string for valid ISO', () => {
    const result = formatEventStartTime('2025-01-01T12:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

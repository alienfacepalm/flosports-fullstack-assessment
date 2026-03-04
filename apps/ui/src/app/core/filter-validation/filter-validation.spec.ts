import { validateAndSanitizeFilter } from './filter-validation';

describe('validateAndSanitizeFilter', () => {
  it('trims and sanitizes search', () => {
    const result = validateAndSanitizeFilter({
      liveOnly: false,
      search: '  foo  ',
      sport: null,
      status: 'all',
    });
    expect(result.search).toBe('foo');
  });

  it('strips null bytes and control chars from search', () => {
    const result = validateAndSanitizeFilter({
      liveOnly: false,
      search: 'a\x00b\x01c',
      sport: null,
      status: 'all',
    });
    expect(result.search).toBe('abc');
  });

  it('treats very short search terms as empty to avoid spamming the API', () => {
    const resultOneChar = validateAndSanitizeFilter({
      liveOnly: false,
      search: 'a',
      sport: null,
      status: 'all',
    });
    const resultTwoChars = validateAndSanitizeFilter({
      liveOnly: false,
      search: 'ab',
      sport: null,
      status: 'all',
    });

    expect(resultOneChar.search).toBe('');
    expect(resultTwoChars.search).toBe('ab');
  });

  it('caps search length', () => {
    const long = 'a'.repeat(300);
    const result = validateAndSanitizeFilter({
      liveOnly: false,
      search: long,
      sport: null,
      status: 'all',
    });
    expect(result.search.length).toBeLessThanOrEqual(200);
  });

  it('normalizes sport to null when empty string', () => {
    const result = validateAndSanitizeFilter({
      liveOnly: false,
      search: '',
      sport: '   ',
      status: 'all',
    });
    expect(result.sport).toBeNull();
  });

  it('keeps valid sport trimmed', () => {
    const result = validateAndSanitizeFilter({
      liveOnly: false,
      search: '',
      sport: '  Basketball  ',
      status: 'all',
    });
    expect(result.sport).toBe('Basketball');
  });

  it('sets liveOnly as boolean', () => {
    expect(validateAndSanitizeFilter({
      liveOnly: true,
      search: '',
      sport: null,
      status: 'all',
    }).liveOnly).toBe(true);
  });

  it('maps status filter variants into EventStatus or null', () => {
    const allResult = validateAndSanitizeFilter({
      liveOnly: false,
      search: '',
      sport: null,
      status: 'all',
    });
    const upcomingResult = validateAndSanitizeFilter({
      liveOnly: false,
      search: '',
      sport: null,
      status: 'upcoming',
    });
    const liveResult = validateAndSanitizeFilter({
      liveOnly: false,
      search: '',
      sport: null,
      status: 'live',
    });
    const completedResult = validateAndSanitizeFilter({
      liveOnly: false,
      search: '',
      sport: null,
      status: 'completed',
    });

    expect(allResult.status).toBeNull();
    expect(upcomingResult.status).toBe('upcoming');
    expect(liveResult.status).toBe('live');
    expect(completedResult.status).toBe('completed');
  });
});


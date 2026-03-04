import { validateAndSanitizeFilter } from './filter-validation';

describe('validateAndSanitizeFilter', () => {
  it('trims and sanitizes search', () => {
    const result = validateAndSanitizeFilter({
      liveOnly: false,
      search: '  foo  ',
      sport: null,
    });
    expect(result.search).toBe('foo');
  });

  it('strips null bytes and control chars from search', () => {
    const result = validateAndSanitizeFilter({
      liveOnly: false,
      search: 'a\x00b\x01c',
      sport: null,
    });
    expect(result.search).toBe('abc');
  });

  it('treats very short search terms as empty to avoid spamming the API', () => {
    const resultOneChar = validateAndSanitizeFilter({
      liveOnly: false,
      search: 'a',
      sport: null,
    });
    const resultTwoChars = validateAndSanitizeFilter({
      liveOnly: false,
      search: 'ab',
      sport: null,
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
    });
    expect(result.search.length).toBeLessThanOrEqual(200);
  });

  it('normalizes sport to null when empty string', () => {
    const result = validateAndSanitizeFilter({
      liveOnly: false,
      search: '',
      sport: '   ',
    });
    expect(result.sport).toBeNull();
  });

  it('keeps valid sport trimmed', () => {
    const result = validateAndSanitizeFilter({
      liveOnly: false,
      search: '',
      sport: '  Basketball  ',
    });
    expect(result.sport).toBe('Basketball');
  });

  it('sets liveOnly as boolean', () => {
    expect(validateAndSanitizeFilter({
      liveOnly: true,
      search: '',
      sport: null,
    }).liveOnly).toBe(true);
  });
});


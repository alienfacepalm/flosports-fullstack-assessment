import { validateAndSanitizeFilter } from '../core/filter-validation/filter-validation';

describe('EventsStateService (filter sanitization contract)', () => {
  it('normalizes filter state before sending to API', () => {
    const result = validateAndSanitizeFilter({
      liveOnly: true,
      search: '  finals ',
      sport: '  Cycling ',
    });

    expect(result.liveOnly).toBe(true);
    expect(result.search).toBe('finals');
    expect(result.sport).toBe('Cycling');
  });
});



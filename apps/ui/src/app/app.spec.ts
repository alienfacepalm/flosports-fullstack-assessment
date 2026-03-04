import {
  slugifySport,
  deslugifySport,
  filterStateToSegments,
  segmentsToFilterState,
} from './core/filter-url.util/filter-url.util';

describe('App filter URL behavior (unit)', () => {
  const knownSports = ['Track & Field', 'Cycling', 'Wrestling', 'Cheerleading'];

  it('round-trips filter state through URL segments', () => {
    const state = {
      liveOnly: true,
      sport: 'Track & Field' as string | null,
      search: 'day 1 heats',
    };

    const segments = filterStateToSegments(
      state.liveOnly,
      state.sport,
      state.search,
      knownSports,
    );

    const parsed = segmentsToFilterState(
      segments[0],
      segments[1],
      segments[2],
      knownSports,
    );

    expect(parsed.liveOnly).toBe(state.liveOnly);
    expect(parsed.sport).toBe(state.sport);
    expect(parsed.search).toBe(state.search);
  });

  it('slugifies and deslugifies sport names consistently', () => {
    const slug = slugifySport('Cheerleading');
    expect(slug).toBe('cheerleading');
    expect(deslugifySport(slug, knownSports)).toBe('Cheerleading');
  });
});


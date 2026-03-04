import { filterStateToSegments } from '../core/filter-url.util/filter-url.util';

describe('EventsApiService (URL contract)', () => {
  it('aligns with filter URL encoding for live + sport + search', () => {
    const segments = filterStateToSegments(true, 'Cycling', 'finals', ['Cycling']);
    expect(segments).toEqual(['live', 'cycling', 'finals']);
  });
});



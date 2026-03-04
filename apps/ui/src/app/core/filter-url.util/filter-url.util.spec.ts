import {
  slugifySport,
  deslugifySport,
  encodeSearchSegment,
  decodeSearchSegment,
  filterStateToSegments,
  segmentsToFilterState,
} from './filter-url.util';

describe('filter-url.util', () => {
  const knownSports = ['Track & Field', 'Cycling', 'Wrestling', 'Cheerleading', 'Grappling'];

  describe('slugifySport', () => {
    it('lowercases and replaces spaces and ampersand with hyphens', () => {
      expect(slugifySport('Track & Field')).toBe('track-and-field');
    });

    it('handles single-word sport', () => {
      expect(slugifySport('Cycling')).toBe('cycling');
    });
  });

  describe('deslugifySport', () => {
    it('returns null for default segment "-" or empty', () => {
      expect(deslugifySport('-', knownSports)).toBeNull();
      expect(deslugifySport('', knownSports)).toBeNull();
    });

    it('returns sport name for matching slug', () => {
      expect(deslugifySport('track-and-field', knownSports)).toBe('Track & Field');
      expect(deslugifySport('cycling', knownSports)).toBe('Cycling');
    });

    it('returns null for unknown slug', () => {
      expect(deslugifySport('unknown-sport', knownSports)).toBeNull();
    });
  });

  describe('encodeSearchSegment / decodeSearchSegment', () => {
    it('uses "-" for empty search', () => {
      expect(encodeSearchSegment('')).toBe('-');
      expect(encodeSearchSegment('   ')).toBe('-');
      expect(decodeSearchSegment('-')).toBe('');
    });

    it('encodes and decodes search text', () => {
      const search = 'tennis finals';
      expect(decodeSearchSegment(encodeSearchSegment(search))).toBe(search.trim());
    });
  });

  describe('filterStateToSegments', () => {
    it('produces -/-/- for no filters', () => {
      expect(filterStateToSegments(false, null, '', knownSports)).toEqual([
        '-',
        '-',
        '-',
      ]);
    });

    it('produces live/track-and-field/- for live + sport', () => {
      expect(
        filterStateToSegments(true, 'Track & Field', '', knownSports)
      ).toEqual(['live', 'track-and-field', '-']);
    });

    it('produces live/track-and-field/tennis for all filters', () => {
      expect(
        filterStateToSegments(true, 'Track & Field', 'tennis', knownSports)
      ).toEqual(['live', 'track-and-field', 'tennis']);
    });
  });

  describe('segmentsToFilterState', () => {
    it('parses -/-/- as no filters', () => {
      expect(segmentsToFilterState('-', '-', '-', knownSports)).toEqual({
        liveOnly: false,
        sport: null,
        search: '',
      });
    });

    it('parses live/track-and-field/- as live + sport', () => {
      expect(
        segmentsToFilterState('live', 'track-and-field', '-', knownSports)
      ).toEqual({
        liveOnly: true,
        sport: 'Track & Field',
        search: '',
      });
    });

    it('round-trips with filterStateToSegments', () => {
      const state = {
        liveOnly: true,
        sport: 'Track & Field' as string | null,
        search: 'day 1',
      };
      const segments = filterStateToSegments(
        state.liveOnly,
        state.sport,
        state.search,
        knownSports
      );
      const parsed = segmentsToFilterState(
        segments[0],
        segments[1],
        segments[2],
        knownSports
      );
      expect(parsed.liveOnly).toBe(state.liveOnly);
      expect(parsed.sport).toBe(state.sport);
      expect(parsed.search).toBe(state.search);
    });
  });
});


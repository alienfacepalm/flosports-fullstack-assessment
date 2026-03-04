import {
  filterEvents,
  mergeEventsWithStats,
} from './events-filter';
import {
  EventStatus,
  StreamHealth,
  type IEventCatalog,
  type IEventWithStats,
  type ILiveStats,
} from '../event-types';

describe('events-filter', () => {
  const baseEvent = (
    overrides: Partial<IEventCatalog> = {}
  ): IEventCatalog => ({
    id: 'evt-1',
    title: 'Test Event',
    sport: 'Cycling',
    league: 'Test League',
    status: EventStatus.Live,
    startTime: '2026-02-18T19:00:00.000Z',
    ...overrides,
  });

  describe('filterEvents', () => {
    it('returns all events when criteria is empty', () => {
      const events: IEventWithStats[] = [
        baseEvent({ id: 'a', status: EventStatus.Live }),
        baseEvent({ id: 'b', status: EventStatus.Completed }),
      ];
      const result = filterEvents(events, {});
      expect(result).toHaveLength(2);
    });

    it('filters by liveOnly true (keeps only live)', () => {
      const events: IEventWithStats[] = [
        baseEvent({ id: 'a', status: EventStatus.Live }),
        baseEvent({ id: 'b', status: EventStatus.Completed }),
        baseEvent({ id: 'c', status: EventStatus.Upcoming }),
      ];
      const result = filterEvents(events, { liveOnly: true });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(EventStatus.Live);
    });

    it('filters by sport (case-insensitive)', () => {
      const events: IEventWithStats[] = [
        baseEvent({ id: 'a', sport: 'Cycling' }),
        baseEvent({ id: 'b', sport: 'Wrestling' }),
        baseEvent({ id: 'c', sport: 'cycling' }),
      ];
      const result = filterEvents(events, { sport: 'cycling' });
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.sport.toLowerCase() === 'cycling')).toBe(true);
    });

    it('filters by title search (case-insensitive substring)', () => {
      const events: IEventWithStats[] = [
        baseEvent({ id: 'a', title: 'NAIA Outdoor Track & Field Championships' }),
        baseEvent({ id: 'b', title: 'USA Cycling National Criterium' }),
        baseEvent({ id: 'c', title: 'Track Showcase - Day 2' }),
      ];
      const result = filterEvents(events, { search: 'track' });
      expect(result).toHaveLength(2);
      expect(result.map((e) => e.title)).toContain('NAIA Outdoor Track & Field Championships');
      expect(result.map((e) => e.title)).toContain('Track Showcase - Day 2');
    });

    it('treats "track & field" and "track and field" as equivalent in search', () => {
      const events: IEventWithStats[] = [
        baseEvent({
          id: 'a',
          title: 'NAIA Outdoor Track & Field Championships',
          sport: 'Track & Field',
        }),
        baseEvent({
          id: 'b',
          title: 'Cycling Road Nationals',
          sport: 'Cycling',
        }),
      ];

      const ampersandSearch = filterEvents(events, { search: 'track & field' });
      const andSearch = filterEvents(events, { search: 'track and field' });

      expect(ampersandSearch).toHaveLength(1);
      expect(andSearch).toHaveLength(1);
      expect(ampersandSearch[0].id).toBe('a');
      expect(andSearch[0].id).toBe('a');
    });

    it('filters by status enum', () => {
      const events: IEventWithStats[] = [
        baseEvent({ id: 'a', status: EventStatus.Live }),
        baseEvent({ id: 'b', status: EventStatus.Completed }),
      ];
      const result = filterEvents(events, { status: EventStatus.Completed });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(EventStatus.Completed);
    });

    it('combines liveOnly, sport, and search', () => {
      const events: IEventWithStats[] = [
        baseEvent({
          id: 'a',
          status: EventStatus.Live,
          sport: 'Cycling',
          title: 'Cycling Finals',
        }),
        baseEvent({
          id: 'b',
          status: EventStatus.Live,
          sport: 'Wrestling',
          title: 'Wrestling Dual',
        }),
        baseEvent({
          id: 'c',
          status: EventStatus.Completed,
          sport: 'Cycling',
          title: 'Cycling Finals',
        }),
      ];
      const result = filterEvents(events, {
        liveOnly: true,
        sport: 'Cycling',
        search: 'Finals',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('returns empty array when no event matches', () => {
      const events: IEventWithStats[] = [
        baseEvent({ id: 'a', sport: 'Cycling', title: 'Event A' }),
      ];
      const result = filterEvents(events, { search: 'Wrestling' });
      expect(result).toHaveLength(0);
    });

    it('treats whitespace-only search as no search (returns all)', () => {
      const events: IEventWithStats[] = [
        baseEvent({ id: 'a', title: 'Event A' }),
        baseEvent({ id: 'b', title: 'Event B' }),
      ];
      expect(filterEvents(events, { search: '   ' })).toHaveLength(2);
      expect(filterEvents(events, { search: '' })).toHaveLength(2);
    });
  });

  describe('mergeEventsWithStats', () => {
    it('merges live stats into live events by eventId', () => {
      const events: IEventCatalog[] = [
        baseEvent({ id: 'evt-1', status: EventStatus.Live }),
        baseEvent({ id: 'evt-2', status: EventStatus.Live }),
      ];
      const liveStats: ILiveStats[] = [
        {
          eventId: 'evt-1',
          viewerCount: 1000,
          peakViewerCount: 1500,
          streamHealth: StreamHealth.Excellent,
          lastUpdated: '2026-02-18T19:00:00.000Z',
        },
      ];
      const result = mergeEventsWithStats(events, liveStats);
      expect(result).toHaveLength(2);
      const withStats = result.find((e) => e.id === 'evt-1');
      const withoutStats = result.find((e) => e.id === 'evt-2');
      expect(withStats?.liveStats).toBeDefined();
      expect(withStats?.liveStats?.viewerCount).toBe(1000);
      expect(withoutStats?.liveStats).toBeUndefined();
    });

    it('does not attach stats to non-live events', () => {
      const events: IEventCatalog[] = [
        baseEvent({ id: 'evt-1', status: EventStatus.Completed }),
      ];
      const liveStats: ILiveStats[] = [
        {
          eventId: 'evt-1',
          viewerCount: 1000,
          peakViewerCount: 1500,
          streamHealth: StreamHealth.Good,
          lastUpdated: '2026-02-18T19:00:00.000Z',
        },
      ];
      const result = mergeEventsWithStats(events, liveStats);
      expect(result[0].liveStats).toBeUndefined();
    });

    it('returns events unchanged when liveStats is empty', () => {
      const events: IEventCatalog[] = [
        baseEvent({ id: 'evt-1', status: EventStatus.Live }),
      ];
      const result = mergeEventsWithStats(events, []);
      expect(result).toHaveLength(1);
      expect(result[0].liveStats).toBeUndefined();
    });
  });
});


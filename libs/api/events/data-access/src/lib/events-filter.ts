import {
  IEventCatalog,
  EventStatus,
  IEventWithStats,
  IEventsFilterCriteria,
  ILiveStats,
} from './event-types';

export function filterEvents(
  events: IEventWithStats[],
  criteria: IEventsFilterCriteria,
): IEventWithStats[] {
  return events.filter((event) => {
    if (criteria.liveOnly && event.status !== EventStatus.Live) {
      return false;
    }

    if (criteria.status && event.status !== criteria.status) {
      return false;
    }

    if (
      criteria.sport &&
      event.sport.toLowerCase() !== criteria.sport.toLowerCase()
    ) {
      return false;
    }

    if (
      criteria.search &&
      !event.title.toLowerCase().includes(criteria.search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
}

export function mergeEventsWithStats(
  events: IEventCatalog[],
  liveStats: ILiveStats[],
): IEventWithStats[] {
  const liveStatsByEventId = new Map<string, ILiveStats>(
    liveStats.map((stats) => [stats.eventId, stats]),
  );

  return events.map((event) => {
    const stats = liveStatsByEventId.get(event.id);

    if (!stats || event.status !== EventStatus.Live) {
      return { ...event, liveStats: undefined };
    }

    return {
      ...event,
      liveStats: stats,
    };
  });
}



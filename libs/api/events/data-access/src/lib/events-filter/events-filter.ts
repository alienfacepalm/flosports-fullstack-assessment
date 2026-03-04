import {
  IEventCatalog,
  EventStatus,
  IEventWithStats,
  IEventsFilterCriteria,
  ILiveStats,
} from '../event-types';

/**
 * Normalized filter criteria for a single pass over events (avoids repeated lowercasing).
 */
function normalizeCriteria(criteria: IEventsFilterCriteria): {
  liveOnly: boolean;
  status: EventStatus | undefined;
  sportLower: string | null;
  searchLower: string | null;
} {
  const sportLower =
    criteria.sport?.trim() != null && criteria.sport.trim() !== ''
      ? criteria.sport.trim().toLowerCase()
      : null;
  const rawSearch = criteria.search?.trim() ?? '';
  const searchLower = rawSearch !== '' ? rawSearch.toLowerCase() : null;
  return {
    liveOnly: Boolean(criteria.liveOnly),
    status: criteria.status,
    sportLower,
    searchLower,
  };
}

export function filterEvents(
  events: IEventWithStats[],
  criteria: IEventsFilterCriteria,
): IEventWithStats[] {
  const { liveOnly, status, sportLower, searchLower } = normalizeCriteria(criteria);

  return events.filter((event) => {
    if (liveOnly && event.status !== EventStatus.Live) {
      return false;
    }

    if (status != null && event.status !== status) {
      return false;
    }

    if (sportLower != null && event.sport.toLowerCase() !== sportLower) {
      return false;
    }

    if (searchLower != null && !event.title.toLowerCase().includes(searchLower)) {
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


import {
  IEventCatalog,
  EventStatus,
  IEventWithStats,
  IEventsFilterCriteria,
  ILiveStats,
} from '../event-types';

/**
 * Normalize free-text for smarter matching:
 * - lowercases
 * - treats "&" and "and" as equivalent
 * - collapses repeated whitespace
 */
function normalizeSearchText(value: string): string {
  const lowered = value.toLowerCase();
  return lowered
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalized filter criteria for a single pass over events (avoids repeated lowercasing).
 */
function normalizeCriteria(criteria: IEventsFilterCriteria): {
  liveOnly: boolean;
  status: EventStatus | undefined;
  sportLower: string | null;
  searchNormalized: string | null;
} {
  const sportLower =
    criteria.sport?.trim() != null && criteria.sport.trim() !== ''
      ? criteria.sport.trim().toLowerCase()
      : null;
  const rawSearch = criteria.search?.trim() ?? '';
  const searchNormalized = rawSearch !== '' ? normalizeSearchText(rawSearch) : null;
  return {
    liveOnly: Boolean(criteria.liveOnly),
    status: criteria.status,
    sportLower,
    searchNormalized,
  };
}

export function filterEvents(
  events: IEventWithStats[],
  criteria: IEventsFilterCriteria,
): IEventWithStats[] {
  const { liveOnly, status, sportLower, searchNormalized } = normalizeCriteria(criteria);

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

    if (searchNormalized != null) {
      const titleNormalized = normalizeSearchText(event.title);
      const sportNormalized = normalizeSearchText(event.sport);
      const matchesTitle = titleNormalized.includes(searchNormalized);
      const matchesSport = sportNormalized.includes(searchNormalized);
      if (!matchesTitle && !matchesSport) {
        return false;
      }
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


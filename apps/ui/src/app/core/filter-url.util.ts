/**
 * URL segment format: /:live/:sport/:search
 * - live: "live" | "all"
 * - sport: slug (e.g. "track-and-field") | "all"
 * - search: encoded search term, or "-" for none
 */

const LIVE_SEGMENT_ON = 'live';
const LIVE_SEGMENT_OFF = 'all';
const SPORT_ALL = 'all';
const SEARCH_NONE = '-';

/**
 * Slugify a sport name for the URL (e.g. "Track & Field" -> "track-and-field").
 */
export function slugifySport(sport: string): string {
  return sport
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Find sport name from slug by matching against a list of known sports.
 */
export function deslugifySport(slug: string, knownSports: string[]): string | null {
  if (slug === SPORT_ALL || !slug) {
    return null;
  }
  const normalized = slug.toLowerCase();
  const found = knownSports.find(
    (s) => slugifySport(s) === normalized
  );
  return found ?? null;
}

/**
 * Encode search for a single path segment (spaces and special chars become one segment).
 */
export function encodeSearchSegment(search: string): string {
  const trimmed = search.trim();
  if (!trimmed) {
    return SEARCH_NONE;
  }
  return encodeURIComponent(trimmed);
}

/**
 * Decode search from URL segment.
 */
export function decodeSearchSegment(segment: string): string {
  if (segment === SEARCH_NONE || !segment) {
    return '';
  }
  try {
    return decodeURIComponent(segment);
  } catch {
    return '';
  }
}

export interface IFilterRouteParams {
  live: string;
  sport: string;
  search: string;
}

export function routeParamsToSegments(params: IFilterRouteParams): [string, string, string] {
  return [params.live, params.sport, params.search];
}

/**
 * Build path segments from filter state (knownSports only used to optionally validate sport).
 */
export function filterStateToSegments(
  liveOnly: boolean,
  sport: string | null,
  search: string,
  _knownSports?: string[]
): [string, string, string] {
  const live = liveOnly ? LIVE_SEGMENT_ON : LIVE_SEGMENT_OFF;
  const sportSegment = sport?.trim() ? slugifySport(sport) : SPORT_ALL;
  const searchSegment = encodeSearchSegment(search);
  return [live, sportSegment, searchSegment];
}

/**
 * Parse route segments into filter values (liveOnly, sport, search).
 */
export function segmentsToFilterState(
  liveSegment: string,
  sportSegment: string,
  searchSegment: string,
  knownSports: string[]
): { liveOnly: boolean; sport: string | null; search: string } {
  const liveOnly =
    liveSegment?.toLowerCase() === LIVE_SEGMENT_ON;
  const sport = deslugifySport(sportSegment ?? '', knownSports);
  const search = decodeSearchSegment(searchSegment ?? '');
  return { liveOnly, sport, search };
}

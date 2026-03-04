import { IUiFilterState } from 'ui-filter-bar';
import { IEventsFilter } from '../../events.types';

const MAX_SEARCH_LENGTH = 200;
const MIN_SEARCH_LENGTH = 2;

/**
 * Sanitizes search input: trim, limit length, remove null bytes and control characters.
 * Does not inject HTML; for display only we rely on Angular's escaping.
 */
function sanitizeSearch(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  const cleaned = value
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();

  if (cleaned.length < MIN_SEARCH_LENGTH) {
    return '';
  }

  return cleaned.slice(0, MAX_SEARCH_LENGTH);
}

/**
 * Validates and sanitizes filter state into a backend-ready filter.
 */
export function validateAndSanitizeFilter(state: IUiFilterState): IEventsFilter {
  return {
    liveOnly: Boolean(state.liveOnly),
    search: sanitizeSearch(state.search),
    sport: state.sport != null && typeof state.sport === 'string' && state.sport.trim() !== ''
      ? state.sport.trim()
      : null,
  };
}


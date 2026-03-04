import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  Subject,
  switchMap,
  of,
  catchError,
  tap,
  debounceTime,
  distinctUntilChanged,
  timeout,
  startWith,
  retry,
  throwError,
  timer,
  filter,
  take,
  map,
} from 'rxjs';
import { IUiFilterState } from 'ui-filter-bar';
import { EventsApiService } from '../events-api.service/events-api.service';
import { EventStatus, IEvent, IEventsApiResponse, IEventsFilter } from '../events.types';
import { mapErrorToUiMessage } from '../core/error-mapping/error-mapping';
import { validateAndSanitizeFilter } from '../core/filter-validation/filter-validation';

const SEARCH_DEBOUNCE_MS = 400;
const EVENTS_REQUEST_TIMEOUT_MS = 15_000;

const API_POLL_INTERVAL_MS = 2_000;
const API_READY_TIMEOUT_MS = 60_000;

@Injectable({
  providedIn: 'root',
})
export class EventsStateService {
  private readonly eventsApi = inject(EventsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly filters = signal<IUiFilterState>({
    liveOnly: false,
    search: '',
    sport: null,
    status: 'all',
  });

  readonly events = signal<IEvent[]>([]);
  readonly sports = signal<string[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /**
   * Cached full events list used for optimistic client-side filtering.
   * Represents the latest `/events` response for the base (unfiltered) state.
   */
  readonly allEvents = signal<IEvent[]>([]);

  /** True once the API has responded successfully at least once. */
  readonly apiReady = signal(false);
  /** True if the API never came up within the timeout window. */
  readonly apiUnavailable = signal(false);

  /**
   * toObservable must be called in injection context (constructor / field initializer).
   * We create it here and gate the events stream on apiReady.
   */
  private readonly filters$ = toObservable(this.filters);
  private readonly apiReadyGate$ = new Subject<void>();

  constructor() {
    this.waitForApi();
    this.setupEventsStream();
  }

  setFilters(partial: Partial<IUiFilterState>): void {
    this.filters.update((prev) => ({ ...prev, ...partial }));
  }

  setFiltersFromState(next: IUiFilterState): void {
    this.filters.set(next);
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  /**
   * Polls /events as a lightweight health-check every 2 s for up to 60 s.
   * On first success: seeds the sports list (and initial events), marks apiReady, and opens the gate for events.
   * On timeout: sets apiUnavailable so the template can show a fatal error.
   */
  private waitForApi(): void {
    const maxAttempts = Math.ceil(API_READY_TIMEOUT_MS / API_POLL_INTERVAL_MS);

    const initialFilter = validateAndSanitizeFilter(this.filters());

    this.eventsApi.getEvents(initialFilter).pipe(
      retry({
        count: maxAttempts,
        delay: (err) => {
          if (err instanceof HttpErrorResponse && (err.status === 0 || err.status >= 500)) {
            return timer(API_POLL_INTERVAL_MS);
          }
          return throwError(() => err);
        },
      }),
      catchError(() => {
        this.apiUnavailable.set(true);
        this.errorMessage.set(
          'Unable to connect to the API server. Please make sure the API is running and try again.',
        );
        const empty: IEventsApiResponse = { events: [], sports: [] };
        return of(empty);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((response) => {
      if (this.apiUnavailable()) return;
      this.apiReady.set(true);
      queueMicrotask(() => {
        this.sports.set(response.sports);
        this.events.set(response.events);
        this.allEvents.set(response.events);
      });
      this.apiReadyGate$.next();
      this.apiReadyGate$.complete();
    });
  }

  private static filterStateEqual(a: IUiFilterState, b: IUiFilterState): boolean {
    return (
      a.liveOnly === b.liveOnly &&
      a.search === b.search &&
      a.sport === b.sport &&
      a.status === b.status
    );
  }

  private static isBaseFilter(state: IUiFilterState): boolean {
    const searchTrimmed = state.search.trim();
    const sportTrimmed = state.sport != null ? state.sport.trim() : '';
    const statusIsDefault = state.status === 'all' || state.status == null;
    return (
      state.liveOnly === false &&
      searchTrimmed === '' &&
      sportTrimmed === '' &&
      statusIsDefault
    );
  }

  private static normalizeSearchText(value: string): string {
    const lowered = value.toLowerCase();
    return lowered
      .replace(/\s*&\s*/g, ' and ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static normalizeCriteria(filter: IEventsFilter): {
    liveOnly: boolean;
    status: EventStatus | null;
    sportLower: string | null;
    searchNormalized: string | null;
  } {
    const sportLower =
      filter.sport != null && filter.sport.trim() !== ''
        ? filter.sport.trim().toLowerCase()
        : null;
    const rawSearch = filter.search.trim();
    const searchNormalized =
      rawSearch !== '' ? EventsStateService.normalizeSearchText(rawSearch) : null;

    return {
      liveOnly: Boolean(filter.liveOnly),
      status: filter.status ?? null,
      sportLower,
      searchNormalized,
    };
  }

  /**
   * Applies the same filter semantics as the backend `filterEvents` helper,
   * but against the locally cached full list so we can update the UI optimistically.
   */
  private applyLocalFilter(events: IEvent[], state: IUiFilterState): IEvent[] {
    const backendFilter = validateAndSanitizeFilter(state);
    const { liveOnly, status, sportLower, searchNormalized } =
      EventsStateService.normalizeCriteria(backendFilter);

    if (!liveOnly && sportLower == null && searchNormalized == null) {
      return events;
    }

    return events.filter((event) => {
      if (liveOnly && event.status !== EventStatus.Live) {
        return false;
      }

      if (!liveOnly && status != null && event.status !== status) {
        return false;
      }

      if (sportLower != null && event.sport.toLowerCase() !== sportLower) {
        return false;
      }

      if (searchNormalized != null) {
        const titleNormalized = EventsStateService.normalizeSearchText(event.title);
        const sportNormalized = EventsStateService.normalizeSearchText(event.sport);
        const matchesTitle = titleNormalized.includes(searchNormalized);
        const matchesSport = sportNormalized.includes(searchNormalized);
        if (!matchesTitle && !matchesSport) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Waits for the API-ready gate, then subscribes to filter changes and fetches events.
   * The filters$ observable is created in injection context (field initializer) so toObservable works.
   */
  private setupEventsStream(): void {
    this.apiReadyGate$.pipe(
      take(1),
      switchMap(() =>
        this.filters$.pipe(
          startWith(this.filters()),
          distinctUntilChanged(EventsStateService.filterStateEqual),
          tap((state) => {
            this.errorMessage.set(null);
            const cached = this.allEvents();
            if (cached.length === 0) {
              this.isLoading.set(true);
            } else {
              const optimistic = this.applyLocalFilter(cached, state);
              this.events.set(optimistic);
              this.isLoading.set(false);
            }
          }),
          debounceTime(SEARCH_DEBOUNCE_MS),
          switchMap((state) =>
            this.eventsApi.getEvents(validateAndSanitizeFilter(state)).pipe(
              timeout(EVENTS_REQUEST_TIMEOUT_MS),
              map((response) => ({ response, state })),
              catchError((err: unknown) => {
                const ui = mapErrorToUiMessage(err);
                this.errorMessage.set(ui.message);
                const fallback: IEventsApiResponse = {
                  events: this.events(),
                  sports: this.sports(),
                };
                return of({ response: fallback, state });
              }),
            ),
          ),
        )
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ response, state }) => {
        if (EventsStateService.isBaseFilter(state)) {
          this.allEvents.set(response.events);
        }
        this.events.set(response.events);
        this.sports.set(response.sports);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}


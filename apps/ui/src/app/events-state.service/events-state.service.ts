import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  Subject, switchMap, of, catchError, tap, debounceTime,
  distinctUntilChanged, timeout, startWith,
  retry, throwError, timer, filter, take,
} from 'rxjs';
import { IUiFilterState } from 'ui-filter-bar';
import { EventsApiService } from '../events-api.service/events-api.service';
import { IEvent } from '../events.types';
import { mapErrorToUiMessage } from '../core/error-mapping/error-mapping';
import { validateAndSanitizeFilter } from '../core/filter-validation/filter-validation';

const SEARCH_DEBOUNCE_MS = 200;
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
  });

  readonly events = signal<IEvent[]>([]);
  readonly sports = signal<string[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

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
   * Polls /sports as a lightweight health-check every 2 s for up to 60 s.
   * On first success: seeds the sports list, marks apiReady, and opens the gate for events.
   * On timeout: sets apiUnavailable so the template can show a fatal error.
   */
  private waitForApi(): void {
    const maxAttempts = Math.ceil(API_READY_TIMEOUT_MS / API_POLL_INTERVAL_MS);

    this.eventsApi.getSports().pipe(
      retry({
        count: maxAttempts,
        delay: (err) => {
          if (err instanceof HttpErrorResponse && (err.status === 0 || err.status >= 500)) {
            return timer(API_POLL_INTERVAL_MS);
          }
          return throwError(() => err);
        },
      }),
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.apiUnavailable.set(true);
        this.errorMessage.set(
          'Unable to connect to the API server. Please make sure the API is running and try again.',
        );
        return of([] as string[]);
      }),
    ).subscribe((sports) => {
      if (this.apiUnavailable()) return;
      this.apiReady.set(true);
      queueMicrotask(() => this.sports.set(sports));
      this.apiReadyGate$.next();
      this.apiReadyGate$.complete();
    });
  }

  private static filterStateEqual(a: IUiFilterState, b: IUiFilterState): boolean {
    return (
      a.liveOnly === b.liveOnly &&
      a.search === b.search &&
      a.sport === b.sport
    );
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
          tap(() => {
            this.isLoading.set(true);
            this.errorMessage.set(null);
          }),
          debounceTime(SEARCH_DEBOUNCE_MS),
          switchMap((state) =>
            this.eventsApi.getEvents(validateAndSanitizeFilter(state)).pipe(
              timeout(EVENTS_REQUEST_TIMEOUT_MS),
              catchError((err: unknown) => {
                const ui = mapErrorToUiMessage(err);
                this.errorMessage.set(ui.message);
                return of([]);
              }),
            )
          ),
        )
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (list) => {
        this.events.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}


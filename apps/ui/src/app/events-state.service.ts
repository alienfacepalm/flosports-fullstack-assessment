import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, of, catchError, tap, debounceTime, distinctUntilChanged, timeout, startWith } from 'rxjs';
import { IUiFilterState } from 'ui-filter-bar';
import { EventsApiService } from './events-api.service';
import { IEvent } from './events.types';
import { mapErrorToUiMessage, IUiErrorMessage } from './core/error-mapping';
import { validateAndSanitizeFilter } from './core/filter-validation';

const SEARCH_DEBOUNCE_MS = 200;
const EVENTS_REQUEST_TIMEOUT_MS = 15_000;

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

  constructor() {
    this.loadSportsOnce();
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

  private loadSportsOnce(): void {
    this.eventsApi.getSports().pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError((err: unknown) => {
        const ui: IUiErrorMessage = mapErrorToUiMessage(err);
        this.errorMessage.set(ui.message);
        return of([]);
      }),
    ).subscribe((list) => {
      // Defer so the update doesn't run in the same change detection cycle as
      // the initial template bind (avoids ExpressionChangedAfterItHasBeenCheckedError).
      queueMicrotask(() => this.sports.set(list));
    });
  }

  private static filterStateEqual(a: IUiFilterState, b: IUiFilterState): boolean {
    return (
      a.liveOnly === b.liveOnly &&
      a.search === b.search &&
      a.sport === b.sport
    );
  }

  private setupEventsStream(): void {
    toObservable(this.filters).pipe(
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

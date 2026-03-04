import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { UiFilterBar, IUiFilterState } from 'ui-filter-bar';
import {
  BootScreenCardComponent,
  EventCardComponent,
  SkeletonCardComponent,
  formatEventStartTime,
  getStatusClass,
  getStreamHealthClass,
} from 'events-explorer';
import { EventsStateService } from './events-state.service/events-state.service';
import {
  filterStateToSegments,
  segmentsToFilterState,
  deslugifySport,
} from './core/filter-url.util/filter-url.util';

@Component({
  standalone: true,
  imports: [CommonModule, UiFilterBar, EventCardComponent, BootScreenCardComponent, SkeletonCardComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly state = inject(EventsStateService);
  private readonly destroyRef = inject(DestroyRef);
  /** Created in field initializer so toObservable() runs in injection context. */
  private readonly sports$ = toObservable(this.state.sports);
  private readonly filterStorageKey = 'flo-events-filters';
  private pendingSportSegment: string | null = null;

  ngOnInit(): void {
    this.applyFiltersFromLocation();
    this.setupPopStateSync();
    this.setupPendingSportResolution();
  }

  protected onFiltersChange(next: IUiFilterState): void {
    this.state.setFiltersFromState(next);
    this.saveFiltersToStorage(next);
    this.writeLocationFromFilters(next, false);
  }

  protected onClearFilters(): void {
    const defaultFilters: IUiFilterState = {
      liveOnly: false,
      search: '',
      sport: null,
    };
    this.state.setFiltersFromState(defaultFilters);
    this.saveFiltersToStorage(defaultFilters);
    this.writeLocationFromFilters(defaultFilters, true);
  }

  /** Returns stored filter state or null if missing/invalid. */
  private getStoredFilters(): IUiFilterState | null {
    try {
      const value = window.localStorage.getItem(this.filterStorageKey);
      if (!value) return null;
      const parsed = JSON.parse(value) as Partial<IUiFilterState> | null;
      if (!parsed || typeof parsed.liveOnly !== 'boolean') return null;
      const sport =
        parsed.sport === undefined || parsed.sport === null
          ? null
          : String(parsed.sport).trim() || null;
      return {
        liveOnly: parsed.liveOnly,
        search: typeof parsed.search === 'string' ? parsed.search : '',
        sport,
      };
    } catch {
      return null;
    }
  }

  private applyFiltersFromLocation(): void {
    const [liveSeg, sportSeg, searchSeg] = this.readSegmentsFromLocation();
    const isDefault =
      liveSeg === '-' && sportSeg === '-' && (searchSeg === '-' || searchSeg === '');

    if (isDefault) {
      const restored = this.getStoredFilters();
      if (restored) {
        this.state.setFiltersFromState(restored);
        this.writeLocationFromFilters(restored, true);
        return;
      }
    }

    // Sport slug can only be resolved after sports list loads.
    if (sportSeg !== '-') {
      this.pendingSportSegment = sportSeg;
    }

    const { liveOnly, search } = segmentsToFilterState(liveSeg, '-', searchSeg, []);
    this.state.setFiltersFromState({ liveOnly, sport: null, search });
    this.writeLocationSegments([liveSeg, sportSeg, searchSeg], true);
  }

  private setupPendingSportResolution(): void {
    this.sports$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sports) => {
        if (!this.pendingSportSegment || sports.length === 0) {
          return;
        }
        const resolved = deslugifySport(this.pendingSportSegment, sports);
        this.pendingSportSegment = null;
        if (resolved) {
          this.state.setFilters({ sport: resolved });
        }
      });
  }

  private setupPopStateSync(): void {
    const handler = () => {
      const [liveSeg, sportSeg, searchSeg] = this.readSegmentsFromLocation();
      const sports = this.state.sports();
      const parsed = segmentsToFilterState(liveSeg, sportSeg, searchSeg, sports);
      if (!parsed.sport && sportSeg !== '-') {
        this.pendingSportSegment = sportSeg;
      }
      this.state.setFiltersFromState(parsed);
    };

    window.addEventListener('popstate', handler);
    this.destroyRef.onDestroy(() => window.removeEventListener('popstate', handler));
  }

  private readSegmentsFromLocation(): [string, string, string] {
    const path = window.location.pathname.replace(/^\/+/, '').trim();
    if (!path) {
      return ['-', '-', '-'];
    }
    const parts = path.split('/').filter(Boolean);
    const live = parts[0] ?? '-';
    const sport = parts[1] ?? '-';
    const search = parts[2] ?? '-';
    return [live, sport, search];
  }

  private writeLocationFromFilters(filters: IUiFilterState, replace: boolean): void {
    const [live, sport, search] = filterStateToSegments(
      filters.liveOnly,
      filters.sport,
      filters.search,
    );
    this.writeLocationSegments([live, sport, search], replace);
  }

  private writeLocationSegments([live, sport, search]: [string, string, string], replace: boolean): void {
    const nextPath = `/${live}/${sport}/${search}`;
    if (replace) {
      window.history.replaceState(null, '', nextPath);
    } else {
      // Avoid duplicating the same entry.
      if (window.location.pathname === nextPath) return;
      window.history.pushState(null, '', nextPath);
    }
  }

  protected getStatusClass(status: string): string {
    return getStatusClass(status);
  }

  protected getStreamHealthClass(health: string | undefined): string {
    return getStreamHealthClass(health);
  }

  protected formatStartTime(iso: string): string {
    return formatEventStartTime(iso);
  }

  private saveFiltersToStorage(filters: IUiFilterState): void {
    try {
      window.localStorage.setItem(this.filterStorageKey, JSON.stringify(filters));
    } catch {
      // ignore storage errors
    }
  }

}

import '@angular/compiler';
import { UiFilterBar } from './ui-filter-bar';
import { DEFAULT_UI_FILTER_STATE, IUiFilterState } from './ui-filter-bar.types';

type TUiFilterBarTestApi = UiFilterBar & {
  onToggleClick(): void;
  onSearchChange(value: string): void;
  onClearSearch(): void;
  onSportSelected(sport: string | null): void;
  onResetFilters(): void;
  onToggleKeydown(event: KeyboardEvent): void;
  onOptionKeydown(event: KeyboardEvent, sport: string | null): void;
  onStatusChange(value: 'all' | 'upcoming' | 'live' | 'completed'): void;
  sportSearch: string;
  isDropdownOpen: boolean;
  focusedOptionIndex: number;
  filteredSports(): string[];
};

describe('UiFilterBar', () => {
  let component: UiFilterBar;
  let testApi: TUiFilterBarTestApi;

  const defaultFilters: IUiFilterState = { ...DEFAULT_UI_FILTER_STATE };

  beforeEach(() => {
    component = new UiFilterBar();
    testApi = component as TUiFilterBarTestApi;
    component.filters = { ...defaultFilters };
    component.sports = ['Cycling', 'Wrestling', 'Track & Field'];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filtersChange output', () => {
    it('emits with liveOnly true when toggle is clicked', () => {
      component.filtersChange.subscribe((next) => {
        expect(next.liveOnly).toBe(true);
        expect(next.search).toBe('');
        expect(next.sport).toBeNull();
        expect(next.status).toBe('all');
      });
      testApi.onToggleClick();
    });

    it('emits with updated search when onSearchChange is called', () => {
      component.filtersChange.subscribe((next) => {
        expect(next.search).toBe('tennis');
        expect(next.status).toBe('all');
      });
      testApi.onSearchChange('tennis');
    });

    it('emits with empty search when onClearSearch is called', () => {
      component.filters = { ...defaultFilters, search: 'old' };
      component.filtersChange.subscribe((next) => {
        expect(next.search).toBe('');
        expect(next.status).toBe('all');
      });
      testApi.onClearSearch();
    });

    it('emits with selected sport when onSportSelected is called', () => {
      component.filtersChange.subscribe((next) => {
        expect(next.sport).toBe('Cycling');
        expect(next.status).toBe('all');
      });
      testApi.onSportSelected('Cycling');
    });

    it('emits with sport null when "All sports" is selected', () => {
      component.filters = { ...defaultFilters, sport: 'Wrestling' };
      component.filtersChange.subscribe((next) => {
        expect(next.sport).toBeNull();
        expect(next.status).toBe('all');
      });
      testApi.onSportSelected(null);
    });

    it('emits default filters when reset is invoked', () => {
      component.filters = {
        liveOnly: true,
        search: 'abc',
        sport: 'Cycling',
        status: 'upcoming',
      };
      component.filtersChange.subscribe((next) => {
        expect(next).toEqual(defaultFilters);
      });
      testApi.onResetFilters();
    });

    it('resets status to all when turning liveOnly on', () => {
      component.filters = {
        ...defaultFilters,
        status: 'upcoming',
      };
      component.filtersChange.subscribe((next) => {
        expect(next.liveOnly).toBe(true);
        expect(next.status).toBe('all');
      });
      testApi.onToggleClick();
    });

    it('turns off liveOnly when selecting a non-all status', () => {
      component.filters = {
        ...defaultFilters,
        liveOnly: true,
        status: 'all',
      };
      component.filtersChange.subscribe((next) => {
        expect(next.status).toBe('completed');
        expect(next.liveOnly).toBe(false);
      });
      (component as TUiFilterBarTestApi).onStatusChange('completed');
    });
  });

  describe('filteredSports', () => {
    it('returns all sports when sportSearch is empty', () => {
      testApi.sportSearch = '';
      expect(testApi.filteredSports()).toEqual([
        'Cycling',
        'Wrestling',
        'Track & Field',
      ]);
    });

    it('returns only matching sports when sportSearch is set', () => {
      testApi.sportSearch = 'cycl';
      expect(testApi.filteredSports()).toEqual(['Cycling']);
    });

    it('filters case-insensitively', () => {
      testApi.sportSearch = 'WREST';
      expect(testApi.filteredSports()).toEqual(['Wrestling']);
    });

    it('returns empty array when no sport matches', () => {
      testApi.sportSearch = 'xyz';
      expect(testApi.filteredSports()).toEqual([]);
    });
  });

  describe('keyboard accessibility', () => {
    it('toggles liveOnly on Enter key', () => {
      component.filtersChange.subscribe((next) => {
        expect(next.liveOnly).toBe(true);
      });
      testApi.onToggleKeydown({
        key: 'Enter',
        preventDefault: () => undefined,
      } as KeyboardEvent);
    });

    it('toggles liveOnly on Space key', () => {
      component.filtersChange.subscribe((next) => {
        expect(next.liveOnly).toBe(true);
      });
      testApi.onToggleKeydown({
        key: ' ',
        preventDefault: () => undefined,
      } as KeyboardEvent);
    });

    it('selects focused option on Enter in dropdown option', () => {
      testApi.isDropdownOpen = true;
      testApi.focusedOptionIndex = 1; // first sport
      component.filtersChange.subscribe((next) => {
        expect(next.sport).toBe('Cycling');
      });
      const ev = {
        key: 'Enter',
        preventDefault: () => undefined,
      } as KeyboardEvent;
      testApi.onOptionKeydown(ev, 'Cycling');
    });
  });
});

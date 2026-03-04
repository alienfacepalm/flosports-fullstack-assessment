import '@angular/compiler';
import { UiFilterBar } from './ui-filter-bar';
import { IUiFilterState } from './ui-filter-bar.types';

type TUiFilterBarTestApi = UiFilterBar & {
  onToggleClick(): void;
  onSearchChange(value: string): void;
  onClearSearch(): void;
  onSportSelected(sport: string | null): void;
  onResetFilters(): void;
  onToggleKeydown(event: KeyboardEvent): void;
  onOptionKeydown(event: KeyboardEvent, sport: string | null): void;
  sportSearch: string;
  isDropdownOpen: boolean;
  focusedOptionIndex: number;
  filteredSports(): string[];
};

describe('UiFilterBar', () => {
  let component: UiFilterBar;
  let testApi: TUiFilterBarTestApi;

  const defaultFilters: IUiFilterState = {
    liveOnly: false,
    search: '',
    sport: null,
  };

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
      });
      testApi.onToggleClick();
    });

    it('emits with updated search when onSearchChange is called', () => {
      component.filtersChange.subscribe((next) => {
        expect(next.search).toBe('tennis');
      });
      testApi.onSearchChange('tennis');
    });

    it('emits with empty search when onClearSearch is called', () => {
      component.filters = { ...defaultFilters, search: 'old' };
      component.filtersChange.subscribe((next) => {
        expect(next.search).toBe('');
      });
      testApi.onClearSearch();
    });

    it('emits with selected sport when onSportSelected is called', () => {
      component.filtersChange.subscribe((next) => {
        expect(next.sport).toBe('Cycling');
      });
      testApi.onSportSelected('Cycling');
    });

    it('emits with sport null when "All sports" is selected', () => {
      component.filters = { ...defaultFilters, sport: 'Wrestling' };
      component.filtersChange.subscribe((next) => {
        expect(next.sport).toBeNull();
      });
      testApi.onSportSelected(null);
    });

    it('emits default filters when reset is invoked', () => {
      component.filters = { liveOnly: true, search: 'abc', sport: 'Cycling' };
      component.filtersChange.subscribe((next) => {
        expect(next).toEqual(defaultFilters);
      });
      testApi.onResetFilters();
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
        preventDefault: () => {},
      } as KeyboardEvent);
    });

    it('toggles liveOnly on Space key', () => {
      component.filtersChange.subscribe((next) => {
        expect(next.liveOnly).toBe(true);
      });
      testApi.onToggleKeydown({
        key: ' ',
        preventDefault: () => {},
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
        preventDefault: () => {},
      } as KeyboardEvent;
      testApi.onOptionKeydown(ev, 'Cycling');
    });
  });
});

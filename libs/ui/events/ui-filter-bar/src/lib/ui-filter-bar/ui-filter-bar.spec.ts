import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiFilterBar } from './ui-filter-bar';
import { IUiFilterState } from './ui-filter-bar.types';

describe('UiFilterBar', () => {
  let component: UiFilterBar;
  let fixture: ComponentFixture<UiFilterBar>;

  const defaultFilters: IUiFilterState = {
    liveOnly: false,
    search: '',
    sport: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiFilterBar],
    }).compileComponents();

    fixture = TestBed.createComponent(UiFilterBar);
    component = fixture.componentInstance;
    component.filters = { ...defaultFilters };
    component.sports = ['Cycling', 'Wrestling', 'Track & Field'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filtersChange output', () => {
    it('emits with liveOnly true when toggle is clicked', (done) => {
      component.filtersChange.subscribe((next) => {
        expect(next.liveOnly).toBe(true);
        expect(next.search).toBe('');
        expect(next.sport).toBeNull();
        done();
      });
      component.onToggleClick();
    });

    it('emits with updated search when onSearchChange is called', (done) => {
      component.filtersChange.subscribe((next) => {
        expect(next.search).toBe('tennis');
        done();
      });
      component.onSearchChange('tennis');
    });

    it('emits with empty search when onClearSearch is called', (done) => {
      component.filters = { ...defaultFilters, search: 'old' };
      component.filtersChange.subscribe((next) => {
        expect(next.search).toBe('');
        done();
      });
      component.onClearSearch();
    });

    it('emits with selected sport when onSportSelected is called', (done) => {
      component.filtersChange.subscribe((next) => {
        expect(next.sport).toBe('Cycling');
        done();
      });
      component.onSportSelected('Cycling');
    });

    it('emits with sport null when "All sports" is selected', (done) => {
      component.filters = { ...defaultFilters, sport: 'Wrestling' };
      component.filtersChange.subscribe((next) => {
        expect(next.sport).toBeNull();
        done();
      });
      component.onSportSelected(null);
    });
  });

  describe('filteredSports', () => {
    it('returns all sports when sportSearch is empty', () => {
      component.sportSearch = '';
      expect(component.filteredSports()).toEqual([
        'Cycling',
        'Wrestling',
        'Track & Field',
      ]);
    });

    it('returns only matching sports when sportSearch is set', () => {
      component.sportSearch = 'cycl';
      expect(component.filteredSports()).toEqual(['Cycling']);
    });

    it('filters case-insensitively', () => {
      component.sportSearch = 'WREST';
      expect(component.filteredSports()).toEqual(['Wrestling']);
    });

    it('returns empty array when no sport matches', () => {
      component.sportSearch = 'xyz';
      expect(component.filteredSports()).toEqual([]);
    });
  });

  describe('keyboard accessibility', () => {
    it('toggles liveOnly on Enter key', (done) => {
      component.filtersChange.subscribe((next) => {
        expect(next.liveOnly).toBe(true);
        done();
      });
      component.onToggleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );
    });

    it('toggles liveOnly on Space key', (done) => {
      component.filtersChange.subscribe((next) => {
        expect(next.liveOnly).toBe(true);
        done();
      });
      component.onToggleKeydown(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      );
    });

    it('selects focused option on Enter in dropdown option', (done) => {
      component.isDropdownOpen = true;
      component.focusedOptionIndex = 1; // first sport
      component.filtersChange.subscribe((next) => {
        expect(next.sport).toBe('Cycling');
        done();
      });
      const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      component.onOptionKeydown(ev, 'Cycling');
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { API_BASE_URL } from './core/api-base-url.token';
import { EventsStateService } from './events-state.service';

describe('EventsStateService', () => {
  let service: EventsStateService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.test' },
      ],
    });
    service = TestBed.inject(EventsStateService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    const req = http.expectOne('https://api.test/sports');
    req.flush(['Cycling', 'Wrestling']);
    expect(service).toBeTruthy();
  });

  it('has initial filter state', () => {
    http.expectOne('https://api.test/sports').flush([]);
    expect(service.filters()).toEqual({
      liveOnly: false,
      search: '',
      sport: null,
    });
  });

  it('setFilters updates filters signal', () => {
    http.expectOne('https://api.test/sports').flush([]);
    service.setFilters({ liveOnly: true });
    expect(service.filters().liveOnly).toBe(true);
    service.setFilters({ search: 'test' });
    expect(service.filters().search).toBe('test');
    service.setFilters({ sport: 'Cycling' });
    expect(service.filters().sport).toBe('Cycling');
  });

  it('setFiltersFromState replaces full state', () => {
    http.expectOne('https://api.test/sports').flush([]);
    service.setFiltersFromState({
      liveOnly: true,
      search: 'q',
      sport: 'Wrestling',
    });
    expect(service.filters()).toEqual({
      liveOnly: true,
      search: 'q',
      sport: 'Wrestling',
    });
  });

  it('clearError sets errorMessage to null', () => {
    http.expectOne('https://api.test/sports').flush([]);
    service.clearError();
    expect(service.errorMessage()).toBeNull();
  });

  it('exposes events, sports, isLoading, errorMessage as signals', () => {
    http.expectOne('https://api.test/sports').flush(['Cycling']);
    expect(service.events()).toEqual([]);
    expect(Array.isArray(service.sports())).toBe(true);
    expect(typeof service.isLoading()).toBe('boolean');
    expect(service.errorMessage()).toBeNull();
  });
});

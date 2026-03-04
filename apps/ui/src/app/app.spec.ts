import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { EventsStateService } from './events-state.service';
import { appRoutes } from './app.routes';

const defaultRouteParams = { live: 'all', sport: 'all', search: '-' };

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideRouter(appRoutes),
        EventsStateService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap(defaultRouteParams)),
            parent: null,
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render FloSports Event Explorer title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('FloSports Event Explorer');
  });

  it('should include the filter bar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('lib-ui-filter-bar')).toBeTruthy();
  });

  it('should update filters when filter bar emits', () => {
    const fixture = TestBed.createComponent(App);
    const state = TestBed.inject(EventsStateService);
    fixture.detectChanges();
    expect(state.filters().search).toBe('');
    state.setFilters({ search: 'test' });
    expect(state.filters().search).toBe('test');
  });
});

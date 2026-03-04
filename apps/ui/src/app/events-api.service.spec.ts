import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './core/api-base-url.token';
import { EventsApiService } from './events-api.service';

describe('EventsApiService', () => {
  let service: EventsApiService;
  let controller: HttpTestingController;
  const baseUrl = 'https://api.test';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });
    service = TestBed.inject(EventsApiService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getEvents', () => {
    it('calls GET /events with no params when filter is empty', () => {
      service.getEvents({ liveOnly: false, search: '', sport: null }).subscribe();
      const req = controller.expectOne(`${baseUrl}/events`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });

    it('adds liveOnly=true when filter.liveOnly is true', () => {
      service
        .getEvents({ liveOnly: true, search: '', sport: null })
        .subscribe();
      const req = controller.expectOne((r) => r.url?.startsWith(`${baseUrl}/events`));
      expect(req.request.params.get('liveOnly')).toBe('true');
      req.flush([]);
    });

    it('adds search param when filter.search is non-empty', () => {
      service
        .getEvents({ liveOnly: false, search: 'tennis', sport: null })
        .subscribe();
      const req = controller.expectOne((r) => r.url?.startsWith(`${baseUrl}/events`));
      expect(req.request.params.get('search')).toBe('tennis');
      req.flush([]);
    });

    it('adds sport param when filter.sport is set', () => {
      service
        .getEvents({ liveOnly: false, search: '', sport: 'Cycling' })
        .subscribe();
      const req = controller.expectOne((r) => r.url?.startsWith(`${baseUrl}/events`));
      expect(req.request.params.get('sport')).toBe('Cycling');
      req.flush([]);
    });

    it('emits response body as array', () => {
      const payload = [
        {
          id: 'evt-1',
          title: 'Test',
          sport: 'Cycling',
          league: 'L',
          status: 'live',
          startTime: '2026-02-18T19:00:00.000Z',
        },
      ];
      service.getEvents({ liveOnly: false, search: '', sport: null }).subscribe((data) => {
        expect(data).toEqual(payload);
      });
      const req = controller.expectOne(`${baseUrl}/events`);
      req.flush(payload);
    });
  });

  describe('getSports', () => {
    it('calls GET /sports and returns array', () => {
      const sports = ['Cycling', 'Wrestling'];
      service.getSports().subscribe((data) => {
        expect(data).toEqual(sports);
      });
      const req = controller.expectOne(`${baseUrl}/sports`);
      expect(req.request.method).toBe('GET');
      req.flush(sports);
    });
  });
});

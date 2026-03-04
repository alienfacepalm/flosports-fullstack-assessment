import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IEvent, IEventsFilter } from '../events.types';
import { API_BASE_URL } from '../core/api-base-url.token';

@Injectable({
  providedIn: 'root',
})
export class EventsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getEvents(filter: IEventsFilter): Observable<IEvent[]> {
    let params = new HttpParams();

    if (filter.liveOnly) {
      params = params.set('liveOnly', 'true');
    }

    if (filter.search.trim().length > 0) {
      params = params.set('search', filter.search.trim());
    }

    if (filter.sport) {
      params = params.set('sport', filter.sport);
    }

    return this.http.get<IEvent[]>(`${this.baseUrl}/events`, { params });
  }

  getSports(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/sports`);
  }
}


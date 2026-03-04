export enum EventStatus {
  Upcoming = 'upcoming',
  Live = 'live',
  Completed = 'completed',
}

export enum StreamHealth {
  Excellent = 'excellent',
  Good = 'good',
  Fair = 'fair',
  Poor = 'poor',
}

export interface IEventCatalog {
  id: string;
  title: string;
  sport: string;
  league: string;
  status: EventStatus;
  startTime: string;
}

export interface ILiveStats {
  eventId: string;
  viewerCount: number;
  peakViewerCount: number;
  streamHealth: StreamHealth;
  lastUpdated: string;
}

export interface IEventWithStats extends IEventCatalog {
  liveStats?: ILiveStats;
}

export interface IEventsFilterCriteria {
  status?: EventStatus;
  sport?: string;
  search?: string;
  liveOnly?: boolean;
}


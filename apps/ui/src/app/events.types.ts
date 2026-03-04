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

export interface ILiveStats {
  eventId: string;
  viewerCount: number;
  peakViewerCount: number;
  streamHealth: StreamHealth;
  lastUpdated: string;
}

export interface IEvent {
  id: string;
  title: string;
  sport: string;
  league: string;
  status: EventStatus;
  startTime: string;
  liveStats?: ILiveStats;
}

export interface IEventsFilter {
  liveOnly: boolean;
  search: string;
  sport: string | null;
}


import { Injectable, NotFoundException } from '@nestjs/common';
import {
  IEventWithStats,
  EventsRepository,
  filterEvents,
  type IEventsFilterCriteria,
} from 'data-access';
import { EventsQueryDto } from './events-query.dto';

export interface IEventsResponse {
  events: IEventWithStats[];
  sports: string[];
}

const MAX_TEXT_LENGTH = 200;

function sanitizeText(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const cleaned = value
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
  return cleaned === '' ? undefined : cleaned;
}

function mapQueryToCriteria(query: EventsQueryDto): IEventsFilterCriteria {
  return {
    status: query.status,
    sport: sanitizeText(query.sport),
    search: sanitizeText(query.search),
    liveOnly: query.liveOnly,
  };
}

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async getEvents(query: EventsQueryDto): Promise<IEventsResponse> {
    const [allEvents, sports] = await Promise.all([
      this.eventsRepository.getAllEvents(),
      this.eventsRepository.getAllSports(),
    ]);

    const criteria = mapQueryToCriteria(query);
    const events = filterEvents(allEvents, criteria);

    return {
      events,
      sports,
    };
  }

  async getEventById(id: string): Promise<IEventWithStats> {
    const event = await this.eventsRepository.getEventById(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  async getSports(): Promise<string[]> {
    return this.eventsRepository.getAllSports();
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import {
  IEventWithStats,
  EventsRepository,
  filterEvents,
} from 'data-access';
import { EventsQueryDto } from './events-query.dto';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async getEvents(query: EventsQueryDto): Promise<IEventWithStats[]> {
    const allEvents = await this.eventsRepository.getAllEvents();
    return filterEvents(allEvents, query);
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


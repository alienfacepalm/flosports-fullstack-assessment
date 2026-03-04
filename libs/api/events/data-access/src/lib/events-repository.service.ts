import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { IEventCatalog, EventStatus, IEventWithStats, ILiveStats } from './event-types';
import { mergeEventsWithStats } from './events-filter/events-filter';

@Injectable()
export class EventsRepository {
  private readonly logger = new Logger(EventsRepository.name);
  private cachedEvents: IEventWithStats[] | null = null;

  async getAllEvents(): Promise<IEventWithStats[]> {
    if (this.cachedEvents) {
      return this.cachedEvents;
    }

    const events = await this.loadEventsFromDisk();
    const liveStats = await this.loadLiveStatsFromDisk();

    this.cachedEvents = mergeEventsWithStats(events, liveStats);

    return this.cachedEvents;
  }

  async getEventById(id: string): Promise<IEventWithStats | undefined> {
    const events = await this.getAllEvents();
    return events.find((event) => event.id === id);
  }

  async getAllSports(): Promise<string[]> {
    const events = await this.getAllEvents();
    const sports = new Set(events.map((event) => event.sport));
    return Array.from(sports).sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: 'base' }),
    );
  }

  private async loadEventsFromDisk(): Promise<IEventCatalog[]> {
    const path = resolve(process.cwd(), 'apps/api/src/data/events.json');
    try {
      const fileContents = await readFile(path, { encoding: 'utf-8' });
      const parsed = JSON.parse(fileContents) as IEventCatalog[];
      return parsed;
    } catch (error) {
      this.logger.error(`Failed to load events from ${path}`, error as Error);
      throw new InternalServerErrorException('Failed to load events data');
    }
  }

  private async loadLiveStatsFromDisk(): Promise<ILiveStats[]> {
    const path = resolve(process.cwd(), 'apps/api/src/data/live-stats.json');
    try {
      const fileContents = await readFile(path, { encoding: 'utf-8' });
      const parsed = JSON.parse(fileContents) as ILiveStats[];
      return parsed;
    } catch (error) {
      this.logger.error(`Failed to load live stats from ${path}`, error as Error);
      throw new InternalServerErrorException('Failed to load live stats data');
    }
  }
}


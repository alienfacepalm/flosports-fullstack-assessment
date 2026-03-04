import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventStatus, IEventWithStats, EventsRepository } from 'data-access';
import { EventsService, type IEventsResponse } from './events.service';

const mockEvents: IEventWithStats[] = [
  {
    id: 'evt-1',
    title: 'Live Cycling Event',
    sport: 'Cycling',
    league: 'Test',
    status: EventStatus.Live,
    startTime: '2026-02-18T19:00:00.000Z',
  },
  {
    id: 'evt-2',
    title: 'Completed Wrestling',
    sport: 'Wrestling',
    league: 'Test',
    status: EventStatus.Completed,
    startTime: '2026-02-17T23:00:00.000Z',
  },
  {
    id: 'evt-3',
    title: 'Another Live Match',
    sport: 'Wrestling',
    league: 'Test',
    status: EventStatus.Live,
    startTime: '2026-02-20T20:00:00.000Z',
  },
];

describe('EventsService', () => {
  let service: EventsService;
  let repository: jest.Mocked<Pick<EventsRepository, 'getAllEvents' | 'getEventById' | 'getAllSports'>>;

  beforeEach(async () => {
    repository = {
      getAllEvents: jest.fn().mockResolvedValue([...mockEvents]),
      getEventById: jest.fn(),
      getAllSports: jest.fn().mockResolvedValue(['Cycling', 'Wrestling']),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: EventsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('returns all events when no query', async () => {
      const result: IEventsResponse = await service.getEvents({});
      expect(repository.getAllEvents).toHaveBeenCalledTimes(1);
      expect(repository.getAllSports).toHaveBeenCalledTimes(1);
      expect(result.events).toHaveLength(3);
      expect(result.sports).toEqual(['Cycling', 'Wrestling']);
    });

    it('filters by liveOnly true', async () => {
      const result: IEventsResponse = await service.getEvents({ liveOnly: true });
      expect(result.events).toHaveLength(2);
      expect(result.events.every((e) => e.status === EventStatus.Live)).toBe(true);
    });

    it('filters by sport (case-insensitive)', async () => {
      const result: IEventsResponse = await service.getEvents({ sport: 'wrestling' });
      expect(result.events).toHaveLength(2);
      expect(result.events.every((e) => e.sport === 'Wrestling')).toBe(true);
    });

    it('filters by title search', async () => {
      const result: IEventsResponse = await service.getEvents({ search: 'Live' });
      expect(result.events).toHaveLength(2);
      expect(result.events.map((e) => e.title)).toContain('Live Cycling Event');
      expect(result.events.map((e) => e.title)).toContain('Another Live Match');
    });

    it('combines liveOnly and sport', async () => {
      const result: IEventsResponse = await service.getEvents({
        liveOnly: true,
        sport: 'Wrestling',
      });
      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe('evt-3');
    });
  });

  describe('getEventById', () => {
    it('returns event when found', async () => {
      repository.getEventById!.mockResolvedValue(mockEvents[0]);
      const result = await service.getEventById('evt-1');
      expect(result).toEqual(mockEvents[0]);
      expect(repository.getEventById).toHaveBeenCalledWith('evt-1');
    });

    it('throws NotFoundException when event is missing', async () => {
      repository.getEventById!.mockResolvedValue(undefined);
      await expect(service.getEventById('missing')).rejects.toThrow(NotFoundException);
      await expect(service.getEventById('missing')).rejects.toThrow(/missing/);
    });
  });

  describe('getSports', () => {
    it('returns sports from repository', async () => {
      const result = await service.getSports();
      expect(repository.getAllSports).toHaveBeenCalledTimes(1);
      expect(result).toEqual(['Cycling', 'Wrestling']);
    });
  });
});

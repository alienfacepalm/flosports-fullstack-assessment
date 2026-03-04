import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsQueryDto } from './events-query.dto';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('events')
  getEvents(@Query() query: EventsQueryDto) {
    return this.eventsService.getEvents(query);
  }

  @Get('events/:id')
  getEventById(@Param('id') id: string) {
    return this.eventsService.getEventById(id);
  }

  @Get('sports')
  getSports() {
    return this.eventsService.getSports();
  }
}


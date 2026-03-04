import { Module } from '@nestjs/common';
import { DataAccessModule } from 'data-access';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [DataAccessModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}


import { Module } from '@nestjs/common';
import { EventsRepository } from './events-repository.service';

@Module({
  providers: [EventsRepository],
  exports: [EventsRepository],
})
export class DataAccessModule {}


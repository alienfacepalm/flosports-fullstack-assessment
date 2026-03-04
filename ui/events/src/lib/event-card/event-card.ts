import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IEvent } from '../../../../../apps/ui/src/app/events.types';
import {
  getStatusClass,
  getStreamHealthClass,
} from '../core/event-class-maps/event-class-maps';
import { formatEventStartTime } from '../core/date-format.util/date-format.util';

@Component({
  standalone: true,
  selector: 'lib-ui-event-card',
  imports: [CommonModule],
  templateUrl: './event-card.html',
  styleUrl: './event-card.scss',
})
export class EventCardComponent {
  @Input({ required: true }) event!: IEvent;

  protected getStatusClass(status: string): string {
    return getStatusClass(status);
  }

  protected getStreamHealthClass(health: string | undefined): string {
    return getStreamHealthClass(health);
  }

  protected formatStartTime(iso: string): string {
    return formatEventStartTime(iso);
  }
}


import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EventsStateService } from './events-state.service/events-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppShell {
  /** Eagerly create state service at bootstrap so sports and events start loading immediately. */
  private readonly _state = inject(EventsStateService);
}

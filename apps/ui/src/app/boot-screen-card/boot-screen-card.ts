import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type TBootScreenVariant = 'unavailable' | 'connecting';

@Component({
  standalone: true,
  selector: 'lib-ui-boot-screen-card',
  imports: [CommonModule],
  templateUrl: './boot-screen-card.html',
})
export class BootScreenCardComponent {
  @Input({ required: true }) variant!: TBootScreenVariant;
}


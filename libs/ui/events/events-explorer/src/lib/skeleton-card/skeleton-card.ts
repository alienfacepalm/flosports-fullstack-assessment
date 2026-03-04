import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'lib-ui-skeleton-card',
  imports: [CommonModule],
  templateUrl: './skeleton-card.html',
})
export class SkeletonCardComponent {}


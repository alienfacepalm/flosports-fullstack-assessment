import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DEFAULT_UI_FILTER_STATE,
  IUiFilterState,
  TStatusFilter,
} from './ui-filter-bar.types';

@Component({
  selector: 'lib-ui-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ui-filter-bar.html',
  styleUrl: './ui-filter-bar.scss',
})
export class UiFilterBar {
  @Input() sports: string[] = [];
  @Input() filters: IUiFilterState = { ...DEFAULT_UI_FILTER_STATE };

  @Output() filtersChange = new EventEmitter<IUiFilterState>();

  protected sportSearch = '';
  protected isDropdownOpen = false;
  protected focusedOptionIndex = 0;
  protected readonly focusedOptionId = signal<string | null>('sport-option-all');

  private readonly dropdownTrigger = viewChild<ElementRef<HTMLButtonElement>>('dropdownTrigger');
  private readonly sportSearchInput = viewChild<ElementRef<HTMLInputElement>>('sportSearchInput');

  protected onToggleLiveOnly(liveOnly: boolean): void {
    const patch: Partial<IUiFilterState> = { liveOnly };
    if (liveOnly && this.filters.status !== 'all') {
      patch.status = 'all';
    }
    this.emitUpdatedFilters(patch);
  }

  protected onToggleClick(): void {
    this.onToggleLiveOnly(!this.filters.liveOnly);
  }

  protected onToggleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onToggleClick();
    }
  }

  protected onSearchChange(search: string): void {
    this.emitUpdatedFilters({ search });
  }

  protected onClearSearch(): void {
    this.emitUpdatedFilters({ search: '' });
  }

  protected onResetFilters(): void {
    this.emitUpdatedFilters({ ...DEFAULT_UI_FILTER_STATE });
  }

  protected onSearchKeydown(_event: KeyboardEvent): void {
    // Allow default (typing); Escape could clear if desired
  }

  protected onSportSearchChange(value: string): void {
    this.sportSearch = value;
  }

  protected onSportSelected(sport: string | null): void {
    this.emitUpdatedFilters({ sport });
    this.closeDropdown();
  }

  protected toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.syncFocusedOptionFromSelection();
      this.focusedOptionId.set(this.getOptionIdAt(this.focusedOptionIndex));
      setTimeout(() => this.sportSearchInput()?.nativeElement.focus(), 0);
    } else {
      this.focusedOptionIndex = 0;
      this.focusedOptionId.set(null);
      setTimeout(() => this.dropdownTrigger()?.nativeElement.focus(), 0);
    }
  }

  protected closeDropdown(): void {
    this.isDropdownOpen = false;
    this.focusedOptionIndex = 0;
    this.focusedOptionId.set(null);
    setTimeout(() => this.dropdownTrigger()?.nativeElement.focus(), 0);
  }

  protected onDropdownButtonKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDropdown();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.isDropdownOpen) {
        this.toggleDropdown();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        this.moveFocus(event.key === 'ArrowDown' ? 1 : -1);
      } else {
        this.selectFocusedOption();
      }
    }
  }

  protected onDropdownPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDropdown();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocus(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectFocusedOption();
    }
  }

  protected onSportSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDropdown();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveFocus(1);
    }
  }

  protected onOptionKeydown(event: KeyboardEvent, sport: string | null): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onSportSelected(sport);
    }
  }

  protected filteredSports(): string[] {
    const term = this.sportSearch.trim().toLowerCase();
    if (!term) {
      return this.sports;
    }
    return this.sports.filter((s) => s.toLowerCase().includes(term));
  }

  private syncFocusedOptionFromSelection(): void {
    if (this.filters.sport === null) {
      this.focusedOptionIndex = 0;
      return;
    }
    const list = this.filteredSports();
    const idx = list.indexOf(this.filters.sport);
    this.focusedOptionIndex = idx >= 0 ? idx + 1 : 0;
  }

  private getOptionIdAt(index: number): string {
    if (index <= 0) {
      return 'sport-option-all';
    }
    const list = this.filteredSports();
    const sport = list[index - 1];
    return sport != null ? `sport-option-${sport}` : 'sport-option-all';
  }

  private moveFocus(delta: number): void {
    const total = 1 + this.filteredSports().length;
    this.focusedOptionIndex = Math.max(0, Math.min(total - 1, this.focusedOptionIndex + delta));
    this.focusedOptionId.set(this.getOptionIdAt(this.focusedOptionIndex));
  }

  private selectFocusedOption(): void {
    const list = this.filteredSports();
    if (this.focusedOptionIndex <= 0) {
      this.onSportSelected(null);
      return;
    }
    const sport = list[this.focusedOptionIndex - 1];
    this.onSportSelected(sport ?? null);
  }

  private emitUpdatedFilters(partial: Partial<IUiFilterState>): void {
    const next: IUiFilterState = {
      ...this.filters,
      ...partial,
    };
    this.filtersChange.emit(next);
  }

  protected onStatusChange(status: TStatusFilter): void {
    const patch: Partial<IUiFilterState> = { status };
    if (status !== 'all' && this.filters.liveOnly) {
      patch.liveOnly = false;
    }
    this.emitUpdatedFilters(patch);
  }
}


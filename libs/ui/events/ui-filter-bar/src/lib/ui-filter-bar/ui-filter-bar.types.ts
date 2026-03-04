export type TStatusFilter = 'all' | 'upcoming' | 'live' | 'completed';

export interface IUiFilterState {
  liveOnly: boolean;
  search: string;
  sport: string | null;
  status: TStatusFilter;
}

export const DEFAULT_UI_FILTER_STATE: IUiFilterState = {
  liveOnly: false,
  search: '',
  sport: null,
  status: 'all',
};


// show info
export interface RadioShow {
  id: string;
  title: string;
  hosts: string[];
  startDate: string;
  frequency: 'weekly' | 'biweekly' | 'irregular';
  bannerUrl?: string;
  iconUrl?: string;
  totalEpisodes?: number;
  episodeDurationMinutes?: number;
  manualTotalEpisodes?: number | null;
  isHiatus?: boolean;
  isEnded?: boolean;
}

// User-specific state (stored locally)
export type UserShowState = {
  showId: string;
  lastListenedEpisode?: number;
  status: 'listening' | 'backlog' | 'completed' | 'dropped';
  isPinned?: boolean;
  tags?: string[];
};

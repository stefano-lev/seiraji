// show info
export type RadioShow = {
  id: string;
  title: string;
  hosts: string[];
  startDate: string;
  frequency: 'weekly' | 'biweekly' | 'irregular';
  bannerUrl?: string;
  totalEpisodes?: number;
};

// User-specific state (stored locally)
export type UserShowState = {
  showId: string;
  lastListenedEpisode?: number;
  completedEpisodes: number[];
  rating?: 1 | 2 | 3 | 4 | 5;
  status: 'listening' | 'backlog' | 'completed' | 'dropped';
};

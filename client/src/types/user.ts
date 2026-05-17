// User-specific state (stored locally)
export type UserProgramState = {
  programId: string;

  status: 'listening' | 'backlog' | 'completed' | 'dropped';

  lastListenedEpisode?: number;

  lastListenedEpisodeId?: string;

  personalRating?: number;

  notes?: string;

  tags?: string[];

  isPinned?: boolean;

  isFavorite?: boolean;

  startedAt?: string;

  completedAt?: string;

  updatedAt?: string;
};

export type UserProgress = {
  programId: string;
  lastEpisode: number;
  status: 'listening' | 'backlog' | 'completed' | 'dropped';
};

export type UserProgramMeta = {
  programId: string;
  isPinned: boolean;
  tags: string[];
  rating?: number;
  notes?: string;
};

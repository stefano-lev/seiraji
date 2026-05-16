// User-specific state (stored locally)
export type UserProgramState = {
  programId: string;
  lastListenedEpisode?: number;
  status: 'listening' | 'backlog' | 'completed' | 'dropped';
  isPinned?: boolean;
  tags?: string[];
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

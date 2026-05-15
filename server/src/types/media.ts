export interface Program {
  platform: string;
  platformId: string | number;
  slug?: string;
  url: string;

  program: {
    title: string;
    description: string | null;
    thumbnail: string | null;

    hosts?: string[];
    schedule?: string | null;

    categories?: string[];
  };

  episodes: Episode[];

  meta: {
    cachedAt: string;
    episodeCount: number;
  };
}

export interface Episode {
  id: string;

  title: string;
  description?: string | null;

  publishedAt?: string | null;
  publishedAtUnix?: number | null;

  thumbnail?: string | null;

  durationSeconds?: number | null;

  tags?: string[];

  platformMetadata?: Record<string, any>;
}
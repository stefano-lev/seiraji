export interface Program {
  id: string;

  platform: string;

  platformId: string | number;

  slug?: string;

  url: string;

  source: 'imported' | 'manual';

  program: {
    title: string;
    customTitle?: string;

    description: string | null;
    customDescription?: string | null;

    thumbnail: string | null;
    customThumbnail?: string | null;

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

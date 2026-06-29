export interface Program {
  id: string;

  platform: string;

  platformId: string | number;

  slug?: string;

  url: string;

  episodesUrl?: string;

  source: 'imported' | 'manual';

  program: {
    title: string;
    customTitle?: string;

    description: string | null;
    customDescription?: string | null;

    thumbnail: string | null;
    customThumbnail?: string | null;

    hosts?: string[] | string | null;

    schedule?: string | null;

    categories?: string[];

    twitter?: string | null;
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

  platformMetadata?: Record<string, unknown>;
}

export type ProgramPreview = {
  title: string;

  description: string | null;

  thumbnail: string | null;

  hosts: string[];

  platform: string;

  episodeCount: number;
};

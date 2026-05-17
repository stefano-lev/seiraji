import type { Episode } from '../types/media';

export function normalizeEpisodes(episodes: Episode[]): Episode[] {
  return [...episodes].sort((a, b) => {
    if (a.publishedAtUnix && b.publishedAtUnix) {
      return a.publishedAtUnix - b.publishedAtUnix;
    }

    // fallback to ISO date
    if (a.publishedAt && b.publishedAt) {
      return (
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );
    }

    return 0;
  });
}

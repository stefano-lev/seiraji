import type { Episode } from '../types/media';

export function getNewEpisodes(
  cachedEpisodes: Episode[],
  scrapedEpisodes: Episode[]
) {
  const existingIds = new Set(cachedEpisodes.map((episode) => episode.id));

  return scrapedEpisodes.filter((episode) => !existingIds.has(episode.id));
}

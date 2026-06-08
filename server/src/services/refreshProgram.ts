import { readCache, writeCache } from '../utils/cache';

import { getNewEpisodes } from '../utils/episodes';

import { scrapeAudee } from './scrapeAudee';
import { scrapeOnsen } from './scrapeOnsen';
import { scrapeYoutubePlaylist } from './scrapeYoutubePlaylist';
import { scrapeQlover } from './scrapeQlover';
import { scrapeOpenrec } from './scrapeOpenrec';
import { scrapeNicochannel } from './scrapeNicochannel';
import { scrapeNHK } from './scrapeNHK';
import { scrapeTokyoFM } from './scrapeTokyoFM';
import { scrapeANN } from './scrapeANN';
import {
  getAudeeSlug,
  getOnsenSlug,
  getYoutubePlaylistId,
  getQloverSlug,
  getOpenrecSlug,
  getNicochannelSlug,
  getNHKSeriesId,
  getTokyoFMSlug,
  getANNSlug,
} from '../utils/platformKeys';

export async function refreshProgram(url: string) {
  const hostname = new URL(url).hostname;

  if (hostname.includes('audee-membership.jp')) {
    const slug = getAudeeSlug(url);

    return refreshCachedProgram('audee-programs.json', slug, () =>
      scrapeAudee(url)
    );
  }

  if (hostname.includes('onsen.ag')) {
    const slug = getOnsenSlug(url);

    return refreshCachedProgram('onsen-programs.json', slug, () =>
      scrapeOnsen(url)
    );
  }

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    const playlistId = getYoutubePlaylistId(url);

    return refreshCachedProgram('youtube-playlists.json', playlistId, () =>
      scrapeYoutubePlaylist(url)
    );
  }

  if (hostname.includes('qlover.jp')) {
    const slug = getQloverSlug(url);

    return refreshCachedProgram('qlover-programs.json', slug, () =>
      scrapeQlover(url)
    );
  }

  if (hostname.includes('openrec.tv')) {
    const slug = getOpenrecSlug(url);

    return refreshCachedProgram('openrec-programs.json', slug, () =>
      scrapeOpenrec(url)
    );
  }

  if (hostname.includes('nicochannel.jp')) {
    const slug = getNicochannelSlug(url);

    return refreshCachedProgram('nicochannel-programs.json', slug, () =>
      scrapeNicochannel(url)
    );
  }

  if (hostname.includes('nhk.jp')) {
    const seriesId = getNHKSeriesId(url);

    return refreshCachedProgram('nhk-programs.json', seriesId, () =>
      scrapeNHK(url)
    );
  }

  if (hostname.includes('tfm.co.jp')) {
    const slug = getTokyoFMSlug(url);

    return refreshCachedProgram('tfm-programs.json', slug, () =>
      scrapeTokyoFM(url)
    );
  }

  if (hostname.includes('podcast.1242.com')) {
    const slug = getANNSlug(url);

    return refreshCachedProgram('allnightnippon-programs.json', slug, () =>
      scrapeANN(url)
    );
  }

  throw new Error('Unsupported platform');
}

async function refreshCachedProgram(
  cacheFile: string,
  cacheKey: string,
  scraper: () => Promise<any>
) {
  const cache = await readCache(cacheFile);

  const cachedProgram = cache[cacheKey];

  if (!cachedProgram) {
    throw new Error('Program not found in cache. Import it first.');
  }

  const liveProgram = await scraper();

  const newEpisodes = getNewEpisodes(
    cachedProgram.episodes,
    liveProgram.episodes
  );

  cachedProgram.episodes.push(...newEpisodes);

  cachedProgram.meta.cachedAt = new Date().toISOString();

  cachedProgram.meta.episodeCount = cachedProgram.episodes.length;

  cache[cacheKey] = cachedProgram;

  await writeCache(cacheFile, cache);

  return {
    success: true,

    programPlatform: cachedProgram.platform,
    programSlug: cachedProgram.slug,
    programTitle: cachedProgram.program.title,

    addedEpisodes: newEpisodes.length,
    totalEpisodes: cachedProgram.episodes.length,

    program: cachedProgram,
  };
}

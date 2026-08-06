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
import { scrapeKoelink } from './scrapeKoelink';
import { scrapeApplePodcast } from './scrapeApplePodcast';
import { scrapeRadikoPodcast } from './scrapeRadikoPodcast';
import { scrapeRadikoTimeshift } from './scrapeRadikoTimeshift';
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
  getKoelinkSlug,
  getApplePodcastId,
  getRadikoPodcastChannelId,
  getRadikoTimeshiftKey,
  isRadikoPodcastUrl,
  isRadikoTimeshiftUrl,
} from '../utils/platformKeys';
import { type AppLogger } from '../utils/logger';

export async function refreshProgram(url: string, logger?: AppLogger) {
  const hostname = new URL(url).hostname;

  if (hostname.includes('audee-membership.jp')) {
    const slug = getAudeeSlug(url);

    return refreshCachedProgram(
      'audee-programs.json',
      slug,
      () => scrapeAudee(url),
      logger?.child({ platform: 'audee' })
    );
  }

  if (hostname.includes('onsen.ag')) {
    const slug = getOnsenSlug(url);

    return refreshCachedProgram(
      'onsen-programs.json',
      slug,
      () => scrapeOnsen(url),
      logger?.child({ platform: 'onsen' })
    );
  }

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    const playlistId = getYoutubePlaylistId(url);

    return refreshCachedProgram(
      'youtube-playlists.json',
      playlistId,
      () => scrapeYoutubePlaylist(url),
      logger?.child({ platform: 'youtube' })
    );
  }

  if (hostname.includes('qlover.jp')) {
    const slug = getQloverSlug(url);

    return refreshCachedProgram(
      'qlover-programs.json',
      slug,
      () => scrapeQlover(url),
      logger?.child({ platform: 'qlover' })
    );
  }

  if (hostname.includes('openrec.tv')) {
    const slug = getOpenrecSlug(url);

    return refreshCachedProgram(
      'openrec-programs.json',
      slug,
      () => scrapeOpenrec(url),
      logger?.child({ platform: 'openrec' })
    );
  }

  if (hostname.includes('nicochannel.jp')) {
    const slug = getNicochannelSlug(url);

    return refreshCachedProgram(
      'nicochannel-programs.json',
      slug,
      () => scrapeNicochannel(url),
      logger?.child({ platform: 'nicochannel' })
    );
  }

  if (hostname.includes('nhk.jp')) {
    const seriesId = getNHKSeriesId(url);

    return refreshCachedProgram(
      'nhk-programs.json',
      seriesId,
      () => scrapeNHK(url),
      logger?.child({ platform: 'nhk' })
    );
  }

  if (hostname.includes('tfm.co.jp')) {
    const slug = getTokyoFMSlug(url);

    return refreshCachedProgram(
      'tfm-programs.json',
      slug,
      () => scrapeTokyoFM(url),
      logger?.child({ platform: 'tokyofm' })
    );
  }

  if (hostname.includes('podcast.1242.com')) {
    const slug = getANNSlug(url);

    return refreshCachedProgram(
      'allnightnippon-programs.json',
      slug,
      () => scrapeANN(url),
      logger?.child({ platform: 'ann' })
    );
  }

  if (hostname.includes('koelink.co.jp')) {
    const slug = getKoelinkSlug(url);

    return refreshCachedProgram(
      'koelink-programs.json',
      slug,
      () => scrapeKoelink(url),
      logger?.child({ platform: 'koelink' })
    );
  }

  if (hostname.includes('podcasts.apple.com')) {
    const applePodcastId = getApplePodcastId(url);

    return refreshCachedProgram(
      'applepodcasts-programs.json',
      applePodcastId,
      () => scrapeApplePodcast(url),
      logger?.child({ platform: 'applepodcasts' })
    );
  }

  if (hostname.includes('radiko.jp')) {
    if (isRadikoPodcastUrl(url)) {
      const channelId = getRadikoPodcastChannelId(url);

      const scrapeLogger = logger?.child({ platform: 'radiko-podcast' });

      return refreshCachedProgram(
        'radiko-podcasts.json',
        channelId,
        () => scrapeRadikoPodcast(url, scrapeLogger),
        scrapeLogger
      );
    }

    if (isRadikoTimeshiftUrl(url)) {
      const { stationId, ft } = getRadikoTimeshiftKey(url);

      return refreshCachedProgram(
        'radiko-radio.json',
        `${stationId}:${ft}`,
        () => scrapeRadikoTimeshift(url),
        logger?.child({ platform: 'radiko-radio' })
      );
    }
  }

  throw new Error('Unsupported platform');
}

async function refreshCachedProgram(
  cacheFile: string,
  cacheKey: string,
  scraper: () => Promise<any>,
  logger?: AppLogger
) {
  logger?.info('Reading cache file %s with key %s', cacheFile, cacheKey);

  const cache = await readCache(cacheFile);

  const cachedProgram = cache[cacheKey];

  if (!cachedProgram) {
    throw new Error('Program not found in cache. Import it first.');
  }

  logger?.info(
    'Scraping live metadata for "%s"',
    cachedProgram.program?.title ?? cacheKey
  );

  const liveProgram = await scraper();

  logger?.info(
    'Scrape returned %d episodes',
    liveProgram.episodes?.length ?? 0
  );

  const newEpisodes = getNewEpisodes(
    cachedProgram.episodes,
    liveProgram.episodes
  );

  cachedProgram.episodes.push(...newEpisodes);

  cachedProgram.meta.cachedAt = new Date().toISOString();

  cachedProgram.meta.episodeCount = cachedProgram.episodes.length;

  cache[cacheKey] = cachedProgram;

  await writeCache(cacheFile, cache);

  logger?.info(
    'Cache updated: +%d new episodes, %d total',
    newEpisodes.length,
    cachedProgram.episodes.length
  );

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

import { ensureNotCached, getCachedOrImport } from './importHelpers';

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

export async function importProgram(url: string, hostOverride?: string) {
  const hostname = new URL(url).hostname;

  if (hostname.includes('audee-membership.jp')) {
    const slug = getAudeeSlug(url);

    await ensureNotCached('audee-programs.json', slug);

    return getCachedOrImport(
      'audee-programs.json',
      slug,
      () => scrapeAudee(url),
      hostOverride
    );
  }

  if (hostname.includes('onsen.ag')) {
    const slug = getOnsenSlug(url);

    await ensureNotCached('onsen-programs.json', slug);

    return getCachedOrImport(
      'onsen-programs.json',
      slug,
      () => scrapeOnsen(url),
      hostOverride
    );
  }

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    const playlistId = getYoutubePlaylistId(url);

    await ensureNotCached('youtube-playlists.json', playlistId);

    return getCachedOrImport(
      'youtube-playlists.json',
      playlistId,
      () => scrapeYoutubePlaylist(url),
      hostOverride
    );
  }

  if (hostname.includes('qlover.jp')) {
    const slug = getQloverSlug(url);

    await ensureNotCached('qlover-programs.json', slug);

    return getCachedOrImport(
      'qlover-programs.json',
      slug,
      () => scrapeQlover(url),
      hostOverride
    );
  }

  if (hostname.includes('openrec.tv')) {
    const slug = getOpenrecSlug(url);

    await ensureNotCached('openrec-programs.json', slug);

    return getCachedOrImport(
      'openrec-programs.json',
      slug,
      () => scrapeOpenrec(url),
      hostOverride
    );
  }

  if (hostname.includes('nicochannel.jp')) {
    const slug = getNicochannelSlug(url);

    await ensureNotCached('nicochannel-programs.json', slug);

    return getCachedOrImport(
      'nicochannel-programs.json',
      slug,
      () => scrapeNicochannel(url),
      hostOverride
    );
  }

  if (hostname.includes('nhk.jp')) {
    const seriesId = getNHKSeriesId(url);

    await ensureNotCached('nhk-programs.json', seriesId);

    return getCachedOrImport(
      'nhk-programs.json',
      seriesId,
      () => scrapeNHK(url),
      hostOverride
    );
  }

  if (hostname.includes('www.tfm.co.jp')) {
    const slug = getTokyoFMSlug(url);

    await ensureNotCached('tfm-programs.json', slug);

    return getCachedOrImport(
      'tfm-programs.json',
      slug,
      () => scrapeTokyoFM(url),
      hostOverride
    );
  }

  if (hostname.includes('podcast.1242.com')) {
    const slug = getANNSlug(url);

    await ensureNotCached('allnightnippon-programs.json', slug);

    return getCachedOrImport(
      'allnightnippon-programs.json',
      slug,
      () => scrapeANN(url),
      hostOverride
    );
  }

  if (hostname.includes('koelink.co.jp')) {
    const slug = getKoelinkSlug(url);

    await ensureNotCached('koelink-programs.json', slug);

    return getCachedOrImport(
      'koelink-programs.json',
      slug,
      () => scrapeKoelink(url),
      hostOverride
    );
  }

  if (hostname.includes('podcasts.apple.com')) {
    const applePodcastId = getApplePodcastId(url);

    await ensureNotCached('applepodcasts-programs.json', applePodcastId);

    return getCachedOrImport(
      'applepodcasts-programs.json',
      applePodcastId,
      () => scrapeApplePodcast(url),
      hostOverride
    );
  }

  if (hostname.includes('radiko.jp')) {
    if (isRadikoPodcastUrl(url)) {
      const channelId = getRadikoPodcastChannelId(url);

      await ensureNotCached('radiko-podcasts.json', channelId);

      return getCachedOrImport(
        'radiko-podcasts.json',
        channelId,
        () => scrapeRadikoPodcast(url),
        hostOverride
      );
    }

    if (isRadikoTimeshiftUrl(url)) {
      const { stationId, ft } = getRadikoTimeshiftKey(url);

      const cacheKey = `${stationId}:${ft}`;

      await ensureNotCached('radiko-radio.json', cacheKey);

      return getCachedOrImport(
        'radiko-radio.json',
        cacheKey,
        () => scrapeRadikoTimeshift(url),
        hostOverride
      );
    }
  }

  throw new Error('Unsupported platform');
}

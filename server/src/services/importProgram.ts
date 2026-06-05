import { ensureNotCached, getCachedOrImport } from './importHelpers';

import { scrapeAudee } from './scrapeAudee';
import { scrapeOnsen } from './scrapeOnsen';
import { scrapeYoutubePlaylist } from './scrapeYoutubePlaylist';
import { scrapeQlover } from './scrapeQlover';
import { scrapeOpenrec } from './scrapeOpenrec';
import { scrapeNicochannel } from './scrapeNicochannel';
import { scrapeNHK } from './scrapeNHK';
import {
  getAudeeSlug,
  getOnsenSlug,
  getYoutubePlaylistId,
  getQloverSlug,
  getOpenrecSlug,
  getNicochannelSlug,
  getNHKSeriesId,
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

  throw new Error('Unsupported platform');
}

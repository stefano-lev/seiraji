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

import type { ProgramPreview } from '../types/media.ts';

export async function previewProgram(
  url: string,
  hostOverride?: string
): Promise<ProgramPreview> {
  const hostname = new URL(url).hostname;

  let data;

  if (hostname.includes('audee-membership.jp')) {
    data = await scrapeAudee(url);
  } else if (hostname.includes('onsen.ag')) {
    data = await scrapeOnsen(url);
  } else if (
    hostname.includes('youtube.com') ||
    hostname.includes('youtu.be')
  ) {
    data = await scrapeYoutubePlaylist(url);
  } else if (hostname.includes('qlover.jp')) {
    data = await scrapeQlover(url);
  } else if (hostname.includes('openrec.tv')) {
    data = await scrapeOpenrec(url);
  } else if (hostname.includes('nicochannel.jp')) {
    data = await scrapeNicochannel(url);
  } else if (hostname.includes('nhk.jp')) {
    data = await scrapeNHK(url);
  } else if (hostname.includes('tfm.co.jp')) {
    data = await scrapeTokyoFM(url);
  } else if (hostname.includes('podcast.1242.com')) {
    data = await scrapeANN(url);
  } else if (hostname.includes('koelink.co.jp')) {
    data = await scrapeKoelink(url);
  } else {
    throw new Error('Unsupported platform');
  }

  return {
    title: data.program.title,

    description: data.program.description,

    thumbnail: data.program.thumbnail,

    hosts: hostOverride
      ? normalizePreviewHosts(hostOverride)
      : normalizePreviewHosts(data.program.hosts),

    platform: data.platform,

    episodeCount: data.episodes.length,
  };

  function normalizePreviewHosts(value: string[] | string | null | undefined) {
    if (Array.isArray(value)) {
      return value.map((host) => host.trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((host) => host.trim())
        .filter(Boolean);
    }

    return [];
  }
}

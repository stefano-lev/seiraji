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

import type { Program, ProgramPreview } from '../types/media.ts';

import {
  isRadikoPodcastUrl,
  isRadikoTimeshiftUrl,
} from '../utils/platformKeys';

export async function previewProgram(
  url: string,
  hostOverride?: string
): Promise<ProgramPreview> {
  const data = await scrapeProgramForPreview(url);

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
}

async function scrapeProgramForPreview(url: string): Promise<Program> {
  const hostname = new URL(url).hostname;

  if (hostname.includes('audee-membership.jp')) {
    return scrapeAudee(url);
  }

  if (hostname.includes('onsen.ag')) {
    return scrapeOnsen(url);
  }

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return scrapeYoutubePlaylist(url);
  }

  if (hostname.includes('qlover.jp')) {
    return scrapeQlover(url);
  }

  if (hostname.includes('openrec.tv')) {
    return scrapeOpenrec(url);
  }

  if (hostname.includes('nicochannel.jp')) {
    return scrapeNicochannel(url);
  }

  if (hostname.includes('nhk.jp')) {
    return scrapeNHK(url);
  }

  if (hostname.includes('tfm.co.jp')) {
    return scrapeTokyoFM(url);
  }

  if (hostname.includes('podcast.1242.com')) {
    return scrapeANN(url);
  }

  if (hostname.includes('koelink.co.jp')) {
    return scrapeKoelink(url);
  }

  if (hostname.includes('podcasts.apple.com')) {
    return scrapeApplePodcast(url);
  }

  if (hostname.includes('radiko.jp')) {
    if (isRadikoPodcastUrl(url)) {
      return scrapeRadikoPodcast(url);
    }

    if (isRadikoTimeshiftUrl(url)) {
      return scrapeRadikoTimeshift(url);
    }

    throw new Error('Unsupported radiko URL pattern');
  }

  throw new Error('Unsupported platform');
}

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

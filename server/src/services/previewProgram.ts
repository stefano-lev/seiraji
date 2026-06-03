import { scrapeAudee } from './scrapeAudee';
import { scrapeOnsen } from './scrapeOnsen';
import { scrapeYoutubePlaylist } from './scrapeYoutubePlaylist';
import { scrapeQlover } from './scrapeQlover';
import { scrapeOpenrec } from './scrapeOpenrec';
import { scrapeNicochannel } from './scrapeNicochannel';

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
  } else {
    throw new Error('Unsupported platform');
  }

  return {
    title: data.program.title,

    description: data.program.description,

    thumbnail: data.program.thumbnail,

    hosts: hostOverride
      ? hostOverride
          .split(',')
          .map((host: string) => host.trim())
          .filter(Boolean)
      : (data.program.hosts ?? []),

    platform: data.platform,

    episodeCount: data.episodes.length,
  };
}

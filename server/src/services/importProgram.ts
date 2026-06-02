import { getCachedOrImport } from './importHelpers';

import { scrapeAudee } from './scrapeAudee';
import { scrapeOnsen } from './scrapeOnsen';
import { scrapeYoutubePlaylist } from './scrapeYoutubePlaylist';
import { scrapeQlover } from './scrapeQlover';
import { scrapeOpenrec } from './scrapeOpenrec';
import { scrapeNicochannel } from './scrapeNicochannel';

export async function importProgram(url: string, hostOverride?: string) {
  const hostname = new URL(url).hostname;

  if (hostname.includes('audee-membership.jp')) {
    const slug = getAudeeSlug(url);

    return getCachedOrImport(
      'audee-programs.json',
      slug,
      () => scrapeAudee(url),
      hostOverride
    );
  }

  if (hostname.includes('onsen.ag')) {
    const slug = getOnsenSlug(url);

    return getCachedOrImport(
      'onsen-programs.json',
      slug,
      () => scrapeOnsen(url),
      hostOverride
    );
  }

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    const playlistId = getYoutubePlaylistId(url);

    return getCachedOrImport(
      'youtube-playlists.json',
      playlistId,
      () => scrapeYoutubePlaylist(url),
      hostOverride
    );
  }

  if (hostname.includes('qlover.jp')) {
    const slug = getQloverSlug(url);

    return getCachedOrImport(
      'qlover-programs.json',
      slug,
      () => scrapeQlover(url),
      hostOverride
    );
  }

  if (hostname.includes('openrec.tv')) {
    const slug = getOpenrecSlug(url);

    return getCachedOrImport(
      'openrec-programs.json',
      slug,
      () => scrapeOpenrec(url),
      hostOverride
    );
  }

  if (hostname.includes('nicochannel.jp')) {
    const slug = getNicochannelSlug(url);

    return getCachedOrImport(
      'nicochannel-programs.json',
      slug,
      () => scrapeNicochannel(url),
      hostOverride
    );
  }

  throw new Error('Unsupported platform');
}

function getAudeeSlug(url: string): string {
  const slug = new URL(url).pathname.split('/').filter(Boolean)[0];

  if (!slug) {
    throw new Error('Invalid Audee URL');
  }

  return slug;
}

function getOnsenSlug(url: string): string {
  const slug = url.split('/program/')[1];

  if (!slug) {
    throw new Error('Invalid Onsen URL');
  }

  return slug;
}

function getYoutubePlaylistId(url: string): string {
  const playlistId = new URL(url).searchParams.get('list');

  if (!playlistId) {
    throw new Error('Invalid YouTube playlist URL');
  }

  return playlistId;
}

function getQloverSlug(url: string): string {
  const slug = new URL(url).pathname.split('/').filter(Boolean)[0];

  if (!slug) {
    throw new Error('Invalid Qlover URL');
  }

  return slug;
}

function getOpenrecSlug(url: string): string {
  const slug = new URL(url).pathname.split('/').filter(Boolean)[1];

  if (!slug) {
    throw new Error('Invalid OpenRec URL');
  }

  return slug;
}

function getNicochannelSlug(url: string): string {
  const slug = new URL(url).pathname.split('/').filter(Boolean)[0];

  if (!slug) {
    throw new Error('Invalid NicoChannel URL');
  }

  return slug;
}

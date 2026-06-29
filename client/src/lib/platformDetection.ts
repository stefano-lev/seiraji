import { Program } from '@/types/media';

export const SUPPORTED_PLATFORMS = [
  'audee',
  'onsen',
  'youtube',
  'qlover',
  'openrec',
  'nicochannel',
  'nhk',
  'tfm',
  'allnightnippon',
  'koelink',
  'applepodcasts',
  'radiko',
] as const;

export const PLATFORM_LABELS = {
  audee: 'AuDee',
  onsen: 'Onsen',
  youtube: 'YouTube',
  qlover: 'QloveR',
  openrec: 'OPENREC',
  nicochannel: 'NicoChannel',
  nhk: 'NHK',
  tfm: 'TokyoFM',
  allnightnippon: 'AllNightNippon',
  koelink: 'KoeLink',
  applepodcasts: 'Apple Podcasts',
  radiko: 'Radiko',
} as const;

export type SupportedPlatform =
  | 'audee'
  | 'onsen'
  | 'youtube'
  | 'qlover'
  | 'openrec'
  | 'nicochannel'
  | 'nhk'
  | 'tfm'
  | 'allnightnippon'
  | 'koelink'
  | 'applepodcasts'
  | 'radiko';

export function detectPlatform(url: string): SupportedPlatform | null {
  try {
    const hostname = new URL(url).hostname;

    if (hostname.includes('audee-membership.jp')) {
      return 'audee';
    }

    if (hostname.includes('onsen.ag')) {
      return 'onsen';
    }

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }

    if (hostname.includes('qlover.jp')) {
      return 'qlover';
    }

    if (hostname.includes('openrec.tv')) {
      return 'openrec';
    }

    if (hostname.includes('nicochannel.jp')) {
      return 'nicochannel';
    }

    if (hostname.includes('nhk.jp')) {
      return 'nhk';
    }

    if (hostname.includes('tfm.co.jp')) {
      return 'tfm';
    }

    if (hostname.includes('podcast.1242.com')) {
      return 'allnightnippon';
    }

    if (hostname.includes('koelink.co.jp')) {
      return 'koelink';
    }

    if (hostname.includes('podcasts.apple.com')) {
      return 'applepodcasts';
    }

    if (hostname.includes('radiko.jp')) {
      return 'radiko';
    }

    return null;
  } catch {
    return null;
  }
}

export function isRadikoBroadcastSnapshot(program: Program) {
  return program.platform === 'radiko-radio';
}

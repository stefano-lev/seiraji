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
  | 'allnightnippon';

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

    if (hostname.includes('tfm.jp')) {
      return 'tfm';
    }

    if (hostname.includes('podcast.1242.com')) {
      return 'allnightnippon';
    }

    return null;
  } catch {
    return null;
  }
}

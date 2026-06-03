// client/src/lib/platformDetection.ts

export const SUPPORTED_PLATFORMS = [
  'audee',
  'onsen',
  'youtube',
  'qlover',
  'openrec',
  'nicochannel',
] as const;

export const PLATFORM_LABELS = {
  audee: 'AuDee',
  onsen: 'Onsen',
  youtube: 'YouTube',
  qlover: 'QloveR',
  openrec: 'OPENREC',
  nicochannel: 'NicoChannel',
} as const;

export type SupportedPlatform =
  | 'audee'
  | 'onsen'
  | 'youtube'
  | 'qlover'
  | 'openrec'
  | 'nicochannel';

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

    return null;
  } catch {
    return null;
  }
}

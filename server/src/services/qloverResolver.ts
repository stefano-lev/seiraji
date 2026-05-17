let channelCache: Record<string, number> | null = null;

function normalizeUrl(url: string) {
  const u = new URL(url);
  const firstSegment = u.pathname.split('/').filter(Boolean)[0];
  return `${u.origin}/${firstSegment}`;
}

export async function getFanclubIdFromUrl(url: string): Promise<number | null> {
  if (!channelCache) {
    const res = await fetch(
      'https://api.qlover.jp/fc/content_providers/channels'
    );

    const json = await res.json();

    channelCache = {};

    for (const c of json.data.content_providers) {
      const domain = c.domain.replace(/\/$/, '');
      channelCache[domain] = c.fanclub_site.id;
    }
  }

  const key = normalizeUrl(url);

  return channelCache[key] ?? null;
}

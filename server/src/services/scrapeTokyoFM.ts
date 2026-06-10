import { XMLParser } from 'fast-xml-parser';
import { getTokyoFMSlug } from '../utils/platformKeys';

export async function scrapeTokyoFM(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  const html = await response.text();

  const rssUrl = getRssUrl(html);

  const rssResponse = await fetch(rssUrl);

  if (!rssResponse.ok) {
    throw new Error(`Failed to fetch RSS: ${rssUrl}`);
  }

  const xml = await rssResponse.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const parsed = parser.parse(xml);

  const channel = parsed.rss.channel;

  const slug = getTokyoFMSlug(url);

  const episodes = normalizeEpisodes(
    Array.isArray(channel.item) ? channel.item : [channel.item],
    slug
  ).reverse();

  return {
    id: `tokyofm:${slug}`,

    source: 'imported',

    platform: 'tokyofm',

    platformId: slug,

    slug,

    url,

    program: {
      title: channel.title,

      description: channel.description ?? null,

      thumbnail:
        channel.image?.url ?? channel['itunes:image']?.['@_href'] ?? null,

      hosts: [],

      schedule: null,

      categories: [],
    },

    episodes,

    meta: {
      cachedAt: new Date().toISOString(),

      episodeCount: episodes.length,
    },
  };
}

function normalizeEpisodes(items: any[], slug: string) {
  return items.map((item) => {
    const guid = getRssText(item.guid);
    const link = getRssText(item.link);
    const title = getRssText(item.title) ?? 'Untitled Episode';
    const description = getRssText(item.description);
    const pubDate = getRssText(item.pubDate);
    const audioUrl = item.enclosure?.['@_url'] ?? null;

    const stableEpisodeCode =
      guid ?? audioUrl ?? link ?? `${title}:${pubDate ?? 'unknown-date'}`;

    return {
      id: `tokyofm:${slug}:${stableEpisodeCode}`,

      title,

      description,

      publishedAt: pubDate,

      publishedAtUnix: pubDate
        ? Math.floor(new Date(pubDate).getTime() / 1000)
        : null,

      thumbnail: item['itunes:image']?.['@_href'] ?? null,

      durationSeconds: parseRssDuration(item['itunes:duration']),

      tags: [],

      platformMetadata: {
        guid,
        link,
        audioUrl,
      },
    };
  });
}

function getRssText(value: unknown): string | null {
  if (typeof value === 'string') {
    return value.trim() || null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (
    value &&
    typeof value === 'object' &&
    '#text' in value &&
    typeof (value as any)['#text'] === 'string'
  ) {
    return (value as any)['#text'].trim() || null;
  }

  return null;
}

function parseRssDuration(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const raw = value.trim();

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const parts = raw.split(':').map(Number);

  if (parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  return null;
}

function getRssUrl(html: string): string {
  const match = html.match(/const\s+rssUrl\s*=\s*['"]([^'"]+)['"]/);

  if (!match) {
    throw new Error('RSS URL not found');
  }

  return match[1];
}

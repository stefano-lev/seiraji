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
    Array.isArray(channel.item) ? channel.item : [channel.item]
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

function normalizeEpisodes(items: any[]) {
  return items.map((item) => ({
    id: item.guid,

    title: item.title,

    description: item.description ?? null,

    publishedAt: item.pubDate ?? null,

    publishedAtUnix: item.pubDate
      ? Math.floor(new Date(item.pubDate).getTime() / 1000)
      : null,

    thumbnail: item['itunes:image']?.['@_href'] ?? null,

    durationSeconds: Number(item['itunes:duration']) || null,

    tags: [],

    platformMetadata: {
      link: item.link,
      audioUrl: item.enclosure?.['@_url'],
    },
  }));
}

function getRssUrl(html: string): string {
  const match = html.match(/const\s+rssUrl\s*=\s*['"]([^'"]+)['"]/);

  if (!match) {
    throw new Error('RSS URL not found');
  }

  return match[1];
}

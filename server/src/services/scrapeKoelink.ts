import { XMLParser } from 'fast-xml-parser';

import type { Program, Episode } from '../types/media';

import { getKoelinkSlug } from '../utils/platformKeys';

export async function scrapeKoelink(url: string): Promise<Program> {
  const slug = getKoelinkSlug(url);

  const rssUrl = `https://rss.koelink.co.jp/${slug}.xml`;

  const [rssRes, programThumbnail] = await Promise.all([
    fetch(rssUrl, {
      headers: {
        accept: 'application/rss+xml, application/xml, text/xml',
      },
    }),

    getKoelinkProgramThumbnail(slug),
  ]);

  if (!rssRes.ok) {
    throw new Error(`Failed to fetch Koelink RSS: ${rssUrl}`);
  }

  const xml = await rssRes.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const parsed = parser.parse(xml);

  const channel = parsed?.rss?.channel;

  if (!channel) {
    throw new Error('Invalid Koelink RSS response');
  }

  const items = Array.isArray(channel.item)
    ? channel.item
    : channel.item
      ? [channel.item]
      : [];

  const title = getRssText(channel.title) ?? slug;

  const episodes = normalizeKoelinkEpisodes(items, slug, programThumbnail);

  return {
    id: `koelink:${slug}`,

    source: 'imported',

    platform: 'koelink',

    platformId: slug,

    slug,

    url,

    program: {
      title,

      description: stripHtml(getRssText(channel.description)) ?? null,

      thumbnail: programThumbnail,

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

function normalizeKoelinkEpisodes(
  items: any[],
  slug: string,
  programThumbnail: string | null
): Episode[] {
  return items
    .map((item) => {
      const guid = getRssText(item.guid);
      const link = getRssText(item.link);
      const title = getRssText(item.title) ?? 'Untitled Episode';
      const description = stripHtml(getRssText(item.description));
      const pubDate = getRssText(item.pubDate);

      const stableEpisodeCode =
        guid ?? link ?? `${title}:${pubDate ?? 'unknown-date'}`;

      const durationSeconds = parseRssDuration(item['itunes:duration']);

      return {
        id: `koelink:${slug}:${stableEpisodeCode}`,

        title,

        description,

        publishedAt: pubDate,

        publishedAtUnix: pubDate
          ? Math.floor(new Date(pubDate).getTime() / 1000)
          : null,

        thumbnail: programThumbnail,

        durationSeconds,

        tags: normalizeCategories(item.categories),

        platformMetadata: {
          guid,

          link,

          audioUrl: item.enclosure?.['@_url'] ?? null,

          enclosureType: item.enclosure?.['@_type'] ?? null,

          enclosureLength: item.enclosure?.['@_length'] ?? null,

          rawDuration: getRssText(item['itunes:duration']),
        },
      };
    })
    .sort((a, b) => {
      const aTime = a.publishedAtUnix ?? 0;
      const bTime = b.publishedAtUnix ?? 0;

      return aTime - bTime;
    });
}

function getRssText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;

  if (typeof value === 'number') return String(value);

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
  const text = getRssText(value);

  if (!text) return null;

  if (/^\d+$/.test(text)) {
    return Number(text);
  }

  const parts = text.split(':').map(Number);

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

function normalizeCategories(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map(getRssText)
      .filter((item): item is string => Boolean(item));
  }

  const single = getRssText(value);

  return single ? [single] : [];
}

function stripHtml(value: string | null): string | null {
  if (!value) return null;

  const stripped = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return stripped || null;
}

async function getKoelinkProgramThumbnail(
  slug: string
): Promise<string | null> {
  const docUrl = `https://firestore.googleapis.com/v1/projects/koelink-7e2e9/databases/(default)/documents/programs/${slug}`;

  const res = await fetch(docUrl, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    return null;
  }

  const json = await res.json();

  const imgL = json?.fields?.imgL?.stringValue;

  if (typeof imgL !== 'string' || !imgL) {
    return null;
  }

  return `https://koelink.co.jp/img/${imgL}`;
}

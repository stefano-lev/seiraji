import { XMLParser } from 'fast-xml-parser';

import type { Program, Episode } from '../types/media';

import { getApplePodcastId } from '../utils/platformKeys';

type ApplePodcastLookupResult = {
  resultCount: number;
  results: Array<{
    collectionId?: number;
    collectionName?: string;
    artistName?: string;
    artworkUrl100?: string;
    artworkUrl600?: string;
    feedUrl?: string;
    collectionViewUrl?: string;
    primaryGenreName?: string;
    genres?: string[];
    trackCount?: number;
  }>;
};

export async function scrapeApplePodcast(url: string): Promise<Program> {
  const applePodcastId = getApplePodcastId(url);

  const lookup = await lookupApplePodcast(applePodcastId);

  const feedUrl = lookup.feedUrl;

  if (!feedUrl) {
    throw new Error('Apple Podcasts lookup did not return an RSS feed URL');
  }

  const rssRes = await fetch(feedUrl, {
    headers: {
      accept: 'application/rss+xml, application/xml, text/xml',
    },
  });

  if (!rssRes.ok) {
    throw new Error(`Failed to fetch Apple Podcasts RSS feed: ${feedUrl}`);
  }

  const xml = await rssRes.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const parsed = parser.parse(xml);

  const channel = parsed?.rss?.channel;

  if (!channel) {
    throw new Error('Invalid Apple Podcasts RSS response');
  }

  const items = Array.isArray(channel.item)
    ? channel.item
    : channel.item
      ? [channel.item]
      : [];

  const title =
    getRssText(channel.title) ??
    lookup.collectionName ??
    `Apple Podcast ${applePodcastId}`;

  const thumbnail =
    channel['itunes:image']?.['@_href'] ??
    channel.image?.url ??
    lookup.artworkUrl600 ??
    lookup.artworkUrl100 ??
    null;

  const episodes = normalizeApplePodcastEpisodes(
    items,
    applePodcastId,
    thumbnail
  );

  return {
    id: `applepodcasts:${applePodcastId}`,

    source: 'imported',

    platform: 'applepodcasts',

    platformId: applePodcastId,

    slug: applePodcastId,

    url,

    program: {
      title,

      description:
        stripHtml(
          getRssText(channel.description) ??
            getRssText(channel['itunes:summary'])
        ) ?? null,

      thumbnail,

      hosts: normalizeHostsFromApple(
        getRssText(channel['itunes:author']) ?? lookup.artistName
      ),

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

async function lookupApplePodcast(
  applePodcastId: string
): Promise<NonNullable<ApplePodcastLookupResult['results'][number]>> {
  const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(
    applePodcastId
  )}&entity=podcast&media=podcast`;

  const res = await fetch(lookupUrl, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Apple Podcasts lookup failed: ${res.status}`);
  }

  const json = (await res.json()) as ApplePodcastLookupResult;

  const result = json.results?.[0];

  if (!result) {
    throw new Error('Apple Podcasts lookup returned no results');
  }

  return result;
}

function normalizeApplePodcastEpisodes(
  items: any[],
  applePodcastId: string,
  fallbackThumbnail: string | null
): Episode[] {
  return items
    .map((item) => {
      const guid = getRssText(item.guid);
      const link = getRssText(item.link);
      const title = getRssText(item.title) ?? 'Untitled Episode';
      const description =
        stripHtml(
          getRssText(item.description) ??
            getRssText(item['itunes:summary']) ??
            getRssText(item['content:encoded'])
        ) ?? null;

      const pubDate = getRssText(item.pubDate);

      const stableEpisodeCode =
        guid ?? link ?? `${title}:${pubDate ?? 'unknown-date'}`;

      const thumbnail =
        item['itunes:image']?.['@_href'] ??
        item.image?.url ??
        fallbackThumbnail;

      const durationSeconds = parseRssDuration(item['itunes:duration']);

      return {
        id: `applepodcasts:${applePodcastId}:${stableEpisodeCode}`,

        title,

        description,

        publishedAt: pubDate,

        publishedAtUnix: pubDate
          ? Math.floor(new Date(pubDate).getTime() / 1000)
          : null,

        thumbnail,

        durationSeconds,

        tags: normalizeCategories(item.categories),

        platformMetadata: {
          guid,

          link,

          audioUrl: item.enclosure?.['@_url'] ?? null,

          enclosureType: item.enclosure?.['@_type'] ?? null,

          enclosureLength: item.enclosure?.['@_length'] ?? null,

          rawDuration: getRssText(item['itunes:duration']),

          itunesEpisode: getRssText(item['itunes:episode']),
          itunesSeason: getRssText(item['itunes:season']),
          itunesEpisodeType: getRssText(item['itunes:episodeType']),
          itunesExplicit: getRssText(item['itunes:explicit']),
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

function normalizeHostsFromApple(value: string | null | undefined): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
}

function stripHtml(value: string | null): string | null {
  if (!value) return null;

  const stripped = value
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
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

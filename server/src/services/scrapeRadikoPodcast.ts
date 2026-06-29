import * as cheerio from 'cheerio';

import type { Program, Episode } from '../types/media';

import { getRadikoPodcastChannelId } from '../utils/platformKeys';

export async function scrapeRadikoPodcast(url: string): Promise<Program> {
  const channelId = getRadikoPodcastChannelId(url);

  const html = await fetchHtml(url);
  const nextData = extractNextData(html);

  const channel = nextData?.props?.pageProps?.podcastChannel;

  if (!channel) {
    throw new Error('Radiko podcast channel data not found');
  }

  const title = cleanText(channel.title) || `radiko podcast ${channelId}`;

  const description = stripHtml(channel.description);

  const thumbnail =
    normalizeImageUrl(channel.largeThumbnailImageUrl) ??
    normalizeImageUrl(channel.imageUrl) ??
    normalizeImageUrl(channel.thumbnailImageUrl);

  const host =
    cleanText(channel.author) || cleanText(channel.stationName) || null;

  const rawEpisodes = findEmbeddedEpisodes(nextData, channelId);

  const episodes = rawEpisodes
    .map((rawEpisode) =>
      normalizeRadikoPodcastEpisode(rawEpisode, channelId, thumbnail)
    )
    .sort((a, b) => (a.publishedAtUnix ?? 0) - (b.publishedAtUnix ?? 0));

  const expectedEpisodeCount =
    typeof channel.episodeCount === 'number' ? channel.episodeCount : null;

  if (expectedEpisodeCount && episodes.length < expectedEpisodeCount) {
    console.warn(
      `[RADIKO PODCAST] Imported ${episodes.length}/${expectedEpisodeCount} visible episodes for ${title}.`
    );
  }

  return {
    id: `radiko-podcast:${channelId}`,

    source: 'imported',

    platform: 'radiko-podcast',

    platformId: channelId,

    slug: channelId,

    url,

    program: {
      title,

      description,

      thumbnail,

      hosts: host ? [host] : [],

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

function normalizeRadikoPodcastEpisode(
  rawEpisode: any,
  channelId: string,
  fallbackThumbnail: string | null
): Episode {
  const episodeId = cleanText(rawEpisode?.id);

  if (!episodeId) {
    throw new Error('Radiko podcast episode is missing an ID');
  }

  const title = cleanText(rawEpisode?.title) || 'Untitled Episode';

  const description = stripHtml(rawEpisode?.description);

  const publishedAtUnix =
    typeof rawEpisode?.startAt?.seconds === 'number'
      ? rawEpisode.startAt.seconds
      : null;

  const publishedAt = publishedAtUnix
    ? new Date(publishedAtUnix * 1000).toISOString()
    : null;

  const thumbnail =
    normalizeImageUrl(rawEpisode?.imageUrl) ??
    normalizeImageUrl(rawEpisode?.thumbnailImageUrl) ??
    fallbackThumbnail;

  return {
    id: `radiko-podcast:${channelId}:${episodeId}`,

    title,

    description,

    publishedAt,

    publishedAtUnix,

    thumbnail,

    durationSeconds:
      typeof rawEpisode?.audio?.durationSec === 'number'
        ? rawEpisode.audio.durationSec
        : null,

    tags: [],

    platformMetadata: {
      episodeId,

      episodeUrl: `https://radiko.jp/podcast/episodes/${episodeId}?play=auto`,
    },
  };
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch radiko podcast page: ${url}`);
  }

  return res.text();
}

function extractNextData(html: string): any | null {
  const $ = cheerio.load(html);

  const raw = $('#__NEXT_DATA__').text();

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function findEmbeddedEpisodes(value: unknown, channelId: string): any[] {
  const episodes: any[] = [];
  const seen = new Set<string>();

  walkJson(value, (obj) => {
    if (!isEmbeddedEpisode(obj, channelId)) return;

    const id = cleanText(obj.id);

    if (!id || seen.has(id)) return;

    seen.add(id);
    episodes.push(obj);
  });

  return episodes;
}

function isEmbeddedEpisode(obj: Record<string, any>, channelId: string) {
  return (
    typeof obj.id === 'string' &&
    obj.channelId === channelId &&
    typeof obj.title === 'string' &&
    (typeof obj.description === 'string' ||
      typeof obj.audio?.durationSec === 'number')
  );
}

function walkJson(
  value: unknown,
  visit: (obj: Record<string, any>) => void
): void {
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) {
      walkJson(item, visit);
    }

    return;
  }

  const obj = value as Record<string, any>;

  visit(obj);

  for (const child of Object.values(obj)) {
    walkJson(child, visit);
  }
}

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname === 'radiko.jp' && parsed.pathname === '/api/ogp') {
      const imageUrl = parsed.searchParams.get('imageUrl');

      return imageUrl ? normalizeImageUrl(imageUrl) : null;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';

  return value
    .replace(/\.css-[a-z0-9-]+\{[^}]*\}/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const stripped = value
    .replace(/\.css-[a-z0-9-]+\{[^}]*\}/gi, ' ')
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
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return stripped || null;
}

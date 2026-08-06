import * as cheerio from 'cheerio';

import type { Program, Episode } from '../types/media';

import { getRadikoPodcastChannelId } from '../utils/platformKeys';
import { type AppLogger } from '../utils/logger';

export async function scrapeRadikoPodcast(
  url: string,
  logger?: AppLogger
): Promise<Program> {
  const channelId = getRadikoPodcastChannelId(url);

  const html = await fetchHtml(url);

  logger?.debug('Fetched Radiko podcast HTML: %d characters', html.length);

  return scrapeRadikoPodcastFromHtml(url, channelId, html, logger);
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch radiko podcast page: ${url}`);
  }

  return res.text();
}

function scrapeRadikoPodcastFromHtml(
  url: string,
  channelId: string,
  html: string,
  logger?: AppLogger
): Program {
  const $ = cheerio.load(html);

  const title =
    cleanText($('h1').first().text()) ||
    cleanText($('meta[property="og:title"]').attr('content')) ||
    cleanText($('title').text()) ||
    `radiko podcast ${channelId}`;

  const description =
    stripHtml($('meta[name="description"]').attr('content')) ??
    stripHtml($('meta[property="og:description"]').attr('content')) ??
    null;

  const thumbnail =
    normalizeImageUrl($('meta[property="og:image"]').attr('content')) ??
    normalizeImageUrl($('meta[name="twitter:image"]').attr('content'));

  const station = findLikelyStationName($, title);

  const episodes = findRenderedEpisodes($, channelId, thumbnail);

  logger?.info(
    'Parsed Radiko podcast from rendered HTML: "%s" with %d visible episodes',
    title,
    episodes.length
  );

  if (episodes.length === 0) {
    logger?.warn(
      'Rendered HTML parse found no episode links for Radiko channel %s',
      channelId
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

      hosts: station ? [station] : [],

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

function findRenderedEpisodes(
  $: cheerio.CheerioAPI,
  channelId: string,
  fallbackThumbnail: string | null
): Episode[] {
  const episodes = new Map<string, Episode>();

  $('a[href*="/podcast/episodes/"]').each((_, element) => {
    const link = $(element);
    const href = link.attr('href');

    if (!href) return;

    const episodeId = extractRadikoEpisodeId(href);

    if (!episodeId || episodes.has(episodeId)) return;

    const card = findEpisodeContainer($, link);
    const cardText = cleanText(card.text());
    const linkText = cleanText(link.text());

    const title =
      linkText ||
      cleanText(card.find('h2,h3,h4').first().text()) ||
      `Radiko episode ${episodeId}`;

    const description = compactEpisodeDescription(cardText, title);

    episodes.set(episodeId, {
      id: `radiko-podcast:${channelId}:${episodeId}`,

      title,

      description,

      publishedAt: null,

      publishedAtUnix: null,

      thumbnail:
        normalizeImageUrl(card.find('img').first().attr('src')) ??
        fallbackThumbnail,

      durationSeconds: parseJapaneseDuration(cardText),

      tags: [],

      platformMetadata: {
        episodeId,
        episodeUrl: `https://radiko.jp/podcast/episodes/${episodeId}?play=auto`,
        source: 'html',
      },
    });
  });

  return [...episodes.values()];
}

function extractRadikoEpisodeId(href: string): string | null {
  const match = href.match(/\/podcast\/episodes\/([^/?#]+)/);

  return match?.[1] ?? null;
}

function findEpisodeContainer(
  $: cheerio.CheerioAPI,
  link: cheerio.Cheerio<any>
) {
  const candidates = link.parents().toArray();

  for (const candidate of candidates) {
    const node = $(candidate);
    const text = cleanText(node.text());

    if (text.length > 40 && text.length < 5000) {
      return node;
    }
  }

  return link.parent();
}

function compactEpisodeDescription(text: string, title: string): string | null {
  const cleaned = text.replace(title, '').replace(/\s+/g, ' ').trim();

  if (!cleaned) return null;

  return cleaned.length > 800 ? `${cleaned.slice(0, 800).trim()}...` : cleaned;
}

function parseJapaneseDuration(text: string): number | null {
  const hourMinuteMatch = text.match(/(\d+)\s*時間\s*(\d+)\s*分/);

  if (hourMinuteMatch) {
    return Number(hourMinuteMatch[1]) * 3600 + Number(hourMinuteMatch[2]) * 60;
  }

  const minuteMatch = text.match(/(\d+)\s*分/);

  if (minuteMatch) {
    return Number(minuteMatch[1]) * 60;
  }

  return null;
}

function findLikelyStationName(
  $: cheerio.CheerioAPI,
  programTitle: string
): string | null {
  const bodyText = cleanText($('body').text());

  if (!bodyText) return null;

  const titleIndex = bodyText.indexOf(programTitle);

  if (titleIndex < 0) return null;

  const afterTitle = bodyText
    .slice(titleIndex + programTitle.length)
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const ignored = new Set([
    '詳細情報を見る',
    'シェア',
    'エピソード',
    'ホーム',
    'プラン変更',
  ]);

  return afterTitle.find((part) => !ignored.has(part)) ?? null;
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

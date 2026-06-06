import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { getANNSlug } from '../utils/platformKeys';

export async function scrapeANN(url: string) {
  const slug = getANNSlug(url);

  const html = await fetchHtml(url);

  const rssUrl = extractRssUrl(html);

  const rssXml = await fetchText(rssUrl);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  const rss = parser.parse(rssXml);

  const channel = rss.rss.channel;

  const episodes = normalizeEpisodes(channel.item ?? []);

  return {
    id: `allnightnippon:${slug}`,

    source: 'imported',

    platform: 'allnightnippon',

    platformId: slug,

    slug,

    url,

    program: {
      title: channel.title ?? '',

      description: channel['itunes:summary'] ?? channel.description ?? null,

      thumbnail: channel['itunes:image']?.href ?? channel.image?.url ?? null,

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
  return items
    .map((episode) => {
      const publishedAt = episode.pubDate
        ? new Date(episode.pubDate).toISOString()
        : null;

      return {
        id: episode['omny:clipId'] ?? episode.guid ?? episode.link,

        title: episode['itunes:title'] ?? episode.title ?? 'Untitled Episode',

        description:
          htmlToText(episode.description) ??
          htmlToText(episode['content:encoded']) ??
          null,

        publishedAt,

        publishedAtUnix: publishedAt
          ? Math.floor(new Date(publishedAt).getTime() / 1000)
          : null,

        thumbnail: episode['itunes:image']?.href ?? null,

        durationSeconds: Number(episode['itunes:duration']) || null,

        tags: [],

        platformMetadata: {
          audioUrl: episode.enclosure?.url ?? null,

          episodeLink: episode.link ?? null,

          omnyClipId: episode['omny:clipId'] ?? null,
        },
      };
    })
    .sort((a, b) => {
      return (a.publishedAtUnix ?? 0) - (b.publishedAtUnix ?? 0);
    });
}

function extractRssUrl(html: string) {
  const match = html.match(/"rssfeed":"([^"]+)"/);

  if (!match) {
    throw new Error('Unable to locate RSS feed URL');
  }

  return match[1].replace('\\/', '/');
}

async function fetchHtml(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.text();
}

async function fetchText(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.text();
}

function htmlToText(html: string | null | undefined): string | null {
  if (!html) {
    return null;
  }

  const normalized = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n');

  const $ = cheerio.load(normalized);

  return $.text()
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

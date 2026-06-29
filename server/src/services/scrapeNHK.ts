import * as cheerio from 'cheerio';
import type { Program, Episode } from '../types/media';
import { normalizeHosts } from '../utils/normalizeHosts';
import { getNHKSeriesId } from '../utils/platformKeys';

export async function scrapeNHK(url: string): Promise<Program> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch NHK page: ${url}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  const schema = getJsonLd($);

  const seriesId = getNHKSeriesId(url);

  const apiEpisodes = await fetchAllEpisodes(seriesId);

  const slug =
    apiEpisodes[0]?.partOfSeries?.identifierGroup?.aliasId ?? seriesId;

  const episodes = normalizeEpisodes(apiEpisodes, slug);

  const title = schema.name;

  const description = schema.description ?? null;

  const thumbnail = schema.image?.contentUrl ?? null;

  const rawHosts =
    schema.actor?.map((role: any) => role.actor?.name).filter(Boolean) ?? [];

  const hosts = normalizeHosts(rawHosts);

  const liveperiod = $('.live-period-mb').text().trim() || null;

  return {
    id: `nhk:${slug}`,

    source: 'imported',

    platform: 'nhk',

    platformId: slug,

    slug,

    url,

    program: {
      title,

      description,

      thumbnail,

      hosts,

      schedule: liveperiod,

      categories: [],
    },

    episodes,

    meta: {
      cachedAt: new Date().toISOString(),

      episodeCount: episodes.length,
    },
  };
}

function normalizeEpisodes(apiEpisodes: any[], slug: string) {
  return apiEpisodes
    .map((episode) => {
      const startDate =
        episode.releasedEvent?.startDate ??
        episode.detailedRecentEvent?.startDate ??
        null;

      const endDate =
        episode.releasedEvent?.endDate ??
        episode.detailedRecentEvent?.endDate ??
        null;

      let durationSeconds: number | null = null;

      if (startDate && endDate) {
        durationSeconds = Math.floor(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / 1000
        );
      }

      const guests =
        episode.detailedRecentEvent?.misc?.actList
          ?.filter((person: any) => person.role === 'ゲスト')
          ?.map((person: any) => person.name) ?? [];

      const tags: string[] = [];

      if (guests.length) {
        tags.push('GUEST');
      }

      return {
        id: episode.id ?? `${slug}-${episode.name}`,

        title: episode.name ?? 'Untitled Episode',

        description: episode.description ?? null,

        publishedAt: startDate,

        publishedAtUnix: startDate
          ? Math.floor(new Date(startDate).getTime() / 1000)
          : null,

        thumbnail: episode.partOfSeries?.eyecatch?.main?.url ?? null,

        durationSeconds,

        tags,

        platformMetadata: {
          canonical: episode.canonical,

          radioEpisodeId: episode.identifierGroup?.radioEpisodeId,

          radioSeriesId: episode.identifierGroup?.radioSeriesId,

          guests,

          expires: episode.audio?.[0]?.expires ?? null,

          audioStatus:
            episode.audio?.[0]?.detailedContentStatus?.contentStatus ?? null,
        },
      };
    })
    .sort((a, b) => {
      const aTime = a.publishedAtUnix ?? 0;

      const bTime = b.publishedAtUnix ?? 0;

      return aTime - bTime;
    });
}

function getJsonLd($: cheerio.CheerioAPI) {
  const scripts = $('script[type="application/ld+json"]');

  for (const element of scripts.toArray()) {
    const raw = $(element).html();

    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      if (parsed['@type'] === 'RadioSeries') {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  throw new Error('RadioSeries JSON-LD not found');
}

async function fetchAllEpisodes(seriesId: string) {
  let url = `https://api.nhk.jp/r8/l/radioepisode/pl/series-rep-${seriesId}.json`;

  const episodes: any[] = [];

  const visited = new Set<string>();

  while (url) {
    if (visited.has(url)) {
      throw new Error(`Pagination loop detected: ${url}`);
    }

    visited.add(url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch NHK API page: ${url}`);
    }

    const page = await response.json();

    episodes.push(...(page.result ?? []));

    url = page.nextUrl ?? null;
  }

  return episodes;
}

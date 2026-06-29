import { XMLParser } from 'fast-xml-parser';

import type { Program } from '../types/media';

import { getRadikoTimeshiftKey } from '../utils/platformKeys';

export async function scrapeRadikoTimeshift(url: string): Promise<Program> {
  const { stationId, ft } = getRadikoTimeshiftKey(url);

  const { matched, scheduleDate } = await findMatchingRadikoProgram(
    stationId,
    ft
  );

  if (!matched) {
    throw new Error(
      `Could not find matching radiko broadcast in schedule for ${stationId} at ${ft}`
    );
  }

  console.log(
    `[RADIKO] Matched ${stationId} ${ft} using schedule date ${scheduleDate}`
  );

  const matchedFt = getAttr(matched, 'ft') ?? ft;
  const matchedTo = getAttr(matched, 'to') ?? matchedFt;

  const title = getText(matched.title) ?? 'Untitled radiko broadcast';

  const description =
    stripHtml(getText(matched.desc) ?? getText(matched.info)) ?? null;

  const hosts = splitHosts(getText(matched.pfm));

  const image = getText(matched.img);

  const externalUrl = getText(matched.url);

  const publishedAt = parseRadikoTimestamp(matchedFt);

  return {
    id: `radiko-radio:${stationId}:${matchedFt}`,

    source: 'imported',

    platform: 'radiko-radio',

    platformId: `${stationId}:${matchedFt}`,

    slug: `${stationId}-${matchedFt}`,

    url,

    program: {
      title,

      description,

      thumbnail: image,

      hosts,

      schedule: `${formatRadikoTime(matchedFt)} - ${formatRadikoTime(matchedTo)}`,

      categories: [],
    },

    episodes: [
      {
        id: `radiko-radio:${stationId}:${matchedFt}`,

        title,

        description,

        publishedAt,

        publishedAtUnix: Math.floor(new Date(publishedAt).getTime() / 1000),

        thumbnail: image,

        durationSeconds: calculateRadikoDuration(matchedFt, matchedTo),

        tags: [stationId],

        platformMetadata: {
          stationId,
          ft: matchedFt,
          to: matchedTo,
          externalUrl,
          radikoUrl: url,
        },
      },
    ],

    meta: {
      cachedAt: new Date().toISOString(),

      episodeCount: 1,
    },
  };
}

function normalizeArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];

  return Array.isArray(value) ? value : [value];
}

function getAttr(value: any, key: string): string | null {
  const attr = value?.[`@_${key}`];

  return typeof attr === 'string' ? attr : null;
}

function getText(value: unknown): string | null {
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

function splitHosts(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(/[,、／/]/)
    .map((host) => host.trim())
    .filter(Boolean);
}

function parseRadikoTimestamp(value: string): string {
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(8, 10);
  const minute = value.slice(10, 12);
  const second = value.slice(12, 14);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`;
}

function formatRadikoTime(value: string): string {
  return `${value.slice(8, 10)}:${value.slice(10, 12)}`;
}

function calculateRadikoDuration(ft: string, to: string): number {
  const start = new Date(parseRadikoTimestamp(ft)).getTime();
  const end = new Date(parseRadikoTimestamp(to)).getTime();

  return Math.max(0, Math.round((end - start) / 1000));
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

async function findMatchingRadikoProgram(stationId: string, ft: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  for (const scheduleDate of getCandidateScheduleDates(ft)) {
    const scheduleUrl = `https://radiko.jp/v3/program/station/date/${scheduleDate}/${stationId}.xml`;

    const res = await fetch(scheduleUrl, {
      headers: {
        accept: 'application/xml,text/xml',
      },
    });

    if (!res.ok) {
      console.warn(`[RADIKO] Failed schedule fetch: ${scheduleUrl}`);
      continue;
    }

    const xml = await res.text();
    const parsed = parser.parse(xml);

    const programs = normalizeArray(
      parsed?.radiko?.stations?.station?.progs?.prog
    );

    const matched = programs.find((program) => {
      const programFt = getAttr(program, 'ft');
      const programTo = getAttr(program, 'to');

      if (!programFt || !programTo) return false;

      return programFt <= ft && ft < programTo;
    });

    if (matched) {
      return {
        matched,
        scheduleDate,
      };
    }
  }

  return {
    matched: null,
    scheduleDate: null,
  };
}

function getCandidateScheduleDates(ft: string): string[] {
  const actualDate = ft.slice(0, 8);
  const previousDate = getPreviousDateString(actualDate);

  return [...new Set([actualDate, previousDate])];
}

function getPreviousDateString(date: string): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));

  const parsed = new Date(Date.UTC(year, month - 1, day));
  parsed.setUTCDate(parsed.getUTCDate() - 1);

  const yyyy = parsed.getUTCFullYear();
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getUTCDate()).padStart(2, '0');

  return `${yyyy}${mm}${dd}`;
}

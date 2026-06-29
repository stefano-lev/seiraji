import type { Program, Episode } from '../types/media';
import { normalizeDate } from '../utils/normalizeDate';
import { normalizeEpisodes } from '../utils/normalizeEpisodes';
import { extractHostNames } from '../utils/extractHostNames';

export async function scrapeQlover(url: string): Promise<Program> {
  const fanclubId = await getFanclubIdFromUrl(url);

  if (!fanclubId) {
    throw new Error('Could not resolve fanclub ID');
  }

  const slug = new URL(url).pathname.split('/').filter(Boolean)[0];

  const [baseRes, episodes] = await Promise.all([
    fetch(`https://api.qlover.jp/fc/fanclub_sites/${fanclubId}/page_base_info`),

    fetchQloverEpisodes(fanclubId),
  ]);

  const baseJson = await baseRes.json();

  const site = baseJson.data.fanclub_site;

  const hosts = extractHostNames(site.current_fanclub_design?.fanclub_menus);

  const filteredEpisodes = episodes.filter(
    (ep) => !ep.title.includes('おまけ')
  );

  return {
    id: `qlover:${slug}`,

    source: 'imported',

    platform: 'qlover',

    platformId: fanclubId,

    slug,

    url,

    episodesUrl: `${url.replace(/\/$/, '')}/videos`,

    program: {
      title: site.fanclub_site_name,

      description: site.description,

      hosts,

      categories: site.site_hashtags?.[0]?.hashtag_name ?? '',

      twitter: site.fanclub_footer_snses?.[0]?.sns_page_url ?? null,

      thumbnail: site.thumbnail_image_url ?? null,
    },

    episodes: normalizeEpisodes(
      filteredEpisodes.map((ep) => {
        const normalizedDate = normalizeDate(ep.display_date);

        return {
          id: `qlover:${ep.content_code}`,

          title: ep.title,

          publishedAt: normalizedDate.iso,

          publishedAtUnix: normalizedDate.unix,

          thumbnail: ep.thumbnail_url,

          durationSeconds: ep.active_video_filename?.length ?? null,

          platformMetadata: {
            mediaType: ep.video_media_type?.status ?? null,

            views: ep.video_aggregate_info?.total_views ?? null,
          },
        };
      })
    ),

    meta: {
      cachedAt: new Date().toISOString(),

      episodeCount: filteredEpisodes.length,
    },

    // raw: {
    //   site: baseJson,
    // },
  };
}

async function fetchQloverEpisodes(fanclubId: number) {
  const episodes: any[] = [];
  let page = 1;

  while (true) {
    const url = `https://api.qlover.jp/fc/v2/fanclub_sites/${fanclubId}/video_pages?sort=-display_date&vod_type=0&per_page=12&page=${page}`;

    console.log('FETCHING:', url);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',

        Accept: 'application/json, text/plain, */*',

        Origin: 'https://qlover.jp/',

        Referer: 'https://qlover.jp/',

        fc_site_id: String(fanclubId),

        fc_use_device: 'null',
      },
    });

    console.log('STATUS:', res.status);

    const json = await res.json();

    const list = json?.data?.video_pages?.list ?? [];

    if (list.length === 0) {
      break;
    }

    episodes.push(...list);

    page++;
  }

  return episodes;
}

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

import { getFanclubIdFromUrl } from './qloverResolver';

import { fetchQloverEpisodes } from './qloverEpisodes';

import { normalizeAudeeDate } from '../utils/date';

import { normalizeEpisodes } from '../utils/normalizeEpisodes';

import { extractHostNames } from '../utils/extractHostNames';

export async function scrapeQlover(url: string) {
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

      category: site.site_hashtags?.[0]?.hashtag_name ?? '',

      twitter: site.fanclub_footer_snses?.[0]?.sns_page_url ?? null,

      thumbnail: site.thumbnail_image_url ?? null,
    },

    episodes: normalizeEpisodes(
      filteredEpisodes.map((ep) => {
        const normalizedDate = normalizeAudeeDate(ep.display_date);

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

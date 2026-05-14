import { getFanclubIdFromUrl } from "./audeeResolver";

import { fetchAudeeEpisodes }
  from "./audeeEpisodes";

import { normalizeAudeeDate }
  from "../utils/date";

export async function scrapeAudee(
  url: string
) {
  const fanclubId =
    await getFanclubIdFromUrl(url);

  if (!fanclubId) {
    throw new Error(
      "Could not resolve fanclub ID"
    );
  }

  const slug =
    new URL(url)
      .pathname
      .split("/")
      .filter(Boolean)[0];

  const [baseRes, episodes] =
    await Promise.all([
      fetch(
        `https://api.audee-membership.jp/fc/fanclub_sites/${fanclubId}/page_base_info`
      ),

      fetchAudeeEpisodes(fanclubId),
    ]);

  const baseJson = await baseRes.json();

  const site =
    baseJson.data.fanclub_site;

  return {
    platform: "audee",

    platformId: fanclubId,

    slug,

    url,

    episodesUrl:
      `${url.replace(/\/$/, "")}/videos`,

    program: {
      title:
        site.fanclub_site_name,

      description:
        site.description,

      category:
        site.site_hashtags?.[0]
          ?.hashtag_name ?? "",

      twitter:
        site.fanclub_footer_snses?.[0]
          ?.sns_page_url ?? null,

      thumbnail:
        site.thumbnail_image_url
          ?? null,
    },

    episodes: episodes.map((ep) => {
      const normalizedDate =
        normalizeAudeeDate(
          ep.display_date
        );

      return {
        id:
          ep.content_code,

        title:
          ep.title,

        publishedAt:
          normalizedDate.iso,

        publishedAtUnix:
          normalizedDate.unix,

        thumbnail:
          ep.thumbnail_url,

        durationSeconds:
          ep.active_video_filename
            ?.length ?? null,

        platformMetadata: {
          mediaType:
            ep.video_media_type
              ?.status ?? null,

          views:
            ep.video_aggregate_info
              ?.total_views ?? null,
        },
      };
    }),

    meta: {
      cachedAt:
        new Date().toISOString(),

      episodeCount:
        episodes.length,
    },

    raw: {
      site: baseJson,
    },
  };
}
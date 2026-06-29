import type { Program, Episode } from '../types/media';
import { normalizeEpisodes } from '../utils/normalizeEpisodes';

export async function scrapeOpenrec(url: string): Promise<Program> {
  const slug = new URL(url).pathname.split('/').filter(Boolean)[1];

  const [baseRes, episodes] = await Promise.all([
    fetch(`https://public.openrec.tv/external/api/v5/channels/${slug}`),

    fetchOpenrecEpisodes(slug),
  ]);

  const site = await baseRes.json();

  const hosts = extractOpenrecHostName(site.nickname);

  if (hosts.length === 0) {
    console.warn(`Could not determine host for ${slug}`);
  }

  return {
    id: `openrec:${slug}`,

    source: 'imported',

    platform: 'openrec',

    platformId: site.openrec_user_id,

    slug,

    url,

    episodesUrl: url,

    program: {
      title: site.nickname,

      description: site.introduction,

      hosts,

      thumbnail: site.l_cover_image_url ?? site.icon_image_url ?? null,
    },

    episodes: normalizeEpisodes(
      episodes.map((ep) => ({
        id: `openrec:${ep.id}`,

        title: ep.title,

        description: ep.introduction,

        publishedAt: ep.published_at,

        publishedAtUnix: ep.published_at
          ? Math.floor(Date.parse(ep.published_at) / 1000)
          : null,

        thumbnail: ep.l_thumbnail_url ?? ep.thumbnail_url ?? null,

        durationSeconds: ep.play_time ?? null,

        tags: ep.tags ?? [],

        platformMetadata: {
          views: ep.total_views ?? null,

          movieType: ep.movie_type ?? null,

          publicType: ep.public_type ?? null,

          game: ep.game?.title ?? null,
        },
      }))
    ),

    meta: {
      cachedAt: new Date().toISOString(),

      episodeCount: episodes.length,
    },

    // raw: {
    //   site,
    // },
  };
}

async function fetchOpenrecEpisodes(channelId: string) {
  const episodes: any[] = [];

  let page = 1;

  while (true) {
    const url =
      `https://public.openrec.tv/external/api/v5/search-movies` +
      `?channel_ids=${channelId}` +
      `&include_live=true` +
      `&include_upload=true` +
      `&onair_status=2` +
      `&include_deleted=true` +
      `&sort=published_at` +
      `&page=${page}`;

    const res = await fetch(url);

    const json = await res.json();

    if (!Array.isArray(json) || json.length === 0) {
      break;
    }

    episodes.push(...json);

    page++;
  }

  const filteredEpisodes = episodes.filter((ep) => (ep.play_time ?? 0) >= 600);

  return filteredEpisodes;
}

function extractOpenrecHostName(channelName: string): string[] {
  const match = channelName.match(/^(.+?)(の|と|が|ちゃんの|さんの)/);

  if (!match) {
    return [];
  }

  return [match[1].trim()];
}

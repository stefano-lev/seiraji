import { fetchYoutubeVideoDetails } from './fetchYoutubeVideoDetails';

import { parseYoutubeDuration } from '../utils/parseYoutubeDuration';

import { normalizeEpisodes } from '../utils/normalizeEpisodes';

const API_KEY = process.env.YOUTUBE_API_KEY;

function extractPlaylistId(url: string) {
  const u = new URL(url);

  return u.searchParams.get('list');
}

export async function scrapeYoutubePlaylist(url: string) {
  const playlistId = extractPlaylistId(url);

  if (!playlistId) {
    throw new Error('Invalid playlist URL');
  }

  // PLAYLIST INFO

  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`
  );

  const playlistJson = await playlistRes.json();

  const playlist = playlistJson.items?.[0];

  if (!playlist) {
    throw new Error('Playlist not found');
  }

  // PLAYLIST VIDEOS

  const episodes: any[] = [];

  let nextPageToken = '';

  while (true) {
    console.log(`Fetching playlist page (${nextPageToken || 'FIRST'})`);

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&pageToken=${nextPageToken}&key=${API_KEY}`
    );

    const videosJson = await videosRes.json();

    const items = videosJson.items ?? [];

    episodes.push(...items);

    nextPageToken = videosJson.nextPageToken;

    if (!nextPageToken) {
      break;
    }
  }

  const videoIds = episodes.map((ep) => ep.contentDetails.videoId);

  const videoDetails = await fetchYoutubeVideoDetails(videoIds);

  // CREATE LOOKUP MAP

  const detailsMap = new Map(videoDetails.map((video) => [video.id, video]));

  return {
    id: `youtube:${playlistId}`,

    source: 'imported',

    platform: 'youtube',

    platformId: playlistId,

    url,

    program: {
      title: playlist.snippet.title,

      description: playlist.snippet.description,

      hosts: [playlist.snippet.channelTitle],

      thumbnail: playlist.snippet.thumbnails?.maxres?.url ?? null,
    },

    episodes: normalizeEpisodes(
      episodes.map((ep) => {
        const videoId = ep.contentDetails.videoId;

        const details = detailsMap.get(videoId);

        const isoDuration = details?.contentDetails?.duration ?? null;

        return {
          id: `youtube:${videoId}`,

          title: ep.snippet.title,

          description: details?.snippet?.description ?? '',

          publishedAt: ep.contentDetails.videoPublishedAt,

          publishedAtUnix: Math.floor(
            new Date(ep.contentDetails.videoPublishedAt).getTime() / 1000
          ),

          thumbnail: ep.snippet.thumbnails?.high?.url ?? null,

          durationSeconds: isoDuration
            ? parseYoutubeDuration(isoDuration)
            : null,

          duration: {
            raw: isoDuration,

            seconds: isoDuration ? parseYoutubeDuration(isoDuration) : null,
          },

          tags: details?.snippet?.tags ?? [],
        };
      })
    ),

    meta: {
      cachedAt: new Date().toISOString(),

      episodeCount: episodes.length,
    },
  };
}

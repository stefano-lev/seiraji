import { XMLParser } from "fast-xml-parser";

export async function scrapeYouTubePlaylist(url: string) {
  const playlistId = extractPlaylistId(url);

  if (!playlistId) {
    throw new Error("Invalid YouTube playlist URL");
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;

  const res = await fetch(feedUrl);
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const data = parser.parse(xml);

  const entries =
    data.feed?.entry || [];

  const videos = entries.map((entry: any) => ({
    title: entry.title,
    videoId: entry["yt:videoId"],
    published: entry.published,
    link: entry.link?.["@_href"],
  }));

  return {
    playlistId,
    count: videos.length,
    videos,
  };
}

function extractPlaylistId(url: string) {
  try {
    const u = new URL(url);
    return u.searchParams.get("list");
  } catch {
    return null;
  }
}
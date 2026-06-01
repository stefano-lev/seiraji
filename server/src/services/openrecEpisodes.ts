export async function fetchOpenrecEpisodes(channelId: string) {
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
